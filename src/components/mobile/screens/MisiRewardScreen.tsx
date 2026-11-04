import React, { useState } from 'react';
import { MissionItem, RewardItem, VoterProfile } from '../../../types/vore';
import {
  Sparkles,
  Award,
  Gift,
  Clock,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  Store,
  Smartphone,
  ShoppingBag,
  ShieldCheck,
  QrCode,
  X,
  Vote,
} from 'lucide-react';

interface MisiRewardScreenProps {
  profile: VoterProfile;
  missions: MissionItem[];
  rewards: RewardItem[];
  onClaimMission: (id: string) => void;
  onExecuteMission: (mission: MissionItem) => void;
  onRedeemReward: (reward: RewardItem) => void;
}

export const MisiRewardScreen: React.FC<MisiRewardScreenProps> = ({
  profile,
  missions,
  rewards,
  onClaimMission,
  onExecuteMission,
  onRedeemReward,
}) => {
  const [activeTab, setActiveTab] = useState<'misi' | 'katalog'>('misi');
  const [selectedReward, setSelectedReward] = useState<RewardItem | null>(null);
  const [redeemedCode, setRedeemedCode] = useState<string | null>(null);

  const harianMissions = missions.filter((m) => m.tipe === 'harian');
  const mingguanMissions = missions.filter((m) => m.tipe === 'mingguan');

  const handleRedeemClick = (reward: RewardItem) => {
    setSelectedReward(reward);
    setRedeemedCode(null);
  };

  const handleConfirmRedeem = () => {
    if (!selectedReward) return;
    if (profile.poinSuara < selectedReward.poin) {
      alert('Poin Suara Anda belum mencukupi untuk reward ini.');
      return;
    }
    const code = `SWARAKU-${selectedReward.kategori.slice(0, 3).toUpperCase()}-${Math.floor(
      100000 + Math.random() * 900000
    )}`;
    setRedeemedCode(code);
    onRedeemReward(selectedReward);
  };

  return (
    <div className="flex flex-col space-y-4 pb-8">
      {/* Top Points & Tier Hero Card (Slide 11) */}
      <div className="p-4 rounded-3xl bg-gradient-to-br from-cyan-600 via-teal-600 to-cyan-700 text-white shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-36 h-36 bg-white/10 rounded-full blur-2xl"></div>

        <div className="flex items-start justify-between relative z-10">
          <div>
            <span className="text-[11px] font-bold text-cyan-100 uppercase tracking-wider">
              Saldo Poin Suara
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-extrabold tracking-tight text-white font-mono tabular-nums">
                {profile.poinSuara.toLocaleString('id-ID')}
              </span>
              <span className="text-xs text-cyan-100 font-semibold">Poin Suara</span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-cyan-100 uppercase block font-semibold">
              Tier Saat Ini
            </span>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400 text-slate-950 font-black text-xs rounded-full shadow-xs mt-1">
              <span>★</span>
              <span>{profile.tier.toUpperCase()}</span>
            </div>
          </div>
        </div>

        {/* Progress Bar to Next Tier */}
        <div className="mt-4 pt-3 border-t border-white/20 relative z-10">
          <div className="flex items-center justify-between text-[11px] text-cyan-50 mb-1.5 font-medium">
            <span>Progress menuju tier berikutnya</span>
            <span className="font-mono text-white font-bold">
              {profile.poinNextTier} / {profile.tierMaxPoin} lagi untuk PLATINUM
            </span>
          </div>
          <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-700"
              style={{
                width: `${Math.min(
                  100,
                  ((profile.tierMaxPoin - profile.poinNextTier) / profile.tierMaxPoin) * 100
                )}%`,
              }}
            ></div>
          </div>
        </div>
      </div>

      {/* Segmented Control / Tab Filter */}
      <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl">
        <button
          onClick={() => setActiveTab('misi')}
          className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === 'misi'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Misi &amp; Poin
        </button>
        <button
          onClick={() => setActiveTab('katalog')}
          className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === 'katalog'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Katalog Reward ({rewards.length})
        </button>
      </div>

      {activeTab === 'misi' ? (
        <div className="space-y-4">
          {/* Misi Harian Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm font-bold text-slate-900">Misi Harian</h2>
                <span className="text-[10px] text-cyan-600 font-semibold bg-cyan-50 px-2 py-0.5 rounded-full">
                  Segar Tiap Hari
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                <Clock className="w-3 h-3" />
                <span>Reset dalam 10:25:30</span>
              </div>
            </div>

            <div className="space-y-2">
              {harianMissions.map((mission) => (
                <div
                  key={mission.id}
                  className={`p-3 rounded-2xl border shadow-xs flex items-center justify-between gap-3 transition-all ${
                    mission.actionType === 'survey'
                      ? 'bg-gradient-to-r from-cyan-50/70 to-white border-cyan-200 hover:border-cyan-300'
                      : 'bg-white border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {mission.actionType === 'survey' && (
                        <Vote className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                      )}
                      <h3 className="text-xs font-bold text-slate-900 line-clamp-1">
                        {mission.judul}
                      </h3>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-sm shrink-0">
                        +{mission.poin} poin
                      </span>
                      {mission.actionType === 'survey' && (
                        <span className="text-[9px] font-bold text-cyan-800 bg-cyan-100/70 border border-cyan-200 px-1.5 py-0.5 rounded-full shrink-0">
                          Quick Count Tabulasi
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                      {mission.deskripsi}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                      <span>Progres: {mission.progress}/{mission.maxProgress}</span>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {mission.isClaimed ? (
                      <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 px-2.5 py-1 bg-slate-100 rounded-lg">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        Selesai
                      </span>
                    ) : mission.isCompleted ? (
                      <button
                        onClick={() => onClaimMission(mission.id)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                      >
                        Klaim Poin
                      </button>
                    ) : (
                      <button
                        onClick={() => onExecuteMission(mission)}
                        className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                      >
                        Mulai Misi
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Misi Mingguan Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm font-bold text-slate-900">Misi Mingguan</h2>
                <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-full">
                  Poin Ekstra
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                <Clock className="w-3 h-3" />
                <span>Reset dalam 3 hari</span>
              </div>
            </div>

            <div className="space-y-2">
              {mingguanMissions.map((mission) => (
                <div
                  key={mission.id}
                  className="p-3 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-3 hover:border-slate-300 transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-bold text-slate-900 line-clamp-1">
                        {mission.judul}
                      </h3>
                      <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded-sm shrink-0">
                        +{mission.poin} poin
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                      {mission.deskripsi}
                    </p>
                  </div>

                  <div className="shrink-0">
                    {mission.isClaimed ? (
                      <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 px-2.5 py-1 bg-slate-100 rounded-lg">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        Selesai
                      </span>
                    ) : mission.isCompleted ? (
                      <button
                        onClick={() => onClaimMission(mission.id)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                      >
                        Klaim Poin
                      </button>
                    ) : (
                      <button
                        onClick={() => onExecuteMission(mission)}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                      >
                        Mulai Misi
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Gamification Philosophy Card (Slide 14) */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs">
            <span className="font-bold text-slate-900 block mb-1">
              Misi kecil menuju aksi BESAR
            </span>
            <p className="text-[11px] text-slate-500 mb-2.5">
              Setiap partisipasi memperkaya profil, membangun kebiasaan positif, dan memperkuat suara kolektif warga hingga ke TPS.
            </p>
            <div className="grid grid-cols-5 gap-1 text-center text-[10px]">
              <div className="p-1.5 bg-white rounded-lg border border-slate-200 font-semibold text-slate-700">
                1. Pilih
              </div>
              <div className="p-1.5 bg-white rounded-lg border border-slate-200 font-semibold text-slate-700">
                2. Kerjakan
              </div>
              <div className="p-1.5 bg-white rounded-lg border border-slate-200 font-semibold text-slate-700">
                3. Poin
              </div>
              <div className="p-1.5 bg-white rounded-lg border border-slate-200 font-semibold text-slate-700">
                4. Reward
              </div>
              <div className="p-1.5 bg-white rounded-lg border border-cyan-300 font-bold text-cyan-800 bg-cyan-50">
                5. TPS
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Tab Katalog Reward */
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-600 px-1">
            <span>Tukar poin Anda dengan reward nyata dari mitra kami.</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {rewards.map((reward) => {
              const canAfford = profile.poinSuara >= reward.poin;
              return (
                <div
                  key={reward.id}
                  className="p-3 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-cyan-300 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="w-full h-24 bg-gradient-to-tr from-slate-100 to-cyan-50 rounded-xl flex items-center justify-center text-4xl mb-2 border border-slate-100">
                      {reward.gambar}
                    </div>
                    <span className="text-[10px] font-bold text-cyan-600 uppercase">
                      {reward.mitra}
                    </span>
                    <h3 className="text-xs font-bold text-slate-900 mt-0.5 line-clamp-2">
                      {reward.nama}
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">
                      {reward.deskripsi}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100">
                    <div className="flex items-baseline justify-between mb-2">
                      <span className="text-[10px] text-slate-400">Dibutuhkan:</span>
                      <span className="text-xs font-extrabold text-amber-600 font-mono">
                        {reward.poin} Poin
                      </span>
                    </div>

                    <button
                      onClick={() => handleRedeemClick(reward)}
                      className={`w-full py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        canAfford
                          ? 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      {canAfford ? 'Tukar Reward' : 'Poin Kurang'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Reward Redemption Modal */}
      {selectedReward && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-900">Konfirmasi Penukaran</span>
              <button
                onClick={() => setSelectedReward(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-cyan-50 rounded-2xl mx-auto flex items-center justify-center text-3xl">
                {selectedReward.gambar}
              </div>
              <h3 className="text-sm font-bold text-slate-900">{selectedReward.nama}</h3>
              <p className="text-xs text-slate-500">{selectedReward.deskripsi}</p>
              <div className="inline-block px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-xs font-bold text-amber-800">
                Biaya: {selectedReward.poin} Poin Suara
              </div>
            </div>

            {redeemedCode ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
                <div className="flex items-center justify-center gap-1 text-emerald-800 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Penukaran Berhasil!</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-emerald-200 font-mono text-sm font-extrabold text-slate-900 tracking-wider">
                  {redeemedCode}
                </div>
                <p className="text-[10px] text-emerald-700">
                  Tunjukkan kode atau QR ini ke kasir mitra ({selectedReward.mitra}) untuk klaim voucher.
                </p>
                <div className="flex justify-center pt-1">
                  <div className="w-24 h-24 bg-white p-2 rounded-lg border border-slate-200 flex items-center justify-center">
                    <QrCode className="w-20 h-20 text-slate-800" />
                  </div>
                </div>
                <button
                  onClick={() => setSelectedReward(null)}
                  className="w-full mt-2 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl"
                >
                  Selesai
                </button>
              </div>
            ) : (
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs text-slate-600 px-1">
                  <span>Sisa poin setelah tukar:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {(profile.poinSuara - selectedReward.poin).toLocaleString('id-ID')} Poin
                  </span>
                </div>

                <button
                  onClick={handleConfirmRedeem}
                  className="w-full py-2.5 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-all"
                >
                  Konfirmasi &amp; Dapatkan Voucher
                </button>
                <button
                  onClick={() => setSelectedReward(null)}
                  className="w-full py-2 text-xs font-medium text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Batal
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
