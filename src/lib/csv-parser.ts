/**
 * CSV Parser & Exporter Utility - SIP-ANGGARAN v1.3.0
 * Handles UTF-8 BOM Generation, Semicolon (;) Delimited CSV Export & Import Parsing
 */

import { BudgetProposal } from '../types/database';
import { formatRp } from './currency';

/**
 * Generates and downloads a UTF-8 BOM semicolon-delimited CSV file for Excel
 */
export function exportProposalsToCsv(proposals: BudgetProposal[], cycleLabel: string = '2027'): void {
  const headers = [
    'ID Usulan',
    'Perangkat Daerah',
    'Kategori Usulan',
    'Prioritas',
    'Program',
    'Kegiatan',
    'Sub Kegiatan',
    'Pagu Awal',
    'Usulan Pagu',
    'Total Pagu Diminta',
    'Pagu Kesepakatan',
    'Status',
    'Target Kinerja',
    'Justifikasi Urgensi'
  ];

  const escapeCsv = (val: any): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = proposals.map(p => {
    const p1 = p.initialBudget || (p as any).paguAwal || 0;
    const p2 = p.proposedAddition || (p as any).usulanTambah || 0;
    const p3 = p1 + p2;
    const p4 = p.approvedBudget || (p as any).setujuTapd || 0;
    const programName = (p as any).programName || 'Program Peningkatan Tata Kelola & Layanan';

    return [
      escapeCsv(p.id),
      escapeCsv(p.opd),
      escapeCsv(p.category || (p as any).kategoriUsulan),
      escapeCsv(p.priority || (p as any).prioritas),
      escapeCsv(programName),
      escapeCsv(p.activityName || (p as any).namaKegiatan),
      escapeCsv(p.subActivityName || (p as any).subKegiatan || '-'),
      escapeCsv(p1),
      escapeCsv(p2),
      escapeCsv(p3),
      escapeCsv(p4),
      escapeCsv(p.status),
      escapeCsv(p.targetOutput),
      escapeCsv(p.urgencyJustification || (p as any).justifikasi)
    ].join(';');
  });

  // Prepend UTF-8 BOM (\uFEFF)
  const csvContent = '\uFEFF' + [headers.map(escapeCsv).join(';'), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `SIP_Anggaran_Export_Usulan_${cycleLabel.replace(/\s+/g, '_')}_${dateStr}.csv`;

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Parses raw CSV string into parsed row objects with semicolon or comma delimiter
 */
export function parseCsvContent(csvText: string): Array<{
  opd: string;
  category: string;
  priority: string;
  activityName: string;
  subActivityName: string;
  initialBudget: number;
  proposedAddition: number;
  targetOutput: string;
  justification: string;
  isValid: boolean;
  error?: string;
}> {
  const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length < 2) {
    return [];
  }

  const result: Array<any> = [];

  // Skip header line
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const delimiter = line.includes(';') ? ';' : ',';
    const cols = line.split(delimiter).map(c => c.replace(/^"|"$/g, '').trim());

    if (cols.length >= 4) {
      const opd = cols[0] || 'Dinas Kesehatan';
      const category = cols[1] || 'Penambahan Pagu OPD';
      const priority = cols[2] || 'Prioritas 1 (Wajib)';
      const activityName = cols[3] || '';
      const subActivityName = cols[4] || '-';
      const initialBudget = parseInt(cols[5]) || 0;
      const proposedAddition = parseInt(cols[6]) || 0;
      const targetOutput = cols[7] || 'Target capaian sesuai program';
      const justification = cols[8] || 'Usulan program sesuai RKPD Perangkat Daerah';

      const isValid = Boolean(activityName && proposedAddition > 0);

      result.push({
        opd,
        category,
        priority,
        activityName,
        subActivityName,
        initialBudget,
        proposedAddition,
        targetOutput,
        justification,
        isValid,
        error: !activityName ? 'Nama kegiatan kosong' : proposedAddition <= 0 ? 'Usulan Pagu (P2) <= 0' : undefined
      });
    }
  }

  return result;
}
