import { jsPDF } from 'jspdf';
import type { BookingRecord, BusinessConfig } from '../types/index.ts';

export function cleanPhoneDigits(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

export function isPlaceholderValue(val: string): boolean {
  return !val || val.includes('[') || val.includes(']');
}

export function buildWhatsAppUrl(phoneOrWhatsapp: string, message?: string): string {
  const clean = cleanPhoneDigits(phoneOrWhatsapp || '917337807372');
  const target = !clean || clean.length < 10 ? '917337807372' : clean;
  if (!message) {
    return `https://wa.me/${target}`;
  }
  return `https://wa.me/${target}?text=${encodeURIComponent(message)}`;
}

export function downloadBookingPdf(booking: BookingRecord, biz: BusinessConfig): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  doc.setFillColor(15, 31, 92);
  doc.rect(0, 0, 210, 34, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.text('MY CONCRETE – Readymix Concrete Unit', 16, 15);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`${biz.tagline} | ${biz.region}`, 16, 23);

  doc.setTextColor(20, 33, 61);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Booking ID: ${booking.booking_code}`, 16, 46);
  doc.text(`Status: ${booking.status.toUpperCase()}`, 145, 46);

  doc.setDrawColor(215, 228, 255);
  doc.line(16, 51, 194, 51);

  const unitLabel = booking.unit_type === 'pieces' ? 'pieces' : 'm³';

  const rows: Array<[string, string]> = [
    ['Customer Name', booking.customer_name],
    ['Mobile Number', `+91 ${booking.phone}`],
    ['Email', booking.email || 'Not provided'],
    ['Product & Grade/Size', `${booking.grade} (${booking.product_name})`],
    ['Quantity', `${booking.quantity_m3} ${unitLabel}`],
    ['Usage / Workability', `${booking.usage_type} | ${booking.slump_mm}`],
    [
      'Pump Requirement',
      booking.unit_type === 'pieces'
        ? 'Not applicable (Bricks / Blocks)'
        : booking.pump_type === 'none'
          ? 'Chute Discharge (No Pump)'
          : `${booking.pump_type.toUpperCase()} Pump`,
    ],
    ['Scheduled Date', booking.delivery_date],
    ['Time Window', booking.slot_label],
    ['Site Address', `${booking.site_address}, ${booking.city}`],
    ['Distance from Kotihal Plant', `${booking.distance_km} km`],
    ['Indicative Product Amount', `INR ${Number(booking.estimated_concrete_amount).toLocaleString('en-IN')}`],
    ['Indicative Delivery', `INR ${Number(booking.estimated_delivery_fee).toLocaleString('en-IN')}`],
    ['Indicative Pump Fee', `INR ${Number(booking.estimated_pump_fee).toLocaleString('en-IN')}`],
    ['Indicative Total', `INR ${Number(booking.estimated_total).toLocaleString('en-IN')}`],
  ];

  let y = 60;
  doc.setFontSize(10);
  for (const [label, value] of rows) {
    doc.setFont('helvetica', 'bold');
    doc.text(label, 16, y);
    doc.setFont('helvetica', 'normal');
    const wrapped = doc.splitTextToSize(value, 118);
    doc.text(wrapped, 74, y);
    y += Math.max(7, wrapped.length * 5.5);
  }

  y += 6;
  doc.setDrawColor(215, 228, 255);
  doc.line(16, y, 194, y);
  y += 8;
  doc.setFontSize(9);
  doc.setTextColor(90, 103, 132);
  doc.text(
    `Plant: ${biz.address} | Phone: ${biz.phone}. All online amounts are indicative estimates; final price is confirmed by the MY CONCRETE team.`,
    16,
    y,
    { maxWidth: 178 }
  );

  doc.save(`${booking.booking_code}-confirmation.pdf`);
}

export function downloadBookingIcs(booking: BookingRecord, biz: BusinessConfig): void {
  const dateCompact = booking.delivery_date.replace(/-/g, '');
  let startHour = '080000';
  let endHour = '100000';

  const slotHours: Record<string, [string, string]> = {
    'slot-00-02': ['000000', '020000'],
    'slot-02-04': ['020000', '040000'],
    'slot-04-06': ['040000', '060000'],
    'slot-06-08': ['060000', '080000'],
    'slot-08-10': ['080000', '100000'],
    'slot-10-12': ['100000', '120000'],
    'slot-12-14': ['120000', '140000'],
    'slot-14-16': ['140000', '160000'],
    'slot-16-18': ['160000', '180000'],
    'slot-18-20': ['180000', '200000'],
    'slot-20-22': ['200000', '220000'],
    'slot-22-24': ['220000', '235900'],
  };
  if (slotHours[booking.slot_id]) {
    [startHour, endHour] = slotHours[booking.slot_id];
  }

  const unitLabel = booking.unit_type === 'pieces' ? 'pieces' : 'm3';

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MY CONCRETE//RMC Dispatch//EN',
    'BEGIN:VEVENT',
    `UID:${booking.booking_code}@myconcrete`,
    `DTSTAMP:${dateCompact}T000000Z`,
    `DTSTART:${dateCompact}T${startHour}`,
    `DTEND:${dateCompact}T${endHour}`,
    `SUMMARY:MY CONCRETE Delivery ${booking.booking_code} (${booking.quantity_m3} ${unitLabel} ${booking.grade})`,
    `LOCATION:${booking.site_address}, ${booking.city}`,
    `DESCRIPTION:Booking ${booking.booking_code}. Product: ${booking.grade}, Qty: ${booking.quantity_m3} ${unitLabel}. Plant Contact: ${biz.phone}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${booking.booking_code}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
