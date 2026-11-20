import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ArrowRight,
  ChevronDown,
  Globe,
  Mail,
  Menu,
  MessageCircle,
  Moon,
  Phone,
  Sun,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { buildWhatsAppUrl, cleanPhoneDigits, isPlaceholderValue } from '../utils/documents.ts';
import { ConnectForm } from './ConnectForm.tsx';
import { BrandLogo } from './BrandLogo.tsx';

function SocialGlyph({ name }: { name: 'facebook' | 'instagram' | 'youtube' | 'whatsapp' | 'linkedin' }) {
  switch (name) {
    case 'facebook':
      return (
        <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-current" aria-hidden="true">
          <path d="M13.5 22v-8h2.7l.4-3h-3.1V9.1c0-.9.3-1.5 1.6-1.5h1.7V4.9c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.4-4 4.1V11H8v3h2.4v8h3.1Z" />
        </svg>
      );
    case 'instagram':
      return (
        <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'youtube':
      return (
        <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-current" aria-hidden="true">
          <path d="M21.6 7.2a2.7 2.7 0 0 0-1.9-1.9C18 4.8 12 4.8 12 4.8s-6 0-7.7.5a2.7 2.7 0 0 0-1.9 1.9A28.4 28.4 0 0 0 2 12a28.4 28.4 0 0 0 .4 4.8 2.7 2.7 0 0 0 1.9 1.9c1.7.5 7.7.5 7.7.5s6 0 7.7-.5a2.7 2.7 0 0 0 1.9-1.9A28.4 28.4 0 0 0 22 12a28.4 28.4 0 0 0-.4-4.8ZM10 15.2V8.8l5.5 3.2L10 15.2Z" />
        </svg>
      );
    case 'whatsapp':
      return (
        <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-current" aria-hidden="true">
          <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.1-1.3A10 10 0 1 0 12 2Zm5.8 14.1c-.2.7-1.4 1.3-2 1.4-.5.1-1.2.1-1.9-.1-.5-.2-1.1-.4-1.9-.7-3.3-1.4-5.4-4.8-5.6-5-.2-.2-1.3-1.8-1.3-3.4s.8-2.4 1.1-2.7c.3-.3.7-.4.9-.4h.6c.2 0 .5 0 .7.6.3.6.9 2.2 1 2.4.1.2.1.4 0 .6-.1.2-.2.4-.3.5l-.5.6c-.2.2-.3.4-.1.7.2.3.9 1.5 2 2.4 1.4 1.2 2.5 1.6 2.9 1.7.3.1.5.1.7-.1.2-.2.9-1 1.1-1.3.2-.3.5-.3.8-.2.3.1 2.1 1 2.4 1.2.4.2.6.3.7.4.1.2.1.8-.1 1.5Z" />
        </svg>
      );
    case 'linkedin':
      return (
        <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-current" aria-hidden="true">
          <path d="M6.9 8.5H3.6V20h3.3V8.5Zm.2-3.4a1.9 1.9 0 1 0-3.8 0 1.9 1.9 0 0 0 3.8 0ZM20.4 13.4c0-3.1-1.7-4.9-4.3-4.9-1.9 0-2.9 1-3.4 1.8V8.5H9.5c0 1 .1 11.5 0 11.5h3.2v-6.4c0-.3 0-.7.1-.9.3-.7.9-1.4 1.9-1.4 1.3 0 2 1 2 2.5V20H20v-6.6Z" />
        </svg>
      );
  }
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { data, lang, setLang, theme, toggleTheme, enquiryModalOpen, setEnquiryModalOpen, t } =
    useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileAccordion, setMobileAccordion] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 84);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setOpenDropdown(null);
  }, [location.pathname]);

  const biz = data?.businessConfig;
  const products = (data?.products || []).filter((p) => p.isOffered);
  const rmcProducts = products.filter((p) => p.unitType !== 'pieces');

  const phoneDisplay = biz?.phone || '+91 73378 07372';
  const emailDisplay = biz?.email || 'myconcretektl@gmail.com';
  const whatsappDisplay = biz?.whatsapp || biz?.phone || '+91 73378 07372';

  const phoneHref = `tel:+${cleanPhoneDigits(phoneDisplay)}`;
  const whatsappHref = buildWhatsAppUrl(
    whatsappDisplay,
    'Hi MY CONCRETE, I would like to enquire about ready-mix concrete.'
  );

  const isAdminRoute = location.pathname.startsWith('/admin');
  if (isAdminRoute) {
    return <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">{children}</div>;
  }

  const isHome = location.pathname === '/';
  const pathname = location.pathname;

  const isPathActive = (prefix: string, exact = false) =>
    exact ? pathname === prefix : pathname === prefix || pathname.startsWith(`${prefix}/`);

  const activeNavClass =
    'relative after:absolute after:left-0 after:right-0 after:-bottom-1.5 after:h-[3px] after:rounded-full after:bg-[#D92B25] text-white';
  const inactiveNavClass = 'text-white/95 hover:text-[#FFC93C] transition-colors';

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)]">
      {/* A) TOP BAR: Solid brand blue #1F3FA8 (~84px desktop, compact mobile) */}
      <header className="bg-[#1F3FA8] text-white relative z-40">
        {/* Desktop Top Bar */}
        <div className="hidden lg:flex max-w-[1440px] mx-auto px-6 xl:px-12 h-[84px] items-center justify-between gap-6">
          <Link to="/" className="shrink-0" aria-label="MY CONCRETE Home">
            <BrandLogo onWhitePlate plateSize="topbar" />
          </Link>

          <div className="flex items-center gap-8 text-[15px] font-sans">
            <a
              href={phoneHref}
              className="inline-flex items-center gap-2.5 text-white hover:text-[#FFC93C] transition-colors whitespace-nowrap"
            >
              <span className="w-7 h-7 rounded-[6px] border border-white/75 flex items-center justify-center shrink-0">
                <Phone className="w-3.5 h-3.5" />
              </span>
              <span className="tabular-nums font-medium">{phoneDisplay}</span>
            </a>

            <a
              href={`mailto:${emailDisplay}`}
              className="inline-flex items-center gap-2.5 text-white hover:text-[#FFC93C] transition-colors whitespace-nowrap"
            >
              <span className="w-7 h-7 rounded-[6px] border border-white/75 flex items-center justify-center shrink-0">
                <Mail className="w-3.5 h-3.5" />
              </span>
              <span className="font-medium">{emailDisplay}</span>
            </a>

            <div className="flex items-center gap-4">
              {biz?.facebookUrl && !isPlaceholderValue(biz.facebookUrl) && (
                <a
                  href={biz.facebookUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Facebook"
                  className="text-white hover:text-[#FFC93C] transition-colors"
                >
                  <SocialGlyph name="facebook" />
                </a>
              )}
              {biz?.instagramUrl && !isPlaceholderValue(biz.instagramUrl) && (
                <a
                  href={biz.instagramUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Instagram"
                  className="text-white hover:text-[#FFC93C] transition-colors"
                >
                  <SocialGlyph name="instagram" />
                </a>
              )}
              {biz?.youtubeUrl && !isPlaceholderValue(biz.youtubeUrl) && (
                <a
                  href={biz.youtubeUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="YouTube"
                  className="text-white hover:text-[#FFC93C] transition-colors"
                >
                  <SocialGlyph name="youtube" />
                </a>
              )}
              {whatsappDisplay && !isPlaceholderValue(whatsappDisplay) && (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="WhatsApp"
                  className="text-white hover:text-[#FFC93C] transition-colors"
                >
                  <SocialGlyph name="whatsapp" />
                </a>
              )}
              {biz?.linkedinUrl && !isPlaceholderValue(biz.linkedinUrl) && (
                <a
                  href={biz.linkedinUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="LinkedIn"
                  className="text-white hover:text-[#FFC93C] transition-colors"
                >
                  <SocialGlyph name="linkedin" />
                </a>
              )}
            </div>

            <div className="flex items-center gap-2 pl-2 border-l border-white/25">
              <button
                type="button"
                onClick={() => setLang(lang === 'en' ? 'kn' : 'en')}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/40 hover:border-[#FFC93C] text-xs font-medium text-white hover:text-[#FFC93C] transition-colors whitespace-nowrap"
              >
                <Globe className="w-3.5 h-3.5 text-[#FFC93C]" />
                <span>{lang === 'en' ? 'ಕನ್ನಡ' : 'English'}</span>
              </button>
              <button
                type="button"
                onClick={toggleTheme}
                aria-label="Toggle light or dark theme"
                className="p-1.5 rounded-full border border-white/30 hover:border-[#FFC93C] text-[#FFC93C] transition-colors"
              >
                {theme === 'light' ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Top Bar: logo left, call + lang + hamburger right */}
        <div className="lg:hidden px-4 h-16 flex items-center justify-between gap-2">
          <Link to="/" className="shrink-0" aria-label="MY CONCRETE Home">
            <BrandLogo onWhitePlate compact />
          </Link>

          <div className="flex items-center gap-2">
            <a
              href={phoneHref}
              aria-label="Call MY CONCRETE"
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/60 px-2.5 py-1.5 text-xs font-semibold text-white hover:border-[#FFC93C]"
            >
              <Phone className="w-3.5 h-3.5 text-[#FFC93C]" />
              <span>{t('callNow')}</span>
            </a>
            <button
              type="button"
              onClick={() => setLang(lang === 'en' ? 'kn' : 'en')}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-white/40 text-white"
            >
              {lang === 'en' ? 'KN' : 'EN'}
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
              className="p-2 rounded-lg border border-white/40 text-white"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* B) MAIN MENU BAR (Desktop): Floating inset bar overlapping hero top; fixed full-width with compact logo on scroll */}
      {scrolled && (
        <div className={`hidden lg:block ${isHome ? 'h-[28px]' : 'h-[56px]'}`} aria-hidden="true" />
      )}

      <div
        className={`hidden lg:block z-40 transition-all duration-200 ${
          scrolled
            ? 'fixed top-0 inset-x-0 bg-[#0F1F5C] shadow-[0_10px_30px_-6px_rgba(15,31,92,0.55)]'
            : `relative px-6 xl:px-12 ${isHome ? '-mb-7' : ''}`
        }`}
      >
        <nav
          aria-label="Primary navigation"
          className={`bg-[#0F1F5C] text-white h-[56px] flex items-center justify-between gap-4 transition-all ${
            scrolled
              ? 'max-w-[1440px] mx-auto px-6 xl:px-10'
              : 'max-w-[1344px] mx-auto px-5 xl:px-7 rounded-[10px] shadow-[0_14px_34px_-8px_rgba(15,31,92,0.48)]'
          }`}
        >
          {scrolled && (
            <Link to="/" className="shrink-0 mr-2" aria-label="MY CONCRETE Home">
              <BrandLogo onWhitePlate compact />
            </Link>
          )}

          <div
            className={`flex items-center flex-1 ${
              scrolled ? 'justify-center gap-3 xl:gap-5' : 'justify-between gap-3 xl:gap-6 2xl:gap-8'
            } text-[13px] xl:text-[15px] 2xl:text-[16px] font-medium`}
          >
            <Link
              to="/"
              className={`whitespace-nowrap shrink-0 py-1 ${
                isPathActive('/', true) ? activeNavClass : inactiveNavClass
              }`}
            >
              {t('home')}
            </Link>

            {/* About MY CONCRETE Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setOpenDropdown('about')}
              onMouseLeave={() => setOpenDropdown(null)}
            >
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === 'about' ? null : 'about')}
                className={`inline-flex items-center gap-1 whitespace-nowrap shrink-0 py-2 ${
                  isPathActive('/about') ? activeNavClass : inactiveNavClass
                }`}
              >
                <span>{t('about')}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    openDropdown === 'about' ? 'rotate-180' : ''
                  }`}
                />
              </button>
              <div
                className={`absolute left-0 top-full w-56 rounded-[12px] border border-[#D7E4FF] dark:border-[#264096] border-t-[3px] border-t-[#D92B25] bg-white dark:bg-[#152972] text-[#0F1F5C] dark:text-white shadow-[0_18px_40px_-10px_rgba(15,31,92,0.22)] py-2 z-50 transition-all duration-150 origin-top ${
                  openDropdown === 'about'
                    ? 'opacity-100 translate-y-0 pointer-events-auto'
                    : 'opacity-0 -translate-y-1.5 pointer-events-none'
                }`}
              >
                {[
                  ['/about/story', 'Our Story'],
                  ['/about/why-my-concrete', 'Why MY CONCRETE'],
                  ['/about/plant-location', 'Plant Location'],
                  ['/about/careers', 'Careers'],
                ].map(([to, label]) => (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setOpenDropdown(null)}
                    className="block px-4 py-2 text-sm font-medium hover:bg-[#EAF1FF] dark:hover:bg-[#1F3FA8] hover:text-[#D92B25] transition-colors"
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Customers Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setOpenDropdown('customers')}
              onMouseLeave={() => setOpenDropdown(null)}
            >
              <Link
                to="/customers"
                className={`inline-flex items-center gap-1 whitespace-nowrap shrink-0 py-2 ${
                  isPathActive('/customers') ? activeNavClass : inactiveNavClass
                }`}
              >
                <span>{t('customers')}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    openDropdown === 'customers' ? 'rotate-180' : ''
                  }`}
                />
              </Link>
              <div
                className={`absolute left-0 top-full w-52 rounded-[12px] border border-[#D7E4FF] dark:border-[#264096] border-t-[3px] border-t-[#D92B25] bg-white dark:bg-[#152972] text-[#0F1F5C] dark:text-white shadow-[0_18px_40px_-10px_rgba(15,31,92,0.22)] py-2 z-50 transition-all duration-150 origin-top ${
                  openDropdown === 'customers'
                    ? 'opacity-100 translate-y-0 pointer-events-auto'
                    : 'opacity-0 -translate-y-1.5 pointer-events-none'
                }`}
              >
                {[
                  ['residential', 'Residential'],
                  ['commercial', 'Commercial'],
                  ['government', 'Government'],
                  ['infrastructure', 'Infrastructure'],
                  ['institutions', 'Institutions'],
                  ['industrial', 'Industrial'],
                ].map(([slug, label]) => (
                  <Link
                    key={slug}
                    to={`/customers/${slug}`}
                    onClick={() => setOpenDropdown(null)}
                    className="block px-4 py-2 text-sm font-medium hover:bg-[#EAF1FF] dark:hover:bg-[#1F3FA8] hover:text-[#D92B25] transition-colors"
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Ready Mix Concrete Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setOpenDropdown('products')}
              onMouseLeave={() => setOpenDropdown(null)}
            >
              <Link
                to="/products"
                className={`inline-flex items-center gap-1 whitespace-nowrap shrink-0 py-2 ${
                  isPathActive('/products') && !isPathActive('/products/cement-bricks', true)
                    ? activeNavClass
                    : inactiveNavClass
                }`}
              >
                <span>{t('products')}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    openDropdown === 'products' ? 'rotate-180' : ''
                  }`}
                />
              </Link>
              <div
                className={`absolute left-0 top-full w-64 rounded-[12px] border border-[#D7E4FF] dark:border-[#264096] border-t-[3px] border-t-[#D92B25] bg-white dark:bg-[#152972] text-[#0F1F5C] dark:text-white shadow-[0_18px_40px_-10px_rgba(15,31,92,0.22)] py-2 z-50 transition-all duration-150 origin-top ${
                  openDropdown === 'products'
                    ? 'opacity-100 translate-y-0 pointer-events-auto'
                    : 'opacity-0 -translate-y-1.5 pointer-events-none'
                }`}
              >
                <Link
                  to="/products"
                  onClick={() => setOpenDropdown(null)}
                  className="block px-4 py-2 text-sm font-semibold text-[#D92B25] hover:bg-[#EAF1FF] dark:hover:bg-[#1F3FA8]"
                >
                  All Concrete &amp; Brick Products
                </Link>
                {rmcProducts.map((p) => (
                  <Link
                    key={p.slug}
                    to={`/products/${p.slug}`}
                    onClick={() => setOpenDropdown(null)}
                    className="block px-4 py-2 text-sm font-medium hover:bg-[#EAF1FF] dark:hover:bg-[#1F3FA8] hover:text-[#D92B25] truncate transition-colors"
                  >
                    {p.name}
                  </Link>
                ))}
              </div>
            </div>

            <Link
              to="/products/cement-bricks"
              className={`whitespace-nowrap shrink-0 py-1 ${
                isPathActive('/products/cement-bricks', true) ? activeNavClass : inactiveNavClass
              }`}
            >
              {t('cementBricks')}
            </Link>

            <Link
              to="/partner"
              className={`whitespace-nowrap shrink-0 py-1 ${
                isPathActive('/partner', true) ? activeNavClass : inactiveNavClass
              }`}
            >
              {t('partner')}
            </Link>

            <Link
              to="/media"
              className={`whitespace-nowrap shrink-0 py-1 ${
                isPathActive('/media', true) ? activeNavClass : inactiveNavClass
              }`}
            >
              {t('media')}
            </Link>

            <Link
              to="/blog"
              className={`whitespace-nowrap shrink-0 py-1 ${
                isPathActive('/blog') ? activeNavClass : inactiveNavClass
              }`}
            >
              {t('blog')}
            </Link>

            <Link
              to="/contact"
              className={`whitespace-nowrap shrink-0 py-1 ${
                isPathActive('/contact', true) ? activeNavClass : inactiveNavClass
              }`}
            >
              {t('contact')}
            </Link>

            <Link
              to="/quote"
              className="inline-flex items-center justify-center rounded-full bg-[#D92B25] hover:bg-[#B9221D] text-white px-4 py-1.5 text-[14px] font-semibold shadow-sm hover:-translate-y-0.5 transition-all whitespace-nowrap shrink-0"
            >
              {t('getQuote')}
            </Link>
          </div>
        </nav>
      </div>

      {/* Mobile Full-Screen Slide-In Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-[#0F1F5C] text-white flex flex-col">
          <div className="h-16 px-4 flex items-center justify-between border-b border-white/15 shrink-0">
            <BrandLogo onWhitePlate compact />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleTheme}
                aria-label="Toggle theme"
                className="p-2 rounded-lg border border-white/25 text-[#FFC93C]"
              >
                {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
                className="p-2 rounded-lg border border-white/25 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-2 text-base">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2.5 border-b border-white/10 font-semibold"
            >
              {t('home')}
            </Link>

            {/* About Accordion */}
            <div className="border-b border-white/10">
              <button
                type="button"
                onClick={() => setMobileAccordion(mobileAccordion === 'about' ? null : 'about')}
                className="w-full py-2.5 flex items-center justify-between font-semibold"
              >
                <span>{t('about')}</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    mobileAccordion === 'about' ? 'rotate-180 text-[#FFC93C]' : ''
                  }`}
                />
              </button>
              {mobileAccordion === 'about' && (
                <div className="pb-2 pl-4 space-y-1.5 text-sm text-slate-200">
                  <Link to="/about/story" onClick={() => setMobileMenuOpen(false)} className="block py-1">
                    Our Story
                  </Link>
                  <Link to="/about/why-my-concrete" onClick={() => setMobileMenuOpen(false)} className="block py-1">
                    Why MY CONCRETE
                  </Link>
                  <Link to="/about/plant-location" onClick={() => setMobileMenuOpen(false)} className="block py-1">
                    Plant Location
                  </Link>
                  <Link to="/about/careers" onClick={() => setMobileMenuOpen(false)} className="block py-1">
                    Careers
                  </Link>
                </div>
              )}
            </div>

            {/* Customers Accordion */}
            <div className="border-b border-white/10">
              <button
                type="button"
                onClick={() => setMobileAccordion(mobileAccordion === 'customers' ? null : 'customers')}
                className="w-full py-2.5 flex items-center justify-between font-semibold"
              >
                <span>{t('customers')}</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    mobileAccordion === 'customers' ? 'rotate-180 text-[#FFC93C]' : ''
                  }`}
                />
              </button>
              {mobileAccordion === 'customers' && (
                <div className="pb-2 pl-4 space-y-1.5 text-sm text-slate-200">
                  <Link
                    to="/customers"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-1 text-[#FFC93C]"
                  >
                    {t('allCustomerSectors')}
                  </Link>
                  {[
                    ['residential', 'Residential'],
                    ['commercial', 'Commercial'],
                    ['government', 'Government'],
                    ['infrastructure', 'Infrastructure'],
                    ['institutions', 'Institutions'],
                    ['industrial', 'Industrial'],
                  ].map(([slug, label]) => (
                    <Link
                      key={slug}
                      to={`/customers/${slug}`}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block py-1"
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Ready Mix Concrete Accordion */}
            <div className="border-b border-white/10">
              <button
                type="button"
                onClick={() => setMobileAccordion(mobileAccordion === 'rmc' ? null : 'rmc')}
                className="w-full py-2.5 flex items-center justify-between font-semibold"
              >
                <span>{t('products')}</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    mobileAccordion === 'rmc' ? 'rotate-180 text-[#FFC93C]' : ''
                  }`}
                />
              </button>
              {mobileAccordion === 'rmc' && (
                <div className="pb-2 pl-4 space-y-1.5 text-sm text-slate-200">
                  <Link to="/products" onClick={() => setMobileMenuOpen(false)} className="block py-1 text-[#FFC93C]">
                    All Products Overview
                  </Link>
                  {rmcProducts.map((p) => (
                    <Link
                      key={p.slug}
                      to={`/products/${p.slug}`}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block py-1"
                    >
                      {p.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link
              to="/products/cement-bricks"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2.5 border-b border-white/10 font-semibold"
            >
              {t('cementBricks')}
            </Link>
            <Link
              to="/partner"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2.5 border-b border-white/10 font-semibold"
            >
              {t('partner')}
            </Link>
            <Link
              to="/media"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2.5 border-b border-white/10 font-semibold"
            >
              {t('media')}
            </Link>
            <Link
              to="/blog"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2.5 border-b border-white/10 font-semibold"
            >
              {t('blog')}
            </Link>
            <Link
              to="/contact"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2.5 border-b border-white/10 font-semibold"
            >
              {t('contact')}
            </Link>
            <Link
              to="/track"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2.5 border-b border-white/10 text-sm text-[#FFC93C]"
            >
              {t('trackBooking')}
            </Link>
          </div>

          <div className="p-4 border-t border-white/15 bg-[#0A1644] space-y-3 shrink-0">
            <div className="grid grid-cols-2 gap-3">
              <Link
                to="/book"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg bg-[#1F3FA8] py-3 text-center text-sm font-bold text-white"
              >
                {t('bookDelivery')}
              </Link>
              <Link
                to="/quote"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg bg-[#D92B25] py-3 text-center text-sm font-bold text-white"
              >
                {t('getQuote')}
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <a
                href={phoneHref}
                className="flex items-center justify-center gap-2 rounded-lg border border-white/30 py-3 text-sm font-semibold text-white"
              >
                <Phone className="w-4 h-4 text-[#FFC93C]" />
                <span>Call Plant</span>
              </a>
              <a
                href={whatsappHref}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 rounded-lg bg-[#16A34A] py-3 text-sm font-semibold text-white"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 pb-14 md:pb-0">{children}</main>

      {/* Deep Navy Footer with Red Top Accent Line & Logo on White Plate */}
      <footer className="bg-[#0F1F5C] text-slate-200 border-t-4 border-[#D92B25]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="space-y-4">
            <BrandLogo onWhitePlate compact />
            <p className="text-sm text-slate-300 leading-relaxed">
              {biz?.businessName || 'MY CONCRETE – Readymix Concrete Unit'} · {biz?.tagline || 'All Ready Mix Concrete & Cement Bricks'}. Serving{' '}
              {biz?.region || 'Ranebennur & Davangere'} within {biz?.serviceRadiusKm || 50} km.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <a
                href={biz?.googleReviewUrl || biz?.googleMapsUrl || 'https://share.google/oZzcrYosJ0JYw2tTn'}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full bg-[#FFC93C] text-[#0F1F5C] px-4 py-1.5 text-xs font-bold hover:brightness-105 transition-all"
              >
                <span>Review us on Google</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
              <div className="flex items-center gap-2.5">
                {biz?.facebookUrl && !isPlaceholderValue(biz.facebookUrl) && (
                  <a
                    href={biz.facebookUrl}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="MY CONCRETE Facebook"
                    className="p-2 rounded-full border border-white/25 text-white hover:border-[#FFC93C] hover:text-[#FFC93C] transition-colors"
                  >
                    <SocialGlyph name="facebook" />
                  </a>
                )}
                {biz?.instagramUrl && !isPlaceholderValue(biz.instagramUrl) && (
                  <a
                    href={biz.instagramUrl}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="MY CONCRETE Instagram"
                    className="p-2 rounded-full border border-white/25 text-white hover:border-[#FFC93C] hover:text-[#FFC93C] transition-colors"
                  >
                    <SocialGlyph name="instagram" />
                  </a>
                )}
                {biz?.youtubeUrl && !isPlaceholderValue(biz.youtubeUrl) && (
                  <a
                    href={biz.youtubeUrl}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="MY CONCRETE YouTube"
                    className="p-2 rounded-full border border-white/25 text-white hover:border-[#FFC93C] hover:text-[#FFC93C] transition-colors"
                  >
                    <SocialGlyph name="youtube" />
                  </a>
                )}
                {biz?.linkedinUrl && !isPlaceholderValue(biz.linkedinUrl) && (
                  <a
                    href={biz.linkedinUrl}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="MY CONCRETE LinkedIn"
                    className="p-2 rounded-full border border-white/25 text-white hover:border-[#FFC93C] hover:text-[#FFC93C] transition-colors"
                  >
                    <SocialGlyph name="linkedin" />
                  </a>
                )}
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-display font-semibold text-[#FFC93C] text-sm mb-3">Quick Links & Tools</h4>
            <ul className="space-y-2 text-sm text-slate-300">
              <li><Link to="/book" className="hover:text-white">Book Delivery (24/7)</Link></li>
              <li><Link to="/quote" className="hover:text-white">Get A Quote</Link></li>
              <li><Link to="/site-visit" className="hover:text-white">Book Site / Plant Visit</Link></li>
              <li><Link to="/track" className="hover:text-white">Track / Manage Booking</Link></li>
              <li><Link to="/tools/calculator" className="hover:text-white">Concrete Volume Calculator</Link></li>
              <li><Link to="/tools/brick-calculator" className="hover:text-white">Brick Calculator</Link></li>
              <li><Link to="/tools/plant-locator" className="hover:text-white">Plant Locator</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold text-[#FFC93C] text-sm mb-3">Products & Sectors</h4>
            <ul className="space-y-2 text-sm text-slate-300">
              <li><Link to="/products/standard-grades" className="hover:text-white">Ready-Mix Concrete (M5–M40)</Link></li>
              <li><Link to="/products/cement-bricks" className="hover:text-white">Cement Bricks & Solid Blocks</Link></li>
              <li><Link to="/products/specialty-concrete" className="hover:text-white">Specialty Concrete</Link></li>
              <li><Link to="/products/pump-hire" className="hover:text-white">Pump Hire & Delivery</Link></li>
              <li><Link to="/about/story" className="hover:text-white">Our Story</Link></li>
              <li><Link to="/about/why-my-concrete" className="hover:text-white">Why MY CONCRETE</Link></li>
              <li><Link to="/about/careers" className="hover:text-white">Careers</Link></li>
            </ul>
          </div>

          <div className="space-y-3 text-sm text-slate-300">
            <h4 className="font-display font-semibold text-[#FFC93C] text-sm">Plant Contact</h4>
            <p>{biz?.address}</p>
            <p>
              <a
                href={biz?.googleMapsUrl || 'https://share.google/oZzcrYosJ0JYw2tTn'}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#FFC93C] hover:underline"
              >
                <span>Open Google Maps Location</span>
                <span aria-hidden="true">&rarr;</span>
              </a>
            </p>
            <p className="tabular-nums">
              Phone: <a href={phoneHref} className="hover:text-white font-semibold">{phoneDisplay}</a>
            </p>
            <p>
              Email: <a href={`mailto:${emailDisplay}`} className="hover:text-white">{emailDisplay}</a>
            </p>
            <p className="text-emerald-300 font-medium">{biz?.workingHours}</p>
            <div className="pt-2 flex flex-wrap gap-3">
              <a
                href={whatsappHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full bg-[#16A34A] px-4 py-1.5 text-xs font-semibold text-white hover:brightness-110"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                WhatsApp
              </a>
              <Link
                to="/admin"
                className="inline-flex items-center rounded-full border border-white/25 px-4 py-1.5 text-xs font-medium text-slate-200 hover:text-white hover:border-[#FFC93C]"
              >
                Admin Login
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <p>&copy; {new Date().getFullYear()} MY CONCRETE – Readymix Concrete Unit. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <Link to="/privacy" className="hover:text-white">Privacy Policy</Link>
              <Link to="/disclaimer" className="hover:text-white">Disclaimer</Link>
              <Link to="/owner-guide" className="hover:text-white">Owner Guide</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Desktop Floating Buttons */}
      <div className="hidden md:flex fixed right-5 bottom-6 z-30 flex-col items-end gap-2.5">
        <a
          href={phoneHref}
          className="inline-flex items-center gap-2 rounded-full bg-[#0F1F5C] text-white border border-white/20 px-4 py-2 text-xs font-semibold shadow-lg hover:bg-[#1F3FA8] transition-colors"
        >
          <Phone className="w-3.5 h-3.5 text-[#FFC93C]" />
          <span>Call +91 73378 07372</span>
        </a>
        <a
          href={whatsappHref}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-[#16A34A] text-white px-4 py-2 text-xs font-semibold shadow-lg hover:brightness-110 transition-all"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span>WhatsApp</span>
        </a>
        <Link to="/book" className="group btn-orange-pill animate-gentle-pulse px-4 py-2.5 text-xs">
          <span>{t('bookDelivery')}</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
        <button
          type="button"
          onClick={() => setEnquiryModalOpen(true)}
          className="rounded-full bg-white dark:bg-[#152972] text-[#0F1F5C] dark:text-white border border-[#D7E4FF] dark:border-[#264096] px-4 py-2 text-xs font-semibold shadow-md hover:border-[#D92B25]"
        >
          Connect Now
        </button>
      </div>

      {/* Mobile Sticky Bottom Bar */}
      <div className="md:hidden fixed inset-x-0 bottom-0 z-30 h-12 bg-[#0F1F5C] border-t border-white/15 grid grid-cols-3 text-xs font-semibold text-white">
        <a href={phoneHref} className="flex items-center justify-center gap-1.5 border-r border-white/15">
          <Phone className="w-3.5 h-3.5 text-[#FFC93C]" />
          <span>{t('callNow')}</span>
        </a>
        <a
          href={whatsappHref}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-1.5 border-r border-white/15 text-emerald-400"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span>{t('whatsapp')}</span>
        </a>
        <Link
          to="/book"
          className="flex items-center justify-center bg-gradient-to-r from-[#D92B25] to-[#F0463F] text-white"
        >
          <span>{t('bookNow')}</span>
        </Link>
      </div>

      {/* Connect Now Modal */}
      {enquiryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F1F5C]/65 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-[20px] bg-white dark:bg-[#152972] border border-[#D7E4FF] dark:border-[#264096] p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setEnquiryModalOpen(false)}
              aria-label="Close modal"
              className="absolute right-4 top-4 p-1.5 rounded-full text-[var(--muted)] hover:bg-[#EAF1FF] dark:hover:bg-[#1F3FA8]"
            >
              <X className="w-5 h-5" />
            </button>
            <ConnectForm
              title="Connect With MY CONCRETE"
              compact
              onSuccess={() => {
                setTimeout(() => setEnquiryModalOpen(false), 1800);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
