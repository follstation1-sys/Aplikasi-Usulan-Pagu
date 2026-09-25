'use client';

/**
 * Master Data Management Portal Component - SIP-ANGGARAN v1.3.0
 * Path: src/app/(dashboard)/admin/master/page.tsx
 * Admin Portal for SUPERUSER and TAPD roles: Manage Master OPD List and Master Priority Scales
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { MASTER_49_OPD } from '../users/page';

export default function MasterDataPage() {
  const [currentUserRole, setCurrentUserRole] = useState<'SUPERUSER' | 'TAPD' | 'BAPPEDA' | 'OPD'>('SUPERUSER');
  const [activeTab, setActiveTab] = useState<'opd' | 'priority'>('opd');

  // Master OPD list state
  const [opdList, setOpdList] = useState<string[]>([...MASTER_49_OPD]);
  const [newOpdInput, setNewOpdInput] = useState<string>('');

  // Master Skala Prioritas list state
  const [priorityList, setPriorityList] = useState<string[]>([
    'Prioritas 1 (Wajib)',
    'Prioritas 2 (RPJMD)',
    'Prioritas 3 (Rutin)'
  ]);
  const [newPriorityInput, setNewPriorityInput] = useState<string>('');

  // Toast alert
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleAddOpd = (e: React.FormEvent) => {
    e.preventDefault();
    const val = newOpdInput.trim();
    if (!val) {
      showToast('Harap masukkan nama instansi Perangkat Daerah.');
      return;
    }
    if (opdList.some(o => o.toLowerCase() === val.toLowerCase())) {
      showToast(`Instansi '${val}' sudah terdaftar dalam master.`);
      return;
    }
    setOpdList([val, ...opdList]);
    setNewOpdInput('');
    showToast(`Instansi '${val}' berhasil ditambahkan.`);
  };

  const handleDeleteOpd = (opdName: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus instansi '${opdName}' dari master data?`)) {
      setOpdList(opdList.filter(o => o !== opdName));
      showToast(`Instansi '${opdName}' berhasil dihapus.`);
    }
  };

  const handleAddPriority = (e: React.FormEvent) => {
    e.preventDefault();
    const val = newPriorityInput.trim();
    if (!val) {
      showToast('Harap masukkan skala prioritas baru.');
      return;
    }
    if (priorityList.some(p => p.toLowerCase() === val.toLowerCase())) {
      showToast(`Skala prioritas '${val}' sudah ada dalam master.`);
      return;
    }
    setPriorityList([val, ...priorityList]);
    setNewPriorityInput('');
    showToast(`Skala prioritas '${val}' berhasil ditambahkan.`);
  };

  const handleDeletePriority = (priorityName: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus '${priorityName}' dari master data?`)) {
      setPriorityList(priorityList.filter(p => p !== priorityName));
      showToast(`Skala prioritas '${priorityName}' berhasil dihapus.`);
    }
  };

  const isAccessAllowed = currentUserRole === 'SUPERUSER' || currentUserRole === 'TAPD';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-6 font-sans">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-indigo-900 border border-indigo-500 text-indigo-100 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs animate-bounce">
          <i className="fas fa-check-circle text-emerald-400 text-base"></i>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-indigo-950 text-indigo-300 border border-indigo-800 rounded text-[10px] font-mono font-bold uppercase">
              SUPERUSER &amp; TAPD Exclusive
            </span>
            <span className="text-xs text-slate-500 font-mono">SIP-ANGGARAN v1.3.0</span>
          </div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <i className="fas fa-database text-indigo-400"></i> Portal Kelola Master Data System
          </h1>
          <p className="text-xs text-slate-400">
            Pengaturan Master Skala Prioritas Anggaran dan Master Instansi Perangkat Daerah (OPD).
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Role Toggle for Demo */}
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-1 text-xs">
            <span className="text-[10px] text-slate-500 font-semibold px-1">Role:</span>
            <button
              type="button"
              onClick={() => setCurrentUserRole('SUPERUSER')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                currentUserRole === 'SUPERUSER' ? 'bg-purple-900 text-purple-200' : 'text-slate-400'
              }`}
            >
              SUPERUSER
            </button>
            <button
              type="button"
              onClick={() => setCurrentUserRole('TAPD')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                currentUserRole === 'TAPD' ? 'bg-indigo-900 text-indigo-200' : 'text-slate-400'
              }`}
            >
              TAPD
            </button>
            <button
              type="button"
              onClick={() => setCurrentUserRole('OPD')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                currentUserRole === 'OPD' ? 'bg-amber-900 text-amber-200' : 'text-slate-400'
              }`}
            >
              OPD
            </button>
          </div>

          <Link
            href="/"
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <i className="fas fa-arrow-left"></i> Kembali ke Dasbor
          </Link>
        </div>
      </div>

      {!isAccessAllowed ? (
        <div className="bg-slate-900/80 border border-rose-900/60 rounded-2xl p-12 text-center text-rose-300 space-y-3">
          <i className="fas fa-user-lock text-4xl text-rose-400 block"></i>
          <h2 className="text-base font-bold">Akses Ditolak</h2>
          <p className="text-xs text-slate-400">
            Halaman Kelola Master Data ini hanya diperuntukkan khusus bagi akun bertingkat peran <strong>SUPERUSER</strong> dan <strong>TAPD</strong>.
          </p>
        </div>
      ) : (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          {/* Tabs Navigation */}
          <div className="flex border-b border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('opd')}
              className={`px-5 py-2.5 font-bold transition-all border-b-2 flex items-center gap-2 ${
                activeTab === 'opd'
                  ? 'border-indigo-500 text-indigo-300 bg-indigo-950/40'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <i className="fas fa-building text-indigo-400"></i> Master Instansi OPD ({opdList.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('priority')}
              className={`px-5 py-2.5 font-bold transition-all border-b-2 flex items-center gap-2 ${
                activeTab === 'priority'
                  ? 'border-purple-500 text-purple-300 bg-purple-950/40'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <i className="fas fa-tags text-purple-400"></i> Master Skala Prioritas ({priorityList.length})
            </button>
          </div>

          {/* TAB 1: MASTER INSTANSI OPD */}
          {activeTab === 'opd' && (
            <div className="space-y-4">
              <form onSubmit={handleAddOpd} className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2">
                <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider block">
                  Tambah Instansi Perangkat Daerah (OPD) Baru
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newOpdInput}
                    onChange={(e) => setNewOpdInput(e.target.value)}
                    placeholder="Masukkan nama lengkap Perangkat Daerah baru..."
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow transition-all"
                  >
                    <i className="fas fa-plus"></i> Tambah OPD
                  </button>
                </div>
              </form>

              <div className="overflow-x-auto border border-slate-800 rounded-xl">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold uppercase text-[10px] tracking-wider">
                      <th className="p-3 w-12 text-center">No</th>
                      <th className="p-3">Nama Instansi Perangkat Daerah</th>
                      <th className="p-3 text-center w-28">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {opdList.map((opd, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-3 text-center font-mono text-slate-500">{idx + 1}</td>
                        <td className="p-3 font-medium text-slate-200">{opd}</td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteOpd(opd)}
                            className="px-2.5 py-1 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded transition-colors text-[11px]"
                            title="Hapus OPD"
                          >
                            <i className="fas fa-trash-alt"></i> Hapus
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: MASTER SKALA PRIORITAS */}
          {activeTab === 'priority' && (
            <div className="space-y-4">
              <form onSubmit={handleAddPriority} className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2">
                <span className="text-xs font-bold text-purple-300 uppercase tracking-wider block">
                  Tambah Skala Prioritas Anggaran Baru
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newPriorityInput}
                    onChange={(e) => setNewPriorityInput(e.target.value)}
                    placeholder="Contoh: Prioritas 4 (Stunting &amp; Kemiskinan Ekstrem)..."
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow transition-all"
                  >
                    <i className="fas fa-plus"></i> Tambah Prioritas
                  </button>
                </div>
              </form>

              <div className="overflow-x-auto border border-slate-800 rounded-xl">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold uppercase text-[10px] tracking-wider">
                      <th className="p-3 w-12 text-center">No</th>
                      <th className="p-3">Nama Skala Prioritas</th>
                      <th className="p-3 text-center w-28">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {priorityList.map((pri, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-3 text-center font-mono text-slate-500">{idx + 1}</td>
                        <td className="p-3 font-semibold text-purple-300">{pri}</td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeletePriority(pri)}
                            className="px-2.5 py-1 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded transition-colors text-[11px]"
                            title="Hapus Prioritas"
                          >
                            <i className="fas fa-trash-alt"></i> Hapus
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
