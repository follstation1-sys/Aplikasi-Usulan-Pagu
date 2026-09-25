/**
 * BeritaAcaraPrintView Component - SIP-ANGGARAN v1.3.0
 * Official TAPD Minutes of Deliberation Document Print & Preview Component
 */

import React from 'react';
import { BudgetProposal } from '../../types/database';
import { formatRp } from '../../lib/currency';

interface BeritaAcaraPrintViewProps {
  proposals: BudgetProposal[];
  cycleLabel?: string;
  daerahName?: string;
  bappedaHeadName?: string;
  sekdaName?: string;
  sessionDate?: string;
  sessionLocation?: string;
  totalFiscalCapacity?: number;
  onClose?: () => void;
  onPrint?: () => void;
}

export const BeritaAcaraPrintView: React.FC<BeritaAcaraPrintViewProps> = ({
  proposals,
  cycleLabel = 'Rancangan Awal RKPD 2027',
  daerahName = 'Pemerintah Provinsi Nusa Tenggara Barat',
  bappedaHeadName = 'Dr. H. Iswandi, M.Si.',
  sekdaName = 'Drs. H. Lalu Gita Ariadi, M.Si.',
  sessionDate = new Date().toISOString().slice(0, 10),
  sessionLocation = 'Ruang Rapat Utama Bappeda Provinsi',
  totalFiscalCapacity = 85000000000,
  onClose,
  onPrint
}) => {
  const totP1 = proposals.reduce((acc, p) => acc + (p.initialBudget || 0), 0);
  const totP2 = proposals.reduce((acc, p) => acc + (p.proposedAddition || 0), 0);
  const totP4 = proposals.reduce((acc, p) => acc + (p.approvedBudget || 0), 0);
  const remainingKas = totalFiscalCapacity - totP4;

  const formattedDate = new Date(sessionDate).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const handleTriggerPrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  return (
    <div className="bg-slate-900/90 min-h-screen p-4 sm:p-8 flex justify-center text-slate-900">
      {/* Printable Wrapper Document Container */}
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-2xl overflow-hidden print-area-container">
        
        {/* Screen Controls Header (Hidden in Print) */}
        <div className="bg-slate-800 text-white p-4 border-b border-slate-700 flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <i className="fas fa-file-signature text-emerald-400 text-lg"></i>
            <span className="font-bold text-sm">Dokumen Resmi Berita Acara Sidang TAPD</span>
          </div>
          <div className="flex items-center gap-2">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-xs transition-all"
              >
                Tutup Pratinjau
              </button>
            )}
            <button
              type="button"
              onClick={handleTriggerPrint}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded text-xs flex items-center gap-1.5 transition-all shadow-md"
            >
              <i className="fas fa-print"></i> Cetak Berita Acara (PDF)
            </button>
          </div>
        </div>

        {/* Official Document Sheet */}
        <div className="p-8 sm:p-12 print-content font-serif text-slate-900 leading-relaxed bg-white">
          
          {/* Header Kop Surat Official */}
          <div className="border-b-4 border-double border-indigo-950 pb-4 mb-6 text-center">
            <h1 className="text-base font-bold tracking-widest text-indigo-950 uppercase m-0">
              {daerahName}
            </h1>
            <h2 className="text-sm font-semibold tracking-wider text-slate-800 uppercase my-0.5">
              TIM ANGGARAN PEMERINTAH DAERAH (TAPD)
            </h2>
            <p className="text-xs text-slate-600 m-0 font-sans">
              Badan Perencanaan Pembangunan Daerah &bull; Badan Pengelola Keuangan dan Aset Daerah
            </p>
          </div>

          {/* Title & Document Reference */}
          <div className="text-center mb-6">
            <h3 className="text-lg font-bold text-slate-900 underline uppercase tracking-wide m-0">
              BERITA ACARA KESEPAKATAN HARGA &amp; PAGU INDIKATIF
            </h3>
            <p className="text-xs font-bold text-indigo-900 mt-1 mb-0 font-sans">
              Nomor: 000.8.1 / TAPD / 2026
            </p>
            <p className="text-xs text-slate-700 mt-0.5 mb-0">
              Hasil Pembahasan Alokasi Usulan Pagu Indikatif Perangkat Daerah Tahun Anggaran: <strong>{cycleLabel}</strong>
            </p>
          </div>

          {/* Session Metadata Table */}
          <table className="w-full text-xs font-sans mb-6 border-collapse">
            <tbody>
              <tr>
                <td className="w-32 py-1 text-slate-600">Hari / Tanggal Sidang</td>
                <td className="w-4 py-1 text-center">:</td>
                <td className="py-1 font-semibold text-slate-900">{formattedDate}</td>
                <td className="w-28 py-1 text-slate-600">Tempat Sidang</td>
                <td className="w-4 py-1 text-center">:</td>
                <td className="py-1 text-slate-900">{sessionLocation}</td>
              </tr>
              <tr>
                <td className="py-1 text-slate-600">Total Usulan Dibahas</td>
                <td className="py-1 text-center">:</td>
                <td className="py-1 font-semibold text-slate-900">{proposals.length} Berkas Usulan</td>
                <td className="py-1 text-slate-600">Siklus Anggaran</td>
                <td className="py-1 text-center">:</td>
                <td className="py-1 font-semibold text-indigo-900">{cycleLabel}</td>
              </tr>
            </tbody>
          </table>

          {/* Section I: Rekapitulasi Tabel Pagu */}
          <div className="mb-6 font-sans">
            <h4 className="text-xs font-bold text-slate-900 uppercase mb-2 border-b border-slate-300 pb-1">
              I. REKAPITULASI HASIL PEMBAHASAN BELANJA DAERAH
            </h4>
            
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-indigo-950 text-white font-bold text-[11px]">
                    <th className="border border-slate-400 p-1.5 text-center w-8">No</th>
                    <th className="border border-slate-400 p-1.5 text-left">Perangkat Daerah (OPD)</th>
                    <th className="border border-slate-400 p-1.5 text-left">Nama Program / Kegiatan</th>
                    <th className="border border-slate-400 p-1.5 text-right w-28">Pagu Awal (P1)</th>
                    <th className="border border-slate-400 p-1.5 text-right w-28">Usulan Pagu (P2)</th>
                    <th className="border border-slate-400 p-1.5 text-right w-32">Pagu Kesepakatan (P4)</th>
                    <th className="border border-slate-400 p-1.5 text-center w-24">Status Putusan</th>
                  </tr>
                </thead>
                <tbody>
                  {proposals.map((p, idx) => (
                    <tr key={p.id} className="border-b border-slate-300 text-[11px]">
                      <td className="border border-slate-300 p-1.5 text-center text-slate-600">{idx + 1}</td>
                      <td className="border border-slate-300 p-1.5 font-medium text-slate-900">{p.opd}</td>
                      <td className="border border-slate-300 p-1.5 text-slate-800">{p.activityName || p.namaKegiatan}</td>
                      <td className="border border-slate-300 p-1.5 text-right font-mono text-slate-700">{formatRp(p.initialBudget || p.paguAwal || 0)}</td>
                      <td className="border border-slate-300 p-1.5 text-right font-mono text-purple-900 font-semibold">{formatRp(p.proposedAddition || p.usulanTambah || 0)}</td>
                      <td className="border border-slate-300 p-1.5 text-right font-mono text-emerald-950 font-bold">{formatRp(p.approvedBudget || p.setujuTapd || 0)}</td>
                      <td className="border border-slate-300 p-1.5 text-center font-bold text-[10px] uppercase">{p.status}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 font-bold text-xs border-t-2 border-slate-900">
                    <td colSpan={3} className="border border-slate-400 p-2 text-right">TOTAL KESEPAKATAN BELANJA:</td>
                    <td className="border border-slate-400 p-2 text-right font-mono">{formatRp(totP1)}</td>
                    <td className="border border-slate-400 p-2 text-right font-mono text-purple-900">{formatRp(totP2)}</td>
                    <td className="border border-slate-400 p-2 text-right font-mono text-emerald-950">{formatRp(totP4)}</td>
                    <td className="border border-slate-400 p-2"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Section II: Summary Fiscal Capacity & Balance */}
          <div className="mb-6 font-sans bg-slate-50 border border-slate-300 rounded-lg p-4">
            <h4 className="text-xs font-bold text-slate-900 uppercase mb-2 border-b border-slate-300 pb-1">
              II. RINGKASAN KAPASITAS FISKAL KAS &amp; KESEIMBANGAN ANGGARAN
            </h4>
            <table className="w-full text-xs">
              <tbody>
                <tr className="border-b border-slate-200">
                  <td className="py-1.5 text-slate-700">Total Plafon Kapasitas Fiskal Kas Tersedia</td>
                  <td className="py-1.5 text-right font-bold font-mono text-slate-900">{formatRp(totalFiscalCapacity)}</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="py-1.5 text-slate-700">Total Penetapan Kesepakatan Pagu TAPD (P4)</td>
                  <td className="py-1.5 text-right font-bold font-mono text-emerald-950">{formatRp(totP4)}</td>
                </tr>
                <tr className="font-bold">
                  <td className="py-2 text-slate-900">Sisa Kapasitas Kas (Keseimbangan Fiskal)</td>
                  <td className={`py-2 text-right font-mono text-sm ${remainingKas >= 0 ? 'text-emerald-800' : 'text-rose-700'}`}>
                    {formatRp(remainingKas)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section III: Closing Statement */}
          <p className="text-xs text-slate-800 mb-8 text-justify leading-relaxed">
            Demikian Berita Acara Kesepakatan Pagu Indikatif ini disusun dan ditandatangani secara sah oleh Tim Anggaran Pemerintah Daerah (TAPD) untuk dijadikan rujukan utama dalam penyusunan Rencana Kerja Pemerintah Daerah (RKPD) dan PPAS Tahun Anggaran <strong>{cycleLabel}</strong>.
          </p>

          {/* Section IV: Signatures Block */}
          <div className="font-sans grid grid-cols-2 gap-8 text-center text-xs mt-12">
            <div>
              <p className="font-semibold text-slate-900 m-0">Kepala Badan Perencanaan Pembangunan Daerah</p>
              <p className="text-[11px] text-slate-600 mt-0.5 mb-0">{daerahName}</p>
              <div className="h-20"></div>
              <p className="font-bold text-slate-900 underline m-0">{bappedaHeadName}</p>
              <p className="text-[10px] text-slate-600 mt-0.5 mb-0">NIP. 19710512 199603 1 002</p>
            </div>
            <div>
              <p className="font-semibold text-slate-900 m-0">Sekretaris Daerah</p>
              <p className="text-[11px] text-slate-600 mt-0.5 mb-0">Selaku Ketua TAPD - {daerahName}</p>
              <div className="h-20"></div>
              <p className="font-bold text-slate-900 underline m-0">{sekdaName}</p>
              <p className="text-[10px] text-slate-600 mt-0.5 mb-0">NIP. 19650824 199003 1 003</p>
            </div>
          </div>

        </div>
      </div>

      {/* Global Print Stylesheet */}
      <style>{`
        @media print {
          body {
            background-color: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
          .print-area-container {
            max-width: 100% !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }
          .print-content {
            padding: 0 !important;
          }
          @page {
            size: A4 portrait;
            margin: 1.5cm;
          }
        }
      `}</style>
    </div>
  );
};
