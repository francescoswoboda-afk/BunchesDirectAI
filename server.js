const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
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

    deliveryDetails.taxVat = String(deliveryDetails.taxVat || "").trim();

    const workbook = await buildOrderWorkbook({
      templatePath: orderTemplatePath,
      cartItems,
      deliveryDetails
    });

    // Write workbook to buffer
    const buffer = await workbook.xlsx.writeBuffer();

    const dateStr = new Date().toLocaleDateString("en-GB");
    const company = String(deliveryDetails.companyName || "Unknown company");
    const subject = `New Order - ${company} - ${dateStr}`;
    const text = `A new order has been placed by ${company}.\n\nDelivery date: ${deliveryDetails.deliveryDate || "-"}\n\nSee the attached Excel file for full details.`;
    const safeCompanyForFilename = company.replace(/\s+/g, "-") || "company";
    const attachmentFilename = `order-${safeCompanyForFilename}-${Date.now()}.xlsx`;
    const mailer = getMailer();
    if (!mailer) {
      return res.status(500).json({
        error: "Email is not configured on the server. Set BREVO_API_KEY (or SMTP_USER and SMTP_PASS)."
      });
    }

    await mailer.send({
      to: orderEmail,
      replyTo: isValidEmail(deliveryDetails.companyEmail) ? deliveryDetails.companyEmail : undefined,
      subject,
      text,
      attachments: [{
        filename: attachmentFilename,
        content: buffer,
        contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      }]
    });

    await sendClientConfirmationEmail({
      mailer,
      clientEmail: deliveryDetails.companyEmail,
      orderEmail,
      company,
      cartItems,
      deliveryDetails
    });

    return res.json({ ok: true });
  } catch (err) {
    console.error("Order email failed:", err);
    return res.status(500).json({ error: describeEmailError(err, "Failed to place order.") });
  }
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
    bcc: orderEmail,
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

// Table-based layout with inline styles so it renders the same in Gmail, Outlook and Apple Mail.
// The color-scheme meta tags ask mail apps not to auto-darken it (that is what turned the old
// version dark grey with a pink header).
function buildClientConfirmationHtml({ company, cartItems, deliveryDetails, orderEmail }) {
  const red = "#b5070d";
  const ink = "#1f1414";
  const muted = "#7a6a6c";
  const line = "#f1e1e4";
  const blush = "#fff6f8";
  const serif = "Georgia,'Times New Roman',serif";
  const sans = "'Helvetica Neue',Helvetica,Arial,sans-serif";

  const greetingName = escapeHtml(String(deliveryDetails.contactPerson || deliveryDetails.companyName || company || "there"));
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

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light only">
  <title>Order confirmation</title>
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
              <p style="margin:0 0 8px;font-family:${sans};font-size:12px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:${red};">Order received</p>
              <h1 style="margin:0 0 14px;font-family:${serif};font-size:30px;line-height:1.2;font-weight:normal;color:${ink};">Thank you, ${greetingName}</h1>
              <p style="margin:0;font-family:${sans};font-size:15px;line-height:1.65;color:${ink};">We have received your order and will review it shortly. We'll confirm availability and get back to you with our best offer.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${blush};border-radius:12px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0 0 4px;font-family:${sans};font-size:12px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:${muted};">Requested delivery</p>
                    <p style="margin:0;font-family:${serif};font-size:21px;color:${red};">${deliveryDate}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:30px 32px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding-bottom:6px;border-bottom:1px solid ${ink};font-family:${serif};font-size:20px;color:${ink};">Your roses</td>
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
              <p style="margin:0 0 18px;font-family:${sans};font-size:14px;line-height:1.65;color:${ink};">Need to change something? Just reply to this email or write to <a href="mailto:${safeOrderEmail}" style="color:${red};text-decoration:underline;">${safeOrderEmail}</a>.</p>
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
