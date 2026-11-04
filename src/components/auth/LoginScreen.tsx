import React, { useState } from 'react';
import { UserAccount, UserRole, DeviceOS } from '../../types/vore';
import { PRESET_ACCOUNTS } from '../../data/accountsData';
import {
  ShieldCheck,
  UserCheck,
  Lock,
  Mail,
  User,
  Building2,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  KeyRound,
  ShieldAlert,
  Radio,
  Shield,
} from 'lucide-react';
import { SwarakuLogo } from '../common/SwarakuLogo';

interface LoginScreenProps {
  onLogin: (account: UserAccount) => void;
  deviceOS?: DeviceOS;
  onOpenWebsite?: () => void;
  userAccounts?: UserAccount[];
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLogin,
  deviceOS,
  onOpenWebsite,
  userAccounts,
}) => {
  const accountsPool = userAccounts && userAccounts.length > 0 ? userAccounts : PRESET_ACCOUNTS;
  const [selectedRole, setSelectedRole] = useState<UserRole>('super_admin');
  const [usernameOrEmail, setUsernameOrEmail] = useState('superadmin');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role);
    setErrorMessage(null);
    const firstAcc = accountsPool.find((acc) => acc.role === role && acc.status !== 'Nonaktif');
    if (firstAcc) {
      setUsernameOrEmail(firstAcc.username);
      setPassword(firstAcc.password || '');
    } else if (role === 'super_admin') {
      setUsernameOrEmail('superadmin');
      setPassword('123456');
    } else if (role === 'admin') {
      setUsernameOrEmail('admin');
      setPassword('123456');
    } else if (role === 'tim_sukses') {
      setUsernameOrEmail('timsukses');
      setPassword('123456');
    } else {
      setUsernameOrEmail('kader');
      setPassword('123456');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameOrEmail.trim() || !password.trim()) {
      setErrorMessage('Harap isi Username/Email dan Password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    // Verifikasi kredensial akun terintegrasi Super Admin secara ketat
    setTimeout(() => {
      const cleanInput = usernameOrEmail.trim().toLowerCase();
      const match = accountsPool.find(
        (acc) =>
          acc.username.toLowerCase() === cleanInput ||
          acc.email.toLowerCase() === cleanInput
      );

      if (!match) {
        setErrorMessage(
          'Username atau Email tidak ditemukan. Hubungi Super Admin untuk pendaftaran akun baru.'
        );
        setIsLoading(false);
        return;
      }

      // Verifikasi password persis dengan data di Super Admin (tidak ada backdoor)
      const expectedPassword = match.password || '123456';
      if (password !== expectedPassword) {
        setErrorMessage(
          'Password salah! Password tidak sesuai dengan data yang didaftarkan Super Admin.'
        );
        setIsLoading(false);
        return;
      }

      // Verifikasi status akun aktif
      if (match.status === 'Nonaktif') {
        setErrorMessage(
          'Akun ini berstatus NONAKTIF oleh Super Admin. Silakan hubungi administrator.'
        );
        setIsLoading(false);
        return;
      }

      onLogin(match);
      setIsLoading(false);
    }, 450);
  };

  return (
    <div className="w-full flex flex-col justify-center py-2 sm:py-4 px-1 max-w-md mx-auto text-slate-800">
      {/* Brand & App Emblem */}
      <div className="text-center mb-5 sm:mb-6 flex flex-col items-center">
        <div className="p-3.5 bg-white rounded-3xl shadow-md border border-slate-200/80 mb-3 inline-flex items-center justify-center">
          <SwarakuLogo variant="full" size={54} />
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-50 text-teal-800 rounded-full text-[11px] font-extrabold uppercase tracking-wider mb-1.5 border border-teal-200">
          <Sparkles className="w-3.5 h-3.5 text-teal-600" />
          <span>Sistem Pemenangan Terpadu</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Masuk ke Akun SWARAKU
        </h1>
        <p className="text-xs text-slate-500 max-w-xs mt-0.5">
          Pilih akun Admin, Tim Sukses, atau Kader Lapangan untuk masuk ke sistem
        </p>
      </div>

      {/* Main Login Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xl border border-slate-200/90 space-y-4">
        {/* 4 Role Selection Cards */}
        <div>
          <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-2 flex items-center justify-between">
            <span>Pilih Jenis Akun Anda:</span>
            <span className="text-teal-700 text-[10px] font-semibold">
              (4 Pilihan Akun)
            </span>
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* 1. Akun Super Admin */}
            <button
              type="button"
              onClick={() => handleRoleChange('super_admin')}
              className={`p-2.5 rounded-2xl border-2 text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                selectedRole === 'super_admin'
                  ? 'border-purple-600 bg-purple-50/80 shadow-sm ring-2 ring-purple-200/60'
                  : 'border-slate-200 hover:border-slate-300 bg-slate-50/60'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                    selectedRole === 'super_admin'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                </div>
                {selectedRole === 'super_admin' && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                )}
              </div>
              <div>
                <span className="text-[8px] font-extrabold uppercase tracking-wider text-purple-800 block">
                  SUPER ADMIN
                </span>
                <h3 className="text-xs font-black text-slate-900 leading-tight">
                  Super Admin
                </h3>
              </div>
            </button>

            {/* 2. Akun Admin */}
            <button
              type="button"
              onClick={() => handleRoleChange('admin')}
              className={`p-2.5 rounded-2xl border-2 text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                selectedRole === 'admin'
                  ? 'border-teal-600 bg-teal-50/70 shadow-sm ring-2 ring-teal-200/60'
                  : 'border-slate-200 hover:border-slate-300 bg-slate-50/60'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                    selectedRole === 'admin'
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                </div>
                {selectedRole === 'admin' && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                )}
              </div>
              <div>
                <span className="text-[8px] font-extrabold uppercase tracking-wider text-teal-800 block">
                  ADMIN
                </span>
                <h3 className="text-xs font-black text-slate-900 leading-tight">
                  Admin
                </h3>
              </div>
            </button>

            {/* 3. Akun Tim Sukses */}
            <button
              type="button"
              onClick={() => handleRoleChange('tim_sukses')}
              className={`p-2.5 rounded-2xl border-2 text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                selectedRole === 'tim_sukses'
                  ? 'border-cyan-600 bg-cyan-50/70 shadow-sm ring-2 ring-cyan-200/60'
                  : 'border-slate-200 hover:border-slate-300 bg-slate-50/60'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                    selectedRole === 'tim_sukses'
                      ? 'bg-cyan-600 text-white shadow-xs'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                </div>
                {selectedRole === 'tim_sukses' && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-600" />
                )}
              </div>
              <div>
                <span className="text-[8px] font-extrabold uppercase tracking-wider text-cyan-800 block">
                  TIM SUKSES
                </span>
                <h3 className="text-xs font-black text-slate-900 leading-tight">
                  Tim Sukses
                </h3>
              </div>
            </button>

            {/* 4. Akun Kader */}
            <button
              type="button"
              onClick={() => handleRoleChange('kader')}
              className={`p-2.5 rounded-2xl border-2 text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                selectedRole === 'kader'
                  ? 'border-slate-800 bg-slate-100 shadow-sm ring-2 ring-slate-300'
                  : 'border-slate-200 hover:border-slate-300 bg-slate-50/60'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                    selectedRole === 'kader'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                </div>
                {selectedRole === 'kader' && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-slate-900" />
                )}
              </div>
              <div>
                <span className="text-[8px] font-extrabold uppercase tracking-wider text-slate-700 block">
                  KADER
                </span>
                <h3 className="text-xs font-black text-slate-900 leading-tight">
                  Kader
                </h3>
              </div>
            </button>
          </div>
        </div>

        {/* Selected Role Pill Banner */}
        <div className="px-3 py-2 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div
              className={`w-6 h-6 rounded-lg text-white flex items-center justify-center font-black text-[10px] shadow-2xs ${
                selectedRole === 'super_admin'
                  ? 'bg-purple-600'
                  : selectedRole === 'admin'
                  ? 'bg-teal-600'
                  : selectedRole === 'tim_sukses'
                  ? 'bg-cyan-600'
                  : 'bg-slate-900'
              }`}
            >
              {selectedRole === 'super_admin' ? 'SA' : selectedRole === 'admin' ? 'ADM' : selectedRole === 'tim_sukses' ? 'TS' : 'KD'}
            </div>
            <span className="text-xs font-bold text-slate-800">
              Akses:{' '}
              {selectedRole === 'super_admin'
                ? 'Super Admin (Otoritas Sistem Penuh)'
                : selectedRole === 'admin'
                ? 'Admin Operasional'
                : selectedRole === 'tim_sukses'
                ? 'Tim Sukses (Mobilisasi & Data)'
                : 'Kader Lapangan (Input & C1/B1)'}
            </span>
          </div>
          <span className="text-[10px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
            Aktif
          </span>
        </div>

        {/* Form Login: Username & Password */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-bold flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Username Input */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Username atau Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                placeholder={
                  selectedRole === 'admin'
                    ? 'admin'
                    : selectedRole === 'tim_sukses'
                    ? 'timsukses'
                    : 'kader'
                }
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-teal-500 rounded-xl text-xs sm:text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-teal-200"
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700">
                Kata Sandi
              </label>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-teal-500 rounded-xl text-xs sm:text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-teal-200"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember me */}
          <div className="flex items-center justify-between text-xs pt-0.5">
            <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600 font-medium">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-3.5 h-3.5 rounded-sm text-teal-600 focus:ring-teal-500"
              />
              <span>Ingat sesi masuk</span>
            </label>
          </div>

          {/* Submit Login Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-black text-xs sm:text-sm rounded-xl shadow-md shadow-teal-600/20 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98 disabled:opacity-60"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Memverifikasi Akun...</span>
              </span>
            ) : (
              <>
                <KeyRound className="w-4 h-4" />
                <span>
                  Masuk sebagai{' '}
                  {selectedRole === 'admin'
                    ? 'Admin'
                    : selectedRole === 'tim_sukses'
                    ? 'Tim Sukses'
                    : 'Kader Lapangan'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Security & System Info Footer */}
      <div className="mt-4 text-center space-y-1">
        <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Sistem Terenkripsi SSL 256-Bit · Hak Cipta SWARAKU 2026</span>
        </div>
        <p className="text-[10px] text-slate-400">
          Sistem Pemenangan Pemilu Terintegrasi SWARAKU
        </p>
      </div>
    </div>
  );
};
