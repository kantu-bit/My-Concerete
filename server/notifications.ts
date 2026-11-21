import nodemailer from 'nodemailer';
import { db } from './db.ts';

export type WhatsAppProviderType = 'cloudapi' | 'twilio' | 'callmebot' | 'none';

export interface NotificationConfig {
  notifyEmail: string;
  ownerWhatsapp: string;
  ownerWhatsapp2: string;
  whatsappProvider: WhatsAppProviderType;
  whatsappTemplateName: string;
  emailEnabled: boolean;
  whatsappEnabled: boolean;
  customerAckEnabled: boolean;
}

export interface EmailSendResult {
  ok: boolean;
  status: 'sent' | 'failed' | 'skipped';
  provider: 'smtp' | 'resend' | 'none';
  error?: string;
}

export interface WhatsAppSendResult {
  ok: boolean;
  status: 'sent' | 'failed' | 'skipped';
  provider: WhatsAppProviderType;
  error?: string;
}

export type LeadKind =
  | 'booking'
  | 'quote'
  | 'visit'
  | 'contact'
  | 'partner'
  | 'careers'
  | 'newsletter';

export interface LeadNotificationPayload {
  kind: LeadKind;
  recordId?: number;
  referenceCode: string;
  customerName: string;
  phone?: string;
  email?: string;
  productOrGrade?: string;
  quantityLabel?: string;
  pumpNeeded?: string;
  usageType?: string;
  deliveryDateSlot?: string;
  siteAddress?: string;
  city?: string;
  siteLat?: number;
  siteLng?: number;
  plantSelected?: string;
  notes?: string;
  estimatedPrice?: string;
  attachmentName?: string;
  companyOrRole?: string;
  timeline?: string;
  projectType?: string;
  statusLabel?: string;
  language?: string;
  receivedAt?: string;
}

function getRawSetting<T>(key: string, fallback: T): T {
  try {
    const row = db.prepare(`SELECT value FROM settings WHERE key = ?`).get(key) as
      | { value: string }
      | undefined;
    if (!row) return fallback;
    return JSON.parse(row.value) as T;
  } catch {
    return fallback;
  }
}

export function cleanWhatsappNumber(raw: string): string {
  const digits = String(raw || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

function detectEnvWhatsappProvider(): WhatsAppProviderType {
  const explicit = (process.env.WHATSAPP_PROVIDER || '').trim().toLowerCase();
  if (explicit === 'cloudapi' || explicit === 'cloud_api') return 'cloudapi';
  if (explicit === 'twilio') return 'twilio';
  if (explicit === 'callmebot') return 'callmebot';
  if (explicit === 'none') return 'none';

  const hasCloudApi = Boolean(
    (process.env.WHATSAPP_TOKEN || process.env.WHATSAPP_ACCESS_TOKEN || '').trim() &&
      (process.env.WHATSAPP_PHONE_ID || process.env.WHATSAPP_PHONE_NUMBER_ID || '').trim()
  );
  if (hasCloudApi) return 'cloudapi';

  const hasCallMeBot = Boolean(
    (process.env.CALLMEBOT_APIKEY || process.env.CALLMEBOT_API_KEY || '').trim()
  );
  if (hasCallMeBot) return 'callmebot';

  const hasTwilio = Boolean(
    (process.env.TWILIO_SID || process.env.TWILIO_ACCOUNT_SID || '').trim() &&
      (process.env.TWILIO_TOKEN || process.env.TWILIO_AUTH_TOKEN || '').trim() &&
      (process.env.TWILIO_FROM || process.env.TWILIO_WHATSAPP_FROM || '').trim()
  );
  if (hasTwilio) return 'twilio';

  return 'none';
}

export function getDefaultNotificationConfig(): NotificationConfig {
  const notifyEmail =
    process.env.NOTIFY_EMAIL?.trim() ||
    process.env.OWNER_ALERT_EMAIL?.trim() ||
    'myconcretektl@gmail.com';
  const ownerWhatsapp =
    cleanWhatsappNumber(
      process.env.OWNER_WHATSAPP || process.env.OWNER_WHATSAPP_NUMBER || '917337807372'
    ) || '917337807372';
  const ownerWhatsapp2 = cleanWhatsappNumber(process.env.OWNER_WHATSAPP_2 || '');
  return {
    notifyEmail,
    ownerWhatsapp,
    ownerWhatsapp2,
    whatsappProvider: detectEnvWhatsappProvider(),
    whatsappTemplateName: process.env.WHATSAPP_TEMPLATE_NAME?.trim() || '',
    emailEnabled: true,
    whatsappEnabled: true,
    customerAckEnabled: true,
  };
}

export function getEffectiveNotificationConfig(): NotificationConfig {
  const defaults = getDefaultNotificationConfig();
  const saved = getRawSetting<Partial<NotificationConfig>>('notificationConfig', {});
  const validProviders: WhatsAppProviderType[] = ['cloudapi', 'twilio', 'callmebot', 'none'];
  const provider = validProviders.includes(saved.whatsappProvider as WhatsAppProviderType)
    ? (saved.whatsappProvider as WhatsAppProviderType)
    : defaults.whatsappProvider;

  return {
    notifyEmail: saved.notifyEmail?.trim() || defaults.notifyEmail,
    ownerWhatsapp:
      cleanWhatsappNumber(saved.ownerWhatsapp || '') || defaults.ownerWhatsapp || '917337807372',
    ownerWhatsapp2:
      saved.ownerWhatsapp2 !== undefined
        ? cleanWhatsappNumber(saved.ownerWhatsapp2)
        : defaults.ownerWhatsapp2,
    whatsappProvider: provider,
    whatsappTemplateName:
      saved.whatsappTemplateName !== undefined
        ? String(saved.whatsappTemplateName).trim()
        : defaults.whatsappTemplateName,
    emailEnabled: saved.emailEnabled !== undefined ? Boolean(saved.emailEnabled) : true,
    whatsappEnabled: saved.whatsappEnabled !== undefined ? Boolean(saved.whatsappEnabled) : true,
    customerAckEnabled:
      saved.customerAckEnabled !== undefined ? Boolean(saved.customerAckEnabled) : true,
  };
}

export function getNotificationEnvPresence() {
  const smtpUser = (process.env.SMTP_USER || '').trim();
  const smtpPass = (process.env.SMTP_PASS || '').trim();
  const smtpHost =
    (process.env.SMTP_HOST || '').trim() ||
    (smtpUser.toLowerCase().endsWith('@gmail.com') ? 'smtp.gmail.com' : '');
  const resendKey = (process.env.RESEND_API_KEY || '').trim();
  const cloudToken = (process.env.WHATSAPP_TOKEN || process.env.WHATSAPP_ACCESS_TOKEN || '').trim();
  const cloudPhoneId = (
    process.env.WHATSAPP_PHONE_ID ||
    process.env.WHATSAPP_PHONE_NUMBER_ID ||
    ''
  ).trim();
  const twilioSid = (process.env.TWILIO_SID || process.env.TWILIO_ACCOUNT_SID || '').trim();
  const twilioToken = (process.env.TWILIO_TOKEN || process.env.TWILIO_AUTH_TOKEN || '').trim();
  const twilioFrom = (process.env.TWILIO_FROM || process.env.TWILIO_WHATSAPP_FROM || '').trim();
  const callMeBotKey = (process.env.CALLMEBOT_APIKEY || process.env.CALLMEBOT_API_KEY || '').trim();

  return {
    smtpConfigured: Boolean(smtpHost && smtpUser && smtpPass),
    resendConfigured: Boolean(resendKey),
    cloudapiConfigured: Boolean(cloudToken && cloudPhoneId),
    twilioConfigured: Boolean(twilioSid && twilioToken && twilioFrom),
    callmebotConfigured: Boolean(callMeBotKey),
  };
}

export function tryLogOutbox(params: {
  recipient: string;
  subject: string;
  preview: string;
  deliveryMode: string;
  channel: 'email' | 'whatsapp';
  referenceCode?: string;
  errorDetail?: string;
}): void {
  try {
    db.prepare(
      `INSERT INTO email_logs (recipient, subject, body_preview, delivery_mode, channel, reference_code, error_detail)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(
      params.recipient.slice(0, 180),
      params.subject.slice(0, 240),
      params.preview.slice(0, 600),
      params.deliveryMode.slice(0, 60),
      params.channel,
      (params.referenceCode || '').slice(0, 60),
      (params.errorDetail || '').slice(0, 400)
    );
  } catch {
    // Non-blocking audit log
  }
}

export async function sendEmailDetailed(params: {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
  referenceCode?: string;
  auditPreviewOverride?: string;
}): Promise<EmailSendResult> {
  const recipient = (params.to || '').trim();
  const preview = (params.auditPreviewOverride ?? params.text).slice(0, 600);

  if (!recipient || !recipient.includes('@') || recipient.includes('[EMAIL]')) {
    tryLogOutbox({
      recipient: recipient || 'unconfigured',
      subject: params.subject,
      preview,
      deliveryMode: 'email_skipped',
      channel: 'email',
      referenceCode: params.referenceCode,
      errorDetail: 'No valid recipient email configured',
    });
    return {
      ok: false,
      status: 'skipped',
      provider: 'none',
      error: 'No valid recipient email configured',
    };
  }

  const user = (process.env.SMTP_USER || '').trim();
  const pass = (process.env.SMTP_PASS || '').trim();
  const host =
    (process.env.SMTP_HOST || '').trim() ||
    (user.toLowerCase().endsWith('@gmail.com') ? 'smtp.gmail.com' : '');
  const port = Number(process.env.SMTP_PORT || (host === 'smtp.gmail.com' ? '465' : '465'));
  const from =
    (process.env.SMTP_FROM || '').trim() ||
    (user ? `MY CONCRETE Dispatch <${user}>` : 'MY CONCRETE Dispatch <myconcretektl@gmail.com>');

  let lastError = '';

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
        subject: params.subject,
        text: params.text,
        ...(params.html ? { html: params.html } : {}),
        ...(params.replyTo && params.replyTo.includes('@') ? { replyTo: params.replyTo } : {}),
      });
      tryLogOutbox({
        recipient,
        subject: params.subject,
        preview,
        deliveryMode: 'smtp_sent',
        channel: 'email',
        referenceCode: params.referenceCode,
      });
      return { ok: true, status: 'sent', provider: 'smtp' };
    } catch (err) {
      lastError = err instanceof Error ? err.message : 'SMTP transport failed';
    }
  }

  const resendKey = (process.env.RESEND_API_KEY || '').trim();
  if (resendKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: (process.env.RESEND_FROM || '').trim() || 'MY CONCRETE <onboarding@resend.dev>',
          to: [recipient],
          subject: params.subject,
          text: params.text,
          ...(params.html ? { html: params.html } : {}),
          ...(params.replyTo && params.replyTo.includes('@') ? { reply_to: params.replyTo } : {}),
        }),
      });
      if (res.ok) {
        tryLogOutbox({
          recipient,
          subject: params.subject,
          preview,
          deliveryMode: 'resend_sent',
          channel: 'email',
          referenceCode: params.referenceCode,
        });
        return { ok: true, status: 'sent', provider: 'resend' };
      }
      const errBody = await res.text().catch(() => '');
      lastError = `Resend HTTP ${res.status}: ${errBody.slice(0, 180)}`;
    } catch (err) {
      lastError = err instanceof Error ? err.message : 'Resend request failed';
    }
  }

  if (!host || !user || !pass) {
    if (!resendKey) {
      const reason =
        'Email transport not configured (set SMTP_USER & SMTP_PASS for Gmail App Password, or RESEND_API_KEY).';
      tryLogOutbox({
        recipient,
        subject: params.subject,
        preview,
        deliveryMode: 'email_skipped_no_creds',
        channel: 'email',
        referenceCode: params.referenceCode,
        errorDetail: reason,
      });
      return {
        ok: false,
        status: 'skipped',
        provider: 'none',
        error: reason,
      };
    }
  }

  tryLogOutbox({
    recipient,
    subject: params.subject,
    preview,
    deliveryMode: 'email_failed',
    channel: 'email',
    referenceCode: params.referenceCode,
    errorDetail: lastError || 'Email delivery failed',
  });
  return {
    ok: false,
    status: 'failed',
    provider: host && user && pass ? 'smtp' : resendKey ? 'resend' : 'none',
    error: lastError || 'Email delivery failed',
  };
}

async function sendSingleWhatsAppMessage(params: {
  targetPhone: string;
  message: string;
  provider: WhatsAppProviderType;
  templateName?: string;
  templateSummaryParams?: string[];
  referenceCode?: string;
  isSecondNumber?: boolean;
}): Promise<WhatsAppSendResult> {
  const target = cleanWhatsappNumber(params.targetPhone);
  const preview = params.message.slice(0, 600);

  if (!target) {
    return {
      ok: false,
      status: 'skipped',
      provider: params.provider,
      error: 'No WhatsApp target number configured',
    };
  }

  if (params.provider === 'none') {
    tryLogOutbox({
      recipient: `whatsapp:+${target}`,
      subject: `WhatsApp Alert (${params.referenceCode || 'LEAD'})`,
      preview,
      deliveryMode: 'whatsapp_skipped_none',
      channel: 'whatsapp',
      referenceCode: params.referenceCode,
      errorDetail: 'WHATSAPP_PROVIDER is set to none',
    });
    return {
      ok: true,
      status: 'skipped',
      provider: 'none',
      error: 'WhatsApp provider disabled (set to none)',
    };
  }

  if (params.provider === 'cloudapi') {
    const phoneId = (
      process.env.WHATSAPP_PHONE_ID ||
      process.env.WHATSAPP_PHONE_NUMBER_ID ||
      ''
    ).trim();
    const token = (process.env.WHATSAPP_TOKEN || process.env.WHATSAPP_ACCESS_TOKEN || '').trim();
    if (!phoneId || !token) {
      const reason = 'Meta Cloud API not configured (set WHATSAPP_TOKEN and WHATSAPP_PHONE_ID).';
      tryLogOutbox({
        recipient: `whatsapp:+${target}`,
        subject: `WhatsApp Alert (${params.referenceCode || 'LEAD'})`,
        preview,
        deliveryMode: 'whatsapp_cloudapi_unconfigured',
        channel: 'whatsapp',
        referenceCode: params.referenceCode,
        errorDetail: reason,
      });
      return { ok: false, status: 'skipped', provider: 'cloudapi', error: reason };
    }

    const templateName = (params.templateName || process.env.WHATSAPP_TEMPLATE_NAME || '').trim();
    const bodyPayload: Record<string, unknown> = templateName
      ? templateName === 'hello_world'
        ? {
            messaging_product: 'whatsapp',
            to: target,
            type: 'template',
            template: {
              name: 'hello_world',
              language: { code: 'en_US' },
            },
          }
        : {
            messaging_product: 'whatsapp',
            to: target,
            type: 'template',
            template: {
              name: templateName,
              language: { code: 'en' },
              components: [
                {
                  type: 'body',
                  parameters: (params.templateSummaryParams || [params.message.slice(0, 900)]).map(
                    (val) => ({ type: 'text', text: String(val).slice(0, 1000) })
                  ),
                },
              ],
            },
          }
      : {
          messaging_product: 'whatsapp',
          to: target,
          type: 'text',
          text: { body: params.message.slice(0, 4000) },
        };

    try {
      const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bodyPayload),
      });
      if (res.ok) {
        tryLogOutbox({
          recipient: `whatsapp:+${target}`,
          subject: `WhatsApp Alert (${params.referenceCode || 'LEAD'})`,
          preview,
          deliveryMode: 'whatsapp_cloudapi_sent',
          channel: 'whatsapp',
          referenceCode: params.referenceCode,
        });
        return { ok: true, status: 'sent', provider: 'cloudapi' };
      }
      const errText = await res.text().catch(() => '');
      const reason = `Cloud API HTTP ${res.status}: ${errText.slice(0, 200)}`;
      tryLogOutbox({
        recipient: `whatsapp:+${target}`,
        subject: `WhatsApp Alert (${params.referenceCode || 'LEAD'})`,
        preview,
        deliveryMode: 'whatsapp_cloudapi_failed',
        channel: 'whatsapp',
        referenceCode: params.referenceCode,
        errorDetail: reason,
      });
      return { ok: false, status: 'failed', provider: 'cloudapi', error: reason };
    } catch (err) {
      const reason = err instanceof Error ? err.message : 'Meta Cloud API request failed';
      tryLogOutbox({
        recipient: `whatsapp:+${target}`,
        subject: `WhatsApp Alert (${params.referenceCode || 'LEAD'})`,
        preview,
        deliveryMode: 'whatsapp_cloudapi_failed',
        channel: 'whatsapp',
        referenceCode: params.referenceCode,
        errorDetail: reason,
      });
      return { ok: false, status: 'failed', provider: 'cloudapi', error: reason };
    }
  }

  if (params.provider === 'twilio') {
    const sid = (process.env.TWILIO_SID || process.env.TWILIO_ACCOUNT_SID || '').trim();
    const token = (process.env.TWILIO_TOKEN || process.env.TWILIO_AUTH_TOKEN || '').trim();
    const from = (process.env.TWILIO_FROM || process.env.TWILIO_WHATSAPP_FROM || '').trim();
    if (!sid || !token || !from) {
      const reason = 'Twilio WhatsApp not configured (set TWILIO_SID, TWILIO_TOKEN, TWILIO_FROM).';
      tryLogOutbox({
        recipient: `whatsapp:+${target}`,
        subject: `WhatsApp Alert (${params.referenceCode || 'LEAD'})`,
        preview,
        deliveryMode: 'whatsapp_twilio_unconfigured',
        channel: 'whatsapp',
        referenceCode: params.referenceCode,
        errorDetail: reason,
      });
      return { ok: false, status: 'skipped', provider: 'twilio', error: reason };
    }

    try {
      const formParams = new URLSearchParams({
        From: from.startsWith('whatsapp:') ? from : `whatsapp:${from}`,
        To: `whatsapp:+${target}`,
        Body: params.message.slice(0, 1500),
      });
      const auth = Buffer.from(`${sid}:${token}`).toString('base64');
      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formParams.toString(),
      });
      if (res.ok) {
        tryLogOutbox({
          recipient: `whatsapp:+${target}`,
          subject: `WhatsApp Alert (${params.referenceCode || 'LEAD'})`,
          preview,
          deliveryMode: 'whatsapp_twilio_sent',
          channel: 'whatsapp',
          referenceCode: params.referenceCode,
        });
        return { ok: true, status: 'sent', provider: 'twilio' };
      }
      const errText = await res.text().catch(() => '');
      const reason = `Twilio HTTP ${res.status}: ${errText.slice(0, 200)}`;
      tryLogOutbox({
        recipient: `whatsapp:+${target}`,
        subject: `WhatsApp Alert (${params.referenceCode || 'LEAD'})`,
        preview,
        deliveryMode: 'whatsapp_twilio_failed',
        channel: 'whatsapp',
        referenceCode: params.referenceCode,
        errorDetail: reason,
      });
      return { ok: false, status: 'failed', provider: 'twilio', error: reason };
    } catch (err) {
      const reason = err instanceof Error ? err.message : 'Twilio request failed';
      return { ok: false, status: 'failed', provider: 'twilio', error: reason };
    }
  }

  // callmebot
  const callMeBotPhone =
    cleanWhatsappNumber(process.env.CALLMEBOT_PHONE || '') || target;
  const targetForCallMeBot = params.isSecondNumber ? target : callMeBotPhone;
  const apiKey = (
    params.isSecondNumber
      ? process.env.CALLMEBOT_APIKEY_2 || process.env.CALLMEBOT_APIKEY || process.env.CALLMEBOT_API_KEY
      : process.env.CALLMEBOT_APIKEY || process.env.CALLMEBOT_API_KEY
  )?.trim();

  if (!apiKey) {
    const reason = 'CallMeBot not configured (set CALLMEBOT_PHONE and CALLMEBOT_APIKEY).';
    tryLogOutbox({
      recipient: `whatsapp:+${targetForCallMeBot}`,
      subject: `WhatsApp Alert (${params.referenceCode || 'LEAD'})`,
      preview,
      deliveryMode: 'whatsapp_callmebot_unconfigured',
      channel: 'whatsapp',
      referenceCode: params.referenceCode,
      errorDetail: reason,
    });
    return { ok: false, status: 'skipped', provider: 'callmebot', error: reason };
  }

  try {
    const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(
      targetForCallMeBot
    )}&text=${encodeURIComponent(params.message.slice(0, 1500))}&apikey=${encodeURIComponent(apiKey)}`;
    const res = await fetch(url);
    if (res.ok) {
      tryLogOutbox({
        recipient: `whatsapp:+${targetForCallMeBot}`,
        subject: `WhatsApp Alert (${params.referenceCode || 'LEAD'})`,
        preview,
        deliveryMode: 'whatsapp_callmebot_sent',
        channel: 'whatsapp',
        referenceCode: params.referenceCode,
      });
      return { ok: true, status: 'sent', provider: 'callmebot' };
    }
    const errText = await res.text().catch(() => '');
    const reason = `CallMeBot HTTP ${res.status}: ${errText.slice(0, 200)}`;
    tryLogOutbox({
      recipient: `whatsapp:+${targetForCallMeBot}`,
      subject: `WhatsApp Alert (${params.referenceCode || 'LEAD'})`,
      preview,
      deliveryMode: 'whatsapp_callmebot_failed',
      channel: 'whatsapp',
      referenceCode: params.referenceCode,
      errorDetail: reason,
    });
    return { ok: false, status: 'failed', provider: 'callmebot', error: reason };
  } catch (err) {
    const reason = err instanceof Error ? err.message : 'CallMeBot request failed';
    tryLogOutbox({
      recipient: `whatsapp:+${targetForCallMeBot}`,
      subject: `WhatsApp Alert (${params.referenceCode || 'LEAD'})`,
      preview,
      deliveryMode: 'whatsapp_callmebot_failed',
      channel: 'whatsapp',
      referenceCode: params.referenceCode,
      errorDetail: reason,
    });
    return { ok: false, status: 'failed', provider: 'callmebot', error: reason };
  }
}

export async function sendWhatsAppToOwners(params: {
  message: string;
  cfg?: NotificationConfig;
  referenceCode?: string;
  templateSummaryParams?: string[];
}): Promise<WhatsAppSendResult> {
  const cfg = params.cfg || getEffectiveNotificationConfig();
  if (!cfg.whatsappEnabled) {
    return {
      ok: true,
      status: 'skipped',
      provider: cfg.whatsappProvider,
      error: 'WhatsApp alerts toggled off in Admin Settings',
    };
  }

  const primary = await sendSingleWhatsAppMessage({
    targetPhone: cfg.ownerWhatsapp,
    message: params.message,
    provider: cfg.whatsappProvider,
    templateName: cfg.whatsappTemplateName,
    templateSummaryParams: params.templateSummaryParams,
    referenceCode: params.referenceCode,
    isSecondNumber: false,
  });

  if (cfg.ownerWhatsapp2 && cfg.ownerWhatsapp2 !== cfg.ownerWhatsapp) {
    await sendSingleWhatsAppMessage({
      targetPhone: cfg.ownerWhatsapp2,
      message: params.message,
      provider: cfg.whatsappProvider,
      templateName: cfg.whatsappTemplateName,
      templateSummaryParams: params.templateSummaryParams,
      referenceCode: params.referenceCode,
      isSecondNumber: true,
    });
  }

  return primary;
}

async function withRetries<T extends { status: 'sent' | 'failed' | 'skipped' }>(
  operation: () => Promise<T>,
  maxAttempts = 3
): Promise<T> {
  let result = await operation();
  if (result.status !== 'failed') {
    return result;
  }
  const delays = [500, 1500];
  for (let attempt = 2; attempt <= maxAttempts; attempt += 1) {
    const waitMs = delays[attempt - 2] ?? 1500;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
    result = await operation();
    if (result.status !== 'failed') {
      return result;
    }
  }
  return result;
}

function escapeHtml(val: unknown): string {
  return String(val ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getAppBaseUrl(): string {
  return (process.env.APP_URL || 'http://localhost:3000').replace(/\/+$/, '');
}

function getKindDisplayName(kind: LeadKind): string {
  switch (kind) {
    case 'booking':
      return 'Delivery Booking';
    case 'quote':
      return 'Quote';
    case 'visit':
      return 'Site/Plant Visit';
    case 'partner':
      return 'Partner Enquiry';
    case 'careers':
      return 'Careers Application';
    case 'newsletter':
      return 'Newsletter';
    default:
      return 'Contact Enquiry';
  }
}

export function buildAdminRecordUrl(kind: LeadKind, referenceCode: string): string {
  const base = getAppBaseUrl();
  const tab = kind === 'booking' || kind === 'visit' ? 'bookings' : 'inbox';
  return `${base}/admin?tab=${tab}&ref=${encodeURIComponent(referenceCode)}`;
}

function buildMapPinLink(payload: LeadNotificationPayload): string {
  if (
    typeof payload.siteLat === 'number' &&
    typeof payload.siteLng === 'number' &&
    (payload.siteLat !== 0 || payload.siteLng !== 0)
  ) {
    return `https://maps.google.com/?q=${payload.siteLat},${payload.siteLng}`;
  }
  if (payload.siteAddress || payload.city) {
    const q = [payload.siteAddress, payload.city].filter(Boolean).join(', ');
    return `https://maps.google.com/?q=${encodeURIComponent(q)}`;
  }
  return '';
}

export function buildLeadOwnerSubject(payload: LeadNotificationPayload): string {
  switch (payload.kind) {
    case 'booking':
      return `New Delivery Booking ${payload.referenceCode} – ${payload.deliveryDateSlot || ''}`.trim();
    case 'quote':
      return `New Quote Request – ${payload.customerName} – ${payload.productOrGrade || 'Concrete'} – ${payload.quantityLabel || ''}`.trim();
    case 'visit':
      return `New Site/Plant Visit ${payload.referenceCode} – ${payload.customerName} – ${payload.deliveryDateSlot || ''}`.trim();
    case 'partner':
      return `New Partner Enquiry ${payload.referenceCode} – ${payload.customerName} – ${payload.city || ''}`.trim();
    case 'careers':
      return `New Careers Application ${payload.referenceCode} – ${payload.customerName} – ${payload.city || ''}`.trim();
    case 'newsletter':
      return `New Newsletter Subscription ${payload.referenceCode} – ${payload.email || payload.customerName}`;
    default:
      return `New Contact Enquiry ${payload.referenceCode} – ${payload.customerName} – ${payload.city || ''}`.trim();
  }
}

export function buildLeadWhatsAppMessage(payload: LeadNotificationPayload): string {
  const label = getKindDisplayName(payload.kind);
  const mapLink = buildMapPinLink(payload);
  const adminLink = buildAdminRecordUrl(payload.kind, payload.referenceCode);
  const cleanPhone = payload.phone ? `+91 ${payload.phone.replace(/^\+?91/, '')}` : 'Not provided';
  const siteStr = [payload.siteAddress, payload.city].filter(Boolean).join(', ') || 'Not specified';

  return [
    `🆕 New ${label} – MY CONCRETE`,
    `ID: ${payload.referenceCode}`,
    `Name: ${payload.customerName || payload.email || 'Visitor'}`,
    `Phone: ${cleanPhone}`,
    payload.email ? `Email: ${payload.email}` : null,
    `Product: ${payload.productOrGrade || label} | Qty: ${payload.quantityLabel || '—'}`,
    `Date/Slot: ${payload.deliveryDateSlot || payload.timeline || '—'}`,
    `Site: ${siteStr}${mapLink ? ` (${mapLink})` : ''}`,
    payload.plantSelected ? `Plant: ${payload.plantSelected}` : null,
    payload.estimatedPrice ? `Est: ${payload.estimatedPrice}` : null,
    `Notes: ${payload.notes || 'None'}`,
    `Open in admin: ${adminLink}`,
  ]
    .filter(Boolean)
    .join('\n');
}

export function buildLeadOwnerEmails(payload: LeadNotificationPayload): {
  subject: string;
  text: string;
  html: string;
} {
  const subject = buildLeadOwnerSubject(payload);
  const kindLabel = getKindDisplayName(payload.kind);
  const mapLink = buildMapPinLink(payload);
  const adminLink = buildAdminRecordUrl(payload.kind, payload.referenceCode);
  const receivedAt = payload.receivedAt || new Date().toISOString();
  const customerDigits = cleanWhatsappNumber(payload.phone || '');

  const rows: Array<[string, string, string?]> = [
    ['Form Type', kindLabel],
    ['Booking / Ref ID', payload.referenceCode],
    ['Status', payload.statusLabel || 'New'],
    ['Time & Date Received', receivedAt],
    ['Language Used', payload.language === 'kn' ? 'Kannada (kn)' : 'English (en)'],
    ['Customer Name', payload.customerName || '—'],
    [
      'Phone',
      payload.phone ? `+91 ${payload.phone}` : '—',
      payload.phone
        ? `<a href="tel:+91${escapeHtml(payload.phone)}" style="color:#1F3FA8;font-weight:700;text-decoration:none;">Call +91 ${escapeHtml(payload.phone)}</a> &nbsp;|&nbsp; <a href="https://wa.me/${escapeHtml(customerDigits)}" style="color:#16A34A;font-weight:700;text-decoration:none;">WhatsApp Customer</a>`
        : undefined,
    ],
    [
      'Email',
      payload.email || 'Not provided',
      payload.email
        ? `<a href="mailto:${escapeHtml(payload.email)}" style="color:#1F3FA8;">${escapeHtml(payload.email)}</a>`
        : undefined,
    ],
    ['Product / Grade', payload.productOrGrade || '—'],
    ['Quantity', payload.quantityLabel || '—'],
    ['Pump Needed', payload.pumpNeeded || '—'],
    ['Usage / Project Type', payload.usageType || payload.projectType || payload.companyOrRole || '—'],
    ['Delivery Date & Slot', payload.deliveryDateSlot || payload.timeline || '—'],
    ['Site Address', [payload.siteAddress, payload.city].filter(Boolean).join(', ') || '—'],
    [
      'Map Pin Link',
      mapLink || '—',
      mapLink
        ? `<a href="${escapeHtml(mapLink)}" style="color:#D92B25;font-weight:600;">Open Site Location on Google Maps</a>`
        : undefined,
    ],
    ['Plant Selected', payload.plantSelected || '—'],
    ['Estimated Price', payload.estimatedPrice || '—'],
    ['Attachment', payload.attachmentName || '—'],
    ['Notes / Message', payload.notes || 'None'],
  ];

  const text = [
    subject,
    '='.repeat(Math.min(60, subject.length)),
    ...rows.map(([k, v]) => `${k}: ${v}`),
    ...(payload.phone
      ? [`Call Customer: tel:+91${payload.phone}`, `WhatsApp Customer: https://wa.me/${customerDigits}`]
      : []),
    `Open in Admin: ${adminLink}`,
  ].join('\n');

  const tableRowsHtml = rows
    .map(
      ([label, val, customHtml]) => `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #E2E8F0;background:#F8FAFC;font-weight:600;color:#0F1F5C;width:34%;vertical-align:top;">${escapeHtml(label)}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #E2E8F0;color:#1E293B;vertical-align:top;">${customHtml || escapeHtml(val)}</td>
        </tr>`
    )
    .join('');

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;background:#F1F5F9;padding:20px;">
    <div style="max-width:680px;margin:0 auto;background:#FFFFFF;border-radius:12px;overflow:hidden;border:1px solid #CBD5E1;">
      <div style="background:#0F1F5C;color:#FFFFFF;padding:18px 24px;">
        <div style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#FFC93C;font-weight:700;">MY CONCRETE – Readymix Concrete Unit</div>
        <h2 style="margin:6px 0 0;font-size:20px;line-height:1.3;">${escapeHtml(subject)}</h2>
      </div>
      <div style="padding:20px 24px;">
        <table style="width:100%;border-collapse:collapse;font-size:14px;line-height:1.45;border:1px solid #E2E8F0;">
          ${tableRowsHtml}
        </table>
        <div style="margin-top:20px;display:flex;flex-wrap:wrap;gap:10px;">
          <a href="${escapeHtml(adminLink)}" style="display:inline-block;background:#D92B25;color:#FFFFFF;padding:11px 18px;border-radius:999px;font-weight:700;font-size:13px;text-decoration:none;margin-right:8px;">Open Lead in Admin Console</a>
          ${
            payload.phone
              ? `<a href="tel:+91${escapeHtml(payload.phone)}" style="display:inline-block;background:#1F3FA8;color:#FFFFFF;padding:11px 18px;border-radius:999px;font-weight:700;font-size:13px;text-decoration:none;margin-right:8px;">Tap to Call Customer</a>
                 <a href="https://wa.me/${escapeHtml(customerDigits)}" style="display:inline-block;background:#16A34A;color:#FFFFFF;padding:11px 18px;border-radius:999px;font-weight:700;font-size:13px;text-decoration:none;">Chat on WhatsApp</a>`
              : ''
          }
        </div>
      </div>
      <div style="background:#F8FAFC;padding:12px 24px;font-size:12px;color:#64748B;border-top:1px solid #E2E8F0;">
        Kotihal &amp; Davangere Dispatch Desk · +91 73378 07372 · myconcretektl@gmail.com
      </div>
    </div>
  </div>`;

  return { subject, text, html };
}

export function buildCustomerAckEmail(payload: LeadNotificationPayload): {
  subject: string;
  text: string;
  html: string;
} {
  const label = getKindDisplayName(payload.kind);
  const subject = `MY CONCRETE ${label} Received – Ref ${payload.referenceCode}`;
  const text = [
    `Namaskara ${payload.customerName || 'Valued Customer'},`,
    '',
    `Thank you for contacting MY CONCRETE – Readymix Concrete Unit.`,
    `Your reference ID is: ${payload.referenceCode}`,
    `Our team will call you shortly on +91 ${payload.phone || 'your registered number'} to assist and confirm details.`,
    '',
    payload.productOrGrade ? `Product / Grade: ${payload.productOrGrade}` : null,
    payload.quantityLabel ? `Quantity: ${payload.quantityLabel}` : null,
    payload.deliveryDateSlot ? `Schedule / Timeline: ${payload.deliveryDateSlot}` : null,
    payload.siteAddress || payload.city
      ? `Location: ${[payload.siteAddress, payload.city].filter(Boolean).join(', ')}`
      : null,
    '',
    `Need immediate help? Call +91 73378 07372 or WhatsApp https://wa.me/917337807372`,
  ]
    .filter((v) => v !== null)
    .join('\n');

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;background:#F1F5F9;padding:20px;">
    <div style="max-width:600px;margin:0 auto;background:#FFFFFF;border-radius:12px;overflow:hidden;border:1px solid #CBD5E1;">
      <div style="background:#0F1F5C;color:#FFFFFF;padding:18px 24px;">
        <div style="font-size:12px;color:#FFC93C;font-weight:700;">MY CONCRETE – Readymix Concrete Unit</div>
        <h2 style="margin:6px 0 0;font-size:18px;">Thank You! Reference ID: ${escapeHtml(payload.referenceCode)}</h2>
      </div>
      <div style="padding:20px 24px;font-size:14px;color:#1E293B;line-height:1.6;">
        <p>Namaskara <strong>${escapeHtml(payload.customerName || 'Customer')}</strong>,</p>
        <p>We have received your <strong>${escapeHtml(label)}</strong> request. <strong>Our team will call you shortly</strong> to confirm pricing and dispatch details.</p>
        <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;padding:12px 16px;margin:16px 0;">
          <p style="margin:4px 0;"><strong>Reference ID:</strong> ${escapeHtml(payload.referenceCode)}</p>
          ${payload.productOrGrade ? `<p style="margin:4px 0;"><strong>Product / Grade:</strong> ${escapeHtml(payload.productOrGrade)}</p>` : ''}
          ${payload.quantityLabel ? `<p style="margin:4px 0;"><strong>Quantity:</strong> ${escapeHtml(payload.quantityLabel)}</p>` : ''}
          ${payload.deliveryDateSlot ? `<p style="margin:4px 0;"><strong>Schedule:</strong> ${escapeHtml(payload.deliveryDateSlot)}</p>` : ''}
          ${payload.siteAddress || payload.city ? `<p style="margin:4px 0;"><strong>Location:</strong> ${escapeHtml([payload.siteAddress, payload.city].filter(Boolean).join(', '))}</p>` : ''}
        </div>
        <p>For urgent 24/7 dispatch assistance, call <a href="tel:+917337807372" style="color:#1F3FA8;font-weight:700;">+91 73378 07372</a> or <a href="https://wa.me/917337807372" style="color:#16A34A;font-weight:700;">message us on WhatsApp</a>.</p>
      </div>
    </div>
  </div>`;

  return { subject, text, html };
}

function updateLeadNotificationStatusInDb(
  kind: LeadKind,
  recordId: number | undefined,
  status: {
    emailStatus: string;
    emailError: string;
    whatsappStatus: string;
    whatsappError: string;
  }
): void {
  if (!recordId || recordId <= 0) return;
  const table =
    kind === 'booking'
      ? 'bookings'
      : kind === 'quote'
        ? 'quotes'
        : kind === 'visit'
          ? 'site_visits'
          : kind === 'newsletter'
            ? 'newsletter_subscribers'
            : 'enquiries';

  try {
    db.prepare(
      `UPDATE ${table}
       SET email_status = ?, email_error = ?, whatsapp_status = ?, whatsapp_error = ?, notified_at = datetime('now')
       WHERE id = ?`
    ).run(
      status.emailStatus,
      status.emailError.slice(0, 400),
      status.whatsappStatus,
      status.whatsappError.slice(0, 400),
      recordId
    );
  } catch (err) {
    console.error(`[Notification DB Status Update Error] ${table}#${recordId}:`, err);
  }
}

export async function dispatchLeadNotification(
  payload: LeadNotificationPayload
): Promise<{
  emailResult: EmailSendResult;
  whatsappResult: WhatsAppSendResult;
  customerAckResult?: EmailSendResult;
}> {
  const cfg = getEffectiveNotificationConfig();
  const ownerEmailContent = buildLeadOwnerEmails(payload);
  const waText = buildLeadWhatsAppMessage(payload);

  const emailPromise = cfg.emailEnabled
    ? withRetries(
        () =>
          sendEmailDetailed({
            to: cfg.notifyEmail,
            subject: ownerEmailContent.subject,
            text: ownerEmailContent.text,
            html: ownerEmailContent.html,
            replyTo: payload.email,
            referenceCode: payload.referenceCode,
          }),
        3
      )
    : Promise.resolve<EmailSendResult>({
        ok: true,
        status: 'skipped',
        provider: 'none',
        error: 'Email alerts toggled off in Admin Settings',
      });

  const waPromise = withRetries(
    () =>
      sendWhatsAppToOwners({
        message: waText,
        cfg,
        referenceCode: payload.referenceCode,
        templateSummaryParams: [
          getKindDisplayName(payload.kind),
          payload.referenceCode,
          payload.customerName || 'Visitor',
          payload.phone ? `+91 ${payload.phone}` : 'N/A',
          payload.productOrGrade || 'General',
          payload.quantityLabel || '—',
        ],
      }),
    3
  );

  let customerAckResult: EmailSendResult | undefined;
  const ackPromise =
    cfg.emailEnabled && cfg.customerAckEnabled && payload.email && payload.email.includes('@')
      ? (async () => {
          const ack = buildCustomerAckEmail(payload);
          return sendEmailDetailed({
            to: payload.email!,
            subject: ack.subject,
            text: ack.text,
            html: ack.html,
            referenceCode: payload.referenceCode,
          });
        })()
      : Promise.resolve(undefined);

  const [emailResult, whatsappResult, ackRes] = await Promise.all([
    emailPromise,
    waPromise,
    ackPromise,
  ]);
  customerAckResult = ackRes;

  updateLeadNotificationStatusInDb(payload.kind, payload.recordId, {
    emailStatus: emailResult.status,
    emailError: emailResult.error || '',
    whatsappStatus: whatsappResult.status,
    whatsappError: whatsappResult.error || '',
  });

  return { emailResult, whatsappResult, customerAckResult };
}

export async function resendLeadNotificationByRecord(
  kind: 'booking' | 'quote' | 'visit' | 'enquiry' | 'newsletter',
  id: number
): Promise<{
  found: boolean;
  emailResult?: EmailSendResult;
  whatsappResult?: WhatsAppSendResult;
}> {
  if (kind === 'booking') {
    const b = db.prepare(`SELECT * FROM bookings WHERE id = ?`).get(id) as
      | Record<string, unknown>
      | undefined;
    if (!b) return { found: false };
    const unitLabel = b.unit_type === 'pieces' ? 'pieces' : 'm³';
    const res = await dispatchLeadNotification({
      kind: 'booking',
      recordId: id,
      referenceCode: String(b.booking_code),
      customerName: String(b.customer_name),
      phone: String(b.phone),
      email: String(b.email || ''),
      productOrGrade: `${String(b.grade)} (${String(b.product_name)})`,
      quantityLabel: `${Number(b.quantity_m3)} ${unitLabel}`,
      pumpNeeded: b.unit_type === 'pieces' ? 'N/A' : String(b.pump_type || 'none'),
      usageType: String(b.usage_type || ''),
      deliveryDateSlot: `${String(b.delivery_date)} (${String(b.slot_label)})`,
      siteAddress: `${String(b.site_address)}${b.landmark ? ` (Near ${String(b.landmark)})` : ''}`,
      city: String(b.city || ''),
      siteLat: Number(b.site_lat || 0),
      siteLng: Number(b.site_lng || 0),
      plantSelected: String(b.dispatch_plant_name || 'Kotihal'),
      estimatedPrice: `INR ${Number(b.estimated_total || 0).toLocaleString('en-IN')}`,
      notes: String(b.notes || ''),
      statusLabel: String(b.status || 'confirmed'),
      language: String(b.language || 'en'),
      receivedAt: String(b.created_at || ''),
    });
    return { found: true, emailResult: res.emailResult, whatsappResult: res.whatsappResult };
  }

  if (kind === 'quote') {
    const q = db.prepare(`SELECT * FROM quotes WHERE id = ?`).get(id) as
      | Record<string, unknown>
      | undefined;
    if (!q) return { found: false };
    const res = await dispatchLeadNotification({
      kind: 'quote',
      recordId: id,
      referenceCode: String(q.quote_code),
      customerName: String(q.customer_name),
      phone: String(q.phone),
      email: String(q.email || ''),
      productOrGrade: String(q.grade),
      quantityLabel: String(q.quantity_m3),
      projectType: String(q.project_type),
      timeline: String(q.timeline),
      city: String(q.location),
      attachmentName: String(q.attachment_name || ''),
      notes: String(q.notes || ''),
      statusLabel: String(q.status || 'new'),
      language: String(q.language || 'en'),
      receivedAt: String(q.created_at || ''),
    });
    return { found: true, emailResult: res.emailResult, whatsappResult: res.whatsappResult };
  }

  if (kind === 'visit') {
    const sv = db.prepare(`SELECT * FROM site_visits WHERE id = ?`).get(id) as
      | Record<string, unknown>
      | undefined;
    if (!sv) return { found: false };
    const res = await dispatchLeadNotification({
      kind: 'visit',
      recordId: id,
      referenceCode: String(sv.visit_code),
      customerName: String(sv.customer_name),
      phone: String(sv.phone),
      email: String(sv.email || ''),
      productOrGrade: String(sv.visit_type).replace('_', ' '),
      deliveryDateSlot: `${String(sv.preferred_date)} at ${String(sv.preferred_time)}`,
      siteAddress: String(sv.location || 'Kotihal Plant'),
      notes: String(sv.notes || ''),
      statusLabel: String(sv.status || 'scheduled'),
      language: String(sv.language || 'en'),
      receivedAt: String(sv.created_at || ''),
    });
    return { found: true, emailResult: res.emailResult, whatsappResult: res.whatsappResult };
  }

  if (kind === 'newsletter') {
    const sub = db.prepare(`SELECT * FROM newsletter_subscribers WHERE id = ?`).get(id) as
      | Record<string, unknown>
      | undefined;
    if (!sub) return { found: false };
    const res = await dispatchLeadNotification({
      kind: 'newsletter',
      recordId: id,
      referenceCode: String(sub.sub_code || `NL-${id}`),
      customerName: String(sub.email),
      email: String(sub.email),
      productOrGrade: 'Newsletter Updates',
      statusLabel: String(sub.status || 'new'),
      language: String(sub.language || 'en'),
      receivedAt: String(sub.created_at || ''),
    });
    return { found: true, emailResult: res.emailResult, whatsappResult: res.whatsappResult };
  }

  const enq = db.prepare(`SELECT * FROM enquiries WHERE id = ?`).get(id) as
    | Record<string, unknown>
    | undefined;
  if (!enq) return { found: false };
  const enqType = String(enq.type || 'contact');
  const mappedKind: LeadKind =
    enqType === 'partner' ? 'partner' : enqType === 'careers' ? 'careers' : 'contact';
  const res = await dispatchLeadNotification({
    kind: mappedKind,
    recordId: id,
    referenceCode: String(enq.enquiry_code || `ENQ-${id}`),
    customerName: String(enq.name),
    phone: String(enq.phone),
    email: String(enq.email || ''),
    city: String(enq.city || ''),
    companyOrRole: String(enq.company_or_role || ''),
    notes: String(enq.message || ''),
    statusLabel: String(enq.status || 'new'),
    language: String(enq.language || 'en'),
    receivedAt: String(enq.created_at || ''),
  });
  return { found: true, emailResult: res.emailResult, whatsappResult: res.whatsappResult };
}

export async function sendTestNotificationNow(): Promise<{
  config: NotificationConfig;
  emailResult: EmailSendResult;
  whatsappResult: WhatsAppSendResult;
}> {
  const cfg = getEffectiveNotificationConfig();
  const samplePayload: LeadNotificationPayload = {
    kind: 'quote',
    referenceCode: `TEST-${new Date().getFullYear()}-0001`,
    customerName: 'Admin Notification Test',
    phone: '7337807372',
    email: cfg.notifyEmail,
    productOrGrade: 'Ready-Mix Concrete (M25)',
    quantityLabel: '10 m³',
    pumpNeeded: 'Line Pump',
    usageType: 'Roof Slab Test',
    deliveryDateSlot: `${new Date().toISOString().slice(0, 10)} (08:00 AM – 10:00 AM)`,
    siteAddress: 'Kotihal Batching Plant Road',
    city: 'Ranebennur',
    siteLat: 14.4607,
    siteLng: 75.6633,
    plantSelected: 'Kotihal',
    estimatedPrice: 'INR 58,000',
    notes: 'Sample test notification sent from /admin Settings -> Notifications.',
    statusLabel: 'test',
    language: 'en',
    receivedAt: new Date().toISOString(),
  };

  const emailContent = buildLeadOwnerEmails(samplePayload);
  const waMessage = buildLeadWhatsAppMessage(samplePayload);

  const [emailResult, whatsappResult] = await Promise.all([
    cfg.emailEnabled
      ? sendEmailDetailed({
          to: cfg.notifyEmail,
          subject: `[TEST] ${emailContent.subject}`,
          text: emailContent.text,
          html: emailContent.html,
          referenceCode: samplePayload.referenceCode,
        })
      : Promise.resolve<EmailSendResult>({
          ok: true,
          status: 'skipped',
          provider: 'none',
          error: 'Email alerts toggled off in Admin Settings',
        }),
    sendWhatsAppToOwners({
      message: waMessage,
      cfg,
      referenceCode: samplePayload.referenceCode,
      templateSummaryParams: [
        'Test Alert',
        samplePayload.referenceCode,
        samplePayload.customerName,
        '+91 7337807372',
        'M25 RMC',
        '10 m³',
      ],
    }),
  ]);

  return { config: cfg, emailResult, whatsappResult };
}
