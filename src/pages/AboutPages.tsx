import { Link } from 'react-router-dom';
import { CheckCircle2, MapPin, Navigation } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { useDocumentMeta } from '../utils/seo.ts';
import { PlantMap } from '../components/PlantMap.tsx';
import { ConnectForm } from '../components/ConnectForm.tsx';
import { CallLink, MailLink } from '../components/ContactLinks.tsx';
import { CONTACT_CONFIG } from '../config/contact.ts';

function isKnown(val?: string): boolean {
  return Boolean(val && val.trim().length > 0 && !val.includes('[') && !val.includes(']'));
}

export function AboutStoryPage() {
  const { data } = useApp();
  const biz = data?.businessConfig;

  useDocumentMeta({
    title: 'Our Story | MY CONCRETE – Readymix Concrete Unit',
    description:
      'Learn about MY CONCRETE – Readymix Concrete Unit at Kotihal serving Ranebennur and Davangere 24 hours a day with RMC and Cement Bricks.',
  });

  const knownCards = [
    isKnown(biz?.establishedYear) ? { label: 'Established', val: biz!.establishedYear } : null,
    isKnown(biz?.plantCapacity) ? { label: 'Plant Capacity', val: biz!.plantCapacity } : null,
    { label: 'Service Radius', val: `${biz?.serviceRadiusKm || 50} km` },
    { label: 'Operating Hours', val: biz?.workingHours || 'Open 24 Hours (All Days)' },
  ].filter(Boolean) as Array<{ label: string; val: string }>;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 lg:py-16 space-y-10">
      <div className="space-y-3">
        <p className="text-xs font-semibold text-[#D92B25]">About MY CONCRETE</p>
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-[#0F1F5C] dark:text-white">
          Our Story &amp; Regional Commitment
        </h1>
        <p className="text-base text-[var(--muted)] leading-relaxed">
          {biz?.businessName || 'MY CONCRETE – Readymix Concrete Unit'} operates out of{' '}
          <strong>{biz?.address || 'FM66+2X6, Kotihal, Karnataka 581119'}</strong> (inside Lucky Artificial Sand Industry premises, near Ranebennur). We supply all grades of Ready-Mix Concrete and machine-pressed Cement Bricks across{' '}
          {biz?.region || 'Ranebennur & Davangere, Karnataka'}, open 24 hours every day.
        </p>
      </div>

      <div className={`grid grid-cols-1 sm:grid-cols-${Math.min(4, knownCards.length)} gap-5`}>
        {knownCards.map((c) => (
          <div key={c.label} className="warm-card p-5">
            <p className="text-xs text-[var(--muted)]">{c.label}</p>
            <p className="font-display font-bold text-xl mt-1 text-[#0F1F5C] dark:text-white">{c.val}</p>
          </div>
        ))}
      </div>

      <div className="warm-card p-6 sm:p-8 space-y-4">
        <h2 className="font-display font-bold text-xl text-[#0F1F5C] dark:text-white">
          Built Around 24/7 Site Reliability
        </h2>
        <p className="text-sm text-[var(--muted)] leading-relaxed">
          Site-mixed concrete often suffers from inconsistent water additions and uneven aggregate proportioning. Located right inside Lucky Artificial Sand Industry premises at Kotihal, our automated unit pairs graded artificial sand with calibrated weigh-batching—and produces uniform Cement Bricks &amp; Solid Blocks under the same roof.
        </p>
        <div className="pt-2 flex flex-wrap gap-3">
          <Link to="/book" className="btn-orange-pill px-5 py-2.5 text-sm">
            Book Delivery
          </Link>
          <Link
            to="/site-visit"
            className="rounded-full border border-[#D7E4FF] dark:border-[#264096] px-5 py-2.5 text-sm font-semibold hover:border-[#D92B25]"
          >
            Schedule a Plant Visit
          </Link>
        </div>
      </div>

      {/* Sales Leadership & Corporate Office */}
      <div className="warm-card p-6 sm:p-8 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        <div className="md:col-span-6 rounded-[14px] overflow-hidden border border-[#D7E4FF] dark:border-[#264096] shadow-md bg-[#0F1F5C]">
          <img
            src={CONTACT_CONFIG.salesHead.visitingCardImage}
            alt={`Visiting card of ${CONTACT_CONFIG.salesHead.name}, ${CONTACT_CONFIG.salesHead.role} at MY CONCRETE`}
            width={1200}
            height={675}
            loading="lazy"
            decoding="async"
            className="w-full h-auto object-cover"
          />
        </div>
        <div className="md:col-span-6 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#D92B25]">
            Sales Leadership &amp; Corporate Office
          </p>
          <h2 className="font-display font-bold text-2xl text-[#0F1F5C] dark:text-white">
            {CONTACT_CONFIG.salesHead.name}
          </h2>
          <p className="text-sm font-semibold text-[#1F3FA8] dark:text-[#FFC93C]">
            {CONTACT_CONFIG.salesHead.role} · MY CONCRETE
          </p>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            <strong className="text-[#0F1F5C] dark:text-white">Corporate Office:</strong>{' '}
            {CONTACT_CONFIG.corporateOfficeAddress}
          </p>
          <div className="pt-1 flex flex-wrap items-center gap-4 text-sm">
            <CallLink
              phone={CONTACT_CONFIG.phoneDisplay}
              whatsapp={CONTACT_CONFIG.whatsappDisplay}
              className="tabular-nums font-semibold text-[#1F3FA8] dark:text-[#FFC93C] hover:underline"
            >
              {CONTACT_CONFIG.phoneDisplay}
            </CallLink>
            <MailLink
              email={CONTACT_CONFIG.email}
              className="font-semibold text-[#D92B25] hover:underline"
            >
              {CONTACT_CONFIG.email}
            </MailLink>
          </div>
        </div>
      </div>
    </div>
  );
}

export function WhyMyConcretePage() {
  const { data } = useApp();
  const biz = data?.businessConfig;

  useDocumentMeta({
    title: 'Why MY CONCRETE | 24/7 Quality & Dispatch Advantages',
    description:
      'Automated batching, M-sand proportioning, 24-hour 2-hour delivery slots, cement bricks, and pump support in Ranebennur & Davangere.',
  });

  const fleetDetail =
    isKnown(biz?.mixersCount) || isKnown(biz?.pumpsCount)
      ? `Backed by ${isKnown(biz?.mixersCount) ? `${biz?.mixersCount} transit mixers` : 'dedicated mixers'}${
          isKnown(biz?.pumpsCount) ? ` and ${biz?.pumpsCount} concrete pumps` : ''
        } covering ${biz?.serviceRadiusKm || 50} km across Ranebennur & Davangere.`
      : `Dedicated transit-mixer scheduling and concrete pump coordination within ${biz?.serviceRadiusKm || 50} km across Ranebennur & Davangere.`;

  const pillars = [
    {
      title: 'Automated Weigh-Batch Precision',
      text: 'Every batch is weighed by digital load cells for cement, graded artificial sand, washed aggregates, water, and admixtures.',
    },
    {
      title: 'Open 24 Hours (Day & Night Slots)',
      text: 'Reserve any of our 12 two-hour dispatch windows—ideal for cool overnight slab pours without daytime highway traffic.',
    },
    {
      title: 'Kotihal Hub Serving Ranebennur & Davangere',
      text: fleetDetail,
    },
    {
      title: 'Concrete & Cement Bricks Under One Roof',
      text: 'Calculate your exact concrete volume (m³) or brick count (pieces), pick your slot, and track your booking online.',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 lg:py-16 space-y-10">
      <div className="max-w-3xl space-y-3">
        <p className="text-xs font-semibold text-[#D92B25]">Operational Discipline</p>
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-[#0F1F5C] dark:text-white">
          Why Builders Choose MY CONCRETE
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {pillars.map((p) => (
          <div key={p.title} className="warm-card p-6 space-y-2.5">
            <div className="flex items-center gap-2 text-[#D92B25]">
              <CheckCircle2 className="w-5 h-5" />
              <h2 className="font-display font-bold text-lg text-[#0F1F5C] dark:text-white">{p.title}</h2>
            </div>
            <p className="text-sm text-[var(--muted)] leading-relaxed">{p.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PlantLocationPage() {
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
    title: 'Plant Locations & Service Area | MY CONCRETE Kotihal & Davangere',
    description:
      'View MY CONCRETE batching units at Kotihal (near Ranebennur) and Davangere serving Ranebennur, Davangere, Harihar, and Haveri 24 hours.',
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 lg:py-16 space-y-8">
      <div className="space-y-2">
        <p className="text-xs font-semibold text-[#D92B25]">Kotihal &amp; Davangere Dispatch Units</p>
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-[#0F1F5C] dark:text-white">
          Plant Locations &amp; Service Coverage
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-5 space-y-4">
          {plantLocations.map((loc) => {
            const isRed = loc.pinColor === 'red' || (!loc.isPrimary && loc.pinColor !== 'blue');
            const locDirections =
              loc.googleMapsUrl ||
              `https://www.google.com/maps/dir/?api=1&destination=${loc.lat},${loc.lng}`;
            return (
              <div key={loc.id} className="warm-card p-5 space-y-3.5">
                <div className="flex items-start gap-2.5">
                  <span
                    className={`inline-flex items-center justify-center shrink-0 w-7 h-7 rounded-full text-[11px] font-extrabold text-white mt-0.5 ${
                      isRed ? 'bg-[#D92B25]' : 'bg-[#1F3FA8]'
                    }`}
                  >
                    {isRed ? <MapPin className="w-4 h-4" /> : 'MC'}
                  </span>
                  <div>
                    <h2 className="font-display font-bold text-base text-[#0F1F5C] dark:text-white">
                      {loc.name}
                    </h2>
                    <p className="text-sm text-[var(--muted)] mt-1">{loc.address}</p>
                  </div>
                </div>
                <div className="text-xs sm:text-sm space-y-1 text-[var(--muted)] border-t border-[#D7E4FF] dark:border-[#264096] pt-3">
                  <p className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    Hours: {loc.hours}
                  </p>
                  <p className="tabular-nums">Service Radius: {loc.serviceRadiusKm || 50} km</p>
                  <p className="tabular-nums">
                    Phone / WhatsApp:{' '}
                    <CallLink
                      phone={loc.phone || biz?.phone || '+91 73378 07372'}
                      whatsapp={loc.whatsapp || loc.phone || biz?.whatsapp || '+91 73378 07372'}
                      className="font-semibold text-[#1F3FA8] dark:text-[#FFC93C] hover:underline"
                    >
                      {loc.phone || '+91 73378 07372'}
                    </CallLink>
                  </p>
                  <p>
                    Email:{' '}
                    <MailLink
                      email={biz?.email || 'myconcretektl@gmail.com'}
                      className="font-semibold text-[#1F3FA8] dark:text-[#FFC93C] hover:underline"
                    >
                      {biz?.email || 'myconcretektl@gmail.com'}
                    </MailLink>
                  </p>
                </div>
                <div className="flex flex-wrap gap-2.5 pt-1">
                  <a
                    href={locDirections}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-orange-pill px-4 py-2 text-xs"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Get Directions</span>
                  </a>
                  <Link
                    to={`/book?plant=${encodeURIComponent(loc.id)}`}
                    className="btn-blue-pill px-4 py-2 text-xs"
                  >
                    Book Delivery
                  </Link>
                  <Link
                    to="/site-visit"
                    className="rounded-full border border-[#D7E4FF] dark:border-[#264096] px-4 py-2 text-xs font-semibold hover:border-[#D92B25]"
                  >
                    Plant Visit
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        <div className="lg:col-span-7">
          {biz && (
            <PlantMap
              plantLat={biz.plantLat}
              plantLng={biz.plantLng}
              serviceRadiusKm={biz.serviceRadiusKm}
              plantName={biz.businessName}
              plantAddress={biz.address}
              locations={plantLocations}
              googleMapsUrl={biz.googleMapsUrl}
              heightClass="h-[460px]"
            />
          )}
        </div>
      </div>
    </div>
  );
}

export function CareersPage() {
  useDocumentMeta({
    title: 'Careers at MY CONCRETE | Kotihal, Ranebennur & Davangere',
    description:
      'Apply for batching plant operator, brick press operator, QC technician, transit mixer driver, and pump operator roles at MY CONCRETE Kotihal.',
  });

  const openings = [
    { role: 'RMC Batching Plant Operator', location: 'Kotihal Unit (near Ranebennur)', type: 'Day / Night Shifts' },
    { role: 'Cement Brick & Block Machine Operator', location: 'Kotihal Unit', type: 'Full-Time' },
    { role: 'Transit Mixer Driver (Heavy Vehicle License)', location: 'Ranebennur & Davangere', type: 'Day / Night Shifts' },
    { role: 'Concrete Line / Boom Pump Operator', location: 'Ranebennur & Davangere', type: 'Full-Time' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 lg:py-16 space-y-10">
      <div className="space-y-2">
        <p className="text-xs font-semibold text-[#D92B25]">Join Our Plant Team</p>
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-[#0F1F5C] dark:text-white">
          Careers at MY CONCRETE
        </h1>
        <p className="text-sm text-[var(--muted)]">
          We welcome experienced batching operators, brick machine operators, QC staff, pump operators, and licensed mixer drivers from Ranebennur, Davangere, and Kotihal.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {openings.map((job) => (
          <div key={job.role} className="warm-card p-5 space-y-1">
            <p className="text-xs text-[var(--muted)]">{job.location} · {job.type}</p>
            <h2 className="font-display font-bold text-base text-[#0F1F5C] dark:text-white">{job.role}</h2>
          </div>
        ))}
      </div>

      <div className="warm-card p-6 sm:p-8">
        <ConnectForm type="careers" title="Submit Your Application / Interest" />
      </div>
    </div>
  );
}
