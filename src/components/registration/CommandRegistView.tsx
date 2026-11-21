import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Award,
  Building2,
  Camera,
  CheckCircle2,
  CreditCard,
  Eye,
  EyeOff,
  Keyboard,
  Lock,
  Mail,
  MapPin,
  Phone,
  QrCode,
  ShieldCheck,
  Sparkles,
  Upload,
  User as UserIcon,
  UserCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import type { UserAccount, UserRole, VoterOcrRecord } from '../../types/vore';
import type { TimSuksesWilayahRecord } from '../../data/petaSuaraData';
import { WilayahSelector, type WilayahValue } from '../common/WilayahSelector';
import { formatWilayahLabel, getProvinsiByKota } from '../../data/wilayahIndonesia';
import { lookupSmartCoordinates, resolveAccurateCoordinates } from '../../utils/geocoding';

type RegistCategory = 'voter' | 'relawan' | 'koordinator';
type InputMethod = 'manual' | 'qr';

interface CommandRegistViewProps {
  currentUser: UserAccount;
  userAccounts: UserAccount[];
  onSaveVoter: (voter: VoterOcrRecord) => void;
  onAddUser: (user: UserAccount) => Promise<boolean | void>;
  onSaveTimSukses?: (ts: TimSuksesWilayahRecord) => void;
  onAwardPoints: (delta: number) => Promise<void> | void;
  onNotify: (msg: string) => void;
}

const POINTS_REWARD: Record<RegistCategory, number> = {
  voter: 10,
  relawan: 25,
  koordinator: 50,
};

function parseQrIdentityPayload(raw: string): {
  nama?: string;
  nik?: string;
  noHp?: string;
  email?: string;
  alamat?: string;
  kota?: string;
  kecamatan?: string;
  kelurahan?: string;
} {
  const trimmed = raw.trim();
  if (!trimmed) return {};

  // 1. JSON payload
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const obj = JSON.parse(trimmed) as Record<string, unknown>;
      return {
        nama: String(obj.nama || obj.name || obj.fullName || '').trim() || undefined,
        nik: String(obj.nik || obj.id || '').replace(/\D/g, '').slice(0, 16) || undefined,
        noHp: String(obj.noHp || obj.phone || obj.hp || obj.wa || '').trim() || undefined,
        email: String(obj.email || '').trim() || undefined,
        alamat: String(obj.alamat || obj.address || '').trim() || undefined,
        kota: String(obj.kota || '').trim() || undefined,
        kecamatan: String(obj.kecamatan || '').trim() || undefined,
        kelurahan: String(obj.kelurahan || '').trim() || undefined,
      };
    } catch {
      // Fall through to pipe/delimited parsing
    }
  }

  // 2. Pipe / semicolon separated: NIK|NAMA|NOHP|ALAMAT or NAMA|NIK|NOHP
  const parts = trimmed.split(/[|;\n]/).map((s) => s.trim()).filter(Boolean);
  if (parts.length >= 2) {
    const nikPart = parts.find((p) => /^\d{12,16}$/.test(p.replace(/\D/g, '')));
    const hpPart = parts.find((p) => /^(08|\+?628)\d{7,13}$/.test(p.replace(/[\s-]/g, '')));
    const emailPart = parts.find((p) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p));
    const namaPart = parts.find(
      (p) => p !== nikPart && p !== hpPart && p !== emailPart && /[a-zA-Z]{2,}/.test(p)
    );
    return {
      nik: nikPart ? nikPart.replace(/\D/g, '').slice(0, 16) : undefined,
      nama: namaPart,
      noHp: hpPart,
      email: emailPart,
    };
  }

  // 3. Single token: either 16-digit NIK or full name
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length >= 12) {
    return { nik: digits.slice(0, 16) };
  }
  return { nama: trimmed };
}

export const CommandRegistView: React.FC<CommandRegistViewProps> = ({
  currentUser,
  userAccounts,
  onSaveVoter,
  onAddUser,
  onSaveTimSukses,
  onAwardPoints,
  onNotify,
}) => {
  const role = currentUser.role;

  // Role Access Matrix (STRICT)
  const canRegistVoter = true; // Relawan (Primary), Korcam, Korwil, Admin, SuperAdmin
  const canRegistRelawan =
    role === 'kader' || role === 'tim_sukses' || role === 'admin' || role === 'super_admin';
  const canRegistKoordinator =
    role === 'tim_sukses' || role === 'admin' || role === 'super_admin';

  const primaryCategory: RegistCategory =
    role === 'relawan'
      ? 'voter'
      : role === 'kader'
      ? 'relawan'
      : role === 'admin' || role === 'super_admin'
      ? 'koordinator'
      : 'voter';

  const [category, setCategory] = useState<RegistCategory>(primaryCategory);
  const [inputMethod, setInputMethod] = useState<InputMethod>('manual');

  // QR Scanner State
  const [qrRawInput, setQrRawInput] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [qrStatus, setQrStatus] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanTimerRef = useRef<number | null>(null);

  // Common Identity Fields
  const [nama, setNama] = useState('');
  const [nik, setNik] = useState('');
  const [noHp, setNoHp] = useState('');
  const [jenisKelamin, setJenisKelamin] = useState<'Laki-laki' | 'Perempuan'>('Laki-laki');
  const [wilayah, setWilayah] = useState<WilayahValue>({
    kota: currentUser.kota || 'Jakarta Selatan',
    kecamatan: currentUser.kecamatan || '',
    kelurahan: currentUser.kelurahan || '',
  });
  const [alamat, setAlamat] = useState('');
  const [fotoUrl, setFotoUrl] = useState('');

  // Account Fields (for Relawan / Korcam / Korwil)
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [targetCoordinatorRole, setTargetCoordinatorRole] = useState<'kader' | 'tim_sukses'>(
    role === 'tim_sukses' ? 'kader' : 'tim_sukses'
  );

  // Geocoded Coordinates Preview for Voter
  const [resolvedCoords, setResolvedCoords] = useState<{ lat: number; lng: number; source: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Ensure active category stays valid if role changes
  useEffect(() => {
    if (category === 'relawan' && !canRegistRelawan) setCategory('voter');
    if (category === 'koordinator' && !canRegistKoordinator) setCategory(primaryCategory);
  }, [category, canRegistRelawan, canRegistKoordinator, primaryCategory]);

  // Auto-resolve coordinates whenever Kota / Kecamatan / Kelurahan changes
  useEffect(() => {
    if (!wilayah.kota && !wilayah.kecamatan && !wilayah.kelurahan) {
      setResolvedCoords(null);
      return;
    }
    const smart = lookupSmartCoordinates(
      wilayah.kelurahan,
      wilayah.kecamatan,
      wilayah.kota
    );
    if (smart) {
      setResolvedCoords({ lat: smart.lat, lng: smart.lng, source: 'Kamus Wilayah Indonesia' });
    }
  }, [wilayah.kota, wilayah.kecamatan, wilayah.kelurahan]);

  // Stop camera stream on unmount or mode switch
  const stopCamera = () => {
    if (scanTimerRef.current) {
      window.clearInterval(scanTimerRef.current);
      scanTimerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  useEffect(() => {
    if (inputMethod !== 'qr') stopCamera();
  }, [inputMethod]);

  const applyQrData = (raw: string) => {
    const parsed = parseQrIdentityPayload(raw);
    if (parsed.nama) setNama(parsed.nama);
    if (parsed.nik) setNik(parsed.nik);
    if (parsed.noHp) setNoHp(parsed.noHp);
    if (parsed.email) setEmail(parsed.email);
    if (parsed.alamat) setAlamat(parsed.alamat);
    if (parsed.kota || parsed.kecamatan || parsed.kelurahan) {
      setWilayah((prev) => ({
        kota: parsed.kota || prev.kota,
        kecamatan: parsed.kecamatan || prev.kecamatan,
        kelurahan: parsed.kelurahan || prev.kelurahan,
      }));
    }
    setQrStatus(
      `Data ID terbaca (${parsed.nama || parsed.nik || 'QR valid'}). Lengkapi wilayah & simpan.`
    );
    stopCamera();
  };

  const handleStartCameraScan = async () => {
    setFormError(null);
    setQrStatus(null);
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setQrStatus('Kamera tidak tersedia di perangkat ini. Gunakan kolom tempel/input kode QR di bawah.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      setCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 100);

      const BarcodeDetectorCtor = (
        window as unknown as {
          BarcodeDetector?: new (opts: { formats: string[] }) => {
            detect: (el: HTMLVideoElement) => Promise<Array<{ rawValue?: string }>>;
          };
        }
      ).BarcodeDetector;

      if (BarcodeDetectorCtor) {
        const detector = new BarcodeDetectorCtor({ formats: ['qr_code', 'code_128', 'pdf417'] });
        setQrStatus('Arahkan kamera ke QR ID / Kartu Identitas...');
        scanTimerRef.current = window.setInterval(async () => {
          if (!videoRef.current || videoRef.current.readyState < 2) return;
          try {
            const barcodes = await detector.detect(videoRef.current);
            if (barcodes.length > 0 && barcodes[0].rawValue) {
              setQrRawInput(barcodes[0].rawValue);
              applyQrData(barcodes[0].rawValue);
            }
          } catch {
            // Keep scanning
          }
        }, 600);
      } else {
        setQrStatus('Kamera aktif. Browser ini tidak mendukung deteksi QR otomatis — silakan tempel hasil scan pada kolom di bawah.');
      }
    } catch {
      setQrStatus('Izin kamera ditolak atau tidak tersedia. Anda tetap dapat menempelkan kode QR di bawah.');
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setFotoUrl(String(reader.result || ''));
    };
    reader.readAsDataURL(file);
  };

  // Auto-generate username slug from name for account registration
  const handleNamaChange = (val: string) => {
    setNama(val);
    if (category !== 'voter' && (!username || username.startsWith('rel_') || username.startsWith('kor_'))) {
      const slug = val.trim().toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12);
      if (slug) {
        const prefix = category === 'relawan' ? 'rel_' : 'kor_';
        setUsername(`${prefix}${slug}`);
      }
    }
  };

  const resetForm = () => {
    setNama('');
    setNik('');
    setNoHp('');
    setAlamat('');
    setFotoUrl('');
    setUsername('');
    setEmail('');
    setPassword('123456');
    setQrRawInput('');
    setQrStatus(null);
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessBanner(null);

    if (nama.trim().length < 2) {
      setFormError('Nama Lengkap wajib diisi minimal 2 karakter.');
      return;
    }
    if (!wilayah.kota || !wilayah.kecamatan || !wilayah.kelurahan) {
      setFormError('Wilayah wajib lengkap: pilih Kota, Kecamatan, dan Kelurahan terlebih dahulu.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (category === 'voter') {
        if (alamat.trim().length < 4) {
          setFormError('Alamat lengkap Voter wajib diisi agar akurat di Peta Suara.');
          setIsSubmitting(false);
          return;
        }

        const cleanNik = nik.replace(/\D/g, '') || `${Date.now()}`.slice(-16).padStart(16, '0');
        const coords = await resolveAccurateCoordinates({
          kelurahan: wilayah.kelurahan,
          kecamatan: wilayah.kecamatan,
          kota: wilayah.kota,
          provinsi: getProvinsiByKota(wilayah.kota),
        });

        const roleTag: VoterOcrRecord['diinputOlehRole'] =
          role === 'tim_sukses'
            ? 'tim_sukses'
            : role === 'kader'
            ? 'kader'
            : role === 'relawan'
            ? 'relawan'
            : 'admin';

        const newVoter: VoterOcrRecord = {
          id: `v-${cleanNik}-${Date.now().toString().slice(-4)}`,
          nik: cleanNik,
          nikMasked:
            cleanNik.length >= 8
              ? `${cleanNik.slice(0, 4)}••••••••${cleanNik.slice(-4)}`
              : cleanNik,
          nama: nama.trim().toUpperCase(),
          tempatTglLahir: '-',
          jenisKelamin,
          alamat: alamat.trim(),
          rtRw: '-',
          kelurahan: wilayah.kelurahan,
          kecamatan: wilayah.kecamatan,
          kabupatenKota: wilayah.kota,
          provinsi: getProvinsiByKota(wilayah.kota),
          tps: `Kel. ${wilayah.kelurahan}`,
          noHp: noHp.trim() || '-',
          waktuDaftar: new Date().toLocaleString('id-ID'),
          fotoKtpUrl: fotoUrl || undefined,
          statusDpt: 'DPT valid',
          statusRegistrasi: 'TERDAFTAR',
          terdaftarOleh: currentUser.nama,
          diinputOlehRole: roleTag,
          diinputOlehNama: currentUser.nama,
          registrationSource: 'command_regist',
          lat: coords.lat,
          lng: coords.lng,
        };

        onSaveVoter(newVoter);
        await onAwardPoints(POINTS_REWARD.voter);

        const msg = `Voter berhasil terdaftar di Kelurahan ${wilayah.kelurahan} & tersinkron ke Peta. +${POINTS_REWARD.voter} Poin ditambahkan!`;
        setSuccessBanner(msg);
        onNotify(msg);
        resetForm();
        return;
      }

      // Account registration: Relawan (+25) or Korcam / Korwil (+50)
      const targetRole: UserRole =
        category === 'relawan'
          ? 'relawan'
          : role === 'tim_sukses'
          ? 'kader'
          : targetCoordinatorRole;

      // Double check strict authorization
      if (targetRole === 'relawan' && !canRegistRelawan) {
        setFormError('Anda tidak memiliki izin untuk mendaftarkan akun Relawan.');
        setIsSubmitting(false);
        return;
      }
      if ((targetRole === 'kader' || targetRole === 'tim_sukses') && !canRegistKoordinator) {
        setFormError('Anda tidak memiliki izin untuk mendaftarkan akun Korcam atau Korwil.');
        setIsSubmitting(false);
        return;
      }

      const cleanUsername = username.trim().toLowerCase().replace(/\s+/g, '');
      const cleanEmail = (email.trim() || `${cleanUsername}@swaraku.com`).toLowerCase();
      const cleanPassword = password.trim() || '123456';

      if (!cleanUsername || cleanUsername.length < 3) {
        setFormError('Username wajib diisi minimal 3 karakter untuk login.');
        setIsSubmitting(false);
        return;
      }

      const duplicate = userAccounts.some(
        (u) =>
          u.username.toLowerCase() === cleanUsername ||
          (email.trim() && u.email.toLowerCase() === cleanEmail)
      );
      if (duplicate) {
        setFormError(`Username "${cleanUsername}" atau email "${cleanEmail}" sudah terdaftar. Gunakan yang lain.`);
        setIsSubmitting(false);
        return;
      }

      const nowTs = Date.now();
      const wilayahLabel = formatWilayahLabel(wilayah.kota, wilayah.kecamatan, wilayah.kelurahan);

      const newAcc: UserAccount = {
        id: `acc-${targetRole === 'relawan' ? 'rel' : targetRole === 'kader' ? 'korcam' : 'korwil'}-${nowTs}`,
        role: targetRole,
        nama: nama.trim(),
        nik: nik.replace(/\D/g, '').slice(0, 16) || undefined,
        username: cleanUsername,
        email: cleanEmail,
        password: cleanPassword,
        noHp: noHp.trim() || '-',
        kota: wilayah.kota,
        kecamatan: wilayah.kecamatan,
        kelurahan: wilayah.kelurahan,
        wilayah: wilayahLabel,
        jabatan:
          targetRole === 'relawan'
            ? `Relawan Kel. ${wilayah.kelurahan}`
            : targetRole === 'kader'
            ? `Korcam Kec. ${wilayah.kecamatan}`
            : `Korwil ${wilayah.kota}`,
        divisi:
          targetRole === 'relawan'
            ? 'Relawan Pendataan Kelurahan'
            : targetRole === 'kader'
            ? 'Koordinator Kecamatan (Korcam)'
            : 'Koordinator Wilayah (Korwil)',
        points: 0,
        status: 'Aktif',
        dibuatPada: new Date().toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }),
        fotoUrl: fotoUrl || '',
        // Link hierarchy automatically so Monitoring Relawan & Login Whitelist work immediately
        timSuksesId:
          role === 'tim_sukses'
            ? currentUser.id
            : currentUser.timSuksesId || undefined,
        timSuksesNama:
          role === 'tim_sukses'
            ? currentUser.nama
            : currentUser.timSuksesNama || undefined,
        didaftarkanOlehTimSukses:
          role === 'tim_sukses' ? currentUser.nama : currentUser.timSuksesNama || undefined,
        korcamId: targetRole === 'relawan' && role === 'kader' ? currentUser.id : undefined,
        korcamNama: targetRole === 'relawan' && role === 'kader' ? currentUser.nama : undefined,
      };

      const saved = await onAddUser(newAcc);
      if (saved === false) {
        setFormError('Gagal menyimpan akun ke Cloud Database. Silakan coba lagi.');
        setIsSubmitting(false);
        return;
      }

      if (targetRole === 'tim_sukses' && onSaveTimSukses) {
        const coords = lookupSmartCoordinates(
          wilayah.kelurahan,
          wilayah.kecamatan,
          wilayah.kota
        ) || { lat: -6.2088, lng: 106.8456 };
        onSaveTimSukses({
          id: `ts-${newAcc.id}`,
          nama: newAcc.nama,
          noHp: newAcc.noHp || '-',
          jabatan: newAcc.jabatan,
          kota: wilayah.kota,
          kecamatanList: [wilayah.kecamatan],
          kelurahanList: [wilayah.kelurahan],
          lat: coords.lat,
          lng: coords.lng,
          waktuDaftar: newAcc.dibuatPada || 'Baru Didaftarkan',
          status: 'Aktif',
        });
      }

      const pts = category === 'relawan' ? POINTS_REWARD.relawan : POINTS_REWARD.koordinator;
      await onAwardPoints(pts);

      const roleLabel =
        targetRole === 'relawan' ? 'Relawan' : targetRole === 'kader' ? 'Korcam' : 'Korwil';
      const msg =
        targetRole === 'relawan'
          ? `Akun Relawan berhasil dibuat dan langsung aktif untuk login. +${pts} Poin ditambahkan!`
          : `Akun ${roleLabel} berhasil dibuat di Kel. ${wilayah.kelurahan} dan langsung aktif untuk login. +${pts} Poin ditambahkan!`;

      setSuccessBanner(msg);
      onNotify(msg);
      resetForm();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Terjadi kesalahan saat menyimpan pendaftaran.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const categoryCards = useMemo(() => {
    const list: Array<{
      id: RegistCategory;
      title: string;
      subtitle: string;
      points: number;
      allowed: boolean;
      isPrimary: boolean;
      icon: React.ReactNode;
    }> = [
      {
        id: 'voter',
        title: 'Pendaftaran Konstituen (Voter)',
        subtitle: 'Data warga lengkap hingga Kelurahan & sinkron otomatis ke Peta Suara.',
        points: 10,
        allowed: canRegistVoter,
        isPrimary: primaryCategory === 'voter',
        icon: <Users className="w-5 h-5" />,
      },
      {
        id: 'relawan',
        title: 'Pendaftaran Relawan',
        subtitle: 'Buat akun Relawan baru (langsung masuk whitelist login & Monitoring).',
        points: 25,
        allowed: canRegistRelawan,
        isPrimary: primaryCategory === 'relawan',
        icon: <UserCheck className="w-5 h-5" />,
      },
      {
        id: 'koordinator',
        title: role === 'tim_sukses' ? 'Pendaftaran Korcam' : 'Pendaftaran Korcam & Korwil',
        subtitle: 'Tambah koordinator wilayah/kecamatan baru ke jaringan Tim Support.',
        points: 50,
        allowed: canRegistKoordinator,
        isPrimary: primaryCategory === 'koordinator',
        icon: <Building2 className="w-5 h-5" />,
      },
    ];
    return list;
  }, [canRegistVoter, canRegistRelawan, canRegistKoordinator, primaryCategory, role]);

  return (
    <div className="space-y-6">
      {/* Header Command Regist */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white border border-slate-800 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-cyan-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Command Regist · Modul Registrasi Terpadu</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              Menu Registrasi &amp; Sinkronisasi Wilayah
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Pilih kategori pendaftaran sesuai hak akses Anda. Setiap data tersinkronisasi otomatis ke Database, Peta Suara Google Maps, &amp; Sistem Login Whitelist dengan poin otomatis.
            </p>
          </div>
          <div className="px-4 py-3 rounded-2xl bg-white/10 border border-white/15 shrink-0 text-right">
            <span className="text-[11px] text-slate-300 block">Poin Anda Saat Ini</span>
            <span className="text-2xl font-black font-mono text-amber-300 tabular-nums">
              {(currentUser.points || 0).toLocaleString('id-ID')} Poin
            </span>
          </div>
        </div>
      </div>

      {/* Category Selector (Strict Role Matrix) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {categoryCards.map((card) => {
          const active = category === card.id;
          if (!card.allowed) {
            return (
              <div
                key={card.id}
                className="p-4 rounded-2xl border border-slate-200 bg-slate-100/80 text-slate-400 flex flex-col justify-between gap-2 opacity-75"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-500 flex items-center justify-center shrink-0">
                    <Lock className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-slate-200 text-slate-500">
                    Terkunci
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-500">{card.title}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Tidak tersedia untuk level akses Anda.
                  </p>
                </div>
              </div>
            );
          }

          return (
            <button
              key={card.id}
              type="button"
              onClick={() => {
                setCategory(card.id);
                setFormError(null);
                setSuccessBanner(null);
              }}
              className={`p-4 rounded-2xl border text-left flex flex-col justify-between gap-2.5 transition-all cursor-pointer ${
                active
                  ? 'bg-blue-50/90 border-blue-600 ring-2 ring-blue-600/20 shadow-sm'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    active ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {card.icon}
                </div>
                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  {card.isPrimary && (
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-lg bg-amber-100 text-amber-800 border border-amber-200">
                      Utama
                    </span>
                  )}
                  <span className="text-[11px] font-extrabold font-mono px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200">
                    +{card.points} Poin
                  </span>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">{card.title}</h3>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{card.subtitle}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Registration Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-5">
        {/* Step 2: Dual Mode Toggle (Scan QR vs Manual Input) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              {category === 'voter'
                ? 'Formulir Pendaftaran Konstituen (Voter)'
                : category === 'relawan'
                ? 'Formulir Pendaftaran Akun Relawan Baru'
                : 'Formulir Pendaftaran Korcam / Korwil'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Pilih metode Scan ID (QR) untuk isi cepat atau Manual Input untuk ketik langsung.
            </p>
          </div>

          <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200 shrink-0">
            <button
              type="button"
              onClick={() => setInputMethod('manual')}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-all ${
                inputMethod === 'manual'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Keyboard className="w-3.5 h-3.5" />
              <span>Manual Input</span>
            </button>
            <button
              type="button"
              onClick={() => setInputMethod('qr')}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-all ${
                inputMethod === 'qr'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Scan ID (QR)</span>
            </button>
          </div>
        </div>

        {/* Success / Error Alerts */}
        {successBanner && (
          <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 flex items-start justify-between gap-3 text-emerald-900 text-xs font-bold">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{successBanner}</span>
            </div>
            <button
              type="button"
              onClick={() => setSuccessBanner(null)}
              className="text-emerald-600 hover:text-emerald-900 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {formError && (
          <div className="rounded-2xl bg-rose-50 border border-rose-200 p-3.5 text-rose-800 text-xs font-semibold">
            {formError}
          </div>
        )}

        {/* QR Scanner Panel when Scan ID (QR) is active */}
        {inputMethod === 'qr' && (
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-extrabold text-slate-800">
                <QrCode className="w-4 h-4 text-blue-700" />
                <span>Pemindai QR Kartu Identitas / ID Relawan</span>
              </div>
              {cameraActive ? (
                <button
                  type="button"
                  onClick={stopCamera}
                  className="px-3 py-1.5 rounded-lg bg-rose-100 text-rose-700 text-xs font-bold cursor-pointer"
                >
                  Matikan Kamera
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStartCameraScan}
                  className="px-3.5 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Buka Kamera Scan QR</span>
                </button>
              )}
            </div>

            {cameraActive && (
              <div className="relative rounded-xl overflow-hidden bg-black max-w-md mx-auto aspect-video border border-slate-300">
                <video ref={videoRef} playsInline muted className="w-full h-full object-cover" />
                <div className="absolute inset-0 border-2 border-cyan-400/70 m-6 rounded-xl pointer-events-none" />
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={qrRawInput}
                onChange={(e) => setQrRawInput(e.target.value)}
                placeholder="Atau tempel teks hasil scan QR (contoh: 3174011234560001|Budi Santoso|081234567890)"
                className="flex-1 min-h-[40px] px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-900"
              />
              <button
                type="button"
                onClick={() => applyQrData(qrRawInput)}
                disabled={!qrRawInput.trim()}
                className="min-h-[40px] px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white text-xs font-bold cursor-pointer"
              >
                Isi Form dari QR
              </button>
            </div>

            {qrStatus && (
              <p className="text-xs font-semibold text-blue-800 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2">
                {qrStatus}
              </p>
            )}
          </div>
        )}

        {/* Unified Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Role Target selector for Koordinator (Admin/SuperAdmin can choose Korcam or Korwil) */}
          {category === 'koordinator' && (
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Role Tujuan <span className="text-rose-600">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {(role === 'admin' || role === 'super_admin') && (
                  <button
                    type="button"
                    onClick={() => setTargetCoordinatorRole('tim_sukses')}
                    className={`min-h-[44px] px-4 py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer ${
                      targetCoordinatorRole === 'tim_sukses'
                        ? 'bg-cyan-700 text-white border-cyan-700'
                        : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                    <span>Korwil (Koordinator Wilayah)</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setTargetCoordinatorRole('kader')}
                  className={`min-h-[44px] px-4 py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer ${
                    targetCoordinatorRole === 'kader' || role === 'tim_sukses'
                      ? 'bg-emerald-700 text-white border-emerald-700'
                      : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Korcam (Koordinator Kecamatan)</span>
                </button>
              </div>
            </div>
          )}

          {/* Identity Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="space-y-1">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                <span>Nama Lengkap <span className="text-rose-600">*</span></span>
              </label>
              <input
                type="text"
                required
                maxLength={120}
                value={nama}
                onChange={(e) => handleNamaChange(e.target.value)}
                placeholder="Masukkan nama lengkap"
                className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="space-y-1">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <CreditCard className="w-3.5 h-3.5 text-slate-500" />
                <span>NIK {category === 'voter' ? '(16 Digit)' : '(Opsional)'}</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={16}
                value={nik}
                onChange={(e) => setNik(e.target.value.replace(/\D/g, '').slice(0, 16))}
                placeholder="3174xxxxxxxxxxxx"
                className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="space-y-1">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <Phone className="w-3.5 h-3.5 text-slate-500" />
                <span>No. HP / WhatsApp <span className="text-rose-600">*</span></span>
              </label>
              <input
                type="tel"
                required
                maxLength={25}
                value={noHp}
                onChange={(e) => setNoHp(e.target.value)}
                placeholder="081234567890"
                className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          {/* Account Credentials (for Relawan / Korcam / Korwil) */}
          {category !== 'voter' && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center gap-2 text-xs font-extrabold text-slate-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Kredensial Login Whitelist (Langsung Aktif)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Username <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                    placeholder="contoh: rel_siti"
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="flex items-center gap-1 text-xs font-bold text-slate-700">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>Email (Untuk Login &amp; SSO)</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@gmail.com (opsional)"
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Kata Sandi / PIN <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full min-h-[42px] pl-3 pr-10 py-2 rounded-xl border border-slate-300 bg-white text-sm font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Hierarchical Wilayah Selector (Kota -> Kecamatan -> Kelurahan) */}
          <div className="p-4 rounded-2xl bg-cyan-50/50 border border-cyan-200/80 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-cyan-950">
                <MapPin className="w-4 h-4 text-cyan-700" />
                <span>
                  {category === 'voter'
                    ? 'Wilayah Domisili Voter (Kota → Kecamatan → Kelurahan)'
                    : 'Wilayah Tugas (Kota → Kecamatan → Kelurahan)'}
                </span>
              </div>
              {resolvedCoords && (
                <span className="text-[11px] font-mono font-semibold text-emerald-800 bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 rounded-lg">
                  Koordinat Peta: {resolvedCoords.lat.toFixed(4)}, {resolvedCoords.lng.toFixed(4)}
                </span>
              )}
            </div>

            <WilayahSelector value={wilayah} onChange={setWilayah} required />

            {category === 'voter' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="sm:col-span-2 space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Alamat Lengkap (Jalan, Nomor Rumah, RT/RW) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={250}
                    value={alamat}
                    onChange={(e) => setAlamat(e.target.value)}
                    placeholder="Contoh: Jl. Fatmawati No. 12 RT 004/RW 002"
                    className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-sm text-slate-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Jenis Kelamin</label>
                  <select
                    value={jenisKelamin}
                    onChange={(e) => setJenisKelamin(e.target.value as 'Laki-laki' | 'Perempuan')}
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm text-slate-900"
                  >
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Optional Photo Upload */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl border border-dashed border-slate-300 bg-slate-50/70">
            <div className="flex items-center gap-3">
              {fotoUrl ? (
                <img
                  src={fotoUrl}
                  alt="Preview"
                  className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400">
                  <Upload className="w-5 h-5" />
                </div>
              )}
              <div>
                <p className="text-xs font-bold text-slate-800">
                  Upload Foto {category === 'voter' ? 'e-KTP / Warga' : 'Profil'} (Opsional)
                </p>
                <p className="text-[11px] text-slate-500">
                  Format JPG/PNG untuk dokumentasi verifikasi.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label className="min-h-[38px] px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-xs font-bold text-slate-800 inline-flex items-center gap-1.5 cursor-pointer">
                <Camera className="w-3.5 h-3.5" />
                <span>{fotoUrl ? 'Ganti Foto' : 'Pilih Foto'}</span>
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              </label>
              {fotoUrl && (
                <button
                  type="button"
                  onClick={() => setFotoUrl('')}
                  className="min-h-[38px] px-3 py-2 rounded-xl bg-rose-50 text-rose-700 text-xs font-bold cursor-pointer"
                >
                  Hapus
                </button>
              )}
            </div>
          </div>

          {/* Submit Footer */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Award className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Otomatis mendapatkan <strong className="text-emerald-700">+{POINTS_REWARD[category]} Poin</strong> setelah pendaftaran tersimpan.
              </span>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="min-h-[46px] px-6 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white text-sm font-extrabold inline-flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? 'Menyimpan & Menyinkronkan...'
                  : category === 'voter'
                  ? 'Simpan Voter & Sinkron ke Peta (+10 Poin)'
                  : category === 'relawan'
                  ? 'Buat Akun Relawan (+25 Poin)'
                  : 'Buat Akun Koordinator (+50 Poin)'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
