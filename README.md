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

## 4. Development & Production Commands

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
