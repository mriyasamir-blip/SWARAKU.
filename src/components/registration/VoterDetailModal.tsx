import React, { useState } from 'react';
import {
  Calendar,
  CreditCard,
  Eye,
  EyeOff,
  MapPin,
  Maximize2,
  Phone,
  ScanLine,
  ShieldCheck,
  User,
  X,
} from 'lucide-react';
import type { VoterOcrRecord } from '../../types/vore';

export function isVoterOcrVerified(voter: VoterOcrRecord): boolean {
  if (voter.ocrVerified === true || voter.registrationSource === 'ocr_ktp') return true;
  const cleanNik = String(voter.nik || '').replace(/\D/g, '');
  const hasRealTtl = Boolean(voter.tempatTglLahir && voter.tempatTglLahir.trim() !== '-');
  const hasRealRtRw = Boolean(voter.rtRw && voter.rtRw.trim() !== '-');
  return cleanNik.length === 16 && (Boolean(voter.fotoKtpUrl) || hasRealTtl || hasRealRtRw);
}

interface VoterDetailModalProps {
  voter: VoterOcrRecord | null;
  onClose: () => void;
}

export const VoterDetailModal: React.FC<VoterDetailModalProps> = ({ voter, onClose }) => {
  const [showFullNik, setShowFullNik] = useState(false);
  const [zoomPhoto, setZoomPhoto] = useState(false);

  if (!voter) return null;

  const ocrVerified = isVoterOcrVerified(voter);

  const ttlDisplay =
    voter.tempatLahir || voter.tanggalLahir
      ? [voter.tempatLahir, voter.tanggalLahir].filter(Boolean).join(', ')
      : voter.tempatTglLahir && voter.tempatTglLahir !== '-'
      ? voter.tempatTglLahir
      : '-';

  return (
    <div className="fixed inset-0 z-[60] bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 my-auto max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-700">
                Detail Konstituen (Voter)
              </span>
              {ocrVerified ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-extrabold">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Terverifikasi OCR KTP</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-bold">
                  <span>Input Manual / Online</span>
                </span>
              )}
            </div>
            <h3 className="text-lg font-black text-slate-900 break-words">{voter.nama}</h3>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-600">
              <CreditCard className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>
                NIK: {showFullNik ? voter.nik || '-' : voter.nikMasked || voter.nik || '-'}
              </span>
              {voter.nik && voter.nik.length >= 8 && (
                <button
                  type="button"
                  onClick={() => setShowFullNik((v) => !v)}
                  className="text-[10px] font-sans font-bold text-blue-700 hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                >
                  {showFullNik ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span>{showFullNik ? 'Sensor' : 'Lihat'}</span>
                </button>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer shrink-0"
            aria-label="Tutup detail konstituen"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Foto KTP / ID (if saved) */}
        {voter.fotoKtpUrl && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
              <span className="inline-flex items-center gap-1.5">
                <ScanLine className="w-3.5 h-3.5 text-emerald-600" />
                <span>Foto Kartu Identitas / e-KTP Tersimpan</span>
              </span>
              <button
                type="button"
                onClick={() => setZoomPhoto(true)}
                className="text-blue-700 hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <Maximize2 className="w-3 h-3" />
                <span>Perbesar</span>
              </button>
            </div>
            <button
              type="button"
              onClick={() => setZoomPhoto(true)}
              className="w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 block cursor-pointer group"
            >
              <img
                src={voter.fotoKtpUrl}
                alt={`Foto ID ${voter.nama}`}
                className="w-full max-h-48 object-cover group-hover:scale-[1.01] transition-transform"
              />
            </button>
          </div>
        )}

        {/* Structured Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] text-slate-500 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Tempat &amp; Tanggal Lahir
            </span>
            <span className="font-bold text-slate-900 mt-0.5 block">{ttlDisplay}</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] text-slate-500 flex items-center gap-1">
              <User className="w-3 h-3" />
              Jenis Kelamin
            </span>
            <span className="font-bold text-slate-900 mt-0.5 block">
              {voter.jenisKelamin || '-'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] text-slate-500 block">Kota / Kabupaten</span>
            <span className="font-bold text-slate-900 mt-0.5 block">
              {voter.kabupatenKota || '-'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] text-slate-500 block">Kecamatan</span>
            <span className="font-bold text-slate-900 mt-0.5 block">
              {voter.kecamatan || '-'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] text-slate-500 block">Kelurahan</span>
            <span className="font-bold text-cyan-800 mt-0.5 block">
              {voter.kelurahan || '-'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] text-slate-500 block">RT / RW</span>
            <span className="font-mono font-bold text-slate-900 mt-0.5 block">
              {voter.rtRw && voter.rtRw !== '-' ? voter.rtRw : '-'}
            </span>
          </div>

          <div className="sm:col-span-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] text-slate-500 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              Alamat Lengkap
            </span>
            <span className="font-semibold text-slate-900 mt-0.5 block">
              {voter.alamat || '-'}
            </span>
          </div>

          <div className="sm:col-span-2 p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
            <div>
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <Phone className="w-3 h-3" />
                No. HP / WhatsApp
              </span>
              <span className="font-mono font-bold text-slate-900 mt-0.5 block">
                {voter.noHp || '-'}
              </span>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold">
              {voter.statusDpt || 'DPT valid'}
            </span>
          </div>

          <div className="sm:col-span-2 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-[11px] text-emerald-700 font-semibold block">
                  Nama Penginput
                </span>
                <span className="font-bold text-slate-900">
                  {voter.diinputOlehNama || voter.terdaftarOleh || '-'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-emerald-700 font-semibold block">
                  Tanggal Pendaftaran
                </span>
                <span className="text-[11px] font-mono font-bold text-slate-800">
                  {voter.waktuDaftar || '-'}
                </span>
              </div>
            </div>
            <div className="pt-2 border-t border-emerald-200/80">
              <span className="text-[11px] text-emerald-700 font-semibold block">
                Wilayah Input (Kota / Kecamatan / Kelurahan)
              </span>
              <span className="text-xs font-bold text-slate-900">
                {[voter.kabupatenKota, voter.kecamatan, voter.kelurahan]
                  .filter((p) => p && p !== '-')
                  .join(' / ') || '-'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
          >
            Tutup Detail
          </button>
        </div>
      </div>

      {/* Zoom Lightbox for Foto KTP */}
      {zoomPhoto && voter.fotoKtpUrl && (
        <div
          className="fixed inset-0 z-[70] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setZoomPhoto(false)}
        >
          <div className="relative max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setZoomPhoto(false)}
              className="absolute -top-11 right-0 p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white cursor-pointer"
              aria-label="Tutup pratinjau penuh"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={voter.fotoKtpUrl}
              alt={`Pratinjau penuh ID ${voter.nama}`}
              className="w-full max-h-[82vh] object-contain rounded-2xl border border-white/20"
            />
          </div>
        </div>
      )}
    </div>
  );
};
