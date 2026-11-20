import bcrypt from 'bcryptjs';
import { db, initSchema } from './db.ts';

export const DEFAULT_BUSINESS_CONFIG = {
  businessName: 'MY CONCRETE – Readymix Concrete Unit',
  shortName: 'MY CONCRETE',
  tagline: 'All Ready Mix Concrete & Cement Bricks',
  region: 'Ranebennur & Davangere, Karnataka',
  address: 'FM66+2X6, Kotihal, Karnataka 581119 (Inside Lucky Artificial Sand Industry Premises, near Ranebennur)',
  phone: '+91 73378 07372',
  whatsapp: '+91 73378 07372',
  email: 'myconcretektl@gmail.com',
  workingHours: 'Open 24 Hours (All Days)',
  serviceRadiusKm: 50,
  establishedYear: '',
  plantCapacity: '',
  mixersCount: '',
  pumpsCount: '',
  plantsCount: '',
  annualVolume: '',
  plantLat: 14.4607,
  plantLng: 75.6633,
  sustainabilityConfirmed: true,
  sustainabilityTitle: 'Consistent Proportioning & Tested Material Discipline',
  sustainabilitySummary:
    'Located inside Lucky Artificial Sand Industry premises at Kotihal, our unit combines graded artificial sand, washed aggregates, and controlled batching for durable slabs and masonry.',
  facebookUrl: 'https://www.facebook.com/MyConcretekotihal',
  instagramUrl: 'https://www.instagram.com/myconcretektl?knvt=cGttbzg1NGJ0N3o3',
  youtubeUrl: '',
  linkedinUrl: '',
  googleMapsUrl: 'https://share.google/oZzcrYosJ0JYw2tTn',
  googleReviewUrl: 'https://share.google/oZzcrYosJ0JYw2tTn',
  baseDeliveryFee: 1500,
  perKmRate: 110,
  freeRadiusKm: 5,
  linePumpCharge: 4500,
  boomPumpCharge: 11500,
};

export const DEFAULT_SCHEDULING_CONFIG = {
  closedDays: [] as number[], // Open 24/7 all days by default
  holidays: [] as string[],
  slots: [
    { id: 'slot-00-02', label: '12:00 AM – 02:00 AM (Night)', isNight: true, maxBookings: 2, maxVolumeM3: 30 },
    { id: 'slot-02-04', label: '02:00 AM – 04:00 AM (Night)', isNight: true, maxBookings: 2, maxVolumeM3: 30 },
    { id: 'slot-04-06', label: '04:00 AM – 06:00 AM (Early)', isNight: true, maxBookings: 3, maxVolumeM3: 45 },
    { id: 'slot-06-08', label: '06:00 AM – 08:00 AM', isNight: false, maxBookings: 4, maxVolumeM3: 60 },
    { id: 'slot-08-10', label: '08:00 AM – 10:00 AM', isNight: false, maxBookings: 4, maxVolumeM3: 60 },
    { id: 'slot-10-12', label: '10:00 AM – 12:00 PM', isNight: false, maxBookings: 4, maxVolumeM3: 60 },
    { id: 'slot-12-14', label: '12:00 PM – 02:00 PM', isNight: false, maxBookings: 3, maxVolumeM3: 45 },
    { id: 'slot-14-16', label: '02:00 PM – 04:00 PM', isNight: false, maxBookings: 3, maxVolumeM3: 45 },
    { id: 'slot-16-18', label: '04:00 PM – 06:00 PM', isNight: false, maxBookings: 4, maxVolumeM3: 60 },
    { id: 'slot-18-20', label: '06:00 PM – 08:00 PM', isNight: false, maxBookings: 3, maxVolumeM3: 45 },
    { id: 'slot-20-22', label: '08:00 PM – 10:00 PM (Night)', isNight: true, maxBookings: 2, maxVolumeM3: 30 },
    { id: 'slot-22-24', label: '10:00 PM – 12:00 AM (Night)', isNight: true, maxBookings: 2, maxVolumeM3: 30 },
  ],
};

export const DEFAULT_MOSAIC_TILES = [
  {
    id: 'tile-std',
    title: 'M5–M40 Grades',
    titleKn: 'M5–M40 ಗ್ರೇಡ್‌ಗಳು',
    subtitle: 'IS-proportioned structural mixes',
    subtitleKn: 'ಎಲ್ಲಾ ಕಟ್ಟಡಗಳಿಗೂ ಸಿದ್ಧ ಮಿಶ್ರಣ',
    to: '/products/standard-grades',
    tone: 'blue' as const,
    visualKey: 'batching-plant',
    imageUrl: '',
  },
  {
    id: 'tile-24h',
    title: 'Open 24 Hours',
    titleKn: '24 ಗಂಟೆ ಸೇವೆ',
    subtitle: 'Day & night 2-hr delivery slots',
    subtitleKn: 'ಹಗಲು ಮತ್ತು ರಾತ್ರಿ ಡೆಲಿವರಿ',
    to: '/book',
    tone: 'red' as const,
    visualKey: 'night-pour',
    imageUrl: '',
  },
  {
    id: 'tile-slab',
    title: 'Slab Concrete',
    titleKn: 'ಸ್ಲ್ಯಾಬ್ ಕಾಂಕ್ರೀಟ್',
    subtitle: 'Smooth finish & pump-ready flow',
    subtitleKn: 'ನಯವಾದ ಮತ್ತು ಬಲಿಷ್ಠ ಸ್ಲ್ಯಾಬ್',
    to: '/products/specialty-concrete',
    tone: 'navy' as const,
    visualKey: 'engineers-site',
    imageUrl: '',
  },
  {
    id: 'tile-bricks',
    title: 'Cement Bricks',
    titleKn: 'ಸಿಮೆಂಟ್ ಇಟ್ಟಿಗೆ',
    subtitle: '4", 6" & 8" solid blocks',
    subtitleKn: '4", 6", 8" ಸಾಲಿಡ್ ಬ್ಲಾಕ್‌ಗಳು',
    to: '/products/cement-bricks',
    tone: 'red' as const,
    visualKey: 'bricks',
    imageUrl: '',
  },
  {
    id: 'tile-scc',
    title: 'Flowing SCC',
    titleKn: 'SCC ಕಾಂಕ್ರೀಟ್',
    subtitle: 'Dense rebar & column fill',
    subtitleKn: 'ದಟ್ಟ ಕಂಬಗಳಿಗೆ ಸುಲಭ ಹರಿವು',
    to: '/products/specialty-concrete',
    tone: 'blue' as const,
    visualKey: 'product-mix',
    imageUrl: '',
  },
  {
    id: 'tile-pump',
    title: 'Pump & Mixers',
    titleKn: 'ಪಂಪ್ ಮತ್ತು ಮಿಕ್ಸರ್',
    subtitle: 'Line & boom pump placement',
    subtitleKn: 'ಎತ್ತರದ ಮಹಡಿಗಳಿಗೆ ಪಂಪ್ ಸೇವೆ',
    to: '/products/pump-hire',
    tone: 'navy' as const,
    visualKey: 'transit-pour',
    imageUrl: '',
  },
  {
    id: 'tile-frc',
    title: 'Fibre Concrete',
    titleKn: 'ಫೈಬರ್ ಕಾಂಕ್ರೀಟ್',
    subtitle: 'Industrial floor slab strength',
    subtitleKn: 'ಕೈಗಾರಿಕಾ ನೆಲಕ್ಕೆ ಬಿರುಕು ರಹಿತ',
    to: '/products/specialty-concrete',
    tone: 'blue' as const,
    visualKey: 'industrial',
    imageUrl: '',
  },
  {
    id: 'tile-region',
    title: '50 km Dispatch',
    titleKn: '50 ಕಿ.ಮೀ ವ್ಯಾಪ್ತಿ',
    subtitle: 'Ranebennur & Davangere hubs',
    subtitleKn: 'ರಾಣೆಬೆನ್ನೂರು ಮತ್ತು ದಾವಣಗೆರೆ',
    to: '/tools/plant-locator',
    tone: 'navy' as const,
    visualKey: 'infrastructure',
    imageUrl: '',
  },
  {
    id: 'tile-custom',
    title: 'Custom Grades',
    titleKn: 'ಕಸ್ಟಮ್ ಗ್ರೇಡ್',
    subtitle: 'M45+ & bulk project quotes',
    subtitleKn: 'M45+ ಮತ್ತು ಬೃಹತ್ ದರ ಪಟ್ಟಿ',
    to: '/quote',
    tone: 'blue' as const,
    visualKey: 'quality-lab',
    imageUrl: '',
  },
];

export const DEFAULT_HERO_SLIDES = [
  {
    id: 'slide-1',
    kicker: 'Ranebennur & Davangere',
    headline: 'STRONG FOUNDATIONS DELIVERED ON TIME',
    headlineKn: 'ಸಮಯಕ್ಕೆ ಸರಿಯಾಗಿ ಬಲಿಷ್ಠ ಅಡಿಪಾಯ ಪೂರೈಕೆ',
    subtext:
      'Automated ready-mix concrete batching from our Kotihal unit inside Lucky Artificial Sand Industry premises.',
    subtextKn:
      'ಕೊಟಿಹಾಳ ಘಟಕದಿಂದ ರಾಣೆಬೆನ್ನೂರು ಮತ್ತು ದಾವಣಗೆರೆಗೆ ನಿಯಂತ್ರಿತ ರೆಡಿ-ಮಿಕ್ಸ್ ಕಾಂಕ್ರೀಟ್ ಪೂರೈಕೆ.',
    ctaPrimary: 'Book Your Concrete Delivery',
    ctaPrimaryKn: 'ಕಾಂಕ್ರೀಟ್ ಡೆಲಿವರಿ ಬುಕ್ ಮಾಡಿ',
    ctaSecondary: 'Get a Free Quote',
    ctaLink: '/book',
    themeStyle: 'light' as const,
    visualKey: 'batching-plant',
    imageUrl: '',
  },
  {
    id: 'slide-2',
    kicker: 'Ranebennur & Davangere',
    headline: 'READY-MIX CONCRETE FOR EVERY BUILD, M5 TO M40',
    headlineKn: 'ಪ್ರತಿ ನಿರ್ಮಾಣಕ್ಕೂ M5 ರಿಂದ M40 ರೆಡಿ-ಮಿಕ್ಸ್ ಕಾಂಕ್ರೀಟ್',
    subtext:
      'Custom mix designs from PCC levelling courses to high-strength structural columns, slabs, and pavements.',
    subtextKn:
      'ಮನೆ ಸ್ಲ್ಯಾಬ್‌ಗಳಿಂದ ಹಿಡಿದು ವಾಣಿಜ್ಯ ಮತ್ತು ಕೈಗಾರಿಕಾ ಕಟ್ಟಡಗಳವರೆಗೆ ನಿಖರ ಗ್ರೇಡ್ ಕಾಂಕ್ರೀಟ್.',
    ctaPrimary: 'Explore Our Concrete Grades',
    ctaPrimaryKn: 'ಕಾಂಕ್ರೀಟ್ ಗ್ರೇಡ್‌ಗಳನ್ನು ನೋಡಿ',
    ctaSecondary: 'Get a Free Quote',
    ctaLink: '/products/standard-grades',
    themeStyle: 'light' as const,
    visualKey: 'engineers-site',
    imageUrl: '',
  },
  {
    id: 'slide-3',
    kicker: 'Ranebennur & Davangere',
    headline: 'OPEN 24 HOURS. DAY OR NIGHT, YOUR POUR IS ON SCHEDULE',
    headlineKn: '24 ಗಂಟೆಗಳ ಸೇವೆ. ಹಗಲು ಅಥವಾ ರಾತ್ರಿ ಸಮಯಕ್ಕೆ ಸರಿಯಾಗಿ ಪೂರೈಕೆ',
    subtext:
      'Book any 2-hour day or overnight slot online for smooth continuous slab pours without daytime traffic delays.',
    subtextKn:
      'ಹಗಲು ಮತ್ತು ರಾತ್ರಿ 2-ಗಂಟೆಯ ಡೆಲಿವರಿ ಸ್ಲಾಟ್‌ಗಳನ್ನು ಆನ್‌ಲೈನ್‌ನಲ್ಲಿ ಸುಲಭವಾಗಿ ಬುಕ್ ಮಾಡಿ.',
    ctaPrimary: 'Schedule a Delivery',
    ctaPrimaryKn: 'ಡೆಲಿವರಿ ಸಮಯ ನಿಗದಿಪಡಿಸಿ',
    ctaSecondary: 'Get a Free Quote',
    ctaLink: '/book',
    themeStyle: 'dark' as const,
    visualKey: 'night-pour',
    imageUrl: '',
  },
  {
    id: 'slide-4',
    kicker: 'Ranebennur & Davangere',
    headline: 'SOLID CEMENT BRICKS FOR SOLID WALLS',
    headlineKn: 'ಬಲಿಷ್ಠ ಗೋಡೆಗಳಿಗಾಗಿ ದೃಢವಾದ ಸಿಮೆಂಟ್ ಇಟ್ಟಿಗೆಗಳು',
    subtext:
      'Uniform machine-pressed cement bricks and 4", 6", and 8" solid concrete blocks with crisp edges and lower mortar waste.',
    subtextKn:
      'ಸಮಾನ ಅಳತೆಯ ಸಿಮೆಂಟ್ ಇಟ್ಟಿಗೆಗಳು ಹಾಗೂ 4", 6", 8" ಸಾಲಿಡ್ ಬ್ಲಾಕ್‌ಗಳು.',
    ctaPrimary: 'Get Bulk Brick Price',
    ctaPrimaryKn: 'ಬೃಹತ್ ಇಟ್ಟಿಗೆ ದರ ಪಡೆಯಿರಿ',
    ctaSecondary: 'Brick Calculator',
    ctaLink: '/quote?product=Cement%20Bricks%20%26%20Solid%20Blocks',
    themeStyle: 'light' as const,
    visualKey: 'bricks',
    imageUrl: '',
  },
  {
    id: 'slide-5',
    kicker: 'Ranebennur & Davangere',
    headline: 'READY-MIX SOLUTIONS FOR EVERY KIND OF PROJECT',
    headlineKn: 'ಪ್ರತಿ ನಿರ್ಮಾಣ ಯೋಜನೆಗೂ ರೆಡಿ-ಮಿಕ್ಸ್ ಪರಿಹಾರಗಳು',
    subtext:
      'Standard structural grades, specialty mixes, 24-hour pump placement, and machine-pressed cement bricks under one roof.',
    subtextKn:
      'ಸ್ಟ್ಯಾಂಡರ್ಡ್ ಗ್ರೇಡ್‌ಗಳು, ವಿಶೇಷ ಕಾಂಕ್ರೀಟ್, 24 ಗಂಟೆಗಳ ಪಂಪ್ ಸೇವೆ ಮತ್ತು ಸಿಮೆಂಟ್ ಇಟ್ಟಿಗೆಗಳು ಒಂದೇ ಸ್ಥಳದಲ್ಲಿ.',
    ctaPrimary: 'Explore Our Products',
    ctaPrimaryKn: 'ನಮ್ಮ ಉತ್ಪನ್ನಗಳನ್ನು ನೋಡಿ',
    ctaSecondary: 'Book Delivery',
    ctaLink: '/products',
    themeStyle: 'mosaic' as const,
    visualKey: 'product-mosaic',
    imageUrl: '',
    mosaicTiles: DEFAULT_MOSAIC_TILES,
  },
];

// Only display stats explicitly entered in Admin (empty by default so no invented numbers appear)
export const DEFAULT_STATS: Array<{ id: string; label: string; value: string; suffix: string; note: string }> = [];

const SEED_PRODUCTS = [
  {
    slug: 'standard-grades',
    name: 'Ready-Mix Concrete (Grades M5–M40)',
    tagline: 'Precision-batched structural and PCC mixes from M5 to M40 (higher grades on request).',
    category: 'Ready Mix Concrete',
    unitType: 'm3',
    isOffered: 1,
    sortOrder: 1,
    overview:
      'Batched at our Kotihal plant near Ranebennur, our standard RMC range covers M5–M15 levelling courses through M20–M40 structural grades for homes, commercial frames, and infrastructure across Ranebennur and Davangere.',
    properties: [
      'Digital weigh-batching with graded artificial sand from Lucky Artificial Sand Industry premises',
      'Calibrated slump for chute discharge or concrete pump placement',
      'Available 24 hours across day and night pour slots',
      'Batch slip provided with every transit mixer trip',
    ],
    uses: [
      'M5 / M7.5 / M10 / M15: PCC beds, levelling courses, and compound wall bases',
      'M20 / M25: Residential footings, columns, plinth beams, and roof slabs',
      'M30 / M35 / M40: Commercial frames, industrial slabs, culverts, and heavy foundations',
    ],
    grades: [
      { grade: 'M10', strength: '10 MPa', slump: '75–100 mm', maxAgg: '20 mm', indicativeRate: 0, note: 'Confirm rate in Admin' },
      { grade: 'M15', strength: '15 MPa', slump: '75–100 mm', maxAgg: '20 mm', indicativeRate: 0, note: 'Confirm rate in Admin' },
      { grade: 'M20', strength: '20 MPa', slump: '100–125 mm', maxAgg: '20 mm', indicativeRate: 0, note: 'Confirm rate in Admin' },
      { grade: 'M25', strength: '25 MPa', slump: '100–125 mm', maxAgg: '20 mm', indicativeRate: 0, note: 'Confirm rate in Admin' },
      { grade: 'M30', strength: '30 MPa', slump: '100–150 mm', maxAgg: '20 mm', indicativeRate: 0, note: 'Confirm rate in Admin' },
      { grade: 'M35', strength: '35 MPa', slump: '125–150 mm', maxAgg: '20 mm', indicativeRate: 0, note: 'Confirm rate in Admin' },
      { grade: 'M40', strength: '40 MPa', slump: '125–150 mm', maxAgg: '20 mm', indicativeRate: 0, note: 'Confirm rate in Admin' },
    ],
    faqs: [
      {
        q: 'Do you supply both Ranebennur and Davangere?',
        a: 'Yes. From our plant at FM66+2X6, Kotihal, we deliver ready-mix concrete across Ranebennur, Davangere, and surrounding towns.',
      },
      {
        q: 'Can I schedule a night concrete pour?',
        a: 'Yes! MY CONCRETE operates 24 hours a day with dedicated 2-hour night delivery windows ideal for large slabs and highway works.',
      },
    ],
  },
  {
    slug: 'cement-bricks',
    name: 'Cement Bricks & Solid Blocks',
    tagline: 'High-density machine-pressed cement bricks and blocks (4", 6", 8") for durable masonry.',
    category: 'Cement Bricks',
    unitType: 'pieces',
    isOffered: 1,
    sortOrder: 2,
    overview:
      'Manufactured at our Kotihal facility using calibrated cement and graded artificial sand, our cement bricks and solid concrete blocks offer clean edges, uniform sizing, and lower mortar consumption for residential, commercial, and industrial walls.',
    properties: [
      'Uniform dimensional accuracy for faster plumb masonry and thinner plastering',
      'High density and low water absorption compared to irregular kiln bricks',
      'Bulk palletized/tractor/truck dispatch across Ranebennur & Davangere',
      'Available in standard modular brick and 4", 6", and 8" solid block sizes',
    ],
    uses: [
      '4-inch Solid Blocks: Internal partition walls and utility enclosures',
      '6-inch Solid Blocks: Load-bearing & exterior infill masonry walls',
      '8-inch Solid Blocks: Compound walls, basement plinths, and industrial sheds',
      'Standard Cement Bricks (9" × 4" × 3"): Traditional residential walling and parapet courses',
    ],
    grades: [
      { grade: 'Standard Cement Brick (9×4×3 in)', strength: 'Solid Masonry', slump: 'Per Piece', maxAgg: 'Fine M-Sand', indicativeRate: 0, note: 'Enter rate/piece in Admin' },
      { grade: '4" Solid Cement Block (16×4×8 in)', strength: 'Partition Wall', slump: 'Per Piece', maxAgg: '6 mm / M-Sand', indicativeRate: 0, note: 'Enter rate/piece in Admin' },
      { grade: '6" Solid Cement Block (16×6×8 in)', strength: 'External Wall', slump: 'Per Piece', maxAgg: '10 mm / M-Sand', indicativeRate: 0, note: 'Enter rate/piece in Admin' },
      { grade: '8" Solid Cement Block (16×8×8 in)', strength: 'Heavy / Compound', slump: 'Per Piece', maxAgg: '12 mm / M-Sand', indicativeRate: 0, note: 'Enter rate/piece in Admin' },
    ],
    faqs: [
      {
        q: 'How do I calculate how many cement bricks or blocks I need?',
        a: 'Use our free Brick Calculator tool to enter wall length, height, and thickness—it calculates exact pieces with wastage and pre-fills your booking.',
      },
      {
        q: 'Can I order cement bricks and ready-mix concrete together?',
        a: 'Yes! Both Ready-Mix Concrete and Cement Bricks are supplied from our Kotihal unit.',
      },
    ],
  },
  {
    slug: 'specialty-concrete',
    name: 'Specialty Concrete (High-Grade, SCC, FRC & Slab Mixes)',
    tagline: 'Custom-engineered concrete including M45+, Self-Compacting, Fibre-Reinforced, and Slab mixes.',
    category: 'Specialty Concrete',
    unitType: 'm3',
    isOffered: 1,
    sortOrder: 3,
    overview:
      'For congested rebar columns, smooth roof slabs, or heavy warehouse and APMC floors in Ranebennur and Davangere, our specialty formulations deliver tailored flow, crack resistance, and early strength.',
    properties: [
      'Self-Compacting Concrete (SCC) for dense reinforcement zones',
      'Fibre-Reinforced Concrete (FRC) for warehouse & cold-storage flooring',
      'Cohesive Slab Mixes calibrated for minimal bleeding and smooth trowelling',
      'High-grade structural mixes above M40 prepared on project specification',
    ],
    uses: [
      'Multi-storey residential and commercial roof slabs',
      'Industrial warehouse floors, godowns, and heavy yards',
      'Shear walls, congested beam-column joints, and culverts',
    ],
    grades: [
      { grade: 'M25 Slab Mix', strength: '25 MPa', slump: '120–150 mm', maxAgg: '20 mm', indicativeRate: 0, note: 'Confirm rate in Admin' },
      { grade: 'M30 FRC (Fibre)', strength: '30 MPa', slump: '100–125 mm', maxAgg: '20 mm', indicativeRate: 0, note: 'Confirm rate in Admin' },
      { grade: 'M35 SCC', strength: '35 MPa', slump: '600+ mm flow', maxAgg: '12.5 mm', indicativeRate: 0, note: 'Confirm rate in Admin' },
      { grade: 'M45+ High Grade', strength: '45+ MPa', slump: '125–160 mm', maxAgg: '20 mm', indicativeRate: 0, note: 'On request' },
    ],
    faqs: [
      {
        q: 'Can you prepare grades above M40?',
        a: 'Yes, M45, M50, and higher grades are batched on request based on structural project drawings.',
      },
    ],
  },
  {
    slug: 'pump-hire',
    name: 'Concrete Pump Hire & Transit-Mixer Delivery',
    tagline: 'Coordinated 24/7 transit-mixer delivery and stationary/boom concrete pump placement.',
    category: 'Pump & Delivery',
    unitType: 'm3',
    isOffered: 1,
    sortOrder: 4,
    overview:
      'Eliminate manual concrete lifting delays with scheduled transit-mixer dispatch and optional line or boom pump placement across Ranebennur, Davangere, and surrounding taluks.',
    properties: [
      '24-hour dispatch slots in 2-hour windows including night pours',
      'Line pumps for narrow residential streets and multi-storey slabs',
      'Boom pump coordination for wide-reach commercial & infrastructure decks',
    ],
    uses: [
      'Multi-storey residential & commercial roof slab pours',
      'Basement rafts and elevated deck slabs',
      'Continuous night-time pours without traffic bottlenecks',
    ],
    grades: [
      { grade: 'Line Pump Placement', strength: 'Placement Service', slump: 'Min 120 mm mix', maxAgg: '20 mm', indicativeRate: 4500, note: 'Editable in Admin' },
      { grade: 'Boom Pump Placement', strength: 'Placement Service', slump: 'Min 120 mm mix', maxAgg: '20 mm', indicativeRate: 11500, note: 'Editable in Admin' },
    ],
    faqs: [
      {
        q: 'Is pump hire available at night?',
        a: 'Yes, pump scheduling is coordinated alongside our 24/7 transit mixer delivery windows.',
      },
    ],
  },
];

const SEED_PROJECTS: Array<Record<string, unknown>> = [];
const SEED_MEDIA: Array<Record<string, unknown>> = [];

const SEED_BLOGS = [
  {
    slug: 'choosing-between-m20-and-m25-concrete-ranebennur-davangere',
    title: 'Choosing Between M20 and M25 Ready-Mix Concrete for Your Home Slab',
    category: 'Technical Guide',
    excerpt:
      'How structural loads and IS 456 guidelines determine the right concrete grade for residential builds in Ranebennur and Davangere.',
    content: `When building a home in Ranebennur or Davangere, choosing between M20 and M25 concrete is one of the first decisions on site.

Under IS 456:2000, M20 (20 MPa compressive strength at 28 days) is the minimum grade for reinforced concrete in mild exposure conditions, while M25 offers added durability, lower permeability, and higher margin for G+1 and G+2 frames.

Use our Concrete Volume Calculator and Grade Helper to plan your exact cubic metres and schedule a day or night delivery slot from our Kotihal unit.`,
    author: 'MY CONCRETE Technical Team',
    readTime: '4 min read',
    publishedAt: '2026-04-10',
    imageUrl: '',
    published: 1,
  },
  {
    slug: 'why-night-rmc-delivery-improves-large-roof-slabs',
    title: 'Why 24/7 & Night Concrete Pours Help Large Slabs Finish Better',
    category: 'Site Operations',
    excerpt:
      'Cooler ambient temperatures and clear highway corridors between Kotihal, Ranebennur, and Davangere make night pours smoother.',
    content: `During warm afternoons in interior Karnataka, rapid surface evaporation can accelerate slump loss during large slab pours.

With MY CONCRETE open 24 hours, contractors can book evening or night 2-hour windows so transit mixers travel smoothly without daytime traffic delays and slabs cure under gentler temperatures.`,
    author: 'MY CONCRETE Dispatch',
    readTime: '3 min read',
    publishedAt: '2026-03-28',
    imageUrl: '',
    published: 1,
  },
  {
    slug: 'cement-bricks-vs-clay-bricks-estimation-guide',
    title: 'Estimating Cement Bricks & Solid Blocks Accurately for Your Walls',
    category: 'Masonry Guide',
    excerpt:
      'How uniform machine-pressed cement bricks and 4", 6", and 8" blocks reduce plaster thickness and speed up construction.',
    content: `Machine-pressed cement bricks and solid blocks offer uniform edges and consistent dimensions compared to uneven clay bricks.

Before ordering, measure each wall's length, height, and thickness (4", 6", or 8") using our online Brick Calculator—including a 5–8% breakage and cutting allowance—and book bulk delivery straight from our Kotihal premises.`,
    author: 'MY CONCRETE Masonry Desk',
    readTime: '3 min read',
    publishedAt: '2026-03-14',
    imageUrl: '',
    published: 1,
  },
];

export const DEFAULT_CUSTOMER_PAGES = [
  {
    slug: 'residential',
    label: 'Residential',
    labelKn: 'ವಸತಿ ನಿರ್ಮಾಣ',
    shortDesc: 'Independent houses, villas, apartments, and compound walls.',
    shortDescKn: 'ಸ್ವಂತ ಮನೆಗಳು, ವಿಲ್ಲಾಗಳು, ಅಪಾರ್ಟ್‌ಮೆಂಟ್ ಮತ್ತು ಕಾಂಪೌಂಡ್ ಗೋಡೆಗಳು.',
    heroHeadline: 'CONCRETE BUILT FOR\nLASTING HOMES &\nRESIDENCES',
    heroHeadlineKn: 'ಬಲಿಷ್ಠ ಮನೆಗಳು ಮತ್ತು\nವಸತಿ ಕಟ್ಟಡಗಳಿಗೆ\nರೆಡಿ ಮಿಕ್ಸ್ ಕಾಂಕ್ರೀಟ್',
    heroImage: '/images/customers/residential-hero.webp',
    heroAlt: 'Residential apartment buildings and homes built with ready-mix concrete',
    cardImage: '/images/customers/residential-card.webp',
    cardAlt: 'Residential homes and villas constructed with MY CONCRETE ready-mix concrete',
    titleBox: 'Reliable Ready-Mix Concrete & Cement Bricks for Home Builders',
    titleBoxKn: 'ಮನೆ ನಿರ್ಮಾಣಕ್ಕೆ ನಂಬಿಕೆಯ ರೆಡಿ ಮಿಕ್ಸ್ ಕಾಂಕ್ರೀಟ್ ಮತ್ತು ಸಿಮೆಂಟ್ ಇಟ್ಟಿಗೆಗಳು',
    introParagraphs: [
      'Building a home is a once-in-a-lifetime milestone for families across Ranebennur, Davangere, and surrounding towns. MY CONCRETE delivers consistently batched ready-mix concrete directly from our Kotihal plant in transit mixers—removing the mess, wastage, and uneven mixing of manual site batching.',
      'From lean PCC bed concrete and column footings to smooth lintels, roof slabs, and solid cement bricks for durable masonry walls, our 24-hour dispatch lets homeowners and engineers plan morning, daytime, or cool-evening pours around site readiness.',
    ],
    introParagraphsKn: [
      'ರಾಣೆಬೆನ್ನೂರು, ದಾವಣಗೆರೆ ಮತ್ತು ಸುತ್ತಮುತ್ತಲಿನ ಕುಟುಂಬಗಳಿಗೆ ಸ್ವಂತ ಮನೆ ನಿರ್ಮಾಣ ಜೀವನದ ಮಹತ್ವದ ಘಟ್ಟವಾಗಿದೆ. MY CONCRETE ಕೊತಿಹಾಳ್ ಪ್ಲಾಂಟ್‌ನಿಂದ ಟ್ರಾನ್ಸಿಟ್ ಮಿಕ್ಸರ್ ಮೂಲಕ ಸಮಾನ ಗುಣಮಟ್ಟದ ಕಾಂಕ್ರೀಟ್ ಅನ್ನು ನೇರವಾಗಿ ನಿವೇಶನಕ್ಕೆ ತಲುಪಿಸುತ್ತದೆ.',
      'ಅಡಿಪಾಯದ PCC ಯಿಂದ ಕಾಲಂ, ಬೀಮ್, ರೂಫ್ ಸ್ಲ್ಯಾಬ್ ಮತ್ತು ಗೋಡೆಗಳಿಗೆ ಬಲಿಷ್ಠ ಸಿಮೆಂಟ್ ಇಟ್ಟಿಗೆಗಳವರೆಗೆ ಎಲ್ಲವನ್ನೂ ಒಂದೇ ಕಡೆ ಪಡೆಯಬಹುದು. 24 ಗಂಟೆಗಳ ಸೇವೆಯಿಂದ ಬೆಳಿಗ್ಗೆ ಅಥವಾ ತಂಪಾದ ರಾತ್ರಿ ಸಮಯದಲ್ಲೂ ಸ್ಲ್ಯಾಬ್ ಸುರಿಯಬಹುದು.',
    ],
    introImage: '',
    visualKey: 'residential',
    applications: [
      {
        icon: 'Home',
        title: 'Independent Houses & Duplexes',
        titleKn: 'ಸ್ವಂತ ಮನೆಗಳು ಮತ್ತು ಡ್ಯೂಪ್ಲೆಕ್ಸ್',
        description: 'Clean single-day slab pours without sand & aggregate heaps blocking residential streets.',
        descriptionKn: 'ಮನೆಯ ಮುಂದೆ ಮರಳು-ಜಲ್ಲಿ ರಾಶಿ ಇಲ್ಲದೆ ಒಂದೇ ದಿನದಲ್ಲಿ ಸ್ವಚ್ಛ ಸ್ಲ್ಯಾಬ್ ಕಾಮಗಾರಿ.',
      },
      {
        icon: 'Building2',
        title: 'G+1 to G+4 Residential Apartments',
        titleKn: 'ವಸತಿ ಅಪಾರ್ಟ್‌ಮೆಂಟ್‌ಗಳು',
        description: 'Pumpable mixes tailored for columns, shear walls, beams, and multi-floor slabs.',
        descriptionKn: 'ಕಾಲಂ, ಬೀಮ್ ಮತ್ತು ಮಹಡಿ ಸ್ಲ್ಯಾಬ್‌ಗಳಿಗೆ ಪಂಪ್ ಮಾಡಲು ಸೂಕ್ತ ಮಿಶ್ರಣ.',
      },
      {
        icon: 'Layers',
        title: 'Foundations, Footings & Plinth Beams',
        titleKn: 'ಅಡಿಪಾಯ, ಫುಟಿಂಗ್ ಮತ್ತು ಪ್ಲಿಂತ್ ಬೀಮ್',
        description: 'Cohesive PCC bed concrete and M20/M25 structural mixes for steady load support.',
        descriptionKn: 'ದೃಢವಾದ ಅಡಿಪಾಯಕ್ಕಾಗಿ PCC ಮತ್ತು M20/M25 ಸ್ಟ್ರಕ್ಚರಲ್ ಕಾಂಕ್ರೀಟ್.',
      },
      {
        icon: 'ArrowUpFromLine',
        title: 'Roof Slabs & Staircase Pours',
        titleKn: 'ರೂಫ್ ಸ್ಲ್ಯಾಬ್ ಮತ್ತು ಮೆಟ್ಟಿಲುಗಳು',
        description: 'Controlled slump retention for smooth trowel finishing and minimal honeycombing.',
        descriptionKn: 'ನಯವಾದ ಫಿನಿಶಿಂಗ್ ಮತ್ತು ಹನಿ-ಕೋಂಬಿಂಗ್ ತಡೆಗೆ ನಿಖರ ಸ್ಲಂಪ್ ನಿಯಂತ್ರಣ.',
      },
      {
        icon: 'Blocks',
        title: 'Masonry Walls with Cement Bricks',
        titleKn: 'ಸಿಮೆಂಟ್ ಇಟ್ಟಿಗೆ ಗೋಡೆಗಳು',
        description: 'Uniform 4", 6", and 8" machine-pressed solid blocks for straighter walls and less plaster.',
        descriptionKn: 'ಸಮಾನ ಅಳತೆಯ 4", 6" ಮತ್ತು 8" ಸಿಮೆಂಟ್ ಬ್ಲಾಕ್‌ಗಳು.',
      },
      {
        icon: 'Route',
        title: 'Driveways, Parking & Compound Walls',
        titleKn: 'ಪಾರ್ಕಿಂಗ್, ಡ್ರೈವ್‌ವೇ ಮತ್ತು ಕಾಂಪೌಂಡ್',
        description: 'Tough surface concrete and compound blockwork suited for daily vehicle movement.',
        descriptionKn: 'ದೈನಂದಿನ ವಾಹನ ಸಂಚಾರಕ್ಕೆ ಬಲಿಷ್ಠ ಪಾರ್ಕಿಂಗ್ ಮತ್ತು ಕಾಂಪೌಂಡ್ ಕಾಂಕ್ರೀಟ್.',
      },
    ],
    recommendedGrades: [
      {
        use: 'Foundation PCC & Levelling Bed',
        useKn: 'ಅಡಿಪಾಯ PCC / ಲೆವೆಲಿಂಗ್ ಬೆಡ್',
        grade: 'M10 / M15',
        notes: 'Non-structural blinding course below footings and flooring.',
        notesKn: 'ಫುಟಿಂಗ್ ಮತ್ತು ನೆಲಹಾಸಿನ ಕೆಳಗಿನ ಸಮತಟ್ಟು ಪದರ.',
      },
      {
        use: 'Footings, Columns, Beams & Slabs (G+1/G+2)',
        useKn: 'ಫುಟಿಂಗ್, ಕಾಲಂ, ಬೀಮ್ ಮತ್ತು ಸ್ಲ್ಯಾಬ್',
        grade: 'M20 / M25',
        notes: 'Standard structural concrete; M25 widely preferred for pumpable slabs.',
        notesKn: 'ಸಾಮಾನ್ಯ ವಸತಿ ಕಟ್ಟಡಗಳ ಸ್ಲ್ಯಾಬ್ ಮತ್ತು ಕಂಬಗಳಿಗೆ ಅತ್ಯುತ್ತಮ.',
      },
      {
        use: 'Heavy Transfer Beams / Multi-Storey Columns',
        useKn: 'ಬಹುಮಹಡಿ ಕಂಬಗಳು ಮತ್ತು ಬೀಮ್‌ಗಳು',
        grade: 'M30 / M35',
        notes: 'Higher early and 28-day strength as specified in structural drawings.',
        notesKn: 'ಹೆಚ್ಚಿನ ಭಾರ ಹೊರುವ ಕಂಬಗಳಿಗೆ ವಿನ್ಯಾಸದಂತೆ ಪೂರೈಕೆ.',
      },
      {
        use: 'Partition & External Load Walls',
        useKn: 'ಹೊರ ಮತ್ತು ಒಳ ಗೋಡೆಗಳ ನಿರ್ಮಾಣ',
        grade: 'Cement Bricks (4"/6"/8")',
        notes: 'Machine-pressed solid cement bricks delivered straight from Kotihal.',
        notesKn: 'ಕೊತಿಹಾಳ್ ಘಟಕದಿಂದ ನೇರವಾಗಿ ಪೂರೈಸುವ ಗಟ್ಟಿ ಸಿಮೆಂಟ್ ಇಟ್ಟಿಗೆಗಳು.',
      },
    ],
    faqs: [
      {
        q: 'What is the minimum concrete quantity I can book for my house slab or footing?',
        qKn: 'ಮನೆ ಸ್ಲ್ಯಾಬ್ ಅಥವಾ ಫುಟಿಂಗ್‌ಗೆ ಕನಿಷ್ಠ ಎಷ್ಟು ಕಾಂಕ್ರೀಟ್ ಬುಕ್ ಮಾಡಬಹುದು?',
        a: 'You can book standard transit mixer loads starting from 3 m³ directly online or call +91 73378 07372 for partial/combined residential pours around Ranebennur and Davangere.',
        aKn: 'ಆನ್‌ಲೈನ್ ಮೂಲಕ ಕನಿಷ್ಠ 3 m³ ನಿಂದ ಬುಕ್ ಮಾಡಬಹುದು. ಸಣ್ಣ ಪ್ರಮಾಣದ ಅಗತ್ಯಗಳಿಗೆ +91 73378 07372 ಗೆ ಕರೆ ಮಾಡಿ.',
      },
      {
        q: 'Can MY CONCRETE arrange a concrete pump for upper-floor roof slabs?',
        qKn: 'ಮೇಲಿನ ಮಹಡಿಯ ಸ್ಲ್ಯಾಬ್‌ಗೆ ಕಾಂಕ್ರೀಟ್ ಪಂಪ್ ವ್ಯವಸ್ಥೆ ಲಭ್ಯವಿದೆಯೇ?',
        a: 'Yes. While booking delivery, you can add a Line Pump or Boom Pump option according to your building height and road access, or request a quick pre-pour site visit.',
        aKn: 'ಹೌದು. ಬುಕಿಂಗ್ ಸಮಯದಲ್ಲೇ ಲೈನ್ ಪಂಪ್ ಅಥವಾ ಬೂಮ್ ಪಂಪ್ ಆಯ್ಕೆ ಮಾಡಬಹುದು ಅಥವಾ ಸೈಟ್ ಭೇಟಿ ಕೇಳಬಹುದು.',
      },
      {
        q: 'Why schedule residential roof slab pours in early morning or night slots?',
        qKn: 'ಮನೆ ಸ್ಲ್ಯಾಬ್ ಅನ್ನು ಮುಂಜಾನೆ ಅಥವಾ ರಾತ್ರಿ ವೇಳೆಯಲ್ಲಿ ಏಕೆ ಸುರಿಯುವುದು ಉತ್ತಮ?',
        a: 'Early morning and evening/night pours reduce daytime sun evaporation, help avoid town traffic delays for transit mixers, and support smoother finishing across the slab.',
        aKn: 'ಬೆಳಗಿನ ಜಾವ ಅಥವಾ ರಾತ್ರಿ ಸುರಿಯುವುದರಿಂದ ಬಿಸಿಲಿನ ತಾಪ ಕಡಿಮೆಯಾಗಿ ಬಿರುಕು ತಡೆಯುತ್ತದೆ ಮತ್ತು ಟ್ರಾಫಿಕ್ ಅಡಚಣೆ ಇರುವುದಿಲ್ಲ.',
      },
      {
        q: 'Can I order both RMC and Cement Bricks together for my house?',
        qKn: 'ಮನೆಗೆ RMC ಮತ್ತು ಸಿಮೆಂಟ್ ಇಟ್ಟಿಗೆ ಎರಡನ್ನೂ ಒಟ್ಟಿಗೆ ಆರ್ಡರ್ ಮಾಡಬಹುದೇ?',
        a: 'Yes. Both Ready-Mix Concrete and 4", 6", and 8" Cement Bricks are supplied from our Kotihal unit—you can get a combined project quote on our Quote page.',
        aKn: 'ಹೌದು. ಎರಡನ್ನೂ ನಮ್ಮ ಕೊತಿಹಾಳ್ ಘಟಕದಿಂದಲೇ ಪಡೆಯಬಹುದು ಮತ್ತು ಒಟ್ಟಿಗೆ ದರ ಪಟ್ಟಿ ಕೇಳಬಹುದು.',
      },
    ],
    gallery: [
      { id: 'res-g1', imageUrl: '', caption: 'Residential Roof Slab Pour with Transit Mixer', captionKn: 'ವಸತಿ ಕಟ್ಟಡದ ರೂಫ್ ಸ್ಲ್ಯಾಬ್ ಕಾಮಗಾರಿ' },
      { id: 'res-g2', imageUrl: '', caption: 'Pumped Column & Beam Concrete Placement', captionKn: 'ಪಂಪ್ ಮೂಲಕ ಕಾಲಂ ಮತ್ತು ಬೀಮ್ ಕಾಂಕ್ರೀಟ್' },
      { id: 'res-g3', imageUrl: '', caption: '4" & 6" Solid Cement Bricks for Home Walls', captionKn: 'ಮನೆ ಗೋಡೆಗಳಿಗೆ 4" ಮತ್ತು 6" ಸಿಮೆಂಟ್ ಇಟ್ಟಿಗೆಗಳು' },
      { id: 'res-g4', imageUrl: '', caption: 'Evening Residential Slab Finishing', captionKn: 'ಸಂಜೆ ವೇಳೆಯ ಸ್ಲ್ಯಾಬ್ ಫಿನಿಶಿಂಗ್' },
    ],
  },
  {
    slug: 'commercial',
    label: 'Commercial',
    labelKn: 'ವಾಣಿಜ್ಯ ಕಟ್ಟಡಗಳು',
    shortDesc: 'Shopping complexes, showrooms, offices, hotels, and warehouses.',
    shortDescKn: 'ಶಾಪಿಂಗ್ ಕಾಂಪ್ಲೆಕ್ಸ್, ಶೋರೂಂ, ಕಚೇರಿ, ಹೋಟೆಲ್ ಮತ್ತು ಗೋದಾಮುಗಳು.',
    heroHeadline: 'ENGINEERED RMC FOR\nCOMMERCIAL SPACES &\nCOMPLEXES',
    heroHeadlineKn: 'ವಾಣಿಜ್ಯ ಸಂಕೀರ್ಣಗಳು\nಮತ್ತು ಕಚೇರಿಗಳಿಗೆ\nನಿಖರ RMC ಪೂರೈಕೆ',
    heroImage: '/images/customers/commercial-hero.webp',
    heroAlt: 'Modern commercial complexes and office buildings built with ready-mix concrete',
    cardImage: '/images/customers/commercial-card.webp',
    cardAlt: 'Commercial showrooms and business spaces constructed with ready-mix concrete',
    titleBox: 'Scheduled Multi-Floor Concrete Supply for Commercial Developments',
    titleBoxKn: 'ವಾಣಿಜ್ಯ ಕಟ್ಟಡಗಳಿಗೆ ಸಮಯಕ್ಕೆ ಸರಿಯಾಗಿ ಬಹುಮಹಡಿ ಕಾಂಕ್ರೀಟ್ ಪೂರೈಕೆ',
    introParagraphs: [
      'Commercial complexes, retail showrooms, office buildings, hotels, and multi-bay warehouses demand strict schedule adherence and repeatable cube strength across every floor. Delays at site cost contractors labour hours and crane time.',
      'With MY CONCRETE operating 24 hours a day from Kotihal, commercial project managers across Ranebennur and Davangere can lock in dedicated 2-hour dispatch windows—including night pours on busy main-road plots where daytime mixer parking is restricted.',
    ],
    introParagraphsKn: [
      'ಶಾಪಿಂಗ್ ಕಾಂಪ್ಲೆಕ್ಸ್, ಶೋರೂಂ, ಕಚೇರಿ, ಹೋಟೆಲ್ ಮತ್ತು ಗೋದಾಮುಗಳ ನಿರ್ಮಾಣಕ್ಕೆ ಪ್ರತಿ ಮಹಡಿಯಲ್ಲೂ ಒಂದೇ ರೀತಿಯ ಶಕ್ತಿ ಮತ್ತು ಸಮಯಪಾಲನೆ ಅಗತ್ಯವಿರುತ್ತದೆ.',
      'ಕೊತಿಹಾಳ್‌ನಿಂದ 24 ಗಂಟೆಯೂ ಕಾರ್ಯನಿರ್ವಹಿಸುವ MY CONCRETE, ಮುಖ್ಯ ರಸ್ತೆಯ ಕಾಮಗಾರಿಗಳಿಗೆ ರಾತ್ರಿ ವೇಳೆಯಲ್ಲೂ ಸಮಯಕ್ಕೆ ಸರಿಯಾಗಿ ಟ್ರಾನ್ಸಿಟ್ ಮಿಕ್ಸರ್ ಪೂರೈಸುತ್ತದೆ.',
    ],
    introImage: '',
    visualKey: 'commercial',
    applications: [
      {
        icon: 'Store',
        title: 'Retail Complexes & Showrooms',
        titleKn: 'ಶಾಪಿಂಗ್ ಕಾಂಪ್ಲೆಕ್ಸ್ ಮತ್ತು ಶೋರೂಂಗಳು',
        description: 'Wide-span slab mixes and smooth floor screeds built for high customer footfall.',
        descriptionKn: 'ಹೆಚ್ಚಿನ ಗ್ರಾಹಕರ ಓಡಾಟಕ್ಕೆ ತಕ್ಕಂತೆ ಬಲಿಷ್ಠ ಸ್ಲ್ಯಾಬ್ ಮತ್ತು ನೆಲಹಾಸು.',
      },
      {
        icon: 'Building',
        title: 'Office Buildings & Business Parks',
        titleKn: 'ಕಚೇರಿ ಕಟ್ಟಡಗಳು',
        description: 'Consistent M25–M40 structural concrete for lift shafts, columns, and floor plates.',
        descriptionKn: 'ಲಿಫ್ಟ್ ಶಾಫ್ಟ್, ಕಾಲಂ ಮತ್ತು ಸ್ಲ್ಯಾಬ್‌ಗಳಿಗೆ M25–M40 ಗ್ರೇಡ್ ಕಾಂಕ್ರೀಟ್.',
      },
      {
        icon: 'Warehouse',
        title: 'Warehouses & Commercial Godowns',
        titleKn: 'ಗೋದಾಮುಗಳು ಮತ್ತು ವೇರ್‌ಹೌಸ್‌ಗಳು',
        description: 'Hard-wearing M25/M30 floor slabs designed for racking loads and material handling.',
        descriptionKn: 'ಸರಕು ಶೇಖರಣೆ ಮತ್ತು ಫೋರ್ಕ್‌ಲಿಫ್ಟ್ ಚಲನೆಗೆ ಗಟ್ಟಿ ನೆಲಹಾಸು.',
      },
      {
        icon: 'Hotel',
        title: 'Hotels, Wedding Halls & Lodges',
        titleKn: 'ಹೋಟೆಲ್ ಮತ್ತು ಕಲ್ಯಾಣ ಮಂಟಪಗಳು',
        description: 'Continuous pumpable concrete for long-span convention roofs and basement parking.',
        descriptionKn: 'ದೊಡ್ಡ ಹಾಲ್ ಸ್ಲ್ಯಾಬ್ ಮತ್ತು ಬೇಸ್‌ಮೆಂಟ್ ಪಾರ್ಕಿಂಗ್ ಕಾಮಗಾರಿಗೆ.',
      },
      {
        icon: 'Car',
        title: 'Basement & Podium Parking Decks',
        titleKn: 'ಬೇಸ್‌ಮೆಂಟ್ ಪಾರ್ಕಿಂಗ್ ಡೆಕ್‌ಗಳು',
        description: 'Dense low-permeability mixes for retaining walls, ramps, and podium slabs.',
        descriptionKn: 'ರಿಟೇನಿಂಗ್ ವಾಲ್ ಮತ್ತು ರ‍್ಯಾಂಪ್‌ಗಳಿಗೆ ದಟ್ಟವಾದ ಕಾಂಕ್ರೀಟ್.',
      },
      {
        icon: 'Clock',
        title: 'Night-Window Main Road Pours',
        titleKn: 'ಮುಖ್ಯ ರಸ್ತೆಯಲ್ಲಿ ರಾತ್ರಿ ಕಾಮಗಾರಿ',
        description: '24/7 dispatch avoids town traffic bottlenecks during continuous multi-mixer pours.',
        descriptionKn: 'ಟ್ರಾಫಿಕ್ ಕಿರಿಕಿರಿ ಇಲ್ಲದೆ ರಾತ್ರಿ ವೇಳೆ ನಿರಂತರ ಕಾಂಕ್ರೀಟ್ ಪೂರೈಕೆ.',
      },
    ],
    recommendedGrades: [
      {
        use: 'Lean Sub-Base / Basement Levelling',
        useKn: 'ಬೇಸ್‌ಮೆಂಟ್ ಲೆವೆಲಿಂಗ್ PCC',
        grade: 'M10 / M15',
        notes: 'Uniform base layer prior to waterproofing and raft reinforcement.',
        notesKn: 'ವಾಟರ್‌ಪ್ರೂಫಿಂಗ್ ಮತ್ತು ರಾಫ್ಟ್ ಅಡಿಪಾಯದ ಕೆಳ ಪದರ.',
      },
      {
        use: 'Commercial Slabs, Beams & Parking Decks',
        useKn: 'ವಾಣಿಜ್ಯ ಸ್ಲ್ಯಾಬ್ ಮತ್ತು ಪಾರ್ಕಿಂಗ್ ಡೆಕ್',
        grade: 'M25 / M30',
        notes: 'Pump-friendly cohesiveness with consistent 28-day strength.',
        notesKn: 'ಪಂಪಿಂಗ್‌ಗೆ ಸುಲಭ ಹಾಗೂ ದೀರ್ಘಕಾಲ ಬಾಳಿಕೆ ಬರುವ ಗ್ರೇಡ್.',
      },
      {
        use: 'Heavy Columns, Lift Cores & Long-Span Girders',
        useKn: 'ಭಾರೀ ಕಂಬಗಳು ಮತ್ತು ಲಿಫ್ಟ್ ಕೋರ್',
        grade: 'M35 / M40',
        notes: 'High-strength structural grades or SCC for congested steel zones.',
        notesKn: 'ದಟ್ಟ ಕಬ್ಬಿಣದ ಕಂಬಗಳಿಗೆ ಹೆಚ್ಚಿನ ಶಕ್ತಿಯ ಕಾಂಕ್ರೀಟ್ ಅಥವಾ SCC.',
      },
      {
        use: 'Commercial Partition & Staircase Enclosures',
        useKn: 'ವಾಣಿಜ್ಯ ವಿಭಾಗೀಯ ಗೋಡೆಗಳು',
        grade: 'Cement Bricks (6"/8")',
        notes: 'Fast-laying machine-pressed solid blocks for neat service shafts.',
        notesKn: 'ವೇಗದ ಗೋಡೆ ನಿರ್ಮಾಣಕ್ಕೆ ಸಮಾನ ಗಾತ್ರದ ಸಿಮೆಂಟ್ ಬ್ಲಾಕ್‌ಗಳು.',
      },
    ],
    faqs: [
      {
        q: 'How do you handle continuous commercial pours needing multiple transit mixers?',
        qKn: 'ದೊಡ್ಡ ವಾಣಿಜ್ಯ ಸ್ಲ್ಯಾಬ್‌ಗಳಿಗೆ ನಿರಂತರ ಟ್ರಾನ್ಸಿಟ್ ಮಿಕ್ಸರ್ ಪೂರೈಕೆ ಹೇಗೆ ಮಾಡುತ್ತೀರಿ?',
        a: 'We sequence mixer dispatch across your booked 2-hour slots so concrete reaches continuously without cold joints, paired with site pump coordination.',
        aKn: 'ಬುಕ್ ಮಾಡಿದ ಸ್ಲಾಟ್‌ಗಳಲ್ಲಿ ಸರಣಿ ರೂಪದಲ್ಲಿ ಮಿಕ್ಸರ್‌ಗಳನ್ನು ಕಳುಹಿಸಿ ಕೋಲ್ಡ್ ಜಾಯಿಂಟ್ ಆಗದಂತೆ ನೋಡಿಕೊಳ್ಳುತ್ತೇವೆ.',
      },
      {
        q: 'Are night pours available for shops and complexes on busy roads?',
        qKn: 'ಜನನಿಬಿಡ ಮುಖ್ಯ ರಸ್ತೆಯ ಕಟ್ಟಡಗಳಿಗೆ ರಾತ್ರಿ ಕಾಂಕ್ರೀಟ್ ಸುರಿಯಲು ಸಾಧ್ಯವೇ?',
        a: 'Yes. MY CONCRETE operates 24 hours across all 12 two-hour slots, making 8 PM to 6 AM windows ideal for congested commercial markets in Ranebennur and Davangere.',
        aKn: 'ಹೌದು, ನಮ್ಮ ಘಟಕ 24 ಗಂಟೆಯೂ ತೆರೆದಿರುತ್ತದೆ. ರಾತ್ರಿ 8 ರಿಂದ ಬೆಳಿಗ್ಗೆ 6 ರ ಸ್ಲಾಟ್‌ಗಳು ಮುಖ್ಯ ರಸ್ತೆ ಕಾಮಗಾರಿಗೆ ಅತ್ಯುತ್ತಮ.',
      },
      {
        q: 'Can you supply Self-Compacting Concrete (SCC) for heavily reinforced columns?',
        qKn: 'ದಟ್ಟ ಕಬ್ಬಿಣವಿರುವ ವಾಣಿಜ್ಯ ಕಂಬಗಳಿಗೆ SCC ಕಾಂಕ್ರೀಟ್ ಸಿಗುತ್ತದೆಯೇ?',
        a: 'Yes, flowing SCC mixes are batched on request for dense reinforcement cages and architectural shafts where normal vibration is difficult.',
        aKn: 'ಹೌದು, ದಟ್ಟ ಕಬ್ಬಿಣದ ಕಂಬಗಳು ಮತ್ತು ಕಿರಿದಾದ ಜಾಗಗಳಿಗೆ SCC ಮಿಶ್ರಣವನ್ನು ಬೇಡಿಕೆಯಂತೆ ಪೂರೈಸುತ್ತೇವೆ.',
      },
      {
        q: 'Do you provide GST-compliant invoicing for commercial builders and firms?',
        qKn: 'ವಾಣಿಜ್ಯ ಗುತ್ತಿಗೆದಾರರಿಗೆ GST ಬಿಲ್ ಸೌಲಭ್ಯವಿದೆಯೇ?',
        a: 'Yes. Enter your company GSTIN right inside the online booking or quote form for smooth billing and dispatch documentation.',
        aKn: 'ಹೌದು, ಆನ್‌ಲೈನ್ ಬುಕಿಂಗ್ ಅಥವಾ ದರ ಪಟ್ಟಿ ಫಾರ್ಮ್‌ನಲ್ಲೇ ನಿಮ್ಮ GST ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಬಹುದು.',
      },
    ],
    gallery: [
      { id: 'com-g1', imageUrl: '', caption: 'Multi-Storey Commercial Complex Slab Pour', captionKn: 'ಬಹುಮಹಡಿ ವಾಣಿಜ್ಯ ಕಟ್ಟಡದ ಸ್ಲ್ಯಾಬ್' },
      { id: 'com-g2', imageUrl: '', caption: 'Night Transit Mixer Operation on Urban Plot', captionKn: 'ನಗರ ಪ್ರದೇಶದಲ್ಲಿ ರಾತ್ರಿ ಮಿಕ್ಸರ್ ಸೇವೆ' },
      { id: 'com-g3', imageUrl: '', caption: 'Boom Pump Placement on Commercial Deck', captionKn: 'ಬೂಮ್ ಪಂಪ್ ಮೂಲಕ ಕಾಂಕ್ರೀಟ್ ಪ್ಲೇಸ್‌ಮೆಂಟ್' },
      { id: 'com-g4', imageUrl: '', caption: 'Heavy Warehouse Grade Floor Concrete', captionKn: 'ಗೋದಾಮು ನೆಲಹಾಸು ಕಾಂಕ್ರೀಟ್' },
    ],
  },
  {
    slug: 'government',
    label: 'Government',
    labelKn: 'ಸರ್ಕಾರಿ ಕಾಮಗಾರಿಗಳು',
    shortDesc: 'Public buildings, panchayat halls, drains, and civic works.',
    shortDescKn: 'ಸಾರ್ವಜನಿಕ ಕಟ್ಟಡಗಳು, ಪಂಚಾಯತ್ ಭವನ, ಚರಂಡಿ ಮತ್ತು ನಾಗರಿಕ ಕಾಮಗಾರಿಗಳು.',
    heroHeadline: 'CONSISTENT RMC FOR\nPUBLIC WORKS &\nCIVIC PROJECTS',
    heroHeadlineKn: 'ಸರ್ಕಾರಿ ಕಟ್ಟಡಗಳು\nಮತ್ತು ನಾಗರಿಕ ಕಾಮಗಾರಿಗಳಿಗೆ\nಗುಣಮಟ್ಟದ ಕಾಂಕ್ರೀಟ್',
    heroImage: '/images/customers/government-hero.webp',
    heroAlt: 'Government public works, civic roads, and administrative buildings built with ready-mix concrete',
    cardImage: '/images/customers/government-card.webp',
    cardAlt: 'Public infrastructure and government buildings constructed with ready-mix concrete',
    titleBox: 'Controlled Batching & Transparent Documentation for Public-Sector Contractors',
    titleBoxKn: 'ಸರ್ಕಾರಿ ಕಾಮಗಾರಿ ಗುತ್ತಿಗೆದಾರರಿಗೆ ನಿಖರ ಬ್ಯಾಚಿಂಗ್ ಮತ್ತು ಪಾರದರ್ಶಕ ಬಿಲ್ಲಿಂಗ್',
    introParagraphs: [
      'Public-sector contractors executing municipal, panchayat, and state-department works need verified mix proportions, batching records, and timely delivery that matches inspection schedules without delays.',
      'MY CONCRETE supplies repeatable IS-proportioned grades—from M15/M20 drain and CC road mixes to M25/M30 structural concrete for public offices and community halls—alongside machine-pressed cement bricks across Haveri and Davangere districts.',
    ],
    introParagraphsKn: [
      'ಪುರಸಭೆ, ಗ್ರಾಮ ಪಂಚಾಯತ್ ಮತ್ತು ಲೋಕೋಪಯೋಗಿ ಇಲಾಖೆಯ ಕಾಮಗಾರಿಗಳನ್ನು ನಿರ್ವಹಿಸುವ ಗುತ್ತಿಗೆದಾರರಿಗೆ ನಿಖರ ಮಿಶ್ರಣ ಅನುಪಾತ ಮತ್ತು ಸಮಯಕ್ಕೆ ಸರಿಯಾದ ಪೂರೈಕೆ ಅತ್ಯಗತ್ಯ.',
      'ಸರ್ಕಾರಿ ಕಚೇರಿಗಳು, ಸಮುದಾಯ ಭವನಗಳು, CC ರಸ್ತೆ ಮತ್ತು ಚರಂಡಿ ಕಾಮಗಾರಿಗಳಿಗೆ M15 ರಿಂದ M30+ ಗ್ರೇಡ್ ಕಾಂಕ್ರೀಟ್ ಹಾಗೂ ಸಿಮೆಂಟ್ ಇಟ್ಟಿಗೆಗಳನ್ನು MY CONCRETE ಪೂರೈಸುತ್ತದೆ.',
    ],
    introImage: '',
    visualKey: 'government',
    applications: [
      {
        icon: 'Landmark',
        title: 'Municipal & Panchayat Buildings',
        titleKn: 'ಪುರಸಭೆ ಮತ್ತು ಪಂಚಾಯತ್ ಕಟ್ಟಡಗಳು',
        description: 'Structural RMC and solid cement bricks for civic offices and community halls.',
        descriptionKn: 'ನಾಗರಿಕ ಕಚೇರಿ ಮತ್ತು ಸಮುದಾಯ ಭವನಗಳಿಗೆ ಕಾಂಕ್ರೀಟ್ ಮತ್ತು ಬ್ಲಾಕ್‌ಗಳು.',
      },
      {
        icon: 'Route',
        title: 'CC Roads & Ward Street Paving',
        titleKn: 'CC ರಸ್ತೆ ಮತ್ತು ಬೀದಿ ಪೇವಿಂಗ್',
        description: 'Workable M20/M30 paving concrete built for municipal street longevity.',
        descriptionKn: 'ಬಾಳಿಕೆ ಬರುವ M20/M30 ಗ್ರೇಡ್ CC ರಸ್ತೆ ಕಾಂಕ್ರೀಟ್.',
      },
      {
        icon: 'Waves',
        title: 'Stormwater Drains & Box Culverts',
        titleKn: 'ಮಳೆನೀರು ಚರಂಡಿ ಮತ್ತು ಕಲ್ವರ್ಟ್‌ಗಳು',
        description: 'Cohesive mixes designed for retaining walls, drain beds, and cover slabs.',
        descriptionKn: 'ಚರಂಡಿ ಗೋಡೆ ಮತ್ತು ಕವರ್ ಸ್ಲ್ಯಾಬ್‌ಗಳಿಗೆ ದೃಢ ಮಿಶ್ರಣ.',
      },
      {
        icon: 'Building2',
        title: 'Public Housing & Hostel Blocks',
        titleKn: 'ಸಾರ್ವಜನಿಕ ವಸತಿ ಮತ್ತು ಹಾಸ್ಟೆಲ್ ಕಟ್ಟಡಗಳು',
        description: 'Repeatable slab-by-slab batching and uniform solid bricks for bulk construction.',
        descriptionKn: 'ದೊಡ್ಡ ಪ್ರಮಾಣದ ವಸತಿ ಯೋಜನೆಗಳಿಗೆ ಒಂದೇ ಗುಣಮಟ್ಟದ ಪೂರೈಕೆ.',
      },
      {
        icon: 'Droplets',
        title: 'Overhead Tank Staging & Pump Houses',
        titleKn: 'ನೀರಿನ ಟ್ಯಾಂಕ್ ಮತ್ತು ಪಂಪ್ ಹೌಸ್‌ಗಳು',
        description: 'Durable structural concrete for staging columns, ring beams, and water structures.',
        descriptionKn: 'ನೀರಿನ ಟ್ಯಾಂಕ್ ಕಂಬಗಳು ಮತ್ತು ರಿಂಗ್ ಬೀಮ್‌ಗಳಿಗೆ ಬಲಿಷ್ಠ ಮಿಶ್ರಣ.',
      },
      {
        icon: 'FileCheck',
        title: 'Batch-Ticket & GST Billing Support',
        titleKn: 'ಬ್ಯಾಚ್ ದಾಖಲೆ ಮತ್ತು GST ಬಿಲ್ಲಿಂಗ್',
        description: 'Clear per-load batch documentation and GST invoices for department records.',
        descriptionKn: 'ಪ್ರತಿ ಲೋಡ್‌ಗೆ ಸ್ಪಷ್ಟ ದಾಖಲೆ ಮತ್ತು GST ಬಿಲ್‌ಗಳು.',
      },
    ],
    recommendedGrades: [
      {
        use: 'Bed Levelling, Kerbs & Non-Structural Fills',
        useKn: 'ಬೆಡ್ PCC ಮತ್ತು ಕರ್ಬ್ ಕಾಮಗಾರಿ',
        grade: 'M10 / M15',
        notes: 'Clean sub-base concrete before drain or pavement casting.',
        notesKn: 'ಚರಂಡಿ ಅಥವಾ ರಸ್ತೆ ನಿರ್ಮಾಣದ ಕೆಳ ಪದರ.',
      },
      {
        use: 'Drains, Retaining Walls & CC Streets',
        useKn: 'ಚರಂಡಿ, ತಡೆಗೋಡೆ ಮತ್ತು CC ರಸ್ತೆಗಳು',
        grade: 'M20 / M25',
        notes: 'Consistent aggregate grading for dense, durable civic surfaces.',
        notesKn: 'ದೀರ್ಘಕಾಲ ಬಾಳಿಕೆ ಬರುವ ನಾಗರಿಕ ಕಾಮಗಾರಿ ಗ್ರೇಡ್.',
      },
      {
        use: 'Civic Structural Frames & Culvert Slabs',
        useKn: 'ಸರ್ಕಾರಿ ಕಟ್ಟಡದ ಚೌಕಟ್ಟು ಮತ್ತು ಕಲ್ವರ್ಟ್',
        grade: 'M30 / M35',
        notes: 'Batched strictly as per public-works department tender design mix.',
        notesKn: 'ಇಲಾಖೆಯ ವಿನ್ಯಾಸದ ಪ್ರಕಾರ ನಿಖರವಾಗಿ ಮಿಶ್ರಣ.',
      },
      {
        use: 'Government Quarters & Boundary Walls',
        useKn: 'ವಸತಿ ನಿಲಯ ಮತ್ತು ಕಾಂಪೌಂಡ್ ಗೋಡೆಗಳು',
        grade: 'Cement Bricks (4"/6"/8")',
        notes: 'Uniform machine-pressed solid blocks for rapid masonry output.',
        notesKn: 'ವೇಗದ ನಿರ್ಮಾಣಕ್ಕೆ ಯಂತ್ರದಿಂದ ತಯಾರಿಸಿದ ಗಟ್ಟಿ ಬ್ಲಾಕ್‌ಗಳು.',
      },
    ],
    faqs: [
      {
        q: 'Can MY CONCRETE batch concrete to match a specific government tender design mix?',
        qKn: 'ಸರ್ಕಾರಿ ಟೆಂಡರ್ ವಿನ್ಯಾಸದಂತೆ ನಿರ್ದಿಷ್ಟ ಗ್ರೇಡ್ ಕಾಂಕ್ರೀಟ್ ತಯಾರಿಸುತ್ತೀರಾ?',
        a: 'Yes. Share the engineer-approved mix proportions or target grade with our technical team via /quote or +91 73378 07372 before dispatch.',
        aKn: 'ಹೌದು. ಎಂಜಿನಿಯರ್ ಅನುಮೋದಿತ ವಿನ್ಯಾಸದ ಪ್ರಕಾರ ಕಾಂಕ್ರೀಟ್ ಬ್ಯಾಚ್ ಮಾಡಲಾಗುತ್ತದೆ.',
      },
      {
        q: 'Do you provide batching slips and GST tax invoices with deliveries?',
        qKn: 'ಪ್ರತಿ ಡೆಲಿವರಿಯೊಂದಿಗೆ ಬ್ಯಾಚ್ ವಿವರ ಮತ್ತು GST ಬಿಲ್ ನೀಡಲಾಗುತ್ತದೆಯೇ?',
        a: 'Yes, every load comes with dispatch quantity records and GST-compliant invoicing for contractor billing files.',
        aKn: 'ಹೌದು, ಪ್ರತಿ ಲೋಡ್‌ಗೆ ಪ್ರಮಾಣದ ದಾಖಲೆ ಮತ್ತು GST ಇನ್‌ವಾಯ್ಸ್ ನೀಡಲಾಗುತ್ತದೆ.',
      },
      {
        q: 'Which districts and taluks do you cover for civic works?',
        qKn: 'ಸರ್ಕಾರಿ ಕಾಮಗಾರಿಗಳಿಗೆ ಯಾವ ತಾಲೂಕುಗಳಿಗೆ ಪೂರೈಕೆ ಲಭ್ಯವಿದೆ?',
        a: 'Our Kotihal plant serves Ranebennur, Davangere, Harihar, Byadgi, Haveri, Hirekerur, and surrounding routes within ~50 km.',
        aKn: 'ರಾಣೆಬೆನ್ನೂರು, ದಾವಣಗೆರೆ, ಹರಿಹರ, ಬ್ಯಾಡಗಿ, ಹಾವೇರಿ, ಹಿರೇಕೆರೂರು ಹಾಗೂ ~50 ಕಿ.ಮೀ ಸುತ್ತಮುತ್ತ ಪೂರೈಸುತ್ತೇವೆ.',
      },
      {
        q: 'Can road or culvert pours be scheduled overnight to avoid traffic disruption?',
        qKn: 'ಸಂಚಾರ ಅಡಚಣೆ ತಪ್ಪಿಸಲು ರಸ್ತೆ ಕಾಮಗಾರಿಗೆ ರಾತ್ರಿ ಪೂರೈಕೆ ಸಾಧ್ಯವೇ?',
        a: 'Yes. Because we operate 24 hours, contractors frequently book 10 PM – 6 AM slots for municipal road and culvert works.',
        aKn: 'ಹೌದು. 24 ಗಂಟೆ ಸೇವೆ ಇರುವುದರಿಂದ ರಾತ್ರಿ 10 ರಿಂದ ಬೆಳಿಗ್ಗೆ 6 ರವರೆಗೆ ಬುಕ್ ಮಾಡಬಹುದು.',
      },
    ],
    gallery: [
      { id: 'gov-g1', imageUrl: '', caption: 'Batching Plant Loading for Civic Works', captionKn: 'ನಾಗರಿಕ ಕಾಮಗಾರಿಗೆ ಪ್ಲಾಂಟ್ ಲೋಡಿಂಗ್' },
      { id: 'gov-g2', imageUrl: '', caption: 'CC Road & Stormwater Drain Pour', captionKn: 'CC ರಸ್ತೆ ಮತ್ತು ಚರಂಡಿ ಕಾಮಗಾರಿ' },
      { id: 'gov-g3', imageUrl: '', caption: 'Public Building Column & Beam Supply', captionKn: 'ಸಾರ್ವಜನಿಕ ಕಟ್ಟಡದ ಕಂಬಗಳ ಪೂರೈಕೆ' },
      { id: 'gov-g4', imageUrl: '', caption: 'Bulk Solid Cement Blocks Dispatch', captionKn: 'ದೊಡ್ಡ ಪ್ರಮಾಣದ ಸಿಮೆಂಟ್ ಬ್ಲಾಕ್ ಪೂರೈಕೆ' },
    ],
  },
  {
    slug: 'infrastructure',
    label: 'Infrastructure',
    labelKn: 'ಮೂಲಸೌಕರ್ಯ ಯೋಜನೆಗಳು',
    shortDesc: 'Roads, culverts, retaining walls, bridges, and utility corridors.',
    shortDescKn: 'ರಸ್ತೆ, ಸೇತುವೆ, ಕಲ್ವರ್ಟ್, ತಡೆಗೋಡೆ ಮತ್ತು ಮೂಲಸೌಕರ್ಯ ಕಾಮಗಾರಿಗಳು.',
    heroHeadline: 'HIGH-STRENGTH MIXES\nFOR ROADS, BRIDGES &\nINFRASTRUCTURE',
    heroHeadlineKn: 'ರಸ್ತೆ, ಸೇತುವೆ ಮತ್ತು\nಮೂಲಸೌಕರ್ಯಕ್ಕೆ\nದೃಢ RMC ಕಾಂಕ್ರೀಟ್',
    heroImage: '/images/customers/infrastructure-hero.webp',
    heroAlt: 'Roads, culverts, bridges, and civil infrastructure built with high-strength ready-mix concrete',
    cardImage: '/images/customers/infrastructure-card.webp',
    cardAlt: 'Civil infrastructure roads and bridges constructed with ready-mix concrete',
    titleBox: 'Continuous 24/7 Dispatch Capacity for Heavy Civil & Road Infrastructure',
    titleBoxKn: 'ರಸ್ತೆ ಮತ್ತು ಸಿವಿಲ್ ಮೂಲಸೌಕರ್ಯಕ್ಕೆ 24/7 ನಿರಂತರ ಕಾಂಕ್ರೀಟ್ ಪೂರೈಕೆ',
    introParagraphs: [
      'Highway stretches, approach bridges, box culverts, retaining walls, and heavy utility foundations run on tight window clearances and demand uniform aggregate grading from the first cubic metre to the last.',
      'Located inside Lucky Artificial Sand Industry premises at Kotihal near NH-48 connectivity between Ranebennur and Davangere, MY CONCRETE provides seamless raw material control and 24-hour transit-mixer scheduling for demanding civil pours.',
    ],
    introParagraphsKn: [
      'ಹೆದ್ದಾರಿ, ಸೇತುವೆ, ಬಾಕ್ಸ್ ಕಲ್ವರ್ಟ್ ಮತ್ತು ತಡೆಗೋಡೆ ಕಾಮಗಾರಿಗಳಿಗೆ ಮೊದಲ ಲೋಡ್‌ನಿಂದ ಕೊನೆಯ ಲೋಡ್‌ವರೆಗೆ ಒಂದೇ ಗುಣಮಟ್ಟದ ಮಿಶ್ರಣ ಅಗತ್ಯ.',
      'ರಾಣೆಬೆನ್ನೂರು-ದಾವಣಗೆರೆ ನಡುವಿನ ಕೊತಿಹಾಳ್‌ನಲ್ಲಿರುವ ನಮ್ಮ ಘಟಕವು 24 ಗಂಟೆಯೂ ನಿರಂತರ ಟ್ರಾನ್ಸಿಟ್ ಮಿಕ್ಸರ್ ಪೂರೈಕೆಗೆ ಸಿದ್ಧವಾಗಿದೆ.',
    ],
    introImage: '',
    visualKey: 'infrastructure',
    applications: [
      {
        icon: 'Route',
        title: 'Rigid Pavements & Highway Ramps',
        titleKn: 'ರಸ್ತೆ ಪೇವ್‌ಮೆಂಟ್ ಮತ್ತು ರ‍್ಯಾಂಪ್‌ಗಳು',
        description: 'Pavement-quality and M30–M40 concrete designed for continuous heavy axle traffic.',
        descriptionKn: 'ಭಾರೀ ವಾಹನ ಸಂಚಾರಕ್ಕೆ M30–M40 ಗ್ರೇಡ್ ಪೇವ್‌ಮೆಂಟ್ ಕಾಂಕ್ರೀಟ್.',
      },
      {
        icon: 'Construction',
        title: 'Bridge Abutments & Pier Foundations',
        titleKn: 'ಸೇತುವೆ ಪಿಲ್ಲರ್ ಮತ್ತು ಅಬಟ್‌ಮೆಂಟ್',
        description: 'Dense structural and pumpable concrete suited for deep piles and pier caps.',
        descriptionKn: 'ಪೈಲ್ ಫೌಂಡೇಶನ್ ಮತ್ತು ಪಿಯರ್ ಕ್ಯಾಪ್‌ಗಳಿಗೆ ಪೂರಕ ಮಿಶ್ರಣ.',
      },
      {
        icon: 'Layers',
        title: 'Retaining Walls & Wing Walls',
        titleKn: 'ರಿಟೇನಿಂಗ್ ವಾಲ್ ಮತ್ತು ವಿಂಗ್ ವಾಲ್',
        description: 'Cohesive mixes with balanced flow for tall shuttering and earth-retention walls.',
        descriptionKn: 'ಎತ್ತರದ ಶಟರಿಂಗ್ ಗೋಡೆಗಳಿಗೆ ಸುಲಭವಾಗಿ ತುಂಬುವ ಮಿಶ್ರಣ.',
      },
      {
        icon: 'Waves',
        title: 'Canal Linings & Irrigation Structures',
        titleKn: 'ಕಾಲುವೆ ಮತ್ತು ನೀರಾವರಿ ಕಾಮಗಾರಿಗಳು',
        description: 'Durable, low-permeability mixes for agricultural canals, check dams, and sluices.',
        descriptionKn: 'ಕಾಲುವೆ ಲೈನಿಂಗ್ ಮತ್ತು ಚೆಕ್ ಡ್ಯಾಮ್‌ಗಳಿಗೆ ಬಾಳಿಕೆ ಬರುವ ಕಾಂಕ್ರೀಟ್.',
      },
      {
        icon: 'Zap',
        title: 'Substation Plinths & Utility Ducts',
        titleKn: 'ಸಬ್‌ಸ್ಟೇಷನ್ ಮತ್ತು ಯುಟಿಲಿಟಿ ಪ್ಲಿಂತ್',
        description: 'Precision concrete pads for transformers, transmission towers, and cable trenches.',
        descriptionKn: 'ಟ್ರಾನ್ಸ್‌ಫಾರ್ಮರ್ ಮತ್ತು ಕೇಬಲ್ ಟ್ರೆಂಚ್‌ಗಳಿಗೆ ನಿಖರ ಬೇಸ್.',
      },
      {
        icon: 'Truck',
        title: '24/7 Rapid Turnaround Along NH-48 Belt',
        titleKn: 'NH-48 ವ್ಯಾಪ್ತಿಯಲ್ಲಿ 24/7 ವೇಗದ ಸೇವೆ',
        description: 'Night-shift supply slots minimize highway congestion during major pours.',
        descriptionKn: 'ರಾತ್ರಿ ಪಾಳಿಯ ಪೂರೈಕೆಯಿಂದ ಹೆದ್ದಾರಿ ಕಾಮಗಾರಿಗೆ ವೇಗ.',
      },
    ],
    recommendedGrades: [
      {
        use: 'Lean Concrete Sub-Base (DLC / PCC)',
        useKn: 'ರಸ್ತೆ ಸಬ್-ಬೇಸ್ DLC / PCC',
        grade: 'M10 / M15',
        notes: 'Compacted sub-base layer under rigid highway slabs and foundations.',
        notesKn: 'ಮುಖ್ಯ ರಸ್ತೆ ಪೇವ್‌ಮೆಂಟ್ ಕೆಳಗಿನ ದೃಢ ಆಧಾರ ಪದರ.',
      },
      {
        use: 'Culverts, Retaining Walls & Drain Chambers',
        useKn: 'ಕಲ್ವರ್ಟ್ ಮತ್ತು ತಡೆಗೋಡೆಗಳು',
        grade: 'M25 / M30',
        notes: 'Balanced workability and weather endurance for exposed civil faces.',
        notesKn: 'ಹವಾಮಾನ ಬದಲಾವಣೆ ತಡೆದುಕೊಳ್ಳುವ ಸಿವಿಲ್ ಗ್ರೇಡ್.',
      },
      {
        use: 'Heavy Pavements, Bridge Decks & Pier Caps',
        useKn: 'ರಸ್ತೆ ಸ್ಲ್ಯಾಬ್, ಸೇತುವೆ ಡೆಕ್ ಮತ್ತು ಪಿಯರ್',
        grade: 'M35 / M40+',
        notes: 'High compressive & flexural strength tailored to project specs.',
        notesKn: 'ಯೋಜನಾ ವಿನ್ಯಾಸಕ್ಕೆ ತಕ್ಕಂತೆ ಹೆಚ್ಚಿನ ಬಲದ ಕಾಂಕ್ರೀಟ್.',
      },
      {
        use: 'Dense Rebar Piles & Bridge Diaphragms',
        useKn: 'ದಟ್ಟ ಕಬ್ಬಿಣದ ಪೈಲ್ ಫೌಂಡೇಶನ್',
        grade: 'SCC / High-Slump Mix',
        notes: 'Self-compacting or extended-slump concrete for tremie & pile pours.',
        notesKn: 'ಟ್ರೆಮಿ ಪೈಪ್ ಮತ್ತು ಪೈಲ್ ಕಾಮಗಾರಿಗೆ ವಿಶೇಷ ಮಿಶ್ರಣ.',
      },
    ],
    faqs: [
      {
        q: 'Can you supply multiple mixers back-to-back for bridge or culvert continuous pours?',
        qKn: 'ಸೇತುವೆ ಅಥವಾ ಕಲ್ವರ್ಟ್ ನಿರಂತರ ಕಾಮಗಾರಿಗೆ ಸರಣಿಯಾಗಿ ಮಿಕ್ಸರ್ ಕಳುಹಿಸಬಹುದೇ?',
        a: 'Yes. Share your pour volume and hourly rate beforehand so our Kotihal dispatch team reserves dedicated transit mixers and standby capacity.',
        aKn: 'ಹೌದು. ಕಾಮಗಾರಿಯ ಪ್ರಮಾಣವನ್ನು ಮುಂಚಿತವಾಗಿ ತಿಳಿಸಿದರೆ ನಿರಂತರ ಮಿಕ್ಸರ್ ವ್ಯವಸ್ಥೆ ಮಾಡಲಾಗುತ್ತದೆ.',
      },
      {
        q: 'How is aggregate quality managed for infrastructure-grade M30–M40+ concrete?',
        qKn: 'M30–M40+ ಮೂಲಸೌಕರ್ಯ ಕಾಂಕ್ರೀಟ್‌ಗೆ ಜಲ್ಲಿ ಮತ್ತು ಮರಳಿನ ಗುಣಮಟ್ಟ ಹೇಗೆ ಕಾಪಾಡಲಾಗುತ್ತದೆ?',
        a: 'Situated inside Lucky Artificial Sand Industry premises, our unit sources graded artificial sand and washed stone aggregates with controlled moisture batching.',
        aKn: 'ಲಕ್ಕಿ ಆರ್ಟಿಫಿಶಿಯಲ್ ಸ್ಯಾಂಡ್ ಆವರಣದಲ್ಲೇ ಇರುವುದರಿಂದ ಉತ್ತಮ ದರ್ಜೆಯ M-ಸ್ಯಾಂಡ್ ಮತ್ತು ಜಲ್ಲಿ ನೇರವಾಗಿ ಬಳಸಲಾಗುತ್ತದೆ.',
      },
      {
        q: 'Do you support tremie / pile pours requiring higher slump retention?',
        qKn: 'ಪೈಲ್ ಫೌಂಡೇಶನ್‌ಗೆ ಹೆಚ್ಚು ಸಮಯ ಹರಿಯುವ ಸ್ಲಂಪ್ ಕಾಂಕ್ರೀಟ್ ಲಭ್ಯವಿದೆಯೇ?',
        a: 'Yes. We adjust admixture dosing for extended slump retention based on transit distance around Ranebennur and Davangere.',
        aKn: 'ಹೌದು, ದೂರಕ್ಕೆ ಅನುಗುಣವಾಗಿ ಸ್ಲಂಪ್ ಉಳಿಯುವಂತೆ ಅಡ್ಮಿಕ್ಸ್ಚರ್ ಹೊಂದಿಸಲಾಗುತ್ತದೆ.',
      },
      {
        q: 'Can we book early-morning or midnight road pours online?',
        qKn: 'ಮುಂಜಾನೆ ಅಥವಾ ಮಧ್ಯರಾತ್ರಿ ರಸ್ತೆ ಕಾಮಗಾರಿಗೆ ಆನ್‌ಲೈನ್ ಬುಕ್ ಮಾಡಬಹುದೇ?',
        a: 'Yes. All 12 two-hour slots across 24 hours are open on our booking engine, or call +91 73378 07372 for custom bulk scheduling.',
        aKn: 'ಹೌದು. 24 ಗಂಟೆಯ ಎಲ್ಲಾ 12 ಸ್ಲಾಟ್‌ಗಳು ಆನ್‌ಲೈನ್‌ನಲ್ಲಿ ಲಭ್ಯವಿವೆ.',
      },
    ],
    gallery: [
      { id: 'inf-g1', imageUrl: '', caption: 'Rigid Pavement & Culvert Concrete Delivery', captionKn: 'ರಸ್ತೆ ಮತ್ತು ಕಲ್ವರ್ಟ್ ಕಾಂಕ್ರೀಟ್ ಪೂರೈಕೆ' },
      { id: 'inf-g2', imageUrl: '', caption: 'Retaining Wall Continuous Transit Supply', captionKn: 'ತಡೆಗೋಡೆಗೆ ನಿರಂತರ ಮಿಕ್ಸರ್ ಪೂರೈಕೆ' },
      { id: 'inf-g3', imageUrl: '', caption: 'Night Highway Infrastructure Pour Window', captionKn: 'ರಾತ್ರಿ ಹೆದ್ದಾರಿ ಕಾಮಗಾರಿ ಪೂರೈಕೆ' },
      { id: 'inf-g4', imageUrl: '', caption: 'High-Grade Aggregate & Sand Proportioning', captionKn: 'ನಿಖರ M-ಸ್ಯಾಂಡ್ ಮತ್ತು ಜಲ್ಲಿ ಮಿಶ್ರಣ' },
    ],
  },
  {
    slug: 'institutions',
    label: 'Institutions',
    labelKn: 'ಶೈಕ್ಷಣಿಕ ಮತ್ತು ಆಸ್ಪತ್ರೆಗಳು',
    shortDesc: 'Schools, colleges, hospitals, clinics, and community campuses.',
    shortDescKn: 'ಶಾಲೆಗಳು, ಕಾಲೇಜುಗಳು, ಆಸ್ಪತ್ರೆಗಳು ಮತ್ತು ಸಮುದಾಯ ಕಟ್ಟಡಗಳು.',
    heroHeadline: 'DEPENDABLE CONCRETE\nFOR SCHOOLS, COLLEGES\n& HOSPITALS',
    heroHeadlineKn: 'ಶಾಲೆ, ಕಾಲೇಜು\nಮತ್ತು ಆಸ್ಪತ್ರೆ ಕಟ್ಟಡಗಳಿಗೆ\nನಂಬಿಕೆಯ ಕಾಂಕ್ರೀಟ್',
    heroImage: '/images/customers/institutions-hero.webp',
    heroAlt: 'Schools, colleges, and hospital institutional buildings constructed with ready-mix concrete',
    cardImage: '/images/customers/institutions-card.webp',
    cardAlt: 'Educational and healthcare campus buildings built with ready-mix concrete',
    titleBox: 'Quiet, Timely & Clean Site Supply for Educational and Healthcare Campuses',
    titleBoxKn: 'ಶಿಕ್ಷಣ ಸಂಸ್ಥೆಗಳು ಮತ್ತು ಆಸ್ಪತ್ರೆ ಕ್ಯಾಂಪಸ್‌ಗಳಿಗೆ ಸ್ವಚ್ಛ ಹಾಗೂ ಸಮಯೋಚಿತ ಪೂರೈಕೆ',
    introParagraphs: [
      'Expanding an operational school, college campus, nursing wing, or multi-speciality hospital requires strict discipline on noise, dust, and schedule—especially when students, staff, or patients occupy adjacent buildings.',
      'MY CONCRETE brings factory-batched concrete and solid cement bricks straight to site in sealed transit mixers, eliminating noisy on-site aggregate dumping and allowing clean weekend or off-hour pours across Ranebennur and Davangere.',
    ],
    introParagraphsKn: [
      'ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತಿರುವ ಶಾಲೆ, ಕಾಲೇಜು ಅಥವಾ ಆಸ್ಪತ್ರೆ ಕ್ಯಾಂಪಸ್ ವಿಸ್ತರಣೆಗೆ ಶಬ್ದ ಮತ್ತು ಧೂಳು ಕಡಿಮೆ ಇರುವ ಸ್ವಚ್ಛ ನಿರ್ಮಾಣ ವಿಧಾನ ಅಗತ್ಯ.',
      'MY CONCRETE ಟ್ರಾನ್ಸಿಟ್ ಮಿಕ್ಸರ್‌ಗಳ ಮೂಲಕ ನೇರವಾಗಿ ಕಾಂಕ್ರೀಟ್ ತಲುಪಿಸುವುದರಿಂದ ಆವರಣ ಸ್ವಚ್ಛವಾಗಿರುತ್ತದೆ ಹಾಗೂ ರಜಾದಿನ ಅಥವಾ ರಾತ್ರಿ ವೇಳೆಯಲ್ಲೂ ಸ್ಲ್ಯಾಬ್ ಸುರಿಯಬಹುದು.',
    ],
    introImage: '',
    visualKey: 'institutions',
    applications: [
      {
        icon: 'GraduationCap',
        title: 'Schools & Academic Classroom Blocks',
        titleKn: 'ಶಾಲೆ ಮತ್ತು ತರಗತಿ ಕಟ್ಟಡಗಳು',
        description: 'Fast, low-dust transit-mixer delivery for safe multi-classroom slab pours.',
        descriptionKn: 'ಧೂಳು ರಹಿತವಾಗಿ ಸುರಕ್ಷಿತ ಶಾಲಾ ಸ್ಲ್ಯಾಬ್ ಕಾಮಗಾರಿ.',
      },
      {
        icon: 'BookOpen',
        title: 'College Campuses, Labs & Auditoriums',
        titleKn: 'ಕಾಲೇಜು, ಲ್ಯಾಬ್ ಮತ್ತು ಸಭಾಂಗಣಗಳು',
        description: 'Structural M25–M35 mixes for long-span auditorium roofs and library slabs.',
        descriptionKn: 'ಸಭಾಂಗಣ ಮತ್ತು ಕಾಲೇಜು ಬ್ಲಾಕ್‌ಗಳಿಗೆ M25–M35 ಕಾಂಕ್ರೀಟ್.',
      },
      {
        icon: 'HeartPulse',
        title: 'Hospitals, Clinics & Diagnostic Centres',
        titleKn: 'ಆಸ್ಪತ್ರೆ ಮತ್ತು ಕ್ಲಿನಿಕ್ ಕಟ್ಟಡಗಳು',
        description: 'Precision slabs, lift cores, and acoustic solid-brick partition walls.',
        descriptionKn: 'ಆಸ್ಪತ್ರೆ ಸ್ಲ್ಯಾಬ್, ಲಿಫ್ಟ್ ಕೋರ್ ಮತ್ತು ಸಾಲಿಡ್ ಬ್ಲಾಕ್ ಗೋಡೆಗಳು.',
      },
      {
        icon: 'BedDouble',
        title: 'Student Hostels & Staff Quarters',
        titleKn: 'ವಿದ್ಯಾರ್ಥಿ ನಿಲಯ ಮತ್ತು ಸಿಬ್ಬಂದಿ ವಸತಿ',
        description: 'Combined supply of repeatable slab RMC and 4"/6"/8" cement bricks.',
        descriptionKn: 'ಹಾಸ್ಟೆಲ್‌ಗಳಿಗೆ RMC ಮತ್ತು ಸಿಮೆಂಟ್ ಇಟ್ಟಿಗೆ ಒಟ್ಟಿಗೆ ಪೂರೈಕೆ.',
      },
      {
        icon: 'ShieldCheck',
        title: 'Weekend & Off-Hour Pour Flexibility',
        titleKn: 'ರಜಾದಿನ ಮತ್ತು ರಾತ್ರಿ ಪೂರೈಕೆ ಸೌಲಭ್ಯ',
        description: '24/7 dispatch lets institutions pour during non-class or low-visitor hours.',
        descriptionKn: 'ಶಾಲೆ/ಆಸ್ಪತ್ರೆ ಸಮಯಕ್ಕೆ ತೊಂದರೆಯಾಗದಂತೆ 24 ಗಂಟೆ ಡೆಲಿವರಿ.',
      },
      {
        icon: 'Accessibility',
        title: 'Ramps, Corridors & Campus Walkways',
        titleKn: 'ರ‍್ಯಾಂಪ್, ಕಾರಿಡಾರ್ ಮತ್ತು ಪಾದಚಾರಿ ಮಾರ್ಗ',
        description: 'Smooth, non-slip grade concrete for patient ramps and campus pathways.',
        descriptionKn: 'ರೋಗಿಗಳು ಮತ್ತು ವಿದ್ಯಾರ್ಥಿಗಳ ಸುಗಮ ಓಡಾಟಕ್ಕೆ ನಯವಾದ ರ‍್ಯಾಂಪ್.',
      },
    ],
    recommendedGrades: [
      {
        use: 'Sub-Base PCC & Campus Pathways',
        useKn: 'ಸಬ್-ಬೇಸ್ PCC ಮತ್ತು ಕ್ಯಾಂಪಸ್ ಹಾದಿ',
        grade: 'M15',
        notes: 'Clean sub-base for footings, courtyards, and ambulance bays.',
        notesKn: 'ಆಂಬ್ಯುಲೆನ್ಸ್ ಪಥ ಮತ್ತು ಅಂಗಳದ ಕೆಳ ಪದರ.',
      },
      {
        use: 'Classrooms, Wards, Corridors & Slabs',
        useKn: 'ತರಗತಿ ಕೊಠಡಿ, ವಾರ್ಡ್ ಮತ್ತು ಸ್ಲ್ಯಾಬ್‌ಗಳು',
        grade: 'M25',
        notes: 'Dependable structural workhorse for institutional multi-floor slabs.',
        notesKn: 'ಶಾಲಾ ಮತ್ತು ಆಸ್ಪತ್ರೆ ಬಹುಮಹಡಿ ಕಟ್ಟಡಗಳಿಗೆ ಸೂಕ್ತ ಗ್ರೇಡ್.',
      },
      {
        use: 'Auditorium Beams, Lift Shafts & Heavy Columns',
        useKn: 'ಸಭಾಂಗಣ ಬೀಮ್, ಲಿಫ್ಟ್ ಮತ್ತು ಕಂಬಗಳು',
        grade: 'M30 / M35',
        notes: 'High-strength concrete for wide column grids and diagnostic floors.',
        notesKn: 'ಅಗಲವಾದ ಕಂಬಗಳ ಅಂತರಕ್ಕೆ ಹೆಚ್ಚಿನ ಬಲದ ಮಿಶ್ರಣ.',
      },
      {
        use: 'Acoustic Room Partitions & Compound Walls',
        useKn: 'ಶಬ್ದ ನಿರೋಧಕ ವಿಭಾಗೀಯ ಗೋಡೆಗಳು',
        grade: 'Cement Bricks (4"/6"/8")',
        notes: 'Dense machine-pressed solid cement bricks reduce sound transmission.',
        notesKn: 'ಶಬ್ದ ಕಡಿಮೆ ಮಾಡುವ ದಟ್ಟ ಯಂತ್ರ-ನಿರ್ಮಿತ ಸಿಮೆಂಟ್ ಬ್ಲಾಕ್‌ಗಳು.',
      },
    ],
    faqs: [
      {
        q: 'Can pours be scheduled on Sundays or nights so campus classes and hospital OPD stay undisturbed?',
        qKn: 'ತರಗತಿ ಮತ್ತು ಆಸ್ಪತ್ರೆ OPD ಗೆ ತೊಂದರೆಯಾಗದಂತೆ ಭಾನುವಾರ ಅಥವಾ ರಾತ್ರಿ ಪೂರೈಸಬಹುದೇ?',
        a: 'Yes. MY CONCRETE runs 24 hours across all days of the week—you can lock in Sunday daytime or overnight slots directly in our scheduler.',
        aKn: 'ಹೌದು. ವಾರದ ಎಲ್ಲಾ ದಿನಗಳಲ್ಲೂ 24 ಗಂಟೆ ಸೇವೆ ಲಭ್ಯವಿದ್ದು ಭಾನುವಾರ ಅಥವಾ ರಾತ್ರಿ ಸ್ಲಾಟ್ ಆಯ್ಕೆ ಮಾಡಬಹುದು.',
      },
      {
        q: 'How does ready-mix concrete keep an active hospital or school campus cleaner?',
        qKn: 'ಆಸ್ಪತ್ರೆ ಅಥವಾ ಶಾಲಾ ಆವರಣದಲ್ಲಿ RMC ಬಳಕೆಯಿಂದ ಸ್ವಚ್ಛತೆ ಹೇಗೆ ಉಳಿಯುತ್ತದೆ?',
        a: 'Because concrete arrives pre-mixed from Kotihal inside enclosed transit mixers, you avoid open sand/stone stockpiles, dust clouds, and cement slurry runoff.',
        aKn: 'ಕಾಂಕ್ರೀಟ್ ನೇರವಾಗಿ ಮಿಕ್ಸರ್‌ನಲ್ಲಿ ಬರುವುದರಿಂದ ಆವರಣದಲ್ಲಿ ಮರಳು-ಜಲ್ಲಿ ರಾಶಿ ಮತ್ತು ಧೂಳು ಇರುವುದಿಲ್ಲ.',
      },
      {
        q: 'Do you supply solid cement bricks for hospital wards and classroom walls too?',
        qKn: 'ಆಸ್ಪತ್ರೆ ವಾರ್ಡ್ ಮತ್ತು ತರಗತಿ ಗೋಡೆಗಳಿಗೆ ಸಿಮೆಂಟ್ ಇಟ್ಟಿಗೆಗಳನ್ನೂ ಪೂರೈಸುತ್ತೀರಾ?',
        a: 'Yes, we manufacture 4", 6", and 8" machine-pressed solid cement bricks ideal for neat plastering, electrical chasing, and sturdy partitions.',
        aKn: 'ಹೌದು, 4", 6" ಮತ್ತು 8" ಗಾತ್ರದ ಗಟ್ಟಿ ಸಿಮೆಂಟ್ ಇಟ್ಟಿಗೆಗಳನ್ನು ನೇರವಾಗಿ ಪೂರೈಸುತ್ತೇವೆ.',
      },
      {
        q: 'Can our campus engineer request a site inspection for pump access first?',
        qKn: 'ಪಂಪ್ ಮತ್ತು ಮಿಕ್ಸರ್ ಪ್ರವೇಶ ಪರಿಶೀಲಿಸಲು ಮುಂಚಿತವಾಗಿ ಸೈಟ್ ಭೇಟಿ ಲಭ್ಯವಿದೆಯೇ?',
        a: 'Yes. Book a free Site Visit from our Site Visit page and our team will review gate clearance, pump positioning, and road access.',
        aKn: 'ಹೌದು, ಆನ್‌ಲೈನ್ ಮೂಲಕ ಉಚಿತ ಸೈಟ್ ಭೇಟಿಯನ್ನು ಬುಕ್ ಮಾಡಬಹುದು.',
      },
    ],
    gallery: [
      { id: 'ins-g1', imageUrl: '', caption: 'Academic Block Roof Slab Pumping', captionKn: 'ಶೈಕ್ಷಣಿಕ ಕಟ್ಟಡದ ಸ್ಲ್ಯಾಬ್ ಪಂಪಿಂಗ್' },
      { id: 'ins-g2', imageUrl: '', caption: 'Clean Campus Transit Mixer Unloading', captionKn: 'ಕ್ಯಾಂಪಸ್‌ನಲ್ಲಿ ಸ್ವಚ್ಛ ಮಿಕ್ಸರ್ ಪೂರೈಕೆ' },
      { id: 'ins-g3', imageUrl: '', caption: 'Weekend Institutional Pour Schedule', captionKn: 'ರಜಾದಿನದ ಕಾಂಕ್ರೀಟ್ ಕಾಮಗಾರಿ' },
      { id: 'ins-g4', imageUrl: '', caption: '6" & 8" Solid Cement Blocks for Wards', captionKn: 'ವಾರ್ಡ್ ಗೋಡೆಗಳಿಗೆ 6" ಮತ್ತು 8" ಬ್ಲಾಕ್‌ಗಳು' },
    ],
  },
  {
    slug: 'industrial',
    label: 'Industrial',
    labelKn: 'ಕೈಗಾರಿಕಾ ಘಟಕಗಳು',
    shortDesc: 'Factories, sheds, machine foundations, cold storages, and yards.',
    shortDescKn: 'ಕಾರ್ಖಾನೆ, ಶೆಡ್, ಯಂತ್ರದ ಅಡಿಪಾಯ, ಕೋಲ್ಡ್ ಸ್ಟೋರೇಜ್ ಮತ್ತು ಯಾರ್ಡ್‌ಗಳು.',
    heroHeadline: 'HEAVY-DUTY RMC\nFOR FACTORIES, SHEDS\n& MACHINE BASES',
    heroHeadlineKn: 'ಕಾರ್ಖಾನೆಗಳು ಮತ್ತು\nಯಂತ್ರ ಅಡಿಪಾಯಗಳಿಗೆ\nಹೆವಿ-ಡ್ಯೂಟಿ ಕಾಂಕ್ರೀಟ್',
    heroImage: '/images/customers/industrial-hero.webp',
    heroAlt: 'Industrial factory sheds, warehouse floors, and machine foundations built with ready-mix concrete',
    cardImage: '/images/customers/industrial-card.webp',
    cardAlt: 'Industrial plants and warehouses constructed with heavy-duty ready-mix concrete',
    titleBox: 'High-Load Industrial Flooring, Machine Foundations & Perimeter Masonry',
    titleBoxKn: 'ಕೈಗಾರಿಕಾ ನೆಲಹಾಸು, ಯಂತ್ರ ಅಡಿಪಾಯ ಮತ್ತು ಕಾರ್ಖಾನೆ ಗೋಡೆಗಳಿಗೆ ಬಲಿಷ್ಠ ಪರಿಹಾರ',
    introParagraphs: [
      'Manufacturing sheds, rice and cotton mills, cold storages, dal mills, and logistics yards across the Ranebennur–Davangere industrial belt require dense concrete capable of withstanding continuous forklift traffic, pallet racks, and dynamic machinery vibration.',
      'MY CONCRETE supplies M25–M40+ industrial flooring mixes, deep machine-pedestal concrete, and rugged 6" & 8" solid cement bricks—supported by 24/7 dispatch so large continuous bay pours finish cleanly without unplanned interruptions.',
    ],
    introParagraphsKn: [
      'ರಾಣೆಬೆನ್ನೂರು-ದಾವಣಗೆರೆ ಕೈಗಾರಿಕಾ ವಲಯದ ಕಾರ್ಖಾನೆಗಳು, ಮಿಲ್‌ಗಳು, ಕೋಲ್ಡ್ ಸ್ಟೋರೇಜ್ ಮತ್ತು ಲಾಜಿಸ್ಟಿಕ್ಸ್ ಯಾರ್ಡ್‌ಗಳಿಗೆ ಭಾರೀ ಯಂತ್ರಗಳು ಮತ್ತು ಫೋರ್ಕ್‌ಲಿಫ್ಟ್ ಸಂಚಾರ ತಡೆಯುವ ದೃಢ ನೆಲಹಾಸು ಅಗತ್ಯ.',
      'MY CONCRETE M25 ರಿಂದ M40+ ವರೆಗಿನ ಕೈಗಾರಿಕಾ ಕಾಂಕ್ರೀಟ್, ಯಂತ್ರ ಅಡಿಪಾಯ ಮಿಶ್ರಣ ಮತ್ತು 6"–8" ಸಿಮೆಂಟ್ ಇಟ್ಟಿಗೆಗಳನ್ನು 24/7 ನಿರಂತರವಾಗಿ ಪೂರೈಸುತ್ತದೆ.',
    ],
    introImage: '',
    visualKey: 'industrial',
    applications: [
      {
        icon: 'Factory',
        title: 'Industrial Factory Floor Slabs',
        titleKn: 'ಕಾರ್ಖಾನೆ ನೆಲಹಾಸು ಸ್ಲ್ಯಾಬ್‌ಗಳು',
        description: 'Abrasion-resistant M25/M30 floor bays built for forklifts and heavy storage.',
        descriptionKn: 'ಫೋರ್ಕ್‌ಲಿಫ್ಟ್ ಮತ್ತು ಭಾರೀ ಸರಕುಗಳಿಗೆ ತಕ್ಕ M25/M30 ನೆಲಹಾಸು.',
      },
      {
        icon: 'Cog',
        title: 'Heavy Machinery & Turbine Foundations',
        titleKn: 'ಭಾರೀ ಯಂತ್ರಗಳ ಅಡಿಪಾಯಗಳು',
        description: 'Massive low-shrinkage M30–M40 concrete blocks for industrial equipment.',
        descriptionKn: 'ಕಂಪನ ತಡೆಯುವ M30–M40 ಯಂತ್ರ ಪೆಡೆಸ್ಟಲ್ ಕಾಂಕ್ರೀಟ್.',
      },
      {
        icon: 'Snowflake',
        title: 'Cold Storages & Agro-Processing Mills',
        titleKn: 'ಕೋಲ್ಡ್ ಸ್ಟೋರೇಜ್ ಮತ್ತು ಕೃಷಿ ಮಿಲ್‌ಗಳು',
        description: 'Uniform moisture-controlled slabs for agro mills, seed plants, and chillers.',
        descriptionKn: 'ಅಕ್ಕಿ, ಹತ್ತಿ ಮತ್ತು ಕೃಷಿ ಮಿಲ್‌ಗಳಿಗೆ ಗುಣಮಟ್ಟದ ಕಾಂಕ್ರೀಟ್.',
      },
      {
        icon: 'Truck',
        title: 'Loading Bays & Heavy Truck Yards',
        titleKn: 'ಲೋಡಿಂಗ್ ಬೇ ಮತ್ತು ಟ್ರಕ್ ಯಾರ್ಡ್‌ಗಳು',
        description: 'High-strength outdoor aprons engineered for loaded tipper and trailer turning.',
        descriptionKn: 'ಭಾರೀ ಲಾರಿಗಳ ಸಂಚಾರಕ್ಕೆ ಬಲಿಷ್ಠ ಹೊರಾಂಗಣ ಯಾರ್ಡ್.',
      },
      {
        icon: 'Droplet',
        title: 'ETP Tanks, Sumps & Bund Walls',
        titleKn: 'ETP ಟ್ಯಾಂಕ್ ಮತ್ತು ನೀರಿನ ಸಂಪ್‌ಗಳು',
        description: 'Low-permeability mixes for process-water tanks, sumps, and containment bunds.',
        descriptionKn: 'ನೀರು ಸೋರಿಕೆಯಾಗದ ಟ್ಯಾಂಕ್ ಮತ್ತು ಬಂಡ್ ಗೋಡೆಗಳು.',
      },
      {
        icon: 'Blocks',
        title: 'Industrial Compound & Shed Walls',
        titleKn: 'ಕಾರ್ಖಾನೆ ಕಾಂಪೌಂಡ್ ಮತ್ತು ಶೆಡ್ ಗೋಡೆಗಳು',
        description: 'High-output 6" and 8" solid cement bricks for tall shed enclosures.',
        descriptionKn: 'ಎತ್ತರದ ಶೆಡ್ ಗೋಡೆಗಳಿಗೆ ಗಟ್ಟಿ 6" ಮತ್ತು 8" ಸಿಮೆಂಟ್ ಬ್ಲಾಕ್‌ಗಳು.',
      },
    ],
    recommendedGrades: [
      {
        use: 'Sub-Base Blinding Below Heavy Floors',
        useKn: 'ನೆಲಹಾಸಿನ ಕೆಳಗಿನ PCC ಪದರ',
        grade: 'M15',
        notes: 'Firm, level sub-base beneath heavy-duty industrial trimix bays.',
        notesKn: 'ಟ್ರೈಮಿಕ್ಸ್ ನೆಲಹಾಸಿನ ಕೆಳಗೆ ಸಮತಟ್ಟು ಆಧಾರ.',
      },
      {
        use: 'Factory Trimix Floors & Agro Sheds',
        useKn: 'ಕಾರ್ಖಾನೆ ಟ್ರೈಮಿಕ್ಸ್ ನೆಲಹಾಸು',
        grade: 'M25 / M30',
        notes: 'Controlled aggregate sizing for smooth vacuum-dewatered or laser floors.',
        notesKn: 'ನಯವಾದ ಮತ್ತು ಬಾಳಿಕೆ ಬರುವ ಕೈಗಾರಿಕಾ ನೆಲಹಾಸಿಗೆ ಸೂಕ್ತ.',
      },
      {
        use: 'Truck Aprons, Crane Beams & Machine Bases',
        useKn: 'ಟ್ರಕ್ ಯಾರ್ಡ್, ಕ್ರೇನ್ ಬೀಮ್ ಮತ್ತು ಯಂತ್ರ ಬೇಸ್',
        grade: 'M35 / M40+',
        notes: 'High load capacity and impact resistance for continuous plant operation.',
        notesKn: 'ಭಾರೀ ಯಂತ್ರಗಳು ಮತ್ತು ಕ್ರೇನ್ ಭಾರಕ್ಕೆ ಹೆಚ್ಚಿನ ಶಕ್ತಿ.',
      },
      {
        use: 'Factory Enclosure & Boundary Walls',
        useKn: 'ಕಾರ್ಖಾನೆ ಶೆಡ್ ಮತ್ತು ಕಾಂಪೌಂಡ್ ಗೋಡೆಗಳು',
        grade: 'Cement Bricks (6"/8")',
        notes: 'Durable machine-pressed solid blocks for rapid perimeter masonry.',
        notesKn: 'ದೊಡ್ಡ ಶೆಡ್ ಮತ್ತು ಕಾಂಪೌಂಡ್ ಗೋಡೆಗಳಿಗೆ ವೇಗದ ಪೂರೈಕೆ.',
      },
    ],
    faqs: [
      {
        q: 'Is your concrete suitable for Trimix / vacuum-dewatered industrial flooring?',
        qKn: 'ನಿಮ್ಮ ಕಾಂಕ್ರೀಟ್ ಟ್ರೈಮಿಕ್ಸ್ (Trimix) ಕೈಗಾರಿಕಾ ನೆಲಹಾಸಿಗೆ ಸೂಕ್ತವೇ?',
        a: 'Yes. Let us know your floor finishing method (Trimix / power-trowel) while booking so we adjust slump and aggregate proportions for clean surface finishing.',
        aKn: 'ಹೌದು. ಬುಕಿಂಗ್ ವೇಳೆ ಟ್ರೈಮಿಕ್ಸ್ ಅಗತ್ಯವನ್ನು ತಿಳಿಸಿದರೆ ಅದಕ್ಕೆ ತಕ್ಕಂತೆ ಮಿಶ್ರಣ ಮತ್ತು ಸ್ಲಂಪ್ ಹೊಂದಿಸಲಾಗುತ್ತದೆ.',
      },
      {
        q: 'Can large machine-foundation pours run continuously overnight?',
        qKn: 'ದೊಡ್ಡ ಯಂತ್ರದ ಅಡಿಪಾಯ ಕಾಮಗಾರಿಗೆ ರಾತ್ರಿ ನಿರಂತರ ಕಾಂಕ್ರೀಟ್ ಪೂರೈಕೆ ಸಿಗುತ್ತದೆಯೇ?',
        a: 'Yes. Our plant operates 24 hours a day so monolithic machine bases and industrial bays can be cast in one continuous shift without interruption.',
        aKn: 'ಹೌದು. ನಮ್ಮ ಘಟಕ 24 ಗಂಟೆಯೂ ತೆರೆದಿರುವುದರಿಂದ ನಿರಂತರವಾಗಿ ಒಂದೇ ಬಾರಿಗೆ ಸುರಿಯಬಹುದು.',
      },
      {
        q: 'Do you serve industrial areas and agro parks around both Ranebennur and Davangere?',
        qKn: 'ರಾಣೆಬೆನ್ನೂರು ಮತ್ತು ದಾವಣಗೆರೆ ಕೈಗಾರಿಕಾ ಪ್ರದೇಶಗಳಿಗೆ ಪೂರೈಕೆ ಇದೆಯೇ?',
        a: 'Yes. Our Kotihal plant sits strategically between Ranebennur and Davangere, covering factories, rice/agro mills, and logistics parks within ~50 km.',
        aKn: 'ಹೌದು, ಕೊತಿಹಾಳ್ ಘಟಕದಿಂದ ರಾಣೆಬೆನ್ನೂರು ಮತ್ತು ದಾವಣಗೆರೆ ಎರಡೂ ಕೈಗಾರಿಕಾ ವಲಯಗಳಿಗೆ ~50 ಕಿ.ಮೀ ಒಳಗೆ ಪೂರೈಸುತ್ತೇವೆ.',
      },
      {
        q: 'Can we establish an ongoing commercial credit/rate agreement for multi-phase factory expansion?',
        qKn: 'ಹಂತ-ಹಂತದ ಕಾರ್ಖಾನೆ ವಿಸ್ತರಣೆಗೆ ದರ ಒಪ್ಪಂದ ಮಾಡಿಕೊಳ್ಳಬಹುದೇ?',
        a: 'Yes. Submit your phase-wise m³ and cement brick schedule on /quote or /partner for a tailored project rate proposal.',
        aKn: 'ಹೌದು. /quote ಅಥವಾ /partner ಪುಟದ ಮೂಲಕ ನಿಮ್ಮ ಯೋಜನೆಯ ಅಂದಾಜು ಪ್ರಮಾಣವನ್ನು ಕಳುಹಿಸಿ ದರ ಪಟ್ಟಿ ಪಡೆಯಿರಿ.',
      },
    ],
    gallery: [
      { id: 'ind-g1', imageUrl: '', caption: 'Wide-Bay Industrial Floor Concrete Pour', captionKn: 'ಕೈಗಾರಿಕಾ ಶೆಡ್ ನೆಲಹಾಸು ಕಾಮಗಾರಿ' },
      { id: 'ind-g2', imageUrl: '', caption: 'Heavy Machine Foundation Casting', captionKn: 'ಭಾರೀ ಯಂತ್ರದ ಅಡಿಪಾಯ ಕಾಂಕ್ರೀಟ್' },
      { id: 'ind-g3', imageUrl: '', caption: 'External Truck Apron & Loading Yard', captionKn: 'ಟ್ರಕ್ ಯಾರ್ಡ್ ಮತ್ತು ಲೋಡಿಂಗ್ ಬೇ' },
      { id: 'ind-g4', imageUrl: '', caption: '8" Solid Cement Blocks for Shed Walls', captionKn: 'ಶೆಡ್ ಗೋಡೆಗಳಿಗೆ 8" ಸಿಮೆಂಟ್ ಬ್ಲಾಕ್‌ಗಳು' },
    ],
  },
];

export function seedDatabase(): void {
  initSchema();

  const insertSetting = db.prepare(`INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`);
  insertSetting.run('businessConfig', JSON.stringify(DEFAULT_BUSINESS_CONFIG));
  insertSetting.run('schedulingConfig', JSON.stringify(DEFAULT_SCHEDULING_CONFIG));
  insertSetting.run('heroSlides', JSON.stringify(DEFAULT_HERO_SLIDES));
  insertSetting.run('statsItems', JSON.stringify(DEFAULT_STATS));
  insertSetting.run('customerPages', JSON.stringify(DEFAULT_CUSTOMER_PAGES));

  // Auto-upgrade old unconfirmed placeholder config if still untouched
  const currentBizRow = db.prepare(`SELECT value FROM settings WHERE key = 'businessConfig'`).get() as
    | { value: string }
    | undefined;
  if (currentBizRow) {
    try {
      const parsed = JSON.parse(currentBizRow.value);
      if (parsed.phone === '[PHONE]' || (parsed.address && String(parsed.address).includes('[ADDRESS'))) {
        db.prepare(`UPDATE settings SET value = ?, updated_at = datetime('now') WHERE key = 'businessConfig'`).run(
          JSON.stringify(DEFAULT_BUSINESS_CONFIG)
        );
        db.prepare(`UPDATE settings SET value = ?, updated_at = datetime('now') WHERE key = 'schedulingConfig'`).run(
          JSON.stringify(DEFAULT_SCHEDULING_CONFIG)
        );
        db.prepare(`UPDATE settings SET value = ?, updated_at = datetime('now') WHERE key = 'heroSlides'`).run(
          JSON.stringify(DEFAULT_HERO_SLIDES)
        );
        db.prepare(`UPDATE settings SET value = ?, updated_at = datetime('now') WHERE key = 'statsItems'`).run(
          JSON.stringify(DEFAULT_STATS)
        );
      } else if (
        !parsed.googleMapsUrl ||
        parsed.googleReviewUrl === 'https://www.google.com/maps/search/?api=1&query=14.4607,75.6633' ||
        !parsed.facebookUrl ||
        !parsed.instagramUrl
      ) {
        const updatedBiz = {
          ...parsed,
          facebookUrl: parsed.facebookUrl || 'https://www.facebook.com/MyConcretekotihal',
          instagramUrl: parsed.instagramUrl || 'https://www.instagram.com/myconcretektl?knvt=cGttbzg1NGJ0N3o3',
          googleMapsUrl: parsed.googleMapsUrl || 'https://share.google/oZzcrYosJ0JYw2tTn',
          googleReviewUrl:
            !parsed.googleReviewUrl ||
            parsed.googleReviewUrl === 'https://www.google.com/maps/search/?api=1&query=14.4607,75.6633'
              ? 'https://share.google/oZzcrYosJ0JYw2tTn'
              : parsed.googleReviewUrl,
        };
        db.prepare(`UPDATE settings SET value = ?, updated_at = datetime('now') WHERE key = 'businessConfig'`).run(
          JSON.stringify(updatedBiz)
        );
      }
    } catch {
      // ignore
    }
  }

  // Upgrade untouched 3-slide hero defaults to the 4-slide MY CONCRETE light/dark hero set
  const currentHeroRow = db.prepare(`SELECT value FROM settings WHERE key = 'heroSlides'`).get() as
    | { value: string }
    | undefined;
  if (currentHeroRow) {
    try {
      const parsedSlides = JSON.parse(currentHeroRow.value);
      if (
        Array.isArray(parsedSlides) &&
        parsedSlides.length === 3 &&
        parsedSlides[0]?.id === 'slide-1' &&
        parsedSlides[0]?.ctaPrimary === 'Book Delivery' &&
        !parsedSlides[0]?.imageUrl
      ) {
        db.prepare(`UPDATE settings SET value = ?, updated_at = datetime('now') WHERE key = 'heroSlides'`).run(
          JSON.stringify(DEFAULT_HERO_SLIDES)
        );
      } else if (
        Array.isArray(parsedSlides) &&
        parsedSlides.length === 4 &&
        !parsedSlides.some((s: { id?: string }) => s.id === 'slide-5')
      ) {
        const slide5 = DEFAULT_HERO_SLIDES.find((s) => s.id === 'slide-5');
        if (slide5) {
          db.prepare(`UPDATE settings SET value = ?, updated_at = datetime('now') WHERE key = 'heroSlides'`).run(
            JSON.stringify([...parsedSlides, slide5])
          );
        }
      }
    } catch {
      // ignore
    }
  }

  // Populate /images/customers/*.webp paths on existing untouched customerPages rows
  const currentCustRow = db.prepare(`SELECT value FROM settings WHERE key = 'customerPages'`).get() as
    | { value: string }
    | undefined;
  if (currentCustRow) {
    try {
      const parsedCust = JSON.parse(currentCustRow.value);
      if (Array.isArray(parsedCust)) {
        let changed = false;
        const upgraded = parsedCust.map((seg: Record<string, unknown>) => {
          const slug = String(seg.slug || '');
          const def = DEFAULT_CUSTOMER_PAGES.find((d) => d.slug === slug);
          if (!def) return seg;
          const next = { ...seg };
          if (!next.heroImage) {
            next.heroImage = def.heroImage;
            changed = true;
          }
          if (!next.cardImage) {
            next.cardImage = def.cardImage;
            changed = true;
          }
          if (!next.heroAlt) {
            next.heroAlt = def.heroAlt;
            changed = true;
          }
          if (!next.cardAlt) {
            next.cardAlt = def.cardAlt;
            changed = true;
          }
          if (next.visualKey !== def.visualKey && (slug === 'commercial' || slug === 'government' || slug === 'institutions')) {
            next.visualKey = def.visualKey;
            changed = true;
          }
          return next;
        });
        if (changed) {
          db.prepare(`UPDATE settings SET value = ?, updated_at = datetime('now') WHERE key = 'customerPages'`).run(
            JSON.stringify(upgraded)
          );
        }
      }
    } catch {
      // ignore
    }
  }

  // Ensure Cement Bricks product exists even on upgraded DBs
  const hasBricks = db.prepare(`SELECT id FROM products WHERE slug = 'cement-bricks'`).get();
  if (!hasBricks) {
    const existingCount = (db.prepare(`SELECT COUNT(*) AS count FROM products`).get() as { count: number }).count;
    if (existingCount > 0) {
      // Clean out old placeholder-only products if no bookings exist yet, and seed clean catalog
      const bookingCount = (db.prepare(`SELECT COUNT(*) AS count FROM bookings`).get() as { count: number }).count;
      if (bookingCount === 0) {
        db.exec(`DELETE FROM products`);
      }
    }
  }

  const productCountRow = db.prepare(`SELECT COUNT(*) AS count FROM products`).get() as { count: number };
  if (productCountRow.count === 0) {
    const insertProduct = db.prepare(`
      INSERT INTO products (
        slug, name, tagline, category, unit_type, is_offered, sort_order,
        overview, properties_json, uses_json, grades_json, faqs_json, image_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const p of SEED_PRODUCTS) {
      insertProduct.run(
        p.slug,
        p.name,
        p.tagline,
        p.category,
        p.unitType,
        p.isOffered,
        p.sortOrder,
        p.overview,
        JSON.stringify(p.properties),
        JSON.stringify(p.uses),
        JSON.stringify(p.grades),
        JSON.stringify(p.faqs),
        ''
      );
    }
  }

  // Remove old "[PLACEHOLDER" sample projects/media if present so we never show fake claims
  db.prepare(`DELETE FROM projects WHERE volume_note LIKE '%PLACEHOLDER%'`).run();
  db.prepare(`DELETE FROM media_items WHERE caption LIKE '%Placeholder%'`).run();

  const blogCount = db.prepare(`SELECT COUNT(*) AS count FROM blogs`).get() as { count: number };
  if (blogCount.count === 0) {
    const insertBlog = db.prepare(`
      INSERT INTO blogs (slug, title, category, excerpt, content, author, read_time, published_at, image_url, published)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const b of SEED_BLOGS) {
      insertBlog.run(
        b.slug,
        b.title,
        b.category,
        b.excerpt,
        b.content,
        b.author,
        b.readTime,
        b.publishedAt,
        b.imageUrl,
        b.published
      );
    }
  }

  const adminEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const adminPass = process.env.ADMIN_PASSWORD || '';
  if (adminEmail && adminPass.length >= 8) {
    const existingAdmin = db
      .prepare(`SELECT id FROM admin_users WHERE lower(email) = ?`)
      .get(adminEmail);
    if (!existingAdmin) {
      const hash = bcrypt.hashSync(adminPass, 12);
      db.prepare(
        `INSERT INTO admin_users (email, name, password_hash, role, must_change_password) VALUES (?, 'Owner', ?, 'owner', 1)`
      ).run(adminEmail, hash);
    }
  }
}
