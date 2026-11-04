import React, { useState } from 'react';
import {
  ShieldCheck,
  BarChart3,
  Database,
  Users,
  Smartphone,
  Send,
  MessageSquare,
  MapPin,
  PhoneCall,
  ArrowRight,
  FileText,
  Check,
  Calculator,
  HelpCircle,
  Download,
  ExternalLink,
  Layers,
  Activity,
  Target,
  Vote,
  Building2,
  UserCheck,
  ChevronRight,
  Copy,
  CheckCheck,
  Sparkles,
  Lock,
  Globe,
  Radio,
  FileCheck2,
  CheckCircle2,
  Zap,
  Cpu,
  Shield,
  Camera,
  Menu,
  X,
} from 'lucide-react';
import { APP_IMAGES } from '../../assets/images';
import { SwarakuLogo } from '../common/SwarakuLogo';

interface LandingWebsiteViewProps {
  onOpenApp: (preferredRole?: 'admin' | 'tim_sukses' | 'kader' | 'voter') => void;
  onOpenLoginModal?: () => void;
}

export interface InquiryFormData {
  nama: string;
  noHp: string;
  email: string;
  kontestasi: string;
  partai: string;
  dapil: string;
  estimasiDpt: string;
  catatan: string;
}

export const LandingWebsiteView: React.FC<LandingWebsiteViewProps> = ({
  onOpenApp,
  onOpenLoginModal,
}) => {
  // Inquiry Form State
  const [formData, setFormData] = useState<InquiryFormData>({
    nama: '',
    noHp: '',
    email: '',
    kontestasi: 'Paket Pro (Rp 250.000.000)',
    partai: '',
    dapil: '',
    estimasiDpt: '',
    catatan: '',
  });

  const [formSubmitted, setFormSubmitted] = useState(false);
  const [inquiryTicketId, setInquiryTicketId] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [proposalModalOpen, setProposalModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedPreviewImage, setSelectedPreviewImage] = useState<{
    url: string;
    title: string;
    desc: string;
    tag: string;
  } | null>(null);

  // Profile Section Interactive Tab
  const [activeProfileTab, setActiveProfileTab] = useState<'definisi' | 'pilar' | 'alur'>('definisi');

  // Calculator State
  const [calcLevel, setCalcLevel] = useState<'dprd_kota' | 'dprd_prov' | 'dpr_ri' | 'pilkada'>('dprd_kota');
  const [calcDptTotal, setCalcDptTotal] = useState<number>(240000);
  const [calcTargetKursi, setCalcTargetKursi] = useState<number>(1);
  const [calcSafetyMargin, setCalcSafetyMargin] = useState<number>(120); // 120% target pengaman

  // Calculation Math
  const bppEstimasi = calcLevel === 'dprd_kota' ? 22000 : calcLevel === 'dprd_prov' ? 65000 : calcLevel === 'dpr_ri' ? 140000 : 180000;
  const targetSuaraDasar = bppEstimasi * calcTargetKursi;
  const targetSuaraAman = Math.round((targetSuaraDasar * calcSafetyMargin) / 100);
  const rataRataPemilihPerTps = 275;
  const estimasiTotalTps = Math.round(calcDptTotal / rataRataPemilihPerTps);
  const kebutuhanSaksiUtama = estimasiTotalTps;
  const kebutuhanSaksiCadangan = Math.round(estimasiTotalTps * 0.25);
  const kebutuhanKaderLapangan = Math.max(15, Math.round(estimasiTotalTps * 1.5));
  const estimasiKontakWa = Math.round(targetSuaraAman * 0.85);

  const handleCalcLevelChange = (lvl: 'dprd_kota' | 'dprd_prov' | 'dpr_ri' | 'pilkada') => {
    setCalcLevel(lvl);
    if (lvl === 'dprd_kota') {
      setCalcDptTotal(240000);
      setCalcTargetKursi(1);
    } else if (lvl === 'dprd_prov') {
      setCalcDptTotal(650000);
      setCalcTargetKursi(1);
    } else if (lvl === 'dpr_ri') {
      setCalcDptTotal(1800000);
      setCalcTargetKursi(1);
    } else {
      setCalcDptTotal(950000);
      setCalcTargetKursi(1);
    }
  };

  // Form Submit Handler
  const handleInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama.trim() || !formData.noHp.trim()) {
      alert('Mohon lengkapi Nama dan Nomor WhatsApp aktif Anda.');
      return;
    }
    const ticket = `SWK-INQ-${Math.floor(100000 + Math.random() * 900000)}`;
    setInquiryTicketId(ticket);
    setFormSubmitted(true);
  };

  const handleCopyWebsiteLink = () => {
    const url = 'https://swaraku.com';
    navigator.clipboard?.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const generateWhatsAppMessage = () => {
    const text = `Halo Tim Konsultan SWARAKU,%0A%0ASaya ingin konsultasi sistem pemenangan & permintaan demo aplikasi SWARAKU:%0A- Nama: ${encodeURIComponent(formData.nama || 'Calon Kandidat')}%0A- No WhatsApp: ${encodeURIComponent(formData.noHp || '-')}%0A- Kontestasi: ${encodeURIComponent(formData.kontestasi)}%0A- Partai/Paslon: ${encodeURIComponent(formData.partai || '-')}%0A- Wilayah Dapil: ${encodeURIComponent(formData.dapil || '-')}%0A- Kebutuhan: ${encodeURIComponent(formData.catatan || 'Informasi paket layanan dan implementasi sistem')}%0A%0AMohon jadwal presentasi dan penawaran resmi. Terima kasih.`;
    return `https://wa.me/6287886717797?text=${text}`;
  };

  const scrollToSection = (id: string) => {
    const targetId = id === 'beranda' ? 'hero' : id;
    const el = document.getElementById(targetId) || document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-cyan-600 selection:text-white">
      {/* Primary Top Bar Contract */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Zone 1: Official Brand Logo & Subtitle with Generous Spacing */}
          <div className="flex items-center shrink-0">
            <a href="#hero" className="flex items-center gap-2.5 pr-2 sm:pr-4">
              <SwarakuLogo size={36} />
            </a>
            {/* Pembatas dengan jarak lega dari tulisan SWARAKU */}
            <div className="hidden xl:flex items-center pl-6 ml-6 2xl:pl-8 2xl:ml-8 border-l border-slate-300 py-0.5 max-w-[270px] 2xl:max-w-xs">
              <span className="text-[10px] 2xl:text-[11px] text-slate-500 font-semibold leading-snug tracking-tight">
                Sistem Wilayah Analisis Rekapitulasi Angka Kemenangan Utama
              </span>
            </div>
          </div>

          {/* Pembatas vertikal untuk layar lg (sebelum xl) */}
          <div className="hidden lg:block xl:hidden h-6 w-[2px] bg-slate-300/80 mx-6 shrink-0" aria-hidden="true" />

          {/* Zone 2: Navigation Links including Beranda with generous spacing */}
          <nav className="hidden lg:flex items-center gap-5 xl:gap-6 ml-4 lg:ml-6 text-sm font-medium text-slate-600">
            <button
              onClick={() => scrollToSection('beranda')}
              className="text-slate-800 hover:text-cyan-600 font-bold transition-colors cursor-pointer px-3 py-1.5 rounded-lg hover:bg-slate-100/60"
            >
              Beranda
            </button>
            <button
              onClick={() => scrollToSection('profil-swaraku')}
              className="text-cyan-800 hover:text-cyan-600 font-bold transition-colors cursor-pointer"
            >
              Profil SWARAKU
            </button>
            <button
              onClick={() => scrollToSection('fitur')}
              className="hover:text-cyan-700 transition-colors cursor-pointer"
            >
              Fitur Sistem
            </button>
            <button
              onClick={() => scrollToSection('komparasi')}
              className="hover:text-cyan-700 transition-colors cursor-pointer"
            >
              Keunggulan
            </button>
            <button
              onClick={() => scrollToSection('kalkulator')}
              className="hover:text-cyan-700 transition-colors cursor-pointer"
            >
              Kalkulator Suara
            </button>
            <button
              onClick={() => scrollToSection('paket')}
              className="hover:text-cyan-700 transition-colors cursor-pointer"
            >
              Paket Layanan
            </button>
            <button
              onClick={() => scrollToSection('faq')}
              className="hover:text-cyan-700 transition-colors cursor-pointer"
            >
              FAQ
            </button>
          </nav>

          {/* Zone 3: 1-2 primary actions & mobile menu button */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => scrollToSection('inquire')}
              className="px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer hidden sm:flex items-center gap-1.5"
            >
              <MessageSquare className="w-4 h-4 text-cyan-600" />
              <span>Inquire Product</span>
            </button>
            <button
              onClick={() => onOpenApp()}
              className="px-4 py-2 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 rounded-lg shadow-xs transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap active:scale-98"
            >
              <span>Live Demo App</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Mobile Hamburger Menu Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-700 hover:text-cyan-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              aria-label="Menu Navigasi"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-slate-200 px-4 py-3 space-y-1 shadow-lg animate-in fade-in slide-in-from-top-2 duration-150">
            <button
              onClick={() => {
                scrollToSection('beranda');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left py-2.5 px-3 text-sm font-bold text-cyan-900 bg-cyan-50/60 rounded-xl transition-colors flex items-center gap-2.5"
            >
              <span>🏠</span>
              <span>Beranda</span>
            </button>
            <button
              onClick={() => {
                scrollToSection('profil-swaraku');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left py-2.5 px-3 text-sm font-bold text-cyan-800 hover:bg-slate-50 rounded-xl transition-colors flex items-center gap-2.5"
            >
              <span>⭐</span>
              <span>Profil SWARAKU</span>
            </button>
            <button
              onClick={() => {
                scrollToSection('fitur');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left py-2.5 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-xl transition-colors flex items-center gap-2.5"
            >
              <span>⚡</span>
              <span>Fitur Sistem</span>
            </button>
            <button
              onClick={() => {
                scrollToSection('komparasi');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left py-2.5 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-xl transition-colors flex items-center gap-2.5"
            >
              <span>🏆</span>
              <span>Keunggulan</span>
            </button>
            <button
              onClick={() => {
                scrollToSection('kalkulator');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left py-2.5 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-xl transition-colors flex items-center gap-2.5"
            >
              <span>🧮</span>
              <span>Kalkulator Suara</span>
            </button>
            <button
              onClick={() => {
                scrollToSection('paket');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left py-2.5 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-xl transition-colors flex items-center gap-2.5"
            >
              <span>📦</span>
              <span>Paket Layanan</span>
            </button>
            <button
              onClick={() => {
                scrollToSection('faq');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left py-2.5 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-xl transition-colors flex items-center gap-2.5"
            >
              <span>❓</span>
              <span>FAQ</span>
            </button>
            <div className="pt-2 border-t border-slate-100 flex gap-2">
              <button
                onClick={() => {
                  scrollToSection('inquire');
                  setMobileMenuOpen(false);
                }}
                className="flex-1 py-2 text-center text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                Inquire Product
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenApp();
                }}
                className="flex-1 py-2 text-center text-xs font-bold text-white bg-cyan-700 hover:bg-cyan-800 rounded-lg"
              >
                Live Demo App
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section id="hero" className="relative pt-12 pb-20 md:pt-16 md:pb-28 overflow-hidden bg-gradient-to-b from-white via-cyan-50/20 to-slate-50 border-b border-slate-200">
        <div id="beranda" className="absolute -top-24 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Proposition */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-3 p-1.5 pr-4 bg-white border border-slate-200/90 rounded-2xl shadow-xs">
                <img
                  src={APP_IMAGES.swarakuOfficialLogo || '/images/swaraku_logo.png'}
                  alt="Official Logo SWARAKU"
                  className="w-10 h-10 object-contain rounded-xl bg-white border border-slate-100 p-0.5"
                />
                <div className="flex flex-col text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-slate-900 tracking-wider">SWARAKU INDONESIA</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  </div>
                  <span className="text-[10px] text-cyan-700 font-bold uppercase tracking-wider">
                    Sistem Pemenangan Caleg &amp; Pilkada Terlengkap
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold tracking-wide">
                <span className="text-cyan-700 font-bold">PLATFORM PEMENANGAN TERPADU</span>
                <span aria-hidden="true">&middot;</span>
                <span>CALEG &amp; PILKADA</span>
                <span aria-hidden="true">&middot;</span>
                <span>NASIONAL</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-[44px] font-extrabold text-slate-900 tracking-tight leading-[1.15] text-balance">
                Sistem Pemenangan Pemilu Digital Terlengkap untuk Menjamin Kemenangan Anda
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
                Tinggalkan pencatatan manual yang rentan kecurangan. SWARAKU menyatukan verifikasi DPT KPU, OCR KTP AI, WhatsApp Blazt massal terpersonalisasi, pemetaan suara GIS, hingga real count C1 Plano langsung dari TPS ke Command Center kandidat.
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  onClick={() => scrollToSection('inquire')}
                  className="px-7 py-3.5 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-bold text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Inquire Product &amp; Jadwalkan Demo</span>
                </button>
                <button
                  onClick={() => scrollToSection('profil-swaraku')}
                  className="px-5 py-3.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold text-sm rounded-xl shadow-2xs transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Pelajari Profil SWARAKU &darr;</span>
                </button>
              </div>

              {/* Quick Trust Indicators */}
              <div className="pt-4 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Sesuai Regulasi KPU &amp; UU PDP</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-cyan-600 shrink-0" />
                  <span>Tabulasi C1 Plano Akurat</span>
                </div>
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>Online &amp; Offline TPS Sync</span>
                </div>
              </div>
            </div>

            {/* Right Column: Visual Product Showcase Card */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xl overflow-hidden">
                {/* Real Screen Image Mockup (Login & Role Selection) */}
                <div
                  className="relative group cursor-pointer"
                  onClick={() =>
                    setSelectedPreviewImage({
                      url: APP_IMAGES.loginScreenMockup,
                      title: 'Layar Login & Pilihan Hak Akses Akun',
                      tag: 'Mobile App & PWA',
                      desc: 'Tampilan autentikasi multi-level SWARAKU dengan pembagian Akun 01 Tim Sukses dan Akun 02 Kader Lapangan.',
                    })
                  }
                >
                  <img
                    src={APP_IMAGES.loginScreenMockup}
                    alt="Bentuk Aplikasi SWARAKU - Layar Login"
                    className="w-full h-52 object-cover object-top border-b border-slate-100 group-hover:scale-102 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-3 left-3 bg-slate-950/85 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-md border border-white/10">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>Bentuk Aplikasi SWARAKU</span>
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-md backdrop-blur-xs">
                    Klik untuk memperbesar
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-600" />
                      <span className="text-xs font-bold text-slate-900">
                        Command Center &amp; Mobilisasi Pemilih
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-sm font-bold">
                      LIVE SYSTEM
                    </span>
                  </div>

                  {/* Dashboard Snapshot */}
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="text-[10px] text-slate-500 font-medium">Database Pemilih Valid</div>
                        <div className="text-lg font-black text-slate-900 font-mono tabular-nums">48.250 NIK</div>
                        <div className="text-[9px] text-emerald-600 font-semibold mt-0.5">Tervalidasi DPT KPU</div>
                      </div>
                      <div className="p-2.5 bg-cyan-50/60 rounded-xl border border-cyan-100">
                        <div className="text-[10px] text-cyan-800 font-medium">Target Kemenangan</div>
                        <div className="text-lg font-black text-cyan-900 font-mono tabular-nums">118,4%</div>
                        <div className="text-[9px] text-cyan-700 font-semibold mt-0.5">Margin Suara Aman</div>
                      </div>
                    </div>

                    {/* Modules quick preview items */}
                    <div className="space-y-1.5 pt-1">
                      <div className="p-2 bg-slate-50 rounded-lg flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Database className="w-3.5 h-3.5 text-cyan-600" />
                          <span className="font-medium text-slate-800 text-[11px]">Database DPT &amp; Auto Cek NIK</span>
                        </div>
                        <span className="text-emerald-700 font-semibold text-[10px]">Aktif</span>
                      </div>

                      <div className="p-2 bg-slate-50 rounded-lg flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Send className="w-3.5 h-3.5 text-teal-600" />
                          <span className="font-medium text-slate-800 text-[11px]">WhatsApp Blazt Personalisasi</span>
                        </div>
                        <span className="text-slate-600 text-[10px] font-mono tabular-nums">5.200 Terkirim</span>
                      </div>

                      <div className="p-2 bg-slate-50 rounded-lg flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Activity className="w-3.5 h-3.5 text-indigo-600" />
                          <span className="font-medium text-slate-800 text-[11px]">Real Count &amp; Audit C1 Plano</span>
                        </div>
                        <span className="text-cyan-700 font-semibold text-[10px]">89 TPS Terverifikasi</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Proof of Value Bar */}
      <section className="bg-white py-10 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tabular-nums">100%</div>
              <div className="text-xs sm:text-sm text-slate-500 mt-1">Data DPT KPU Terenkripsi</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tabular-nums">&lt; 3 Detik</div>
              <div className="text-xs sm:text-sm text-slate-500 mt-1">Kecepatan Auto Cek NIK</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tabular-nums">99.8%</div>
              <div className="text-xs sm:text-sm text-slate-500 mt-1">Akurasi Audit C1 Plano</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tabular-nums">24 / 7</div>
              <div className="text-xs sm:text-sm text-slate-500 mt-1">Monitoring Command Center</div>
            </div>
          </div>
        </div>
      </section>

      {/* Profil SWARAKU: Apa itu SWARAKU? */}
      <section id="profil-swaraku" className="py-20 md:py-28 bg-gradient-to-b from-white via-cyan-50/25 to-slate-50 border-b border-slate-200 relative overflow-hidden">
        {/* Subtle Background Ambience Glow */}
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 -right-32 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-cyan-100/70 text-cyan-800 rounded-full text-xs font-extrabold tracking-wider uppercase border border-cyan-200/80">
              <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
              <span>PROFIL RESMI PLATFORM</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
              Apa itu SWARAKU?
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              <strong>SWARAKU</strong> (Sistem Informasi Manajemen Pemenangan Pemilu &amp; Relawan Terpadu) adalah platform teknologi digital terintegrasi yang mentransformasi cara kerja kampanye tradisional menjadi operasi pemenangan modern berbasis data (*data-driven campaign*) yang terukur, presisi, dan transparan.
            </p>

            {/* Interactive Profile Tabs */}
            <div className="pt-2 flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={() => setActiveProfileTab('definisi')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeProfileTab === 'definisi'
                    ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-md shadow-teal-600/20'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                1. Pengenalan &amp; Definisi
              </button>
              <button
                type="button"
                onClick={() => setActiveProfileTab('pilar')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeProfileTab === 'pilar'
                    ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-md shadow-teal-600/20'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                2. 4 Pilar Keunggulan Sistem
              </button>
              <button
                type="button"
                onClick={() => setActiveProfileTab('alur')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeProfileTab === 'alur'
                    ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-md shadow-teal-600/20'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                3. Alur Kerja Digital Pemenangan
              </button>
            </div>
          </div>

          {/* Main Profile Grid: Visual Animated Emblem (Left) & Propositional Depth (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left: Animated Emblem Card with Official SWARAKU Logo & Soundwaves */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/90 relative overflow-hidden group">
                {/* Glowing Aura Animation */}
                <div className="absolute -top-16 -right-16 w-48 h-48 bg-cyan-500/15 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-700 pointer-events-none" />
                <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-teal-500/15 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-700 pointer-events-none" />

                {/* Central Logo Box with Animated Soundwave Rings */}
                <div className="flex flex-col items-center text-center relative z-10 space-y-4">
                  <div className="relative flex items-center justify-center p-3">
                    {/* Concentric Animated Pulse Ring */}
                    <div className="absolute inset-0 rounded-full bg-cyan-400/20 animate-ping opacity-40 pointer-events-none" />
                    <div className="absolute -inset-2 rounded-full border border-teal-500/30 animate-pulse pointer-events-none" />

                    {/* Official SWARAKU Logo */}
                    <div className="p-3 bg-white rounded-3xl shadow-lg border border-slate-100 flex items-center justify-center relative z-10">
                      <SwarakuLogo variant="full" size={88} showSubtitle={true} />
                    </div>
                  </div>

                  {/* Soundwave Simulation Graphic */}
                  <div className="space-y-1.5 w-full">
                    <div className="text-[10px] uppercase tracking-widest text-slate-400 font-mono font-bold">
                      Gema Aspirasi Suara Rakyat Terpadu
                    </div>
                    <div className="flex items-center justify-center gap-1 h-8">
                      <span className="w-1.5 bg-slate-400 rounded-full h-3 animate-pulse" />
                      <span className="w-1.5 bg-slate-400 rounded-full h-5 animate-pulse" style={{ animationDelay: '100ms' }} />
                      <span className="w-1.5 bg-cyan-500 rounded-full h-8 animate-pulse" style={{ animationDelay: '200ms' }} />
                      <span className="w-1.5 bg-cyan-600 rounded-full h-6 animate-pulse" style={{ animationDelay: '300ms' }} />
                      <span className="w-1.5 bg-teal-500 rounded-full h-8 animate-pulse" style={{ animationDelay: '400ms' }} />
                      <span className="w-1.5 bg-teal-600 rounded-full h-5 animate-pulse" style={{ animationDelay: '250ms' }} />
                      <span className="w-1.5 bg-slate-400 rounded-full h-3 animate-pulse" style={{ animationDelay: '150ms' }} />
                    </div>
                  </div>

                  {/* Badges Kontestasi Pemilu */}
                  <div className="flex flex-wrap justify-center gap-1.5 pt-1">
                    <span className="px-2.5 py-1 bg-slate-900 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider">
                      DPR RI
                    </span>
                    <span className="px-2.5 py-1 bg-cyan-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider">
                      DPRD PROVINSI
                    </span>
                    <span className="px-2.5 py-1 bg-teal-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider">
                      DPRD KAB/KOTA
                    </span>
                    <span className="px-2.5 py-1 bg-emerald-800 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider">
                      PILKADA
                    </span>
                  </div>

                  {/* Mini Stats Card */}
                  <div className="w-full grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 text-left">
                    <div className="p-2.5 bg-slate-50 rounded-xl">
                      <div className="text-[10px] text-slate-500 font-medium">Validasi Data KPU</div>
                      <div className="text-sm font-black text-slate-900 font-mono">100% Real DPT</div>
                      <div className="text-[9px] text-emerald-600 font-semibold mt-0.5">Zero Data Ganda</div>
                    </div>
                    <div className="p-2.5 bg-cyan-50/70 rounded-xl border border-cyan-100">
                      <div className="text-[10px] text-cyan-800 font-medium">Pengawalan Suara</div>
                      <div className="text-sm font-black text-cyan-950 font-mono">C1 &amp; B1 Plano</div>
                      <div className="text-[9px] text-cyan-700 font-semibold mt-0.5">Audit Foto TPS</div>
                    </div>
                  </div>

                  {/* Security Guarantee Pill */}
                  <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 font-medium pt-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Enkripsi 256-Bit • Database Terisolasi Tiap Caleg</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Detailed Narrative according to active tab */}
            <div className="lg:col-span-7 space-y-5">
              {/* TAB 1: Definisi & Pengenalan */}
              {activeProfileTab === 'definisi' && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-sm space-y-3">
                    <div className="flex items-center gap-2 text-cyan-900">
                      <Building2 className="w-5 h-5 text-cyan-700" />
                      <h3 className="text-lg font-black tracking-tight text-slate-900">
                        Platform Pemenangan End-to-End untuk Kandidat Modern
                      </h3>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      <strong>SWARAKU</strong> dirancang untuk menyelesaikan masalah terbesar dalam kampanye pemilu: ketidakpastian data konstituen, klaim sepihak tim lapangan, dan risiko manipulasi suara saat rekapitulasi.
                    </p>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Dengan SWARAKU, kandidat dan pimpinan tim pemenangan memegang kendali penuh atas pergerakan relawan, persebaran kantong suara, elektabilitas berkala, hingga dokumentasi formulir C1 Plano langsung dari bilik TPS.
                    </p>
                  </div>

                  {/* 3 Core Highlights */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-1.5">
                      <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center mb-1">
                        <Camera className="w-4 h-4" />
                      </div>
                      <h4 className="font-extrabold text-slate-900 text-xs">AI OCR e-KTP Warga</h4>
                      <p className="text-[11px] text-slate-500 leading-normal">
                        Kader cukup memotret KTP fisik; data NIK, nama, dan alamat langsung terbaca otomatis dalam 2 detik.
                      </p>
                    </div>

                    <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-1.5">
                      <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center mb-1">
                        <Send className="w-4 h-4" />
                      </div>
                      <h4 className="font-extrabold text-slate-900 text-xs">WhatsApp Blazt Terarah</h4>
                      <p className="text-[11px] text-slate-500 leading-normal">
                        Broadcast pesan personal kepada ribuan konstituen dan instruksi serentak ke seluruh saksi TPS.
                      </p>
                    </div>

                    <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-1.5">
                      <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center mb-1">
                        <BarChart3 className="w-4 h-4" />
                      </div>
                      <h4 className="font-extrabold text-slate-900 text-xs">Real Count C1 &amp; B1</h4>
                      <p className="text-[11px] text-slate-500 leading-normal">
                        Hasil tabulasi suara terunggah saat itu juga dari TPS lengkap dengan bukti foto asli formulir Plano.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: 4 Pilar Keunggulan Sistem */}
              {activeProfileTab === 'pilar' && (
                <div className="space-y-3 animate-in fade-in duration-300">
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-teal-500 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
                      01
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">
                        Presisi Data Konstituen (Zero Data Fiktif)
                      </h4>
                      <p className="text-xs text-slate-600 leading-relaxed mt-0.5">
                        Memvalidasi setiap NIK pemilih langsung ke database resmi DPT KPU. Mencegah tim relawan menyetorkan data ganda atau data fiktif yang merugikan anggaran kandidat.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-cyan-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
                      02
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">
                        AI Pilcaleg &amp; Analisis Geopolitik Wilayah
                      </h4>
                      <p className="text-xs text-slate-600 leading-relaxed mt-0.5">
                        Kecerdasan buatan memberikan analisis isu wilayah di tiap kecamatan dan merekomendasikan narasi politik yang relevan dengan kebutuhan pemilih lokal.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
                      03
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">
                        Orkestrasi Multi-User (Admin, Tim Sukses, Kader)
                      </h4>
                      <p className="text-xs text-slate-600 leading-relaxed mt-0.5">
                        Bilah komando terstruktur: Akun Admin mengendalikan 7 modul penuh, Tim Sukses mengelola database pemilih &amp; broadcast, sedangkan Kader Lapangan fokus merekrut pemilih di TPS.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
                      04
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">
                        Benteng Hukum &amp; Real Count C1 &amp; B1 Anti-Kecurangan
                      </h4>
                      <p className="text-xs text-slate-600 leading-relaxed mt-0.5">
                        Arsip foto C1 Plano dan Form B1 tersimpan aman di cloud sebagai bukti fisik autentik saat rekapitulasi PPK tingkat kecamatan dan persidangan sengketa pemilu di MK.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: Alur Kerja Digital Pemenangan */}
              {activeProfileTab === 'alur' && (
                <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-sm space-y-4 animate-in fade-in duration-300">
                  <div className="flex items-center gap-2 text-cyan-900 pb-2 border-b border-slate-100">
                    <Activity className="w-5 h-5 text-teal-600" />
                    <h3 className="text-base font-extrabold text-slate-900">
                      Siklus 4 Fase Pemenangan Bersama SWARAKU
                    </h3>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                      <span className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                        1
                      </span>
                      <div>
                        <strong className="text-slate-900 block text-xs">Fase 1: Setup Sistem &amp; Struktur Komando</strong>
                        <p className="text-slate-500 mt-0.5">
                          Konfigurasi wilayah Dapil, import data DPT KPU resmi, serta penugasan akun Admin dan Tim Sukses pusat.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                      <span className="w-6 h-6 rounded-full bg-cyan-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                        2
                      </span>
                      <div>
                        <strong className="text-slate-900 block text-xs">Fase 2: Akuisisi Konstituen &amp; Validasi NIK</strong>
                        <p className="text-slate-500 mt-0.5">
                          Relawan bergerak door-to-door dengan aplikasi mobile, scan fisik KTP dengan AI OCR, dan validasi lokasi TPS pemilih.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                      <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                        3
                      </span>
                      <div>
                        <strong className="text-slate-900 block text-xs">Fase 3: Mobilisasi &amp; Broadcast WhatsApp Blazt</strong>
                        <p className="text-slate-500 mt-0.5">
                          Pengiriman pesan kampanye terarah berbasis geopolitik, undangan pencoblosan, dan pengarahan saksi di tiap TPS.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                      <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                        4
                      </span>
                      <div>
                        <strong className="text-slate-900 block text-xs">Fase 4: Hari-H Pencoblosan &amp; Pengawalan Suara C1/B1</strong>
                        <p className="text-slate-500 mt-0.5">
                          Saksi TPS memotret lembar C1 Plano dan Form B1 setelah rekapitulasi, data masuk secara *live* ke Command Center pimpinan.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Call to Action Row */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  type="button"
                  onClick={() => onOpenApp()}
                  className="px-6 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
                >
                  <span>Coba Live Demo Aplikasi SWARAKU</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection('inquire')}
                  className="px-5 py-3 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold text-xs sm:text-sm rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-2xs"
                >
                  <MessageSquare className="w-4 h-4 text-cyan-700" />
                  <span>Jadwalkan Presentasi &amp; Penawaran</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem vs Solution (Metode Konvensional vs SWARAKU) */}
      <section id="komparasi" className="py-16 md:py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <div className="text-xs text-cyan-700 font-bold tracking-wider">KOMPARASI STRATEGIS</div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Mengapa Tim Pemenangan Modern Beralih ke SWARAKU?
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              Menghilangkan kebocoran anggaran, saksi fiktif, dan rekap suara terlambat dengan sistem digital terpusat.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Metode Konvensional */}
            <div className="bg-white p-7 rounded-2xl border border-rose-200/80 shadow-xs space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-rose-100">
                <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-sm">
                  &times;
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Metode Kampanye Konvensional</h3>
                  <p className="text-xs text-rose-700">Manual, rentan manipulasi &amp; boros biaya</p>
                </div>
              </div>

              <ul className="space-y-3.5 text-xs sm:text-sm text-slate-600">
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-500 font-bold shrink-0 mt-0.5">&times;</span>
                  <span><strong>Data pemilih di Excel terpisah:</strong> NIK sering ganda, banyak pemilih fiktif yang tidak terdaftar di DPT KPU.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-500 font-bold shrink-0 mt-0.5">&times;</span>
                  <span><strong>Kader &amp; saksi sulit diawasi:</strong> Klaim pertemuan lapangan tidak bisa dibuktikan secara koordinat GPS nyata.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-500 font-bold shrink-0 mt-0.5">&times;</span>
                  <span><strong>Broadcast WA manual terblokir:</strong> Mengirim pesan satu persatu memakan waktu atau langsung kena suspend WhatsApp.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-500 font-bold shrink-0 mt-0.5">&times;</span>
                  <span><strong>Rekap C1 terlambat berhari-hari:</strong> Kertas C1 hilang di jalan, manipulasi suara di tingkat kecamatan tidak terpantau.</span>
                </li>
              </ul>
            </div>

            {/* Solusi SWARAKU */}
            <div className="bg-white p-7 rounded-2xl border-2 border-cyan-600 shadow-md space-y-5 relative">
              <div className="absolute top-4 right-4 bg-cyan-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Direkomendasikan
              </div>

              <div className="flex items-center gap-3 pb-3 border-b border-cyan-100">
                <div className="w-8 h-8 rounded-lg bg-cyan-100 text-cyan-800 flex items-center justify-center font-bold text-sm">
                  ✓
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Platform Sistem SWARAKU</h3>
                  <p className="text-xs text-cyan-700">Tervalidasi, real-time, geotagged &amp; aman</p>
                </div>
              </div>

              <ul className="space-y-3.5 text-xs sm:text-sm text-slate-700">
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Validasi DPT &amp; OCR KTP:</strong> NIK dicek instan, langsung dipetakan ke nomor TPS resmi KPU di kelurahan terkait.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Geotagging &amp; Pelacakan Saksi TPS:</strong> Saksi mengunggah konfirmasi kehadiran di TPS dengan foto dan lokasi GPS akurat.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>WhatsApp Blazt Cerdas Multi-Session:</strong> Personalisasi sapaan pemilih berdasarkan nama dan lokasi TPS tanpa resiko banned.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Real Count C1 Plano Langsung:</strong> Foto formulir C1 diunggah pada hari H pukul 13.00, tabulasi suara terbit dalam hitungan menit.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Showcase (Bento Grid) */}
      <section id="fitur" className="py-16 md:py-24 bg-white border-t border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <div className="text-xs text-cyan-700 font-bold tracking-wider">FITUR UNGGULAN APLIKASI</div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              7 Modul Utama Pemenangan Terpadu SWARAKU
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              Semua modul yang Anda butuhkan dirancang khusus untuk memenangkan kontestasi legislatif dan pilkada di Indonesia.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 hover:border-cyan-300 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-cyan-100 text-cyan-800 flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">01. Database DPT &amp; Auto Cek NIK</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Sinkronisasi jutaan data DPT KPU per Dapil. Verifikasi keabsahan NIK 16 digit, sebaran TPS, dan status keterdaftaran pemilih dalam sekejap.
              </p>
              <div className="pt-2 text-xs text-cyan-700 font-semibold flex items-center gap-1">
                <span>Filter usia, gender, TPS</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Feature 2 */}
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 hover:border-cyan-300 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center">
                <UserCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">02. Pendaftaran Pemilih OCR Foto KTP</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Kader lapangan cukup memotret e-KTP warga. Kecerdasan OCR membaca nama, NIK, alamat RT/RW secara otomatis tanpa perlu mengetik manual.
              </p>
              <div className="pt-2 text-xs text-teal-700 font-semibold flex items-center gap-1">
                <span>Ekstrak OCR + Geotag GPS</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Feature 3 */}
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 hover:border-cyan-300 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <Send className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">03. WhatsApp Blazt Multi-Device</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Kirim pesan ajakan mencoblos, info nomor TPS, dan program kerja secara personal: <em>"Halo Bpk. Budi, jangan lupa ke TPS 047 Sukamaju..."</em>
              </p>
              <div className="pt-2 text-xs text-emerald-700 font-semibold flex items-center gap-1">
                <span>Anti-Blokir &amp; Jadwal Otomatis</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Feature 4 */}
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 hover:border-cyan-300 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">04. Real Count C1 Plano &amp; B1 Kecamatan</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Foto formulir C1 Plano dari saksi di TPS langsung diaudit tim verifikasi. Suara sah, tidak sah, dan perolehan suara paslon terkumpul transparan.
              </p>
              <div className="pt-2 text-xs text-indigo-700 font-semibold flex items-center gap-1">
                <span>Bukti otentik formulir C1</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Feature 5 */}
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 hover:border-cyan-300 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">05. Peta Geospasial Suara (GIS)</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Visualisasi pemetaan kekuatan suara per desa/kelurahan: Zona Hijau (Basis Kuat), Zona Kuning (Swing Voters), dan Zona Merah (Perlu Penetrasi).
              </p>
              <div className="pt-2 text-xs text-amber-700 font-semibold flex items-center gap-1">
                <span>Analisis titik lemah lawan</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Feature 6 */}
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 hover:border-cyan-300 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center">
                <Smartphone className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">06. Aplikasi Pemilih &amp; Kader (PWA)</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Aplikasi ringan yang bisa diinstall di Android &amp; iOS tanpa perlu antre di PlayStore. Dilengkapi gamifikasi misi relawan, serap aspirasi, dan cek TPS.
              </p>
              <div className="pt-2 text-xs text-rose-700 font-semibold flex items-center gap-1">
                <span>Dukungan mode offline</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          {/* Feature 7 - Full Width Callout */}
          <div className="mt-8 p-7 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl flex flex-col lg:flex-row items-center justify-between gap-6 shadow-md">
            <div className="space-y-2">
              <div className="text-xs text-cyan-400 font-bold uppercase tracking-wider">
                07. Executive Command Center
              </div>
              <h3 className="text-xl sm:text-2xl font-bold">
                Dashboard Strategis Khusus Caleg &amp; Kepala Tim Sukses
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
                Pantau pergerakan elektabilitas harian, evaluasi kinerja kader per kecamatan, monitor serapan dana kampanye, dan ekspor laporan ke format Excel/PDF untuk evaluasi berkala.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-cyan-900/60 text-cyan-300 font-semibold px-3 py-1.5 rounded-lg border border-cyan-700/50">
                Akses Khusus Caleg &amp; Kepala Timses
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Calculator Section */}
      <section id="kalkulator" className="py-16 md:py-24 bg-white border-t border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
            <div className="text-xs text-cyan-700 font-bold tracking-wider">SIMULATOR PEMENANGAN</div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Kalkulator Kebutuhan Suara &amp; Saksi TPS
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              Hitung estimasi target suara aman, jumlah saksi TPS, kebutuhan relawan kader, dan sasaran broadcast di Dapil Anda.
            </p>
          </div>

          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 md:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Inputs */}
              <div className="lg:col-span-6 space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    1. Tingkat Kontestasi Pemilu:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => handleCalcLevelChange('dprd_kota')}
                      className={`py-2 px-3 text-xs font-bold rounded-lg border transition-colors cursor-pointer ${
                        calcLevel === 'dprd_kota'
                          ? 'bg-cyan-700 text-white border-cyan-700'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      DPRD Kab/Kota
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCalcLevelChange('dprd_prov')}
                      className={`py-2 px-3 text-xs font-bold rounded-lg border transition-colors cursor-pointer ${
                        calcLevel === 'dprd_prov'
                          ? 'bg-cyan-700 text-white border-cyan-700'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      DPRD Provinsi
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCalcLevelChange('dpr_ri')}
                      className={`py-2 px-3 text-xs font-bold rounded-lg border transition-colors cursor-pointer ${
                        calcLevel === 'dpr_ri'
                          ? 'bg-cyan-700 text-white border-cyan-700'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      DPR RI
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCalcLevelChange('pilkada')}
                      className={`py-2 px-3 text-xs font-bold rounded-lg border transition-colors cursor-pointer ${
                        calcLevel === 'pilkada'
                          ? 'bg-cyan-700 text-white border-cyan-700'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      Pilkada Paslon
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      2. Total DPT di Wilayah Dapil:
                    </label>
                    <span className="text-xs font-mono font-bold text-slate-900">
                      {calcDptTotal.toLocaleString('id-ID')} Pemilih
                    </span>
                  </div>
                  <input
                    type="range"
                    min={50000}
                    max={2500000}
                    step={25000}
                    value={calcDptTotal}
                    onChange={(e) => setCalcDptTotal(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-cyan-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                    <span>50.000</span>
                    <span>1.250.000</span>
                    <span>2.500.000 DPT</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      3. Target Perolehan Kursi:
                    </label>
                    <select
                      value={calcTargetKursi}
                      onChange={(e) => setCalcTargetKursi(Number(e.target.value))}
                      className="w-full py-2 px-3 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800"
                    >
                      <option value={1}>1 Kursi Aman</option>
                      <option value={2}>2 Kursi Target</option>
                      <option value={3}>3 Kursi Fraksi</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      4. Safety Margin Suara:
                    </label>
                    <select
                      value={calcSafetyMargin}
                      onChange={(e) => setCalcSafetyMargin(Number(e.target.value))}
                      className="w-full py-2 px-3 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800"
                    >
                      <option value={110}>110% (Margin Tipis)</option>
                      <option value={120}>120% (Margin Direkomendasikan)</option>
                      <option value={135}>135% (Margin Kemenangan Mutlak)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Outputs */}
              <div className="lg:col-span-6 bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-cyan-600" />
                    <span className="font-bold text-slate-900 text-sm">Hasil Rekomendasi Mesin Suara</span>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-sm">
                    Safety Margin {calcSafetyMargin}%
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-cyan-50/60 rounded-xl border border-cyan-100">
                    <div className="text-[11px] text-cyan-800 font-semibold">Target Suara Aman</div>
                    <div className="text-xl sm:text-2xl font-black text-cyan-950 font-mono tabular-nums">
                      {targetSuaraAman.toLocaleString('id-ID')}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Suara Sah Pemilih</div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="text-[11px] text-slate-600 font-semibold">Estimasi Total TPS</div>
                    <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono tabular-nums">
                      {estimasiTotalTps.toLocaleString('id-ID')} TPS
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">@ ~275 DPT / TPS</div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="text-[11px] text-slate-600 font-semibold">Kebutuhan Saksi TPS</div>
                    <div className="text-lg font-bold text-slate-900 font-mono tabular-nums">
                      {kebutuhanSaksiUtama.toLocaleString('id-ID')} Orang
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">+ {kebutuhanSaksiCadangan} Cadangan</div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="text-[11px] text-slate-600 font-semibold">Target Relawan Kader</div>
                    <div className="text-lg font-bold text-slate-900 font-mono tabular-nums">
                      {kebutuhanKaderLapangan.toLocaleString('id-ID')} Orang
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Akuisisi KTP Lapangan</div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        kontestasi:
                          calcLevel === 'dprd_kota'
                            ? 'DPRD Kabupaten/Kota'
                            : calcLevel === 'dprd_prov'
                            ? 'DPRD Provinsi'
                            : calcLevel === 'dpr_ri'
                            ? 'DPR RI'
                            : 'Pilkada Bupati/Walikota',
                        estimasiDpt: `${calcDptTotal.toLocaleString('id-ID')} Pemilih (${estimasiTotalTps} TPS)`,
                      }));
                      scrollToSection('inquire');
                    }}
                    className="w-full py-2.5 bg-cyan-700 hover:bg-cyan-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>Inquire Sistem Berdasarkan Kalkulasi Ini</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing / Service Packages */}
      <section id="paket" className="py-16 md:py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <div className="text-xs text-cyan-700 font-bold tracking-wider">PAKET &amp; INVESTASI LAYANAN</div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Pilihan Paket Layanan Sesuai Tingkat Kontestasi
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              Transparansi fitur, dukungan tim konsultan teknis, dan implementasi siap pakai hingga hari pencoblosan selesai.
            </p>
          </div>

          {/* 3 Main Package Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
            {/* Paket 1: Starter */}
            <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-xs space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">
                    Dapil Kecil
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">12 Bulan Kontrak</span>
                </div>

                <div>
                  <h3 className="text-2xl font-black text-slate-900">Starter</h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-3xl font-black text-slate-900 font-mono">Rp 150.000.000</span>
                    <span className="text-xs text-slate-500 font-medium">/ 12 bulan</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 leading-relaxed">
                  <strong>Ringkasan:</strong> Paket dasar: survei online, monitoring peta sampai kecamatan, relawan terbatas, dukungan email.
                </div>

                <div className="text-xs text-slate-700">
                  <span className="font-bold text-slate-900 block mb-1">Sasaran Pengguna:</span>
                  <span className="text-slate-600">Caleg DPRD kab/kota dengan dapil kecil</span>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-2.5 text-xs text-slate-700">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Akun Relawan:</span>
                    <span className="font-bold text-slate-900 font-mono">20 akun</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">WhatsApp Blast:</span>
                    <span className="font-semibold text-slate-600">Tidak termasuk (top-up)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Survei Online:</span>
                    <span className="font-semibold text-slate-900">1 survei per bulan</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Peta Suara:</span>
                    <span className="font-semibold text-slate-900">Sampai kecamatan</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Rekap C1:</span>
                    <span className="font-semibold text-slate-400">Tidak termasuk</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Storage &amp; SLA:</span>
                    <span className="font-semibold text-slate-900">20 GB • Best effort</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Kanal Dukungan:</span>
                    <span className="font-semibold text-slate-700">Email, jam kerja</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setFormData((prev) => ({ ...prev, kontestasi: 'Paket Starter (Rp 150.000.000)' }));
                  scrollToSection('inquire');
                }}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Inquire Paket Starter (Rp 150 Jt)
              </button>
            </div>

            {/* Paket 2: Pro (Paling Diminati) */}
            <div className="bg-white p-7 rounded-2xl border-2 border-cyan-600 shadow-xl space-y-6 flex flex-col justify-between relative">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white text-[10px] font-black px-3.5 py-1 rounded-full uppercase tracking-wider shadow-md">
                Paling Diminati • Rekomendasi Utama
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-md bg-cyan-100 text-cyan-900">
                    Provinsi &amp; DPR RI
                  </span>
                  <span className="text-xs text-cyan-700 font-bold">12 Bulan Kontrak</span>
                </div>

                <div>
                  <h3 className="text-2xl font-black text-slate-900">Pro</h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-3xl font-black text-cyan-800 font-mono">Rp 250.000.000</span>
                    <span className="text-xs text-slate-500 font-medium">/ 12 bulan</span>
                  </div>
                </div>

                <div className="p-3 bg-cyan-50/70 rounded-xl border border-cyan-100 text-xs text-slate-700 leading-relaxed">
                  <strong>Ringkasan:</strong> Paket standar: survei tanpa batas, peta sampai desa, rekap C1 saat Hari H, dukungan WhatsApp.
                </div>

                <div className="text-xs text-slate-700">
                  <span className="font-bold text-slate-900 block mb-1">Sasaran Pengguna:</span>
                  <span className="text-slate-600">Caleg DPRD provinsi, DPR RI, calon bupati/walikota</span>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-2.5 text-xs text-slate-700">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Akun Relawan:</span>
                    <span className="font-bold text-cyan-800 font-mono">100 akun</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">WhatsApp Blast:</span>
                    <span className="font-bold text-emerald-700">2.000 pesan</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Survei Online:</span>
                    <span className="font-bold text-slate-900">Tanpa batas</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Peta Suara:</span>
                    <span className="font-semibold text-slate-900">Sampai kecamatan &amp; desa</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Rekap C1:</span>
                    <span className="font-bold text-emerald-700">Saat Hari H</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Storage &amp; SLA:</span>
                    <span className="font-semibold text-slate-900">50 GB • SLA 99%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Kanal Dukungan:</span>
                    <span className="font-semibold text-slate-700">WhatsApp, jam kerja</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setFormData((prev) => ({ ...prev, kontestasi: 'Paket Pro (Rp 250.000.000)' }));
                  scrollToSection('inquire');
                }}
                className="w-full py-3 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer active:scale-98"
              >
                Inquire Paket Pro (Rp 250 Jt)
              </button>
            </div>

            {/* Paket 3: Enterprise */}
            <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-xs space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-md bg-slate-900 text-white">
                    Pilkada &amp; Multi-Wilayah
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">12 Bulan Kontrak</span>
                </div>

                <div>
                  <h3 className="text-2xl font-black text-slate-900">Enterprise</h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-3xl font-black text-slate-900 font-mono">Rp 300.000.000</span>
                    <span className="text-xs text-slate-500 font-medium">/ 12 bulan</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 leading-relaxed">
                  <strong>Ringkasan:</strong> Paket lengkap: peta sampai data TPS, war room Hari H, dukungan telepon prioritas, SLA 99,5%.
                </div>

                <div className="text-xs text-slate-700">
                  <span className="font-bold text-slate-900 block mb-1">Sasaran Pengguna:</span>
                  <span className="text-slate-600">Calon gubernur, partai, tim multi-wilayah</span>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-2.5 text-xs text-slate-700">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Akun Relawan:</span>
                    <span className="font-bold text-slate-900 font-mono">300 akun</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">WhatsApp Blast:</span>
                    <span className="font-bold text-emerald-700">5.000 pesan</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Survei Online:</span>
                    <span className="font-bold text-slate-900">Tanpa batas + sampling khusus</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Peta Suara:</span>
                    <span className="font-semibold text-slate-900">Sampai kec, desa &amp; TPS</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Rekap C1:</span>
                    <span className="font-bold text-indigo-700">Dengan war room 3 hari</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Storage &amp; SLA:</span>
                    <span className="font-semibold text-slate-900">100 GB • SLA 99,5%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Kanal Dukungan:</span>
                    <span className="font-semibold text-slate-900">WA &amp; telepon, prioritas</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setFormData((prev) => ({ ...prev, kontestasi: 'Paket Enterprise (Rp 300.000.000)' }));
                  scrollToSection('inquire');
                }}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Inquire Paket Enterprise (Rp 300 Jt)
              </button>
            </div>
          </div>

          {/* Full Comparison Table - Sesuai Informasi pada Gambar */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden">
            <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-cyan-950 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                  <Layers className="w-5 h-5 text-cyan-400" />
                  <span>Matriks Komparasi Fitur &amp; Spesifikasi Paket Lengkap</span>
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Tabel rincian fitur 14 aspek layanan SWARAKU sesuai tingkat kontestasi politik
                </p>
              </div>
              <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 rounded-full text-xs font-bold self-start sm:self-auto">
                Resmi SWARAKU 2026
              </span>
            </div>

            {/* Table Horizontal Scroll Wrapper */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-800 text-white border-b border-slate-700">
                    <th className="py-3.5 px-4 font-extrabold w-1/4 min-w-[180px] bg-slate-900/90">
                      Aspek
                    </th>
                    <th className="py-3.5 px-4 font-extrabold w-1/4 min-w-[220px] bg-cyan-950/80 text-cyan-200">
                      Starter
                    </th>
                    <th className="py-3.5 px-4 font-extrabold w-1/4 min-w-[240px] bg-cyan-900 text-white">
                      Pro (Paling Diminati)
                    </th>
                    <th className="py-3.5 px-4 font-extrabold w-1/4 min-w-[240px] bg-slate-900 text-amber-200">
                      Enterprise
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700">
                  {/* Row 1: Ringkasan */}
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 bg-slate-50/50">
                      Ringkasan
                    </td>
                    <td className="py-3.5 px-4 leading-relaxed">
                      Paket dasar: survei online, monitoring peta sampai kecamatan, relawan terbatas, dukungan email.
                    </td>
                    <td className="py-3.5 px-4 leading-relaxed bg-cyan-50/30 font-medium text-slate-900">
                      Paket standar: survei tanpa batas, peta sampai desa, rekap C1 saat Hari H, dukungan WhatsApp.
                    </td>
                    <td className="py-3.5 px-4 leading-relaxed">
                      Paket lengkap: peta sampai data TPS, war room Hari H, dukungan telepon prioritas, SLA 99,5%.
                    </td>
                  </tr>

                  {/* Row 2: Harga */}
                  <tr className="hover:bg-slate-50/80 transition-colors bg-slate-50/30">
                    <td className="py-3.5 px-4 font-bold text-slate-900 bg-slate-50/50">
                      Harga caleg DPRD kab/kota (12 bulan)
                    </td>
                    <td className="py-3.5 px-4 font-black text-slate-900 font-mono text-sm">
                      Rp 150.000.000
                    </td>
                    <td className="py-3.5 px-4 font-black text-cyan-800 font-mono text-sm bg-cyan-50/50">
                      Rp 250.000.000
                    </td>
                    <td className="py-3.5 px-4 font-black text-slate-900 font-mono text-sm">
                      Rp 300.000.000
                    </td>
                  </tr>

                  {/* Row 3: Sasaran pengguna */}
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 bg-slate-50/50">
                      Sasaran pengguna
                    </td>
                    <td className="py-3.5 px-4">
                      Caleg DPRD kab/kota dengan dapil kecil
                    </td>
                    <td className="py-3.5 px-4 bg-cyan-50/30 font-semibold text-slate-900">
                      Caleg DPRD provinsi, DPR RI, calon bupati/walikota
                    </td>
                    <td className="py-3.5 px-4">
                      Calon gubernur, partai, tim multi-wilayah
                    </td>
                  </tr>

                  {/* Row 4: Akun relawan */}
                  <tr className="hover:bg-slate-50/80 transition-colors bg-slate-50/30">
                    <td className="py-3.5 px-4 font-bold text-slate-900 bg-slate-50/50">
                      Akun relawan
                    </td>
                    <td className="py-3.5 px-4 font-bold font-mono text-slate-800">
                      20 akun
                    </td>
                    <td className="py-3.5 px-4 font-bold font-mono text-cyan-900 bg-cyan-50/50">
                      100 akun
                    </td>
                    <td className="py-3.5 px-4 font-bold font-mono text-slate-900">
                      300 akun
                    </td>
                  </tr>

                  {/* Row 5: WhatsApp blast */}
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 bg-slate-50/50">
                      WhatsApp blast termasuk
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 italic">
                      Tidak termasuk (top-up)
                    </td>
                    <td className="py-3.5 px-4 bg-cyan-50/30 font-bold text-emerald-700">
                      2.000 pesan
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-700">
                      5.000 pesan
                    </td>
                  </tr>

                  {/* Row 6: Survei elektabilitas */}
                  <tr className="hover:bg-slate-50/80 transition-colors bg-slate-50/30">
                    <td className="py-3.5 px-4 font-bold text-slate-900 bg-slate-50/50">
                      Survei elektabilitas online
                    </td>
                    <td className="py-3.5 px-4">
                      1 survei per bulan
                    </td>
                    <td className="py-3.5 px-4 bg-cyan-50/50 font-bold text-slate-900">
                      Tanpa batas
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      Tanpa batas + sampling khusus
                    </td>
                  </tr>

                  {/* Row 7: Monitoring peta suara */}
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 bg-slate-50/50">
                      Monitoring peta suara
                    </td>
                    <td className="py-3.5 px-4">
                      Sampai kecamatan
                    </td>
                    <td className="py-3.5 px-4 bg-cyan-50/30 font-bold text-slate-900">
                      Sampai kecamatan dan desa
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      Sampai kecamatan, desa, dan data TPS
                    </td>
                  </tr>

                  {/* Row 8: Rekap C1 real count */}
                  <tr className="hover:bg-slate-50/80 transition-colors bg-slate-50/30">
                    <td className="py-3.5 px-4 font-bold text-slate-900 bg-slate-50/50">
                      Rekap C1 real count
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      Tidak termasuk
                    </td>
                    <td className="py-3.5 px-4 bg-cyan-50/50 font-bold text-emerald-700">
                      Saat Hari H
                    </td>
                    <td className="py-3.5 px-4 font-bold text-indigo-700">
                      Dengan war room 3 hari
                    </td>
                  </tr>

                  {/* Row 9: Cek NIK KTP ke DPT */}
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 bg-slate-50/50">
                      Cek NIK KTP ke DPT
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      Tidak termasuk
                    </td>
                    <td className="py-3.5 px-4 bg-cyan-50/30 text-slate-700">
                      Opsional, setelah kajian hukum
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      Opsional, setelah kajian hukum
                    </td>
                  </tr>

                  {/* Row 10: Storage */}
                  <tr className="hover:bg-slate-50/80 transition-colors bg-slate-50/30">
                    <td className="py-3.5 px-4 font-bold text-slate-900 bg-slate-50/50">
                      Storage
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                      20 GB
                    </td>
                    <td className="py-3.5 px-4 bg-cyan-50/50 font-mono font-bold text-cyan-900">
                      50 GB
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      100 GB
                    </td>
                  </tr>

                  {/* Row 11: Kanal dukungan */}
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 bg-slate-50/50">
                      Kanal dukungan
                    </td>
                    <td className="py-3.5 px-4">
                      Email, jam kerja
                    </td>
                    <td className="py-3.5 px-4 bg-cyan-50/30 font-semibold text-slate-900">
                      WhatsApp, jam kerja
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      WhatsApp dan telepon, prioritas
                    </td>
                  </tr>

                  {/* Row 12: Onboarding & training */}
                  <tr className="hover:bg-slate-50/80 transition-colors bg-slate-50/30">
                    <td className="py-3.5 px-4 font-bold text-slate-900 bg-slate-50/50">
                      Onboarding &amp; training
                    </td>
                    <td className="py-3.5 px-4">
                      Remote, 1 sesi
                    </td>
                    <td className="py-3.5 px-4 bg-cyan-50/50 font-semibold text-slate-900">
                      Remote, 2 sesi
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      Tatap muka, 2 hari
                    </td>
                  </tr>

                  {/* Row 13: Target uptime (SLA) */}
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 bg-slate-50/50">
                      Target uptime (SLA)
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      Best effort
                    </td>
                    <td className="py-3.5 px-4 bg-cyan-50/30 font-bold text-cyan-800">
                      99%
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-700">
                      99,5%
                    </td>
                  </tr>

                  {/* Row 14: Tidak termasuk */}
                  <tr className="hover:bg-slate-50/80 transition-colors bg-slate-50/30">
                    <td className="py-3.5 px-4 font-bold text-slate-900 bg-slate-50/50">
                      Tidak termasuk
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 leading-relaxed">
                      Rekap C1, war room, blast gratis, dukungan telepon
                    </td>
                    <td className="py-3.5 px-4 bg-cyan-50/50 text-slate-500 leading-relaxed">
                      Tim monitoring lapangan, pengembangan fitur khusus
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 leading-relaxed">
                      Pengembangan fitur khusus (dihitung terpisah)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Bottom Inquire CTA Strip inside Table Container */}
            <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-slate-600">
                Butuh paket kustomisasi khusus partai koalisi atau dapil luas? Konsultasikan bersama tim ahli SWARAKU.
              </div>
              <button
                onClick={() => scrollToSection('inquire')}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0"
              >
                Konsultasikan Paket Kustom
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Inquire Product & Contact Form (Primary Conversion) */}
      <section id="inquire" className="py-16 md:py-24 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Left Column: Inquiry Info */}
            <div className="lg:col-span-5 space-y-6">
              <div className="inline-flex items-center gap-2.5 p-1.5 pr-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <img
                  src={APP_IMAGES.swarakuOfficialLogo || '/images/swaraku_logo.png'}
                  alt="SWARAKU Logo"
                  className="w-7 h-7 object-contain rounded-lg bg-white border border-slate-200 shadow-2xs"
                />
                <span className="text-xs text-cyan-700 font-bold tracking-wider">FORMULIR INQUIRE RESMI SWARAKU</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Konsultasikan Kebutuhan Pemenangan Anda Sekarang
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                Dapatkan proposal penawaran resmi, jadwal presentasi online/offline tim ahli, serta akses demo sistem uji coba tanpa komitmen.
              </p>

              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-cyan-100 text-cyan-800 flex items-center justify-center shrink-0 mt-0.5">
                    <PhoneCall className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Hotline Konsultasi Cepat:</div>
                    <a
                      href="https://wa.me/6287886717797"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-mono text-cyan-800 font-bold hover:underline block"
                    >
                      +62 878-8671-7797
                    </a>
                    <div className="text-[11px] text-slate-500">Tersedia via Telepon &amp; WhatsApp 24/7 (087886717797)</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center shrink-0 mt-0.5">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Proposal &amp; Spesifikasi Teknis:</div>
                    <div className="text-[11px] text-slate-500">
                      Dokumen arsitektur sistem, NDA kerahasiaan data, dan skema implementasi siap kirim.
                    </div>
                    <button
                      onClick={() => setProposalModalOpen(true)}
                      className="mt-1 text-xs text-cyan-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3 h-3" />
                      <span>Lihat Ringkasan Proposal Teknis SWARAKU</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Jaminan Kerahasiaan Data (NDA):</div>
                    <div className="text-[11px] text-slate-500">
                      Seluruh data pemilih, strategi pemenangan, dan struktur saksi TPS dijamin kerahasiaannya dengan perjanjian tertulis resmi.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Form */}
            <div className="lg:col-span-7 bg-slate-50 p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
              {formSubmitted ? (
                <div className="space-y-6 text-center py-8">
                  <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                    <Check className="w-8 h-8" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-extrabold text-slate-900">
                      Permintaan Inquire Berhasil Diterima!
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
                      Terima kasih Bpk/Ibu <strong>{formData.nama}</strong>. Tiket konsultasi Anda telah diterbitkan dengan nomor referensi:
                    </p>
                    <div className="inline-block py-1.5 px-4 bg-white border border-slate-300 rounded-lg text-sm font-mono font-bold text-cyan-800">
                      {inquiryTicketId}
                    </div>
                  </div>

                  <div className="p-4 bg-white rounded-xl border border-slate-200 text-left text-xs space-y-1.5 max-w-md mx-auto">
                    <div><strong>Wilayah:</strong> {formData.dapil || 'Belum diisi'}</div>
                    <div><strong>Kontestasi:</strong> {formData.kontestasi}</div>
                    <div><strong>Partai / Paslon:</strong> {formData.partai || 'Belum diisi'}</div>
                    <div><strong>Estimasi DPT:</strong> {formData.estimasiDpt}</div>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <a
                      href={generateWhatsAppMessage()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Buka Chat WhatsApp Konsultan Sekarang</span>
                    </a>
                    <button
                      onClick={() => setFormSubmitted(false)}
                      className="w-full sm:w-auto px-4 py-3 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                    >
                      Kirim Inquire Lainnya
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleInquirySubmit} className="space-y-4">
                  <h3 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-200">
                    Lengkapi Data Inquire Caleg / Paslon
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Nama Lengkap Caleg / Tim Sukses *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.nama}
                        onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                        placeholder="H. Bambang Hartono, S.E."
                        className="w-full py-2.5 px-3 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Nomor WhatsApp Aktif *
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.noHp}
                        onChange={(e) => setFormData({ ...formData, noHp: e.target.value })}
                        placeholder="087886717797"
                        className="w-full py-2.5 px-3 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Pilihan Paket Layanan / Tingkat Kontestasi *
                      </label>
                      <select
                        value={formData.kontestasi}
                        onChange={(e) => setFormData({ ...formData, kontestasi: e.target.value })}
                        className="w-full py-2.5 px-3 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                      >
                        <option value="Paket Starter (Rp 150.000.000)">Paket Starter (Rp 150.000.000 - Caleg DPRD Kab/Kota)</option>
                        <option value="Paket Pro (Rp 250.000.000)">Paket Pro (Rp 250.000.000 - Caleg DPRD Provinsi, DPR RI, Bupati/Walikota)</option>
                        <option value="Paket Enterprise (Rp 300.000.000)">Paket Enterprise (Rp 300.000.000 - Calon Gubernur, Partai, Multi-Wilayah)</option>
                        <option value="DPRD Kabupaten/Kota">DPRD Kabupaten/Kota</option>
                        <option value="DPRD Provinsi">DPRD Provinsi</option>
                        <option value="DPR RI">DPR RI</option>
                        <option value="Pilkada Bupati/Walikota">Pilkada Bupati / Walikota</option>
                        <option value="Pilkada Gubernur">Pilkada Gubernur</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Partai Politik / Nomor Urut / Koalisi
                      </label>
                      <input
                        type="text"
                        value={formData.partai}
                        onChange={(e) => setFormData({ ...formData, partai: e.target.value })}
                        placeholder="No. Urut 1 / Koalisi Perubahan"
                        className="w-full py-2.5 px-3 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Daerah Pemilihan (Dapil) / Wilayah *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.dapil}
                        onChange={(e) => setFormData({ ...formData, dapil: e.target.value })}
                        placeholder="Dapil 2 (Kec. Cilandak, Pasar Minggu)"
                        className="w-full py-2.5 px-3 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Estimasi DPT / Jumlah TPS
                      </label>
                      <input
                        type="text"
                        value={formData.estimasiDpt}
                        onChange={(e) => setFormData({ ...formData, estimasiDpt: e.target.value })}
                        placeholder="~180.000 Pemilih (650 TPS)"
                        className="w-full py-2.5 px-3 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Catatan Tambahan / Kebutuhan Khusus
                    </label>
                    <textarea
                      rows={3}
                      value={formData.catatan}
                      onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
                      placeholder="Kebutuhan pelatihan saksi dan migrasi data relawan lapangan..."
                      className="w-full py-2.5 px-3 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-cyan-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <button
                      type="submit"
                      className="w-full sm:w-auto px-7 py-3.5 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
                    >
                      <Send className="w-4 h-4" />
                      <span>Kirim Permintaan Inquire &amp; Penawaran</span>
                    </button>

                    <a
                      href={generateWhatsAppMessage()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-emerald-700 font-bold hover:underline flex items-center gap-1.5 py-2"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Langsung Chat via WhatsApp Konsultan</span>
                    </a>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions (FAQ) */}
      <section id="faq" className="py-16 md:py-24 bg-slate-50 border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-3">
            <div className="text-xs text-cyan-700 font-bold tracking-wider">PERTANYAAN UMUM</div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Pertanyaan yang Sering Diajukan Seputar SWARAKU
            </h2>
          </div>

          <div className="space-y-4">
            <div className="p-5 bg-white rounded-xl border border-slate-200 space-y-2">
              <h4 className="font-bold text-sm text-slate-900">
                Apakah sistem SWARAKU sesuai dengan regulasi KPU dan UU PDP?
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Ya, SWARAKU mengacu pada PKPU tentang kampanye dan rekapitulasi suara. Seluruh data identitas kependudukan (NIK) dienkripsi sesuai standar Undang-Undang Perlindungan Data Pribadi (UU PDP No. 27 Tahun 2022).
              </p>
            </div>

            <div className="p-5 bg-white rounded-xl border border-slate-200 space-y-2">
              <h4 className="font-bold text-sm text-slate-900">
                Bagaimana jika saksi berada di TPS terpencil tanpa sinyal internet?
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Aplikasi mobile SWARAKU mendukung <strong>Offline Sync</strong>. Saksi tetap dapat memotret formulir C1 dan mengisi angka perolehan suara tanpa internet. Saat ponsel mendeteksi sinyal kembali, data otomatis terkirim ke server Command Center.
              </p>
            </div>

            <div className="p-5 bg-white rounded-xl border border-slate-200 space-y-2">
              <h4 className="font-bold text-sm text-slate-900">
                Berapa lama waktu implementasi dan pelatihan bagi relawan kami?
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Implementasi sistem siap dalam 1x24 jam setelah data Dapil ditentukan. Kami menyediakan video tutorial singkat, panduan PDF, serta sesi briefing online/offline untuk tim sukses dan koordinator saksi.
              </p>
            </div>

            <div className="p-5 bg-white rounded-xl border border-slate-200 space-y-2">
              <h4 className="font-bold text-sm text-slate-900">
                Bisakah kami mencoba demo aplikasi sebelum melakukan pemesanan resmi?
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Tentu! Anda dapat langsung menekan tombol <strong>"Live Demo App"</strong> di sudut kanan atas untuk mencoba simulasi portal Tim Sukses maupun aplikasi Kader Lapangan.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="bg-white p-1.5 rounded-xl shadow-xs">
                  <img
                    src={APP_IMAGES.swarakuOfficialLogo || '/images/swaraku_logo.png'}
                    alt="SWARAKU Logo"
                    className="w-9 h-9 object-contain"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="font-black text-white tracking-[0.18em] text-base leading-tight">SWARAKU</span>
                  <span className="text-[10px] text-cyan-400 font-semibold tracking-wider uppercase">Portal Pemenangan</span>
                </div>
              </div>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Platform Sistem Informasi Manajemen Pemenangan &amp; Relawan Pemilu terpadu untuk Calon Legislatif dan Pilkada di seluruh Indonesia.
              </p>
            </div>

            <div>
              <div className="font-bold text-white mb-3 text-xs uppercase tracking-wider">Modul Sistem</div>
              <ul className="space-y-2 text-[11px]">
                <li><a href="#fitur" className="hover:text-white transition-colors">Database DPT KPU</a></li>
                <li><a href="#fitur" className="hover:text-white transition-colors">OCR KTP Pemilih</a></li>
                <li><a href="#fitur" className="hover:text-white transition-colors">WhatsApp Blazt Multi-Device</a></li>
                <li><a href="#fitur" className="hover:text-white transition-colors">Real Count &amp; C1 Plano</a></li>
                <li><a href="#fitur" className="hover:text-white transition-colors">Peta Geospasial Suara</a></li>
              </ul>
            </div>

            <div>
              <div className="font-bold text-white mb-3 text-xs uppercase tracking-wider">Kontestasi</div>
              <ul className="space-y-2 text-[11px]">
                <li><a href="#paket" className="hover:text-white transition-colors">DPRD Kabupaten / Kota</a></li>
                <li><a href="#paket" className="hover:text-white transition-colors">DPRD Provinsi</a></li>
                <li><a href="#paket" className="hover:text-white transition-colors">DPR RI</a></li>
                <li><a href="#paket" className="hover:text-white transition-colors">Pilkada Bupati &amp; Walikota</a></li>
                <li><a href="#paket" className="hover:text-white transition-colors">Pilkada Gubernur</a></li>
              </ul>
            </div>

            <div>
              <div className="font-bold text-white mb-3 text-xs uppercase tracking-wider">Akses Langsung</div>
              <div className="space-y-2.5">
                <button
                  onClick={() => onOpenApp()}
                  className="w-full py-2 px-3 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-lg transition-colors cursor-pointer text-center block text-[11px]"
                >
                  🚀 Buka Aplikasi SWARAKU
                </button>
                <button
                  onClick={() => scrollToSection('inquire')}
                  className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg transition-colors cursor-pointer text-center block text-[11px]"
                >
                  📝 Inquire Product / Demo
                </button>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
            <div className="flex flex-wrap items-center gap-2">
              <span>&copy; 2026 SWARAKU · Hak Cipta Dilindungi Undang-Undang.</span>
              <span>&middot;</span>
              <a href="https://swaraku.com" className="text-cyan-400 hover:text-cyan-300 font-mono font-semibold transition-colors">
                https://swaraku.com
              </a>
            </div>
            <div className="flex items-center gap-4">
              <span>Keamanan SSL 256-Bit</span>
              <span>&middot;</span>
              <span>Kepatuhan KPU</span>
              <span>&middot;</span>
              <span>UU PDP</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Modal: Ringkasan Proposal Teknis */}
      {proposalModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <img
                  src={APP_IMAGES.swarakuOfficialLogo || '/images/swaraku_logo.png'}
                  alt="SWARAKU"
                  className="w-7 h-7 object-contain rounded-lg bg-white border border-slate-100"
                />
                <h3 className="font-bold text-slate-900 text-base">Spesifikasi Proposal SWARAKU</h3>
              </div>
              <button
                onClick={() => setProposalModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer font-bold"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700 max-h-80 overflow-y-auto pr-1">
              <p>
                Dokumen proposal teknis SWARAKU mencakup:
              </p>
              <ul className="space-y-1.5 list-disc list-inside text-slate-600">
                <li>Arsitektur Cloud High-Availability tahan lonjakan traffic saat hari pencoblosan</li>
                <li>Modul Enkripsi NIK &amp; KTP sesuai UU Perlindungan Data Pribadi</li>
                <li>SOP Pelatihan Saksi TPS dan Akurasi Upload C1 Plano</li>
                <li>Protokol WhatsApp Blazt Anti-Banned dengan algoritma delay pintar</li>
                <li>Perjanjian Kerahasiaan Data (Non-Disclosure Agreement / NDA) resmi bermaterai</li>
              </ul>
              <div className="p-3 bg-cyan-50 rounded-xl text-cyan-800 text-[11px] font-medium">
                Untuk mendapatkan proposal PDF lengkap dengan kop surat dan rincian biaya resmi, silakan kirimkan data melalui formulir Inquire Product atau hubungi WhatsApp konsultan kami.
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                onClick={() => setProposalModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg cursor-pointer"
              >
                Tutup
              </button>
              <button
                onClick={() => {
                  setProposalModalOpen(false);
                  scrollToSection('inquire');
                }}
                className="px-4 py-2 bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-xs rounded-lg cursor-pointer"
              >
                Isi Form Inquire
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Preview Gambar Layar Penuh */}
      {selectedPreviewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
          onClick={() => setSelectedPreviewImage(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-4xl w-full overflow-hidden border border-slate-200 shadow-2xl flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-cyan-700 uppercase tracking-wider">
                  {selectedPreviewImage.tag}
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  {selectedPreviewImage.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedPreviewImage(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold cursor-pointer p-1"
              >
                &times;
              </button>
            </div>
            <div className="p-4 bg-slate-100 overflow-auto flex items-center justify-center max-h-[60vh]">
              <img
                src={selectedPreviewImage.url}
                alt={selectedPreviewImage.title}
                className="max-h-[55vh] w-auto rounded-lg shadow-md object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="p-4 bg-white border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                {selectedPreviewImage.desc}
              </p>
              <button
                onClick={() => {
                  setSelectedPreviewImage(null);
                  scrollToSection('inquire');
                }}
                className="px-5 py-2.5 bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-xs rounded-xl whitespace-nowrap cursor-pointer shadow-xs"
              >
                Inquire Sistem Ini
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
