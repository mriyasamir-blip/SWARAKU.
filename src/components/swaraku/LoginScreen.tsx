import React, { useEffect, useState } from 'react';
import {
  LogIn,
  ShieldCheck,
  AlertCircle,
  Users,
  Shield,
  Eye,
  EyeOff,
  Lock,
  User as UserIcon,
  UserPlus,
  Mail,
  Phone,
  CreditCard,
  MapPin,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-react';
import { WilayahSelector, type WilayahValue } from '../common/WilayahSelector';
import type { SignUpAccountPayload } from '../../services/userApiService';

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
  onRelawanGoogleLogin: () => Promise<{ success: boolean; message?: string }>;
  onSignUpAccount?: (
    payload: SignUpAccountPayload
  ) => Promise<{ success: boolean; duplicateFields?: string[]; message: string }>;
  isSigningIn: boolean;
  authError: string | null;
  initialPortalTab?: LoginPortalTab;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onTimSupportLogin,
  onTimSupportGoogleLogin,
  onRelawanLogin,
  onRelawanGoogleLogin,
  onSignUpAccount,
  isSigningIn,
  authError,
  initialPortalTab = 'staff',
}) => {
  const [portalTab, setPortalTab] = useState<LoginPortalTab>(initialPortalTab);
  const [authView, setAuthView] = useState<'login' | 'signup'>('login');

  useEffect(() => {
    setPortalTab(initialPortalTab);
  }, [initialPortalTab]);

  // Tim Support Login State
  const [staffIdentifier, setStaffIdentifier] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [showStaffPassword, setShowStaffPassword] = useState(false);

  // Relawan Login State
  const [relawanIdentifier, setRelawanIdentifier] = useState('');
  const [relawanPassword, setRelawanPassword] = useState('');
  const [showRelawanPassword, setShowRelawanPassword] = useState(false);

  // Sign Up Manual Form State
  const [signupRole, setSignupRole] = useState<'relawan' | 'kader'>('relawan');
  const [signupNama, setSignupNama] = useState('');
  const [signupUsername, setSignupUsername] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupNoHp, setSignupNoHp] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [signupNik, setSignupNik] = useState('');
  const [signupWilayah, setSignupWilayah] = useState<WilayahValue>({
    kota: '',
    kecamatan: '',
    kelurahan: '',
  });
  const [signupSuccessMessage, setSignupSuccessMessage] = useState<string | null>(null);

  const [localBusy, setLocalBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const openSignUpMode = (defaultRole: 'relawan' | 'kader') => {
    setSignupRole(defaultRole);
    setLocalError(null);
    setSignupSuccessMessage(null);
    setAuthView('signup');
  };

  const resetSignUpForm = () => {
    setSignupNama('');
    setSignupUsername('');
    setSignupEmail('');
    setSignupNoHp('');
    setSignupPassword('');
    setSignupNik('');
    setSignupWilayah({ kota: '', kecamatan: '', kelurahan: '' });
  };

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

  const handleRelawanGoogle = async () => {
    setLocalError(null);
    setLocalBusy(true);
    try {
      const res = await onRelawanGoogleLogin();
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

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setSignupSuccessMessage(null);

    const cleanNik = signupNik.replace(/\D/g, '');
    if (!signupNama.trim() || signupNama.trim().length < 3) {
      setLocalError('Nama Lengkap wajib diisi (minimal 3 karakter).');
      return;
    }
    if (!signupUsername.trim() || /\s/.test(signupUsername.trim())) {
      setLocalError('Username Login wajib diisi tanpa spasi.');
      return;
    }
    if (!signupEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signupEmail.trim())) {
      setLocalError('Alamat Email wajib diisi dengan format yang valid.');
      return;
    }
    if (!signupNoHp.trim() || signupNoHp.replace(/\D/g, '').length < 10) {
      setLocalError('Nomor WhatsApp / HP wajib diisi minimal 10 digit.');
      return;
    }
    if (!signupPassword.trim() || signupPassword.trim().length < 6) {
      setLocalError('Password wajib diisi minimal 6 karakter.');
      return;
    }
    if (cleanNik.length !== 16) {
      setLocalError('NIK wajib diisi tepat 16 digit angka.');
      return;
    }
    if (!signupWilayah.kota || !signupWilayah.kecamatan || !signupWilayah.kelurahan) {
      setLocalError(
        'Wilayah Penugasan wajib dipilih lengkap (Kota / Kabupaten, Kecamatan, dan Kelurahan).'
      );
      return;
    }

    if (!onSignUpAccount) {
      setLocalError('Layanan pendaftaran akun belum tersedia.');
      return;
    }

    setLocalBusy(true);
    try {
      const res = await onSignUpAccount({
        role: signupRole,
        nama: signupNama.trim(),
        username: signupUsername.trim(),
        email: signupEmail.trim(),
        noHp: signupNoHp.trim(),
        password: signupPassword.trim(),
        nik: cleanNik,
        kota: signupWilayah.kota,
        kecamatan: signupWilayah.kecamatan,
        kelurahan: signupWilayah.kelurahan,
      });

      if (!res.success) {
        setLocalError(res.message);
      } else {
        setSignupSuccessMessage(res.message);
        resetSignUpForm();
      }
    } catch (err) {
      setLocalError(
        err instanceof Error ? err.message : 'Gagal mengirim pendaftaran akun ke Cloud Database.'
      );
    } finally {
      setLocalBusy(false);
    }
  };

  const busy = isSigningIn || localBusy;
  const activeError = localError || authError;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 py-8">
      <div
        className={`w-full ${
          authView === 'signup' ? 'max-w-lg' : 'max-w-md'
        } bg-white rounded-3xl border border-slate-200/90 shadow-lg p-6 sm:p-8 space-y-6 transition-all`}
      >
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
              {authView === 'signup'
                ? 'Pendaftaran Akun Manual Relawan & Korcam'
                : 'Pilih akses login Anda di bawah untuk masuk ke platform'}
            </p>
          </div>
        </div>

        {/* ===================== MODE SIGN UP (PENDAFTARAN MANUAL) ===================== */}
        {authView === 'signup' ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  setAuthView('login');
                  setLocalError(null);
                  setSignupSuccessMessage(null);
                }}
                className="min-h-[36px] px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Kembali ke Login</span>
              </button>
              <span className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                Status Awal: Pending Aktivasi
              </span>
            </div>

            {activeError && (
              <div className="rounded-2xl bg-rose-50 border border-rose-200 p-3.5 flex items-start gap-2.5 text-rose-800 text-xs leading-relaxed font-medium">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{activeError}</span>
              </div>
            )}

            {signupSuccessMessage ? (
              <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-5 space-y-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="space-y-1.5">
                  <h2 className="text-base font-extrabold text-emerald-950">
                    Pendaftaran Berhasil Dikirim
                  </h2>
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    {signupSuccessMessage}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAuthView('login');
                    setPortalTab(signupRole === 'relawan' ? 'relawan' : 'staff');
                    setSignupSuccessMessage(null);
                    setLocalError(null);
                  }}
                  className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-bold transition-colors cursor-pointer"
                >
                  Kembali ke Halaman Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleSignUpSubmit} className="space-y-4">
                {/* Role Switcher: Relawan vs Korcam */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Daftar Sebagai <span className="text-rose-600">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 border border-slate-200">
                    <button
                      type="button"
                      onClick={() => {
                        setSignupRole('relawan');
                        setLocalError(null);
                      }}
                      className={`min-h-[40px] px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        signupRole === 'relawan'
                          ? 'bg-white text-blue-800 shadow-xs border border-blue-200'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Relawan</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSignupRole('kader');
                        setLocalError(null);
                      }}
                      className={`min-h-[40px] px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        signupRole === 'kader'
                          ? 'bg-white text-slate-900 shadow-xs border border-slate-300'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Shield className="w-3.5 h-3.5" />
                      <span>Korcam</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {signupRole === 'relawan'
                      ? 'Akun Relawan akan diaktivasi oleh Korcam di kecamatan penugasan Anda.'
                      : 'Akun Korcam akan diaktivasi oleh Korwil di kota/wilayah penugasan Anda.'}
                  </p>
                </div>

                {/* 1. Nama Lengkap */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="signup-nama"
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-700"
                  >
                    <UserIcon className="w-3.5 h-3.5 text-blue-700" />
                    <span>
                      Nama Lengkap <span className="text-rose-600">*</span>
                    </span>
                  </label>
                  <input
                    id="signup-nama"
                    type="text"
                    required
                    maxLength={120}
                    value={signupNama}
                    onChange={(e) => setSignupNama(e.target.value)}
                    placeholder="Sesuai KTP (contoh: Ahmad Fauzi)"
                    className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-300 bg-slate-50/70 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:bg-white transition-colors"
                  />
                </div>

                {/* 2. Username Login & 3. Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="signup-username"
                      className="flex items-center gap-1.5 text-xs font-bold text-slate-700"
                    >
                      <UserPlus className="w-3.5 h-3.5 text-blue-700" />
                      <span>
                        Username Login <span className="text-rose-600">*</span>
                      </span>
                    </label>
                    <input
                      id="signup-username"
                      type="text"
                      required
                      maxLength={80}
                      autoComplete="username"
                      value={signupUsername}
                      onChange={(e) => setSignupUsername(e.target.value.replace(/\s+/g, ''))}
                      placeholder="contoh: ahmad.relawan"
                      className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-300 bg-slate-50/70 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:bg-white transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="signup-email"
                      className="flex items-center gap-1.5 text-xs font-bold text-slate-700"
                    >
                      <Mail className="w-3.5 h-3.5 text-blue-700" />
                      <span>
                        Email <span className="text-rose-600">*</span>
                      </span>
                    </label>
                    <input
                      id="signup-email"
                      type="email"
                      required
                      maxLength={150}
                      autoComplete="email"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      placeholder="nama@email.com"
                      className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-300 bg-slate-50/70 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:bg-white transition-colors"
                    />
                  </div>
                </div>

                {/* 4. Nomor WhatsApp / HP & 6. NIK (16 digit) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="signup-nohp"
                      className="flex items-center gap-1.5 text-xs font-bold text-slate-700"
                    >
                      <Phone className="w-3.5 h-3.5 text-blue-700" />
                      <span>
                        Nomor WhatsApp / HP <span className="text-rose-600">*</span>
                      </span>
                    </label>
                    <input
                      id="signup-nohp"
                      type="tel"
                      required
                      maxLength={20}
                      value={signupNoHp}
                      onChange={(e) => setSignupNoHp(e.target.value)}
                      placeholder="0812xxxxxxxx"
                      className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-300 bg-slate-50/70 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:bg-white transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="signup-nik"
                      className="flex items-center justify-between text-xs font-bold text-slate-700"
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-blue-700" />
                        <span>
                          NIK (16 Digit) <span className="text-rose-600">*</span>
                        </span>
                      </span>
                      <span
                        className={`text-[10px] font-bold ${
                          signupNik.length === 16 ? 'text-emerald-600' : 'text-slate-400'
                        }`}
                      >
                        {signupNik.length}/16
                      </span>
                    </label>
                    <input
                      id="signup-nik"
                      type="text"
                      inputMode="numeric"
                      required
                      maxLength={16}
                      value={signupNik}
                      onChange={(e) => setSignupNik(e.target.value.replace(/\D/g, '').slice(0, 16))}
                      placeholder="16 digit NIK KTP"
                      className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-300 bg-slate-50/70 text-sm font-mono text-slate-900 placeholder:text-slate-400 placeholder:font-sans focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:bg-white transition-colors"
                    />
                  </div>
                </div>

                {/* 5. Password dengan tombol lihat/sembunyikan */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="signup-password"
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-700"
                  >
                    <Lock className="w-3.5 h-3.5 text-blue-700" />
                    <span>
                      Password <span className="text-rose-600">*</span>
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      id="signup-password"
                      type={showSignupPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      maxLength={120}
                      autoComplete="new-password"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      placeholder="Minimal 6 karakter"
                      className="w-full min-h-[42px] pl-3.5 pr-11 py-2 rounded-xl border border-slate-300 bg-slate-50/70 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:bg-white transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignupPassword((prev) => !prev)}
                      aria-label={showSignupPassword ? 'Sembunyikan password' : 'Lihat password'}
                      className="absolute right-2 top-1/2 -translate-y-1/2 min-w-[36px] min-h-[36px] flex items-center justify-center text-slate-500 hover:text-slate-800 rounded-lg cursor-pointer"
                    >
                      {showSignupPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* 7. Wilayah Penugasan (Kota -> Kecamatan -> Kelurahan) */}
                <div className="space-y-2 rounded-2xl bg-slate-50 border border-slate-200 p-3.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <MapPin className="w-3.5 h-3.5 text-blue-700" />
                    <span>
                      Wilayah Penugasan <span className="text-rose-600">*</span>
                    </span>
                  </div>
                  <WilayahSelector
                    value={signupWilayah}
                    onChange={setSignupWilayah}
                    required
                    compact
                  />
                </div>

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <UserPlus className="w-4 h-4 shrink-0" />
                  <span>
                    {busy
                      ? 'Memeriksa Data & Mendaftarkan...'
                      : `Daftar sebagai ${signupRole === 'relawan' ? 'Relawan' : 'Korcam'}`}
                  </span>
                </button>
              </form>
            )}
          </div>
        ) : (
          <>
            {/* ===================== MODE LOGIN ===================== */}
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
                  <svg
                    className="w-4 h-4 bg-white rounded-full p-0.5 shrink-0"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      fill="#EA4335"
                      d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.8C6.2 7.2 8.9 5 12 5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.7-2.4 3.6l3.7 2.9c2.2-2 3.7-5 3.7-8.7z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.3 14.8c-.2-.8-.4-1.6-.4-2.5s.1-1.7.4-2.5L1.6 7C.6 9 0 10.9 0 13s.6 4 1.6 5.9l3.7-2.9v-1.2z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.1-6.7-5l-3.7 2.9C3.5 21.4 7.4 24 12 24z"
                    />
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
                        {showStaffPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
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

                {onSignUpAccount && (
                  <div className="pt-2 border-t border-slate-100 text-center space-y-2">
                    <p className="text-xs text-slate-500">
                      Belum punya akun Korcam? Daftar manual di bawah ini.
                    </p>
                    <button
                      type="button"
                      onClick={() => openSignUpMode('kader')}
                      className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <UserPlus className="w-4 h-4 shrink-0" />
                      <span>Sign Up / Daftar Akun Korcam</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: RELAWAN (Manual + Google SSO Whitelist Validation + Sign Up) */}
            {portalTab === 'relawan' && (
              <div className="space-y-4">
                <div className="rounded-2xl bg-blue-50 border border-blue-200 p-3 text-xs text-blue-900 leading-relaxed">
                  Masuk menggunakan akun <span className="font-bold">Relawan</span> yang telah terdaftar dan aktif (via SSO Google atau login manual).
                </div>

                {/* Google SSO Button untuk Relawan */}
                <button
                  type="button"
                  onClick={handleRelawanGoogle}
                  disabled={busy}
                  className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
                >
                  <svg
                    className="w-4 h-4 bg-white rounded-full p-0.5 shrink-0"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      fill="#EA4335"
                      d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.8C6.2 7.2 8.9 5 12 5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.7-2.4 3.6l3.7 2.9c2.2-2 3.7-5 3.7-8.7z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.3 14.8c-.2-.8-.4-1.6-.4-2.5s.1-1.7.4-2.5L1.6 7C.6 9 0 10.9 0 13s.6 4 1.6 5.9l3.7-2.9v-1.2z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.1-6.7-5l-3.7 2.9C3.5 21.4 7.4 24 12 24z"
                    />
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
                        aria-label={
                          showRelawanPassword ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'
                        }
                        className="absolute right-2 top-1/2 -translate-y-1/2 min-w-[36px] min-h-[36px] flex items-center justify-center text-slate-500 hover:text-slate-800 rounded-lg cursor-pointer"
                      >
                        {showRelawanPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <LogIn className="w-4 h-4 shrink-0" />
                    <span>{busy ? 'Memverifikasi Akun...' : 'Masuk sebagai Relawan'}</span>
                  </button>
                </form>

                {onSignUpAccount && (
                  <div className="pt-2 border-t border-slate-100 text-center space-y-2">
                    <p className="text-xs text-slate-500">
                      Belum punya akun Relawan? Daftar manual dan tunggu aktivasi Korcam.
                    </p>
                    <button
                      type="button"
                      onClick={() => openSignUpMode('relawan')}
                      className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <UserPlus className="w-4 h-4 shrink-0" />
                      <span>Sign Up / Daftar Akun Relawan</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Trust */}
        <div className="pt-4 border-t border-slate-100">
          <div className="flex items-start gap-2.5 text-xs text-slate-600">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              Akses diverifikasi melalui Whitelist Cloud Database. Hanya akun berstatus Aktif yang dapat masuk.
            </span>
          </div>
        </div>
      </div>

      <p className="mt-6 text-xs text-slate-500 text-center">
        swaraku.online &middot; Akses Cepat &amp; Aman
      </p>
    </div>
  );
};
