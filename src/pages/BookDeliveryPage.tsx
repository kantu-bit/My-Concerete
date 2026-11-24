import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MapPin,
  Moon,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { useDocumentMeta } from '../utils/seo.ts';
import { FRIENDLY_API_ERROR, parseJsonResponse, readApiJson } from '../utils/api.ts';
import { PlantMap } from '../components/PlantMap.tsx';
import type { SlotAvailability } from '../types/index.ts';
import { CONTACT_CONFIG } from '../config/contact.ts';

interface BookingDraft {
  productSlug: string;
  grade: string;
  quantityM3: number;
  usageType: string;
  slumpMm: string;
  pumpType: 'none' | 'line' | 'boom';
  deliveryDate: string;
  slotId: string;
  dispatchPlantId?: string;
  siteAddress: string;
  landmark: string;
  city: string;
  siteLat: number;
  siteLng: number;
  customerName: string;
  phone: string;
  email: string;
  gstNumber: string;
  notes: string;
}

interface SavedCustomerRecord {
  id: string;
  customerName: string;
  phone: string;
  email: string;
  gstNumber: string;
  siteAddress: string;
  landmark: string;
  city: string;
  siteLat: number;
  siteLng: number;
}

interface EstimateResponse {
  unitType?: string;
  dispatchPlantId?: string;
  dispatchPlantName?: string;
  distanceKm: number;
  withinServiceRadius: boolean;
  serviceRadiusKm: number;
  unitRate: number;
  estimatedConcreteAmount: number;
  estimatedDeliveryFee: number;
  estimatedPumpFee: number;
  estimatedTotal: number;
}

const DRAFT_KEY = 'mc_booking_draft_v2';
const SAVED_CUSTOMERS_KEY = 'mc_saved_customers_v1';

function loadSavedCustomers(): SavedCustomerRecord[] {
  try {
    const raw = localStorage.getItem(SAVED_CUSTOMERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getNextOpenDate(closedDays: number[], holidays: string[]): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  for (let i = 0; i < 30; i += 1) {
    const iso = d.toISOString().slice(0, 10);
    if (!closedDays.includes(d.getDay()) && !holidays.includes(iso)) {
      return iso;
    }
    d.setDate(d.getDate() + 1);
  }
  return new Date(Date.now() + 86400000).toISOString().slice(0, 10);
}

const TOWN_PRESETS = [
  { name: 'Ranebennur', lat: 14.6197, lng: 75.6295 },
  { name: 'Davangere', lat: 14.4644, lng: 75.9218 },
  { name: 'Harihar', lat: 14.5133, lng: 75.8065 },
  { name: 'Kotihal', lat: 14.4607, lng: 75.6633 },
  { name: 'Byadgi', lat: 14.6778, lng: 75.4892 },
  { name: 'Haveri', lat: 14.7951, lng: 75.3991 },
];

export function BookDeliveryPage() {
  const { data, lang } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const products = (data?.products || []).filter((p) => p.isOffered);
  const biz = data?.businessConfig;
  const scheduling = data?.schedulingConfig;
  const plantLocations =
    data?.plantLocations && data.plantLocations.length > 0
      ? data.plantLocations
      : biz
        ? [
            {
              id: 'kotihal',
              name: biz.businessName,
              shortLabel: 'Kotihal',
              address: biz.address,
              city: 'Ranebennur',
              postalCode: '581119',
              lat: biz.plantLat,
              lng: biz.plantLng,
              phone: biz.phone || '+91 73378 07372',
              whatsapp: biz.whatsapp || biz.phone || '+91 73378 07372',
              hours: biz.workingHours || 'Open 24 Hours (All Days)',
              serviceRadiusKm: biz.serviceRadiusKm || 50,
              googleMapsUrl:
                biz.googleMapsUrl ||
                `https://www.google.com/maps/dir/?api=1&destination=${biz.plantLat},${biz.plantLng}`,
              pinColor: 'blue' as const,
              isPrimary: true,
            },
            {
              id: 'davangere',
              name: 'MY CONCRETE – Davangere Unit',
              shortLabel: 'Davangere',
              address: CONTACT_CONFIG.davangereUnitAddress,
              city: 'Davangere',
              postalCode: CONTACT_CONFIG.davangerePostalCode,
              lat: 14.4644,
              lng: 75.9218,
              phone: '+91 73378 07372',
              whatsapp: '+91 73378 07372',
              hours: 'Open 24 Hours (All Days)',
              serviceRadiusKm: 50,
              googleMapsUrl: CONTACT_CONFIG.davangereGoogleMapsUrl,
              pinColor: 'red' as const,
              isPrimary: false,
            },
          ]
        : [];

  const [step, setStep] = useState(1);
  const [websiteUrl, setWebsiteUrl] = useState(''); // honeypot
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [waitlistPrompt, setWaitlistPrompt] = useState(false);
  const [savedCustomers, setSavedCustomers] = useState<SavedCustomerRecord[]>(() => loadSavedCustomers());
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const siteAddressRef = useRef<HTMLTextAreaElement | null>(null);

  const [availability, setAvailability] = useState<{
    valid: boolean;
    reason: string | null;
    slots: SlotAvailability[];
  } | null>(null);
  const [availLoading, setAvailLoading] = useState(false);

  const [estimate, setEstimate] = useState<EstimateResponse | null>(null);

  const [draft, setDraft] = useState<BookingDraft>(() => {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Partial<BookingDraft>;
        return {
          productSlug: parsed.productSlug || 'standard-grades',
          grade: parsed.grade || 'M25',
          quantityM3: Number(parsed.quantityM3) > 0 ? Number(parsed.quantityM3) : 6,
          usageType: parsed.usageType || 'Roof Slab',
          slumpMm: parsed.slumpMm || '120–140 mm',
          pumpType: parsed.pumpType === 'line' || parsed.pumpType === 'boom' ? parsed.pumpType : 'none',
          deliveryDate: typeof parsed.deliveryDate === 'string' ? parsed.deliveryDate : '',
          slotId: parsed.slotId || 'slot-08-10',
          dispatchPlantId: parsed.dispatchPlantId || 'kotihal',
          siteAddress: typeof parsed.siteAddress === 'string' ? parsed.siteAddress : '',
          landmark: typeof parsed.landmark === 'string' ? parsed.landmark : '',
          city: typeof parsed.city === 'string' && parsed.city ? parsed.city : 'Ranebennur',
          siteLat: Number.isFinite(Number(parsed.siteLat)) ? Number(parsed.siteLat) : 14.6197,
          siteLng: Number.isFinite(Number(parsed.siteLng)) ? Number(parsed.siteLng) : 75.6295,
          customerName: typeof parsed.customerName === 'string' ? parsed.customerName : '',
          phone: typeof parsed.phone === 'string' ? parsed.phone : '',
          email: typeof parsed.email === 'string' ? parsed.email : '',
          gstNumber: typeof parsed.gstNumber === 'string' ? parsed.gstNumber : '',
          notes: typeof parsed.notes === 'string' ? parsed.notes : '',
        };
      } catch {
        // ignore invalid draft
      }
    }
    return {
      productSlug: 'standard-grades',
      grade: 'M25',
      quantityM3: 6,
      usageType: 'Roof Slab',
      slumpMm: '120–140 mm',
      pumpType: 'none',
      deliveryDate: '',
      slotId: 'slot-08-10',
      dispatchPlantId: 'kotihal',
      siteAddress: '',
      landmark: '',
      city: 'Ranebennur',
      siteLat: 14.6197,
      siteLng: 75.6295,
      customerName: '',
      phone: '',
      email: '',
      gstNumber: '',
      notes: '',
    };
  });

  useDocumentMeta({
    title: 'Book 24/7 Concrete & Brick Delivery | MY CONCRETE Ranebennur & Davangere',
    description:
      'Schedule 24/7 Ready-Mix Concrete or Cement Bricks delivery from Kotihal or Davangere across Ranebennur & Davangere with 2-hour day/night windows.',
  });

  // Apply URL query parameters from Volume/Brick Calculator, Delivery Status, Plant Map, Admin Customers, or Product pages
  useEffect(() => {
    const qQty = Number(searchParams.get('qty'));
    const qProduct = searchParams.get('product');
    const qGrade = searchParams.get('grade');
    const qUsage = searchParams.get('usage');
    const qPlant = searchParams.get('plant');
    const qDate = searchParams.get('date');
    const qSlot = searchParams.get('slot');
    const qName = searchParams.get('customerName');
    const qPhone = searchParams.get('phone');
    const qEmail = searchParams.get('email');
    const qAddress = searchParams.get('address');
    const qCity = searchParams.get('city');
    const qLandmark = searchParams.get('landmark');
    const qGst = searchParams.get('gst');
    const qLat = Number(searchParams.get('lat'));
    const qLng = Number(searchParams.get('lng'));

    if (
      !qQty &&
      !qProduct &&
      !qGrade &&
      !qUsage &&
      !qPlant &&
      !qDate &&
      !qSlot &&
      !qName &&
      !qPhone &&
      !qEmail &&
      !qAddress &&
      !qCity &&
      !qLandmark &&
      !qGst &&
      !Number.isFinite(qLat) &&
      !Number.isFinite(qLng)
    ) {
      return;
    }

    if (qName && qPhone) {
      const custRecord: SavedCustomerRecord = {
        id: qPhone,
        customerName: qName,
        phone: qPhone,
        email: qEmail || '',
        gstNumber: qGst || '',
        siteAddress: qAddress || '',
        landmark: qLandmark || '',
        city: qCity || 'Ranebennur',
        siteLat: 14.6197,
        siteLng: 75.6295,
      };
      setSavedCustomers((prev) => {
        const nextList = [custRecord, ...prev.filter((c) => c.id !== custRecord.id)].slice(0, 20);
        try {
          localStorage.setItem(SAVED_CUSTOMERS_KEY, JSON.stringify(nextList));
        } catch {
          // ignore storage quota errors
        }
        return nextList;
      });
      setSelectedCustomerId(custRecord.id);
    }

    setDraft((prev) => {
      const next = { ...prev };
      if (qQty > 0) next.quantityM3 = qQty;
      if (qProduct) next.productSlug = qProduct;
      if (qGrade) next.grade = qGrade;
      if (qUsage) next.usageType = qUsage;
      if (qPlant) next.dispatchPlantId = qPlant;
      if (qDate && /^\d{4}-\d{2}-\d{2}$/.test(qDate)) next.deliveryDate = qDate;
      if (qSlot) next.slotId = qSlot;
      if (qName) next.customerName = qName;
      if (qPhone) next.phone = qPhone.replace(/\D/g, '').slice(0, 10);
      if (qEmail) next.email = qEmail;
      if (qAddress) next.siteAddress = qAddress;
      if (qCity) next.city = qCity;
      if (qLandmark) next.landmark = qLandmark;
      if (qGst) next.gstNumber = qGst;
      if (Number.isFinite(qLat) && qLat !== 0) next.siteLat = qLat;
      if (Number.isFinite(qLng) && qLng !== 0) next.siteLng = qLng;
      if (qProduct === 'cement-bricks') {
        next.pumpType = 'none';
        next.slumpMm = 'Per Piece';
      }
      return next;
    });
    if (qAddress && qAddress.trim().length >= 2) {
      setAddressError(null);
    }
  }, [searchParams]);

  // Initialize default open date & valid slot once scheduling config loads (and reset stale past draft dates)
  useEffect(() => {
    if (!scheduling) return;
    const todayIsoLocal = new Date().toISOString().slice(0, 10);
    if (!draft.deliveryDate || draft.deliveryDate < todayIsoLocal) {
      const fallbackSlot = scheduling.slots.find((s) => s.id === draft.slotId)?.id || scheduling.slots[4]?.id || scheduling.slots[0]?.id || 'slot-08-10';
      setDraft((prev) => ({
        ...prev,
        deliveryDate: getNextOpenDate(scheduling.closedDays, scheduling.holidays),
        slotId: fallbackSlot,
      }));
    }
  }, [scheduling, draft.deliveryDate, draft.slotId]);

  // Autosave draft
  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [draft]);

  const selectedProduct =
    products.find((p) => p.slug === draft.productSlug) || products[0];
  const isPieces = selectedProduct?.unitType === 'pieces';
  const selectedPlant =
    plantLocations.find((p) => p.id === draft.dispatchPlantId) ||
    plantLocations.find((p) => p.isPrimary) ||
    plantLocations[0];
  const activePlantId = selectedPlant?.id || draft.dispatchPlantId || 'kotihal';

  useEffect(() => {
    if (!selectedProduct) return;
    const validGrade = selectedProduct.grades.some((g) => g.grade === draft.grade);
    if (!validGrade && selectedProduct.grades[0]) {
      setDraft((prev) => ({
        ...prev,
        grade: selectedProduct.grades[0].grade,
        quantityM3:
          selectedProduct.unitType === 'pieces' && prev.quantityM3 < 50
            ? 500
            : selectedProduct.unitType === 'm3' && prev.quantityM3 > 250
              ? 6
              : prev.quantityM3,
        slumpMm: selectedProduct.unitType === 'pieces' ? 'Per Piece' : '120–140 mm',
        pumpType: selectedProduct.unitType === 'pieces' ? 'none' : prev.pumpType,
        usageType: selectedProduct.unitType === 'pieces' ? 'Masonry Wall' : prev.usageType,
      }));
    }
  }, [selectedProduct, draft.grade]);

  // Fetch live slot availability whenever deliveryDate changes
  useEffect(() => {
    if (!draft.deliveryDate) return;
    let active = true;
    setAvailLoading(true);
    fetch(`/api/availability?date=${encodeURIComponent(draft.deliveryDate)}`)
      .then((r) => readApiJson<{ valid: boolean; reason: string | null; slots: SlotAvailability[] }>(r))
      .then((json) => {
        if (active) setAvailability(json);
      })
      .catch(() => {
        if (active) setAvailability(null);
      })
      .finally(() => {
        if (active) setAvailLoading(false);
      });
    return () => {
      active = false;
    };
  }, [draft.deliveryDate]);

  // Fetch live distance & cost estimate
  useEffect(() => {
    if (!draft.productSlug || !draft.grade) return;
    fetch('/api/estimate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productSlug: draft.productSlug,
        grade: draft.grade,
        quantityM3: Math.max(1, Number(draft.quantityM3) || 1),
        pumpType: isPieces ? 'none' : draft.pumpType,
        siteLat: draft.siteLat,
        siteLng: draft.siteLng,
        plantId: activePlantId,
      }),
    })
      .then((r) => parseJsonResponse<EstimateResponse & { error?: string }>(r))
      .then(({ data, isJson }) => {
        if (isJson && data && !data.error) setEstimate(data);
      })
      .catch(() => {});
  }, [
    draft.productSlug,
    draft.grade,
    draft.quantityM3,
    draft.pumpType,
    draft.siteLat,
    draft.siteLng,
    activePlantId,
    isPieces,
  ]);

  function handleSelectCustomer(customerId: string) {
    setSelectedCustomerId(customerId);
    if (!customerId) return;
    const customer = savedCustomers.find((c) => c.id === customerId);
    if (!customer) return;
    setDraft((prev) => ({
      ...prev,
      customerName: customer.customerName || prev.customerName,
      phone: customer.phone || prev.phone,
      email: customer.email || prev.email,
      gstNumber: customer.gstNumber || prev.gstNumber,
      siteAddress: customer.siteAddress || prev.siteAddress,
      landmark: customer.landmark || prev.landmark,
      city: customer.city || prev.city,
      siteLat: Number.isFinite(customer.siteLat) && customer.siteLat !== 0 ? customer.siteLat : prev.siteLat,
      siteLng: Number.isFinite(customer.siteLng) && customer.siteLng !== 0 ? customer.siteLng : prev.siteLng,
    }));
    if ((customer.siteAddress || '').trim().length >= 2) {
      setAddressError(null);
    }
    setSubmitError(null);
  }

  function validateStep(current: number): { error: string | null; field?: 'siteAddress' } {
    if (current === 1) {
      if (!draft.productSlug || !draft.grade) return { error: 'Please select a product and grade/size.' };
    }
    if (current === 2) {
      if (isPieces) {
        if (draft.quantityM3 < 1 || draft.quantityM3 > 200000) {
          return { error: 'Please enter a valid number of bricks/blocks (1 to 200,000 pieces).' };
        }
      } else if (draft.quantityM3 < 1 || draft.quantityM3 > 250) {
        return { error: 'Please enter a concrete quantity between 1 and 250 m³.' };
      }
    }
    if (current === 3) {
      if (!draft.deliveryDate) return { error: 'Please select a delivery date.' };
      if (availability && !availability.valid) {
        return { error: `Selected date is unavailable (${availability.reason}). Please choose another date.` };
      }
      if (!draft.slotId) return { error: 'Please choose a 2-hour delivery window.' };
    }
    if (current === 4) {
      const trimmedAddress = (draft.siteAddress ?? '').trim();
      if (trimmedAddress.length < 2) {
        return { error: 'Please enter your delivery site address.', field: 'siteAddress' };
      }
      if ((draft.city ?? '').trim().length < 2) {
        return { error: 'Please enter your city or town.' };
      }
    }
    if (current === 5) {
      if ((draft.customerName ?? '').trim().length < 2) return { error: 'Please enter your full name.' };
      if (!/^[6-9]\d{9}$/.test((draft.phone ?? '').trim())) {
        return { error: 'Please enter a valid 10-digit Indian mobile number starting with 6–9.' };
      }
    }
    return { error: null };
  }

  function nextStep() {
    setSubmitError(null);
    setAddressError(null);
    if (step === 4) {
      console.log('[BookDelivery] Step 4 form values:', {
        ...draft,
        dispatchPlantId: activePlantId,
        selectedCustomerId,
      });
    }
    const check = validateStep(step);
    if (check.error) {
      if (check.field === 'siteAddress') {
        setAddressError(check.error);
        siteAddressRef.current?.focus();
      } else {
        setSubmitError(check.error);
      }
      return;
    }
    setStep((s) => Math.min(6, s + 1));
  }

  async function submitBooking(allowWaitlist = false) {
    setSubmitError(null);
    setAddressError(null);
    setWaitlistPrompt(false);

    const payloadToSubmit = {
      ...draft,
      siteAddress: (draft.siteAddress ?? '').trim(),
      city: (draft.city ?? '').trim(),
      customerName: (draft.customerName ?? '').trim(),
      phone: (draft.phone ?? '').trim(),
      dispatchPlantId: activePlantId,
      pumpType: isPieces ? 'none' : draft.pumpType,
      slumpMm: isPieces ? 'Per Piece' : draft.slumpMm,
      language: lang,
      allowWaitlist,
      website_url: websiteUrl,
    };

    console.log('[BookDelivery] Submitting booking form values:', payloadToSubmit);

    for (let s = 1; s <= 5; s += 1) {
      const check = validateStep(s);
      if (check.error) {
        setStep(s);
        if (check.field === 'siteAddress') {
          setAddressError(check.error);
          setTimeout(() => siteAddressRef.current?.focus(), 0);
        } else {
          setSubmitError(check.error);
        }
        return;
      }
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadToSubmit),
      });
      const { data: json, isJson } = await parseJsonResponse<{
        booking?: { booking_code: string };
        code?: string;
        waitlistAvailable?: boolean;
        error?: string;
      }>(res);
      if (!isJson || !json) {
        throw new Error(FRIENDLY_API_ERROR);
      }
      if (!res.ok || !json.booking) {
        if (json.code === 'SLOT_FULL' && json.waitlistAvailable) {
          setWaitlistPrompt(true);
        }
        throw new Error(json.error || FRIENDLY_API_ERROR);
      }

      // Save customer profile for future quick-select auto-fill (address remains editable)
      const savedEntry: SavedCustomerRecord = {
        id: payloadToSubmit.phone,
        customerName: payloadToSubmit.customerName,
        phone: payloadToSubmit.phone,
        email: draft.email.trim(),
        gstNumber: draft.gstNumber.trim(),
        siteAddress: payloadToSubmit.siteAddress,
        landmark: draft.landmark.trim(),
        city: payloadToSubmit.city,
        siteLat: draft.siteLat,
        siteLng: draft.siteLng,
      };
      const updatedCustomers = [
        savedEntry,
        ...savedCustomers.filter((c) => c.id !== savedEntry.id),
      ].slice(0, 20);
      setSavedCustomers(updatedCustomers);
      try {
        localStorage.setItem(SAVED_CUSTOMERS_KEY, JSON.stringify(updatedCustomers));
      } catch {
        // ignore storage quota errors
      }

      localStorage.removeItem(DRAFT_KEY);
      navigate(`/booking/${json.booking.booking_code}`, { state: { booking: json.booking } });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Booking submission failed.');
    } finally {
      setSubmitting(false);
    }
  }

  const steps = [
    'Product & Grade',
    isPieces ? 'Pieces & Usage' : 'Volume & Pump',
    '24/7 Slot',
    'Site & Map Pin',
    'Contact',
    'Review',
  ];

  const todayIso = new Date().toISOString().slice(0, 10);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 lg:py-14 space-y-8">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/12 border border-emerald-500/30 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Open 24 Hours · 2-Hour Day &amp; Night Delivery Slots</span>
        </div>
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-[#0F1F5C] dark:text-white">
          Book Concrete or Cement Bricks Delivery
        </h1>
      </div>

      {/* Progress Bar */}
      <div className="space-y-3">
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {steps.map((label, i) => {
            const idx = i + 1;
            const active = step === idx;
            const done = step > idx;
            return (
              <button
                key={label}
                type="button"
                onClick={() => idx < step && setStep(idx)}
                className={`text-left rounded-xl px-3 py-2 border text-xs transition-colors ${
                  active
                    ? 'border-[#D92B25] bg-[#FFF0EF] dark:bg-[#1F3FA8] font-semibold text-[#0F1F5C] dark:text-white'
                    : done
                      ? 'border-emerald-500/40 bg-[var(--surface)] text-emerald-700 dark:text-emerald-400'
                      : 'border-[#D7E4FF] dark:border-[#264096] text-[var(--muted)]'
                }`}
              >
                <span className="font-mono mr-1">{idx}.</span>
                <span>{label}</span>
              </button>
            );
          })}
        </div>
        <div className="h-1.5 w-full rounded-full bg-[#EAF1FF] dark:bg-[#152972] overflow-hidden">
          <div
            className="h-full bg-[#D92B25] transition-all duration-300"
            style={{ width: `${(step / 6) * 100}%` }}
          />
        </div>
      </div>

      {/* Wizard Card */}
      <div className="warm-card p-6 sm:p-8 space-y-6">
        <input
          type="text"
          value={websiteUrl}
          onChange={(e) => setWebsiteUrl(e.target.value)}
          className="hidden"
          tabIndex={-1}
          aria-hidden="true"
        />

        {/* STEP 1 */}
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="font-display font-bold text-xl">1. Select Product, Grade &amp; Dispatch Unit</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">
                  Product Category *
                </label>
                <select
                  value={draft.productSlug}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDraft((prev) => ({ ...prev, productSlug: val }));
                  }}
                  className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3.5 py-2.5 text-sm"
                >
                  {products.map((p) => (
                    <option key={p.slug} value={p.slug}>
                      {p.name} ({p.unitType === 'pieces' ? 'Pieces' : 'm³'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">
                  {isPieces ? 'Brick / Block Size *' : 'Concrete Grade *'}
                </label>
                <select
                  value={draft.grade}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDraft((prev) => ({ ...prev, grade: val }));
                  }}
                  className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3.5 py-2.5 text-sm"
                >
                  {(selectedProduct?.grades || []).map((g) => (
                    <option key={g.grade} value={g.grade}>
                      {g.grade}{' '}
                      {g.indicativeRate > 0
                        ? `— ₹${g.indicativeRate.toLocaleString('en-IN')}/${isPieces ? 'pc' : 'm³'}`
                        : '— Quote on confirm'}{' '}
                      ({g.strength})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {plantLocations.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-[var(--muted)] mb-2">
                  Delivery from (Dispatch Plant) *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {plantLocations.map((loc) => {
                    const isRed = loc.pinColor === 'red' || (!loc.isPrimary && loc.pinColor !== 'blue');
                    const isSelected = activePlantId === loc.id;
                    return (
                      <button
                        key={loc.id}
                        type="button"
                        onClick={() => setDraft((prev) => ({ ...prev, dispatchPlantId: loc.id }))}
                        className={`text-left rounded-xl border p-3.5 transition-colors flex items-start gap-2.5 cursor-pointer ${
                          isSelected
                            ? 'border-[#D92B25] bg-[#FFF0EF] dark:bg-[#1F3FA8]'
                            : 'border-[#D7E4FF] dark:border-[#264096]'
                        }`}
                      >
                        <span
                          className={`inline-flex items-center justify-center shrink-0 w-6 h-6 rounded-full text-[10px] font-extrabold text-white mt-0.5 ${
                            isRed ? 'bg-[#D92B25]' : 'bg-[#1F3FA8]'
                          }`}
                        >
                          {isRed ? <MapPin className="w-3.5 h-3.5" /> : 'MC'}
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-[#0F1F5C] dark:text-white">
                            {loc.shortLabel || loc.city} Unit
                          </p>
                          <p className="text-xs text-[var(--muted)] truncate">{loc.address}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="font-display font-bold text-xl">
              {isPieces ? '2. Quantity (Pieces) & Masonry Usage' : '2. Volume (m³), Slump & Placement Pump'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">
                  {isPieces ? 'Number of Pieces *' : 'Quantity (m³) *'}
                </label>
                <input
                  type="number"
                  min={isPieces ? '50' : '1'}
                  max={isPieces ? '200000' : '250'}
                  step={isPieces ? '50' : '0.5'}
                  value={draft.quantityM3}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setDraft((prev) => ({ ...prev, quantityM3: val }));
                  }}
                  className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3.5 py-2.5 text-sm tabular-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">
                  Structural / Site Usage *
                </label>
                <select
                  value={draft.usageType}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDraft((prev) => ({ ...prev, usageType: val }));
                  }}
                  className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3.5 py-2.5 text-sm"
                >
                  {isPieces ? (
                    <>
                      <option value="Masonry Wall">Masonry Wall</option>
                      <option value="Compound Wall">Compound Wall</option>
                      <option value="Internal Partitions">Internal Partitions</option>
                      <option value="Industrial / Godown Wall">Industrial / Godown Wall</option>
                    </>
                  ) : (
                    <>
                      <option value="Roof Slab">Roof Slab</option>
                      <option value="Footing / Foundation">Footing / Foundation</option>
                      <option value="Columns">Columns</option>
                      <option value="Beams / Plinth">Beams / Plinth</option>
                      <option value="Industrial / Warehouse Floor">Industrial / Warehouse Floor</option>
                      <option value="Road / Pavement / Drain">Road / Pavement / Drain</option>
                    </>
                  )}
                </select>
              </div>

              {!isPieces && (
                <div>
                  <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">
                    Target Slump *
                  </label>
                  <select
                    value={draft.slumpMm}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDraft((prev) => ({ ...prev, slumpMm: val }));
                    }}
                    className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3.5 py-2.5 text-sm"
                  >
                    <option value="75–100 mm">75–100 mm (Chute / PCC)</option>
                    <option value="100–125 mm">100–125 mm (Columns / Footing)</option>
                    <option value="120–140 mm">120–140 mm (Standard Pump / Slab)</option>
                    <option value="140–160 mm">140–160 mm (High Pumpability)</option>
                    <option value="SCC Flow">SCC Flow (Self-Compacting)</option>
                  </select>
                </div>
              )}
            </div>

            {!isPieces && (
              <div>
                <p className="text-xs font-medium text-[var(--muted)] mb-2">Pump Requirement</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'none' as const, title: 'No Pump (Chute Discharge)', fee: '₹0' },
                    {
                      id: 'line' as const,
                      title: 'Stationary Line Pump',
                      fee: `+₹${(biz?.linePumpCharge || 4500).toLocaleString('en-IN')} est.`,
                    },
                    {
                      id: 'boom' as const,
                      title: 'Boom Pump',
                      fee: `+₹${(biz?.boomPumpCharge || 11500).toLocaleString('en-IN')} est.`,
                    },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setDraft((prev) => ({ ...prev, pumpType: opt.id }))}
                      className={`text-left rounded-xl border p-4 transition-colors ${
                        draft.pumpType === opt.id
                          ? 'border-[#D92B25] bg-[#FFF0EF] dark:bg-[#1F3FA8]'
                          : 'border-[#D7E4FF] dark:border-[#264096]'
                      }`}
                    >
                      <p className="font-semibold text-sm">{opt.title}</p>
                      <p className="text-xs font-mono text-[var(--muted)] mt-1 tabular-nums">{opt.fee}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: 24-Hour Slot Capacity */}
        {step === 3 && (
          <div className="space-y-5">
            <h2 className="font-display font-bold text-xl">3. Select Delivery Date &amp; 24/7 Window</h2>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-4 space-y-3">
                <label className="block text-xs font-medium text-[var(--muted)]">
                  Delivery Date *
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-[var(--muted)] absolute left-3.5 top-3" />
                  <input
                    type="date"
                    min={todayIso}
                    value={draft.deliveryDate}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDraft((prev) => ({ ...prev, deliveryDate: val }));
                    }}
                    className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] pl-10 pr-3.5 py-2.5 text-sm tabular-nums"
                  />
                </div>
                <p className="text-xs text-[var(--muted)]">
                  Plant Hours: <strong className="text-emerald-600 dark:text-emerald-400">{biz?.workingHours}</strong>. Night delivery slots help large slabs finish under cooler temperatures.
                </p>
              </div>

              <div className="lg:col-span-8 space-y-3">
                <p className="text-xs font-medium text-[var(--muted)]">
                  24-Hour Dispatch Slots (2-Hour Windows)
                </p>
                {availLoading ? (
                  <div className="text-sm text-[var(--muted)] flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Checking live slot capacity...</span>
                  </div>
                ) : availability && !availability.valid ? (
                  <div className="rounded-xl border border-red-300 bg-red-50 dark:bg-red-950/40 dark:border-red-800 p-4 text-sm text-red-700 dark:text-red-300">
                    Plant unavailable on {draft.deliveryDate}: <strong>{availability.reason}</strong>. Please choose another date.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {(availability?.slots || []).map((slot) => {
                      const lowVol = !isPieces && slot.remainingVolumeM3 < draft.quantityM3;
                      const full = slot.isFull || lowVol;
                      return (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => setDraft((prev) => ({ ...prev, slotId: slot.id }))}
                          className={`text-left rounded-xl border p-3 transition-colors flex items-center justify-between gap-2 ${
                            draft.slotId === slot.id
                              ? 'border-[#D92B25] bg-[#FFF0EF] dark:bg-[#1F3FA8]'
                              : 'border-[#D7E4FF] dark:border-[#264096]'
                          }`}
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-semibold tabular-nums flex items-center gap-1.5">
                              {slot.isNight && <Moon className="w-3.5 h-3.5 text-[#1F3FA8] dark:text-[#FFC93C] shrink-0" />}
                              <span className="truncate">{slot.label}</span>
                            </p>
                            <p className="text-[11px] text-[var(--muted)] tabular-nums mt-0.5">
                              {slot.remainingBookings} trips · {slot.remainingVolumeM3} m³ open
                            </p>
                          </div>
                          <span
                            className={`text-[11px] font-bold shrink-0 ${
                              full ? 'text-amber-600 dark:text-amber-400' : 'text-[#16A34A]'
                            }`}
                          >
                            {full ? 'Waitlist' : 'Open'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Site Address & Map Pin */}
        {step === 4 && (
          <div className="space-y-5">
            <h2 className="font-display font-bold text-xl">4. Delivery Site Address &amp; Map Pin</h2>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 space-y-4">
                {plantLocations.length > 0 && (
                  <div>
                    <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">
                      Delivery from
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {plantLocations.map((loc) => (
                        <button
                          key={loc.id}
                          type="button"
                          onClick={() => setDraft((prev) => ({ ...prev, dispatchPlantId: loc.id }))}
                          className={`px-3 py-1.5 rounded-full border text-xs font-semibold transition-colors cursor-pointer ${
                            activePlantId === loc.id
                              ? 'border-[#D92B25] bg-[#FFF0EF] dark:bg-[#1F3FA8] text-[#0F1F5C] dark:text-white'
                              : 'border-[#D7E4FF] dark:border-[#264096]'
                          }`}
                        >
                          {loc.shortLabel || loc.city}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {savedCustomers.length > 0 && (
                  <div>
                    <label
                      htmlFor="saved-customer-select"
                      className="block text-xs font-medium text-[var(--muted)] mb-1.5"
                    >
                      Select Saved Customer (Auto-fills Address)
                    </label>
                    <select
                      id="saved-customer-select"
                      value={selectedCustomerId}
                      onChange={(e) => handleSelectCustomer(e.target.value)}
                      className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3.5 py-2 text-sm"
                    >
                      <option value="">-- Enter new customer / address manually --</option>
                      {savedCustomers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.customerName} ({c.phone}) — {c.siteAddress || c.city}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">
                    Quick Town Preset
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {TOWN_PRESETS.map((town) => (
                      <button
                        key={town.name}
                        type="button"
                        onClick={() =>
                          setDraft((prev) => ({
                            ...prev,
                            city: town.name,
                            siteLat: town.lat,
                            siteLng: town.lng,
                          }))
                        }
                        className={`px-2.5 py-1 rounded-full border text-xs font-medium transition-colors ${
                          draft.city === town.name
                            ? 'border-[#D92B25] bg-[#FFF0EF] dark:bg-[#1F3FA8] text-[#0F1F5C] dark:text-white'
                            : 'border-[#D7E4FF] dark:border-[#264096]'
                        }`}
                      >
                        {town.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="delivery-site-address"
                    className="block text-xs font-medium text-[var(--muted)] mb-1.5"
                  >
                    Delivery Site Address / Plot / Survey No. *
                  </label>
                  <textarea
                    id="delivery-site-address"
                    name="siteAddress"
                    ref={siteAddressRef}
                    rows={2}
                    value={draft.siteAddress ?? ''}
                    onChange={(e) => {
                      const nextValue = e.target.value;
                      setDraft((prev) => ({ ...prev, siteAddress: nextValue }));
                      if (addressError) setAddressError(null);
                      if (submitError) setSubmitError(null);
                    }}
                    placeholder="Street, layout, ward, or survey number"
                    aria-invalid={Boolean(addressError)}
                    aria-describedby={addressError ? 'delivery-site-address-error' : undefined}
                    className={`w-full rounded-xl border bg-[var(--bg)] px-3.5 py-2 text-sm transition-colors ${
                      addressError
                        ? 'border-[#D92B25] focus:outline-none focus:ring-2 focus:ring-[#D92B25]/30'
                        : 'border-[#D7E4FF] dark:border-[#264096]'
                    }`}
                  />
                  {addressError && (
                    <p
                      id="delivery-site-address-error"
                      role="alert"
                      className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-[#D92B25]"
                    >
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{addressError}</span>
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">
                      City / Taluk *
                    </label>
                    <input
                      type="text"
                      value={draft.city ?? ''}
                      onChange={(e) => {
                        const nextCity = e.target.value;
                        setDraft((prev) => ({ ...prev, city: nextCity }));
                        if (submitError) setSubmitError(null);
                      }}
                      className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">
                      Nearest Landmark
                    </label>
                    <input
                      type="text"
                      value={draft.landmark ?? ''}
                      onChange={(e) => {
                        const nextLandmark = e.target.value;
                        setDraft((prev) => ({ ...prev, landmark: nextLandmark }));
                      }}
                      placeholder="Near temple / school"
                      className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                {estimate && (
                  <div className="rounded-xl bg-[var(--bg)] border border-[#D7E4FF] dark:border-[#264096] p-4 space-y-1.5 text-xs">
                    <p className="font-semibold text-sm flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-[#D92B25]" />
                      <span className="tabular-nums">
                        Distance from {estimate.dispatchPlantName || selectedPlant?.shortLabel || 'Kotihal'} Plant:{' '}
                        {estimate.distanceKm} km
                      </span>
                    </p>
                    <p className="text-[var(--muted)] tabular-nums">
                      Indicative Delivery Estimate: ₹{estimate.estimatedDeliveryFee.toLocaleString('en-IN')}
                    </p>
                    {!estimate.withinServiceRadius && (
                      <p className="text-amber-600 dark:text-amber-400">
                        Site is beyond our standard {estimate.serviceRadiusKm} km radius. Dispatch confirmation required.
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="lg:col-span-7 space-y-2">
                <p className="text-xs text-[var(--muted)]">
                  Click anywhere on the map to pin your exact construction site ({draft.siteLat}, {draft.siteLng}).
                </p>
                {biz && (
                  <PlantMap
                    plantLat={selectedPlant?.lat || biz.plantLat}
                    plantLng={selectedPlant?.lng || biz.plantLng}
                    serviceRadiusKm={selectedPlant?.serviceRadiusKm || biz.serviceRadiusKm}
                    plantName={selectedPlant?.name || biz.businessName}
                    plantAddress={selectedPlant?.address || biz.address}
                    locations={plantLocations}
                    activePlantId={activePlantId}
                    selectable
                    siteLat={draft.siteLat}
                    siteLng={draft.siteLng}
                    onSelectLocation={(lat, lng) =>
                      setDraft((prev) => ({ ...prev, siteLat: lat, siteLng: lng }))
                    }
                    heightClass="h-80"
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 5 */}
        {step === 5 && (
          <div className="space-y-5">
            <h2 className="font-display font-bold text-xl">5. Customer &amp; Site Contact</h2>
            {savedCustomers.length > 0 && (
              <div>
                <label
                  htmlFor="saved-customer-select-step5"
                  className="block text-xs font-medium text-[var(--muted)] mb-1.5"
                >
                  Select Saved Customer (Auto-fills Contact &amp; Site Address)
                </label>
                <select
                  id="saved-customer-select-step5"
                  value={selectedCustomerId}
                  onChange={(e) => handleSelectCustomer(e.target.value)}
                  className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3.5 py-2.5 text-sm"
                >
                  <option value="">-- Enter new customer manually --</option>
                  {savedCustomers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.customerName} ({c.phone}) — {c.siteAddress || c.city}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">Full Name *</label>
                <input
                  type="text"
                  value={draft.customerName ?? ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDraft((prev) => ({ ...prev, customerName: val }));
                  }}
                  placeholder="Site owner / engineer name"
                  className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3.5 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">
                  10-Digit Mobile Number *
                </label>
                <input
                  type="tel"
                  maxLength={10}
                  value={draft.phone ?? ''}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setDraft((prev) => ({ ...prev, phone: val }));
                  }}
                  placeholder="9XXXXXXXXX"
                  className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3.5 py-2.5 text-sm tabular-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">
                  Email (For PDF Confirmation Receipt)
                </label>
                <input
                  type="email"
                  value={draft.email ?? ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDraft((prev) => ({ ...prev, email: val }));
                  }}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3.5 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">
                  GSTIN (Optional)
                </label>
                <input
                  type="text"
                  value={draft.gstNumber ?? ''}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase();
                    setDraft((prev) => ({ ...prev, gstNumber: val }));
                  }}
                  placeholder="29XXXXX..."
                  className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3.5 py-2.5 text-sm uppercase"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">
                Site Access Notes (Road width, unloading point, night pour instructions)
              </label>
              <textarea
                rows={3}
                value={draft.notes ?? ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setDraft((prev) => ({ ...prev, notes: val }));
                }}
                className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3.5 py-2 text-sm"
              />
            </div>
          </div>
        )}

        {/* STEP 6 */}
        {step === 6 && (
          <div className="space-y-6">
            <h2 className="font-display font-bold text-xl">6. Review &amp; Confirm Delivery Booking</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-xl bg-[var(--bg)] border border-[#D7E4FF] dark:border-[#264096] p-5 space-y-2.5 text-sm">
                <p className="font-semibold text-xs text-[var(--muted)]">Order &amp; Schedule</p>
                <p><strong>Product &amp; Grade/Size:</strong> {draft.grade} ({selectedProduct?.name})</p>
                <p className="tabular-nums">
                  <strong>Quantity:</strong> {draft.quantityM3.toLocaleString('en-IN')} {isPieces ? 'pieces' : 'm³'}
                </p>
                <p>
                  <strong>Usage:</strong> {draft.usageType}
                  {!isPieces ? ` · Slump ${draft.slumpMm}` : ''}
                </p>
                {!isPieces && (
                  <p><strong>Pump:</strong> {draft.pumpType === 'none' ? 'No Pump (Chute)' : `${draft.pumpType.toUpperCase()} Pump`}</p>
                )}
                <p className="tabular-nums"><strong>Date:</strong> {draft.deliveryDate}</p>
                <p>
                  <strong>24/7 Slot:</strong>{' '}
                  {scheduling?.slots.find((s) => s.id === draft.slotId)?.label || draft.slotId}
                </p>
                <p><strong>Delivery From:</strong> {selectedPlant?.name || 'Kotihal Plant'}</p>
                <p><strong>Site:</strong> {draft.siteAddress}, {draft.city}</p>
                <p className="tabular-nums"><strong>Contact:</strong> {draft.customerName} (+91 {draft.phone})</p>
              </div>

              {estimate && (
                <div className="rounded-xl bg-[#0F1F5C] text-white border border-[#264096] p-5 space-y-3 text-sm">
                  <p className="font-mono text-xs text-[#FFC93C]">Indicative Estimate</p>
                  <div className="flex justify-between">
                    <span className="text-slate-300">
                      Material ({draft.quantityM3} {isPieces ? 'pcs' : 'm³'} × ₹{estimate.unitRate})
                    </span>
                    <span className="font-mono tabular-nums">
                      ₹{estimate.estimatedConcreteAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">
                      Delivery (~{estimate.distanceKm} km from {estimate.dispatchPlantName || selectedPlant?.shortLabel || 'Kotihal'})
                    </span>
                    <span className="font-mono tabular-nums">
                      ₹{estimate.estimatedDeliveryFee.toLocaleString('en-IN')}
                    </span>
                  </div>
                  {!isPieces && (
                    <div className="flex justify-between">
                      <span className="text-slate-300">Pump Hire</span>
                      <span className="font-mono tabular-nums">
                        ₹{estimate.estimatedPumpFee.toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                  <div className="border-t border-white/15 pt-3 flex justify-between items-baseline">
                    <span className="font-semibold">Indicative Total</span>
                    <span className="font-slab font-bold text-2xl text-[#FFC93C] tabular-nums">
                      ₹{estimate.estimatedTotal.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 pt-1">
                    Final rate, GST, and dispatch confirmation will be verified by the MY CONCRETE Kotihal team.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {submitError && (
          <div className="rounded-xl border border-red-300 bg-red-50 dark:bg-red-950/40 dark:border-red-800 p-4 text-sm text-red-700 dark:text-red-300 space-y-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{submitError}</span>
            </div>
            {waitlistPrompt && (
              <button
                type="button"
                onClick={() => submitBooking(true)}
                className="rounded-full bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-700"
              >
                Join Waitlist for This Slot
              </button>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-[#D7E4FF] dark:border-[#264096]">
          <button
            type="button"
            disabled={step === 1}
            onClick={() => {
              setSubmitError(null);
              setAddressError(null);
              setStep((s) => Math.max(1, s - 1));
            }}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#D7E4FF] dark:border-[#264096] px-5 py-2.5 text-sm font-semibold disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          {step < 6 ? (
            <button
              type="button"
              onClick={nextStep}
              className="btn-orange-pill px-6 py-2.5 text-sm"
            >
              <span>Continue</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={submitting}
              onClick={() => submitBooking(false)}
              className="btn-orange-pill px-7 py-2.5 text-sm disabled:opacity-60"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              <span>Confirm Delivery Booking</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
