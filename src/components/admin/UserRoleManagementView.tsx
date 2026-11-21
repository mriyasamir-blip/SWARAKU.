import React, { useMemo, useState } from 'react';
import { UserAccount, UserRole } from '../../types/vore';
import { TimSuksesWilayahRecord } from '../../data/petaSuaraData';
import { lookupSmartCoordinates } from '../../utils/geocoding';
import { WilayahSelector, type WilayahValue } from '../common/WilayahSelector';
import { formatWilayahLabel } from '../../data/wilayahIndonesia';
import {
  Users,
  UserPlus,
  Shield,
  Building2,
  UserCheck,
  Search,
  CheckCircle2,
  XCircle,
  Trash2,
  Edit2,
  RotateCcw,
  Copy,
  CheckCheck,
  MessageSquare,
  KeyRound,
  MapPin,
  Phone,
  Mail,
  Sparkles,
  X,
  Check,
  RefreshCw,
  Award,
} from 'lucide-react';

interface UserRoleManagementViewProps {
  userAccounts: UserAccount[];
  currentUser: UserAccount;
  mode?: 'full' | 'korcam_relawan';
  onAddUser: (user: UserAccount) => Promise<boolean | void> | void;
  onUpdateUser?: (user: UserAccount) => Promise<boolean | void> | void;
  onDeleteUser: (userId: string) => Promise<boolean | void> | void;
  onToggleUserStatus: (userId: string) => Promise<boolean | void> | void;
  onSaveTimSukses?: (ts: TimSuksesWilayahRecord) => void;
  onRefreshUsers?: () => Promise<void>;
  onAwardPoints?: (delta: number) => Promise<void> | void;
}

type CreatableRole = 'tim_sukses' | 'kader' | 'relawan' | 'admin';

export const UserRoleManagementView: React.FC<UserRoleManagementViewProps> = ({
  userAccounts,
  currentUser,
  mode = 'full',
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onToggleUserStatus,
  onSaveTimSukses,
  onRefreshUsers,
  onAwardPoints,
}) => {
  const isKorcamRelawanMode = mode === 'korcam_relawan';

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>(
    isKorcamRelawanMode ? 'relawan' : 'all'
  );
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSavingUser, setIsSavingUser] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isRefreshingUsers, setIsRefreshingUsers] = useState(false);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<UserRole>('relawan');
  const [editNama, setEditNama] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editJabatan, setEditJabatan] = useState('');
  const [editIdPegawai, setEditIdPegawai] = useState('');
  const [editDivisi, setEditDivisi] = useState('');
  const [editWilayahObj, setEditWilayahObj] = useState<WilayahValue>({
    kota: '',
    kecamatan: '',
    kelurahan: '',
  });
  const [editNoHp, setEditNoHp] = useState('');
  const [editStatus, setEditStatus] = useState<'Aktif' | 'Nonaktif'>('Aktif');
  const [editError, setEditError] = useState<string | null>(null);

  // Reset Password Modal State
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resettingUser, setResettingUser] = useState<UserAccount | null>(null);
  const [newPasswordValue, setNewPasswordValue] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<UserAccount | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  // Add Form State
  const [formRole, setFormRole] = useState<CreatableRole>(
    isKorcamRelawanMode ? 'relawan' : 'tim_sukses'
  );
  const [formNama, setFormNama] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('123456');
  const [formJabatan, setFormJabatan] = useState('');
  const [formIdPegawai, setFormIdPegawai] = useState('');
  const [formDivisi, setFormDivisi] = useState('');
  const [formWilayahObj, setFormWilayahObj] = useState<WilayahValue>({
    kota: currentUser.kota || 'Jakarta Selatan',
    kecamatan: currentUser.kecamatan || 'Cilandak',
    kelurahan: currentUser.kelurahan || 'Cilandak Barat',
  });
  const [formNoHp, setFormNoHp] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Opsi Tambah Korcam Binaan Otomatis saat Mendaftarkan Korwil
  interface KorcamInputItem {
    id: string;
    nama: string;
    noHp: string;
    kelurahan: string;
    username: string;
    password?: string;
  }
  const [korcamInputs, setKorcamInputs] = useState<KorcamInputItem[]>([]);
  const [createdSummaryModal, setCreatedSummaryModal] = useState<{
    korwil: UserAccount;
    korcams: UserAccount[];
  } | null>(null);

  // Scoped base list (for Korcam mode, only Relawan under this Korcam or unassigned Relawan)
  const scopedUsers = useMemo(() => {
    if (!isKorcamRelawanMode) return userAccounts;
    return userAccounts.filter(
      (u) =>
        u.role === 'relawan' &&
        (!u.korcamId ||
          u.korcamId === currentUser.id ||
          u.korcamNama === currentUser.nama)
    );
  }, [userAccounts, isKorcamRelawanMode, currentUser.id, currentUser.nama]);

  // Statistics
  const totalUsers = scopedUsers.length;
  const superAdminCount = scopedUsers.filter((u) => u.role === 'super_admin').length;
  const adminCount = scopedUsers.filter((u) => u.role === 'admin').length;
  const korwilCount = scopedUsers.filter((u) => u.role === 'tim_sukses').length;
  const korcamCount = scopedUsers.filter((u) => u.role === 'kader').length;
  const relawanCount = scopedUsers.filter((u) => u.role === 'relawan').length;
  const activeCount = scopedUsers.filter((u) => u.status !== 'Nonaktif').length;

  // Filtered List
  const filteredUsers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return scopedUsers.filter((user) => {
      const matchesRole =
        isKorcamRelawanMode || roleFilter === 'all' || user.role === roleFilter;
      const matchesSearch =
        !q ||
        user.nama.toLowerCase().includes(q) ||
        user.username.toLowerCase().includes(q) ||
        (user.email && user.email.toLowerCase().includes(q)) ||
        (user.wilayah && user.wilayah.toLowerCase().includes(q)) ||
        (user.kota && user.kota.toLowerCase().includes(q)) ||
        (user.kecamatan && user.kecamatan.toLowerCase().includes(q)) ||
        (user.kelurahan && user.kelurahan.toLowerCase().includes(q)) ||
        (user.jabatan && user.jabatan.toLowerCase().includes(q)) ||
        (user.noHp && user.noHp.includes(q)) ||
        (user.timSuksesNama && user.timSuksesNama.toLowerCase().includes(q)) ||
        (user.korcamNama && user.korcamNama.toLowerCase().includes(q));
      return matchesRole && matchesSearch;
    });
  }, [scopedUsers, isKorcamRelawanMode, roleFilter, searchQuery]);

  const handleAddKorcamRow = () => {
    const newId = `kc-item-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    setKorcamInputs((prev) => [
      ...prev,
      {
        id: newId,
        nama: '',
        noHp: '',
        kelurahan: formWilayahObj.kelurahan || '',
        username: '',
        password: '123456',
      },
    ]);
  };

  const handleUpdateKorcamRow = (
    id: string,
    field: keyof KorcamInputItem,
    value: string
  ) => {
    setKorcamInputs((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === 'nama' && (!item.username || item.username.startsWith('korcam_'))) {
            const slug = value.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
            updated.username = slug ? `korcam_${slug.slice(0, 10)}` : '';
          }
          return updated;
        }
        return item;
      })
    );
  };

  const handleRemoveKorcamRow = (id: string) => {
    setKorcamInputs((prev) => prev.filter((item) => item.id !== id));
  };

  const applyRoleDefaults = (role: CreatableRole) => {
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    setFormRole(role);
    setFormIdPegawai(
      role === 'tim_sukses'
        ? `KW-${randomCode}`
        : role === 'kader'
        ? `KC-${randomCode}`
        : role === 'relawan'
        ? `RL-${randomCode}`
        : `ADM-${randomCode}`
    );
    setFormDivisi(
      role === 'tim_sukses'
        ? 'Divisi Koordinator Wilayah'
        : role === 'kader'
        ? 'Divisi Koordinator Kecamatan'
        : role === 'relawan'
        ? 'Divisi Relawan Lapangan'
        : 'Divisi Administrasi & Operasional'
    );
    setFormJabatan(
      role === 'tim_sukses'
        ? 'Koordinator Wilayah (Korwil)'
        : role === 'kader'
        ? 'Koordinator Kecamatan (Korcam)'
        : role === 'relawan'
        ? 'Relawan Lapangan'
        : 'Admin Operasional'
    );
  };

  const handleOpenAddModal = (defaultRole?: CreatableRole) => {
    const targetRole: CreatableRole = isKorcamRelawanMode
      ? 'relawan'
      : defaultRole || 'tim_sukses';
    applyRoleDefaults(targetRole);
    setFormNama('');
    setFormUsername('');
    setFormEmail('');
    setFormPassword('123456');
    setKorcamInputs([]);
    setFormWilayahObj({
      kota: currentUser.kota || 'Jakarta Selatan',
      kecamatan: currentUser.kecamatan || 'Cilandak',
      kelurahan: currentUser.kelurahan || 'Cilandak Barat',
    });
    setFormNoHp('');
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleSubmitNewUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNama.trim() || !formUsername.trim()) {
      setFormError('Nama Lengkap dan Username wajib diisi.');
      return;
    }

    const cleanUsername = formUsername.trim().toLowerCase().replace(/\s+/g, '');
    const cleanEmail = (formEmail.trim() || `${cleanUsername}@swaraku.com`).toLowerCase();

    const isDuplicate = userAccounts.some(
      (u) =>
        u.username.toLowerCase() === cleanUsername ||
        (u.email && u.email.toLowerCase() === cleanEmail)
    );

    if (isDuplicate) {
      setFormError(
        `Username "${cleanUsername}" atau email "${cleanEmail}" sudah terdaftar. Gunakan yang lain.`
      );
      return;
    }

    const effectiveRole: CreatableRole = isKorcamRelawanMode ? 'relawan' : formRole;
    const validKorcams =
      effectiveRole === 'tim_sukses'
        ? korcamInputs.filter((k) => k.nama.trim().length > 0)
        : [];

    const wilayahLabel =
      formatWilayahLabel(formWilayahObj) ||
      formWilayahObj.kota ||
      currentUser.wilayah ||
      'Indonesia';

    const nowTs = Date.now();
    const newAccount: UserAccount = {
      id: `acc-${nowTs}`,
      role: effectiveRole,
      nama: formNama.trim(),
      username: cleanUsername,
      email: cleanEmail,
      password: formPassword || '123456',
      idPegawai: formIdPegawai.trim() || `ID-${nowTs.toString().slice(-4)}`,
      divisi: formDivisi.trim(),
      jabatan: formJabatan.trim(),
      wilayah: wilayahLabel,
      kota: formWilayahObj.kota,
      kecamatan: formWilayahObj.kecamatan,
      kelurahan: formWilayahObj.kelurahan,
      tps: formWilayahObj.kelurahan || undefined,
      noHp: formNoHp.trim() || '',
      status: 'Aktif',
      points: 0,
      dibuatPada: new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      fotoUrl: '',
      ...(effectiveRole === 'relawan' && currentUser.role === 'kader'
        ? {
            korcamId: currentUser.id,
            korcamNama: currentUser.nama,
            timSuksesId: currentUser.timSuksesId,
            timSuksesNama: currentUser.timSuksesNama,
          }
        : {}),
      ...(effectiveRole === 'relawan' && currentUser.role === 'tim_sukses'
        ? {
            timSuksesId: currentUser.id,
            timSuksesNama: currentUser.nama,
          }
        : {}),
      ...(effectiveRole === 'kader' && currentUser.role === 'tim_sukses'
        ? {
            timSuksesId: currentUser.id,
            timSuksesNama: currentUser.nama,
            didaftarkanOlehTimSukses: currentUser.nama,
          }
        : {}),
      kaderList: validKorcams.map((k) => k.nama.trim()),
      kaderIds: validKorcams.map((_, idx) => `acc-korcam-${nowTs}-${idx + 1}`),
    };

    setIsSavingUser(true);
    setFormError(null);

    try {
      const res = await onAddUser(newAccount);
      if (res === false) {
        setFormError('Gagal menyimpan ke Database Server. Silakan periksa koneksi.');
        setIsSavingUser(false);
        return;
      }

      if (onAwardPoints) {
        const delta =
          effectiveRole === 'relawan'
            ? 25
            : effectiveRole === 'kader' || effectiveRole === 'tim_sukses'
            ? 50
            : 0;
        if (delta > 0) {
          await Promise.resolve(onAwardPoints(delta));
        }
      }

      // Auto-create Korcam binaan if added under Korwil
      const createdKorcams: UserAccount[] = [];
      if (effectiveRole === 'tim_sukses' && validKorcams.length > 0) {
        for (let i = 0; i < validKorcams.length; i++) {
          const k = validKorcams[i];
          const kCleanNama = k.nama.trim();
          let baseKUsername = (k.username || '').trim().toLowerCase().replace(/\s+/g, '');
          if (!baseKUsername) {
            const slug = kCleanNama.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8);
            baseKUsername = `korcam_${slug || 'user'}_${Math.floor(100 + Math.random() * 900)}`;
          }

          let finalUsername = baseKUsername;
          let counter = 1;
          while (
            userAccounts.some((u) => u.username.toLowerCase() === finalUsername) ||
            createdKorcams.some((u) => u.username.toLowerCase() === finalUsername) ||
            finalUsername === cleanUsername
          ) {
            finalUsername = `${baseKUsername}${counter}`;
            counter++;
          }

          const korcamKel = k.kelurahan.trim() || formWilayahObj.kelurahan;
          const korcamAcc: UserAccount = {
            id: `acc-korcam-${nowTs}-${i + 1}`,
            role: 'kader',
            nama: kCleanNama,
            username: finalUsername,
            email: `${finalUsername}@swaraku.com`,
            password: (k.password || '123456').trim(),
            idPegawai: `KC-${Math.floor(1000 + Math.random() * 9000)}`,
            divisi: 'Divisi Koordinator Kecamatan',
            jabatan: 'Koordinator Kecamatan (Korcam)',
            wilayah: formatWilayahLabel({
              kota: formWilayahObj.kota,
              kecamatan: formWilayahObj.kecamatan,
              kelurahan: korcamKel,
            }),
            kota: formWilayahObj.kota,
            kecamatan: formWilayahObj.kecamatan,
            kelurahan: korcamKel,
            tps: korcamKel || undefined,
            noHp: k.noHp.trim() || '',
            status: 'Aktif',
            points: 0,
            dibuatPada: newAccount.dibuatPada,
            fotoUrl: '',
            timSuksesId: newAccount.id,
            timSuksesNama: newAccount.nama,
            didaftarkanOlehTimSukses: newAccount.nama,
          };

          await onAddUser(korcamAcc);
          createdKorcams.push(korcamAcc);
        }
      }

      // Auto-sync Korwil to Peta Suara
      if (effectiveRole === 'tim_sukses' && onSaveTimSukses) {
        const smartCoords = lookupSmartCoordinates(
          formWilayahObj.kelurahan,
          formWilayahObj.kecamatan,
          formWilayahObj.kota
        ) || {
          lat: -6.2088,
          lng: 106.8456,
        };

        onSaveTimSukses({
          id: `ts-${newAccount.id}`,
          nama: newAccount.nama,
          noHp: newAccount.noHp || '-',
          jabatan: newAccount.jabatan || 'Koordinator Wilayah (Korwil)',
          kota: formWilayahObj.kota || 'Jakarta Selatan',
          kecamatanList: formWilayahObj.kecamatan ? [formWilayahObj.kecamatan] : ['Semua Kecamatan'],
          kelurahanList: formWilayahObj.kelurahan ? [formWilayahObj.kelurahan] : ['Semua Kelurahan'],
          lat: smartCoords.lat,
          lng: smartCoords.lng,
          waktuDaftar: newAccount.dibuatPada || 'Baru Didaftarkan',
          status: 'Aktif',
        });
      }

      setIsAddModalOpen(false);
      setKorcamInputs([]);

      if (createdKorcams.length > 0) {
        setCreatedSummaryModal({
          korwil: newAccount,
          korcams: createdKorcams,
        });
      }
    } catch (err: unknown) {
      setFormError(
        err instanceof Error
          ? err.message
          : 'Gagal menyimpan akun ke server Cloud Database.'
      );
    } finally {
      setIsSavingUser(false);
    }
  };

  const handleOpenEditModal = (user: UserAccount) => {
    setEditingUserId(user.id);
    setEditRole(user.role);
    setEditNama(user.nama);
    setEditUsername(user.username);
    setEditEmail(user.email || `${user.username}@swaraku.com`);
    setEditPassword(user.password || '123456');
    setEditIdPegawai(user.idPegawai || '');
    setEditDivisi(user.divisi || '');
    setEditJabatan(user.jabatan || '');
    setEditWilayahObj({
      kota: user.kota || '',
      kecamatan: user.kecamatan || '',
      kelurahan: user.kelurahan || '',
    });
    setEditNoHp(user.noHp || '');
    setEditStatus(user.status || 'Aktif');
    setEditError(null);
    setIsEditModalOpen(true);
  };

  const handleSubmitEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUserId) return;
    if (!editNama.trim() || !editUsername.trim()) {
      setEditError('Nama Lengkap dan Username wajib diisi.');
      return;
    }

    const cleanUsername = editUsername.trim().toLowerCase().replace(/\s+/g, '');
    const cleanEmail = (editEmail.trim() || `${cleanUsername}@swaraku.com`).toLowerCase();
    const isDuplicate = userAccounts.some(
      (u) => u.id !== editingUserId && u.username.toLowerCase() === cleanUsername
    );

    if (isDuplicate) {
      setEditError(`Username "${cleanUsername}" sudah digunakan akun lain.`);
      return;
    }

    const targetUser = userAccounts.find((u) => u.id === editingUserId);
    if (!targetUser) return;

    const wilayahLabel =
      formatWilayahLabel(editWilayahObj) || targetUser.wilayah || 'Indonesia';

    const updatedAccount: UserAccount = {
      ...targetUser,
      role: isKorcamRelawanMode ? 'relawan' : editRole,
      nama: editNama.trim(),
      username: cleanUsername,
      email: cleanEmail,
      password: editPassword.trim() || targetUser.password || '123456',
      idPegawai: editIdPegawai.trim() || targetUser.idPegawai,
      divisi: editDivisi.trim() || targetUser.divisi,
      jabatan: editJabatan.trim() || targetUser.jabatan,
      wilayah: wilayahLabel,
      kota: editWilayahObj.kota || targetUser.kota,
      kecamatan: editWilayahObj.kecamatan || targetUser.kecamatan,
      kelurahan: editWilayahObj.kelurahan || targetUser.kelurahan,
      tps: editWilayahObj.kelurahan || targetUser.kelurahan || undefined,
      noHp: editNoHp.trim(),
      status: editStatus,
    };

    setIsSavingEdit(true);
    setEditError(null);

    try {
      if (onUpdateUser) {
        await onUpdateUser(updatedAccount);
      }
      setIsEditModalOpen(false);
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : 'Gagal menyimpan perubahan.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleOpenResetModal = (user: UserAccount) => {
    setResettingUser(user);
    setNewPasswordValue(user.password || '123456');
    setIsResetModalOpen(true);
  };

  const handleGenerateRandomPin = () => {
    const randomPin = String(Math.floor(100000 + Math.random() * 900000));
    setNewPasswordValue(randomPin);
  };

  const handleSubmitResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingUser || !newPasswordValue.trim()) return;
    if (onUpdateUser) {
      onUpdateUser({ ...resettingUser, password: newPasswordValue.trim() });
    }
    setIsResetModalOpen(false);
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'super_admin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">
            <Shield className="w-3 h-3 text-purple-600" />
            <span>SuperAdmin</span>
          </span>
        );
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-800 border border-indigo-200">
            <Shield className="w-3 h-3 text-indigo-600" />
            <span>Admin</span>
          </span>
        );
      case 'tim_sukses':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-100 text-cyan-800 border border-cyan-200">
            <Building2 className="w-3 h-3 text-cyan-600" />
            <span>Korwil</span>
          </span>
        );
      case 'kader':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
            <UserCheck className="w-3 h-3 text-emerald-600" />
            <span>Korcam</span>
          </span>
        );
      case 'relawan':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
            <Users className="w-3 h-3 text-amber-600" />
            <span>Relawan</span>
          </span>
        );
      default:
        return null;
    }
  };

  const generateWhatsAppShareLink = (user: UserAccount) => {
    const roleLabel =
      user.role === 'tim_sukses'
        ? 'Korwil'
        : user.role === 'kader'
        ? 'Korcam'
        : user.role === 'relawan'
        ? 'Relawan'
        : 'Admin';
    const wilayahText =
      formatWilayahLabel({
        kota: user.kota || '',
        kecamatan: user.kecamatan || '',
        kelurahan: user.kelurahan || '',
      }) || user.wilayah;
    const text = `Halo Bapak/Ibu ${encodeURIComponent(user.nama)},%0A%0AAkun akses aplikasi SWARAKU Anda telah aktif:%0A- Role: ${encodeURIComponent(roleLabel)}%0A- Username: ${encodeURIComponent(user.username)}%0A- Email: ${encodeURIComponent(user.email || '-')}%0A- Password / PIN: ${encodeURIComponent(user.password || '123456')}%0A- Wilayah: ${encodeURIComponent(wilayahText)}%0A%0ASilakan masuk melalui aplikasi SWARAKU. Terima kasih.`;
    return `https://wa.me/${(user.noHp || '').replace(/\D/g, '')}?text=${text}`;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl border border-indigo-700/50 shadow-md space-y-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2.5 py-0.5 rounded-full font-mono">
                {isKorcamRelawanMode ? 'KHUSUS KORCAM' : 'ADMIN & SUPERADMIN'}
              </span>
              <span className="text-xs text-slate-300 font-bold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>
                  {isKorcamRelawanMode
                    ? 'Manajemen Relawan Tanpa Batas · Auto Whitelist Login'
                    : 'Manajemen Hak Akses Korwil, Korcam, Relawan & Admin'}
                </span>
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {isKorcamRelawanMode
                ? 'Kelola User Relawan Wilayah Anda'
                : 'Kelola Role & User Akun (Korwil, Korcam & Relawan)'}
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl mt-1 leading-relaxed">
              {isKorcamRelawanMode
                ? 'Tambahkan akun Relawan sebanyak yang dibutuhkan di Kelurahan/Kecamatan Anda. Akun yang dibuat langsung aktif di halaman Login Relawan, tersinkron ke Monitoring Relawan, dan memberikan +25 Poin otomatis.'
                : 'Kelola seluruh akun terdaftar (Whitelist) untuk Korwil, Korcam, Relawan, dan Admin. Daftarkan email Google untuk akses SSO Tim Support serta atur struktur wilayah Kota → Kecamatan → Kelurahan.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onRefreshUsers && (
              <button
                type="button"
                onClick={async () => {
                  setIsRefreshingUsers(true);
                  try {
                    await onRefreshUsers();
                  } finally {
                    setIsRefreshingUsers(false);
                  }
                }}
                disabled={isRefreshingUsers}
                className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 text-cyan-300 ${isRefreshingUsers ? 'animate-spin' : ''}`}
                />
                <span className="hidden sm:inline">Refresh Cloud</span>
              </button>
            )}

            {isKorcamRelawanMode ? (
              <button
                type="button"
                onClick={() => handleOpenAddModal('relawan')}
                className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Tambah Relawan (+25 Poin)</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => handleOpenAddModal('tim_sukses')}
                  className="px-3 py-2 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>+ Korwil</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenAddModal('kader')}
                  className="px-3 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>+ Korcam</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenAddModal('relawan')}
                  className="px-3 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>+ Relawan</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Quick KPI Stat Counter */}
        {isKorcamRelawanMode ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-white/10 text-xs">
            <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
              <span className="text-[10px] text-amber-300 block font-mono">Total Relawan Binaan</span>
              <span className="text-xl font-black text-white font-mono mt-0.5 block">
                {relawanCount}
              </span>
              <span className="text-[10px] text-slate-300">Tanpa batas jumlah akun</span>
            </div>
            <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
              <span className="text-[10px] text-emerald-300 block font-mono">Status Aktif Login</span>
              <span className="text-xl font-black text-emerald-300 font-mono mt-0.5 block">
                {activeCount}
              </span>
              <span className="text-[10px] text-slate-300">Terverifikasi di Whitelist</span>
            </div>
            <div className="p-3 bg-white/5 rounded-2xl border border-white/10 col-span-2 sm:col-span-1">
              <span className="text-[10px] text-cyan-300 block font-mono">Wilayah Tugas Korcam</span>
              <span className="text-sm font-black text-white mt-1 block truncate">
                {formatWilayahLabel({
                  kota: currentUser.kota || '',
                  kecamatan: currentUser.kecamatan || '',
                  kelurahan: currentUser.kelurahan || '',
                }) || currentUser.wilayah}
              </span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 border-t border-white/10 text-xs">
            <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
              <span className="text-[10px] text-slate-400 block font-mono">Total Akun</span>
              <span className="text-xl font-black text-white font-mono mt-0.5 block">
                {totalUsers}
              </span>
              <span className="text-[10px] text-teal-300">Whitelist Aktif</span>
            </div>
            <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
              <span className="text-[10px] text-purple-300 block font-mono">Admin &amp; Super</span>
              <span className="text-xl font-black text-purple-200 font-mono mt-0.5 block">
                {superAdminCount + adminCount}
              </span>
              <span className="text-[10px] text-purple-300">
                {superAdminCount} Super · {adminCount} Admin
              </span>
            </div>
            <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
              <span className="text-[10px] text-cyan-300 block font-mono">Korwil</span>
              <span className="text-xl font-black text-cyan-300 font-mono mt-0.5 block">
                {korwilCount}
              </span>
              <span className="text-[10px] text-slate-300">Koordinator Wilayah</span>
            </div>
            <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
              <span className="text-[10px] text-emerald-300 block font-mono">Korcam</span>
              <span className="text-xl font-black text-emerald-300 font-mono mt-0.5 block">
                {korcamCount}
              </span>
              <span className="text-[10px] text-slate-300">Koordinator Kecamatan</span>
            </div>
            <div className="p-3 bg-white/5 rounded-2xl border border-white/10 col-span-2 sm:col-span-1">
              <span className="text-[10px] text-amber-300 block font-mono">Relawan</span>
              <span className="text-xl font-black text-amber-300 font-mono mt-0.5 block">
                {relawanCount}
              </span>
              <span className="text-[10px] text-slate-300">Penggerak Lapangan</span>
            </div>
          </div>
        )}
      </div>

      {/* Control Bar: Search & Role Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Cari berdasarkan Nama, Username, Email, Kelurahan, Kecamatan, Kota, atau No HP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-cyan-500 font-medium"
          />
        </div>

        {!isKorcamRelawanMode && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setRoleFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                roleFilter === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua ({totalUsers})
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter('tim_sukses')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                roleFilter === 'tim_sukses'
                  ? 'bg-cyan-700 text-white'
                  : 'bg-cyan-50 text-cyan-800 hover:bg-cyan-100 border border-cyan-200'
              }`}
            >
              Korwil ({korwilCount})
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter('kader')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                roleFilter === 'kader'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              Korcam ({korcamCount})
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter('relawan')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                roleFilter === 'relawan'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              Relawan ({relawanCount})
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter('admin')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                roleFilter === 'admin'
                  ? 'bg-indigo-700 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Admin ({adminCount})
            </button>
          </div>
        )}
      </div>

      {/* User Accounts Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-700" />
            <h3 className="text-sm font-black text-slate-900">
              {isKorcamRelawanMode
                ? `Daftar Akun Relawan Terdaftar (${filteredUsers.length})`
                : `Daftar Akun Whitelist SWARAKU (${filteredUsers.length})`}
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Tersinkron ke Login &amp; Monitoring Relawan
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
              <tr>
                <th className="p-3.5">Pengguna &amp; Identitas</th>
                <th className="p-3.5">Role</th>
                <th className="p-3.5 bg-purple-50/60 text-purple-900 font-bold">
                  Kredensial Login (Whitelist)
                </th>
                <th className="p-3.5">Wilayah Tugas (Kota / Kec / Kel)</th>
                <th className="p-3.5">Kontak WhatsApp</th>
                <th className="p-3.5 text-center">Poin</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    {isKorcamRelawanMode
                      ? 'Belum ada akun Relawan terdaftar. Klik "+ Tambah Relawan" untuk menambahkan.'
                      : 'Tidak ada akun pengguna yang sesuai dengan filter pencarian.'}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isCurrent = user.id === currentUser.id;
                  const isProtectedSuperAdmin = user.role === 'super_admin';
                  const isActive = user.status !== 'Nonaktif';
                  const wilayahLine =
                    formatWilayahLabel({
                      kota: user.kota || '',
                      kecamatan: user.kecamatan || '',
                      kelurahan: user.kelurahan || '',
                    }) || user.wilayah;

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Name & Identitas */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          {user.fotoUrl ? (
                            <img
                              src={user.fotoUrl}
                              alt={user.nama}
                              className="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs text-white shrink-0 shadow-2xs ${
                                user.role === 'super_admin'
                                  ? 'bg-purple-600'
                                  : user.role === 'admin'
                                  ? 'bg-indigo-600'
                                  : user.role === 'tim_sukses'
                                  ? 'bg-cyan-600'
                                  : user.role === 'kader'
                                  ? 'bg-emerald-600'
                                  : 'bg-amber-600'
                              }`}
                            >
                              {(user.nama || 'SW').slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900">{user.nama}</span>
                              {isCurrent && (
                                <span className="text-[9px] font-black uppercase text-teal-800 bg-teal-100 px-1.5 py-0.2 rounded font-mono">
                                  Anda
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-500 block">
                              {user.jabatan || '-'}
                            </span>
                            {user.korcamNama && (
                              <span className="text-[10px] text-emerald-700 font-semibold block">
                                Korcam: {user.korcamNama}
                              </span>
                            )}
                            {user.timSuksesNama && !user.korcamNama && (
                              <span className="text-[10px] text-cyan-700 font-semibold block">
                                Korwil: {user.timSuksesNama}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="p-3.5">{getRoleBadge(user.role)}</td>

                      {/* Credentials */}
                      <td className="p-3.5 bg-purple-50/20">
                        <div className="space-y-1 min-w-[180px]">
                          <div className="flex items-center justify-between bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-2xs">
                            <span className="font-mono font-bold text-slate-900 text-[11px] truncate">
                              @{user.username}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyText(user.username, `u-${user.id}`)}
                              className="text-slate-400 hover:text-cyan-700 ml-1 cursor-pointer p-0.5"
                              title="Salin Username"
                            >
                              {copiedId === `u-${user.id}` ? (
                                <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                          {user.email && (
                            <p className="text-[10px] text-slate-500 truncate px-1">{user.email}</p>
                          )}
                          <div className="flex items-center justify-between bg-purple-50 px-2 py-1 rounded-lg border border-purple-200">
                            <span className="text-[9px] text-purple-600 font-bold uppercase">
                              Pass:
                            </span>
                            <span className="font-mono font-black text-purple-950 text-[11px]">
                              {user.password || '123456'}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                handleCopyText(user.password || '123456', `p-${user.id}`)
                              }
                              className="text-purple-400 hover:text-purple-700 ml-1 cursor-pointer p-0.5"
                              title="Salin Password"
                            >
                              {copiedId === `p-${user.id}` ? (
                                <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Wilayah */}
                      <td className="p-3.5">
                        <div className="flex items-start gap-1.5 text-slate-700 font-medium max-w-[220px]">
                          <MapPin className="w-3.5 h-3.5 text-cyan-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold text-slate-900 leading-snug">
                              {wilayahLine || '-'}
                            </p>
                            {user.kelurahan && (
                              <span className="inline-block mt-0.5 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                Kel. {user.kelurahan}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* WA */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-slate-800">{user.noHp || '-'}</span>
                          {user.noHp && (
                            <a
                              href={generateWhatsAppShareLink(user)}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors"
                              title="Kirim kredensial login ke WhatsApp"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Poin */}
                      <td className="p-3.5 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 font-mono font-bold text-[11px]">
                          <Award className="w-3 h-3" />
                          {(user.points || 0).toLocaleString('id-ID')}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="p-3.5 text-center">
                        <button
                          type="button"
                          disabled={isProtectedSuperAdmin}
                          onClick={() => onToggleUserStatus(user.id)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                            isProtectedSuperAdmin
                              ? 'bg-purple-100 text-purple-800 cursor-default'
                              : isActive
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 cursor-pointer'
                              : 'bg-rose-100 text-rose-800 hover:bg-rose-200 cursor-pointer'
                          }`}
                        >
                          {isActive ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Aktif</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 text-rose-600" />
                              <span>Nonaktif</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(user)}
                            className="p-1.5 text-cyan-700 hover:text-cyan-950 hover:bg-cyan-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Data User"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenResetModal(user)}
                            className="p-1.5 text-purple-700 hover:text-purple-950 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                            title="Reset Password"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                          {isProtectedSuperAdmin || isCurrent ? (
                            <span className="text-[10px] text-slate-400 font-mono px-1">
                              Dilindungi
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteUser(user)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Hapus Akun"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Tambah User Baru */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-6 space-y-4 shadow-2xl border border-slate-200 my-auto max-h-[92vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                    {isKorcamRelawanMode
                      ? 'Tambah Akun Relawan Baru (+25 Poin)'
                      : 'Tambah Pengguna & Penetapan Role'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Akun langsung aktif di sistem login Whitelist &amp; Monitoring Relawan
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-bold flex items-center gap-2">
                <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitNewUser} className="space-y-4 text-xs">
              {/* Role Selector (Hidden when Korcam is only creating Relawan) */}
              {!isKorcamRelawanMode && (
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1.5">
                    Pilih Role Pengguna:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      {
                        role: 'tim_sukses' as CreatableRole,
                        label: 'Korwil',
                        sub: 'Koord. Wilayah',
                        icon: Building2,
                        activeClass: 'border-cyan-600 bg-cyan-50/70 ring-2 ring-cyan-200',
                      },
                      {
                        role: 'kader' as CreatableRole,
                        label: 'Korcam',
                        sub: 'Koord. Kecamatan',
                        icon: UserCheck,
                        activeClass: 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-200',
                      },
                      {
                        role: 'relawan' as CreatableRole,
                        label: 'Relawan',
                        sub: 'Lapangan',
                        icon: Users,
                        activeClass: 'border-amber-600 bg-amber-50/70 ring-2 ring-amber-200',
                      },
                      {
                        role: 'admin' as CreatableRole,
                        label: 'Admin',
                        sub: 'Operasional',
                        icon: Shield,
                        activeClass: 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-200',
                      },
                    ].map((opt) => {
                      const Icon = opt.icon;
                      const active = formRole === opt.role;
                      return (
                        <button
                          key={opt.role}
                          type="button"
                          onClick={() => applyRoleDefaults(opt.role)}
                          className={`p-2.5 rounded-2xl border-2 text-left cursor-pointer transition-all ${
                            active
                              ? opt.activeClass
                              : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                          }`}
                        >
                          <Icon
                            className={`w-4 h-4 mb-1 ${active ? 'text-slate-900' : 'text-slate-400'}`}
                          />
                          <span className="font-extrabold text-slate-900 block text-xs">
                            {opt.label}
                          </span>
                          <span className="text-[10px] text-slate-500 block leading-tight">
                            {opt.sub}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Nama & Username */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Nama Lengkap <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Hendra Pratama"
                    value={formNama}
                    onChange={(e) => setFormNama(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Username Login <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: hendra_relawan"
                    value={formUsername}
                    onChange={(e) =>
                      setFormUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-mono font-bold"
                  />
                </div>
              </div>

              {/* Email (Whitelist Google SSO) & Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Email (Wajib sesuai Google untuk SSO)
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      placeholder="nama@gmail.com"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Password / PIN Login
                  </label>
                  <div className="relative">
                    <KeyRound className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* No HP & Jabatan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Nomor WhatsApp / HP
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="tel"
                      placeholder="08123456789"
                      value={formNoHp}
                      onChange={(e) => setFormNoHp(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Jabatan / Posisi
                  </label>
                  <input
                    type="text"
                    value={formJabatan}
                    onChange={(e) => setFormJabatan(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs"
                  />
                </div>
              </div>

              {/* Hierarchical Wilayah Selector: Kota -> Kecamatan -> Kelurahan */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <p className="text-[11px] font-extrabold text-slate-800 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-cyan-600" />
                  <span>Wilayah Penugasan (Kota → Kecamatan → Kelurahan)</span>
                </p>
                <WilayahSelector
                  value={formWilayahObj}
                  onChange={setFormWilayahObj}
                  required
                  compact
                />
              </div>

              {/* Optional Korcam Binaan when registering Korwil */}
              {!isKorcamRelawanMode && formRole === 'tim_sukses' && (
                <div className="p-4 bg-gradient-to-br from-cyan-50/70 via-teal-50/40 to-slate-50 rounded-2xl border-2 border-dashed border-cyan-300 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-black text-cyan-950">
                        Tambah Korcam Binaan Otomatis (Opsional)
                      </h4>
                      <p className="text-[10px] text-slate-600 mt-0.5">
                        Setiap Korcam di bawah akan otomatis dibuatkan akun login dan ditautkan ke Korwil ini.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddKorcamRow}
                      className="px-2.5 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>+ Korcam</span>
                    </button>
                  </div>

                  {korcamInputs.length > 0 && (
                    <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
                      {korcamInputs.map((item, idx) => (
                        <div
                          key={item.id}
                          className="p-3 bg-white rounded-xl border border-cyan-200 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold font-mono text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded-md border border-cyan-200">
                              Korcam Binaan #{idx + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveKorcamRow(item.id)}
                              className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={item.nama}
                              onChange={(e) =>
                                handleUpdateKorcamRow(item.id, 'nama', e.target.value)
                              }
                              placeholder="Nama Lengkap Korcam *"
                              required
                              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                            />
                            <input
                              type="text"
                              value={item.kelurahan}
                              onChange={(e) =>
                                handleUpdateKorcamRow(item.id, 'kelurahan', e.target.value)
                              }
                              placeholder="Kelurahan Penugasan"
                              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                            />
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <input
                              type="tel"
                              value={item.noHp}
                              onChange={(e) =>
                                handleUpdateKorcamRow(item.id, 'noHp', e.target.value)
                              }
                              placeholder="No. WA / HP"
                              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                            />
                            <div className="bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 text-[10px] font-mono font-bold text-slate-700 flex items-center justify-between">
                              <span>@{item.username || 'korcam_auto'}</span>
                              <span className="text-purple-700">123456</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Submit */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingUser}
                  className="px-5 py-2 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-black rounded-xl text-xs shadow-md cursor-pointer flex items-center gap-1.5 disabled:opacity-60"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSavingUser ? 'Menyimpan...' : 'Daftarkan Akun ke Server'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit User */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-6 space-y-4 shadow-2xl border border-slate-200 my-auto max-h-[92vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 to-teal-600 text-white flex items-center justify-center shadow-xs">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    Edit Akun &amp; Kredensial Pengguna
                  </h3>
                  <p className="text-xs text-slate-500">
                    Perubahan langsung aktif di sistem login &amp; wilayah
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-bold flex items-center gap-2">
                <XCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitEditUser} className="space-y-4 text-left text-xs">
              {!isKorcamRelawanMode && editRole !== 'super_admin' && (
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1.5">
                    Role / Tingkatan Akses
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(
                      [
                        { role: 'tim_sukses', label: 'Korwil' },
                        { role: 'kader', label: 'Korcam' },
                        { role: 'relawan', label: 'Relawan' },
                        { role: 'admin', label: 'Admin' },
                      ] as { role: UserRole; label: string }[]
                    ).map((r) => (
                      <button
                        key={r.role}
                        type="button"
                        onClick={() => setEditRole(r.role)}
                        className={`p-2 rounded-xl border text-center font-bold cursor-pointer ${
                          editRole === r.role
                            ? 'border-cyan-600 bg-cyan-50 text-cyan-900'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Status */}
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="radio"
                    name="editStatus"
                    checked={editStatus === 'Aktif'}
                    onChange={() => setEditStatus('Aktif')}
                    className="accent-emerald-600"
                  />
                  <span className="text-emerald-700 font-bold">Aktif</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="radio"
                    name="editStatus"
                    checked={editStatus === 'Nonaktif'}
                    onChange={() => setEditStatus('Nonaktif')}
                    className="accent-rose-600"
                  />
                  <span className="text-rose-700 font-bold">Nonaktif</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Nama Lengkap *
                  </label>
                  <input
                    type="text"
                    value={editNama}
                    onChange={(e) => setEditNama(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Username Login *
                  </label>
                  <input
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Email (Google SSO Whitelist)
                  </label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Password / PIN
                  </label>
                  <input
                    type="text"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Nomor WhatsApp / HP
                  </label>
                  <input
                    type="tel"
                    value={editNoHp}
                    onChange={(e) => setEditNoHp(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Jabatan / Posisi
                  </label>
                  <input
                    type="text"
                    value={editJabatan}
                    onChange={(e) => setEditJabatan(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs"
                  />
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <p className="text-[11px] font-extrabold text-slate-800">
                  Wilayah Tugas (Kota → Kecamatan → Kelurahan)
                </p>
                <WilayahSelector
                  value={editWilayahObj}
                  onChange={setEditWilayahObj}
                  compact
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-5 py-2 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white font-black rounded-xl text-xs shadow-md cursor-pointer flex items-center gap-1.5 disabled:opacity-60"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSavingEdit ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Reset Password */}
      {isResetModalOpen && resettingUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl border border-slate-200 text-left">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900">Reset Password Pengguna</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {resettingUser.nama} (@{resettingUser.username})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmitResetPassword} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">Password / PIN Baru</label>
                  <button
                    type="button"
                    onClick={handleGenerateRandomPin}
                    className="text-[11px] font-bold text-purple-700 hover:text-purple-900 cursor-pointer"
                  >
                    Acak PIN 6-Digit
                  </button>
                </div>
                <input
                  type="text"
                  value={newPasswordValue}
                  onChange={(e) => setNewPasswordValue(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900"
                />
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white font-black rounded-xl text-xs cursor-pointer"
                >
                  Simpan Password Baru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Ringkasan Korwil & Korcam Binaan */}
      {createdSummaryModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-6 space-y-4 shadow-2xl border border-slate-200 my-auto text-left">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Akun Korwil &amp; Korcam Binaan Berhasil Dibuat!
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  1 Akun Korwil &amp; {createdSummaryModal.korcams.length} Akun Korcam aktif di Whitelist
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCreatedSummaryModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3.5 bg-cyan-50 rounded-2xl border border-cyan-200 text-xs">
              <p className="font-bold text-slate-900">{createdSummaryModal.korwil.nama}</p>
              <p className="font-mono text-slate-600">
                @{createdSummaryModal.korwil.username} · Pass: {createdSummaryModal.korwil.password}
              </p>
            </div>
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {createdSummaryModal.korcams.map((k) => (
                <div
                  key={k.id}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-bold text-slate-900">{k.nama}</p>
                    <p className="font-mono text-slate-600 text-[11px]">
                      @{k.username} · Pass: {k.password}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopyText(`User: ${k.username}\nPass: ${k.password}`, `sum-${k.id}`)
                    }
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold text-[11px] cursor-pointer"
                  >
                    {copiedId === `sum-${k.id}` ? 'Tersalin' : 'Salin'}
                  </button>
                </div>
              ))}
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setCreatedSummaryModal(null)}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs cursor-pointer"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Konfirmasi Hapus */}
      {confirmDeleteUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Hapus Akun Pengguna?</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Akun <span className="font-bold text-slate-900">{confirmDeleteUser.nama}</span> (@
                  {confirmDeleteUser.username}) akan dihapus dari Whitelist dan tidak dapat login kembali.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={isDeletingUser}
                onClick={() => setConfirmDeleteUser(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeletingUser}
                onClick={async () => {
                  setIsDeletingUser(true);
                  try {
                    await onDeleteUser(confirmDeleteUser.id);
                    setConfirmDeleteUser(null);
                  } finally {
                    setIsDeletingUser(false);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 text-white text-xs font-bold cursor-pointer"
              >
                {isDeletingUser ? 'Menghapus...' : 'Ya, Hapus Akun'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
