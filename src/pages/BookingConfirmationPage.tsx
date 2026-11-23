import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { CalendarPlus, CheckCircle2, Download, Mail, MessageCircle, Phone } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { useDocumentMeta } from '../utils/seo.ts';
import { readApiJson } from '../utils/api.ts';
import { CallLink, MailLink } from '../components/ContactLinks.tsx';
import { CONTACT_CONFIG } from '../config/contact.ts';
import {
  buildWhatsAppUrl,
  downloadBookingIcs,
  downloadBookingPdf,
} from '../utils/documents.ts';
import type { BookingRecord } from '../types/index.ts';

export function BookingConfirmationPage() {
  const { bookingCode } = useParams<{ bookingCode: string }>();
  const location = useLocation();
  const stateBooking = (location.state as { booking?: BookingRecord } | null)?.booking;
  const { data } = useApp();
  const [booking, setBooking] = useState<BookingRecord | null>(stateBooking || null);
  const [loading, setLoading] = useState(!stateBooking);
  const [error, setError] = useState<string | null>(null);

  useDocumentMeta({
    title: bookingCode ? `Booking ${bookingCode} | MY CONCRETE` : 'Booking Confirmation',
    description: 'Download PDF receipt, .ics calendar file, or share your MY CONCRETE booking via WhatsApp or Email.',
  });

  useEffect(() => {
    if (!bookingCode || (stateBooking && stateBooking.booking_code === bookingCode)) return;
    setLoading(true);
    fetch(`/api/bookings/${encodeURIComponent(bookingCode)}`)
      .then((r) => readApiJson<{ booking: BookingRecord }>(r))
      .then((json) => {
        setBooking(json.booking);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load booking'))
      .finally(() => setLoading(false));
  }, [bookingCode, stateBooking]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center text-sm text-[var(--muted)]">
        Loading booking confirmation...
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-4">
        <h1 className="font-display font-bold text-2xl">Booking Not Found</h1>
        <p className="text-sm text-[var(--muted)]">{error}</p>
        <Link to="/book" className="btn-orange-pill px-5 py-2.5 text-sm">
          Book Concrete / Bricks Delivery
        </Link>
      </div>
    );
  }

  const biz = data?.businessConfig;
  const isPieces = booking.unit_type === 'pieces';
  const unitLabel = isPieces ? 'pieces' : 'm³';
  const ownerEmail = biz?.email || CONTACT_CONFIG.email;
  const ownerWhatsapp = biz?.whatsapp || biz?.phone || CONTACT_CONFIG.whatsappDisplay;

  const fullBookingMessage = [
    `*MY CONCRETE BOOKING: ${booking.booking_code}* (${booking.status.toUpperCase()})`,
    booking.dispatch_plant_name ? `Delivery From: ${booking.dispatch_plant_name} Plant` : null,
    `Customer: ${booking.customer_name}`,
    `Mobile: +91 ${booking.phone}`,
    booking.email ? `Email: ${booking.email}` : null,
    booking.gst_number ? `GSTIN: ${booking.gst_number}` : null,
    `Product & Grade: ${booking.grade} (${booking.product_name})`,
    `Quantity: ${Number(booking.quantity_m3).toLocaleString('en-IN')} ${unitLabel}${
      !isPieces
        ? ` | Usage: ${booking.usage_type} | Slump: ${booking.slump_mm} | Pump: ${
            booking.pump_type === 'none' ? 'Chute' : `${booking.pump_type.toUpperCase()} Pump`
          }`
        : ''
    }`,
    `Scheduled: ${booking.delivery_date} (${booking.slot_label})`,
    `Site: ${booking.site_address}${booking.landmark ? ` (Near ${booking.landmark})` : ''}, ${booking.city} (~${booking.distance_km} km)`,
    `Indicative Estimate: INR ${Number(booking.estimated_total).toLocaleString('en-IN')}`,
    booking.notes ? `Notes: ${booking.notes}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  const whatsappUrl = buildWhatsAppUrl(ownerWhatsapp, fullBookingMessage);
  const bookingEmailSubject = `MY CONCRETE Booking ${booking.booking_code} – ${booking.customer_name}`;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 lg:py-16 space-y-8">
      <div className="warm-card p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D7E4FF] dark:border-[#264096] pb-5">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-7 h-7 text-[#16A34A] shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-mono text-[var(--muted)]">Booking Reference ID</p>
              <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-[#0F1F5C] dark:text-white tabular-nums">
                {booking.booking_code}
              </h1>
              <p className="text-xs font-semibold text-[#16A34A] mt-1">
                Our team will call you shortly to confirm dispatch.
              </p>
            </div>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide self-start ${
              booking.status === 'waitlisted'
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
            }`}
          >
            {booking.status}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-[var(--muted)]">Product &amp; Grade/Size</p>
            <p className="font-semibold">{booking.grade} · {booking.product_name}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--muted)]">Quantity &amp; Placement</p>
            <p className="font-semibold tabular-nums">
              {Number(booking.quantity_m3).toLocaleString('en-IN')} {unitLabel}
              {!isPieces && ` · ${booking.pump_type === 'none' ? 'Chute' : `${booking.pump_type.toUpperCase()} Pump`}`}
            </p>
          </div>
          <div>
            <p className="text-xs text-[var(--muted)]">Scheduled Date &amp; 24/7 Slot</p>
            <p className="font-semibold tabular-nums">{booking.delivery_date} ({booking.slot_label})</p>
          </div>
          <div>
            <p className="text-xs text-[var(--muted)]">Delivery Site &amp; Dispatch Unit</p>
            <p className="font-semibold">
              {booking.site_address}, {booking.city} ({booking.distance_km} km
              {booking.dispatch_plant_name ? ` from ${booking.dispatch_plant_name}` : ''})
            </p>
          </div>
          <div>
            <p className="text-xs text-[var(--muted)]">Customer Contact</p>
            <p className="font-semibold tabular-nums">{booking.customer_name} · +91 {booking.phone}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--muted)]">Indicative Estimate</p>
            <p className="font-slab font-bold text-lg text-[#D92B25] tabular-nums">
              ₹{Number(booking.estimated_total).toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        <p className="text-xs text-[var(--muted)] bg-[var(--bg)] rounded-xl p-3 border border-[#D7E4FF] dark:border-[#264096]">
          Prices shown are indicative estimates; final invoicing and dispatch confirmation will be provided by the MY CONCRETE Kotihal team.
        </p>

        <div className="flex flex-wrap gap-3 pt-2">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-[#16A34A] text-white px-4 min-h-[44px] py-2.5 text-sm font-semibold hover:brightness-110"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Send on WhatsApp</span>
          </a>

          <MailLink
            email={ownerEmail}
            subject={bookingEmailSubject}
            body={fullBookingMessage}
            className="justify-center gap-2 rounded-full bg-[#D92B25] text-white px-4 py-2.5 text-sm font-semibold hover:brightness-110"
          >
            <Mail className="w-4 h-4" />
            <span>Send via Email</span>
          </MailLink>

          <button
            type="button"
            onClick={() => biz && downloadBookingPdf(booking, biz)}
            className="btn-blue-pill px-4 py-2.5 text-sm"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF</span>
          </button>

          <button
            type="button"
            onClick={() => biz && downloadBookingIcs(booking, biz)}
            className="inline-flex items-center gap-2 rounded-full border border-[#D7E4FF] dark:border-[#264096] px-4 py-2.5 text-sm font-semibold hover:border-[#D92B25]"
          >
            <CalendarPlus className="w-4 h-4" />
            <span>Add to Calendar (.ics)</span>
          </button>

          <CallLink
            phone={biz?.phone || '+91 73378 07372'}
            whatsapp={ownerWhatsapp}
            whatsappMessage={fullBookingMessage}
            className="inline-flex items-center gap-2 rounded-full bg-[#0F1F5C] text-white px-4 min-h-[44px] py-2.5 text-sm font-semibold hover:bg-[#1F3FA8] transition-colors"
          >
            <Phone className="w-4 h-4 text-[#FFC93C]" />
            <span className="tabular-nums">Call {biz?.phone || '+91 73378 07372'}</span>
          </CallLink>

          <Link
            to="/track"
            className="inline-flex items-center rounded-full border border-[#D7E4FF] dark:border-[#264096] px-4 py-2.5 text-sm font-semibold hover:border-[#D92B25]"
          >
            Reschedule / Cancel
          </Link>
        </div>
      </div>
    </div>
  );
}
