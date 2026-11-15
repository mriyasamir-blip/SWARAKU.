import React, { useState, useMemo } from 'react';
import {
  Coins,
  Gift,
  Building2,
  Calendar,
  MapPin,
  CheckCircle2,
  XCircle,
  MessageSquarePlus,
  Copy,
  Check,
  Share2,
  User as UserIcon,
  LogOut,
  Clock,
  Inbox,
} from 'lucide-react';
import type {
  AspirationDoc,
  CalegInfoDoc,
  CampaignEventDoc,
  RewardClaimDoc,
  RewardDoc,
  VoterDoc,
} from '../../types/swaraku';
import { EventLocationMap } from '../maps/EventLocationMap';
import { PWAInstallButton } from '../pwa/PWAInstallButton';

// ==========================================
// 1. BERANDA: KANTONG POIN, INFO CALEG & KATALOG REWARD
// ==========================================

interface VoterBerandaViewProps {
  voter: VoterDoc;
  calegInfoList: CalegInfoDoc[];
  rewards: RewardDoc[];
  myClaims: RewardClaimDoc[];
  onRedeemReward: (reward: RewardDoc) => Promise<void>;
}

export const VoterBerandaView: React.FC<VoterBerandaViewProps> = ({
  voter,
  calegInfoList,
  rewards,
  myClaims,
  onRedeemReward,
}) => {
  const [confirmReward, setConfirmReward] = useState<RewardDoc | null>(null);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);

  // Filter otomatis informasi partai & Caleg berdasarkan Daerah / Dapil Voters
  const filteredCaleg = useMemo(() => {
    const voterRegion = (voter.region || '').trim().toLowerCase();
    if (!voterRegion) return calegInfoList;
    return calegInfoList.filter((item) => {
      const itemRegion = (item.region || '').trim().toLowerCase();
      return (
        itemRegion.includes(voterRegion) ||
        voterRegion.includes(itemRegion)
      );
    });
  }, [calegInfoList, voter.region]);

  const handleConfirmRedeem = async () => {
    if (!confirmReward) return;
    setRedeemingId(confirmReward.id);
    try {
      await onRedeemReward(confirmReward);
      setConfirmReward(null);
    } finally {
      setRedeemingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Kantong Poin Hero Card */}
      <section className="rounded-3xl bg-gradient-to-br from-blue-700 via-blue-800 to-slate-900 text-white p-6 sm:p-7 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-200">
              Kantong Poin Anda
            </p>
            <div className="flex items-baseline gap-2.5">
              <span className="text-4xl sm:text-5xl font-extrabold font-mono tabular-nums tracking-tight">
                {voter.points.toLocaleString('id-ID')}
              </span>
              <span className="text-sm font-semibold text-blue-100">Poin</span>
            </div>
            <p className="text-sm text-blue-100 pt-1">
              {voter.fullName} &middot; {voter.region}
            </p>
          </div>

          <div className="rounded-2xl bg-white/10 border border-white/15 px-4 py-3 text-left sm:text-right">
            <p className="text-[11px] uppercase tracking-wider text-blue-200 font-semibold">
              Kode Undangan Anda
            </p>
            <p className="text-base font-bold font-mono tracking-wider mt-0.5">
              {voter.referralCode}
            </p>
          </div>
        </div>
      </section>

      {/* Informasi Partai Politik & Caleg Daerah (Auto-filtered) */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-700" />
            <h2 className="text-lg font-extrabold text-slate-900">
              Informasi Partai &amp; Caleg Daerah
            </h2>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            Dapil: {voter.region}
          </span>
        </div>

        {filteredCaleg.length === 0 ? (
          <div className="rounded-2xl bg-white border border-slate-200 p-6 text-center space-y-1.5">
            <Inbox className="w-7 h-7 text-slate-400 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">
              Belum ada informasi Partai &amp; Caleg untuk daerah {voter.region}
            </p>
            <p className="text-xs text-slate-500">
              Informasi akan muncul secara otomatis setelah ditambahkan oleh tim kampanye / Superadmin.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCaleg.map((info) => (
              <article
                key={info.id}
                className="rounded-2xl bg-white border border-slate-200 p-5 space-y-2.5 shadow-2xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      {info.calegName}
                    </h3>
                    <p className="text-xs font-semibold text-blue-700 mt-0.5">
                      {info.partyName} &middot; {info.region}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                  {info.description}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Katalog Penukaran Reward */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Gift className="w-5 h-5 text-blue-700" />
          <h2 className="text-lg font-extrabold text-slate-900">
            Katalog Penukaran Reward
          </h2>
        </div>

        {rewards.length === 0 ? (
          <div className="rounded-2xl bg-white border border-slate-200 p-6 text-center space-y-1.5">
            <Gift className="w-7 h-7 text-slate-400 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">
              Katalog reward masih kosong
            </p>
            <p className="text-xs text-slate-500">
              Item penukaran poin akan tampil di sini setelah ditambahkan oleh Superadmin.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rewards.map((item) => {
              const outOfStock = item.stock <= 0;
              const notEnoughPoints = voter.points < item.pointCost;
              const disabled = outOfStock || notEnoughPoints || redeemingId === item.id;

              return (
                <div
                  key={item.id}
                  className="rounded-2xl bg-white border border-slate-200 p-5 flex flex-col justify-between gap-4 shadow-2xs"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-base font-bold text-slate-900 leading-snug">
                        {item.itemName}
                      </h3>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {item.description || 'Reward resmi program loyalitas pemilih.'}
                    </p>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-blue-700 font-mono tabular-nums text-sm flex items-center gap-1">
                        <Coins className="w-4 h-4" />
                        {item.pointCost.toLocaleString('id-ID')} Poin
                      </span>
                      <span
                        className={`font-semibold font-mono tabular-nums ${
                          outOfStock ? 'text-rose-600' : 'text-slate-600'
                        }`}
                      >
                        {outOfStock ? 'Stok Habis' : `Sisa Stok: ${item.stock}`}
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => setConfirmReward(item)}
                      className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 disabled:bg-slate-200 disabled:text-slate-500 text-white font-bold text-sm transition-colors cursor-pointer disabled:cursor-not-allowed"
                    >
                      {outOfStock
                        ? 'Stok Habis'
                        : notEnoughPoints
                        ? 'Poin Belum Cukup'
                        : 'Tukar Poin'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Riwayat Klaim Reward Saya */}
      {myClaims.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-base font-extrabold text-slate-900">
            Riwayat Penukaran Poin Saya
          </h3>
          <div className="rounded-2xl bg-white border border-slate-200 divide-y divide-slate-100 overflow-hidden">
            {myClaims.map((claim) => (
              <div
                key={claim.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
              >
                <div>
                  <p className="text-sm font-bold text-slate-900">{claim.itemName}</p>
                  <p className="text-xs text-slate-500 font-mono tabular-nums mt-0.5">
                    {claim.pointUsed.toLocaleString('id-ID')} Poin &middot;{' '}
                    {claim.claimedAt?.toDate
                      ? claim.claimedAt.toDate().toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : 'Baru saja'}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-bold ${
                    claim.status === 'DISERAHKAN'
                      ? 'text-emerald-700'
                      : 'text-amber-700'
                  }`}
                >
                  {claim.status === 'DISERAHKAN' ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Clock className="w-4 h-4" />
                  )}
                  <span>{claim.status === 'DISERAHKAN' ? 'Sudah Diserahkan' : 'Menunggu Penyerahan'}</span>
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Inline Confirmation Dialog (No window.confirm) */}
      {confirmReward && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-xl">
            <h3 className="text-lg font-extrabold text-slate-900">
              Konfirmasi Penukaran Poin
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Anda akan menukarkan{' '}
              <strong className="text-slate-900 font-mono tabular-nums">
                {confirmReward.pointCost.toLocaleString('id-ID')} poin
              </strong>{' '}
              untuk mendapatkan{' '}
              <strong className="text-slate-900">{confirmReward.itemName}</strong>.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={redeemingId !== null}
                onClick={() => setConfirmReward(null)}
                className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={redeemingId !== null}
                onClick={handleConfirmRedeem}
                className="min-h-[44px] px-5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white font-bold text-sm cursor-pointer"
              >
                {redeemingId ? 'Memproses...' : 'Ya, Tukar Sekarang'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 2. KALENDER ACARA, RSVP & GOOGLE MAPS
// ==========================================

interface VoterEventsViewProps {
  uid: string;
  events: CampaignEventDoc[];
  onRsvpEvent: (eventId: string, attending: boolean) => Promise<void>;
}

export const VoterEventsView: React.FC<VoterEventsViewProps> = ({
  uid,
  events,
  onRsvpEvent,
}) => {
  const [busyEventId, setBusyEventId] = useState<string | null>(null);

  const handleRsvp = async (eventId: string, attending: boolean) => {
    setBusyEventId(eventId);
    try {
      await onRsvpEvent(eventId, attending);
    } finally {
      setBusyEventId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Calendar className="w-5 h-5 text-blue-700" />
        <h2 className="text-lg font-extrabold text-slate-900">
          Kalender Acara &amp; Konfirmasi Kehadiran
        </h2>
      </div>

      {events.length === 0 ? (
        <div className="rounded-2xl bg-white border border-slate-200 p-8 text-center space-y-2">
          <Calendar className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-sm font-semibold text-slate-700">
            Belum ada jadwal acara terdaftar
          </p>
          <p className="text-xs text-slate-500">
            Jadwal kegiatan partai dan Caleg akan tampil di sini setelah dipublikasikan oleh Superadmin.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((ev) => {
            const isYes = (ev.rsvpYes || []).includes(uid);
            const isNo = (ev.rsvpNo || []).includes(uid);
            const isBusy = busyEventId === ev.id;

            return (
              <article
                key={ev.id}
                className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 space-y-4 shadow-2xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold text-blue-700">
                      {ev.partyName} &middot; {ev.region}
                    </p>
                    <h3 className="text-lg font-extrabold text-slate-900 mt-0.5">
                      {ev.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 font-medium">
                      Jadwal: {ev.eventDate}
                    </p>
                  </div>
                  <div className="text-left sm:text-right shrink-0">
                    <span className="inline-flex items-center gap-1 text-sm font-extrabold font-mono tabular-nums text-emerald-700">
                      <Coins className="w-4 h-4" />+{ev.pointReward} Poin Hadir
                    </span>
                  </div>
                </div>

                {/* Tombol RSVP */}
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => handleRsvp(ev.id, true)}
                    className={`flex-1 min-h-[44px] px-4 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                      isYes
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isYes ? 'Terkonfirmasi Ingin Hadir' : 'Ingin Hadir'}</span>
                  </button>

                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => handleRsvp(ev.id, false)}
                    className={`flex-1 min-h-[44px] px-4 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                      isNo
                        ? 'bg-slate-800 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                    }`}
                  >
                    <XCircle className="w-4 h-4" />
                    <span>{isNo ? 'Dipilih: Tidak Ingin Hadir' : 'Tidak Ingin Hadir'}</span>
                  </button>
                </div>

                {/* Alamat Lengkap & Google Maps Interaktif jika memilih Ingin Hadir */}
                {isYes && (
                  <div className="pt-3 border-t border-slate-100 space-y-3">
                    <div className="flex items-start gap-2.5 text-sm text-slate-700">
                      <MapPin className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-slate-900">Alamat Lokasi Acara:</p>
                        <p className="text-slate-600 mt-0.5">{ev.address}</p>
                      </div>
                    </div>
                    <EventLocationMap
                      lat={ev.lat}
                      lng={ev.lng}
                      title={ev.title}
                      address={ev.address}
                    />
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ==========================================
// 3. SAMPAIKAN ASPIRASI
// ==========================================

interface VoterAspirasiViewProps {
  voter: VoterDoc;
  aspirations: AspirationDoc[];
  onSubmitAspiration: (message: string) => Promise<void>;
}

export const VoterAspirasiView: React.FC<VoterAspirasiViewProps> = ({
  voter,
  aspirations,
  onSubmitAspiration,
}) => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim().length < 4) return;
    setSending(true);
    try {
      await onSubmitAspiration(message.trim());
      setMessage('');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 space-y-4 shadow-2xs">
        <div className="flex items-center gap-2">
          <MessageSquarePlus className="w-5 h-5 text-blue-700" />
          <h2 className="text-lg font-extrabold text-slate-900">
            Sampaikan Aspirasi Daerah
          </h2>
        </div>
        <p className="text-sm text-slate-600">
          Tuliskan usulan, kebutuhan lingkungan, atau harapan Anda untuk daerah{' '}
          <strong className="text-slate-800">{voter.region}</strong>.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            rows={4}
            required
            minLength={4}
            maxLength={1500}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tulis aspirasi Anda secara lengkap dan jelas..."
            className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
          />
          <button
            type="submit"
            disabled={sending || message.trim().length < 4}
            className="min-h-[44px] px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white font-bold text-sm transition-colors cursor-pointer"
          >
            {sending ? 'Mengirim Aspirasi...' : 'Kirim Aspirasi'}
          </button>
        </form>
      </section>

      <section className="space-y-3">
        <h3 className="text-base font-extrabold text-slate-900">
          Riwayat Aspirasi Anda
        </h3>

        {aspirations.length === 0 ? (
          <div className="rounded-2xl bg-white border border-slate-200 p-6 text-center text-sm text-slate-500">
            Anda belum mengirimkan aspirasi.
          </div>
        ) : (
          <div className="space-y-3">
            {aspirations.map((asp) => (
              <div
                key={asp.id}
                className="rounded-2xl bg-white border border-slate-200 p-4 space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold text-blue-700">{asp.region}</span>
                  <span>
                    {asp.createdAt?.toDate
                      ? asp.createdAt.toDate().toLocaleString('id-ID')
                      : 'Baru dikirim'}
                  </span>
                </div>
                <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-line">
                  {asp.message}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

// ==========================================
// 4. UNDANG TEMAN (REFERRAL)
// ==========================================

export const VoterReferralView: React.FC<{ voter: VoterDoc }> = ({ voter }) => {
  const [copiedType, setCopiedType] = useState<'code' | 'link' | null>(null);

  const inviteUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/?ref=${encodeURIComponent(voter.referralCode)}`
      : `https://www.swaraku.online/?ref=${encodeURIComponent(voter.referralCode)}`;

  const handleCopy = async (text: string, type: 'code' | 'link') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2500);
    } catch {
      // ignore clipboard errors
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Gabung Swaraku',
          text: `Ayo gabung di Swaraku menggunakan kode undangan saya: ${voter.referralCode}`,
          url: inviteUrl,
        });
        return;
      } catch {
        // fallback to copy
      }
    }
    await handleCopy(inviteUrl, 'link');
  };

  return (
    <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 space-y-6 shadow-2xs max-w-2xl">
      <div className="space-y-1">
        <h2 className="text-xl font-extrabold text-slate-900">
          Undang Teman &amp; Dapatkan +50 Poin
        </h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          Bagikan kode undangan atau tautan ajakan di bawah ini. Setiap teman yang mendaftar menggunakan kode Anda akan langsung menambahkan <strong>50 poin</strong> ke Kantong Poin Anda.
        </p>
      </div>

      <div className="rounded-2xl bg-blue-50 border border-blue-200 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-blue-800 uppercase tracking-wider">
            Kode Undangan Pribadi Anda
          </p>
          <p className="text-2xl font-extrabold font-mono tracking-widest text-blue-950 mt-1">
            {voter.referralCode}
          </p>
        </div>
        <button
          type="button"
          onClick={() => handleCopy(voter.referralCode, 'code')}
          className="min-h-[44px] px-4 py-2 rounded-xl bg-white border border-blue-300 text-blue-800 font-bold text-sm flex items-center justify-center gap-2 hover:bg-blue-100 cursor-pointer"
        >
          {copiedType === 'code' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          <span>{copiedType === 'code' ? 'Kode Tersalin' : 'Salin Kode'}</span>
        </button>
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-bold text-slate-700">
          Tautan Ajakan Otomatis
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            readOnly
            value={inviteUrl}
            className="flex-1 min-h-[44px] px-4 py-2 rounded-xl border border-slate-300 bg-slate-50 text-xs font-mono text-slate-700"
          />
          <button
            type="button"
            onClick={() => handleCopy(inviteUrl, 'link')}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            {copiedType === 'link' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copiedType === 'link' ? 'Tautan Tersalin' : 'Salin Tautan'}</span>
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={handleShare}
        className="w-full min-h-[46px] px-5 py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"
      >
        <Share2 className="w-4 h-4" />
        <span>Bagikan Tautan Sekarang</span>
      </button>
    </div>
  );
};

// ==========================================
// 5. PROFIL SAYA (TANPA DATA DUMMY)
// ==========================================

interface VoterProfileViewProps {
  voter: VoterDoc;
  onSaveProfile: (patch: {
    fullName: string;
    phone: string;
    region: string;
    address: string;
    occupation: string;
    birthDate: string;
  }) => Promise<void>;
  onLogout: () => Promise<void>;
}

export const VoterProfileView: React.FC<VoterProfileViewProps> = ({
  voter,
  onSaveProfile,
  onLogout,
}) => {
  const [fullName, setFullName] = useState(voter.fullName || '');
  const [phone, setPhone] = useState(voter.phone || '');
  const [region, setRegion] = useState(voter.region || '');
  const [address, setAddress] = useState(voter.address || '');
  const [occupation, setOccupation] = useState(voter.occupation || '');
  const [birthDate, setBirthDate] = useState(voter.birthDate || '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSaveProfile({
        fullName,
        phone,
        region,
        address,
        occupation,
        birthDate,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <section className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 space-y-5 shadow-2xs">
        <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-700 border border-blue-100 flex items-center justify-center shrink-0">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">Profil Pemilih</h2>
              <p className="text-xs text-slate-500">{voter.email}</p>
            </div>
          </div>
          <span className="text-xs font-bold font-mono text-blue-700">
            {voter.referralCode}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Nama Lengkap
              </label>
              <input
                type="text"
                required
                minLength={2}
                maxLength={120}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                No. Telepon / WhatsApp
              </label>
              <input
                type="tel"
                required
                minLength={6}
                maxLength={30}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Daerah / Dapil
              </label>
              <input
                type="text"
                required
                minLength={2}
                maxLength={120}
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Pekerjaan (Opsional)
              </label>
              <input
                type="text"
                maxLength={100}
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                placeholder="Isi manual pekerjaan Anda"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700">
                Tanggal Lahir (Opsional)
              </label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700">
                Alamat Lengkap
              </label>
              <textarea
                rows={2}
                required
                minLength={5}
                maxLength={300}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="min-h-[46px] px-6 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white font-bold text-sm cursor-pointer"
          >
            {saving ? 'Menyimpan...' : 'Simpan Perubahan Profil'}
          </button>
        </form>
      </section>

      <section className="rounded-2xl bg-white border border-slate-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <PWAInstallButton variant="outline" label="Pasang / Cek Status PWA" />
        <button
          type="button"
          onClick={() => onLogout()}
          className="min-h-[44px] px-4 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Keluar dari Akun</span>
        </button>
      </section>
    </div>
  );
};
