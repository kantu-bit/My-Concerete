// Supabase Edge Function: notify-lead
// Triggered by Supabase Database Webhooks (AFTER INSERT on bookings, quotes, enquiries, site_visits)
// or invoked directly from /admin -> "Resend notification".
// Sends independent Email (via Resend) and WhatsApp (via CallMeBot / Meta Cloud API / Twilio),
// updates notify_email_status, notify_whatsapp_status, and notified_at on the source table row,
// and ALWAYS returns JSON without ever failing the database insert.

declare const Deno: {
  env: { get(key: string): string | undefined };
  serve(handler: (req: Request) => Response | Promise<Response>): void;
};

type SupportedTable = 'bookings' | 'quotes' | 'enquiries' | 'site_visits';
type ChannelStatus = 'sent' | 'failed' | 'skipped';

interface ChannelOutcome {
  ok: boolean;
  status: ChannelStatus;
  provider: string;
  error?: string;
}

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'application/json',
    },
  });
}

function escapeHtml(val: unknown): string {
  return String(val ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function cleanPhoneDigits(raw: unknown): string {
  const digits = String(raw ?? '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

function formatDisplayPhone(raw: unknown): string {
  const digits = cleanPhoneDigits(raw);
  if (!digits) return 'Not provided';
  if (digits.startsWith('91') && digits.length === 12) {
    return `+91 ${digits.slice(2)}`;
  }
  return `+${digits}`;
}

function isValidEmail(raw: unknown): boolean {
  const s = String(raw ?? '').trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

interface NormalizedLead {
  table: SupportedTable;
  recordId: number | string | null;
  matchColumn: string;
  matchValue: string | null;
  referenceCode: string;
  subject: string;
  heading: string;
  customerName: string;
  phoneRaw: string;
  customerEmail: string;
  rows: Array<{ label: string; value: string; href?: string }>;
  whatsappMessage: string;
}

function normalizeRecord(table: SupportedTable, record: Record<string, unknown>): NormalizedLead {
  const recordId =
    typeof record.id === 'number' || typeof record.id === 'string' ? record.id : null;
  const createdAt = String(record.created_at || new Date().toISOString());

  if (table === 'bookings') {
    const bookingCode = String(record.booking_code || `MC-${recordId ?? 'NEW'}`);
    const name = String(record.customer_name || 'Customer');
    const phoneRaw = String(record.phone || '');
    const email = String(record.email || '');
    const product = String(record.product_name || record.product_slug || 'Ready-Mix Concrete');
    const grade = String(record.grade || '');
    const qty = `${record.quantity_m3 ?? ''} ${record.unit_type === 'pieces' ? 'pieces' : 'm³'}`.trim();
    const pump = String(record.pump_type || 'none').toUpperCase();
    const usage = String(record.usage_type || '');
    const slump = String(record.slump_mm || '');
    const deliveryDate = String(record.delivery_date || '');
    const slotLabel = String(record.slot_label || record.slot_id || '');
    const address = String(record.site_address || '');
    const landmark = String(record.landmark || '');
    const city = String(record.city || '');
    const distance = record.distance_km !== undefined ? `${record.distance_km} km` : '';
    const lat = Number(record.site_lat || 0);
    const lng = Number(record.site_lng || 0);
    const hasCoords = Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0);
    const mapUrl = hasCoords ? `https://www.google.com/maps?q=${lat},${lng}` : '';
    const estTotal = Number(record.estimated_total || 0);
    const estConc = Number(record.estimated_concrete_amount || 0);
    const estDeliv = Number(record.estimated_delivery_fee || 0);
    const estPump = Number(record.estimated_pump_fee || 0);
    const priceText =
      estTotal > 0
        ? `INR ${estTotal.toLocaleString('en-IN')} (Material: ${estConc.toLocaleString('en-IN')}, Delivery: ${estDeliv.toLocaleString('en-IN')}, Pump: ${estPump.toLocaleString('en-IN')})`
        : 'Quote on confirm';
    const notes = String(record.notes || '');
    const gst = String(record.gst_number || '');
    const status = String(record.status || 'confirmed');

    const fullSite = [address, landmark ? `Near ${landmark}` : '', city, distance ? `(${distance})` : '']
      .filter(Boolean)
      .join(', ');

    const rows: Array<{ label: string; value: string; href?: string }> = [
      { label: 'Booking ID', value: bookingCode },
      { label: 'Status', value: status.toUpperCase() },
      { label: 'Customer Name', value: name },
      { label: 'Phone', value: formatDisplayPhone(phoneRaw) },
      { label: 'Email', value: email || 'Not provided' },
      { label: 'GSTIN', value: gst || '—' },
      { label: 'Product / Grade', value: `${grade}${product ? ` (${product})` : ''}` },
      { label: 'Quantity', value: qty || '—' },
      { label: 'Pump Needed', value: pump },
      { label: 'Usage & Slump', value: [usage, slump].filter(Boolean).join(' · ') || '—' },
      { label: 'Delivery Date & Slot', value: `${deliveryDate} ${slotLabel}`.trim() || '—' },
      { label: 'Site Address', value: fullSite || '—' },
      { label: 'Map Pin Link', value: mapUrl || 'Not pinned', href: mapUrl || undefined },
      { label: 'Estimated Price', value: priceText },
      { label: 'Notes', value: notes || 'None' },
      { label: 'Time Received', value: createdAt },
    ];

    const whatsappLines = [
      '🆕 New Booking – MY CONCRETE',
      `ID: ${bookingCode}`,
      `Name: ${name}`,
      `Phone: ${formatDisplayPhone(phoneRaw)}`,
      `Product: ${grade} (${product}) | Qty: ${qty}`,
      `Pump: ${pump}${usage ? ` | Usage: ${usage}` : ''}`,
      `Date/Slot: ${deliveryDate} ${slotLabel}`.trim(),
      `Site: ${fullSite}${mapUrl ? ` (${mapUrl})` : ''}`,
      `Estimate: ${estTotal > 0 ? `INR ${estTotal.toLocaleString('en-IN')}` : 'Quote on confirm'}`,
      notes ? `Notes: ${notes}` : '',
      `Received: ${createdAt}`,
    ].filter(Boolean);

    return {
      table,
      recordId,
      matchColumn: record.booking_code ? 'booking_code' : 'id',
      matchValue: record.booking_code ? String(record.booking_code) : recordId !== null ? String(recordId) : null,
      referenceCode: bookingCode,
      subject: `New Booking ${bookingCode} – ${name} – ${deliveryDate} ${slotLabel}`.trim(),
      heading: `New Delivery Booking: ${bookingCode}`,
      customerName: name,
      phoneRaw,
      customerEmail: email,
      rows,
      whatsappMessage: whatsappLines.join('\n'),
    };
  }

  if (table === 'quotes') {
    const quoteCode = String(record.quote_code || `QT-${recordId ?? 'NEW'}`);
    const name = String(record.customer_name || 'Customer');
    const phoneRaw = String(record.phone || '');
    const email = String(record.email || '');
    const projectType = String(record.project_type || '');
    const grade = String(record.grade || '');
    const qty = String(record.quantity_m3 ?? '');
    const location = String(record.location || '');
    const timeline = String(record.timeline || '');
    const attachment = String(record.attachment_name || '');
    const notes = String(record.notes || '');
    const status = String(record.status || 'new');

    const rows: Array<{ label: string; value: string; href?: string }> = [
      { label: 'Quote ID', value: quoteCode },
      { label: 'Status', value: status.toUpperCase() },
      { label: 'Customer Name', value: name },
      { label: 'Phone', value: formatDisplayPhone(phoneRaw) },
      { label: 'Email', value: email || 'Not provided' },
      { label: 'Project Type', value: projectType || '—' },
      { label: 'Product / Grade', value: grade || '—' },
      { label: 'Quantity (m³ / units)', value: qty || '—' },
      { label: 'Site Location', value: location || '—' },
      { label: 'Delivery Timeline', value: timeline || '—' },
      { label: 'Attachment', value: attachment || 'None' },
      { label: 'Notes', value: notes || 'None' },
      { label: 'Time Received', value: createdAt },
    ];

    const whatsappLines = [
      '🆕 New Quote Request – MY CONCRETE',
      `ID: ${quoteCode}`,
      `Name: ${name}`,
      `Phone: ${formatDisplayPhone(phoneRaw)}`,
      `Product: ${grade} | Qty: ${qty}`,
      `Project: ${projectType} | Timeline: ${timeline}`,
      `Site: ${location}`,
      notes ? `Notes: ${notes}` : '',
      `Received: ${createdAt}`,
    ].filter(Boolean);

    return {
      table,
      recordId,
      matchColumn: record.quote_code ? 'quote_code' : 'id',
      matchValue: record.quote_code ? String(record.quote_code) : recordId !== null ? String(recordId) : null,
      referenceCode: quoteCode,
      subject: `New Quote Request – ${name}`,
      heading: `New Quote Request: ${quoteCode}`,
      customerName: name,
      phoneRaw,
      customerEmail: email,
      rows,
      whatsappMessage: whatsappLines.join('\n'),
    };
  }

  if (table === 'site_visits') {
    const visitCode = String(record.visit_code || `SV-${recordId ?? 'NEW'}`);
    const name = String(record.customer_name || 'Visitor');
    const phoneRaw = String(record.phone || '');
    const email = String(record.email || '');
    const visitType = String(record.visit_type || 'plant_tour').replace(/_/g, ' ');
    const prefDate = String(record.preferred_date || '');
    const prefTime = String(record.preferred_time || '');
    const location = String(record.location || 'Kotihal Plant');
    const notes = String(record.notes || '');
    const status = String(record.status || 'scheduled');

    const rows: Array<{ label: string; value: string; href?: string }> = [
      { label: 'Visit ID', value: visitCode },
      { label: 'Status', value: status.toUpperCase() },
      { label: 'Visit Type', value: visitType },
      { label: 'Customer Name', value: name },
      { label: 'Phone', value: formatDisplayPhone(phoneRaw) },
      { label: 'Email', value: email || 'Not provided' },
      { label: 'Preferred Date & Slot', value: `${prefDate} ${prefTime}`.trim() || '—' },
      { label: 'Location', value: location },
      { label: 'Notes', value: notes || 'None' },
      { label: 'Time Received', value: createdAt },
    ];

    const whatsappLines = [
      '🆕 New Site / Plant Visit – MY CONCRETE',
      `ID: ${visitCode}`,
      `Name: ${name}`,
      `Phone: ${formatDisplayPhone(phoneRaw)}`,
      `Type: ${visitType}`,
      `Date/Slot: ${prefDate} ${prefTime}`.trim(),
      `Location: ${location}`,
      notes ? `Notes: ${notes}` : '',
      `Received: ${createdAt}`,
    ].filter(Boolean);

    return {
      table,
      recordId,
      matchColumn: record.visit_code ? 'visit_code' : 'id',
      matchValue: record.visit_code ? String(record.visit_code) : recordId !== null ? String(recordId) : null,
      referenceCode: visitCode,
      subject: `New Site Visit ${visitCode} – ${name} – ${prefDate} ${prefTime}`.trim(),
      heading: `New Site / Plant Visit: ${visitCode}`,
      customerName: name,
      phoneRaw,
      customerEmail: email,
      rows,
      whatsappMessage: whatsappLines.join('\n'),
    };
  }

  // enquiries
  const enqId = `ENQ-${recordId ?? 'NEW'}`;
  const enqType = String(record.type || 'contact');
  const name = String(record.name || 'Enquiry Lead');
  const phoneRaw = String(record.phone || '');
  const email = String(record.email || '');
  const city = String(record.city || '');
  const companyOrRole = String(record.company_or_role || '');
  const message = String(record.message || '');
  const status = String(record.status || 'new');

  const rows: Array<{ label: string; value: string; href?: string }> = [
    { label: 'Enquiry ID', value: enqId },
    { label: 'Enquiry Type', value: enqType.toUpperCase() },
    { label: 'Status', value: status.toUpperCase() },
    { label: 'Name', value: name },
    { label: 'Phone', value: formatDisplayPhone(phoneRaw) },
    { label: 'Email', value: email || 'Not provided' },
    { label: 'City / Location', value: city || '—' },
    { label: 'Company / Role', value: companyOrRole || '—' },
    { label: 'Message / Notes', value: message || '—' },
    { label: 'Time Received', value: createdAt },
  ];

  const whatsappLines = [
    `🆕 New ${enqType.toUpperCase()} Enquiry – MY CONCRETE`,
    `ID: ${enqId}`,
    `Name: ${name}`,
    `Phone: ${formatDisplayPhone(phoneRaw)}`,
    city ? `Site/City: ${city}` : '',
    companyOrRole ? `Company/Role: ${companyOrRole}` : '',
    message ? `Notes: ${message}` : '',
    `Received: ${createdAt}`,
  ].filter(Boolean);

  return {
    table: 'enquiries',
    recordId,
    matchColumn: 'id',
    matchValue: recordId !== null ? String(recordId) : null,
    referenceCode: enqId,
    subject: `New ${enqType.charAt(0).toUpperCase() + enqType.slice(1)} Enquiry – ${name}`,
    heading: `New ${enqType.toUpperCase()} Enquiry`,
    customerName: name,
    phoneRaw,
    customerEmail: email,
    rows,
    whatsappMessage: whatsappLines.join('\n'),
  };
}

function buildEmailBodies(lead: NormalizedLead): { html: string; text: string } {
  const digits = cleanPhoneDigits(lead.phoneRaw);
  const telHref = digits ? `tel:+${digits}` : '';
  const waHref = digits ? `https://wa.me/${digits}` : '';
  const appUrl = (Deno.env.get('APP_URL') || Deno.env.get('ADMIN_URL') || '').trim().replace(/\/+$/, '');
  const adminHref = appUrl
    ? `${appUrl}/admin?tab=${lead.table === 'bookings' ? 'bookings' : 'inbox'}&ref=${encodeURIComponent(lead.referenceCode)}`
    : '';

  const textLines = [
    lead.subject,
    '====================================================',
    ...lead.rows.map((r) => `${r.label}: ${r.value}`),
    '',
    telHref ? `Call Customer: ${telHref}` : '',
    waHref ? `WhatsApp Customer: ${waHref}` : '',
    adminHref ? `Open in Admin: ${adminHref}` : '',
  ].filter(Boolean);

  const tableRowsHtml = lead.rows
    .map(
      (r) => `
      <tr>
        <td style="padding:8px 12px;border:1px solid #d7e4ff;background:#f8faff;font-weight:600;color:#0f1f5c;width:34%;vertical-align:top;">
          ${escapeHtml(r.label)}
        </td>
        <td style="padding:8px 12px;border:1px solid #d7e4ff;color:#1e293b;vertical-align:top;">
          ${
            r.href
              ? `<a href="${escapeHtml(r.href)}" style="color:#1f3fa8;font-weight:600;">${escapeHtml(r.value)}</a>`
              : escapeHtml(r.value).replace(/\n/g, '<br/>')
          }
        </td>
      </tr>`
    )
    .join('');

  const actionButtons = [
    telHref
      ? `<a href="${escapeHtml(telHref)}" style="display:inline-block;background:#1f3fa8;color:#ffffff;text-decoration:none;padding:10px 16px;border-radius:8px;font-weight:700;margin-right:8px;">Call ${escapeHtml(formatDisplayPhone(lead.phoneRaw))}</a>`
      : '',
    waHref
      ? `<a href="${escapeHtml(waHref)}" style="display:inline-block;background:#16a34a;color:#ffffff;text-decoration:none;padding:10px 16px;border-radius:8px;font-weight:700;margin-right:8px;">WhatsApp Customer</a>`
      : '',
    adminHref
      ? `<a href="${escapeHtml(adminHref)}" style="display:inline-block;background:#d92b25;color:#ffffff;text-decoration:none;padding:10px 16px;border-radius:8px;font-weight:700;">Open in Admin</a>`
      : '',
  ]
    .filter(Boolean)
    .join('');

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:680px;margin:0 auto;padding:16px;background:#ffffff;color:#0f172a;">
    <div style="background:#0f1f5c;color:#ffffff;padding:16px 20px;border-radius:10px 10px 0 0;">
      <p style="margin:0;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#ffc93c;font-weight:700;">MY CONCRETE – Supabase Lead Alert</p>
      <h2 style="margin:6px 0 0;font-size:18px;line-height:1.3;">${escapeHtml(lead.heading)}</h2>
    </div>
    <div style="border:1px solid #d7e4ff;border-top:none;padding:18px 20px;border-radius:0 0 10px 10px;">
      ${actionButtons ? `<div style="margin-bottom:16px;">${actionButtons}</div>` : ''}
      <table style="width:100%;border-collapse:collapse;font-size:13px;line-height:1.45;">
        ${tableRowsHtml}
      </table>
    </div>
  </div>`;

  return { html, text: textLines.join('\n') };
}

async function sendResendEmail(lead: NormalizedLead): Promise<ChannelOutcome> {
  const apiKey = (Deno.env.get('RESEND_API_KEY') || '').trim();
  const notifyEmail = (Deno.env.get('NOTIFY_EMAIL') || 'myconcretektl@gmail.com').trim();
  const fromEmail = (Deno.env.get('RESEND_FROM') || 'MY CONCRETE Dispatch <onboarding@resend.dev>').trim();

  if (!apiKey) {
    return {
      ok: false,
      status: 'skipped',
      provider: 'resend',
      error: 'RESEND_API_KEY secret is not configured.',
    };
  }

  const { html, text } = buildEmailBodies(lead);

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [notifyEmail],
        subject: lead.subject,
        html,
        text,
        ...(isValidEmail(lead.customerEmail) ? { reply_to: lead.customerEmail.trim() } : {}),
      }),
    });

    if (res.ok) {
      if (isValidEmail(lead.customerEmail) && lead.customerEmail.trim().toLowerCase() !== notifyEmail.toLowerCase()) {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: fromEmail,
            to: [lead.customerEmail.trim()],
            subject: `MY CONCRETE Request Received – Ref ${lead.referenceCode}`,
            html,
            text,
          }),
        }).catch(() => {});
      }
      return { ok: true, status: 'sent', provider: 'resend' };
    }

    const errText = await res.text().catch(() => '');
    return {
      ok: false,
      status: 'failed',
      provider: 'resend',
      error: `Resend HTTP ${res.status}: ${errText.slice(0, 240)}`,
    };
  } catch (err) {
    return {
      ok: false,
      status: 'failed',
      provider: 'resend',
      error: err instanceof Error ? err.message : 'Resend request failed',
    };
  }
}

async function sendSingleWhatsApp(
  provider: string,
  targetPhone: string,
  message: string,
  isSecond = false
): Promise<ChannelOutcome> {
  if (provider === 'callmebot') {
    const phone = isSecond
      ? targetPhone
      : cleanPhoneDigits(Deno.env.get('CALLMEBOT_PHONE')) || targetPhone;
    const apiKey = (
      isSecond
        ? Deno.env.get('CALLMEBOT_APIKEY_2') || Deno.env.get('CALLMEBOT_APIKEY')
        : Deno.env.get('CALLMEBOT_APIKEY')
    )?.trim();

    if (!apiKey) {
      return {
        ok: false,
        status: 'skipped',
        provider: 'callmebot',
        error: 'CALLMEBOT_APIKEY secret is not configured.',
      };
    }

    const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(phone)}&text=${encodeURIComponent(
      message.slice(0, 1500)
    )}&apikey=${encodeURIComponent(apiKey)}`;
    const res = await fetch(url);
    if (res.ok) {
      return { ok: true, status: 'sent', provider: 'callmebot' };
    }
    const errText = await res.text().catch(() => '');
    return {
      ok: false,
      status: 'failed',
      provider: 'callmebot',
      error: `CallMeBot HTTP ${res.status}: ${errText.slice(0, 200)}`,
    };
  }

  if (provider === 'cloudapi') {
    const token = (Deno.env.get('WHATSAPP_TOKEN') || '').trim();
    const phoneId = (Deno.env.get('WHATSAPP_PHONE_ID') || '').trim();
    const templateName = (Deno.env.get('WHATSAPP_TEMPLATE_NAME') || '').trim();

    if (!token || !phoneId) {
      return {
        ok: false,
        status: 'skipped',
        provider: 'cloudapi',
        error: 'WHATSAPP_TOKEN / WHATSAPP_PHONE_ID secrets are not configured.',
      };
    }

    const bodyPayload = templateName
      ? {
          messaging_product: 'whatsapp',
          to: targetPhone,
          type: 'template',
          template: {
            name: templateName,
            language: { code: 'en' },
            components: [
              {
                type: 'body',
                parameters: [{ type: 'text', text: message.slice(0, 900) }],
              },
            ],
          },
        }
      : {
          messaging_product: 'whatsapp',
          to: targetPhone,
          type: 'text',
          text: { body: message.slice(0, 3500) },
        };

    const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bodyPayload),
    });

    if (res.ok) {
      return { ok: true, status: 'sent', provider: 'cloudapi' };
    }
    const errText = await res.text().catch(() => '');
    return {
      ok: false,
      status: 'failed',
      provider: 'cloudapi',
      error: `Cloud API HTTP ${res.status}: ${errText.slice(0, 240)}`,
    };
  }

  if (provider === 'twilio') {
    const sid = (Deno.env.get('TWILIO_SID') || '').trim();
    const token = (Deno.env.get('TWILIO_TOKEN') || '').trim();
    const from = (Deno.env.get('TWILIO_FROM') || '').trim();

    if (!sid || !token || !from) {
      return {
        ok: false,
        status: 'skipped',
        provider: 'twilio',
        error: 'TWILIO_SID / TWILIO_TOKEN / TWILIO_FROM secrets are not configured.',
      };
    }

    const form = new URLSearchParams({
      From: from.startsWith('whatsapp:') ? from : `whatsapp:${from}`,
      To: `whatsapp:+${targetPhone}`,
      Body: message.slice(0, 1500),
    });
    const auth = btoa(`${sid}:${token}`);
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form.toString(),
    });
    if (res.ok) {
      return { ok: true, status: 'sent', provider: 'twilio' };
    }
    const errText = await res.text().catch(() => '');
    return {
      ok: false,
      status: 'failed',
      provider: 'twilio',
      error: `Twilio HTTP ${res.status}: ${errText.slice(0, 240)}`,
    };
  }

  return {
    ok: true,
    status: 'skipped',
    provider: 'none',
    error: 'WHATSAPP_PROVIDER is set to none.',
  };
}

async function sendWhatsAppAlert(lead: NormalizedLead): Promise<ChannelOutcome> {
  const provider = (Deno.env.get('WHATSAPP_PROVIDER') || 'none').trim().toLowerCase();
  if (!['callmebot', 'cloudapi', 'twilio'].includes(provider)) {
    return {
      ok: true,
      status: 'skipped',
      provider: 'none',
      error: 'WHATSAPP_PROVIDER is set to none.',
    };
  }

  const primary = cleanPhoneDigits(Deno.env.get('OWNER_WHATSAPP') || Deno.env.get('CALLMEBOT_PHONE')) || '917337807372';
  const secondary = cleanPhoneDigits(Deno.env.get('OWNER_WHATSAPP_2'));

  try {
    const primaryRes = await sendSingleWhatsApp(provider, primary, lead.whatsappMessage, false);
    if (secondary && secondary !== primary) {
      await sendSingleWhatsApp(provider, secondary, lead.whatsappMessage, true).catch(() => {});
    }
    return primaryRes;
  } catch (err) {
    return {
      ok: false,
      status: 'failed',
      provider,
      error: err instanceof Error ? err.message : 'WhatsApp delivery error',
    };
  }
}

async function updateSupabaseNotifyStatus(
  table: SupportedTable,
  matchColumn: string,
  matchValue: string | null,
  patch: {
    notify_email_status: ChannelStatus;
    notify_whatsapp_status: ChannelStatus;
    notified_at: string;
  }
): Promise<{ updated: boolean; error?: string }> {
  const supabaseUrl = (Deno.env.get('SUPABASE_URL') || '').trim().replace(/\/+$/, '');
  const serviceKey = (Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '').trim();
  if (!supabaseUrl || !serviceKey || !matchValue) {
    return { updated: false, error: 'Missing SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or row identifier' };
  }

  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/${table}?${encodeURIComponent(matchColumn)}=eq.${encodeURIComponent(matchValue)}`,
      {
        method: 'PATCH',
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify(patch),
      }
    );
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      return { updated: false, error: `REST PATCH HTTP ${res.status}: ${errText.slice(0, 200)}` };
    }
    return { updated: true };
  } catch (err) {
    return { updated: false, error: err instanceof Error ? err.message : 'REST PATCH failed' };
  }
}

async function fetchRecordFromSupabase(
  table: SupportedTable,
  id?: number | string,
  code?: string
): Promise<Record<string, unknown> | null> {
  const supabaseUrl = (Deno.env.get('SUPABASE_URL') || '').trim().replace(/\/+$/, '');
  const serviceKey = (Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '').trim();
  if (!supabaseUrl || !serviceKey) return null;

  let query = '';
  if (id !== undefined && id !== null && String(id) !== '') {
    query = `id=eq.${encodeURIComponent(String(id))}`;
  } else if (code) {
    const codeCol =
      table === 'bookings' ? 'booking_code' : table === 'quotes' ? 'quote_code' : 'visit_code';
    query = `${codeCol}=eq.${encodeURIComponent(code)}`;
  } else {
    return null;
  }

  const res = await fetch(`${supabaseUrl}/rest/v1/${table}?${query}&limit=1`, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    },
  });
  if (!res.ok) return null;
  const rows = (await res.json().catch(() => [])) as Array<Record<string, unknown>>;
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'Method not allowed. Use POST.' }, 405);
  }

  const expectedSecret = (Deno.env.get('WEBHOOK_SECRET') || '').trim();
  if (expectedSecret) {
    const gotSecret = (req.headers.get('x-webhook-secret') || '').trim();
    if (gotSecret !== expectedSecret) {
      return jsonResponse({ ok: false, error: 'Unauthorized webhook secret.' }, 401);
    }
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return jsonResponse({ ok: false, error: 'Invalid JSON body.' }, 400);
  }

  const rawTable = String(body.table || '').trim().toLowerCase();
  if (!['bookings', 'quotes', 'enquiries', 'site_visits'].includes(rawTable)) {
    return jsonResponse(
      { ok: false, error: `Unsupported or missing table "${rawTable}". Expected bookings, quotes, enquiries, or site_visits.` },
      400
    );
  }
  const table = rawTable as SupportedTable;

  let record =
    body.record && typeof body.record === 'object'
      ? (body.record as Record<string, unknown>)
      : null;

  if (!record) {
    record = await fetchRecordFromSupabase(
      table,
      body.id as number | string | undefined,
      typeof body.code === 'string' ? body.code : undefined
    );
  }

  if (!record) {
    return jsonResponse({ ok: false, error: 'Missing record payload and could not locate row.' }, 400);
  }

  const lead = normalizeRecord(table, record);

  const [emailSettled, waSettled] = await Promise.allSettled([
    sendResendEmail(lead),
    sendWhatsAppAlert(lead),
  ]);

  const emailResult: ChannelOutcome =
    emailSettled.status === 'fulfilled'
      ? emailSettled.value
      : {
          ok: false,
          status: 'failed',
          provider: 'resend',
          error: emailSettled.reason instanceof Error ? emailSettled.reason.message : 'Email promise rejected',
        };

  const whatsappResult: ChannelOutcome =
    waSettled.status === 'fulfilled'
      ? waSettled.value
      : {
          ok: false,
          status: 'failed',
          provider: Deno.env.get('WHATSAPP_PROVIDER') || 'none',
          error: waSettled.reason instanceof Error ? waSettled.reason.message : 'WhatsApp promise rejected',
        };

  const notifiedAt = new Date().toISOString();
  const statusUpdate = await updateSupabaseNotifyStatus(
    table,
    lead.matchColumn,
    lead.matchValue,
    {
      notify_email_status: emailResult.status,
      notify_whatsapp_status: whatsappResult.status,
      notified_at: notifiedAt,
    }
  );

  return jsonResponse({
    ok: true,
    table,
    recordId: lead.recordId,
    referenceCode: lead.referenceCode,
    notify_email_status: emailResult.status,
    notify_whatsapp_status: whatsappResult.status,
    notified_at: notifiedAt,
    emailResult,
    whatsappResult,
    supabaseRowUpdated: statusUpdate.updated,
    ...(statusUpdate.error ? { supabaseUpdateError: statusUpdate.error } : {}),
  });
});
