import crypto from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import nodemailer from 'nodemailer';
import { db } from './db.ts';

export const ADMIN_COOKIE_NAME = 'mc_admin_session';
export const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
export const SESSION_MAX_MS = 12 * 60 * 60 * 1000; // 12 hours
export const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
export const MAX_FAILED_ATTEMPTS = 5;

export function hashToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

export function getClientIp(req: Request): string {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.socket.remoteAddress ||
    'unknown'
  );
}

export function parseCookies(req: Request): Record<string, string> {
  const header = req.headers.cookie;
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx <= 0) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    try {
      out[key] = decodeURIComponent(val);
    } catch {
      out[key] = val;
    }
  }
  return out;
}

function isHttpsRequest(req: Request): boolean {
  if (req.secure) return true;
  const proto = String(req.headers['x-forwarded-proto'] || '').toLowerCase();
  return proto.includes('https');
}

export function setAdminSessionCookie(req: Request, res: Response, rawToken: string): void {
  const https = isHttpsRequest(req);
  res.cookie(ADMIN_COOKIE_NAME, rawToken, {
    httpOnly: true,
    secure: https,
    sameSite: https ? 'none' : 'lax',
    path: '/',
    maxAge: SESSION_MAX_MS,
  });
}

export function clearAdminSessionCookie(req: Request, res: Response): void {
  const https = isHttpsRequest(req);
  res.clearCookie(ADMIN_COOKIE_NAME, {
    httpOnly: true,
    secure: https,
    sameSite: https ? 'none' : 'lax',
    path: '/',
  });
}

export function createAdminSession(userId: number, req: Request, res: Response): void {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawToken);
  const now = Date.now();
  db.prepare(
    `INSERT INTO admin_sessions (token_hash, user_id, last_activity_at, expires_at, ip_address, user_agent)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(
    tokenHash,
    userId,
    now,
    now + SESSION_MAX_MS,
    getClientIp(req).slice(0, 80),
    String(req.headers['user-agent'] || '').slice(0, 200)
  );
  setAdminSessionCookie(req, res, rawToken);
}

export function logAdminLogin(params: {
  email: string;
  userId?: number | null;
  role?: string;
  status: string;
  req: Request;
}): void {
  db.prepare(
    `INSERT INTO admin_login_logs (email, user_id, role, status, ip_address, user_agent)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(
    params.email.slice(0, 140),
    params.userId ?? null,
    (params.role || '').slice(0, 30),
    params.status.slice(0, 50),
    getClientIp(params.req).slice(0, 80),
    String(params.req.headers['user-agent'] || '').slice(0, 200)
  );
}

export function sanitizeText(value: unknown, maxLen = 1000): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLen);
}

export function sanitizeMultiline(value: unknown, maxLen = 6000): string {
  if (typeof value !== 'string') return '';
  return value.replace(/[<>]/g, '').trim().slice(0, maxLen);
}

export function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// Simple sliding-window in-memory rate limiter
const rateBuckets = new Map<string, number[]>();

export function rateLimit(maxRequests: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = getClientIp(req);
    const key = `${req.path}:${ip}`;
    const now = Date.now();
    const recent = (rateBuckets.get(key) || []).filter((ts) => now - ts < windowMs);
    if (recent.length >= maxRequests) {
      res.status(429).json({
        error: 'Too many requests. Please wait a moment before trying again.',
      });
      return;
    }
    recent.push(now);
    rateBuckets.set(key, recent);
    next();
  };
}

export interface AdminSessionUser {
  id: number;
  email: string;
  name: string;
  role: 'owner' | 'staff';
  mustChangePassword: boolean;
  twoFactorEnabled: boolean;
  tokenHash: string;
}

export type AuthedRequest = Request & { admin?: AdminSessionUser };

export function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction): void {
  const cookies = parseCookies(req);
  const rawToken = cookies[ADMIN_COOKIE_NAME] || '';
  if (!rawToken) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const tokenHash = hashToken(rawToken);
  const row = db
    .prepare(
      `SELECT s.token_hash, s.user_id, s.last_activity_at, s.expires_at,
              u.email, u.name, u.role, u.must_change_password, u.two_factor_enabled
       FROM admin_sessions s
       JOIN admin_users u ON u.id = s.user_id
       WHERE s.token_hash = ?`
    )
    .get(tokenHash) as
    | {
        token_hash: string;
        user_id: number;
        last_activity_at: number;
        expires_at: number;
        email: string;
        name: string;
        role: string;
        must_change_password: number;
        two_factor_enabled: number;
      }
    | undefined;

  const now = Date.now();
  if (!row || row.expires_at <= now) {
    if (row) {
      db.prepare(`DELETE FROM admin_sessions WHERE token_hash = ?`).run(tokenHash);
    }
    clearAdminSessionCookie(req, res);
    res.status(401).json({ error: 'Invalid or expired admin session' });
    return;
  }

  if (now - row.last_activity_at > IDLE_TIMEOUT_MS) {
    db.prepare(`DELETE FROM admin_sessions WHERE token_hash = ?`).run(tokenHash);
    clearAdminSessionCookie(req, res);
    res.status(401).json({ error: 'Session timed out after 30 minutes of inactivity.' });
    return;
  }

  db.prepare(`UPDATE admin_sessions SET last_activity_at = ? WHERE token_hash = ?`).run(now, tokenHash);

  const mustChange = Boolean(row.must_change_password);
  const allowWhileMustChange = ['/api/admin/me', '/api/admin/change-password', '/api/admin/logout'];
  if (mustChange && !allowWhileMustChange.includes(req.path)) {
    res.status(403).json({
      error: 'Password change required before accessing the admin console.',
      mustChangePassword: true,
    });
    return;
  }

  req.admin = {
    id: row.user_id,
    email: row.email,
    name: row.name,
    role: row.role === 'owner' ? 'owner' : 'staff',
    mustChangePassword: mustChange,
    twoFactorEnabled: Boolean(row.two_factor_enabled),
    tokenHash,
  };
  next();
}

export function requireOwner(req: AuthedRequest, res: Response, next: NextFunction): void {
  if (!req.admin || req.admin.role !== 'owner') {
    res.status(403).json({ error: 'Owner permissions required for this action.' });
    return;
  }
  next();
}

export function getSetting<T>(key: string, fallback: T): T {
  const row = db.prepare(`SELECT value FROM settings WHERE key = ?`).get(key) as
    | { value: string }
    | undefined;
  if (!row) return fallback;
  try {
    return JSON.parse(row.value) as T;
  } catch {
    return fallback;
  }
}

export function setSetting(key: string, value: unknown): void {
  db.prepare(
    `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`
  ).run(key, JSON.stringify(value));
}

function tryLogEmail(
  recipient: string,
  subject: string,
  loggedPreview: string,
  deliveryMode: 'smtp' | 'logged'
): void {
  try {
    db.prepare(
      `INSERT INTO email_logs (recipient, subject, body_preview, delivery_mode) VALUES (?, ?, ?, ?)`
    ).run(recipient, subject, loggedPreview, deliveryMode);
  } catch {
    // Do not fail email notification if database logging is temporarily unavailable
  }
}

export async function sendNotificationEmail(
  recipient: string,
  subject: string,
  textBody: string,
  auditPreviewOverride?: string
): Promise<'smtp' | 'logged'> {
  const loggedPreview = (auditPreviewOverride ?? textBody).slice(0, 600);

  if (!recipient || !recipient.includes('@') || recipient.includes('[EMAIL]')) {
    tryLogEmail(recipient || 'unconfigured', subject, loggedPreview, 'logged');
    return 'logged';
  }

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = Number(process.env.SMTP_PORT || '587');
  const from = process.env.SMTP_FROM || 'MY CONCRETE Dispatch <noreply@myconcrete-rmc.example>';

  if (host && user && pass) {
    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
      await transporter.sendMail({
        from,
        to: recipient,
        subject,
        text: textBody,
      });
      tryLogEmail(recipient, subject, loggedPreview, 'smtp');
      return 'smtp';
    } catch {
      tryLogEmail(recipient, subject, loggedPreview, 'logged');
      return 'logged';
    }
  }

  tryLogEmail(recipient, subject, loggedPreview, 'logged');
  return 'logged';
}
