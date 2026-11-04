import React from 'react';
import { ActiveMobileTab, DeviceOS, UserRole } from '../../types/vore';
import {
  Home,
  MessageSquare,
  Compass,
  MapPin,
  User,
} from 'lucide-react';
import { SwarakuLogo } from '../common/SwarakuLogo';

interface MobileFrameProps {
  children: React.ReactNode;
  activeTab: ActiveMobileTab;
  onTabChange: (tab: ActiveMobileTab) => void;
  deviceOS: DeviceOS;
  isStandalone?: boolean;
  hideNav?: boolean;
  appTitle?: string;
  userRole?: UserRole;
}

export const MobileFrame: React.FC<MobileFrameProps> = ({
  children,
  activeTab,
  onTabChange,
  deviceOS,
  isStandalone = false,
  hideNav = false,
  appTitle,
  userRole,
}) => {
  const isDesktop = deviceOS === 'desktop' || deviceOS === 'responsive';
  const isIOS = deviceOS === 'ios';
  const isAndroid = deviceOS === 'android';

  // Kader Lapangan only sees Beranda and Profil as requested
  const isKader = userRole === 'kader';

  // Desktop App View: Spacious, dedicated desktop application layout
  if (isDesktop) {
    return (
      <div className="w-full max-w-5xl mx-auto px-3 sm:px-4 py-3 sm:py-6">
        <div className="bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden flex flex-col min-h-[820px]">
          {/* Desktop App Window Header */}
          <div className="bg-slate-100/90 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between select-none">
            {/* Desktop App Branding */}
            <div className="flex items-center gap-2">
              <SwarakuLogo variant="icon" size={16} />
              <span className="text-xs font-bold text-slate-800">
                {appTitle || 'SWARAKU · Desktop App'}
              </span>
            </div>

            {/* Desktop Navigation Tabs */}
            {!hideNav && (
              <nav className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
                {/* 1. Beranda */}
                <button
                  onClick={() => onTabChange('beranda')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    activeTab === 'beranda'
                      ? 'bg-cyan-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>Beranda</span>
                </button>

                {/* Sembunyikan Aspirasi, Peta Suara, TPS untuk Kader Lapangan */}
                {!isKader && (
                  <>
                    <button
                      onClick={() => onTabChange('aspirasi')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                        activeTab === 'aspirasi'
                          ? 'bg-cyan-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Aspirasi</span>
                    </button>
                    <button
                      onClick={() => onTabChange('peta_suara')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                        activeTab === 'peta_suara'
                          ? 'bg-cyan-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <Compass className="w-3.5 h-3.5" />
                      <span>Peta Suara</span>
                    </button>
                    <button
                      onClick={() => onTabChange('tps')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                        activeTab === 'tps'
                          ? 'bg-cyan-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>TPS &amp; Info</span>
                    </button>
                  </>
                )}

                {/* Profil */}
                <button
                  onClick={() => onTabChange('profil')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    activeTab === 'profil'
                      ? 'bg-cyan-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Profil</span>
                </button>
              </nav>
            )}

            {/* Desktop Status Badge */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-[11px] font-semibold text-emerald-700 hidden md:inline">Terhubung</span>
            </div>
          </div>

          {/* Desktop Content Body */}
          <div className="flex-1 bg-slate-50/70 p-4 sm:p-6 overflow-y-auto">
            <div className="max-w-2xl mx-auto">{children}</div>
          </div>
        </div>
      </div>
    );
  }

  // Mobile Views (Android & iOS)
  return (
    <div
      className={`w-full flex justify-center transition-all ${
        isStandalone
          ? 'p-0 min-h-screen min-h-[100dvh]'
          : 'p-0 sm:py-6 sm:px-2 min-h-screen min-h-[100dvh]'
      }`}
    >
      <div
        className={`w-full transition-all duration-300 ${
          isStandalone
            ? 'min-h-screen min-h-[100dvh] w-full max-w-full sm:max-w-md bg-slate-50 shadow-none border-none'
            : 'w-full max-w-full sm:max-w-[420px] sm:bg-slate-900 sm:rounded-[44px] sm:p-2.5 sm:shadow-2xl sm:border sm:border-slate-800'
        }`}
      >
        {/* Device Inner Screen Container */}
        <div
          className={`w-full bg-slate-50 flex flex-col relative transition-all ${
            isStandalone
              ? 'min-h-screen min-h-[100dvh]'
              : 'min-h-screen min-h-[100dvh] sm:min-h-[760px] sm:max-h-[850px] sm:rounded-[36px] sm:border sm:border-slate-300/40 sm:overflow-hidden'
          }`}
        >
          {/* Scrollable Screen Content (Top safe area padding) */}
          <div
            className={`w-full flex-1 overflow-y-auto px-3.5 sm:px-4 pt-3 ${
              hideNav ? 'pb-6' : 'pb-24 sm:pb-20'
            } no-scrollbar`}
          >
            {children}
          </div>

          {/* Bottom Fixed Navigation Bar (Styled for Android or iOS) */}
          {!hideNav && (
            <nav
              aria-label="Navigasi Aplikasi"
              className={`fixed sm:absolute bottom-0 left-0 right-0 z-40 shadow-lg ${
                isIOS
                  ? 'bg-white/95 backdrop-blur-xl border-t border-slate-200/80 pt-1.5 pb-[max(0.6rem,env(safe-area-inset-bottom,0px))] px-2'
                  : 'bg-white border-t border-slate-200 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] px-2'
              }`}
            >
              <div className="flex items-center justify-around h-14 sm:h-13">
                {/* Beranda */}
                <button
                  onClick={() => onTabChange('beranda')}
                  className={`flex flex-col items-center justify-center flex-1 h-full cursor-pointer transition-colors ${
                    activeTab === 'beranda'
                      ? isAndroid
                        ? 'text-cyan-800'
                        : 'text-cyan-600'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <div
                    className={`p-1 transition-all ${
                      activeTab === 'beranda' && isAndroid
                        ? 'bg-cyan-100 rounded-full px-3 text-cyan-800'
                        : ''
                    }`}
                  >
                    <Home className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-semibold tracking-tight mt-0.5">
                    Beranda
                  </span>
                </button>

                {/* Untuk akun Kader Lapangan: sembunyikan Aspirasi, Peta Suara, dan TPS Info */}
                {!isKader && (
                  <>
                    {/* Aspirasi */}
                    <button
                      onClick={() => onTabChange('aspirasi')}
                      className={`flex flex-col items-center justify-center flex-1 h-full cursor-pointer transition-colors ${
                        activeTab === 'aspirasi'
                          ? isAndroid
                            ? 'text-cyan-800'
                            : 'text-cyan-600'
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      <div
                        className={`p-1 transition-all ${
                          activeTab === 'aspirasi' && isAndroid
                            ? 'bg-cyan-100 rounded-full px-3 text-cyan-800'
                            : ''
                        }`}
                      >
                        <MessageSquare className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-semibold tracking-tight mt-0.5">
                        Aspirasi
                      </span>
                    </button>

                    {/* Monitoring Peta Suara */}
                    <button
                      onClick={() => onTabChange('peta_suara')}
                      className={`flex flex-col items-center justify-center flex-1 h-full cursor-pointer transition-colors ${
                        activeTab === 'peta_suara'
                          ? isAndroid
                            ? 'text-cyan-800'
                            : 'text-cyan-600'
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      <div
                        className={`p-1 transition-all ${
                          activeTab === 'peta_suara' && isAndroid
                            ? 'bg-cyan-100 rounded-full px-3 text-cyan-800'
                            : ''
                        }`}
                      >
                        <Compass className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-semibold tracking-tight mt-0.5">
                        Peta Suara
                      </span>
                    </button>

                    {/* TPS & Info */}
                    <button
                      onClick={() => onTabChange('tps')}
                      className={`flex flex-col items-center justify-center flex-1 h-full cursor-pointer transition-colors ${
                        activeTab === 'tps'
                          ? isAndroid
                            ? 'text-cyan-800'
                            : 'text-cyan-600'
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      <div
                        className={`p-1 transition-all ${
                          activeTab === 'tps' && isAndroid
                            ? 'bg-cyan-100 rounded-full px-3 text-cyan-800'
                            : ''
                        }`}
                      >
                        <MapPin className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-semibold tracking-tight mt-0.5">
                        TPS &amp; Info
                      </span>
                    </button>
                  </>
                )}

                {/* Profil */}
                <button
                  onClick={() => onTabChange('profil')}
                  className={`flex flex-col items-center justify-center flex-1 h-full cursor-pointer transition-colors ${
                    activeTab === 'profil'
                      ? isAndroid
                        ? 'text-cyan-800'
                        : 'text-cyan-600'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <div
                    className={`p-1 transition-all ${
                      activeTab === 'profil' && isAndroid
                        ? 'bg-cyan-100 rounded-full px-3 text-cyan-800'
                        : ''
                    }`}
                  >
                    <User className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-semibold tracking-tight mt-0.5">
                    Profil
                  </span>
                </button>
              </div>
            </nav>
          )}
        </div>
      </div>
    </div>
  );
};
