import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

function resolveDatabasePath(): string {
  const rawPath = process.env.DATABASE_PATH?.trim();
  if (rawPath) {
    return path.resolve(process.cwd(), rawPath);
  }
  const rawUrl = process.env.DATABASE_URL?.trim();
  if (rawUrl && rawUrl.startsWith('file:')) {
    const filePart = rawUrl.slice(5).split('?')[0];
    return path.resolve(process.cwd(), filePart || './data/myconcrete.db');
  }
  return path.resolve(process.cwd(), 'data', 'myconcrete.db');
}

const dbPath = resolveDatabasePath();

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

export const db = new DatabaseSync(dbPath);

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA busy_timeout = 5000;
  PRAGMA foreign_keys = ON;
`);

export function initSchema(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      tagline TEXT NOT NULL,
      category TEXT NOT NULL,
      unit_type TEXT NOT NULL DEFAULT 'm3',
      is_offered INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0,
      overview TEXT NOT NULL,
      properties_json TEXT NOT NULL,
      uses_json TEXT NOT NULL,
      grades_json TEXT NOT NULL,
      faqs_json TEXT NOT NULL,
      image_url TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_code TEXT NOT NULL UNIQUE,
      product_slug TEXT NOT NULL,
      product_name TEXT NOT NULL,
      grade TEXT NOT NULL,
      quantity_m3 REAL NOT NULL,
      unit_type TEXT NOT NULL DEFAULT 'm3',
      usage_type TEXT NOT NULL,
      slump_mm TEXT NOT NULL,
      pump_type TEXT NOT NULL,
      delivery_date TEXT NOT NULL,
      slot_id TEXT NOT NULL,
      slot_label TEXT NOT NULL,
      site_address TEXT NOT NULL,
      landmark TEXT DEFAULT '',
      city TEXT NOT NULL,
      site_lat REAL NOT NULL,
      site_lng REAL NOT NULL,
      distance_km REAL NOT NULL,
      estimated_concrete_amount REAL NOT NULL,
      estimated_delivery_fee REAL NOT NULL,
      estimated_pump_fee REAL NOT NULL,
      estimated_total REAL NOT NULL,
      customer_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT DEFAULT '',
      gst_number TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'confirmed',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_bookings_date_slot ON bookings(delivery_date, slot_id);
    CREATE INDEX IF NOT EXISTS idx_bookings_phone ON bookings(phone);

    CREATE TABLE IF NOT EXISTS quotes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quote_code TEXT NOT NULL UNIQUE,
      project_type TEXT NOT NULL,
      grade TEXT NOT NULL,
      quantity_m3 REAL NOT NULL,
      location TEXT NOT NULL,
      timeline TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      attachment_name TEXT DEFAULT '',
      attachment_data TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'new',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS site_visits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      visit_code TEXT NOT NULL UNIQUE,
      visit_type TEXT NOT NULL,
      preferred_date TEXT NOT NULL,
      preferred_time TEXT NOT NULL,
      location TEXT DEFAULT '',
      customer_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'scheduled',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS enquiries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL DEFAULT 'contact',
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT DEFAULT '',
      city TEXT NOT NULL,
      company_or_role TEXT DEFAULT '',
      message TEXT NOT NULL,
      consent INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'new',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      segment TEXT NOT NULL,
      location TEXT NOT NULL,
      grade_used TEXT NOT NULL,
      volume_note TEXT NOT NULL,
      summary TEXT NOT NULL,
      image_url TEXT DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS media_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      caption TEXT NOT NULL,
      image_url TEXT DEFAULT '',
      published_date TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS blogs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      excerpt TEXT NOT NULL,
      content TEXT NOT NULL,
      author TEXT NOT NULL,
      read_time TEXT NOT NULL,
      published_at TEXT NOT NULL,
      image_url TEXT DEFAULT '',
      published INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS testimonials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      author_name TEXT NOT NULL,
      role_or_company TEXT NOT NULL,
      location TEXT NOT NULL,
      quote TEXT NOT NULL,
      published INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS email_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipient TEXT NOT NULL,
      subject TEXT NOT NULL,
      body_preview TEXT NOT NULL,
      delivery_mode TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL DEFAULT 'Plant Admin',
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'staff',
      must_change_password INTEGER NOT NULL DEFAULT 1,
      two_factor_enabled INTEGER NOT NULL DEFAULT 0,
      last_login_at TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS admin_sessions (
      token_hash TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      last_activity_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL,
      ip_address TEXT DEFAULT '',
      user_agent TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(user_id) REFERENCES admin_users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS admin_login_attempts (
      key TEXT PRIMARY KEY,
      attempts INTEGER NOT NULL DEFAULT 0,
      locked_until INTEGER NOT NULL DEFAULT 0,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS admin_login_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      user_id INTEGER DEFAULT NULL,
      role TEXT DEFAULT '',
      status TEXT NOT NULL,
      ip_address TEXT DEFAULT '',
      user_agent TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS admin_reset_tokens (
      token_hash TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      expires_at INTEGER NOT NULL,
      used INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(user_id) REFERENCES admin_users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS admin_otp_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      challenge_hash TEXT NOT NULL,
      code_hash TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      used INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(user_id) REFERENCES admin_users(id) ON DELETE CASCADE
    );
  `);

  // Safe column migrations for existing DB files
  const prodCols = db.prepare(`PRAGMA table_info(products)`).all() as Array<{ name: string }>;
  if (!prodCols.some((c) => c.name === 'unit_type')) {
    db.exec(`ALTER TABLE products ADD COLUMN unit_type TEXT NOT NULL DEFAULT 'm3'`);
  }
  const bookCols = db.prepare(`PRAGMA table_info(bookings)`).all() as Array<{ name: string }>;
  if (!bookCols.some((c) => c.name === 'unit_type')) {
    db.exec(`ALTER TABLE bookings ADD COLUMN unit_type TEXT NOT NULL DEFAULT 'm3'`);
  }
  const adminCols = db.prepare(`PRAGMA table_info(admin_users)`).all() as Array<{ name: string }>;
  if (!adminCols.some((c) => c.name === 'name')) {
    db.exec(`ALTER TABLE admin_users ADD COLUMN name TEXT NOT NULL DEFAULT 'Plant Admin'`);
  }
  if (!adminCols.some((c) => c.name === 'must_change_password')) {
    db.exec(`ALTER TABLE admin_users ADD COLUMN must_change_password INTEGER NOT NULL DEFAULT 1`);
  }
  if (!adminCols.some((c) => c.name === 'two_factor_enabled')) {
    db.exec(`ALTER TABLE admin_users ADD COLUMN two_factor_enabled INTEGER NOT NULL DEFAULT 0`);
  }
  if (!adminCols.some((c) => c.name === 'last_login_at')) {
    db.exec(`ALTER TABLE admin_users ADD COLUMN last_login_at TEXT DEFAULT ''`);
  }
}
