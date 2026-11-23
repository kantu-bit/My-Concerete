import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  ArrowRight,
  Award,
  Blocks,
  Calculator,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Layers,
  MapPin,
  Navigation,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { useDocumentMeta } from '../utils/seo.ts';
import { FRIENDLY_API_ERROR, parseJsonResponse } from '../utils/api.ts';
import { VisualPlate } from '../components/VisualPlate.tsx';
import { CallLink } from '../components/ContactLinks.tsx';
import { CustomerSuccessStories } from '../components/CustomerSuccessStories.tsx';
import { DeliveryStatusWidget } from '../components/DeliveryStatusWidget.tsx';
import { DiamondMosaic } from '../components/DiamondMosaic.tsx';
import { ConnectForm } from '../components/ConnectForm.tsx';
import { WaveDivider } from '../components/WaveDivider.tsx';
import { ServiceZoneExplorer } from '../components/ServiceZoneExplorer.tsx';

function splitHeadlineLines(text: string, maxCharsPerLine = 22): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    if (!current) {
      current = word;
    } else if ((current + ' ' + word).length <= maxCharsPerLine && lines.length < 3) {
      current += ' ' + word;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) {
    if (lines.length >= 4) {
      lines[3] = `${lines[3]} ${current}`;
    } else {
      lines.push(current);
    }
  }
  return lines.slice(0, 4);
}

function AnimatedStatValue({ raw }: { raw: string }) {
  const numericMatch = raw.match(/^(\d+(?:\.\d+)?)$/);
  const [display, setDisplay] = useState(numericMatch ? '0' : raw);

  useEffect(() => {
    if (!numericMatch) {
      setDisplay(raw);
      return;
    }
    const target = Number(numericMatch[1]);
    let frame = 0;
    const totalFrames = 24;
    const timer = setInterval(() => {
      frame += 1;
      const progress = Math.min(1, frame / totalFrames);
      setDisplay(String(Math.round(target * progress)));
      if (frame >= totalFrames) clearInterval(timer);
    }, 28);
    return () => clearInterval(timer);
  }, [raw]);

  return <span className="tabular-nums font-slab">{display}</span>;
}

const HOME_FAQS = [
  {
    q: 'Where is MY CONCRETE located and which areas do you deliver to?',
    a: 'Our plant is located at FM66+2X6, Kotihal, Karnataka 581119 (inside Lucky Artificial Sand Industry premises, near Ranebennur). We deliver Ready-Mix Concrete and Cement Bricks across Ranebennur, Davangere, Byadgi, Harihar, Haveri, and nearby towns within our service radius.',
  },
  {
    q: 'Are you really open 24 hours for concrete delivery?',
    a: 'Yes! MY CONCRETE – Readymix Concrete Unit operates 24 hours a day across all days of the week. You can book any of our 12 two-hour delivery windows online, including evening and overnight slots for cooler roof slab pours.',
  },
  {
    q: 'What concrete grades and brick sizes do you supply?',
    a: 'We supply Ready-Mix Concrete from M5 to M40 (with higher grades like M45+ batched on request), specialty mixes (Slab, Self-Compacting, Fibre-Reinforced), plus machine-pressed Cement Bricks and 4", 6", and 8" Solid Cement Blocks.',
  },
  {
    q: 'Can I calculate how much concrete or how many bricks I need before booking?',
    a: 'Yes! Use our Concrete Volume Calculator to measure slabs, beams, columns, or footings in feet or metres, or our Brick Calculator to estimate brick/block counts for your walls—both pre-fill your online booking.',
  },
  {
    q: 'How are delivery prices shown on the website confirmed?',
    a: 'When pricing is entered in the system, online calculations show indicative material, delivery distance, and optional pump estimates. Final pricing, GST, and truck dispatch confirmation are verified directly by our Kotihal team.',
  },
];

export function HomePage() {
  const { data, loading, lang, t } = useApp();
  const [slideIdx, setSlideIdx] = useState(0);
  const [heroPaused, setHeroPaused] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterHoneypot, setNewsletterHoneypot] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState<string | null>(null);
  const [newsletterWhatsappUrl, setNewsletterWhatsappUrl] = useState<string | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const prefersReducedMotion = useReducedMotion();

  const biz = data?.businessConfig;
  const slides = data?.heroSlides || [];
  const products = (data?.products || []).filter((p) => p.isOffered);
  const projects = data?.projects || [];
  const blogs = data?.blogs || [];
  const stats = data?.statsItems || [];
  const testimonials = data?.testimonials || [];

  const plantLocations =
    data?.plantLocations && data.plantLocations.length > 0
      ? data.plantLocations
      : [
          {
            id: 'kotihal',
            name: biz?.businessName || 'MY CONCRETE – Readymix Concrete Unit (Kotihal)',
            shortLabel: 'Kotihal',
            address: biz?.address || 'FM66+2X6, Kotihal, Karnataka 581119',
            city: 'Ranebennur',
            postalCode: '581119',
            lat: biz?.plantLat || 14.4607,
            lng: biz?.plantLng || 75.6633,
            phone: biz?.phone || '+91 73378 07372',
            whatsapp: biz?.whatsapp || biz?.phone || '+91 73378 07372',
            hours: biz?.workingHours || 'Open 24 Hours (All Days)',
            serviceRadiusKm: biz?.serviceRadiusKm || 50,
            googleMapsUrl: biz?.googleMapsUrl || 'https://share.google/oZzcrYosJ0JYw2tTn',
            pinColor: 'blue' as const,
            isPrimary: true,
          },
          {
            id: 'davangere',
            name: 'MY CONCRETE – Davangere Unit',
            shortLabel: 'Davangere',
            address: 'Davangere, Karnataka 577001',
            city: 'Davangere',
            postalCode: '577001',
            lat: 14.4644,
            lng: 75.9218,
            phone: '+91 73378 07372',
            whatsapp: '+91 73378 07372',
            hours: 'Open 24 Hours (All Days)',
            serviceRadiusKm: 50,
            googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=14.4644,75.9218',
            pinColor: 'red' as const,
            isPrimary: false,
          },
        ];

  const sameAsLinks = [
    biz?.facebookUrl || 'https://www.facebook.com/MyConcretekotihal',
    biz?.instagramUrl || 'https://www.instagram.com/myconcretektl?knvt=cGttbzg1NGJ0N3o3',
    biz?.youtubeUrl,
    biz?.linkedinUrl,
  ].filter(Boolean);

  useDocumentMeta({
    title: 'MY CONCRETE – Ready Mix Concrete & Cement Bricks, Ranebennur & Davangere',
    description:
      'Ready-mix concrete (M5–M40+) and machine-pressed cement bricks from our Kotihal plant serving Ranebennur & Davangere, Karnataka. Open 24 hours — book your 2-hour delivery slot online.',
    jsonLd: [
      ...plantLocations.map((loc) => ({
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: loc.name,
        branchCode: loc.id,
        description:
          'Ready-mix concrete (M5–M40+) and cement bricks unit open 24 hours serving Ranebennur and Davangere, Karnataka.',
        address: {
          '@type': 'PostalAddress',
          streetAddress: loc.address,
          addressLocality: loc.city,
          addressRegion: 'Karnataka',
          postalCode: loc.postalCode,
          addressCountry: 'IN',
        },
        geo: {
          '@type': 'GeoCoordinates',
          latitude: loc.lat,
          longitude: loc.lng,
        },
        telephone: loc.phone || biz?.phone || '+91 73378 07372',
        email: biz?.email || 'myconcretektl@gmail.com',
        hasMap: loc.googleMapsUrl,
        sameAs: sameAsLinks,
        openingHours: 'Mo-Su 00:00-23:59',
        areaServed: ['Ranebennur', 'Davangere', 'Kotihal', 'Harihar', 'Byadgi', 'Haveri'],
      })),
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: HOME_FAQS.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: {
            '@type': 'Answer',
            text: f.a,
          },
        })),
      },
    ],
  });

  useEffect(() => {
    if (slides.length <= 1 || heroPaused || prefersReducedMotion) return;
    const timer = setInterval(() => {
      setSlideIdx((prev) => (prev + 1) % slides.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [slides.length, heroPaused, prefersReducedMotion]);

  useEffect(() => {
    if (slideIdx >= slides.length && slides.length > 0) {
      setSlideIdx(0);
    }
  }, [slides.length, slideIdx]);

  async function handleNewsletter(e: React.FormEvent) {
    e.preventDefault();
    setNewsletterStatus(null);
    setNewsletterWhatsappUrl(null);
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newsletterEmail,
          language: lang,
          website_url: newsletterHoneypot,
        }),
      });
      const { data: json, isJson } = await parseJsonResponse<{
        ok?: boolean;
        subCode?: string;
        whatsappUrl?: string;
        error?: string;
      }>(res);
      if (!isJson || !json) {
        setNewsletterStatus(FRIENDLY_API_ERROR);
        return;
      }
      if (res.ok) {
        const refPart = json.subCode ? `Reference ID: ${json.subCode} · ` : '';
        setNewsletterStatus(
          `${refPart}Subscribed! Our team will call you shortly if you shared a request.`
        );
        if (json.whatsappUrl) setNewsletterWhatsappUrl(json.whatsappUrl);
        setNewsletterEmail('');
      } else {
        setNewsletterStatus(json.error || 'Could not subscribe.');
      }
    } catch {
      setNewsletterStatus(FRIENDLY_API_ERROR);
    }
  }

  if (loading && !data) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-20 space-y-8 animate-pulse">
        <div className="h-[520px] rounded-[20px] bg-[#EAF1FF] dark:bg-[#152972]" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-36 rounded-[20px] bg-[#EAF1FF] dark:bg-[#152972]" />
          ))}
        </div>
      </div>
    );
  }

  const activeSlide = slides[slideIdx] || slides[0];
  const isMosaicSlide =
    activeSlide?.themeStyle === 'mosaic' || activeSlide?.visualKey === 'product-mosaic';
  const isDarkSlide =
    !isMosaicSlide && (activeSlide?.themeStyle === 'dark' || activeSlide?.visualKey === 'night-pour');

  const slideHeadline =
    lang === 'kn' && activeSlide?.headlineKn
      ? activeSlide.headlineKn
      : activeSlide?.headline || 'STRONG FOUNDATIONS DELIVERED ON TIME';
  const slideCtaLabel =
    lang === 'kn' && activeSlide?.ctaPrimaryKn
      ? activeSlide.ctaPrimaryKn
      : activeSlide?.ctaPrimary || 'Book Your Concrete Delivery';
  const slideCtaLink = activeSlide?.ctaLink || '/book';
  const headlineLines = splitHeadlineLines(
    slideHeadline,
    isMosaicSlide ? (lang === 'kn' ? 24 : 18) : lang === 'kn' ? 28 : 20
  );
  const useRedCta = !isMosaicSlide && (isDarkSlide || activeSlide?.visualKey === 'bricks');

  const whyFeatures = [
    {
      icon: <Clock className="w-5 h-5" />,
      circleClass: 'bg-[#16A34A]/15 text-[#16A34A]',
      title: 'Open 24 Hours, All Days',
      detail:
        'Book day or overnight 2-hour delivery slots anytime—ideal for smooth continuous slabs without daytime road congestion.',
    },
    {
      icon: <ShieldCheck className="w-5 h-5" />,
      circleClass: 'bg-[#1F3FA8]/12 text-[#1F3FA8] dark:bg-[#264096] dark:text-[#FFC93C]',
      title: 'Graded M-Sand & Batch Control',
      detail:
        'Located inside Lucky Artificial Sand Industry premises at Kotihal for calibrated raw material proportioning and consistent mixes.',
    },
    {
      icon: <Truck className="w-5 h-5" />,
      circleClass: 'bg-[#D92B25]/12 text-[#D92B25]',
      title: 'Mixers & Pump Placement',
      detail:
        'Dedicated transit-mixer scheduling and optional stationary line or boom pump support across Ranebennur & Davangere.',
    },
    {
      icon: <Blocks className="w-5 h-5" />,
      circleClass: 'bg-[#FFC93C]/30 text-[#0F1F5C] dark:text-[#FFC93C]',
      title: 'RMC & Cement Bricks Together',
      detail:
        'Source M5–M40+ Ready-Mix Concrete and precision cement bricks/blocks (4", 6", 8") from one dependable regional unit.',
    },
  ];

  const howItWorksSteps = [
    {
      num: '01',
      title: 'Calculate Quantity',
      text: 'Measure exact concrete cubic metres (m³) or wall brick counts with our free calculators.',
    },
    {
      num: '02',
      title: 'Pick 24/7 Slot & Pin Site',
      text: 'Choose any 2-hour day or night window and pin your site on the Ranebennur–Davangere map.',
    },
    {
      num: '03',
      title: 'Instant Reference & Dispatch Review',
      text: 'Download your PDF slip, add to calendar, and share directly with our Kotihal dispatch desk.',
    },
    {
      num: '04',
      title: 'On-Time Mixer or Brick Delivery',
      text: 'Freshly batched concrete or machine-pressed cement blocks arrive right on schedule.',
    },
  ];

  const directionsUrl =
    biz?.googleMapsUrl ||
    (biz ? `https://www.google.com/maps/dir/?api=1&destination=${biz.plantLat},${biz.plantLng}` : '#');

  function goPrevSlide() {
    if (slides.length <= 1) return;
    setSlideIdx((prev) => (prev - 1 + slides.length) % slides.length);
  }

  function goNextSlide() {
    if (slides.length <= 1) return;
    setSlideIdx((prev) => (prev + 1) % slides.length);
  }

  return (
    <div className="relative overflow-x-clip">
      {/* 1. HERO SLIDER: Full width, height = 100vh minus top bar (~84px), min 640px */}
      <section
        tabIndex={0}
        aria-label="MY CONCRETE Highlights"
        onMouseEnter={() => setHeroPaused(true)}
        onMouseLeave={() => setHeroPaused(false)}
        onTouchStart={(e) => {
          setHeroPaused(true);
          touchStartXRef.current = e.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(e) => {
          setHeroPaused(false);
          const startX = touchStartXRef.current;
          const endX = e.changedTouches[0]?.clientX ?? null;
          if (startX !== null && endX !== null) {
            const delta = endX - startX;
            if (Math.abs(delta) > 40) {
              if (delta > 0) goPrevSlide();
              else goNextSlide();
            }
          }
          touchStartXRef.current = null;
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') goPrevSlide();
          if (e.key === 'ArrowRight') goNextSlide();
        }}
        className={`relative w-full min-h-[640px] lg:h-[calc(100vh-84px)] lg:min-h-[640px] overflow-hidden focus:outline-none ${
          isDarkSlide ? 'bg-[#0F1F5C]' : isMosaicSlide ? 'concrete-speckle-bg' : 'bg-[#F4F8FF]'
        }`}
      >
        {/* Cross-fading Background Visuals */}
        <AnimatePresence mode="sync" initial={false}>
          <motion.div
            key={activeSlide?.id || `slide-${slideIdx}`}
            initial={{ opacity: prefersReducedMotion ? 1 : 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: prefersReducedMotion ? 1 : 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.65, ease: 'easeInOut' }}
            className={`absolute inset-0 ${isMosaicSlide ? 'pointer-events-auto' : 'pointer-events-none'}`}
          >
            {isMosaicSlide ? (
              <>
                {/* Right ~58% Diamond Mosaic Photo Grid bleeding off top, right & bottom */}
                <div className="hidden lg:block absolute inset-y-0 right-0 w-[59%]">
                  <DiamondMosaic tiles={activeSlide?.mosaicTiles || []} lang={lang} />
                </div>
                {/* Soft concrete-to-mosaic gradient transition along left ~44% */}
                <div
                  className="hidden lg:block absolute inset-y-0 left-0 w-[52%] pointer-events-none"
                  style={{
                    background:
                      'linear-gradient(90deg, rgba(236,239,244,0.98) 0%, rgba(236,239,244,0.92) 74%, rgba(236,239,244,0) 100%)',
                  }}
                  aria-hidden="true"
                />
                {/* Mobile mosaic strip peeking below headline */}
                <div className="lg:hidden absolute inset-x-0 bottom-0 h-56 opacity-90 pointer-events-none">
                  <DiamondMosaic tiles={activeSlide?.mosaicTiles || []} lang={lang} />
                </div>
                <div
                  className="lg:hidden absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      'linear-gradient(180deg, rgba(236,239,244,0.97) 0%, rgba(236,239,244,0.92) 60%, rgba(236,239,244,0.55) 100%)',
                  }}
                  aria-hidden="true"
                />
              </>
            ) : (
              <>
                {/* Right ~62% Visual Real MY CONCRETE Photography */}
                {(() => {
                  const heroImage =
                    activeSlide?.imageUrl || '/images/home/mixer-plant.webp';
                  const isPortraitHero =
                    heroImage.includes('plant-silos') || heroImage.includes('slab-rebar');
                  return (
                    <div className="absolute inset-y-0 right-0 w-full lg:w-[64%] overflow-hidden">
                      <VisualPlate
                        imageUrl={heroImage}
                        variant={
                          (activeSlide?.visualKey as
                            | 'batching-plant'
                            | 'engineers-site'
                            | 'night-pour'
                            | 'bricks') || 'batching-plant'
                        }
                        tone={isDarkSlide ? 'dark' : 'light'}
                        width={isPortraitHero ? 900 : 1280}
                        height={isPortraitHero ? 1600 : 720}
                        objectPosition={activeSlide?.objectPosition || 'center'}
                        alt={
                          activeSlide?.alt ||
                          `${slideHeadline} – MY CONCRETE Kotihal Ranebennur & Davangere`
                        }
                        priority={slideIdx === 0}
                        kenBurns={!prefersReducedMotion}
                        title={biz?.businessName || 'MY CONCRETE – Readymix Concrete Unit'}
                      />
                    </div>
                  );
                })()}

                {/* Gentle gradient scrim ONLY where headline text sits so real photos stay sharp & vivid */}
                <div
                  className="hidden lg:block absolute inset-0"
                  style={{
                    background: isDarkSlide
                      ? 'linear-gradient(90deg, #0F1F5C 0%, rgba(15,31,92,0.94) 28%, rgba(15,31,92,0.72) 44%, rgba(15,31,92,0.22) 64%, rgba(15,31,92,0) 82%)'
                      : 'linear-gradient(90deg, #FFFFFF 0%, rgba(244,248,255,0.95) 28%, rgba(244,248,255,0.74) 44%, rgba(244,248,255,0.18) 64%, rgba(244,248,255,0) 82%)',
                  }}
                  aria-hidden="true"
                />
                {/* Mobile subtle readability scrim keeping hero photography bright */}
                <div
                  className="absolute inset-0 lg:hidden"
                  style={{
                    background: isDarkSlide
                      ? 'linear-gradient(180deg, rgba(15,31,92,0.76) 0%, rgba(15,31,92,0.58) 52%, rgba(15,31,92,0.82) 100%)'
                      : 'linear-gradient(180deg, rgba(255,255,255,0.84) 0%, rgba(244,248,255,0.68) 52%, rgba(234,241,255,0.88) 100%)',
                  }}
                  aria-hidden="true"
                />
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Hero Foreground Content */}
        <div className="relative z-10 pointer-events-none max-w-[1344px] mx-auto px-6 xl:px-12 h-full min-h-[640px] flex flex-col justify-center pt-12 lg:pt-20 pb-24 lg:pb-28">
          <div className={`pointer-events-auto w-full space-y-6 ${isMosaicSlide ? 'lg:w-[42%]' : 'lg:w-[48%]'}`}>
            {/* Top-left Status Pill & Region Tag */}
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-xs font-semibold border ${
                  isDarkSlide
                    ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-200'
                    : 'bg-emerald-50 border-emerald-600/25 text-emerald-800'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{t('open24Hours')}</span>
              </span>
              <span
                className={`inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold tracking-wide ${
                  isDarkSlide ? 'text-[#FFC93C]' : 'text-[#1F3FA8]'
                }`}
              >
                <MapPin className="w-3.5 h-3.5 text-[#D92B25]" />
                <span>{t('ranebennurDavangere')}</span>
              </span>
            </div>

            {/* Line-by-line Staggered Fade-Up Headline (Poppins 800, UPPERCASE, max 4 lines) */}
            <h1
              key={`hl-${activeSlide?.id}-${lang}`}
              className={`font-display font-extrabold uppercase tracking-tight leading-[1.05] max-w-2xl ${
                isMosaicSlide
                  ? 'text-[clamp(2.25rem,3.6vw,4rem)] text-[#0F1F5C]'
                  : isDarkSlide
                  ? 'text-[clamp(2.35rem,4.1vw,4.35rem)] text-white'
                  : 'text-[clamp(2.35rem,4.1vw,4.35rem)] text-[#0F1F5C]'
              }`}
            >
              {headlineLines.map((line, i) => (
                <motion.span
                  key={`${activeSlide?.id}-l-${i}`}
                  initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: prefersReducedMotion ? 0 : 0.42,
                    delay: prefersReducedMotion ? 0 : i * 0.12,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="block"
                >
                  {line}
                </motion.span>
              ))}
            </h1>

            {/* ONE Rectangular CTA Button (radius 6px, solid #1F3FA8 or #D92B25, 18px white text, 16px 28px padding, lift + shine) */}
            <div className="pt-2">
              <Link
                to={slideCtaLink}
                className={`hero-cta-rect ${useRedCta ? 'bg-[#D92B25]' : 'bg-[#1F3FA8]'}`}
              >
                <span>{slideCtaLabel}</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>

        {/* BOTTOM-LEFT: Solid blue (#1F3FA8) decorative rectangular block flush with bottom-left */}
        <div
          className="hidden md:block absolute bottom-0 left-0 w-[440px] lg:w-[540px] h-[60px] bg-[#1F3FA8] z-10"
          aria-hidden="true"
        />

        {/* BOTTOM-RIGHT: Two circular navy (#0F1F5C) 60px arrow buttons, hover turns red (#D92B25) */}
        {slides.length > 1 && (
          <div className="hidden md:flex items-center gap-3 absolute bottom-16 right-8 xl:right-12 z-20">
            <button
              type="button"
              onClick={goPrevSlide}
              aria-label="Previous slide"
              className="w-[60px] h-[60px] rounded-full bg-[#0F1F5C] hover:bg-[#D92B25] text-white flex items-center justify-center shadow-lg border border-white/20 transition-colors duration-200 cursor-pointer"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              type="button"
              onClick={goNextSlide}
              aria-label="Next slide"
              className="w-[60px] h-[60px] rounded-full bg-[#0F1F5C] hover:bg-[#D92B25] text-white flex items-center justify-center shadow-lg border border-white/20 transition-colors duration-200 cursor-pointer"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        )}

        {/* MOBILE ONLY Pagination Dots (hidden on desktop where 60px arrows appear) */}
        {slides.length > 1 && (
          <div className="flex md:hidden items-center justify-center gap-2.5 absolute bottom-14 inset-x-0 z-20">
            {slides.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSlideIdx(idx)}
                aria-label={`Slide ${idx + 1}`}
                className={`h-2.5 rounded-full transition-all ${
                  idx === slideIdx
                    ? 'w-8 bg-[#D92B25]'
                    : isDarkSlide
                    ? 'w-2.5 bg-white/40'
                    : 'w-2.5 bg-[#0F1F5C]/30'
                }`}
              />
            ))}
          </div>
        )}
      </section>

      {/* E) DIRECTLY UNDER THE HERO: Floating White Card overlapping hero bottom & #1F3FA8 block */}
      <section className="relative z-20 bg-[var(--bg)] px-4 sm:px-6">
        <div className="max-w-[1260px] mx-auto -mt-10 lg:-mt-12 rounded-[20px] bg-white dark:bg-[#152972] border border-[#D7E4FF] dark:border-[#264096] shadow-[0_22px_50px_-12px_rgba(15,31,92,0.22)] p-3 sm:p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#EAF1FF] dark:divide-[#264096]">
            {[
              {
                to: '/book',
                icon: <Truck className="w-5 h-5" />,
                iconWrap: 'bg-[#D92B25]/10 text-[#D92B25]',
                title: t('bookDelivery'),
                sub: '24/7 day & night slots',
              },
              {
                to: '/quote',
                icon: <FileText className="w-5 h-5" />,
                iconWrap: 'bg-[#1F3FA8]/10 text-[#1F3FA8] dark:bg-[#264096] dark:text-[#FFC93C]',
                title: t('getQuote'),
                sub: 'Custom mix & brick pricing',
              },
              {
                to: '/tools/calculator',
                icon: <Calculator className="w-5 h-5" />,
                iconWrap: 'bg-[#FFC93C]/25 text-[#0F1F5C] dark:text-[#FFC93C]',
                title: t('volumeCalc'),
                sub: 'Slab, beam & column m³',
              },
              {
                to: '/tools/plant-locator',
                icon: <MapPin className="w-5 h-5" />,
                iconWrap: 'bg-[#16A34A]/12 text-[#16A34A]',
                title: t('findOurPlant'),
                sub: 'Kotihal · 50 km coverage',
              },
            ].map((action) => (
              <Link
                key={action.to}
                to={action.to}
                className="group flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl hover:bg-[#F7FAFF] dark:hover:bg-[#1F3FA8]/50 transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${action.iconWrap}`}
                  >
                    {action.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="font-display font-bold text-sm sm:text-[15px] text-[#0F1F5C] dark:text-white truncate">
                      {action.title}
                    </p>
                    <p className="text-xs text-[var(--muted)] truncate">{action.sub}</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#D92B25] shrink-0 transition-transform group-hover:translate-x-1" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* E.5) SEE OUR PLANT IN ACTION: 3-Photo Real MY CONCRETE Showcase */}
      <section className="bg-[var(--bg)] py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-[#D92B25] mb-1.5">
                Real Kotihal Batching &amp; Brick Unit Photos
              </p>
              <h2 className="font-display font-extrabold uppercase tracking-tight text-2xl sm:text-3xl text-[#0F1F5C] dark:text-white">
                SEE OUR PLANT IN ACTION
              </h2>
            </div>
            <Link
              to="/gallery"
              className="group btn-blue-pill px-5 py-2.5 text-xs sm:text-sm self-start sm:self-auto"
            >
              <span>View Full Gallery</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Large Primary Showcase Photo */}
            <Link
              to="/gallery"
              className="group relative lg:col-span-7 min-h-[280px] sm:min-h-[380px] lg:min-h-[440px] rounded-[20px] overflow-hidden shadow-[0_18px_40px_-14px_rgba(15,31,92,0.22)] border border-[#D7E4FF] dark:border-[#264096] bg-[#0F1F5C]"
            >
              <img
                src="/images/home/mixer-plant-card.webp"
                alt="Transit mixer ready for dispatch under the batching chute at MY CONCRETE Kotihal"
                width={960}
                height={720}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
              />
              <div
                className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#0F1F5C]/90 via-[#0F1F5C]/45 to-transparent pointer-events-none"
                aria-hidden="true"
              />
              <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6 flex items-end justify-between gap-3">
                <div>
                  <span className="inline-block text-[11px] font-semibold uppercase tracking-wider text-[#FFC93C] mb-1">
                    24/7 Dispatch
                  </span>
                  <p className="font-display font-bold text-lg sm:text-xl text-white">
                    Transit mixer ready for dispatch
                  </p>
                </div>
                <span className="w-9 h-9 rounded-full bg-white/15 backdrop-blur-xs text-white flex items-center justify-center shrink-0 group-hover:bg-[#D92B25] transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </Link>

            {/* 2 Stacked Secondary Showcase Photos */}
            <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-5">
              <Link
                to="/gallery"
                className="group relative min-h-[210px] rounded-[20px] overflow-hidden shadow-[0_14px_32px_-12px_rgba(15,31,92,0.18)] border border-[#D7E4FF] dark:border-[#264096] bg-[#0F1F5C]"
              >
                <img
                  src="/images/home/plant-silos-card.webp"
                  alt="MY CONCRETE twin cement and fly-ash storage silos at Kotihal plant"
                  width={900}
                  height={675}
                  loading="lazy"
                  decoding="async"
                  style={{ objectPosition: 'center 40%' }}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                />
                <div
                  className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0F1F5C]/90 via-[#0F1F5C]/45 to-transparent pointer-events-none"
                  aria-hidden="true"
                />
                <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 flex items-end justify-between gap-2">
                  <div>
                    <span className="inline-block text-[11px] font-semibold uppercase tracking-wider text-[#FFC93C] mb-0.5">
                      Batching Unit
                    </span>
                    <p className="font-display font-bold text-base sm:text-lg text-white">
                      Storage silos at our Kotihal plant
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-white/90 shrink-0 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>

              <Link
                to="/gallery"
                className="group relative min-h-[210px] rounded-[20px] overflow-hidden shadow-[0_14px_32px_-12px_rgba(15,31,92,0.18)] border border-[#D7E4FF] dark:border-[#264096] bg-[#0F1F5C]"
              >
                <img
                  src="/images/home/brick-yard-card.webp"
                  alt="MY CONCRETE cement bricks and solid blocks curing in rows at the Kotihal yard"
                  width={960}
                  height={720}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                />
                <div
                  className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0F1F5C]/90 via-[#0F1F5C]/45 to-transparent pointer-events-none"
                  aria-hidden="true"
                />
                <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 flex items-end justify-between gap-2">
                  <div>
                    <span className="inline-block text-[11px] font-semibold uppercase tracking-wider text-[#FFC93C] mb-0.5">
                      Masonry Yard
                    </span>
                    <p className="font-display font-bold text-base sm:text-lg text-white">
                      Cement bricks curing in our yard
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-white/90 shrink-0 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* F) REAL-TIME DELIVERY STATUS INDICATOR & LIVE DISPATCH DEMAND */}
      <DeliveryStatusWidget />

      {/* 2. WHY CHOOSE US (4 Feature Cards) */}
      <section className="relative bg-[var(--bg)]">
        <div
          className="animate-float-slow absolute top-10 right-10 w-72 h-72 rounded-full opacity-[0.08] blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, #1F3FA8 0%, transparent 70%)' }}
          aria-hidden="true"
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 lg:py-20">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <p className="text-xs font-semibold text-[#D92B25] mb-2">
                Reliable From Kotihal Plant to Site
              </p>
              <h2 className="font-display font-bold text-2xl sm:text-4xl text-[#0F1F5C] dark:text-white">
                {t('whyChooseUs')}
              </h2>
            </div>
            <Link
              to="/about/why-my-concrete"
              className="group inline-flex items-center gap-1.5 text-sm font-semibold text-[#1F3FA8] dark:text-[#FFC93C] hover:underline whitespace-nowrap"
            >
              <span>Explore Our Standards</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {whyFeatures.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.35, delay: i * 0.06 }}
                className="warm-card p-6 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-4">
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center ${item.circleClass}`}>
                    {item.icon}
                  </div>
                  <h3 className="font-display font-bold text-lg text-[#0F1F5C] dark:text-white">
                    {item.title}
                  </h3>
                  <p className="text-sm text-[var(--muted)] leading-relaxed">{item.detail}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. MATERIAL DISCIPLINE / QUALITY BLOCK */}
      {biz?.sustainabilityConfirmed && (
        <>
          <WaveDivider topColor="var(--bg)" bottomColor="var(--bg-soft)" />
          <section className="bg-[var(--bg-soft)]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
              <div className="lg:col-span-5 min-h-[270px] rounded-[20px] overflow-hidden shadow-lg border border-[#D7E4FF] dark:border-[#264096]">
                <VisualPlate
                  variant="quality-lab"
                  title={biz.sustainabilityTitle}
                  subtitle="Kotihal Unit · Lucky Artificial Sand Industry Premises"
                />
              </div>
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.35 }}
                className="lg:col-span-7 flex flex-col justify-center space-y-5"
              >
                <p className="text-xs font-semibold text-[#D92B25]">
                  Automated Proportioning & Slump Consistency
                </p>
                <h2 className="font-display font-bold text-2xl sm:text-3xl text-[#0F1F5C] dark:text-white">
                  {biz.sustainabilityTitle}
                </h2>
                <p className="text-base text-[var(--muted)] leading-relaxed">
                  {biz.sustainabilitySummary}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 text-sm text-[#0F1F5C] dark:text-slate-100">
                  {[
                    'Graded artificial sand & washed crushed aggregate batching',
                    'Consistent water-cement ratio for stronger slabs & columns',
                    'Computerized weigh-batching tickets on dispatch',
                    'Machine-pressed cement bricks & blocks with uniform edges',
                  ].map((point) => (
                    <div key={point} className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-[#16A34A]/15 text-[#16A34A] flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </span>
                      <span>{point}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </section>
          <WaveDivider topColor="var(--bg-soft)" bottomColor="var(--bg)" flip />
        </>
      )}

      {/* 4. THREE QUICK-TOOL TILES (Volume Calculator, Brick Calculator, Plant Locator) */}
      <section className="relative bg-[var(--bg)]">
        <div
          className="animate-float-slow absolute bottom-0 left-10 w-80 h-80 rounded-full opacity-[0.08] blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, #D92B25 0%, transparent 70%)' }}
          aria-hidden="true"
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <p className="text-xs font-semibold text-[#D92B25] mb-2">
                Plan Your Pour & Masonry in Minutes
              </p>
              <h2 className="font-display font-bold text-2xl sm:text-3xl text-[#0F1F5C] dark:text-white">
                {t('quickTools')}
              </h2>
            </div>
            <Link
              to="/tools/grade-helper"
              className="text-sm font-semibold text-[#1F3FA8] dark:text-[#FFC93C] hover:underline"
            >
              Need grade advice? Try Grade Helper &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link to="/tools/calculator" className="group warm-card p-6 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-full bg-[#1F3FA8]/12 text-[#1F3FA8] dark:bg-[#264096] dark:text-[#FFC93C] flex items-center justify-center">
                  <Calculator className="w-6 h-6" />
                </div>
                <h3 className="font-display font-bold text-xl text-[#0F1F5C] dark:text-white">
                  {t('volumeCalc')}
                </h3>
                <p className="text-sm text-[var(--muted)] leading-relaxed">
                  Calculate exact m³ for slabs, beams, columns, footings, and walls in feet or metres with 5–10% site wastage.
                </p>
              </div>
              <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#D92B25]">
                <span>Open Volume Calculator</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>

            <Link to="/tools/brick-calculator" className="group warm-card p-6 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-full bg-[#D92B25]/12 text-[#D92B25] flex items-center justify-center">
                  <Blocks className="w-6 h-6" />
                </div>
                <h3 className="font-display font-bold text-xl text-[#0F1F5C] dark:text-white">
                  {t('brickCalc')}
                </h3>
                <p className="text-sm text-[var(--muted)] leading-relaxed">
                  Enter wall length, height, and thickness to compute exact cement bricks or 4&quot;, 6&quot;, and 8&quot; solid blocks.
                </p>
              </div>
              <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#D92B25]">
                <span>Open Brick Calculator</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>

            <Link to="/tools/plant-locator" className="group warm-card p-6 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-full bg-[#FFC93C]/30 text-[#0F1F5C] dark:text-[#FFC93C] flex items-center justify-center">
                  <MapPin className="w-6 h-6" />
                </div>
                <h3 className="font-display font-bold text-xl text-[#0F1F5C] dark:text-white">
                  {t('plantLocator')}
                </h3>
                <p className="text-sm text-[var(--muted)] leading-relaxed">
                  Inspect our Kotihal plant coordinates, {biz?.serviceRadiusKm || 50} km delivery radius to Ranebennur & Davangere, and directions.
                </p>
              </div>
              <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#D92B25]">
                <span>Open Service Map</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          </div>
        </div>
      </section>

      <WaveDivider topColor="var(--bg)" bottomColor="var(--bg-soft)" />

      {/* 5. OUR PRODUCTS: Ready-Mix Concrete & Cement Bricks */}
      <section className="bg-[var(--bg-soft)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-[#D92B25] mb-2">
                All Ready Mix Concrete & Cement Bricks
              </p>
              <h2 className="font-display font-bold text-2xl sm:text-3xl text-[#0F1F5C] dark:text-white">
                {t('ourProducts')}
              </h2>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/tools/grade-helper"
                className="rounded-full border-2 border-[#1F3FA8] dark:border-[#FFC93C] px-5 py-2 text-xs font-semibold text-[#1F3FA8] dark:text-[#FFC93C] hover:bg-white dark:hover:bg-[#152972] transition-colors"
              >
                Grade Helper
              </Link>
              <Link to="/products" className="group btn-orange-pill px-5 py-2 text-xs">
                <span>View All Products</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((p) => {
              const fallbackImage =
                p.slug === 'cement-bricks'
                  ? '/images/home/brick-stacks-card.webp'
                  : p.slug === 'standard-grades'
                  ? '/images/home/mixer-plant-card.webp'
                  : p.slug === 'specialty-concrete'
                  ? '/images/home/slab-rebar-card.webp'
                  : '/images/home/plant-silos-card.webp';
              const productImg = p.imageUrl || fallbackImage;

              return (
                <div key={p.slug} className="warm-card overflow-hidden flex flex-col justify-between">
                  <div>
                    <div className="h-44 overflow-hidden">
                      <VisualPlate
                        imageUrl={productImg}
                        variant={p.unitType === 'pieces' ? 'bricks' : 'product-mix'}
                        title={p.name}
                        alt={`${p.name} supplied by MY CONCRETE Kotihal for Ranebennur & Davangere`}
                        width={960}
                        height={720}
                        subtitle={p.category}
                      />
                    </div>
                    <div className="p-5 space-y-2">
                      <p className="text-xs font-semibold text-[#1F3FA8] dark:text-[#FFC93C]">
                        {p.category} · {p.unitType === 'pieces' ? 'Per Piece' : 'Per m³'}
                      </p>
                      <h3 className="font-display font-bold text-base text-[#0F1F5C] dark:text-white">
                        {p.name}
                      </h3>
                      <p className="text-xs text-[var(--muted)] leading-relaxed">{p.tagline}</p>
                    </div>
                  </div>
                  <div className="px-5 pb-5 pt-2 flex items-center justify-between gap-2">
                    <Link
                      to={`/products/${p.slug}`}
                      className="text-xs font-semibold text-[#1F3FA8] dark:text-[#FFC93C] hover:underline"
                    >
                      Specs &amp; Grades &rarr;
                    </Link>
                    <Link
                      to={`/book?product=${p.slug}`}
                      className="btn-orange-pill px-3.5 py-1.5 text-xs"
                    >
                      Book
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5.5) ABOUT STRIP: Split layout with official MY CONCRETE Brand Poster */}
      <section className="bg-[var(--bg)] border-y border-[#D7E4FF]/70 dark:border-[#264096]/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-[420px] rounded-[20px] overflow-hidden shadow-[0_24px_55px_-16px_rgba(15,31,92,0.28)] border border-[#D7E4FF] dark:border-[#264096] bg-[#0F1F5C]">
              <img
                src="/images/home/brand-poster.webp"
                alt="MY CONCRETE Kotihal & Davangere Ready-Mix Concrete and Cement Bricks 24-hour dispatch unit"
                width={960}
                height={1080}
                loading="lazy"
                decoding="async"
                className="w-full h-auto object-cover"
              />
            </div>
          </div>

          <div className="lg:col-span-7 space-y-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#D92B25]">
              About MY CONCRETE
            </p>
            <h2 className="font-display font-extrabold text-2xl sm:text-4xl text-[#0F1F5C] dark:text-white leading-tight">
              Your Regional Batching &amp; Masonry Partner in Kotihal
            </h2>
            <p className="text-base text-[var(--muted)] leading-relaxed">
              MY CONCRETE – Readymix Concrete Unit operates out of Kotihal (inside Lucky Artificial Sand Industry premises) to supply dependable Ready-Mix Concrete and machine-pressed Cement Bricks across{' '}
              <strong className="text-[#0F1F5C] dark:text-white">Ranebennur &amp; Davangere</strong>{' '}
              and neighbouring towns.
            </p>
            <p className="text-sm text-[var(--muted)] leading-relaxed">
              Whether you are casting an individual house roof slab, pouring industrial warehouse flooring, or building compound walls with 4&quot;, 6&quot;, or 8&quot; solid blocks, our unit stays{' '}
              <strong className="text-[#0F1F5C] dark:text-white">Open 24 Hours</strong> so every concrete pour and brick load arrives when your site team is ready.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-sm text-[#0F1F5C] dark:text-slate-100">
              {[
                'Batching plant at FM66+2X6, Kotihal (near Ranebennur)',
                'Regional coverage across Ranebennur, Davangere & Harihar',
                'Ready-mix concrete (M5–M40+) & solid cement bricks',
                'Open 24 hours across all days for day & night pours',
              ].map((fact) => (
                <div key={fact} className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#1F3FA8]/12 dark:bg-[#264096] text-[#1F3FA8] dark:text-[#FFC93C] flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </span>
                  <span>{fact}</span>
                </div>
              ))}
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link to="/about/our-story" className="group btn-blue-pill px-6 py-3 text-sm">
                <span>Learn More</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                to="/book"
                className="rounded-full border border-[#D7E4FF] dark:border-[#264096] px-6 py-3 text-sm font-semibold text-[#0F1F5C] dark:text-white hover:border-[#D92B25] transition-colors"
              >
                Book 24/7 Slot
              </Link>
            </div>
          </div>
        </div>
      </section>

      <WaveDivider topColor="var(--bg)" bottomColor="var(--bg)" flip />

      {/* 6. THE DIFFERENCE (Residential, Infrastructure, Industrial) */}
      <section className="bg-[var(--bg)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
          <div className="mb-8">
            <p className="text-xs font-semibold text-[#D92B25] mb-2">
              Sector-Matched Dispatch
            </p>
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-[#0F1F5C] dark:text-white">
              {t('theDifference')}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: 'Residential Homes & Layouts',
                slug: 'residential',
                variant: 'residential' as const,
                desc: 'Pumpable slab concrete and uniform cement blocks for individual homes, villas, and apartments across Ranebennur & Davangere.',
              },
              {
                title: 'Roads, Culverts & Civic Works',
                slug: 'infrastructure',
                variant: 'infrastructure' as const,
                desc: 'Round-the-clock batching and 2-hour night windows for rigid pavements, box culverts, and municipal infrastructure.',
              },
              {
                title: 'Industrial Sheds & Godowns',
                slug: 'industrial',
                variant: 'industrial' as const,
                desc: 'Fibre-reinforced warehouse floor mixes, heavy machine foundations, and 8" solid compound blocks for industrial estates.',
              },
            ].map((seg) => (
              <Link
                key={seg.slug}
                to={`/customers/${seg.slug}`}
                className="group warm-card overflow-hidden flex flex-col"
              >
                <div className="h-44 overflow-hidden">
                  <VisualPlate
                    variant={seg.variant}
                    title={seg.title}
                    width={800}
                    height={600}
                    subtitle="Customer Sector"
                    className="w-full h-full group-hover:scale-[1.06] transition-transform duration-500"
                  />
                </div>
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="font-display font-bold text-lg text-[#0F1F5C] dark:text-white mb-2">
                      {seg.title}
                    </h3>
                    <p className="text-sm text-[var(--muted)] leading-relaxed">{seg.desc}</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#D92B25]">
                    <span>View Sector Guide</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 7. COMPLETED PROJECTS GALLERY (Only rendered when real projects are added in Admin) */}
      {projects.length > 0 && (
        <>
          <WaveDivider topColor="var(--bg)" bottomColor="var(--bg-soft)" />
          <section className="bg-[var(--bg-soft)]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                <div>
                  <p className="text-xs font-semibold text-[#D92B25] mb-2">Regional Portfolio</p>
                  <h2 className="font-display font-bold text-2xl sm:text-3xl text-[#0F1F5C] dark:text-white">
                    {t('completedProjects')}
                  </h2>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {projects.slice(0, 4).map((proj) => (
                  <div key={proj.id} className="warm-card overflow-hidden flex flex-col">
                    <div className="h-44">
                      <VisualPlate
                        imageUrl={proj.image_url}
                        variant="project"
                        title={proj.title}
                        subtitle={`${proj.segment} · ${proj.location}`}
                      />
                    </div>
                    <div className="p-5 space-y-2 flex-1">
                      <p className="text-xs text-[var(--muted)]">
                        {proj.segment} · {proj.grade_used}
                      </p>
                      <h3 className="font-display font-bold text-base text-[#0F1F5C] dark:text-white">
                        {proj.title}
                      </h3>
                      <p className="text-xs text-[var(--muted)] leading-relaxed">{proj.summary}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      )}

      {/* 8. NAVY STATS BAND WITH SUNNY YELLOW NUMBERS (Shown only when Admin enters real verified stats) */}
      {stats.length > 0 && (
        <>
          <WaveDivider topColor={projects.length > 0 ? 'var(--bg-soft)' : 'var(--bg)'} bottomColor="#0F1F5C" />
          <section className="bg-[#0F1F5C] text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 grid grid-cols-2 lg:grid-cols-4 gap-8">
              {stats.map((st) => (
                <div key={st.id} className="space-y-1.5">
                  <p className="font-slab font-bold text-3xl sm:text-4xl text-[#FFC93C] tabular-nums">
                    <AnimatedStatValue raw={st.value} />
                    {st.suffix}
                  </p>
                  <p className="text-sm font-semibold text-white">{st.label}</p>
                  <p className="text-xs text-slate-300">{st.note}</p>
                </div>
              ))}
            </div>
          </section>
          <WaveDivider topColor="#0F1F5C" bottomColor="var(--bg-soft)" flip />
        </>
      )}

      {/* 9. HOW IT WORKS (4 Steps) */}
      {stats.length === 0 && (
        <WaveDivider
          topColor={projects.length > 0 ? 'var(--bg-soft)' : 'var(--bg)'}
          bottomColor="var(--bg-soft)"
        />
      )}
      <section className="bg-[var(--bg-soft)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <p className="text-xs font-semibold text-[#D92B25]">Simple 24/7 Booking Flow</p>
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-[#0F1F5C] dark:text-white">
              {t('howItWorks')}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {howItWorksSteps.map((step) => (
              <div key={step.num} className="warm-card p-6 space-y-3">
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#1F3FA8] text-[#FFC93C] font-slab font-bold text-sm">
                  {step.num}
                </span>
                <h3 className="font-display font-bold text-lg text-[#0F1F5C] dark:text-white">
                  {step.title}
                </h3>
                <p className="text-sm text-[var(--muted)] leading-relaxed">{step.text}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link to="/book" className="group btn-orange-pill px-7 py-3 text-sm">
              <span>Start Your Booking</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      <WaveDivider topColor="var(--bg-soft)" bottomColor="var(--bg)" flip />

      {/* 10. SERVICE AREA MAP & INTERACTIVE DELIVERY FEASIBILITY (Ranebennur & Davangere Zones) */}
      <section className="bg-[var(--bg)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 space-y-8">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div className="space-y-2 max-w-2xl">
              <p className="text-xs font-semibold text-[#D92B25]">
                Interactive Service Zones &amp; Feasibility Check
              </p>
              <h2 className="font-display font-bold text-2xl sm:text-3xl text-[#0F1F5C] dark:text-white">
                {t('serviceAreaTitle')}
              </h2>
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                Dispatched from our Kotihal &amp; Davangere units within a{' '}
                <strong className="tabular-nums">{biz?.serviceRadiusKm || 50} km</strong> corridor covering Ranebennur, Davangere, Harihar, Byadgi, and Haveri. Filter a zone, tap any town, or click on the map to verify delivery feasibility.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <a
                href={directionsUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-blue-pill px-5 py-2.5 text-xs"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Directions to Kotihal Plant</span>
              </a>
              <Link
                to="/site-visit"
                className="rounded-full border border-[#D7E4FF] dark:border-[#264096] px-5 py-2.5 text-xs font-semibold hover:border-[#D92B25]"
              >
                Book Plant Visit
              </Link>
            </div>
          </div>

          {biz && (
            <ServiceZoneExplorer
              biz={biz}
              plantLocations={plantLocations}
              mapHeightClass="h-[420px]"
            />
          )}

          {/* Plant Unit Directory + 24-Hour Dispatch Desk */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {plantLocations.map((loc) => {
              const isRed = loc.pinColor === 'red' || (!loc.isPrimary && loc.pinColor !== 'blue');
              const locDirections =
                loc.googleMapsUrl ||
                `https://www.google.com/maps/dir/?api=1&destination=${loc.lat},${loc.lng}`;
              return (
                <div
                  key={loc.id}
                  className="rounded-[16px] bg-[var(--surface)] border border-[#D7E4FF] dark:border-[#264096] p-4 space-y-2 text-xs flex flex-col justify-between"
                >
                  <div className="flex items-start gap-2.5">
                    <span
                      className={`inline-flex items-center justify-center shrink-0 w-6 h-6 rounded-full text-[10px] font-extrabold text-white mt-0.5 ${
                        isRed ? 'bg-[#D92B25]' : 'bg-[#1F3FA8]'
                      }`}
                    >
                      {isRed ? <MapPin className="w-3.5 h-3.5" /> : 'MC'}
                    </span>
                    <div className="min-w-0 space-y-0.5">
                      <p className="font-display font-bold text-sm text-[#0F1F5C] dark:text-white">
                        {loc.name}
                      </p>
                      <p className="text-[var(--muted)] leading-snug">{loc.address}</p>
                      <p className="text-emerald-600 dark:text-emerald-400 font-semibold">{loc.hours}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 pl-8 pt-1">
                    <CallLink
                      phone={loc.phone || biz?.phone || '+91 73378 07372'}
                      whatsapp={loc.whatsapp || loc.phone || biz?.whatsapp || '+91 73378 07372'}
                      className="tabular-nums font-semibold text-[#1F3FA8] dark:text-[#FFC93C] hover:underline"
                    >
                      {loc.phone}
                    </CallLink>
                    <a
                      href={locDirections}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-semibold text-[#0F1F5C] dark:text-slate-200 hover:text-[#D92B25]"
                    >
                      <Navigation className="w-3 h-3" />
                      <span>Get Directions</span>
                    </a>
                    <Link
                      to={`/book?plant=${encodeURIComponent(loc.id)}`}
                      className="font-semibold text-[#D92B25] hover:underline"
                    >
                      Book Delivery &rarr;
                    </Link>
                  </div>
                </div>
              );
            })}

            <div className="rounded-[16px] bg-[var(--surface)] border border-[#D7E4FF] dark:border-[#264096] p-4 space-y-2 text-xs flex flex-col justify-between">
              <div className="space-y-1.5">
                <p className="font-semibold text-[#0F1F5C] dark:text-white flex items-center gap-2 text-sm">
                  <Award className="w-4 h-4 text-[#D92B25] shrink-0" />
                  <span>24-Hour Dispatch Desk</span>
                </p>
                <p className="text-[var(--muted)] leading-relaxed">
                  Need bulk fleet scheduling across Ranebennur, Davangere, or Harihar? Speak directly with our dispatch coordinator.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <CallLink
                  phone={biz?.phone || '+91 73378 07372'}
                  whatsapp={biz?.whatsapp || biz?.phone || '+91 73378 07372'}
                  className="tabular-nums font-bold text-[#1F3FA8] dark:text-[#FFC93C] hover:underline"
                >
                  {biz?.phone || '+91 73378 07372'}
                </CallLink>
                <Link to="/tools/plant-locator" className="font-semibold text-[#D92B25] hover:underline">
                  Full Plant Locator &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 11. CUSTOMER SUCCESS STORIES (Feedback, Star Rating System & Project Photos) */}
      <WaveDivider topColor="var(--bg)" bottomColor="var(--bg-soft)" />
      <CustomerSuccessStories testimonials={testimonials} />

      {/* 12. HOME FAQ ACCORDION + TECHNICAL ARTICLES */}
      <WaveDivider topColor="var(--bg-soft)" bottomColor="var(--bg)" />
      <section className="bg-[var(--bg)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 space-y-16">
          {/* FAQ */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-4 space-y-3">
              <p className="text-xs font-semibold text-[#D92B25]">Common Questions</p>
              <h2 className="font-display font-bold text-2xl sm:text-3xl text-[#0F1F5C] dark:text-white">
                {t('faqTitle')}
              </h2>
              <p className="text-sm text-[var(--muted)]">
                Quick answers about 24/7 dispatch slots, concrete grades, cement brick sizes, and delivery coverage.
              </p>
            </div>
            <div className="lg:col-span-8 space-y-3">
              {HOME_FAQS.map((faq, idx) => (
                <div
                  key={faq.q}
                  className="warm-card overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="w-full px-6 py-4 flex items-center justify-between text-left font-semibold text-sm sm:text-base text-[#0F1F5C] dark:text-white"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 shrink-0 text-[#D92B25] transition-transform ${
                        openFaq === idx ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {openFaq === idx && (
                    <div className="px-6 pb-4 pt-2 text-sm text-[var(--muted)] leading-relaxed border-t border-[#D7E4FF] dark:border-[#264096]">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Latest Technical Blogs */}
          <div>
            <div className="flex items-end justify-between mb-6">
              <h2 className="font-display font-bold text-2xl sm:text-3xl text-[#0F1F5C] dark:text-white">
                {t('latestBlogs')}
              </h2>
              <Link to="/blog" className="text-sm font-semibold text-[#D92B25] hover:underline">
                All Articles
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {blogs.slice(0, 3).map((b) => (
                <Link
                  key={b.id}
                  to={`/blog/${b.slug}`}
                  className="group warm-card p-6 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2.5">
                    <p className="text-xs text-[var(--muted)]">
                      {b.category} · {b.published_at} · {b.read_time}
                    </p>
                    <h3 className="font-display font-bold text-lg text-[#0F1F5C] dark:text-white group-hover:text-[#D92B25] transition-colors">
                      {b.title}
                    </h3>
                    <p className="text-sm text-[var(--muted)] leading-relaxed">{b.excerpt}</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1F3FA8] dark:text-[#FFC93C]">
                    <span>Read Article</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <WaveDivider topColor="var(--bg)" bottomColor="var(--bg-soft)" />

      {/* 13. NEWSLETTER + CONNECT WITH US */}
      <section className="bg-[var(--bg-soft)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-5 space-y-6">
            <div>
              <p className="text-xs font-semibold text-[#D92B25] mb-2">
                24/7 Kotihal Dispatch Desk
              </p>
              <h2 className="font-display font-bold text-2xl sm:text-3xl text-[#0F1F5C] dark:text-white mb-3">
                {t('connectWithUs')}
              </h2>
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                Need ready-mix concrete or cement bricks anywhere in Ranebennur, Davangere, or nearby towns? Message our Kotihal team for quick guidance and dispatch planning.
              </p>
            </div>

            <div className="warm-card p-5 space-y-3">
              <h3 className="font-display font-bold text-base text-[#0F1F5C] dark:text-white">
                {t('newsletterTitle')}
              </h3>
              <form onSubmit={handleNewsletter} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={newsletterHoneypot}
                  onChange={(e) => setNewsletterHoneypot(e.target.value)}
                  className="hidden"
                  tabIndex={-1}
                  aria-hidden="true"
                />
                <input
                  type="email"
                  required
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="flex-1 rounded-full border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-4 py-2 text-sm focus:border-[#1F3FA8] focus:outline-none"
                />
                <button type="submit" className="btn-orange-pill px-5 py-2 text-sm whitespace-nowrap">
                  Subscribe
                </button>
              </form>
              {newsletterStatus && (
                <div className="space-y-2 pt-1">
                  <p className="text-xs font-medium text-[#16A34A]">{newsletterStatus}</p>
                  {newsletterWhatsappUrl && (
                    <a
                      href={newsletterWhatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#16A34A] hover:brightness-110 text-white px-3.5 py-1.5 text-xs font-semibold"
                    >
                      <span>Send on WhatsApp</span>
                    </a>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/site-visit"
                className="rounded-full bg-[var(--surface)] border border-[#D7E4FF] dark:border-[#264096] px-5 py-2.5 text-sm font-semibold text-[#0F1F5C] dark:text-white hover:border-[#D92B25] transition-colors"
              >
                Book Site / Plant Visit
              </Link>
              <Link
                to="/track"
                className="rounded-full bg-[var(--surface)] border border-[#D7E4FF] dark:border-[#264096] px-5 py-2.5 text-sm font-semibold text-[#0F1F5C] dark:text-white hover:border-[#D92B25] transition-colors"
              >
                Track / Manage Booking
              </Link>
            </div>
          </div>

          <div className="lg:col-span-7 warm-card p-6 sm:p-8">
            <ConnectForm />
          </div>
        </div>
      </section>
    </div>
  );
}
