import React from 'react';
import { AppRole, DeviceOS, UserAccount } from '../types/vore';
import {
  Smartphone,
  Monitor,
  Shield,
  Users,
  BarChart3,
  BookOpen,
  Apple,
  ArrowLeftRight,
  ArrowLeft,
  ExternalLink,
  Database,
  Building2,
  UserCheck,
  LogOut,
  KeyRound,
  Globe,
  RefreshCw,
} from 'lucide-react';
import { PWAInstallButton } from './pwa/PWAInstallButton';
import { SwarakuLogo } from './common/SwarakuLogo';

interface NavbarProps {
  currentRole: AppRole;
  onRoleChange: (role: AppRole) => void;
  deviceOS: DeviceOS;
  onDeviceOSChange: (os: DeviceOS) => void;
  voterPoints: number;
  isAppMode: boolean;
  onToggleAppMode: (appMode: boolean) => void;
  isStandalone?: boolean;
  detectedOS?: 'android' | 'ios' | 'desktop';
  onOpenCekNik?: () => void;
  onOpenWhatsAppBlazt?: () => void;
  currentUser?: UserAccount | null;
  onOpenLogin?: () => void;
  onLogout?: () => void;
  onOpenWebsite?: () => void;
  onTriggerCloudSync?: () => Promise<void>;
  isSyncingCloud?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  onRoleChange,
  deviceOS,
  onDeviceOSChange,
  voterPoints,
  isAppMode,
  onToggleAppMode,
  isStandalone = false,
  detectedOS = 'desktop',
  onOpenCekNik,
  onOpenWhatsAppBlazt,
  currentUser,
  onOpenLogin,
  onLogout,
  onOpenWebsite,
  onTriggerCloudSync,
  isSyncingCloud,
}) => {
  // When running as an installed standalone PWA app, hide browser website navbar completely
  if (isStandalone) {
    return null;
  }

  // Versi Apps (Aplikasi Pemilih Murni Sesuai Android, iOS, Desktop)
  if (isAppMode) {
    return (
      <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 text-slate-800 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-15 flex items-center justify-between">
          {/* Brand & App Mode Badge */}
          <div className="flex items-center gap-2">
            <SwarakuLogo size={28} />
            <span className="text-[11px] font-bold text-cyan-800 bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded-full flex items-center gap-1 ml-1">
              <Smartphone className="w-3 h-3 text-cyan-600" />
              <span>{currentUser?.role === 'tim_sukses' ? 'Tim Sukses' : 'Kader Lapangan'}</span>
            </span>
          </div>

          {/* Device Type Selector (Android, iOS, Desktop) */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => onDeviceOSChange('android')}
              className={`px-3 py-1.5 text-xs rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer relative ${
                deviceOS === 'android'
                  ? 'bg-white text-cyan-800 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
              <span>Android</span>
              {detectedOS === 'android' && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Device Anda"></span>
              )}
            </button>
            <button
              onClick={() => onDeviceOSChange('ios')}
              className={`px-3 py-1.5 text-xs rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer relative ${
                deviceOS === 'ios'
                  ? 'bg-white text-cyan-800 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="text-xs font-serif font-black"></span>
              <span>iOS</span>
              {detectedOS === 'ios' && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Device Anda"></span>
              )}
            </button>
            <button
              onClick={() => onDeviceOSChange('desktop')}
              className={`px-3 py-1.5 text-xs rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer relative ${
                deviceOS === 'desktop' || deviceOS === 'responsive'
                  ? 'bg-white text-cyan-800 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Monitor className="w-3.5 h-3.5 text-indigo-600" />
              <span>Desktop</span>
              {detectedOS === 'desktop' && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Device Anda"></span>
              )}
            </button>
          </div>

          {/* Right Actions: Login Button + Install + Portal Mode Switcher */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Cloud Real-Time Sync Button */}
            {onTriggerCloudSync && (
              <button
                type="button"
                onClick={onTriggerCloudSync}
                disabled={isSyncingCloud}
                className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs active:scale-95 disabled:opacity-50"
                title="Sinkronkan database Cloud Real-Time ke seluruh perangkat (HP & Laptop)"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${isSyncingCloud ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{isSyncingCloud ? 'Sinkron...' : 'Cloud Sync'}</span>
              </button>
            )}

            {/* User Account / Ganti Akun / Logout Button */}
            {currentUser ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={onOpenLogin}
                  className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold rounded-lg border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Ganti Akun"
                >
                  {currentUser.role === 'tim_sukses' ? (
                    <Building2 className="w-3.5 h-3.5 text-cyan-600" />
                  ) : (
                    <UserCheck className="w-3.5 h-3.5 text-teal-600" />
                  )}
                  <span className="hidden sm:inline">
                    {currentUser.role === 'tim_sukses' ? 'Tim Sukses' : 'Kader'}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400">
                    (Ganti)
                  </span>
                </button>
                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="p-1.5 text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors cursor-pointer"
                    title="Keluar / Logout Akun"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ) : (
              onOpenLogin && (
                <button
                  onClick={onOpenLogin}
                  className="px-3 py-1.5 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-98"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Login SWARAKU</span>
                </button>
              )
            )}

            {/* Install Button with callback to set device */}
            <PWAInstallButton
              label="Download App"
              onSelectDevice={(os) => onDeviceOSChange(os)}
            />

            {/* Tombol Kembali ke Halaman Website */}
            {onOpenWebsite && (
              <button
                onClick={onOpenWebsite}
                className="px-3 py-1.5 bg-gradient-to-r from-cyan-50 to-teal-50 hover:from-cyan-100 hover:to-teal-100 text-cyan-950 text-xs font-bold rounded-lg border border-cyan-300 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-98"
                title="Kembali ke Halaman Website (swaraku.com)"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-cyan-700" />
                <Globe className="w-3.5 h-3.5 text-cyan-700 hidden sm:inline" />
                <span>Kembali ke Website</span>
              </button>
            )}

            {/* Switch to Web Portal button */}
            <button
              onClick={() => {
                onToggleAppMode(false);
              }}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
              title="Buka Mode Portal Web (Command Center & Konsep)"
            >
              <ArrowLeftRight className="w-3 h-3 text-slate-500" />
              <span className="hidden md:inline">Mode Web Portal</span>
            </button>
          </div>
        </div>
      </header>
    );
  }

  // Mode Web Portal (Lengkap: Database Voters, Command Center, App Pemilih, Kader Lapangan, Konsep)
  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 text-slate-800 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onRoleChange('database_voters');
          }}
          className="hover:opacity-90 transition-opacity flex items-center"
        >
          <SwarakuLogo size={30} showSubtitle={true} />
        </a>

        {/* Clean Navigation Tabs for Web Portal */}
        <nav className="hidden md:flex items-center gap-5 text-sm font-medium text-slate-600">
          <button
            onClick={() => onRoleChange('database_voters')}
            className={`flex items-center gap-1.5 transition-colors pb-0.5 cursor-pointer ${
              currentRole === 'database_voters'
                ? 'text-cyan-700 border-b-2 border-cyan-600 font-bold'
                : 'hover:text-slate-900'
            }`}
          >
            <Database className="w-4 h-4 text-cyan-600" />
            <span>Database Voters</span>
          </button>
          <button
            onClick={() => onRoleChange('admin')}
            className={`flex items-center gap-1.5 transition-colors pb-0.5 cursor-pointer ${
              currentRole === 'admin'
                ? 'text-cyan-700 border-b-2 border-cyan-600 font-bold'
                : 'hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Command Center</span>
          </button>
          <button
            onClick={() => onRoleChange('voter')}
            className={`flex items-center gap-1.5 transition-colors pb-0.5 cursor-pointer ${
              currentRole === 'voter'
                ? 'text-cyan-700 border-b-2 border-cyan-600 font-bold'
                : 'hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>App Pemilih</span>
          </button>
          <button
            onClick={() => onRoleChange('canvasser')}
            className={`flex items-center gap-1.5 transition-colors pb-0.5 cursor-pointer ${
              currentRole === 'canvasser'
                ? 'text-cyan-700 border-b-2 border-cyan-600 font-bold'
                : 'hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Operasi Lapangan</span>
          </button>
          <button
            onClick={() => onRoleChange('concept')}
            className={`flex items-center gap-1.5 transition-colors pb-0.5 cursor-pointer ${
              currentRole === 'concept'
                ? 'text-cyan-700 border-b-2 border-cyan-600 font-bold'
                : 'hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Konsep 4-in-1</span>
          </button>
        </nav>

        {/* Primary actions */}
        <div className="flex items-center gap-3">
          {/* User Account / Ganti Akun Button in Portal */}
          {currentUser ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={onOpenLogin}
                className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold rounded-lg border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Ganti Akun"
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    currentUser.role === 'tim_sukses' ? 'bg-cyan-600' : 'bg-teal-600'
                  }`}
                />
                <span className="hidden sm:inline">
                  {currentUser.role === 'tim_sukses' ? 'Tim Sukses' : 'Kader'}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold">(Ganti)</span>
              </button>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="px-2 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-lg border border-rose-200 transition-colors flex items-center gap-1 cursor-pointer"
                  title="Keluar dari Akun SWARAKU"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Keluar</span>
                </button>
              )}
            </div>
          ) : (
            onOpenLogin && (
              <button
                onClick={onOpenLogin}
                className="px-3 py-1.5 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-98"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Login SWARAKU</span>
              </button>
            )
          )}



          {/* Mode Switcher to Versi Apps Pemilih */}
          <button
            onClick={() => {
              onToggleAppMode(true);
              onRoleChange('voter');
            }}
            className="px-3 py-1.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 text-xs font-bold rounded-lg border border-cyan-200 transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Buka tampilan khusus Versi Apps"
          >
            <Smartphone className="w-3.5 h-3.5 text-cyan-600" />
            <span>Versi Apps</span>
          </button>

          {/* Tombol Kembali ke Halaman Website */}
          {onOpenWebsite && (
            <button
              onClick={onOpenWebsite}
              className="px-3 py-1.5 bg-slate-100 hover:bg-cyan-50 text-slate-800 hover:text-cyan-900 text-xs font-bold rounded-lg border border-slate-200 transition-all flex items-center gap-1.5 cursor-pointer"
              title="Kembali ke Halaman Website (swaraku.com)"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-cyan-700" />
              <Globe className="w-3.5 h-3.5 text-cyan-700 hidden sm:inline" />
              <span>Halaman Website</span>
            </button>
          )}

          {/* In-App PWA Install / Download Button */}
          <PWAInstallButton label="Download App" />

          {/* Mobile role select trigger */}
          <div className="flex md:hidden">
            <select
              value={currentRole}
              onChange={(e) => onRoleChange(e.target.value as AppRole)}
              className="bg-slate-100 text-xs text-slate-800 border border-slate-300 rounded-md py-1.5 px-2 focus:ring-1 focus:ring-cyan-500 focus:outline-hidden font-medium"
            >
              <option value="database_voters">Database Voters</option>
              <option value="admin">Command Center</option>
              <option value="voter">App Pemilih</option>
              <option value="canvasser">Kader Lapangan</option>
              <option value="concept">Konsep 4-in-1</option>
            </select>
          </div>
        </div>
      </div>
    </header>
  );
};
