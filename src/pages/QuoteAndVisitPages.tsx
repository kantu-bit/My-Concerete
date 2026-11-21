import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  FileUp,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  RotateCcw,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { useDocumentMeta } from '../utils/seo.ts';
import { readApiJson } from '../utils/api.ts';
import { CallLink } from '../components/ContactLinks.tsx';
import { buildWhatsAppUrl } from '../utils/documents.ts';

interface SubmittedQuoteSummary {
  quoteCode: string;
  whatsappUrl?: string;
  projectType: string;
  grade: string;
  quantityM3: number;
  location: string;
  timeline: string;
  customerName: string;
  phone: string;
  email: string;
  notes: string;
  attachmentName: string;
}

interface SubmittedVisitSummary {
  visitCode: string;
  whatsappUrl?: string;
  visitType: 'plant_tour' | 'site_inspection';
  preferredDate: string;
  preferredTime: string;
  location: string;
  customerName: string;
  phone: string;
  notes: string;
}

export function GetQuotePage() {
  const { data, lang } = useApp();
  const biz = data?.businessConfig;
  const [searchParams] = useSearchParams();
  const initialProduct = searchParams.get('product') || 'Ready-Mix Concrete (M25)';

  const [projectType, setProjectType] = useState('Residential Building');
  const [grade, setGrade] = useState(initialProduct);
  const [quantityM3, setQuantityM3] = useState('25');
  const [location, setLocation] = useState('Ranebennur');
  const [timeline, setTimeline] = useState('Within 2 Weeks');
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [attachmentData, setAttachmentData] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submittedQuote, setSubmittedQuote] = useState<SubmittedQuoteSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useDocumentMeta({
    title: 'Get a Free Concrete or Bricks Quote | MY CONCRETE Ranebennur & Davangere',
    description:
      'Request a custom quotation for Ready-Mix Concrete (M5–M40+) or Cement Bricks in Ranebennur, Davangere, and Kotihal.',
  });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2.5 * 1024 * 1024) {
      setError('Drawing file size must be under 2.5 MB.');
      return;
    }
    setError(null);
    setAttachmentName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAttachmentData(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^[6-9]\d{9}$/.test(phone.trim())) {
      setError('Enter a valid 10-digit Indian mobile number.');
      return;
    }
    const qty = Math.max(1, Number(quantityM3) || 1);
    try {
      setSubmitting(true);
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectType,
          grade,
          quantityM3: qty,
          location,
          timeline,
          customerName,
          phone,
          email,
          notes,
          attachmentName,
          attachmentData,
          language: lang,
          website_url: websiteUrl,
        }),
      });
      const json = await readApiJson<{ quoteCode: string; whatsappUrl?: string }>(res);
      setSubmittedQuote({
        quoteCode: json.quoteCode,
        whatsappUrl: json.whatsappUrl,
        projectType,
        grade,
        quantityM3: qty,
        location,
        timeline,
        customerName: customerName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        notes: notes.trim(),
        attachmentName,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  }

  const ownerEmail = biz?.email || 'myconcretektl@gmail.com';
  const ownerWhatsapp = biz?.whatsapp || biz?.phone || '+91 73378 07372';

  const quoteSummaryText = submittedQuote
    ? [
        `*MY CONCRETE Quote Request: ${submittedQuote.quoteCode}*`,
        `Customer: ${submittedQuote.customerName}`,
        `Mobile: +91 ${submittedQuote.phone}`,
        submittedQuote.email ? `Email: ${submittedQuote.email}` : null,
        `Project Type: ${submittedQuote.projectType}`,
        `Grade / Brick: ${submittedQuote.grade}`,
        `Estimated Quantity: ${submittedQuote.quantityM3}`,
        `Location: ${submittedQuote.location}`,
        `Timeline: ${submittedQuote.timeline}`,
        submittedQuote.attachmentName ? `Drawing/BOQ: ${submittedQuote.attachmentName}` : null,
        submittedQuote.notes ? `Notes: ${submittedQuote.notes}` : null,
      ]
        .filter(Boolean)
        .join('\n')
    : '';

  const quoteWhatsappHref = submittedQuote
    ? submittedQuote.whatsappUrl || buildWhatsAppUrl(ownerWhatsapp, quoteSummaryText)
    : '#';

  const quoteMailtoHref = submittedQuote
    ? `mailto:${ownerEmail}?subject=${encodeURIComponent(
        `MY CONCRETE Quote Request ${submittedQuote.quoteCode} – ${submittedQuote.customerName}`
      )}&body=${encodeURIComponent(quoteSummaryText)}`
    : '#';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 lg:py-16 space-y-8">
      <div className="space-y-2">
        <p className="text-xs font-semibold text-[#D92B25]">Custom Project Estimate</p>
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-[#0F1F5C] dark:text-white">
          Get a Free Quote
        </h1>
        <p className="text-sm text-[var(--muted)]">
          Share your required concrete grade or cement brick quantity, location in Ranebennur or Davangere, and drawings (optional). Our Kotihal team responds promptly.
        </p>
      </div>

      {submittedQuote ? (
        <div className="warm-card p-6 sm:p-8 space-y-5 border-emerald-400">
          <div className="flex items-center gap-2 text-[#16A34A]">
            <CheckCircle2 className="w-6 h-6 shrink-0" />
            <h2 className="font-display font-bold text-xl">Quote Request Received</h2>
          </div>
          <p className="text-sm text-[var(--muted)]">
            Your reference ID is <strong className="font-mono text-[#0F1F5C] dark:text-white">{submittedQuote.quoteCode}</strong>.{' '}
            <strong className="text-[#0F1F5C] dark:text-white">Our team will call you shortly</strong> with confirmed pricing.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-xl bg-[var(--bg)] border border-[#D7E4FF] dark:border-[#264096] p-4 text-xs">
            <div>
              <span className="text-[var(--muted)]">Customer:</span>{' '}
              <strong className="tabular-nums">{submittedQuote.customerName} (+91 {submittedQuote.phone})</strong>
            </div>
            <div>
              <span className="text-[var(--muted)]">Project Type:</span>{' '}
              <strong>{submittedQuote.projectType}</strong>
            </div>
            <div>
              <span className="text-[var(--muted)]">Grade / Brick:</span>{' '}
              <strong>{submittedQuote.grade}</strong>
            </div>
            <div>
              <span className="text-[var(--muted)]">Quantity &amp; Timeline:</span>{' '}
              <strong className="tabular-nums">{submittedQuote.quantityM3} · {submittedQuote.timeline}</strong>
            </div>
            <div>
              <span className="text-[var(--muted)]">Location:</span>{' '}
              <strong>{submittedQuote.location}</strong>
            </div>
            {submittedQuote.notes && (
              <div className="sm:col-span-2">
                <span className="text-[var(--muted)]">Notes:</span>{' '}
                <span>{submittedQuote.notes}</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-3 pt-1">
            <a
              href={quoteWhatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-[#16A34A] hover:brightness-110 text-white px-4 min-h-[44px] py-2 text-xs font-semibold transition-all"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Send on WhatsApp</span>
            </a>

            <a
              href={quoteMailtoHref}
              target="_top"
              rel="noopener"
              className="inline-flex items-center gap-2 rounded-full bg-[#D92B25] hover:brightness-110 text-white px-4 min-h-[44px] py-2 text-xs font-semibold transition-all"
            >
              <Mail className="w-4 h-4" />
              <span>Send Quote via Email</span>
            </a>

            <CallLink
              phone={biz?.phone || '+91 73378 07372'}
              whatsapp={ownerWhatsapp}
              whatsappMessage={quoteSummaryText}
              className="inline-flex items-center gap-2 rounded-full bg-[#1F3FA8] text-white px-4 min-h-[44px] py-2 text-xs font-semibold hover:bg-[#173187]"
            >
              <Phone className="w-3.5 h-3.5 text-[#FFC93C]" />
              <span className="tabular-nums">Call Dispatch: {biz?.phone || '+91 73378 07372'}</span>
            </CallLink>

            <button
              type="button"
              onClick={() => setSubmittedQuote(null)}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#D7E4FF] dark:border-[#264096] px-4 min-h-[44px] py-2 text-xs font-semibold hover:border-[#1F3FA8] cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Request Another Quote</span>
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="warm-card p-6 sm:p-8 space-y-5">
          <input
            type="text"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            className="hidden"
            tabIndex={-1}
            aria-hidden="true"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">Project Type *</label>
              <select
                value={projectType}
                onChange={(e) => setProjectType(e.target.value)}
                className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3.5 py-2.5 text-sm"
              >
                <option>Residential Building</option>
                <option>Commercial Complex</option>
                <option>Industrial / Warehouse Floor</option>
                <option>Infrastructure / Road / Drain</option>
                <option>Masonry / Compound Wall (Cement Bricks)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">
                Concrete Grade or Brick Type *
              </label>
              <input
                type="text"
                required
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                placeholder="e.g. M25 RMC or 6&quot; Cement Blocks"
                className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3.5 py-2.5 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">
                Estimated Quantity (m³ or pieces) *
              </label>
              <input
                type="number"
                required
                min="1"
                value={quantityM3}
                onChange={(e) => setQuantityM3(e.target.value)}
                className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3.5 py-2.5 text-sm tabular-nums"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">Project Location *</label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ranebennur / Davangere / Harihar"
                className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3.5 py-2.5 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">Delivery Timeline *</label>
              <select
                value={timeline}
                onChange={(e) => setTimeline(e.target.value)}
                className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3.5 py-2.5 text-sm"
              >
                <option>Immediate (24 Hours / 1–3 Days)</option>
                <option>Within 2 Weeks</option>
                <option>1 Month+</option>
                <option>Ongoing Monthly Supply</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">
                Structural Drawing / BOQ Upload (PDF/Image, max 2.5 MB)
              </label>
              <label className="flex items-center gap-2 rounded-xl border border-dashed border-[#D7E4FF] dark:border-[#264096] px-3.5 py-2.5 text-xs cursor-pointer hover:border-[#D92B25]">
                <FileUp className="w-4 h-4 text-[#D92B25] shrink-0" />
                <span className="truncate">{attachmentName || 'Attach structural drawing or BOQ'}</span>
                <input type="file" accept=".pdf,image/*" onChange={handleFileChange} className="hidden" />
              </label>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">Your Name *</label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3.5 py-2.5 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">10-Digit Mobile *</label>
              <input
                type="tel"
                required
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3.5 py-2.5 text-sm tabular-nums"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3.5 py-2.5 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">Additional Specifications</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Pump hire, night delivery preference, or brick/block sizes..."
              className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3.5 py-2 text-sm"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          <button type="submit" disabled={submitting} className="btn-orange-pill px-6 py-2.5 text-sm disabled:opacity-60">
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>Submit Quote Request</span>
          </button>
        </form>
      )}
    </div>
  );
}

export function SiteVisitPage() {
  const { data, lang } = useApp();
  const biz = data?.businessConfig;
  const [visitType, setVisitType] = useState<'plant_tour' | 'site_inspection'>('site_inspection');
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('10:30 AM');
  const [location, setLocation] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedVisit, setSubmittedVisit] = useState<SubmittedVisitSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useDocumentMeta({
    title: 'Book Site Inspection or Plant Visit | MY CONCRETE Kotihal',
    description:
      'Schedule a technical site inspection in Ranebennur or Davangere or book a tour of our Kotihal batching unit.',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^[6-9]\d{9}$/.test(phone.trim())) {
      setError('Enter a valid 10-digit Indian mobile number.');
      return;
    }
    try {
      setSubmitting(true);
      const res = await fetch('/api/site-visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitType,
          preferredDate,
          preferredTime,
          location,
          customerName,
          phone,
          email,
          notes,
          language: lang,
          website_url: websiteUrl,
        }),
      });
      const json = await readApiJson<{ visitCode: string; whatsappUrl?: string }>(res);
      setSubmittedVisit({
        visitCode: json.visitCode,
        whatsappUrl: json.whatsappUrl,
        visitType,
        preferredDate,
        preferredTime,
        location: location.trim() || 'Kotihal Plant',
        customerName: customerName.trim(),
        phone: phone.trim(),
        notes: notes.trim(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed.');
    } finally {
      setSubmitting(false);
    }
  }

  const ownerEmail = biz?.email || 'myconcretektl@gmail.com';
  const ownerWhatsapp = biz?.whatsapp || biz?.phone || '+91 73378 07372';

  const visitSummaryText = submittedVisit
    ? [
        `*MY CONCRETE Visit Request: ${submittedVisit.visitCode}*`,
        `Visit Type: ${submittedVisit.visitType.replace('_', ' ')}`,
        `Preferred Date & Time: ${submittedVisit.preferredDate} at ${submittedVisit.preferredTime}`,
        `Customer: ${submittedVisit.customerName}`,
        `Mobile: +91 ${submittedVisit.phone}`,
        `Location: ${submittedVisit.location}`,
        submittedVisit.notes ? `Notes: ${submittedVisit.notes}` : null,
      ]
        .filter(Boolean)
        .join('\n')
    : '';

  const visitWhatsappHref = submittedVisit
    ? submittedVisit.whatsappUrl || buildWhatsAppUrl(ownerWhatsapp, visitSummaryText)
    : '#';

  const visitMailtoHref = submittedVisit
    ? `mailto:${ownerEmail}?subject=${encodeURIComponent(
        `MY CONCRETE Visit Request ${submittedVisit.visitCode} – ${submittedVisit.customerName}`
      )}&body=${encodeURIComponent(visitSummaryText)}`
    : '#';

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 lg:py-16 space-y-8">
      <div className="space-y-2">
        <p className="text-xs font-semibold text-[#D92B25]">Technical Field Support</p>
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-[#0F1F5C] dark:text-white">
          Book a Site Inspection or Kotihal Plant Visit
        </h1>
      </div>

      {submittedVisit ? (
        <div className="warm-card p-6 sm:p-8 space-y-5 border-emerald-400">
          <div className="flex items-center gap-2 text-[#16A34A]">
            <CheckCircle2 className="w-6 h-6 shrink-0" />
            <h2 className="font-display font-bold text-xl">Visit Scheduled</h2>
          </div>
          <p className="text-sm text-[var(--muted)]">
            Reference ID: <strong className="font-mono text-[#0F1F5C] dark:text-white">{submittedVisit.visitCode}</strong>.{' '}
            <strong className="text-[#0F1F5C] dark:text-white">Our team will call you shortly</strong> to confirm your timing.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-xl bg-[var(--bg)] border border-[#D7E4FF] dark:border-[#264096] p-4 text-xs">
            <div>
              <span className="text-[var(--muted)]">Visit Type:</span>{' '}
              <strong className="capitalize">{submittedVisit.visitType.replace('_', ' ')}</strong>
            </div>
            <div>
              <span className="text-[var(--muted)]">Schedule:</span>{' '}
              <strong className="tabular-nums">{submittedVisit.preferredDate} at {submittedVisit.preferredTime}</strong>
            </div>
            <div>
              <span className="text-[var(--muted)]">Customer:</span>{' '}
              <strong className="tabular-nums">{submittedVisit.customerName} (+91 {submittedVisit.phone})</strong>
            </div>
            <div>
              <span className="text-[var(--muted)]">Location:</span>{' '}
              <strong>{submittedVisit.location}</strong>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-1">
            <a
              href={visitWhatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-[#16A34A] hover:brightness-110 text-white px-4 min-h-[44px] py-2 text-xs font-semibold transition-all"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Send on WhatsApp</span>
            </a>

            <a
              href={visitMailtoHref}
              target="_top"
              rel="noopener"
              className="inline-flex items-center gap-2 rounded-full bg-[#D92B25] hover:brightness-110 text-white px-4 min-h-[44px] py-2 text-xs font-semibold transition-all"
            >
              <Mail className="w-4 h-4" />
              <span>Send via Email</span>
            </a>

            <CallLink
              phone={biz?.phone || '+91 73378 07372'}
              whatsapp={ownerWhatsapp}
              whatsappMessage={visitSummaryText}
              className="inline-flex items-center gap-2 rounded-full bg-[#1F3FA8] text-white px-4 min-h-[44px] py-2 text-xs font-semibold hover:bg-[#173187]"
            >
              <Phone className="w-3.5 h-3.5 text-[#FFC93C]" />
              <span className="tabular-nums">Call Dispatch: {biz?.phone || '+91 73378 07372'}</span>
            </CallLink>

            <button
              type="button"
              onClick={() => setSubmittedVisit(null)}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#D7E4FF] dark:border-[#264096] px-4 min-h-[44px] py-2 text-xs font-semibold hover:border-[#1F3FA8] cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Schedule Another</span>
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="warm-card p-6 sm:p-8 space-y-5">
          <input
            type="text"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            className="hidden"
            tabIndex={-1}
            aria-hidden="true"
          />

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setVisitType('site_inspection')}
              className={`rounded-xl border p-4 text-left text-sm font-semibold ${
                visitType === 'site_inspection'
                  ? 'border-[#D92B25] bg-[#FFF0EF] dark:bg-[#1F3FA8]'
                  : 'border-[#D7E4FF] dark:border-[#264096]'
              }`}
            >
              Site Access &amp; Pour Inspection
            </button>
            <button
              type="button"
              onClick={() => setVisitType('plant_tour')}
              className={`rounded-xl border p-4 text-left text-sm font-semibold ${
                visitType === 'plant_tour'
                  ? 'border-[#D92B25] bg-[#FFF0EF] dark:bg-[#1F3FA8]'
                  : 'border-[#D7E4FF] dark:border-[#264096]'
              }`}
            >
              Kotihal Plant &amp; Brick Unit Visit
            </button>
          </div>

          {visitType === 'plant_tour' && (
            <div className="rounded-xl bg-[var(--bg)] border border-[#D7E4FF] dark:border-[#264096] p-3.5 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-start gap-2 text-[var(--muted)]">
                <MapPin className="w-4 h-4 text-[#D92B25] shrink-0 mt-0.5" />
                <span>{biz?.address || 'FM66+2X6, Kotihal, Karnataka 581119'}</span>
              </div>
              <a
                href={biz?.googleMapsUrl || 'https://share.google/oZzcrYosJ0JYw2tTn'}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-[#1F3FA8] dark:text-[#FFC93C] hover:underline shrink-0"
              >
                Open Google Maps &rarr;
              </a>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">Preferred Date *</label>
              <input
                type="date"
                required
                min={new Date().toISOString().slice(0, 10)}
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
                className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3.5 py-2.5 text-sm tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">Preferred Time *</label>
              <select
                value={preferredTime}
                onChange={(e) => setPreferredTime(e.target.value)}
                className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3.5 py-2.5 text-sm"
              >
                <option>09:00 AM</option>
                <option>10:30 AM</option>
                <option>02:00 PM</option>
                <option>04:30 PM</option>
                <option>07:00 PM (Evening Inspection)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">Full Name *</label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3.5 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">10-Digit Mobile *</label>
              <input
                type="tel"
                required
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3.5 py-2.5 text-sm tabular-nums"
              />
            </div>
          </div>

          {visitType === 'site_inspection' && (
            <div>
              <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">Site Location / Address</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ranebennur, Davangere, or landmark"
                className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3.5 py-2.5 text-sm"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">Notes</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3.5 py-2 text-sm"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button type="submit" disabled={submitting} className="btn-orange-pill px-6 py-2.5 text-sm">
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>Confirm Visit Request</span>
          </button>
        </form>
      )}
    </div>
  );
}
