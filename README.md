# Bunches Direct Website

Multi-page website for **Bunches Direct** with secure Stripe card checkout.

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Create your environment file and add your Stripe secret key:

```bash
cp .env.example .env
```

3. Update `.env`:

```env
STRIPE_SECRET_KEY=sk_test_your_key_here
PORT=4242
FRONTEND_URL=http://localhost:4242
```

4. Start the app:

```bash
npm start
```

5. Open:

- `http://localhost:4242/index.html`

## Payment behavior

- `Credit Card` uses Stripe Checkout (secure hosted payment page).
- `Bank Transfer` keeps a manual confirmation message.
- Cart totals are calculated from product prices and sent to a secure server endpoint before checkout.
