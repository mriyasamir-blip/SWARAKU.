import React, { useState } from 'react';
import { UserAccount } from '../../types/vore';
import { loginUserOnCloud } from '../../services/userApiService';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  X,
  KeyRound,
  ShieldAlert,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { SwarakuLogo } from '../common/SwarakuLogo';

interface LoginModalProps {
  isOpen: boolean;
  onClose?: () => void;
  currentUser: UserAccount | null;
  onLogin: (account: UserAccount) => void;
  userAccounts?: UserAccount[];
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLogin,
}) => {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrUsername.trim() || !password.trim()) {
      setErrorMsg('Harap masukkan Username/Email dan Kata Sandi.');
      return;
    }

    setErrorMsg(null);
    setLoading(true);

    try {
      // Validasi langsung ke Server Cloud Database (Firestore / Google Sheets)
      const result = await loginUserOnCloud(emailOrUsername, password);

      if (result.success && result.user) {
        onLogin(result.user);
        setLoading(false);
        if (onClose) onClose();
      } else {
        setErrorMsg(
          result.message || 'Username atau kata sandi tidak sesuai di Server Cloud Database.'
        );
        setLoading(false);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Gagal menghubungi Server Cloud Database. Periksa koneksi.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-7 space-y-4 shadow-2xl border border-slate-200 my-auto text-slate-800 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <SwarakuLogo size={36} />
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Masuk ke Akun SWARAKU
              </h2>
              <p className="text-xs text-slate-500">
                Akses akun Super Admin, Admin, Tim Sukses, atau Kader
              </p>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-sm font-bold cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Form Login */}
        <form onSubmit={handleLoginSubmit} className="space-y-3.5 text-xs">
          {errorMsg && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="font-bold text-slate-800 block mb-1">
              Username atau Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                required
                autoFocus
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-hidden focus:border-purple-600 focus:bg-white text-xs"
                placeholder="Masukkan username atau email..."
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-800 block mb-1">
              Kata Sandi / PIN
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-3.5 h-3.5" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-hidden focus:border-purple-600 focus:bg-white text-xs"
                placeholder="Masukkan kata sandi..."
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Memverifikasi Akun ke Server...</span>
              </span>
            ) : (
              <>
                <KeyRound className="w-4 h-4" />
                <span>Masuk Sekarang</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
