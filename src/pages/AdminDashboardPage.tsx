import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  Ban,
  BarChart3,
  CalendarDays,
  Check,
  CheckCircle2,
  Download,
  Eye,
  FileText,
  Image as ImageIcon,
  Inbox,
  KeyRound,
  Layers,
  LogOut,
  Mail,
  MapPin,
  MessageCircle,
  Pencil,
  Plus,
  RefreshCw,
  Settings,
  ShieldCheck,
  Sliders,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { CallLink, EmailLink } from '../components/ContactLinks.tsx';
import { useDocumentMeta } from '../utils/seo.ts';
import { buildWhatsAppUrl } from '../utils/documents.ts';
import { FRIENDLY_API_ERROR, parseJsonResponse } from '../utils/api.ts';
import type {
  BookingRecord,
  BusinessConfig,
  CustomerSegmentConfig,
  HeroSlide,
  NotificationConfig,
  PlantLocation,
  ProductItem,
  SchedulingConfig,
  StatItem,
} from '../types/index.ts';

export type AdminTab =
  | 'analytics'
  | 'bookings'
  | 'inbox'
  | 'products'
  | 'locations'
  | 'scheduling'
  | 'cms'
  | 'gallery'
  | 'customers'
  | 'settings'
  | 'users'
  | 'security';

interface AdminSessionProfile {
  id: number;
  email: string;
  name: string;
  role: 'owner' | 'staff';
  mustChangePassword: boolean;
  twoFactorEnabled: boolean;
}

interface AdminUserRow {
  id: number;
  email: string;
  name: string;
  role: 'owner' | 'staff';
  must_change_password: number;
  two_factor_enabled: number;
  last_login_at: string | null;
  created_at: string;
}

interface AdminLoginLogRow {
  id: number;
  email: string;
  role: string;
  status: string;
  ip_address: string;
  created_at: string;
}

interface SiteVisitRecord {
  id: number;
  visit_code: string;
  visit_type: string;
  preferred_date: string;
  preferred_time: string;
  location: string;
  customer_name: string;
  phone: string;
  email: string;
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
}

interface AdminOverviewData {
  role: 'owner' | 'staff';
  supabaseSync?: {
    configured: boolean;
    usingServiceRole: boolean;
    canRead: boolean;
    bookingCountFromSupabase?: number;
    hint?: string;
  };
  unreadCounts?: {
    bookings: number;
    quotes: number;
    siteVisits: number;
    enquiries: number;
    subscribers: number;
    total: number;
  };
  analytics?: {
    totalBookings: number;
    totalVolumeM3: number;
    totalBricksPieces: number;
    pendingQuotes: number;
    conversionRate: number;
    topGrades: Array<{ grade: string; volumeM3: number }>;
    volumeByDate: Array<{ date: string; volumeM3: number }>;
  };
  bookings: BookingRecord[];
  quotes?: Array<Record<string, unknown>>;
  siteVisits?: SiteVisitRecord[];
  enquiries?: Array<Record<string, unknown>>;
  subscribers?: Array<Record<string, unknown>>;
  emailLogs?: Array<Record<string, unknown>>;
  notificationConfig?: NotificationConfig;
  envCredentialStatus?: {
    smtpConfigured: boolean;
    resendConfigured: boolean;
    cloudapiConfigured: boolean;
    twilioConfigured: boolean;
    callmebotConfigured: boolean;
  };
  notificationStatus?: {
    emailConfigured: boolean;
    emailProvider: 'smtp' | 'resend' | 'none';
    whatsappAutoConfigured: boolean;
    whatsappProvider: 'cloudapi' | 'twilio' | 'callmebot' | 'none';
    ownerEmail: string;
    ownerWhatsapp: string;
    ownerWhatsapp2?: string;
    emailEnabled?: boolean;
    whatsappEnabled?: boolean;
  };
  customers?: Array<{
    name: string;
    phone: string;
    email: string;
    city: string;
    siteAddress?: string;
    landmark?: string;
    gstNumber?: string;
    siteLat?: number;
    siteLng?: number;
    totalOrders: number;
    totalM3: number;
  }>;
}

function getDeliveryStatusClass(status: string): string {
  switch (status) {
    case 'sent':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
    case 'failed':
      return 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border-red-300 dark:border-red-800';
    case 'skipped':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800';
    default:
      return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700';
  }
}

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'confirmed':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200 border-blue-200 dark:border-blue-800';
    case 'approved':
      return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200 border-indigo-200 dark:border-indigo-800';
    case 'dispatched':
      return 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200 border-amber-200 dark:border-amber-800';
    case 'completed':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800';
    case 'waitlisted':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200 border-purple-200 dark:border-purple-800';
    case 'cancelled':
    case 'rejected':
      return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200 border-red-200 dark:border-red-800';
    case 'scheduled':
      return 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200 border-sky-200 dark:border-sky-800';
    default:
      return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700';
  }
}

const IDLE_LIMIT_MS = 30 * 60 * 1000;

export function AdminDashboardPage({
  mode = 'dashboard',
  initialTab,
}: {
  mode?: 'login' | 'dashboard';
  initialTab?: AdminTab;
}) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const resetTokenFromUrl = searchParams.get('resetToken') || '';
  const urlReason = searchParams.get('reason') || '';

  const { data: siteData, refreshBootstrap } = useApp();

  const [authChecked, setAuthChecked] = useState(false);
  const [authConfigured, setAuthConfigured] = useState<boolean | null>(null);
  const [emailConfigured, setEmailConfigured] = useState<boolean>(true);
  const [admin, setAdmin] = useState<AdminSessionProfile | null>(null);

  const [authView, setAuthView] = useState<'signin' | 'otp' | 'forgot' | 'reset'>(
    resetTokenFromUrl ? 'reset' : 'signin'
  );
  const [setupName, setSetupName] = useState('Owner');
  const [setupEmail, setSetupEmail] = useState('myconcretektl@gmail.com');
  const [setupPassword, setSetupPassword] = useState('');
  const [setupConfirmPassword, setSetupConfirmPassword] = useState('');

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [authNotice, setAuthNotice] = useState<string | null>(
    urlReason === 'idle'
      ? 'You were signed out automatically after 30 minutes of inactivity.'
      : null
  );
  const [authSubmitting, setAuthSubmitting] = useState(false);

  const [otpChallengeToken, setOtpChallengeToken] = useState('');
  const [otpMaskedEmail, setOtpMaskedEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');

  const [forgotEmail, setForgotEmail] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');

  const [cpCurrent, setCpCurrent] = useState('');
  const [cpNew, setCpNew] = useState('');
  const [cpConfirm, setCpConfirm] = useState('');
  const [cpError, setCpError] = useState<string | null>(null);
  const [cpBusy, setCpBusy] = useState(false);

  const tabFromUrl = searchParams.get('tab') as AdminTab | null;
  const [tab, setTab] = useState<AdminTab>(initialTab || tabFromUrl || 'analytics');
  const [overview, setOverview] = useState<AdminOverviewData | null>(null);
  const [notifForm, setNotifForm] = useState<NotificationConfig>({
    notifyEmail: 'myconcretektl@gmail.com',
    ownerWhatsapp: '917337807372',
    ownerWhatsapp2: '',
    whatsappProvider: 'none',
    whatsappTemplateName: '',
    emailEnabled: true,
    whatsappEnabled: true,
    customerAckEnabled: true,
  });
  const [notifSaving, setNotifSaving] = useState(false);
  const [notifTesting, setNotifTesting] = useState(false);
  const [notifTestResult, setNotifTestResult] = useState<{
    emailResult?: { ok: boolean; status: string; provider: string; error?: string };
    whatsappResult?: { ok: boolean; status: string; provider: string; error?: string };
  } | null>(null);
  const [resendingKey, setResendingKey] = useState<string | null>(null);
  const [usersData, setUsersData] = useState<{
    users: AdminUserRow[];
    loginLogs: AdminLoginLogRow[];
  } | null>(null);
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    role: 'staff' as 'staff' | 'owner',
    temporaryPassword: '',
  });
  const [userFormError, setUserFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [appointmentsSubTab, setAppointmentsSubTab] = useState<'deliveries' | 'visits'>('deliveries');
  const [bookingFilter, setBookingFilter] = useState('all');
  const [bookingSearch, setBookingSearch] = useState('');
  const [viewingBooking, setViewingBooking] = useState<BookingRecord | null>(null);
  const [editingBooking, setEditingBooking] = useState<BookingRecord | null>(null);
  const [editBookingForm, setEditBookingForm] = useState({
    customerName: '',
    phone: '',
    email: '',
    gstNumber: '',
    grade: '',
    quantityM3: 1,
    usageType: '',
    slumpMm: '',
    pumpType: 'none' as 'none' | 'line' | 'boom',
    deliveryDate: '',
    slotId: '',
    siteAddress: '',
    landmark: '',
    city: '',
    notes: '',
    status: 'confirmed',
  });
  const [bookingActionBusy, setBookingActionBusy] = useState(false);
  const [bookingModalError, setBookingModalError] = useState<string | null>(null);
  const [confirmCancelBookingId, setConfirmCancelBookingId] = useState<number | null>(null);

  const [editingVisit, setEditingVisit] = useState<SiteVisitRecord | null>(null);
  const [editVisitForm, setEditVisitForm] = useState({
    customerName: '',
    phone: '',
    email: '',
    preferredDate: '',
    preferredTime: '',
    location: '',
    notes: '',
    status: 'scheduled',
  });
  const [visitActionBusy, setVisitActionBusy] = useState(false);
  const [visitModalError, setVisitModalError] = useState<string | null>(null);
  const [confirmCancelVisitId, setConfirmCancelVisitId] = useState<number | null>(null);

  const [bizForm, setBizForm] = useState<BusinessConfig | null>(null);
  const [locationsForm, setLocationsForm] = useState<PlantLocation[]>([]);
  const [newLocationForm, setNewLocationForm] = useState({
    name: '',
    shortLabel: '',
    address: '',
    city: '',
    postalCode: '',
    lat: '14.4644',
    lng: '75.9218',
    phone: '+91 73378 07372',
    whatsapp: '+91 73378 07372',
    hours: 'Open 24 Hours (All Days)',
    serviceRadiusKm: '50',
    googleMapsUrl: '',
    pinColor: 'red' as 'blue' | 'red',
  });
  const [schedForm, setSchedForm] = useState<SchedulingConfig | null>(null);
  const [heroForm, setHeroForm] = useState<HeroSlide[]>([]);
  const [statsForm, setStatsForm] = useState<StatItem[]>([]);
  const [customerPagesForm, setCustomerPagesForm] = useState<CustomerSegmentConfig[]>([]);
  const [activeCustomerIdx, setActiveCustomerIdx] = useState(0);
  const [productsForm, setProductsForm] = useState<ProductItem[]>([]);

  const [newHoliday, setNewHoliday] = useState('');
  const [newStat, setNewStat] = useState({ label: '', value: '', suffix: '', note: '' });
  const [newProject, setNewProject] = useState({
    title: '',
    segment: 'Residential',
    location: 'Ranebennur, Karnataka',
    gradeUsed: 'M25',
    volumeNote: '',
    summary: '',
    imageUrl: '',
  });
  const [newMedia, setNewMedia] = useState({
    title: '',
    category: 'Plant',
    caption: '',
    imageUrl: '',
  });
  const [newTestimonial, setNewTestimonial] = useState({
    authorName: '',
    roleOrCompany: '',
    location: 'Ranebennur',
    projectTitle: '',
    segment: 'Residential',
    gradeUsed: 'M25 Slab Concrete',
    volumeNote: '',
    projectImageUrl: '',
    rating: 5,
    quote: '',
  });
  const [newBlog, setNewBlog] = useState({
    slug: '',
    title: '',
    category: 'Technical Guide',
    excerpt: '',
    content: '',
    author: 'MY CONCRETE Team',
  });

  const lastActivityRef = useRef<number>(Date.now());

  useDocumentMeta({
    title: 'Admin Dispatch & CMS Console | MY CONCRETE',
    description: 'Secure MY CONCRETE admin console for dispatch, rates, gallery, and staff.',
  });

  useEffect(() => {
    if (resetTokenFromUrl) {
      setAuthView('reset');
    }
  }, [resetTokenFromUrl]);

  useEffect(() => {
    if (initialTab) {
      setTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    if (!viewingBooking && !editingBooking && !editingVisit) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setViewingBooking(null);
        setEditingBooking(null);
        setEditingVisit(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [viewingBooking, editingBooking, editingVisit]);

  useEffect(() => {
    if (siteData) {
      setBizForm(siteData.businessConfig);
      setLocationsForm(siteData.plantLocations || []);
      setSchedForm(siteData.schedulingConfig);
      setHeroForm(siteData.heroSlides);
      setStatsForm(siteData.statsItems);
      setCustomerPagesForm(siteData.customerPages || []);
      setProductsForm(siteData.products);
    }
  }, [siteData]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  }, []);

  const handleApiAuthFailure = useCallback(
    (res: Response) => {
      if (res.status === 401) {
        setAdmin(null);
        setOverview(null);
        setUsersData(null);
        navigate('/admin/login', { replace: true });
        return true;
      }
      return false;
    },
    [navigate]
  );

  const checkSession = useCallback(async () => {
    try {
      const statusRes = await fetch('/api/admin/auth-status', { credentials: 'include' });
      let hasSession = false;
      if (statusRes.ok) {
        const { data: sJson } = await parseJsonResponse<{
          configured: boolean;
          emailConfigured?: boolean;
          authenticated?: boolean;
        }>(statusRes);
        if (sJson) {
          setAuthConfigured(Boolean(sJson.configured));
          if (typeof sJson.emailConfigured === 'boolean') {
            setEmailConfigured(sJson.emailConfigured);
          }
          hasSession = Boolean(sJson.authenticated);
        }
      }
      if (hasSession) {
        const meRes = await fetch('/api/admin/me', { credentials: 'include' });
        if (meRes.ok) {
          const { data: meJson } = await parseJsonResponse<{ admin: AdminSessionProfile }>(meRes);
          setAdmin(meJson?.admin || null);
        } else {
          setAdmin(null);
        }
      } else {
        setAdmin(null);
      }
    } catch {
      setAdmin(null);
    } finally {
      setAuthChecked(true);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  useEffect(() => {
    if (!authChecked) return;
    if (mode === 'login' && admin && !resetTokenFromUrl) {
      navigate('/admin', { replace: true });
    } else if (mode === 'dashboard' && !admin) {
      navigate('/admin/login', { replace: true });
    }
  }, [authChecked, mode, admin, resetTokenFromUrl, navigate]);

  const fetchOverview = useCallback(async () => {
    if (!admin || admin.mustChangePassword) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/overview', { credentials: 'include' });
      if (handleApiAuthFailure(res)) return;
      if (res.status === 403) {
        const { data: j } = await parseJsonResponse<{ mustChangePassword?: boolean }>(res);
        if (j?.mustChangePassword) {
          setAdmin((prev) => (prev ? { ...prev, mustChangePassword: true } : prev));
        }
        return;
      }
      if (res.ok) {
        const { data: json } = await parseJsonResponse<AdminOverviewData>(res);
        if (json) {
          setOverview(json);
          if (json.notificationConfig) {
            setNotifForm(json.notificationConfig);
          }
        }
      }
    } finally {
      setLoading(false);
    }
  }, [admin, handleApiAuthFailure]);

  const fetchUsers = useCallback(async () => {
    if (!admin || admin.role !== 'owner' || admin.mustChangePassword) return;
    const res = await fetch('/api/admin/users', { credentials: 'include' });
    if (handleApiAuthFailure(res)) return;
    if (res.ok) {
      const { data: json } = await parseJsonResponse<{
        users: AdminUserRow[];
        loginLogs: AdminLoginLogRow[];
      }>(res);
      if (json) setUsersData(json);
    }
  }, [admin, handleApiAuthFailure]);

  useEffect(() => {
    if (!admin || admin.mustChangePassword) return;
    if (admin.role === 'staff' && !['bookings', 'gallery', 'security'].includes(tab)) {
      setTab('bookings');
      return;
    }
    fetchOverview();
    if (admin.role === 'owner' && tab === 'users') {
      fetchUsers();
    }
  }, [admin, tab, fetchOverview, fetchUsers]);

  const handleLogout = useCallback(
    async (reason?: string) => {
      try {
        await fetch('/api/admin/logout', {
          method: 'POST',
          credentials: 'include',
        });
      } catch {
        // ignore network error during logout
      }
      setAdmin(null);
      setOverview(null);
      setUsersData(null);
      navigate(reason ? `/admin/login?reason=${encodeURIComponent(reason)}` : '/admin/login', {
        replace: true,
      });
    },
    [navigate]
  );

  // 30-minute client-side idle timeout synchronized with server session idle check
  useEffect(() => {
    if (!admin) return;
    const markActivity = () => {
      lastActivityRef.current = Date.now();
    };
    const events: Array<keyof WindowEventMap> = ['mousemove', 'keydown', 'click', 'scroll'];
    events.forEach((ev) => window.addEventListener(ev, markActivity, { passive: true }));
    const timer = window.setInterval(() => {
      if (Date.now() - lastActivityRef.current > IDLE_LIMIT_MS) {
        handleLogout('idle');
      }
    }, 30_000);
    return () => {
      events.forEach((ev) => window.removeEventListener(ev, markActivity));
      window.clearInterval(timer);
    };
  }, [admin, handleLogout]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError(null);
    setAuthNotice(null);
    setAuthSubmitting(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const { data: json, isJson } = await parseJsonResponse<{
        error?: string;
        requiresOtp?: boolean;
        challengeToken?: string;
        maskedEmail?: string;
        admin?: AdminSessionProfile;
      }>(res);
      if (!isJson || !json) {
        setLoginError(FRIENDLY_API_ERROR);
        return;
      }
      if (!res.ok) {
        setLoginError(json.error || 'Invalid credentials');
        return;
      }
      setLoginPassword('');
      if (json.requiresOtp && json.challengeToken) {
        setOtpChallengeToken(json.challengeToken);
        setOtpMaskedEmail(json.maskedEmail || '');
        setOtpCode('');
        setAuthView('otp');
        setAuthNotice('A 6-digit verification code was dispatched to your admin email.');
        return;
      }
      if (!json.admin) {
        setLoginError(FRIENDLY_API_ERROR);
        return;
      }
      lastActivityRef.current = Date.now();
      setAdmin(json.admin);
      navigate('/admin', { replace: true });
    } finally {
      setAuthSubmitting(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoginError(null);
    setAuthSubmitting(true);
    try {
      const res = await fetch('/api/admin/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ challengeToken: otpChallengeToken, otp: otpCode.trim() }),
      });
      const { data: json, isJson } = await parseJsonResponse<{
        error?: string;
        admin?: AdminSessionProfile;
      }>(res);
      if (!isJson || !json) {
        setLoginError(FRIENDLY_API_ERROR);
        return;
      }
      if (!res.ok || !json.admin) {
        setLoginError(json.error || 'Invalid verification code');
        return;
      }
      lastActivityRef.current = Date.now();
      setAdmin(json.admin);
      navigate('/admin', { replace: true });
    } finally {
      setAuthSubmitting(false);
    }
  }

  async function handleSetupOwner(e: React.FormEvent) {
    e.preventDefault();
    setLoginError(null);
    setAuthNotice(null);
    if (setupPassword !== setupConfirmPassword) {
      setLoginError('Passwords do not match.');
      return;
    }
    setAuthSubmitting(true);
    try {
      const res = await fetch('/api/admin/setup-owner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: setupName.trim() || 'Owner',
          email: setupEmail.trim(),
          password: setupPassword,
        }),
      });
      const { data: json, isJson } = await parseJsonResponse<{
        error?: string;
        admin?: AdminSessionProfile;
      }>(res);
      if (!isJson || !json) {
        setLoginError(FRIENDLY_API_ERROR);
        return;
      }
      if (!res.ok || !json.admin) {
        setLoginError(json.error || 'Unable to create Owner account.');
        return;
      }
      setSetupPassword('');
      setSetupConfirmPassword('');
      setAuthConfigured(true);
      lastActivityRef.current = Date.now();
      setAdmin(json.admin);
      navigate('/admin', { replace: true });
    } finally {
      setAuthSubmitting(false);
    }
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    setLoginError(null);
    setAuthNotice(null);
    setAuthSubmitting(true);
    try {
      const res = await fetch('/api/admin/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const { data: json, isJson } = await parseJsonResponse<{
        error?: string;
        message?: string;
        emailConfigured?: boolean;
      }>(res);
      if (!isJson || !json) {
        setLoginError(FRIENDLY_API_ERROR);
        return;
      }
      if (typeof json.emailConfigured === 'boolean') {
        setEmailConfigured(json.emailConfigured);
      }
      if (!res.ok) {
        setLoginError(json.error || 'Could not process password reset request');
        return;
      }
      setAuthNotice(
        json.message || 'Reset link dispatched. Please check Inbox and Spam.'
      );
    } finally {
      setAuthSubmitting(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setLoginError(null);
    setAuthNotice(null);
    if (resetNewPassword !== resetConfirmPassword) {
      setLoginError('Passwords do not match.');
      return;
    }
    setAuthSubmitting(true);
    try {
      const res = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetTokenFromUrl, newPassword: resetNewPassword }),
      });
      const { data: json, isJson } = await parseJsonResponse<{ error?: string }>(res);
      if (!isJson || !json) {
        setLoginError(FRIENDLY_API_ERROR);
        return;
      }
      if (!res.ok) {
        setLoginError(json.error || 'Unable to reset password.');
        return;
      }
      setResetNewPassword('');
      setResetConfirmPassword('');
      setAuthView('signin');
      setAuthNotice('Password reset complete. You can now sign in with your new password.');
      navigate('/admin/login', { replace: true });
    } finally {
      setAuthSubmitting(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setCpError(null);
    if (cpNew !== cpConfirm) {
      setCpError('New passwords do not match.');
      return;
    }
    setCpBusy(true);
    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ currentPassword: cpCurrent, newPassword: cpNew }),
      });
      if (handleApiAuthFailure(res)) return;
      const { data: json, isJson } = await parseJsonResponse<{
        error?: string;
        admin?: AdminSessionProfile;
      }>(res);
      if (!isJson || !json) {
        setCpError(FRIENDLY_API_ERROR);
        return;
      }
      if (!res.ok) {
        setCpError(json.error || 'Could not update password');
        return;
      }
      setCpCurrent('');
      setCpNew('');
      setCpConfirm('');
      if (json.admin) {
        setAdmin(json.admin);
      }
      showToast('Password updated securely.');
    } finally {
      setCpBusy(false);
    }
  }

  async function toggleTwoFactor(enabled: boolean) {
    const res = await fetch('/api/admin/me/security', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ twoFactorEnabled: enabled }),
    });
    if (handleApiAuthFailure(res)) return;
    if (res.ok) {
      setAdmin((prev) => (prev ? { ...prev, twoFactorEnabled: enabled } : prev));
      showToast(enabled ? '2FA email OTP enabled.' : '2FA email OTP disabled.');
    }
  }

  function openEditBookingModal(b: BookingRecord) {
    setBookingModalError(null);
    setConfirmCancelBookingId(null);
    setEditingBooking(b);
    setEditBookingForm({
      customerName: b.customer_name || '',
      phone: b.phone || '',
      email: b.email || '',
      gstNumber: b.gst_number || '',
      grade: b.grade || '',
      quantityM3: Number(b.quantity_m3 || 1),
      usageType: b.usage_type || '',
      slumpMm: b.slump_mm || '',
      pumpType: (b.pump_type || 'none') as 'none' | 'line' | 'boom',
      deliveryDate: b.delivery_date || '',
      slotId: b.slot_id || '',
      siteAddress: b.site_address || '',
      landmark: b.landmark || '',
      city: b.city || '',
      notes: b.notes || '',
      status: b.status || 'confirmed',
    });
  }

  function openEditVisitModal(sv: SiteVisitRecord) {
    setVisitModalError(null);
    setConfirmCancelVisitId(null);
    setEditingVisit(sv);
    setEditVisitForm({
      customerName: sv.customer_name || '',
      phone: sv.phone || '',
      email: sv.email || '',
      preferredDate: sv.preferred_date || '',
      preferredTime: sv.preferred_time || '',
      location: sv.location || '',
      notes: sv.notes || '',
      status: sv.status || 'scheduled',
    });
  }

  async function updateBooking(id: number, payload: Record<string, unknown>) {
    setBookingActionBusy(true);
    try {
      const res = await fetch(`/api/admin/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      if (handleApiAuthFailure(res)) return false;
      const { data: json, isJson } = await parseJsonResponse<{
        error?: string;
        booking?: BookingRecord;
        supabaseUpdated?: boolean;
      }>(res);
      if (!isJson || !json) {
        showToast(FRIENDLY_API_ERROR);
        return false;
      }
      if (!res.ok) {
        showToast(json.error || 'Could not update booking.');
        return false;
      }
      if (json.booking && viewingBooking?.id === id) {
        setViewingBooking(json.booking);
      }
      setConfirmCancelBookingId(null);
      await fetchOverview();
      showToast(
        payload.status === 'cancelled'
          ? 'Appointment cancelled.'
          : json.supabaseUpdated
            ? 'Booking updated & synced.'
            : 'Booking updated.'
      );
      return true;
    } finally {
      setBookingActionBusy(false);
    }
  }

  async function saveBookingEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingBooking) return;
    setBookingModalError(null);
    setBookingActionBusy(true);
    try {
      const res = await fetch(`/api/admin/bookings/${editingBooking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...editBookingForm,
          quantityM3: Number(editBookingForm.quantityM3),
        }),
      });
      if (handleApiAuthFailure(res)) return;
      const { data: json, isJson } = await parseJsonResponse<{
        error?: string;
        booking?: BookingRecord;
        supabaseUpdated?: boolean;
      }>(res);
      if (!isJson || !json) {
        setBookingModalError(FRIENDLY_API_ERROR);
        return;
      }
      if (!res.ok) {
        setBookingModalError(json.error || 'Unable to save booking changes.');
        return;
      }
      if (json.booking && viewingBooking?.id === editingBooking.id) {
        setViewingBooking(json.booking);
      }
      setEditingBooking(null);
      await fetchOverview();
      showToast(json.supabaseUpdated ? 'Appointment saved & synced to Supabase.' : 'Appointment changes saved.');
    } finally {
      setBookingActionBusy(false);
    }
  }

  async function updateSiteVisit(id: number, payload: Record<string, unknown>) {
    setVisitActionBusy(true);
    try {
      const res = await fetch(`/api/admin/site-visits/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      if (handleApiAuthFailure(res)) return false;
      const { data: json, isJson } = await parseJsonResponse<{ error?: string }>(res);
      if (!isJson || !json || !res.ok) {
        showToast(json?.error || 'Could not update site visit.');
        return false;
      }
      setConfirmCancelVisitId(null);
      await fetchOverview();
      showToast(payload.status === 'cancelled' ? 'Visit cancelled.' : 'Visit updated.');
      return true;
    } finally {
      setVisitActionBusy(false);
    }
  }

  async function saveSiteVisitEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingVisit) return;
    setVisitModalError(null);
    setVisitActionBusy(true);
    try {
      const res = await fetch(`/api/admin/site-visits/${editingVisit.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(editVisitForm),
      });
      if (handleApiAuthFailure(res)) return;
      const { data: json, isJson } = await parseJsonResponse<{ error?: string }>(res);
      if (!isJson || !json) {
        setVisitModalError(FRIENDLY_API_ERROR);
        return;
      }
      if (!res.ok) {
        setVisitModalError(json.error || 'Unable to update site visit.');
        return;
      }
      setEditingVisit(null);
      await fetchOverview();
      showToast('Site visit updated.');
    } finally {
      setVisitActionBusy(false);
    }
  }

  async function saveSetting(key: string, value: unknown) {
    const res = await fetch(`/api/admin/settings/${key}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(value),
    });
    if (handleApiAuthFailure(res)) return;
    await refreshBootstrap();
    showToast('Settings saved.');
  }

  async function saveProduct(p: ProductItem) {
    const res = await fetch(`/api/admin/products/${p.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(p),
    });
    if (handleApiAuthFailure(res)) return;
    await refreshBootstrap();
    showToast(`Saved ${p.name}`);
  }

  async function markLeadRead(
    kind: 'booking' | 'quote' | 'visit' | 'enquiry' | 'newsletter',
    id: number,
    isRead = true
  ) {
    if (!id) return;
    const res = await fetch('/api/admin/leads/mark-read', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ kind, id, isRead }),
    });
    if (handleApiAuthFailure(res)) return;
    if (res.ok) {
      await fetchOverview();
    }
  }

  async function resendLeadNotification(
    kind: 'booking' | 'quote' | 'visit' | 'enquiry' | 'newsletter',
    id: number
  ) {
    const key = `${kind}:${id}`;
    setResendingKey(key);
    try {
      const res = await fetch('/api/admin/notifications/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ kind, id }),
      });
      if (handleApiAuthFailure(res)) return;
      const { data: json } = await parseJsonResponse<{
        emailResult?: { status: string; error?: string };
        whatsappResult?: { status: string; error?: string };
        error?: string;
      }>(res);
      if (!res.ok) {
        showToast(json?.error || 'Could not resend notification.');
        return;
      }
      await fetchOverview();
      showToast(
        `Notification resend: Email=${json?.emailResult?.status || 'done'}, WhatsApp=${json?.whatsappResult?.status || 'done'}`
      );
    } finally {
      setResendingKey(null);
    }
  }

  async function saveNotificationSettings(e: React.FormEvent) {
    e.preventDefault();
    setNotifSaving(true);
    try {
      const res = await fetch('/api/admin/notification-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(notifForm),
      });
      if (handleApiAuthFailure(res)) return;
      const { data: json } = await parseJsonResponse<{
        error?: string;
        config?: NotificationConfig;
      }>(res);
      if (!res.ok) {
        showToast(json?.error || 'Unable to save notification settings.');
        return;
      }
      if (json?.config) setNotifForm(json.config);
      await fetchOverview();
      showToast('Notification settings saved.');
    } finally {
      setNotifSaving(false);
    }
  }

  async function sendTestNotification() {
    setNotifTesting(true);
    setNotifTestResult(null);
    try {
      const res = await fetch('/api/admin/notifications/test', {
        method: 'POST',
        credentials: 'include',
      });
      if (handleApiAuthFailure(res)) return;
      const { data: json } = await parseJsonResponse<{
        error?: string;
        emailResult?: { ok: boolean; status: string; provider: string; error?: string };
        whatsappResult?: { ok: boolean; status: string; provider: string; error?: string };
      }>(res);
      if (!res.ok || !json) {
        showToast(json?.error || 'Test notification failed.');
        return;
      }
      setNotifTestResult(json);
      await fetchOverview();
      showToast('Test notification dispatched.');
    } finally {
      setNotifTesting(false);
    }
  }

  function exportCustomersCsv() {
    if (!overview?.customers) return;
    const header = ['Name', 'Phone', 'Email', 'City', 'Total Orders', 'Total Volume (m3)'];
    const rows = overview.customers.map((c) => [
      `"${c.name.replace(/"/g, '""')}"`,
      c.phone,
      `"${c.email.replace(/"/g, '""')}"`,
      `"${c.city.replace(/"/g, '""')}"`,
      String(c.totalOrders),
      String(c.totalM3),
    ]);
    const csv = [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `myconcrete-customers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--bg)]">
        <p className="text-sm text-[var(--muted)]">Verifying admin session...</p>
      </div>
    );
  }

  if (!admin || (mode === 'login' && resetTokenFromUrl)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--bg)]">
        <div className="w-full max-w-md warm-card p-8 space-y-6">
          <div className="space-y-1">
            <Link to="/" className="text-xs font-semibold text-[#D92B25] hover:underline">
              &larr; Back to MY CONCRETE Website
            </Link>
            <h1 className="font-display font-extrabold text-2xl text-[#0F1F5C] dark:text-white pt-2">
              {authView === 'otp'
                ? 'Two-Factor Verification'
                : authView === 'forgot'
                  ? 'Reset Admin Password'
                  : authView === 'reset'
                    ? 'Choose New Password'
                    : 'Plant Admin Sign In'}
            </h1>
            <p className="text-xs text-[var(--muted)]">
              MY CONCRETE – Readymix Concrete Unit · Secure Dispatch &amp; CMS Console
            </p>
          </div>

          {authConfigured === false && (
            <form onSubmit={handleSetupOwner} className="space-y-4">
              <div className="rounded-xl border border-amber-400/60 bg-amber-50 dark:bg-amber-950/30 p-3.5 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                <p className="font-bold">First-Time Owner Account Setup</p>
                <p>
                  No Owner login has been claimed yet. Create your Owner email and password below to open the Admin Console.
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">Owner Name</label>
                <input
                  type="text"
                  required
                  value={setupName}
                  onChange={(e) => setSetupName(e.target.value)}
                  placeholder="Owner"
                  className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3.5 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">Owner Email</label>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={setupEmail}
                  onChange={(e) => setSetupEmail(e.target.value)}
                  placeholder="myconcretektl@gmail.com"
                  className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3.5 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">Choose Strong Password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={setupPassword}
                  onChange={(e) => setSetupPassword(e.target.value)}
                  placeholder="Min 8 chars (letters + number or symbol)"
                  className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3.5 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">Confirm Password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={setupConfirmPassword}
                  onChange={(e) => setSetupConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3.5 py-2.5 text-sm"
                />
              </div>

              {loginError && <p className="text-xs text-red-600 font-medium">{loginError}</p>}

              <button
                type="submit"
                disabled={authSubmitting}
                className="w-full btn-orange-pill py-2.5 text-sm disabled:opacity-60"
              >
                {authSubmitting ? 'Creating Owner Account...' : 'Create Owner Account & Sign In'}
              </button>
            </form>
          )}

          {authNotice && (
            <div className="rounded-xl border border-[#1F3FA8]/30 bg-[#EEF4FF] dark:bg-[#132463] p-3 text-xs text-[#0F1F5C] dark:text-slate-100">
              {authNotice}
            </div>
          )}

          {authConfigured !== false && authView === 'signin' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">Admin / Staff Email</label>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="myconcretektl@gmail.com"
                  className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3.5 py-2.5 text-sm"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-[var(--muted)]">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginError(null);
                      setAuthNotice(null);
                      setForgotEmail(loginEmail);
                      setAuthView('forgot');
                    }}
                    className="text-xs font-semibold text-[#1F3FA8] dark:text-[#FFC93C] hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3.5 py-2.5 text-sm"
                />
              </div>

              {loginError && <p className="text-xs text-red-600 font-medium">{loginError}</p>}

              <button
                type="submit"
                disabled={authSubmitting}
                className="w-full btn-orange-pill py-2.5 text-sm disabled:opacity-60"
              >
                {authSubmitting ? 'Signing In...' : 'Sign In to Admin Console'}
              </button>
            </form>
          )}

          {authConfigured !== false && authView === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <p className="text-xs text-[var(--muted)]">
                Enter the 6-digit verification code sent to <strong>{otpMaskedEmail}</strong>.
              </p>
              <div>
                <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">
                  6-Digit Verification Code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="\d{6}"
                  maxLength={6}
                  required
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3.5 py-2.5 text-center font-mono text-lg tracking-[0.4em]"
                />
              </div>
              {loginError && <p className="text-xs text-red-600 font-medium">{loginError}</p>}
              <button
                type="submit"
                disabled={authSubmitting}
                className="w-full btn-orange-pill py-2.5 text-sm disabled:opacity-60"
              >
                {authSubmitting ? 'Verifying...' : 'Verify & Open Console'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthView('signin');
                  setLoginError(null);
                  setAuthNotice(null);
                }}
                className="w-full text-xs text-[var(--muted)] hover:underline"
              >
                &larr; Back to Sign In
              </button>
            </form>
          )}

          {authConfigured !== false && authView === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              {!emailConfigured ? (
                <div className="rounded-xl border border-amber-400/60 bg-amber-50 dark:bg-amber-950/30 p-3.5 text-xs text-amber-900 dark:text-amber-200 space-y-1.5">
                  <p className="font-bold">Email Delivery Not Configured Yet</p>
                  <p>
                    <code className="font-mono">SMTP_USER</code> / <code className="font-mono">SMTP_PASS</code> (Gmail App Password) or{' '}
                    <code className="font-mono">RESEND_API_KEY</code> is empty, so reset links cannot reach{' '}
                    <code className="font-mono">myconcretektl@gmail.com</code> yet.
                  </p>
                  <p>
                    To regain access right away, set <code className="font-mono">ADMIN_EMAIL</code> &amp;{' '}
                    <code className="font-mono">ADMIN_PASSWORD</code> in your environment variables and restart/redeploy.
                  </p>
                </div>
              ) : (
                <p className="text-xs text-[var(--muted)]">
                  A password reset link will be emailed to your registered admin email (for example{' '}
                  <code className="font-mono">myconcretektl@gmail.com</code>).
                </p>
              )}
              <div>
                <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">Account Email</label>
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="myconcretektl@gmail.com"
                  className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3.5 py-2.5 text-sm"
                />
              </div>
              {loginError && <p className="text-xs text-red-600 font-medium">{loginError}</p>}
              <button
                type="submit"
                disabled={authSubmitting}
                className="w-full btn-orange-pill py-2.5 text-sm disabled:opacity-60"
              >
                {authSubmitting ? 'Sending Link...' : 'Send Password Reset Link'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthView('signin');
                  setLoginError(null);
                }}
                className="w-full text-xs text-[var(--muted)] hover:underline"
              >
                &larr; Back to Sign In
              </button>
            </form>
          )}

          {authView === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">New Password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={resetNewPassword}
                  onChange={(e) => setResetNewPassword(e.target.value)}
                  placeholder="Min 8 chars, letters + number or symbol"
                  className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3.5 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={resetConfirmPassword}
                  onChange={(e) => setResetConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3.5 py-2.5 text-sm"
                />
              </div>
              {loginError && <p className="text-xs text-red-600 font-medium">{loginError}</p>}
              <button
                type="submit"
                disabled={authSubmitting}
                className="w-full btn-orange-pill py-2.5 text-sm disabled:opacity-60"
              >
                {authSubmitting ? 'Updating...' : 'Set New Password'}
              </button>
            </form>
          )}

          <p className="text-[11px] text-[var(--muted)] border-t border-[#D7E4FF] dark:border-[#264096] pt-4">
            Protected by httpOnly session cookies, 30-minute idle timeout, and 5-attempt lockout.
          </p>
        </div>
      </div>
    );
  }

  // Mandatory password change on first login or after Owner issues temporary password
  if (admin.mustChangePassword) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--bg)]">
        <div className="w-full max-w-md warm-card p-8 space-y-5">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#D92B25]">
              <KeyRound className="w-3.5 h-3.5" />
              First-Login Security Step
            </span>
            <h1 className="font-display font-extrabold text-2xl text-[#0F1F5C] dark:text-white">
              Change Your Password
            </h1>
            <p className="text-xs text-[var(--muted)]">
              Signed in as <strong>{admin.email}</strong> ({admin.role.toUpperCase()}). For security, set a personal
              password before accessing the console.
            </p>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[var(--muted)] mb-1">Current Password</label>
              <input
                type="password"
                required
                value={cpCurrent}
                onChange={(e) => setCpCurrent(e.target.value)}
                className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3.5 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--muted)] mb-1">New Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={cpNew}
                onChange={(e) => setCpNew(e.target.value)}
                placeholder="At least 8 chars, letter + number/symbol"
                className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3.5 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--muted)] mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={cpConfirm}
                onChange={(e) => setCpConfirm(e.target.value)}
                className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3.5 py-2 text-sm"
              />
            </div>
            {cpError && <p className="text-xs text-red-600 font-medium">{cpError}</p>}
            <button
              type="submit"
              disabled={cpBusy}
              className="w-full btn-orange-pill py-2.5 text-sm disabled:opacity-60"
            >
              {cpBusy ? 'Saving...' : 'Update Password & Continue'}
            </button>
          </form>

          <button
            type="button"
            onClick={() => handleLogout()}
            className="w-full inline-flex items-center justify-center gap-1.5 text-xs text-[var(--muted)] hover:underline pt-2"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    );
  }

  const isOwner = admin.role === 'owner';

  const filteredBookings = (overview?.bookings || []).filter((b) => {
    const matchesStatus = bookingFilter === 'all' || b.status === bookingFilter;
    const q = bookingSearch.trim().toLowerCase();
    const matchesSearch =
      !q ||
      b.booking_code.toLowerCase().includes(q) ||
      b.customer_name.toLowerCase().includes(q) ||
      b.phone.includes(q) ||
      b.city.toLowerCase().includes(q) ||
      b.grade.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const unreadBookingsCount =
    (overview?.unreadCounts?.bookings || 0) + (overview?.unreadCounts?.siteVisits || 0);
  const unreadInboxCount =
    (overview?.unreadCounts?.quotes || 0) +
    (overview?.unreadCounts?.enquiries || 0) +
    (overview?.unreadCounts?.subscribers || 0);

  const ownerNavItems: Array<{
    id: AdminTab;
    label: string;
    icon: React.ReactNode;
    badge?: number;
  }> = [
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> },
    {
      id: 'bookings',
      label: 'Bookings & Dispatch',
      icon: <CalendarDays className="w-4 h-4" />,
      badge: unreadBookingsCount,
    },
    {
      id: 'inbox',
      label: 'Quotes & Inbox',
      icon: <Inbox className="w-4 h-4" />,
      badge: unreadInboxCount,
    },
    { id: 'products', label: 'Products & Rates', icon: <Layers className="w-4 h-4" /> },
    { id: 'locations', label: 'Locations', icon: <MapPin className="w-4 h-4" /> },
    { id: 'scheduling', label: 'Plant, 24/7 Slots & Config', icon: <Sliders className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings → Notifications', icon: <Settings className="w-4 h-4" /> },
    { id: 'cms', label: 'CMS, Stats & Testimonials', icon: <FileText className="w-4 h-4" /> },
    { id: 'gallery', label: 'Media Gallery', icon: <ImageIcon className="w-4 h-4" /> },
    { id: 'customers', label: 'Customers & CSV', icon: <Users className="w-4 h-4" /> },
    { id: 'users', label: 'Staff & Security', icon: <ShieldCheck className="w-4 h-4" /> },
  ];

  const staffNavItems: Array<{
    id: AdminTab;
    label: string;
    icon: React.ReactNode;
    badge?: number;
  }> = [
    { id: 'bookings', label: 'Bookings & Dispatch', icon: <CalendarDays className="w-4 h-4" /> },
    { id: 'gallery', label: 'Media Gallery', icon: <ImageIcon className="w-4 h-4" /> },
    { id: 'security', label: 'Account Security', icon: <ShieldCheck className="w-4 h-4" /> },
  ];

  const navItems = isOwner ? ownerNavItems : staffNavItems;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[var(--bg)] text-[var(--text)]">
      <aside className="w-full lg:w-64 bg-[#0F1F5C] text-slate-200 border-b lg:border-b-0 lg:border-r border-[#264096] p-4 flex flex-col justify-between shrink-0">
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-2">
            <Link to="/" className="font-display font-extrabold text-base text-white flex items-center gap-2">
              <span className="inline-block w-2 h-4 bg-[#D92B25] rounded-xs" />
              <span>MY CONCRETE</span>
            </Link>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white/10 text-[#FFC93C]">
              {admin.role}
            </span>
          </div>

          <nav className="flex lg:flex-col gap-1 overflow-x-auto pb-1 lg:pb-0">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setTab(item.id);
                  if (item.id === 'users' && isOwner) {
                    navigate('/admin/users', { replace: true });
                  } else if (item.id === 'locations' && isOwner) {
                    navigate('/admin/locations', { replace: true });
                  } else if (item.id === 'settings' && isOwner) {
                    navigate('/admin/settings', { replace: true });
                  } else if (
                    window.location.pathname === '/admin/users' ||
                    window.location.pathname === '/admin/locations' ||
                    window.location.pathname === '/admin/settings'
                  ) {
                    navigate('/admin', { replace: true });
                  }
                }}
                className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  tab === item.id
                    ? 'bg-[#D92B25] text-white'
                    : 'text-slate-300 hover:bg-[#1F3FA8] hover:text-white'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  {item.icon}
                  <span>{item.label}</span>
                </span>
                {item.badge && item.badge > 0 ? (
                  <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-[#FFC93C] text-[#0F1F5C] text-[10px] font-extrabold tabular-nums">
                    {item.badge}
                  </span>
                ) : null}
              </button>
            ))}
          </nav>
        </div>

        <div className="hidden lg:flex flex-col gap-2 pt-5 border-t border-white/15">
          <div className="text-[11px] text-slate-300 truncate" title={admin.email}>
            {admin.name} · <span className="text-slate-400">{admin.email}</span>
          </div>
          <Link to="/" className="text-xs text-slate-300 hover:text-white">
            View Public Website &rarr;
          </Link>
          <button
            type="button"
            onClick={() => handleLogout()}
            className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-white"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 p-5 sm:p-8 space-y-6 overflow-x-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#D7E4FF] dark:border-[#264096] pb-4">
          <div>
            <p className="text-xs text-[var(--muted)]">Admin / {navItems.find((n) => n.id === tab)?.label}</p>
            <h1 className="font-display font-bold text-2xl text-[#0F1F5C] dark:text-white">
              {navItems.find((n) => n.id === tab)?.label}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {toast && (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-[#16A34A] text-white px-4 py-1.5 text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{toast}</span>
              </div>
            )}
            <button
              type="button"
              onClick={() => handleLogout()}
              className="lg:hidden inline-flex items-center gap-1.5 rounded-lg border border-[#D7E4FF] dark:border-[#264096] px-3 py-1.5 text-xs font-semibold"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {loading && !overview && <p className="text-sm text-[var(--muted)]">Loading dispatch data...</p>}

        {/* TAB: ANALYTICS */}
        {isOwner && tab === 'analytics' && overview?.analytics && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="warm-card p-5">
                <p className="text-xs text-[var(--muted)]">Total Bookings</p>
                <p className="font-slab font-bold text-3xl tabular-nums mt-1">{overview.analytics.totalBookings}</p>
              </div>
              <div className="warm-card p-5">
                <p className="text-xs text-[var(--muted)]">Concrete Scheduled</p>
                <p className="font-slab font-bold text-3xl tabular-nums mt-1 text-[#1F3FA8] dark:text-[#FFC93C]">
                  {overview.analytics.totalVolumeM3} m³
                </p>
              </div>
              <div className="warm-card p-5">
                <p className="text-xs text-[var(--muted)]">Bricks Scheduled</p>
                <p className="font-slab font-bold text-3xl tabular-nums mt-1 text-[#D92B25]">
                  {overview.analytics.totalBricksPieces.toLocaleString('en-IN')} pcs
                </p>
              </div>
              <div className="warm-card p-5">
                <p className="text-xs text-[var(--muted)]">Pending Quotes</p>
                <p className="font-slab font-bold text-3xl tabular-nums mt-1">{overview.analytics.pendingQuotes}</p>
              </div>
              <div className="warm-card p-5">
                <p className="text-xs text-[var(--muted)]">Quote Conversion</p>
                <p className="font-slab font-bold text-3xl tabular-nums mt-1">{overview.analytics.conversionRate}%</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="warm-card p-6 space-y-4">
                <h2 className="font-display font-bold text-base">Top Grades / Sizes Ordered</h2>
                {overview.analytics.topGrades.length === 0 ? (
                  <p className="text-xs text-[var(--muted)]">No bookings recorded yet.</p>
                ) : (
                  <div className="space-y-3">
                    {overview.analytics.topGrades.map((g) => (
                      <div key={g.grade} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold">{g.grade}</span>
                          <span className="font-mono tabular-nums">{g.volumeM3.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="h-2 rounded-full bg-[var(--bg-soft)] overflow-hidden">
                          <div className="h-full bg-[#D92B25]" style={{ width: '100%' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="warm-card p-6 space-y-4">
                <h2 className="font-display font-bold text-base">Scheduled Concrete by Date (m³)</h2>
                {overview.analytics.volumeByDate.length === 0 ? (
                  <p className="text-xs text-[var(--muted)]">No upcoming scheduled deliveries yet.</p>
                ) : (
                  <div className="space-y-2 text-xs">
                    {overview.analytics.volumeByDate.map((row) => (
                      <div
                        key={row.date}
                        className="flex items-center justify-between py-1.5 border-b border-[#D7E4FF] dark:border-[#264096]"
                      >
                        <span className="font-mono tabular-nums">{row.date}</span>
                        <span className="font-mono font-semibold tabular-nums">{row.volumeM3} m³</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB: BOOKINGS */}
        {tab === 'bookings' && overview && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAppointmentsSubTab('deliveries')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors ${
                    appointmentsSubTab === 'deliveries'
                      ? 'bg-[#0F1F5C] text-white dark:bg-[#FFC93C] dark:text-[#0F1F5C]'
                      : 'bg-[var(--surface)] border border-[#D7E4FF] dark:border-[#264096]'
                  }`}
                >
                  Delivery Bookings ({overview.bookings.length})
                </button>
                {isOwner && (
                  <button
                    type="button"
                    onClick={() => setAppointmentsSubTab('visits')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors ${
                      appointmentsSubTab === 'visits'
                        ? 'bg-[#0F1F5C] text-white dark:bg-[#FFC93C] dark:text-[#0F1F5C]'
                        : 'bg-[var(--surface)] border border-[#D7E4FF] dark:border-[#264096]'
                    }`}
                  >
                    Site &amp; Plant Visits ({(overview.siteVisits || []).length})
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => fetchOverview()}
                disabled={loading}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--surface)] px-3.5 py-2 text-xs font-semibold hover:border-[#1F3FA8] disabled:opacity-60 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>{loading ? 'Refreshing...' : 'Refresh Database'}</span>
              </button>
            </div>

            {overview.supabaseSync?.configured && !overview.supabaseSync.canRead && (
              <div className="rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 p-3.5 flex items-start gap-2.5 text-xs text-amber-950 dark:text-amber-100">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">Supabase Read/Update Key Needed for Cloud Retrieval</p>
                  <p className="text-[11px] leading-relaxed">
                    New website appointments automatically save into Supabase. To retrieve and edit existing Supabase records
                    from this dashboard, add your server-side <code className="font-mono font-semibold">SUPABASE_SERVICE_ROLE_KEY</code>{' '}
                    to <code className="font-mono">.env</code> and refresh. Currently displaying records stored in the plant database.
                  </p>
                </div>
              </div>
            )}

            {appointmentsSubTab === 'deliveries' && (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-1.5">
                    {['all', 'confirmed', 'waitlisted', 'approved', 'dispatched', 'completed', 'cancelled', 'rejected'].map(
                      (st) => {
                        const count =
                          st === 'all'
                            ? overview.bookings.length
                            : overview.bookings.filter((b) => b.status === st).length;
                        return (
                          <button
                            key={st}
                            type="button"
                            onClick={() => setBookingFilter(st)}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize cursor-pointer ${
                              bookingFilter === st
                                ? 'bg-[#D92B25] text-white'
                                : 'bg-[var(--surface)] border border-[#D7E4FF] dark:border-[#264096]'
                            }`}
                          >
                            {st} ({count})
                          </button>
                        );
                      }
                    )}
                  </div>
                  <input
                    type="search"
                    value={bookingSearch}
                    onChange={(e) => setBookingSearch(e.target.value)}
                    placeholder="Search ID, name, phone, city..."
                    className="rounded-full border border-[#D7E4FF] dark:border-[#264096] bg-[var(--surface)] px-4 py-1.5 text-xs w-64"
                  />
                </div>

                <div className="warm-card overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[var(--bg)] border-b border-[#D7E4FF] dark:border-[#264096] text-[var(--muted)]">
                      <tr>
                        <th className="px-4 py-3">Booking ID</th>
                        <th className="px-4 py-3">Customer</th>
                        <th className="px-4 py-3">Product / Qty</th>
                        <th className="px-4 py-3">24/7 Schedule</th>
                        <th className="px-4 py-3">Site &amp; Estimate</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Manage Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D7E4FF] dark:divide-[#264096]">
                      {filteredBookings.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-[var(--muted)]">
                            No matching bookings found.
                          </td>
                        </tr>
                      ) : (
                        filteredBookings.map((b) => {
                          const isUnread = Number(b.is_read ?? 1) === 0;
                          const emailSt = b.notify_email_status || b.email_status || 'pending';
                          const waSt = b.notify_whatsapp_status || b.whatsapp_status || 'pending';
                          return (
                            <tr
                              key={b.id || b.booking_code}
                              className={`hover:bg-[var(--bg)]/50 align-top ${isUnread ? 'bg-[#FFFBEB]/60 dark:bg-[#1E293B]/50' : ''}`}
                            >
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setConfirmCancelBookingId(null);
                                      setViewingBooking(b);
                                      if (isUnread) void markLeadRead('booking', b.id, true);
                                    }}
                                    className="font-mono font-bold text-[#1F3FA8] dark:text-[#FFC93C] hover:underline cursor-pointer"
                                  >
                                    {b.booking_code}
                                  </button>
                                  {isUnread && (
                                    <span className="px-1.5 py-0.5 rounded-full bg-[#D92B25] text-white text-[9px] font-bold uppercase">
                                      New
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-[var(--muted)] mt-0.5 tabular-nums">
                                  {String(b.created_at || '').slice(0, 10)}
                                </p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  <span
                                    title={b.email_error || `Email: ${emailSt}`}
                                    className={`px-1.5 py-0.5 rounded border text-[9px] font-semibold ${getDeliveryStatusClass(emailSt)}`}
                                  >
                                    Email: {emailSt}
                                  </span>
                                  <span
                                    title={b.whatsapp_error || `WhatsApp: ${waSt}`}
                                    className={`px-1.5 py-0.5 rounded border text-[9px] font-semibold ${getDeliveryStatusClass(waSt)}`}
                                  >
                                    WA: {waSt}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <p className="font-semibold">{b.customer_name}</p>
                                <p className="text-[var(--muted)] tabular-nums">{b.phone}</p>
                                {b.email && <p className="text-[11px] text-[var(--muted)] truncate max-w-[160px]">{b.email}</p>}
                              </td>
                              <td className="px-4 py-3 tabular-nums">
                                <p className="font-semibold">
                                  {b.grade} · {Number(b.quantity_m3).toLocaleString('en-IN')}{' '}
                                  {b.unit_type === 'pieces' ? 'pcs' : 'm³'}
                                </p>
                                <p className="text-[11px] text-[var(--muted)]">
                                  {b.unit_type !== 'pieces' ? `Pump: ${b.pump_type} · ${b.usage_type}` : b.product_name}
                                </p>
                              </td>
                              <td className="px-4 py-3 tabular-nums">
                                <p className="font-semibold">{b.delivery_date}</p>
                                <p className="text-[var(--muted)]">{b.slot_label}</p>
                              </td>
                              <td className="px-4 py-3 max-w-[200px]">
                                <p className="truncate font-medium">
                                  {b.city} ({b.distance_km} km)
                                </p>
                                <p className="text-[11px] text-[var(--muted)] font-mono tabular-nums">
                                  {b.dispatch_plant_name ? `From ${b.dispatch_plant_name} · ` : ''}Est. INR{' '}
                                  {Number(b.estimated_total || 0).toLocaleString('en-IN')}
                                </p>
                              </td>
                              <td className="px-4 py-3">
                                <div className="space-y-1.5">
                                  <span
                                    className={`inline-block px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wide ${getStatusBadgeClass(
                                      b.status
                                    )}`}
                                  >
                                    {b.status}
                                  </span>
                                  <select
                                    aria-label={`Change status for ${b.booking_code}`}
                                    value={b.status}
                                    disabled={bookingActionBusy}
                                    onChange={(e) => updateBooking(b.id, { status: e.target.value })}
                                    className="block w-full rounded-lg border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-2 py-1 text-[11px]"
                                  >
                                    <option value="confirmed">Confirmed</option>
                                    <option value="waitlisted">Waitlisted</option>
                                    <option value="approved">Approved</option>
                                    <option value="dispatched">Dispatched</option>
                                    <option value="completed">Completed</option>
                                    <option value="rejected">Rejected</option>
                                    <option value="cancelled">Cancelled</option>
                                  </select>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setConfirmCancelBookingId(null);
                                      setViewingBooking(b);
                                      if (isUnread) void markLeadRead('booking', b.id, true);
                                    }}
                                    className="inline-flex items-center gap-1 rounded-lg border border-[#D7E4FF] dark:border-[#264096] px-2.5 py-1.5 font-semibold hover:border-[#1F3FA8] cursor-pointer"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>View</span>
                                  </button>
                                  {isOwner && (
                                    <button
                                      type="button"
                                      disabled={resendingKey === `booking:${b.id}`}
                                      onClick={() => resendLeadNotification('booking', b.id)}
                                      title="Resend owner email & WhatsApp notification"
                                      className="inline-flex items-center gap-1 rounded-lg border border-[#D7E4FF] dark:border-[#264096] px-2 py-1.5 font-semibold hover:border-[#1F3FA8] cursor-pointer disabled:opacity-60"
                                    >
                                      <RefreshCw
                                        className={`w-3.5 h-3.5 ${resendingKey === `booking:${b.id}` ? 'animate-spin' : ''}`}
                                      />
                                      <span>Resend</span>
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => openEditBookingModal(b)}
                                    className="inline-flex items-center gap-1 rounded-lg bg-[#1F3FA8] text-white px-2.5 py-1.5 font-semibold hover:bg-[#173187] cursor-pointer"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                    <span>Edit</span>
                                  </button>
                                  {b.status !== 'cancelled' && b.status !== 'completed' && (
                                    confirmCancelBookingId === b.id ? (
                                      <div className="inline-flex items-center gap-1 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-700 px-2 py-1">
                                        <button
                                          type="button"
                                          disabled={bookingActionBusy}
                                          onClick={() => updateBooking(b.id, { status: 'cancelled' })}
                                          className="text-red-700 dark:text-red-300 font-bold hover:underline cursor-pointer"
                                        >
                                          Confirm
                                        </button>
                                        <span className="text-[var(--muted)]">/</span>
                                        <button
                                          type="button"
                                          onClick={() => setConfirmCancelBookingId(null)}
                                          className="text-[var(--muted)] hover:underline cursor-pointer"
                                        >
                                          Keep
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => setConfirmCancelBookingId(b.id)}
                                        className="inline-flex items-center gap-1 rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 px-2.5 py-1.5 font-semibold hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
                                      >
                                        <Ban className="w-3.5 h-3.5" />
                                        <span>Cancel</span>
                                      </button>
                                    )
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {isOwner && appointmentsSubTab === 'visits' && (
              <div className="warm-card overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[var(--bg)] border-b border-[#D7E4FF] dark:border-[#264096] text-[var(--muted)]">
                    <tr>
                      <th className="px-4 py-3">Visit Code</th>
                      <th className="px-4 py-3">Visitor</th>
                      <th className="px-4 py-3">Visit Type &amp; Location</th>
                      <th className="px-4 py-3">Preferred Schedule</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Manage Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D7E4FF] dark:divide-[#264096]">
                    {(overview.siteVisits || []).length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-[var(--muted)]">
                          No site or plant visit appointments scheduled yet.
                        </td>
                      </tr>
                    ) : (
                      (overview.siteVisits || []).map((sv) => {
                        const isUnread = Number(sv.is_read ?? 1) === 0;
                        const emailSt = sv.notify_email_status || sv.email_status || 'pending';
                        const waSt = sv.notify_whatsapp_status || sv.whatsapp_status || 'pending';
                        return (
                          <tr
                            key={sv.id}
                            className={`hover:bg-[var(--bg)]/50 align-top ${isUnread ? 'bg-[#FFFBEB]/60 dark:bg-[#1E293B]/50' : ''}`}
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-mono font-bold text-[#1F3FA8] dark:text-[#FFC93C]">
                                  {sv.visit_code}
                                </span>
                                {isUnread && (
                                  <span className="px-1.5 py-0.5 rounded-full bg-[#D92B25] text-white text-[9px] font-bold uppercase">
                                    New
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-1 mt-1">
                                <span
                                  title={sv.email_error || `Email: ${emailSt}`}
                                  className={`px-1.5 py-0.5 rounded border text-[9px] font-semibold ${getDeliveryStatusClass(emailSt)}`}
                                >
                                  Email: {emailSt}
                                </span>
                                <span
                                  title={sv.whatsapp_error || `WhatsApp: ${waSt}`}
                                  className={`px-1.5 py-0.5 rounded border text-[9px] font-semibold ${getDeliveryStatusClass(waSt)}`}
                                >
                                  WA: {waSt}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <p className="font-semibold">{sv.customer_name}</p>
                              <p className="text-[var(--muted)] tabular-nums">{sv.phone}</p>
                              {sv.email && <p className="text-[11px] text-[var(--muted)]">{sv.email}</p>}
                            </td>
                            <td className="px-4 py-3">
                              <p className="font-semibold capitalize">{sv.visit_type.replace('_', ' ')}</p>
                              <p className="text-[var(--muted)]">{sv.location || 'Kotihal Plant'}</p>
                              {sv.notes && <p className="text-[11px] text-[var(--muted)] mt-0.5">{sv.notes}</p>}
                            </td>
                            <td className="px-4 py-3 tabular-nums">
                              <p className="font-semibold">{sv.preferred_date}</p>
                              <p className="text-[var(--muted)]">{sv.preferred_time}</p>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-block px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase ${getStatusBadgeClass(
                                  sv.status
                                )}`}
                              >
                                {sv.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
                                {isUnread && (
                                  <button
                                    type="button"
                                    onClick={() => markLeadRead('visit', sv.id, true)}
                                    className="inline-flex items-center gap-1 rounded-lg border border-[#D7E4FF] dark:border-[#264096] px-2 py-1.5 font-semibold hover:border-[#1F3FA8] cursor-pointer"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Mark Read</span>
                                  </button>
                                )}
                                <button
                                  type="button"
                                  disabled={resendingKey === `visit:${sv.id}`}
                                  onClick={() => resendLeadNotification('visit', sv.id)}
                                  className="inline-flex items-center gap-1 rounded-lg border border-[#D7E4FF] dark:border-[#264096] px-2 py-1.5 font-semibold hover:border-[#1F3FA8] cursor-pointer disabled:opacity-60"
                                >
                                  <RefreshCw className={`w-3.5 h-3.5 ${resendingKey === `visit:${sv.id}` ? 'animate-spin' : ''}`} />
                                  <span>Resend</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (isUnread) void markLeadRead('visit', sv.id, true);
                                    openEditVisitModal(sv);
                                  }}
                                  className="inline-flex items-center gap-1 rounded-lg bg-[#1F3FA8] text-white px-2.5 py-1.5 font-semibold hover:bg-[#173187] cursor-pointer"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                  <span>Edit</span>
                                </button>
                                {sv.status !== 'completed' && sv.status !== 'cancelled' && (
                                  <button
                                    type="button"
                                    disabled={visitActionBusy}
                                    onClick={() => updateSiteVisit(sv.id, { status: 'completed' })}
                                    className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 px-2.5 py-1.5 font-semibold cursor-pointer"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Complete</span>
                                  </button>
                                )}
                                {sv.status !== 'cancelled' && (
                                  confirmCancelVisitId === sv.id ? (
                                    <div className="inline-flex items-center gap-1 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-300 px-2 py-1">
                                      <button
                                        type="button"
                                        disabled={visitActionBusy}
                                        onClick={() => updateSiteVisit(sv.id, { status: 'cancelled' })}
                                        className="text-red-700 dark:text-red-300 font-bold hover:underline cursor-pointer"
                                      >
                                        Confirm
                                      </button>
                                      <span className="text-[var(--muted)]">/</span>
                                      <button
                                        type="button"
                                        onClick={() => setConfirmCancelVisitId(null)}
                                        className="text-[var(--muted)] hover:underline cursor-pointer"
                                      >
                                        Keep
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => setConfirmCancelVisitId(sv.id)}
                                      className="inline-flex items-center gap-1 rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 px-2.5 py-1.5 font-semibold cursor-pointer"
                                    >
                                      <Ban className="w-3.5 h-3.5" />
                                      <span>Cancel</span>
                                    </button>
                                  )
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB: QUOTES & INBOX */}
        {isOwner && tab === 'inbox' && overview && (
          <div className="space-y-6">
            <div className="warm-card p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display font-bold text-base">
                  Quote Requests ({(overview.quotes || []).length})
                  {(overview.unreadCounts?.quotes || 0) > 0 && (
                    <span className="ml-2 px-2 py-0.5 rounded-full bg-[#D92B25] text-white text-[10px] font-bold">
                      {overview.unreadCounts?.quotes} Unread
                    </span>
                  )}
                </h2>
              </div>
              {(overview.quotes || []).length === 0 ? (
                <p className="text-xs text-[var(--muted)]">No quote requests yet.</p>
              ) : (
                <div className="divide-y divide-[#D7E4FF] dark:divide-[#264096] text-xs">
                  {(overview.quotes || []).map((q) => {
                    const qId = Number(q.id);
                    const isUnread = Number(q.is_read ?? 1) === 0;
                    const emailSt = String(q.notify_email_status || q.email_status || 'pending');
                    const waSt = String(q.notify_whatsapp_status || q.whatsapp_status || 'pending');
                    const emailErr = String(q.email_error || '');
                    const waErr = String(q.whatsapp_error || '');
                    return (
                      <div
                        key={String(q.id)}
                        className={`py-3 flex flex-wrap items-start justify-between gap-3 ${isUnread ? 'bg-[#FFFBEB]/50 dark:bg-[#1E293B]/40 -mx-2 px-2 rounded-lg' : ''}`}
                      >
                        <div className="space-y-1">
                          <p className="font-semibold flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-[#1F3FA8] dark:text-[#FFC93C]">{String(q.quote_code)}</span>
                            {isUnread && (
                              <span className="px-1.5 py-0.5 rounded-full bg-[#D92B25] text-white text-[9px] font-bold uppercase">
                                New
                              </span>
                            )}
                            <span>
                              {String(q.customer_name)} ({String(q.phone)}) · {String(q.grade)} · {String(q.quantity_m3)}
                            </span>
                          </p>
                          <p className="text-[var(--muted)]">
                            {String(q.project_type)} · {String(q.location)} · Timeline: {String(q.timeline)}
                            {q.email ? ` · ${String(q.email)}` : ''}
                            {q.attachment_name ? ` · Attachment: ${String(q.attachment_name)}` : ''}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span
                              title={emailErr || `Email: ${emailSt}`}
                              className={`px-1.5 py-0.5 rounded border text-[10px] font-semibold ${getDeliveryStatusClass(emailSt)}`}
                            >
                              Email: {emailSt}
                            </span>
                            <span
                              title={waErr || `WhatsApp: ${waSt}`}
                              className={`px-1.5 py-0.5 rounded border text-[10px] font-semibold ${getDeliveryStatusClass(waSt)}`}
                            >
                              WhatsApp: {waSt}
                            </span>
                            {(emailErr || waErr) && (
                              <span className="text-[10px] text-red-600 dark:text-red-300">
                                {[emailErr, waErr].filter(Boolean).join(' | ')}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          {isUnread && (
                            <button
                              type="button"
                              onClick={() => markLeadRead('quote', qId, true)}
                              className="inline-flex items-center gap-1 rounded-lg border border-[#D7E4FF] dark:border-[#264096] px-2 py-1 font-semibold hover:border-[#1F3FA8] cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Mark Read</span>
                            </button>
                          )}
                          <button
                            type="button"
                            disabled={resendingKey === `quote:${qId}`}
                            onClick={() => resendLeadNotification('quote', qId)}
                            className="inline-flex items-center gap-1 rounded-lg border border-[#D7E4FF] dark:border-[#264096] px-2.5 py-1 font-semibold hover:border-[#1F3FA8] cursor-pointer disabled:opacity-60"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${resendingKey === `quote:${qId}` ? 'animate-spin' : ''}`} />
                            <span>Resend notification</span>
                          </button>
                          <a
                            href={buildWhatsAppUrl(
                              String(q.phone),
                              `Namaskara ${String(q.customer_name)}, this is MY CONCRETE – Readymix Concrete Unit regarding your quote request ${String(q.quote_code)} (${String(q.grade)}, Qty: ${String(q.quantity_m3)}, Location: ${String(q.location)}).`
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg bg-[#16A34A] text-white px-2.5 py-1 font-semibold hover:brightness-110"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>WhatsApp Customer</span>
                          </a>
                          <select
                            value={String(q.status)}
                            onChange={async (e) => {
                              const res = await fetch(`/api/admin/quotes/${String(q.id)}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                credentials: 'include',
                                body: JSON.stringify({ status: e.target.value }),
                              });
                              if (handleApiAuthFailure(res)) return;
                              if (isUnread) await markLeadRead('quote', qId, true);
                              else fetchOverview();
                              showToast('Quote status updated.');
                            }}
                            className="rounded-lg border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-2 py-1"
                          >
                            <option value="new">New</option>
                            <option value="reviewed">Reviewed</option>
                            <option value="quoted">Quoted</option>
                            <option value="converted">Converted</option>
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="warm-card p-5 space-y-3">
                <h2 className="font-display font-bold text-base">
                  Enquiries, Partner &amp; Careers Leads ({(overview.enquiries || []).length})
                  {(overview.unreadCounts?.enquiries || 0) > 0 && (
                    <span className="ml-2 px-2 py-0.5 rounded-full bg-[#D92B25] text-white text-[10px] font-bold">
                      {overview.unreadCounts?.enquiries} Unread
                    </span>
                  )}
                </h2>
                {(overview.enquiries || []).length === 0 ? (
                  <p className="text-xs text-[var(--muted)]">No enquiries yet.</p>
                ) : (
                  <div className="divide-y divide-[#D7E4FF] dark:divide-[#264096] text-xs">
                    {(overview.enquiries || []).map((enq) => {
                      const eId = Number(enq.id);
                      const isUnread = Number(enq.is_read ?? 1) === 0;
                      const emailSt = String(enq.notify_email_status || enq.email_status || 'pending');
                      const waSt = String(enq.notify_whatsapp_status || enq.whatsapp_status || 'pending');
                      const emailErr = String(enq.email_error || '');
                      const waErr = String(enq.whatsapp_error || '');
                      return (
                        <div
                          key={String(enq.id)}
                          className={`py-3 space-y-1.5 ${isUnread ? 'bg-[#FFFBEB]/50 dark:bg-[#1E293B]/40 -mx-2 px-2 rounded-lg' : ''}`}
                        >
                          <div className="flex flex-wrap justify-between items-center gap-2">
                            <span className="font-semibold flex items-center gap-1.5 flex-wrap">
                              {Boolean(enq.enquiry_code) && (
                                <span className="font-mono text-[#1F3FA8] dark:text-[#FFC93C]">
                                  {String(enq.enquiry_code)}
                                </span>
                              )}
                              {isUnread && (
                                <span className="px-1.5 py-0.5 rounded-full bg-[#D92B25] text-white text-[9px] font-bold uppercase">
                                  New
                                </span>
                              )}
                              <span>
                                {String(enq.name)} ({String(enq.phone)}) · {String(enq.type).toUpperCase()}
                              </span>
                            </span>
                            <span className="text-[var(--muted)]">{String(enq.city)}</span>
                          </div>
                          {Boolean(enq.email) && <p className="text-[11px] text-[var(--muted)]">{String(enq.email)}</p>}
                          <p className="text-[var(--muted)]">{String(enq.message)}</p>
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                            <div className="flex flex-wrap gap-1.5">
                              <span
                                title={emailErr || `Email: ${emailSt}`}
                                className={`px-1.5 py-0.5 rounded border text-[10px] font-semibold ${getDeliveryStatusClass(emailSt)}`}
                              >
                                Email: {emailSt}
                              </span>
                              <span
                                title={waErr || `WhatsApp: ${waSt}`}
                                className={`px-1.5 py-0.5 rounded border text-[10px] font-semibold ${getDeliveryStatusClass(waSt)}`}
                              >
                                WA: {waSt}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {isUnread && (
                                <button
                                  type="button"
                                  onClick={() => markLeadRead('enquiry', eId, true)}
                                  className="inline-flex items-center gap-1 rounded-lg border border-[#D7E4FF] dark:border-[#264096] px-2 py-1 font-semibold hover:border-[#1F3FA8] cursor-pointer"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>Mark Read</span>
                                </button>
                              )}
                              <button
                                type="button"
                                disabled={resendingKey === `enquiry:${eId}`}
                                onClick={() => resendLeadNotification('enquiry', eId)}
                                className="inline-flex items-center gap-1 rounded-lg border border-[#D7E4FF] dark:border-[#264096] px-2 py-1 font-semibold hover:border-[#1F3FA8] cursor-pointer disabled:opacity-60"
                              >
                                <RefreshCw className={`w-3 h-3 ${resendingKey === `enquiry:${eId}` ? 'animate-spin' : ''}`} />
                                <span>Resend</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="warm-card p-5 space-y-3">
                <h2 className="font-display font-bold text-base">
                  Site &amp; Plant Visits ({(overview.siteVisits || []).length})
                  {(overview.unreadCounts?.siteVisits || 0) > 0 && (
                    <span className="ml-2 px-2 py-0.5 rounded-full bg-[#D92B25] text-white text-[10px] font-bold">
                      {overview.unreadCounts?.siteVisits} Unread
                    </span>
                  )}
                </h2>
                {(overview.siteVisits || []).length === 0 ? (
                  <p className="text-xs text-[var(--muted)]">No scheduled site/plant visits yet.</p>
                ) : (
                  <div className="divide-y divide-[#D7E4FF] dark:divide-[#264096] text-xs">
                    {(overview.siteVisits || []).map((sv) => {
                      const isUnread = Number(sv.is_read ?? 1) === 0;
                      const emailSt = sv.notify_email_status || sv.email_status || 'pending';
                      const waSt = sv.notify_whatsapp_status || sv.whatsapp_status || 'pending';
                      return (
                        <div
                          key={String(sv.id)}
                          className={`py-3 flex flex-wrap items-start justify-between gap-2 ${isUnread ? 'bg-[#FFFBEB]/50 dark:bg-[#1E293B]/40 -mx-2 px-2 rounded-lg' : ''}`}
                        >
                          <div className="space-y-1">
                            <p className="font-semibold flex items-center gap-1.5 flex-wrap">
                              <span className="font-mono text-[#1F3FA8] dark:text-[#FFC93C]">{String(sv.visit_code)}</span>
                              {isUnread && (
                                <span className="px-1.5 py-0.5 rounded-full bg-[#D92B25] text-white text-[9px] font-bold uppercase">
                                  New
                                </span>
                              )}
                              <span>
                                {String(sv.customer_name)} ({String(sv.phone)})
                              </span>
                            </p>
                            <p className="text-[var(--muted)]">
                              {String(sv.visit_type).replace('_', ' ')} · {String(sv.preferred_date)} at{' '}
                              {String(sv.preferred_time)} · {sv.location || 'Kotihal Plant'}
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              <span
                                title={sv.email_error || `Email: ${emailSt}`}
                                className={`px-1.5 py-0.5 rounded border text-[10px] font-semibold ${getDeliveryStatusClass(emailSt)}`}
                              >
                                Email: {emailSt}
                              </span>
                              <span
                                title={sv.whatsapp_error || `WhatsApp: ${waSt}`}
                                className={`px-1.5 py-0.5 rounded border text-[10px] font-semibold ${getDeliveryStatusClass(waSt)}`}
                              >
                                WA: {waSt}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span
                              className={`px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase ${getStatusBadgeClass(
                                sv.status
                              )}`}
                            >
                              {sv.status}
                            </span>
                            <button
                              type="button"
                              disabled={resendingKey === `visit:${sv.id}`}
                              onClick={() => resendLeadNotification('visit', sv.id)}
                              className="inline-flex items-center gap-1 rounded-lg border border-[#D7E4FF] dark:border-[#264096] px-2 py-1 font-semibold hover:border-[#1F3FA8] cursor-pointer disabled:opacity-60"
                            >
                              <RefreshCw className={`w-3 h-3 ${resendingKey === `visit:${sv.id}` ? 'animate-spin' : ''}`} />
                              <span>Resend</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (isUnread) void markLeadRead('visit', sv.id, true);
                                openEditVisitModal(sv);
                              }}
                              className="rounded-lg border border-[#D7E4FF] dark:border-[#264096] px-2 py-1 font-semibold hover:border-[#1F3FA8] cursor-pointer"
                            >
                              Edit
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="warm-card p-5 space-y-3">
              <h2 className="font-display font-bold text-base">
                Newsletter Subscribers ({(overview.subscribers || []).length})
                {(overview.unreadCounts?.subscribers || 0) > 0 && (
                  <span className="ml-2 px-2 py-0.5 rounded-full bg-[#D92B25] text-white text-[10px] font-bold">
                    {overview.unreadCounts?.subscribers} Unread
                  </span>
                )}
              </h2>
              {(overview.subscribers || []).length === 0 ? (
                <p className="text-xs text-[var(--muted)]">No newsletter subscribers yet.</p>
              ) : (
                <div className="divide-y divide-[#D7E4FF] dark:divide-[#264096] text-xs">
                  {(overview.subscribers || []).map((sub) => {
                    const sId = Number(sub.id);
                    const isUnread = Number(sub.is_read ?? 1) === 0;
                    const emailSt = String(sub.email_status || 'pending');
                    const waSt = String(sub.whatsapp_status || 'pending');
                    const emailErr = String(sub.email_error || '');
                    const waErr = String(sub.whatsapp_error || '');
                    return (
                      <div
                        key={String(sub.id)}
                        className={`py-2.5 flex flex-wrap items-center justify-between gap-2 ${isUnread ? 'bg-[#FFFBEB]/50 dark:bg-[#1E293B]/40 -mx-2 px-2 rounded-lg' : ''}`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            {Boolean(sub.sub_code) && (
                              <span className="font-mono font-bold text-[#1F3FA8] dark:text-[#FFC93C]">
                                {String(sub.sub_code)}
                              </span>
                            )}
                            {isUnread && (
                              <span className="px-1.5 py-0.5 rounded-full bg-[#D92B25] text-white text-[9px] font-bold uppercase">
                                New
                              </span>
                            )}
                            <span className="font-semibold">{String(sub.email)}</span>
                            <span className="text-[11px] text-[var(--muted)]">
                              {String(sub.created_at || '').slice(0, 16).replace('T', ' ')}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            <span
                              title={emailErr || `Email: ${emailSt}`}
                              className={`px-1.5 py-0.5 rounded border text-[10px] font-semibold ${getDeliveryStatusClass(emailSt)}`}
                            >
                              Email: {emailSt}
                            </span>
                            <span
                              title={waErr || `WhatsApp: ${waSt}`}
                              className={`px-1.5 py-0.5 rounded border text-[10px] font-semibold ${getDeliveryStatusClass(waSt)}`}
                            >
                              WA: {waSt}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {isUnread && (
                            <button
                              type="button"
                              onClick={() => markLeadRead('newsletter', sId, true)}
                              className="inline-flex items-center gap-1 rounded-lg border border-[#D7E4FF] dark:border-[#264096] px-2 py-1 font-semibold hover:border-[#1F3FA8] cursor-pointer"
                            >
                              <Check className="w-3 h-3" />
                              <span>Mark Read</span>
                            </button>
                          )}
                          <button
                            type="button"
                            disabled={resendingKey === `newsletter:${sId}`}
                            onClick={() => resendLeadNotification('newsletter', sId)}
                            className="inline-flex items-center gap-1 rounded-lg border border-[#D7E4FF] dark:border-[#264096] px-2 py-1 font-semibold hover:border-[#1F3FA8] cursor-pointer disabled:opacity-60"
                          >
                            <RefreshCw
                              className={`w-3 h-3 ${resendingKey === `newsletter:${sId}` ? 'animate-spin' : ''}`}
                            />
                            <span>Resend</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="warm-card p-5 space-y-4">
              {overview.notificationStatus && (
                <div className="rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] p-4 space-y-3 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-display font-bold text-sm text-[#0F1F5C] dark:text-white">
                      Email &amp; WhatsApp Alert Channels
                    </h3>
                    <button
                      type="button"
                      onClick={() => setTab('settings')}
                      className="inline-flex items-center gap-1 rounded-lg bg-[#1F3FA8] text-white px-3 py-1 font-semibold hover:bg-[#173187] cursor-pointer"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      <span>Configure &amp; Test in Settings</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-start gap-2">
                      <Mail className="w-4 h-4 text-[#D92B25] shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold">
                          Owner Alert Email: <span className="font-mono">{overview.notificationStatus.ownerEmail}</span>
                        </p>
                        <p className="text-[var(--muted)]">
                          {overview.notificationStatus.emailEnabled === false
                            ? 'Paused in Settings → Notifications'
                            : overview.notificationStatus.emailConfigured
                              ? `Active via ${overview.notificationStatus.emailProvider.toUpperCase()} (3 background retries)`
                              : 'No SMTP/Resend credentials in .env — add SMTP_USER & SMTP_PASS or RESEND_API_KEY'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <MessageCircle className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold">
                          Owner WhatsApp: <span className="font-mono">+{overview.notificationStatus.ownerWhatsapp}</span>
                          {overview.notificationStatus.ownerWhatsapp2 && (
                            <span className="font-mono text-[var(--muted)]">
                              {' '}
                              &amp; +{overview.notificationStatus.ownerWhatsapp2}
                            </span>
                          )}
                        </p>
                        <p className="text-[var(--muted)]">
                          {overview.notificationStatus.whatsappEnabled === false
                            ? 'Paused in Settings → Notifications'
                            : overview.notificationStatus.whatsappAutoConfigured
                              ? `Active via ${overview.notificationStatus.whatsappProvider.toUpperCase()} (3 background retries)`
                              : `Provider: ${overview.notificationStatus.whatsappProvider.toUpperCase()} · Configure credentials in .env to enable automated background sends`}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <h2 className="font-display font-bold text-base">
                Notification Outbox Log ({(overview.emailLogs || []).length})
              </h2>
              <div className="max-h-60 overflow-y-auto divide-y divide-[#D7E4FF] dark:divide-[#264096] text-xs">
                {(overview.emailLogs || []).map((log) => (
                  <div key={String(log.id)} className="py-2 flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate">
                        {Boolean(log.reference_code) && (
                          <span className="font-mono font-bold text-[#1F3FA8] dark:text-[#FFC93C] mr-1.5">
                            [{String(log.reference_code)}]
                          </span>
                        )}
                        <strong>{String(log.subject)}</strong> &rarr; {String(log.recipient)}
                      </p>
                      {Boolean(log.error_detail) && (
                        <p className="text-[11px] text-red-600 dark:text-red-300 truncate">{String(log.error_detail)}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="uppercase text-[10px] font-bold text-[var(--muted)]">
                        {String(log.channel || 'email')}
                      </span>
                      <span className="font-mono text-[var(--muted)]">{String(log.delivery_mode)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB: PRODUCTS & RATES */}
        {isOwner && tab === 'products' && (
          <div className="space-y-4">
            {productsForm.map((p, pIdx) => (
              <div key={p.id} className="warm-card p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-display font-bold text-base">{p.name}</h3>
                    <p className="text-xs text-[var(--muted)]">
                      {p.category} · Unit: {p.unitType === 'pieces' ? 'Pieces (Cement Bricks/Blocks)' : 'm³ (Ready-Mix Concrete)'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="inline-flex items-center gap-2 text-xs font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={p.isOffered}
                        onChange={(e) => {
                          const next = [...productsForm];
                          next[pIdx] = { ...p, isOffered: e.target.checked };
                          setProductsForm(next);
                        }}
                      />
                      <span>Offered on Website</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => saveProduct(productsForm[pIdx])}
                      className="btn-orange-pill px-4 py-1.5 text-xs"
                    >
                      Save Product
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {p.grades.map((g, gIdx) => (
                    <div
                      key={g.grade}
                      className="rounded-xl border border-[#D7E4FF] dark:border-[#264096] p-3 space-y-1"
                    >
                      <p className="text-xs font-semibold">{g.grade}</p>
                      <label className="block text-[11px] text-[var(--muted)]">
                        Indicative Rate (INR/{p.unitType === 'pieces' ? 'piece' : 'm³'})
                      </label>
                      <input
                        type="number"
                        value={g.indicativeRate}
                        onChange={(e) => {
                          const next = [...productsForm];
                          const updatedGrades = [...p.grades];
                          updatedGrades[gIdx] = { ...g, indicativeRate: Number(e.target.value) };
                          next[pIdx] = { ...p, grades: updatedGrades };
                          setProductsForm(next);
                        }}
                        className="w-full rounded-lg border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-2 py-1 text-xs tabular-nums"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB: SCHEDULING & PLANT CONFIG */}
        {isOwner && tab === 'scheduling' && bizForm && schedForm && (
          <div className="space-y-6">
            <div className="warm-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display font-bold text-lg flex items-center gap-2">
                  <Settings className="w-4 h-4 text-[#D92B25]" />
                  <span>Business Details, Kotihal Coordinates &amp; Delivery Rates</span>
                </h2>
                <button
                  type="button"
                  onClick={() => saveSetting('businessConfig', bizForm)}
                  className="btn-orange-pill px-4 py-2 text-xs"
                >
                  Save Business Config
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                {(
                  [
                    ['tagline', 'Tagline'],
                    ['region', 'Service Regions'],
                    ['address', 'Plant Address'],
                    ['phone', 'Phone'],
                    ['whatsapp', 'WhatsApp Number'],
                    ['email', 'Email'],
                    ['workingHours', 'Working Hours'],
                    ['establishedYear', 'Established Year (optional)'],
                    ['plantCapacity', 'Plant Capacity e.g. 60 m³/hr (optional)'],
                    ['mixersCount', 'Mixers Count (optional)'],
                    ['pumpsCount', 'Pumps Count (optional)'],
                    ['googleMapsUrl', 'Google Maps Location Link'],
                    ['googleReviewUrl', 'Google Review Link'],
                    ['facebookUrl', 'Facebook URL (optional)'],
                    ['instagramUrl', 'Instagram URL (optional)'],
                    ['youtubeUrl', 'YouTube URL (optional)'],
                    ['linkedinUrl', 'LinkedIn URL (optional)'],
                  ] as Array<[keyof BusinessConfig, string]>
                ).map(([field, label]) => (
                  <div key={field}>
                    <label className="block text-[var(--muted)] mb-1">{label}</label>
                    <input
                      type="text"
                      value={String(bizForm[field] || '')}
                      onChange={(e) => setBizForm({ ...bizForm, [field]: e.target.value })}
                      className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3 py-2 text-xs"
                    />
                  </div>
                ))}

                <div>
                  <label className="block text-[var(--muted)] mb-1">Service Radius (km)</label>
                  <input
                    type="number"
                    value={bizForm.serviceRadiusKm}
                    onChange={(e) => setBizForm({ ...bizForm, serviceRadiusKm: Number(e.target.value) })}
                    className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3 py-2 text-xs tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-[var(--muted)] mb-1">Plant Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={bizForm.plantLat}
                    onChange={(e) => setBizForm({ ...bizForm, plantLat: Number(e.target.value) })}
                    className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3 py-2 text-xs tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-[var(--muted)] mb-1">Plant Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={bizForm.plantLng}
                    onChange={(e) => setBizForm({ ...bizForm, plantLng: Number(e.target.value) })}
                    className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3 py-2 text-xs tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-[var(--muted)] mb-1">Base Delivery Fee (INR)</label>
                  <input
                    type="number"
                    value={bizForm.baseDeliveryFee}
                    onChange={(e) => setBizForm({ ...bizForm, baseDeliveryFee: Number(e.target.value) })}
                    className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3 py-2 text-xs tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-[var(--muted)] mb-1">Per-km Fee (INR)</label>
                  <input
                    type="number"
                    value={bizForm.perKmRate}
                    onChange={(e) => setBizForm({ ...bizForm, perKmRate: Number(e.target.value) })}
                    className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3 py-2 text-xs tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-[var(--muted)] mb-1">Line Pump Fee (INR)</label>
                  <input
                    type="number"
                    value={bizForm.linePumpCharge}
                    onChange={(e) => setBizForm({ ...bizForm, linePumpCharge: Number(e.target.value) })}
                    className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3 py-2 text-xs tabular-nums"
                  />
                </div>
              </div>
            </div>

            <div className="warm-card p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="font-display font-bold text-lg">24-Hour Slot Capacity &amp; Holidays</h2>
                <button
                  type="button"
                  onClick={() => saveSetting('schedulingConfig', schedForm)}
                  className="btn-orange-pill px-4 py-2 text-xs"
                >
                  Save Scheduling Rules
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {schedForm.slots.map((sl, idx) => (
                  <div
                    key={sl.id}
                    className="rounded-xl border border-[#D7E4FF] dark:border-[#264096] p-4 space-y-2 text-xs"
                  >
                    <p className="font-semibold">{sl.label}</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[var(--muted)] mb-1">Max Trips</label>
                        <input
                          type="number"
                          value={sl.maxBookings}
                          onChange={(e) => {
                            const next = [...schedForm.slots];
                            next[idx] = { ...sl, maxBookings: Number(e.target.value) };
                            setSchedForm({ ...schedForm, slots: next });
                          }}
                          className="w-full rounded-lg border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-2.5 py-1.5 tabular-nums"
                        />
                      </div>
                      <div>
                        <label className="block text-[var(--muted)] mb-1">Max Vol (m³)</label>
                        <input
                          type="number"
                          value={sl.maxVolumeM3}
                          onChange={(e) => {
                            const next = [...schedForm.slots];
                            next[idx] = { ...sl, maxVolumeM3: Number(e.target.value) };
                            setSchedForm({ ...schedForm, slots: next });
                          }}
                          className="w-full rounded-lg border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-2.5 py-1.5 tabular-nums"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2 text-xs">
                <p className="font-semibold">Plant Holidays (Blocked Dates)</p>
                <div className="flex flex-wrap gap-2">
                  {schedForm.holidays.map((h) => (
                    <span
                      key={h}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#D7E4FF] dark:border-[#264096] px-3 py-1 font-mono"
                    >
                      <span>{h}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setSchedForm({
                            ...schedForm,
                            holidays: schedForm.holidays.filter((d) => d !== h),
                          })
                        }
                        className="text-red-500"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2 pt-1">
                  <input
                    type="date"
                    value={newHoliday}
                    onChange={(e) => setNewHoliday(e.target.value)}
                    className="rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3 py-1.5"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newHoliday && !schedForm.holidays.includes(newHoliday)) {
                        setSchedForm({ ...schedForm, holidays: [...schedForm.holidays, newHoliday] });
                        setNewHoliday('');
                      }
                    }}
                    className="btn-blue-pill px-4 py-1.5 font-semibold"
                  >
                    Add Holiday
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: LOCATIONS */}
        {isOwner && tab === 'locations' && (
          <div className="space-y-6">
            <div className="warm-card p-6 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-display font-bold text-lg">Plant &amp; Dispatch Locations</h2>
                  <p className="text-xs text-[var(--muted)]">
                    Manage Kotihal, Davangere, or add new branches. Changes update all maps, Contact Google Map embeds, JSON-LD, and Booking &ldquo;Delivery from&rdquo; options automatically.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => saveSetting('plantLocations', locationsForm)}
                  className="btn-orange-pill px-5 py-2 text-xs cursor-pointer"
                >
                  Save All Locations
                </button>
              </div>

              <div className="space-y-4">
                {locationsForm.map((loc, idx) => (
                  <div
                    key={loc.id}
                    className="rounded-2xl border border-[#D7E4FF] dark:border-[#264096] p-4 sm:p-5 space-y-4 bg-[var(--bg)]/40 text-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#D7E4FF] dark:border-[#264096] pb-3">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-extrabold text-white ${
                            loc.pinColor === 'red' ? 'bg-[#D92B25]' : 'bg-[#1F3FA8]'
                          }`}
                        >
                          {loc.pinColor === 'red' ? <MapPin className="w-3.5 h-3.5" /> : 'MC'}
                        </span>
                        <span className="font-display font-bold text-sm text-[#0F1F5C] dark:text-white">
                          {loc.name || `Location ${idx + 1}`}
                        </span>
                        <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[var(--surface)] border border-[#D7E4FF] dark:border-[#264096]">
                          ID: {loc.id}
                        </span>
                      </div>

                      {locationsForm.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const next = locationsForm.filter((_, i) => i !== idx);
                            setLocationsForm(next);
                          }}
                          className="inline-flex items-center gap-1 text-red-600 hover:underline font-semibold cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[var(--muted)] mb-1">Unit Name *</label>
                        <input
                          type="text"
                          value={loc.name}
                          onChange={(e) => {
                            const next = [...locationsForm];
                            next[idx] = { ...loc, name: e.target.value };
                            setLocationsForm(next);
                          }}
                          className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-[var(--muted)] mb-1">Short Label (Booking Selector) *</label>
                        <input
                          type="text"
                          value={loc.shortLabel}
                          onChange={(e) => {
                            const next = [...locationsForm];
                            next[idx] = { ...loc, shortLabel: e.target.value };
                            setLocationsForm(next);
                          }}
                          className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-[var(--muted)] mb-1">City *</label>
                        <input
                          type="text"
                          value={loc.city}
                          onChange={(e) => {
                            const next = [...locationsForm];
                            next[idx] = { ...loc, city: e.target.value };
                            setLocationsForm(next);
                          }}
                          className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3 py-2"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[var(--muted)] mb-1">Full Address *</label>
                        <input
                          type="text"
                          value={loc.address}
                          onChange={(e) => {
                            const next = [...locationsForm];
                            next[idx] = { ...loc, address: e.target.value };
                            setLocationsForm(next);
                          }}
                          className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-[var(--muted)] mb-1">Pincode</label>
                        <input
                          type="text"
                          value={loc.postalCode}
                          onChange={(e) => {
                            const next = [...locationsForm];
                            next[idx] = { ...loc, postalCode: e.target.value };
                            setLocationsForm(next);
                          }}
                          className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3 py-2 tabular-nums"
                        />
                      </div>
                      <div>
                        <label className="block text-[var(--muted)] mb-1">Latitude *</label>
                        <input
                          type="number"
                          step="0.0001"
                          value={loc.lat}
                          onChange={(e) => {
                            const next = [...locationsForm];
                            next[idx] = { ...loc, lat: Number(e.target.value) };
                            setLocationsForm(next);
                          }}
                          className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3 py-2 tabular-nums"
                        />
                      </div>
                      <div>
                        <label className="block text-[var(--muted)] mb-1">Longitude *</label>
                        <input
                          type="number"
                          step="0.0001"
                          value={loc.lng}
                          onChange={(e) => {
                            const next = [...locationsForm];
                            next[idx] = { ...loc, lng: Number(e.target.value) };
                            setLocationsForm(next);
                          }}
                          className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3 py-2 tabular-nums"
                        />
                      </div>
                      <div>
                        <label className="block text-[var(--muted)] mb-1">Service Radius (km)</label>
                        <input
                          type="number"
                          value={loc.serviceRadiusKm}
                          onChange={(e) => {
                            const next = [...locationsForm];
                            next[idx] = { ...loc, serviceRadiusKm: Number(e.target.value) };
                            setLocationsForm(next);
                          }}
                          className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3 py-2 tabular-nums"
                        />
                      </div>
                      <div>
                        <label className="block text-[var(--muted)] mb-1">Phone *</label>
                        <input
                          type="text"
                          value={loc.phone}
                          onChange={(e) => {
                            const next = [...locationsForm];
                            next[idx] = { ...loc, phone: e.target.value };
                            setLocationsForm(next);
                          }}
                          className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3 py-2 tabular-nums"
                        />
                      </div>
                      <div>
                        <label className="block text-[var(--muted)] mb-1">Working Hours *</label>
                        <input
                          type="text"
                          value={loc.hours}
                          onChange={(e) => {
                            const next = [...locationsForm];
                            next[idx] = { ...loc, hours: e.target.value };
                            setLocationsForm(next);
                          }}
                          className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-[var(--muted)] mb-1">Map Pin Color</label>
                        <select
                          value={loc.pinColor || 'red'}
                          onChange={(e) => {
                            const next = [...locationsForm];
                            next[idx] = { ...loc, pinColor: e.target.value as 'blue' | 'red' };
                            setLocationsForm(next);
                          }}
                          className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3 py-2"
                        >
                          <option value="blue">Blue MC Pin</option>
                          <option value="red">Red Branch Pin</option>
                        </select>
                      </div>
                      <div className="sm:col-span-2 lg:col-span-3">
                        <label className="block text-[var(--muted)] mb-1">Google Maps Link</label>
                        <input
                          type="text"
                          value={loc.googleMapsUrl}
                          onChange={(e) => {
                            const next = [...locationsForm];
                            next[idx] = { ...loc, googleMapsUrl: e.target.value };
                            setLocationsForm(next);
                          }}
                          className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3 py-2"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const latNum = Number(newLocationForm.lat);
                const lngNum = Number(newLocationForm.lng);
                if (!newLocationForm.name.trim() || !newLocationForm.address.trim() || !Number.isFinite(latNum) || !Number.isFinite(lngNum)) {
                  showToast('Enter unit name, address, latitude, and longitude.');
                  return;
                }
                const baseSlug = (newLocationForm.shortLabel || newLocationForm.city || newLocationForm.name)
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, '-')
                  .replace(/^-|-$/g, '') || 'unit';
                const uniqueId = locationsForm.some((l) => l.id === baseSlug)
                  ? `${baseSlug}-${Date.now().toString().slice(-4)}`
                  : baseSlug;
                const added: PlantLocation = {
                  id: uniqueId,
                  name: newLocationForm.name.trim(),
                  shortLabel: newLocationForm.shortLabel.trim() || newLocationForm.city.trim() || 'Branch',
                  address: newLocationForm.address.trim(),
                  city: newLocationForm.city.trim() || 'Karnataka',
                  postalCode: newLocationForm.postalCode.trim(),
                  lat: latNum,
                  lng: lngNum,
                  phone: newLocationForm.phone.trim() || '+91 73378 07372',
                  whatsapp: newLocationForm.whatsapp.trim() || newLocationForm.phone.trim() || '+91 73378 07372',
                  hours: newLocationForm.hours.trim() || 'Open 24 Hours (All Days)',
                  serviceRadiusKm: Number(newLocationForm.serviceRadiusKm) || 50,
                  googleMapsUrl:
                    newLocationForm.googleMapsUrl.trim() ||
                    `https://www.google.com/maps/search/?api=1&query=${latNum},${lngNum}`,
                  pinColor: newLocationForm.pinColor,
                  isPrimary: false,
                };
                const next = [...locationsForm, added];
                setLocationsForm(next);
                await saveSetting('plantLocations', next);
                setNewLocationForm({
                  name: '',
                  shortLabel: '',
                  address: '',
                  city: '',
                  postalCode: '',
                  lat: '14.4644',
                  lng: '75.9218',
                  phone: '+91 73378 07372',
                  whatsapp: '+91 73378 07372',
                  hours: 'Open 24 Hours (All Days)',
                  serviceRadiusKm: '50',
                  googleMapsUrl: '',
                  pinColor: 'red',
                });
              }}
              className="warm-card p-6 space-y-4 text-xs"
            >
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#D92B25]" />
                <h3 className="font-display font-bold text-base">Add Another Location</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Unit Name (e.g. MY CONCRETE – Harihar Unit) *"
                  value={newLocationForm.name}
                  onChange={(e) => setNewLocationForm({ ...newLocationForm, name: e.target.value })}
                  className="rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3 py-2"
                />
                <input
                  type="text"
                  placeholder="Short Label (e.g. Harihar)"
                  value={newLocationForm.shortLabel}
                  onChange={(e) => setNewLocationForm({ ...newLocationForm, shortLabel: e.target.value })}
                  className="rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3 py-2"
                />
                <input
                  type="text"
                  placeholder="City (e.g. Harihar)"
                  value={newLocationForm.city}
                  onChange={(e) => setNewLocationForm({ ...newLocationForm, city: e.target.value })}
                  className="rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3 py-2"
                />
                <input
                  type="text"
                  required
                  placeholder="Full Address *"
                  value={newLocationForm.address}
                  onChange={(e) => setNewLocationForm({ ...newLocationForm, address: e.target.value })}
                  className="sm:col-span-2 rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3 py-2"
                />
                <input
                  type="text"
                  placeholder="Pincode"
                  value={newLocationForm.postalCode}
                  onChange={(e) => setNewLocationForm({ ...newLocationForm, postalCode: e.target.value })}
                  className="rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3 py-2 tabular-nums"
                />
                <input
                  type="number"
                  step="0.0001"
                  required
                  placeholder="Latitude *"
                  value={newLocationForm.lat}
                  onChange={(e) => setNewLocationForm({ ...newLocationForm, lat: e.target.value })}
                  className="rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3 py-2 tabular-nums"
                />
                <input
                  type="number"
                  step="0.0001"
                  required
                  placeholder="Longitude *"
                  value={newLocationForm.lng}
                  onChange={(e) => setNewLocationForm({ ...newLocationForm, lng: e.target.value })}
                  className="rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3 py-2 tabular-nums"
                />
                <input
                  type="text"
                  placeholder="Phone (+91 73378 07372)"
                  value={newLocationForm.phone}
                  onChange={(e) => setNewLocationForm({ ...newLocationForm, phone: e.target.value })}
                  className="rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3 py-2 tabular-nums"
                />
                <input
                  type="text"
                  placeholder="Hours (Open 24 Hours)"
                  value={newLocationForm.hours}
                  onChange={(e) => setNewLocationForm({ ...newLocationForm, hours: e.target.value })}
                  className="rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3 py-2"
                />
                <input
                  type="text"
                  placeholder="Google Maps Link (optional)"
                  value={newLocationForm.googleMapsUrl}
                  onChange={(e) => setNewLocationForm({ ...newLocationForm, googleMapsUrl: e.target.value })}
                  className="sm:col-span-2 rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3 py-2"
                />
              </div>
              <button type="submit" className="btn-blue-pill px-5 py-2 text-xs cursor-pointer">
                <Plus className="w-3.5 h-3.5" />
                <span>Add &amp; Save Location</span>
              </button>
            </form>
          </div>
        )}

        {/* TAB: SETTINGS -> NOTIFICATIONS */}
        {isOwner && tab === 'settings' && (
          <div className="space-y-6">
            <form onSubmit={saveNotificationSettings} className="warm-card p-6 space-y-5 text-xs">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-display font-bold text-base">Settings &rarr; Lead Notifications</h2>
                  <p className="text-[var(--muted)] mt-1">
                    Configure owner alert email, WhatsApp numbers, provider, and channel toggles for all 7 website forms.
                    Secrets (SMTP passwords, API keys, tokens) are read strictly from server environment variables.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={notifTesting}
                  onClick={sendTestNotification}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#16A34A] hover:brightness-110 text-white px-4 py-2 font-semibold cursor-pointer disabled:opacity-60"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${notifTesting ? 'animate-spin' : ''}`} />
                  <span>{notifTesting ? 'Sending Test…' : 'Send test notification'}</span>
                </button>
              </div>

              {notifTestResult && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] p-4">
                  <div className="space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <Mail className="w-4 h-4 text-[#D92B25]" />
                      <span>Email Test ({notifTestResult.emailResult?.provider || 'smtp'})</span>
                      <span
                        className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase ${getDeliveryStatusClass(
                          notifTestResult.emailResult?.status || 'pending'
                        )}`}
                      >
                        {notifTestResult.emailResult?.status || 'unknown'}
                      </span>
                    </p>
                    {notifTestResult.emailResult?.error && (
                      <p className="text-red-600 dark:text-red-300">{notifTestResult.emailResult.error}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <MessageCircle className="w-4 h-4 text-[#16A34A]" />
                      <span>WhatsApp Test ({notifTestResult.whatsappResult?.provider || 'none'})</span>
                      <span
                        className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase ${getDeliveryStatusClass(
                          notifTestResult.whatsappResult?.status || 'pending'
                        )}`}
                      >
                        {notifTestResult.whatsappResult?.status || 'unknown'}
                      </span>
                    </p>
                    {notifTestResult.whatsappResult?.error && (
                      <p className="text-red-600 dark:text-red-300">{notifTestResult.whatsappResult.error}</p>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <label className="flex items-center gap-2.5 rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] p-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifForm.emailEnabled}
                    onChange={(e) => setNotifForm({ ...notifForm, emailEnabled: e.target.checked })}
                  />
                  <div>
                    <p className="font-semibold">Enable Owner Email Alerts</p>
                    <p className="text-[11px] text-[var(--muted)]">Gmail SMTP (port 465) or Resend</p>
                  </div>
                </label>
                <label className="flex items-center gap-2.5 rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] p-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifForm.whatsappEnabled}
                    onChange={(e) => setNotifForm({ ...notifForm, whatsappEnabled: e.target.checked })}
                  />
                  <div>
                    <p className="font-semibold">Enable Owner WhatsApp Alerts</p>
                    <p className="text-[11px] text-[var(--muted)]">Uses selected pluggable provider</p>
                  </div>
                </label>
                <label className="flex items-center gap-2.5 rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] p-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifForm.customerAckEnabled}
                    onChange={(e) => setNotifForm({ ...notifForm, customerAckEnabled: e.target.checked })}
                  />
                  <div>
                    <p className="font-semibold">Customer Acknowledgement Email</p>
                    <p className="text-[11px] text-[var(--muted)]">Send receipt email when customer gives email</p>
                  </div>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="space-y-1">
                  <span className="font-semibold">Owner Notification Email (NOTIFY_EMAIL)</span>
                  <input
                    type="email"
                    required
                    value={notifForm.notifyEmail}
                    onChange={(e) => setNotifForm({ ...notifForm, notifyEmail: e.target.value })}
                    className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3 py-2"
                  />
                </label>
                <label className="space-y-1">
                  <span className="font-semibold">WhatsApp Provider (WHATSAPP_PROVIDER)</span>
                  <select
                    value={notifForm.whatsappProvider}
                    onChange={(e) =>
                      setNotifForm({
                        ...notifForm,
                        whatsappProvider: e.target.value as NotificationConfig['whatsappProvider'],
                      })
                    }
                    className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3 py-2"
                  >
                    <option value="callmebot">callmebot (Free CallMeBot API)</option>
                    <option value="cloudapi">cloudapi (Meta WhatsApp Cloud API)</option>
                    <option value="twilio">twilio (Twilio WhatsApp)</option>
                    <option value="none">none (Skip background WhatsApp silently)</option>
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="font-semibold">Primary Owner WhatsApp Number (OWNER_WHATSAPP)</span>
                  <input
                    type="text"
                    required
                    placeholder="917337807372"
                    value={notifForm.ownerWhatsapp}
                    onChange={(e) => setNotifForm({ ...notifForm, ownerWhatsapp: e.target.value })}
                    className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3 py-2 font-mono"
                  />
                </label>
                <label className="space-y-1">
                  <span className="font-semibold">Second Owner / Staff WhatsApp (OWNER_WHATSAPP_2, optional)</span>
                  <input
                    type="text"
                    placeholder="919876543210"
                    value={notifForm.ownerWhatsapp2}
                    onChange={(e) => setNotifForm({ ...notifForm, ownerWhatsapp2: e.target.value })}
                    className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3 py-2 font-mono"
                  />
                </label>
                {notifForm.whatsappProvider === 'cloudapi' && (
                  <label className="space-y-1 sm:col-span-2">
                    <span className="font-semibold">Meta Cloud API Approved Template Name (optional)</span>
                    <input
                      type="text"
                      placeholder="Leave blank for 24h session text messages, or enter approved template name (e.g. lead_alert)"
                      value={notifForm.whatsappTemplateName}
                      onChange={(e) => setNotifForm({ ...notifForm, whatsappTemplateName: e.target.value })}
                      className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3 py-2 font-mono"
                    />
                  </label>
                )}
              </div>

              {overview?.envCredentialStatus && (
                <div className="rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] p-4 space-y-2">
                  <p className="font-bold text-[#0F1F5C] dark:text-white">
                    Server Environment Credential Status (.env)
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {[
                      { label: 'Gmail SMTP', ok: overview.envCredentialStatus.smtpConfigured },
                      { label: 'Resend API', ok: overview.envCredentialStatus.resendConfigured },
                      { label: 'CallMeBot', ok: overview.envCredentialStatus.callmebotConfigured },
                      { label: 'Meta Cloud API', ok: overview.envCredentialStatus.cloudapiConfigured },
                      { label: 'Twilio', ok: overview.envCredentialStatus.twilioConfigured },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className={`rounded-lg border px-2.5 py-2 font-semibold flex items-center justify-between ${
                          item.ok
                            ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
                            : 'border-[#D7E4FF] text-[var(--muted)] dark:border-[#264096]'
                        }`}
                      >
                        <span>{item.label}</span>
                        <span>{item.ok ? 'Set' : 'Missing'}</span>
                      </div>
                    ))}
                  </div>
                  {(!overview.envCredentialStatus.smtpConfigured && !overview.envCredentialStatus.resendConfigured) ||
                  (!overview.envCredentialStatus.callmebotConfigured &&
                    !overview.envCredentialStatus.cloudapiConfigured &&
                    !overview.envCredentialStatus.twilioConfigured) ? (
                    <p className="text-[11px] text-amber-700 dark:text-amber-300 pt-1">
                      Automatic delivery requires credentials in your server <code className="font-mono">.env</code> (or
                      Supabase Edge Function secrets): set <code className="font-mono">SMTP_USER</code> +{' '}
                      <code className="font-mono">SMTP_PASS</code> (Gmail 16-char App Password) or{' '}
                      <code className="font-mono">RESEND_API_KEY</code> for Email, and{' '}
                      <code className="font-mono">CALLMEBOT_APIKEY</code> (or Meta Cloud API / Twilio keys) for WhatsApp,
                      then restart the server.
                    </p>
                  ) : null}
                </div>
              )}

              <button
                type="submit"
                disabled={notifSaving}
                className="btn-red-pill px-6 py-2.5 text-xs cursor-pointer disabled:opacity-60"
              >
                {notifSaving ? 'Saving…' : 'Save Notification Settings'}
              </button>
            </form>
          </div>
        )}

        {/* TAB: CMS, STATS & TESTIMONIALS */}
        {isOwner && tab === 'cms' && (
          <div className="space-y-6">
            <div className="warm-card p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="font-display font-bold text-base">Hero Slides (Light / Dark + English &amp; Kannada)</h2>
                  <p className="text-xs text-[var(--muted)]">
                    Configure headline, Kannada copy, CTA button, Light-Sky or Dark-Navy slide style, and plant/site photo URL.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setHeroForm([
                        ...heroForm,
                        {
                          id: `slide-${Date.now()}`,
                          kicker: 'Ranebennur & Davangere',
                          headline: 'NEW CONCRETE & BRICK SLIDE',
                          headlineKn: '',
                          subtext: '',
                          ctaPrimary: 'Book Your Concrete Delivery',
                          ctaPrimaryKn: '',
                          ctaSecondary: 'Get a Free Quote',
                          ctaLink: '/book',
                          themeStyle: 'light',
                          visualKey: 'batching-plant',
                          imageUrl: '',
                        },
                      ])
                    }
                    className="btn-blue-pill px-3 py-1.5 text-xs"
                  >
                    + Add Slide
                  </button>
                  <button
                    type="button"
                    onClick={() => saveSetting('heroSlides', heroForm)}
                    className="btn-orange-pill px-4 py-1.5 text-xs"
                  >
                    Save Slides
                  </button>
                </div>
              </div>
              <div className="space-y-3">
                {heroForm.map((sl, idx) => (
                  <div
                    key={sl.id}
                    className="grid grid-cols-1 md:grid-cols-4 gap-3 rounded-xl border border-[#D7E4FF] dark:border-[#264096] p-3 text-xs"
                  >
                    <input
                      type="text"
                      value={sl.headline}
                      onChange={(e) => {
                        const next = [...heroForm];
                        next[idx] = { ...sl, headline: e.target.value };
                        setHeroForm(next);
                      }}
                      placeholder="Headline (English)"
                      className="md:col-span-2 rounded-lg border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-2.5 py-1.5"
                    />
                    <input
                      type="text"
                      value={sl.headlineKn || ''}
                      onChange={(e) => {
                        const next = [...heroForm];
                        next[idx] = { ...sl, headlineKn: e.target.value };
                        setHeroForm(next);
                      }}
                      placeholder="Headline (Kannada - optional)"
                      className="md:col-span-2 rounded-lg border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-2.5 py-1.5"
                    />
                    <input
                      type="text"
                      value={sl.ctaPrimary}
                      onChange={(e) => {
                        const next = [...heroForm];
                        next[idx] = { ...sl, ctaPrimary: e.target.value };
                        setHeroForm(next);
                      }}
                      placeholder="CTA Button Label (English)"
                      className="rounded-lg border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-2.5 py-1.5"
                    />
                    <input
                      type="text"
                      value={sl.ctaPrimaryKn || ''}
                      onChange={(e) => {
                        const next = [...heroForm];
                        next[idx] = { ...sl, ctaPrimaryKn: e.target.value };
                        setHeroForm(next);
                      }}
                      placeholder="CTA Button (Kannada - optional)"
                      className="rounded-lg border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-2.5 py-1.5"
                    />
                    <input
                      type="text"
                      value={sl.ctaLink || '/book'}
                      onChange={(e) => {
                        const next = [...heroForm];
                        next[idx] = { ...sl, ctaLink: e.target.value };
                        setHeroForm(next);
                      }}
                      placeholder="CTA Link e.g. /book"
                      className="rounded-lg border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-2.5 py-1.5"
                    />
                    <select
                      value={sl.themeStyle || 'light'}
                      onChange={(e) => {
                        const next = [...heroForm];
                        next[idx] = {
                          ...sl,
                          themeStyle: e.target.value as 'light' | 'dark' | 'mosaic',
                        };
                        setHeroForm(next);
                      }}
                      className="rounded-lg border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-2.5 py-1.5"
                    >
                      <option value="light">Light-Sky Style</option>
                      <option value="dark">Dark-Navy Style</option>
                      <option value="mosaic">Concrete &amp; Diamond Mosaic</option>
                    </select>
                    <select
                      value={sl.visualKey || 'batching-plant'}
                      onChange={(e) => {
                        const next = [...heroForm];
                        next[idx] = { ...sl, visualKey: e.target.value };
                        setHeroForm(next);
                      }}
                      className="rounded-lg border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-2.5 py-1.5"
                    >
                      <option value="batching-plant">Illustration: Plant &amp; Mixers</option>
                      <option value="engineers-site">Illustration: Engineers &amp; Site</option>
                      <option value="night-pour">Illustration: 24/7 Night Pour</option>
                      <option value="bricks">Illustration: Cement Bricks</option>
                      <option value="product-mosaic">Product Diamond Mosaic</option>
                    </select>
                    <input
                      type="text"
                      value={sl.imageUrl}
                      onChange={(e) => {
                        const next = [...heroForm];
                        next[idx] = { ...sl, imageUrl: e.target.value };
                        setHeroForm(next);
                      }}
                      placeholder="Real Plant Photo URL (optional)"
                      className="md:col-span-2 rounded-lg border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-2.5 py-1.5"
                    />
                    {sl.mosaicTiles && sl.mosaicTiles.length > 0 && (
                      <div className="md:col-span-4 border-t border-[#D7E4FF] dark:border-[#264096] pt-2.5 mt-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {sl.mosaicTiles.map((tile, tIdx) => (
                          <div key={tile.id} className="space-y-1">
                            <span className="text-[11px] font-semibold text-[var(--muted)]">
                              Diamond: {tile.title}
                            </span>
                            <input
                              type="text"
                              value={tile.imageUrl || ''}
                              onChange={(e) => {
                                const next = [...heroForm];
                                const tiles = [...(sl.mosaicTiles || [])];
                                tiles[tIdx] = { ...tile, imageUrl: e.target.value };
                                next[idx] = { ...sl, mosaicTiles: tiles };
                                setHeroForm(next);
                              }}
                              placeholder="Tile Photo URL (optional)"
                              className="w-full rounded-lg border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-2 py-1"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex justify-end">
                      {heroForm.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setHeroForm(heroForm.filter((_, i) => i !== idx))}
                          className="text-red-500 font-semibold px-2 py-1 hover:underline"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Verified Stats Band (Hidden on website when empty) */}
            <div className="warm-card p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="font-display font-bold text-base">Verified Stats Band (Hidden When Empty)</h2>
                  <p className="text-xs text-[var(--muted)]">
                    Add only confirmed company statistics (e.g., Years, Capacity, Fleet) so no fake numbers appear.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => saveSetting('statsItems', statsForm)}
                  className="btn-orange-pill px-4 py-1.5 text-xs"
                >
                  Save Stats
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                <input
                  type="text"
                  placeholder="Label (e.g. Plant Capacity)"
                  value={newStat.label}
                  onChange={(e) => setNewStat({ ...newStat, label: e.target.value })}
                  className="rounded-lg border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-2.5 py-1.5"
                />
                <input
                  type="text"
                  placeholder="Value (e.g. 60)"
                  value={newStat.value}
                  onChange={(e) => setNewStat({ ...newStat, value: e.target.value })}
                  className="rounded-lg border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-2.5 py-1.5"
                />
                <input
                  type="text"
                  placeholder="Suffix (e.g. m³/hr)"
                  value={newStat.suffix}
                  onChange={(e) => setNewStat({ ...newStat, suffix: e.target.value })}
                  className="rounded-lg border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-2.5 py-1.5"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newStat.label || !newStat.value) return;
                    const updated = [
                      ...statsForm,
                      { id: `stat-${Date.now()}`, ...newStat },
                    ];
                    setStatsForm(updated);
                    setNewStat({ label: '', value: '', suffix: '', note: '' });
                  }}
                  className="btn-blue-pill px-3 py-1.5 text-xs"
                >
                  + Add Stat
                </button>
              </div>
              {statsForm.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  {statsForm.map((st, idx) => (
                    <div key={st.id} className="rounded-xl border border-[#D7E4FF] dark:border-[#264096] p-3 flex justify-between items-center">
                      <div>
                        <p className="font-bold">{st.value}{st.suffix}</p>
                        <p className="text-[var(--muted)]">{st.label}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setStatsForm(statsForm.filter((_, i) => i !== idx))}
                        className="text-red-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Customer Pages (6 Segments CMS) */}
            {customerPagesForm.length > 0 && (() => {
              const seg = customerPagesForm[activeCustomerIdx] || customerPagesForm[0];
              const updateSeg = (patch: Partial<CustomerSegmentConfig>) => {
                setCustomerPagesForm((prev) =>
                  prev.map((item, idx) => (idx === activeCustomerIdx ? { ...item, ...patch } : item))
                );
              };
              return (
                <div className="warm-card p-6 space-y-5 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="font-display font-bold text-base">
                        Customer Pages CMS (6 Sectors: Residential – Industrial)
                      </h2>
                      <p className="text-xs text-[var(--muted)]">
                        Edit hero headline, hero photo, intro box, applications, grades table, FAQs, and gallery for each /customers/:segment page.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => saveSetting('customerPages', customerPagesForm)}
                      className="btn-orange-pill px-4 py-1.5 text-xs"
                    >
                      Save Customer Pages
                    </button>
                  </div>

                  {/* Segment Selector Tabs */}
                  <div className="flex flex-wrap gap-2 border-b border-[#D7E4FF] dark:border-[#264096] pb-3">
                    {customerPagesForm.map((c, idx) => (
                      <button
                        key={c.slug}
                        type="button"
                        onClick={() => setActiveCustomerIdx(idx)}
                        className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                          idx === activeCustomerIdx
                            ? 'bg-[#1F3FA8] text-white'
                            : 'bg-[var(--bg)] text-[var(--muted)] border border-[#D7E4FF] dark:border-[#264096]'
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>

                  {seg && (
                    <div className="space-y-4">
                      {/* Core Labels & Photos */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-semibold mb-1">Sector Title (EN)</label>
                          <input
                            type="text"
                            value={seg.label}
                            onChange={(e) => updateSeg({ label: e.target.value })}
                            className="w-full rounded-lg border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-2.5 py-1.5"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold mb-1">Sector Title (Kannada)</label>
                          <input
                            type="text"
                            value={seg.labelKn}
                            onChange={(e) => updateSeg({ labelKn: e.target.value })}
                            className="w-full rounded-lg border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-2.5 py-1.5"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold mb-1">Hero Headline (EN, max 3 lines)</label>
                          <textarea
                            rows={2}
                            value={seg.heroHeadline}
                            onChange={(e) => updateSeg({ heroHeadline: e.target.value })}
                            className="w-full rounded-lg border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-2.5 py-1.5"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold mb-1">Hero Headline (Kannada)</label>
                          <textarea
                            rows={2}
                            value={seg.heroHeadlineKn}
                            onChange={(e) => updateSeg({ heroHeadlineKn: e.target.value })}
                            className="w-full rounded-lg border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-2.5 py-1.5"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold mb-1">Hero Photo URL (-hero.webp or custom)</label>
                          <input
                            type="text"
                            placeholder="/images/customers/...-hero.webp"
                            value={seg.heroImage}
                            onChange={(e) => updateSeg({ heroImage: e.target.value })}
                            className="w-full rounded-lg border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-2.5 py-1.5"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold mb-1">Card Photo URL (-card.webp or custom)</label>
                          <input
                            type="text"
                            placeholder="/images/customers/...-card.webp"
                            value={seg.cardImage || ''}
                            onChange={(e) => updateSeg({ cardImage: e.target.value })}
                            className="w-full rounded-lg border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-2.5 py-1.5"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold mb-1">Hero Image Alt Text</label>
                          <input
                            type="text"
                            placeholder="Descriptive alt text for hero photo"
                            value={seg.heroAlt || ''}
                            onChange={(e) => updateSeg({ heroAlt: e.target.value })}
                            className="w-full rounded-lg border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-2.5 py-1.5"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold mb-1">Card Image Alt Text</label>
                          <input
                            type="text"
                            placeholder="Descriptive alt text for card photo"
                            value={seg.cardAlt || ''}
                            onChange={(e) => updateSeg({ cardAlt: e.target.value })}
                            className="w-full rounded-lg border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-2.5 py-1.5"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold mb-1">Intro Split Photo URL (optional override)</label>
                          <input
                            type="text"
                            placeholder="Leave blank to use Card/Hero photo"
                            value={seg.introImage}
                            onChange={(e) => updateSeg({ introImage: e.target.value })}
                            className="w-full rounded-lg border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-2.5 py-1.5"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold mb-1">Intro Title Box (EN)</label>
                          <input
                            type="text"
                            value={seg.titleBox}
                            onChange={(e) => updateSeg({ titleBox: e.target.value })}
                            className="w-full rounded-lg border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-2.5 py-1.5"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold mb-1">Intro Title Box (Kannada)</label>
                          <input
                            type="text"
                            value={seg.titleBoxKn}
                            onChange={(e) => updateSeg({ titleBoxKn: e.target.value })}
                            className="w-full rounded-lg border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-2.5 py-1.5"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold mb-1">Intro Paragraph 1 (EN)</label>
                          <textarea
                            rows={2}
                            value={seg.introParagraphs[0] || ''}
                            onChange={(e) =>
                              updateSeg({ introParagraphs: [e.target.value, seg.introParagraphs[1] || ''] })
                            }
                            className="w-full rounded-lg border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-2.5 py-1.5"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold mb-1">Intro Paragraph 2 (EN)</label>
                          <textarea
                            rows={2}
                            value={seg.introParagraphs[1] || ''}
                            onChange={(e) =>
                              updateSeg({ introParagraphs: [seg.introParagraphs[0] || '', e.target.value] })
                            }
                            className="w-full rounded-lg border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-2.5 py-1.5"
                          />
                        </div>
                      </div>

                      {/* Where We Supply (Applications) */}
                      <div className="border-t border-[#D7E4FF] dark:border-[#264096] pt-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold">Where We Supply Applications ({seg.applications.length})</span>
                          <button
                            type="button"
                            onClick={() =>
                              updateSeg({
                                applications: [
                                  ...seg.applications,
                                  {
                                    icon: 'Building2',
                                    title: '',
                                    titleKn: '',
                                    description: '',
                                    descriptionKn: '',
                                  },
                                ],
                              })
                            }
                            className="btn-blue-pill px-2.5 py-1 text-[11px]"
                          >
                            + Add Application
                          </button>
                        </div>
                        {seg.applications.map((appItem, aIdx) => (
                          <div key={aIdx} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                            <input
                              type="text"
                              placeholder="Application Title (EN)"
                              value={appItem.title}
                              onChange={(e) => {
                                const next = [...seg.applications];
                                next[aIdx] = { ...appItem, title: e.target.value };
                                updateSeg({ applications: next });
                              }}
                              className="md:col-span-4 rounded-lg border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-2 py-1"
                            />
                            <input
                              type="text"
                              placeholder="1-line description (EN)"
                              value={appItem.description}
                              onChange={(e) => {
                                const next = [...seg.applications];
                                next[aIdx] = { ...appItem, description: e.target.value };
                                updateSeg({ applications: next });
                              }}
                              className="md:col-span-7 rounded-lg border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-2 py-1"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                updateSeg({
                                  applications: seg.applications.filter((_, i) => i !== aIdx),
                                })
                              }
                              className="text-red-500 flex justify-end"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Recommended Grades */}
                      <div className="border-t border-[#D7E4FF] dark:border-[#264096] pt-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold">Recommended Grades ({seg.recommendedGrades.length})</span>
                          <button
                            type="button"
                            onClick={() =>
                              updateSeg({
                                recommendedGrades: [
                                  ...seg.recommendedGrades,
                                  { use: '', useKn: '', grade: 'M25', notes: '', notesKn: '' },
                                ],
                              })
                            }
                            className="btn-blue-pill px-2.5 py-1 text-[11px]"
                          >
                            + Add Row
                          </button>
                        </div>
                        {seg.recommendedGrades.map((row, rIdx) => (
                          <div key={rIdx} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                            <input
                              type="text"
                              placeholder="Use"
                              value={row.use}
                              onChange={(e) => {
                                const next = [...seg.recommendedGrades];
                                next[rIdx] = { ...row, use: e.target.value };
                                updateSeg({ recommendedGrades: next });
                              }}
                              className="md:col-span-4 rounded-lg border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-2 py-1"
                            />
                            <input
                              type="text"
                              placeholder="Grade"
                              value={row.grade}
                              onChange={(e) => {
                                const next = [...seg.recommendedGrades];
                                next[rIdx] = { ...row, grade: e.target.value };
                                updateSeg({ recommendedGrades: next });
                              }}
                              className="md:col-span-2 rounded-lg border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-2 py-1"
                            />
                            <input
                              type="text"
                              placeholder="Notes"
                              value={row.notes}
                              onChange={(e) => {
                                const next = [...seg.recommendedGrades];
                                next[rIdx] = { ...row, notes: e.target.value };
                                updateSeg({ recommendedGrades: next });
                              }}
                              className="md:col-span-5 rounded-lg border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-2 py-1"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                updateSeg({
                                  recommendedGrades: seg.recommendedGrades.filter((_, i) => i !== rIdx),
                                })
                              }
                              className="text-red-500 flex justify-end"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* FAQs */}
                      <div className="border-t border-[#D7E4FF] dark:border-[#264096] pt-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold">FAQs ({seg.faqs.length})</span>
                          <button
                            type="button"
                            onClick={() =>
                              updateSeg({
                                faqs: [...seg.faqs, { q: '', qKn: '', a: '', aKn: '' }],
                              })
                            }
                            className="btn-blue-pill px-2.5 py-1 text-[11px]"
                          >
                            + Add FAQ
                          </button>
                        </div>
                        {seg.faqs.map((faq, fIdx) => (
                          <div key={fIdx} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-start">
                            <input
                              type="text"
                              placeholder="Question (EN)"
                              value={faq.q}
                              onChange={(e) => {
                                const next = [...seg.faqs];
                                next[fIdx] = { ...faq, q: e.target.value };
                                updateSeg({ faqs: next });
                              }}
                              className="md:col-span-5 rounded-lg border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-2 py-1"
                            />
                            <input
                              type="text"
                              placeholder="Answer (EN)"
                              value={faq.a}
                              onChange={(e) => {
                                const next = [...seg.faqs];
                                next[fIdx] = { ...faq, a: e.target.value };
                                updateSeg({ faqs: next });
                              }}
                              className="md:col-span-6 rounded-lg border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-2 py-1"
                            />
                            <button
                              type="button"
                              onClick={() => updateSeg({ faqs: seg.faqs.filter((_, i) => i !== fIdx) })}
                              className="text-red-500 flex justify-end pt-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Gallery Strip URLs */}
                      <div className="border-t border-[#D7E4FF] dark:border-[#264096] pt-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold">Gallery Photos ({seg.gallery.length})</span>
                          <button
                            type="button"
                            onClick={() =>
                              updateSeg({
                                gallery: [
                                  ...seg.gallery,
                                  { id: `gal-${Date.now()}`, imageUrl: '', caption: '', captionKn: '' },
                                ],
                              })
                            }
                            className="btn-blue-pill px-2.5 py-1 text-[11px]"
                          >
                            + Add Photo Slot
                          </button>
                        </div>
                        {seg.gallery.map((g, gIdx) => (
                          <div key={g.id || gIdx} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                            <input
                              type="text"
                              placeholder="Photo URL (optional)"
                              value={g.imageUrl}
                              onChange={(e) => {
                                const next = [...seg.gallery];
                                next[gIdx] = { ...g, imageUrl: e.target.value };
                                updateSeg({ gallery: next });
                              }}
                              className="md:col-span-5 rounded-lg border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-2 py-1"
                            />
                            <input
                              type="text"
                              placeholder="Caption (EN)"
                              value={g.caption}
                              onChange={(e) => {
                                const next = [...seg.gallery];
                                next[gIdx] = { ...g, caption: e.target.value };
                                updateSeg({ gallery: next });
                              }}
                              className="md:col-span-6 rounded-lg border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-2 py-1"
                            />
                            <button
                              type="button"
                              onClick={() => updateSeg({ gallery: seg.gallery.filter((_, i) => i !== gIdx) })}
                              className="text-red-500 flex justify-end"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
              {/* Projects */}
              <div className="warm-card p-5 space-y-3">
                <h3 className="font-display font-bold text-sm">Projects ({siteData?.projects.length || 0})</h3>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Project title"
                    value={newProject.title}
                    onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                    className="w-full rounded-lg border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-2.5 py-1.5"
                  />
                  <input
                    type="text"
                    placeholder="Real Photo URL (optional)"
                    value={newProject.imageUrl}
                    onChange={(e) => setNewProject({ ...newProject, imageUrl: e.target.value })}
                    className="w-full rounded-lg border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-2.5 py-1.5"
                  />
                  <textarea
                    rows={2}
                    placeholder="Summary"
                    value={newProject.summary}
                    onChange={(e) => setNewProject({ ...newProject, summary: e.target.value })}
                    className="w-full rounded-lg border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-2.5 py-1.5"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      if (!newProject.title) return;
                      const res = await fetch('/api/admin/projects', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify(newProject),
                      });
                      if (handleApiAuthFailure(res)) return;
                      setNewProject({
                        title: '',
                        segment: 'Residential',
                        location: 'Ranebennur, Karnataka',
                        gradeUsed: 'M25',
                        volumeNote: '',
                        summary: '',
                        imageUrl: '',
                      });
                      await refreshBootstrap();
                      showToast('Project added.');
                    }}
                    className="btn-blue-pill px-3 py-1.5 font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Project</span>
                  </button>
                </div>
                <div className="divide-y divide-[#D7E4FF] dark:divide-[#264096] pt-2">
                  {(siteData?.projects || []).map((pr) => (
                    <div key={pr.id} className="py-2 flex items-center justify-between gap-2">
                      <span className="truncate">{pr.title}</span>
                      <button
                        type="button"
                        onClick={async () => {
                          const res = await fetch(`/api/admin/projects/${pr.id}`, {
                            method: 'DELETE',
                            credentials: 'include',
                          });
                          if (handleApiAuthFailure(res)) return;
                          await refreshBootstrap();
                        }}
                        className="text-red-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Testimonials / Customer Success Stories */}
              <div className="warm-card p-5 space-y-3">
                <h3 className="font-display font-bold text-sm">
                  Customer Success Stories ({siteData?.testimonials.length || 0})
                </h3>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Customer / Builder Name"
                    value={newTestimonial.authorName}
                    onChange={(e) => setNewTestimonial({ ...newTestimonial, authorName: e.target.value })}
                    className="w-full rounded-lg border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-2.5 py-1.5"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Role / Firm"
                      value={newTestimonial.roleOrCompany}
                      onChange={(e) => setNewTestimonial({ ...newTestimonial, roleOrCompany: e.target.value })}
                      className="rounded-lg border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-2.5 py-1.5"
                    />
                    <input
                      type="text"
                      placeholder="City (e.g. Ranebennur)"
                      value={newTestimonial.location}
                      onChange={(e) => setNewTestimonial({ ...newTestimonial, location: e.target.value })}
                      className="rounded-lg border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-2.5 py-1.5"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Project Title (e.g. Villa Roof Slab)"
                      value={newTestimonial.projectTitle}
                      onChange={(e) => setNewTestimonial({ ...newTestimonial, projectTitle: e.target.value })}
                      className="rounded-lg border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-2.5 py-1.5"
                    />
                    <select
                      value={newTestimonial.segment}
                      onChange={(e) => setNewTestimonial({ ...newTestimonial, segment: e.target.value })}
                      className="rounded-lg border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-2.5 py-1.5"
                    >
                      <option value="Residential">Residential</option>
                      <option value="Commercial">Commercial</option>
                      <option value="Industrial">Industrial</option>
                      <option value="Infrastructure">Infrastructure</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="Grade (e.g. M25)"
                      value={newTestimonial.gradeUsed}
                      onChange={(e) => setNewTestimonial({ ...newTestimonial, gradeUsed: e.target.value })}
                      className="rounded-lg border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-2.5 py-1.5"
                    />
                    <input
                      type="text"
                      placeholder="Volume (e.g. 38 m³)"
                      value={newTestimonial.volumeNote}
                      onChange={(e) => setNewTestimonial({ ...newTestimonial, volumeNote: e.target.value })}
                      className="rounded-lg border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-2.5 py-1.5"
                    />
                    <select
                      value={newTestimonial.rating}
                      onChange={(e) => setNewTestimonial({ ...newTestimonial, rating: Number(e.target.value) })}
                      className="rounded-lg border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-2.5 py-1.5"
                    >
                      <option value={5}>5 Stars</option>
                      <option value={4}>4 Stars</option>
                      <option value={3}>3 Stars</option>
                      <option value={2}>2 Stars</option>
                      <option value={1}>1 Star</option>
                    </select>
                  </div>
                  <input
                    type="text"
                    placeholder="Project Photo URL (optional)"
                    value={newTestimonial.projectImageUrl}
                    onChange={(e) => setNewTestimonial({ ...newTestimonial, projectImageUrl: e.target.value })}
                    className="w-full rounded-lg border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-2.5 py-1.5"
                  />
                  <textarea
                    rows={2}
                    placeholder="Client quote"
                    value={newTestimonial.quote}
                    onChange={(e) => setNewTestimonial({ ...newTestimonial, quote: e.target.value })}
                    className="w-full rounded-lg border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-2.5 py-1.5"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      if (!newTestimonial.authorName || !newTestimonial.quote) return;
                      const res = await fetch('/api/admin/testimonials', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify(newTestimonial),
                      });
                      if (handleApiAuthFailure(res)) return;
                      setNewTestimonial({
                        authorName: '',
                        roleOrCompany: '',
                        location: 'Ranebennur',
                        projectTitle: '',
                        segment: 'Residential',
                        gradeUsed: 'M25 Slab Concrete',
                        volumeNote: '',
                        projectImageUrl: '',
                        rating: 5,
                        quote: '',
                      });
                      await refreshBootstrap();
                      showToast('Success story added.');
                    }}
                    className="btn-blue-pill px-3 py-1.5 font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Success Story</span>
                  </button>
                </div>
                <div className="divide-y divide-[#D7E4FF] dark:divide-[#264096] pt-2">
                  {(siteData?.testimonials || []).map((tm) => (
                    <div key={tm.id} className="py-2 flex items-center justify-between gap-2">
                      <span className="truncate">
                        {tm.rating || 5}★ · {tm.author_name} ({tm.location})
                        {tm.project_title ? ` — ${tm.project_title}` : ''}
                      </span>
                      <button
                        type="button"
                        onClick={async () => {
                          const res = await fetch(`/api/admin/testimonials/${tm.id}`, {
                            method: 'DELETE',
                            credentials: 'include',
                          });
                          if (handleApiAuthFailure(res)) return;
                          await refreshBootstrap();
                        }}
                        className="text-red-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Blogs */}
              <div className="warm-card p-5 space-y-3">
                <h3 className="font-display font-bold text-sm">Blog Posts ({siteData?.blogs.length || 0})</h3>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Article title"
                    value={newBlog.title}
                    onChange={(e) =>
                      setNewBlog({
                        ...newBlog,
                        title: e.target.value,
                        slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                      })
                    }
                    className="w-full rounded-lg border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-2.5 py-1.5"
                  />
                  <input
                    type="text"
                    placeholder="Short excerpt"
                    value={newBlog.excerpt}
                    onChange={(e) => setNewBlog({ ...newBlog, excerpt: e.target.value })}
                    className="w-full rounded-lg border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-2.5 py-1.5"
                  />
                  <textarea
                    rows={2}
                    placeholder="Full article text"
                    value={newBlog.content}
                    onChange={(e) => setNewBlog({ ...newBlog, content: e.target.value })}
                    className="w-full rounded-lg border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-2.5 py-1.5"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      if (!newBlog.title || !newBlog.content) return;
                      const res = await fetch('/api/admin/blogs', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify(newBlog),
                      });
                      if (handleApiAuthFailure(res)) return;
                      setNewBlog({
                        slug: '',
                        title: '',
                        category: 'Technical Guide',
                        excerpt: '',
                        content: '',
                        author: 'MY CONCRETE Team',
                      });
                      await refreshBootstrap();
                      showToast('Blog post published.');
                    }}
                    className="btn-blue-pill px-3 py-1.5 font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Publish Post</span>
                  </button>
                </div>
                <div className="divide-y divide-[#D7E4FF] dark:divide-[#264096] pt-2">
                  {(siteData?.blogs || []).map((b) => (
                    <div key={b.id} className="py-2 flex items-center justify-between gap-2">
                      <span className="truncate">{b.title}</span>
                      <button
                        type="button"
                        onClick={async () => {
                          const res = await fetch(`/api/admin/blogs/${b.id}`, {
                            method: 'DELETE',
                            credentials: 'include',
                          });
                          if (handleApiAuthFailure(res)) return;
                          await refreshBootstrap();
                        }}
                        className="text-red-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: MEDIA GALLERY (Owner & Staff) */}
        {tab === 'gallery' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
            <div className="warm-card p-5 space-y-3">
              <h2 className="font-display font-bold text-base">Add Gallery Photo</h2>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Photo title"
                  value={newMedia.title}
                  onChange={(e) => setNewMedia({ ...newMedia, title: e.target.value })}
                  className="w-full rounded-lg border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3 py-2"
                />
                <select
                  value={newMedia.category}
                  onChange={(e) => setNewMedia({ ...newMedia, category: e.target.value })}
                  className="w-full rounded-lg border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3 py-2"
                >
                  <option value="Plant">Plant &amp; Batching</option>
                  <option value="Mixers">Transit Mixers &amp; Pumps</option>
                  <option value="Projects">Customer Site Pours</option>
                  <option value="Bricks">Cement Bricks &amp; Blocks</option>
                  <option value="Quality">Quality Lab</option>
                </select>
                <input
                  type="text"
                  placeholder="Photo URL (e.g. /images/media/...)"
                  value={newMedia.imageUrl}
                  onChange={(e) => setNewMedia({ ...newMedia, imageUrl: e.target.value })}
                  className="w-full rounded-lg border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3 py-2"
                />
                <textarea
                  rows={2}
                  placeholder="Caption"
                  value={newMedia.caption}
                  onChange={(e) => setNewMedia({ ...newMedia, caption: e.target.value })}
                  className="w-full rounded-lg border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3 py-2"
                />
                <button
                  type="button"
                  onClick={async () => {
                    if (!newMedia.title) return;
                    const res = await fetch('/api/admin/media', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      credentials: 'include',
                      body: JSON.stringify(newMedia),
                    });
                    if (handleApiAuthFailure(res)) return;
                    setNewMedia({ title: '', category: 'Plant', caption: '', imageUrl: '' });
                    await refreshBootstrap();
                    showToast('Media item added.');
                  }}
                  className="btn-blue-pill px-4 py-2 font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Media Photo</span>
                </button>
              </div>
            </div>

            <div className="warm-card p-5 space-y-3">
              <h2 className="font-display font-bold text-base">
                Published Gallery Items ({siteData?.media.length || 0})
              </h2>
              <div className="divide-y divide-[#D7E4FF] dark:divide-[#264096] max-h-96 overflow-y-auto">
                {(siteData?.media || []).map((m) => (
                  <div key={m.id} className="py-2.5 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{m.title}</p>
                      <p className="text-[11px] text-[var(--muted)] truncate">
                        {m.category} · {m.image_url || 'Default plate'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        const res = await fetch(`/api/admin/media/${m.id}`, {
                          method: 'DELETE',
                          credentials: 'include',
                        });
                        if (handleApiAuthFailure(res)) return;
                        await refreshBootstrap();
                        showToast('Media item removed.');
                      }}
                      className="text-red-500 p-1"
                      aria-label={`Remove ${m.title}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB: CUSTOMERS & CSV */}
        {isOwner && tab === 'customers' && overview?.customers && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-[var(--muted)]">
                {overview.customers.length} unique customer record(s) from bookings
              </p>
              <button type="button" onClick={exportCustomersCsv} className="btn-blue-pill px-4 py-2 text-xs">
                <Download className="w-3.5 h-3.5" />
                <span>Download CSV</span>
              </button>
            </div>
            <div className="warm-card overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[var(--bg)] border-b border-[#D7E4FF] dark:border-[#264096] text-[var(--muted)]">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">City</th>
                    <th className="px-4 py-3 text-right">Orders</th>
                    <th className="px-4 py-3 text-right">Concrete Vol (m³)</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D7E4FF] dark:divide-[#264096]">
                  {overview.customers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-[var(--muted)]">
                        Customers will appear automatically after the first booking.
                      </td>
                    </tr>
                  ) : (
                    overview.customers.map((c) => {
                      const bookParams = new URLSearchParams();
                      if (c.name) bookParams.set('customerName', c.name);
                      if (c.phone) bookParams.set('phone', c.phone);
                      if (c.email) bookParams.set('email', c.email);
                      if (c.siteAddress) bookParams.set('address', c.siteAddress);
                      if (c.city) bookParams.set('city', c.city);
                      if (c.landmark) bookParams.set('landmark', c.landmark);
                      if (c.gstNumber) bookParams.set('gst', c.gstNumber);
                      return (
                        <tr key={c.phone}>
                          <td className="px-4 py-3 font-semibold">{c.name}</td>
                          <td className="px-4 py-3 tabular-nums">{c.phone}</td>
                          <td className="px-4 py-3">{c.email || '—'}</td>
                          <td className="px-4 py-3">
                            <span>{c.city}</span>
                            {c.siteAddress && (
                              <p className="text-[11px] text-[var(--muted)] truncate max-w-[200px]">{c.siteAddress}</p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums">{c.totalOrders}</td>
                          <td className="px-4 py-3 text-right font-mono tabular-nums">{c.totalM3}</td>
                          <td className="px-4 py-3 text-right">
                            <Link
                              to={`/book?${bookParams.toString()}`}
                              className="inline-flex items-center gap-1 rounded-lg bg-[#1F3FA8] text-white px-2.5 py-1 font-semibold hover:bg-[#173187]"
                            >
                              Book Now
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: STAFF & SECURITY (Owner: users + logs + own security; Staff: own security) */}
        {((isOwner && tab === 'users') || (!isOwner && tab === 'security')) && (
          <div className="space-y-6 text-xs">
            {/* Personal Password & 2FA Controls */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="warm-card p-5 space-y-4">
                <h2 className="font-display font-bold text-base flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-[#D92B25]" />
                  <span>Change Your Password</span>
                </h2>
                <form onSubmit={handleChangePassword} className="space-y-3">
                  <input
                    type="password"
                    required
                    placeholder="Current password"
                    value={cpCurrent}
                    onChange={(e) => setCpCurrent(e.target.value)}
                    className="w-full rounded-lg border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3 py-2"
                  />
                  <input
                    type="password"
                    required
                    minLength={8}
                    placeholder="New password (min 8 chars, letters + number/symbol)"
                    value={cpNew}
                    onChange={(e) => setCpNew(e.target.value)}
                    className="w-full rounded-lg border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3 py-2"
                  />
                  <input
                    type="password"
                    required
                    minLength={8}
                    placeholder="Confirm new password"
                    value={cpConfirm}
                    onChange={(e) => setCpConfirm(e.target.value)}
                    className="w-full rounded-lg border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3 py-2"
                  />
                  {cpError && <p className="text-red-600 font-medium">{cpError}</p>}
                  <button
                    type="submit"
                    disabled={cpBusy}
                    className="btn-orange-pill px-4 py-2 text-xs disabled:opacity-60"
                  >
                    {cpBusy ? 'Updating...' : 'Update Password'}
                  </button>
                </form>
              </div>

              <div className="warm-card p-5 space-y-4">
                <h2 className="font-display font-bold text-base flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#1F3FA8]" />
                  <span>Two-Factor Authentication (Email OTP)</span>
                </h2>
                <p className="text-[var(--muted)] leading-relaxed">
                  When enabled, signing in requires a one-time 6-digit verification code sent to{' '}
                  <strong>{admin.email}</strong>. Sessions also auto-lock after 30 minutes of inactivity.
                </p>
                <div className="flex items-center justify-between rounded-xl border border-[#D7E4FF] dark:border-[#264096] p-3.5">
                  <div>
                    <p className="font-semibold">Email OTP Verification</p>
                    <p className="text-[11px] text-[var(--muted)]">
                      Status: {admin.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleTwoFactor(!admin.twoFactorEnabled)}
                    className={
                      admin.twoFactorEnabled
                        ? 'rounded-lg bg-red-600 text-white px-3.5 py-1.5 font-semibold'
                        : 'btn-blue-pill px-3.5 py-1.5 font-semibold'
                    }
                  >
                    {admin.twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
                  </button>
                </div>
              </div>
            </div>

            {isOwner && (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="warm-card p-5 space-y-3">
                    <h2 className="font-display font-bold text-base flex items-center gap-2">
                      <UserPlus className="w-4 h-4 text-[#D92B25]" />
                      <span>Add Staff / Owner User</span>
                    </h2>
                    <p className="text-[var(--muted)]">
                      Staff members can manage <strong>Bookings</strong> and the <strong>Media Gallery</strong> only.
                      They are required to change their temporary password on first login.
                    </p>
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        setUserFormError(null);
                        const res = await fetch('/api/admin/users', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          credentials: 'include',
                          body: JSON.stringify(newUserForm),
                        });
                        if (handleApiAuthFailure(res)) return;
                        const { data: json, isJson } = await parseJsonResponse<{ error?: string }>(res);
                        if (!isJson || !json) {
                          setUserFormError(FRIENDLY_API_ERROR);
                          return;
                        }
                        if (!res.ok) {
                          setUserFormError(json.error || 'Could not create user');
                          return;
                        }
                        setNewUserForm({ name: '', email: '', role: 'staff', temporaryPassword: '' });
                        await fetchUsers();
                        showToast('User account created.');
                      }}
                      className="space-y-2.5"
                    >
                      <input
                        type="text"
                        required
                        placeholder="Full Name"
                        value={newUserForm.name}
                        onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                        className="w-full rounded-lg border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3 py-2"
                      />
                      <input
                        type="email"
                        required
                        placeholder="Work Email"
                        value={newUserForm.email}
                        onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                        className="w-full rounded-lg border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3 py-2"
                      />
                      <select
                        value={newUserForm.role}
                        onChange={(e) =>
                          setNewUserForm({ ...newUserForm, role: e.target.value as 'staff' | 'owner' })
                        }
                        className="w-full rounded-lg border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3 py-2"
                      >
                        <option value="staff">Staff (Bookings &amp; Gallery only)</option>
                        <option value="owner">Owner (Full Access)</option>
                      </select>
                      <input
                        type="password"
                        required
                        minLength={8}
                        placeholder="Temporary Password (min 8 chars)"
                        value={newUserForm.temporaryPassword}
                        onChange={(e) =>
                          setNewUserForm({ ...newUserForm, temporaryPassword: e.target.value })
                        }
                        className="w-full rounded-lg border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3 py-2"
                      />
                      {userFormError && <p className="text-red-600 font-medium">{userFormError}</p>}
                      <button type="submit" className="btn-blue-pill px-4 py-2 font-semibold w-full">
                        Create Account
                      </button>
                    </form>
                  </div>

                  <div className="lg:col-span-2 warm-card overflow-x-auto">
                    <div className="p-4 border-b border-[#D7E4FF] dark:border-[#264096]">
                      <h2 className="font-display font-bold text-base">
                        Admin &amp; Staff Accounts ({usersData?.users.length || 0})
                      </h2>
                    </div>
                    <table className="w-full text-xs text-left">
                      <thead className="bg-[var(--bg)] border-b border-[#D7E4FF] dark:border-[#264096] text-[var(--muted)]">
                        <tr>
                          <th className="px-4 py-2.5">Name &amp; Email</th>
                          <th className="px-4 py-2.5">Role</th>
                          <th className="px-4 py-2.5">Security</th>
                          <th className="px-4 py-2.5">Last Login</th>
                          <th className="px-4 py-2.5 text-right">Remove</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#D7E4FF] dark:divide-[#264096]">
                        {(usersData?.users || []).map((u) => (
                          <tr key={u.id}>
                            <td className="px-4 py-2.5">
                              <p className="font-semibold">{u.name || '—'}</p>
                              <p className="text-[var(--muted)]">{u.email}</p>
                            </td>
                            <td className="px-4 py-2.5 uppercase font-mono font-bold">{u.role}</td>
                            <td className="px-4 py-2.5 text-[11px]">
                              {u.two_factor_enabled ? '2FA On' : '2FA Off'}
                              {u.must_change_password ? ' · Must change PW' : ''}
                            </td>
                            <td className="px-4 py-2.5 font-mono text-[11px]">
                              {u.last_login_at || 'Never'}
                            </td>
                            <td className="px-4 py-2.5 text-right">
                              {u.id !== admin.id && (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    const res = await fetch(`/api/admin/users/${u.id}`, {
                                      method: 'DELETE',
                                      credentials: 'include',
                                    });
                                    if (handleApiAuthFailure(res)) return;
                                    if (res.ok) {
                                      await fetchUsers();
                                      showToast('User removed.');
                                    }
                                  }}
                                  className="text-red-500 p-1"
                                  aria-label={`Remove ${u.email}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="warm-card overflow-x-auto">
                  <div className="p-4 border-b border-[#D7E4FF] dark:border-[#264096]">
                    <h2 className="font-display font-bold text-base">
                      Recent Admin Login &amp; Security Audit Log ({usersData?.loginLogs.length || 0})
                    </h2>
                  </div>
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[var(--bg)] border-b border-[#D7E4FF] dark:border-[#264096] text-[var(--muted)]">
                      <tr>
                        <th className="px-4 py-2.5">Email</th>
                        <th className="px-4 py-2.5">Role</th>
                        <th className="px-4 py-2.5">Event</th>
                        <th className="px-4 py-2.5">IP</th>
                        <th className="px-4 py-2.5">Timestamp (UTC)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D7E4FF] dark:divide-[#264096]">
                      {(usersData?.loginLogs || []).map((log) => (
                        <tr key={log.id}>
                          <td className="px-4 py-2 font-medium">{log.email}</td>
                          <td className="px-4 py-2 uppercase font-mono">{log.role || '—'}</td>
                          <td className="px-4 py-2 font-mono">{log.status}</td>
                          <td className="px-4 py-2 font-mono text-[var(--muted)]">{log.ip_address}</td>
                          <td className="px-4 py-2 font-mono text-[var(--muted)]">{log.created_at}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* VIEW BOOKING MODAL */}
      {viewingBooking && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-view-booking-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F1F5C]/70 backdrop-blur-xs p-4"
          onClick={() => setViewingBooking(null)}
        >
          <div
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[var(--surface)] border border-[#D7E4FF] dark:border-[#264096] p-6 shadow-2xl space-y-5 text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-[#D7E4FF] dark:border-[#264096] pb-4">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-mono font-bold text-base text-[#1F3FA8] dark:text-[#FFC93C]">
                    {viewingBooking.booking_code}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase ${getStatusBadgeClass(
                      viewingBooking.status
                    )}`}
                  >
                    {viewingBooking.status}
                  </span>
                </div>
                <h2 id="admin-view-booking-title" className="font-display font-bold text-lg mt-1">
                  {viewingBooking.customer_name} · {viewingBooking.product_name}
                </h2>
                <p className="text-[11px] text-[var(--muted)]">
                  Created: {viewingBooking.created_at} · Updated: {viewingBooking.updated_at}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingBooking(null)}
                aria-label="Close booking details"
                className="p-1.5 rounded-full hover:bg-[var(--bg)] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl bg-[var(--bg)] border border-[#D7E4FF] dark:border-[#264096] p-4 space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">Customer Contact</p>
                <p className="font-semibold text-sm">{viewingBooking.customer_name}</p>
                <div className="flex items-center gap-2">
                  <span className="text-[var(--muted)]">Phone:</span>
                  <CallLink phone={viewingBooking.phone} className="font-mono font-semibold text-[#1F3FA8] dark:text-[#FFC93C] hover:underline" />
                </div>
                {viewingBooking.email && (
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--muted)]">Email:</span>
                    <EmailLink email={viewingBooking.email} className="font-mono text-[#1F3FA8] dark:text-[#FFC93C] hover:underline" />
                  </div>
                )}
                {viewingBooking.gst_number && (
                  <p>
                    <span className="text-[var(--muted)]">GSTIN:</span>{' '}
                    <span className="font-mono">{viewingBooking.gst_number}</span>
                  </p>
                )}
                <div className="pt-1">
                  <a
                    href={buildWhatsAppUrl(
                      viewingBooking.phone,
                      `Namaskara ${viewingBooking.customer_name}, regarding your MY CONCRETE booking ${viewingBooking.booking_code} (${viewingBooking.grade}, Qty: ${viewingBooking.quantity_m3} ${viewingBooking.unit_type === 'pieces' ? 'pieces' : 'm³'}, Date: ${viewingBooking.delivery_date} ${viewingBooking.slot_label}).`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#16A34A] hover:brightness-110 text-white px-2.5 py-1.5 font-semibold"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp Customer</span>
                  </a>
                </div>
              </div>

              <div className="rounded-xl bg-[var(--bg)] border border-[#D7E4FF] dark:border-[#264096] p-4 space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">Schedule &amp; Mix Specs</p>
                <p>
                  <span className="text-[var(--muted)]">Grade:</span>{' '}
                  <strong>{viewingBooking.grade}</strong> ·{' '}
                  <strong>
                    {Number(viewingBooking.quantity_m3).toLocaleString('en-IN')}{' '}
                    {viewingBooking.unit_type === 'pieces' ? 'pieces' : 'm³'}
                  </strong>
                </p>
                <p>
                  <span className="text-[var(--muted)]">Delivery:</span>{' '}
                  <strong className="tabular-nums">{viewingBooking.delivery_date}</strong> ({viewingBooking.slot_label})
                </p>
                <p>
                  <span className="text-[var(--muted)]">Usage &amp; Slump:</span> {viewingBooking.usage_type} ·{' '}
                  {viewingBooking.slump_mm}
                </p>
                {viewingBooking.unit_type !== 'pieces' && (
                  <p>
                    <span className="text-[var(--muted)]">Pump:</span>{' '}
                    <span className="uppercase font-semibold">{viewingBooking.pump_type}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl bg-[var(--bg)] border border-[#D7E4FF] dark:border-[#264096] p-4 space-y-1.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">Delivery Site</p>
                <p className="font-semibold">{viewingBooking.site_address}</p>
                {viewingBooking.landmark && (
                  <p className="text-[var(--muted)]">Landmark: {viewingBooking.landmark}</p>
                )}
                <p className="text-[var(--muted)]">
                  City/Taluk: {viewingBooking.city} · Distance from{' '}
                  {viewingBooking.dispatch_plant_name || 'Kotihal'} plant: {viewingBooking.distance_km} km
                </p>
              </div>

              <div className="rounded-xl bg-[var(--bg)] border border-[#D7E4FF] dark:border-[#264096] p-4 space-y-1.5 tabular-nums">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">Indicative Estimate</p>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Material:</span>
                  <span>INR {Number(viewingBooking.estimated_concrete_amount || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Delivery Fee:</span>
                  <span>INR {Number(viewingBooking.estimated_delivery_fee || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Pump Fee:</span>
                  <span>INR {Number(viewingBooking.estimated_pump_fee || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between border-t border-[#D7E4FF] dark:border-[#264096] pt-1 font-bold text-sm">
                  <span>Estimated Total:</span>
                  <span>INR {Number(viewingBooking.estimated_total || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {viewingBooking.notes && (
              <div className="rounded-xl bg-[var(--bg)] border border-[#D7E4FF] dark:border-[#264096] p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)] mb-1">Notes</p>
                <p className="whitespace-pre-wrap">{viewingBooking.notes}</p>
              </div>
            )}

            {(() => {
              const liveBooking =
                overview?.bookings.find((item) => item.id === viewingBooking.id) || viewingBooking;
              const emailSt = liveBooking.notify_email_status || liveBooking.email_status || 'pending';
              const waSt = liveBooking.notify_whatsapp_status || liveBooking.whatsapp_status || 'pending';
              return (
                <div className="rounded-xl bg-[var(--bg)] border border-[#D7E4FF] dark:border-[#264096] p-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
                      Owner Notification Delivery ({liveBooking.language === 'kn' ? 'Kannada' : 'English'})
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${getDeliveryStatusClass(emailSt)}`}>
                        Email: {emailSt}
                      </span>
                      <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${getDeliveryStatusClass(waSt)}`}>
                        WhatsApp: {waSt}
                      </span>
                      {liveBooking.notified_at && (
                        <span className="text-[11px] text-[var(--muted)]">
                          Last attempt: {liveBooking.notified_at}
                        </span>
                      )}
                    </div>
                    {(liveBooking.email_error || liveBooking.whatsapp_error) && (
                      <p className="text-[11px] text-red-600 dark:text-red-300">
                        {[liveBooking.email_error, liveBooking.whatsapp_error].filter(Boolean).join(' | ')}
                      </p>
                    )}
                  </div>
                  {isOwner && (
                    <button
                      type="button"
                      disabled={resendingKey === `booking:${liveBooking.id}`}
                      onClick={() => resendLeadNotification('booking', liveBooking.id)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[#D7E4FF] dark:border-[#264096] px-3 py-1.5 font-semibold hover:border-[#1F3FA8] cursor-pointer disabled:opacity-60"
                    >
                      <RefreshCw
                        className={`w-3.5 h-3.5 ${resendingKey === `booking:${liveBooking.id}` ? 'animate-spin' : ''}`}
                      />
                      <span>Resend notification</span>
                    </button>
                  )}
                </div>
              );
            })()}

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#D7E4FF] dark:border-[#264096] pt-4">
              <div className="flex flex-wrap gap-2">
                {viewingBooking.status !== 'approved' && viewingBooking.status !== 'completed' && viewingBooking.status !== 'cancelled' && (
                  <button
                    type="button"
                    disabled={bookingActionBusy}
                    onClick={() => updateBooking(viewingBooking.id, { status: 'approved' })}
                    className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 font-semibold cursor-pointer"
                  >
                    Approve
                  </button>
                )}
                {viewingBooking.status !== 'dispatched' && viewingBooking.status !== 'completed' && viewingBooking.status !== 'cancelled' && (
                  <button
                    type="button"
                    disabled={bookingActionBusy}
                    onClick={() => updateBooking(viewingBooking.id, { status: 'dispatched' })}
                    className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white px-3 py-2 font-semibold cursor-pointer"
                  >
                    Mark Dispatched
                  </button>
                )}
                {viewingBooking.status !== 'completed' && viewingBooking.status !== 'cancelled' && (
                  <button
                    type="button"
                    disabled={bookingActionBusy}
                    onClick={() => updateBooking(viewingBooking.id, { status: 'completed' })}
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 font-semibold cursor-pointer"
                  >
                    Mark Completed
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const b = viewingBooking;
                    setViewingBooking(null);
                    openEditBookingModal(b);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#1F3FA8] hover:bg-[#173187] text-white px-3.5 py-2 font-semibold cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Edit Appointment</span>
                </button>
                {viewingBooking.status !== 'cancelled' && viewingBooking.status !== 'completed' && (
                  confirmCancelBookingId === viewingBooking.id ? (
                    <div className="inline-flex items-center gap-2 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-300 px-3 py-1.5">
                      <button
                        type="button"
                        disabled={bookingActionBusy}
                        onClick={() => updateBooking(viewingBooking.id, { status: 'cancelled' })}
                        className="text-red-700 dark:text-red-300 font-bold hover:underline cursor-pointer"
                      >
                        Confirm Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmCancelBookingId(null)}
                        className="text-[var(--muted)] hover:underline cursor-pointer"
                      >
                        Keep
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmCancelBookingId(viewingBooking.id)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-red-300 text-red-600 dark:text-red-300 px-3.5 py-2 font-semibold hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      <span>Cancel</span>
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT BOOKING MODAL */}
      {editingBooking && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-edit-booking-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F1F5C]/70 backdrop-blur-xs p-4"
          onClick={() => setEditingBooking(null)}
        >
          <div
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[var(--surface)] border border-[#D7E4FF] dark:border-[#264096] p-6 shadow-2xl space-y-4 text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#D7E4FF] dark:border-[#264096] pb-3">
              <div>
                <p className="font-mono font-bold text-[#1F3FA8] dark:text-[#FFC93C]">{editingBooking.booking_code}</p>
                <h2 id="admin-edit-booking-title" className="font-display font-bold text-lg">
                  Edit Appointment &amp; Dispatch Details
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setEditingBooking(null)}
                aria-label="Close edit modal"
                className="p-1.5 rounded-full hover:bg-[var(--bg)] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={saveBookingEdit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[var(--muted)] mb-1">Customer Name</label>
                  <input
                    type="text"
                    required
                    value={editBookingForm.customerName}
                    onChange={(e) => setEditBookingForm({ ...editBookingForm, customerName: e.target.value })}
                    className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-[var(--muted)] mb-1">Mobile Number (10 digits)</label>
                  <input
                    type="tel"
                    required
                    value={editBookingForm.phone}
                    onChange={(e) => setEditBookingForm({ ...editBookingForm, phone: e.target.value })}
                    className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-[var(--muted)] mb-1">Email (optional)</label>
                  <input
                    type="email"
                    value={editBookingForm.email}
                    onChange={(e) => setEditBookingForm({ ...editBookingForm, email: e.target.value })}
                    className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-[var(--muted)] mb-1">GSTIN (optional)</label>
                  <input
                    type="text"
                    value={editBookingForm.gstNumber}
                    onChange={(e) => setEditBookingForm({ ...editBookingForm, gstNumber: e.target.value })}
                    className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[var(--muted)] mb-1">Delivery Date</label>
                  <input
                    type="date"
                    required
                    value={editBookingForm.deliveryDate}
                    onChange={(e) => setEditBookingForm({ ...editBookingForm, deliveryDate: e.target.value })}
                    className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-[var(--muted)] mb-1">24/7 Delivery Slot</label>
                  <select
                    value={editBookingForm.slotId}
                    onChange={(e) => setEditBookingForm({ ...editBookingForm, slotId: e.target.value })}
                    className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3 py-2"
                  >
                    {(siteData?.schedulingConfig?.slots || []).map((sl) => (
                      <option key={sl.id} value={sl.id}>
                        {sl.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[var(--muted)] mb-1">Status</label>
                  <select
                    value={editBookingForm.status}
                    onChange={(e) => setEditBookingForm({ ...editBookingForm, status: e.target.value })}
                    className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3 py-2"
                  >
                    <option value="confirmed">Confirmed</option>
                    <option value="waitlisted">Waitlisted</option>
                    <option value="approved">Approved</option>
                    <option value="dispatched">Dispatched</option>
                    <option value="completed">Completed</option>
                    <option value="rejected">Rejected</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[var(--muted)] mb-1">Grade / Size</label>
                  <input
                    type="text"
                    required
                    value={editBookingForm.grade}
                    onChange={(e) => setEditBookingForm({ ...editBookingForm, grade: e.target.value })}
                    className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-[var(--muted)] mb-1">
                    Quantity ({editingBooking.unit_type === 'pieces' ? 'pieces' : 'm³'})
                  </label>
                  <input
                    type="number"
                    min={1}
                    step={editingBooking.unit_type === 'pieces' ? 1 : 0.5}
                    required
                    value={editBookingForm.quantityM3}
                    onChange={(e) => setEditBookingForm({ ...editBookingForm, quantityM3: Number(e.target.value) })}
                    className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3 py-2 tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-[var(--muted)] mb-1">Slump / Spec</label>
                  <input
                    type="text"
                    required
                    value={editBookingForm.slumpMm}
                    onChange={(e) => setEditBookingForm({ ...editBookingForm, slumpMm: e.target.value })}
                    className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3 py-2"
                  />
                </div>
                {editingBooking.unit_type !== 'pieces' && (
                  <div>
                    <label className="block text-[var(--muted)] mb-1">Pump Requirement</label>
                    <select
                      value={editBookingForm.pumpType}
                      onChange={(e) =>
                        setEditBookingForm({
                          ...editBookingForm,
                          pumpType: e.target.value as 'none' | 'line' | 'boom',
                        })
                      }
                      className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3 py-2"
                    >
                      <option value="none">No Pump (Direct Chute)</option>
                      <option value="line">Line Pump</option>
                      <option value="boom">Boom Pump</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[var(--muted)] mb-1">Site Address</label>
                  <input
                    type="text"
                    required
                    value={editBookingForm.siteAddress}
                    onChange={(e) => setEditBookingForm({ ...editBookingForm, siteAddress: e.target.value })}
                    className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-[var(--muted)] mb-1">City / Taluk</label>
                  <input
                    type="text"
                    required
                    value={editBookingForm.city}
                    onChange={(e) => setEditBookingForm({ ...editBookingForm, city: e.target.value })}
                    className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-[var(--muted)] mb-1">Landmark (optional)</label>
                  <input
                    type="text"
                    value={editBookingForm.landmark}
                    onChange={(e) => setEditBookingForm({ ...editBookingForm, landmark: e.target.value })}
                    className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3 py-2"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[var(--muted)] mb-1">Usage Type</label>
                  <input
                    type="text"
                    required
                    value={editBookingForm.usageType}
                    onChange={(e) => setEditBookingForm({ ...editBookingForm, usageType: e.target.value })}
                    className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[var(--muted)] mb-1">Dispatch / Customer Notes</label>
                <textarea
                  rows={2}
                  value={editBookingForm.notes}
                  onChange={(e) => setEditBookingForm({ ...editBookingForm, notes: e.target.value })}
                  className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3 py-2"
                />
              </div>

              {bookingModalError && <p className="text-red-600 font-semibold">{bookingModalError}</p>}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#D7E4FF] dark:border-[#264096]">
                <button
                  type="button"
                  onClick={() => setEditingBooking(null)}
                  className="rounded-xl border border-[#D7E4FF] dark:border-[#264096] px-4 py-2 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bookingActionBusy}
                  className="btn-orange-pill px-5 py-2 font-semibold disabled:opacity-60 cursor-pointer"
                >
                  {bookingActionBusy ? 'Saving...' : 'Save Appointment Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT SITE VISIT MODAL */}
      {editingVisit && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-edit-visit-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F1F5C]/70 backdrop-blur-xs p-4"
          onClick={() => setEditingVisit(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-[var(--surface)] border border-[#D7E4FF] dark:border-[#264096] p-6 shadow-2xl space-y-4 text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#D7E4FF] dark:border-[#264096] pb-3">
              <div>
                <p className="font-mono font-bold text-[#1F3FA8] dark:text-[#FFC93C]">{editingVisit.visit_code}</p>
                <h2 id="admin-edit-visit-title" className="font-display font-bold text-lg">
                  Edit Site / Plant Visit Appointment
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setEditingVisit(null)}
                aria-label="Close site visit edit modal"
                className="p-1.5 rounded-full hover:bg-[var(--bg)] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={saveSiteVisitEdit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[var(--muted)] mb-1">Visitor Name</label>
                  <input
                    type="text"
                    required
                    value={editVisitForm.customerName}
                    onChange={(e) => setEditVisitForm({ ...editVisitForm, customerName: e.target.value })}
                    className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-[var(--muted)] mb-1">Phone</label>
                  <input
                    type="tel"
                    required
                    value={editVisitForm.phone}
                    onChange={(e) => setEditVisitForm({ ...editVisitForm, phone: e.target.value })}
                    className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-[var(--muted)] mb-1">Preferred Date</label>
                  <input
                    type="date"
                    required
                    value={editVisitForm.preferredDate}
                    onChange={(e) => setEditVisitForm({ ...editVisitForm, preferredDate: e.target.value })}
                    className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-[var(--muted)] mb-1">Preferred Time</label>
                  <input
                    type="text"
                    required
                    value={editVisitForm.preferredTime}
                    onChange={(e) => setEditVisitForm({ ...editVisitForm, preferredTime: e.target.value })}
                    className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-[var(--muted)] mb-1">Location</label>
                  <input
                    type="text"
                    value={editVisitForm.location}
                    onChange={(e) => setEditVisitForm({ ...editVisitForm, location: e.target.value })}
                    className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-[var(--muted)] mb-1">Status</label>
                  <select
                    value={editVisitForm.status}
                    onChange={(e) => setEditVisitForm({ ...editVisitForm, status: e.target.value })}
                    className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3 py-2"
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[var(--muted)] mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={editVisitForm.notes}
                  onChange={(e) => setEditVisitForm({ ...editVisitForm, notes: e.target.value })}
                  className="w-full rounded-xl border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-3 py-2"
                />
              </div>

              {visitModalError && <p className="text-red-600 font-semibold">{visitModalError}</p>}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#D7E4FF] dark:border-[#264096]">
                <button
                  type="button"
                  onClick={() => setEditingVisit(null)}
                  className="rounded-xl border border-[#D7E4FF] dark:border-[#264096] px-4 py-2 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={visitActionBusy}
                  className="btn-orange-pill px-5 py-2 font-semibold disabled:opacity-60 cursor-pointer"
                >
                  {visitActionBusy ? 'Saving...' : 'Save Visit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
