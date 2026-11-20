import 'dotenv/config';
import crypto from 'node:crypto';
import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db.ts';
import {
  DEFAULT_BUSINESS_CONFIG,
  DEFAULT_CUSTOMER_PAGES,
  DEFAULT_HERO_SLIDES,
  DEFAULT_SCHEDULING_CONFIG,
  DEFAULT_STATS,
  seedDatabase,
} from './server/seed.ts';
import {
  type AuthedRequest,
  LOCKOUT_DURATION_MS,
  MAX_FAILED_ATTEMPTS,
  clearAdminSessionCookie,
  createAdminSession,
  getClientIp,
  getSetting,
  hashToken,
  haversineDistanceKm,
  logAdminLogin,
  rateLimit,
  requireAdmin,
  requireOwner,
  sanitizeMultiline,
  sanitizeText,
  sendNotificationEmail,
  setSetting,
} from './server/helpers.ts';

try {
  seedDatabase();
} catch (err) {
  console.error('Database initialization warning:', err);
}

const app = express();
app.set('trust proxy', 1);
app.use(express.json({ limit: '10mb' }));

function asyncRoute(
  fn: (req: AuthedRequest, res: express.Response, next: express.NextFunction) => Promise<void> | void
) {
  return (req: AuthedRequest, res: express.Response, next: express.NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

const indianPhoneRegex = /^[6-9]\d{9}$/;

function mapProductRow(row: Record<string, unknown>) {
  return {
    id: Number(row.id),
    slug: String(row.slug),
    name: String(row.name),
    tagline: String(row.tagline),
    category: String(row.category),
    unitType: (String(row.unit_type || 'm3') as 'm3' | 'pieces'),
    isOffered: Boolean(row.is_offered),
    sortOrder: Number(row.sort_order),
    overview: String(row.overview),
    properties: JSON.parse(String(row.properties_json || '[]')),
    uses: JSON.parse(String(row.uses_json || '[]')),
    grades: JSON.parse(String(row.grades_json || '[]')),
    faqs: JSON.parse(String(row.faqs_json || '[]')),
    imageUrl: String(row.image_url || ''),
  };
}

function getSlotStatusForDate(dateStr: string) {
  const scheduling = getSetting('schedulingConfig', DEFAULT_SCHEDULING_CONFIG);
  const parsedDate = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(parsedDate.getTime())) {
    return { valid: false, reason: 'Invalid date', slots: [] };
  }
  const dayOfWeek = parsedDate.getDay();
  const isClosedDay = scheduling.closedDays.includes(dayOfWeek);
  const isHoliday = scheduling.holidays.includes(dateStr);

  const activeBookings = db
    .prepare(
      `SELECT slot_id, COUNT(*) AS booking_count,
              COALESCE(SUM(CASE WHEN unit_type = 'm3' THEN quantity_m3 ELSE 0 END), 0) AS total_m3
       FROM bookings
       WHERE delivery_date = ? AND status IN ('confirmed', 'approved', 'dispatched')
       GROUP BY slot_id`
    )
    .all(dateStr) as Array<{ slot_id: string; booking_count: number; total_m3: number }>;

  const usageMap = new Map(activeBookings.map((r) => [r.slot_id, r]));

  const slots = scheduling.slots.map((slot) => {
    const used = usageMap.get(slot.id);
    const bookedCount = used ? Number(used.booking_count) : 0;
    const bookedVolumeM3 = used ? Number(used.total_m3) : 0;
    const remainingBookings = Math.max(0, slot.maxBookings - bookedCount);
    const remainingVolumeM3 = Math.max(0, Math.round((slot.maxVolumeM3 - bookedVolumeM3) * 10) / 10);
    const isFull = remainingBookings <= 0 || remainingVolumeM3 < 1;

    return {
      ...slot,
      bookedCount,
      bookedVolumeM3,
      remainingBookings,
      remainingVolumeM3,
      isFull,
    };
  });

  return {
    valid: !isClosedDay && !isHoliday,
    isClosedDay,
    isHoliday,
    reason: isHoliday ? 'Plant Holiday' : isClosedDay ? 'Plant Closed Day' : null,
    slots,
  };
}

function computeDistanceAndEstimate(params: {
  productSlug: string;
  grade: string;
  quantityM3: number;
  pumpType: 'none' | 'line' | 'boom';
  siteLat: number;
  siteLng: number;
}) {
  const biz = getSetting('businessConfig', DEFAULT_BUSINESS_CONFIG);
  const productRow = db
    .prepare(`SELECT * FROM products WHERE slug = ?`)
    .get(params.productSlug) as Record<string, unknown> | undefined;

  const unitType = productRow ? String(productRow.unit_type || 'm3') : 'm3';
  let unitRate = 0;
  if (productRow) {
    const grades = JSON.parse(String(productRow.grades_json || '[]')) as Array<{
      grade: string;
      indicativeRate: number;
    }>;
    const matched = grades.find((g) => g.grade === params.grade) || grades[0];
    if (matched) unitRate = Number(matched.indicativeRate || 0);
  }

  const distanceKm = haversineDistanceKm(
    Number(biz.plantLat),
    Number(biz.plantLng),
    params.siteLat,
    params.siteLng
  );
  const chargeableKm = Math.max(0, distanceKm - Number(biz.freeRadiusKm));
  const estimatedDeliveryFee = Math.round(
    Number(biz.baseDeliveryFee) + chargeableKm * Number(biz.perKmRate)
  );
  const estimatedPumpFee =
    unitType === 'pieces'
      ? 0
      : params.pumpType === 'line'
        ? Number(biz.linePumpCharge)
        : params.pumpType === 'boom'
          ? Number(biz.boomPumpCharge)
          : 0;
  const estimatedConcreteAmount = Math.round(unitRate * params.quantityM3);
  const estimatedTotal = estimatedConcreteAmount + estimatedDeliveryFee + estimatedPumpFee;

  return {
    unitType,
    distanceKm,
    withinServiceRadius: distanceKm <= Number(biz.serviceRadiusKm),
    serviceRadiusKm: Number(biz.serviceRadiusKm),
    unitRate,
    estimatedConcreteAmount,
    estimatedDeliveryFee,
    estimatedPumpFee,
    estimatedTotal,
  };
}

// ---------------- PUBLIC BOOTSTRAP & CONTENT ROUTES ----------------

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get(
  '/api/bootstrap',
  asyncRoute((_req, res) => {
    const businessConfig = getSetting('businessConfig', DEFAULT_BUSINESS_CONFIG);
    const schedulingConfig = getSetting('schedulingConfig', DEFAULT_SCHEDULING_CONFIG);
    const heroSlides = getSetting('heroSlides', DEFAULT_HERO_SLIDES);
    const statsItems = getSetting('statsItems', DEFAULT_STATS);
    const customerPages = getSetting('customerPages', DEFAULT_CUSTOMER_PAGES);

    const products = db
      .prepare(`SELECT * FROM products ORDER BY sort_order ASC, id ASC`)
      .all()
      .map((r) => mapProductRow(r as Record<string, unknown>));

    const projects = db
      .prepare(`SELECT * FROM projects ORDER BY sort_order ASC, id ASC`)
      .all();

    const media = db
      .prepare(`SELECT * FROM media_items ORDER BY sort_order ASC, id ASC`)
      .all();

    const blogs = db
      .prepare(`SELECT * FROM blogs WHERE published = 1 ORDER BY published_at DESC, id DESC`)
      .all();

    const testimonials = db
      .prepare(`SELECT * FROM testimonials WHERE published = 1 ORDER BY id DESC`)
      .all();

    res.json({
      businessConfig,
      schedulingConfig,
      heroSlides,
      statsItems,
      customerPages,
      products,
      projects,
      media,
      blogs,
      testimonials,
    });
  })
);

app.get(
  '/api/availability',
  asyncRoute((req, res) => {
    const dateStr = String(req.query.date || '');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      res.status(400).json({ error: 'Valid YYYY-MM-DD date is required' });
      return;
    }
    res.json(getSlotStatusForDate(dateStr));
  })
);

app.post(
  '/api/estimate',
  asyncRoute((req, res) => {
    const schema = z.object({
      productSlug: z.string().min(1),
      grade: z.string().min(1),
      quantityM3: z.number().min(1).max(200000),
      pumpType: z.enum(['none', 'line', 'boom']),
      siteLat: z.number().min(-90).max(90),
      siteLng: z.number().min(-180).max(180),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid estimation parameters' });
      return;
    }
    res.json(computeDistanceAndEstimate(parsed.data));
  })
);

// ---------------- BOOKING ENGINE (ATOMIC TRANSACTION) ----------------

const bookingSchema = z.object({
  productSlug: z.string().min(1).max(100),
  grade: z.string().min(1).max(80),
  quantityM3: z.number().min(1).max(200000),
  usageType: z.string().min(1).max(80),
  slumpMm: z.string().min(1).max(40),
  pumpType: z.enum(['none', 'line', 'boom']),
  deliveryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  slotId: z.string().min(1).max(40),
  siteAddress: z.string().min(5).max(300),
  landmark: z.string().max(150).optional().default(''),
  city: z.string().min(2).max(80),
  siteLat: z.number().min(-90).max(90),
  siteLng: z.number().min(-180).max(180),
  customerName: z.string().min(2).max(120),
  phone: z.string().regex(indianPhoneRegex, 'Enter a valid 10-digit Indian mobile number'),
  email: z.string().email().or(z.literal('')).optional().default(''),
  gstNumber: z.string().max(25).optional().default(''),
  notes: z.string().max(600).optional().default(''),
  allowWaitlist: z.boolean().optional().default(false),
  website_url: z.string().optional().default(''),
});

app.post(
  '/api/bookings',
  rateLimit(15, 60_000),
  asyncRoute(async (req, res) => {
    const parsed = bookingSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: parsed.error.issues[0]?.message || 'Please check all required booking fields.',
      });
      return;
    }

    const data = parsed.data;
    if (data.website_url.trim().length > 0) {
      res.status(400).json({ error: 'Spam check triggered.' });
      return;
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    if (data.deliveryDate < todayStr) {
      res.status(400).json({ error: 'Delivery date cannot be in the past.' });
      return;
    }

    let productRow: Record<string, unknown> | undefined;
    let unitType = 'm3';
    let scheduling = DEFAULT_SCHEDULING_CONFIG;
    let slotMeta = scheduling.slots[0];
    let biz = DEFAULT_BUSINESS_CONFIG;
    let estimate = {
      unitType: 'm3',
      distanceKm: 0,
      withinServiceRadius: true,
      serviceRadiusKm: DEFAULT_BUSINESS_CONFIG.serviceRadiusKm,
      unitRate: 0,
      estimatedConcreteAmount: 0,
      estimatedDeliveryFee: 0,
      estimatedPumpFee: 0,
      estimatedTotal: 0,
    };

    try {
      productRow = db
        .prepare(`SELECT * FROM products WHERE slug = ? AND is_offered = 1`)
        .get(data.productSlug) as Record<string, unknown> | undefined;
      if (!productRow) {
        res.status(400).json({ error: 'Selected product is currently unavailable.' });
        return;
      }

      unitType = String(productRow.unit_type || 'm3');
      scheduling = getSetting('schedulingConfig', DEFAULT_SCHEDULING_CONFIG);
      const foundSlot = scheduling.slots.find((s) => s.id === data.slotId);
      if (!foundSlot) {
        res.status(400).json({ error: 'Invalid delivery time slot.' });
        return;
      }
      slotMeta = foundSlot;
      estimate = computeDistanceAndEstimate({
        productSlug: data.productSlug,
        grade: data.grade,
        quantityM3: data.quantityM3,
        pumpType: data.pumpType,
        siteLat: data.siteLat,
        siteLng: data.siteLng,
      });
      biz = getSetting('businessConfig', DEFAULT_BUSINESS_CONFIG);
    } catch (dbInitErr) {
      console.error('Booking pre-check DB unavailable, using email fallback:', dbInitErr);
      const year = data.deliveryDate.slice(0, 4);
      const fallbackCode = `MC-${year}-EML${String(Date.now()).slice(-4)}`;
      const unitLabel = data.productSlug.includes('brick') ? 'pieces' : 'm³';
      const fallbackText = [
        `Booking Reference (Email Fallback): ${fallbackCode}`,
        `Customer: ${data.customerName} (${data.phone})`,
        `Product & Grade: ${data.grade} (${data.productSlug})`,
        `Quantity: ${data.quantityM3} ${unitLabel} | Pump: ${data.pumpType}`,
        `Schedule: ${data.deliveryDate} (${data.slotId})`,
        `Site: ${data.siteAddress}, ${data.city}`,
        `Notes: ${data.notes || 'None'}`,
      ].join('\n');
      await sendNotificationEmail(
        process.env.OWNER_ALERT_EMAIL || 'myconcretektl@gmail.com',
        `MY CONCRETE Fallback Booking ${fallbackCode} – ${data.customerName}`,
        fallbackText
      );
      res.status(201).json({
        fallback: 'email',
        booking: {
          id: 0,
          booking_code: fallbackCode,
          product_slug: data.productSlug,
          product_name: data.productSlug,
          grade: data.grade,
          quantity_m3: data.quantityM3,
          unit_type: unitLabel === 'pieces' ? 'pieces' : 'm3',
          usage_type: data.usageType,
          slump_mm: data.slumpMm,
          pump_type: data.pumpType,
          delivery_date: data.deliveryDate,
          slot_id: data.slotId,
          slot_label: data.slotId,
          site_address: data.siteAddress,
          landmark: data.landmark,
          city: data.city,
          distance_km: 0,
          estimated_concrete_amount: 0,
          estimated_delivery_fee: 0,
          estimated_pump_fee: 0,
          estimated_total: 0,
          customer_name: data.customerName,
          phone: data.phone,
          email: data.email,
          status: 'confirmed',
          created_at: new Date().toISOString(),
        },
      });
      return;
    }

    let createdBooking: Record<string, unknown> | null = null;
    let transactionError: { status: number; payload: Record<string, unknown> } | null = null;

    try {
      db.exec('BEGIN IMMEDIATE');

      const dateAvailability = getSlotStatusForDate(data.deliveryDate);
      if (!dateAvailability.valid) {
        transactionError = {
          status: 400,
          payload: {
            error: `Deliveries are unavailable on ${data.deliveryDate} (${dateAvailability.reason}).`,
          },
        };
        db.exec('ROLLBACK');
      } else {
        const duplicateRow = db
          .prepare(
            `SELECT booking_code FROM bookings
             WHERE phone = ? AND delivery_date = ? AND slot_id = ? AND status NOT IN ('cancelled', 'rejected')`
          )
          .get(data.phone, data.deliveryDate, data.slotId) as { booking_code: string } | undefined;

        if (duplicateRow) {
          transactionError = {
            status: 409,
            payload: {
              error: `A booking (${duplicateRow.booking_code}) already exists for this phone number in the selected date and slot. Use Track / Manage Booking to update it.`,
              code: 'DUPLICATE_BOOKING',
              existingBookingCode: duplicateRow.booking_code,
            },
          };
          db.exec('ROLLBACK');
        } else {
          const currentSlot = dateAvailability.slots.find((s) => s.id === data.slotId);
          const wouldExceedBookings = !currentSlot || currentSlot.remainingBookings <= 0;
          const wouldExceedVolume =
            unitType === 'm3' &&
            (!currentSlot || currentSlot.bookedVolumeM3 + data.quantityM3 > currentSlot.maxVolumeM3);

          if ((wouldExceedBookings || wouldExceedVolume) && !data.allowWaitlist) {
            transactionError = {
              status: 409,
              payload: {
                error: 'Selected time slot is full for the requested quantity.',
                code: 'SLOT_FULL',
                waitlistAvailable: true,
                remainingBookings: currentSlot?.remainingBookings ?? 0,
                remainingVolumeM3: currentSlot?.remainingVolumeM3 ?? 0,
              },
            };
            db.exec('ROLLBACK');
          } else {
            const year = data.deliveryDate.slice(0, 4);
            const countRow = db
              .prepare(`SELECT COALESCE(MAX(id), 0) AS max_id FROM bookings`)
              .get() as { max_id: number };
            const nextNum = String(Number(countRow.max_id) + 1).padStart(4, '0');
            const bookingCode = `MC-${year}-${nextNum}`;
            const status = wouldExceedBookings || wouldExceedVolume ? 'waitlisted' : 'confirmed';

            db.prepare(
              `INSERT INTO bookings (
                booking_code, product_slug, product_name, grade, quantity_m3, unit_type,
                usage_type, slump_mm, pump_type, delivery_date, slot_id, slot_label,
                site_address, landmark, city, site_lat, site_lng, distance_km,
                estimated_concrete_amount, estimated_delivery_fee, estimated_pump_fee, estimated_total,
                customer_name, phone, email, gst_number, notes, status
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
            ).run(
              bookingCode,
              data.productSlug,
              String(productRow.name),
              sanitizeText(data.grade, 80),
              data.quantityM3,
              unitType,
              sanitizeText(data.usageType, 80),
              sanitizeText(data.slumpMm, 40),
              unitType === 'pieces' ? 'none' : data.pumpType,
              data.deliveryDate,
              data.slotId,
              slotMeta.label,
              sanitizeText(data.siteAddress, 300),
              sanitizeText(data.landmark, 150),
              sanitizeText(data.city, 80),
              data.siteLat,
              data.siteLng,
              estimate.distanceKm,
              estimate.estimatedConcreteAmount,
              estimate.estimatedDeliveryFee,
              estimate.estimatedPumpFee,
              estimate.estimatedTotal,
              sanitizeText(data.customerName, 120),
              data.phone,
              sanitizeText(data.email, 120),
              sanitizeText(data.gstNumber, 25),
              sanitizeText(data.notes, 600),
              status
            );

            createdBooking = db
              .prepare(`SELECT * FROM bookings WHERE booking_code = ?`)
              .get(bookingCode) as Record<string, unknown>;

            db.exec('COMMIT');
          }
        }
      }
    } catch (txErr) {
      console.error('Booking transaction error, attempting email fallback:', txErr);
      try {
        db.exec('ROLLBACK');
      } catch {
        // ignore
      }
      const year = data.deliveryDate.slice(0, 4);
      const fallbackCode = `MC-${year}-EML${String(Date.now()).slice(-4)}`;
      const unitLabel = unitType === 'pieces' ? 'pieces' : 'm³';
      await sendNotificationEmail(
        process.env.OWNER_ALERT_EMAIL || String(biz.email || 'myconcretektl@gmail.com'),
        `MY CONCRETE Fallback Booking ${fallbackCode} – ${data.customerName}`,
        `Booking Reference (Fallback): ${fallbackCode}\nCustomer: ${data.customerName} (${data.phone})\nGrade: ${data.grade}\nQuantity: ${data.quantityM3} ${unitLabel}\nSchedule: ${data.deliveryDate} (${slotMeta.label})\nSite: ${data.siteAddress}, ${data.city}`
      );
      res.status(201).json({
        fallback: 'email',
        booking: {
          id: 0,
          booking_code: fallbackCode,
          product_slug: data.productSlug,
          product_name: String(productRow.name),
          grade: data.grade,
          quantity_m3: data.quantityM3,
          unit_type: unitType,
          usage_type: data.usageType,
          slump_mm: data.slumpMm,
          pump_type: data.pumpType,
          delivery_date: data.deliveryDate,
          slot_id: data.slotId,
          slot_label: slotMeta.label,
          site_address: data.siteAddress,
          landmark: data.landmark,
          city: data.city,
          distance_km: estimate.distanceKm,
          estimated_concrete_amount: estimate.estimatedConcreteAmount,
          estimated_delivery_fee: estimate.estimatedDeliveryFee,
          estimated_pump_fee: estimate.estimatedPumpFee,
          estimated_total: estimate.estimatedTotal,
          customer_name: data.customerName,
          phone: data.phone,
          email: data.email,
          status: 'confirmed',
          created_at: new Date().toISOString(),
        },
      });
      return;
    }

    if (transactionError) {
      res.status(transactionError.status).json(transactionError.payload);
      return;
    }

    if (createdBooking) {
      const code = String(createdBooking.booking_code);
      const status = String(createdBooking.status);
      const unitLabel = unitType === 'pieces' ? 'pieces' : 'm³';
      const emailText = [
        `Booking Reference: ${code}`,
        `Status: ${status.toUpperCase()}`,
        `Customer: ${data.customerName} (${data.phone})`,
        `Product & Grade: ${data.grade} (${String(productRow.name)})`,
        `Quantity: ${data.quantityM3} ${unitLabel} | Pump: ${data.pumpType}`,
        `Schedule: ${data.deliveryDate} (${slotMeta.label})`,
        `Site: ${data.siteAddress}, ${data.city} (~${estimate.distanceKm} km from Kotihal plant)`,
        `Indicative Estimate: INR ${estimate.estimatedTotal.toLocaleString('en-IN')} (Final price confirmed by MY CONCRETE team)`,
      ].join('\n');

      let customerEmailStatus: 'smtp' | 'logged' = 'logged';
      if (data.email) {
        customerEmailStatus = await sendNotificationEmail(
          data.email,
          `MY CONCRETE Booking ${code} (${status.toUpperCase()})`,
          emailText
        );
      }

      const ownerEmail = process.env.OWNER_ALERT_EMAIL || String(biz.email || 'myconcretektl@gmail.com');
      await sendNotificationEmail(
        ownerEmail,
        `New MY CONCRETE Booking ${code} – ${data.quantityM3} ${unitLabel} ${data.grade}`,
        emailText
      );

      res.status(201).json({
        booking: createdBooking,
        notifications: { customerEmailStatus },
      });
    }
  })
);

app.get(
  '/api/bookings/:bookingCode',
  asyncRoute((req, res) => {
    const code = sanitizeText(req.params.bookingCode, 40).toUpperCase();
    const booking = db
      .prepare(`SELECT * FROM bookings WHERE booking_code = ?`)
      .get(code) as Record<string, unknown> | undefined;
    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }
    res.json({ booking });
  })
);

app.post(
  '/api/bookings/lookup',
  rateLimit(20, 60_000),
  asyncRoute((req, res) => {
    const schema = z.object({
      bookingCode: z.string().min(3).max(40),
      phone: z.string().regex(indianPhoneRegex, 'Enter your 10-digit mobile number'),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid lookup details' });
      return;
    }
    const code = parsed.data.bookingCode.trim().toUpperCase();
    const booking = db
      .prepare(`SELECT * FROM bookings WHERE booking_code = ? AND phone = ?`)
      .get(code, parsed.data.phone);
    if (!booking) {
      res.status(404).json({ error: 'No matching booking found for that ID and phone number.' });
      return;
    }
    res.json({ booking });
  })
);

app.patch('/api/bookings/:bookingCode/manage', rateLimit(15, 60_000), (req, res) => {
  const schema = z.object({
    phone: z.string().regex(indianPhoneRegex),
    action: z.enum(['cancel', 'reschedule']),
    newDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    newSlotId: z.string().min(1).max(40).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid request parameters' });
    return;
  }
  const code = sanitizeText(req.params.bookingCode, 40).toUpperCase();
  const { phone, action, newDate, newSlotId } = parsed.data;

  try {
    db.exec('BEGIN IMMEDIATE');
    const existing = db
      .prepare(`SELECT * FROM bookings WHERE booking_code = ? AND phone = ?`)
      .get(code, phone) as Record<string, unknown> | undefined;

    if (!existing) {
      db.exec('ROLLBACK');
      res.status(404).json({ error: 'Booking not found or phone number mismatch.' });
      return;
    }

    if (['completed', 'cancelled', 'dispatched'].includes(String(existing.status))) {
      db.exec('ROLLBACK');
      res.status(400).json({
        error: `Bookings with status "${String(existing.status)}" cannot be modified online. Please call dispatch.`,
      });
      return;
    }

    if (action === 'cancel') {
      db.prepare(
        `UPDATE bookings SET status = 'cancelled', updated_at = datetime('now') WHERE booking_code = ?`
      ).run(code);
      const updated = db.prepare(`SELECT * FROM bookings WHERE booking_code = ?`).get(code);
      db.exec('COMMIT');
      res.json({ booking: updated });
      return;
    }

    if (!newDate || !newSlotId) {
      db.exec('ROLLBACK');
      res.status(400).json({ error: 'New delivery date and time slot are required to reschedule.' });
      return;
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    if (newDate < todayStr) {
      db.exec('ROLLBACK');
      res.status(400).json({ error: 'Cannot reschedule to a past date.' });
      return;
    }

    const avail = getSlotStatusForDate(newDate);
    if (!avail.valid) {
      db.exec('ROLLBACK');
      res.status(400).json({ error: `Deliveries are unavailable on ${newDate} (${avail.reason}).` });
      return;
    }

    const slotInfo = avail.slots.find((s) => s.id === newSlotId);
    if (!slotInfo) {
      db.exec('ROLLBACK');
      res.status(400).json({ error: 'Invalid slot selected.' });
      return;
    }

    const unitType = String(existing.unit_type || 'm3');
    const qty = Number(existing.quantity_m3);
    if (
      slotInfo.remainingBookings <= 0 ||
      (unitType === 'm3' && slotInfo.bookedVolumeM3 + qty > slotInfo.maxVolumeM3)
    ) {
      db.exec('ROLLBACK');
      res.status(409).json({ error: 'Target slot does not have enough remaining capacity.' });
      return;
    }

    db.prepare(
      `UPDATE bookings
       SET delivery_date = ?, slot_id = ?, slot_label = ?, status = 'confirmed', updated_at = datetime('now')
       WHERE booking_code = ?`
    ).run(newDate, newSlotId, slotInfo.label, code);

    const updated = db.prepare(`SELECT * FROM bookings WHERE booking_code = ?`).get(code);
    db.exec('COMMIT');
    res.json({ booking: updated });
  } catch {
    try {
      db.exec('ROLLBACK');
    } catch {
      // ignore
    }
    res.status(500).json({ error: 'Failed to update booking.' });
  }
});

// ---------------- QUOTES, SITE VISITS, ENQUIRIES, NEWSLETTER ----------------

const quoteHandler = asyncRoute(async (req, res) => {
  const schema = z.object({
    projectType: z.string().min(2).max(100),
    grade: z.string().min(2).max(80),
    quantityM3: z.number().min(1).max(500000),
    location: z.string().min(2).max(200),
    timeline: z.string().min(2).max(100),
    customerName: z.string().min(2).max(120),
    phone: z.string().regex(indianPhoneRegex, 'Enter a valid 10-digit Indian mobile number'),
    email: z.string().email().or(z.literal('')).optional().default(''),
    notes: z.string().max(1000).optional().default(''),
    attachmentName: z.string().max(150).optional().default(''),
    attachmentData: z.string().max(4_000_000).optional().default(''),
    website_url: z.string().optional().default(''),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid quote details' });
    return;
  }
  const data = parsed.data;
  if (data.website_url.trim().length > 0) {
    res.status(400).json({ error: 'Spam check triggered.' });
    return;
  }

  let quoteCode = `QT-${new Date().getFullYear()}-EML${String(Date.now()).slice(-4)}`;
  let fallbackUsed = false;

  try {
    const countRow = db.prepare(`SELECT COALESCE(MAX(id), 0) AS max_id FROM quotes`).get() as {
      max_id: number;
    };
    quoteCode = `QT-${new Date().getFullYear()}-${String(Number(countRow.max_id) + 1).padStart(4, '0')}`;

    db.prepare(
      `INSERT INTO quotes (
        quote_code, project_type, grade, quantity_m3, location, timeline,
        customer_name, phone, email, notes, attachment_name, attachment_data
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      quoteCode,
      sanitizeText(data.projectType, 100),
      sanitizeText(data.grade, 80),
      data.quantityM3,
      sanitizeText(data.location, 200),
      sanitizeText(data.timeline, 100),
      sanitizeText(data.customerName, 120),
      data.phone,
      sanitizeText(data.email, 120),
      sanitizeMultiline(data.notes, 1000),
      sanitizeText(data.attachmentName, 150),
      data.attachmentData
    );
  } catch (dbErr) {
    console.error('Quote DB insert failed, falling back to email delivery:', dbErr);
    fallbackUsed = true;
  }

  let ownerRecipient = process.env.OWNER_ALERT_EMAIL || 'myconcretektl@gmail.com';
  try {
    const biz = getSetting('businessConfig', DEFAULT_BUSINESS_CONFIG);
    ownerRecipient = process.env.OWNER_ALERT_EMAIL || String(biz.email || 'myconcretektl@gmail.com');
  } catch {
    // use default owner email
  }

  await sendNotificationEmail(
    ownerRecipient,
    `New Quote Request ${quoteCode} (${data.quantityM3} – ${data.grade})`,
    [
      `Quote ID: ${quoteCode}${fallbackUsed ? ' (Email Fallback)' : ''}`,
      `Project Type: ${data.projectType}`,
      `Grade/Brick: ${data.grade}`,
      `Quantity: ${data.quantityM3}`,
      `Location: ${data.location}`,
      `Timeline: ${data.timeline}`,
      `Customer: ${data.customerName}`,
      `Phone: ${data.phone}`,
      `Email: ${data.email || 'Not provided'}`,
      `Notes: ${data.notes || 'None'}`,
    ].join('\n')
  );

  res.status(201).json({ quoteCode, ...(fallbackUsed ? { fallback: 'email' } : {}) });
});

app.post('/api/quotes', rateLimit(12, 60_000), quoteHandler);
app.post('/api/quote', rateLimit(12, 60_000), quoteHandler);

app.post(
  '/api/site-visits',
  rateLimit(12, 60_000),
  asyncRoute(async (req, res) => {
    const schema = z.object({
      visitType: z.enum(['plant_tour', 'site_inspection']),
      preferredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      preferredTime: z.string().min(2).max(60),
      location: z.string().max(200).optional().default(''),
      customerName: z.string().min(2).max(120),
      phone: z.string().regex(indianPhoneRegex, 'Enter a valid 10-digit Indian mobile number'),
      email: z.string().email().or(z.literal('')).optional().default(''),
      notes: z.string().max(600).optional().default(''),
      website_url: z.string().optional().default(''),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid visit request' });
      return;
    }
    const data = parsed.data;
    if (data.website_url.trim().length > 0) {
      res.status(400).json({ error: 'Spam check triggered.' });
      return;
    }

    let visitCode = `SV-${new Date().getFullYear()}-EML${String(Date.now()).slice(-4)}`;
    let fallbackUsed = false;

    try {
      const countRow = db.prepare(`SELECT COALESCE(MAX(id), 0) AS max_id FROM site_visits`).get() as {
        max_id: number;
      };
      visitCode = `SV-${new Date().getFullYear()}-${String(Number(countRow.max_id) + 1).padStart(4, '0')}`;

      db.prepare(
        `INSERT INTO site_visits (
          visit_code, visit_type, preferred_date, preferred_time, location,
          customer_name, phone, email, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        visitCode,
        data.visitType,
        data.preferredDate,
        sanitizeText(data.preferredTime, 60),
        sanitizeText(data.location, 200),
        sanitizeText(data.customerName, 120),
        data.phone,
        sanitizeText(data.email, 120),
        sanitizeMultiline(data.notes, 600)
      );
    } catch (dbErr) {
      console.error('Site visit DB insert failed, falling back to email delivery:', dbErr);
      fallbackUsed = true;
    }

    await sendNotificationEmail(
      process.env.OWNER_ALERT_EMAIL || 'myconcretektl@gmail.com',
      `New Site/Plant Visit Request ${visitCode}`,
      `Visit ID: ${visitCode}\nType: ${data.visitType}\nDate: ${data.preferredDate} at ${data.preferredTime}\nCustomer: ${data.customerName} (${data.phone})\nLocation: ${data.location || 'Kotihal Plant'}`
    );

    res.status(201).json({ visitCode, ...(fallbackUsed ? { fallback: 'email' } : {}) });
  })
);

const enquiryHandler = asyncRoute(async (req, res) => {
  const schema = z.object({
    type: z.enum(['contact', 'partner']).optional().default('contact'),
    name: z.string().min(2).max(120),
    phone: z.string().regex(indianPhoneRegex, 'Enter a valid 10-digit Indian mobile number'),
    email: z.string().email().or(z.literal('')).optional().default(''),
    city: z.string().min(2).max(80),
    companyOrRole: z.string().max(120).optional().default(''),
    message: z.string().min(5).max(1500),
    consent: z.boolean().refine((v) => v === true, 'Consent is required'),
    website_url: z.string().optional().default(''),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Please check all required fields' });
    return;
  }
  const data = parsed.data;
  if (data.website_url.trim().length > 0) {
    res.status(400).json({ error: 'Spam check triggered.' });
    return;
  }

  let fallbackUsed = false;
  try {
    db.prepare(
      `INSERT INTO enquiries (type, name, phone, email, city, company_or_role, message, consent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      data.type,
      sanitizeText(data.name, 120),
      data.phone,
      sanitizeText(data.email, 120),
      sanitizeText(data.city, 80),
      sanitizeText(data.companyOrRole, 120),
      sanitizeMultiline(data.message, 1500),
      1
    );
  } catch (dbErr) {
    console.error('Enquiry DB insert failed, falling back to email delivery:', dbErr);
    fallbackUsed = true;
  }

  await sendNotificationEmail(
    process.env.OWNER_ALERT_EMAIL || 'myconcretektl@gmail.com',
    `New MY CONCRETE ${data.type === 'partner' ? 'Partner' : 'Contact'} Enquiry – ${data.name}`,
    `Name: ${data.name}\nPhone: ${data.phone}\nEmail: ${data.email || 'Not provided'}\nCity: ${data.city}\nRole/Firm: ${data.companyOrRole || 'N/A'}\nMessage:\n${data.message}`
  );

  res.status(201).json({ ok: true, ...(fallbackUsed ? { fallback: 'email' } : {}) });
});

app.post('/api/enquiries', rateLimit(15, 60_000), enquiryHandler);
app.post('/api/contact', rateLimit(15, 60_000), enquiryHandler);

app.post(
  '/api/newsletter',
  rateLimit(15, 60_000),
  asyncRoute((req, res) => {
    const schema = z.object({
      email: z.string().email('Enter a valid email address'),
      website_url: z.string().optional().default(''),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid email' });
      return;
    }
    if (parsed.data.website_url.trim().length > 0) {
      res.status(400).json({ error: 'Spam check triggered.' });
      return;
    }
    db.prepare(`INSERT OR IGNORE INTO newsletter_subscribers (email) VALUES (?)`).run(
      parsed.data.email.trim().toLowerCase()
    );
    res.status(201).json({ ok: true });
  })
);

// ---------------- ADMIN AUTH & DASHBOARD APIS ----------------

function isStrongPassword(pw: string): boolean {
  return pw.length >= 8 && /[A-Za-z]/.test(pw) && /[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pw);
}

function getAttemptLock(key: string): { locked: boolean; remainingMinutes: number } {
  const row = db
    .prepare(`SELECT attempts, locked_until FROM admin_login_attempts WHERE key = ?`)
    .get(key) as { attempts: number; locked_until: number } | undefined;
  if (!row) return { locked: false, remainingMinutes: 0 };
  const now = Date.now();
  if (row.locked_until > now) {
    return {
      locked: true,
      remainingMinutes: Math.max(1, Math.ceil((row.locked_until - now) / 60000)),
    };
  }
  return { locked: false, remainingMinutes: 0 };
}

function recordFailedAttempt(key: string): { lockedNow: boolean } {
  const now = Date.now();
  const existing = db
    .prepare(`SELECT attempts, locked_until, updated_at FROM admin_login_attempts WHERE key = ?`)
    .get(key) as { attempts: number; locked_until: number; updated_at: number } | undefined;

  let nextAttempts = 1;
  if (existing && now - existing.updated_at <= LOCKOUT_DURATION_MS) {
    nextAttempts = existing.attempts + 1;
  }
  const lockedUntil = nextAttempts >= MAX_FAILED_ATTEMPTS ? now + LOCKOUT_DURATION_MS : 0;

  db.prepare(
    `INSERT INTO admin_login_attempts (key, attempts, locked_until, updated_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET
       attempts = excluded.attempts,
       locked_until = excluded.locked_until,
       updated_at = excluded.updated_at`
  ).run(key, nextAttempts, lockedUntil, now);

  return { lockedNow: lockedUntil > now };
}

function clearAttemptLock(key: string): void {
  db.prepare(`DELETE FROM admin_login_attempts WHERE key = ?`).run(key);
}

app.get('/api/admin/auth-status', (_req, res) => {
  const row = db
    .prepare(`SELECT COUNT(*) AS count FROM admin_users WHERE role = 'owner'`)
    .get() as { count: number };
  res.json({ configured: row.count > 0 });
});

app.get('/api/admin/me', requireAdmin, (req: AuthedRequest, res) => {
  const u = req.admin!;
  res.json({
    admin: {
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      mustChangePassword: u.mustChangePassword,
      twoFactorEnabled: u.twoFactorEnabled,
    },
  });
});

app.post(
  '/api/admin/login',
  rateLimit(20, 60_000),
  asyncRoute(async (req, res) => {
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Valid email and password are required.' });
    return;
  }

  const email = parsed.data.email.trim().toLowerCase();
  const ip = getClientIp(req);
  const emailKey = `email:${email}`;
  const ipKey = `ip:${ip}`;

  const emailLock = getAttemptLock(emailKey);
  const ipLock = getAttemptLock(ipKey);
  if (emailLock.locked || ipLock.locked) {
    const mins = Math.max(emailLock.remainingMinutes, ipLock.remainingMinutes);
    logAdminLogin({ email, status: 'locked', req });
    res.status(429).json({
      error: `Too many failed attempts. Login locked for ${mins} minute(s).`,
    });
    return;
  }

  const admin = db
    .prepare(`SELECT * FROM admin_users WHERE lower(email) = ?`)
    .get(email) as
    | {
        id: number;
        email: string;
        name: string;
        password_hash: string;
        role: string;
        must_change_password: number;
        two_factor_enabled: number;
      }
    | undefined;

  if (!admin || !bcrypt.compareSync(parsed.data.password, admin.password_hash)) {
    const r1 = recordFailedAttempt(emailKey);
    const r2 = recordFailedAttempt(ipKey);
    logAdminLogin({
      email,
      userId: admin?.id ?? null,
      role: admin?.role ?? '',
      status: r1.lockedNow || r2.lockedNow ? 'locked' : 'failed_password',
      req,
    });
    if (r1.lockedNow || r2.lockedNow) {
      res.status(429).json({
        error: 'Account locked for 15 minutes after 5 failed login attempts.',
      });
      return;
    }
    res.status(401).json({ error: 'Invalid admin credentials.' });
    return;
  }

  clearAttemptLock(emailKey);
  clearAttemptLock(ipKey);

  if (admin.two_factor_enabled) {
    const otp = String(crypto.randomInt(100000, 1000000));
    const challengeToken = crypto.randomBytes(24).toString('hex');
    const expiresAt = Date.now() + 10 * 60 * 1000;
    db.prepare(
      `INSERT INTO admin_otp_codes (user_id, challenge_hash, code_hash, expires_at)
       VALUES (?, ?, ?, ?)`
    ).run(admin.id, hashToken(challengeToken), hashToken(otp), expiresAt);

    await sendNotificationEmail(
      admin.email,
      'MY CONCRETE Admin Verification Code (2FA)',
      `Your one-time verification code for MY CONCRETE Admin is: ${otp}\n\nThis code expires in 10 minutes. If you did not attempt to sign in, reset your password immediately.`,
      `2FA verification OTP dispatched to ${admin.email}`
    );
    logAdminLogin({
      email: admin.email,
      userId: admin.id,
      role: admin.role,
      status: 'otp_sent',
      req,
    });

    const [localPart, domainPart] = admin.email.split('@');
    const maskedEmail = `${localPart.slice(0, 2)}***@${domainPart || ''}`;
    res.json({ requiresOtp: true, challengeToken, maskedEmail });
    return;
  }

  createAdminSession(admin.id, req, res);
  db.prepare(`UPDATE admin_users SET last_login_at = datetime('now') WHERE id = ?`).run(admin.id);
  logAdminLogin({
    email: admin.email,
    userId: admin.id,
    role: admin.role,
    status: 'success',
    req,
  });

  res.json({
    admin: {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role === 'owner' ? 'owner' : 'staff',
      mustChangePassword: Boolean(admin.must_change_password),
      twoFactorEnabled: Boolean(admin.two_factor_enabled),
    },
  });
  })
);

app.post('/api/admin/verify-otp', rateLimit(15, 60_000), (req, res) => {
  const schema = z.object({
    challengeToken: z.string().min(10),
    otp: z.string().regex(/^\d{6}$/, 'Enter the 6-digit verification code'),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid verification code' });
    return;
  }

  const row = db
    .prepare(
      `SELECT o.*, u.email, u.name, u.role, u.must_change_password, u.two_factor_enabled
       FROM admin_otp_codes o
       JOIN admin_users u ON u.id = o.user_id
       WHERE o.challenge_hash = ? AND o.used = 0`
    )
    .get(hashToken(parsed.data.challengeToken)) as
    | {
        id: number;
        user_id: number;
        code_hash: string;
        expires_at: number;
        attempts: number;
        email: string;
        name: string;
        role: string;
        must_change_password: number;
        two_factor_enabled: number;
      }
    | undefined;

  if (!row || row.expires_at <= Date.now() || row.attempts >= 5) {
    res.status(401).json({ error: 'Verification code expired or invalid. Please sign in again.' });
    return;
  }

  if (hashToken(parsed.data.otp) !== row.code_hash) {
    const nextAttempts = row.attempts + 1;
    db.prepare(`UPDATE admin_otp_codes SET attempts = ?, used = ? WHERE id = ?`).run(
      nextAttempts,
      nextAttempts >= 5 ? 1 : 0,
      row.id
    );
    logAdminLogin({
      email: row.email,
      userId: row.user_id,
      role: row.role,
      status: 'otp_failed',
      req,
    });
    res.status(401).json({ error: 'Incorrect verification code.' });
    return;
  }

  db.prepare(`UPDATE admin_otp_codes SET used = 1 WHERE id = ?`).run(row.id);
  createAdminSession(row.user_id, req, res);
  db.prepare(`UPDATE admin_users SET last_login_at = datetime('now') WHERE id = ?`).run(row.user_id);
  logAdminLogin({
    email: row.email,
    userId: row.user_id,
    role: row.role,
    status: 'success',
    req,
  });

  res.json({
    admin: {
      id: row.user_id,
      email: row.email,
      name: row.name,
      role: row.role === 'owner' ? 'owner' : 'staff',
      mustChangePassword: Boolean(row.must_change_password),
      twoFactorEnabled: Boolean(row.two_factor_enabled),
    },
  });
});

app.post('/api/admin/logout', requireAdmin, (req: AuthedRequest, res) => {
  const admin = req.admin!;
  db.prepare(`DELETE FROM admin_sessions WHERE token_hash = ?`).run(admin.tokenHash);
  clearAdminSessionCookie(req, res);
  logAdminLogin({
    email: admin.email,
    userId: admin.id,
    role: admin.role,
    status: 'logout',
    req,
  });
  res.json({ ok: true });
});

app.post('/api/admin/change-password', requireAdmin, (req: AuthedRequest, res) => {
  const schema = z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8).max(128),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    return;
  }
  if (!isStrongPassword(parsed.data.newPassword)) {
    res.status(400).json({
      error: 'New password must be at least 8 characters and include letters plus a number or symbol.',
    });
    return;
  }
  if (parsed.data.currentPassword === parsed.data.newPassword) {
    res.status(400).json({ error: 'New password must be different from your current password.' });
    return;
  }

  const admin = req.admin!;
  const dbUser = db
    .prepare(`SELECT id, password_hash, email, name, role, two_factor_enabled FROM admin_users WHERE id = ?`)
    .get(admin.id) as
    | {
        id: number;
        password_hash: string;
        email: string;
        name: string;
        role: string;
        two_factor_enabled: number;
      }
    | undefined;

  if (!dbUser || !bcrypt.compareSync(parsed.data.currentPassword, dbUser.password_hash)) {
    res.status(401).json({ error: 'Current password is incorrect.' });
    return;
  }

  const nextHash = bcrypt.hashSync(parsed.data.newPassword, 12);
  db.prepare(`UPDATE admin_users SET password_hash = ?, must_change_password = 0 WHERE id = ?`).run(
    nextHash,
    admin.id
  );
  logAdminLogin({
    email: admin.email,
    userId: admin.id,
    role: admin.role,
    status: 'password_changed',
    req,
  });

  res.json({
    ok: true,
    admin: {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role === 'owner' ? 'owner' : 'staff',
      mustChangePassword: false,
      twoFactorEnabled: Boolean(dbUser.two_factor_enabled),
    },
  });
});

app.post(
  '/api/admin/forgot-password',
  rateLimit(5, 60_000),
  asyncRoute(async (req, res) => {
  const schema = z.object({
    email: z.string().email(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Enter a valid email address.' });
    return;
  }
  const email = parsed.data.email.trim().toLowerCase();
  const user = db
    .prepare(`SELECT id, email, role FROM admin_users WHERE lower(email) = ?`)
    .get(email) as { id: number; email: string; role: string } | undefined;

  if (user) {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 30 * 60 * 1000;
    db.prepare(
      `INSERT INTO admin_reset_tokens (token_hash, user_id, expires_at) VALUES (?, ?, ?)`
    ).run(hashToken(rawToken), user.id, expiresAt);

    const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
    const resetLink = `${baseUrl}/admin/login?resetToken=${rawToken}`;
    const targetInbox = 'myconcretektl@gmail.com';
    await sendNotificationEmail(
      targetInbox,
      `MY CONCRETE Admin Password Reset Request (${user.email})`,
      `A password reset was requested for admin account ${user.email}.\n\nOpen this link within 30 minutes to set a new password:\n${resetLink}\n\nIf you did not request this, you can safely ignore this message.`,
      `Password reset link emailed to ${targetInbox} for ${user.email} (link redacted)`
    );
    logAdminLogin({
      email: user.email,
      userId: user.id,
      role: user.role,
      status: 'password_reset_requested',
      req,
    });
  }

  res.json({
    ok: true,
    message:
      'If an active admin account exists for that email, a reset link has been sent to myconcretektl@gmail.com.',
  });
  })
);

app.post('/api/admin/reset-password', rateLimit(10, 60_000), (req, res) => {
  const schema = z.object({
    token: z.string().min(20),
    newPassword: z.string().min(8).max(128),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Valid reset token and password (min 8 chars) required.' });
    return;
  }
  if (!isStrongPassword(parsed.data.newPassword)) {
    res.status(400).json({
      error: 'Password must be at least 8 characters and include letters plus a number or symbol.',
    });
    return;
  }

  const row = db
    .prepare(
      `SELECT r.token_hash, r.user_id, r.expires_at, u.email, u.role
       FROM admin_reset_tokens r
       JOIN admin_users u ON u.id = r.user_id
       WHERE r.token_hash = ? AND r.used = 0`
    )
    .get(hashToken(parsed.data.token)) as
    | { token_hash: string; user_id: number; expires_at: number; email: string; role: string }
    | undefined;

  if (!row || row.expires_at <= Date.now()) {
    res.status(400).json({ error: 'Reset link is invalid or has expired.' });
    return;
  }

  const nextHash = bcrypt.hashSync(parsed.data.newPassword, 12);
  db.prepare(`UPDATE admin_users SET password_hash = ?, must_change_password = 0 WHERE id = ?`).run(
    nextHash,
    row.user_id
  );
  db.prepare(`UPDATE admin_reset_tokens SET used = 1 WHERE token_hash = ?`).run(row.token_hash);
  db.prepare(`DELETE FROM admin_sessions WHERE user_id = ?`).run(row.user_id);
  clearAttemptLock(`email:${row.email.toLowerCase()}`);

  logAdminLogin({
    email: row.email,
    userId: row.user_id,
    role: row.role,
    status: 'password_reset_completed',
    req,
  });

  res.json({ ok: true });
});

app.patch('/api/admin/me/security', requireAdmin, (req: AuthedRequest, res) => {
  const twoFactorEnabled = Boolean(req.body?.twoFactorEnabled);
  const admin = req.admin!;
  db.prepare(`UPDATE admin_users SET two_factor_enabled = ? WHERE id = ?`).run(
    twoFactorEnabled ? 1 : 0,
    admin.id
  );
  res.json({ ok: true, twoFactorEnabled });
});

app.get('/api/admin/users', requireAdmin, requireOwner, (_req, res) => {
  const users = db
    .prepare(
      `SELECT id, email, name, role, must_change_password, two_factor_enabled, last_login_at, created_at
       FROM admin_users
       ORDER BY CASE WHEN role = 'owner' THEN 0 ELSE 1 END, id ASC`
    )
    .all();
  const loginLogs = db
    .prepare(`SELECT id, email, role, status, ip_address, created_at FROM admin_login_logs ORDER BY id DESC LIMIT 100`)
    .all();
  res.json({ users, loginLogs });
});

app.post('/api/admin/users', requireAdmin, requireOwner, (req, res) => {
  const schema = z.object({
    name: z.string().min(2).max(80),
    email: z.string().email().max(120),
    role: z.enum(['owner', 'staff']),
    temporaryPassword: z.string().min(8).max(128),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid user payload' });
    return;
  }
  if (!isStrongPassword(parsed.data.temporaryPassword)) {
    res.status(400).json({
      error: 'Temporary password must be at least 8 characters and include letters plus a number or symbol.',
    });
    return;
  }

  const email = parsed.data.email.trim().toLowerCase();
  const existing = db.prepare(`SELECT id FROM admin_users WHERE lower(email) = ?`).get(email);
  if (existing) {
    res.status(409).json({ error: 'An admin user with this email already exists.' });
    return;
  }

  const hash = bcrypt.hashSync(parsed.data.temporaryPassword, 12);
  const info = db
    .prepare(
      `INSERT INTO admin_users (email, name, password_hash, role, must_change_password)
       VALUES (?, ?, ?, ?, 1)`
    )
    .run(email, sanitizeText(parsed.data.name, 80), hash, parsed.data.role);

  res.status(201).json({ id: Number(info.lastInsertRowid) });
});

app.delete('/api/admin/users/:id', requireAdmin, requireOwner, (req: AuthedRequest, res) => {
  const targetId = Number(req.params.id);
  if (targetId === req.admin!.id) {
    res.status(400).json({ error: 'You cannot delete your own active account.' });
    return;
  }
  const target = db.prepare(`SELECT role FROM admin_users WHERE id = ?`).get(targetId) as
    | { role: string }
    | undefined;
  if (!target) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }
  if (target.role === 'owner') {
    const ownerCount = (
      db.prepare(`SELECT COUNT(*) AS count FROM admin_users WHERE role = 'owner'`).get() as {
        count: number;
      }
    ).count;
    if (ownerCount <= 1) {
      res.status(400).json({ error: 'At least one owner account must remain.' });
      return;
    }
  }
  db.prepare(`DELETE FROM admin_users WHERE id = ?`).run(targetId);
  res.json({ ok: true });
});

app.get('/api/admin/overview', requireAdmin, (req: AuthedRequest, res) => {
  const bookings = db.prepare(`SELECT * FROM bookings ORDER BY created_at DESC`).all() as Array<
    Record<string, unknown>
  >;

  if (req.admin!.role !== 'owner') {
    res.json({
      role: 'staff',
      bookings,
    });
    return;
  }

  const quotes = db.prepare(`SELECT * FROM quotes ORDER BY created_at DESC`).all() as Array<
    Record<string, unknown>
  >;
  const siteVisits = db.prepare(`SELECT * FROM site_visits ORDER BY created_at DESC`).all();
  const enquiries = db.prepare(`SELECT * FROM enquiries ORDER BY created_at DESC`).all();
  const subscribers = db
    .prepare(`SELECT * FROM newsletter_subscribers ORDER BY created_at DESC`)
    .all();
  const emailLogs = db.prepare(`SELECT * FROM email_logs ORDER BY created_at DESC LIMIT 50`).all();

  const totalVolumeM3 = bookings
    .filter((b) => b.status !== 'cancelled' && b.status !== 'rejected' && b.unit_type !== 'pieces')
    .reduce((acc, b) => acc + Number(b.quantity_m3 || 0), 0);

  const totalBricksPieces = bookings
    .filter((b) => b.status !== 'cancelled' && b.status !== 'rejected' && b.unit_type === 'pieces')
    .reduce((acc, b) => acc + Number(b.quantity_m3 || 0), 0);

  const gradeCounts = new Map<string, number>();
  for (const b of bookings) {
    if (b.status === 'cancelled' || b.status === 'rejected') continue;
    const g = String(b.grade);
    gradeCounts.set(g, (gradeCounts.get(g) || 0) + Number(b.quantity_m3 || 0));
  }
  const topGrades = Array.from(gradeCounts.entries())
    .map(([grade, volumeM3]) => ({ grade, volumeM3: Math.round(volumeM3 * 10) / 10 }))
    .sort((a, b) => b.volumeM3 - a.volumeM3)
    .slice(0, 6);

  const weeklyVolumeMap = new Map<string, number>();
  for (const b of bookings) {
    if (b.status === 'cancelled' || b.status === 'rejected' || b.unit_type === 'pieces') continue;
    const dateKey = String(b.delivery_date).slice(0, 10);
    weeklyVolumeMap.set(dateKey, (weeklyVolumeMap.get(dateKey) || 0) + Number(b.quantity_m3 || 0));
  }
  const volumeByDate = Array.from(weeklyVolumeMap.entries())
    .map(([date, volumeM3]) => ({ date, volumeM3: Math.round(volumeM3 * 10) / 10 }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-10);

  const convertedQuotes = quotes.filter((q) => q.status === 'converted').length;
  const conversionRate =
    quotes.length > 0 ? Math.round((convertedQuotes / quotes.length) * 100) : 0;

  const customerMap = new Map<
    string,
    { name: string; phone: string; email: string; city: string; totalOrders: number; totalM3: number }
  >();
  for (const b of bookings) {
    const phone = String(b.phone);
    const existing = customerMap.get(phone);
    const vol = b.unit_type === 'pieces' ? 0 : Number(b.quantity_m3 || 0);
    if (existing) {
      existing.totalOrders += 1;
      existing.totalM3 += vol;
    } else {
      customerMap.set(phone, {
        name: String(b.customer_name),
        phone,
        email: String(b.email || ''),
        city: String(b.city || ''),
        totalOrders: 1,
        totalM3: vol,
      });
    }
  }

  res.json({
    role: 'owner',
    analytics: {
      totalBookings: bookings.length,
      totalVolumeM3: Math.round(totalVolumeM3 * 10) / 10,
      totalBricksPieces,
      pendingQuotes: quotes.filter((q) => q.status === 'new').length,
      totalEnquiries: enquiries.length,
      conversionRate,
      topGrades,
      volumeByDate,
    },
    bookings,
    quotes,
    siteVisits,
    enquiries,
    subscribers,
    emailLogs,
    customers: Array.from(customerMap.values()),
  });
});

app.patch('/api/admin/bookings/:id', requireAdmin, (req, res) => {
  const schema = z.object({
    status: z
      .enum(['confirmed', 'waitlisted', 'approved', 'dispatched', 'completed', 'cancelled', 'rejected'])
      .optional(),
    deliveryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    slotId: z.string().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid booking update payload' });
    return;
  }
  const id = Number(req.params.id);
  const existing = db.prepare(`SELECT * FROM bookings WHERE id = ?`).get(id) as
    | Record<string, unknown>
    | undefined;
  if (!existing) {
    res.status(404).json({ error: 'Booking not found' });
    return;
  }

  const nextStatus = parsed.data.status || String(existing.status);
  const nextDate = parsed.data.deliveryDate || String(existing.delivery_date);
  let nextSlotId = String(existing.slot_id);
  let nextSlotLabel = String(existing.slot_label);

  if (parsed.data.slotId) {
    const scheduling = getSetting('schedulingConfig', DEFAULT_SCHEDULING_CONFIG);
    const slot = scheduling.slots.find((s) => s.id === parsed.data.slotId);
    if (slot) {
      nextSlotId = slot.id;
      nextSlotLabel = slot.label;
    }
  }

  db.prepare(
    `UPDATE bookings SET status = ?, delivery_date = ?, slot_id = ?, slot_label = ?, updated_at = datetime('now') WHERE id = ?`
  ).run(nextStatus, nextDate, nextSlotId, nextSlotLabel, id);

  res.json({ booking: db.prepare(`SELECT * FROM bookings WHERE id = ?`).get(id) });
});

app.patch('/api/admin/quotes/:id', requireAdmin, requireOwner, (req, res) => {
  const status = sanitizeText(req.body?.status, 30);
  if (!['new', 'reviewed', 'quoted', 'converted'].includes(status)) {
    res.status(400).json({ error: 'Invalid quote status' });
    return;
  }
  db.prepare(`UPDATE quotes SET status = ? WHERE id = ?`).run(status, Number(req.params.id));
  res.json({ ok: true });
});

app.patch('/api/admin/enquiries/:id', requireAdmin, requireOwner, (req, res) => {
  const status = sanitizeText(req.body?.status, 30);
  if (!['new', 'contacted', 'archived'].includes(status)) {
    res.status(400).json({ error: 'Invalid enquiry status' });
    return;
  }
  db.prepare(`UPDATE enquiries SET status = ? WHERE id = ?`).run(status, Number(req.params.id));
  res.json({ ok: true });
});

app.patch('/api/admin/site-visits/:id', requireAdmin, requireOwner, (req, res) => {
  const status = sanitizeText(req.body?.status, 30);
  if (!['scheduled', 'completed', 'cancelled'].includes(status)) {
    res.status(400).json({ error: 'Invalid site visit status' });
    return;
  }
  db.prepare(`UPDATE site_visits SET status = ? WHERE id = ?`).run(status, Number(req.params.id));
  res.json({ ok: true });
});

app.put('/api/admin/settings/:key', requireAdmin, requireOwner, (req, res) => {
  const key = req.params.key;
  if (!['businessConfig', 'schedulingConfig', 'heroSlides', 'statsItems', 'customerPages'].includes(key)) {
    res.status(400).json({ error: 'Unknown settings key' });
    return;
  }
  setSetting(key, req.body);
  res.json({ ok: true, value: req.body });
});

app.put('/api/admin/products/:id', requireAdmin, requireOwner, (req, res) => {
  const id = Number(req.params.id);
  const { name, tagline, isOffered, overview, properties, uses, grades, faqs, imageUrl } = req.body;
  db.prepare(
    `UPDATE products
     SET name = ?, tagline = ?, is_offered = ?, overview = ?,
         properties_json = ?, uses_json = ?, grades_json = ?, faqs_json = ?, image_url = ?
     WHERE id = ?`
  ).run(
    sanitizeText(name, 140),
    sanitizeText(tagline, 240),
    isOffered ? 1 : 0,
    sanitizeMultiline(overview, 2000),
    JSON.stringify(Array.isArray(properties) ? properties : []),
    JSON.stringify(Array.isArray(uses) ? uses : []),
    JSON.stringify(Array.isArray(grades) ? grades : []),
    JSON.stringify(Array.isArray(faqs) ? faqs : []),
    sanitizeText(imageUrl || '', 500),
    id
  );
  res.json({ ok: true });
});

app.post('/api/admin/projects', requireAdmin, requireOwner, (req, res) => {
  const { title, segment, location, gradeUsed, volumeNote, summary, imageUrl } = req.body;
  const info = db
    .prepare(
      `INSERT INTO projects (title, segment, location, grade_used, volume_note, summary, image_url, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, 10)`
    )
    .run(
      sanitizeText(title, 160),
      sanitizeText(segment, 60),
      sanitizeText(location, 120),
      sanitizeText(gradeUsed, 80),
      sanitizeText(volumeNote, 120),
      sanitizeMultiline(summary, 500),
      sanitizeText(imageUrl || '', 500)
    );
  res.status(201).json({ id: Number(info.lastInsertRowid) });
});

app.delete('/api/admin/projects/:id', requireAdmin, requireOwner, (req, res) => {
  db.prepare(`DELETE FROM projects WHERE id = ?`).run(Number(req.params.id));
  res.json({ ok: true });
});

app.post('/api/admin/media', requireAdmin, (req, res) => {
  const { title, category, caption, imageUrl, publishedDate } = req.body;
  const info = db
    .prepare(
      `INSERT INTO media_items (title, category, caption, image_url, published_date, sort_order)
       VALUES (?, ?, ?, ?, ?, 10)`
    )
    .run(
      sanitizeText(title, 160),
      sanitizeText(category, 60),
      sanitizeMultiline(caption, 400),
      sanitizeText(imageUrl || '', 500),
      sanitizeText(publishedDate || new Date().toISOString().slice(0, 10), 20)
    );
  res.status(201).json({ id: Number(info.lastInsertRowid) });
});

app.delete('/api/admin/media/:id', requireAdmin, (req, res) => {
  db.prepare(`DELETE FROM media_items WHERE id = ?`).run(Number(req.params.id));
  res.json({ ok: true });
});

app.post('/api/admin/blogs', requireAdmin, requireOwner, (req, res) => {
  const { slug, title, category, excerpt, content, author, readTime, publishedAt, imageUrl, published } =
    req.body;
  const cleanSlug = sanitizeText(slug, 140)
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-');
  const info = db
    .prepare(
      `INSERT INTO blogs (slug, title, category, excerpt, content, author, read_time, published_at, image_url, published)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      cleanSlug,
      sanitizeText(title, 200),
      sanitizeText(category, 60),
      sanitizeMultiline(excerpt, 400),
      sanitizeMultiline(content, 12000),
      sanitizeText(author || 'MY CONCRETE Team', 100),
      sanitizeText(readTime || '4 min read', 30),
      sanitizeText(publishedAt || new Date().toISOString().slice(0, 10), 20),
      sanitizeText(imageUrl || '', 500),
      published === false ? 0 : 1
    );
  res.status(201).json({ id: Number(info.lastInsertRowid) });
});

app.delete('/api/admin/blogs/:id', requireAdmin, requireOwner, (req, res) => {
  db.prepare(`DELETE FROM blogs WHERE id = ?`).run(Number(req.params.id));
  res.json({ ok: true });
});

app.post('/api/admin/testimonials', requireAdmin, requireOwner, (req, res) => {
  const { authorName, roleOrCompany, location, quote } = req.body;
  const info = db
    .prepare(
      `INSERT INTO testimonials (author_name, role_or_company, location, quote, published)
       VALUES (?, ?, ?, ?, 1)`
    )
    .run(
      sanitizeText(authorName, 120),
      sanitizeText(roleOrCompany, 120),
      sanitizeText(location, 100),
      sanitizeMultiline(quote, 600)
    );
  res.status(201).json({ id: Number(info.lastInsertRowid) });
});

app.delete('/api/admin/testimonials/:id', requireAdmin, requireOwner, (req, res) => {
  db.prepare(`DELETE FROM testimonials WHERE id = ?`).run(Number(req.params.id));
  res.json({ ok: true });
});

// ---------------- SEO: SITEMAP & ROBOTS ----------------

app.get('/robots.txt', (req, res) => {
  const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
  res.type('text/plain').send(
    `User-agent: *\nAllow: /\nDisallow: /admin\nSitemap: ${baseUrl}/sitemap.xml\n`
  );
});

app.get('/sitemap.xml', (req, res) => {
  const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
  const staticPaths = [
    '/',
    '/about/story',
    '/about/why-my-concrete',
    '/about/plant-location',
    '/about/careers',
    '/customers',
    '/customers/residential',
    '/customers/commercial',
    '/customers/government',
    '/customers/infrastructure',
    '/customers/institutions',
    '/customers/industrial',
    '/products',
    '/partner',
    '/media',
    '/blog',
    '/contact',
    '/tools/calculator',
    '/tools/brick-calculator',
    '/tools/grade-helper',
    '/tools/plant-locator',
    '/book',
    '/quote',
    '/site-visit',
    '/track',
    '/privacy',
    '/disclaimer',
  ];

  const products = db
    .prepare(`SELECT slug FROM products WHERE is_offered = 1`)
    .all() as Array<{ slug: string }>;
  const blogs = db
    .prepare(`SELECT slug FROM blogs WHERE published = 1`)
    .all() as Array<{ slug: string }>;

  const urls = [
    ...staticPaths,
    ...products.map((p) => `/products/${p.slug}`),
    ...blogs.map((b) => `/blog/${b.slug}`),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${baseUrl}${u}</loc>
    <changefreq>weekly</changefreq>
  </url>`
  )
  .join('\n')}
</urlset>`;

  res.type('application/xml').send(xml);
});

// ---------------- VITE DEV MIDDLEWARE / PRODUCTION STATIC ----------------

async function startServer() {
  const distDir = path.resolve(process.cwd(), 'dist');
  const isProd = process.env.NODE_ENV === 'production' && fs.existsSync(distDir);

  // Guarantee unmatched /api/* endpoints return JSON 404 instead of SPA HTML
  app.use('/api', (req, res) => {
    res.status(404).json({ error: `API endpoint not found: ${req.method} ${req.originalUrl}` });
  });

  // Guarantee Express body-parser or unexpected route errors return JSON instead of HTML
  app.use(
    (
      err: unknown,
      req: express.Request,
      res: express.Response,
      next: express.NextFunction
    ) => {
      if (res.headersSent) {
        next(err);
        return;
      }
      const e = err as { type?: string; status?: number; statusCode?: number; message?: string };
      const status =
        e.type === 'entity.too.large'
          ? 413
          : e.type === 'entity.parse.failed'
            ? 400
            : e.status || e.statusCode || 500;
      console.error('[Express API Error]', req.method, req.originalUrl, status, e.message);
      res.status(status).json({
        error:
          status === 413
            ? 'Uploaded file or request is too large (max 10 MB).'
            : status === 400
              ? 'Invalid JSON request payload.'
              : 'Something went wrong. Please call +91 73378 07372 or WhatsApp us.',
      });
    }
  );

  app.get('/images/*', (req, res) => {
    const safeRel = path.normalize(req.path).replace(/^(\.\.(\/|\\|$))+/, '');
    const pubFile = path.join(process.cwd(), 'public', safeRel);
    if (fs.existsSync(pubFile) && fs.statSync(pubFile).isFile()) {
      res.sendFile(pubFile);
      return;
    }
    if (isProd) {
      const distFile = path.join(distDir, safeRel);
      if (fs.existsSync(distFile) && fs.statSync(distFile).isFile()) {
        res.sendFile(distFile);
        return;
      }
    }
    res.status(404).end();
  });

  if (isProd) {
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const port = Number(process.env.PORT || '3000');
  app.listen(port, '0.0.0.0', () => {
    console.log(`MY CONCRETE server listening on http://0.0.0.0:${port}`);
  });
}

startServer();
