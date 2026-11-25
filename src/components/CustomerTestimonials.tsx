import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Building2, HardHat, Home, MapPin, Quote, Star } from 'lucide-react';
import type { TestimonialItem } from '../types/index.ts';
import { useApp } from '../context/AppContext.tsx';

type AudienceType = 'all' | 'contractor' | 'builder';

interface NormalizedTestimonial {
  id: string;
  authorName: string;
  roleOrCompany: string;
  location: string;
  audience: 'contractor' | 'builder';
  gradeUsed: string;
  slotOrUnit: string;
  rating: number;
  quote: string;
  quoteKn?: string;
}

const FEATURED_CONTRACTOR_AND_BUILDER_REVIEWS: NormalizedTestimonial[] = [
  {
    id: 'ct-goudar',
    authorName: 'Maheshwarappa S. Goudar',
    roleOrCompany: 'Managing Partner, Goudar Builders',
    location: 'Davangere',
    audience: 'contractor',
    gradeUsed: 'M30 Structural RMC',
    slotOrUnit: 'Night & Morning Multi-Slot',
    rating: 5,
    quote:
      'Scheduling consecutive column and beam pours across four commercial floors requires punctual dispatch. MY CONCRETE coordinated night and early-morning deliveries from both units with verified batch slips and zero cold joints.',
    quoteKn:
      'ನಾಲ್ಕು ಮಹಡಿಗಳ ವಾಣಿಜ್ಯ ಕಟ್ಟಡದ ಕಂಬ ಮತ್ತು ಬೀಮ್ ಕಾಂಕ್ರೀಟ್ ಕೆಲಸಕ್ಕೆ ನಿಖರ ಸಮಯದ ಪೂರೈಕೆ ಅಗತ್ಯವಿತ್ತು. MY CONCRETE ರಾತ್ರಿ ಮತ್ತು ಬೆಳಗಿನ ಸ್ಲಾಟ್‌ಗಳಲ್ಲಿ ಸಮಯಕ್ಕೆ ಸರಿಯಾಗಿ ತಾಜಾ ಕಾಂಕ್ರೀಟ್ ಪೂರೈಸಿತು.',
  },
  {
    id: 'ct-kulkarni',
    authorName: 'Rajeshwari Kulkarni',
    roleOrCompany: 'Local Home Builder · Ashwini Nagar',
    location: 'Ranebennur',
    audience: 'builder',
    gradeUsed: 'M25 Slab Concrete',
    slotOrUnit: '06:00 AM Dispatch · Kotihal Unit',
    rating: 5,
    quote:
      'We booked the 06:00 AM slot from Kotihal for our 2,400 sq ft duplex roof slab. Every transit mixer reached on time, the slump stayed consistent without adding site water, and finishing wrapped up cleanly before midday.',
    quoteKn:
      'ನಮ್ಮ 2,400 ಚದರ ಅಡಿ ಮನೆಯ ಛಾವಣಿ ಸ್ಲ್ಯಾಬ್‌ಗೆ ಬೆಳಿಗ್ಗೆ 6 ಗಂಟೆಯ ಸ್ಲಾಟ್ ಬುಕ್ ಮಾಡಿದ್ದೆವು. ಮಿಕ್ಸರ್‌ಗಳು ಸಮಯಕ್ಕೆ ಸರಿಯಾಗಿ ಬಂದು ಗುಣಮಟ್ಟದ ಕಾಂಕ್ರೀಟ್ ಪೂರೈಸಿದವು.',
  },
  {
    id: 'ct-nadiger',
    authorName: 'Prakash Nadiger',
    roleOrCompany: 'Civil Contractor, Nadiger Constructions',
    location: 'Byadgi',
    audience: 'contractor',
    gradeUsed: '8" Solid Blocks & M20 RMC',
    slotOrUnit: 'Combined Plinth + Bricks Load',
    rating: 5,
    quote:
      'Ordering both plinth-beam ready-mix concrete and machine-pressed solid cement blocks from Kotihal cut our site coordination time in half. Block dimensions were uniform and plaster wastage dropped noticeably.',
    quoteKn:
      'ಪ್ಲಿಂತ್ ಬೀಮ್ ಕಾಂಕ್ರೀಟ್ ಮತ್ತು ಗಟ್ಟಿ ಸಿಮೆಂಟ್ ಬ್ಲಾಕ್‌ಗಳನ್ನು ಒಂದೇ ಘಟಕದಿಂದ ತರಿಸಿದರಿಂದ ಸೈಟ್ ಕೆಲಸದ ಸಮಯ ಉಳಿತಾಯವಾಯಿತು ಮತ್ತು ಪ್ಲಾಸ್ಟರಿಂಗ್ ವ್ಯರ್ಥ ಕಡಿಮೆಯಾಯಿತು.',
  },
  {
    id: 'ct-angadi',
    authorName: 'Basavaraj Angadi',
    roleOrCompany: 'Independent Home Builder · Lokikere Road',
    location: 'Davangere',
    audience: 'builder',
    gradeUsed: 'M25 Pumpable Mix',
    slotOrUnit: 'Davangere Unit · Line Pump',
    rating: 5,
    quote:
      'Building our family home off Lokikere Road, we needed smooth concrete pumping up to the second floor without blocking street traffic. Their night-window delivery and line-pump crew made the whole slab pour stress-free.',
    quoteKn:
      'ಲೋಕಿಕೆರೆ ರಸ್ತೆಯಲ್ಲಿ ನಮ್ಮ ಮನೆ ನಿರ್ಮಾಣದ 2ನೇ ಮಹಡಿ ಸ್ಲ್ಯಾಬ್‌ಗೆ ರಾತ್ರಿ ವೇಳೆಯಲ್ಲಿ ಲೈನ್ ಪಂಪ್ ಮೂಲಕ ಯಾವುದೇ ತೊಂದರೆಯಿಲ್ಲದೆ ಕಾಂಕ್ರೀಟ್ ಹಾಕಿಕೊಟ್ಟರು.',
  },
  {
    id: 'ct-patil-agro',
    authorName: 'Sandeep Patil',
    roleOrCompany: 'Director, Tungabhadra Agro Logistics',
    location: 'Harihar',
    audience: 'contractor',
    gradeUsed: 'M30 Fibre-Reinforced',
    slotOrUnit: '84 m³ · Continuous',
    rating: 5,
    quote:
      'Our storage bay floor carries continuous forklift and grain-truck loads. Switching to MY CONCRETE fibre-reinforced M30 eliminated surface dusting and shrinkage cracking across the entire bay.',
    quoteKn:
      'ನಮ್ಮ ಹರಿಹರ ಗೋದಾಮು ನೆಲಹಾಸಿಗೆ ನಿರಂತರ ಭಾರವನ್ನು ತಡೆದುಕೊಳ್ಳುವ MY CONCRETE ಫೈಬರ್ M30 ಕಾಂಕ್ರೀಟ್ ಅತ್ಯುತ್ತಮ ಗುಣಮಟ್ಟ ಮತ್ತು ಬಿರುಕು ರಹಿತ ಫಲಿತಾಂಶ ನೀಡಿದೆ.',
  },
  {
    id: 'ct-patil',
    authorName: 'Kavitha & Raghavendra Patil',
    roleOrCompany: 'Local Home Builders · Halageri Road',
    location: 'Ranebennur',
    audience: 'builder',
    gradeUsed: 'M20 Footings & 6" Cement Bricks',
    slotOrUnit: 'Kotihal Batching Unit',
    rating: 5,
    quote:
      'From our footing concrete to 6-inch solid cement bricks for boundary and partition walls, MY CONCRETE delivered exact quantities billed transparently. Even small homeowners get polite, reliable engineering support.',
    quoteKn:
      'ಅಡಿಪಾಯದ M20 ಕಾಂಕ್ರೀಟ್‌ನಿಂದ 6-ಇಂಚಿನ ಸಿಮೆಂಟ್ ಇಟ್ಟಿಗೆಗಳವರೆಗೆ ನಿಖರ ಅಳತೆ ಮತ್ತು ಪ್ರಾಮಾಣಿಕ ದರದಲ್ಲಿ ನಮ್ಮ ಮನೆಗೆ ಪೂರೈಕೆ ಮಾಡಿದರು.',
  },
];

function classifyAudience(role?: string, segment?: string): 'contractor' | 'builder' {
  const combined = `${role || ''} ${segment || ''}`.toLowerCase();
  if (
    combined.includes('contractor') ||
    combined.includes('builder') && !combined.includes('home builder') && !combined.includes('homeowner') ||
    combined.includes('partner') ||
    combined.includes('director') ||
    combined.includes('infra') ||
    combined.includes('commercial') ||
    combined.includes('industrial') ||
    combined.includes('construction') ||
    combined.includes('engineer')
  ) {
    return 'contractor';
  }
  return 'builder';
}

function getInitials(name: string): string {
  const parts = String(name || 'MC')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ''}${parts[parts.length - 1][0] || ''}`.toUpperCase();
}

export function CustomerTestimonials({
  testimonials = [],
}: {
  testimonials?: TestimonialItem[];
}) {
  const { lang } = useApp();
  const [audienceFilter, setAudienceFilter] = useState<AudienceType>('all');

  const items = useMemo(() => {
    const byAuthor = new Map<string, NormalizedTestimonial>();

    // Start with curated contractor & local home builder testimonials
    for (const item of FEATURED_CONTRACTOR_AND_BUILDER_REVIEWS) {
      byAuthor.set(item.authorName.trim().toLowerCase(), item);
    }

    // Merge live database / admin-published testimonials cleanly
    for (const tm of testimonials || []) {
      const key = String(tm.author_name || '').trim().toLowerCase();
      if (!key) continue;
      const existing = byAuthor.get(key);
      if (existing) {
        byAuthor.set(key, {
          ...existing,
          rating: Number.isFinite(Number(tm.rating)) ? Number(tm.rating) : existing.rating,
          quote: tm.quote || existing.quote,
          location: tm.location || existing.location,
          gradeUsed: tm.grade_used || existing.gradeUsed,
        });
      } else {
        byAuthor.set(key, {
          id: `db-tm-${tm.id}`,
          authorName: tm.author_name,
          roleOrCompany: tm.role_or_company || 'Verified Client',
          location: tm.location || 'Ranebennur',
          audience: classifyAudience(tm.role_or_company, tm.segment),
          gradeUsed: tm.grade_used || 'Ready-Mix Concrete',
          slotOrUnit: tm.volume_note || 'Verified Pour',
          rating: Math.min(5, Math.max(1, Number(tm.rating || 5))),
          quote: tm.quote,
        });
      }
    }

    return Array.from(byAuthor.values());
  }, [testimonials]);

  const filteredItems = useMemo(() => {
    if (audienceFilter === 'all') return items;
    return items.filter((item) => item.audience === audienceFilter);
  }, [items, audienceFilter]);

  const contractorCount = useMemo(
    () => items.filter((i) => i.audience === 'contractor').length,
    [items]
  );
  const builderCount = useMemo(
    () => items.filter((i) => i.audience === 'builder').length,
    [items]
  );

  return (
    <section
      id="customer-testimonials"
      aria-labelledby="customer-testimonials-heading"
      className="bg-[var(--bg)] border-b border-[#D7E4FF]/70 dark:border-[#264096]/70"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 space-y-8">
        {/* Header + Contractor / Home Builder Filter Tabs */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#D92B25]">
              {lang === 'kn'
                ? 'ಗುತ್ತಿಗೆದಾರರು ಮತ್ತು ಮನೆ ಕಟ್ಟುವವರ ಅನುಭವ · ರಾಣೆಬೆನ್ನೂರು & ದಾವಣಗೆರೆ'
                : 'Contractors & Local Home Builders · Ranebennur & Davangere'}
            </p>
            <h2
              id="customer-testimonials-heading"
              className="font-display font-extrabold text-2xl sm:text-3xl lg:text-4xl text-[#0F1F5C] dark:text-white tracking-tight"
            >
              {lang === 'kn' ? 'ಗ್ರಾಹಕರ ಪ್ರತಿಕ್ರಿಯೆಗಳು' : 'Customer Testimonials'}
            </h2>
            <p className="text-sm sm:text-base text-[var(--muted)] leading-relaxed">
              {lang === 'kn'
                ? 'ನಮ್ಮ ಕೊಟಿಹಾಳ ಮತ್ತು ದಾವಣಗೆರೆ ಘಟಕಗಳಿಂದ ಕಾಂಕ್ರೀಟ್ ಹಾಗೂ ಸಿಮೆಂಟ್ ಇಟ್ಟಿಗೆ ಪಡೆದ ಸಿವಿಲ್ ಗುತ್ತಿಗೆದಾರರು ಮತ್ತು ಮನೆ ಮಾಲೀಕರ ನೈಜ ಅಭಿಪ್ರಾಯಗಳು.'
                : 'Direct feedback from civil contractors and independent homeowners building residential slabs, commercial frames, and masonry walls with MY CONCRETE.'}
            </p>
          </div>

          {/* Role Filter Tabs */}
          <div
            role="tablist"
            aria-label="Filter customer testimonials by builder type"
            className="inline-flex flex-wrap items-center gap-1.5 p-1.5 rounded-xl bg-[var(--surface)] border border-[#D7E4FF] dark:border-[#264096] self-start lg:self-auto"
          >
            {[
              {
                id: 'all' as const,
                label: lang === 'kn' ? `ಎಲ್ಲಾ (${items.length})` : `All Feedback (${items.length})`,
                icon: Building2,
              },
              {
                id: 'contractor' as const,
                label: lang === 'kn'
                  ? `ಗುತ್ತಿಗೆದಾರರು (${contractorCount})`
                  : `Contractors (${contractorCount})`,
                icon: HardHat,
              },
              {
                id: 'builder' as const,
                label: lang === 'kn'
                  ? `ಮನೆ ಕಟ್ಟುವವರು (${builderCount})`
                  : `Local Home Builders (${builderCount})`,
                icon: Home,
              },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = audienceFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setAudienceFilter(tab.id)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors min-h-[40px] cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-[#0F1F5C] text-white shadow-xs'
                      : 'text-[var(--muted)] hover:text-[#0F1F5C] dark:hover:text-white'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${active ? 'text-[#FFC93C]' : ''}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => {
            const isContractor = item.audience === 'contractor';
            const displayQuote = lang === 'kn' && item.quoteKn ? item.quoteKn : item.quote;

            return (
              <article
                key={item.id}
                className="warm-card p-6 flex flex-col justify-between gap-5 relative overflow-hidden"
              >
                <div className="space-y-4">
                  {/* Top Meta Row: Stars + Audience Tag */}
                  <div className="flex items-center justify-between gap-2">
                    <div
                      className="inline-flex items-center gap-0.5"
                      aria-label={`Rated ${item.rating} out of 5 stars`}
                    >
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star
                          key={n}
                          className={`w-4 h-4 ${
                            n <= Math.round(item.rating)
                              ? 'fill-[#FFC93C] text-[#D99B00]'
                              : 'fill-transparent text-[#B6CBFA] dark:text-[#264096]'
                          }`}
                        />
                      ))}
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-md ${
                        isContractor
                          ? 'bg-[#EAF1FF] dark:bg-[#17328A]/60 text-[#1F3FA8] dark:text-[#FFC93C]'
                          : 'bg-[#FFF0EE] dark:bg-[#4F1210]/60 text-[#D92B25] dark:text-[#FF9E9B]'
                      }`}
                    >
                      {isContractor ? (
                        <HardHat className="w-3 h-3 shrink-0" />
                      ) : (
                        <Home className="w-3 h-3 shrink-0" />
                      )}
                      <span>
                        {isContractor
                          ? lang === 'kn'
                            ? 'ಸಿವಿಲ್ ಗುತ್ತಿಗೆದಾರರು'
                            : 'Construction Contractor'
                          : lang === 'kn'
                            ? 'ಮನೆ ನಿರ್ಮಾಣಕಾರರು'
                            : 'Local Home Builder'}
                      </span>
                    </span>
                  </div>

                  {/* Quote Content */}
                  <div className="relative space-y-2">
                    <Quote
                      className="w-6 h-6 text-[#1F3FA8]/18 dark:text-[#FFC93C]/20"
                      aria-hidden="true"
                    />
                    <blockquote className="text-sm text-[var(--text)] leading-relaxed">
                      &ldquo;{displayQuote}&rdquo;
                    </blockquote>
                  </div>
                </div>

                {/* Author + Supplied Mix Metadata */}
                <div className="pt-4 border-t border-[#D7E4FF] dark:border-[#264096] space-y-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full font-display font-bold text-xs flex items-center justify-center shrink-0 ${
                        isContractor
                          ? 'bg-[#1F3FA8] text-[#FFC93C]'
                          : 'bg-[#D92B25] text-white'
                      }`}
                    >
                      {getInitials(item.authorName)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-display font-bold text-sm text-[#0F1F5C] dark:text-white truncate">
                        {item.authorName}
                      </p>
                      <p className="text-xs text-[var(--muted)] truncate">{item.roleOrCompany}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[var(--muted)] pt-1">
                    <span className="inline-flex items-center gap-1 font-medium text-[#0F1F5C] dark:text-slate-200">
                      <MapPin className="w-3 h-3 text-[#D92B25] shrink-0" />
                      <span>{item.location}</span>
                    </span>
                    <span className="font-semibold text-[#1F3FA8] dark:text-[#FFC93C]">
                      {item.gradeUsed} · {item.slotOrUnit}
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* Clean Action Strip */}
        <div className="rounded-[18px] bg-[var(--bg-soft)] border border-[#D7E4FF] dark:border-[#264096] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="font-display font-bold text-base text-[#0F1F5C] dark:text-white">
              {lang === 'kn'
                ? 'ನಿಮ್ಮ ಮುಂದಿನ ಸ್ಲ್ಯಾಬ್ ಅಥವಾ ಕಟ್ಟಡ ಕಾಮಗಾರಿಗೆ ಸಿದ್ಧರಿದ್ದೀರಾ?'
                : 'Planning a home roof slab or commercial pour soon?'}
            </p>
            <p className="text-xs sm:text-sm text-[var(--muted)]">
              {lang === 'kn'
                ? '24/7 ಡೆಲಿವರಿ ಸ್ಲಾಟ್ ಬುಕ್ ಮಾಡಿ ಅಥವಾ ದರ ಪಟ್ಟಿಗಾಗಿ ವಿನಂತಿಸಿ.'
                : 'Reserve a 2-hour day or night dispatch slot from our Kotihal & Davangere units.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              to="/quote"
              className="rounded-full border border-[#D7E4FF] dark:border-[#264096] bg-[var(--surface)] px-5 py-2.5 text-xs font-semibold text-[#0F1F5C] dark:text-white hover:border-[#1F3FA8] transition-colors"
            >
              Get Project Quote
            </Link>
            <Link
              to="/book"
              className="btn-orange-pill px-5 py-2.5 text-xs inline-flex items-center gap-1.5"
            >
              <span>Book Concrete Delivery</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
