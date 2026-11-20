import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, Mail, MapPin, Phone } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { useDocumentMeta } from '../utils/seo.ts';
import { ConnectForm } from '../components/ConnectForm.tsx';
import { VisualPlate } from '../components/VisualPlate.tsx';
import { PlantMap } from '../components/PlantMap.tsx';

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
  const { data } = useApp();
  const [filter, setFilter] = useState('All');
  const media = data?.media || [];
  const categories = ['All', ...Array.from(new Set(media.map((m) => m.category)))];
  const visible = filter === 'All' ? media : media.filter((m) => m.category === filter);

  useDocumentMeta({
    title: 'Media & Plant Gallery | MY CONCRETE Kotihal',
    description:
      'View batching plant infrastructure, cement brick unit, transit mixers, and completed pours from MY CONCRETE Kotihal.',
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 lg:py-16 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-[#D92B25]">Plant &amp; Site Showcase</p>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-[#0F1F5C] dark:text-white">
            Media &amp; Plant Gallery
          </h1>
        </div>

        {media.length > 0 && (
          <div className="flex flex-wrap gap-1.5 bg-[var(--surface)] p-1 rounded-full border border-[#D7E4FF] dark:border-[#264096]">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setFilter(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {visible.map((m) => (
            <div key={m.id} className="warm-card overflow-hidden">
              <div className="h-52">
                <VisualPlate
                  imageUrl={m.image_url}
                  variant="media"
                  title={m.title}
                  subtitle={`${m.category} · ${m.published_date}`}
                />
              </div>
              <div className="p-5 space-y-1.5">
                <p className="text-xs text-[var(--muted)]">
                  {m.category} · {m.published_date}
                </p>
                <h2 className="font-display font-bold text-lg text-[#0F1F5C] dark:text-white">{m.title}</h2>
                <p className="text-sm text-[var(--muted)]">{m.caption}</p>
              </div>
            </div>
          ))}
        </div>
      )}
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

  useDocumentMeta({
    title: 'Contact Us | MY CONCRETE Kotihal, Ranebennur & Davangere',
    description:
      'Contact MY CONCRETE – Readymix Concrete Unit at Kotihal (near Ranebennur). Open 24 hours on +91 73378 07372 and myconcretektl@gmail.com.',
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 lg:py-16 space-y-10">
      <div className="space-y-2">
        <p className="text-xs font-semibold text-[#D92B25]">24/7 Kotihal Dispatch Desk</p>
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-[#0F1F5C] dark:text-white">
          Contact MY CONCRETE
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 space-y-6">
          <div className="warm-card p-6 space-y-4 text-sm">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-[#D92B25] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-[#0F1F5C] dark:text-white">Plant Address</p>
                <p className="text-[var(--muted)]">{biz?.address}</p>
                <a
                  href={biz?.googleMapsUrl || 'https://share.google/oZzcrYosJ0JYw2tTn'}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#1F3FA8] dark:text-[#FFC93C] hover:underline pt-0.5"
                >
                  <span>Open in Google Maps</span>
                  <span aria-hidden="true">&rarr;</span>
                </a>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-[#D92B25] shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-[#0F1F5C] dark:text-white">Dispatch Phone / WhatsApp</p>
                <p className="tabular-nums text-[var(--muted)]">{biz?.phone}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-[#D92B25] shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-[#0F1F5C] dark:text-white">Email</p>
                <p className="text-[var(--muted)]">{biz?.email}</p>
              </div>
            </div>
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
              googleMapsUrl={biz.googleMapsUrl}
              heightClass="h-64"
            />
          )}
        </div>

        <div className="lg:col-span-7 warm-card p-6 sm:p-8">
          <ConnectForm title="Send an Enquiry" />
        </div>
      </div>
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
