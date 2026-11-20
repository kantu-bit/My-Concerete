import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Accessibility,
  ArrowRight,
  ArrowUpFromLine,
  BedDouble,
  Blocks,
  BookOpen,
  Building,
  Building2,
  CalendarClock,
  Car,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  Cog,
  Construction,
  Droplet,
  Droplets,
  Factory,
  FileCheck,
  GraduationCap,
  HeartPulse,
  Home,
  Hotel,
  Landmark,
  Layers,
  MapPin,
  MessageCircle,
  Phone,
  Route,
  ShieldCheck,
  Snowflake,
  Store,
  Truck,
  Warehouse,
  Waves,
  X,
  Zap,
  ZoomIn,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { VisualPlate, type VisualVariant } from '../components/VisualPlate.tsx';
import { useDocumentMeta } from '../utils/seo.ts';
import { buildWhatsAppUrl, cleanPhoneDigits } from '../utils/documents.ts';
import type { CustomerSegmentConfig } from '../types/index.ts';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Accessibility,
  ArrowUpFromLine,
  BedDouble,
  Blocks,
  BookOpen,
  Building,
  Building2,
  Car,
  Clock,
  Cog,
  Construction,
  Droplet,
  Droplets,
  Factory,
  FileCheck,
  GraduationCap,
  HeartPulse,
  Home,
  Hotel,
  Landmark,
  Layers,
  Route,
  ShieldCheck,
  Snowflake,
  Store,
  Truck,
  Warehouse,
  Waves,
  Zap,
};

function renderSegmentIcon(name: string, className = 'w-5 h-5') {
  const IconComp = ICON_MAP[name] || Building2;
  return <IconComp className={className} />;
}

export function CustomersOverviewPage() {
  const { data, lang, t } = useApp();
  const isKn = lang === 'kn';
  const biz = data?.businessConfig;
  const segments = data?.customerPages || [];

  const phoneDisplay = biz?.phone || '+91 73378 07372';
  const whatsappDisplay = biz?.whatsapp || phoneDisplay;

  useDocumentMeta({
    title: isKn
      ? 'ಗ್ರಾಹಕ ವಿಭಾಗಗಳು | MY CONCRETE – ರಾಣೆಬೆನ್ನೂರು ಮತ್ತು ದಾವಣಗೆರೆ'
      : 'Customer Sectors We Serve | MY CONCRETE – Ranebennur & Davangere',
    description:
      'Explore dedicated Ready-Mix Concrete and Cement Bricks solutions for Residential, Commercial, Government, Infrastructure, Institutions, and Industrial projects.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${window.location.origin}/` },
        { '@type': 'ListItem', position: 2, name: 'Customers', item: `${window.location.origin}/customers` },
      ],
    },
  });

  return (
    <div className="bg-[var(--bg)]">
      {/* Top Hero Header */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#F3F8FF] via-[#DCEBFF] to-[#C8DFFF] dark:from-[#0B1745] dark:via-[#12266E] dark:to-[#0F1F5C] border-b border-[#D7E4FF] dark:border-[#264096]">
        <div className="max-w-[1344px] mx-auto px-6 xl:px-12 py-12 lg:py-16">
          <nav aria-label="Breadcrumb" className="mb-4 text-xs sm:text-sm font-medium text-[#3C4F7E] dark:text-slate-300 flex items-center gap-2">
            <Link to="/" className="hover:text-[#1F3FA8] dark:hover:text-[#FFC93C] transition-colors">
              {t('home')}
            </Link>
            <span aria-hidden="true">&gt;</span>
            <span className="font-semibold text-[#0F1F5C] dark:text-white">{t('customers')}</span>
          </nav>

          <div className="max-w-3xl space-y-5">
            <div className="inline-block bg-[#1F3FA8] px-7 py-5 shadow-[0_14px_30px_-8px_rgba(31,63,168,0.45)]">
              <h1 className="font-display font-extrabold uppercase text-white text-[clamp(1.85rem,3.6vw,3rem)] leading-[1.08] tracking-tight">
                {isKn ? 'ಪ್ರತಿ ನಿರ್ಮಾಣ ವಿಭಾಗಕ್ಕೂ ಸಿದ್ಧ ಕಾಂಕ್ರೀಟ್' : 'CONCRETE SOLUTIONS FOR EVERY CUSTOMER SECTOR'}
              </h1>
            </div>
            <p className="font-sans text-[17px] leading-[1.75] text-[#2B3D6B] dark:text-slate-200 max-w-2xl">
              {isKn
                ? 'ಸ್ವಂತ ಮನೆಗಳಿಂದ ಹಿಡಿದು ವಾಣಿಜ್ಯ ಸಂಕೀರ್ಣಗಳು, ಸರ್ಕಾರಿ ಕಾಮಗಾರಿಗಳು, ಹೆದ್ದಾರಿ, ಶಾಲಾ-ಆಸ್ಪತ್ರೆ ಮತ್ತು ಕಾರ್ಖಾನೆಗಳವರೆಗೆ 24 ಗಂಟೆ ರೆಡಿ ಮಿಕ್ಸ್ ಕಾಂಕ್ರೀಟ್ ಮತ್ತು ಸಿಮೆಂಟ್ ಇಟ್ಟಿಗೆ ಪೂರೈಕೆ.'
                : 'Select your project sector below to explore tailored RMC grades, pump & transit-mixer workflows, site applications, and direct 24-hour booking across Ranebennur & Davangere.'}
            </p>
          </div>
        </div>
      </section>

      {/* 6 Customer Sector Cards (4:3 photo card, bottom navy gradient, Poppins 700 white title, short line, arrow button, 1.06 hover zoom + sliding red underline) */}
      <section className="max-w-[1344px] mx-auto px-6 xl:px-12 py-14 lg:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
          {segments.map((seg) => {
            const title = isKn ? seg.labelKn || seg.label : seg.label;
            const desc = isKn ? seg.shortDescKn || seg.shortDesc : seg.shortDesc;
            const cardSrc = seg.cardImage || `/images/customers/${seg.slug}-card.webp`;
            const cardAlt = seg.cardAlt || `${seg.label} buildings and projects built with ready-mix concrete`;
            return (
              <Link
                key={seg.slug}
                to={`/customers/${seg.slug}`}
                className="group relative aspect-[4/3] rounded-[12px] overflow-hidden shadow-[0_14px_32px_-12px_rgba(15,31,92,0.32)] border border-[#D7E4FF] dark:border-[#264096] block focus:outline-none focus:ring-2 focus:ring-[#1F3FA8]"
              >
                <VisualPlate
                  imageUrl={cardSrc}
                  variant={(seg.visualKey as VisualVariant) || 'batching-plant'}
                  title={title}
                  alt={cardAlt}
                  width={800}
                  height={600}
                  className="w-full h-full transition-transform duration-500 ease-out group-hover:scale-[1.06]"
                />
                {/* Bottom navy-to-transparent gradient */}
                <div
                  className="absolute inset-0 bg-gradient-to-t from-[#0F1F5C] via-[#0F1F5C]/55 to-transparent"
                  aria-hidden="true"
                />

                <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6 flex items-end justify-between gap-4">
                  <div className="space-y-1.5 min-w-0">
                    <h2 className="relative inline-block font-display font-bold text-2xl text-white pb-1.5">
                      <span>{title}</span>
                      <span
                        className="absolute left-0 bottom-0 h-[3px] w-full bg-[#D92B25] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out"
                        aria-hidden="true"
                      />
                    </h2>
                    <p className="text-sm text-slate-100/95 line-clamp-2 leading-snug">
                      {desc}
                    </p>
                  </div>

                  <span
                    className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/15 border border-white/35 group-hover:bg-[#D92B25] group-hover:border-[#D92B25] text-white transition-colors shrink-0"
                    aria-hidden="true"
                  >
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* CTA Band */}
      <section className="bg-[#0F1F5C] text-white py-12 lg:py-14">
        <div className="max-w-[1344px] mx-auto px-6 xl:px-12 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <h2 className="font-display font-extrabold text-2xl sm:text-3xl">
              {isKn ? 'ನಿಮ್ಮ ಯೋಜನೆಗೆ ತಕ್ಕ ದರ ಮತ್ತು ಸಮಯ ತಿಳಿಯಿರಿ' : 'Ready to Schedule Concrete or Cement Bricks?'}
            </h2>
            <p className="text-sm sm:text-base text-slate-200">
              {isKn
                ? 'ಕೊತಿಹಾಳ್ ಘಟಕದಿಂದ 24 ಗಂಟೆಯೂ ಸೇವೆ ಲಭ್ಯ. ಆನ್‌ಲೈನ್‌ನಲ್ಲಿ ಸ್ಲಾಟ್ ಬುಕ್ ಮಾಡಿ ಅಥವಾ ನೇರವಾಗಿ ಕರೆ ಮಾಡಿ.'
                : 'Open 24 hours from Kotihal, serving Ranebennur, Davangere, and surrounding taluks within 50 km.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/book"
              className="inline-flex items-center gap-2 rounded-[6px] bg-[#D92B25] hover:bg-[#B9221D] px-6 py-3 text-sm font-semibold text-white shadow-md transition-colors"
            >
              <span>{t('bookDelivery')}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/quote"
              className="inline-flex items-center gap-2 rounded-[6px] border border-white/60 hover:bg-white/10 px-5 py-3 text-sm font-semibold text-white transition-colors"
            >
              <span>{t('getQuote')}</span>
            </Link>
            <a
              href={`tel:+${cleanPhoneDigits(phoneDisplay)}`}
              className="inline-flex items-center gap-2 rounded-[6px] bg-white/10 hover:bg-white/20 px-4 py-3 text-sm font-semibold text-[#FFC93C] transition-colors"
            >
              <Phone className="w-4 h-4" />
              <span className="tabular-nums">{phoneDisplay}</span>
            </a>
            <a
              href={buildWhatsAppUrl(whatsappDisplay, 'Hi MY CONCRETE, I would like to enquire about ready-mix concrete.')}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-[6px] bg-[#16A34A] hover:bg-[#15803D] px-4 py-3 text-sm font-semibold text-white transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{t('whatsapp')}</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

export function CustomersPage() {
  const { segment } = useParams();
  const { data, lang, t } = useApp();
  const isKn = lang === 'kn';
  const biz = data?.businessConfig;

  const segments: CustomerSegmentConfig[] = data?.customerPages || [];
  const current = useMemo(
    () => segments.find((s) => s.slug === segment) || segments[0],
    [segments, segment]
  );
  const otherSegments = useMemo(
    () => segments.filter((s) => s.slug !== current?.slug).slice(0, 5),
    [segments, current]
  );

  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  useEffect(() => {
    setOpenFaqIdx(0);
    setLightboxIdx(null);
  }, [current?.slug]);

  const galleryItems = current?.gallery || [];

  useEffect(() => {
    if (lightboxIdx === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxIdx(null);
      if (e.key === 'ArrowRight' && galleryItems.length > 0) {
        setLightboxIdx((prev) => (prev === null ? null : (prev + 1) % galleryItems.length));
      }
      if (e.key === 'ArrowLeft' && galleryItems.length > 0) {
        setLightboxIdx((prev) =>
          prev === null ? null : (prev - 1 + galleryItems.length) % galleryItems.length
        );
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxIdx, galleryItems.length]);

  const phoneDisplay = biz?.phone || '+91 73378 07372';
  const whatsappDisplay = biz?.whatsapp || phoneDisplay;

  const label = current ? (isKn ? current.labelKn || current.label : current.label) : 'Customers';
  const heroHeadline = current
    ? (isKn ? current.heroHeadlineKn || current.heroHeadline : current.heroHeadline)
    : 'CONCRETE SOLUTIONS';
  const headlineLines = heroHeadline.split('\n').filter(Boolean).slice(0, 3);
  const titleBox = current ? (isKn ? current.titleBoxKn || current.titleBox : current.titleBox) : '';
  const introParas = current
    ? isKn && current.introParagraphsKn?.length >= 2
      ? current.introParagraphsKn
      : current.introParagraphs
    : [];
  const faqs = current?.faqs || [];

  const seoJsonLd = useMemo(() => {
    if (!current) return undefined;
    const origin = window.location.origin;
    return [
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${origin}/` },
          { '@type': 'ListItem', position: 2, name: 'Customers', item: `${origin}/customers` },
          {
            '@type': 'ListItem',
            position: 3,
            name: current.label,
            item: `${origin}/customers/${current.slug}`,
          },
        ],
      },
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map((f) => ({
          '@type': 'Question',
          name: isKn ? f.qKn || f.q : f.q,
          acceptedAnswer: {
            '@type': 'Answer',
            text: isKn ? f.aKn || f.a : f.a,
          },
        })),
      },
    ];
  }, [current, faqs, isKn]);

  useDocumentMeta({
    title: `${label} Concrete Solutions | MY CONCRETE – Ranebennur & Davangere`,
    description: current
      ? `${current.shortDesc} Supplied 24/7 from Kotihal, Karnataka within 50 km of Ranebennur and Davangere.`
      : 'Ready-Mix Concrete and Cement Bricks from MY CONCRETE.',
    jsonLd: seoJsonLd,
  });

  if (!current) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-20 text-center text-sm text-[var(--muted)]">
        Loading customer sector information...
      </div>
    );
  }

  const benefits = [
    {
      icon: Clock,
      title: isKn ? '24 ಗಂಟೆ ಪ್ಲಾಂಟ್ ಸೇವೆ' : 'Open 24 Hours, All Days',
      desc: isKn
        ? 'ಬೆಳಿಗ್ಗೆ, ಮಧ್ಯಾಹ್ನ ಅಥವಾ ತಂಪಾದ ರಾತ್ರಿ 2-ಗಂಟೆಗಳ ಸ್ಲಾಟ್‌ಗಳಲ್ಲಿ ನೇರ ಬುಕಿಂಗ್.'
        : 'Book morning, daytime, or cool evening & night 2-hour delivery slots online.',
    },
    {
      icon: Truck,
      title: isKn ? 'ಟ್ರಾನ್ಸಿಟ್ ಮಿಕ್ಸರ್ ಮತ್ತು ಪಂಪ್' : 'Transit-Mixer & Pump Support',
      desc: isKn
        ? 'ಸೈಟ್ ಅಗತ್ಯಕ್ಕೆ ತಕ್ಕಂತೆ ಮಿಕ್ಸರ್ ಜೊತೆಗೆ ಲೈನ್ ಅಥವಾ ಬೂಮ್ ಪಂಪ್ ಆಯ್ಕೆ.'
        : 'Enclosed transit-mixer transport with optional line pump or boom pump placement.',
    },
    {
      icon: Layers,
      title: isKn ? 'M5–M40+ ಮತ್ತು ಸಿಮೆಂಟ್ ಇಟ್ಟಿಗೆ' : 'M5–M40+ & Cement Bricks',
      desc: isKn
        ? 'ಎಲ್ಲಾ ಗ್ರೇಡ್ ಕಾಂಕ್ರೀಟ್, ವಿಶೇಷ ಮಿಶ್ರಣ ಮತ್ತು 4"/6"/8" ಸಿಮೆಂಟ್ ಇಟ್ಟಿಗೆಗಳು.'
        : 'Full range of structural concrete grades, custom mixes, and solid cement bricks.',
    },
    {
      icon: MapPin,
      title: isKn ? 'ಕೊತಿಹಾಳ್‌ನ ಸ್ಥಳೀಯ ಪ್ಲಾಂಟ್' : 'Kotihal Plant for Local Sites',
      desc: isKn
        ? 'ರಾಣೆಬೆನ್ನೂರು, ದಾವಣಗೆರೆ ಮತ್ತು ~50 ಕಿ.ಮೀ ಸುತ್ತಮುತ್ತ ವೇಗದ ತಲುಪುವಿಕೆ.'
        : 'Serving Ranebennur, Davangere, and towns within 50 km from our Kotihal unit.',
    },
  ];

  const orderSteps = [
    {
      step: '01',
      icon: ClipboardList,
      title: isKn ? 'ಅಗತ್ಯವನ್ನು ತಿಳಿಸಿ' : 'Tell us your requirement',
      desc: isKn
        ? 'ಗ್ರೇಡ್, ಪ್ರಮಾಣ (m³ / ಇಟ್ಟಿಗೆಗಳು) ಮತ್ತು ಪಂಪ್ ಅಗತ್ಯವನ್ನು ಆಯ್ಕೆಮಾಡಿ.'
        : 'Pick your concrete grade or brick size, quantity, and pump option.',
    },
    {
      step: '02',
      icon: CalendarClock,
      title: isKn ? 'ದಿನಾಂಕ ಮತ್ತು ಸ್ಲಾಟ್ ಆರಿಸಿ' : 'Choose date & slot',
      desc: isKn
        ? '24 ಗಂಟೆಯ ಲಭ್ಯವಿರುವ 2-ಗಂಟೆಯ ಡೆಲಿವರಿ ಸಮಯವನ್ನು ಕಾಯ್ದಿರಿಸಿ.'
        : 'Select any available 2-hour day or night slot around your pour schedule.',
    },
    {
      step: '03',
      icon: Truck,
      title: isKn ? 'ಟ್ರಾನ್ಸಿಟ್ ಮಿಕ್ಸರ್ ಪೂರೈಕೆ' : 'We deliver by transit mixer',
      desc: isKn
        ? 'ಕೊತಿಹಾಳ್ ಪ್ಲಾಂಟ್‌ನಿಂದ ತಾಜಾ ಬ್ಯಾಚ್ ಕಾಂಕ್ರೀಟ್ ನೇರವಾಗಿ ಸೈಟ್‌ಗೆ ಬರುತ್ತದೆ.'
        : 'Freshly batched mix dispatches straight from Kotihal to your pinned site.',
    },
    {
      step: '04',
      icon: CheckCircle2,
      title: isKn ? 'ನಂಬಿಕೆಯಿಂದ ಕಾಂಕ್ರೀಟ್ ಸುರಿಯಿರಿ' : 'Pour with confidence',
      desc: isKn
        ? 'ಲೈವ್ ಸ್ಟೇಟಸ್ ಟ್ರ್ಯಾಕಿಂಗ್ ಮತ್ತು ಸ್ಪಷ್ಟ GST ಬಿಲ್ಲಿಂಗ್ ಜೊತೆ ನಿರಾಳ ಕಾಮಗಾರಿ.'
        : 'Track order status online with clear documentation and responsive support.',
    },
  ];

  return (
    <div className="bg-[var(--bg)]">
      {/* A) HERO BANNER (~460px desktop): light-sky gradient left + photo right fading left; mobile stacks photo on top */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#F3F8FF] via-[#DCEBFF] to-[#CFE2FF] dark:from-[#0B1745] dark:via-[#12266E] dark:to-[#0F1F5C] border-b border-[#D7E4FF] dark:border-[#264096]">
        <div className="lg:min-h-[460px] flex flex-col lg:block relative">
          {/* Photo (Top on mobile, Right ~50% on desktop with left-edge sky fade) */}
          <div className="relative h-[230px] sm:h-[290px] lg:h-auto lg:absolute lg:inset-y-0 lg:right-0 lg:w-[54%] order-1">
            <VisualPlate
              imageUrl={current.heroImage || `/images/customers/${current.slug}-hero.webp`}
              variant={(current.visualKey as VisualVariant) || 'batching-plant'}
              title={label}
              alt={current.heroAlt || `${current.label} projects built with MY CONCRETE ready-mix concrete`}
              width={1200}
              height={800}
              priority
              className="w-full h-full"
            />
            {/* Desktop Left-edge soft gradient fade into sky background */}
            <div
              className="hidden lg:block absolute inset-0 pointer-events-none dark:hidden"
              style={{
                background:
                  'linear-gradient(90deg, #E2EEFF 0%, rgba(226,238,255,0.85) 16%, rgba(226,238,255,0.22) 45%, rgba(226,238,255,0) 75%)',
              }}
              aria-hidden="true"
            />
            <div
              className="hidden dark:lg:block absolute inset-0 pointer-events-none"
              style={{
                background:
                  'linear-gradient(90deg, #102164 0%, rgba(16,33,100,0.85) 18%, rgba(16,33,100,0.25) 48%, rgba(16,33,100,0) 78%)',
              }}
              aria-hidden="true"
            />
          </div>

          {/* Left Content Box (Below photo on mobile, Left overlay container on desktop) */}
          <div className="relative z-10 max-w-[1344px] mx-auto w-full px-6 xl:px-12 py-8 lg:py-14 lg:min-h-[460px] flex flex-col justify-center order-2">
            <div className="lg:max-w-[54%] space-y-5">
              {/* Breadcrumb */}
              <nav
                aria-label="Breadcrumb"
                className="text-xs sm:text-sm font-medium text-[#3C4F7E] dark:text-slate-300 flex flex-wrap items-center gap-2"
              >
                <Link to="/" className="hover:text-[#1F3FA8] dark:hover:text-[#FFC93C] transition-colors">
                  {t('home')}
                </Link>
                <span aria-hidden="true">&gt;</span>
                <Link to="/customers" className="hover:text-[#1F3FA8] dark:hover:text-[#FFC93C] transition-colors">
                  {t('customers')}
                </Link>
                <span aria-hidden="true">&gt;</span>
                <span className="font-semibold text-[#0F1F5C] dark:text-white">{label}</span>
              </nav>

              {/* Solid brand-blue (#1F3FA8) rectangle headline */}
              <div className="inline-block bg-[#1F3FA8] px-7 py-5 shadow-[0_14px_30px_-8px_rgba(31,63,168,0.45)]">
                <h1 className="font-display font-extrabold uppercase text-white text-[clamp(1.75rem,3.35vw,3rem)] leading-[1.08] tracking-tight">
                  {headlineLines.map((line, idx) => (
                    <span key={idx} className="block">
                      {line}
                    </span>
                  ))}
                </h1>
              </div>

              <p className="text-sm sm:text-base font-medium text-[#2B3D6B] dark:text-slate-200 max-w-xl">
                {isKn ? current.shortDescKn || current.shortDesc : current.shortDesc}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* B) INTRO SPLIT SECTION */}
      <section className="max-w-[1344px] mx-auto px-6 xl:px-12 py-14 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-5">
            <div className="rounded-[12px] overflow-hidden shadow-[0_16px_38px_-12px_rgba(15,31,92,0.22)] border border-[#D7E4FF] dark:border-[#264096] aspect-[4/3] group">
              <VisualPlate
                imageUrl={current.introImage || current.cardImage || current.heroImage}
                variant={(current.visualKey as VisualVariant) || 'batching-plant'}
                title={titleBox}
                alt={current.cardAlt || titleBox}
                width={800}
                height={600}
                className="w-full h-full group-hover:scale-[1.03] transition-transform duration-500"
              />
            </div>
          </div>

          <div className="lg:col-span-7 space-y-6">
            <div className="border border-[#1F3FA8] dark:border-[#6EA0FF] rounded-[8px] px-5 py-4 bg-white/75 dark:bg-[#12266E]/60">
              <h2 className="font-display font-semibold text-[#1F3FA8] dark:text-[#FFC93C] text-[22px] sm:text-[26px] leading-snug">
                {titleBox}
              </h2>
            </div>

            <div className="space-y-4 font-sans text-[17px] leading-[1.8] text-[#2B3D6B] dark:text-slate-200">
              {introParas.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* C) WHERE WE SUPPLY */}
      <section className="bg-[var(--bg-soft)] border-y border-[#D7E4FF] dark:border-[#264096] py-14 lg:py-16">
        <div className="max-w-[1344px] mx-auto px-6 xl:px-12 space-y-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#D92B25] mb-1">
                {label}
              </p>
              <h2 className="font-display font-bold text-2xl sm:text-3xl text-[#0F1F5C] dark:text-white">
                {t('whereWeSupply')}
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {current.applications.map((app, idx) => (
              <div
                key={idx}
                className="warm-card p-6 flex items-start gap-4 hover:shadow-md transition-shadow"
              >
                <div className="w-11 h-11 rounded-[10px] bg-[#EAF1FF] dark:bg-[#1F3FA8] text-[#1F3FA8] dark:text-[#FFC93C] flex items-center justify-center shrink-0">
                  {renderSegmentIcon(app.icon, 'w-5 h-5')}
                </div>
                <div className="space-y-1">
                  <h3 className="font-display font-bold text-base text-[#0F1F5C] dark:text-white">
                    {isKn ? app.titleKn || app.title : app.title}
                  </h3>
                  <p className="text-sm text-[var(--muted)] leading-relaxed">
                    {isKn ? app.descriptionKn || app.description : app.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* D) RECOMMENDED GRADES TABLE */}
      <section className="max-w-[1344px] mx-auto px-6 xl:px-12 py-14 lg:py-16 space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#D92B25] mb-1">
            {label}
          </p>
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-[#0F1F5C] dark:text-white">
            {t('recommendedGrades')}
          </h2>
        </div>

        <div className="warm-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#0F1F5C] text-white">
                <tr>
                  <th className="px-5 py-3.5 font-display font-semibold">{t('gradeUse')}</th>
                  <th className="px-5 py-3.5 font-display font-semibold whitespace-nowrap">{t('typicalGrade')}</th>
                  <th className="px-5 py-3.5 font-display font-semibold">{t('gradeNotes')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D7E4FF] dark:divide-[#264096]">
                {current.recommendedGrades.map((row, idx) => (
                  <tr
                    key={idx}
                    className="odd:bg-white even:bg-[#F7FAFF] dark:odd:bg-[#12266E] dark:even:bg-[#152D80]"
                  >
                    <td className="px-5 py-4 font-semibold text-[#0F1F5C] dark:text-white">
                      {isKn ? row.useKn || row.use : row.use}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="inline-block rounded-md bg-[#EAF1FF] dark:bg-[#1F3FA8] text-[#1F3FA8] dark:text-[#FFC93C] font-mono font-bold text-xs px-2.5 py-1">
                        {row.grade}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-[var(--muted)]">
                      {isKn ? row.notesKn || row.notes : row.notes}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <p className="text-xs sm:text-sm font-medium text-[var(--muted)] italic">
          {t('indicativeGradeNote')}
        </p>
      </section>

      {/* E) WHY MY CONCRETE FOR [SEGMENT] (ONLY TRUE FACTS) */}
      <section className="bg-[var(--bg-soft)] border-y border-[#D7E4FF] dark:border-[#264096] py-14 lg:py-16">
        <div className="max-w-[1344px] mx-auto px-6 xl:px-12 space-y-8">
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-[#0F1F5C] dark:text-white">
            {t('whyMyConcreteFor')} {label}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((b, idx) => {
              const Icon = b.icon;
              return (
                <div key={idx} className="warm-card p-6 space-y-3 border-t-4 border-t-[#1F3FA8]">
                  <div className="w-11 h-11 rounded-[10px] bg-[#1F3FA8] text-[#FFC93C] flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-display font-bold text-base text-[#0F1F5C] dark:text-white">
                    {b.title}
                  </h3>
                  <p className="text-sm text-[var(--muted)] leading-relaxed">{b.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* F) HOW ORDERING WORKS (4-STEP STRIP) */}
      <section className="max-w-[1344px] mx-auto px-6 xl:px-12 py-14 lg:py-16 space-y-8">
        <h2 className="font-display font-bold text-2xl sm:text-3xl text-[#0F1F5C] dark:text-white">
          {t('howOrderingWorks')}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {orderSteps.map((st, idx) => {
            const Icon = st.icon;
            return (
              <div key={idx} className="warm-card p-6 relative space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-full bg-[#EAF1FF] dark:bg-[#1F3FA8] text-[#1F3FA8] dark:text-[#FFC93C] flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="font-mono font-bold text-lg text-[#D92B25]">{st.step}</span>
                </div>
                <h3 className="font-display font-bold text-base text-[#0F1F5C] dark:text-white">
                  {st.title}
                </h3>
                <p className="text-sm text-[var(--muted)] leading-relaxed">{st.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* G) PHOTO GALLERY STRIP (3-6 photos + Lightbox modal) */}
      {galleryItems.length > 0 && (
        <section className="bg-[var(--bg-soft)] border-y border-[#D7E4FF] dark:border-[#264096] py-14 lg:py-16">
          <div className="max-w-[1344px] mx-auto px-6 xl:px-12 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display font-bold text-2xl sm:text-3xl text-[#0F1F5C] dark:text-white">
                {t('projectGallery')}
              </h2>
              <Link to="/media" className="text-sm font-semibold text-[#1F3FA8] dark:text-[#FFC93C] hover:underline inline-flex items-center gap-1">
                <span>{t('media')}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {galleryItems.slice(0, 6).map((item, idx) => {
                const caption = isKn ? item.captionKn || item.caption : item.caption;
                return (
                  <button
                    key={item.id || idx}
                    type="button"
                    onClick={() => setLightboxIdx(idx)}
                    className="group relative rounded-[12px] overflow-hidden border border-[#D7E4FF] dark:border-[#264096] aspect-[4/3] text-left shadow-sm hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-[#1F3FA8]"
                  >
                    <VisualPlate
                      imageUrl={item.imageUrl}
                      variant={(current.visualKey as VisualVariant) || 'batching-plant'}
                      title={caption}
                      width={800}
                      height={600}
                      className="w-full h-full group-hover:scale-[1.06] transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0F1F5C]/90 via-[#0F1F5C]/25 to-transparent" />
                    <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 text-[#0F1F5C] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow">
                      <ZoomIn className="w-4 h-4" />
                    </div>
                    <div className="absolute inset-x-0 bottom-0 p-3.5">
                      <p className="text-xs sm:text-sm font-semibold text-white line-clamp-2">
                        {caption}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* H) FAQ ACCORDION (4 Questions) */}
      {faqs.length > 0 && (
        <section className="max-w-4xl mx-auto px-6 py-14 lg:py-16 space-y-6">
          <div className="text-center space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-[#D92B25]">{label}</p>
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-[#0F1F5C] dark:text-white">
              {t('faqTitle')}
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIdx === idx;
              const qText = isKn ? faq.qKn || faq.q : faq.q;
              const aText = isKn ? faq.aKn || faq.a : faq.a;
              return (
                <div key={idx} className="warm-card overflow-hidden">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                    className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 font-display font-semibold text-base text-[#0F1F5C] dark:text-white hover:bg-[#F5F8FF] dark:hover:bg-[#19338C] transition-colors"
                  >
                    <span>{qText}</span>
                    <ChevronDown
                      className={`w-5 h-5 text-[#1F3FA8] dark:text-[#FFC93C] shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 pt-1 text-sm sm:text-base text-[var(--muted)] leading-relaxed border-t border-[#EAF1FF] dark:border-[#264096]">
                      {aText}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* I) CTA BAND: Deep Navy #0F1F5C, Red Book Delivery + Get a Free Quote + Call + WhatsApp */}
      <section className="bg-[#0F1F5C] text-white py-12 lg:py-14">
        <div className="max-w-[1344px] mx-auto px-6 xl:px-12 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <h2 className="font-display font-extrabold text-2xl sm:text-3xl">
              {isKn
                ? `${label} ಕಾಮಗಾರಿಗೆ ಕಾಂಕ್ರೀಟ್ ಬುಕ್ ಮಾಡಲು ಸಿದ್ಧರೇ?`
                : `Plan Your ${label} Pour with MY CONCRETE`}
            </h2>
            <p className="text-sm sm:text-base text-slate-200">
              {isKn
                ? 'ರಾಣೆಬೆನ್ನೂರು, ದಾವಣಗೆರೆ ಮತ್ತು 50 ಕಿ.ಮೀ ಸುತ್ತಮುತ್ತ 24 ಗಂಟೆ ರೆಡಿ ಮಿಕ್ಸ್ ಕಾಂಕ್ರೀಟ್ ಮತ್ತು ಸಿಮೆಂಟ್ ಇಟ್ಟಿಗೆ ಪೂರೈಕೆ.'
                : 'Open 24 hours from Kotihal, delivering Ready-Mix Concrete & Cement Bricks within 50 km.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to={`/book?usage=${encodeURIComponent(current.label)}`}
              className="inline-flex items-center gap-2 rounded-[6px] bg-[#D92B25] hover:bg-[#B9221D] px-6 py-3 text-sm font-semibold text-white shadow-md transition-colors"
            >
              <span>{t('bookDelivery')}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/quote"
              className="inline-flex items-center gap-2 rounded-[6px] border border-white/60 hover:bg-white/10 px-5 py-3 text-sm font-semibold text-white transition-colors"
            >
              <span>{t('getQuote')}</span>
            </Link>
            <a
              href={`tel:+${cleanPhoneDigits(phoneDisplay)}`}
              className="inline-flex items-center gap-2 rounded-[6px] bg-white/10 hover:bg-white/20 px-4 py-3 text-sm font-semibold text-[#FFC93C] transition-colors"
            >
              <Phone className="w-4 h-4" />
              <span className="tabular-nums">{phoneDisplay}</span>
            </a>
            <a
              href={buildWhatsAppUrl(
                whatsappDisplay,
                `Hi MY CONCRETE, I would like to enquire about ready-mix concrete for a ${current.label} project.`
              )}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-[6px] bg-[#16A34A] hover:bg-[#15803D] px-4 py-3 text-sm font-semibold text-white transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{t('whatsapp')}</span>
            </a>
          </div>
        </div>
      </section>

      {/* J) OTHER CUSTOMER TYPES: Row of 5 small cards linking to the other 5 pages */}
      <section className="max-w-[1344px] mx-auto px-6 xl:px-12 py-12 lg:py-14 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display font-bold text-xl sm:text-2xl text-[#0F1F5C] dark:text-white">
            {t('otherCustomerTypes')}
          </h2>
          <Link to="/customers" className="text-sm font-semibold text-[#1F3FA8] dark:text-[#FFC93C] hover:underline">
            {t('allCustomerSectors')} →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {otherSegments.map((other) => {
            const otherLabel = isKn ? other.labelKn || other.label : other.label;
            const otherDesc = isKn ? other.shortDescKn || other.shortDesc : other.shortDesc;
            const cardSrc = other.cardImage || `/images/customers/${other.slug}-card.webp`;
            const cardAlt = other.cardAlt || `${other.label} projects built with ready-mix concrete`;
            return (
              <Link
                key={other.slug}
                to={`/customers/${other.slug}`}
                className="group relative aspect-[4/3] rounded-[12px] overflow-hidden border border-[#D7E4FF] dark:border-[#264096] shadow-sm hover:shadow-lg block"
              >
                <VisualPlate
                  imageUrl={cardSrc}
                  variant={(other.visualKey as VisualVariant) || 'batching-plant'}
                  title={otherLabel}
                  alt={cardAlt}
                  width={800}
                  height={600}
                  className="w-full h-full transition-transform duration-500 ease-out group-hover:scale-[1.06]"
                />
                <div
                  className="absolute inset-0 bg-gradient-to-t from-[#0F1F5C] via-[#0F1F5C]/55 to-transparent"
                  aria-hidden="true"
                />
                <div className="absolute inset-x-0 bottom-0 p-3.5 flex items-end justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="relative inline-block font-display font-bold text-base text-white pb-1">
                      <span>{otherLabel}</span>
                      <span
                        className="absolute left-0 bottom-0 h-[2.5px] w-full bg-[#D92B25] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out"
                        aria-hidden="true"
                      />
                    </h3>
                    <p className="text-[11px] text-slate-200 line-clamp-1">{otherDesc}</p>
                  </div>
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white/15 group-hover:bg-[#D92B25] text-white transition-colors shrink-0">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Lightbox Modal for Gallery */}
      {lightboxIdx !== null && galleryItems[lightboxIdx] && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Gallery Photo Lightbox"
          className="fixed inset-0 z-50 bg-[#081136]/90 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8"
          onClick={() => setLightboxIdx(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-[#0F1F5C] rounded-[14px] overflow-hidden border border-white/20 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setLightboxIdx(null)}
              aria-label="Close lightbox"
              className="absolute top-3 right-3 z-20 w-10 h-10 rounded-full bg-black/50 hover:bg-[#D92B25] text-white flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="relative h-[320px] sm:h-[480px] bg-black/30">
              <VisualPlate
                imageUrl={galleryItems[lightboxIdx].imageUrl}
                variant={(current.visualKey as VisualVariant) || 'batching-plant'}
                title={
                  isKn
                    ? galleryItems[lightboxIdx].captionKn || galleryItems[lightboxIdx].caption
                    : galleryItems[lightboxIdx].caption
                }
                width={1200}
                height={800}
                className="w-full h-full"
              />
              {galleryItems.length > 1 && (
                <>
                  <button
                    type="button"
                    aria-label="Previous photo"
                    onClick={() =>
                      setLightboxIdx((lightboxIdx - 1 + galleryItems.length) % galleryItems.length)
                    }
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/55 hover:bg-[#1F3FA8] text-white flex items-center justify-center transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    aria-label="Next photo"
                    onClick={() => setLightboxIdx((lightboxIdx + 1) % galleryItems.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/55 hover:bg-[#1F3FA8] text-white flex items-center justify-center transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            <div className="px-5 py-4 flex items-center justify-between gap-4 text-white">
              <p className="text-sm sm:text-base font-semibold">
                {isKn
                  ? galleryItems[lightboxIdx].captionKn || galleryItems[lightboxIdx].caption
                  : galleryItems[lightboxIdx].caption}
              </p>
              <span className="text-xs font-mono text-[#FFC93C] shrink-0">
                {lightboxIdx + 1} / {galleryItems.length}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
