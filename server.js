const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const Stripe = require("stripe");
const nodemailer = require("nodemailer");
const ExcelJS = require("exceljs");

dotenv.config();

const app = express();
const staticDir = __dirname;
const port = Number(process.env.PORT) || 4242;
const frontendUrl = process.env.FRONTEND_URL || `http://localhost:${port}`;
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

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

    // Build Excel workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Bunches Direct";
    workbook.created = new Date();

    // Sheet 1 – Products
    const productSheet = workbook.addWorksheet("Products");
    productSheet.columns = [
      { header: "Rose Name",   key: "roseName",   width: 28 },
      { header: "Box Type",    key: "boxType",    width: 18 },
      { header: "Stem Length", key: "stemLength", width: 16 },
      { header: "Quantity",    key: "quantity",   width: 12 }
    ];
    productSheet.getRow(1).font = { bold: true };
    cartItems.forEach((item) => {
      productSheet.addRow({
        roseName:   String(item.roseName   || ""),
        boxType:    String(item.boxType    || ""),
        stemLength: item.stemLength ? `${item.stemLength} cm` : "",
        quantity:   Number(item.quantity)  || 1
      });
    });

    // Sheet 2 – Delivery Details
    const deliverySheet = workbook.addWorksheet("Delivery Details");
    deliverySheet.columns = [
      { header: "Field", key: "field", width: 30 },
      { header: "Value", key: "value", width: 40 }
    ];
    deliverySheet.getRow(1).font = { bold: true };
    const fields = [
      ["Company Name",                deliveryDetails.companyName],
      ["Tax / VAT #",                 deliveryDetails.taxVat],
      ["Delivery Address",            deliveryDetails.deliveryAddress],
      ["Phone",                       deliveryDetails.phone],
      ["Contact Person",              deliveryDetails.contactPerson],
      ["Truck Company in Aalsmeer",   deliveryDetails.truckCompany],
      ["Delivery Date",               deliveryDetails.deliveryDate]
    ];
    fields.forEach(([field, value]) => {
      deliverySheet.addRow({ field, value: String(value || "") });
    });

    // Write workbook to buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Send email
    const smtpUser   = process.env.SMTP_USER   || "";
    const smtpPass   = process.env.SMTP_PASS   || "";
    const orderEmail = process.env.ORDER_TO_EMAIL || smtpUser;

    if (!smtpUser || !smtpPass) {
      return res.status(500).json({ error: "Email is not configured on the server." });
    }

    const transporter = nodemailer.createTransport({
      host:   process.env.SMTP_HOST   || "smtp.gmail.com",
      port:   Number(process.env.SMTP_PORT)  || 465,
      secure: process.env.SMTP_SECURE !== "false",
      auth: { user: smtpUser, pass: smtpPass }
    });

    const dateStr = new Date().toLocaleDateString("en-GB");
    const company = String(deliveryDetails.companyName || "Unknown company");

    await transporter.sendMail({
      from:    `"Bunches Direct Orders" <${smtpUser}>`,
      to:      orderEmail,
      subject: `New Order – ${company} – ${dateStr}`,
      text:    `A new order has been placed by ${company}.\n\nDelivery date: ${deliveryDetails.deliveryDate || "—"}\n\nSee the attached Excel file for full details.`,
      attachments: [{
        filename:    `order-${company.replace(/\s+/g, "-")}-${Date.now()}.xlsx`,
        content:     buffer,
        contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      }]
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
