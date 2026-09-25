/**
 * ImportProposalModal Component - SIP-ANGGARAN v1.3.0
 * Batch Import Proposals from CSV/Excel Template with Preview Table & 49 OPD Validation
 */

import React, { useState } from 'react';
import { parseCsvContent } from '../../lib/csv-parser';
import { formatRp } from '../../lib/currency';

interface ImportProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  masterOpdList: string[]; // Master 49 OPDs
  onProcessImport: (validRows: any[]) => void;
}

export const ImportProposalModal: React.FC<ImportProposalModalProps> = ({
  isOpen,
  onClose,
  masterOpdList,
  onProcessImport
}) => {
  const [fileName, setFileName] = useState<string>('Belum ada berkas dipilih.');
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [fileSelected, setFileSelected] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    const headers = [
      'Perangkat Daerah',
      'Kategori Usulan',
      'Prioritas',
      'Nama Kegiatan',
      'Sub Kegiatan',
      'Pagu Awal',
      'Usulan Pagu',
      'Target Output',
      'Justifikasi'
    ];
    const sample1 = [
      'Dinas Kesehatan',
      'Penambahan Pagu OPD',
      'Prioritas 1 (Wajib)',
      'Pengadaan Alat Kesehatan Puskesmas',
      'Pengadaan USG & EKG 10 Unit',
      '500000000',
      '1500000000',
      '10 Unit Alkes Terdistribusi',
      'Kebutuhan mendesak peningkatan faskes tingkat pertama'
    ];
    const sample2 = [
      'Dinas Pendidikan Dan Kebudayaan',
      'Belanja Hibah',
      'Prioritas 2 (RPJMD)',
      'Rehabilitasi Ruang Kelas Sekolah Dasar',
      'Rehab 5 SD Terpencil',
      '1200000000',
      '800000000',
      '5 Sekolah Ter-rehabilitasi',
      'Meningkatkan keamanan gedung sekolah rusak sedang'
    ];

    const csvText = '\uFEFF' + [headers.join(';'), sample1.join(';'), sample2.join(';')].join('\r\n');
    const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'Template_Import_Usulan_Pagu.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (!file) return;

    setFileName(`${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
    setFileSelected(true);

    const reader = new FileReader();
    reader.onload = evt => {
      const text = evt.target?.result as string;
      if (text) {
        const rows = parseCsvContent(text);

        // Validate OPD names against Master 49 OPDs
        const validatedRows = rows.map(r => {
          const matchedOpd = masterOpdList.find(
            o => o.toLowerCase() === r.opd.toLowerCase() || o.toLowerCase().includes(r.opd.toLowerCase())
          );
          const finalOpd = matchedOpd || r.opd;
          const isOpdValid = masterOpdList.some(o => o.toLowerCase() === finalOpd.toLowerCase());

          return {
            ...r,
            opd: finalOpd,
            isValid: r.isValid && isOpdValid,
            error: !isOpdValid ? `OPD '${r.opd}' tidak cocok dengan 49 OPD Master` : r.error
          };
        });

        setParsedRows(validatedRows);
      }
    };
    reader.readAsText(file);
  };

  const validRows = parsedRows.filter(r => r.isValid);

  const handleSubmitImport = () => {
    if (validRows.length === 0) return;
    onProcessImport(validRows);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box p-0 max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl overflow-hidden shadow-2xl text-xs">
        <div className="p-5 border-b border-slate-700/60 flex items-center justify-between sticky top-0 bg-slate-800/95 backdrop-blur z-10">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <i className="fas fa-file-excel text-emerald-400"></i>
            <span>Import Data Usulan Massal dari Excel / CSV</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><i className="fas fa-times"></i></button>
        </div>

        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Step 1: Download Template */}
          <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-300">1. Unduh Templat Format Excel / CSV</span>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="px-3 py-1.5 bg-indigo-900/80 hover:bg-indigo-700 text-indigo-200 border border-indigo-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <i className="fas fa-download"></i> Unduh Format Templat (.csv)
              </button>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Format CSV menggunakan pemisah titik koma (<code>;</code>) dengan susunan kolom:{' '}
              <code className="text-indigo-300 font-mono">
                Perangkat Daerah; Kategori Usulan; Prioritas; Nama Kegiatan; Sub Kegiatan; Pagu Awal; Usulan Pagu; Target Output; Justifikasi
              </code>
            </p>
          </div>

          {/* Step 2: Upload File */}
          <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 space-y-2">
            <span className="font-bold text-slate-300 block">2. Unggah Berkas (.csv) Usulan</span>
            <div className="flex items-center gap-3">
              <input
                type="file"
                id="csv-file-input-modal"
                accept=".csv, .txt"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => document.getElementById('csv-file-input-modal')?.click()}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 rounded-lg font-semibold flex items-center gap-2 transition-all"
              >
                <i className="fas fa-folder-open text-amber-400"></i> Pilih Berkas CSV...
              </button>
              <span className="text-slate-400 italic text-xs">{fileName}</span>
            </div>
          </div>

          {/* Step 3: Validation Preview Table */}
          {fileSelected && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                  <i className="fas fa-eye text-indigo-400"></i> PRATINJAU DATA HASIL PARSING ({validRows.length} usulan valid dari {parsedRows.length} baris)
                </span>
                <span
                  className={`badge ${
                    validRows.length > 0
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : 'bg-rose-950 text-rose-300 border border-rose-800'
                  }`}
                >
                  {validRows.length > 0 ? 'Siap Diimport' : 'Data Tidak Valid'}
                </span>
              </div>

              <div className="table-scroll border border-slate-800 rounded-xl max-h-56 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/90 text-slate-400">
                      <th className="py-2 px-2 text-left">No</th>
                      <th className="py-2 px-2 text-left">OPD</th>
                      <th className="py-2 px-2 text-left">Kegiatan &amp; Sub Kegiatan</th>
                      <th className="py-2 px-2 text-right">Pagu Awal (P1)</th>
                      <th className="py-2 px-2 text-right">Usulan Pagu (P2)</th>
                      <th className="py-2 px-2 text-center">Status Validasi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRows.map((r, idx) => (
                      <tr key={idx} className={`border-b border-slate-800/60 ${r.isValid ? 'hover:bg-slate-900/50' : 'bg-rose-950/20'}`}>
                        <td className="py-2 px-2 text-slate-500">{idx + 1}</td>
                        <td className="py-2 px-2 font-medium text-slate-300">{r.opd}</td>
                        <td className="py-2 px-2 text-slate-200">
                          <p className="font-bold">{r.activityName}</p>
                          <p className="text-[10px] text-slate-500">{r.subActivityName}</p>
                        </td>
                        <td className="py-2 px-2 text-right text-slate-400 font-mono">{formatRp(r.initialBudget)}</td>
                        <td className="py-2 px-2 text-right text-violet-400 font-bold font-mono">{formatRp(r.proposedAddition)}</td>
                        <td className="py-2 px-2 text-center">
                          {r.isValid ? (
                            <span className="text-emerald-400 font-bold text-[10px]"><i className="fas fa-check-circle mr-1"></i>Valid</span>
                          ) : (
                            <span className="text-rose-400 font-bold text-[10px]" title={r.error}><i className="fas fa-exclamation-circle mr-1"></i>{r.error}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg">Batal</button>
            <button
              type="button"
              onClick={handleSubmitImport}
              disabled={validRows.length === 0}
              className={`px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-md transition-all flex items-center gap-1.5 ${
                validRows.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <i className="fas fa-file-import"></i> Eksekusi Import {validRows.length} Usulan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
