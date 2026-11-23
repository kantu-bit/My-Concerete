import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, Layers, MapPin } from 'lucide-react';
import type { ProjectItem } from '../types/index.ts';
import { VisualPlate } from './VisualPlate.tsx';

import villaSlabPhoto from '../assets/images/story_villa_slab_pour_1795432596043.jpg';
import commercialFramePhoto from '../assets/images/story_commercial_frame_1795432595761.jpg';
import industrialFloorPhoto from '../assets/images/story_industrial_floor_1795432596007.jpg';
import cementBricksPhoto from '../assets/images/story_cement_bricks_site_1795432596111.jpg';

const LOCAL_PHOTO_MAP: Record<string, string> = {
  '/src/assets/images/story_villa_slab_pour_1795432596043.jpg': villaSlabPhoto,
  '/src/assets/images/story_commercial_frame_1795432595761.jpg': commercialFramePhoto,
  '/src/assets/images/story_industrial_floor_1795432596007.jpg': industrialFloorPhoto,
  '/src/assets/images/story_cement_bricks_site_1795432596111.jpg': cementBricksPhoto,
};

const DEFAULT_COMPLETED_PROJECTS: Array<{
  id: string;
  title: string;
  segment: string;
  location: string;
  gradeSupplied: string;
  volumeNote: string;
  description: string;
  imageUrl: string;
  alt: string;
}> = [
  {
    id: 'proj-ranebennur-villa',
    title: 'G+1 Duplex Villa Roof Slab',
    segment: 'Residential',
    location: 'Ashwini Nagar, Ranebennur',
    gradeSupplied: 'M25 Pumpable Slab Concrete',
    volumeNote: '38 m³ · Boom Pump',
    description:
      'Supplied M25 concrete batched with graded M-sand during an early-morning 06:00 AM slot for smooth, crack-free roof slab finishing.',
    imageUrl: villaSlabPhoto,
    alt: 'M25 roof slab concrete pour at a residential villa in Ashwini Nagar, Ranebennur',
  },
  {
    id: 'proj-davangere-commercial',
    title: '4-Storey Commercial Complex Frame',
    segment: 'Commercial',
    location: 'PB Road Corridor, Davangere',
    gradeSupplied: 'M30 Structural Ready-Mix',
    volumeNote: '115 m³ · Multi-Slot',
    description:
      'High-early-strength M30 structural concrete delivered across night and early-morning windows for continuous column and beam pours.',
    imageUrl: commercialFramePhoto,
    alt: '4-storey commercial building frame poured with M30 ready-mix concrete in Davangere',
  },
  {
    id: 'proj-harihar-warehouse',
    title: 'Agro Storage & Warehouse Bay',
    segment: 'Industrial',
    location: 'Industrial Estate, Harihar',
    gradeSupplied: 'M30 Fibre-Reinforced Trimix',
    volumeNote: '84 m³ · Continuous',
    description:
      'Polypropylene fibre-reinforced M30 mix engineered to withstand continuous forklift movement and heavy grain-truck axle loads.',
    imageUrl: industrialFloorPhoto,
    alt: 'Industrial warehouse trimix floor concrete poured in Harihar with M30 fibre concrete',
  },
  {
    id: 'proj-byadgi-school',
    title: 'Institutional Masonry & Plinth Works',
    segment: 'Infrastructure',
    location: 'APMC Road, Byadgi',
    gradeSupplied: 'M20 Concrete & 8" Solid Blocks',
    volumeNote: '28 m³ + 6,500 Blocks',
    description:
      'Combined supply of M20 plinth-beam concrete and machine-pressed 8-inch solid cement blocks for fast, uniform classroom construction.',
    imageUrl: cementBricksPhoto,
    alt: 'School masonry block work and M20 concrete plinth beams supplied in Byadgi',
  },
  {
    id: 'proj-kotihal-slab',
    title: 'Reinforced Slab & Beam Pour',
    segment: 'Residential',
    location: 'Halageri Road, Ranebennur',
    gradeSupplied: 'M25 High-Workability RMC',
    volumeNote: '24 m³ · Line Pump',
    description:
      '140 mm slump pumpable M25 mix pumped evenly across dense roof reinforcement steel using our Kotihal line pump crew.',
    imageUrl: '/images/home/slab-rebar-card.webp',
    alt: 'Dense roof reinforcement steel ready for M25 pumpable concrete placement in Ranebennur',
  },
];

function resolveProjectImage(url?: string): string {
  const clean = (url || '').trim();
  if (clean && LOCAL_PHOTO_MAP[clean]) return LOCAL_PHOTO_MAP[clean];
  return clean || villaSlabPhoto;
}

export function CompletedProjectsCarousel({
  projects = [],
  sectionId = 'completed-projects-carousel',
}: {
  projects?: ProjectItem[];
  sectionId?: string;
}) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const items = useMemo(() => {
    const adminCards = (projects || []).map((p) => ({
      id: `db-${p.id}`,
      title: p.title,
      segment: p.segment || 'Concrete Supply',
      location: p.location || 'Ranebennur & Davangere',
      gradeSupplied: p.grade_used || 'Ready-Mix Concrete',
      volumeNote: p.volume_note || 'Verified Dispatch',
      description: p.summary || 'Supplied freshly batched ready-mix concrete from MY CONCRETE.',
      imageUrl: resolveProjectImage(p.image_url),
      alt: `${p.title} – concrete supplied at ${p.location}`,
    }));
    return [...adminCards, ...DEFAULT_COMPLETED_PROJECTS];
  }, [projects]);

  function scrollToCard(idx: number) {
    const wrapped = (idx + items.length) % items.length;
    setActiveIndex(wrapped);
    const el = trackRef.current;
    if (!el) return;
    const card = el.children[wrapped] as HTMLElement | undefined;
    if (card) {
      el.scrollTo({
        left: card.offsetLeft - el.offsetLeft,
        behavior: 'smooth',
      });
    }
  }

  useEffect(() => {
    if (paused || items.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % items.length;
        const el = trackRef.current;
        const card = el?.children[next] as HTMLElement | undefined;
        if (el && card) {
          el.scrollTo({ left: card.offsetLeft - el.offsetLeft, behavior: 'smooth' });
        }
        return next;
      });
    }, 5200);
    return () => clearInterval(timer);
  }, [paused, items.length]);

  return (
    <section
      id={sectionId}
      aria-labelledby={`${sectionId}-heading`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="bg-[var(--bg-soft)] border-t border-[#D7E4FF]/70 dark:border-[#264096]/70"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 lg:py-16 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#D92B25]">
              Client Site Showcase · Ranebennur, Davangere &amp; Surroundings
            </p>
            <h2
              id={`${sectionId}-heading`}
              className="font-display font-extrabold text-2xl sm:text-3xl text-[#0F1F5C] dark:text-white"
            >
              Completed Projects
            </h2>
            <p className="text-sm text-[var(--muted)] max-w-2xl">
              Explore residential slabs, commercial frames, warehouse floors, and masonry works supplied by our Kotihal &amp; Davangere units.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => scrollToCard(activeIndex - 1)}
              aria-label="Previous completed project"
              className="w-11 h-11 rounded-full bg-[var(--surface)] border border-[#D7E4FF] dark:border-[#264096] hover:bg-[#0F1F5C] hover:text-white dark:hover:bg-[#D92B25] text-[#0F1F5C] dark:text-white flex items-center justify-center shadow-xs transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => scrollToCard(activeIndex + 1)}
              aria-label="Next completed project"
              className="w-11 h-11 rounded-full bg-[#0F1F5C] hover:bg-[#D92B25] text-white flex items-center justify-center shadow-sm transition-colors cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Horizontal Carousel Track */}
        <div
          ref={trackRef}
          onScroll={() => {
            const el = trackRef.current;
            if (!el || !el.children.length) return;
            const firstCard = el.children[0] as HTMLElement;
            const step = firstCard.offsetWidth + 24;
            if (step > 0) {
              const approx = Math.round(el.scrollLeft / step);
              if (approx >= 0 && approx < items.length && approx !== activeIndex) {
                setActiveIndex(approx);
              }
            }
          }}
          className="flex gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {items.map((proj) => (
            <article
              key={proj.id}
              className="group warm-card snap-start shrink-0 w-[86%] sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] overflow-hidden flex flex-col justify-between"
            >
              <div>
                <div className="relative h-56 overflow-hidden bg-[#0F1F5C]">
                  <VisualPlate
                    imageUrl={proj.imageUrl}
                    variant="project"
                    title={proj.title}
                    alt={proj.alt}
                    width={960}
                    height={720}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                  />
                  <div
                    className="absolute inset-0 bg-gradient-to-t from-[#081238]/80 via-[#081238]/15 to-transparent pointer-events-none"
                    aria-hidden="true"
                  />
                  <div className="absolute inset-x-0 bottom-0 p-4 flex items-end justify-between gap-2 text-white">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#FFC93C]">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span>{proj.location}</span>
                    </span>
                    <span className="text-[11px] font-medium bg-white/15 backdrop-blur-xs px-2.5 py-0.5 rounded-md tabular-nums">
                      {proj.volumeNote}
                    </span>
                  </div>
                </div>

                <div className="p-5 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1F3FA8] dark:text-[#FFC93C]">
                    <Layers className="w-3.5 h-3.5 shrink-0 text-[#D92B25]" />
                    <span>{proj.gradeSupplied}</span>
                  </div>
                  <h3 className="font-display font-bold text-lg text-[#0F1F5C] dark:text-white leading-snug">
                    {proj.title}
                  </h3>
                  <p className="text-sm text-[var(--muted)] leading-relaxed">{proj.description}</p>
                </div>
              </div>

              <div className="px-5 pb-5 pt-2 flex items-center justify-between gap-3 border-t border-[#EAF1FF] dark:border-[#264096]/60 mt-2">
                <span className="text-xs font-medium text-[var(--muted)]">{proj.segment}</span>
                <Link
                  to="/book"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#D92B25] hover:underline"
                >
                  <span>Book Similar Mix</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </article>
          ))}
        </div>

        {/* Carousel Pagination Dots */}
        <div className="flex items-center justify-center gap-2 pt-1">
          {items.map((proj, idx) => (
            <button
              key={proj.id}
              type="button"
              onClick={() => scrollToCard(idx)}
              aria-label={`View project ${idx + 1}: ${proj.title}`}
              className={`h-2.5 rounded-full transition-all cursor-pointer ${
                idx === activeIndex
                  ? 'w-8 bg-[#D92B25]'
                  : 'w-2.5 bg-[#0F1F5C]/25 dark:bg-white/30 hover:bg-[#1F3FA8]'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
