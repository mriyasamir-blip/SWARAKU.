import React, { useEffect, useState } from 'react';
import {
  LogIn,
  ShieldCheck,
  Smartphone,
  AlertCircle,
  Users,
  Shield,
  Eye,
  EyeOff,
  Lock,
  User as UserIcon,
  ArrowLeft,
} from 'lucide-react';
import { PWAInstallButton } from '../pwa/PWAInstallButton';

export type LoginPortalTab = 'staff' | 'relawan';

interface LoginScreenProps {
  onTimSupportLogin: (
    usernameOrEmail: string,
    password: string
  ) => Promise<{ success: boolean; message?: string }>;
  onTimSupportGoogleLogin: () => Promise<{ success: boolean; message?: string }>;
  onRelawanLogin: (
    usernameOrEmail: string,
    password: string
  ) => Promise<{ success: boolean; message?: string }>;
  isSigningIn: boolean;
  authError: string | null;
  initialPortalTab?: LoginPortalTab;
  onSwitchToWebsite?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onTimSupportLogin,
  onTimSupportGoogleLogin,
  onRelawanLogin,
  isSigningIn,
  authError,
  initialPortalTab = 'staff',
  onSwitchToWebsite,
}) => {
  const [portalTab, setPortalTab] = useState<LoginPortalTab>(initialPortalTab);

  useEffect(() => {
    setPortalTab(initialPortalTab);
  }, [initialPortalTab]);

  // Tim Support Form State
  const [staffIdentifier, setStaffIdentifier] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [showStaffPassword, setShowStaffPassword] = useState(false);

  // Relawan Form State
  const [relawanIdentifier, setRelawanIdentifier] = useState('');
  const [relawanPassword, setRelawanPassword] = useState('');
  const [showRelawanPassword, setShowRelawanPassword] = useState(false);

  const [localBusy, setLocalBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleTimSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!staffIdentifier.trim() || !staffPassword.trim()) {
      setLocalError('Mohon isi Email/Username dan Kata Sandi terlebih dahulu.');
      return;
    }
    setLocalBusy(true);
    try {
      const res = await onTimSupportLogin(staffIdentifier.trim(), staffPassword.trim());
      if (!res.success) {
        setLocalError(
          res.message ||
            'Akun Anda belum terdaftar. Silakan hubungi Admin atau Koordinator terkait.'
        );
      }
    } catch (err) {
      setLocalError(
        err instanceof Error ? err.message : 'Terjadi kendala koneksi ke Cloud Server.'
      );
    } finally {
      setLocalBusy(false);
    }
  };

  const handleTimSupportGoogle = async () => {
    setLocalError(null);
    setLocalBusy(true);
    try {
      const res = await onTimSupportGoogleLogin();
      if (!res.success) {
        setLocalError(
          res.message ||
            'Akun Anda belum terdaftar. Silakan hubungi Admin atau Koordinator terkait.'
        );
      }
    } catch (err) {
      setLocalError(
        err instanceof Error ? err.message : 'Login Google dibatalkan atau gagal.'
      );
    } finally {
      setLocalBusy(false);
    }
  };

  const handleRelawanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!relawanIdentifier.trim() || !relawanPassword.trim()) {
      setLocalError('Mohon isi Email/Username dan Kata Sandi akun Relawan Anda.');
      return;
    }
    setLocalBusy(true);
    try {
      const res = await onRelawanLogin(relawanIdentifier.trim(), relawanPassword.trim());
      if (!res.success) {
        setLocalError(
          res.message ||
            'Akun Anda belum terdaftar. Silakan hubungi Admin atau Koordinator terkait.'
        );
      }
    } catch (err) {
      setLocalError(
        err instanceof Error ? err.message : 'Terjadi kendala koneksi ke Cloud Server.'
      );
    } finally {
      setLocalBusy(false);
    }
  };

  const busy = isSigningIn || localBusy;
  const activeError = localError || authError;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 py-8">
      {onSwitchToWebsite && (
        <div className="w-full max-w-md mb-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onSwitchToWebsite}
            className="min-h-[38px] px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
            <span>Kembali ke Mode Website</span>
          </button>
          <span className="text-xs font-semibold text-slate-500">Mode Apps</span>
        </div>
      )}

      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/90 shadow-lg p-6 sm:p-8 space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2.5">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 p-2.5 flex items-center justify-center">
            <img
              src="/icon.svg"
              alt="Logo Swaraku"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              Swaraku
            </h1>
            <p className="text-sm text-slate-600 mt-1 leading-relaxed">
              Pilih akses login Anda di bawah untuk masuk ke platform
            </p>
          </div>
        </div>

        {/* Two Portal Switcher: Tim Support vs Relawan */}
        <div
          role="tablist"
          aria-label="Pilih Portal Login"
          className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-slate-100 border border-slate-200"
        >
          <button
            type="button"
            role="tab"
            aria-selected={portalTab === 'staff'}
            onClick={() => {
              setPortalTab('staff');
              setLocalError(null);
            }}
            className={`min-h-[44px] px-3 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              portalTab === 'staff'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-300'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Shield className="w-4 h-4 shrink-0" />
            <span>Tim Support</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={portalTab === 'relawan'}
            onClick={() => {
              setPortalTab('relawan');
              setLocalError(null);
            }}
            className={`min-h-[44px] px-3 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              portalTab === 'relawan'
                ? 'bg-white text-blue-800 shadow-xs border border-blue-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            <span>Relawan</span>
          </button>
        </div>

        {activeError && (
          <div className="rounded-2xl bg-rose-50 border border-rose-200 p-3.5 flex items-start gap-2.5 text-rose-800 text-xs leading-relaxed">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{activeError}</span>
          </div>
        )}

        {/* TAB 1: TIM SUPPORT (Korwil, Korcam, Admin, SuperAdmin — Manual + Google SSO Whitelist) */}
        {portalTab === 'staff' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              Khusus akun terdaftar <span className="font-semibold text-slate-800">Korwil</span>,{' '}
              <span className="font-semibold text-slate-800">Korcam</span>,{' '}
              <span className="font-semibold text-slate-800">Admin</span>, dan{' '}
              <span className="font-semibold text-slate-800">SuperAdmin</span>.
            </p>

            {/* Google SSO Button khusus Tim Support */}
            <button
              type="button"
              onClick={handleTimSupportGoogle}
              disabled={busy}
              className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4 bg-white rounded-full p-0.5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.8C6.2 7.2 8.9 5 12 5z" />
                <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.7-2.4 3.6l3.7 2.9c2.2-2 3.7-5 3.7-8.7z" />
                <path fill="#FBBC05" d="M5.3 14.8c-.2-.8-.4-1.6-.4-2.5s.1-1.7.4-2.5L1.6 7C.6 9 0 10.9 0 13s.6 4 1.6 5.9l3.7-2.9v-1.2z" />
                <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.1-6.7-5l-3.7 2.9C3.5 21.4 7.4 24 12 24z" />
              </svg>
              <span>{busy ? 'Memverifikasi Akun...' : 'Masuk dengan SSO / Akun Google'}</span>
            </button>

            <div className="relative flex items-center py-0.5">
              <div className="grow border-t border-slate-200" />
              <span className="shrink mx-3 text-[11px] font-semibold text-slate-500">
                atau login manual terdaftar
              </span>
              <div className="grow border-t border-slate-200" />
            </div>

            <form onSubmit={handleTimSupportSubmit} className="space-y-3.5">
              <div className="space-y-1.5">
                <label
                  htmlFor="staff-username"
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-700"
                >
                  <UserIcon className="w-4 h-4 text-slate-500" />
                  <span>Email atau Username</span>
                </label>
                <input
                  id="staff-username"
                  type="text"
                  autoComplete="username"
                  value={staffIdentifier}
                  onChange={(e) => setStaffIdentifier(e.target.value)}
                  placeholder="Masukkan email atau username terdaftar"
                  className="w-full min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50/70 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:bg-white transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="staff-password"
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-700"
                >
                  <Lock className="w-4 h-4 text-slate-500" />
                  <span>Kata Sandi / PIN</span>
                </label>
                <div className="relative">
                  <input
                    id="staff-password"
                    type={showStaffPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={staffPassword}
                    onChange={(e) => setStaffPassword(e.target.value)}
                    placeholder="Masukkan kata sandi"
                    className="w-full min-h-[44px] pl-4 pr-11 py-2.5 rounded-xl border border-slate-300 bg-slate-50/70 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:bg-white transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowStaffPassword((prev) => !prev)}
                    aria-label={showStaffPassword ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}
                    className="absolute right-2 top-1/2 -translate-y-1/2 min-w-[36px] min-h-[36px] flex items-center justify-center text-slate-500 hover:text-slate-800 rounded-lg cursor-pointer"
                  >
                    {showStaffPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={busy}
                className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
              >
                <LogIn className="w-4 h-4 shrink-0" />
                <span>
                  {busy ? 'Memverifikasi di Cloud...' : 'Masuk ke Portal Tim Support'}
                </span>
              </button>
            </form>
          </div>
        )}

        {/* TAB 2: RELAWAN (Whitelist Validation) */}
        {portalTab === 'relawan' && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-blue-50 border border-blue-200 p-3 text-xs text-blue-900 leading-relaxed">
              Masuk menggunakan akun <span className="font-bold">Relawan</span> yang telah didaftarkan oleh Korcam, Korwil, atau Admin.
            </div>

            <form onSubmit={handleRelawanSubmit} className="space-y-3.5">
              <div className="space-y-1.5">
                <label
                  htmlFor="relawan-username"
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-700"
                >
                  <UserIcon className="w-4 h-4 text-blue-700" />
                  <span>Email atau Username Relawan</span>
                </label>
                <input
                  id="relawan-username"
                  type="text"
                  autoComplete="username"
                  value={relawanIdentifier}
                  onChange={(e) => setRelawanIdentifier(e.target.value)}
                  placeholder="Masukkan email atau username Relawan"
                  className="w-full min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50/70 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:bg-white transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="relawan-password"
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-700"
                >
                  <Lock className="w-4 h-4 text-blue-700" />
                  <span>Kata Sandi / PIN</span>
                </label>
                <div className="relative">
                  <input
                    id="relawan-password"
                    type={showRelawanPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={relawanPassword}
                    onChange={(e) => setRelawanPassword(e.target.value)}
                    placeholder="Masukkan kata sandi"
                    className="w-full min-h-[44px] pl-4 pr-11 py-2.5 rounded-xl border border-slate-300 bg-slate-50/70 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:bg-white transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRelawanPassword((prev) => !prev)}
                    aria-label={showRelawanPassword ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}
                    className="absolute right-2 top-1/2 -translate-y-1/2 min-w-[36px] min-h-[36px] flex items-center justify-center text-slate-500 hover:text-slate-800 rounded-lg cursor-pointer"
                  >
                    {showRelawanPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={busy}
                className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
              >
                <LogIn className="w-4 h-4 shrink-0" />
                <span>{busy ? 'Memverifikasi Akun...' : 'Masuk sebagai Relawan'}</span>
              </button>
            </form>
          </div>
        )}

        {/* Trust & PWA Install */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <div className="flex items-start gap-2.5 text-xs text-slate-600">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              Akses diverifikasi melalui Whitelist Cloud Database. Hanya akun terdaftar yang dapat masuk.
            </span>
          </div>

          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <Smartphone className="w-5 h-5 text-blue-700 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">
                  Pasang Aplikasi Swaraku
                </p>
                <p className="text-[11px] text-slate-500 truncate">
                  Tersedia untuk Android, iPhone &amp; Desktop
                </p>
              </div>
            </div>
            <PWAInstallButton variant="outline" label="Install App" />
          </div>
        </div>
      </div>

      <p className="mt-6 text-xs text-slate-500 text-center">
        swaraku.online &middot; Akses Cepat &amp; Aman
      </p>
    </div>
  );
};
