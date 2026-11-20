import React, { useState } from 'react';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { readApiJson } from '../utils/api.ts';

interface ConnectFormProps {
  type?: 'contact' | 'partner';
  title?: string;
  compact?: boolean;
  onSuccess?: () => void;
}

export function ConnectForm({
  type = 'contact',
  title,
  compact = false,
  onSuccess,
}: ConnectFormProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [cityChoice, setCityChoice] = useState<'Ranebennur' | 'Davangere' | 'Other'>('Ranebennur');
  const [customCity, setCustomCity] = useState('');
  const [companyOrRole, setCompanyOrRole] = useState('');
  const [message, setMessage] = useState('');
  const [consent, setConsent] = useState(true);
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatusMsg(null);
    if (!/^[6-9]\d{9}$/.test(phone.trim())) {
      setStatusMsg({ kind: 'err', text: 'Please enter a valid 10-digit Indian mobile number.' });
      return;
    }
    if (!consent) {
      setStatusMsg({ kind: 'err', text: 'Please confirm consent so our team can contact you.' });
      return;
    }

    const finalCity =
      cityChoice === 'Other' ? customCity.trim() || 'Other (Near Kotihal)' : cityChoice;

    try {
      setSubmitting(true);
      const res = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          city: finalCity,
          companyOrRole: companyOrRole.trim(),
          message: message.trim(),
          consent,
          website_url: websiteUrl,
        }),
      });
      await readApiJson<{ ok: boolean }>(res);
      setStatusMsg({
        kind: 'ok',
        text: 'Thank you! Your enquiry has been sent to our Kotihal dispatch desk.',
      });
      setName('');
      setPhone('');
      setEmail('');
      setCustomCity('');
      setCompanyOrRole('');
      setMessage('');
      onSuccess?.();
    } catch (err) {
      setStatusMsg({
        kind: 'err',
        text: err instanceof Error ? err.message : 'Submission failed. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {title && <h3 className="text-xl font-bold text-[#0F1F5C] dark:text-white">{title}</h3>}

      <input
        type="text"
        name="website_url"
        value={websiteUrl}
        onChange={(e) => setWebsiteUrl(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />

      <div className={`grid gap-4 ${compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
        <div>
          <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">
            Full Name *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3.5 py-2.5 text-sm focus:border-[#1F3FA8] focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">
            10-Digit Mobile Number *
          </label>
          <input
            type="tel"
            required
            maxLength={10}
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
            placeholder="9XXXXXXXXX"
            className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3.5 py-2.5 text-sm tabular-nums focus:border-[#1F3FA8] focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3.5 py-2.5 text-sm focus:border-[#1F3FA8] focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">
            City / Delivery Region *
          </label>
          <select
            value={cityChoice}
            onChange={(e) => setCityChoice(e.target.value as 'Ranebennur' | 'Davangere' | 'Other')}
            className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3.5 py-2.5 text-sm focus:border-[#1F3FA8] focus:outline-none"
          >
            <option value="Ranebennur">Ranebennur</option>
            <option value="Davangere">Davangere</option>
            <option value="Other">Other Town / Village</option>
          </select>
        </div>
      </div>

      {cityChoice === 'Other' && (
        <div>
          <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">
            Specify Town / Village *
          </label>
          <input
            type="text"
            required
            value={customCity}
            onChange={(e) => setCustomCity(e.target.value)}
            placeholder="e.g., Harihar, Byadgi, Haveri, Honnali"
            className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3.5 py-2.5 text-sm focus:border-[#1F3FA8] focus:outline-none"
          />
        </div>
      )}

      {type === 'partner' && (
        <div>
          <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">
            Partnership Category (Contractor / Mixer Owner / Material Supplier)
          </label>
          <input
            type="text"
            value={companyOrRole}
            onChange={(e) => setCompanyOrRole(e.target.value)}
            placeholder="e.g., Civil Contractor / Fleet Partner"
            className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3.5 py-2.5 text-sm focus:border-[#1F3FA8] focus:outline-none"
          />
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">
          Requirement Details *
        </label>
        <textarea
          required
          rows={compact ? 3 : 4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Share concrete grade (e.g., M20, M25) or cement brick quantity, site location, and schedule..."
          className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3.5 py-2.5 text-sm focus:border-[#1F3FA8] focus:outline-none"
        />
      </div>

      <label className="flex items-start gap-2.5 text-xs text-[var(--muted)] cursor-pointer">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 rounded border-[#D7E4FF] text-[#D92B25] focus:ring-[#D92B25]"
        />
        <span>
          I agree to let MY CONCRETE – Readymix Concrete Unit contact me via phone, WhatsApp, or email regarding my concrete/brick requirement.
        </span>
      </label>

      {statusMsg && (
        <div
          className={`flex items-center gap-2 rounded-xl p-3 text-sm ${
            statusMsg.kind === 'ok'
              ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800'
              : 'bg-red-50 text-red-800 dark:bg-red-950/50 dark:text-red-200 border border-red-200 dark:border-red-800'
          }`}
        >
          {statusMsg.kind === 'ok' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="btn-orange-pill px-6 py-2.5 text-sm disabled:opacity-60 whitespace-nowrap"
      >
        {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
        {type === 'partner' ? 'Submit Partnership Enquiry' : 'Send Enquiry'}
      </button>
    </form>
  );
}
