import { Link } from 'react-router-dom';
import { CheckCircle2, MapPin, Navigation } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { useDocumentMeta } from '../utils/seo.ts';
import { PlantMap } from '../components/PlantMap.tsx';
import { ConnectForm } from '../components/ConnectForm.tsx';

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

  useDocumentMeta({
    title: 'Plant Location & Service Area | MY CONCRETE Kotihal, Ranebennur',
    description:
      'View MY CONCRETE batching unit at FM66+2X6, Kotihal (inside Lucky Artificial Sand Industry premises), serving Ranebennur and Davangere 24 hours.',
  });

  const directionsUrl =
    biz?.googleMapsUrl ||
    (biz ? `https://www.google.com/maps/dir/?api=1&destination=${biz.plantLat},${biz.plantLng}` : '#');

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 lg:py-16 space-y-8">
      <div className="space-y-2">
        <p className="text-xs font-semibold text-[#D92B25]">Kotihal Plant &amp; Dispatch Yard</p>
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-[#0F1F5C] dark:text-white">
          Plant Location &amp; Service Coverage
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-5 warm-card p-6 space-y-4">
          <div className="flex items-start gap-2.5">
            <MapPin className="w-5 h-5 text-[#D92B25] mt-0.5 shrink-0" />
            <div>
              <h2 className="font-display font-bold text-base text-[#0F1F5C] dark:text-white">
                {biz?.businessName}
              </h2>
              <p className="text-sm text-[var(--muted)] mt-1">{biz?.address}</p>
            </div>
          </div>
          <div className="text-sm space-y-1.5 text-[var(--muted)] border-t border-[#D7E4FF] dark:border-[#264096] pt-4">
            <p>Region: {biz?.region}</p>
            <p className="text-emerald-600 dark:text-emerald-400 font-semibold">
              Working Hours: {biz?.workingHours}
            </p>
            <p className="tabular-nums">Service Radius: {biz?.serviceRadiusKm || 50} km</p>
            <p className="tabular-nums">Phone / WhatsApp: {biz?.phone}</p>
            <p>Email: {biz?.email}</p>
          </div>
          <div className="flex flex-wrap gap-3 pt-2">
            <a
              href={directionsUrl}
              target="_blank"
              rel="noreferrer"
              className="btn-orange-pill px-4 py-2 text-sm"
            >
              <Navigation className="w-4 h-4" />
              <span>Get Directions</span>
            </a>
            <Link
              to="/site-visit"
              className="rounded-full border border-[#D7E4FF] dark:border-[#264096] px-4 py-2 text-sm font-semibold hover:border-[#D92B25]"
            >
              Book Plant Visit
            </Link>
          </div>
        </div>

        <div className="lg:col-span-7">
          {biz && (
            <PlantMap
              plantLat={biz.plantLat}
              plantLng={biz.plantLng}
              serviceRadiusKm={biz.serviceRadiusKm}
              plantName={biz.businessName}
              plantAddress={biz.address}
              googleMapsUrl={biz.googleMapsUrl}
              heightClass="h-[420px]"
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
        <ConnectForm title="Submit Your Application / Interest" />
      </div>
    </div>
  );
}
