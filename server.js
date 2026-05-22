const fs = require("fs");
const path = require("path");
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

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;
const rosePrices = buildRosePriceMap(path.join(__dirname, "script.js"));

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.static(staticDir));

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

    const vatValidation = await validateVatNumber(deliveryDetails.taxVat);
    if (!vatValidation.valid) {
      return res.status(400).json({ error: vatValidation.message });
    }

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
    const smtpUser = String(process.env.SMTP_USER || "").trim();
    const smtpPass = String(process.env.SMTP_PASS || "").trim();
    if (!smtpUser || !smtpPass || smtpPass.toLowerCase().includes("your_app_password")) {
      return res.status(500).json({
        error: "SMTP is not configured. Set SMTP_USER and SMTP_PASS in .env."
      });
    }

    const transporter = createSmtpTransport({
      smtpUser,
      smtpPass,
      smtpHost: String(process.env.SMTP_HOST || "smtp.gmail.com").trim(),
      smtpPort: Number(process.env.SMTP_PORT) || 465,
      smtpSecure: String(process.env.SMTP_SECURE || "true") !== "false"
    });

    await sendOrderViaSmtp({
      transporter,
      smtpUser,
      to: orderEmail,
      subject,
      text,
      fileName: attachmentFilename,
      fileBuffer: buffer,
      replyTo: isValidEmail(deliveryDetails.companyEmail) ? deliveryDetails.companyEmail : undefined
    });

    await sendClientConfirmationEmail({
      transporter,
      smtpUser,
      clientEmail: deliveryDetails.companyEmail,
      orderEmail,
      company,
      cartItems,
      deliveryDetails
    });

    return res.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to place order.";
    return res.status(500).json({ error: message });
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

async function sendOrderViaSmtp({
  transporter,
  smtpUser,
  to,
  subject,
  text,
  fileName,
  fileBuffer,
  replyTo
}) {
  await transporter.sendMail({
    from: `"Bunches Direct Orders" <${smtpUser}>`,
    to,
    replyTo,
    subject,
    text,
    attachments: [{
      filename: fileName,
      content: fileBuffer,
      contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    }]
  });
}

async function sendClientConfirmationEmail({
  transporter,
  smtpUser,
  clientEmail,
  orderEmail,
  company,
  cartItems,
  deliveryDetails
}) {
  const subject = `Bunches Direct order confirmation for ${company}`;
  const text = buildClientConfirmationText({
    company,
    cartItems,
    deliveryDetails,
    orderEmail
  });
  const html = buildClientConfirmationHtml({
    company,
    cartItems,
    deliveryDetails,
    orderEmail
  });

  await transporter.sendMail({
    from: `"Bunches Direct Orders" <${smtpUser}>`,
    to: clientEmail,
    bcc: orderEmail,
    replyTo: orderEmail,
    subject,
    text,
    html
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
    `Delivery Date: ${String(deliveryDetails.deliveryDate || "-")}`,
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

function buildClientConfirmationHtml({ company, cartItems, deliveryDetails, orderEmail }) {
  const greetingCompany = escapeHtml(String(deliveryDetails.companyName || company || "Customer"));
  const rows = cartItems.map((item) => {
    const roseName = escapeHtml(String(item.roseName || "Rose"));
    const boxType = escapeHtml(String(item.boxType || "Box"));
    const stemLength = item.stemLength ? `${escapeHtml(String(item.stemLength))} cm` : "-";
    const quantity = escapeHtml(String(Number(item.quantity) || 1));

    return `
      <tr>
        <td style="padding:10px 12px;border:1px solid #d7ded6;">${roseName}</td>
        <td style="padding:10px 12px;border:1px solid #d7ded6;">${boxType}</td>
        <td style="padding:10px 12px;border:1px solid #d7ded6;">${stemLength}</td>
        <td style="padding:10px 12px;border:1px solid #d7ded6;">${quantity}</td>
      </tr>`;
  }).join("");

  const detailRows = [
    ["Company Name", deliveryDetails.companyName],
    ["Company Email", deliveryDetails.companyEmail],
    ["Tax / VAT #", deliveryDetails.taxVat],
    ["Delivery Address", deliveryDetails.deliveryAddress],
    ["Phone", deliveryDetails.phone],
    ["Contact Person", deliveryDetails.contactPerson],
    ["Truck Company in Aalsmeer", deliveryDetails.truckCompany],
    ["Delivery Date", deliveryDetails.deliveryDate]
  ].map(([label, value]) => `
      <tr>
        <td style="padding:10px 14px;border-bottom:1px solid #eadfcb;color:#8d0308;font-weight:700;">${escapeHtml(String(label))}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #eadfcb;color:#240303;">${escapeHtml(String(value || "-"))}</td>
      </tr>`).join("");

  return `
    <div style="margin:0;padding:28px;background:#f6eee1;font-family:Arial, sans-serif;color:#240303;">
      <div style="max-width:720px;margin:0 auto;background:#fffdf9;border:1px solid rgba(53,2,1,0.16);box-shadow:0 10px 24px rgba(0,0,0,0.08);">
        <div style="padding:0;background:linear-gradient(135deg,#8d0308 0%,#350201 100%);">
          <div style="padding:22px 32px 18px;border-bottom:1px solid rgba(255,255,255,0.16);">
            <p style="margin:0 0 6px;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#f6eee1;">Bunches Direct</p>
            <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:34px;line-height:1.05;font-weight:700;color:#ffffff;">Order confirmation</h1>
          </div>
          <div style="padding:14px 32px 18px;">
            <p style="margin:0;font-size:14px;line-height:1.6;color:#f3ddd5;">Premium roses imported at origin and delivered across Europe with freshness, consistency and care.</p>
          </div>
        </div>
        <div style="padding:28px 32px;">
          <p style="margin:0 0 10px;font-size:13px;letter-spacing:0.12em;text-transform:uppercase;color:#c01f21;font-weight:700;">Thank you for your order</p>
          <p style="margin:0 0 14px;font-family:Georgia,'Times New Roman',serif;font-size:27px;line-height:1.15;color:#350201;">Greetings ${greetingCompany},</p>
          <p style="margin:0 0 18px;font-size:16px;line-height:1.7;color:#240303;">We have received your request and will review it shortly. Below is a summary of the roses and delivery details you submitted.</p>

          <h2 style="margin:30px 0 12px;font-family:Georgia,'Times New Roman',serif;font-size:24px;color:#8d0308;">Order summary</h2>
          <table style="width:100%;border-collapse:collapse;font-size:15px;background:#fff8f6;">
            <thead>
              <tr style="background:#8d0308;">
                <th style="padding:11px 12px;border:1px solid #d6b7ab;text-align:left;color:#ffffff;">Rose Name</th>
                <th style="padding:11px 12px;border:1px solid #d6b7ab;text-align:left;color:#ffffff;">Box Type</th>
                <th style="padding:11px 12px;border:1px solid #d6b7ab;text-align:left;color:#ffffff;">Stem Length</th>
                <th style="padding:11px 12px;border:1px solid #d6b7ab;text-align:left;color:#ffffff;">Quantity</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>

          <h2 style="margin:30px 0 12px;font-family:Georgia,'Times New Roman',serif;font-size:24px;color:#8d0308;">Submitted details</h2>
          <table style="width:100%;border-collapse:collapse;font-size:15px;background:#fffdf9;border:1px solid #eadfcb;">${detailRows}</table>

          <div style="margin:28px 0 0;padding:18px 20px;background:#f9f2ea;border-left:4px solid #c01f21;">
            <p style="margin:0;font-size:15px;line-height:1.7;color:#240303;">If anything needs to be changed, simply reply to <a href="mailto:${escapeHtml(orderEmail)}" style="color:#8d0308;text-decoration:underline;">${escapeHtml(orderEmail)}</a>.</p>
          </div>

          <p style="margin:26px 0 0;font-size:15px;line-height:1.7;color:#240303;">Kind regards,<br><span style="font-family:Georgia,'Times New Roman',serif;font-size:20px;color:#350201;">Bunches Direct</span></p>
        </div>
      </div>
    </div>`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
