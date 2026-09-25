'use client';

/**
 * User Management Portal Component - SIP-ANGGARAN v1.3.0
 * Path: src/app/(dashboard)/admin/users/page.tsx
 * Admin Portal for SUPERUSER role: User CRUD, Username lock on edit, Self-Delete Protection, and Multi-OPD supervision checklist for BAPPEDA
 */

import React, { useState } from 'react';
import { AppUser, UserRole } from '../../../../types/database';

// 49 Master Perangkat Daerah List
export const MASTER_49_OPD: string[] = [
  'Dinas Pendidikan Dan Kebudayaan',
  'Dinas Kesehatan',
  'Rumah Sakit Umum Daerah Bandar Negara Husada',
  'Rumah Sakit Umum Daerah dr. Abdul Moeloek',
  'Rumah Sakit Jiwa',
  'Dinas Bina Marga dan Bina Konstruksi',
  'Dinas Pengelolaan Sumber Daya Air',
  'Dinas Perumahan, Kawasan Permukiman dan Cipta Karya',
  'Satuan Polisi Pamong Praja',
  'Badan Penanggulangan Bencana Daerah',
  'Dinas Sosial',
  'Dinas Tenaga Kerja',
  'Dinas Pemberdayaan Perempuan dan Perlindungan Anak',
  'Dinas Lingkungan Hidup',
  'Dinas Kependudukan dan Pencatatan Sipil',
  'Dinas Pemberdayaan Masyarakat, Desa dan Transmigrasi',
  'Dinas Perhubungan',
  'Dinas Komunikasi, Informatika dan Statistik',
  'Dinas Koperasi, Usaha Kecil dan Menengah',
  'Dinas Penanaman Modal dan Pelayanan Terpadu Satu Pintu',
  'Dinas Pemuda dan Olahraga',
  'Dinas Perpustakaan dan Kearsipan',
  'Dinas Kelautan dan Perikanan',
  'Dinas Pariwisata dan Ekonomi Kreatif',
  'Dinas Ketahanan Pangan, Tanaman Pangan dan Hortikultura',
  'Dinas Perkebunan',
  'Dinas Peternakan dan Kesehatan Hewan',
  'Dinas Kehutanan',
  'Dinas Energi dan Sumber Daya Mineral',
  'Dinas Perindustrian dan Perdagangan',
  'Badan Perencanaan Pembangunan Daerah',
  'Badan Pengelola Keuangan dan Aset Daerah',
  'Badan Pendapatan Daerah',
  'Badan Kepegawaian Daerah',
  'Badan Pengembangan Sumber Daya Manusia',
  'Badan Riset dan Inovasi Daerah',
  'Badan Penghubung',
  'Sekretariat Daerah',
  'Sekretariat DPRD',
  'Inspektorat',
  'Badan Kesatuan Bangsa Dan Politik Daerah',
  'Dinas Pemberdayaan Masyarakat dan Kelurahan',
  'Dinas Pengendalian Penduduk dan KB',
  'Dinas Komunikasi dan Informatika',
  'Dinas Perdagangan',
  'Dinas Perindustrian',
  'Dinas Transmigrasi dan Tenaga Kerja',
  'Dinas Ketahanan Pangan',
  'Dinas Pemadam Kebakaran dan Penyelamatan'
];

// Initial mock users
const initialUsers: AppUser[] = [
  {
    id: 'u-001',
    username: 'superuser',
    fullName: 'Administrator Utama (Superuser)',
    role: 'SUPERUSER',
    opdName: 'Badan Perencanaan Pembangunan Daerah',
    isActive: true,
    createdAt: '2026-01-01'
  },
  {
    id: 'u-002',
    username: 'admin.tapd',
    fullName: 'Ketua Tim TAPD Provinsi',
    role: 'TAPD',
    opdName: 'Sekretariat Daerah',
    isActive: true,
    createdAt: '2026-01-02'
  },
  {
    id: 'u-003',
    username: 'bappeda',
    fullName: 'Perencana Bidang Pengampuan Bappeda',
    role: 'BAPPEDA',
    opdName: 'Badan Perencanaan Pembangunan Daerah',
    supervisedOpds: ['Dinas Kesehatan', 'Dinas Pendidikan Dan Kebudayaan', 'Badan Penanggulangan Bencana Daerah'],
    isActive: true,
    createdAt: '2026-01-03'
  },
  {
    id: 'u-004',
    username: 'opd.bpbd',
    fullName: 'Operator Anggaran BPBD',
    role: 'OPD',
    opdName: 'Badan Penanggulangan Bencana Daerah',
    isActive: true,
    createdAt: '2026-01-04'
  },
  {
    id: 'u-005',
    username: 'opd.diskominfo',
    fullName: 'Operator Anggaran Diskominfo',
    role: 'OPD',
    opdName: 'Dinas Komunikasi dan Informatika',
    isActive: true,
    createdAt: '2026-01-05'
  }
];

export default function UserManagementPage() {
  const currentSuperuser = 'superuser'; // Currently logged-in superuser account

  const [users, setUsers] = useState<AppUser[]>(initialUsers);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);

  // Form states
  const [formUsername, setFormUsername] = useState('');
  const [formFullName, setFormFullName] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('OPD');
  const [formOpd, setFormOpd] = useState(MASTER_49_OPD[0]);
  const [formSupervisedOpds, setFormSupervisedOpds] = useState<string[]>([]);
  const [formIsActive, setFormIsActive] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const openAddModal = () => {
    setEditingUser(null);
    setFormUsername('');
    setFormFullName('');
    setFormRole('OPD');
    setFormOpd(MASTER_49_OPD[0]);
    setFormSupervisedOpds([]);
    setFormIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (user: AppUser) => {
    setEditingUser(user);
    setFormUsername(user.username); // Read-only in edit mode
    setFormFullName(user.fullName);
    setFormRole(user.role);
    setFormOpd(user.opdName || MASTER_49_OPD[0]);
    setFormSupervisedOpds(user.supervisedOpds || []);
    setFormIsActive(user.isActive);
    setIsModalOpen(true);
  };

  const handleToggleSupervisedOpd = (opdName: string) => {
    if (formSupervisedOpds.includes(opdName)) {
      setFormSupervisedOpds(formSupervisedOpds.filter(o => o !== opdName));
    } else {
      setFormSupervisedOpds([...formSupervisedOpds, opdName]);
    }
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formFullName || (!editingUser && !formUsername)) {
      showNotification('Harap isi nama lengkap dan username.');
      return;
    }

    if (editingUser) {
      // Update existing user (Username locked/unchanged)
      setUsers(users.map(u => {
        if (u.id === editingUser.id) {
          return {
            ...u,
            fullName: formFullName,
            role: formRole,
            opdName: formRole === 'OPD' ? formOpd : u.opdName,
            supervisedOpds: formRole === 'BAPPEDA' ? formSupervisedOpds : undefined,
            isActive: formIsActive
          };
        }
        return u;
      }));
      showNotification(`Pengguna '${editingUser.username}' berhasil diperbarui.`);
    } else {
      // Check duplicate username
      if (users.some(u => u.username.toLowerCase() === formUsername.toLowerCase())) {
        showNotification(`Username '${formUsername}' sudah terdaftar.`);
        return;
      }

      const newUser: AppUser = {
        id: `u-${Date.now()}`,
        username: formUsername,
        fullName: formFullName,
        role: formRole,
        opdName: formRole === 'OPD' ? formOpd : 'Badan Perencanaan Pembangunan Daerah',
        supervisedOpds: formRole === 'BAPPEDA' ? formSupervisedOpds : undefined,
        isActive: formIsActive,
        createdAt: new Date().toISOString().slice(0, 10)
      };

      setUsers([...users, newUser]);
      showNotification(`Akun baru '${formUsername}' (${formRole}) berhasil ditambahkan.`);
    }

    setIsModalOpen(false);
  };

  const handleDeleteUser = (user: AppUser) => {
    // Self-delete protection check
    if (user.username.toLowerCase() === currentSuperuser.toLowerCase()) {
      alert(`AKSI DITOLAK: Anda tidak dapat menghapus akun Anda sendiri (${user.username})!`);
      return;
    }

    if (confirm(`Apakah Anda yakin ingin menghapus pengguna '${user.fullName}' (${user.username})?`)) {
      setUsers(users.filter(u => u.id !== user.id));
      showNotification(`Akun '${user.username}' berhasil dihapus.`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-6 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-indigo-900 border border-indigo-500 text-indigo-100 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs animate-bounce">
          <i className="fas fa-info-circle text-indigo-400 text-lg"></i>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-purple-950 text-purple-300 border border-purple-800 rounded text-[10px] font-mono font-bold uppercase">
              Superuser Exclusive
            </span>
            <span className="text-xs text-slate-500 font-mono">SIP-ANGGARAN v1.3.0</span>
          </div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <i className="fas fa-users-cog text-purple-400"></i> Portal Manajemen Pengguna System
          </h1>
          <p className="text-xs text-slate-400">
            Kelola data akun pengguna, penetapan peran (RBAC 4 Role), serta penugasan multi-OPD pengampu Bappeda.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all flex items-center gap-2"
        >
          <i className="fas fa-user-plus"></i> Tambah Akun Baru
        </button>
      </div>

      {/* User Accounts Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <i className="fas fa-list text-indigo-400"></i> Daftar Akun Terdaftar ({users.length})
          </h2>
        </div>

        <div className="overflow-x-auto border border-slate-800 rounded-xl">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold uppercase text-[10px] tracking-wider">
                <th className="p-3">Username &amp; ID</th>
                <th className="p-3">Nama Lengkap</th>
                <th className="p-3">Peran (RBAC)</th>
                <th className="p-3">Instansi / OPD Pengampuan</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3 font-mono font-bold text-indigo-300">
                    {u.username}
                    <span className="block text-[10px] text-slate-500 font-normal">{u.id}</span>
                  </td>
                  <td className="p-3 font-medium text-slate-200">{u.fullName}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        u.role === 'SUPERUSER'
                          ? 'bg-purple-950 text-purple-300 border-purple-800'
                          : u.role === 'TAPD'
                          ? 'bg-indigo-950 text-indigo-300 border-indigo-800'
                          : u.role === 'BAPPEDA'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                          : 'bg-amber-950 text-amber-300 border-amber-800'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="p-3 text-slate-300">
                    {u.role === 'BAPPEDA' ? (
                      <div className="space-y-1">
                        <span className="text-slate-400 block font-semibold">{u.opdName}</span>
                        <div className="flex flex-wrap gap-1">
                          {u.supervisedOpds && u.supervisedOpds.length > 0 ? (
                            u.supervisedOpds.map((sopd, idx) => (
                              <span key={idx} className="bg-slate-800 text-emerald-400 border border-slate-700 text-[9px] px-1.5 py-0.5 rounded">
                                {sopd}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-500 text-[10px] italic">Belum ada pengampuan</span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span>{u.opdName || '-'}</span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.isActive
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-rose-950 text-rose-400 border border-rose-800'
                      }`}
                    >
                      {u.isActive ? 'Aktif' : 'Non-Aktif'}
                    </span>
                  </td>
                  <td className="p-3 text-center space-x-1">
                    <button
                      type="button"
                      onClick={() => openEditModal(u)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded border border-slate-700 transition-colors"
                      title="Edit User"
                    >
                      <i className="fas fa-edit"></i>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteUser(u)}
                      disabled={u.username.toLowerCase() === currentSuperuser.toLowerCase()}
                      className={`px-2.5 py-1 rounded border transition-colors ${
                        u.username.toLowerCase() === currentSuperuser.toLowerCase()
                          ? 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed'
                          : 'bg-rose-950/80 hover:bg-rose-900 text-rose-300 border-rose-800'
                      }`}
                      title={u.username.toLowerCase() === currentSuperuser.toLowerCase() ? 'Proteksi Self-Delete' : 'Hapus User'}
                    >
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal CRUD User */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden text-xs">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/90">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <i className={`fas ${editingUser ? 'fa-user-edit text-indigo-400' : 'fa-user-plus text-emerald-400'}`}></i>
                <span>{editingUser ? `Edit Akun Pengguna: ${editingUser.username}` : 'Tambah Akun Pengguna Baru'}</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1 uppercase">
                    Username {editingUser && <span className="text-rose-400">(Terkunci / Read-Only)</span>}
                  </label>
                  <input
                    type="text"
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    disabled={Boolean(editingUser)}
                    placeholder="Contoh: opd.dinkes"
                    className={`w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 ${
                      editingUser ? 'opacity-60 cursor-not-allowed bg-slate-900' : ''
                    }`}
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1 uppercase">Nama Lengkap</label>
                  <input
                    type="text"
                    value={formFullName}
                    onChange={(e) => setFormFullName(e.target.value)}
                    placeholder="Masukkan nama pengguna..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1 uppercase">Peran Sistem (RBAC)</label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as UserRole)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="OPD">OPD - Operator Perangkat Daerah</option>
                  <option value="BAPPEDA">BAPPEDA - Perencana Pengampu OPD</option>
                  <option value="TAPD">TAPD - Tim Anggaran Pemerintah Daerah</option>
                  <option value="SUPERUSER">SUPERUSER - Administrator Utama System</option>
                </select>
              </div>

              {/* Conditional: Primary OPD Selection if role is OPD */}
              {formRole === 'OPD' && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1 uppercase">Pilih Instansi OPD Utama</label>
                  <select
                    value={formOpd}
                    onChange={(e) => setFormOpd(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    {MASTER_49_OPD.map((opd, i) => (
                      <option key={i} value={opd}>
                        {opd}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Conditional: Multi-Select 49 OPD Checklist if role is BAPPEDA */}
              {formRole === 'BAPPEDA' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-semibold text-emerald-400 uppercase">
                      Checklist Multi-Pilih OPD Pengampuan ({formSupervisedOpds.length} dipilih)
                    </label>
                    <button
                      type="button"
                      onClick={() => setFormSupervisedOpds(formSupervisedOpds.length === MASTER_49_OPD.length ? [] : [...MASTER_49_OPD])}
                      className="text-[10px] text-indigo-400 hover:underline font-semibold"
                    >
                      {formSupervisedOpds.length === MASTER_49_OPD.length ? 'Batal Semua' : 'Pilih Semua 49 OPD'}
                    </button>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 max-h-48 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-2">
                    {MASTER_49_OPD.map((opd, idx) => (
                      <label key={idx} className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white text-[11px]">
                        <input
                          type="checkbox"
                          checked={formSupervisedOpds.includes(opd)}
                          onChange={() => handleToggleSupervisedOpd(opd)}
                          className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-0"
                        />
                        <span className="truncate">{opd}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="user-is-active"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-indigo-500 focus:ring-0"
                />
                <label htmlFor="user-is-active" className="text-slate-300 cursor-pointer font-medium">
                  Akun Aktif (Dapat Login ke System)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow-md"
                >
                  Simpan Akun
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
