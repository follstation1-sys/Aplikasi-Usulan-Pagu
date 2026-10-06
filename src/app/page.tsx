'use client';

/**
 * Main Application Dashboard - SIP-ANGGARAN v1.3.0
 * Path: src/app/page.tsx
 * Modular Next.js 14 App Router Dashboard integrating 4 Pillars, Deficit Banner, Meja Usulan Open Cards,
 * TAPD Discussion Room, Batch CSV Import/Export, and Printable Berita Acara.
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { BudgetProposal, UserRole } from '../types/database';
import { formatRp } from '../lib/currency';
import { exportProposalsToCsv } from '../lib/csv-parser';
import { DeficitAlertBanner } from '../components/alerts/DeficitAlertBanner';
import { ProposalSpikeBadge } from '../components/alerts/ProposalSpikeBadge';
import { NewProposalModal } from '../components/proposals/NewProposalModal';
import { ImportProposalModal } from '../components/proposals/ImportProposalModal';
import { DiscussionRoomModal } from '../components/deliberation/DiscussionRoomModal';
import { AuditTrailTimeline } from '../components/deliberation/AuditTrailTimeline';
import { BeritaAcaraPrintView } from '../components/minutes/BeritaAcaraPrintView';
import { MASTER_49_OPD } from './(dashboard)/admin/users/page';

// Initial Proposals (Bersih)
const initialProposals: BudgetProposal[] = [];

export default function DashboardPage() {
  // Session Active State
  const [currentUser, setCurrentUser] = useState({
    username: 'superuser',
    role: 'SUPERUSER' as UserRole,
    fullName: 'Administrator Utama (Superuser)',
    opdName: 'Badan Penanggulangan Bencana Daerah',
    supervisedOpds: ['Dinas Kesehatan', 'Dinas Pendidikan Dan Kebudayaan', 'Badan Penanggulangan Bencana Daerah']
  });

  const [activeCycle, setActiveCycle] = useState('Murni 2027');
  const [proposals, setProposals] = useState<BudgetProposal[]>(initialProposals);
  const [fiscalCapacity, setFiscalCapacity] = useState(85000000000); // Plafon Kas Rp 85.000.000.000

  // Filter Toolbar States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOpd, setFilterOpd] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Modals visibility
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isDiscussionModalOpen, setIsDiscussionModalOpen] = useState(false);
  const [isBeritaAcaraOpen, setIsBeritaAcaraOpen] = useState(false);
  const [selectedProposalForDiscussion, setSelectedProposalForDiscussion] = useState<BudgetProposal | null>(null);

  // Filtered Proposals based on RBAC & Toolbar
  const visibleProposalsByRole = proposals.filter(p => {
    if (currentUser.role === 'OPD') {
      return p.opd.toLowerCase() === currentUser.opdName.toLowerCase();
    }
    if (currentUser.role === 'BAPPEDA') {
      return currentUser.supervisedOpds.some(so => so.toLowerCase() === p.opd.toLowerCase());
    }
    return true; // TAPD and SUPERUSER see all
  });

  const filteredProposals = visibleProposalsByRole.filter(p => {
    const matchesSearch = p.activityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.opd.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesOpd = !filterOpd || p.opd === filterOpd;
    const matchesCat = !filterCategory || p.category === filterCategory;
    const matchesStatus = !filterStatus || p.status === filterStatus;
    return matchesSearch && matchesOpd && matchesCat && matchesStatus;
  });

  // Calculate 4 Pillars Totals
  const totP1 = visibleProposalsByRole.reduce((acc, p) => acc + (p.initialBudget || 0), 0);
  const totP2 = visibleProposalsByRole.reduce((acc, p) => acc + (p.proposedAddition || 0), 0);
  const totP3 = totP1 + totP2;
  const totP4 = visibleProposalsByRole.reduce((acc, p) => acc + (p.approvedBudget || 0), 0);
  const remainingKas = fiscalCapacity - totP4;

  // Handlers
  const handleSaveNewProposal = (newProp: BudgetProposal) => {
    setProposals([newProp, ...proposals]);
  };

  const handleProcessImport = (validRows: any[]) => {
    const importedProposals: BudgetProposal[] = validRows.map((r, idx) => ({
      id: `USL-2027-IMP-${Date.now().toString().slice(-4)}-${idx + 1}`,
      opd: r.opd,
      category: r.category,
      priority: r.priority,
      activityName: r.activityName,
      subActivityName: r.subActivityName,
      initialBudget: r.initialBudget,
      proposedAddition: r.proposedAddition,
      approvedBudget: 0,
      status: 'Diajukan',
      targetOutput: r.targetOutput,
      urgencyJustification: r.justification,
      tanggalInput: new Date().toISOString().slice(0, 10),
      auditLogs: [
        { timestamp: new Date().toLocaleString('id-ID'), actorName: currentUser.fullName, actorRole: currentUser.role, actionText: 'Batch import dari berkas CSV.' }
      ]
    }));
    setProposals([...importedProposals, ...proposals]);
  };

  const handleDeleteProposal = (proposalId: string) => {
    const target = proposals.find(p => p.id === proposalId);
    if (!target) return;
    if (confirm(`Apakah Anda yakin ingin menghapus usulan ${proposalId} - "${target.activityName || target.namaKegiatan}" (${target.opd})?`)) {
      setProposals(proposals.filter(p => p.id !== proposalId));
      deleteBudgetProposalFromDb(proposalId).catch(err => console.warn('[SUPABASE] Notice on delete:', err));
    }
  };

  const handleOpenDiscussionRoom = (proposal: BudgetProposal) => {
    setSelectedProposalForDiscussion(proposal);
    setIsDiscussionModalOpen(true);
  };

  const handleSaveTapdDecision = (proposalId: string, status: any, approvedBudget: number, commentText: string) => {
    setProposals(proposals.map(p => {
      if (p.id === proposalId) {
        const newLog = {
          timestamp: new Date().toLocaleString('id-ID'),
          actorName: currentUser.fullName,
          actorRole: currentUser.role,
          actionText: `TAPD menetapkan status '${status}' dengan alokasi P4: ${formatRp(approvedBudget)}. ${commentText ? `Catatan: "${commentText}"` : ''}`
        };
        return {
          ...p,
          status,
          approvedBudget,
          auditLogs: [...(p.auditLogs || []), newLog]
        };
      }
      return p;
    }));
  };

  if (isBeritaAcaraOpen) {
    return (
      <BeritaAcaraPrintView
        proposals={filteredProposals}
        cycleLabel={activeCycle}
        totalFiscalCapacity={fiscalCapacity}
        onClose={() => setIsBeritaAcaraOpen(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-12">
      {/* Fiscal Deficit Warning Banner */}
      <DeficitAlertBanner remainingKasCapacity={remainingKas} />

      {/* Main Header Nav */}
      <header className="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-30 backdrop-blur-md px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-700 flex items-center justify-center shadow-lg shadow-indigo-900/40 border border-indigo-400/30">
              <i className="fas fa-layer-group text-lg text-white"></i>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold text-white tracking-tight">
                  SIP<span className="text-indigo-400">-ANGGARAN</span>
                </h1>
                <span className="text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800 px-2 py-0.5 rounded font-mono">
                  v1.3.0 App Router
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Pembahasan Usulan Pagu, Hibah &amp; Bansos Daerah</p>
            </div>
          </div>

          {/* Cycle & Quick Role Switching Control Bar */}
          <div className="flex items-center flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5">
              <i className="fas fa-calendar-alt text-amber-400 text-xs"></i>
              <span className="text-slate-400 font-medium">Siklus:</span>
              <select
                value={activeCycle}
                onChange={(e) => setActiveCycle(e.target.value)}
                className="bg-transparent text-indigo-300 font-bold focus:outline-none cursor-pointer"
              >
                <option value="Murni 2027">Murni 2027</option>
                <option value="Perubahan 2027">Perubahan 2027</option>
                <option value="Murni 2028">Murni 2028</option>
              </select>
            </div>

            {(currentUser.role === 'SUPERUSER' || currentUser.role === 'TAPD') && (
              <Link
                href="/admin/master"
                className="px-3 py-1.5 bg-indigo-950 hover:bg-indigo-900 text-indigo-200 border border-indigo-700/80 rounded-lg font-semibold flex items-center gap-1.5 transition-all"
              >
                <i className="fas fa-database text-indigo-400"></i> Kelola Master Data
              </Link>
            )}

            {currentUser.role === 'SUPERUSER' && (
              <Link
                href="/admin/users"
                className="px-3 py-1.5 bg-purple-950 hover:bg-purple-900 text-purple-200 border border-purple-700/80 rounded-lg font-semibold flex items-center gap-1.5 transition-all"
              >
                <i className="fas fa-users-cog"></i> Kelola User
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 mt-6 space-y-6">

        {/* User Identity Banner */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xl">
              {currentUser.role === 'SUPERUSER' ? '⚡' : currentUser.role === 'TAPD' ? '👑' : currentUser.role === 'BAPPEDA' ? '🏛' : '🏢'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white">{currentUser.fullName}</h2>
                <span className="bg-indigo-950 text-indigo-300 border border-indigo-800 text-[10px] px-2 py-0.5 rounded font-mono font-bold">
                  {currentUser.role}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {currentUser.role === 'OPD'
                  ? `Instansi: ${currentUser.opdName}`
                  : currentUser.role === 'BAPPEDA'
                  ? `Pengampuan: ${currentUser.supervisedOpds.length} Perangkat Daerah`
                  : 'Akses Penuh Seluruh Perangkat Daerah'}
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center flex-wrap gap-2">
            {(currentUser.role === 'OPD' || currentUser.role === 'SUPERUSER') && (
              <button
                type="button"
                onClick={() => setIsNewModalOpen(true)}
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all"
              >
                <i className="fas fa-plus"></i> Usulan Baru
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <i className="fas fa-file-excel"></i> Import CSV
            </button>

            <button
              type="button"
              onClick={() => exportProposalsToCsv(filteredProposals, activeCycle)}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <i className="fas fa-download"></i> Ekspor Excel
            </button>

            <button
              type="button"
              onClick={() => setIsBeritaAcaraOpen(true)}
              className="px-3.5 py-2 bg-indigo-950 hover:bg-indigo-900 text-indigo-200 border border-indigo-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <i className="fas fa-print"></i> Berita Acara
            </button>
          </div>
        </div>

        {/* 4 PILARS SUMMARY METRICS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-1 shadow-lg">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">P1 - Pagu Awal</span>
            <div className="text-base font-extrabold font-mono text-slate-100">{formatRp(totP1)}</div>
            <p className="text-[10px] text-slate-500">Pagu indikatif murni awal</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-1 shadow-lg">
            <span className="text-[11px] font-semibold text-purple-400 uppercase tracking-wider block">P2 - Usulan Pagu</span>
            <div className="text-base font-extrabold font-mono text-purple-300">{formatRp(totP2)}</div>
            <p className="text-[10px] text-slate-500">Total penambahan diminta OPD</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-1 shadow-lg">
            <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider block">P3 - Total Pagu Diminta</span>
            <div className="text-base font-extrabold font-mono text-blue-300">{formatRp(totP3)}</div>
            <p className="text-[10px] text-slate-500">Akumulasi P1 + P2</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-1 shadow-lg">
            <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block">P4 - Pagu Kesepakatan TAPD</span>
            <div className="text-base font-extrabold font-mono text-emerald-300">{formatRp(totP4)}</div>
            <p className="text-[10px] text-slate-500">Alokasi yang disetujui TAPD</p>
          </div>
        </div>

        {/* SEARCH & FILTER TOOLBAR */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="relative">
              <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"></i>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari kegiatan, OPD, atau ID..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <select
              value={filterOpd}
              onChange={(e) => setFilterOpd(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="">Semua Perangkat Daerah ({MASTER_49_OPD.length})</option>
              {MASTER_49_OPD.map((opd, i) => (
                <option key={i} value={opd}>
                  {opd}
                </option>
              ))}
            </select>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="">Semua Kategori Usulan</option>
              <option value="Penambahan Pagu OPD">Penambahan Pagu OPD</option>
              <option value="Belanja Hibah">Belanja Hibah</option>
              <option value="Bantuan Sosial">Bantuan Sosial</option>
              <option value="Mandat Perundang-Undangan">Mandat Perundang-Undangan</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="">Semua Status Putusan</option>
              <option value="Diajukan">Diajukan</option>
              <option value="Sedang Dibahas">Sedang Dibahas</option>
              <option value="Disetujui">Disetujui</option>
              <option value="Disetujui Parsial">Disetujui Parsial</option>
              <option value="Perlu Revisi">Perlu Revisi</option>
              <option value="Ditolak">Ditolak</option>
            </select>
          </div>
        </div>

        {/* MEJA USULAN OPEN CARDS GRID */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <i className="fas fa-folder-open text-indigo-400"></i> Meja Usulan Pagu Terbuka ({filteredProposals.length})
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              Isolasi Peran Active: <strong className="text-indigo-300">{currentUser.role}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredProposals.map((p) => {
              const p1 = p.initialBudget || 0;
              const p2 = p.proposedAddition || 0;
              const p3 = p1 + p2;
              const p4 = p.approvedBudget || 0;

              return (
                <div key={p.id} className="bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-5 space-y-4 shadow-xl transition-all relative overflow-hidden group">
                  {/* Top Bar Card */}
                  <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-indigo-400">{p.id}</span>
                        <span className="bg-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded border border-slate-700 font-medium">
                          {p.category}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                        {p.activityName}
                      </h4>
                      <p className="text-xs text-slate-400 font-medium">{p.opd}</p>
                    </div>

                    <span
                      className={`badge text-[10px] px-2.5 py-1 rounded-full font-bold uppercase ${
                        p.status === 'Disetujui'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : p.status === 'Disetujui Parsial'
                          ? 'bg-sky-950 text-sky-300 border border-sky-800'
                          : p.status === 'Ditolak'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : p.status === 'Perlu Revisi'
                          ? 'bg-purple-950 text-purple-300 border border-purple-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>

                  {/* Sub Activity & Urgency Justification */}
                  <div className="text-xs space-y-1 bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                    <p className="text-slate-300"><strong className="text-slate-500">Sub Kegiatan:</strong> {p.subActivityName || '-'}</p>
                    <p className="text-slate-400 text-[11px] leading-relaxed italic"><strong className="text-slate-500">Justifikasi:</strong> "{p.urgencyJustification}"</p>
                  </div>

                  {/* 4 Pillars Nominal Matrix Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-950/90 p-3 rounded-xl border border-slate-800/80">
                    <div>
                      <span className="text-[10px] text-slate-500 font-sans block">Pagu Awal (P1)</span>
                      <span className="text-slate-300 font-bold">{formatRp(p1)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-purple-400 font-sans block">Usulan Pagu (P2)</span>
                      <span className="text-purple-300 font-bold">{formatRp(p2)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-blue-400 font-sans block">Total Diminta (P3)</span>
                      <span className="text-blue-300 font-bold">{formatRp(p3)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-400 font-sans block">Kesepakatan TAPD (P4)</span>
                      <span className="text-emerald-300 font-extrabold">{formatRp(p4)}</span>
                    </div>
                  </div>

                  {/* Audit Logs Accordion / Timeline */}
                  {p.auditLogs && p.auditLogs.length > 0 && (
                    <div className="pt-1">
                      <AuditTrailTimeline logs={p.auditLogs} />
                    </div>
                  )}

                  {/* Footer Card Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs">
                    <span className="text-[10px] text-slate-500">{p.tanggalInput}</span>
                    
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenDiscussionRoom(p)}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg flex items-center gap-1.5 transition-all text-xs shadow"
                      >
                        <i className="fas fa-gavel text-amber-400"></i> Buka Sidang TAPD
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteProposal(p.id)}
                        className="px-2.5 py-1.5 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800/80 font-bold rounded-lg flex items-center gap-1 transition-all text-xs shadow"
                        title="Hapus Usulan"
                      >
                        <i className="fas fa-trash-alt"></i> Hapus
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* MODALS */}
      <NewProposalModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        userRole={currentUser.role}
        userOpd={currentUser.opdName}
        masterOpdList={MASTER_49_OPD}
        onSaveProposal={handleSaveNewProposal}
      />

      <ImportProposalModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        masterOpdList={MASTER_49_OPD}
        onProcessImport={handleProcessImport}
      />

      <DiscussionRoomModal
        isOpen={isDiscussionModalOpen}
        onClose={() => setIsDiscussionModalOpen(false)}
        proposal={selectedProposalForDiscussion}
        userRole={currentUser.role}
        userName={currentUser.fullName}
        remainingKasCapacity={remainingKas}
        onSaveDecision={handleSaveTapdDecision}
      />
    </div>
  );
}
