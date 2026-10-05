const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const vm = require("vm");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const Stripe = require("stripe");
const ExcelJS = require("exceljs");
const nodemailer = require("nodemailer");

dotenv.config();
dotenv.config({ path: path.join(__dirname, ".env.local"), override: true });

const app = express();
const staticDir = __dirname;
const port = Number(process.env.PORT) || 4242;
const frontendUrl = process.env.FRONTEND_URL || `http://localhost:${port}`;
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const contactEmailFromForm = resolveContactFormEmail(path.join(__dirname, "contact.html"));
const defaultOrderEmail = "es@bunches-direct.com";
const orderEmail = (process.env.ORDER_TO_EMAIL || contactEmailFromForm || defaultOrderEmail).trim();
const viesCheckVatUrl = "https://ec.europa.eu/taxation_customs/vies/rest-api/check-vat-number";
const orderTemplatePath = process.env.ORDER_EXCEL_TEMPLATE
  ? path.resolve(__dirname, process.env.ORDER_EXCEL_TEMPLATE)
  : "";
const availabilityAdminPassword = String(process.env.AVAILABILITY_ADMIN_PASSWORD || "").trim();
const availabilityDirectory = process.env.AVAILABILITY_DATA_DIR
  ? path.resolve(process.env.AVAILABILITY_DATA_DIR)
  : path.join(staticDir, "assets", "availability");
const availabilityFileName = "latest-availability.pdf";
const availabilityFilePath = path.join(availabilityDirectory, availabilityFileName);
const availabilityPublicUrl = `/assets/availability/${availabilityFileName}`;
const maxAvailabilityPdfBytes = Number(process.env.AVAILABILITY_PDF_MAX_BYTES) || 8 * 1024 * 1024;
const availabilityAdminPath = normalizeAdminPath(process.env.AVAILABILITY_ADMIN_PATH || "/family-availability-admin");

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;
const rosePrices = buildRosePriceMap(path.join(__dirname, "script.js"));

ensureAvailabilitySeedFile();

app.use(cors());
app.use(express.json({ limit: "20mb" }));
// The homepage (index.html) is retained on disk, but the public site now
// permanently starts at the products page.
// HTML pages are sent with a version number on the site's code files (e.g. script.js?v=1696...),
// taken from each file's last change. Every deploy then gives browsers new addresses, so no phone
// can keep using an old cached copy of the scripts, styles or rose list.
const VERSIONED_ASSETS = ["script.js", "styles.css", "products-data.js", "assets/fonts.css"];
function sendVersionedHtml(res, fileName) {
  const filePath = path.join(__dirname, fileName);
  let html;
  try {
    html = fs.readFileSync(filePath, "utf8");
  } catch {
    return res.status(404).end();
  }
  for (const asset of VERSIONED_ASSETS) {
    let version = "";
    try {
      version = String(Math.round(fs.statSync(path.join(__dirname, asset)).mtimeMs));
    } catch {
      continue;
    }
    const escaped = asset.replace(/[.]/g, "\\.");
    html = html.replace(new RegExp(`((?:src|href)=")(/?${escaped})(")`, "g"), `$1$2?v=${version}$3`);
  }
  res.setHeader("Cache-Control", "no-cache");
  res.type("html");
  return res.send(html);
}

// The products page is the home page, served at the clean address "/".
// Old addresses redirect there permanently so search engines update their links.
app.get("/", (_req, res) => {
  return sendVersionedHtml(res, "products.html");
});
app.get(["/index.html", "/products.html"], (req, res) => {
  const query = req.originalUrl.includes("?") ? req.originalUrl.slice(req.originalUrl.indexOf("?")) : "";
  return res.redirect(301, `/${query}`);
});
app.get(availabilityAdminPath, (_req, res) => {
  return res.sendFile(path.join(__dirname, "availability-upload-8k2m.html"));
});
app.get("/api/availability/admin-page", (_req, res) => {
  return res.sendFile(path.join(__dirname, "availability-upload-8k2m.html"));
});
// Served explicitly (instead of via express.static) so the PDF still works
// when it lives outside the app folder, e.g. on a mounted persistent volume.
app.get(availabilityPublicUrl, (_req, res) => {
  if (!fs.existsSync(availabilityFilePath)) {
    return res.status(404).end();
  }

  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  return res.sendFile(availabilityFilePath);
});
app.get(/^\/[\w-]+\.html$/, (req, res, next) => {
  const fileName = req.path.slice(1);
  if (!fs.existsSync(path.join(__dirname, fileName))) {
    return next();
  }
  return sendVersionedHtml(res, fileName);
});
app.use(express.static(staticDir, {
  maxAge: 0,
  setHeaders: (res, filePath) => {
    const relativePath = path.relative(staticDir, filePath).replace(/\\/g, "/");

    // Images/fonts rarely change filenames, so cache them aggressively for speed.
    if (/\.(?:avif|webp|png|jpe?g|svg|gif|ico|woff2?|ttf)$/i.test(relativePath)) {
      res.setHeader("Cache-Control", "public, max-age=2592000, immutable");
    } else if (/\.(?:css|js)$/i.test(relativePath)) {
      // CSS/JS can change on every deploy without a filename change, so always
      // revalidate with the server (fast 304s) instead of caching them for a month.
      res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
    }
  }
}));

app.get("/api/availability", (_req, res) => {
  return res.json(getAvailabilityResponse());
});

app.post("/api/availability/upload", (req, res) => {
  try {
    if (!availabilityAdminPassword) {
      return res.status(500).json({
        error: "Availability admin password is not configured on the server."
      });
    }

    const adminPassword = String(req.body?.adminPassword || "");
    const fileDataBase64 = String(req.body?.fileDataBase64 || "").trim();

    if (!isValidAdminPassword(adminPassword)) {
      return res.status(401).json({ error: "Invalid admin password." });
    }

    if (!fileDataBase64) {
      return res.status(400).json({ error: "Missing PDF file data." });
    }

    const pdfBuffer = decodeAvailabilityPdf(fileDataBase64);
    if (!pdfBuffer) {
      return res.status(400).json({ error: "Uploaded file is not a valid PDF." });
    }

    if (pdfBuffer.length > maxAvailabilityPdfBytes) {
      const maxMb = Math.round(maxAvailabilityPdfBytes / (1024 * 1024));
      return res.status(413).json({
        error: `PDF is too large. Maximum size is ${maxMb} MB.`
      });
    }

    fs.mkdirSync(availabilityDirectory, { recursive: true });
    fs.writeFileSync(availabilityFilePath, pdfBuffer);

    return res.json(getAvailabilityResponse());
  } catch {
    return res.status(500).json({
      error: "Could not save the availability PDF. Please try again."
    });
  }
});

app.post("/api/create-checkout-session", async (req, res) => {
  if (!stripe) {
    return res.status(500).json({
      error: "Stripe is not configured. Add STRIPE_SECRET_KEY to your environment."
    });
  }

  try {
    const lineItems = buildStripeLineItems(req.body.cartItems, rosePrices);
    const requestOrigin = req.get("origin") || frontendUrl;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: lineItems,
      success_url: `${requestOrigin}/payment.html?status=success`,
      cancel_url: `${requestOrigin}/payment.html?status=cancelled`,
      billing_address_collection: "required"
    });

    return res.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to start payment.";
    return res.status(400).json({ error: message });
  }
});

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/place-order", async (req, res) => {
  try {
    const { cartItems, deliveryDetails } = req.body;

    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({ error: "No products in order." });
    }
    if (!deliveryDetails || typeof deliveryDetails !== "object") {
      return res.status(400).json({ error: "Missing delivery details." });
    }
    if (!isValidEmail(deliveryDetails.companyEmail)) {
      return res.status(400).json({ error: "A valid client email is required to place the order." });
    }
    if (deliveryDetails.privacyConsent !== true || deliveryDetails.termsConsent !== true) {
      return res.status(400).json({
        error: "You must accept the Privacy Policy and Terms & Conditions to place an order."
      });
    }

    const mailer = getMailer();
    if (!mailer) {
      return res.status(500).json({
        error: "Email is not configured on the server. Set BREVO_API_KEY (or SMTP_USER and SMTP_PASS)."
      });
    }

    // The order is saved so the links in the emails can open it later (accept / change / client answer)
    const order = createOrderRecord({
      cartItems: sanitizeOrderItems(cartItems, { strict: false }),
      deliveryDetails: sanitizeDeliveryDetails(deliveryDetails)
    });
    if (order.cartItems.length === 0) {
      return res.status(400).json({ error: "No products in order." });
    }
    writeOrder(order);

    // The office gets the client's copy plus the "Accept order" / "Change or cancel" buttons and the Excel file
    await sendAdminNewOrderEmail(mailer, order);
    await sendClientConfirmationEmail({
      mailer,
      clientEmail: order.deliveryDetails.companyEmail,
      orderEmail,
      company: order.deliveryDetails.companyName || "Unknown company",
      cartItems: order.cartItems,
      deliveryDetails: order.deliveryDetails
    });

    return res.json({ ok: true });
  } catch (err) {
    console.error("Order email failed:", err);
    return res.status(500).json({ error: describeEmailError(err, "Failed to place order.") });
  }
});

// ----- Order review -----
// Each saved order has two secret links: one for the office (in the "new order" email) and one for the
// client (in the "changes to your order" email). The pages order-review.html and order-response.html
// read the order through GET /api/orders/:id and act on it with the POST routes below.
//   pending          -> office accepts                       -> accepted
//   pending          -> office changes it, sends to client   -> awaiting_client
//   awaiting_client  -> client accepts the changes           -> accepted
//   awaiting_client  -> client declines                      -> cancelled
// The office can also cancel a pending order (or one waiting for the client) outright.
app.get("/api/orders/:id", (req, res) => {
  const order = readOrder(req.params.id);
  const role = order ? getOrderRole(order, req.query.token) : "";
  if (!role) {
    return res.status(404).json({ error: "This order link is not valid." });
  }
  return res.json(buildOrderView(order, role));
});

app.post("/api/orders/:id/accept", (req, res) => {
  return handleOrderAction(req, res, "admin", ["pending"], async (order, mailer) => {
    await sendClientAcceptedEmail(mailer, order);
    order.status = "accepted";
    addOrderHistory(order, "Accepted by Bunches Direct");
  });
});

app.post("/api/orders/:id/propose", (req, res) => {
  return handleOrderAction(req, res, "admin", ["pending", "awaiting_client"], async (order, mailer) => {
    const items = sanitizeOrderItems(req.body?.cartItems, { strict: true });
    const deliveryDate = String(req.body?.deliveryDate || "").trim();
    const note = String(req.body?.note || "").trim().slice(0, 2000);

    if (!items) {
      throw orderInputError("Choose a box type and stem length for every rose.");
    }
    if (items.length === 0) {
      throw orderInputError("Add at least one rose to the order.");
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(deliveryDate)) {
      throw orderInputError("Choose a delivery date.");
    }

    const proposal = { cartItems: items, deliveryDate, note, sentAt: new Date().toISOString() };
    if (describeOrderChanges(order, proposal).length === 0 && !note) {
      throw orderInputError("Nothing was changed. Use \"Accept order\" to accept it as it is.");
    }

    order.proposal = proposal;
    await sendClientProposalEmail(mailer, order);
    order.status = "awaiting_client";
    addOrderHistory(order, "Changes sent to the client");
  });
});

app.post("/api/orders/:id/cancel", (req, res) => {
  return handleOrderAction(req, res, "admin", ["pending", "awaiting_client"], async (order, mailer) => {
    await sendClientCancelledEmail(mailer, order, "office");
    order.status = "cancelled";
    addOrderHistory(order, "Cancelled by Bunches Direct");
  });
});

app.post("/api/orders/:id/respond", (req, res) => {
  return handleOrderAction(req, res, "client", ["awaiting_client"], async (order, mailer) => {
    const decision = String(req.body?.decision || "");
    if (decision === "accept") {
      order.cartItems = order.proposal.cartItems;
      order.deliveryDetails.deliveryDate = order.proposal.deliveryDate;
      await sendClientAcceptedEmail(mailer, order);
      await sendAdminClientAnswerEmail(mailer, order, true);
      order.status = "accepted";
      addOrderHistory(order, "Client accepted the changes");
    } else if (decision === "decline") {
      await sendClientCancelledEmail(mailer, order, "client");
      await sendAdminClientAnswerEmail(mailer, order, false);
      order.status = "cancelled";
      addOrderHistory(order, "Client declined the changes");
    } else {
      throw orderInputError("Unknown answer.");
    }
  });
});

// Email health check, called once a week by a GitHub workflow (.github/workflows/email-keepalive.yml).
// It makes a harmless "who am I" call to Brevo (no email is sent): that keeps the API key from
// expiring after 90 days without use, and the workflow fails (and GitHub emails the owner) if the
// key stops working. The result is cached for an hour so the URL can't be used to flood Brevo.
let emailHealthCache = { at: 0, status: 0, body: null };
app.get("/api/email-health", async (_req, res) => {
  if (Date.now() - emailHealthCache.at < 60 * 60 * 1000 && emailHealthCache.body) {
    return res.status(emailHealthCache.status).json(emailHealthCache.body);
  }

  const brevoKey = String(process.env.BREVO_API_KEY || "").trim();
  let status = 200;
  let body;
  if (!brevoKey) {
    status = 503;
    body = { ok: false, provider: getMailer() ? "smtp" : "none", error: "BREVO_API_KEY is not set" };
  } else {
    try {
      const response = await fetch("https://api.brevo.com/v3/account", {
        headers: { "api-key": brevoKey, accept: "application/json" },
        signal: AbortSignal.timeout(15000)
      });
      if (response.ok) {
        body = { ok: true, provider: "brevo" };
      } else {
        status = 502;
        body = { ok: false, provider: "brevo", error: `Brevo answered ${response.status}` };
      }
    } catch (error) {
      status = 502;
      body = { ok: false, provider: "brevo", error: "Could not reach Brevo" };
    }
  }

  emailHealthCache = { at: Date.now(), status, body };
  return res.status(status).json(body);
});

// Contact form ("Get in Touch"): sent through the same mailer as orders.
// "website" is a hidden field people never see; bots that fill it in are quietly ignored.
const contactRateLimit = new Map();
app.post("/api/contact", async (req, res) => {
  try {
    const { companyName, companyEmail, companyPhone, message, privacyConsent, website } = req.body || {};
    if (website) {
      return res.json({ ok: true });
    }

    const ip = String(req.headers["fly-client-ip"] || req.ip || "");
    const now = Date.now();
    const recent = (contactRateLimit.get(ip) || []).filter((time) => now - time < 10 * 60 * 1000);
    if (recent.length >= 5) {
      return res.status(429).json({ error: "Too many messages in a short time. Please try again in a few minutes." });
    }

    if (!String(companyName || "").trim() || !isValidEmail(companyEmail) || !String(message || "").trim()) {
      return res.status(400).json({ error: "Please fill in your company name, a valid email and a message." });
    }
    if (privacyConsent !== true) {
      return res.status(400).json({ error: "Please confirm you have read the Privacy Policy and Terms & Conditions." });
    }

    const mailer = getMailer();
    if (!mailer) {
      return res.status(503).json({ error: "Email is not configured on the server.", code: "EMAIL_NOT_CONFIGURED" });
    }

    const clean = (value, max) => String(value || "").trim().slice(0, max);
    const name = clean(companyName, 200);
    const text = [
      `New contact request from the Bunches Direct website`,
      ``,
      `Company: ${name}`,
      `Email: ${clean(companyEmail, 200)}`,
      `Phone / WhatsApp: ${clean(companyPhone, 60) || "-"}`,
      ``,
      `Message:`,
      clean(message, 5000)
    ].join("\n");

    await mailer.send({
      to: orderEmail,
      replyTo: clean(companyEmail, 200),
      subject: `New contact request - ${name}`,
      text
    });

    recent.push(now);
    contactRateLimit.set(ip, recent);
    return res.json({ ok: true });
  } catch (err) {
    console.error("Contact email failed:", err);
    return res.status(500).json({ error: describeEmailError(err, "Could not send your message.") });
  }
});

app.listen(port, () => {
  console.log(`Bunches Direct server running on http://localhost:${port}`);
});

// ----- Saved orders -----
// One JSON file per order. On Fly this folder is on the persistent volume (ORDERS_DATA_DIR in fly.toml).
// The local default starts with a dot so express.static never serves it.
const ordersDirectory = process.env.ORDERS_DATA_DIR
  ? path.resolve(process.env.ORDERS_DATA_DIR)
  : path.join(__dirname, ".orders");
const BOX_TYPES = ["Q-Box", "H-Box"];
const STEM_LENGTHS = [40, 50, 60, 70];
const productCatalog = loadProductCatalog(path.join(__dirname, "products-data.js"));
const busyOrderIds = new Set();

function loadProductCatalog(filePath) {
  const catalog = new Map();
  try {
    const sandbox = { window: {} };
    vm.runInNewContext(fs.readFileSync(filePath, "utf8"), sandbox, { timeout: 1000 });
    for (const product of sandbox.window.BUNCHES_PRODUCTS || []) {
      if (product && product.name) {
        catalog.set(String(product.name).trim(), { image: String(product.image || "") });
      }
    }
  } catch (error) {
    console.error("Could not read products-data.js:", error);
  }
  return catalog;
}

// strict: every line must use a real box type and stem length (used for the office's edited order)
function sanitizeOrderItems(rawItems, { strict }) {
  if (!Array.isArray(rawItems)) {
    return strict ? null : [];
  }

  const items = [];
  for (const raw of rawItems.slice(0, 200)) {
    const roseName = String(raw?.roseName || "").trim().slice(0, 120);
    const boxType = String(raw?.boxType || "").trim().slice(0, 40);
    const stemLength = Number(raw?.stemLength) || 0;
    if (!roseName || (strict && (!BOX_TYPES.includes(boxType) || !STEM_LENGTHS.includes(stemLength)))) {
      if (strict) {
        return null;
      }
      continue;
    }
    items.push({
      roseName,
      boxType,
      stemLength,
      quantity: Math.max(1, Math.min(500, Math.floor(Number(raw?.quantity) || 1))),
      image: productCatalog.get(roseName)?.image || ""
    });
  }
  return items;
}

function sanitizeDeliveryDetails(raw) {
  const fields = ["companyName", "companyEmail", "taxVat", "deliveryAddress", "phone", "contactPerson", "truckCompany", "deliveryDate"];
  const details = {};
  for (const field of fields) {
    details[field] = String(raw?.[field] || "").trim().slice(0, 300);
  }
  return details;
}

function createOrderRecord({ cartItems, deliveryDetails }) {
  const now = new Date().toISOString();
  return {
    id: `${now.slice(0, 10).replace(/-/g, "")}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`,
    adminToken: crypto.randomBytes(24).toString("hex"),
    clientToken: crypto.randomBytes(24).toString("hex"),
    status: "pending",
    createdAt: now,
    updatedAt: now,
    cartItems,
    deliveryDetails,
    proposal: null,
    history: [{ at: now, event: "Order placed" }]
  };
}

function orderFilePath(id) {
  return /^[A-Z0-9-]{6,40}$/i.test(String(id || "")) ? path.join(ordersDirectory, `${id}.json`) : "";
}

function readOrder(id) {
  const filePath = orderFilePath(id);
  if (!filePath || !fs.existsSync(filePath)) {
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

// Written to a temporary file first so a crash can never leave half an order on disk
function writeOrder(order) {
  fs.mkdirSync(ordersDirectory, { recursive: true });
  const filePath = orderFilePath(order.id);
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(order, null, 2));
  fs.renameSync(tempPath, filePath);
}

function addOrderHistory(order, event) {
  order.updatedAt = new Date().toISOString();
  order.history.push({ at: order.updatedAt, event });
}

function getOrderRole(order, token) {
  const received = Buffer.from(String(token || ""), "utf8");
  const matches = (expected) => {
    const expectedBuffer = Buffer.from(String(expected || ""), "utf8");
    return expectedBuffer.length > 0 && expectedBuffer.length === received.length && crypto.timingSafeEqual(expectedBuffer, received);
  };
  if (matches(order.adminToken)) {
    return "admin";
  }
  if (matches(order.clientToken)) {
    return "client";
  }
  return "";
}

// What the review pages get to see (never the tokens)
function buildOrderView(order, role) {
  return {
    id: order.id,
    role,
    status: order.status,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    cartItems: order.cartItems,
    deliveryDetails: order.deliveryDetails,
    proposal: order.proposal
      ? { ...order.proposal, changes: describeOrderChanges(order, order.proposal) }
      : null
  };
}

function orderInputError(message) {
  const error = new Error(message);
  error.isOrderInputError = true;
  return error;
}

const ORDER_STATUS_MESSAGES = {
  pending: "This order is still waiting for a decision.",
  accepted: "This order has already been accepted.",
  awaiting_client: "The changes were sent to the client. This order is waiting for their answer.",
  cancelled: "This order has been cancelled."
};

// Shared steps for every order action: check the link, check the order can still do this,
// run the action (which sends its emails), then save. One action per order at a time, so a
// double click can't send the same email twice. If an email fails, nothing is saved and the
// button can simply be pressed again.
async function handleOrderAction(req, res, role, allowedStatuses, action) {
  const order = readOrder(req.params.id);
  if (!order || getOrderRole(order, req.body?.token) !== role) {
    return res.status(404).json({ error: "This order link is not valid." });
  }
  if (!allowedStatuses.includes(order.status)) {
    return res.status(409).json({ error: ORDER_STATUS_MESSAGES[order.status] || "This order can't be changed any more.", order: buildOrderView(order, role) });
  }
  if (busyOrderIds.has(order.id)) {
    return res.status(409).json({ error: "This order is being updated right now. Please wait a moment." });
  }

  const mailer = getMailer();
  if (!mailer) {
    return res.status(500).json({ error: "Email is not configured on the server." });
  }

  busyOrderIds.add(order.id);
  try {
    await action(order, mailer);
    writeOrder(order);
    return res.json({ ok: true, order: buildOrderView(order, role) });
  } catch (error) {
    if (error && error.isOrderInputError) {
      return res.status(400).json({ error: error.message });
    }
    console.error(`Order ${order.id} action failed:`, error);
    return res.status(500).json({ error: describeEmailError(error, "Could not update the order.") });
  } finally {
    busyOrderIds.delete(order.id);
  }
}

// Plain-language list of what the office changed, shown to the client in the email and on the page
function describeOrderChanges(order, proposal) {
  const keyOf = (item) => `${item.roseName}|${item.boxType}|${item.stemLength}`;
  const labelOf = (item) => [item.roseName, item.boxType, item.stemLength ? `${item.stemLength} cm` : ""].filter(Boolean).join(", ");
  const boxes = (quantity) => `${quantity} ${quantity === 1 ? "box" : "boxes"}`;
  const totals = (items) => {
    const map = new Map();
    for (const item of items) {
      const entry = map.get(keyOf(item)) || { item, quantity: 0 };
      entry.quantity += Number(item.quantity) || 0;
      map.set(keyOf(item), entry);
    }
    return map;
  };

  const before = totals(order.cartItems);
  const after = totals(proposal.cartItems);
  const changes = [];

  for (const [key, { item, quantity }] of before) {
    const updated = after.get(key);
    if (!updated) {
      changes.push(`Removed: ${labelOf(item)} (${boxes(quantity)})`);
    } else if (updated.quantity !== quantity) {
      changes.push(`${labelOf(item)}: ${boxes(quantity)} → ${boxes(updated.quantity)}`);
    }
  }
  for (const [key, { item, quantity }] of after) {
    if (!before.has(key)) {
      changes.push(`Added: ${labelOf(item)} (${boxes(quantity)})`);
    }
  }
  if (proposal.deliveryDate !== order.deliveryDetails.deliveryDate) {
    changes.push(`Delivery date: ${formatDeliveryDate(order.deliveryDetails.deliveryDate)} → ${formatDeliveryDate(proposal.deliveryDate)}`);
  }
  return changes;
}

function buildRosePriceMap(scriptPath) {
  const source = fs.readFileSync(scriptPath, "utf8");
  const regex = /name:\s*"([^"]+)"[\s\S]*?price:\s*([0-9]+(?:\.[0-9]+)?)/g;
  const prices = new Map();

  let match = regex.exec(source);
  while (match) {
    const roseName = match[1].trim();
    const price = Number(match[2]);

    if (roseName && Number.isFinite(price) && !prices.has(roseName)) {
      prices.set(roseName, price);
    }

    match = regex.exec(source);
  }

  return prices;
}

function buildStripeLineItems(cartItems, prices) {
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    throw new Error("Your cart is empty.");
  }

  return cartItems.map((item) => {
    const roseName = typeof item.roseName === "string" ? item.roseName.trim() : "";
    const quantity = Math.max(1, Math.min(500, Math.floor(Number(item.quantity) || 0)));

    if (!roseName || !prices.has(roseName)) {
      throw new Error(`Unknown product in cart: ${roseName || "Unnamed rose"}.`);
    }

    const unitPrice = prices.get(roseName);
    const unitAmountCents = Math.round(unitPrice * 100);
    const boxType = typeof item.boxType === "string" ? item.boxType.trim() : "Box";
    const stemLength = Number(item.stemLength) || 0;

    return {
      quantity,
      price_data: {
        currency: "eur",
        unit_amount: unitAmountCents,
        product_data: {
          name: roseName,
          description: `${boxType}${stemLength ? `, ${stemLength} cm` : ""}`
        }
      }
    };
  });
}

async function buildOrderWorkbook({ templatePath, cartItems, deliveryDetails }) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Bunches Direct";
  workbook.created = new Date();

  if (templatePath && fs.existsSync(templatePath)) {
    await workbook.xlsx.readFile(templatePath);
  }

  const productSheet = getOrCreateSheet(workbook, "Products");
  productSheet.columns = [
    { header: "Rose Name", key: "roseName", width: 28 },
    { header: "Box Type", key: "boxType", width: 18 },
    { header: "Stem Length", key: "stemLength", width: 16 },
    { header: "Quantity", key: "quantity", width: 12 }
  ];
  clearSheetRows(productSheet, 1);

  appendClientDetailsToProductSheet(productSheet, deliveryDetails);
  productSheet.addRow([]);
  productSheet.addRow(["Rose Name", "Box Type", "Stem Length", "Quantity"]);
  productSheet.getRow(productSheet.rowCount).font = { bold: true };
  cartItems.forEach((item) => {
    productSheet.addRow({
      roseName: String(item.roseName || ""),
      boxType: String(item.boxType || ""),
      stemLength: item.stemLength ? `${item.stemLength} cm` : "",
      quantity: Number(item.quantity) || 1
    });
  });

  const deliverySheet = getOrCreateSheet(workbook, "Delivery Details");
  deliverySheet.columns = [
    { header: "Field", key: "field", width: 30 },
    { header: "Value", key: "value", width: 40 }
  ];
  deliverySheet.getRow(1).font = { bold: true };
  clearSheetRows(deliverySheet, 2);

  const fields = [
    ["Company Name", deliveryDetails.companyName],
    ["Company Email", deliveryDetails.companyEmail],
    ["Tax / VAT #", deliveryDetails.taxVat],
    ["Delivery Address", deliveryDetails.deliveryAddress],
    ["Phone", deliveryDetails.phone],
    ["Contact Person", deliveryDetails.contactPerson],
    ["Truck Company in Aalsmeer", deliveryDetails.truckCompany],
    ["Delivery Date", deliveryDetails.deliveryDate]
  ];

  fields.forEach(([field, value]) => {
    deliverySheet.addRow({ field, value: String(value || "") });
  });

  return workbook;
}

function getOrCreateSheet(workbook, name) {
  return workbook.getWorksheet(name) || workbook.addWorksheet(name);
}

function clearSheetRows(sheet, startRowNumber) {
  const rowsToRemove = sheet.rowCount - startRowNumber + 1;
  if (rowsToRemove > 0) {
    sheet.spliceRows(startRowNumber, rowsToRemove);
  }
}

function appendClientDetailsToProductSheet(sheet, deliveryDetails) {
  const clientFields = [
    ["Company Name", deliveryDetails.companyName],
    ["Company Email", deliveryDetails.companyEmail],
    ["Tax / VAT #", deliveryDetails.taxVat],
    ["Delivery Address", deliveryDetails.deliveryAddress],
    ["Phone", deliveryDetails.phone],
    ["Contact Person", deliveryDetails.contactPerson],
    ["Truck Company in Aalsmeer", deliveryDetails.truckCompany],
    ["Delivery Date", deliveryDetails.deliveryDate]
  ];

  sheet.addRow(["Client Details"]);
  sheet.getRow(sheet.rowCount).font = { bold: true };
  sheet.addRow(["Field", "Value"]);
  sheet.getRow(sheet.rowCount).font = { bold: true };

  clientFields.forEach(([field, value]) => {
    sheet.addRow([field, String(value || "")]);
  });
}

function resolveContactFormEmail(contactPath) {
  try {
    const action = resolveContactFormAction(contactPath);
    if (!action) {
      return "";
    }

    const actionMatch = action.match(/https?:\/\/formsubmit\.co\/([^"'\s>]+)/i);
    if (!actionMatch || !actionMatch[1]) {
      return "";
    }

    const decoded = decodeURIComponent(actionMatch[1]).trim();
    return /^\S+@\S+\.\S+$/.test(decoded) ? decoded : "";
  } catch {
    return "";
  }
}

function resolveContactFormAction(contactPath) {
  try {
    const html = fs.readFileSync(contactPath, "utf8");
    const actionMatch = html.match(/action\s*=\s*["'](https?:\/\/formsubmit\.co\/[^"'\s>]+)["']/i);
    if (!actionMatch || !actionMatch[1]) {
      return "";
    }

    return actionMatch[1].trim();
  } catch {
    return "";
  }
}

async function validateVatNumber(rawVatNumber) {
  const normalized = normalizeVatNumber(rawVatNumber);
  if (!normalized) {
    return {
      valid: false,
      message: "A valid Tax / VAT number is required to place the order."
    };
  }

  const countryCode = normalized.slice(0, 2);
  const vatNumber = normalized.slice(2);
  if (!isSupportedViesCountry(countryCode) || !vatNumber) {
    return {
      valid: false,
      message: "Enter a valid EU VAT number including country code, for example NL123456789B01."
    };
  }

  try {
    const response = await fetch(viesCheckVatUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({
        countryCode,
        vatNumber
      }),
      signal: AbortSignal.timeout(15000)
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const apiMessage = extractViesErrorMessage(payload);
      return {
        valid: false,
        message: apiMessage || "Unable to validate the VAT number right now. Please try again."
      };
    }

    if (!payload || payload.valid !== true) {
      return {
        valid: false,
        message: "The VAT number could not be verified. Please check it and try again."
      };
    }

    return {
      valid: true,
      normalizedVatNumber: `${countryCode}${vatNumber}`
    };
  } catch {
    return {
      valid: false,
      message: "VAT verification is temporarily unavailable. Please try again in a moment."
    };
  }
}

function normalizeVatNumber(rawVatNumber) {
  const compact = String(rawVatNumber || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

  if (!compact) {
    return "";
  }

  if (compact.startsWith("GR")) {
    return `EL${compact.slice(2)}`;
  }

  return compact;
}

function isSupportedViesCountry(countryCode) {
  return new Set([
    "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR",
    "DE", "EL", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL",
    "PL", "PT", "RO", "SK", "SI", "ES", "SE", "XI"
  ]).has(countryCode);
}

function extractViesErrorMessage(payload) {
  const wrappers = Array.isArray(payload?.errorWrappers) ? payload.errorWrappers : [];
  const messages = wrappers
    .map((item) => String(item?.message || "").trim())
    .filter(Boolean);

  if (messages.length > 0) {
    return messages[0];
  }

  return "";
}

// ----- Sending email -----
// Uses Brevo (an email-sending service) when BREVO_API_KEY is set: an API key doesn't expire when a
// Gmail password changes. Without it, falls back to SMTP (Gmail App Password) as before.
// Every email goes through mailer.send({ to, bcc, replyTo, subject, text, html, attachments }).
const EMAIL_FROM = String(process.env.EMAIL_FROM || "orders@bunches-direct.com").trim();
const EMAIL_FROM_NAME = String(process.env.EMAIL_FROM_NAME || "Bunches Direct").trim();
const PUBLIC_SITE_URL = String(process.env.PUBLIC_SITE_URL || "https://bunches-direct.com").replace(/\/+$/, "");

function getMailer() {
  const brevoKey = String(process.env.BREVO_API_KEY || "").trim();
  if (brevoKey) {
    return { provider: "brevo", send: (message) => sendViaBrevo(brevoKey, message) };
  }

  const smtpUser = String(process.env.SMTP_USER || "").trim();
  const smtpPass = String(process.env.SMTP_PASS || "").trim();
  if (smtpUser && smtpPass && !smtpPass.toLowerCase().includes("your_app_password")) {
    const transporter = createSmtpTransport({
      smtpUser,
      smtpPass,
      smtpHost: String(process.env.SMTP_HOST || "smtp.gmail.com").trim(),
      smtpPort: Number(process.env.SMTP_PORT) || 465,
      smtpSecure: String(process.env.SMTP_SECURE || "true") !== "false"
    });
    return {
      provider: "smtp",
      send: (message) => transporter.sendMail({
        from: `"${EMAIL_FROM_NAME}" <${smtpUser}>`,
        to: message.to,
        bcc: message.bcc,
        replyTo: message.replyTo,
        subject: message.subject,
        text: message.text,
        html: message.html,
        attachments: (message.attachments || []).map((file) => ({
          filename: file.filename,
          content: file.content,
          path: file.path,
          contentType: file.contentType,
          cid: file.cid
        }))
      })
    };
  }

  return null;
}

async function sendViaBrevo(apiKey, message) {
  const toList = (value) => (value ? [].concat(value).map((email) => ({ email })) : undefined);

  // Brevo can't embed images by content-id, so the logo is linked from the website instead
  let html = message.html;
  const attachments = [];
  for (const file of message.attachments || []) {
    if (file.cid) {
      html = html && html.split(`cid:${file.cid}`).join(`${PUBLIC_SITE_URL}/assets/email-logo.png`);
      continue;
    }
    const content = file.content ? Buffer.from(file.content) : fs.readFileSync(file.path);
    attachments.push({ name: file.filename, content: content.toString("base64") });
  }

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": apiKey, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      sender: { name: EMAIL_FROM_NAME, email: EMAIL_FROM },
      to: toList(message.to),
      bcc: toList(message.bcc),
      replyTo: message.replyTo ? { email: message.replyTo } : undefined,
      subject: message.subject,
      textContent: message.text,
      htmlContent: html,
      attachment: attachments.length ? attachments : undefined
    }),
    signal: AbortSignal.timeout(20000)
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const error = new Error(body.message || `Brevo returned ${response.status}`);
    error.provider = "brevo";
    error.status = response.status;
    throw error;
  }
}

// Turns a sending failure into a message that says what to fix
function describeEmailError(error, fallback) {
  if (error && error.provider === "brevo") {
    if (error.status === 401) {
      return "The email service rejected the API key. Check BREVO_API_KEY on the server.";
    }
    if (/sender/i.test(error.message)) {
      return `The email service doesn't accept ${EMAIL_FROM} as sender yet. Verify the domain in Brevo.`;
    }
    return `The email service could not send the email (${error.message}).`;
  }
  if (isSmtpAuthError(error)) {
    return "SMTP login failed. Check SMTP_USER and generate a fresh Gmail App Password for SMTP_PASS.";
  }
  return error instanceof Error ? error.message : fallback;
}

function isSmtpAuthError(error) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const maybeCode = String(error.code || "").toUpperCase();
  const maybeResponseCode = String(error.responseCode || "");
  const maybeMessage = String(error.message || "").toLowerCase();
  return (
    maybeCode === "EAUTH" ||
    maybeResponseCode === "535" ||
    maybeMessage.includes("username and password not accepted") ||
    maybeMessage.includes("badcredentials")
  );
}

function createSmtpTransport({
  smtpUser,
  smtpPass,
  smtpHost,
  smtpPort,
  smtpSecure
}) {
  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: smtpUser,
      pass: smtpPass
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000
  });
}

async function sendClientConfirmationEmail({
  mailer,
  clientEmail,
  orderEmail,
  company,
  cartItems,
  deliveryDetails
}) {
  await mailer.send({
    to: clientEmail,
    replyTo: orderEmail,
    subject: `Bunches Direct order confirmation for ${company}`,
    text: buildClientConfirmationText({ company, cartItems, deliveryDetails, orderEmail }),
    html: buildClientConfirmationHtml({ company, cartItems, deliveryDetails, orderEmail }),
    attachments: [{
      filename: "bunches-direct-logo.png",
      path: path.join(__dirname, "assets", "email-logo.png"),
      cid: EMAIL_LOGO_CID
    }]
  });
}

function buildClientConfirmationText({ company, cartItems, deliveryDetails, orderEmail }) {
  const greetingCompany = String(deliveryDetails.companyName || company || "Customer");
  const orderLines = cartItems.map((item) => {
    const roseName = String(item.roseName || "Rose");
    const boxType = String(item.boxType || "Box");
    const stemLength = item.stemLength ? `, ${item.stemLength} cm` : "";
    const quantity = Number(item.quantity) || 1;
    return `- ${roseName} | ${boxType}${stemLength} | Quantity: ${quantity}`;
  });

  return [
    `Greetings ${greetingCompany},`,
    "",
    "Thank you for your order with Bunches Direct.",
    "We have received your request and will review it shortly.",
    "",
    "Order summary:",
    ...orderLines,
    "",
    `Company Name: ${String(deliveryDetails.companyName || "-")}`,
    `Company Email: ${String(deliveryDetails.companyEmail || "-")}`,
    `Tax / VAT #: ${String(deliveryDetails.taxVat || "-")}`,
    `Delivery Address: ${String(deliveryDetails.deliveryAddress || "-")}`,
    `Phone: ${String(deliveryDetails.phone || "-")}`,
    `Contact Person: ${String(deliveryDetails.contactPerson || "-")}`,
    `Truck Company in Aalsmeer: ${String(deliveryDetails.truckCompany || "-")}`,
    `Delivery Date: ${formatDeliveryDate(deliveryDetails.deliveryDate)}`,
    "",
    `If anything needs to be changed, reply to ${orderEmail}.`,
    "",
    "Kind regards,",
    "Bunches Direct"
  ].join("\n");
}

function isValidEmail(value) {
  return /^\S+@\S+\.\S+$/.test(String(value || "").trim());
}

const EMAIL_LOGO_CID = "bunches-direct-logo";

// "2026-10-15" -> "Thursday 15 October 2026". Parsed as UTC so the server's timezone can't shift the day.
function formatDeliveryDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || "").trim());
  if (!match) {
    return String(value || "-");
  }
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC"
  });
}

function buildClientConfirmationHtml({ company, cartItems, deliveryDetails, orderEmail }) {
  const greetingName = String(deliveryDetails.contactPerson || deliveryDetails.companyName || company || "there");
  return renderOrderEmail({
    title: "Order confirmation",
    eyebrow: "Order received",
    heading: `Thank you, ${greetingName}`,
    intro: "We have received your order and will review it shortly. We'll confirm availability and get back to you with our best offer.",
    dateLabel: "Requested delivery",
    cartItems,
    deliveryDetails,
    orderEmail
  });
}

const EMAIL_RED = "#b5070d";
const EMAIL_INK = "#1f1414";
const EMAIL_MUTED = "#7a6a6c";
const EMAIL_LINE = "#f1e1e4";
const EMAIL_BLUSH = "#fff6f8";
const EMAIL_SERIF = "Georgia,'Times New Roman',serif";
const EMAIL_SANS = "'Helvetica Neue',Helvetica,Arial,sans-serif";

// Every order email shares this layout. Table-based with inline styles so it renders the same in Gmail,
// Outlook and Apple Mail. The color-scheme meta tags ask mail apps not to auto-darken it (that is what
// turned an old version dark grey with a pink header). Optional parts: buttons, note, changes.
function renderOrderEmail({
  title,
  eyebrow,
  heading,
  intro,
  dateLabel,
  cartItems,
  deliveryDetails,
  orderEmail,
  itemsTitle = "Your roses",
  buttons = [],
  note = "",
  noteTitle = "Message from Bunches Direct",
  changes = [],
  closing
}) {
  const red = EMAIL_RED;
  const ink = EMAIL_INK;
  const muted = EMAIL_MUTED;
  const line = EMAIL_LINE;
  const blush = EMAIL_BLUSH;
  const serif = EMAIL_SERIF;
  const sans = EMAIL_SANS;

  const deliveryDate = escapeHtml(formatDeliveryDate(deliveryDetails.deliveryDate));
  const safeOrderEmail = escapeHtml(orderEmail);
  const totalBoxes = cartItems.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);

  const rows = cartItems.map((item) => {
    const roseName = escapeHtml(String(item.roseName || "Rose"));
    const boxType = escapeHtml(String(item.boxType || "Box"));
    const stemLength = item.stemLength ? `${escapeHtml(String(item.stemLength))} cm` : "";
    const quantity = escapeHtml(String(Number(item.quantity) || 1));
    const meta = [boxType, stemLength].filter(Boolean).join(" &middot; ");

    return `
            <tr>
              <td style="padding:14px 0;border-bottom:1px solid ${line};">
                <div style="font-family:${serif};font-size:18px;color:${ink};">${roseName}</div>
                <div style="font-family:${sans};font-size:13px;color:${muted};padding-top:2px;">${meta}</div>
              </td>
              <td align="right" style="padding:14px 0;border-bottom:1px solid ${line};font-family:${sans};font-size:15px;font-weight:700;color:${ink};white-space:nowrap;">&times; ${quantity}</td>
            </tr>`;
  }).join("");

  const detailRows = [
    ["Company", deliveryDetails.companyName],
    ["Contact person", deliveryDetails.contactPerson],
    ["Email", deliveryDetails.companyEmail],
    ["Phone", deliveryDetails.phone],
    ["Tax / VAT #", deliveryDetails.taxVat],
    ["Delivery address", deliveryDetails.deliveryAddress],
    ["Truck company in Aalsmeer", deliveryDetails.truckCompany]
  ].map(([label, value]) => `
            <tr>
              <td valign="top" style="padding:9px 16px 9px 0;font-family:${sans};font-size:13px;color:${muted};width:42%;">${escapeHtml(label)}</td>
              <td valign="top" style="padding:9px 0;font-family:${sans};font-size:14px;color:${ink};">${escapeHtml(String(value || "-"))}</td>
            </tr>`).join("");

  // Buttons: the first is solid red, the others outlined. Each sits in its own cell so they wrap on phones.
  const buttonsHtml = buttons.length === 0 ? "" : `
          <tr>
            <td style="padding:26px 32px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>${buttons.map((button, index) => {
                  const solid = index === 0;
                  return `
                  <td style="padding:0 10px 10px 0;">
                    <a href="${escapeHtml(button.url)}" style="display:inline-block;padding:14px 26px;border:2px solid ${red};border-radius:999px;background:${solid ? red : "#ffffff"};font-family:${sans};font-size:15px;font-weight:700;color:${solid ? "#ffffff" : red};text-decoration:none;">${escapeHtml(button.label)}</a>
                  </td>`;
                }).join("")}
                </tr>
              </table>
            </td>
          </tr>`;

  const noteHtml = !note ? "" : `
          <tr>
            <td style="padding:24px 32px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-left:3px solid ${red};background:${blush};">
                <tr>
                  <td style="padding:14px 18px;">
                    <p style="margin:0 0 6px;font-family:${sans};font-size:12px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:${muted};">${escapeHtml(noteTitle)}</p>
                    <p style="margin:0;font-family:${sans};font-size:15px;line-height:1.6;color:${ink};">${escapeHtml(note).replace(/\n/g, "<br>")}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`;

  const changesHtml = changes.length === 0 ? "" : `
          <tr>
            <td style="padding:30px 32px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding-bottom:6px;border-bottom:1px solid ${ink};font-family:${serif};font-size:20px;color:${ink};">What changed</td>
                </tr>${changes.map((change) => `
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid ${line};font-family:${sans};font-size:14px;color:${ink};">${escapeHtml(change)}</td>
                </tr>`).join("")}
              </table>
            </td>
          </tr>`;

  const closingHtml = closing === undefined
    ? `Need to change something? Just reply to this email or write to <a href="mailto:${safeOrderEmail}" style="color:${red};text-decoration:underline;">${safeOrderEmail}</a>.`
    : escapeHtml(closing);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light only">
  <title>${escapeHtml(title)}</title>
  <style>:root { color-scheme: light only; supported-color-schemes: light only; }</style>
</head>
<body style="margin:0;padding:0;background:${blush};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${blush};">
    <tr>
      <td align="center" style="padding:32px 14px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border:1px solid ${line};border-radius:16px;">
          <tr>
            <td align="center" style="padding:30px 32px 22px;border-bottom:3px solid ${red};border-radius:16px 16px 0 0;">
              <img src="cid:${EMAIL_LOGO_CID}" width="180" alt="Bunches Direct" style="display:block;width:180px;max-width:60%;height:auto;border:0;">
            </td>
          </tr>
          <tr>
            <td style="padding:32px 32px 8px;">
              <p style="margin:0 0 8px;font-family:${sans};font-size:12px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:${red};">${escapeHtml(eyebrow)}</p>
              <h1 style="margin:0 0 14px;font-family:${serif};font-size:30px;line-height:1.2;font-weight:normal;color:${ink};">${escapeHtml(heading)}</h1>
              <p style="margin:0;font-family:${sans};font-size:15px;line-height:1.65;color:${ink};">${escapeHtml(intro)}</p>
            </td>
          </tr>${buttonsHtml}${noteHtml}
          <tr>
            <td style="padding:24px 32px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${blush};border-radius:12px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0 0 4px;font-family:${sans};font-size:12px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:${muted};">${escapeHtml(dateLabel)}</p>
                    <p style="margin:0;font-family:${serif};font-size:21px;color:${red};">${deliveryDate}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>${changesHtml}
          <tr>
            <td style="padding:30px 32px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding-bottom:6px;border-bottom:1px solid ${ink};font-family:${serif};font-size:20px;color:${ink};">${escapeHtml(itemsTitle)}</td>
                  <td align="right" style="padding-bottom:6px;border-bottom:1px solid ${ink};font-family:${sans};font-size:13px;color:${muted};">${totalBoxes} ${totalBoxes === 1 ? "box" : "boxes"}</td>
                </tr>${rows}
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:30px 32px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td colspan="2" style="padding-bottom:6px;border-bottom:1px solid ${ink};font-family:${serif};font-size:20px;color:${ink};">Delivery details</td>
                </tr>
                <tr><td colspan="2" style="height:6px;line-height:6px;font-size:0;">&nbsp;</td></tr>${detailRows}
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:30px 32px 32px;">
              <p style="margin:0 0 18px;font-family:${sans};font-size:14px;line-height:1.65;color:${ink};">${closingHtml}</p>
              <p style="margin:0;font-family:${sans};font-size:14px;line-height:1.5;color:${ink};">Kind regards,<br><span style="font-family:${serif};font-size:19px;color:${red};">Bunches Direct</span></p>
            </td>
          </tr>
        </table>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">
          <tr>
            <td align="center" style="padding:18px 20px 0;font-family:${sans};font-size:12px;line-height:1.6;color:${muted};">
              Premium roses from Ecuador, delivered across Europe.<br>
              <a href="https://bunches-direct.com" style="color:${muted};text-decoration:underline;">bunches-direct.com</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// Plain-text twin of renderOrderEmail, for mail apps that don't show HTML
function renderOrderEmailText({ greeting, intro, dateLabel, cartItems, deliveryDetails, links = [], note = "", changes = [], closing }) {
  const lines = [greeting, "", intro, ""];
  for (const link of links) {
    lines.push(`${link.label}: ${link.url}`);
  }
  if (links.length) {
    lines.push("");
  }
  if (note) {
    lines.push("Message from Bunches Direct:", note, "");
  }
  if (changes.length) {
    lines.push("What changed:", ...changes.map((change) => `- ${change}`), "");
  }
  lines.push(`${dateLabel}: ${formatDeliveryDate(deliveryDetails.deliveryDate)}`, "", "Roses:");
  for (const item of cartItems) {
    const stemLength = item.stemLength ? `, ${item.stemLength} cm` : "";
    lines.push(`- ${item.roseName} | ${item.boxType || "Box"}${stemLength} | Quantity: ${Number(item.quantity) || 1}`);
  }
  lines.push(
    "",
    `Company: ${deliveryDetails.companyName || "-"}`,
    `Contact person: ${deliveryDetails.contactPerson || "-"}`,
    `Email: ${deliveryDetails.companyEmail || "-"}`,
    `Phone: ${deliveryDetails.phone || "-"}`,
    `Tax / VAT #: ${deliveryDetails.taxVat || "-"}`,
    `Delivery address: ${deliveryDetails.deliveryAddress || "-"}`,
    `Truck company in Aalsmeer: ${deliveryDetails.truckCompany || "-"}`,
    ""
  );
  if (closing) {
    lines.push(closing, "");
  }
  lines.push("Kind regards,", "Bunches Direct");
  return lines.join("\n");
}

function emailLogoAttachment() {
  return {
    filename: "bunches-direct-logo.png",
    path: path.join(__dirname, "assets", "email-logo.png"),
    cid: EMAIL_LOGO_CID
  };
}

async function buildOrderExcelAttachment(order) {
  const workbook = await buildOrderWorkbook({
    templatePath: orderTemplatePath,
    cartItems: order.cartItems,
    deliveryDetails: order.deliveryDetails
  });
  const company = (order.deliveryDetails.companyName || "company").replace(/[^\w-]+/g, "-");
  return {
    filename: `order-${company}-${order.id}.xlsx`,
    content: await workbook.xlsx.writeBuffer(),
    contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  };
}

function orderPageUrl(page, order, token, params = {}) {
  const query = new URLSearchParams({ id: order.id, token, ...params });
  return `${PUBLIC_SITE_URL}/${page}?${query.toString()}`;
}

function clientGreetingName(order) {
  return order.deliveryDetails.contactPerson || order.deliveryDetails.companyName || "there";
}

// To the office: the client's order with "Accept order" and "Change or cancel" buttons, plus the Excel file
async function sendAdminNewOrderEmail(mailer, order) {
  const company = order.deliveryDetails.companyName || "Unknown company";
  const intro = "A new pre-order has come in. Accept it as it is, or change it and send the new version back to the client.";
  const buttons = [
    { label: "Accept order", url: orderPageUrl("order-review.html", order, order.adminToken, { mode: "accept" }) },
    { label: "Change or cancel", url: orderPageUrl("order-review.html", order, order.adminToken, { mode: "edit" }) }
  ];
  const content = { cartItems: order.cartItems, deliveryDetails: order.deliveryDetails, dateLabel: "Requested delivery" };

  await mailer.send({
    to: orderEmail,
    replyTo: isValidEmail(order.deliveryDetails.companyEmail) ? order.deliveryDetails.companyEmail : undefined,
    subject: `New order - ${company} - ${new Date().toLocaleDateString("en-GB")}`,
    text: renderOrderEmailText({ ...content, greeting: `New order from ${company}`, intro, links: buttons }),
    html: renderOrderEmail({
      ...content,
      title: "New order",
      eyebrow: `New order · ${order.id}`,
      heading: company,
      intro,
      itemsTitle: "Roses ordered",
      buttons,
      orderEmail,
      closing: "Replying to this email writes straight to the client. The Excel file with the order is attached."
    }),
    attachments: [emailLogoAttachment(), await buildOrderExcelAttachment(order)]
  });
}

// To the client: the order (original, or the changed one they agreed to) is accepted
async function sendClientAcceptedEmail(mailer, order) {
  const intro = "Good news: we have accepted your order and it is now being processed. We'll be in touch about delivery.";
  const content = { cartItems: order.cartItems, deliveryDetails: order.deliveryDetails, dateLabel: "Delivery" };
  await mailer.send({
    to: order.deliveryDetails.companyEmail,
    replyTo: orderEmail,
    subject: `Your Bunches Direct order has been accepted`,
    text: renderOrderEmailText({ ...content, greeting: `Hello ${clientGreetingName(order)},`, intro, closing: `Questions? Reply to ${orderEmail}.` }),
    html: renderOrderEmail({
      ...content,
      title: "Order accepted",
      eyebrow: "Order accepted",
      heading: "Your order is confirmed",
      intro,
      orderEmail,
      closing: undefined
    }),
    attachments: [emailLogoAttachment()]
  });
}

// To the client: the office changed the order; they can accept the new version or decline it
async function sendClientProposalEmail(mailer, order) {
  const proposal = order.proposal;
  const intro = "We've reviewed your order and suggest a few changes, shown below. Please accept the new version so we can process it, or decline it to cancel the order.";
  const buttons = [
    { label: "Accept changes", url: orderPageUrl("order-response.html", order, order.clientToken, { choice: "accept" }) },
    { label: "Decline", url: orderPageUrl("order-response.html", order, order.clientToken, { choice: "decline" }) }
  ];
  const changes = describeOrderChanges(order, proposal);
  const content = {
    cartItems: proposal.cartItems,
    deliveryDetails: { ...order.deliveryDetails, deliveryDate: proposal.deliveryDate },
    dateLabel: "Proposed delivery",
    note: proposal.note,
    changes
  };

  await mailer.send({
    to: order.deliveryDetails.companyEmail,
    replyTo: orderEmail,
    subject: `Changes to your Bunches Direct order - please confirm`,
    text: renderOrderEmailText({ ...content, greeting: `Hello ${clientGreetingName(order)},`, intro, links: buttons }),
    html: renderOrderEmail({
      ...content,
      title: "Changes to your order",
      eyebrow: "Please confirm",
      heading: "We've updated your order",
      intro,
      itemsTitle: "Your updated order",
      buttons,
      orderEmail
    }),
    attachments: [emailLogoAttachment()]
  });
}

// To the client: the order is cancelled, either by the office or because they declined the changes
async function sendClientCancelledEmail(mailer, order, cancelledBy) {
  const intro = cancelledBy === "client"
    ? "You declined the suggested changes, so your order has been cancelled. You're welcome to place a new order at any time."
    : "Unfortunately we can't fulfil this order, so it has been cancelled. Please get in touch if you'd like to find an alternative.";
  const content = { cartItems: order.cartItems, deliveryDetails: order.deliveryDetails, dateLabel: "Requested delivery" };
  await mailer.send({
    to: order.deliveryDetails.companyEmail,
    replyTo: orderEmail,
    subject: `Your Bunches Direct order has been cancelled`,
    text: renderOrderEmailText({ ...content, greeting: `Hello ${clientGreetingName(order)},`, intro, closing: `Questions? Reply to ${orderEmail}.` }),
    html: renderOrderEmail({
      ...content,
      title: "Order cancelled",
      eyebrow: "Order cancelled",
      heading: "Your order has been cancelled",
      intro,
      itemsTitle: "Cancelled order",
      orderEmail,
      closing: undefined
    }),
    attachments: [emailLogoAttachment()]
  });
}

// To the office: the client answered the changes. Best effort: the client has already been told,
// so a failure here is logged instead of making the client press the button again.
async function sendAdminClientAnswerEmail(mailer, order, accepted) {
  const company = order.deliveryDetails.companyName || "The client";
  const intro = accepted
    ? `${company} accepted your changes. The order is accepted and can be processed. The final order is attached as an Excel file.`
    : `${company} declined your changes, so the order has been cancelled.`;
  const content = { cartItems: accepted ? order.proposal.cartItems : order.cartItems, deliveryDetails: order.deliveryDetails, dateLabel: "Delivery" };

  try {
    await mailer.send({
      to: orderEmail,
      replyTo: isValidEmail(order.deliveryDetails.companyEmail) ? order.deliveryDetails.companyEmail : undefined,
      subject: `${accepted ? "Changes accepted" : "Changes declined"} - ${company} - order ${order.id}`,
      text: renderOrderEmailText({ ...content, greeting: accepted ? "Order accepted" : "Order cancelled", intro }),
      html: renderOrderEmail({
        ...content,
        title: accepted ? "Changes accepted" : "Changes declined",
        eyebrow: `Order ${order.id}`,
        heading: accepted ? "The client accepted your changes" : "The client declined your changes",
        intro,
        itemsTitle: accepted ? "Final order" : "Original order",
        orderEmail,
        closing: "Replying to this email writes straight to the client."
      }),
      attachments: accepted ? [emailLogoAttachment(), await buildOrderExcelAttachment(order)] : [emailLogoAttachment()]
    });
  } catch (error) {
    console.error(`Office notification for order ${order.id} failed:`, error);
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function ensureAvailabilitySeedFile() {
  try {
    fs.mkdirSync(availabilityDirectory, { recursive: true });

    if (fs.existsSync(availabilityFilePath)) {
      return;
    }

    // On first boot against an empty persistent volume, seed it from the
    // copy committed to the repo so availability isn't blank until the next upload.
    const seedPath = path.join(staticDir, "assets", "availability", availabilityFileName);
    if (seedPath !== availabilityFilePath && fs.existsSync(seedPath)) {
      fs.copyFileSync(seedPath, availabilityFilePath);
    }
  } catch {
    // Non-fatal: the availability endpoint will simply report "not available" until an upload succeeds.
  }
}

function getAvailabilityResponse() {
  if (!fs.existsSync(availabilityFilePath)) {
    return {
      available: false,
      url: "",
      updatedAt: 0
    };
  }

  const stats = fs.statSync(availabilityFilePath);
  return {
    available: true,
    url: availabilityPublicUrl,
    updatedAt: stats.mtimeMs
  };
}

function isValidAdminPassword(inputPassword) {
  const expected = Buffer.from(availabilityAdminPassword, "utf8");
  const received = Buffer.from(String(inputPassword || ""), "utf8");

  if (expected.length === 0 || expected.length !== received.length) {
    return false;
  }

  return crypto.timingSafeEqual(expected, received);
}

function decodeAvailabilityPdf(base64Content) {
  const cleanedBase64 = String(base64Content || "").replace(/\s/g, "");

  if (!cleanedBase64 || !/^[A-Za-z0-9+/=]+$/.test(cleanedBase64)) {
    return null;
  }

  const buffer = Buffer.from(cleanedBase64, "base64");
  if (!buffer || buffer.length === 0) {
    return null;
  }

  const pdfSignature = "%PDF-";
  const fileHeader = buffer.subarray(0, 5).toString("utf8");
  if (fileHeader !== pdfSignature) {
    return null;
  }

  return buffer;
}

function normalizeAdminPath(rawPath) {
  const safePath = String(rawPath || "")
    .trim()
    .replace(/[?#].*$/, "")
    .replace(/\s+/g, "-")
    .replace(/\/+/g, "/");

  if (!safePath || safePath === "/") {
    return "/family-availability-admin";
  }

  return safePath.startsWith("/") ? safePath : `/${safePath}`;
}

function buildAvailabilityAdminHtml(adminPath) {
  const safeAdminPath = escapeHtml(adminPath);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex, nofollow">
  <title>Availability Admin | Bunches Direct</title>
  <link rel="stylesheet" href="/assets/fonts.css">
  <link rel="stylesheet" href="/styles.css">
</head>
<body data-page="availability-admin">
  <main>
    <section class="section-pad page-hero">
      <div class="container narrow">
        <p class="eyebrow">Private Family Access</p>
        <h1>Availability Upload Admin</h1>
        <p class="lead">Use this private URL only inside your family team. Keep it unlisted and share carefully.</p>
      </div>
    </section>

    <section class="section-pad alt-bg">
      <div class="container narrow">
        <article class="info-panel availability-viewer-panel">
          <h2 class="section-title">Current Published PDF</h2>
          <p id="availabilityStatus">Loading the latest availability file...</p>
          <div class="availability-document-wrap" id="availabilityDocumentWrap" hidden>
            <iframe id="availabilityFrame" title="Bunches Direct daily rose availability" loading="lazy"></iframe>
            <p class="availability-download-row">
              <a class="btn btn-outline" id="availabilityDownloadLink" href="#" target="_blank" rel="noopener noreferrer">Open / Download PDF</a>
            </p>
          </div>
        </article>
      </div>
    </section>

    <section class="section-pad">
      <div class="container narrow">
        <article class="availability-admin-panel">
          <h2 class="section-title">Upload Today's PDF</h2>
          <form id="availabilityUploadForm" class="availability-upload-form" novalidate>
            <label for="availabilityAdminPassword">Admin Password</label>
            <input id="availabilityAdminPassword" name="adminPassword" type="password" autocomplete="current-password" required>

            <label for="availabilityPdfFile">Availability PDF</label>
            <input id="availabilityPdfFile" name="availabilityPdf" type="file" accept="application/pdf,.pdf" required>

            <button type="submit" class="btn btn-solid" id="availabilityUploadBtn">Upload Today's PDF</button>
            <p id="availabilityUploadMessage" class="availability-upload-message" aria-live="polite"></p>
          </form>
          <p style="margin-top:1rem;font-size:0.92rem;">Private URL: <strong>${safeAdminPath}</strong></p>
        </article>
      </div>
    </section>
  </main>

  <script src="/script.js"></script>
</body>
</html>`;
}
