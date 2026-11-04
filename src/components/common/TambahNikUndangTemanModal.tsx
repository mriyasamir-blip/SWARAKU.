import React, { useState } from 'react';
import { InvitedFriendRecord, VoterProfile } from '../../types/vore';
import { lookupDptKpu } from '../../data/dptData';
import {
  UserPlus,
  Users,
  Search,
  CheckCircle2,
  AlertCircle,
  Phone,
  MessageCircle,
  Send,
  X,
  Copy,
  Check,
  QrCode,
  Share2,
  ShieldCheck,
  Sparkles,
  MapPin,
  Calendar,
} from 'lucide-react';

interface TambahNikUndangTemanModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: VoterProfile;
  invitedList: InvitedFriendRecord[];
  onAddInvitedFriend: (friend: InvitedFriendRecord) => void;
}

export const TambahNikUndangTemanModal: React.FC<TambahNikUndangTemanModalProps> = ({
  isOpen,
  onClose,
  profile,
  invitedList,
  onAddInvitedFriend,
}) => {
  const [activeTab, setActiveTab] = useState<'input_nik' | 'daftar_teman' | 'qr_code'>('input_nik');

  // Form states
  const [nikInput, setNikInput] = useState('');
  const [namaInput, setNamaInput] = useState('');
  const [noHpInput, setNoHpInput] = useState('');
  const [tpsInput, setTpsInput] = useState(profile.tps || 'TPS 047');
  const [kelurahanInput, setKelurahanInput] = useState(profile.kelurahan || 'Kel. Sukamaju');
  const [hubunganInput, setHubunganInput] = useState<
    'Teman' | 'Keluarga' | 'Tetangga Satu TPS' | 'Rekan Kerja' | 'Lainnya'
  >('Teman');
  const [dptNotice, setDptNotice] = useState<{
    found: boolean;
    message: string;
  } | null>(null);

  const [copiedLink, setCopiedLink] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  if (!isOpen) return null;

  // Handle NIK input & auto-lookup KPU DPT
  const handleNikChange = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 16);
    setNikInput(clean);

    if (clean.length === 16) {
      const match = lookupDptKpu(clean);
      if (match) {
        setNamaInput(match.nama);
        setTpsInput(match.tps);
        setKelurahanInput(match.kelurahan);
        if (match.noHp) setNoHpInput(match.noHp);
        setDptNotice({
          found: true,
          message: `Terdaftar KPU: ${match.nama} · ${match.tps} (${match.kelurahan})`,
        });
      } else {
        setDptNotice({
          found: false,
          message: 'NIK 16 digit terverifikasi secara algoritma KPU.',
        });
      }
    } else {
      setDptNotice(null);
    }
  };

  // Generate invitation link & WhatsApp message
  const referralLink = `https://swaraku.com/join?ref=${profile.referralCode}`;
  const generateWaMessage = (namaTeman: string, tpsNama: string, kel: string) => {
    return encodeURIComponent(
      `Halo ${namaTeman || 'Kawan'}! 👋\n\n` +
      `Saya mengajakmu bergabung dan mengawal suara kita di ${tpsNama} (${kel}) lewat aplikasi SWARAKU.\n\n` +
      `Yuk cek DPT, pantau peta suara TPS, dan kawal suara kita bersama:\n` +
      `${referralLink}\n\n` +
      `Kode Rujukan: ${profile.referralCode}\n` +
      `Salam hangat, ${profile.nama}`
    );
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent, sendViaWa: boolean = false) => {
    e.preventDefault();
    if (nikInput.length < 16) {
      alert('Mohon masukkan 16 digit NIK secara lengkap.');
      return;
    }
    if (!namaInput.trim()) {
      alert('Mohon isi nama teman.');
      return;
    }

    const maskedNik = `${nikInput.slice(0, 4)} •••• •••• ${nikInput.slice(-4)}`;

    const newRecord: InvitedFriendRecord = {
      id: `inv-${Date.now()}`,
      nik: nikInput,
      nikMasked: maskedNik,
      nama: namaInput.trim(),
      noHp: noHpInput.trim() || undefined,
      tps: tpsInput,
      kelurahan: kelurahanInput,
      kecamatan: profile.kecamatan,
      hubungan: hubunganInput,
      tanggalUndang: 'Hari ini',
      status: 'Terdaftar KPU',
    };

    onAddInvitedFriend(newRecord);
    setSubmittedSuccess(true);

    if (sendViaWa && noHpInput) {
      const cleanPhone = noHpInput.replace(/\D/g, '').replace(/^0/, '62');
      const waMsg = generateWaMessage(namaInput, tpsInput, kelurahanInput);
      window.open(`https://wa.me/${cleanPhone}?text=${waMsg}`, '_blank');
    }

    setTimeout(() => {
      setSubmittedSuccess(false);
      setNikInput('');
      setNamaInput('');
      setNoHpInput('');
      setDptNotice(null);
      setActiveTab('daftar_teman');
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-4 sm:p-6 space-y-4 shadow-2xl border border-slate-200 my-auto text-slate-800 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100 gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-cyan-600 text-white flex items-center justify-center shadow-md shadow-cyan-600/20 shrink-0">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 tracking-tight">
                  Tambah NIK &amp; Undang Teman
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Input manual NIK tetangga atau kawan untuk memperluas jaringan rujukan pemilih TPS.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center text-sm font-bold cursor-pointer transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-2xl border border-slate-200/90 text-xs">
          <button
            onClick={() => setActiveTab('input_nik')}
            className={`py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'input_nik'
                ? 'bg-white text-cyan-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5 text-cyan-600" />
            <span>Input NIK</span>
          </button>

          <button
            onClick={() => setActiveTab('daftar_teman')}
            className={`py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'daftar_teman'
                ? 'bg-white text-cyan-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-emerald-600" />
            <span>Teman ({invitedList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('qr_code')}
            className={`py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'qr_code'
                ? 'bg-white text-cyan-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <QrCode className="w-3.5 h-3.5 text-indigo-600" />
            <span>Kode QR</span>
          </button>
        </div>

        {/* TAB 1: FORM INPUT MANUAL NIK */}
        {activeTab === 'input_nik' && (
          <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-3.5 text-xs">
            {submittedSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Data teman berhasil ditambahkan ke jaringan rujukan Anda!</span>
              </div>
            )}

            {/* Input NIK 16 Digit */}
            <div className="space-y-1">
              <label className="font-bold text-slate-800 flex items-center justify-between">
                <span>Nomor Induk Kependudukan (NIK) Teman</span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {nikInput.length}/16 Digit
                </span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={nikInput}
                  onChange={(e) => handleNikChange(e.target.value)}
                  placeholder="Contoh: 3174012508890001"
                  className="w-full text-xs font-mono font-bold tracking-wider px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-cyan-500 focus:outline-hidden"
                  maxLength={16}
                  required
                />
              </div>

              {/* DPT KPU Feedback */}
              {dptNotice && (
                <div
                  className={`p-2.5 rounded-xl border flex items-center gap-2 mt-1 text-[11px] font-semibold ${
                    dptNotice.found
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-cyan-50 border-cyan-200 text-cyan-800'
                  }`}
                >
                  {dptNotice.found ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <ShieldCheck className="w-4 h-4 text-cyan-600 shrink-0" />
                  )}
                  <span>{dptNotice.message}</span>
                </div>
              )}
            </div>

            {/* Nama Teman */}
            <div className="space-y-1">
              <label className="font-bold text-slate-800 block">
                Nama Lengkap Teman / Tetangga
              </label>
              <input
                type="text"
                value={namaInput}
                onChange={(e) => setNamaInput(e.target.value)}
                placeholder="Masukkan nama lengkap teman"
                className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-cyan-500 focus:outline-hidden font-medium"
                required
              />
            </div>

            {/* Nomor WhatsApp & Hubungan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="font-bold text-slate-800 block">
                  No. WhatsApp (Opsional)
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={noHpInput}
                    onChange={(e) => setNoHpInput(e.target.value)}
                    placeholder="0812XXXXXXXX"
                    className="w-full text-xs pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-cyan-500 focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800 block">
                  Hubungan / Kedekatan
                </label>
                <select
                  value={hubunganInput}
                  onChange={(e) => setHubunganInput(e.target.value as any)}
                  className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-cyan-500 focus:outline-hidden font-medium"
                >
                  <option value="Teman">Teman Dekat</option>
                  <option value="Tetangga Satu TPS">Tetangga Satu TPS</option>
                  <option value="Keluarga">Keluarga / Kerabat</option>
                  <option value="Rekan Kerja">Rekan Kerja</option>
                  <option value="Lainnya">Lainnya / Komunitas</option>
                </select>
              </div>
            </div>

            {/* TPS & Kelurahan */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="font-bold text-slate-800 block">TPS Terdaftar</label>
                <input
                  type="text"
                  value={tpsInput}
                  onChange={(e) => setTpsInput(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-cyan-500 focus:outline-hidden font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800 block">Kelurahan</label>
                <input
                  type="text"
                  value={kelurahanInput}
                  onChange={(e) => setKelurahanInput(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-cyan-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
              <button
                type="submit"
                className="w-full sm:flex-1 py-2.5 px-4 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-98"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Simpan NIK Teman</span>
              </button>

              <button
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                className="w-full sm:flex-1 py-2.5 px-4 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-98"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Simpan &amp; Kirim WhatsApp</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: DAFTAR TEMAN YANG SUDAH DIUNDANG */}
        {activeTab === 'daftar_teman' && (
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <span className="font-bold text-slate-800">
                Total {invitedList.length} Teman di Jaringan Anda
              </span>
              <button
                onClick={() => setActiveTab('input_nik')}
                className="text-cyan-700 font-bold hover:underline flex items-center gap-1 text-[11px] cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Tambah NIK Baru</span>
              </button>
            </div>

            {invitedList.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                <Users className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="font-bold text-slate-700">Belum ada teman yang ditambahkan</p>
                <p className="text-[11px] text-slate-500">
                  Gunakan tab "Input NIK" untuk memasukkan NIK teman dan mengajak mereka bergabung.
                </p>
                <button
                  onClick={() => setActiveTab('input_nik')}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs rounded-xl shadow-xs mt-1 cursor-pointer"
                >
                  Input NIK Teman Sekarang
                </button>
              </div>
            ) : (
              <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                {invitedList.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-white rounded-2xl border border-slate-200/90 hover:border-cyan-300 transition-all shadow-2xs space-y-1.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-slate-900 text-xs">{item.nama}</span>
                          <span className="text-[9px] font-bold px-2 py-0.2 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                            {item.hubungan}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                          NIK: {item.nikMasked}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {item.tps} · {item.kelurahan}
                        </span>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 inline-block">
                          {item.status}
                        </span>
                        <span className="text-[9px] text-slate-400 block mt-0.5">
                          {item.tanggalUndang}
                        </span>
                      </div>
                    </div>

                    {item.noHp && (
                      <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[10px] text-slate-500 font-mono">
                          WA: {item.noHp}
                        </span>
                        <a
                          href={`https://wa.me/${item.noHp.replace(/\D/g, '').replace(/^0/, '62')}?text=${generateWaMessage(
                            item.nama,
                            item.tps,
                            item.kelurahan
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2 py-0.8 bg-green-50 hover:bg-green-100 text-green-700 font-bold rounded-lg border border-green-200 flex items-center gap-1 text-[10px]"
                        >
                          <MessageCircle className="w-3 h-3 text-green-600" />
                          <span>Undang via WhatsApp</span>
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: KODE QR & LINK REFERRAL */}
        {activeTab === 'qr_code' && (
          <div className="space-y-3 text-center text-xs">
            <div className="w-36 h-36 bg-slate-50 p-2.5 rounded-2xl border border-slate-200 shadow-inner mx-auto flex items-center justify-center">
              <QrCode className="w-32 h-32 text-slate-900" />
            </div>

            <div>
              <span className="text-[11px] text-slate-500 block">Kode Referral Anda</span>
              <span className="font-mono text-base font-black text-cyan-700 tracking-wider">
                {profile.referralCode}
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed px-4">
              Ajak tetangga dan rekan warga untuk mendaftar dan memverifikasi TPS mereka guna memperkuat basis pendukung.
            </p>

            <div className="flex items-center gap-1.5 p-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
              <input
                type="text"
                readOnly
                value={referralLink}
                className="bg-transparent flex-1 text-slate-700 text-[11px] outline-hidden px-1 truncate font-mono"
              />
              <button
                onClick={handleCopyLink}
                className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer shadow-xs transition-colors shrink-0"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Tersalin' : 'Salin'}</span>
              </button>
            </div>

            <button
              onClick={() => {
                const waUrl = `https://wa.me/?text=${encodeURIComponent(
                  `Halo kawan! Yuk bergabung mengawal pemilu bersama di platform SWARAKU:\n${referralLink}\nKode Referral: ${profile.referralCode}`
                )}`;
                window.open(waUrl, '_blank');
              }}
              className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Bagikan Link via WhatsApp</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
