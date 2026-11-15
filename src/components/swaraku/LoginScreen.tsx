import React, { useState } from 'react';
import {
  LogIn,
  Ticket,
  ShieldCheck,
  Smartphone,
  AlertCircle,
  Users,
  Shield,
  Eye,
  EyeOff,
  Lock,
  User as UserIcon,
} from 'lucide-react';
import { PWAInstallButton } from '../pwa/PWAInstallButton';

export type LoginPortalTab = 'voters' | 'staff';

interface LoginScreenProps {
  referralCode: string;
  onReferralChange: (val: string) => void;
  onGoogleLogin: () => Promise<void>;
  onStaffLogin: (
    usernameOrEmail: string,
    password: string
  ) => Promise<{ success: boolean; message?: string }>;
  isSigningIn: boolean;
  authError: string | null;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  referralCode,
  onReferralChange,
  onGoogleLogin,
  onStaffLogin,
  isSigningIn,
  authError,
}) => {
  const [portalTab, setPortalTab] = useState<LoginPortalTab>('voters');
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localBusy, setLocalBusy] = useState(false);
  const [staffError, setStaffError] = useState<string | null>(null);

  const handleGoogleSubmit = async () => {
    setLocalBusy(true);
    try {
      await onGoogleLogin();
    } finally {
      setLocalBusy(false);
    }
  };

  const handleStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStaffError(null);
    if (!usernameOrEmail.trim() || !password.trim()) {
      setStaffError('Mohon isi Username/Email dan Kata Sandi terlebih dahulu.');
      return;
    }

    setLocalBusy(true);
    try {
      const res = await onStaffLogin(usernameOrEmail.trim(), password.trim());
      if (!res.success) {
        setStaffError(res.message || 'Gagal masuk. Periksa kembali kredensial Anda.');
      }
    } catch (err) {
      setStaffError(
        err instanceof Error ? err.message : 'Terjadi kendala koneksi ke Cloud Server.'
      );
    } finally {
      setLocalBusy(false);
    }
  };

  const busy = isSigningIn || localBusy;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 py-8">
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
              Pilih jenis akun Anda di bawah untuk masuk ke platform
            </p>
          </div>
        </div>

        {/* Portal Switcher: Pemilih (Voters) vs Tim & Admin */}
        <div
          role="tablist"
          aria-label="Pilih Portal Login"
          className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-slate-100 border border-slate-200"
        >
          <button
            type="button"
            role="tab"
            aria-selected={portalTab === 'voters'}
            onClick={() => {
              setPortalTab('voters');
              setStaffError(null);
            }}
            className={`min-h-[44px] px-3 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              portalTab === 'voters'
                ? 'bg-white text-blue-800 shadow-xs border border-blue-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            <span>Pemilih (Voters)</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={portalTab === 'staff'}
            onClick={() => {
              setPortalTab('staff');
              setStaffError(null);
            }}
            className={`min-h-[44px] px-3 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              portalTab === 'staff'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-300'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Shield className="w-4 h-4 shrink-0" />
            <span>Tim &amp; Admin</span>
          </button>
        </div>

        {/* PORTAL 1: PEMILIH / VOTERS (GOOGLE SSO) */}
        {portalTab === 'voters' && (
          <div className="space-y-5">
            {authError && (
              <div className="rounded-2xl bg-rose-50 border border-rose-200 p-3.5 flex items-start gap-2.5 text-rose-800 text-xs leading-relaxed">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label
                htmlFor="login-referral"
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-700"
              >
                <Ticket className="w-4 h-4 text-blue-700" />
                <span>Kode Undangan / Referral (Opsional)</span>
              </label>
              <input
                id="login-referral"
                type="text"
                value={referralCode}
                onChange={(e) => onReferralChange(e.target.value.toUpperCase())}
                placeholder="Contoh: SWR-A1B2C3"
                maxLength={32}
                className="w-full min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50/70 text-sm font-mono uppercase tracking-wider text-slate-900 placeholder:text-slate-400 placeholder:normal-case placeholder:font-sans focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:bg-white transition-colors"
              />
              <p className="text-xs text-slate-500">
                Kosongkan jika Anda belum memiliki kode undangan dari teman.
              </p>
            </div>

            <button
              type="button"
              onClick={handleGoogleSubmit}
              disabled={busy}
              className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
            >
              <LogIn className="w-4 h-4 shrink-0" />
              <span>{busy ? 'Menghubungkan ke Google...' : 'Masuk dengan Akun Google'}</span>
            </button>
          </div>
        )}

        {/* PORTAL 2: TIM & ADMIN (KADER, TIM SUKSES, ADMIN, SUPER ADMIN) */}
        {portalTab === 'staff' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              Masuk menggunakan akun <span className="font-semibold text-slate-800">Kader</span>, <span className="font-semibold text-slate-800">Tim Sukses</span>, <span className="font-semibold text-slate-800">Admin</span>, atau <span className="font-semibold text-slate-800">Super Admin</span> yang terdaftar.
            </p>

            {staffError && (
              <div className="rounded-2xl bg-rose-50 border border-rose-200 p-3.5 flex items-start gap-2.5 text-rose-800 text-xs leading-relaxed">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{staffError}</span>
              </div>
            )}

            <form onSubmit={handleStaffSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="staff-username"
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-700"
                >
                  <UserIcon className="w-4 h-4 text-slate-500" />
                  <span>Username atau Email</span>
                </label>
                <input
                  id="staff-username"
                  type="text"
                  autoComplete="username"
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  placeholder="Masukkan username atau email Anda"
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
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan kata sandi"
                    className="w-full min-h-[44px] pl-4 pr-11 py-2.5 rounded-xl border border-slate-300 bg-slate-50/70 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:bg-white transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}
                    className="absolute right-2 top-1/2 -translate-y-1/2 min-w-[36px] min-h-[36px] flex items-center justify-center text-slate-500 hover:text-slate-800 rounded-lg cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                  {busy ? 'Memverifikasi di Cloud...' : 'Masuk ke Portal Tim & Admin'}
                </span>
              </button>
            </form>
          </div>
        )}

        {/* Trust & PWA Install */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <div className="flex items-start gap-2.5 text-xs text-slate-600">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              Semua akun tersinkronisasi melalui Cloud Database untuk akses lintas perangkat (HP, Tablet &amp; Desktop).
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


