import React, { useState } from 'react';
import { UserAccount, DeviceOS } from '../../types/vore';
import { loginUserOnCloud } from '../../services/userApiService';
import {
  ShieldCheck,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  KeyRound,
  ShieldAlert,
  Smartphone,
  Laptop,
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
}) => {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameOrEmail.trim() || !password.trim()) {
      setErrorMessage('Harap isi Username/Email dan Kata Sandi.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      // Validasi langsung ke Server Cloud Database (Firestore / Google Sheets)
      const result = await loginUserOnCloud(usernameOrEmail, password);

      if (result.success && result.user) {
        onLogin(result.user);
        setIsLoading(false);
      } else {
        setErrorMessage(
          result.message || 'Username atau kata sandi tidak sesuai di Server Cloud Database.'
        );
        setIsLoading(false);
      }
    } catch (err: any) {
      setErrorMessage(
        err?.message || 'Gagal menghubungi Server Cloud Database. Periksa koneksi internet.'
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col justify-center py-4 sm:py-8 px-3 max-w-md mx-auto text-slate-800">
      {/* Brand & App Emblem */}
      <div className="text-center mb-6 flex flex-col items-center">
        <div className="p-3.5 bg-white rounded-3xl shadow-sm border border-slate-200/80 mb-3 inline-flex items-center justify-center">
          <SwarakuLogo variant="full" size={52} />
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 text-purple-800 rounded-full text-[11px] font-extrabold uppercase tracking-wider mb-1.5 border border-purple-200">
          <Sparkles className="w-3.5 h-3.5 text-purple-600" />
          <span>Sistem Pemenangan Terpadu Multi-Device</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Masuk ke Akun SWARAKU
        </h1>
        <p className="text-xs text-slate-500 max-w-xs mt-1">
          Gunakan akun yang telah didaftarkan oleh Super Admin (Admin, Tim Sukses, atau Kader)
        </p>
      </div>

      {/* Main Login Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-xl border border-slate-200/90 space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Username Input */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
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
                placeholder="Masukkan username atau email terdaftar..."
                className="w-full pl-10 pr-4 py-3 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-purple-600 rounded-xl text-xs sm:text-sm font-semibold transition-all focus:outline-hidden focus:ring-2 focus:ring-purple-200"
                required
                autoFocus
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700">
                Kata Sandi / PIN
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
                placeholder="Masukkan kata sandi..."
                className="w-full pl-10 pr-10 py-3 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-purple-600 rounded-xl text-xs sm:text-sm font-semibold transition-all focus:outline-hidden focus:ring-2 focus:ring-purple-200"
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

          {/* Remember me & multi-device label */}
          <div className="flex items-center justify-between text-xs pt-0.5">
            <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600 font-medium">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-3.5 h-3.5 rounded-sm text-purple-600 focus:ring-purple-500 cursor-pointer"
              />
              <span>Ingat sesi masuk di perangkat ini</span>
            </label>
            <span className="text-[11px] font-semibold text-purple-700 flex items-center gap-1">
              <Smartphone className="w-3 h-3" />
              <Laptop className="w-3 h-3" />
              <span>Multi-Device</span>
            </span>
          </div>

          {/* Submit Login Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-gradient-to-r from-purple-700 via-indigo-700 to-teal-700 hover:from-purple-800 hover:via-indigo-800 hover:to-teal-800 text-white font-black text-xs sm:text-sm rounded-xl shadow-md shadow-purple-700/20 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98 disabled:opacity-60"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Memverifikasi Akun ke Server...</span>
              </span>
            ) : (
              <>
                <KeyRound className="w-4 h-4" />
                <span>Masuk ke Aplikasi SWARAKU</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Security & System Info Footer */}
      <div className="mt-5 text-center space-y-1">
        <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Sistem Terenkripsi SSL 256-Bit · Cloud Firestore Sync</span>
        </div>
        <p className="text-[10px] text-slate-400">
          Sistem Pemenangan Pemilu Terintegrasi SWARAKU · Multi-Browser & Multi-Device
        </p>
      </div>
    </div>
  );
};
