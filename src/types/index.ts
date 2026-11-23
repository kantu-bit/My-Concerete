export interface PlantLocation {
  id: string;
  name: string;
  shortLabel: string;
  address: string;
  city: string;
  postalCode: string;
  lat: number;
  lng: number;
  phone: string;
  whatsapp?: string;
  hours: string;
  serviceRadiusKm: number;
  googleMapsUrl: string;
  pinColor?: 'blue' | 'red';
  isPrimary?: boolean;
}

export interface BusinessConfig {
  businessName: string;
  shortName: string;
  tagline: string;
  region: string;
  address: string;
  phone: string;
  whatsapp: string;
  email: string;
  workingHours: string;
  serviceRadiusKm: number;
  establishedYear: string;
  plantCapacity: string;
  mixersCount: string;
  pumpsCount: string;
  plantsCount: string;
  annualVolume: string;
  plantLat: number;
  plantLng: number;
  sustainabilityConfirmed: boolean;
  sustainabilityTitle: string;
  sustainabilitySummary: string;
  facebookUrl: string;
  instagramUrl: string;
  youtubeUrl: string;
  linkedinUrl: string;
  googleMapsUrl?: string;
  googleReviewUrl?: string;
  baseDeliveryFee: number;
  perKmRate: number;
  freeRadiusKm: number;
  linePumpCharge: number;
  boomPumpCharge: number;
}

export interface SlotConfig {
  id: string;
  label: string;
  isNight?: boolean;
  maxBookings: number;
  maxVolumeM3: number;
}

export interface SchedulingConfig {
  closedDays: number[];
  holidays: string[];
  slots: SlotConfig[];
}

export interface MosaicTile {
  id: string;
  title: string;
  titleKn?: string;
  subtitle: string;
  subtitleKn?: string;
  to: string;
  tone: 'blue' | 'navy' | 'red';
  visualKey: string;
  imageUrl?: string;
  objectPosition?: string;
}

export interface HeroSlide {
  id: string;
  kicker: string;
  headline: string;
  headlineKn?: string;
  subtext: string;
  subtextKn?: string;
  ctaPrimary: string;
  ctaPrimaryKn?: string;
  ctaSecondary: string;
  ctaLink?: string;
  themeStyle?: 'light' | 'dark' | 'mosaic';
  visualKey: string;
  imageUrl: string;
  objectPosition?: string;
  alt?: string;
  mosaicTiles?: MosaicTile[];
}

export interface StatItem {
  id: string;
  label: string;
  value: string;
  suffix: string;
  note: string;
}

export interface ProductGrade {
  grade: string;
  strength: string;
  slump: string;
  maxAgg: string;
  indicativeRate: number;
  note: string;
}

export interface ProductFaq {
  q: string;
  a: string;
}

export interface ProductItem {
  id: number;
  slug: string;
  name: string;
  tagline: string;
  category: string;
  unitType: 'm3' | 'pieces';
  isOffered: boolean;
  sortOrder: number;
  overview: string;
  properties: string[];
  uses: string[];
  grades: ProductGrade[];
  faqs: ProductFaq[];
  imageUrl: string;
}

export interface ProjectItem {
  id: number;
  title: string;
  segment: string;
  location: string;
  grade_used: string;
  volume_note: string;
  summary: string;
  image_url: string;
  sort_order: number;
}

export interface MediaItem {
  id: number;
  title: string;
  category: string;
  caption: string;
  image_url: string;
  published_date: string;
  sort_order: number;
}

export interface BlogPost {
  id: number;
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  content: string;
  author: string;
  read_time: string;
  published_at: string;
  image_url: string;
  published: number;
}

export interface TestimonialItem {
  id: number;
  author_name: string;
  role_or_company: string;
  location: string;
  quote: string;
  rating: number;
  project_title?: string;
  segment?: string;
  grade_used?: string;
  volume_note?: string;
  project_image_url?: string;
  published: number;
  created_at?: string;
}

export interface SlotAvailability extends SlotConfig {
  bookedCount: number;
  bookedVolumeM3: number;
  remainingBookings: number;
  remainingVolumeM3: number;
  isFull: boolean;
}

export interface BookingRecord {
  id: number;
  booking_code: string;
  product_slug: string;
  product_name: string;
  grade: string;
  quantity_m3: number;
  unit_type: 'm3' | 'pieces';
  usage_type: string;
  slump_mm: string;
  pump_type: 'none' | 'line' | 'boom';
  delivery_date: string;
  slot_id: string;
  slot_label: string;
  site_address: string;
  landmark: string;
  city: string;
  site_lat: number;
  site_lng: number;
  distance_km: number;
  dispatch_plant?: string;
  dispatch_plant_name?: string;
  estimated_concrete_amount: number;
  estimated_delivery_fee: number;
  estimated_pump_fee: number;
  estimated_total: number;
  customer_name: string;
  phone: string;
  email: string;
  gst_number: string;
  notes: string;
  status: string;
  language?: string;
  is_read?: number;
  email_status?: string;
  email_error?: string;
  whatsapp_status?: string;
  whatsapp_error?: string;
  notify_email_status?: string;
  notify_whatsapp_status?: string;
  notified_at?: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationConfig {
  notifyEmail: string;
  ownerWhatsapp: string;
  ownerWhatsapp2: string;
  whatsappProvider: 'cloudapi' | 'twilio' | 'callmebot' | 'none';
  whatsappTemplateName: string;
  emailEnabled: boolean;
  whatsappEnabled: boolean;
  customerAckEnabled: boolean;
}

export interface CustomerApplication {
  icon: string;
  title: string;
  titleKn: string;
  description: string;
  descriptionKn: string;
}

export interface CustomerGradeRow {
  use: string;
  useKn: string;
  grade: string;
  notes: string;
  notesKn: string;
}

export interface CustomerFaq {
  q: string;
  qKn: string;
  a: string;
  aKn: string;
}

export interface CustomerGalleryPhoto {
  id: string;
  imageUrl: string;
  caption: string;
  captionKn: string;
}

export interface CustomerSegmentConfig {
  slug: string;
  label: string;
  labelKn: string;
  shortDesc: string;
  shortDescKn: string;
  heroHeadline: string;
  heroHeadlineKn: string;
  heroImage: string;
  heroAlt?: string;
  cardImage?: string;
  cardAlt?: string;
  titleBox: string;
  titleBoxKn: string;
  introParagraphs: [string, string];
  introParagraphsKn: [string, string];
  introImage: string;
  visualKey: string;
  applications: CustomerApplication[];
  recommendedGrades: CustomerGradeRow[];
  faqs: CustomerFaq[];
  gallery: CustomerGalleryPhoto[];
}

