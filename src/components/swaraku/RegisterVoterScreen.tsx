import React, { useState } from 'react';
import type { User } from 'firebase/auth';
import { UserCheck, MapPin, Phone, Ticket, LogOut, AlertCircle } from 'lucide-react';

interface RegisterVoterScreenProps {
  user: User;
  initialReferralCode: string;
  onSubmitRegistration: (data: {
    fullName: string;
    address: string;
    region: string;
    phone: string;
    referralInput: string;
  }) => Promise<void>;
  onLogout: () => Promise<void>;
}

export const RegisterVoterScreen: React.FC<RegisterVoterScreenProps> = ({
  user,
  initialReferralCode,
  onSubmitRegistration,
  onLogout,
}) => {
  const [fullName, setFullName] = useState(user.displayName || '');
  const [address, setAddress] = useState('');
  const [region, setRegion] = useState('');
  const [phone, setPhone] = useState('');
  const [referralInput, setReferralInput] = useState(initialReferralCode);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (fullName.trim().length < 2) {
      setErrorMsg('Nama lengkap wajib diisi (minimal 2 karakter).');
      return;
    }
    if (address.trim().length < 5) {
      setErrorMsg('Alamat lengkap wajib diisi dengan jelas.');
      return;
    }
    if (region.trim().length < 2) {
      setErrorMsg('Daerah / Dapil wajib diisi (contoh: Kecamatan Cilandak).');
      return;
    }
    if (phone.trim().length < 6) {
      setErrorMsg('Nomor telepon / WhatsApp aktif wajib diisi.');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmitRegistration({
        fullName: fullName.trim(),
        address: address.trim(),
        region: region.trim(),
        phone: phone.trim(),
        referralInput: referralInput.trim(),
      });
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Gagal menyimpan pendaftaran. Silakan periksa koneksi Anda dan coba lagi.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-lg p-6 sm:p-8 space-y-6">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-700 text-white flex items-center justify-center shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-slate-900">
                Lengkapi Pendaftaran Akun
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Terhubung sebagai <span className="font-semibold text-slate-700">{user.email}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onLogout()}
            className="min-h-[40px] px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar</span>
          </button>
        </div>

        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs text-emerald-900">
          Isi data diri Anda secara manual untuk mengaktifkan <strong>Kantong Poin (+100 Poin Awal)</strong> dan menampilkan informasi Caleg sesuai Daerah / Dapil Anda.
        </div>

        {errorMsg && (
          <div className="rounded-2xl bg-rose-50 border border-rose-200 p-3.5 flex items-start gap-2.5 text-xs text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="reg-fullname" className="block text-xs font-bold text-slate-800">
              1. Nama Lengkap <span className="text-rose-600">*</span>
            </label>
            <input
              id="reg-fullname"
              type="text"
              required
              maxLength={120}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Masukkan nama lengkap sesuai KTP"
              className="w-full min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="reg-region" className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <MapPin className="w-3.5 h-3.5 text-blue-700" />
              <span>2. Daerah / Dapil <span className="text-rose-600">*</span></span>
            </label>
            <input
              id="reg-region"
              type="text"
              required
              maxLength={120}
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              placeholder="Contoh: Dapil 1 Jakarta Selatan / Kec. Cilandak"
              className="w-full min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="reg-address" className="block text-xs font-bold text-slate-800">
              Alamat Lengkap <span className="text-rose-600">*</span>
            </label>
            <textarea
              id="reg-address"
              required
              rows={2}
              maxLength={300}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Nama jalan, nomor rumah, RT/RW, Kelurahan"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="reg-phone" className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <Phone className="w-3.5 h-3.5 text-blue-700" />
              <span>3. Nomor Telepon Aktif (WhatsApp) <span className="text-rose-600">*</span></span>
            </label>
            <input
              id="reg-phone"
              type="tel"
              required
              maxLength={30}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Contoh: 081234567890"
              className="w-full min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="reg-referral" className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <Ticket className="w-3.5 h-3.5 text-slate-500" />
              <span>Kode Undangan / Referral (Opsional)</span>
            </label>
            <input
              id="reg-referral"
              type="text"
              maxLength={32}
              value={referralInput}
              onChange={(e) => setReferralInput(e.target.value.toUpperCase())}
              placeholder="Kosongkan jika tidak ada"
              className="w-full min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-sm font-mono uppercase text-slate-900 placeholder:normal-case placeholder:font-sans focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:bg-white"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white font-bold text-sm shadow-sm transition-colors cursor-pointer"
          >
            {submitting ? 'Menyimpan Data ke Cloud...' : 'Simpan & Masuk ke Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
};
