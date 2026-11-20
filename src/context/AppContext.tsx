import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type {
  BlogPost,
  BusinessConfig,
  CustomerSegmentConfig,
  HeroSlide,
  MediaItem,
  ProductItem,
  ProjectItem,
  SchedulingConfig,
  StatItem,
  TestimonialItem,
} from '../types/index.ts';

type Language = 'en' | 'kn';
type Theme = 'light' | 'dark';

interface BootstrapData {
  businessConfig: BusinessConfig;
  schedulingConfig: SchedulingConfig;
  heroSlides: HeroSlide[];
  statsItems: StatItem[];
  customerPages: CustomerSegmentConfig[];
  products: ProductItem[];
  projects: ProjectItem[];
  media: MediaItem[];
  blogs: BlogPost[];
  testimonials: TestimonialItem[];
}

interface AppContextValue {
  data: BootstrapData | null;
  loading: boolean;
  error: string | null;
  lang: Language;
  setLang: (lang: Language) => void;
  theme: Theme;
  toggleTheme: () => void;
  enquiryModalOpen: boolean;
  setEnquiryModalOpen: (open: boolean) => void;
  refreshBootstrap: () => Promise<void>;
  t: (key: string) => string;
}

const TRANSLATIONS: Record<Language, Record<string, string>> = {
  en: {
    home: 'Home',
    about: 'About MY CONCRETE',
    customers: 'Customers',
    products: 'Ready Mix Concrete',
    cementBricks: 'Cement Bricks',
    partner: 'Partner With Us',
    media: 'Gallery',
    blog: 'Blog',
    contact: 'Contact Us',
    getQuote: 'Get A Quote',
    bookDelivery: 'Book Delivery',
    findOurPlant: 'Find Our Plant',
    trackBooking: 'Track Booking',
    open24Hours: 'Open 24 Hours',
    ranebennurDavangere: 'Ranebennur & Davangere',
    whyChooseUs: 'Why Choose MY CONCRETE',
    ourProducts: 'Our Products',
    theDifference: 'Built for Every Segment',
    completedProjects: 'Completed Projects',
    howItWorks: 'How Delivery Works',
    serviceAreaTitle: 'Serving Ranebennur, Davangere & Beyond',
    testimonialsTitle: 'What Builders & Customers Say',
    faqTitle: 'Frequently Asked Questions',
    latestBlogs: 'Latest Technical Articles',
    connectWithUs: 'Connect With Us',
    newsletterTitle: 'Plant Updates & Concrete Guides',
    quickTools: 'Concrete & Brick Planning Tools',
    volumeCalc: 'Volume Calculator',
    brickCalc: 'Brick Calculator',
    plantLocator: 'Plant Locator',
    gradeHelper: 'Grade Helper',
    callNow: 'Call',
    whatsapp: 'WhatsApp',
    bookNow: 'Book',
    allCustomerSectors: 'Customer Sectors We Serve',
    whereWeSupply: 'Where We Supply',
    recommendedGrades: 'Recommended Concrete Grades & Products',
    gradeUse: 'Use',
    typicalGrade: 'Typical Grade',
    gradeNotes: 'Notes',
    indicativeGradeNote: "Indicative only; final grade as per your structural engineer's design.",
    whyMyConcreteFor: 'Why MY CONCRETE for',
    howOrderingWorks: 'How Ordering Works',
    projectGallery: 'Site & Supply Gallery',
    otherCustomerTypes: 'Other Customer Types',
    exploreSector: 'Explore Sector',
  },
  kn: {
    home: 'ಮುಖಪುಟ',
    about: 'MY CONCRETE ಬಗ್ಗೆ',
    customers: 'ಗ್ರಾಹಕರು',
    products: 'ರೆಡಿ ಮಿಕ್ಸ್ ಕಾಂಕ್ರೀಟ್',
    cementBricks: 'ಸಿಮೆಂಟ್ ಇಟ್ಟಿಗೆಗಳು',
    partner: 'ಪಾಲುದಾರರಾಗಿ',
    media: 'ಗ್ಯಾಲರಿ',
    blog: 'ಬ್ಲಾಗ್',
    contact: 'ಸಂಪರ್ಕಿಸಿ',
    getQuote: 'ದರ ಪಟ್ಟಿ ಪಡೆಯಿರಿ',
    bookDelivery: 'ಡೆಲಿವರಿ ಬುಕ್ ಮಾಡಿ',
    findOurPlant: 'ನಮ್ಮ ಪ್ಲಾಂಟ್ ಹುಡುಕಿ',
    trackBooking: 'ಬುಕಿಂಗ್ ಟ್ರ್ಯಾಕ್ ಮಾಡಿ',
    open24Hours: '24 ಗಂಟೆಗಳು ತೆರೆದಿರುತ್ತದೆ',
    ranebennurDavangere: 'ರಾಣೆಬೆನ್ನೂರು ಮತ್ತು ದಾವಣಗೆರೆ',
    whyChooseUs: 'MY CONCRETE ಏಕೆ ಆಯ್ಕೆ ಮಾಡಬೇಕು',
    ourProducts: 'ನಮ್ಮ ಉತ್ಪನ್ನಗಳು',
    theDifference: 'ಪ್ರತಿ ನಿರ್ಮಾಣ ವಿಭಾಗಕ್ಕೂ ಸೂಕ್ತ',
    completedProjects: 'ಪೂರ್ಣಗೊಂಡ ಯೋಜನೆಗಳು',
    howItWorks: 'ಡೆಲಿವರಿ ಪ್ರಕ್ರಿಯೆ ಹೇಗೆ ಕೆಲಸ ಮಾಡುತ್ತದೆ',
    serviceAreaTitle: 'ರಾಣೆಬೆನ್ನೂರು, ದಾವಣಗೆರೆ ಮತ್ತು ಸುತ್ತಮುತ್ತ ಸೇವೆ',
    testimonialsTitle: 'ಗ್ರಾಹಕರ ಅಭಿಪ್ರಾಯಗಳು',
    faqTitle: 'ಪದೇ ಪದೇ ಕೇಳಲಾಗುವ ಪ್ರಶ್ನೆಗಳು',
    latestBlogs: 'ತಾಂತ್ರಿಕ ಲೇಖನಗಳು',
    connectWithUs: 'ನಮ್ಮೊಂದಿಗೆ ಸಂಪರ್ಕಿಸಿ',
    newsletterTitle: 'ಪ್ಲಾಂಟ್ ಮಾಹಿತಿ ಮತ್ತು ಮಾರ್ಗದರ್ಶಿ',
    quickTools: 'ಕಾಂಕ್ರೀಟ್ ಮತ್ತು ಇಟ್ಟಿಗೆ ಯೋಜನಾ ಸಾಧನಗಳು',
    volumeCalc: 'ಪ್ರಮಾಣ ಕ್ಯಾಲ್ಕುಲೇಟರ್',
    brickCalc: 'ಇಟ್ಟಿಗೆ ಕ್ಯಾಲ್ಕುಲೇಟರ್',
    plantLocator: 'ಪ್ಲಾಂಟ್ ಸ್ಥಳ ನಕ್ಷೆ',
    gradeHelper: 'ಗ್ರೇಡ್ ಸಹಾಯಕ',
    callNow: 'ಕರೆ',
    whatsapp: 'ವಾಟ್ಸಾಪ್',
    bookNow: 'ಬುಕ್ ಮಾಡಿ',
    allCustomerSectors: 'ನಾವು ಸೇವೆ ಸಲ್ಲಿಸುವ ಗ್ರಾಹಕ ವಿಭಾಗಗಳು',
    whereWeSupply: 'ನಾವು ಎಲ್ಲಿ ಪೂರೈಸುತ್ತೇವೆ',
    recommendedGrades: 'ಶಿಫಾರಸು ಮಾಡಲಾದ ಕಾಂಕ್ರೀಟ್ ಗ್ರೇಡ್‌ಗಳು',
    gradeUse: 'ಬಳಕೆ',
    typicalGrade: 'ಸಾಮಾನ್ಯ ಗ್ರೇಡ್',
    gradeNotes: 'ಟಿಪ್ಪಣಿಗಳು',
    indicativeGradeNote: 'ಸೂಚನಾತ್ಮಕ ಮಾತ್ರ; ಅಂತಿಮ ಗ್ರೇಡ್ ನಿಮ್ಮ ಸ್ಟ್ರಕ್ಚರಲ್ ಎಂಜಿನಿಯರ್ ವಿನ್ಯಾಸದಂತೆ ಇರಬೇಕು.',
    whyMyConcreteFor: 'MY CONCRETE ಏಕೆ ಸೂಕ್ತ —',
    howOrderingWorks: 'ಆರ್ಡರ್ ಮಾಡುವ ವಿಧಾನ',
    projectGallery: 'ಸೈಟ್ ಮತ್ತು ಪೂರೈಕೆ ಗ್ಯಾಲರಿ',
    otherCustomerTypes: 'ಇತರೆ ಗ್ರಾಹಕ ವಿಭಾಗಗಳು',
    exploreSector: 'ವಿಭಾಗವನ್ನು ನೋಡಿ',
  },
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<BootstrapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem('mc_lang');
    return saved === 'kn' ? 'kn' : 'en';
  });
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('mc_theme');
    return saved === 'dark' ? 'dark' : 'light';
  });
  const [enquiryModalOpen, setEnquiryModalOpen] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('mc_theme', theme);
  }, [theme]);

  const setLang = (next: Language) => {
    setLangState(next);
    localStorage.setItem('mc_lang', next);
  };

  const toggleTheme = () => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));

  const refreshBootstrap = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/bootstrap');
      const { readApiJson } = await import('../utils/api.ts');
      const json = await readApiJson<BootstrapData>(res);
      setData(json);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshBootstrap();
  }, [refreshBootstrap]);

  const t = useCallback(
    (key: string) => TRANSLATIONS[lang][key] || TRANSLATIONS.en[key] || key,
    [lang]
  );

  return (
    <AppContext.Provider
      value={{
        data,
        loading,
        error,
        lang,
        setLang,
        theme,
        toggleTheme,
        enquiryModalOpen,
        setEnquiryModalOpen,
        refreshBootstrap,
        t,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
