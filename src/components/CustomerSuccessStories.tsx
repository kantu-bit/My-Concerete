import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Camera,
  CheckCircle2,
  MapPin,
  Maximize2,
  MessageSquarePlus,
  Star,
  X,
} from 'lucide-react';
import type { TestimonialItem } from '../types/index.ts';
import { useApp } from '../context/AppContext.tsx';
import { FRIENDLY_API_ERROR, parseJsonResponse } from '../utils/api.ts';
import { VisualPlate } from './VisualPlate.tsx';

import villaSlabPhoto from '../assets/images/story_villa_slab_pour_1795432596043.jpg';
import commercialFramePhoto from '../assets/images/story_commercial_frame_1795432595761.jpg';
import industrialFloorPhoto from '../assets/images/story_industrial_floor_1795432596007.jpg';
import cementBricksPhoto from '../assets/images/story_cement_bricks_site_1795432596111.jpg';

const GENERATED_STORY_PHOTOS: Record<string, string> = {
  '/src/assets/images/story_villa_slab_pour_1795432596043.jpg': villaSlabPhoto,
  '/src/assets/images/story_commercial_frame_1795432595761.jpg': commercialFramePhoto,
  '/src/assets/images/story_industrial_floor_1795432596007.jpg': industrialFloorPhoto,
  '/src/assets/images/story_cement_bricks_site_1795432596111.jpg': cementBricksPhoto,
};

const SEGMENT_DEFAULT_PHOTOS: Record<string, string> = {
  Residential: villaSlabPhoto,
  Commercial: commercialFramePhoto,
  Industrial: industrialFloorPhoto,
  Infrastructure: cementBricksPhoto,
};

const SEGMENT_FILTERS = ['All Stories', 'Residential', 'Commercial', 'Industrial', 'Infrastructure'] as const;

const RATING_LABELS: Record<number, string> = {
  1: 'Needs Improvement',
  2: 'Fair',
  3: 'Good',
  4: 'Very Good',
  5: 'Excellent Pour & Punctuality',
};

function resolveStoryPhoto(story: TestimonialItem): string {
  const raw = (story.project_image_url || '').trim();
  if (raw && GENERATED_STORY_PHOTOS[raw]) {
    return GENERATED_STORY_PHOTOS[raw];
  }
  if (raw) {
    return raw;
  }
  return SEGMENT_DEFAULT_PHOTOS[story.segment || 'Residential'] || villaSlabPhoto;
}

function getInitials(name: string): string {
  const parts = String(name || 'MC')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ''}${parts[parts.length - 1][0] || ''}`.toUpperCase();
}

function StarRow({
  rating,
  size = 'sm',
}: {
  rating: number;
  size?: 'sm' | 'md' | 'lg';
}) {
  const clamped = Math.min(5, Math.max(1, Math.round(rating || 5)));
  const iconClass =
    size === 'lg' ? 'w-5 h-5' : size === 'md' ? 'w-4 h-4' : 'w-3.5 h-3.5';

  return (
    <div
      className="inline-flex items-center gap-0.5 shrink-0"
      aria-label={`Rated ${clamped} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`${iconClass} ${
            n <= clamped
              ? 'fill-[#FFC93C] text-[#D99B00]'
              : 'fill-transparent text-[#B6CBFA] dark:text-[#264096]'
          }`}
        />
      ))}
    </div>
  );
}

export function CustomerSuccessStories({
  testimonials,
}: {
  testimonials: TestimonialItem[];
}) {
  const { refreshBootstrap, t } = useApp();
  const [segmentFilter, setSegmentFilter] = useState<(typeof SEGMENT_FILTERS)[number]>('All Stories');
  const [sortBy, setSortBy] = useState<'top' | 'recent'>('top');
  const [selectedStory, setSelectedStory] = useState<TestimonialItem | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

  // Review submission form state
  const [authorName, setAuthorName] = useState('');
  const [roleOrCompany, setRoleOrCompany] = useState('');
  const [location, setLocation] = useState('Ranebennur');
  const [projectTitle, setProjectTitle] = useState('');
  const [segment, setSegment] = useState<'Residential' | 'Commercial' | 'Industrial' | 'Infrastructure'>(
    'Residential'
  );
  const [gradeUsed, setGradeUsed] = useState('M25 Slab Concrete');
  const [volumeNote, setVolumeNote] = useState('');
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [quote, setQuote] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const normalizedStories = useMemo(() => {
    return testimonials.map((item) => ({
      ...item,
      rating: Number.isFinite(Number(item.rating)) && Number(item.rating) >= 1 ? Number(item.rating) : 5,
      segment: item.segment || 'Residential',
      project_title: item.project_title || `${item.location || 'Regional'} Concrete Pour`,
    }));
  }, [testimonials]);

  const ratingMetrics = useMemo(() => {
    const total = normalizedStories.length;
    if (total === 0) {
      return {
        average: 5.0,
        total: 0,
        counts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } as Record<number, number>,
      };
    }
    const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let sum = 0;
    for (const s of normalizedStories) {
      const r = Math.min(5, Math.max(1, Math.round(s.rating)));
      counts[r] = (counts[r] || 0) + 1;
      sum += r;
    }
    return {
      average: Number((sum / total).toFixed(1)),
      total,
      counts,
    };
  }, [normalizedStories]);

  const filteredStories = useMemo(() => {
    const base =
      segmentFilter === 'All Stories'
        ? normalizedStories
        : normalizedStories.filter(
            (s) => (s.segment || 'Residential').toLowerCase() === segmentFilter.toLowerCase()
          );
    return [...base].sort((a, b) => {
      if (sortBy === 'top') {
        if (b.rating !== a.rating) return b.rating - a.rating;
        return b.id - a.id;
      }
      return b.id - a.id;
    });
  }, [normalizedStories, segmentFilter, sortBy]);

  const featuredStory = filteredStories[0] || null;
  const secondaryStories = filteredStories.slice(1);

  async function handleSubmitReview(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);

    if (authorName.trim().length < 2) {
      setSubmitError('Please enter your name.');
      return;
    }
    if (location.trim().length < 2) {
      setSubmitError('Please enter your city or site location.');
      return;
    }
    if (projectTitle.trim().length < 3) {
      setSubmitError('Please enter a short project title (e.g. G+1 House Roof Slab).');
      return;
    }
    if (quote.trim().length < 12) {
      setSubmitError('Please share at least a brief sentence about your concrete delivery experience.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorName: authorName.trim(),
          roleOrCompany: roleOrCompany.trim() || 'Verified Customer',
          location: location.trim(),
          projectTitle: projectTitle.trim(),
          segment,
          gradeUsed: gradeUsed.trim() || 'M25 Ready-Mix',
          volumeNote: volumeNote.trim(),
          rating,
          quote: quote.trim(),
          website_url: honeypot,
        }),
      });
      const parsed = await parseJsonResponse<{ ok?: boolean; error?: string }>(res);
      if (!res.ok || !parsed.data?.ok) {
        throw new Error(parsed.data?.error || FRIENDLY_API_ERROR);
      }

      setAuthorName('');
      setRoleOrCompany('');
      setProjectTitle('');
      setVolumeNote('');
      setQuote('');
      setRating(5);
      setSubmitSuccess('Thank you! Your project rating and review are now live.');
      await refreshBootstrap();
      setTimeout(() => {
        setReviewModalOpen(false);
        setSubmitSuccess(null);
      }, 1500);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : FRIENDLY_API_ERROR);
    } finally {
      setSubmitting(false);
    }
  }

  const activeStarPreview = hoverRating ?? rating;

  return (
    <section
      id="customer-success-stories"
      aria-labelledby="stories-heading"
      className="bg-[var(--bg-soft)]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 space-y-10">
        {/* Top Header + Aggregate Rating Scoreboard */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-3">
            <p className="text-xs font-semibold text-[#D92B25]">
              Verified Project Outcomes · Ranebennur &amp; Davangere
            </p>
            <h2
              id="stories-heading"
              className="font-display font-bold text-2xl sm:text-3xl lg:text-4xl text-[#0F1F5C] dark:text-white tracking-tight"
            >
              {t('testimonialsTitle')}
            </h2>
            <p className="text-sm sm:text-base text-[var(--muted)] max-w-2xl leading-relaxed">
              Real pour timelines, slump consistency feedback, and completed site photographs from homeowners, builders, and civil contractors supplied by our Kotihal and Davangere plants.
            </p>
          </div>

          {/* Rating Breakdown Summary Panel */}
          <div className="lg:col-span-5 warm-card p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div className="space-y-1.5 shrink-0">
                <div className="flex items-baseline gap-2">
                  <span className="font-slab font-bold text-4xl text-[#0F1F5C] dark:text-white tabular-nums">
                    {ratingMetrics.average.toFixed(1)}
                  </span>
                  <span className="text-sm font-medium text-[var(--muted)] tabular-nums">/ 5.0</span>
                </div>
                <StarRow rating={Math.round(ratingMetrics.average)} size="md" />
                <p className="text-xs text-[var(--muted)] tabular-nums">
                  Based on {ratingMetrics.total} verified site{' '}
                  {ratingMetrics.total === 1 ? 'review' : 'reviews'}
                </p>
              </div>

              <div className="flex-1 space-y-1.5 min-w-[165px]">
                {[5, 4, 3, 2, 1].map((starNum) => {
                  const count = ratingMetrics.counts[starNum] || 0;
                  const pct =
                    ratingMetrics.total > 0 ? Math.round((count / ratingMetrics.total) * 100) : 0;
                  return (
                    <div key={starNum} className="flex items-center gap-2 text-xs">
                      <span className="w-7 text-right font-medium text-[#0F1F5C] dark:text-slate-200 tabular-nums">
                        {starNum}★
                      </span>
                      <div className="flex-1 h-2 rounded-full bg-[#EAF1FF] dark:bg-[#0F1F5C] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#FFC93C] transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-6 text-right text-[var(--muted)] tabular-nums">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-[#D7E4FF] dark:border-[#264096] flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-[var(--muted)]">
                Completed a pour with MY CONCRETE?
              </span>
              <button
                type="button"
                onClick={() => {
                  setSubmitError(null);
                  setSubmitSuccess(null);
                  setReviewModalOpen(true);
                }}
                className="inline-flex items-center gap-2 rounded-lg bg-[#1F3FA8] hover:bg-[#173187] text-white px-4 py-2 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap min-h-[40px]"
              >
                <MessageSquarePlus className="w-3.5 h-3.5 text-[#FFC93C]" />
                <span>Rate Your Pour</span>
              </button>
            </div>
          </div>
        </div>

        {/* Interactive Filter Tabs & Sort Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div
            role="tablist"
            aria-label="Filter customer stories by project sector"
            className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-[var(--surface)] border border-[#D7E4FF] dark:border-[#264096]"
          >
            {SEGMENT_FILTERS.map((seg) => {
              const active = segmentFilter === seg;
              return (
                <button
                  key={seg}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setSegmentFilter(seg)}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap min-h-[40px] cursor-pointer ${
                    active
                      ? 'bg-[#0F1F5C] text-white shadow-xs'
                      : 'text-[var(--muted)] hover:text-[#0F1F5C] dark:hover:text-white'
                  }`}
                >
                  {seg}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <label htmlFor="stories-sort" className="text-xs font-medium text-[var(--muted)]">
              Sort by:
            </label>
            <select
              id="stories-sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'top' | 'recent')}
              className="rounded-lg border border-[#D7E4FF] dark:border-[#264096] bg-[var(--surface)] px-3 py-2 text-xs font-semibold text-[#0F1F5C] dark:text-white min-h-[40px] focus:border-[#1F3FA8] focus:outline-none cursor-pointer"
            >
              <option value="top">Highest Rated</option>
              <option value="recent">Most Recent</option>
            </select>
          </div>
        </div>

        {/* Stories Display: Featured Asymmetric Split + Supporting Grid */}
        {filteredStories.length === 0 ? (
          <div className="warm-card p-10 text-center space-y-3">
            <p className="font-display font-bold text-lg text-[#0F1F5C] dark:text-white">
              No stories in {segmentFilter} yet
            </p>
            <p className="text-sm text-[var(--muted)] max-w-md mx-auto">
              Switch back to All Stories or share feedback from your recent concrete or cement brick delivery.
            </p>
            <div className="pt-2 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => setSegmentFilter('All Stories')}
                className="rounded-lg border border-[#D7E4FF] dark:border-[#264096] px-4 py-2 text-xs font-semibold text-[#0F1F5C] dark:text-white hover:border-[#1F3FA8] cursor-pointer"
              >
                Show All Stories
              </button>
              <button
                type="button"
                onClick={() => setReviewModalOpen(true)}
                className="rounded-lg bg-[#D92B25] hover:bg-[#B9221D] text-white px-4 py-2 text-xs font-semibold cursor-pointer"
              >
                Rate Your Pour
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Featured Lead Customer Story */}
            {featuredStory && (
              <article className="warm-card overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch">
                <div className="lg:col-span-7 relative min-h-[260px] sm:min-h-[340px] overflow-hidden bg-[#0F1F5C]">
                  <VisualPlate
                    imageUrl={resolveStoryPhoto(featuredStory)}
                    variant="project"
                    title={featuredStory.project_title || featuredStory.author_name}
                    alt={`${featuredStory.project_title || 'Concrete delivery'} in ${featuredStory.location}`}
                    width={1200}
                    height={900}
                    className="w-full h-full lg:h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#081238]/85 via-[#081238]/20 to-transparent pointer-events-none" />
                  <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6 flex flex-wrap items-end justify-between gap-3 text-white">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-[#FFC93C] flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span>{featuredStory.location}</span>
                        {featuredStory.volume_note && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="tabular-nums">{featuredStory.volume_note}</span>
                          </>
                        )}
                      </p>
                      <h3 className="font-display font-bold text-lg sm:text-xl text-white">
                        {featuredStory.project_title}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedStory(featuredStory)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-white/95 hover:bg-white text-[#0F1F5C] px-3.5 py-2 text-xs font-semibold shadow-sm transition-colors cursor-pointer min-h-[40px]"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>Inspect Pour Photo</span>
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between gap-6">
                  <div className="space-y-4">
                    {/* Unboxed clean metadata + Star score */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <StarRow rating={featuredStory.rating} size="md" />
                        <span className="font-slab font-bold text-sm text-[#0F1F5C] dark:text-[#FFC93C] tabular-nums">
                          {featuredStory.rating.toFixed(1)} / 5
                        </span>
                      </div>
                      <span className="text-xs text-[var(--muted)]">
                        {featuredStory.segment || 'Residential'}
                        {featuredStory.grade_used ? ` · ${featuredStory.grade_used}` : ''}
                      </span>
                    </div>

                    <blockquote className="text-base sm:text-lg text-[#0F1F5C] dark:text-slate-100 leading-relaxed font-medium">
                      &ldquo;{featuredStory.quote}&rdquo;
                    </blockquote>
                  </div>

                  <div className="pt-4 border-t border-[#D7E4FF] dark:border-[#264096] flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-[#1F3FA8] text-[#FFC93C] font-display font-bold text-xs flex items-center justify-center shrink-0">
                        {getInitials(featuredStory.author_name)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-display font-bold text-sm text-[#0F1F5C] dark:text-white truncate">
                          {featuredStory.author_name}
                        </p>
                        <p className="text-xs text-[var(--muted)] truncate">
                          {featuredStory.role_or_company} · {featuredStory.location}
                        </p>
                      </div>
                    </div>

                    <Link
                      to="/book"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#D92B25] hover:underline shrink-0 whitespace-nowrap"
                    >
                      <span>Book Grade</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </article>
            )}

            {/* Supporting Stories Grid */}
            {secondaryStories.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {secondaryStories.map((story) => (
                  <article
                    key={story.id}
                    className="warm-card overflow-hidden flex flex-col justify-between"
                  >
                    <div>
                      <button
                        type="button"
                        onClick={() => setSelectedStory(story)}
                        aria-label={`View project photo for ${story.project_title || story.author_name}`}
                        className="group relative block w-full aspect-[4/3] overflow-hidden bg-[#0F1F5C] text-left cursor-pointer"
                      >
                        <VisualPlate
                          imageUrl={resolveStoryPhoto(story)}
                          variant="project"
                          title={story.project_title || story.author_name}
                          alt={`${story.project_title || 'Concrete project'} in ${story.location}`}
                          width={800}
                          height={600}
                          className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#081238]/80 via-transparent to-transparent pointer-events-none" />
                        <div className="absolute inset-x-0 bottom-0 p-4 flex items-end justify-between gap-2 text-white">
                          <div className="min-w-0">
                            <p className="text-[11px] font-medium text-[#FFC93C] truncate tabular-nums">
                              {story.location}
                              {story.volume_note ? ` · ${story.volume_note}` : ''}
                            </p>
                            <h3 className="font-display font-bold text-sm text-white truncate">
                              {story.project_title}
                            </h3>
                          </div>
                          <span className="p-1.5 rounded-lg bg-white/15 backdrop-blur-xs text-white shrink-0">
                            <Camera className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </button>

                      <div className="p-6 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <StarRow rating={story.rating} size="sm" />
                            <span className="font-slab font-bold text-xs text-[#0F1F5C] dark:text-[#FFC93C] tabular-nums">
                              {story.rating.toFixed(1)}
                            </span>
                          </div>
                          <span className="text-xs text-[var(--muted)] truncate">
                            {story.segment || 'Residential'}
                            {story.grade_used ? ` · ${story.grade_used}` : ''}
                          </span>
                        </div>

                        <p className="text-sm text-[var(--text)] leading-relaxed">
                          &ldquo;{story.quote}&rdquo;
                        </p>
                      </div>
                    </div>

                    <div className="px-6 pb-5 pt-3 border-t border-[#D7E4FF] dark:border-[#264096] flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#EAF1FF] dark:bg-[#0F1F5C] text-[#1F3FA8] dark:text-[#FFC93C] font-display font-bold text-xs flex items-center justify-center shrink-0">
                        {getInitials(story.author_name)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-display font-bold text-xs text-[#0F1F5C] dark:text-white truncate">
                          {story.author_name}
                        </p>
                        <p className="text-xs text-[var(--muted)] truncate">
                          {story.role_or_company} · {story.location}
                        </p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Project Photo & Story Detail Lightbox */}
      {selectedStory && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="story-lightbox-title"
          className="fixed inset-0 z-[9998] flex items-center justify-center bg-[#081238]/80 backdrop-blur-xs p-4"
          onClick={() => setSelectedStory(null)}
        >
          <div
            className="w-full max-w-2xl rounded-[20px] bg-[var(--surface)] border border-[#D7E4FF] dark:border-[#264096] overflow-hidden shadow-2xl max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-[4/3] bg-[#0F1F5C]">
              <VisualPlate
                imageUrl={resolveStoryPhoto(selectedStory)}
                variant="project"
                title={selectedStory.project_title || selectedStory.author_name}
                alt={`${selectedStory.project_title || 'Project pour'} in ${selectedStory.location}`}
                width={1200}
                height={900}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => setSelectedStory(null)}
                aria-label="Close project photo"
                className="absolute top-3 right-3 p-2 rounded-full bg-[#0F1F5C]/80 hover:bg-[#0F1F5C] text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <StarRow rating={selectedStory.rating} size="md" />
                  <span className="font-slab font-bold text-sm text-[#0F1F5C] dark:text-[#FFC93C] tabular-nums">
                    {selectedStory.rating.toFixed(1)} / 5.0
                  </span>
                </div>
                <span className="text-xs text-[var(--muted)] tabular-nums">
                  {selectedStory.segment || 'Residential'}
                  {selectedStory.grade_used ? ` · ${selectedStory.grade_used}` : ''}
                  {selectedStory.volume_note ? ` · ${selectedStory.volume_note}` : ''}
                </span>
              </div>

              <h3
                id="story-lightbox-title"
                className="font-display font-bold text-xl text-[#0F1F5C] dark:text-white"
              >
                {selectedStory.project_title || `${selectedStory.location} Project`}
              </h3>

              <p className="text-sm sm:text-base text-[var(--text)] leading-relaxed">
                &ldquo;{selectedStory.quote}&rdquo;
              </p>

              <div className="pt-4 border-t border-[#D7E4FF] dark:border-[#264096] flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="font-display font-bold text-sm text-[#0F1F5C] dark:text-white">
                    {selectedStory.author_name}
                  </p>
                  <p className="text-xs text-[var(--muted)]">
                    {selectedStory.role_or_company} · {selectedStory.location}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <Link
                    to="/quote"
                    onClick={() => setSelectedStory(null)}
                    className="rounded-lg border border-[#D7E4FF] dark:border-[#264096] px-4 py-2 text-xs font-semibold text-[#0F1F5C] dark:text-white hover:border-[#1F3FA8]"
                  >
                    Request Quote
                  </Link>
                  <Link
                    to="/book"
                    onClick={() => setSelectedStory(null)}
                    className="rounded-lg bg-[#D92B25] hover:bg-[#B9221D] text-white px-4 py-2 text-xs font-semibold inline-flex items-center gap-1.5"
                  >
                    <span>Book Similar Pour</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Rate Your Pour / Submit Review Modal */}
      {reviewModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="rate-pour-modal-title"
          className="fixed inset-0 z-[9998] flex items-center justify-center bg-[#081238]/75 backdrop-blur-xs p-4"
          onClick={() => setReviewModalOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-[20px] bg-[var(--surface)] border border-[#D7E4FF] dark:border-[#264096] p-6 sm:p-7 shadow-2xl max-h-[92vh] overflow-y-auto space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-[#D92B25]">Client Feedback</p>
                <h3
                  id="rate-pour-modal-title"
                  className="font-display font-bold text-xl text-[#0F1F5C] dark:text-white"
                >
                  Rate Your Concrete Pour
                </h3>
                <p className="text-xs text-[var(--muted)] mt-0.5">
                  Share your project rating to help fellow builders across Ranebennur &amp; Davangere.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReviewModalOpen(false)}
                aria-label="Close review form"
                className="p-1.5 rounded-full text-[var(--muted)] hover:bg-[#EAF1FF] dark:hover:bg-[#1F3FA8] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              <input
                type="text"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                className="hidden"
                tabIndex={-1}
                aria-hidden="true"
              />

              {/* Star Rating Picker */}
              <div className="rounded-xl bg-[var(--bg)] border border-[#D7E4FF] dark:border-[#264096] p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-[#0F1F5C] dark:text-white">
                    Overall Rating
                  </span>
                  <span className="text-xs font-semibold text-[#1F3FA8] dark:text-[#FFC93C] tabular-nums">
                    {activeStarPreview}/5 — {RATING_LABELS[activeStarPreview]}
                  </span>
                </div>
                <div className="flex items-center gap-1.5" role="radiogroup" aria-label="Star rating">
                  {[1, 2, 3, 4, 5].map((starVal) => {
                    const filled = starVal <= activeStarPreview;
                    return (
                      <button
                        key={starVal}
                        type="button"
                        role="radio"
                        aria-checked={rating === starVal}
                        aria-label={`${starVal} ${starVal === 1 ? 'star' : 'stars'}`}
                        onMouseEnter={() => setHoverRating(starVal)}
                        onMouseLeave={() => setHoverRating(null)}
                        onClick={() => setRating(starVal)}
                        className="p-1.5 rounded-lg hover:bg-[#EAF1FF] dark:hover:bg-[#1F3FA8] transition-colors cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
                      >
                        <Star
                          className={`w-7 h-7 transition-transform ${
                            filled
                              ? 'fill-[#FFC93C] text-[#D99B00] scale-105'
                              : 'fill-transparent text-[#B6CBFA] dark:text-[#264096]'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#0F1F5C] dark:text-slate-200 mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="e.g. Anand Hiremath"
                    className="w-full rounded-lg border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3 py-2 text-sm focus:border-[#1F3FA8] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0F1F5C] dark:text-slate-200 mb-1">
                    Role / Company
                  </label>
                  <input
                    type="text"
                    value={roleOrCompany}
                    onChange={(e) => setRoleOrCompany(e.target.value)}
                    placeholder="e.g. Homeowner / Civil Contractor"
                    className="w-full rounded-lg border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3 py-2 text-sm focus:border-[#1F3FA8] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#0F1F5C] dark:text-slate-200 mb-1">
                    Project Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                    placeholder="e.g. First-Floor Roof Slab"
                    className="w-full rounded-lg border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3 py-2 text-sm focus:border-[#1F3FA8] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0F1F5C] dark:text-slate-200 mb-1">
                    City / Site Location *
                  </label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Ranebennur"
                    className="w-full rounded-lg border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3 py-2 text-sm focus:border-[#1F3FA8] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#0F1F5C] dark:text-slate-200 mb-1">
                    Sector
                  </label>
                  <select
                    value={segment}
                    onChange={(e) =>
                      setSegment(
                        e.target.value as
                          | 'Residential'
                          | 'Commercial'
                          | 'Industrial'
                          | 'Infrastructure'
                      )
                    }
                    className="w-full rounded-lg border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3 py-2 text-sm focus:border-[#1F3FA8] focus:outline-none"
                  >
                    <option value="Residential">Residential</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Industrial">Industrial</option>
                    <option value="Infrastructure">Infrastructure</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0F1F5C] dark:text-slate-200 mb-1">
                    Concrete / Product
                  </label>
                  <input
                    type="text"
                    value={gradeUsed}
                    onChange={(e) => setGradeUsed(e.target.value)}
                    placeholder="e.g. M25 Slab Concrete"
                    className="w-full rounded-lg border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3 py-2 text-sm focus:border-[#1F3FA8] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0F1F5C] dark:text-slate-200 mb-1">
                    Volume (Optional)
                  </label>
                  <input
                    type="text"
                    value={volumeNote}
                    onChange={(e) => setVolumeNote(e.target.value)}
                    placeholder="e.g. 24 m³"
                    className="w-full rounded-lg border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3 py-2 text-sm focus:border-[#1F3FA8] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F1F5C] dark:text-slate-200 mb-1">
                  Your Feedback *
                </label>
                <textarea
                  rows={3}
                  required
                  value={quote}
                  onChange={(e) => setQuote(e.target.value)}
                  placeholder="How were the arrival timing, concrete consistency, and site placement?"
                  className="w-full rounded-lg border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3 py-2 text-sm focus:border-[#1F3FA8] focus:outline-none"
                />
              </div>

              {submitError && (
                <p className="text-xs font-medium text-[#D92B25]" role="alert">
                  {submitError}
                </p>
              )}
              {submitSuccess && (
                <p className="text-xs font-semibold text-[#16A34A] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{submitSuccess}</span>
                </p>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewModalOpen(false)}
                  className="rounded-lg border border-[#D7E4FF] dark:border-[#264096] px-4 py-2 text-xs font-semibold text-[var(--muted)] hover:text-[#0F1F5C] dark:hover:text-white cursor-pointer min-h-[40px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-[#D92B25] hover:bg-[#B9221D] disabled:opacity-60 text-white px-5 py-2 text-xs font-semibold cursor-pointer min-h-[40px]"
                >
                  {submitting ? 'Submitting...' : 'Submit Rating & Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
