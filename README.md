# Bunches Direct Website

Multi-page website for **Bunches Direct** with secure Stripe card checkout.

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Create your environment files:

```bash
cp .env.example .env
touch .env.local
```

3. Put real secrets in `.env.local` and keep `.env` as the committed template:

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
AVAILABILITY_ADMIN_PASSWORD=change_this_to_a_strong_password
AVAILABILITY_ADMIN_PATH=/family-availability-admin-4f8d2e
AVAILABILITY_PDF_MAX_BYTES=8388608
```

` .env ` is safe to commit. ` .env.local ` is ignored by git and should hold the real secrets.

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
- If SMTP is fully configured (`SMTP_USER` + real `SMTP_PASS`), the order is sent via SMTP.
- If SMTP is not configured, the server falls back to the same `formsubmit.co` action used by the `Get in Touch` form in `contact.html`.
- Recipient priority is:
	1. `ORDER_TO_EMAIL` (if set)
	2. The email used in the `Get in Touch` form action in `contact.html`
	3. `SMTP_USER`
- If `ORDER_EXCEL_TEMPLATE` points to an existing workbook, it is used as a base template. The server refreshes the `Products` and `Delivery Details` sheets with the latest order data.

## Daily availability PDF (no GitHub needed)

The availability flow now uses a separate secret admin URL:

- Clients open `availability.html` and automatically see the latest PDF.
- Family admin uploads from a private URL that is not linked publicly.
- Uploaded file is stored on the server at `assets/availability/latest-availability.pdf`.

### One-time setup

1. Set `AVAILABILITY_ADMIN_PASSWORD` in `.env.local`.
2. Set `AVAILABILITY_ADMIN_PATH` in `.env.local` to a hard-to-guess path.
3. Restart the server (`npm start`).

Your private admin URL will be:

- `https://your-domain.com<AVAILABILITY_ADMIN_PATH>`

Example:

- `https://your-domain.com/family-availability-admin-4f8d2e`

If your hosting/proxy only forwards `/api/*` requests to Node, use this fallback URL instead:

- `https://your-domain.com/api/availability/admin-page`

### Daily update steps for your dad

1. Open the private admin URL.
2. Enter the admin password.
3. Choose the new PDF and click **Upload Today's PDF**.
4. Public `availability.html` updates automatically for all clients.
