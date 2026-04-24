const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const Stripe = require("stripe");

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
