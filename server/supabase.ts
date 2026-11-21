import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let cachedClient: SupabaseClient | null | undefined;
let cachedConfigKey = '';

function getSupabaseConfig(): {
  url: string;
  key: string;
  usingServiceRole: boolean;
} | null {
  const url =
    process.env.SUPABASE_URL?.trim() ||
    (process.env.SUPABASE_PROJECT_ID?.trim()
      ? `https://${process.env.SUPABASE_PROJECT_ID.trim()}.supabase.co`
      : '');

  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.SUPABASE_SECRET_KEY?.trim() ||
    '';

  const publishableKey =
    process.env.SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.SUPABASE_ANON_KEY?.trim() ||
    '';

  const key = serviceKey || publishableKey;
  if (!url || !key) return null;
  return { url, key, usingServiceRole: Boolean(serviceKey) };
}

export function isSupabaseConfigured(): boolean {
  return Boolean(getSupabaseConfig());
}

export function isSupabaseServiceRoleConfigured(): boolean {
  return Boolean(getSupabaseConfig()?.usingServiceRole);
}

export function getSupabaseClient(): SupabaseClient | null {
  const cfg = getSupabaseConfig();
  if (!cfg) return null;
  const sig = `${cfg.url}:${cfg.key.slice(0, 12)}`;
  if (cachedClient && cachedConfigKey === sig) {
    return cachedClient;
  }
  cachedConfigKey = sig;
  cachedClient = createClient(cfg.url, cfg.key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  return cachedClient;
}

export interface SupabaseSyncResult {
  synced: boolean;
  code?: string;
  reason?: string;
}

export interface SupabaseFetchResult<T = Record<string, unknown>> {
  configured: boolean;
  usingServiceRole: boolean;
  canRead: boolean;
  permissionDenied: boolean;
  rows: T[];
  error?: string;
}

function isPermissionDeniedError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return (
    error.code === '42501' ||
    String(error.message || '')
      .toLowerCase()
      .includes('permission denied')
  );
}

export async function syncBookingToSupabase(
  booking: Record<string, unknown>
): Promise<SupabaseSyncResult> {
  const client = getSupabaseClient();
  if (!client) {
    return { synced: false, reason: 'Supabase not configured' };
  }

  try {
    const payload = {
      booking_code: String(booking.booking_code || ''),
      product_slug: String(booking.product_slug || ''),
      product_name: String(booking.product_name || ''),
      grade: String(booking.grade || ''),
      quantity_m3: Number(booking.quantity_m3 || 0),
      unit_type: String(booking.unit_type || 'm3'),
      usage_type: String(booking.usage_type || ''),
      slump_mm: String(booking.slump_mm || ''),
      pump_type: String(booking.pump_type || 'none'),
      delivery_date: String(booking.delivery_date || ''),
      slot_id: String(booking.slot_id || ''),
      slot_label: String(booking.slot_label || ''),
      site_address: String(booking.site_address || ''),
      landmark: String(booking.landmark || ''),
      city: String(booking.city || ''),
      site_lat: Number(booking.site_lat || 0),
      site_lng: Number(booking.site_lng || 0),
      distance_km: Number(booking.distance_km || 0),
      estimated_concrete_amount: Number(booking.estimated_concrete_amount || 0),
      estimated_delivery_fee: Number(booking.estimated_delivery_fee || 0),
      estimated_pump_fee: Number(booking.estimated_pump_fee || 0),
      estimated_total: Number(booking.estimated_total || 0),
      customer_name: String(booking.customer_name || ''),
      phone: String(booking.phone || ''),
      email: String(booking.email || ''),
      gst_number: String(booking.gst_number || ''),
      notes: String(booking.notes || ''),
      status: String(booking.status || 'confirmed'),
    };

    const { error } = await client.from('bookings').insert(payload);
    if (error) {
      return { synced: false, code: error.code, reason: error.message };
    }
    return { synced: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown Supabase error';
    return { synced: false, reason: msg };
  }
}

export async function syncBookingUpdateToSupabase(
  bookingCode: string,
  patch: Record<string, unknown>
): Promise<SupabaseSyncResult> {
  const client = getSupabaseClient();
  if (!client) {
    return { synced: false, reason: 'Supabase not configured' };
  }

  try {
    const { error } = await client
      .from('bookings')
      .update({
        ...patch,
        updated_at: new Date().toISOString(),
      })
      .eq('booking_code', bookingCode);

    if (error) {
      return { synced: false, code: error.code, reason: error.message };
    }
    return { synced: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown Supabase error';
    return { synced: false, reason: msg };
  }
}

export async function syncSiteVisitToSupabase(visit: {
  visit_code: string;
  visit_type: string;
  preferred_date: string;
  preferred_time: string;
  location: string;
  customer_name: string;
  phone: string;
  email: string;
  notes: string;
  status?: string;
}): Promise<SupabaseSyncResult> {
  const client = getSupabaseClient();
  if (!client) {
    return { synced: false, reason: 'Supabase not configured' };
  }

  try {
    const { error } = await client.from('site_visits').insert({
      visit_code: visit.visit_code,
      visit_type: visit.visit_type,
      preferred_date: visit.preferred_date,
      preferred_time: visit.preferred_time,
      location: visit.location,
      customer_name: visit.customer_name,
      phone: visit.phone,
      email: visit.email,
      notes: visit.notes,
      status: visit.status || 'scheduled',
    });

    if (error) {
      return { synced: false, code: error.code, reason: error.message };
    }
    return { synced: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown Supabase error';
    return { synced: false, reason: msg };
  }
}

export async function syncSiteVisitUpdateToSupabase(
  visitCode: string,
  patch: Record<string, unknown>
): Promise<SupabaseSyncResult> {
  const client = getSupabaseClient();
  if (!client) {
    return { synced: false, reason: 'Supabase not configured' };
  }

  try {
    const { error } = await client
      .from('site_visits')
      .update(patch)
      .eq('visit_code', visitCode);

    if (error) {
      return { synced: false, code: error.code, reason: error.message };
    }
    return { synced: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown Supabase error';
    return { synced: false, reason: msg };
  }
}

export async function syncQuoteToSupabase(quote: {
  quote_code: string;
  project_type: string;
  grade: string;
  quantity_m3: number;
  location: string;
  timeline: string;
  customer_name: string;
  phone: string;
  email: string;
  notes: string;
  attachment_name: string;
  status?: string;
}): Promise<SupabaseSyncResult> {
  const client = getSupabaseClient();
  if (!client) {
    return { synced: false, reason: 'Supabase not configured' };
  }

  try {
    const { error } = await client.from('quotes').insert({
      quote_code: quote.quote_code,
      project_type: quote.project_type,
      grade: quote.grade,
      quantity_m3: quote.quantity_m3,
      location: quote.location,
      timeline: quote.timeline,
      customer_name: quote.customer_name,
      phone: quote.phone,
      email: quote.email,
      notes: quote.notes,
      attachment_name: quote.attachment_name,
      status: quote.status || 'new',
    });

    if (error) {
      return { synced: false, code: error.code, reason: error.message };
    }
    return { synced: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown Supabase error';
    return { synced: false, reason: msg };
  }
}

export async function syncEnquiryToSupabase(enquiry: {
  type: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  company_or_role: string;
  message: string;
  consent: boolean;
  status?: string;
}): Promise<SupabaseSyncResult> {
  const client = getSupabaseClient();
  if (!client) {
    return { synced: false, reason: 'Supabase not configured' };
  }

  try {
    const { error } = await client.from('enquiries').insert({
      type: enquiry.type,
      name: enquiry.name,
      phone: enquiry.phone,
      email: enquiry.email,
      city: enquiry.city,
      company_or_role: enquiry.company_or_role,
      message: enquiry.message,
      consent: enquiry.consent,
      status: enquiry.status || 'new',
    });

    if (error) {
      return { synced: false, code: error.code, reason: error.message };
    }
    return { synced: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown Supabase error';
    return { synced: false, reason: msg };
  }
}

async function fetchTableFromSupabase(
  table: string,
  orderBy = 'created_at'
): Promise<SupabaseFetchResult> {
  const cfg = getSupabaseConfig();
  const client = getSupabaseClient();
  if (!cfg || !client) {
    return {
      configured: false,
      usingServiceRole: false,
      canRead: false,
      permissionDenied: false,
      rows: [],
    };
  }

  try {
    const { data, error } = await client
      .from(table)
      .select('*')
      .order(orderBy, { ascending: false })
      .limit(500);

    if (error) {
      const denied = isPermissionDeniedError(error);
      return {
        configured: true,
        usingServiceRole: cfg.usingServiceRole,
        canRead: false,
        permissionDenied: denied,
        rows: [],
        error: error.message,
      };
    }

    return {
      configured: true,
      usingServiceRole: cfg.usingServiceRole,
      canRead: true,
      permissionDenied: false,
      rows: Array.isArray(data) ? (data as Record<string, unknown>[]) : [],
    };
  } catch (err) {
    return {
      configured: true,
      usingServiceRole: cfg.usingServiceRole,
      canRead: false,
      permissionDenied: false,
      rows: [],
      error: err instanceof Error ? err.message : 'Unknown Supabase fetch error',
    };
  }
}

export async function fetchBookingsFromSupabase(): Promise<SupabaseFetchResult> {
  return fetchTableFromSupabase('bookings', 'created_at');
}

export async function fetchSiteVisitsFromSupabase(): Promise<SupabaseFetchResult> {
  return fetchTableFromSupabase('site_visits', 'created_at');
}

export async function fetchQuotesFromSupabase(): Promise<SupabaseFetchResult> {
  return fetchTableFromSupabase('quotes', 'created_at');
}

export async function fetchEnquiriesFromSupabase(): Promise<SupabaseFetchResult> {
  return fetchTableFromSupabase('enquiries', 'created_at');
}
