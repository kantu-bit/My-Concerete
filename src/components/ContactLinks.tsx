import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Copy, ExternalLink, Mail, MessageCircle, Phone, X } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { buildWhatsAppUrl, cleanPhoneDigits } from '../utils/documents.ts';

export const DEFAULT_PHONE_DISPLAY = '+91 73378 07372';
export const DEFAULT_EMAIL_DISPLAY = 'myconcretektl@gmail.com';

export function formatTelHref(phoneDisplay: string): string {
  const digits = cleanPhoneDigits(phoneDisplay || DEFAULT_PHONE_DISPLAY);
  return `tel:+${digits || '917337807372'}`;
}

export function isPreviewIframe(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

export function isDesktopOrIframe(): boolean {
  if (typeof window === 'undefined') return false;
  if (isPreviewIframe()) return true;

  const hasTouch =
    'ontouchstart' in window ||
    (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0);
  const isCoarsePointer =
    typeof window.matchMedia === 'function' &&
    (window.matchMedia('(pointer: coarse)').matches ||
      window.matchMedia('(hover: none)').matches);

  // Only treat as native mobile dialer when NOT in an iframe AND touch + coarse pointer are present
  const isNativeMobile = hasTouch && isCoarsePointer;
  return !isNativeMobile;
}

async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fallback below
  }
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

interface CallLinkProps {
  phone?: string;
  whatsapp?: string;
  whatsappMessage?: string;
  className?: string;
  ariaLabel?: string;
  title?: string;
  onBeforePopup?: () => void;
  children?: React.ReactNode;
}

export function CallLink({
  phone,
  whatsapp,
  whatsappMessage = 'Hi MY CONCRETE, I would like to enquire about ready-mix concrete.',
  className = '',
  ariaLabel,
  title,
  onBeforePopup,
  children,
}: CallLinkProps) {
  const { data } = useApp();
  const biz = data?.businessConfig;
  const phoneDisplay = phone || biz?.phone || DEFAULT_PHONE_DISPLAY;
  const whatsappDisplay = whatsapp || biz?.whatsapp || phoneDisplay;
  const telHref = formatTelHref(phoneDisplay);
  const whatsappHref = buildWhatsAppUrl(whatsappDisplay, whatsappMessage);

  const [modalOpen, setModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!modalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setModalOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [modalOpen]);

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    if (isDesktopOrIframe()) {
      e.preventDefault();
      onBeforePopup?.();
      setCopied(false);
      setModalOpen(true);
    }
    // On real mobile outside an iframe, do NOT preventDefault: let native tel: dial directly.
  }

  async function handleCopy() {
    const ok = await copyTextToClipboard(phoneDisplay);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  return (
    <>
      <a
        href={telHref}
        target="_top"
        rel="noopener"
        onClick={handleClick}
        aria-label={ariaLabel || `Call ${phoneDisplay}`}
        title={title || `Call ${phoneDisplay}`}
        className={`cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC93C] ${className}`}
      >
        {children ?? phoneDisplay}
      </a>

      {modalOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="mc-call-modal-title"
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0F1F5C]/70 backdrop-blur-xs p-4"
            onClick={() => setModalOpen(false)}
          >
            <div
              className="w-full max-w-sm rounded-[18px] bg-white dark:bg-[#152972] border border-[#D7E4FF] dark:border-[#264096] p-6 shadow-2xl space-y-5 text-[#0F1F5C] dark:text-white"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#1F3FA8] text-[#FFC93C] flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#D92B25]">
                      24/7 Dispatch Desk
                    </p>
                    <h2 id="mc-call-modal-title" className="font-display font-bold text-lg">
                      Call MY CONCRETE
                    </h2>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  aria-label="Close popup"
                  className="p-1.5 rounded-full text-[var(--muted)] hover:bg-[#EAF1FF] dark:hover:bg-[#1F3FA8] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="rounded-xl bg-[#F7FAFF] dark:bg-[#0F1F5C] border border-[#D7E4FF] dark:border-[#264096] px-4 py-3.5 text-center space-y-1">
                <a
                  href={telHref}
                  target="_top"
                  rel="noopener"
                  className="font-slab font-bold text-2xl text-[#1F3FA8] dark:text-[#FFC93C] tabular-nums hover:underline inline-block"
                >
                  {phoneDisplay}
                </a>
                <p className="text-xs text-[var(--muted)]">
                  Kotihal Unit · Serving Ranebennur &amp; Davangere 24 Hours
                </p>
              </div>

              <div className="flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#1F3FA8] hover:bg-[#173187] text-white px-4 py-2.5 text-sm font-semibold transition-colors cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-[#FFC93C]" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy number</span>
                    </>
                  )}
                </button>

                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white px-4 py-2.5 text-sm font-semibold transition-colors cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Open WhatsApp</span>
                </a>

                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="w-full min-h-[44px] inline-flex items-center justify-center rounded-xl border border-[#D7E4FF] dark:border-[#264096] px-4 py-2.5 text-sm font-semibold text-[var(--muted)] hover:text-[#0F1F5C] dark:hover:text-white transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

interface EmailLinkProps {
  email?: string;
  className?: string;
  ariaLabel?: string;
  title?: string;
  onBeforePopup?: () => void;
  children?: React.ReactNode;
}

export function EmailLink({
  email,
  className = '',
  ariaLabel,
  title,
  onBeforePopup,
  children,
}: EmailLinkProps) {
  const { data } = useApp();
  const biz = data?.businessConfig;
  const emailDisplay = email || biz?.email || DEFAULT_EMAIL_DISPLAY;
  const mailtoHref = `mailto:${emailDisplay}`;

  const [modalOpen, setModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!modalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setModalOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [modalOpen]);

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    if (isDesktopOrIframe()) {
      e.preventDefault();
      onBeforePopup?.();
      setCopied(false);
      setModalOpen(true);
    }
    // On real mobile outside an iframe, allow native mailto: directly.
  }

  async function handleCopy() {
    const ok = await copyTextToClipboard(emailDisplay);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  return (
    <>
      <a
        href={mailtoHref}
        target="_top"
        rel="noopener"
        onClick={handleClick}
        aria-label={ariaLabel || `Email ${emailDisplay}`}
        title={title || `Email ${emailDisplay}`}
        className={`cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC93C] ${className}`}
      >
        {children ?? emailDisplay}
      </a>

      {modalOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="mc-email-modal-title"
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0F1F5C]/70 backdrop-blur-xs p-4"
            onClick={() => setModalOpen(false)}
          >
            <div
              className="w-full max-w-sm rounded-[18px] bg-white dark:bg-[#152972] border border-[#D7E4FF] dark:border-[#264096] p-6 shadow-2xl space-y-5 text-[#0F1F5C] dark:text-white"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#1F3FA8] text-[#FFC93C] flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#D92B25]">
                      Plant Email
                    </p>
                    <h2 id="mc-email-modal-title" className="font-display font-bold text-lg">
                      Email MY CONCRETE
                    </h2>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  aria-label="Close popup"
                  className="p-1.5 rounded-full text-[var(--muted)] hover:bg-[#EAF1FF] dark:hover:bg-[#1F3FA8] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="rounded-xl bg-[#F7FAFF] dark:bg-[#0F1F5C] border border-[#D7E4FF] dark:border-[#264096] px-4 py-3.5 text-center space-y-1">
                <p className="font-mono font-semibold text-base text-[#1F3FA8] dark:text-[#FFC93C] break-all">
                  {emailDisplay}
                </p>
                <p className="text-xs text-[var(--muted)]">
                  For BOQs, structural drawings, quotes &amp; partnerships
                </p>
              </div>

              <div className="flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#1F3FA8] hover:bg-[#173187] text-white px-4 py-2.5 text-sm font-semibold transition-colors cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-[#FFC93C]" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy email</span>
                    </>
                  )}
                </button>

                <a
                  href={mailtoHref}
                  target="_top"
                  rel="noopener"
                  className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#D92B25] hover:bg-[#B9221D] text-white px-4 py-2.5 text-sm font-semibold transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open Email App</span>
                </a>

                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="w-full min-h-[44px] inline-flex items-center justify-center rounded-xl border border-[#D7E4FF] dark:border-[#264096] px-4 py-2.5 text-sm font-semibold text-[var(--muted)] hover:text-[#0F1F5C] dark:hover:text-white transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

export function CopyPhoneButton({
  phone,
  className = '',
}: {
  phone?: string;
  className?: string;
}) {
  const { data } = useApp();
  const phoneDisplay = phone || data?.businessConfig?.phone || DEFAULT_PHONE_DISPLAY;
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const ok = await copyTextToClipboard(phoneDisplay);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer ${className}`}
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
      <span>{copied ? 'Copied!' : 'Copy number'}</span>
    </button>
  );
}
