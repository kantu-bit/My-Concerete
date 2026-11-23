import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, Mail, MapPin, Navigation, Phone } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { useDocumentMeta } from '../utils/seo.ts';
import { ConnectForm } from '../components/ConnectForm.tsx';
import { VisualPlate } from '../components/VisualPlate.tsx';
import { PlantMap } from '../components/PlantMap.tsx';
import { CallLink, CopyPhoneButton, MailLink } from '../components/ContactLinks.tsx';
import { buildWhatsAppUrl } from '../utils/documents.ts';

export function PartnerPage() {
  useDocumentMeta({
    title: 'Partner With Us | MY CONCRETE Ranebennur & Davangere',
    description:
      'Partner with MY CONCRETE as a civil contractor, fleet owner, aggregate supplier, or masonry dealer in Ranebennur and Davangere.',
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 lg:py-16 space-y-10">
      <div className="space-y-3 max-w-3xl">
        <p className="text-xs font-semibold text-[#D92B25]">Business &amp; Supply Partnerships</p>
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-[#0F1F5C] dark:text-white">
          Partner With MY CONCRETE
        </h1>
        <p className="text-base text-[var(--muted)] leading-relaxed">
          We collaborate with civil contractors, builders, real estate developers, fleet owners, and material suppliers across Ranebennur, Davangere, Harihar, and Haveri district.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          {
            title: 'Contractors & Builders',
            desc: '24/7 priority slot scheduling, bulk rate agreements for RMC and cement bricks, and dedicated dispatch coordination.',
          },
          {
            title: 'Fleet & Pump Owners',
            desc: 'Attachment opportunities for transit mixers, brick delivery vehicles, and stationary/boom concrete pumps.',
          },
          {
            title: 'Aggregate & Hardware Dealers',
            desc: 'Bulk masonry block supply partnerships and consistent raw material collaboration at Kotihal.',
          },
        ].map((card) => (
          <div key={card.title} className="warm-card p-5 space-y-2">
            <h2 className="font-display font-bold text-lg text-[#0F1F5C] dark:text-white">{card.title}</h2>
            <p className="text-sm text-[var(--muted)]">{card.desc}</p>
          </div>
        ))}
      </div>

      <div className="warm-card p-6 sm:p-8">
        <ConnectForm type="partner" title="Partnership Enquiry Form" />
      </div>
    </div>
  );
}

export function MediaPage() {
  const { data, lang } = useApp();
  const [filter, setFilter] = useState('All');
  const media = data?.media || [];
  const preferredOrder = ['All', 'Plant', 'Transit Mixers', 'Cement Bricks', 'Project Sites', 'Brand'];
  const dynamicCats = Array.from(new Set(media.map((m) => m.category)));
  const categories = [
    ...preferredOrder.filter((c) => c === 'All' || dynamicCats.includes(c)),
    ...dynamicCats.filter((c) => !preferredOrder.includes(c)),
  ];
  const visible = filter === 'All' ? media : media.filter((m) => m.category === filter);

  useDocumentMeta({
    title: 'Plant & Project Gallery | MY CONCRETE Kotihal, Ranebennur & Davangere',
    description:
      'Real photos of MY CONCRETE twin storage silos, transit mixers, cement bricks yard, slab pours, and brand overview from Kotihal.',
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 lg:py-16 space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-[#D92B25]">Real Kotihal Plant &amp; Site Showcase</p>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-[#0F1F5C] dark:text-white">
            Plant &amp; Project Gallery
          </h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Genuine photography of our Kotihal batching silos, BharatBenz transit mixers, curing brick yard, and structural slab pours.
          </p>
        </div>

        {media.length > 0 && (
          <div className="flex flex-wrap gap-1.5 bg-[var(--surface)] p-1.5 rounded-full border border-[#D7E4FF] dark:border-[#264096]">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setFilter(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                  filter === cat
                    ? 'bg-[#D92B25] text-white'
                    : 'text-[var(--muted)] hover:bg-[var(--bg-soft)]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {visible.length === 0 ? (
        <div className="warm-card p-10 text-center space-y-4">
          <h2 className="font-display font-bold text-xl text-[#0F1F5C] dark:text-white">
            Real Plant &amp; Pour Photos Coming Soon
          </h2>
          <p className="text-sm text-[var(--muted)] max-w-xl mx-auto">
            We only publish genuine site and plant photography approved by MY CONCRETE. Upload real photos of our Kotihal batching plant, cement bricks yard, and transit mixers in{' '}
            <Link to="/admin" className="text-[#D92B25] font-semibold underline">
              Admin &gt; CMS &amp; Gallery
            </Link>
            .
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visible.map((m) => {
            const parts = m.caption.split('|').map((s) => s.trim()).filter(Boolean);
            const primaryCaption = lang === 'kn' && parts[1] ? parts[1] : parts[0] || m.caption;
            const secondaryCaption = lang === 'kn' && parts[1] ? parts[0] : parts[1];
            const isSilos = m.image_url.includes('plant-silos');
            const isSlab = m.image_url.includes('slab-rebar');
            const isPoster = m.image_url.includes('brand-poster');
            const isBricksTall = m.image_url.includes('brick-stacks');
            const isPortrait = isSilos || isSlab || isPoster || isBricksTall;
            const objectPos = isSilos
              ? 'center 40%'
              : isSlab
              ? 'center 60%'
              : isPoster
              ? 'center top'
              : 'center';

            return (
              <article key={m.id} className="group warm-card overflow-hidden flex flex-col">
                <div className="h-64 overflow-hidden bg-[#0F1F5C]">
                  <VisualPlate
                    imageUrl={m.image_url}
                    variant="media"
                    title={m.title}
                    alt={`${m.title} – ${m.category} photo by MY CONCRETE Kotihal`}
                    width={isPortrait ? 960 : 1280}
                    height={isPortrait ? 1280 : 720}
                    objectPosition={objectPos}
                    subtitle={`${m.category} · ${m.published_date}`}
                    className="w-full h-full transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                </div>
                <div className="p-5 space-y-2 flex-1 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <span className="inline-block text-[11px] font-semibold uppercase tracking-wider text-[#D92B25]">
                      {m.category}
                    </span>
                    <h2 className="font-display font-bold text-lg text-[#0F1F5C] dark:text-white leading-snug">
                      {m.title}
                    </h2>
                    <p className="text-sm text-[var(--muted)] leading-relaxed">{primaryCaption}</p>
                    {secondaryCaption && (
                      <p className="text-xs text-[var(--muted)]/85 leading-relaxed pt-1 border-t border-[#EAF1FF] dark:border-[#264096]">
                        {secondaryCaption}
                      </p>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Real Site Concrete Pour Video Showcase */}
      <section className="warm-card p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        <div className="lg:col-span-5 flex justify-center">
          <div className="w-full max-w-[300px] aspect-[9/16] rounded-[18px] overflow-hidden bg-[#0F1F5C] shadow-lg border border-[#D7E4FF] dark:border-[#264096]">
            <video
              controls
              playsInline
              preload="metadata"
              poster="/images/home/mixer-plant-card.webp"
              className="w-full h-full object-cover"
            >
              <source src="/assets/aistudio/VID-20260718-WA0008_47e83764.mp4" type="video/mp4" />
              Your browser does not support video playback.
            </video>
          </div>
        </div>
        <div className="lg:col-span-7 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#D92B25]">
            Live Site Pour Footage
          </p>
          <h2 className="font-display font-bold text-2xl text-[#0F1F5C] dark:text-white">
            On-Site Road &amp; Slab Concrete Placement
          </h2>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            Continuous ready-mix discharge from our Kotihal transit mixer crew directly into prepared road formwork across our Ranebennur &amp; Davangere delivery corridor.
          </p>
          <p className="text-xs text-[var(--muted)]">
            ರಾಣೆಬೆನ್ನೂರು ಮತ್ತು ದಾವಣಗೆರೆ ವ್ಯಾಪ್ತಿಯಲ್ಲಿ ರಸ್ತೆ ಮತ್ತು ಸ್ಲ್ಯಾಬ್ ಕಾಮಗಾರಿಗೆ MY CONCRETE ಟ್ರಾನ್ಸಿಟ್ ಮಿಕ್ಸರ್‌ನಿಂದ ನೇರ ಕಾಂಕ್ರೀಟ್ ಪೂರೈಕೆ.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <Link to="/book" className="btn-orange-pill px-5 py-2.5 text-xs">
              Book Transit Mixer Slot
            </Link>
            <Link
              to="/quote"
              className="rounded-full border border-[#D7E4FF] dark:border-[#264096] px-5 py-2.5 text-xs font-semibold hover:border-[#D92B25]"
            >
              Request Custom Quote
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export function BlogListPage() {
  const { data } = useApp();
  const blogs = data?.blogs || [];

  useDocumentMeta({
    title: 'Concrete & Masonry Blog | MY CONCRETE Ranebennur & Davangere',
    description:
      'Practical guides on M20 vs M25 concrete grades, 24/7 night slab pours, and estimating cement bricks & solid blocks.',
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 lg:py-16 space-y-8">
      <div>
        <p className="text-xs font-semibold text-[#D92B25]">Knowledge Center</p>
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-[#0F1F5C] dark:text-white">
          Technical Articles &amp; Site Guides
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {blogs.map((b) => (
          <Link
            key={b.id}
            to={`/blog/${b.slug}`}
            className="group warm-card p-6 flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2.5">
              <p className="text-xs text-[var(--muted)]">
                {b.category} · {b.published_at} · {b.read_time}
              </p>
              <h2 className="font-display font-bold text-lg text-[#0F1F5C] dark:text-white group-hover:text-[#D92B25] transition-colors">
                {b.title}
              </h2>
              <p className="text-sm text-[var(--muted)] leading-relaxed">{b.excerpt}</p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1F3FA8] dark:text-[#FFC93C]">
              <span>Read Full Guide</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function BlogDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data } = useApp();
  const post = data?.blogs.find((b) => b.slug === slug);

  useDocumentMeta({
    title: post ? `${post.title} | MY CONCRETE Blog` : 'Article | MY CONCRETE',
    description: post?.excerpt || 'Ready-mix concrete engineering article.',
  });

  if (!post) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-4">
        <h1 className="font-display font-bold text-2xl">Article Not Found</h1>
        <Link to="/blog" className="text-[#D92B25] font-semibold hover:underline">
          Back to Blog
        </Link>
      </div>
    );
  }

  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12 lg:py-16 space-y-6">
      <Link
        to="/blog"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--muted)] hover:text-[#D92B25]"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>All Articles</span>
      </Link>

      <header className="space-y-3 border-b border-[#D7E4FF] dark:border-[#264096] pb-6">
        <p className="text-xs text-[var(--muted)]">
          {post.category} · {post.published_at} · {post.read_time} · By {post.author}
        </p>
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-[#0F1F5C] dark:text-white">
          {post.title}
        </h1>
      </header>

      <div className="space-y-4 text-base text-[var(--muted)] leading-relaxed whitespace-pre-line">
        {post.content}
      </div>

      <div className="warm-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-base text-[#0F1F5C] dark:text-white">
            Ready to plan your pour or wall?
          </h2>
          <p className="text-xs text-[var(--muted)]">Calculate volume or brick counts and reserve a 24/7 slot online.</p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Link to="/tools/calculator" className="rounded-full border border-[#D7E4FF] dark:border-[#264096] px-4 py-2 text-xs font-semibold">
            Volume Calc
          </Link>
          <Link to="/tools/brick-calculator" className="rounded-full border border-[#D7E4FF] dark:border-[#264096] px-4 py-2 text-xs font-semibold">
            Brick Calc
          </Link>
          <Link to="/book" className="btn-orange-pill px-4 py-2 text-xs">
            Book Delivery
          </Link>
        </div>
      </div>
    </article>
  );
}

export function ContactPage() {
  const { data } = useApp();
  const biz = data?.businessConfig;
  const plantLocations =
    data?.plantLocations && data.plantLocations.length > 0
      ? data.plantLocations
      : biz
        ? [
            {
              id: 'kotihal',
              name: biz.businessName,
              shortLabel: 'Kotihal',
              address: biz.address,
              city: 'Ranebennur',
              postalCode: '581119',
              lat: biz.plantLat,
              lng: biz.plantLng,
              phone: biz.phone || '+91 73378 07372',
              whatsapp: biz.whatsapp || biz.phone || '+91 73378 07372',
              hours: biz.workingHours || 'Open 24 Hours (All Days)',
              serviceRadiusKm: biz.serviceRadiusKm || 50,
              googleMapsUrl:
                biz.googleMapsUrl ||
                `https://www.google.com/maps/dir/?api=1&destination=${biz.plantLat},${biz.plantLng}`,
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
          ]
        : [];

  useDocumentMeta({
    title: 'Contact Us | MY CONCRETE Kotihal, Ranebennur & Davangere',
    description:
      'Contact MY CONCRETE – Readymix Concrete Unit at Kotihal & Davangere. Open 24 hours on +91 73378 07372 and myconcretektl@gmail.com.',
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 lg:py-16 space-y-10">
      <div className="space-y-2">
        <p className="text-xs font-semibold text-[#D92B25]">24/7 Kotihal &amp; Davangere Dispatch Desk</p>
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-[#0F1F5C] dark:text-white">
          Contact MY CONCRETE
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 space-y-6">
          <div className="warm-card p-6 space-y-4 text-sm">
            <div className="space-y-3">
              {plantLocations.map((loc, idx) => {
                const isRed = loc.pinColor === 'red' || (!loc.isPrimary && loc.pinColor !== 'blue');
                const locDirections =
                  loc.googleMapsUrl ||
                  `https://www.google.com/maps/dir/?api=1&destination=${loc.lat},${loc.lng}`;
                return (
                  <div
                    key={loc.id}
                    className={`flex items-start gap-3 ${
                      idx > 0 ? 'pt-3 border-t border-[#D7E4FF] dark:border-[#264096]' : ''
                    }`}
                  >
                    <span
                      className={`inline-flex items-center justify-center shrink-0 w-6 h-6 rounded-full text-[10px] font-extrabold text-white mt-0.5 ${
                        isRed ? 'bg-[#D92B25]' : 'bg-[#1F3FA8]'
                      }`}
                    >
                      {isRed ? <MapPin className="w-3.5 h-3.5" /> : 'MC'}
                    </span>
                    <div className="space-y-1">
                      <p className="font-semibold text-[#0F1F5C] dark:text-white">{loc.name}</p>
                      <p className="text-[var(--muted)]">{loc.address}</p>
                      <div className="flex flex-wrap items-center gap-3 text-xs pt-0.5">
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
                          className="inline-flex items-center gap-1 font-semibold text-[#1F3FA8] dark:text-[#FFC93C] hover:underline"
                        >
                          <span>Open in Google Maps</span>
                          <span aria-hidden="true">&rarr;</span>
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="space-y-2 pt-2 border-t border-[#D7E4FF] dark:border-[#264096]">
              <CallLink
                phone={biz?.phone || '+91 73378 07372'}
                whatsapp={biz?.whatsapp || biz?.phone || '+91 73378 07372'}
                className="flex items-start gap-3 min-h-[44px] py-1 text-left group hover:text-[#1F3FA8] dark:hover:text-[#FFC93C] transition-colors"
              >
                <Phone className="w-5 h-5 text-[#D92B25] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[#0F1F5C] dark:text-white group-hover:text-[#D92B25] transition-colors">
                    Dispatch Phone / WhatsApp
                  </p>
                  <p className="tabular-nums text-[var(--muted)] group-hover:underline">
                    {biz?.phone || '+91 73378 07372'}
                  </p>
                </div>
              </CallLink>
              <div className="pl-8 flex flex-wrap items-center gap-2">
                <CopyPhoneButton
                  phone={biz?.phone || '+91 73378 07372'}
                  className="border-[#D7E4FF] dark:border-[#264096] text-[#0F1F5C] dark:text-white hover:border-[#1F3FA8]"
                />
                <a
                  href={buildWhatsAppUrl(
                    biz?.whatsapp || biz?.phone || '+91 73378 07372',
                    'Hi MY CONCRETE, I would like to enquire about ready-mix concrete.'
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#16A34A] hover:bg-[#15803D] text-white px-2.5 py-1 text-xs font-semibold transition-colors"
                >
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>
            <MailLink
              email={biz?.email || 'myconcretektl@gmail.com'}
              className="flex items-start gap-3 py-1 text-left group hover:text-[#1F3FA8] dark:hover:text-[#FFC93C] transition-colors"
            >
              <Mail className="w-5 h-5 text-[#D92B25] shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-[#0F1F5C] dark:text-white group-hover:text-[#D92B25] transition-colors">
                  Email
                </p>
                <p className="text-[var(--muted)] group-hover:underline">
                  {biz?.email || 'myconcretektl@gmail.com'}
                </p>
              </div>
            </MailLink>
            <div className="pt-2 border-t border-[#D7E4FF] dark:border-[#264096] flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                Working Hours: {biz?.workingHours}
              </p>
              <div className="flex items-center gap-3 text-xs font-semibold">
                {biz?.facebookUrl && (
                  <a
                    href={biz.facebookUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#1F3FA8] dark:text-[#FFC93C] hover:underline"
                  >
                    Facebook
                  </a>
                )}
                {biz?.instagramUrl && (
                  <a
                    href={biz.instagramUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#D92B25] hover:underline"
                  >
                    Instagram
                  </a>
                )}
              </div>
            </div>
          </div>

          {biz && (
            <PlantMap
              plantLat={biz.plantLat}
              plantLng={biz.plantLng}
              serviceRadiusKm={biz.serviceRadiusKm}
              plantName={biz.businessName}
              plantAddress={biz.address}
              locations={plantLocations}
              googleMapsUrl={biz.googleMapsUrl}
              heightClass="h-64"
            />
          )}
        </div>

        <div className="lg:col-span-7 warm-card p-6 sm:p-8">
          <ConnectForm title="Send an Enquiry" />
        </div>
      </div>

      {/* Embedded Google Maps for Each Dispatch Plant */}
      {plantLocations.length > 0 && (
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold text-[#D92B25]">Google Maps Locations</p>
            <h2 className="font-display font-bold text-2xl text-[#0F1F5C] dark:text-white">
              Our Dispatch Units on Google Maps
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {plantLocations.map((loc) => {
              const isRed = loc.pinColor === 'red' || (!loc.isPrimary && loc.pinColor !== 'blue');
              const locDirections =
                loc.googleMapsUrl ||
                `https://www.google.com/maps/dir/?api=1&destination=${loc.lat},${loc.lng}`;
              const embedSrc = `https://maps.google.com/maps?q=${encodeURIComponent(
                `${loc.lat},${loc.lng}`
              )}&z=14&output=embed`;
              return (
                <div key={loc.id} className="warm-card overflow-hidden flex flex-col">
                  <div className="p-4 border-b border-[#D7E4FF] dark:border-[#264096] flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <span
                        className={`inline-flex items-center justify-center shrink-0 w-7 h-7 rounded-full text-[11px] font-extrabold text-white mt-0.5 ${
                          isRed ? 'bg-[#D92B25]' : 'bg-[#1F3FA8]'
                        }`}
                      >
                        {isRed ? <MapPin className="w-4 h-4" /> : 'MC'}
                      </span>
                      <div>
                        <h3 className="font-display font-bold text-base text-[#0F1F5C] dark:text-white">
                          {loc.name}
                        </h3>
                        <p className="text-xs text-[var(--muted)] mt-0.5">{loc.address}</p>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                          {loc.hours}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="w-full h-64 bg-[#EAF1FF] dark:bg-[#152972]">
                    <iframe
                      title={`Google Map – ${loc.name}`}
                      src={embedSrc}
                      className="w-full h-full border-0"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                  <div className="p-4 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <CallLink
                      phone={loc.phone}
                      whatsapp={loc.whatsapp || loc.phone}
                      className="tabular-nums font-semibold text-[#1F3FA8] dark:text-[#FFC93C] hover:underline"
                    >
                      {loc.phone}
                    </CallLink>
                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href={locDirections}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-full border border-[#D7E4FF] dark:border-[#264096] px-3 py-1.5 font-semibold hover:border-[#D92B25]"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        <span>Get Directions</span>
                      </a>
                      <Link
                        to={`/book?plant=${encodeURIComponent(loc.id)}`}
                        className="btn-orange-pill px-3.5 py-1.5 text-xs"
                      >
                        Book Delivery
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function LegalPage({ kind }: { kind: 'privacy' | 'disclaimer' }) {
  useDocumentMeta({
    title: kind === 'privacy' ? 'Privacy Policy | MY CONCRETE' : 'Disclaimer | MY CONCRETE',
    description:
      kind === 'privacy'
        ? 'How MY CONCRETE handles booking, quote, and enquiry contact information.'
        : 'Indicative pricing, concrete mix specification, and scheduling disclaimers.',
  });

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 lg:py-16 space-y-5">
      <h1 className="font-display font-extrabold text-3xl text-[#0F1F5C] dark:text-white">
        {kind === 'privacy' ? 'Privacy Policy' : 'Pricing & Technical Disclaimer'}
      </h1>
      {kind === 'privacy' ? (
        <div className="space-y-4 text-sm text-[var(--muted)] leading-relaxed">
          <p>
            MY CONCRETE – Readymix Concrete Unit collects customer names, phone numbers, email addresses, site coordinates, and project specifications solely to schedule ready-mix concrete or cement brick deliveries, prepare quotations, and coordinate dispatch support.
          </p>
          <p>
            We do not sell or share your contact details with unrelated third-party marketers. Uploaded project drawings are stored exclusively for structural grade and quantity estimation by our team.
          </p>
        </div>
      ) : (
        <div className="space-y-4 text-sm text-[var(--muted)] leading-relaxed">
          <p>
            All concrete rates per cubic metre, brick rates per piece, distance-based delivery charges, and pump hire estimates displayed on this website are indicative only. Final commercial terms, taxes (GST), and dispatch schedules are confirmed by the MY CONCRETE Kotihal team after reviewing site access and order volume.
          </p>
          <p>
            Concrete and brick calculation tools provide general estimation guidance only and do not substitute for structural drawings certified by a licensed structural engineer.
          </p>
        </div>
      )}
    </div>
  );
}

export function OwnerGuidePage() {
  useDocumentMeta({
    title: 'Owner Launch Guide | MY CONCRETE – Readymix Concrete Unit',
    description: 'Short owner guide and remaining client details checklist for MY CONCRETE.',
  });

  const configured = [
    'Business details set to MY CONCRETE – Readymix Concrete Unit, FM66+2X6 Kotihal (inside Lucky Artificial Sand Industry premises), serving Ranebennur & Davangere (50 km default radius).',
    'Phone & WhatsApp wired to +91 73378 07372 and email alerts set to myconcretektl@gmail.com.',
    '24-hour booking system configured with 12 two-hour day & night windows and double-booking protection.',
    'Full English + Kannada translation toggle, Concrete Volume Calculator (m³), and Cement Brick Calculator (pieces).',
  ];

  const remaining = [
    'Enter your exact per-m³ concrete rates and per-piece cement brick/block rates (plus delivery/pump charges) inside Admin > Products & Rates and Plant Config.',
    'Optionally upload your original logo file to /public/logo.jpeg (transparent PNG/SVG supported) and real photographs of your Kotihal plant, mixers, bricks yard, and completed sites in Admin > CMS & Gallery.',
    'Optionally confirm founding year, plant capacity (m³/hr), mixer count, and pump count in Admin > Plant & Stats (hidden cleanly until entered).',
    'Set a strong ADMIN_PASSWORD, JWT_SECRET, and SMTP_* email credentials in your deployment environment variables.',
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 lg:py-16 space-y-8">
      <div className="space-y-2">
        <h1 className="font-display font-extrabold text-3xl text-[#0F1F5C] dark:text-white">
          Owner Operations Guide
        </h1>
        <p className="text-sm text-[var(--muted)]">
          Manage all bookings, 24/7 slots, rates, photos, and testimonials inside the{' '}
          <Link to="/admin" className="text-[#D92B25] font-semibold underline">
            Admin Console
          </Link>
          .
        </p>
      </div>

      <div className="space-y-3">
        <h2 className="font-display font-bold text-lg text-[#0F1F5C] dark:text-white">Configured &amp; Ready</h2>
        {configured.map((item) => (
          <div key={item} className="warm-card flex items-start gap-2.5 p-4 text-sm">
            <CheckCircle2 className="w-4 h-4 text-[#16A34A] mt-0.5 shrink-0" />
            <span>{item}</span>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <h2 className="font-display font-bold text-lg text-[#0F1F5C] dark:text-white">
          Remaining Items to Confirm in Admin
        </h2>
        {remaining.map((item) => (
          <div key={item} className="warm-card flex items-start gap-2.5 p-4 text-sm">
            <CheckCircle2 className="w-4 h-4 text-[#D92B25] mt-0.5 shrink-0" />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
