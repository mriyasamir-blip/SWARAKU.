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
  UserPlus,
  Phone,
  Mail,
  MapPin,
  Home,
} from 'lucide-react';
import { PWAInstallButton } from '../pwa/PWAInstallButton';

export type LoginPortalTab = 'voters' | 'staff';
export type VoterAuthMode = 'login' | 'signup';

interface LoginScreenProps {
  referralCode: string;
  onReferralChange: (val: string) => void;
  onGoogleLogin: () => Promise<void>;
  onManualVoterSignUp: (data: {
    fullName: string;
    phone: string;
    email: string;
    address: string;
    region: string;
    referralInput: string;
  }) => Promise<void>;
  onManualVoterLogin: (email: string, phone: string) => Promise<void>;
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
  onManualVoterSignUp,
  onManualVoterLogin,
  onStaffLogin,
  isSigningIn,
  authError,
}) => {
  const [portalTab, setPortalTab] = useState<LoginPortalTab>('voters');
  const [voterMode, setVoterMode] = useState<VoterAuthMode>('login');

  // Voter Manual Login (Email + Phone) State
  const [voterLoginEmail, setVoterLoginEmail] = useState('');
  const [voterLoginPhone, setVoterLoginPhone] = useState('');
  const [voterLocalError, setVoterLocalError] = useState<string | null>(null);

  // Voter Sign-Up 5-Field Form State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [region, setRegion] = useState('');

  // Staff Login State
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localBusy, setLocalBusy] = useState(false);
  const [staffError, setStaffError] = useState<string | null>(null);

  const handleGoogleSubmit = async () => {
    setVoterLocalError(null);
    setLocalBusy(true);
    try {
      await onGoogleLogin();
    } finally {
      setLocalBusy(false);
    }
  };

  const handleVoterLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setVoterLocalError(null);
    if (!voterLoginEmail.trim() || !voterLoginPhone.trim()) {
      setVoterLocalError('Mohon isi Email dan Nomor Telepon terdaftar Anda.');
      return;
    }

    setLocalBusy(true);
    try {
      await onManualVoterLogin(voterLoginEmail.trim(), voterLoginPhone.trim());
    } catch (err) {
      setVoterLocalError(
        err instanceof Error ? err.message : 'Gagal masuk sebagai pemilih.'
      );
    } finally {
      setLocalBusy(false);
    }
  };

  const handleVoterSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setVoterLocalError(null);

    if (fullName.trim().length < 2) {
      setVoterLocalError('Nama lengkap wajib diisi (minimal 2 karakter).');
      return;
    }
    if (phone.trim().length < 6) {
      setVoterLocalError('Nomor telepon aktif wajib diisi.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setVoterLocalError('Alamat email tidak valid.');
      return;
    }
    if (address.trim().length < 5) {
      setVoterLocalError('Alamat lengkap wajib diisi dengan jelas.');
      return;
    }
    if (region.trim().length < 2) {
      setVoterLocalError('Dapil atau kelurahan wajib diisi.');
      return;
    }

    setLocalBusy(true);
    try {
      await onManualVoterSignUp({
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        region: region.trim(),
        referralInput: referralCode.trim(),
      });
    } catch (err) {
      setVoterLocalError(
        err instanceof Error ? err.message : 'Gagal mendaftar. Silakan periksa kembali data Anda.'
      );
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
  const displayVoterError = voterLocalError || authError;

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
              setVoterLocalError(null);
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
              setVoterLocalError(null);
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

        {/* PORTAL 1: PEMILIH / VOTERS (GOOGLE SSO + SIGN UP FORM) */}
        {portalTab === 'voters' && (
          <div className="space-y-5">
            {/* Sub-tab: Masuk vs Daftar / Sign Up */}
            <div className="grid grid-cols-2 gap-2 border-b border-slate-200 pb-3">
              <button
                type="button"
                onClick={() => {
                  setVoterMode('login');
                  setVoterLocalError(null);
                }}
                className={`min-h-[42px] px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  voterMode === 'login'
                    ? 'bg-blue-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <LogIn className="w-4 h-4 shrink-0" />
                <span>Masuk Akun</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setVoterMode('signup');
                  setVoterLocalError(null);
                }}
                className={`min-h-[42px] px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  voterMode === 'signup'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <UserPlus className="w-4 h-4 shrink-0" />
                <span>Daftar / Sign Up</span>
              </button>
            </div>

            {displayVoterError && (
              <div className="rounded-2xl bg-rose-50 border border-rose-200 p-3.5 flex items-start gap-2.5 text-rose-800 text-xs leading-relaxed">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{displayVoterError}</span>
              </div>
            )}

            {/* VOTER MODE A: MASUK (GOOGLE SSO ATAU EMAIL + NO TELEPON) */}
            {voterMode === 'login' && (
              <div className="space-y-5">
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
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSubmit}
                  disabled={busy}
                  className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4 bg-white rounded-full p-0.5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.8C6.2 7.2 8.9 5 12 5z" />
                    <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.7-2.4 3.6l3.7 2.9c2.2-2 3.7-5 3.7-8.7z" />
                    <path fill="#FBBC05" d="M5.3 14.8c-.2-.8-.4-1.6-.4-2.5s.1-1.7.4-2.5L1.6 7C.6 9 0 10.9 0 13s.6 4 1.6 5.9l3.7-2.9v-1.2z" />
                    <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.1-6.7-5l-3.7 2.9C3.5 21.4 7.4 24 12 24z" />
                  </svg>
                  <span>{busy ? 'Menghubungkan...' : 'Masuk dengan Akun Google'}</span>
                </button>

                <div className="relative flex items-center py-1">
                  <div className="grow border-t border-slate-200" />
                  <span className="shrink mx-3 text-[11px] font-semibold text-slate-500">
                    atau masuk dengan akun terdaftar
                  </span>
                  <div className="grow border-t border-slate-200" />
                </div>

                <form onSubmit={handleVoterLoginSubmit} className="space-y-3">
                  <div className="space-y-1">
                    <label htmlFor="voter-login-email" className="block text-xs font-semibold text-slate-700">
                      Email Terdaftar
                    </label>
                    <input
                      id="voter-login-email"
                      type="email"
                      autoComplete="email"
                      value={voterLoginEmail}
                      onChange={(e) => setVoterLoginEmail(e.target.value)}
                      placeholder="contoh@email.com"
                      className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 bg-slate-50/70 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="voter-login-phone" className="block text-xs font-semibold text-slate-700">
                      Nomor Telepon (WhatsApp)
                    </label>
                    <input
                      id="voter-login-phone"
                      type="tel"
                      autoComplete="tel"
                      value={voterLoginPhone}
                      onChange={(e) => setVoterLoginPhone(e.target.value)}
                      placeholder="Contoh: 081234567890"
                      className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 bg-slate-50/70 text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-bold text-sm transition-colors cursor-pointer"
                  >
                    {busy ? 'Memeriksa Akun...' : 'Masuk dengan Email & No. Telepon'}
                  </button>
                </form>

                <p className="text-center text-xs text-slate-600">
                  Belum punya akun?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setVoterMode('signup');
                      setVoterLocalError(null);
                    }}
                    className="font-bold text-emerald-700 hover:underline cursor-pointer"
                  >
                    Daftar / Sign Up di sini
                  </button>
                </p>
              </div>
            )}

            {/* VOTER MODE B: FORM DAFTAR / SIGN UP PEMILIH BARU */}
            {voterMode === 'signup' && (
              <form onSubmit={handleVoterSignUpSubmit} className="space-y-3.5">
                <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-900 leading-relaxed">
                  Lengkapi formulir pendaftaran di bawah untuk mengaktifkan akun Pemilih dan mendapatkan <strong>+100 Poin Awal</strong>.
                </div>

                <div className="space-y-1">
                  <label htmlFor="signup-fullname" className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <UserIcon className="w-3.5 h-3.5 text-blue-700" />
                    <span>Nama Lengkap <span className="text-rose-600">*</span></span>
                  </label>
                  <input
                    id="signup-fullname"
                    type="text"
                    required
                    maxLength={120}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Masukkan nama lengkap Anda"
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="signup-phone" className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <Phone className="w-3.5 h-3.5 text-blue-700" />
                    <span>Nomor Telepon <span className="text-rose-600">*</span></span>
                  </label>
                  <input
                    id="signup-phone"
                    type="tel"
                    required
                    maxLength={30}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="signup-email" className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <Mail className="w-3.5 h-3.5 text-blue-700" />
                    <span>Email <span className="text-rose-600">*</span></span>
                  </label>
                  <input
                    id="signup-email"
                    type="email"
                    required
                    maxLength={150}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contoh@email.com"
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="signup-address" className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <Home className="w-3.5 h-3.5 text-blue-700" />
                    <span>Alamat <span className="text-rose-600">*</span></span>
                  </label>
                  <textarea
                    id="signup-address"
                    required
                    rows={2}
                    maxLength={300}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Nama jalan, nomor rumah, RT/RW"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="signup-region" className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <MapPin className="w-3.5 h-3.5 text-blue-700" />
                    <span>Dapil atau Kelurahan <span className="text-rose-600">*</span></span>
                  </label>
                  <input
                    id="signup-region"
                    type="text"
                    required
                    maxLength={120}
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    placeholder="Contoh: Dapil 1 / Kel. Cilandak Barat"
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="signup-referral" className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <Ticket className="w-3.5 h-3.5 text-slate-500" />
                    <span>Kode Undangan / Referral (Opsional)</span>
                  </label>
                  <input
                    id="signup-referral"
                    type="text"
                    maxLength={32}
                    value={referralCode}
                    onChange={(e) => onReferralChange(e.target.value.toUpperCase())}
                    placeholder="Kosongkan jika tidak ada"
                    className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-300 bg-slate-50 text-sm font-mono uppercase text-slate-900 placeholder:normal-case placeholder:font-sans focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-400 text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <UserPlus className="w-4 h-4 shrink-0" />
                  <span>{busy ? 'Mendaftarkan Akun...' : 'Daftar & Masuk Dashboard'}</span>
                </button>

                <div className="pt-1 text-center">
                  <button
                    type="button"
                    onClick={handleGoogleSubmit}
                    disabled={busy}
                    className="text-xs font-bold text-blue-700 hover:underline cursor-pointer"
                  >
                    Atau langsung daftar menggunakan Akun Google
                  </button>
                </div>
              </form>
            )}
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
