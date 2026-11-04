import React, { useState } from 'react';
import { VoterProfile, DptVoterRecord } from '../../types/vore';
import { lookupDptKpu } from '../../data/dptData';
import { AutoCekNikModal } from '../common/AutoCekNikModal';
import { WhatsAppBlaztModal } from '../common/WhatsAppBlaztModal';
import {
  QrCode,
  UserPlus,
  Users,
  Award,
  CheckCircle2,
  MapPin,
  ShieldCheck,
  Search,
  Filter,
  Plus,
  Send,
  Phone,
  CreditCard,
  MessageCircle,
  Sparkles,
} from 'lucide-react';

interface GroundOperationsViewProps {
  onRegisterVoter: (voterData: {
    nama: string;
    nik: string;
    noHp: string;
    tps: string;
    rtRw: string;
    isuPrioritas: string;
  }) => void;
  kaderPoints: number;
}

export const GroundOperationsView: React.FC<GroundOperationsViewProps> = ({
  onRegisterVoter,
  kaderPoints,
}) => {
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [showCekNikModal, setShowCekNikModal] = useState(false);
  const [showBlaztModal, setShowBlaztModal] = useState(false);

  const [nama, setNama] = useState('');
  const [nik, setNik] = useState('');
  const [noHp, setNoHp] = useState('');
  const [tps, setTps] = useState('TPS 047');
  const [rtRw, setRtRw] = useState('RT 03 / RW 04');
  const [isuPrioritas, setIsuPrioritas] = useState('Infrastruktur Jalan');
  const [dptSyncInfo, setDptSyncInfo] = useState<string | null>(null);

  const handleNikChange = (val: string) => {
    const clean = val.replace(/\D/g, '');
    setNik(clean);

    if (clean.length === 16) {
      const dpt = lookupDptKpu(clean);
      if (dpt) {
        setNama(dpt.nama);
        setTps(dpt.tps);
        setDptSyncInfo(`Terverifikasi DPT KPU (${dpt.nama} - ${dpt.tps})`);
      }
    } else {
      setDptSyncInfo(null);
    }
  };
  const [registeredList, setRegisteredList] = useState([
    {
      id: 'reg-1',
      nama: 'Bambang Sudirman',
      nikMasked: '3174 •••• •••• 4120',
      tps: 'TPS 047',
      noHp: '0812-9844-xxxx',
      waktu: '10 menit lalu',
      status: 'Terverifikasi e-KTP',
    },
    {
      id: 'reg-2',
      nama: 'Siti Nurhaliza',
      nikMasked: '3174 •••• •••• 9811',
      tps: 'TPS 047',
      noHp: '0813-8120-xxxx',
      waktu: '35 menit lalu',
      status: 'Terverifikasi e-KTP',
    },
    {
      id: 'reg-3',
      nama: 'Hendro Wijaya',
      nikMasked: '3174 •••• •••• 7731',
      tps: 'TPS 048',
      noHp: '0817-6421-xxxx',
      waktu: '1 jam lalu',
      status: 'Terverifikasi e-KTP',
    },
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama || !nik) return;

    const newVoter = {
      id: `reg-${Date.now()}`,
      nama,
      nikMasked: `${nik.slice(0, 4)} •••• •••• ${nik.slice(-4)}`,
      tps,
      noHp: `${noHp.slice(0, 4)}-••••-xxxx`,
      waktu: 'Baru saja',
      status: 'Terverifikasi e-KTP',
    };

    setRegisteredList([newVoter, ...registeredList]);
    onRegisterVoter({
      nama,
      nik,
      noHp,
      tps,
      rtRw,
      isuPrioritas,
    });

    setNama('');
    setNik('');
    setNoHp('');
    setShowRegisterForm(false);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header Banner (Slide 3: Perekrutan: Ground Operations) */}
      <div className="p-6 bg-gradient-to-r from-cyan-50 via-teal-50 to-white text-slate-900 rounded-3xl border border-cyan-200/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-100 border border-cyan-200 rounded-full text-xs font-bold text-cyan-800 mb-2">
            <span>TAHAP 1: GROUND OPERATIONS</span>
            <span>·</span>
            <span>DOOR-TO-DOOR &amp; CANVASSING</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Portal Kader &amp; Relawan Lapangan
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Kader mendapatkan kode referral unik dan instrumen canvassing lapangan. Setiap pemilih yang didaftarkan terverifikasi secara transparan dan menghasilkan Poin Suara kader.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-amber-200 shadow-xs shrink-0">
          <div>
            <span className="text-xs text-slate-500 block font-semibold">Poin Suara Kader</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-black text-amber-600 font-mono">
                {kaderPoints.toLocaleString('id-ID')}
              </span>
              <span className="text-xs text-slate-600 font-bold">Poin</span>
            </div>
          </div>
          <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Grid: QR Referral + Canvassing Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Unique QR Referral Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900">QR Referral Unik Kader</h2>
            <span className="text-[11px] font-semibold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-full">
              Kader #047
            </span>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-3">
            <div className="w-44 h-44 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs mx-auto flex items-center justify-center">
              <QrCode className="w-36 h-36 text-slate-900" />
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Kode Referral Anda</span>
              <span className="font-mono text-base font-extrabold text-slate-900 tracking-wider">
                REF-KADER-047
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Minta calon pemilih memindai QR ini saat door-to-door untuk membuka formulir onboarding langsung di ponsel mereka.
            </p>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2.5 bg-emerald-50 text-emerald-900 rounded-xl border border-emerald-100">
              <span className="font-medium">Reward Perekrutan</span>
              <span className="font-bold">+50 Poin Suara / Pemilih</span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-cyan-50 text-cyan-900 rounded-xl border border-cyan-100">
              <span className="font-medium">Dapil Operasional</span>
              <span className="font-bold">DKI Jakarta II (Cilandak)</span>
            </div>
          </div>
        </div>

        {/* Right 2 Columns: Fast Registration Form & Registered Voters List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Action to add voter */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Formulir Registrasi Cepat Lapangan
                </h2>
                <p className="text-xs text-slate-500">
                  Daftarkan warga door-to-door dengan fitur auto-tarik DPT KPU.
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setShowCekNikModal(true)}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Auto Cek NIK</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowBlaztModal(true)}
                  className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WA Blazt</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowRegisterForm(!showRegisterForm)}
                  className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>{showRegisterForm ? 'Tutup' : 'Input Manual'}</span>
                </button>
              </div>
            </div>

            {showRegisterForm && (
              <form onSubmit={handleSubmit} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                {dptSyncInfo && (
                  <div className="p-2.5 bg-emerald-100 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>{dptSyncInfo}</span>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Nomor Induk Kependudukan (NIK 16 Digit)
                    </label>
                    <input
                      type="text"
                      maxLength={16}
                      value={nik}
                      onChange={(e) => handleNikChange(e.target.value)}
                      placeholder="Masukkan 16 digit NIK..."
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-cyan-500 font-mono text-xs font-bold"
                      required
                    />
                    <span className="text-[10px] text-cyan-600 block mt-0.5">
                      Ketik 16 digit NIK untuk otomatis memuat Nama &amp; TPS dari DPT KPU
                    </span>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Nama Lengkap Pemilih
                    </label>
                    <input
                      type="text"
                      value={nama}
                      onChange={(e) => setNama(e.target.value)}
                      placeholder="Nama otomatis terisi dari DPT"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-cyan-500 font-semibold"
                      required
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Nomor WhatsApp / HP
                    </label>
                    <input
                      type="text"
                      value={noHp}
                      onChange={(e) => setNoHp(e.target.value)}
                      placeholder="0812xxxxxxxx"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Alokasi TPS
                    </label>
                    <input
                      type="text"
                      value={tps}
                      onChange={(e) => setTps(e.target.value)}
                      placeholder="e.g. TPS 047"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-cyan-500 font-mono font-bold text-cyan-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1 text-xs">
                    Isu Prioritas yang Dikeluhkan Warga
                  </label>
                  <input
                    type="text"
                    value={isuPrioritas}
                    onChange={(e) => setIsuPrioritas(e.target.value)}
                    placeholder="e.g. Saluran air mampet saat hujan lebat"
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-cyan-500"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] text-slate-500">
                    🔒 NIK akan otomatis dienkripsi SHA-256 untuk audit trail legal.
                  </span>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Daftarkan &amp; Klaim +50 Poin</span>
                  </button>
                </div>
              </form>
            )}

            {/* List of registered voters */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">
                  Daftar Warga Terjaring Melalui Rujukan Anda ({registeredList.length})
                </span>
                <span className="text-[11px] text-cyan-600 font-semibold">Tersinkron ke Pusat</span>
              </div>

              <div className="divide-y divide-slate-100">
                {registeredList.map((voter) => (
                  <div key={voter.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{voter.nama}</span>
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          {voter.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-500 text-[11px] mt-0.5">
                        <span className="font-mono">{voter.nikMasked}</span>
                        <span>·</span>
                        <span>{voter.tps}</span>
                        <span>·</span>
                        <span>{voter.noHp}</span>
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-400">{voter.waktu}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Auto Cek NIK DPT KPU Modal */}
      <AutoCekNikModal
        isOpen={showCekNikModal}
        onClose={() => setShowCekNikModal(false)}
        onSaveVoter={(voter) => {
          const newVoter = {
            id: `reg-${Date.now()}`,
            nama: voter.nama,
            nikMasked: `${voter.nik.slice(0, 4)} •••• •••• ${voter.nik.slice(-4)}`,
            tps: voter.tps,
            noHp: voter.noHp || '0812-xxxx-xxxx',
            waktu: 'Baru saja',
            status: 'Terverifikasi e-KTP',
          };
          setRegisteredList([newVoter, ...registeredList]);
          onRegisterVoter({
            nama: voter.nama,
            nik: voter.nik,
            noHp: voter.noHp || '0812-xxxx-xxxx',
            tps: voter.tps,
            rtRw: 'RT 03 / RW 04',
            isuPrioritas: 'Infrastruktur Jalan',
          });
        }}
      />

      {/* WhatsApp Blazt Modal */}
      <WhatsAppBlaztModal
        isOpen={showBlaztModal}
        onClose={() => setShowBlaztModal(false)}
        blaztLogs={[]}
        onTriggerBlazt={() => {}}
      />
    </div>
  );
};
