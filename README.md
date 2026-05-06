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
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your_email@example.com
SMTP_PASS=your_app_password
ORDER_TO_EMAIL=
ORDER_EXCEL_TEMPLATE=
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

## Order email + Excel export

- Clicking `Place Order` on `order-details.html` sends delivery form data and selected boxes to `/api/place-order`.
- The server generates an Excel file and emails it as an attachment.
- Recipient priority is:
	1. `ORDER_TO_EMAIL` (if set)
	2. The email used in the `Get in Touch` form action in `contact.html`
	3. `SMTP_USER`
- If `ORDER_EXCEL_TEMPLATE` points to an existing workbook, it is used as a base template. The server refreshes the `Products` and `Delivery Details` sheets with the latest order data.
