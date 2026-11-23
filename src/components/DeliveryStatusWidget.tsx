import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Clock,
  Flame,
  RefreshCw,
  Truck,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { parseJsonResponse } from '../utils/api.ts';

interface UpcomingSlotSummary {
  date: string;
  dateLabel: string;
  id: string;
  label: string;
  isNight: boolean;
  isCurrent: boolean;
  bookedCount: number;
  maxBookings: number;
  remainingBookings: number;
  remainingVolumeM3: number;
  isFull: boolean;
}

interface DeliveryStatusPayload {
  statusMode: 'active' | 'high-demand' | 'scheduled';
  statusHeadline: string;
  statusHeadlineKn: string;
  todayDate: string;
  currentWindowLabel: string;
  nextSlotDate: string;
  nextSlotDateLabel: string;
  nextSlotId: string;
  nextSlotLabel: string;
  utilizationPct: number;
  remainingBookingsToday: number;
  totalBookingsToday: number;
  remainingVolumeM3Today: number;
  activePlants: Array<{
    id: string;
    shortLabel: string;
    city: string;
    hours: string;
  }>;
  upcomingSlots: UpcomingSlotSummary[];
  updatedAtIst: string;
  updatedAtIso: string;
}

export function DeliveryStatusWidget() {
  const { lang } = useApp();
  const [status, setStatus] = useState<DeliveryStatusPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadStatus = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    try {
      const res = await fetch('/api/delivery-status', { cache: 'no-store' });
      const parsed = await parseJsonResponse<DeliveryStatusPayload>(res);
      if (res.ok && parsed.data?.statusHeadline) {
        setStatus(parsed.data);
      }
    } catch {
      // keep previous status quietly on transient network hiccup
    } finally {
      setLoading(false);
      if (manual) {
        setTimeout(() => setRefreshing(false), 300);
      }
    }
  }, []);

  useEffect(() => {
    void loadStatus(false);
    const interval = setInterval(() => {
      void loadStatus(false);
    }, 30_000);
    const onFocus = () => void loadStatus(false);
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [loadStatus]);

  const mode = status?.statusMode || 'active';
  const headline =
    lang === 'kn' && status?.statusHeadlineKn
      ? status.statusHeadlineKn
      : status?.statusHeadline || 'Active - Accepting Orders';

  const isHighDemand = mode === 'high-demand';
  const isScheduled = mode === 'scheduled';

  const nextSlotUrl = status
    ? `/book?date=${encodeURIComponent(status.nextSlotDate)}&slot=${encodeURIComponent(status.nextSlotId)}`
    : '/book';

  const plantNames =
    status?.activePlants && status.activePlants.length > 0
      ? status.activePlants.map((p) => p.shortLabel).join(' & ')
      : 'Kotihal & Davangere';

  return (
    <section
      id="real-time-delivery-status"
      aria-label="Real-time Delivery Status"
      className="bg-[var(--bg)] px-4 sm:px-6 pt-8 pb-2"
    >
      <div className="max-w-[1260px] mx-auto rounded-[20px] bg-[var(--surface)] border border-[#D7E4FF] dark:border-[#264096] shadow-[var(--shadow-blue)] p-5 sm:p-6 space-y-5">
        {/* Top Row: Live Status Indicator + Capacity + CTA */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2 min-w-0 flex-1" role="status" aria-live="polite">
            <div className="flex flex-wrap items-center gap-2.5">
              <span
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold border ${
                  isHighDemand
                    ? 'bg-[#FFF0EF] border-[#D92B25]/35 text-[#B9221D] dark:bg-[#D92B25]/20 dark:border-[#D92B25]/50 dark:text-[#FFD6D4]'
                    : isScheduled
                    ? 'bg-[#FFFBEB] border-[#D99B00]/35 text-[#926200] dark:bg-[#FFC93C]/15 dark:border-[#FFC93C]/40 dark:text-[#FFC93C]'
                    : 'bg-emerald-50 border-emerald-600/25 text-emerald-800 dark:bg-emerald-500/20 dark:border-emerald-400/40 dark:text-emerald-200'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isHighDemand
                      ? 'bg-[#D92B25] animate-pulse'
                      : isScheduled
                      ? 'bg-[#D99B00]'
                      : 'bg-emerald-500 animate-pulse'
                  }`}
                />
                {isHighDemand ? (
                  <Flame className="w-3.5 h-3.5 shrink-0" />
                ) : isScheduled ? (
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                )}
                <span>{loading && !status ? 'Checking Live Dispatch...' : headline}</span>
              </span>

              <span className="text-xs font-medium text-[var(--muted)]">
                Real-Time Dispatch · {plantNames} Units
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm text-[#0F1F5C] dark:text-slate-200">
              <span className="inline-flex items-center gap-1.5 font-semibold">
                <Truck className="w-4 h-4 text-[#1F3FA8] dark:text-[#FFC93C] shrink-0" />
                <span>
                  Current Window:{' '}
                  <strong className="tabular-nums">
                    {status?.currentWindowLabel || '24 Hours Open'}
                  </strong>
                </span>
              </span>
              {status && (
                <>
                  <span className="text-[var(--muted)]" aria-hidden="true">
                    ·
                  </span>
                  <span className="text-[var(--muted)] tabular-nums">
                    <strong className="text-[#0F1F5C] dark:text-white">
                      {status.remainingBookingsToday}
                    </strong>{' '}
                    of {status.totalBookingsToday} dispatch slots open today (
                    <strong className="text-[#0F1F5C] dark:text-white">
                      {status.remainingVolumeM3Today} m³
                    </strong>{' '}
                    available)
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Right: Demand Meter + Refresh + Direct Next Slot CTA */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">
            {status && (
              <div className="rounded-xl bg-[var(--bg)] border border-[#D7E4FF] dark:border-[#264096] px-3.5 py-2 min-w-[165px]">
                <div className="flex items-center justify-between gap-2 text-[11px] font-semibold text-[#0F1F5C] dark:text-slate-200">
                  <span>Today&apos;s Demand</span>
                  <span className="font-mono tabular-nums">{status.utilizationPct}%</span>
                </div>
                <div className="mt-1.5 h-1.5 w-full rounded-full bg-[#D7E4FF] dark:bg-[#0F1F5C] overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      status.utilizationPct >= 65
                        ? 'bg-[#D92B25]'
                        : status.utilizationPct >= 35
                        ? 'bg-[#FFC93C]'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.max(8, status.utilizationPct)}%` }}
                  />
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => void loadStatus(true)}
              aria-label="Refresh live delivery status"
              title={status ? `Updated ${status.updatedAtIst}` : 'Refresh live delivery status'}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] hover:border-[#1F3FA8] px-3 py-2.5 text-xs font-semibold text-[#0F1F5C] dark:text-slate-200 transition-colors cursor-pointer min-h-[44px]"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-[#1F3FA8] dark:text-[#FFC93C] ${
                  refreshing ? 'animate-spin' : ''
                }`}
              />
              <span className="tabular-nums whitespace-nowrap">
                {status?.updatedAtIst || 'Live'}
              </span>
            </button>

            <Link
              to={nextSlotUrl}
              className="btn-orange-pill px-5 py-2.5 text-xs sm:text-sm whitespace-nowrap min-h-[44px]"
            >
              <span>Book Next Slot</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </Link>
          </div>
        </div>

        {/* Upcoming 2-Hour Dispatch Windows Strip */}
        {status && status.upcomingSlots.length > 0 && (
          <div className="pt-4 border-t border-[#EAF1FF] dark:border-[#264096]">
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <p className="text-xs font-semibold text-[#0F1F5C] dark:text-slate-200 flex items-center gap-1.5">
                <CalendarClock className="w-3.5 h-3.5 text-[#D92B25]" />
                <span>Next Upcoming 2-Hour Dispatch Windows (Click to Reserve)</span>
              </p>
              <Link
                to="/book"
                className="text-xs font-semibold text-[#1F3FA8] dark:text-[#FFC93C] hover:underline whitespace-nowrap"
              >
                Full 24h Schedule &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {status.upcomingSlots.map((slot) => {
                const isNext =
                  slot.date === status.nextSlotDate && slot.id === status.nextSlotId;
                const fillingFast = !slot.isFull && slot.remainingBookings <= 1;
                const slotHref = `/book?date=${encodeURIComponent(slot.date)}&slot=${encodeURIComponent(slot.id)}`;

                return (
                  <Link
                    key={`${slot.date}-${slot.id}`}
                    to={slotHref}
                    className={`rounded-xl border px-3.5 py-2.5 transition-colors flex flex-col justify-between gap-1 ${
                      slot.isFull
                        ? 'bg-[var(--bg)] border-[#D7E4FF] dark:border-[#264096] opacity-75'
                        : isNext
                        ? 'bg-[#EAF1FF]/70 dark:bg-[#1F3FA8]/35 border-[#1F3FA8] dark:border-[#FFC93C]'
                        : 'bg-[var(--bg)] border-[#D7E4FF] dark:border-[#264096] hover:border-[#1F3FA8]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 text-[11px]">
                      <span className="font-semibold text-[var(--muted)]">
                        {slot.dateLabel}
                        {slot.isCurrent ? ' · Now' : ''}
                      </span>
                      <span
                        className={`font-bold tabular-nums ${
                          slot.isFull
                            ? 'text-[#D92B25]'
                            : fillingFast
                            ? 'text-[#D97706] dark:text-[#FFC93C]'
                            : 'text-emerald-700 dark:text-emerald-300'
                        }`}
                      >
                        {slot.isFull
                          ? 'Full'
                          : fillingFast
                          ? `${slot.remainingBookings} slot left`
                          : `${slot.remainingBookings} slots open`}
                      </span>
                    </div>
                    <p className="font-display font-bold text-xs text-[#0F1F5C] dark:text-white tabular-nums truncate">
                      {slot.label}
                    </p>
                    <p className="text-[11px] text-[var(--muted)] tabular-nums">
                      {slot.isFull
                        ? 'Waitlist / choose next slot'
                        : `${slot.remainingVolumeM3} m³ capacity remaining`}
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
