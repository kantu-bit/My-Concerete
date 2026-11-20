import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Search } from 'lucide-react';
import { useDocumentMeta } from '../utils/seo.ts';
import { readApiJson } from '../utils/api.ts';
import type { BookingRecord, SlotAvailability } from '../types/index.ts';

export function TrackBookingPage() {
  const [bookingCode, setBookingCode] = useState('');
  const [phone, setPhone] = useState('');
  const [booking, setBooking] = useState<BookingRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [newDate, setNewDate] = useState('');
  const [newSlotId, setNewSlotId] = useState('');
  const [slots, setSlots] = useState<SlotAvailability[]>([]);

  useDocumentMeta({
    title: 'Track, Reschedule or Cancel Booking | MY CONCRETE',
    description: 'Look up your MY CONCRETE delivery booking using your Booking ID and 10-digit mobile number.',
  });

  async function lookup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      const res = await fetch('/api/bookings/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingCode: bookingCode.trim(), phone: phone.trim() }),
      });
      const json = await readApiJson<{ booking: BookingRecord }>(res);
      setBooking(json.booking);
      setNewDate(json.booking.delivery_date);
      loadSlots(json.booking.delivery_date);
    } catch (err) {
      setBooking(null);
      setError(err instanceof Error ? err.message : 'Lookup failed.');
    } finally {
      setLoading(false);
    }
  }

  async function loadSlots(dateStr: string) {
    if (!dateStr) return;
    try {
      const res = await fetch(`/api/availability?date=${encodeURIComponent(dateStr)}`);
      const json = await readApiJson<{ valid: boolean; slots?: SlotAvailability[] }>(res);
      if (json.valid && Array.isArray(json.slots)) {
        setSlots(json.slots);
        const firstOpen = json.slots.find((s: SlotAvailability) => !s.isFull);
        if (firstOpen) setNewSlotId(firstOpen.id);
      } else {
        setSlots([]);
      }
    } catch {
      setSlots([]);
    }
  }

  async function handleManage(action: 'cancel' | 'reschedule') {
    if (!booking) return;
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/bookings/${encodeURIComponent(booking.booking_code)}/manage`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone.trim(),
          action,
          newDate,
          newSlotId,
        }),
      });
      const json = await readApiJson<{ booking: BookingRecord }>(res);
      setBooking(json.booking);
      setMessage(
        action === 'cancel'
          ? 'Your booking has been cancelled.'
          : `Your booking has been rescheduled to ${json.booking.delivery_date} (${json.booking.slot_label}).`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed.');
    }
  }

  const unitLabel = booking?.unit_type === 'pieces' ? 'pieces' : 'm³';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 lg:py-16 space-y-8">
      <div className="space-y-2">
        <p className="text-xs font-semibold text-[#D92B25]">24/7 Self-Service Dispatch</p>
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-[#0F1F5C] dark:text-white">
          Track, Reschedule or Cancel Booking
        </h1>
      </div>

      <form onSubmit={lookup} className="warm-card p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
        <div>
          <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">Booking ID *</label>
          <input
            type="text"
            required
            value={bookingCode}
            onChange={(e) => setBookingCode(e.target.value.toUpperCase())}
            placeholder="MC-2026-0001"
            className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3.5 py-2.5 text-sm font-mono uppercase"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">Mobile Number *</label>
          <input
            type="tel"
            required
            maxLength={10}
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
            placeholder="10-digit mobile"
            className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3.5 py-2.5 text-sm tabular-nums"
          />
        </div>
        <button type="submit" disabled={loading} className="btn-orange-pill py-2.5 px-5 text-sm">
          <Search className="w-4 h-4" />
          <span>{loading ? 'Searching...' : 'Look Up Booking'}</span>
        </button>
      </form>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-300 bg-red-50 dark:bg-red-950/40 dark:border-red-800 p-4 text-sm text-red-700 dark:text-red-300">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {message && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 dark:border-emerald-800 p-4 text-sm text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {booking && (
        <div className="warm-card p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#D7E4FF] dark:border-[#264096] pb-4">
            <div>
              <p className="font-mono text-lg font-bold text-[#0F1F5C] dark:text-white">{booking.booking_code}</p>
              <p className="text-xs text-[var(--muted)]">
                {booking.grade} · {Number(booking.quantity_m3).toLocaleString('en-IN')} {unitLabel} ·{' '}
                {booking.delivery_date} ({booking.slot_label})
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-[var(--bg-soft)] text-xs font-bold uppercase">
                {booking.status}
              </span>
              <Link to={`/booking/${booking.booking_code}`} className="text-xs font-semibold text-[#D92B25] hover:underline">
                View Receipt / PDF
              </Link>
            </div>
          </div>

          {!['cancelled', 'completed', 'dispatched'].includes(booking.status) && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              <div className="md:col-span-4">
                <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">
                  New Delivery Date
                </label>
                <input
                  type="date"
                  min={new Date().toISOString().slice(0, 10)}
                  value={newDate}
                  onChange={(e) => {
                    setNewDate(e.target.value);
                    loadSlots(e.target.value);
                  }}
                  className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3 py-2 text-sm tabular-nums"
                />
              </div>

              <div className="md:col-span-4">
                <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">
                  New 24/7 Slot
                </label>
                <select
                  value={newSlotId}
                  onChange={(e) => setNewSlotId(e.target.value)}
                  className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3 py-2 text-sm"
                >
                  {slots.length === 0 && <option value="">No available slots on date</option>}
                  {slots.map((s) => (
                    <option key={s.id} value={s.id} disabled={s.isFull}>
                      {s.label} ({s.remainingVolumeM3} m³ open)
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-4 flex gap-2">
                <button
                  type="button"
                  disabled={!newSlotId}
                  onClick={() => handleManage('reschedule')}
                  className="flex-1 btn-blue-pill py-2 px-3 text-xs disabled:opacity-40"
                >
                  Reschedule
                </button>
                <button
                  type="button"
                  onClick={() => handleManage('cancel')}
                  className="rounded-full border border-red-400 text-red-600 dark:text-red-400 py-2 px-3 text-xs font-semibold hover:bg-red-50 dark:hover:bg-red-950/30"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
