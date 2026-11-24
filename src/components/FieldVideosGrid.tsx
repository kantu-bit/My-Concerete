import { Link } from 'react-router-dom';
import { ArrowRight, Film } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';

export interface FieldVideoItem {
  id: string;
  src: string;
  poster: string;
  category: string;
  categoryKn: string;
  title: string;
  titleKn: string;
  caption: string;
  captionKn: string;
  durationLabel: string;
}

export const MY_CONCRETE_VIDEOS: FieldVideoItem[] = [
  {
    id: 'vid-mixer-arrival',
    src: '/assets/aistudio/WhatsApp_Video_2026-11-23_at_6.16.11_PM_214492ba.mp4',
    poster: '/images/home/video-poster-1.webp',
    category: 'Transit Fleet',
    categoryKn: 'ಟ್ರಾನ್ಸಿಟ್ ಫ್ಲೀಟ್',
    title: 'BharatBenz Transit Mixer Site Arrival',
    titleKn: 'ಸೈಟ್‌ಗೆ MY CONCRETE ಟ್ರಾನ್ಸಿಟ್ ಮಿಕ್ಸರ್ ಆಗಮನ',
    caption:
      'Freshly batched MY CONCRETE BharatBenz transit mixer arriving on site with operator checking drum & chute.',
    captionKn:
      'ಕೊಟಿಹಾಳ ಘಟಕದಿಂದ ತಾಜಾ ರೆಡಿ-ಮಿಕ್ಸ್ ಕಾಂಕ್ರೀಟ್ ಹೊತ್ತು ಸೈಟ್‌ಗೆ ಆಗಮಿಸಿದ MY CONCRETE ಮಿಕ್ಸರ್.',
    durationLabel: '0:23',
  },
  {
    id: 'vid-layout-work',
    src: '/assets/aistudio/WhatsApp_Video_2026-11-23_at_6.16.21_PM_2a02d3d1.mp4',
    poster: '/images/home/video-poster-2.webp',
    category: 'Layout Work',
    categoryKn: 'ಲೇಔಟ್ ಕಾಮಗಾರಿ',
    title: 'RMC Unit Layout Road & Plinth Pour',
    titleKn: 'ಲೇಔಟ್ ರಸ್ತೆ ಮತ್ತು ಪ್ಲಿಂತ್ ಕಾಂಕ್ರೀಟ್ ಪೂರೈಕೆ',
    caption:
      'Continuous transit-mixer chute discharge and finishing crew at a residential layout project.',
    captionKn:
      'ವಸತಿ ಲೇಔಟ್ ಕಾಮಗಾರಿಯಲ್ಲಿ ನಿರಂತರ ಕಾಂಕ್ರೀಟ್ ಪೂರೈಕೆ ಮತ್ತು ಫಿನಿಶಿಂಗ್ ಕೆಲಸ.',
    durationLabel: '0:36',
  },
  {
    id: 'vid-night-mass',
    src: '/assets/aistudio/WhatsApp_Video_2026-11-23_at_6.16.30_PM_c490d6a4.mp4',
    poster: '/images/home/video-poster-3.webp',
    category: '24/7 Night Pour',
    categoryKn: '24/7 ರಾತ್ರಿ ಪೂರೈಕೆ',
    title: 'Night Mass Concreting Dispatch',
    titleKn: 'ರಾತ್ರಿ ಸಮಯದ ಬೃಹತ್ ಕಾಂಕ್ರೀಟ್ ಪೂರೈಕೆ',
    caption:
      '24-hour dispatch in action — mass concreting poured cleanly during cooler overnight hours.',
    captionKn:
      'ತಂಪಾದ ರಾತ್ರಿ ಸಮಯದಲ್ಲಿ ನಿರಂತರವಾಗಿ ನಡೆದ ಬೃಹತ್ ಕಾಂಕ್ರೀಟ್ ಕಾಮಗಾರಿ.',
    durationLabel: '0:34',
  },
  {
    id: 'vid-rebar-grid',
    src: '/assets/aistudio/WhatsApp_Video_2026-11-23_at_6.17.10_PM_ef48f1fb.mp4',
    poster: '/images/home/video-poster-4.webp',
    category: 'Site Readiness',
    categoryKn: 'ಸೈಟ್ ಸಿದ್ಧತೆ',
    title: 'Heavy Reinforcement Mesh & Slope Prep',
    titleKn: 'ಕಬ್ಬಿಣದ ಜಾಲರಿ ಮತ್ತು ಸೈಟ್ ಸಿದ್ಧತೆ ಪರಿಶೀಲನೆ',
    caption:
      'Full steel reinforcement mesh laid across wide civil embankment prior to ready-mix placement.',
    captionKn:
      'ಕಾಂಕ್ರೀಟ್ ಹಾಕುವ ಮೊದಲು ಸಿದ್ಧಪಡಿಸಲಾದ ಬೃಹತ್ ಕಬ್ಬಿಣದ ಜಾಲರಿ ಮತ್ತು ಮಟ್ಟ ಪರಿಶೀಲನೆ.',
    durationLabel: '0:08',
  },
  {
    id: 'vid-kotihal-dispatch',
    src: '/assets/aistudio/WhatsApp_Video_2026-11-23_at_6.17.53_PM_b8053466.mp4',
    poster: '/images/home/video-poster-5.webp',
    category: 'Kotihal Dispatch',
    categoryKn: 'ಕೊಟಿಹಾಳ ರವಾನೆ',
    title: 'Kotihal to Ranebennur Fleet Dispatch',
    titleKn: 'ಕೊಟಿಹಾಳ ಘಟಕದಿಂದ ಸೈಟ್‌ಗೆ ಪಯಣ',
    caption:
      'Cab view heading out from MY CONCRETE RMC Unit Kotihal toward active Ranebennur delivery sites.',
    captionKn:
      'ಕೊಟಿಹಾಳ MY CONCRETE ಘಟಕದಿಂದ ರಾಣೆಬೆನ್ನೂರು ಸೈಟ್‌ಗಳಿಗೆ ಸಾಗುತ್ತಿರುವ ವಾಹನ.',
    durationLabel: '0:41',
  },
  {
    id: 'vid-road-paving',
    src: '/assets/aistudio/VID-20260718-WA0008_47e83764.mp4',
    poster: '/images/home/mixer-plant-card.webp',
    category: 'Road Concrete',
    categoryKn: 'ರಸ್ತೆ ಕಾಮಗಾರಿ',
    title: 'On-Site Road & Slab Concrete Placement',
    titleKn: 'ರಸ್ತೆ ಮತ್ತು ಸ್ಲ್ಯಾಬ್ ಕಾಂಕ್ರೀಟ್ ಪೂರೈಕೆ',
    caption:
      'Continuous ready-mix discharge directly into prepared road formwork across our 50 km corridor.',
    captionKn:
      'ರಾಣೆಬೆನ್ನೂರು ಮತ್ತು ದಾವಣಗೆರೆ ವ್ಯಾಪ್ತಿಯಲ್ಲಿ ರಸ್ತೆ ಕಾಮಗಾರಿಗೆ ನೇರ ಕಾಂಕ್ರೀಟ್ ಪೂರೈಕೆ.',
    durationLabel: '0:09',
  },
];

export function FieldVideosGrid({
  limit,
  showViewAllButton = false,
  sectionTitle,
}: {
  limit?: number;
  showViewAllButton?: boolean;
  sectionTitle?: string;
}) {
  const { lang } = useApp();
  const visible = limit ? MY_CONCRETE_VIDEOS.slice(0, limit) : MY_CONCRETE_VIDEOS;

  return (
    <section
      aria-label="MY CONCRETE Fleet and Site Pour Videos"
      className="bg-[var(--bg)] py-12 lg:py-16"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#D92B25] flex items-center gap-1.5">
              <Film className="w-3.5 h-3.5 shrink-0" />
              <span>Real Site &amp; Transit Mixer Reels</span>
            </p>
            <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-[#0F1F5C] dark:text-white">
              {sectionTitle || 'Watch Our Fleet & Pours in Action'}
            </h2>
            <p className="text-sm text-[var(--muted)] max-w-2xl">
              Actual site footage from our Kotihal dispatch unit — daytime layout pours, 24/7 night mass concreting, rebar inspection, and mixer fleet arrivals.
            </p>
          </div>

          {showViewAllButton && (
            <Link
              to="/gallery#videos-showcase"
              className="group btn-blue-pill px-5 py-2.5 text-xs sm:text-sm self-start sm:self-auto"
            >
              <span>View Full Gallery &amp; Reels</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {visible.map((vid) => (
            <article key={vid.id} className="warm-card overflow-hidden flex flex-col">
              <div className="relative bg-[#081238] flex items-center justify-center overflow-hidden">
                <div className="w-full aspect-[9/16] max-h-[440px] bg-[#081238]">
                  <video
                    controls
                    playsInline
                    preload="metadata"
                    poster={vid.poster}
                    aria-label={vid.title}
                    className="w-full h-full object-cover"
                  >
                    <source src={vid.src} type="video/mp4" />
                    Your browser does not support video playback.
                  </video>
                </div>
                <span className="pointer-events-none absolute top-3 left-3 rounded-md bg-[#0F1F5C]/85 backdrop-blur-xs text-[#FFC93C] px-2.5 py-1 text-[11px] font-bold">
                  {lang === 'kn' ? vid.categoryKn : vid.category}
                </span>
                <span className="pointer-events-none absolute top-3 right-3 rounded-md bg-black/65 text-white px-2 py-0.5 text-[11px] font-mono tabular-nums">
                  {vid.durationLabel}
                </span>
              </div>

              <div className="p-5 space-y-2 flex-1 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <h3 className="font-display font-bold text-base sm:text-lg text-[#0F1F5C] dark:text-white leading-snug">
                    {lang === 'kn' ? vid.titleKn : vid.title}
                  </h3>
                  <p className="text-sm text-[var(--muted)] leading-relaxed">
                    {lang === 'kn' ? vid.captionKn : vid.caption}
                  </p>
                </div>
                <div className="pt-2 border-t border-[#EAF1FF] dark:border-[#264096]/60 flex items-center justify-between text-xs">
                  <span className="text-[var(--muted)]">MY CONCRETE · Kotihal Unit</span>
                  <Link to="/book" className="font-semibold text-[#D92B25] hover:underline">
                    Book Slot &rarr;
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
