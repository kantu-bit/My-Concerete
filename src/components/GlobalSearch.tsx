import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  Calculator,
  Compass,
  Layers,
  Package,
  Search,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';

export type SearchItemCategory = 'products' | 'tools' | 'blogs' | 'pages';

export interface SearchResultItem {
  id: string;
  category: SearchItemCategory;
  categoryLabel: string;
  title: string;
  subtitle: string;
  to: string;
  keywords: string;
}

const TOOL_ITEMS: SearchResultItem[] = [
  {
    id: 'tool-volume-calc',
    category: 'tools',
    categoryLabel: 'Tool Calculator',
    title: 'Concrete Volume Calculator',
    subtitle: 'Calculate slab, beam, column & footing volume in m³ or cft',
    to: '/tools/calculator',
    keywords: 'volume calculator slab beam column footing m3 cft concrete estimator',
  },
  {
    id: 'tool-brick-calc',
    category: 'tools',
    categoryLabel: 'Tool Calculator',
    title: 'Cement Brick & Block Calculator',
    subtitle: 'Estimate 4", 6", 8" solid blocks & cement bricks needed for walls',
    to: '/tools/brick-calculator',
    keywords: 'brick calculator block masonry wall 4 inch 6 inch 8 inch cement bricks',
  },
  {
    id: 'tool-grade-helper',
    category: 'tools',
    categoryLabel: 'Tool Calculator',
    title: 'Concrete Grade Helper',
    subtitle: 'Find the right M5–M40 concrete grade by building application',
    to: '/tools/grade-helper',
    keywords: 'grade helper m5 m10 m15 m20 m25 m30 m35 m40 strength mix selection',
  },
  {
    id: 'tool-plant-locator',
    category: 'tools',
    categoryLabel: 'Plant Tool',
    title: 'Plant Locator & Delivery Radius Checker',
    subtitle: 'Check delivery distance from Kotihal & Davangere RMC units',
    to: '/tools/plant-locator',
    keywords: 'plant locator map kotihal davangere ranebennur distance 50km radius',
  },
];

const QUICK_PAGE_ITEMS: SearchResultItem[] = [
  {
    id: 'page-book',
    category: 'pages',
    categoryLabel: 'Quick Action',
    title: 'Book 24/7 Concrete Delivery',
    subtitle: 'Schedule 2-hour day or night transit mixer dispatch slots',
    to: '/book',
    keywords: 'book delivery slot dispatch 24 hours transit mixer schedule order',
  },
  {
    id: 'page-quote',
    category: 'pages',
    categoryLabel: 'Quick Action',
    title: 'Get a Custom Concrete Quote',
    subtitle: 'Request project pricing for bulk RMC grades or cement bricks',
    to: '/quote',
    keywords: 'quote pricing estimate bulk rate rmc cost',
  },
  {
    id: 'page-track',
    category: 'pages',
    categoryLabel: 'Quick Action',
    title: 'Track / Manage Booking',
    subtitle: 'Check live booking status or reschedule your pour window',
    to: '/track',
    keywords: 'track booking status cancel reschedule mc-2026',
  },
];

const CATEGORY_FILTER_OPTIONS: Array<{ id: 'all' | SearchItemCategory; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'products', label: 'Products' },
  { id: 'tools', label: 'Calculators' },
  { id: 'blogs', label: 'Blog' },
];

function CategoryIcon({ category }: { category: SearchItemCategory }) {
  switch (category) {
    case 'products':
      return <Package className="w-4 h-4 text-[#1F3FA8] dark:text-[#FFC93C] shrink-0" />;
    case 'tools':
      return <Calculator className="w-4 h-4 text-[#D92B25] shrink-0" />;
    case 'blogs':
      return <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />;
    case 'pages':
      return <Compass className="w-4 h-4 text-[#1F3FA8] dark:text-[#FFC93C] shrink-0" />;
  }
}

export function useGlobalSearchItems() {
  const { data } = useApp();

  return useMemo(() => {
    const products = (data?.products || []).filter((p) => p.isOffered);
    const blogs = data?.blogs || [];
    const sectors = data?.customerPages || [];

    const productItems: SearchResultItem[] = products.map((p) => {
      const gradeSummary = (p.grades || []).map((g) => g.grade).join(', ');
      const gradeDetail = (p.grades || [])
        .map((g) => `${g.grade} ${g.strength} ${g.note}`)
        .join(' ');
      return {
        id: `prod-${p.slug}`,
        category: 'products',
        categoryLabel: p.unitType === 'pieces' ? 'Cement Bricks & Blocks' : 'Concrete Product',
        title: p.name,
        subtitle: gradeSummary ? `${p.tagline} · ${gradeSummary}` : p.tagline,
        to: `/products/${p.slug}`,
        keywords: `${p.name} ${p.tagline} ${p.category} ${p.overview} ${gradeDetail} ${(p.uses || []).join(' ')}`,
      };
    });

    const blogItems: SearchResultItem[] = blogs.map((b) => ({
      id: `blog-${b.slug}`,
      category: 'blogs',
      categoryLabel: b.category || 'Technical Blog',
      title: b.title,
      subtitle: `${b.read_time} · ${b.excerpt}`,
      to: `/blog/${b.slug}`,
      keywords: `${b.title} ${b.category} ${b.excerpt} ${b.content} ${b.author}`,
    }));

    const sectorItems: SearchResultItem[] = sectors.map((s) => ({
      id: `sector-${s.slug}`,
      category: 'pages',
      categoryLabel: 'Customer Sector',
      title: `${s.label} Concrete Solutions`,
      subtitle: s.shortDesc,
      to: `/customers/${s.slug}`,
      keywords: `${s.label} ${s.shortDesc} ${s.heroHeadline}`,
    }));

    return [...productItems, ...TOOL_ITEMS, ...blogItems, ...QUICK_PAGE_ITEMS, ...sectorItems];
  }, [data?.products, data?.blogs, data?.customerPages]);
}

function SearchResultsList({
  query,
  activeFilter,
  setActiveFilter,
  results,
  activeIndex,
  setActiveIndex,
  onSelect,
}: {
  query: string;
  activeFilter: 'all' | SearchItemCategory;
  setActiveFilter: (f: 'all' | SearchItemCategory) => void;
  results: SearchResultItem[];
  activeIndex: number;
  setActiveIndex: (idx: number) => void;
  onSelect: (item: SearchResultItem) => void;
}) {
  const groupedOrder: SearchItemCategory[] = ['products', 'tools', 'blogs', 'pages'];
  const groupLabels: Record<SearchItemCategory, string> = {
    products: 'Concrete Products & Grades',
    tools: 'Calculators & Tools',
    blogs: 'Technical Blog Posts',
    pages: 'Pages & Booking',
  };

  let runningIndex = -1;

  return (
    <div className="flex flex-col max-h-[68vh] sm:max-h-[420px]">
      {/* Category Filter Tabs */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-[#EAF1FF] dark:border-[#264096] bg-[#F7FAFF] dark:bg-[#0F1F5C]">
        <div className="flex items-center gap-1 overflow-x-auto">
          {CATEGORY_FILTER_OPTIONS.map((opt) => {
            const active = activeFilter === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setActiveFilter(opt.id);
                  setActiveIndex(0);
                }}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#1F3FA8] text-white'
                    : 'text-[var(--muted)] hover:text-[#0F1F5C] dark:hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
        <span className="text-[11px] text-[var(--muted)] tabular-nums shrink-0">
          {results.length} {results.length === 1 ? 'result' : 'results'}
        </span>
      </div>

      <div className="overflow-y-auto p-2 space-y-3">
        {results.length === 0 ? (
          <div className="py-6 px-4 text-center space-y-3">
            <p className="text-sm font-semibold text-[#0F1F5C] dark:text-white">
              No results found for &ldquo;{query}&rdquo;
            </p>
            <p className="text-xs text-[var(--muted)]">
              Try searching for a grade like M25, Cement Bricks, Volume Calculator, or Slump Testing.
            </p>
            <div className="flex flex-wrap justify-center gap-2 pt-1">
              {TOOL_ITEMS.slice(0, 2).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => onSelect(item)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#D7E4FF] dark:border-[#264096] px-3 py-1.5 text-xs font-semibold text-[#1F3FA8] dark:text-[#FFC93C] hover:border-[#D92B25] cursor-pointer"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>{item.title}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          groupedOrder.map((cat) => {
            const catItems = results.filter((r) => r.category === cat);
            if (catItems.length === 0) return null;
            return (
              <div key={cat} className="space-y-1">
                <p className="px-2.5 text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
                  {groupLabels[cat]}
                </p>
                <div className="space-y-0.5">
                  {catItems.map((item) => {
                    runningIndex += 1;
                    const idx = runningIndex;
                    const highlighted = idx === activeIndex;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onMouseEnter={() => setActiveIndex(idx)}
                        onClick={() => onSelect(item)}
                        className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                          highlighted
                            ? 'bg-[#EAF1FF] dark:bg-[#1F3FA8]/60'
                            : 'hover:bg-[#F7FAFF] dark:hover:bg-[#1F3FA8]/35'
                        }`}
                      >
                        <div className="flex items-start gap-2.5 min-w-0">
                          <div className="mt-0.5">
                            <CategoryIcon category={item.category} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-semibold text-[#0F1F5C] dark:text-white truncate">
                              {item.title}
                            </p>
                            <p className="text-[11px] text-[var(--muted)] truncate">
                              {item.categoryLabel} · {item.subtitle}
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-[#D92B25] shrink-0" />
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="px-3 py-2 border-t border-[#EAF1FF] dark:border-[#264096] bg-[#F7FAFF] dark:bg-[#0F1F5C] flex items-center justify-between text-[11px] text-[var(--muted)]">
        <span>↑↓ Navigate · Enter Open · Esc Close</span>
        <span className="inline-flex items-center gap-1">
          <Layers className="w-3 h-3" />
          <span>Products · Calculators · Blog</span>
        </span>
      </div>
    </div>
  );
}

function filterSearchResults(
  allItems: SearchResultItem[],
  query: string,
  activeFilter: 'all' | SearchItemCategory
): SearchResultItem[] {
  const q = query.trim().toLowerCase();
  const base =
    activeFilter === 'all' ? allItems : allItems.filter((item) => item.category === activeFilter);

  if (!q) {
    if (activeFilter === 'all') {
      // Show balanced quick-access suggestions (top products, calculators, recent blogs)
      return [
        ...allItems.filter((i) => i.category === 'products').slice(0, 3),
        ...allItems.filter((i) => i.category === 'tools').slice(0, 3),
        ...allItems.filter((i) => i.category === 'blogs').slice(0, 2),
      ];
    }
    return base.slice(0, 8);
  }

  const terms = q.split(/\s+/).filter(Boolean);
  return base
    .map((item) => {
      const titleLower = item.title.toLowerCase();
      const hay = `${titleLower} ${item.subtitle.toLowerCase()} ${item.keywords.toLowerCase()} ${item.categoryLabel.toLowerCase()}`;
      const matchesAll = terms.every((t) => hay.includes(t));
      if (!matchesAll) return null;
      let score = 0;
      if (titleLower === q) score += 100;
      else if (titleLower.startsWith(q)) score += 60;
      else if (titleLower.includes(q)) score += 35;
      if (item.category === 'products') score += 10;
      if (item.category === 'tools') score += 8;
      return { item, score };
    })
    .filter((entry): entry is { item: SearchResultItem; score: number } => entry !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map((entry) => entry.item);
}

export function GlobalHeaderSearch({
  variant = 'desktop-inline',
  onNavigateDone,
}: {
  variant?: 'desktop-inline' | 'drawer-inline';
  onNavigateDone?: () => void;
}) {
  const navigate = useNavigate();
  const allItems = useGlobalSearchItems();

  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | SearchItemCategory>('all');
  const [activeIndex, setActiveIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const results = useMemo(
    () => filterSearchResults(allItems, query, activeFilter),
    [allItems, query, activeFilter]
  );

  useEffect(() => {
    setActiveIndex(0);
  }, [query, activeFilter]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  // Global Cmd/Ctrl+K focus shortcut on desktop inline bar when top header is visible
  useEffect(() => {
    if (variant !== 'desktop-inline') return;
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        const el = inputRef.current;
        if (el && el.offsetParent !== null && window.scrollY <= 84) {
          e.preventDefault();
          el.focus();
          setOpen(true);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [variant]);

  function handleSelect(item: SearchResultItem) {
    setOpen(false);
    setQuery('');
    onNavigateDone?.();
    navigate(item.to);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      setOpen(true);
    }
    if (e.key === 'Escape') {
      setOpen(false);
      inputRef.current?.blur();
      return;
    }
    if (results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      const target = results[activeIndex] || results[0];
      if (target) {
        e.preventDefault();
        handleSelect(target);
      }
    }
  }

  const isDrawer = variant === 'drawer-inline';

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative flex items-center">
        <Search
          className={`w-4 h-4 absolute left-3 pointer-events-none ${
            isDrawer ? 'text-[#FFC93C]' : 'text-white/80'
          }`}
        />
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-expanded={open}
          aria-label="Search concrete products, blog posts, or calculators"
          aria-autocomplete="list"
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search M25, bricks, calculators, blog..."
          className={`w-full pl-9 pr-14 py-2 text-xs xl:text-sm rounded-lg transition-colors focus:outline-none ${
            isDrawer
              ? 'bg-[#152972] border border-white/25 text-white placeholder:text-slate-300 focus:border-[#FFC93C] min-h-[44px]'
              : 'bg-white/15 hover:bg-white/20 focus:bg-white text-white focus:text-[#0F1F5C] placeholder:text-white/75 focus:placeholder:text-[#5A6784] border border-white/25 focus:border-[#FFC93C] min-h-[40px]'
          }`}
        />
        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            aria-label="Clear search"
            className={`absolute right-2 p-1 rounded-md cursor-pointer ${
              isDrawer
                ? 'text-slate-300 hover:text-white'
                : 'text-current opacity-75 hover:opacity-100'
            }`}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          !isDrawer && (
            <kbd className="hidden xl:inline-flex items-center px-1.5 py-0.5 rounded bg-white/15 text-[10px] font-mono text-white/85 pointer-events-none absolute right-2.5">
              Ctrl K
            </kbd>
          )
        )}
      </div>

      {open && (
        <div
          role="listbox"
          aria-label="Search results"
          className={`absolute left-0 right-0 top-full mt-2 rounded-[14px] bg-white dark:bg-[#152972] border border-[#D7E4FF] dark:border-[#264096] shadow-2xl overflow-hidden z-[90] text-[#0F1F5C] dark:text-white ${
            isDrawer ? '' : 'min-w-[340px] xl:min-w-[420px]'
          }`}
        >
          <SearchResultsList
            query={query}
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
            results={results}
            activeIndex={activeIndex}
            setActiveIndex={setActiveIndex}
            onSelect={handleSelect}
          />
        </div>
      )}
    </div>
  );
}

export function GlobalSearchModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const allItems = useGlobalSearchItems();

  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | SearchItemCategory>('all');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const results = useMemo(
    () => filterSearchResults(allItems, query, activeFilter),
    [allItems, query, activeFilter]
  );

  useEffect(() => {
    setActiveIndex(0);
  }, [query, activeFilter]);

  useEffect(() => {
    if (!open) return;
    setTimeout(() => inputRef.current?.focus(), 40);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;

  function handleSelect(item: SearchResultItem) {
    setQuery('');
    onClose();
    navigate(item.to);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      const target = results[activeIndex] || results[0];
      if (target) {
        e.preventDefault();
        handleSelect(target);
      }
    }
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Global site search"
      className="fixed inset-0 z-[9999] flex items-start justify-center bg-[#081238]/75 backdrop-blur-xs p-4 pt-12 sm:pt-20"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-[18px] bg-white dark:bg-[#152972] border border-[#D7E4FF] dark:border-[#264096] shadow-2xl overflow-hidden text-[#0F1F5C] dark:text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[#EAF1FF] dark:border-[#264096]">
          <Search className="w-4 h-4 text-[#1F3FA8] dark:text-[#FFC93C] shrink-0" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search concrete products, grades (M25), blogs, calculators..."
            className="flex-1 bg-transparent text-sm text-[#0F1F5C] dark:text-white placeholder:text-[var(--muted)] focus:outline-none min-h-[40px]"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[#0F1F5C] dark:hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close search"
            className="px-2.5 py-1 rounded-lg border border-[#D7E4FF] dark:border-[#264096] text-xs font-semibold text-[var(--muted)] hover:text-[#0F1F5C] dark:hover:text-white cursor-pointer"
          >
            Esc
          </button>
        </div>

        <SearchResultsList
          query={query}
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
          results={results}
          activeIndex={activeIndex}
          setActiveIndex={setActiveIndex}
          onSelect={handleSelect}
        />
      </div>
    </div>,
    document.body
  );
}
