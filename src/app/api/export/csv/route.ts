/**
 * Next.js API Route for CSV Export - SIP-ANGGARAN v1.3.0
 * GET /api/export/csv
 * Returns UTF-8 BOM semicolon-delimited CSV file for Microsoft Excel
 */

export async function GET(request: Request) {
  const sampleProposals = [
    {
      id: 'USL-2027-001',
      opd: 'Dinas Kesehatan',
      kategoriUsulan: 'Penambahan Pagu OPD',
      prioritas: 'Prioritas 1 (Wajib)',
      programName: 'Program Pemenuhan Upaya Kesehatan Masyarakat',
      namaKegiatan: 'Pengadaan Alat Kesehatan Puskesmas',
      subKegiatan: 'Pengadaan USG & EKG 10 Unit',
      paguAwal: 500000000,
      usulanTambah: 1500000000,
      setujuTapd: 1500000000,
      status: 'Disetujui',
      targetOutput: '10 Unit Alkes Terdistribusi',
      justifikasi: 'Kebutuhan mendesak peningkatan faskes tingkat pertama'
    },
    {
      id: 'USL-2027-002',
      opd: 'Dinas Pendidikan Dan Kebudayaan',
      kategoriUsulan: 'Belanja Hibah',
      prioritas: 'Prioritas 2 (RPJMD)',
      programName: 'Program Pengelolaan Pendidikan',
      namaKegiatan: 'Rehabilitasi Ruang Kelas Sekolah Dasar',
      subKegiatan: 'Rehab 5 SD Terpencil',
      paguAwal: 1200000000,
      usulanTambah: 800000000,
      setujuTapd: 600000000,
      status: 'Disetujui Parsial',
      targetOutput: '5 Sekolah Ter-rehabilitasi',
      justifikasi: 'Meningkatkan keamanan gedung sekolah rusak sedang'
    }
  ];

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

  const rows = sampleProposals.map(p => {
    const p1 = p.paguAwal || 0;
    const p2 = p.usulanTambah || 0;
    const p3 = p1 + p2;
    const p4 = p.setujuTapd || 0;

    return [
      escapeCsv(p.id),
      escapeCsv(p.opd),
      escapeCsv(p.kategoriUsulan),
      escapeCsv(p.prioritas),
      escapeCsv(p.programName),
      escapeCsv(p.namaKegiatan),
      escapeCsv(p.subKegiatan),
      escapeCsv(p1),
      escapeCsv(p2),
      escapeCsv(p3),
      escapeCsv(p4),
      escapeCsv(p.status),
      escapeCsv(p.targetOutput),
      escapeCsv(p.justifikasi)
    ].join(';');
  });

  const csvContent = '\uFEFF' + [headers.map(escapeCsv).join(';'), ...rows].join('\r\n');
  const dateStr = new Date().toISOString().slice(0, 10);

  return new Response(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="SIP_Anggaran_Export_Usulan_${dateStr}.csv"`
    }
  });
}
