import React, { useState } from 'react';
import { NewsItem, MissionItem } from '../../types/vore';
import {
  QrCode,
  Share2,
  Copy,
  Check,
  X,
  MessageSquare,
  ThumbsUp,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

interface ReferralModalProps {
  isOpen: boolean;
  onClose: () => void;
  referralCode: string;
  onOpenTambahNik?: () => void;
}

export const ReferralModal: React.FC<ReferralModalProps> = ({
  isOpen,
  onClose,
  referralCode,
  onOpenTambahNik,
}) => {
  const [copied, setCopied] = useState(false);
  if (!isOpen) return null;

  const referralUrl = `https://swaraku.com/join?ref=${referralCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <span className="text-xs font-bold text-slate-900">Undang Teman &amp; Tetangga</span>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="text-center space-y-2">
          <div className="w-36 h-36 bg-slate-50 p-2.5 rounded-2xl border border-slate-200 shadow-inner mx-auto flex items-center justify-center">
            <QrCode className="w-32 h-32 text-slate-900" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 block">Kode Referral Anda</span>
            <span className="font-mono text-base font-extrabold text-cyan-700 tracking-wider">
              {referralCode}
            </span>
          </div>
          <p className="text-xs text-slate-600">
            Ajak tetangga dan kawan mendaftar dan memverifikasi TPS mereka guna memperkuat basis pendukung pemenangan.
          </p>
        </div>

        {onOpenTambahNik && (
          <button
            onClick={() => {
              onClose();
              onOpenTambahNik();
            }}
            className="w-full py-2 px-3 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 text-xs font-bold rounded-xl border border-cyan-200 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
          >
            <span>+ Input Manual NIK Teman</span>
          </button>
        )}

        <div className="space-y-2 pt-1">
          <div className="flex items-center gap-1.5 p-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            <input
              type="text"
              readOnly
              value={referralUrl}
              className="bg-transparent flex-1 text-slate-700 text-[11px] outline-hidden px-1"
            />
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer shadow-xs transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Tersalin' : 'Salin'}</span>
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Bagikan via WhatsApp / Pesan</span>
          </button>
        </div>
      </div>
    </div>
  );
};

interface NewsDetailModalProps {
  news: NewsItem | null;
  onClose: () => void;
}

export const NewsDetailModal: React.FC<NewsDetailModalProps> = ({ news, onClose }) => {
  const [likes, setLikes] = useState(48);
  const [hasLiked, setHasLiked] = useState(false);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([
    {
      nama: 'Haji Sulaiman (Ketua RW 04)',
      teks: 'Sangat kami dukung integrasi angkutan mikrobus listrik ini sampai ke jalan lingkungan.',
      waktu: '1 jam lalu',
    },
    {
      nama: 'dr. Nabila',
      teks: 'Akses warga ke fasilitas kesehatan akan jauh lebih cepat dan minim polusi.',
      waktu: '30 menit lalu',
    },
  ]);

  if (!news) return null;

  const handleLike = () => {
    if (!hasLiked) {
      setLikes(likes + 1);
      setHasLiked(true);
    }
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setComments([
      ...comments,
      {
        nama: 'Rani Rizky (Anda)',
        teks: comment,
        waktu: 'Baru saja',
      },
    ]);
    setComment('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <span className="text-[11px] font-bold text-cyan-600 uppercase">{news.kategori}</span>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div>
          <h2 className="text-base font-bold text-slate-900 leading-snug">{news.judul}</h2>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
            <span>{news.penulis}</span>
            <span>·</span>
            <span>{news.waktu}</span>
          </div>
        </div>

        <p className="text-xs text-slate-700 leading-relaxed">{news.ringkasan}</p>
        <p className="text-xs text-slate-600 leading-relaxed">
          Program ini dirancang langsung berdasarkan hasil jaring aspirasi warga Dapil II selama 6 bulan terakhir. Tim riset dan kebijakan publik telah merampungkan roadmap teknis implementasi bersama dinas perhubungan dan komite warga.
        </p>

        {/* Engagement Bar */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-colors cursor-pointer ${
              hasLiked
                ? 'bg-cyan-50 border-cyan-300 text-cyan-700 font-bold'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ThumbsUp className="w-3.5 h-3.5" />
            <span>Dukung Berita ({likes})</span>
          </button>
          <span className="text-slate-400">{comments.length} Komentar Warga</span>
        </div>

        {/* Comments Section */}
        <div className="space-y-3 pt-1">
          <span className="text-xs font-bold text-slate-900 block">Ruang Dialog Warga</span>
          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
            {comments.map((c, i) => (
              <div key={i} className="p-2.5 bg-slate-50 rounded-xl text-xs space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">{c.nama}</span>
                  <span className="text-[10px] text-slate-400">{c.waktu}</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">{c.teks}</p>
              </div>
            ))}
          </div>

          <form onSubmit={handleAddComment} className="flex gap-2">
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tuliskan pendapat Anda..."
              className="flex-1 text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-cyan-500"
            />
            <button
              type="submit"
              className="px-3 py-2 bg-cyan-600 text-white rounded-xl text-xs font-bold hover:bg-cyan-700 cursor-pointer"
            >
              Kirim
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

interface MissionSurveyModalProps {
  mission: MissionItem | null;
  onClose: () => void;
  onComplete: (missionId: string) => void;
}

export const MissionSurveyModal: React.FC<MissionSurveyModalProps> = ({
  mission,
  onClose,
  onComplete,
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState('Transportasi Publik Bersih');

  if (!mission) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete(mission.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl"
      >
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <span className="text-xs font-bold text-slate-900">{mission.judul}</span>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="space-y-2 text-xs">
          <p className="text-slate-600 leading-relaxed">{mission.deskripsi}</p>
          <div className="p-2.5 bg-amber-50 rounded-xl text-amber-900 border border-amber-200 font-semibold">
            Pertanyaan: Menurut Anda, program mana yang paling mendesak diimplementasikan di kelurahan Anda?
          </div>

          <div className="space-y-1.5 pt-1">
            {[
              'Transportasi Publik Bersih & Murah',
              'Pelatihan Keterampilan Kerja Pemuda SMK',
              'Puskesmas Siaga 24 Jam & Antrean Online',
              'Pavingisasi Jalan & Pembenahan Saluran Air',
            ].map((option) => (
              <label
                key={option}
                className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100"
              >
                <input
                  type="radio"
                  name="surveyOption"
                  checked={selectedAnswer === option}
                  onChange={() => setSelectedAnswer(option)}
                  className="accent-cyan-600"
                />
                <span className="text-slate-700 text-xs font-medium">{option}</span>
              </label>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
        >
          Kirim Jawaban &amp; Selesaikan Misi (+{mission.poin} Poin)
        </button>
      </form>
    </div>
  );
};
