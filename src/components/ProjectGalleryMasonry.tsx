import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, Image as ImageIcon, Maximize2, X } from 'lucide-react';

import villaSlabPhoto from '../assets/images/story_villa_slab_pour_1795432596043.jpg';
import commercialFramePhoto from '../assets/images/story_commercial_frame_1795432595761.jpg';
import industrialFloorPhoto from '../assets/images/story_industrial_floor_1795432596007.jpg';
import cementBricksPhoto from '../assets/images/story_cement_bricks_site_1795432596111.jpg';

type GalleryCategory = 'All' | 'Site Pours' | 'Fleet & Pumps' | 'Plant & Silos' | 'Cement Bricks';

interface GalleryPhotoItem {
  id: string;
  src: string;
  category: Exclude<GalleryCategory, 'All'>;
  location: string;
  title: string;
  titleKn: string;
  caption: string;
}

const ASSET_GALLERY_PHOTOS: GalleryPhotoItem[] = [
  {
    id: 'aistudio-silos',
    src: '/assets/aistudio/IMG-20240729-WA0007.jpg_74ba26c6.jpeg',
    category: 'Plant & Silos',
    location: 'Kotihal Plant',
    title: 'Twin Cement & Fly-Ash Storage Silos',
    titleKn: 'ಕೊಟಿಹಾಳ ಘಟಕದ ಸಿಮೆಂಟ್ ಮತ್ತು ಫ್ಲೈ-ಆ್ಯಶ್ ಸೈಲೋಗಳು',
    caption: 'High-capacity automated silos supporting 24/7 computerized RMC batching at Kotihal.',
  },
  {
    id: 'aistudio-mixer-site',
    src: '/assets/aistudio/WhatsApp_Image_2026-11-24_at_3.54.57_PM_4072ed6d.jpeg',
    category: 'Fleet & Pumps',
    location: 'Ranebennur Corridor',
    title: 'MY CONCRETE BharatBenz Transit Mixer on Site',
    titleKn: 'ಸೈಟ್‌ನಲ್ಲಿ MY CONCRETE ಟ್ರಾನ್ಸಿಟ್ ಮಿಕ್ಸರ್',
    caption: 'Dedicated transit mixer delivering freshly batched ready-mix concrete directly to site.',
  },
  {
    id: 'aistudio-column-pour',
    src: '/assets/aistudio/WhatsApp_Image_2026-11-24_at_3.54.58_PM_56212efd.jpeg',
    category: 'Site Pours',
    location: 'Byadgi Road',
    title: 'Heavy RCC Column Formwork & Vertical Rebar Pour',
    titleKn: 'ಆರ್‌ಸಿಸಿ ಕಂಬದ ಶಟರಿಂಗ್ ಮತ್ತು ಕಾಂಕ್ರೀಟ್ ಪೋರಿಂಗ್',
    caption: 'High-workability M30 structural concrete poured cleanly around dense column steel.',
  },
  {
    id: 'aistudio-slab-crew',
    src: '/assets/aistudio/WhatsApp_Image_2026-11-24_at_3.54.56_PM__1__9cc26c3b.jpeg',
    category: 'Site Pours',
    location: 'Halageri Road, Ranebennur',
    title: 'Pump Pipeline Slab Placement Crew',
    titleKn: 'ಪಂಪ್ ಪೈಪ್ ಮೂಲಕ ಸ್ಲ್ಯಾಬ್ ಕಾಂಕ್ರೀಟ್ ಕೆಲಸ',
    caption: 'Continuous roof slab placement with line-pump pipe routing and levelling crew.',
  },
  {
    id: 'aistudio-brick-stacks',
    src: '/assets/aistudio/IMG-20251204-WA0020.jpg_441302e4.jpeg',
    category: 'Cement Bricks',
    location: 'Kotihal Masonry Yard',
    title: 'Machine-Pressed Solid Cement Blocks Stacked for Dispatch',
    titleKn: 'ಡೆಲಿವರಿಗೆ ಸಿದ್ಧವಾಗಿರುವ ಸಿಮೆಂಟ್ ಬ್ಲಾಕ್‌ಗಳು',
    caption: 'Sharp-edged 4", 6", and 8" solid cement blocks cured and stacked for bulk loading.',
  },
  {
    id: 'aistudio-chute-loading',
    src: '/assets/aistudio/IMG-20240807-WA0009.jpg_ee1f1843.jpeg',
    category: 'Plant & Silos',
    location: 'Kotihal Batching Unit',
    title: 'Transit Mixer Loading Under Automated Batching Chute',
    titleKn: 'ಬ್ಯಾಚಿಂಗ್ ಪ್ಲಾಂಟ್‌ನಲ್ಲಿ ಮಿಕ್ಸರ್ ಲೋಡಿಂಗ್',
    caption: 'Calibrated M-sand, washed aggregate, and cement weigh-batched straight into mixer drum.',
  },
  {
    id: 'aistudio-finished-slab',
    src: '/assets/aistudio/WhatsApp_Image_2026-11-24_at_3.54.56_PM__2__d421b70a.jpeg',
    category: 'Site Pours',
    location: 'Ashwini Nagar, Ranebennur',
    title: 'Freshly Levelled Residential Roof Slab',
    titleKn: 'ಪೂರ್ಣಗೊಂಡ ಮನೆಯ ಛಾವಣಿ ಸ್ಲ್ಯಾಬ್',
    caption: 'Uniform M25 concrete slab surface finished cleanly with minimal shrinkage.',
  },
  {
    id: 'aistudio-rebar-grid',
    src: '/assets/aistudio/Screenshot_20261002-081400_893ff585.png',
    category: 'Site Pours',
    location: 'Davangere Layout',
    title: 'Full-Span Roof Slab Reinforcement & Electrical Conduit Grid',
    titleKn: 'ಕಾಂಕ್ರೀಟ್ ಪೋರಿಂಗ್‌ಗೆ ಸಿದ್ಧವಾದ ಸ್ಲ್ಯಾಬ್ ಕಬ್ಬಿಣದ ಜಾಲರಿ',
    caption: 'Pre-pour site inspection across double-mat slab reinforcement and concealed conduits.',
  },
  {
    id: 'aistudio-mixer-pump',
    src: '/assets/aistudio/WhatsApp_Image_2026-11-24_at_3.54.57_PM__1__88f8065c.jpeg',
    category: 'Fleet & Pumps',
    location: 'Harihar Industrial Area',
    title: 'Fleet KA 68 6266 Mixer & Concrete Line Pump Pair',
    titleKn: 'ಮಿಕ್ಸರ್ KA 68 6266 ಮತ್ತು ಕಾಂಕ್ರೀಟ್ ಲೈನ್ ಪಂಪ್',
    caption: 'Synchronized transit mixer and stationary line pump dispatch for fast multi-floor pours.',
  },
  {
    id: 'aistudio-brick-yard',
    src: '/assets/aistudio/IMG-20251204-WA0019.jpg_5607e72c.jpeg',
    category: 'Cement Bricks',
    location: 'Kotihal Curing Yard',
    title: 'Row-Cured Solid Cement Bricks Yard',
    titleKn: 'ಕೊಟಿಹಾಳ ಸಿಮೆಂಟ್ ಇಟ್ಟಿಗೆ ತಯಾರಿಕಾ ಘಟಕ',
    caption: 'Wide-yard water curing ensures uniform compressive strength across every masonry batch.',
  },
  {
    id: 'aistudio-multi-bay-pour',
    src: '/assets/aistudio/WhatsApp_Image_2026-11-24_at_3.54.56_PM_18ed585c.jpeg',
    category: 'Site Pours',
    location: 'Lokikere Road, Davangere',
    title: 'Multi-Bay Commercial Slab Rebar Pour',
    titleKn: 'ವಾಣಿಜ್ಯ ಕಟ್ಟಡದ ಸ್ಲ್ಯಾಬ್ ಕಾಂಕ್ರೀಟ್ ಪೋರಿಂಗ್',
    caption: 'High-volume M30 structural concrete placement by experienced site crew.',
  },
  {
    id: 'asset-villa-pour',
    src: villaSlabPhoto,
    category: 'Site Pours',
    location: 'Ranebennur Residential',
    title: 'Duplex Villa Early-Morning Slab Pour',
    titleKn: 'ಮನೆಯ ಛಾವಣಿ ಸ್ಲ್ಯಾಬ್ ಕಾಂಕ್ರೀಟ್',
    caption: 'Cool early-morning concrete placement protecting slab hydration and surface finish.',
  },
  {
    id: 'asset-commercial-frame',
    src: commercialFramePhoto,
    category: 'Site Pours',
    location: 'Davangere Commercial',
    title: 'Multi-Storey Commercial Frame Concrete Supply',
    titleKn: 'ಬಹುಮಹಡಿ ವಾಣಿಜ್ಯ ಕಟ್ಟಡದ ಆರ್‌ಸಿಸಿ ಕೆಲಸ',
    caption: 'Scheduled transit-mixer rotations supporting continuous beam and slab casting.',
  },
  {
    id: 'asset-industrial-floor',
    src: industrialFloorPhoto,
    category: 'Fleet & Pumps',
    location: 'Harihar–Davangere Highway',
    title: 'Industrial Warehouse Heavy-Duty Floor Pour',
    titleKn: 'ಗೋದಾಮು ಮತ್ತು ಕೈಗಾರಿಕಾ ನೆಲಹಾಸು ಕಾಂಕ್ರೀಟ್',
    caption: 'Laser-screeded fibre-reinforced floor mix engineered for heavy rack and forklift loads.',
  },
  {
    id: 'asset-cement-bricks-site',
    src: cementBricksPhoto,
    category: 'Cement Bricks',
    location: 'Kotihal & Nearby Towns',
    title: 'Solid Cement Block Wall Masonry Delivery',
    titleKn: 'ಸೈಟ್‌ಗೆ ತಲುಪಿದ ಸಿಮೆಂಟ್ ಬ್ಲಾಕ್ ಗೋಡೆ ಕಟ್ಟಡ',
    caption: 'Direct plant-to-site pallet delivery reducing mortar waste and masonry construction time.',
  },
];

const CATEGORIES: GalleryCategory[] = [
  'All',
  'Site Pours',
  'Fleet & Pumps',
  'Plant & Silos',
  'Cement Bricks',
];

export function ProjectGalleryMasonry({ lang = 'en' }: { lang?: 'en' | 'kn' }) {
  const [activeCategory, setActiveCategory] = useState<GalleryCategory>('All');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [failedIds, setFailedIds] = useState<Record<string, boolean>>({});

  const visiblePhotos = useMemo(() => {
    if (activeCategory === 'All') return ASSET_GALLERY_PHOTOS;
    return ASSET_GALLERY_PHOTOS.filter((item) => item.category === activeCategory);
  }, [activeCategory]);

  const activeLightboxItem =
    lightboxIndex !== null && visiblePhotos[lightboxIndex] ? visiblePhotos[lightboxIndex] : null;

  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxIndex(null);
      } else if (e.key === 'ArrowRight') {
        setLightboxIndex((prev) =>
          prev === null ? null : (prev + 1) % visiblePhotos.length
        );
      } else if (e.key === 'ArrowLeft') {
        setLightboxIndex((prev) =>
          prev === null ? null : (prev - 1 + visiblePhotos.length) % visiblePhotos.length
        );
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [lightboxIndex, visiblePhotos.length]);

  return (
    <section
      id="project-gallery"
      aria-labelledby="project-gallery-heading"
      className="bg-[var(--bg)] border-t border-[#D7E4FF]/70 dark:border-[#264096]/70"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 lg:py-16 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
          <div className="space-y-1.5 max-w-2xl">
            <p className="text-xs font-semibold text-[#D92B25]">
              Kotihal Plant, Fleet &amp; Regional Site Archive
            </p>
            <h2
              id="project-gallery-heading"
              className="font-display font-extrabold text-2xl sm:text-3xl text-[#0F1F5C] dark:text-white text-balance"
            >
              {lang === 'kn' ? 'ಪ್ರಾಜೆಕ್ಟ್ ಗ್ಯಾಲರಿ' : 'Project Gallery'}
            </h2>
            <p className="text-sm text-[var(--muted)] leading-relaxed">
              {lang === 'kn'
                ? 'ನಮ್ಮ ಕೊಟಿಹಾಳ ಘಟಕ, ಟ್ರಾನ್ಸಿಟ್ ಮಿಕ್ಸರ್‌ಗಳು, ಸಿಮೆಂಟ್ ಬ್ಲಾಕ್ ಯಾರ್ಡ್ ಮತ್ತು ರಾಣೇಬೆನ್ನೂರು–ದಾವಣಗೆರೆ ಸೈಟ್ ಪೋರಿಂಗ್‌ಗಳ ನೈಜ ಚಿತ್ರಗಳು.'
                : 'Authentic snapshots from our Kotihal batching silos, BharatBenz transit mixers, curing brick yard, and active pours across Ranebennur & Davangere.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div
              role="tablist"
              aria-label="Filter project gallery photos"
              className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-[var(--surface)] border border-[#D7E4FF] dark:border-[#264096]"
            >
              {CATEGORIES.map((cat) => {
                const isActive = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => {
                      setActiveCategory(cat);
                      setLightboxIndex(null);
                    }}
                    className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 min-h-[40px] cursor-pointer ${
                      isActive
                        ? 'bg-[#0F1F5C] text-white dark:bg-[#D92B25]'
                        : 'text-[var(--muted)] hover:text-[#0F1F5C] dark:hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            <Link
              to="/gallery"
              className="group inline-flex items-center gap-2 rounded-lg border border-[#0F1F5C] dark:border-white/30 px-4 py-2 min-h-[40px] text-xs font-semibold text-[#0F1F5C] dark:text-white hover:bg-[#0F1F5C] hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              <span>Full Gallery</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>

        {/* Responsive Multi-Column Masonry Grid */}
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 sm:gap-5 space-y-4 sm:space-y-5">
          {visiblePhotos.map((photo, idx) => {
            const title = lang === 'kn' ? photo.titleKn : photo.title;
            const hasFailed = Boolean(failedIds[photo.id]);
            return (
              <button
                key={photo.id}
                type="button"
                onClick={() => setLightboxIndex(idx)}
                className="group relative block w-full break-inside-avoid rounded-2xl overflow-hidden bg-[#0F1F5C] border border-[#D7E4FF] dark:border-[#264096] shadow-[0_12px_28px_-12px_rgba(15,31,92,0.2)] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D92B25] focus-visible:ring-offset-2 cursor-pointer"
                aria-label={`Open ${title} in fullscreen viewer`}
              >
                {hasFailed ? (
                  <div className="aspect-[4/3] w-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-[#0F1F5C] to-[#1F3FA8] text-white space-y-2">
                    <ImageIcon className="w-7 h-7 text-[#FFC93C]" />
                    <p className="font-display font-bold text-sm">{title}</p>
                    <p className="text-xs text-slate-200">{photo.location}</p>
                  </div>
                ) : (
                  <img
                    src={photo.src}
                    alt={`${title} – ${photo.location} by MY CONCRETE`}
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    onError={() => setFailedIds((prev) => ({ ...prev, [photo.id]: true }))}
                    className="w-full h-auto block transition-transform duration-300 ease-out group-hover:scale-[1.03]"
                  />
                )}

                <span
                  aria-hidden="true"
                  className="absolute top-3 right-3 w-9 h-9 rounded-lg bg-[#050C26]/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-200"
                >
                  <Maximize2 className="w-4 h-4" />
                </span>

                <div
                  className="absolute inset-x-0 bottom-0 pt-14 pb-4 px-4 bg-gradient-to-t from-[#050C26]/90 via-[#050C26]/55 to-transparent"
                >
                  <p className="text-[11px] font-medium text-[#FFC93C] truncate">
                    {photo.category} <span aria-hidden="true">·</span> {photo.location}
                  </p>
                  <p className="font-display font-bold text-sm text-white leading-snug mt-0.5">
                    {title}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Fullscreen Lightbox Modal */}
      {activeLightboxItem && lightboxIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={lang === 'kn' ? activeLightboxItem.titleKn : activeLightboxItem.title}
          onClick={() => setLightboxIndex(null)}
          className="fixed inset-0 z-50 bg-[#050C26]/92 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-5xl w-full max-h-[92vh] bg-[#0B1742] border border-[#264096] rounded-2xl overflow-hidden shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between gap-4 px-5 py-3.5 border-b border-[#264096]/80 text-white">
              <div className="min-w-0">
                <p className="text-xs text-[#FFC93C] truncate">
                  {activeLightboxItem.category} <span aria-hidden="true">·</span>{' '}
                  {activeLightboxItem.location} <span aria-hidden="true">·</span>{' '}
                  <span className="tabular-nums">
                    {lightboxIndex + 1} / {visiblePhotos.length}
                  </span>
                </p>
                <h3 className="font-display font-bold text-base sm:text-lg truncate">
                  {lang === 'kn' ? activeLightboxItem.titleKn : activeLightboxItem.title}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setLightboxIndex(null)}
                aria-label="Close photo viewer"
                className="w-11 h-11 rounded-lg bg-white/10 hover:bg-[#D92B25] text-white flex items-center justify-center shrink-0 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative flex-1 min-h-0 bg-[#050C26] flex items-center justify-center p-2 sm:p-4 overflow-hidden">
              <img
                src={activeLightboxItem.src}
                alt={`${activeLightboxItem.title} – ${activeLightboxItem.location}`}
                referrerPolicy="no-referrer"
                className="max-h-[68vh] w-auto max-w-full object-contain rounded-lg"
              />

              {visiblePhotos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setLightboxIndex(
                        (lightboxIndex - 1 + visiblePhotos.length) % visiblePhotos.length
                      )
                    }
                    aria-label="Previous photo"
                    className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-[#0F1F5C]/90 hover:bg-[#D92B25] text-white border border-white/20 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setLightboxIndex((lightboxIndex + 1) % visiblePhotos.length)}
                    aria-label="Next photo"
                    className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-[#0F1F5C]/90 hover:bg-[#D92B25] text-white border border-white/20 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            <div className="px-5 py-3.5 border-t border-[#264096]/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs sm:text-sm text-slate-200">
              <p>{activeLightboxItem.caption}</p>
              <Link
                to="/book"
                className="text-[#FFC93C] hover:underline font-semibold whitespace-nowrap shrink-0"
              >
                Book Concrete / Bricks &rarr;
              </Link>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
