import React, { useState } from 'react';
import { UserAccount, UserRole } from '../../types/vore';
import { TimSuksesWilayahRecord } from '../../data/petaSuaraData';
import { lookupSmartCoordinates } from '../../utils/geocoding';
import {
  Users,
  UserPlus,
  Shield,
  Building2,
  UserCheck,
  Search,
  Filter,
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
  Sparkles,
  Lock,
  X,
  Check,
} from 'lucide-react';

interface UserRoleManagementViewProps {
  userAccounts: UserAccount[];
  currentUser: UserAccount;
  onAddUser: (user: UserAccount) => void;
  onUpdateUser?: (user: UserAccount) => void;
  onDeleteUser: (userId: string) => void;
  onToggleUserStatus: (userId: string) => void;
  onSaveTimSukses?: (ts: TimSuksesWilayahRecord) => void;
}

export const UserRoleManagementView: React.FC<UserRoleManagementViewProps> = ({
  userAccounts,
  currentUser,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onToggleUserStatus,
  onSaveTimSukses,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<UserRole>('tim_sukses');
  const [editNama, setEditNama] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editJabatan, setEditJabatan] = useState('');
  const [editWilayah, setEditWilayah] = useState('');
  const [editTps, setEditTps] = useState('');
  const [editNoHp, setEditNoHp] = useState('');
  const [editStatus, setEditStatus] = useState<'Aktif' | 'Nonaktif'>('Aktif');
  const [editError, setEditError] = useState<string | null>(null);

  // Reset Password Modal State
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resettingUser, setResettingUser] = useState<UserAccount | null>(null);
  const [newPasswordValue, setNewPasswordValue] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Add Form State
  const [formRole, setFormRole] = useState<'tim_sukses' | 'kader' | 'admin'>('tim_sukses');
  const [formNama, setFormNama] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('123456');
  const [formJabatan, setFormJabatan] = useState('');
  const [formWilayah, setFormWilayah] = useState('DAPIL DKI JAKARTA II');
  const [formTps, setFormTps] = useState('TPS 048');
  const [formNoHp, setFormNoHp] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Statistics
  const totalUsers = userAccounts.length;
  const superAdminCount = userAccounts.filter((u) => u.role === 'super_admin').length;
  const adminCount = userAccounts.filter((u) => u.role === 'admin').length;
  const timSuksesCount = userAccounts.filter((u) => u.role === 'tim_sukses').length;
  const kaderCount = userAccounts.filter((u) => u.role === 'kader').length;

  // Filtered List
  const filteredUsers = userAccounts.filter((user) => {
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      user.nama.toLowerCase().includes(q) ||
      user.username.toLowerCase().includes(q) ||
      user.wilayah.toLowerCase().includes(q) ||
      (user.tps && user.tps.toLowerCase().includes(q)) ||
      (user.jabatan && user.jabatan.toLowerCase().includes(q)) ||
      (user.noHp && user.noHp.includes(q));
    return matchesRole && matchesSearch;
  });

  const handleOpenAddModal = (defaultRole?: 'tim_sukses' | 'kader' | 'admin') => {
    const targetRole = defaultRole || 'tim_sukses';
    setFormRole(targetRole);
    setFormNama('');
    setFormUsername('');
    setFormPassword('123456');
    setFormJabatan(
      targetRole === 'tim_sukses'
        ? 'Koordinator Pemenangan Wilayah'
        : targetRole === 'kader'
        ? 'Relawan Saksi TPS'
        : 'Staf Admin Operasional'
    );
    setFormWilayah('DAPIL DKI JAKARTA II');
    setFormTps('TPS 048');
    setFormNoHp('');
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleRoleSelection = (role: 'tim_sukses' | 'kader' | 'admin') => {
    setFormRole(role);
    if (!formJabatan || formJabatan === 'Koordinator Pemenangan Wilayah' || formJabatan === 'Relawan Saksi TPS' || formJabatan === 'Staf Admin Operasional') {
      setFormJabatan(
        role === 'tim_sukses'
          ? 'Koordinator Pemenangan Wilayah'
          : role === 'kader'
          ? 'Relawan Saksi TPS'
          : 'Staf Admin Operasional'
      );
    }
  };

  const handleSubmitNewUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNama.trim() || !formUsername.trim()) {
      setFormError('Nama Lengkap dan Username wajib diisi.');
      return;
    }

    const cleanUsername = formUsername.trim().toLowerCase().replace(/\s+/g, '');
    const isDuplicate = userAccounts.some(
      (u) => u.username.toLowerCase() === cleanUsername
    );

    if (isDuplicate) {
      setFormError(`Username "${cleanUsername}" sudah digunakan. Silakan gunakan username lain.`);
      return;
    }

    const newAccount: UserAccount = {
      id: `acc-${Date.now()}`,
      role: formRole,
      nama: formNama.trim(),
      username: cleanUsername,
      email: `${cleanUsername}@swaraku.com`,
      password: formPassword || '123456',
      jabatan:
        formJabatan.trim() ||
        (formRole === 'tim_sukses' ? 'Tim Sukses Pemenangan' : 'Relawan Saksi TPS'),
      wilayah: formWilayah.trim() || 'Dapil Terkait',
      tps: formRole === 'kader' ? formTps.trim() || 'TPS 048' : undefined,
      noHp: formNoHp.trim() || '0812' + Math.floor(10000000 + Math.random() * 90000000),
      status: 'Aktif',
      dibuatPada: new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      fotoUrl:
        formRole === 'tim_sukses'
          ? 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=250&q=80'
          : formRole === 'kader'
          ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80'
          : 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=250&q=80',
    };

    onAddUser(newAccount);

    // Otomatis terhubung ke Peta Suara Swaraku jika role Tim Sukses
    if (formRole === 'tim_sukses' && onSaveTimSukses) {
      const parsedWilayah = formWilayah.trim();
      let detectedKec = 'Kecamatan Penjaringan';
      let detectedKota = 'Jakarta Utara';

      if (parsedWilayah) {
        if (parsedWilayah.toLowerCase().includes('penjaringan')) {
          detectedKec = 'Kecamatan Penjaringan';
          detectedKota = 'Jakarta Utara';
        } else if (parsedWilayah.includes(',')) {
          const parts = parsedWilayah.split(',').map((p) => p.trim());
          detectedKec = parts[0] || 'Kecamatan Terdaftar';
          detectedKota = parts[1] || 'DKI Jakarta';
        } else {
          detectedKec = parsedWilayah;
          detectedKota = parsedWilayah.includes('Kota') || parsedWilayah.includes('Kab') ? parsedWilayah : 'DKI Jakarta';
        }
      }

      const smartCoords = lookupSmartCoordinates('', detectedKec, detectedKota) || {
        lat: -6.1264,
        lng: 106.7885,
      };

      onSaveTimSukses({
        id: `ts-${newAccount.id}`,
        nama: newAccount.nama,
        noHp: newAccount.noHp || '081288219901',
        jabatan: newAccount.jabatan || 'Koordinator Tim Sukses',
        kota: detectedKota,
        kecamatanList: [detectedKec.toLowerCase().startsWith('kec') ? detectedKec : `Kecamatan ${detectedKec}`],
        kelurahanList: ['Seluruh Kelurahan'],
        lat: smartCoords.lat,
        lng: smartCoords.lng,
        waktuDaftar: newAccount.dibuatPada || 'Baru Didaftarkan',
        status: 'Aktif',
      });
    }

    setIsAddModalOpen(false);
  };

  const handleOpenEditModal = (user: UserAccount) => {
    setEditingUserId(user.id);
    setEditRole(user.role);
    setEditNama(user.nama);
    setEditUsername(user.username);
    setEditPassword(user.password || '123456');
    setEditJabatan(user.jabatan || '');
    setEditWilayah(user.wilayah || 'DAPIL DKI JAKARTA II');
    setEditTps(user.tps || 'TPS 048');
    setEditNoHp(user.noHp || '');
    setEditStatus(user.status || 'Aktif');
    setEditError(null);
    setIsEditModalOpen(true);
  };

  const handleSubmitEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUserId) return;
    if (!editNama.trim() || !editUsername.trim()) {
      setEditError('Nama Lengkap dan Username wajib diisi.');
      return;
    }

    const cleanUsername = editUsername.trim().toLowerCase().replace(/\s+/g, '');
    const isDuplicate = userAccounts.some(
      (u) => u.id !== editingUserId && u.username.toLowerCase() === cleanUsername
    );

    if (isDuplicate) {
      setEditError(`Username "${cleanUsername}" sudah digunakan akun lain. Silakan pilih username unik.`);
      return;
    }

    const targetUser = userAccounts.find((u) => u.id === editingUserId);
    if (!targetUser) return;

    const updatedAccount: UserAccount = {
      ...targetUser,
      role: editRole,
      nama: editNama.trim(),
      username: cleanUsername,
      email: `${cleanUsername}@swaraku.com`,
      password: editPassword.trim() || targetUser.password || '123456',
      jabatan: editJabatan.trim() || targetUser.jabatan,
      wilayah: editWilayah.trim() || targetUser.wilayah,
      tps: editRole === 'kader' ? (editTps.trim() || 'TPS 048') : undefined,
      noHp: editNoHp.trim() || targetUser.noHp,
      status: editStatus,
    };

    if (onUpdateUser) {
      onUpdateUser(updatedAccount);
    }
    setIsEditModalOpen(false);
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
    if (!resettingUser) return;
    if (!newPasswordValue.trim()) return;

    const updatedUser: UserAccount = {
      ...resettingUser,
      password: newPasswordValue.trim(),
    };

    if (onUpdateUser) {
      onUpdateUser(updatedUser);
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
            <span>Super Admin</span>
          </span>
        );
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-100 text-teal-800 border border-teal-200">
            <Shield className="w-3 h-3 text-teal-600" />
            <span>Admin</span>
          </span>
        );
      case 'tim_sukses':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-100 text-cyan-800 border border-cyan-200">
            <Building2 className="w-3 h-3 text-cyan-600" />
            <span>Tim Sukses</span>
          </span>
        );
      case 'kader':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
            <UserCheck className="w-3 h-3 text-emerald-600" />
            <span>Kader</span>
          </span>
        );
      default:
        return null;
    }
  };

  const generateWhatsAppShareLink = (user: UserAccount) => {
    const text = `Halo Bapak/Ibu ${encodeURIComponent(user.nama)},%0A%0AAkun akses aplikasi pemenangan SWARAKU Anda telah aktif:%0A- Role: ${encodeURIComponent(user.role === 'tim_sukses' ? 'Tim Sukses' : user.role === 'kader' ? 'Kader / Saksi TPS' : 'Admin')}%0A- Username: ${encodeURIComponent(user.username)}%0A- Password / PIN: ${encodeURIComponent(user.password || '123456')}%0A- Wilayah: ${encodeURIComponent(user.wilayah)} ${user.tps ? `(${encodeURIComponent(user.tps)})` : ''}%0A%0ASilakan masuk melalui aplikasi SWARAKU. Terima kasih.`;
    return `https://wa.me/${(user.noHp || '').replace(/\D/g, '')}?text=${text}`;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Module 08 Header */}
      <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl border border-indigo-700/50 shadow-md space-y-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2.5 py-0.5 rounded-full font-mono">
                KHUSUS SUPER ADMIN
              </span>
              <span className="text-xs text-slate-300 font-bold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Manajemen Hak Akses &amp; Akun Lapangan</span>
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Penambahan Role atau User Akun Tim Sukses &amp; Kader
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl mt-1 leading-relaxed">
              Otoritas penuh Super Admin untuk mendaftarkan akun baru Tim Sukses dan Kader Lapangan, mengatur penempatan wilayah &amp; TPS, mengaktifkan/menonaktifkan akses, serta membagikan kredensial login langsung ke relawan.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenAddModal('tim_sukses')}
              className="px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <Building2 className="w-4 h-4" />
              <span>+ User Tim Sukses</span>
            </button>
            <button
              onClick={() => handleOpenAddModal('kader')}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <UserCheck className="w-4 h-4" />
              <span>+ User Kader</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Stat Counter */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-white/10 text-xs">
          <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
            <span className="text-[10px] text-slate-400 block font-mono">Total Akun Terdaftar</span>
            <span className="text-xl font-black text-white font-mono mt-0.5 block">{totalUsers}</span>
            <span className="text-[10px] text-teal-300">Semua Level Pengguna</span>
          </div>
          <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
            <span className="text-[10px] text-purple-300 block font-mono">Akun Admin &amp; Super Admin</span>
            <span className="text-xl font-black text-purple-200 font-mono mt-0.5 block">
              {superAdminCount + adminCount}
            </span>
            <span className="text-[10px] text-purple-300 font-medium">{superAdminCount} Super, {adminCount} Admin</span>
          </div>
          <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
            <span className="text-[10px] text-cyan-300 block font-mono">Akun Tim Sukses</span>
            <span className="text-xl font-black text-cyan-300 font-mono mt-0.5 block">{timSuksesCount}</span>
            <span className="text-[10px] text-slate-300 font-medium">Bappilu &amp; Korwil</span>
          </div>
          <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
            <span className="text-[10px] text-emerald-300 block font-mono">Akun Kader / Saksi TPS</span>
            <span className="text-xl font-black text-emerald-300 font-mono mt-0.5 block">{kaderCount}</span>
            <span className="text-[10px] text-slate-300 font-medium">Penggerak Lapangan</span>
          </div>
        </div>
      </div>

      {/* Control Bar: Search & Role Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Cari user berdasarkan Nama, Username, Wilayah, TPS, atau No HP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-cyan-500 font-medium"
          />
        </div>

        {/* Role Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
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
            onClick={() => setRoleFilter('tim_sukses')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
              roleFilter === 'tim_sukses'
                ? 'bg-cyan-700 text-white'
                : 'bg-cyan-50 text-cyan-800 hover:bg-cyan-100 border border-cyan-200'
            }`}
          >
            Tim Sukses ({timSuksesCount})
          </button>
          <button
            onClick={() => setRoleFilter('kader')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
              roleFilter === 'kader'
                ? 'bg-emerald-700 text-white'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            Kader ({kaderCount})
          </button>
          <button
            onClick={() => setRoleFilter('admin')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
              roleFilter === 'admin'
                ? 'bg-teal-700 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Admin ({adminCount})
          </button>
        </div>
      </div>

      {/* User Accounts Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-700" />
            <h3 className="text-sm font-black text-slate-900">
              Daftar Pengguna Sistem SWARAKU ({filteredUsers.length})
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Menampilkan pengguna aktif &amp; terdaftar
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
              <tr>
                <th className="p-3.5">Pengguna &amp; Identitas</th>
                <th className="p-3.5">Role</th>
                <th className="p-3.5 bg-purple-50/60 text-purple-900 font-bold">Username &amp; Password (Kredensial)</th>
                <th className="p-3.5">Jabatan &amp; Posisi</th>
                <th className="p-3.5">Wilayah Tugas &amp; TPS</th>
                <th className="p-3.5">Kontak WhatsApp</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-center">Aksi Super Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    Tidak ada akun pengguna yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isCurrent = user.id === currentUser.id;
                  const isProtectedSuperAdmin = user.role === 'super_admin';
                  const isActive = user.status !== 'Nonaktif';

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Name & Identitas */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              user.fotoUrl ||
                              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80'
                            }
                            alt={user.nama}
                            className="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0"
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900">{user.nama}</span>
                              {isCurrent && (
                                <span className="text-[9px] font-black uppercase text-teal-800 bg-teal-100 px-1.5 py-0.2 rounded font-mono">
                                  Anda
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">
                              ID: {user.id.slice(-6)}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="p-3.5">{getRoleBadge(user.role)}</td>

                      {/* Username & Password (Terlihat Langsung Khusus Super Admin) */}
                      <td className="p-3.5 bg-purple-50/20">
                        <div className="space-y-1.5 min-w-[170px]">
                          <div className="flex items-center justify-between bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-2xs">
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">User:</span>
                            <span className="font-mono font-bold text-slate-900 text-xs">@{user.username}</span>
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
                          <div className="flex items-center justify-between bg-purple-50 px-2 py-1 rounded-lg border border-purple-200 shadow-2xs">
                            <div className="flex items-center gap-1">
                              <KeyRound className="w-3 h-3 text-purple-600 shrink-0" />
                              <span className="text-[9px] text-purple-600 font-bold uppercase tracking-wider">Pass:</span>
                            </div>
                            <span className="font-mono font-black text-purple-950 text-xs tracking-wider">
                              {user.password || '123456'}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyText(user.password || '123456', `p-${user.id}`)}
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

                      {/* Jabatan */}
                      <td className="p-3.5">
                        <span className="font-semibold text-slate-800 block">{user.jabatan}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Dibuat: {user.dibuatPada || 'Sistem'}
                        </span>
                      </td>

                      {/* Wilayah & TPS */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-1 text-slate-700 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{user.wilayah}</span>
                        </div>
                        {user.tps && (
                          <span className="inline-block mt-0.5 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {user.tps}
                          </span>
                        )}
                      </td>

                      {/* No HP & WA share */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-slate-800">{user.noHp || '-'}</span>
                          {user.noHp && (
                            <a
                              href={generateWhatsAppShareLink(user)}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors"
                              title="Kirim info login akun ke WhatsApp relawan"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Status Toggle */}
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
                          title={isProtectedSuperAdmin ? 'Akun Super Admin tidak dapat dinonaktifkan' : 'Klik untuk ubah status akun'}
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
                            title="Reset Password Akun"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                          {isProtectedSuperAdmin || isCurrent ? (
                            <span className="text-[10px] text-slate-400 font-mono px-1">Dilindungi</span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Yakin ingin menghapus akun "${user.nama}" (@${user.username})? Tindakan ini tidak dapat dibatalkan.`)) {
                                  onDeleteUser(user.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Hapus Akun Pengguna"
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

      {/* Modal: Tambah User / Role Baru */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-2xl border border-slate-200 my-auto animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                    Tambah Pengguna &amp; Penetapan Role
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Buat akun login baru untuk Tim Sukses atau Kader Lapangan
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
              {/* Role Selection Picker */}
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1.5">
                  Pilih Role Pengguna:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleRoleSelection('tim_sukses')}
                    className={`p-3 rounded-2xl border-2 text-left cursor-pointer transition-all flex flex-col justify-between ${
                      formRole === 'tim_sukses'
                        ? 'border-cyan-600 bg-cyan-50/70 shadow-xs ring-2 ring-cyan-200'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                    }`}
                  >
                    <Building2 className={`w-5 h-5 mb-1 ${formRole === 'tim_sukses' ? 'text-cyan-600' : 'text-slate-400'}`} />
                    <div>
                      <span className="font-extrabold text-slate-900 block text-xs">Tim Sukses</span>
                      <span className="text-[10px] text-slate-500 block leading-tight">Direktur &amp; Korwil</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRoleSelection('kader')}
                    className={`p-3 rounded-2xl border-2 text-left cursor-pointer transition-all flex flex-col justify-between ${
                      formRole === 'kader'
                        ? 'border-emerald-600 bg-emerald-50/70 shadow-xs ring-2 ring-emerald-200'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                    }`}
                  >
                    <UserCheck className={`w-5 h-5 mb-1 ${formRole === 'kader' ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <div>
                      <span className="font-extrabold text-slate-900 block text-xs">Kader</span>
                      <span className="text-[10px] text-slate-500 block leading-tight">Relawan Saksi TPS</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRoleSelection('admin')}
                    className={`p-3 rounded-2xl border-2 text-left cursor-pointer transition-all flex flex-col justify-between ${
                      formRole === 'admin'
                        ? 'border-teal-600 bg-teal-50/70 shadow-xs ring-2 ring-teal-200'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                    }`}
                  >
                    <Shield className={`w-5 h-5 mb-1 ${formRole === 'admin' ? 'text-teal-600' : 'text-slate-400'}`} />
                    <div>
                      <span className="font-extrabold text-slate-900 block text-xs">Admin</span>
                      <span className="text-[10px] text-slate-500 block leading-tight">Operasional 7 Modul</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Nama Lengkap & Username */}
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
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-semibold focus:outline-hidden focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Username Login <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: hendra_kader"
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-mono font-bold focus:outline-hidden focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Password & No HP */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Password / PIN Default
                  </label>
                  <div className="relative">
                    <KeyRound className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-mono font-bold focus:outline-hidden focus:border-cyan-500"
                    />
                  </div>
                </div>
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
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-mono focus:outline-hidden focus:border-cyan-500"
                    />
                  </div>
                </div>
              </div>

              {/* Jabatan & Wilayah */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Jabatan / Posisi
                  </label>
                  <input
                    type="text"
                    value={formJabatan}
                    onChange={(e) => setFormJabatan(e.target.value)}
                    placeholder="Contoh: Koordinator Relawan Cilandak"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-hidden focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Wilayah / Dapil Penugasan
                  </label>
                  <input
                    type="text"
                    value={formWilayah}
                    onChange={(e) => setFormWilayah(e.target.value)}
                    placeholder="Contoh: Kel. Sukamaju, Kec. Cilandak"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-hidden focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* TPS Penugasan (Only for Kader) */}
              {formRole === 'kader' && (
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Nomor TPS Penugasan Saksi
                  </label>
                  <input
                    type="text"
                    value={formTps}
                    onChange={(e) => setFormTps(e.target.value)}
                    placeholder="Contoh: TPS 048"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-bold focus:outline-hidden focus:border-cyan-500"
                  />
                </div>
              )}

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-black rounded-xl text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  <span>Daftarkan Akun</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit User & Kredensial */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-2xl border border-slate-200 my-auto animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 to-teal-600 text-white flex items-center justify-center shadow-xs">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                    Edit Akun &amp; Kredensial Pengguna
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Perubahan data akun langsung tersinkronisasi saat pengguna melakukan login
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

            {/* Error Message */}
            {editError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-bold flex items-center gap-2">
                <XCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitEditUser} className="space-y-4 text-left">
              {/* Role Selection */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1.5">
                  Tingkatan Role / Akses
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditRole('tim_sukses')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      editRole === 'tim_sukses'
                        ? 'border-cyan-600 bg-cyan-50 text-cyan-900 font-bold ring-2 ring-cyan-500/20'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <Building2 className="w-4 h-4 text-cyan-600 mb-1" />
                    <span className="text-xs block font-bold">Tim Sukses</span>
                    <span className="text-[10px] text-slate-500">Akses Bappilu &amp; Peta</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditRole('kader')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      editRole === 'kader'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold ring-2 ring-emerald-500/20'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <UserCheck className="w-4 h-4 text-emerald-600 mb-1" />
                    <span className="text-xs block font-bold">Kader Saksi</span>
                    <span className="text-[10px] text-slate-500">Input KTP &amp; Form C1</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditRole('admin')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      editRole === 'admin'
                        ? 'border-teal-600 bg-teal-50 text-teal-900 font-bold ring-2 ring-teal-500/20'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <Shield className="w-4 h-4 text-teal-600 mb-1" />
                    <span className="text-xs block font-bold">Admin</span>
                    <span className="text-[10px] text-slate-500">7 Modul Operasional</span>
                  </button>
                </div>
              </div>

              {/* Status Akun */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Status Akses Akun
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                    <input
                      type="radio"
                      name="editStatus"
                      checked={editStatus === 'Aktif'}
                      onChange={() => setEditStatus('Aktif')}
                      className="accent-emerald-600"
                    />
                    <span className="text-emerald-700 font-bold">Aktif (Dapat Login)</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                    <input
                      type="radio"
                      name="editStatus"
                      checked={editStatus === 'Nonaktif'}
                      onChange={() => setEditStatus('Nonaktif')}
                      className="accent-rose-600"
                    />
                    <span className="text-rose-700 font-bold">Nonaktif (Blokir Login)</span>
                  </label>
                </div>
              </div>

              {/* Nama Lengkap & Username */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Nama Lengkap <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editNama}
                    onChange={(e) => setEditNama(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-hidden focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Username Login <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-mono focus:outline-hidden focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Password & WhatsApp */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Password / PIN Login
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      placeholder="Password login akun"
                      className="w-full px-3 py-2 pl-8 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-mono focus:outline-hidden focus:border-cyan-500"
                    />
                    <KeyRound className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Nomor WhatsApp / HP
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={editNoHp}
                      onChange={(e) => setEditNoHp(e.target.value)}
                      placeholder="Contoh: 0812XXXXXXXX"
                      className="w-full px-3 py-2 pl-8 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-mono focus:outline-hidden focus:border-cyan-500"
                    />
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  </div>
                </div>
              </div>

              {/* Jabatan & Wilayah */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Jabatan / Posisi
                  </label>
                  <input
                    type="text"
                    value={editJabatan}
                    onChange={(e) => setEditJabatan(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-hidden focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Wilayah Penugasan
                  </label>
                  <input
                    type="text"
                    value={editWilayah}
                    onChange={(e) => setEditWilayah(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-hidden focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* TPS Penugasan (Khusus Kader) */}
              {editRole === 'kader' && (
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Nomor TPS Penugasan Saksi
                  </label>
                  <input
                    type="text"
                    value={editTps}
                    onChange={(e) => setEditTps(e.target.value)}
                    placeholder="Contoh: TPS 048"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-bold focus:outline-hidden focus:border-cyan-500"
                  />
                </div>
              )}

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white font-black rounded-xl text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Reset Password Pengguna */}
      {isResetModalOpen && resettingUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl border border-slate-200 my-auto animate-in fade-in zoom-in-95 duration-200 text-left">
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                    Reset Password Pengguna
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Ubah password akses untuk {resettingUser.nama}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* User Credential Info Box */}
            <div className="p-3.5 bg-purple-50/70 rounded-2xl border border-purple-200 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-medium">Nama Akun:</span>
                <span className="font-bold text-slate-900">{resettingUser.nama}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-medium">Username Login:</span>
                <span className="font-mono font-bold text-purple-950">@{resettingUser.username}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-medium">Password Saat Ini:</span>
                <span className="font-mono font-black text-slate-900 bg-white px-2 py-0.5 rounded border border-purple-200">
                  {resettingUser.password || '123456'}
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmitResetPassword} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Password / PIN Baru
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateRandomPin}
                    className="text-[11px] font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Acak PIN 6-Digit</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={newPasswordValue}
                    onChange={(e) => setNewPasswordValue(e.target.value)}
                    required
                    placeholder="Masukkan password baru..."
                    className="w-full px-3.5 py-2.5 pl-9 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-hidden focus:border-purple-600 focus:bg-white"
                  />
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Setelah disimpan, user wajib memasukkan password baru ini untuk login. Password lama otomatis tidak berlaku.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-black rounded-xl text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Password Baru</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
