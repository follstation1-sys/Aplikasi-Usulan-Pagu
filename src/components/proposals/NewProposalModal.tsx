/**
 * NewProposalModal Component - SIP-ANGGARAN v1.3.0
 * Handles Proposal Creation for OPD & BAPPEDA Supervised Orgs
 */

import React, { useState, useEffect } from 'react';
import { terbilang, formatRp } from '../../lib/currency';
import { UserAccount } from '../../types/database';

interface NewProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount;
  opdList: string[]; // Master 49 OPDs
  onSave: (proposalData: any) => void;
}

export const NewProposalModal: React.FC<NewProposalModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  opdList,
  onSave
}) => {
  const [selectedOpd, setSelectedOpd] = useState<string>('');
  const [category, setCategory] = useState<string>('Penambahan Pagu OPD');
  const [priority, setPriority] = useState<string>('Prioritas 1 (Wajib)');
  const [programName, setProgramName] = useState<string>('');
  const [activityName, setActivityName] = useState<string>('');
  const [subActivityName, setSubActivityName] = useState<string>('');
  const [paguAwal, setPaguAwal] = useState<number | ''>('');
  const [usulanPagu, setUsulanPagu] = useState<number | ''>('');
  const [targetOutput, setTargetOutput] = useState<string>('');
  const [justification, setJustification] = useState<string>('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  // Available OPDs depending on user role
  const availableOpds = currentUser.role === 'OPD'
    ? [currentUser.opd || '']
    : currentUser.role === 'BAPPEDA'
    ? (currentUser.opdList && currentUser.opdList.length > 0 ? currentUser.opdList : opdList)
    : opdList;

  useEffect(() => {
    if (availableOpds.length > 0) {
      setSelectedOpd(availableOpds[0]);
    }
  }, [currentUser]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityName.trim()) {
      alert('Nama kegiatan wajib diisi.');
      return;
    }
    if (!usulanPagu || Number(usulanPagu) <= 0) {
      alert('Usulan Pagu (P2) harus lebih dari 0.');
      return;
    }
    if (!targetOutput.trim()) {
      alert('Target output fisik wajib diisi.');
      return;
    }
    if (!justification.trim()) {
      alert('Justifikasi kebutuhan wajib diisi.');
      return;
    }

    onSave({
      opd: selectedOpd,
      kategoriUsulan: category,
      prioritas: priority,
      namaKegiatan: activityName.trim(),
      subKegiatan: subActivityName.trim(),
      paguAwal: Number(paguAwal) || 0,
      usulanTambah: Number(usulanPagu),
      targetOutput: targetOutput.trim(),
      justifikasi: justification.trim(),
      lampiran: pdfFile ? { name: pdfFile.name, size: `${(pdfFile.size / (1024 * 1024)).toFixed(1)} MB` } : null
    });
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box p-0 max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl overflow-hidden shadow-2xl text-xs">
        <div className="p-5 border-b border-slate-700/60 flex items-center justify-between sticky top-0 bg-slate-800/95 backdrop-blur">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <i className="fas fa-plus-circle text-indigo-400"></i>
            <span>Ajukan Usulan Pagu Baru</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><i class="fas fa-times"></i></button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* OPD Selector */}
          <div>
            <label className="block text-slate-400 mb-1 font-semibold">Perangkat Daerah (OPD) *</label>
            {currentUser.role === 'OPD' ? (
              <input
                type="text"
                value={selectedOpd}
                disabled
                className="form-input opacity-70 cursor-not-allowed bg-slate-950/60"
              />
            ) : (
              <select
                value={selectedOpd}
                onChange={e => setSelectedOpd(e.target.value)}
                className="form-input"
              >
                {availableOpds.map(o => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Kategori Belanja *</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className="form-input">
                <option value="Penambahan Pagu OPD">Penambahan Pagu OPD</option>
                <option value="Belanja Hibah">Belanja Hibah</option>
                <option value="Bantuan Sosial (Bansos)">Bantuan Sosial (Bansos)</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Skala Prioritas *</label>
              <select value={priority} onChange={e => setPriority(e.target.value)} className="form-input">
                <option value="Prioritas 1 (Wajib)">Prioritas 1 (Wajib / SPM)</option>
                <option value="Prioritas 2 (RPJMD)">Prioritas 2 (Janji KDH / RPJMD)</option>
                <option value="Prioritas 3 (Reguler)">Prioritas 3 (Reguler / Rutin)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-semibold">Nama Program / Kegiatan *</label>
            <input
              type="text"
              placeholder="Contoh: Pengadaan Alat Kesehatan Puskesmas"
              value={activityName}
              onChange={e => setActivityName(e.target.value)}
              className="form-input"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-semibold">Rincian Sub Kegiatan</label>
            <input
              type="text"
              placeholder="Contoh: Pengadaan 10 Unit USG 4D dan EKG Digital"
              value={subActivityName}
              onChange={e => setSubActivityName(e.target.value)}
              className="form-input"
            />
          </div>

          {/* Budget 4 Pilars Input */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <div>
              <label className="block text-cyan-400 mb-1 font-semibold">P1 &ndash; Pagu Awal (Rp)</label>
              <input
                type="number"
                placeholder="0"
                value={paguAwal}
                onChange={e => setPaguAwal(e.target.value === '' ? '' : Number(e.target.value))}
                className="form-input"
              />
              <span className="text-[10px] text-slate-500 block mt-1">Pagu DPA berjalan sebelum usulan</span>
            </div>
            <div>
              <label className="block text-violet-400 mb-1 font-semibold">P2 &ndash; Usulan Pagu (Rp) *</label>
              <input
                type="number"
                placeholder="0"
                value={usulanPagu}
                onChange={e => setUsulanPagu(e.target.value === '' ? '' : Number(e.target.value))}
                className="form-input font-bold text-violet-300"
              />
              {/* Dynamic Terbilang Text Reader */}
              <div className="text-[10px] text-amber-300 italic mt-1 font-medium min-h-[14px]">
                {usulanPagu && Number(usulanPagu) > 0 ? terbilang(usulanPagu) : ''}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-semibold">Target Capaian Output Fisik *</label>
            <textarea
              rows={2}
              placeholder="Contoh: Terdistribusinya 10 unit USG digital di 10 Puskesmas Rawat Inap"
              value={targetOutput}
              onChange={e => setTargetOutput(e.target.value)}
              className="form-input resize-none"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-semibold">Latar Belakang &amp; Urgensi Justifikasi *</label>
            <textarea
              rows={3}
              placeholder="Jelaskan dasar kebutuhan mendesak dan relevansi terhadap IKU RPJMD..."
              value={justification}
              onChange={e => setJustification(e.target.value)}
              className="form-input resize-none"
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-slate-400 mb-1 font-semibold">Lampiran Berkas Proposal PDF</label>
            <input
              type="file"
              accept=".pdf"
              onChange={e => setPdfFile(e.target.files ? e.target.files[0] : null)}
              className="form-input text-xs"
            />
            {pdfFile && (
              <p class="text-[11px] text-emerald-400 mt-1">
                <i className="fas fa-file-pdf mr-1"></i> {pdfFile.name} ({(pdfFile.size / (1024 * 1024)).toFixed(1)} MB)
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg">Batal</button>
            <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow-md">
              <i className="fas fa-paper-plane mr-1.5"></i> Kirim Usulan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
