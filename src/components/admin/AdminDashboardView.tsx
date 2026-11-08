import React, { useState } from 'react';
import {
  AdminModuleTab,
  UserAccount,
  AspirasiItem,
  FormC1Upload,
  FormB1Upload,
  DptVoterRecord,
  ElectabilitySurveySubmission,
  WhatsAppBlaztItem,
  VoterOcrRecord,
  VoterProfile,
} from '../../types/vore';
import { TimSuksesWilayahRecord } from '../../data/petaSuaraData';
import { SwarakuLogo } from '../common/SwarakuLogo';
import {
  LayoutDashboard,
  MessageSquare,
  Compass,
  MapPin,
  Database,
  ShieldCheck,
  Radio,
  Bot,
  Users,
  ChevronRight,
  TrendingUp,
  Award,
  Vote,
  ExternalLink,
  ArrowLeft,
  Globe,
  LogOut,
  UserCheck,
  CheckCircle2,
  Calendar,
  Sparkles,
  Phone,
  BarChart3,
  Flame,
  Building2,
  Target,
  UserPlus,
  RefreshCw,
} from 'lucide-react';
import { AspirasiScreen } from '../mobile/screens/AspirasiScreen';
import { MonitoringPetaSuaraScreen } from '../mobile/screens/MonitoringPetaSuaraScreen';
import { TpsFinderScreen } from '../mobile/screens/TpsFinderScreen';
import { DatabaseVotersView } from '../timsukses/DatabaseVotersView';
import { CommandCenterView } from '../command/CommandCenterView';
import { GroundOperationsView } from '../ground/GroundOperationsView';
import { UserRoleManagementView } from './UserRoleManagementView';

interface AdminDashboardViewProps {
  currentUser: UserAccount;
  activeTab: AdminModuleTab;
  onTabChange: (tab: AdminModuleTab) => void;
  aspirasiList: AspirasiItem[];
  c1Records: FormC1Upload[];
  b1Records: FormB1Upload[];
  surveyList: ElectabilitySurveySubmission[];
  dptList: DptVoterRecord[];
  voterOcrRecords: VoterOcrRecord[];
  blaztLogs: WhatsAppBlaztItem[];
  profile: VoterProfile;
  kaderPoints: number;
  onUpdateAspirasiStatus: (
    id: string,
    status: 'Masuk' | 'Diproses' | 'Selesai',
    tanggapan: string,
    progresPersen: number
  ) => void;
  onSubmitAspirasi: (item: Omit<AspirasiItem, 'id' | 'tanggal' | 'status' | 'upvotes'>) => void;
  onUpvoteAspirasi: (id: string) => void;
  onSubmitC1: (form: Partial<FormC1Upload>) => void;
  onSubmitB1: (form: Partial<FormB1Upload>) => void;
  onSubmitSurvey: (survey: ElectabilitySurveySubmission, points: number) => void;
  onSaveDptVoter: (voter: DptVoterRecord) => void;
  onTriggerBlazt: (campaign: { target: string; totalTarget: number; pesan: string }) => void;
  onRegisterVoterField: (voterData: {
    nama: string;
    nik: string;
    noHp: string;
    tps: string;
    rtRw: string;
    isuPrioritas: string;
  }) => void;
  onCheckinCoblos: () => void;
  onOpenQuickCountModal: () => void;
  onOpenUploadC1Modal: () => void;
  onOpenUploadB1Modal: () => void;
  onOpenWhatsAppBlaztModal: () => void;
  onOpenTambahNikModal: () => void;
  onOpenAiPilcaleg: () => void;
  onOpenDaftarVoterOcrModal: () => void;
  onSwitchAccount: () => void;
  onLogout: () => void;
  onOpenWebsite: () => void;
  userAccounts?: UserAccount[];
  onAddUser?: (user: UserAccount) => void;
  onUpdateUser?: (user: UserAccount) => void;
  onDeleteUser?: (userId: string) => void;
  onToggleUserStatus?: (userId: string) => void;
  timSuksesList?: TimSuksesWilayahRecord[];
  onSaveTimSukses?: (ts: TimSuksesWilayahRecord) => void;
  onSaveVoter?: (voter: VoterOcrRecord) => void;
  onResetDataToZero?: () => void;
  onTriggerCloudSync?: () => Promise<void>;
  isSyncingCloud?: boolean;
  onRefreshUsers?: () => Promise<void>;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  currentUser,
  activeTab,
  onTabChange,
  aspirasiList,
  c1Records,
  b1Records,
  surveyList,
  dptList,
  voterOcrRecords,
  blaztLogs,
  profile,
  kaderPoints,
  onUpdateAspirasiStatus,
  onRefreshUsers,
  onSubmitAspirasi,
  onUpvoteAspirasi,
  onSubmitC1,
  onSubmitB1,
  onSubmitSurvey,
  onSaveDptVoter,
  onTriggerBlazt,
  onRegisterVoterField,
  onCheckinCoblos,
  onOpenQuickCountModal,
  onOpenUploadC1Modal,
  onOpenUploadB1Modal,
  onOpenWhatsAppBlaztModal,
  onOpenTambahNikModal,
  onOpenAiPilcaleg,
  onOpenDaftarVoterOcrModal,
  onSwitchAccount,
  onLogout,
  onOpenWebsite,
  userAccounts = [],
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onToggleUserStatus,
  timSuksesList = [],
  onSaveTimSukses,
  onSaveVoter,
  onResetDataToZero,
  onTriggerCloudSync,
  isSyncingCloud,
}) => {
  const isSuperAdmin = currentUser.role === 'super_admin';

  // Base 7 Modules for Admin
  const baseNavItems: {
    id: AdminModuleTab;
    label: string;
    number: string;
    icon: React.ElementType;
    badge?: string;
  }[] = [
    { id: 'beranda', label: 'Beranda', number: '01', icon: LayoutDashboard },
    { id: 'aspirasi', label: 'Aspirasi', number: '02', icon: MessageSquare, badge: `${aspirasiList.length}` },
    { id: 'peta_suara', label: 'Peta Suara', number: '03', icon: Compass },
    { id: 'tps', label: 'TPS dan Info', number: '04', icon: MapPin },
    { id: 'database_voters', label: 'Database Voters', number: '05', icon: Database, badge: `${voterOcrRecords.length}` },
    { id: 'command_center', label: 'Command Center', number: '06', icon: Radio },
    { id: 'operasi_lapangan', label: 'Operasi Lapangan', number: '07', icon: Users },
  ];

  // For Super Admin: exactly adds Modul 08 (Penambahan role atau user untuk akun Tim Sukses, dan Kader)
  const adminNavItems = isSuperAdmin
    ? [
        ...baseNavItems,
        {
          id: 'manajemen_user' as AdminModuleTab,
          label: 'Kelola Role & User',
          number: '08',
          icon: UserPlus,
          badge: `${userAccounts.length}`,
        },
      ]
    : baseNavItems;

  return (
    <div className="min-h-screen bg-slate-100/90 text-slate-800 flex flex-col">
      {/* Top Main Admin Navigation Bar (Header Putih) */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 text-slate-800 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
          {/* Brand & Module Indicator */}
          <div className="flex items-center gap-3">
            <SwarakuLogo variant="icon" size={32} />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black text-slate-900 tracking-tight">
                  SWARAKU
                </span>
                <span
                  className={`text-[10px] font-black tracking-wider uppercase px-2.5 py-0.5 rounded-full font-mono border ${
                    isSuperAdmin
                      ? 'bg-purple-50 text-purple-700 border-purple-200'
                      : 'bg-teal-50 text-teal-700 border-teal-200'
                  }`}
                >
                  {isSuperAdmin ? 'AKUN SUPER ADMIN' : 'AKUN ADMIN'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                {isSuperAdmin
                  ? 'Pusat Komando & Manajemen Role User Tim Sukses & Kader'
                  : 'Pusat Komando & Pengendalian Terpadu Sistem Pemenangan'}
              </p>
            </div>
          </div>

          {/* Center / Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Cloud Sync Real-Time Status & Trigger */}
            {onTriggerCloudSync && (
              <button
                type="button"
                onClick={onTriggerCloudSync}
                disabled={isSyncingCloud}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95 disabled:opacity-50"
                title="Sinkronkan database Cloud Firestore ke seluruh perangkat (HP & Laptop)"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${isSyncingCloud ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{isSyncingCloud ? 'Sinkron Cloud...' : 'Sinkron Cloud'}</span>
              </button>
            )}

            {/* AI PILCALEG Button (Fitur Khusus Admin & Tim Sukses) */}
            <button
              onClick={onOpenAiPilcaleg}
              className="px-3.5 py-1.5 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-sm shadow-teal-500/20 cursor-pointer transition-all active:scale-95 group"
              title="Buka AI Pilcaleg: Strategi & Narasi Politik Berdasarkan Geopolitik"
            >
              <Bot className="w-4 h-4 text-slate-950 group-hover:rotate-12 transition-transform" />
              <span className="hidden sm:inline">AI PILCALEG</span>
              <span className="sm:hidden font-mono text-[10px]">AI</span>
            </button>

            {/* Switch Account */}
            <button
              onClick={onSwitchAccount}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-200 transition-colors cursor-pointer"
              title="Ganti Akun / Pilih Role Lain"
            >
              <UserCheck className="w-3.5 h-3.5 text-cyan-600" />
              <span className="hidden md:inline">Ganti Akun</span>
            </button>

            {/* Kembali ke Website Button */}
            <button
              onClick={onOpenWebsite}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-200 transition-colors cursor-pointer"
              title="Kembali ke Halaman Website Resmi (swaraku.com)"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-teal-600" />
              <Globe className="w-3.5 h-3.5 text-teal-600" />
              <span className="hidden lg:inline">Website</span>
            </button>

            {/* Logout */}
            <button
              onClick={onLogout}
              className="p-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-500 rounded-xl border border-slate-200 transition-colors cursor-pointer"
              title="Keluar / Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 7 Menu Navigation Tabs Bar (Clean Light Background) */}
        <div className="bg-slate-50/90 border-t border-slate-200/80 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto flex items-center gap-1 overflow-x-auto no-scrollbar py-1.5">
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${isActive ? 'bg-black/20 text-teal-100' : 'bg-slate-200/80 text-slate-600'}`}>
                    {item.number}
                  </span>
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                        isActive ? 'bg-white text-slate-950 shadow-xs' : 'bg-slate-200 text-slate-700 border border-slate-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Content Area Rendering Exactly the Active 7 Modules */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6">
        {/* 1. Beranda Admin */}
        {activeTab === 'beranda' && (
          <div className="space-y-6">
            {/* Welcome & System Status Banner */}
            <div className="p-5 sm:p-7 bg-gradient-to-br from-slate-900 via-slate-900 to-teal-950 text-white rounded-3xl shadow-xl border border-teal-500/30 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-black uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-500/40 px-2.5 py-0.5 rounded-full font-mono">
                      SUPER ADMIN DASHBOARD
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      7 Modul Aktif &amp; Terhubung
                    </span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    Selamat Datang, {currentUser.nama}
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                    Akses kontrol utama sistem SWARAKU. Pantau pergerakan suara, verifikasi e-KTP DPT, analisis geospasial TPS, dan jalankan strategi kampanye berbasis AI.
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start md:self-auto">
                  <button
                    onClick={onOpenAiPilcaleg}
                    className="px-4 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-black rounded-2xl text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-teal-500/20 cursor-pointer transition-all active:scale-95"
                  >
                    <Bot className="w-4 h-4 text-slate-950" />
                    <span>Konsultasi AI PILCALEG</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Banner Khusus AI PILCALEG (Sesuai Permintaan User) */}
            <div
              onClick={onOpenAiPilcaleg}
              className="p-4 sm:p-5 bg-gradient-to-r from-teal-950 via-slate-900 to-cyan-950 text-white rounded-3xl border border-teal-500/40 shadow-lg cursor-pointer hover:border-teal-400 transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-teal-500/15 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center justify-between gap-4 relative z-10">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-500 to-cyan-400 text-slate-950 flex items-center justify-center font-black group-hover:scale-105 transition-transform shadow-md shrink-0">
                    <Bot className="w-6 h-6 text-slate-950" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-black text-teal-300 uppercase tracking-wider font-mono bg-teal-500/20 px-2 py-0.5 rounded-full border border-teal-500/40">
                        AI PILCALEG
                      </span>
                      <span className="text-[9px] font-bold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-500/30">
                        SIMCALEG INTELLIGENCE
                      </span>
                      <span className="text-[9px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full hidden sm:inline">
                        Khusus Admin &amp; Tim Sukses
                      </span>
                    </div>
                    <h3 className="text-sm sm:text-base font-extrabold text-white leading-tight">
                      AI Pilcaleg: Formulasi Strategi &amp; Narasi Politik Berdasarkan Geopolitik Wilayah
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-snug">
                      Fitur AI simcaleg memberikan informasi mulai dari strategi kampanye hingga narasi-narasi politik yang bisa digunakan oleh kandidat dalam proses kampanye berdasarkan geopolitik dalam suatu wilayah.
                    </p>
                  </div>
                </div>
                <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-teal-300 group-hover:bg-teal-500 group-hover:text-white transition-colors shrink-0">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Quick Metrics KPI Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-xs font-semibold">Total Voters Terverifikasi</span>
                  <Database className="w-4 h-4 text-cyan-600" />
                </div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
                  {voterOcrRecords.length.toLocaleString('id-ID')}
                </div>
                <span className="text-[10px] text-teal-700 font-medium">Melalui OCR e-KTP Relawan</span>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-xs font-semibold">Aspirasi Warga Masuk</span>
                  <MessageSquare className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
                  {aspirasiList.length}
                </div>
                <span className="text-[10px] text-indigo-700 font-medium">Tercatat di Sistem</span>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-xs font-semibold">Form C1 &amp; B1 Masuk</span>
                  <MapPin className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
                  {c1Records.length + b1Records.length} TPS
                </div>
                <span className="text-[10px] text-emerald-700 font-medium">Saksi Terverifikasi</span>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-xs font-semibold">Poin Relawan Aktif</span>
                  <Award className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
                  {kaderPoints} Poin
                </div>
                <span className="text-[10px] text-amber-700 font-medium">Aktivitas Operasi Lapangan</span>
              </div>
            </div>

            {/* Akses Cepat 6 Modul Lainnya */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-black uppercase tracking-wider text-slate-600 flex items-center gap-2">
                  <span>Navigasi Akses 7 Menu Modul Admin:</span>
                </h2>
                <span className="text-xs text-slate-400 font-medium">Klik untuk membuka modul</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {/* 2. Aspirasi */}
                <button
                  onClick={() => onTabChange('aspirasi')}
                  className="p-4 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 shadow-2xs text-left transition-all cursor-pointer group flex items-start justify-between"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-indigo-700 font-mono block">MODUL 02</span>
                      <h3 className="text-sm font-black text-slate-900">Aspirasi Warga</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Kelola keluhan, beri tanggapan resmi kandidat &amp; progres advokasi.
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                </button>

                {/* 3. Peta Suara */}
                <button
                  onClick={() => onTabChange('peta_suara')}
                  className="p-4 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 shadow-2xs text-left transition-all cursor-pointer group flex items-start justify-between"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Compass className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-teal-700 font-mono block">MODUL 03</span>
                      <h3 className="text-sm font-black text-slate-900">Peta Suara</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Monitoring geospasial lumbung suara, swing voters &amp; peta teritorial.
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-1 transition-all" />
                </button>

                {/* 4. TPS dan Info */}
                <button
                  onClick={() => onTabChange('tps')}
                  className="p-4 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 shadow-2xs text-left transition-all cursor-pointer group flex items-start justify-between"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-cyan-700 font-mono block">MODUL 04</span>
                      <h3 className="text-sm font-black text-slate-900">TPS dan Info</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Pencarian lokasi TPS, panduan saksi, &amp; unggah C1 Plano/B1 PPK.
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-600 group-hover:translate-x-1 transition-all" />
                </button>

                {/* 5. Database Voters */}
                <button
                  onClick={() => onTabChange('database_voters')}
                  className="p-4 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 shadow-2xs text-left transition-all cursor-pointer group flex items-start justify-between"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Database className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-700 font-mono block">MODUL 05</span>
                      <h3 className="text-sm font-black text-slate-900">Database Voters</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Pencarian NIK, filter per TPS/kelurahan, ekspor Excel &amp; audit OCR.
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-800 group-hover:translate-x-1 transition-all" />
                </button>

                {/* 6. Command Center */}
                <button
                  onClick={() => onTabChange('command_center')}
                  className="p-4 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 shadow-2xs text-left transition-all cursor-pointer group flex items-start justify-between"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Radio className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-emerald-700 font-mono block">MODUL 06</span>
                      <h3 className="text-sm font-black text-slate-900">Command Center</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        War room tabulasi suara, proyeksi kursi, quick count &amp; logistik pemilu.
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                </button>

                {/* 7. Operasi Lapangan */}
                <button
                  onClick={() => onTabChange('operasi_lapangan')}
                  className="p-4 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 shadow-2xs text-left transition-all cursor-pointer group flex items-start justify-between"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-amber-700 font-mono block">MODUL 07</span>
                      <h3 className="text-sm font-black text-slate-900">Operasi Lapangan</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Manajemen canvasser, koordinasi door-to-door, &amp; log aktivitas relawan.
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-all" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2. Aspirasi */}
        {activeTab === 'aspirasi' && (
          <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-indigo-700 font-mono uppercase">MODUL 02 ADMIN</span>
                <h2 className="text-lg font-black text-slate-900">Manajemen Aspirasi &amp; Advokasi Warga</h2>
              </div>
              <span className="text-xs text-slate-500 font-medium">{aspirasiList.length} aspirasi masuk</span>
            </div>
            <AspirasiScreen
              aspirasiList={aspirasiList}
              onSubmitAspirasi={onSubmitAspirasi}
              onUpvoteAspirasi={onUpvoteAspirasi}
            />
          </div>
        )}

        {/* 3. Peta Suara */}
        {activeTab === 'peta_suara' && (
          <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-teal-700 font-mono uppercase">MODUL 03 ADMIN</span>
                <h2 className="text-lg font-black text-slate-900">Peta Suara Geospasial &amp; Analisis Wilayah</h2>
              </div>
            </div>
            <MonitoringPetaSuaraScreen
              voterList={voterOcrRecords}
              dptList={dptList}
              timSuksesList={timSuksesList}
              currentUser={currentUser}
              onSaveTimSukses={onSaveTimSukses}
              onSaveVoter={onSaveVoter}
              onResetDataToZero={onResetDataToZero}
              onOpenWhatsAppBlazt={onOpenWhatsAppBlaztModal}
              onNavigateTab={(tab) => onTabChange(tab as AdminModuleTab)}
              onOpenTambahNikModal={onOpenTambahNikModal}
            />
          </div>
        )}

        {/* 4. TPS dan Info */}
        {activeTab === 'tps' && (
          <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-cyan-700 font-mono uppercase">MODUL 04 ADMIN</span>
                <h2 className="text-lg font-black text-slate-900">TPS dan Info Relawan Saksi</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenUploadC1Modal}
                  className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Unggah C1
                </button>
                <button
                  onClick={onOpenUploadB1Modal}
                  className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Unggah B1
                </button>
              </div>
            </div>
            <TpsFinderScreen
              profile={profile}
              onCheckinCoblos={onCheckinCoblos}
              onSubmitC1={onSubmitC1}
              onSubmitB1={onSubmitB1}
              onOpenQuickCount={onOpenQuickCountModal}
            />
          </div>
        )}

        {/* 5. Database Voters */}
        {activeTab === 'database_voters' && (
          <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-slate-700 font-mono uppercase">MODUL 05 ADMIN</span>
                <h2 className="text-lg font-black text-slate-900">Database Voters Terverifikasi &amp; Audit KTP OCR</h2>
              </div>
            </div>
            <DatabaseVotersView
              voterList={voterOcrRecords}
              onOpenDaftarVoterModal={onOpenDaftarVoterOcrModal}
              onTriggerCloudSync={onTriggerCloudSync}
              isSyncingCloud={isSyncingCloud}
            />
          </div>
        )}

        {/* 6. Command Center */}
        {activeTab === 'command_center' && (
          <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-emerald-700 font-mono uppercase">MODUL 06 ADMIN</span>
                <h2 className="text-lg font-black text-slate-900">Command Center War Room Pemenangan</h2>
              </div>
            </div>
            <CommandCenterView
              aspirasiList={aspirasiList}
              c1Records={c1Records}
              b1Records={b1Records}
              voterList={voterOcrRecords}
              onUpdateAspirasiStatus={onUpdateAspirasiStatus}
              surveyList={surveyList}
              dptList={dptList}
              onAddDptVoter={onSaveDptVoter}
              blaztLogs={blaztLogs}
              onTriggerBlazt={onTriggerBlazt}
              onSubmitC1={onSubmitC1}
              onSubmitB1={onSubmitB1}
              onSubmitSurvey={onSubmitSurvey}
              timSuksesList={timSuksesList}
              onSaveTimSukses={onSaveTimSukses}
              onSaveVoter={onSaveVoter}
              onResetDataToZero={onResetDataToZero}
            />
          </div>
        )}

        {/* 7. Operasi Lapangan */}
        {activeTab === 'operasi_lapangan' && (
          <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-amber-700 font-mono uppercase">MODUL 07 ADMIN</span>
                <h2 className="text-lg font-black text-slate-900">Operasi Lapangan, Canvassing &amp; Log Relawan</h2>
              </div>
            </div>
            <GroundOperationsView
              onRegisterVoter={onRegisterVoterField}
              kaderPoints={kaderPoints}
            />
          </div>
        )}

        {/* 8. Penambahan Role atau User untuk Akun Tim Sukses & Kader (Khusus Super Admin) */}
        {activeTab === 'manajemen_user' && isSuperAdmin && (
          <UserRoleManagementView
            userAccounts={userAccounts}
            currentUser={currentUser}
            onAddUser={onAddUser || (() => {})}
            onUpdateUser={onUpdateUser || (() => {})}
            onDeleteUser={onDeleteUser || (() => {})}
            onToggleUserStatus={onToggleUserStatus || (() => {})}
            onSaveTimSukses={onSaveTimSukses}
            onRefreshUsers={onRefreshUsers}
          />
        )}
      </main>
    </div>
  );
};
