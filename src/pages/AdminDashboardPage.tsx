import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Download,
  FileText,
  Image as ImageIcon,
  Inbox,
  KeyRound,
  Layers,
  LogOut,
  Plus,
  Settings,
  ShieldCheck,
  Sliders,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { useDocumentMeta } from '../utils/seo.ts';
import { FRIENDLY_API_ERROR, parseJsonResponse } from '../utils/api.ts';
import type {
  BookingRecord,
  BusinessConfig,
  CustomerSegmentConfig,
  HeroSlide,
  ProductItem,
  SchedulingConfig,
  StatItem,
} from '../types/index.ts';

export type AdminTab =
  | 'analytics'
  | 'bookings'
  | 'inbox'
  | 'products'
  | 'scheduling'
  | 'cms'
  | 'gallery'
  | 'customers'
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

interface AdminOverviewData {
  role: 'owner' | 'staff';
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
  siteVisits?: Array<Record<string, unknown>>;
  enquiries?: Array<Record<string, unknown>>;
  subscribers?: Array<Record<string, unknown>>;
  emailLogs?: Array<Record<string, unknown>>;
  customers?: Array<{
    name: string;
    phone: string;
    email: string;
    city: string;
    totalOrders: number;
    totalM3: number;
  }>;
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
  const [admin, setAdmin] = useState<AdminSessionProfile | null>(null);

  const [authView, setAuthView] = useState<'signin' | 'otp' | 'forgot' | 'reset'>(
    resetTokenFromUrl ? 'reset' : 'signin'
  );
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

  const [tab, setTab] = useState<AdminTab>(initialTab || 'analytics');
  const [overview, setOverview] = useState<AdminOverviewData | null>(null);
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

  const [bookingFilter, setBookingFilter] = useState('all');
  const [bookingSearch, setBookingSearch] = useState('');

  const [bizForm, setBizForm] = useState<BusinessConfig | null>(null);
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
    if (siteData) {
      setBizForm(siteData.businessConfig);
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
      const [statusRes, meRes] = await Promise.all([
        fetch('/api/admin/auth-status'),
        fetch('/api/admin/me', { credentials: 'include' }),
      ]);
      if (statusRes.ok) {
        const { data: sJson } = await parseJsonResponse<{ configured: boolean }>(statusRes);
        if (sJson) setAuthConfigured(Boolean(sJson.configured));
      }
      if (meRes.ok) {
        const { data: meJson } = await parseJsonResponse<{ admin: AdminSessionProfile }>(meRes);
        setAdmin(meJson?.admin || null);
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
        if (json) setOverview(json);
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
      const { data: json, isJson } = await parseJsonResponse<{ error?: string; message?: string }>(res);
      if (!isJson || !json) {
        setLoginError(FRIENDLY_API_ERROR);
        return;
      }
      if (!res.ok) {
        setLoginError(json.error || 'Could not process password reset request');
        return;
      }
      setAuthNotice(
        json.message || 'Reset link dispatched to myconcretektl@gmail.com if that account exists.'
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

  async function updateBooking(id: number, payload: Record<string, string>) {
    const res = await fetch(`/api/admin/bookings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    if (handleApiAuthFailure(res)) return;
    await fetchOverview();
    showToast('Booking updated.');
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
            <div className="rounded-xl border border-amber-400/60 bg-amber-50 dark:bg-amber-950/30 p-3.5 text-xs text-amber-900 dark:text-amber-200 space-y-1">
              <p className="font-bold">Initial Setup Required</p>
              <p>
                Set <code className="font-mono">ADMIN_EMAIL</code> and{' '}
                <code className="font-mono">ADMIN_PASSWORD</code> in <code className="font-mono">.env</code> and restart
                the server to initialize the Owner account. See <code className="font-mono">README.md</code>.
              </p>
            </div>
          )}

          {authNotice && (
            <div className="rounded-xl border border-[#1F3FA8]/30 bg-[#EEF4FF] dark:bg-[#132463] p-3 text-xs text-[#0F1F5C] dark:text-slate-100">
              {authNotice}
            </div>
          )}

          {authView === 'signin' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">Admin / Staff Email</label>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="Enter your admin email"
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

          {authView === 'otp' && (
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

          {authView === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <p className="text-xs text-[var(--muted)]">
                A password reset link will be emailed to <code className="font-mono">myconcretektl@gmail.com</code>.
              </p>
              <div>
                <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">Account Email</label>
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="Enter account email"
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
      b.phone.includes(q);
    return matchesStatus && matchesSearch;
  });

  const ownerNavItems: Array<{ id: AdminTab; label: string; icon: React.ReactNode }> = [
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'bookings', label: 'Bookings & Dispatch', icon: <CalendarDays className="w-4 h-4" /> },
    { id: 'inbox', label: 'Quotes & Inbox', icon: <Inbox className="w-4 h-4" /> },
    { id: 'products', label: 'Products & Rates', icon: <Layers className="w-4 h-4" /> },
    { id: 'scheduling', label: 'Plant, 24/7 Slots & Config', icon: <Sliders className="w-4 h-4" /> },
    { id: 'cms', label: 'CMS, Stats & Testimonials', icon: <FileText className="w-4 h-4" /> },
    { id: 'gallery', label: 'Media Gallery', icon: <ImageIcon className="w-4 h-4" /> },
    { id: 'customers', label: 'Customers & CSV', icon: <Users className="w-4 h-4" /> },
    { id: 'users', label: 'Staff & Security', icon: <ShieldCheck className="w-4 h-4" /> },
  ];

  const staffNavItems: Array<{ id: AdminTab; label: string; icon: React.ReactNode }> = [
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
                  } else if (window.location.pathname === '/admin/users') {
                    navigate('/admin', { replace: true });
                  }
                }}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  tab === item.id
                    ? 'bg-[#D92B25] text-white'
                    : 'text-slate-300 hover:bg-[#1F3FA8] hover:text-white'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
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
              <div className="flex flex-wrap gap-1.5">
                {['all', 'confirmed', 'waitlisted', 'approved', 'dispatched', 'completed', 'cancelled', 'rejected'].map(
                  (st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setBookingFilter(st)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize ${
                        bookingFilter === st
                          ? 'bg-[#D92B25] text-white'
                          : 'bg-[var(--surface)] border border-[#D7E4FF] dark:border-[#264096]'
                      }`}
                    >
                      {st}
                    </button>
                  )
                )}
              </div>
              <input
                type="search"
                value={bookingSearch}
                onChange={(e) => setBookingSearch(e.target.value)}
                placeholder="Search ID, name or phone..."
                className="rounded-full border border-[#D7E4FF] dark:border-[#264096] bg-[var(--surface)] px-4 py-1.5 text-xs w-60"
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
                    <th className="px-4 py-3">Site</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
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
                    filteredBookings.map((b) => (
                      <tr key={b.id} className="hover:bg-[var(--bg)]/50">
                        <td className="px-4 py-3 font-mono font-bold">{b.booking_code}</td>
                        <td className="px-4 py-3">
                          <p className="font-semibold">{b.customer_name}</p>
                          <p className="text-[var(--muted)] tabular-nums">{b.phone}</p>
                        </td>
                        <td className="px-4 py-3 tabular-nums">
                          {b.grade} · {Number(b.quantity_m3).toLocaleString('en-IN')}{' '}
                          {b.unit_type === 'pieces' ? 'pcs' : 'm³'}
                          {b.unit_type !== 'pieces' ? ` (${b.pump_type})` : ''}
                        </td>
                        <td className="px-4 py-3 tabular-nums">
                          <p>{b.delivery_date}</p>
                          <p className="text-[var(--muted)]">{b.slot_label}</p>
                        </td>
                        <td className="px-4 py-3 max-w-[180px] truncate">
                          {b.city} ({b.distance_km} km)
                        </td>
                        <td className="px-4 py-3 font-semibold uppercase">{b.status}</td>
                        <td className="px-4 py-3 text-right">
                          <select
                            value={b.status}
                            onChange={(e) => updateBooking(b.id, { status: e.target.value })}
                            className="rounded-lg border border-[#D7E4FF] dark:border-[#264096] bg-[var(--bg)] px-2 py-1 text-xs"
                          >
                            <option value="confirmed">Confirmed</option>
                            <option value="waitlisted">Waitlisted</option>
                            <option value="approved">Approved</option>
                            <option value="dispatched">Dispatched</option>
                            <option value="completed">Completed</option>
                            <option value="rejected">Rejected</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: QUOTES & INBOX */}
        {isOwner && tab === 'inbox' && overview && (
          <div className="space-y-6">
            <div className="warm-card p-5 space-y-3">
              <h2 className="font-display font-bold text-base">Quote Requests ({(overview.quotes || []).length})</h2>
              {(overview.quotes || []).length === 0 ? (
                <p className="text-xs text-[var(--muted)]">No quote requests yet.</p>
              ) : (
                <div className="divide-y divide-[#D7E4FF] dark:divide-[#264096] text-xs">
                  {(overview.quotes || []).map((q) => (
                    <div key={String(q.id)} className="py-3 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold">
                          <span className="font-mono mr-2">{String(q.quote_code)}</span>
                          {String(q.customer_name)} ({String(q.phone)}) · {String(q.grade)} · {String(q.quantity_m3)}
                        </p>
                        <p className="text-[var(--muted)]">
                          {String(q.project_type)} · {String(q.location)} · Timeline: {String(q.timeline)}
                          {q.attachment_name ? ` · Attachment: ${String(q.attachment_name)}` : ''}
                        </p>
                      </div>
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
                          fetchOverview();
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
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="warm-card p-5 space-y-3">
                <h2 className="font-display font-bold text-base">
                  Enquiries &amp; Partner Leads ({(overview.enquiries || []).length})
                </h2>
                {(overview.enquiries || []).length === 0 ? (
                  <p className="text-xs text-[var(--muted)]">No enquiries yet.</p>
                ) : (
                  <div className="divide-y divide-[#D7E4FF] dark:divide-[#264096] text-xs">
                    {(overview.enquiries || []).map((enq) => (
                      <div key={String(enq.id)} className="py-3 space-y-1">
                        <div className="flex justify-between">
                          <span className="font-semibold">
                            {String(enq.name)} ({String(enq.phone)}) · {String(enq.type).toUpperCase()}
                          </span>
                          <span className="text-[var(--muted)]">{String(enq.city)}</span>
                        </div>
                        <p className="text-[var(--muted)]">{String(enq.message)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="warm-card p-5 space-y-3">
                <h2 className="font-display font-bold text-base">
                  Site &amp; Plant Visits ({(overview.siteVisits || []).length})
                </h2>
                {(overview.siteVisits || []).length === 0 ? (
                  <p className="text-xs text-[var(--muted)]">No scheduled site/plant visits yet.</p>
                ) : (
                  <div className="divide-y divide-[#D7E4FF] dark:divide-[#264096] text-xs">
                    {(overview.siteVisits || []).map((sv) => (
                      <div key={String(sv.id)} className="py-3 space-y-1">
                        <p className="font-semibold">
                          <span className="font-mono mr-2">{String(sv.visit_code)}</span>
                          {String(sv.customer_name)} ({String(sv.phone)})
                        </p>
                        <p className="text-[var(--muted)]">
                          {String(sv.visit_type)} · {String(sv.preferred_date)} at {String(sv.preferred_time)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="warm-card p-5 space-y-3">
              <h2 className="font-display font-bold text-base">
                Notification Outbox Log ({(overview.emailLogs || []).length})
              </h2>
              <div className="max-h-52 overflow-y-auto divide-y divide-[#D7E4FF] dark:divide-[#264096] text-xs">
                {(overview.emailLogs || []).map((log) => (
                  <div key={String(log.id)} className="py-2 flex justify-between gap-4">
                    <span className="truncate">
                      <strong>{String(log.subject)}</strong> &rarr; {String(log.recipient)}
                    </span>
                    <span className="font-mono text-[var(--muted)] shrink-0">{String(log.delivery_mode)}</span>
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

              {/* Testimonials */}
              <div className="warm-card p-5 space-y-3">
                <h3 className="font-display font-bold text-sm">
                  Client Testimonials ({siteData?.testimonials.length || 0})
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
                      setNewTestimonial({ authorName: '', roleOrCompany: '', location: 'Ranebennur', quote: '' });
                      await refreshBootstrap();
                      showToast('Testimonial added.');
                    }}
                    className="btn-blue-pill px-3 py-1.5 font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Testimonial</span>
                  </button>
                </div>
                <div className="divide-y divide-[#D7E4FF] dark:divide-[#264096] pt-2">
                  {(siteData?.testimonials || []).map((tm) => (
                    <div key={tm.id} className="py-2 flex items-center justify-between gap-2">
                      <span className="truncate">{tm.author_name} ({tm.location})</span>
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D7E4FF] dark:divide-[#264096]">
                  {overview.customers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-[var(--muted)]">
                        Customers will appear automatically after the first booking.
                      </td>
                    </tr>
                  ) : (
                    overview.customers.map((c) => (
                      <tr key={c.phone}>
                        <td className="px-4 py-3 font-semibold">{c.name}</td>
                        <td className="px-4 py-3 tabular-nums">{c.phone}</td>
                        <td className="px-4 py-3">{c.email || '—'}</td>
                        <td className="px-4 py-3">{c.city}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{c.totalOrders}</td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums">{c.totalM3}</td>
                      </tr>
                    ))
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
    </div>
  );
}
