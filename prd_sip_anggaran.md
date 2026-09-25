# Product Requirement Document (PRD)

## SIP-ANGGARAN: Sistem Informasi Pembahasan Usulan Pagu, Hibah & Bansos Daerah

* **Versi Dokumen:** 1.2.0
* **Status:** Siap Eksekusi (Ready for Antigravity / Prompt-to-Code Agent)
* **Kategori Produk:** Enterprise CivicTech / Public Financial Management (e-TAPD / Desk Anggaran Daerah)
* **Target Pengguna:** Tim Anggaran Pemerintah Daerah (TAPD), Bappeda, dan Perangkat Daerah (OPD) Provinsi / Kabupaten / Kota

---

## 1. Executive Summary & Problem Statement

### 1.1 Latar Belakang

Pemerintah Daerah menghadapi dinamika fiskal yang tinggi pada beberapa titik kritis kalender anggaran:
1. **APBD Murni 2027 (Tahap Pembahasan Sebelum Penetapan)**: Ranperda APBD belum diketuk/ditetapkan. Perangkat Daerah saling berebut alokasi pagu indikatif, sementara estimasi kapasitas riil (PAD, DAU transfer pusat, dan DBH) masih bergerak fluktuatif.
2. **APBD Perubahan 2027**: Penyesuaian belanja berdasarkan sisa kas riil (SiLPA audited BPK), pergeseran anggaran darurat, dan pemenuhan target mendesak semester II.
3. **Rancangan APBD Murni 2028**: Perencanaan pagu indikatif tahun anggaran berikutnya selaras dengan target tahunan RPJMD/RKPD.

Selama ini, proses penyaringan ratusan usulan penambahan belanja perangkat daerah, proposal belanja hibah instansi vertikal/ormas, serta bantuan sosial (bansos) sering mengandalkan lembar kerja *spreadsheet* terpisah. Hal ini menimbulkan risiko sistemik:

* **Over-commitment & Risiko Defisit**: Persetujuan penambahan belanja tidak terkontrol secara *real-time* terhadap kapasitas kas riil yang tersedia.
* **Kebocoran Data & Konflik Kepentingan Antar-Dinas**: Tanpa isolasi hak akses (*tenant isolation*), perangkat daerah dapat saling mengintip besaran usulan dan strategi dinas lain sebelum sidang pleno TAPD.
* **Pencampuran Siklus Anggaran**: Dokumen usulan APBD Murni 2027 sering kali tercampur dengan usulan APBD Perubahan 2027 atau APBD Murni 2028 karena ketiadaan partisi sesi kerja independen.
* **Hilangnya Jejak Telaah Substantif (*Audit Trail Loss*)**: Catatan telaah keselarasan target kinerja RPJMD dari Bappeda dan pertimbangan rasionalisasi BPKAD tercecer dan tidak terhubung ke lembar ketuk palu Berita Acara.

### 1.2 Tujuan Produk

Membangun platform **SIP-ANGGARAN** sebagai *collaborative budgeting desk* terintegrasi yang:
1. **Mengisolasi Data Sesi Anggaran**: Memisahkan basis data usulan dan kapasitas fiskal secara kaku antar-siklus (**Murni 2027**, **Perubahan 2027**, **Murni 2028**, dan siklus baru lainnya).
2. **Mengisolasi Hak Akses Perangkat Daerah (OPD)**: Menjamin OPD pengusul hanya dapat melihat, melacak, dan merespons usulan milik instansinya sendiri.
3. **Menyediakan Mesin Kapasitas Fiskal Dinamis Berbasis Histori**: Menghapus dropdown statis; TAPD bebas mencatat komponen pembentuk kapasitas kas (PAD, DAU, SiLPA, efisiensi) secara fleksibel dengan pencatatan riwayat lengkap.
4. **Menerapkan Arsitektur Kartu Usulan Terbuka (*Direct Open-Card Architecture*)**: Menyajikan 4 pilar anggaran, target fisik, justifikasi urgensi, dan berkas disposisi langsung terbaca di layar utama tanpa *click fatigue*.
5. **Menyediakan Meja Sidang Pleno & Generator Berita Acara**: Memberikan kalkulator rasionalisasi cepat bagi TAPD serta fungsi cetak otomatis Berita Acara resmi bertanda tangan pimpinan.

---

## 2. User Persona & Role-Based Access Control (RBAC)

Sistem menerapkan kontrol akses berbasis peran (RBAC) dengan pemisahan wewenang yang tegas:

```
+-----------------------------------------------------------------------------------+
|                                  MATRIKS OTORITAS RBAC                           |
+----------------------+--------------------+--------------------+------------------+
| Kemampuan / Fitur    | TAPD (Admin Pagu)  | BAPPEDA (Penelaah) | OPD (Pengusul)   |
+----------------------+--------------------+--------------------+------------------+
| Pilih Siklus Sesi    | Ya (Semua Siklus)  | Ya (Semua Siklus)  | Ya (Semua Siklus)|
| Buat Siklus Baru     | Ya                 | Tidak (Read-only)  | Tidak (Forbidden)|
| Kelola Sumber Kas    | Ya (Tambah/Hapus)  | Tidak (Lihat Saja) | Tidak (Forbidden)|
| Lihat Usulan Dinas   | Seluruh OPD        | Seluruh OPD        | Terisolasi (Milik|
|                      |                    |                    | Sendiri Saja)    |
| Input Usulan Baru    | Ya (Atas nama OPD) | Tidak              | Ya (Instansinya) |
| Beri Catatan Telaah  | Ya                 | Ya                 | Ya (Klarifikasi) |
| Ketuk Palu Status    | Ya (Wewenang Penuh)| Tidak (Forbidden)  | Tidak (Forbidden)|
| Ubah Nominal Setuju  | Ya                 | Tidak (Forbidden)  | Tidak (Forbidden)|
| Cetak Berita Acara   | Ya                 | Ya                 | Ya (Resume Resmi)|
+----------------------+--------------------+--------------------+------------------+
```

### 2.1 Peran 1: TAPD (Tim Anggaran Pemerintah Daerah)
* **Karakteristik**: Sekretaris Daerah (Ketua TAPD), Kepala BPKAD (Sekretaris), Kepala Bapenda, Kabid Anggaran, dan Tim Asistensi.
* **Kewenangan**:
  * Menambah dan mengatur siklus anggaran aktif (misal: *Murni 2027*, *Perubahan 2027*, *Murni 2028*).
  * Menetapkan komponen pembentuk kapasitas fiskal kas (input bebas nama sumber kas, nominal rupiah, dan dasar hukum).
  * Membahas seluruh usulan dari semua OPD.
  * Menetapkan putusan akhir (*Setuju Penuh*, *Setuju Parsial*, *Perlu Revisi*, *Ditolak*) serta menentukan nominal pagu ketuk palu.
  * Menerbitkan dan mencetak Berita Acara Hasil Pembahasan Pleno TAPD.

### 2.2 Peran 2: BAPPEDA (Badan Perencanaan Pembangunan Daerah)
* **Karakteristik**: Kepala Bappeda, Bidang Perencanaan Makro, Sosbud, Sarpras, dan Perekonomian.
* **Kewenangan**:
  * Menelaah keselarasan usulan belanja terhadap Indikator Kinerja Utama (IKU), RPJMD, dan RKPD.
  * Memberikan rekomendasi dan catatan telaah berjenjang pada forum usulan.
  * Mengakses data usulan seluruh perangkat daerah.
  * **Larangan Keras**: Tidak berhak mengetuk palu status putusan maupun mengubah nominal disetujui (*read-only approval*).

### 2.3 Peran 3: OPD (Perangkat Daerah Pengusul)
* **Karakteristik**: Kepala SKPD, Sekretaris Dinas, Kasubag Perencanaan/Program, dan Pejabat Pembuat Komitmen (PPK).
* **Kewenangan & Batasan (*Strict Tenant Isolation*)**:
  * **Hanya melihat usulan instansinya sendiri**. Usulan dari dinas lain disembunyikan sepenuhnya dari tampilan tabel, kartu, metrik, maupun respons pencarian.
  * Mengajukan usulan belanja baru dengan melengkapi 4 pilar anggaran, prioritas, target output fisik, justifikasi urgensi, dan berkas lampiran disposisi/proposal.
  * Menjawab/merespons catatan telaah yang diberikan oleh TAPD atau Bappeda.

---

## 3. Core Architecture & User Journey Flow

```
                      +---------------------------------------+
                      |     Pintu Masuk / Sesi Login          |
                      |  1. Pilih Siklus (Murni 2027, dst)    |
                      |  2. Pilih Peran (TAPD / Bappeda / OPD)|
                      |  3. Pilih Instansi (Jika Peran = OPD) |
                      +-------------------+-------------------+
                                          |
                                          v
                      [ Context Provider: activeCycleId ]
                                          |
            +-----------------------------+-----------------------------+
            |                                                           |
            v                                                           v
  [ Mesin Kapasitas Fiskal ]                                  [ Repositori Usulan Sesi ]
  - Entri Bebas Komponen Kas                                  - Usulan Belanja Pagu OPD
  - Riwayat/Histori Sumber Dana                               - Usulan Belanja Hibah
  - Total Plafon Kas Sesi                                     - Usulan Bantuan Sosial (Bansos)
            |                                                           |
            +--------------------+   Isolasi Sesi & Hak Akses  <--------+
                                 |   (Tenant & Cycle Boundary)
                                 v
                     +-------------------------+
                     | Dasbor & Kartu Usulan   |
                     | Langsung Terbaca Penuh  |
                     +------------+------------+
                                  |
                                  v
                     +-------------------------+
                     | Ruang Sidang Meja Bahas |
                     | - Telaah Bappeda / TAPD |
                     | - Kalkulator Pangkas    |
                     | - Ketuk Palu Putusan    |
                     +------------+------------+
                                  |
                                  v
                     +-------------------------+
                     | Berita Acara Pleno TAPD |
                     | (Print-Ready Document)  |
                     +-------------------------+
```

---

## 4. Functional Specifications (Spesifikasi Modul)

### Modul 1: Sesi Siklus Anggaran & Layar Masuk (*Session Isolation Engine*)

1. **Layar Masuk Pemilihan Sesi (*Entry Modal*)**:
   * Setiap kali aplikasi dibuka atau sesi diubah, pengguna memilih:
     * **Siklus & Tahun Anggaran**: Pilihan bawaan mencakup `Murni 2027`, `Perubahan 2027`, dan `Murni 2028`.
     * **Peran Kerja**: `TAPD`, `BAPPEDA`, atau `OPD`.
     * **Instansi Perangkat Daerah**: Aktif dan wajib dipilih apabila peran adalah `OPD`.
   * Layar login menyajikan *Live Fiscal Preview*:
     * Total kapasitas kas tersedia pada siklus tersebut.
     * Jumlah komponen sumber dana terdaftar.
     * Jumlah usulan masuk pada siklus terpilih.
2. **Pemisahan Data (*Data Isolation Boundary*)**:
   * Seluruh mutasi data (sumber dana, usulan belanja, komentar telaah, status putusan) terikat kaku pada atribut `cycle_id`.
   * Data pada siklus **Murni 2027** tidak boleh bercampur, menggeser, atau mempengaruhi saldo fiskal pada **Perubahan 2027** maupun **Murni 2028**.
3. **Manajemen Siklus Baru (Otoritas Admin TAPD)**:
   * Modal khusus bagi TAPD untuk membuat siklus anggaran baru:
     * Atribut: Jenis Siklus (`Murni` atau `Perubahan`) dan Angka Tahun (misal: `2029`).
     * Sistem otomatis membentuk partisi data terisolasi baru dengan saldo awal yang dapat ditentukan.

### Modul 2: Mesin Kapasitas Fiskal Kas (*Free-Text Dynamic Funding Engine*)

1. **Entri Bebas Sumber Pendanaan**:
   * Menghapus dropdown pilihan statis. TAPD mengetik bebas nama sumber penerimaan riil daerah.
   * Contoh entri valid:
     * *APBD Murni 2027*: *"Target Estimasi Penerimaan PAD 2027"*, *"Dana Alokasi Umum (DAU) Dukungan Layanan Publik"*, *"Proyeksi SiLPA Berjalan TA Sebelumnya"*.
     * *APBD Perubahan 2027*: *"SiLPA TA 2026 Audited BPK RI"*, *"Pelampauan Pajak Kendaraan Bermotor (PKB)"*, *"DBH Sawit Transfer Pusat"*, *"Efisiensi Belanja Tidak Terduga (BTT)"*.
2. **Atribut Entri Sumber Kas**:
   * `id`: Unique identifier (timestamp / UUID).
   * `cycle_id`: Relasi terhadap siklus tahun anggaran aktif.
   * `nama`: String nama sumber pendanaan (bebas diketik, minimal 3 karakter).
   * `nominal`: Integer nilai Rupiah (IDR).
   * `dasar_hukum`: String keterangan dasar regulasi / rujukan dokumen (misal: *"KUA-PPAS Rancangan Murni 2027"*, *"LHP BPK No. 18/2026"*).
   * `tanggal_input`: Format tanggal YYYY-MM-DD.
3. **Histori Komposisi Kas Terinci**:
   * Modal pengaturan menyajikan tabel riwayat seluruh komponen sumber dana yang terdaftar pada siklus aktif, lengkap dengan tombol aksi hapus item untuk membatalkan sumber dana tertentu.
4. **Formulasi Saldo Kas Real-Time**:

$$
\text{Total Kapasitas Fiskal} = \sum_{i=1}^{n} \text{Nominal Sumber Kas}_{i}
$$

$$
\text{Total Alokasi Disetujui} = \sum_{j=1}^{m} \text{Nominal Pagu Setuju TAPD}_{j}
$$

$$
\text{Sisa Kapasitas Kas} = \text{Total Kapasitas Fiskal} - \text{Total Alokasi Disetujui}
$$

*Jika $\text{Sisa Kapasitas Kas} < 0$, sistem memicu indikator peringatan defisit berwarna merah menyala (`rose-600`) pada seluruh antarmuka dasbor.*

### Modul 3: Manajemen Usulan Belanja Multi-Kategori (*Proposal Engine*)

1. **Tiga Kategori Usulan Belanja**:
   * `Penambahan Pagu OPD`: Belanja operasional, modal gedung/jalan, atau pemeliharaan langsung satuan kerja.
   * `Belanja Hibah`: Penyaluran hibah uang/barang kepada instansi vertikal (TNI/Polri/KPU/Bawaslu), ormas, badan keagamaan, atau yayasan pendidikan terverifikasi.
   * `Bantuan Sosial (Bansos)`: Alokasi bantuan perlindungan sosial individu/keluarga terdaftar di DTKS / data kemiskinan ekstrem daerah.
2. **Model 4 Pilar Anggaran**:
   * $P_1$ (**Pagu DPA Awal**): Pagu anggaran berjalan sebelum usulan penambahan diajukan. Khusus APBD Murni yang belum disahkan, $P_1$ mencerminkan alokasi pagu indikatif awal.
   * $P_2$ (**Usulan Tambahan**): Nominal penambahan anggaran yang dimohonkan dinas.
   * $P_3$ (**Total Usulan DPA**): Hasil akumulasi $P_1 + P_2$.
   * $P_4$ (**Disetujui TAPD**): Hasil ketuk palu sidang pleno rasionalisasi TAPD.
3. **Formulir Pengajuan Usulan**:
   * Pemilihan kategori belanja (`Pagu OPD`, `Hibah`, `Bansos`).
   * Skala Prioritas: `Prioritas 1 (Wajib / SPM)`, `Prioritas 2 (Janji KDH / RPJMD)`, `Prioritas 3 (Reguler / Rutin)`.
   * Nama Program, Kegiatan, dan Sub-kegiatan.
   * Target Capaian Output Fisik (contoh: *"Pengadaan 10 unit sensor EWS banjir & posko logistik"*).
   * Latar Belakang & Justifikasi Kebutuhan Mendesak (narasi alasan mengapa anggaran harus dialokasikan).
   * Unggah Berkas: Lampiran proposal / telaah staf / disposisi pimpinan (PDF/DOCX).

### Modul 4: Antarmuka Kartu Usulan Terbuka Penuh (*Direct Open-Card UI*)

1. **Prinsip Bebas Hambatan Klik (*Zero Click-Fatigue*)**:
   * Halaman utama langsung menampilkan kartu rinci usulan tanpa mengharuskan pengguna membuka modal pembahasan satu per satu untuk membaca substansi:
     * Informasi pilar anggaran ($P_1$, $P_2$, $P_3$, $P_4$, dan persentase persetujuan).
     * Kotak teks Target Capaian Kinerja Fisik tampil utuh.
     * Kotak teks Latar Belakang & Urgensi Mendesak tampil utuh tanpa pemotongan baris (*no line-clamp*).
     * Indikator lampiran dokumen disposisi beserta tombol aksi unduh langsung.
     * Cuplikan catatan telaah atau arahan terakhir dari sidang TAPD/Bappeda.
2. **Pengalih Mode Tampilan (*View Mode Switcher*)**:
   * Disediakan toggle cepat di toolbar: **Mode Kartu Rinci** (tampilan komprehensif) dan **Mode Tabel Ringkas** (tabel berdensitas tinggi untuk penyisiran cepat saat rapat pleno).

### Modul 5: Ruang Sidang & Penetapan Putusan (*Deliberation Room & Decision Matrix*)

1. **Forum Catatan Telaah Berjenjang**:
   * Log riwayat diskusi interaktif dengan identitas nama pengirim, peran (`TAPD`, `BAPPEDA`, `OPD`), dan stempel waktu.
   * Bappeda menggunakan forum ini untuk menelaah keselarasan target IKU RPJMD.
   * OPD dapat memberikan tanggapan klarifikasi terhadap pertanyaan TAPD.
2. **Formulir Penetapan Putusan TAPD**:
   * Khusus aktif jika peran pengguna adalah `TAPD`.
   * Pilihan Status: `Diajukan`, `Sedang Dibahas`, `Disetujui`, `Disetujui Parsial`, `Perlu Revisi`, `Ditolak`.
   * Input nominal manual `Alokasi Disetujui TAPD (Rp)`.
   * **Tombol Pintas Rasionalisasi (*Quick Rationalization Shortcuts*)**:
     * **Setuju 100%**: Mengisi $P_4 = P_2$ dan status = `Disetujui`.
     * **Rasionalisasi 50%**: Mengisi $P_4 = \text{round}(P_2 \times 0.5)$ dan status = `Disetujui Parsial`.
     * **Tolak (Rp 0)**: Mengisi $P_4 = 0$ dan status = `Ditolak`.
   * Setiap penyimpanan putusan otomatis menerbitkan catatan sistem pada riwayat diskusi usulan sebagai bukti jejak audit.

### Modul 6: Generator Berita Acara Kesepakatan TAPD (*Official Minutes*)

1. Menyajikan dokumen pratinjau siap cetak (`window.print()`) dengan tata letak resmi administrasi pemerintahan:
   * Kop surat resmi Pemerintah Provinsi / Kabupaten / Kota.
   * Judul resmi: "Berita Acara Hasil Pembahasan Usulan Penambahan Pagu, Hibah & Bansos Belanja Daerah".
   * Label tahun anggaran aktif (misal: *Tahun Anggaran: Murni 2027*).
   * Tabel rekapitulasi: Nama OPD, Program/Kegiatan, Kategori Belanja, Pagu Awal, Usulan Tambahan, Nilai Disetujui TAPD, dan Status.
   * Baris total akumulasi belanja daerah.
   * Blok tanda tangan basah/elektronik: Kepala Bappeda Provinsi dan Sekretaris Daerah selaku Ketua TAPD.

---

## 5. Entity Relationship & Data Model (TypeScript Schema)

```typescript
// 1. Entitas Sesi Siklus Anggaran
export interface FiscalCycle {
  id: string; // contoh: "murni-2027", "perubahan-2027", "murni-2028"
  label: string; // "Murni 2027" | "Perubahan 2027" | "Murni 2028"
  type: 'Murni' | 'Perubahan';
  year: number; // 2027 | 2028 | 2029
  isActive: boolean;
  createdAt: string;
}

// 2. Entitas Komponen Sumber Dana Kas
export interface FundingSource {
  id: number | string;
  cycleId: string; // Foreign Key ke FiscalCycle
  nama: string; // Ketik bebas, misal: "Estimasi Target PAD 2027"
  nominal: number; // Nominal Rupiah positif
  dasarHukum: string; // misal: "KUA-PPAS APBD Murni TA 2027"
  tanggalInput: string; // YYYY-MM-DD
}

// 3. Entitas Usulan Belanja
export interface BudgetProposal {
  id: string; // Format: "USL-2027M-001" atau "USL-2027P-001"
  cycleId: string; // Terikat ke siklus tertentu (Murni 2027, dst)
  opd: string; // Nama instansi perangkat daerah
  kategoriUsulan: 'Penambahan Pagu OPD' | 'Belanja Hibah' | 'Bantuan Sosial (Bansos)';
  prioritas: 'Prioritas 1 (Wajib)' | 'Prioritas 2 (RPJMD)' | 'Prioritas 3 (Reguler)';
  namaKegiatan: string;
  subKegiatan: string;
  paguAwal: number; // P1 (IDR)
  usulanTambah: number; // P2 (IDR)
  setujuTapd: number; // P4 (IDR, Putusan Sidang)
  status: 'Diajukan' | 'Sedang Dibahas' | 'Disetujui' | 'Disetujui Parsial' | 'Perlu Revisi' | 'Ditolak';
  targetOutput: string;
  justifikasi: string;
  lampiran?: {
    name: string;
    size: string;
    url?: string;
  };
  tanggalInput: string;
  comments: DeliberationComment[];
}

// 4. Entitas Catatan Telaah & Diskusi Sidang
export interface DeliberationComment {
  id: string;
  author: string;
  role: 'TAPD' | 'BAPPEDA' | 'OPD';
  time: string;
  text: string;
}

// 5. Basis Data Global Terisolasi
export interface FiscalSystemState {
  activeCycleId: string;
  currentUserRole: 'TAPD' | 'BAPPEDA' | 'OPD';
  currentOpdUser: string;
  activeViewMode: 'detailed' | 'compact';
  cycles: Record<string, {
    sumberDanaList: FundingSource[];
    proposals: BudgetProposal[];
  }>;
}
```

---

## 6. Business Logic & Validation Rules

1. **Aturan Isolasi Data Tenant (OPD)**:
   * Jika `currentUserRole === 'OPD'`, sistem **wajib menyaring data** secara kaku sehingga usulan yang ditampilkan hanyalah usulan dengan `proposal.opd === currentOpdUser`.
   * Dropdown filter OPD pada toolbar dinonaktifkan (`disabled = true`).
   * Fungsi pembukaan modal pembahasan usulan dinas lain wajib menolak akses dan memunculkan notifikasi peringatan.
2. **Aturan Integritas Putusan TAPD**:
   * Nilai pagu disetujui TAPD ($P_4$) tidak boleh bernilai negatif ($P_4 \ge 0$).
   * Nilai $P_4$ tidak boleh melebihi nilai usulan tambahan ($P_4 \le P_2$). Penambahan pagu melebihi usulan harus melalui pengajuan usulan addendum baru.
   * Hanya peran `TAPD` yang diizinkan memodifikasi nilai $P_4$ dan status usulan. Peran `BAPPEDA` dan `OPD` dikunci sebagai *read-only*.
3. **Aturan Plafon Kapasitas Fiskal**:
   * Jika $\sum P_4 > \text{Total Kapasitas Fiskal}$, sistem memunculkan indikator defisit berwarna merah pada sisa anggaran, namun tidak memblokir penyimpanan putusan demi fleksibilitas negosiasi sidang pleno.
4. **Pemberian ID Usulan Otomatis**:
   * ID Usulan dibuat dengan pola terstruktur: `USL-[TAHUN][JENIS]-[NOMOR_URUT]`.
   * Contoh: `USL-2027M-001` (Siklus Murni 2027 nomor 001) atau `USL-2027P-002` (Siklus Perubahan 2027 nomor 002).

---

## 7. Non-Functional Requirements (NFR)

1. **Performa & Responsivitas Antarmuka**:
   * Waktu render awal $\le 1.0$ detik.
   * Peralihan siklus tahun anggaran atau filter pencarian tidak boleh mengalami *lag* ($< 50\text{ ms}$).
2. **Keamanan Sesi & Keandalan Input**:
   * Sanitasi karakter khusus pada kolom teks bebas (nama sumber dana dan catatan telaah) untuk mengantisipasi potensi kerentanan Cross-Site Scripting (XSS).
3. **Kesiapan Cetak (*Print-Ready Quality*)**:
   * CSS media cetak (`@media print`) memastikan Berita Acara bersih dari tombol navigasi, modal, header sistem, dan elemen latar belakang abu-abu.
4. **Desain Visual Pemerintahan Modern**:
   * Skema warna berstandar Enterprise CivicTech:
     * Primer: Slate-900 / Slate-850 (Kewibawaan & Tata Kelola).
     * Aksi & Siklus: Indigo-600 / Blue-600.
     * Anggaran Bersih & Persetujuan: Emerald-600 / Emerald-700.
     * Peringatan Defisit & Prioritas Wajib: Rose-600.

---

## 8. Panduan Eksekusi untuk Antigravity (Prompt Implementation Guide)

Bagi pengembang atau agen cerdas yang mengeksekusi implementasi sistem berdasarkan PRD ini:

1. **Struktur Berkas Mandiri**:
   * Bangun aplikasi ke dalam berkas tunggal yang kohesif (`index.html`) menggunakan Tailwind CSS CDN dan Font Awesome.
2. **Urutan Inisialisasi Fungsi JavaScript**:
   * **Wajib** meletakkan fungsi utilitas murni (`formatRp`, `showToast`, modal helpers, badge generators) pada urutan teratas skrip sebelum pemanggilan fungsi *event listener* atau manipulasi DOM untuk mencegah *ReferenceError*.
3. **Data Bawaan (*Default Seed Data*)**:
   * Sediakan *seed data* realistis untuk 3 siklus utama:
     * **Murni 2027**: Sumber dana dari Estimasi PAD Murni, DAU Transfer Pusat, dan Proyeksi SiLPA; berisi usulan kesiapsiagaan bencana BPBD, SPBE Diskominfo, dan penanganan stunting Dinkes.
     * **Perubahan 2027**: Sumber dana dari SiLPA Audited BPK, Pelampauan PKB Bapenda, dan DBH Sawit; berisi usulan rekonstruksi jalan Dinas Bina Marga dan hibah sarana pendidikan Disdik.
     * **Murni 2028**: Proyeksi PAD dan DAU tahun 2028; berisi usulan alat kesehatan RSUD rujukan dan bansos perlindungan lansia/disabilitas Dinsos.
4. **Kalkulator Terbilang Dinamis**:
   * Sediakan pembaca teks terbilang nominal Rupiah otomatis di bawah kolom input nominal untuk meminimalkan salah ketik angka nol pada pengajuan anggaran.