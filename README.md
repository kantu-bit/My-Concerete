# MY CONCRETE – Readymix Concrete Unit

Full-stack web platform, 24/7 delivery booking & quote portal, and CMS console for **MY CONCRETE – Readymix Concrete Unit** (Kotihal, serving Ranebennur, Davangere & surrounding Karnataka regions).

---

## 1. Prerequisites

- **Node.js** v22 or newer (uses built-in `node:sqlite`)
- **npm** v10 or newer

Install dependencies:

```bash
npm install
```

---

## 2. Setting Up Your Own Admin Email & Password

This application does **not** ship with any default or hardcoded admin password. On first server start, it reads your owner credentials from `.env` and stores only a bcrypt password hash in SQLite (`data/myconcrete.db`).

### Step-by-step setup

1. Copy `.env.example` to `.env`:

   ```bash
   cp .env.example .env
   ```

2. Open `.env` in an editor and fill in your owner credentials:

   - `ADMIN_EMAIL` — your owner login email (for example, `myconcretektl@gmail.com`)
   - `ADMIN_PASSWORD` — choose your own strong password (at least **8 characters**, containing letters plus at least one number or symbol)
   - `APP_URL` — your site's public base URL (e.g. `http://localhost:3000` locally or your production HTTPS domain)

3. *(Recommended for email reset links & 2FA OTP)* Configure SMTP in `.env`:

   - `SMTP_HOST`
   - `SMTP_PORT` (default `587`)
   - `SMTP_USER`
   - `SMTP_PASS`
   - `SMTP_FROM`
   - `OWNER_ALERT_EMAIL` (set to `myconcretektl@gmail.com`)

   > Note: When SMTP is not configured, reset-link and OTP previews are redacted in the database outbox log so sensitive codes are never leaked. Configure SMTP before using Forgot Password or Email OTP 2FA in production.

4. Start the server:

   ```bash
   npm run dev
   ```

5. Open `/admin/login` in your browser and sign in with the `ADMIN_EMAIL` and `ADMIN_PASSWORD` you set in `.env`.

6. **First-login password change**: Immediately after your initial sign-in, the console requires you to set a new personal password before unlocking the dashboard. Once updated, you can clear `ADMIN_PASSWORD` from `.env` if desired — your hashed password remains safely stored in the database.

---

## 3. Admin Security Features & User Roles

- **Login URL**: `/admin/login`
- **Session security**:
  - Authenticated via `httpOnly` cookie (`mc_admin_session`), backed by server-side session records.
  - **30-minute idle timeout**: Inactive sessions automatically expire after 30 minutes and redirect back to `/admin/login`.
  - **Brute-force protection**: 5 failed password attempts lock login for **15 minutes** per email and IP address.
  - **Audit logging**: Every sign-in, failed attempt, lockout, OTP challenge, password change, reset request, and logout is recorded in `admin_login_logs` and visible to the Owner at `/admin/users`.
- **Forgot Password**: Clicking **Forgot password?** on `/admin/login` sends a time-limited reset link to `myconcretektl@gmail.com`.
- **Two-Factor Authentication (Optional Email OTP)**: Enable or disable 6-digit email OTP verification for your account inside **Staff & Security** (`/admin/users` for Owner, or **Account Security** for Staff).
- **Roles**:
  - **Owner**: Full access to Analytics, Bookings, Quotes & Inbox, Products & Rates, Plant & 24/7 Scheduling Config, Website CMS & Customer Pages, Media Gallery, Customers CSV Export, and Staff Management (`/admin/users`).
  - **Staff**: Restricted access to **Bookings & Dispatch**, **Media Gallery**, and their own **Account Security** (change password / toggle 2FA).
- **Adding / Removing Staff**: Sign in as Owner, open `/admin/users` (or **Staff & Security** in the sidebar), and create Staff or additional Owner accounts with a temporary password (staff are also required to change their temporary password on first login).

---

## 4. How to set up notifications

Every submission across **Book Delivery**, **Get Quote**, **Book Site/Plant Visit**, **Contact / Connect Now**, **Partner With Us**, **Careers**, and **Newsletter** is saved to the database first (`status = New`, unread badge in `/admin`) and then dispatches Email and WhatsApp alerts asynchronously with 3 automatic retries.

Configure your secrets in `.env` (never commit `.env`), then verify live delivery inside **`/admin` → Settings → Notifications → Send test notification**.

### A. Owner Email via Gmail App Password (Recommended)

1. Sign in to the Google Account (`myconcretektl@gmail.com`) at `https://myaccount.google.com/security`.
2. Ensure **2-Step Verification** is turned **ON**.
3. Open **App passwords** (search `"App passwords"` in Google Account search), select app **Mail** (or enter `"MY CONCRETE Website"`), and click **Create**.
4. Copy the 16-character App Password (spaces removed) into `.env`:
   ```env
   NOTIFY_EMAIL="myconcretektl@gmail.com"
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT="465"
   SMTP_USER="myconcretektl@gmail.com"
   SMTP_PASS="your16charapppassword"
   SMTP_FROM="MY CONCRETE Dispatch <myconcretektl@gmail.com>"
   ```
5. *(Alternative: Resend HTTP API)* Instead of SMTP, set `RESEND_API_KEY` and verified sender `RESEND_FROM` in `.env`.

### B. Owner WhatsApp via CallMeBot (Free & Fastest Setup)

1. Save CallMeBot's official WhatsApp bot contact in your phone (`+91 73378 07372`): **`+34 644 71 81 99`** (verify current number at `https://www.callmebot.com/blog/free-api-whatsapp-messages/`).
2. Send this exact WhatsApp message to that bot number from `+91 73378 07372`:
   ```text
   I allow callmebot to send me messages
   ```
3. Wait ~1 minute for the bot reply containing your personal `apikey`.
4. Add to `.env`:
   ```env
   WHATSAPP_PROVIDER="callmebot"
   OWNER_WHATSAPP="917337807372"
   CALLMEBOT_PHONE="917337807372"
   CALLMEBOT_APIKEY="your_callmebot_apikey"
   ```
   *(Optional)* Add a second owner/dispatch manager number via `OWNER_WHATSAPP_2="91XXXXXXXXXX"`. Note that with CallMeBot each receiving phone number must either activate its own bot key or use Cloud API / Twilio.

### C. Owner WhatsApp via Meta WhatsApp Cloud API (Official Business API)

1. Go to `https://developers.facebook.com/` → **My Apps** → **Create App** → choose **Other** → **Business**, then add the **WhatsApp** product.
2. Under **WhatsApp → API Setup**, copy your **Phone Number ID** (`WHATSAPP_PHONE_ID`).
3. Create a **System User** in **Meta Business Settings → System Users**, assign your WhatsApp Business Account with `whatsapp_business_messaging` permission, and generate a **Permanent Access Token** (`WHATSAPP_TOKEN`).
4. Create and approve an **Utility** message template (e.g., `lead_alert` with body `{{1}}`) under **WhatsApp Manager → Message Templates** so outbound notifications work even outside the 24-hour customer service window.
5. Add to `.env`:
   ```env
   WHATSAPP_PROVIDER="cloudapi"
   OWNER_WHATSAPP="917337807372"
   OWNER_WHATSAPP_2=""
   WHATSAPP_PHONE_ID="your_phone_number_id"
   WHATSAPP_TOKEN="your_permanent_access_token"
   WHATSAPP_TEMPLATE_NAME="lead_alert"
   ```

### D. Twilio WhatsApp or Disable Background WhatsApp

- For Twilio: set `WHATSAPP_PROVIDER="twilio"`, `TWILIO_SID`, `TWILIO_TOKEN`, and `TWILIO_FROM="whatsapp:+14155238886"`.
- To skip background WhatsApp silently (still keeping the instant customer 1-tap `wa.me/917337807372` button on every form): set `WHATSAPP_PROVIDER="none"`.

### E. Testing & Monitoring in Admin

- Open `/admin` → **Settings → Notifications** to change `NOTIFY_EMAIL`, `OWNER_WHATSAPP`, `OWNER_WHATSAPP_2`, `WHATSAPP_PROVIDER`, or pause/enable individual channels, and click **Send test notification** to verify live delivery.
- Every booking, quote, visit, enquiry, and newsletter subscriber displays live **Email** and **WhatsApp** delivery status badges (`sent` / `failed` / `skipped`) with a **Resend notification** button and full log in **Quotes & Inbox → Notification Outbox Log**.

---

## 5. Development & Production Commands

```bash
# Development server (Express API + Vite SPA on port 3000)
npm run dev

# Type-check & lint
npm run lint

# Build client assets for production
npm run build

# Start production server
npm start
```
