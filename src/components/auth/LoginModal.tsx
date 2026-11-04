import React, { useState } from 'react';
import { UserAccount, UserRole } from '../../types/vore';
import { PRESET_ACCOUNTS } from '../../data/accountsData';
import {
  ShieldCheck,
  UserCheck,
  Users,
  Lock,
  Mail,
  ChevronRight,
  Sparkles,
  X,
  CheckCircle2,
  Building2,
  MapPin,
  Eye,
  EyeOff,
  Shield,
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
  currentUser,
  onLogin,
  userAccounts,
}) => {
  const accountsPool = userAccounts && userAccounts.length > 0 ? userAccounts : PRESET_ACCOUNTS;
  const [selectedRole, setSelectedRole] = useState<UserRole>('super_admin');
  const [emailOrUsername, setEmailOrUsername] = useState('superadmin@swaraku.com');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setErrorMsg(null);
    const firstAcc = accountsPool.find((acc) => acc.role === role && acc.status !== 'Nonaktif');
    if (firstAcc) {
      setEmailOrUsername(firstAcc.username);
      setPassword(firstAcc.password || '');
    } else if (role === 'super_admin') {
      setEmailOrUsername('superadmin@swaraku.com');
      setPassword('123456');
    } else if (role === 'admin') {
      setEmailOrUsername('admin@swaraku.com');
      setPassword('123456');
    } else if (role === 'tim_sukses') {
      setEmailOrUsername('timsukses@swaraku.com');
      setPassword('123456');
    } else {
      setEmailOrUsername('kader@swaraku.com');
      setPassword('123456');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    setTimeout(() => {
      const cleanInput = emailOrUsername.trim().toLowerCase();
      const match = accountsPool.find(
        (acc) =>
          acc.username.toLowerCase() === cleanInput ||
          acc.email.toLowerCase() === cleanInput
      );

      if (!match) {
        setErrorMsg('Username atau Email tidak ditemukan. Hubungi Super Admin.');
        setLoading(false);
        return;
      }

      const expectedPassword = match.password || '123456';
      if (password !== expectedPassword) {
        setErrorMsg('Password salah! Password tidak sesuai dengan data terdaftar di Super Admin.');
        setLoading(false);
        return;
      }

      if (match.status === 'Nonaktif') {
        setErrorMsg('Akun ini berstatus NONAKTIF oleh Super Admin. Anda tidak dapat login.');
        setLoading(false);
        return;
      }

      onLogin(match);
      setLoading(false);
      if (onClose) onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-7 space-y-5 shadow-2xl border border-slate-200 my-auto text-slate-800 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <SwarakuLogo size={36} />
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Pilih Akun Masuk
              </h2>
              <p className="text-xs text-slate-500">
                Pilih Akun Super Admin, Admin, Tim Sukses, atau Kader
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

        {/* 4 Account Options Selection */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* 1. Akun Super Admin */}
          <button
            type="button"
            onClick={() => handleRoleSelect('super_admin')}
            className={`p-2.5 rounded-2xl border-2 text-left transition-all cursor-pointer relative flex flex-col justify-between ${
              selectedRole === 'super_admin'
                ? 'border-purple-600 bg-purple-50/80 shadow-sm ring-2 ring-purple-200'
                : 'border-slate-200 hover:border-slate-300 bg-slate-50'
            }`}
          >
            {selectedRole === 'super_admin' && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-purple-600"></span>
            )}
            <div className="w-7 h-7 rounded-xl bg-purple-600 text-white flex items-center justify-center mb-1.5 shadow-xs">
              <Shield className="w-3.5 h-3.5" />
            </div>
            <span className="text-[8px] font-bold uppercase tracking-wider text-purple-800 block">
              SUPER ADMIN
            </span>
            <h3 className="text-xs font-black text-slate-900 leading-tight">
              Super Admin
            </h3>
          </button>

          {/* 2. Akun Admin */}
          <button
            type="button"
            onClick={() => handleRoleSelect('admin')}
            className={`p-2.5 rounded-2xl border-2 text-left transition-all cursor-pointer relative flex flex-col justify-between ${
              selectedRole === 'admin'
                ? 'border-teal-600 bg-teal-50/70 shadow-sm ring-2 ring-teal-200'
                : 'border-slate-200 hover:border-slate-300 bg-slate-50'
            }`}
          >
            {selectedRole === 'admin' && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-teal-600"></span>
            )}
            <div className="w-7 h-7 rounded-xl bg-teal-600 text-white flex items-center justify-center mb-1.5 shadow-xs">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <span className="text-[8px] font-bold uppercase tracking-wider text-teal-800 block">
              ADMIN
            </span>
            <h3 className="text-xs font-black text-slate-900 leading-tight">
              Admin
            </h3>
          </button>

          {/* 3. Akun Tim Sukses */}
          <button
            type="button"
            onClick={() => handleRoleSelect('tim_sukses')}
            className={`p-2.5 rounded-2xl border-2 text-left transition-all cursor-pointer relative flex flex-col justify-between ${
              selectedRole === 'tim_sukses'
                ? 'border-cyan-600 bg-cyan-50/70 shadow-sm ring-2 ring-cyan-200'
                : 'border-slate-200 hover:border-slate-300 bg-slate-50'
            }`}
          >
            {selectedRole === 'tim_sukses' && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-cyan-600"></span>
            )}
            <div className="w-7 h-7 rounded-xl bg-cyan-600 text-white flex items-center justify-center mb-1.5 shadow-xs">
              <Building2 className="w-3.5 h-3.5" />
            </div>
            <span className="text-[8px] font-bold uppercase tracking-wider text-cyan-800 block">
              TIM SUKSES
            </span>
            <h3 className="text-xs font-black text-slate-900 leading-tight">
              Tim Sukses
            </h3>
          </button>

          {/* 4. Akun Kader */}
          <button
            type="button"
            onClick={() => handleRoleSelect('kader')}
            className={`p-2.5 rounded-2xl border-2 text-left transition-all cursor-pointer relative flex flex-col justify-between ${
              selectedRole === 'kader'
                ? 'border-slate-800 bg-slate-100 shadow-sm ring-2 ring-slate-300'
                : 'border-slate-200 hover:border-slate-300 bg-slate-50'
            }`}
          >
            {selectedRole === 'kader' && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-slate-900"></span>
            )}
            <div className="w-7 h-7 rounded-xl bg-slate-900 text-white flex items-center justify-center mb-1.5 shadow-xs">
              <UserCheck className="w-3.5 h-3.5" />
            </div>
            <span className="text-[8px] font-bold uppercase tracking-wider text-slate-800 block">
              KADER
            </span>
            <h3 className="text-xs font-black text-slate-900 leading-tight">
              Kader
            </h3>
          </button>
        </div>

        {/* Selected Role Info Summary */}
        <div className="p-3 bg-slate-100/80 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-white text-slate-700 flex items-center justify-center font-bold text-xs shadow-2xs">
              {selectedRole === 'super_admin' ? 'SA' : selectedRole === 'admin' ? 'ADM' : selectedRole === 'tim_sukses' ? 'TS' : 'KD'}
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">Login Sebagai:</span>
              <span className="font-extrabold text-slate-900">
                {selectedRole === 'super_admin'
                  ? 'Super Admin Utama'
                  : selectedRole === 'admin'
                  ? 'Administrator (Admin)'
                  : selectedRole === 'tim_sukses'
                  ? 'Bambang Haryanto (Tim Sukses)'
                  : 'Ahmad Rizky (Kader TPS 047)'}
              </span>
            </div>
          </div>
          <span className="text-[10px] font-semibold text-teal-800 bg-teal-100 px-2 py-0.5 rounded-md">
            {selectedRole === 'super_admin'
              ? 'Super Admin'
              : selectedRole === 'admin'
              ? 'Admin'
              : selectedRole === 'tim_sukses'
              ? 'Tim Sukses'
              : 'Kader Lapangan'}
          </span>
        </div>

        {/* Form Login */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {errorMsg && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="font-bold text-slate-800 block mb-1">
              Email atau Username
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                placeholder="nama@swaraku.com atau username"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs font-medium"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-slate-800">Kata Sandi</label>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs font-medium"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-bold rounded-xl shadow-md shadow-teal-600/20 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98 disabled:opacity-60"
          >
            {loading ? (
              <span>Memproses...</span>
            ) : (
              <>
                <span>Masuk Sekarang</span>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
