/**
 * DiscussionRoomModal Component - SIP-ANGGARAN v1.3.0
 * Handles Deliberation Room, TAPD Decision Panel, Comments Forum, & Audit Trail Log
 */

import React, { useState } from 'react';
import { BudgetProposal, UserAccount } from '../../types/database';
import { formatRp, terbilang } from '../../lib/currency';
import { AuditTrailTimeline } from './AuditTrailTimeline';

interface DiscussionRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposal: BudgetProposal | null;
  currentUser: UserAccount;
  onSaveDecision: (proposalId: string, newStatus: string, newP4: number) => void;
  onAddComment: (proposalId: string, text: string) => void;
}

export const DiscussionRoomModal: React.FC<DiscussionRoomModalProps> = ({
  isOpen,
  onClose,
  proposal,
  currentUser,
  onSaveDecision,
  onAddComment
}) => {
  if (!isOpen || !proposal) return null;

  const isTapdOrSuper = currentUser.role === 'TAPD' || currentUser.role === 'SUPERUSER';

  const [statusInput, setStatusInput] = useState<string>(proposal.status || 'Diajukan');
  const [p4Input, setP4Input] = useState<number | ''>(proposal.approvedBudget || 0);
  const [commentText, setCommentText] = useState<string>('');

  const p1 = proposal.initialBudget || 0;
  const p2 = proposal.proposedAddition || 0;
  const p3 = p1 + p2;
  const p4 = Number(p4Input) || 0;
  const pct = p2 > 0 ? Math.round((p4 / p2) * 100) : 0;

  const handleQuickDecision = (type: 'full' | 'half' | 'reject') => {
    if (!isTapdOrSuper) return;
    if (type === 'full') {
      setP4Input(p2);
      setStatusInput('Disetujui');
    } else if (type === 'half') {
      setP4Input(Math.round(p2 * 0.5));
      setStatusInput('Disetujui Parsial');
    } else if (type === 'reject') {
      setP4Input(0);
      setStatusInput('Ditolak');
    }
  };

  const handleDecisionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isTapdOrSuper) {
      alert('Akses ditolak. Hanya TAPD dan Superadmin yang berwenang menetapkan putusan.');
      return;
    }
    const valP4 = Number(p4Input) || 0;
    if (valP4 < 0) {
      alert('Nilai P4 tidak boleh negatif.');
      return;
    }
    if (valP4 > p2) {
      alert(`Pagu Kesepakatan P4 (${formatRp(valP4)}) tidak boleh melebihi Usulan Pagu P2 (${formatRp(p2)}).`);
      return;
    }

    onSaveDecision(proposal.id, statusInput, valP4);
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddComment(proposal.id, commentText.trim());
    setCommentText('');
  };

  const [isPreviewPdfOpen, setIsPreviewPdfOpen] = useState(false);

  return (
    <>
      <div className="modal-overlay">
        <div className="modal-box p-0 max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl overflow-hidden shadow-2xl text-xs">
          {/* Header */}
          <div className="p-5 border-b border-slate-700/60 flex items-center justify-between sticky top-0 bg-slate-800/95 backdrop-blur z-10">
            <div>
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <i className="fas fa-gavel text-amber-400"></i>
                Ruang Sidang &ndash; <span>{proposal.namaKegiatan || proposal.activityName}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                ID: {proposal.id} &bull; {proposal.opd}
              </p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white"><i className="fas fa-times text-sm"></i></button>
          </div>

          <div className="p-5 grid grid-cols-1 lg:grid-cols-5 gap-5 max-h-[82vh] overflow-y-auto">
            {/* Left Column: 4 Pilars & Details */}
            <div className="lg:col-span-2 space-y-3">
              <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800">
                <p className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">4 Pilar Anggaran</p>
                <div className="space-y-2">
                  <div className="pilar-card flex justify-between items-center bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                    <span className="text-[11px] text-cyan-300 font-semibold">Pagu Awal (P1)</span>
                    <span className="text-white font-bold text-xs">{formatRp(p1)}</span>
                  </div>
                  <div className="pilar-card flex justify-between items-center bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                    <span className="text-[11px] text-violet-300 font-semibold">Usulan Pagu (P2)</span>
                    <span className="text-white font-bold text-xs">{formatRp(p2)}</span>
                  </div>
                  <div className="pilar-card flex justify-between items-center bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                    <span className="text-[11px] text-blue-300 font-semibold">Total Pagu Diminta (P3)</span>
                    <span className="text-white font-bold text-xs">{formatRp(p3)}</span>
                  </div>
                  <div className="pilar-card flex justify-between items-center bg-slate-900/80 p-2 rounded-lg border border-emerald-800/80">
                    <span className="text-[11px] text-emerald-300 font-semibold">Pagu Kesepakatan (P4)</span>
                    <span className="text-emerald-400 font-bold text-xs">{formatRp(p4)}</span>
                  </div>
                </div>

                <div className="mt-3 bg-slate-950/80 rounded-lg p-2.5 text-center border border-slate-800">
                  <p className="text-[10px] text-slate-500">Persentase Persetujuan TAPD</p>
                  <p className="text-lg font-extrabold text-emerald-400">{pct}%</p>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 mt-1">
                    <div className="h-1.5 rounded-full bg-emerald-500 transition-all" style={{ width: `${Math.min(100, pct)}%` }}></div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-slate-500">OPD Pengusul</span><span className="text-white font-medium">{proposal.opd}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Kategori</span><span className="text-white font-medium">{proposal.category || proposal.kategoriUsulan}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Prioritas</span><span className="text-white font-medium">{proposal.priority || proposal.prioritas}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Status Saat Ini</span><span className="font-bold text-emerald-300">{proposal.status}</span></div>
              </div>

              <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800">
                <p className="text-xs font-semibold text-slate-400 mb-1">Target Output Fisik</p>
                <p className="text-xs text-slate-300 leading-relaxed">{proposal.targetOutput}</p>
              </div>

              <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800">
                <p className="text-xs font-semibold text-slate-400 mb-1">Latar Belakang &amp; Urgensi Justifikasi</p>
                <p className="text-xs text-slate-300 leading-relaxed">{proposal.urgencyJustification || proposal.justifikasi}</p>
              </div>

              {/* Attachment Preview Card */}
              <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                    <i className="fas fa-paperclip text-indigo-400"></i> Berkas Lampiran PDF
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsPreviewPdfOpen(true)}
                    className="px-2.5 py-1 bg-indigo-900/80 hover:bg-indigo-700 text-indigo-200 border border-indigo-700 rounded text-[11px] font-bold flex items-center gap-1 transition-all shadow"
                  >
                    <i className="fas fa-eye text-indigo-300"></i> Pratinjau PDF
                  </button>
                </div>
                <div className="flex items-center gap-2 bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-xs">
                  <i className="fas fa-file-pdf text-rose-400 text-xl flex-shrink-0"></i>
                  <div className="truncate flex-1">
                    <p className="font-bold text-slate-200 truncate">Dokumen_TOR_RAB_{proposal.id}.pdf</p>
                    <p className="text-[10px] text-slate-500 font-mono">2.4 MB &bull; Kerangka Acuan Kerja KAK &amp; RAB</p>
                  </div>
                </div>
              </div>
            </div>

          {/* Right Column: TAPD Form, Discussion, & Audit Trail */}
          <div className="lg:col-span-3 space-y-4">
            {/* TAPD Decision Panel */}
            <div className={`bg-slate-950/80 rounded-xl p-4 border ${isTapdOrSuper ? 'border-amber-800/60' : 'border-slate-800 opacity-70'}`}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                  <i className="fas fa-gavel"></i> Penetapan Putusan TAPD
                </p>
                {!isTapdOrSuper && (
                  <span className="text-[10px] text-slate-500 italic bg-slate-900 px-2 py-0.5 rounded border border-slate-800">Read-Only (Khusus TAPD/Super)</span>
                )}
              </div>

              {isTapdOrSuper && (
                <div className="flex gap-2 mb-3 flex-wrap">
                  <button type="button" onClick={() => handleQuickDecision('full')} className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg transition-all flex items-center gap-1">
                    <i className="fas fa-check-double"></i> Setuju 100%
                  </button>
                  <button type="button" onClick={() => handleQuickDecision('half')} className="px-3 py-1.5 bg-blue-700 hover:bg-blue-600 text-white text-xs font-semibold rounded-lg transition-all flex items-center gap-1">
                    <i className="fas fa-cut"></i> Rasionalisasi 50%
                  </button>
                  <button type="button" onClick={() => handleQuickDecision('reject')} className="px-3 py-1.5 bg-rose-800 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg transition-all flex items-center gap-1">
                    <i className="fas fa-times"></i> Tolak (Rp 0)
                  </button>
                </div>
              )}

              <form onSubmit={handleDecisionSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1 font-medium">Status Putusan</label>
                    <select
                      value={statusInput}
                      onChange={e => setStatusInput(e.target.value)}
                      disabled={!isTapdOrSuper}
                      className="form-input text-xs"
                    >
                      <option value="Diajukan">Diajukan</option>
                      <option value="Sedang Dibahas">Sedang Dibahas</option>
                      <option value="Disetujui">Disetujui</option>
                      <option value="Disetujui Parsial">Disetujui Parsial</option>
                      <option value="Perlu Revisi">Perlu Revisi</option>
                      <option value="Ditolak">Ditolak</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1 font-medium">Alokasi Disetujui P4 (Rp)</label>
                    <input
                      type="number"
                      min={0}
                      value={p4Input}
                      onChange={e => setP4Input(e.target.value === '' ? '' : Number(e.target.value))}
                      disabled={!isTapdOrSuper}
                      className="form-input text-xs font-bold text-emerald-300"
                    />
                    <div className="text-[10px] text-amber-300 mt-1 italic min-h-[14px]">
                      {p4Input && Number(p4Input) > 0 ? terbilang(p4Input) : ''}
                    </div>
                  </div>
                </div>

                {isTapdOrSuper && (
                  <button type="submit" className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2">
                    <i className="fas fa-save"></i> Simpan Putusan &amp; Rekam Jejak Audit
                  </button>
                )}
              </form>
            </div>

            {/* Deliberation Forum */}
            <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800">
              <p className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                <i className="fas fa-comments"></i> Forum Catatan Telaah &amp; Diskusi Sidang
              </p>
              <div className="space-y-2 max-h-48 overflow-y-auto mb-3 pr-1">
                {proposal.comments.length === 0 ? (
                  <p className="text-xs text-slate-600 italic text-center py-2">Belum ada catatan telaah.</p>
                ) : (
                  proposal.comments.map((cm, idx) => (
                    <div key={cm.id || idx} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-indigo-400">{cm.author}</span>
                        <span className="text-[10px] text-slate-500">{cm.time}</span>
                      </div>
                      <p className="text-xs text-slate-300">{cm.text}</p>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleCommentSubmit} className="flex gap-2">
                <textarea
                  rows={2}
                  placeholder="Tulis catatan telaah atau klarifikasi..."
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  className="form-input flex-1 resize-none text-xs"
                />
                <button type="submit" className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all text-xs flex items-center justify-center self-end">
                  <i className="fas fa-paper-plane"></i>
                </button>
              </form>
            </div>

            {/* Audit Trail Timeline */}
            <AuditTrailTimeline logs={proposal.history} />
          </div>
        </div>
      </div>
    </div>

      {/* PDF Document Preview Modal */}
      {isPreviewPdfOpen && (
        <div className="modal-overlay z-50">
          <div className="modal-box p-0 max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl overflow-hidden shadow-2xl text-xs">
            <div className="p-4 bg-slate-800 border-b border-slate-700 flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-rose-950 border border-rose-800 text-rose-400 flex items-center justify-center text-lg shadow">
                  <i className="fas fa-file-pdf"></i>
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Dokumen_TOR_RAB_{proposal.id}.pdf</h4>
                  <p className="text-[11px] text-slate-400">Berkas Lampiran Resmi Usulan {proposal.id} &bull; 2.4 MB PDF</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => alert('Mengunduh berkas lampiran PDF...')}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow"
                >
                  <i className="fas fa-download"></i> Unduh Berkas
                </button>
                <button
                  type="button"
                  onClick={() => setIsPreviewPdfOpen(false)}
                  className="text-slate-400 hover:text-white text-sm p-1.5"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            </div>

            <div className="p-6 bg-slate-950 min-h-[460px] flex items-center justify-center">
              <div className="w-full max-w-2xl bg-white text-slate-900 rounded-lg p-8 shadow-2xl space-y-5 font-serif text-xs leading-relaxed">
                <div className="border-b-2 border-slate-900 pb-3 text-center">
                  <h5 className="font-bold text-sm uppercase tracking-wide text-slate-900 m-0">PEMERINTAH DAERAH PROVINSI</h5>
                  <h6 className="font-semibold text-xs text-slate-700 uppercase my-0.5">{proposal.opd}</h6>
                  <p className="text-[10px] text-slate-500 m-0 font-sans">Berkas Lampiran Pendukung Rencana Kerja &amp; Kerangka Acuan Kerja (KAK / TOR)</p>
                </div>

                <div className="space-y-2 font-sans">
                  <p className="font-bold text-xs underline text-slate-900">RINCIAN KEBUTUHAN RINCIAN BELANJA (RAB) &amp; JUSTIFIKASI URGENSI</p>
                  <table className="w-full text-xs border-collapse border border-slate-300">
                    <thead>
                      <tr className="bg-slate-100 font-bold">
                        <th className="border border-slate-300 p-1.5 text-center">No</th>
                        <th className="border border-slate-300 p-1.5 text-left">Komponen Uraian Pekerjaan</th>
                        <th className="border border-slate-300 p-1.5 text-center">Volume</th>
                        <th className="border border-slate-300 p-1.5 text-right">Harga Satuan</th>
                        <th className="border border-slate-300 p-1.5 text-right">Total Anggaran</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-slate-300 p-1.5 text-center">1</td>
                        <td className="border border-slate-300 p-1.5 font-medium">{proposal.namaKegiatan || proposal.activityName}</td>
                        <td className="border border-slate-300 p-1.5 text-center">1 Paket</td>
                        <td className="border border-slate-300 p-1.5 text-right font-mono">{formatRp(proposal.proposedAddition || proposal.usulanTambah || 0)}</td>
                        <td className="border border-slate-300 p-1.5 text-right font-mono font-bold">{formatRp(proposal.proposedAddition || proposal.usulanTambah || 0)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="bg-slate-50 p-3 rounded border border-slate-200 text-[11px] font-sans">
                  <p className="font-bold text-slate-800 m-0">Justifikasi Urgensi Kebutuhan:</p>
                  <p className="text-slate-600 m-0 mt-1 italic">"{proposal.urgencyJustification || proposal.justifikasi}"</p>
                </div>

                <div className="flex justify-end pt-4 font-sans text-[11px]">
                  <div className="text-center w-56">
                    <p className="m-0 font-semibold">Pejabat Pembuat Komitmen (PPK)</p>
                    <div className="h-16"></div>
                    <p className="m-0 font-bold underline">H. Ahmad Fauzi, S.T., M.M.</p>
                    <p className="m-0 text-slate-500 text-[10px]">NIP. 19780412 200312 1 004</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
