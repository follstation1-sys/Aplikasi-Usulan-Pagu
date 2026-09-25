# Product Requirement Document (PRD)

## SIP-ANGGARAN: Sistem Informasi Pembahasan Usulan Pagu, Hibah & Bansos Daerah

* **Versi Dokumen:** 1.3.0 (Update Fitur Lengkap & Siap Rilis)
* **Status:** Siap Eksekusi & Tahap Pembaharuan Produksi
* **Kategori Produk:** Enterprise CivicTech / Public Financial Management (e-TAPD / Desk Anggaran Daerah)
* **Target Pengguna:** Tim Anggaran Pemerintah Daerah (TAPD), Bappeda, Perangkat Daerah (OPD), dan Super Administrator

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
3. **Menyediakan Mesin Kapasitas Fiskal Dinamis & Alert Defisit**: Mengakses saldo kas riil (dibatasi hanya untuk TAPD & Superadmin), lengkap dengan sistem peringatan otomatis saat alokasi melampaui kas daerah (*Defisit Alert*) atau usulan OPD terdeteksi lonjakan tinggi (*Lonjakan Pagu Alert*).
4. **Menerapkan Format Angka Full Tanpa Singkatan**: Menyajikan seluruh nominal Rupiah dalam angka utuh (*full number*) tanpa penyingkatan (`Rp 1.500.000.000`).
5. **Menyediakan Audit Trail & Rekam Jejak Perubahan**: Mencatat secara otomatis riwayat pembuatan, perubahan status, dan penyesuaian nominal disetujui ($P_4$) pada setiap usulan.
6. **Fasilitas Import & Export Excel/CSV**: Mendukung ekspor laporan ke format `.csv` berstandar Excel serta import massal usulan dari berkas Excel/CSV.
7. **Portal Manajemen Akun Pengguna (Superadmin)**: Memberikan fasilitas pengelolaan akun (tambah, edit, hapus) serta fleksibilitas penugasan multi-OPD pengampu untuk role BAPPEDA.

---

## 2. User Persona & Role-Based Access Control (RBAC)

Sistem menerapkan kontrol akses berbasis peran (RBAC) dengan pemisahan wewenang yang kaku:

```
+---------------------------------------------------------------------------------------------------+
|                                     MATRIKS OTORITAS RBAC 1.3.0                                   |
+----------------------+--------------------+--------------------+--------------------+-------------+
| Kemampuan / Fitur    | SUPERUSER (Admin)  | TAPD (Admin Pagu)  | BAPPEDA (Penelaah) | OPD (Pengusul)|
+----------------------+--------------------+--------------------+--------------------+-------------+
| Kelola Akun Pengguna | Ya (Penuh: Edit/Del| Tidak (Forbidden)  | Tidak (Forbidden)  | Tidak       |
| Pilih Siklus Sesi    | Ya (Semua Siklus)  | Ya (Semua Siklus)  | Ya (Semua Siklus)  | Ya (Semua)  |
| Buat Siklus Baru     | Ya                 | Ya                 | Tidak (Read-only)  | Tidak       |
| Kelola Sumber Kas    | Ya (Tambah/Hapus)  | Ya (Tambah/Hapus)  | Tidak (Dibatasi)   | Tidak       |
| View Kapasitas Kas   | Ya (Menu & Widget) | Ya (Menu & Widget) | Tidak (Dibatasi)   | Tidak       |
| Lihat Usulan Dinas   | Seluruh OPD        | Seluruh OPD        | OPD Pengampu       | Terisolasi  |
| Input Usulan Baru    | Ya                 | Ya                 | Ya (OPD Pengampu)  | Ya (Sendiri)|
| Import/Export Excel  | Ya                 | Ya                 | Ya                 | Ya          |
| Beri Catatan Telaah  | Ya                 | Ya                 | Ya                 | Ya          |
| Ketuk Palu Status    | Ya (Wewenang Penuh)| Ya (Wewenang Penuh)| Tidak (Forbidden)  | Tidak       |
| Ubah Nominal Setuju  | Ya                 | Ya                 | Tidak (Forbidden)  | Tidak       |
| Cetak Berita Acara   | Ya                 | Ya                 | Ya (Resume Resmi)  | Ya (Resume) |
+----------------------+--------------------+--------------------+--------------------+-------------+
```

### 2.1 Peran 1: SUPERUSER (Super Administrator)
* **Karakteristik**: Administrator Sistem IT Pemda / Pengelola Master Data.
* **Kewenangan**:
  * Mengakses seluruh fitur sistem termasuk **Manajemen Akun Pengguna**.
  * Membuat akun baru, mengubah data pengguna (password, nama, jabatan, role, dan OPD), serta menghapus akun terdaftar.
  * Menetapkan penugasan satu atau beberapa Perangkat Daerah (*Multi-OPD Pengampu*) untuk akun BAPPEDA.

### 2.2 Peran 2: TAPD (Tim Anggaran Pemerintah Daerah)
* **Karakteristik**: Sekretaris Daerah (Ketua TAPD), Kepala BPKAD (Sekretaris), Kepala Bapenda, Kabid Anggaran, dan Tim Asistensi.
* **Kewenangan**:
  * Menambah dan mengatur siklus anggaran aktif (misal: *Murni 2027*, *Perubahan 2027*, *Murni 2028*).
  * Menetapkan komponen pembentuk kapasitas fiskal kas dan mengakses menu Kapasitas Fiskal Kas.
  * Membahas seluruh usulan dari semua Perangkat Daerah.
  * Menetapkan putusan akhir (*Setuju Penuh*, *Setuju Parsial*, *Perlu Revisi*, *Ditolak*) serta menentukan nominal pagu ketuk palu ($P_4$).
  * Menerbitkan dan mencetak Berita Acara Hasil Pembahasan Pleno TAPD.

### 2.3 Peran 3: BAPPEDA (Badan Perencanaan Pembangunan Daerah)
* **Karakteristik**: Kepala Bappeda, Bidang Perencanaan Makro, Sosbud, Sarpras, dan Perekonomian.
* **Kewenangan**:
  * Menelaah keselarasan usulan belanja terhadap Indikator Kinerja Utama (IKU), RPJMD, dan RKPD.
  * Berhak mengajukan usulan baru (`+ Usulan Baru`) untuk instansi OPD yang diampunya.
  * Mengakses data usulan OPD yang berada dalam daftar pengampuannya (*Multi-OPD Pengampu*).
  * **Batasan**: Tidak berhak mengakses menu Kapasitas Fiskal, tidak berhak mengetuk palu status putusan maupun mengubah nominal disetujui ($P_4$).

### 2.4 Peran 4: OPD (Perangkat Daerah Pengusul)
* **Karakteristik**: Kepala SKPD, Sekretaris Dinas, Kasubag Perencanaan/Program, dan PPK dari 49 Perangkat Daerah Terdaftar.
* **Kewenangan & Batasan (*Strict Tenant Isolation*)**:
  * **Hanya melihat usulan instansinya sendiri**. Usulan dari dinas lain disembunyikan sepenuhnya dari antarmuka.
  * Mengajukan usulan belanja baru dengan melengkapi 4 pilar anggaran, prioritas, target output fisik, justifikasi urgensi, dan berkas lampiran disposisi/proposal PDF.
  * Menjawab/merespons catatan telaah yang diberikan oleh TAPD atau Bappeda.

---

## 3. Core Architecture & User Journey Flow

```
                      +---------------------------------------+
                      |     Pintu Masuk / Sesi Login          |
                      |  1. Pilih Siklus (Murni 2027, dst)    |
                      |  2. Pilih Peran (Super/TAPD/Bappeda/OPD)|
                      |  3. Otentikasi & Preset Akun Cepat    |
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
  - Alert Defisit (TAPD/Super)                                - Import/Export Excel CSV
            |                                                           |
            +--------------------+   Isolasi Sesi & Hak Akses  <--------+
                                 |   (Tenant & Cycle Boundary)
                                 v
                     +-------------------------+
                     | Dasbor & Kartu Usulan   |
                     | Langsung Terbaca Penuh  |
                     | - Angka Full Format Rp  |
                     | - Alert Lonjakan Pagu   |
                     +------------+------------+
                                  |
                                  v
                     +-------------------------+
                     | Ruang Sidang Meja Bahas |
                     | - Telaah Bappeda / TAPD |
                     | - Audit Trail & Timeline|
                     | - Kalkulator Rasionalisasi|
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

### Modul 1: Master List Perangkat Daerah (49 OPD)
* Sistem menggunakan Master List resmi 49 Perangkat Daerah (mulai dari Dinas Pendidikan Dan Kebudayaan, Dinas Kesehatan, RSUD Bandar Negara Husada, RSUD dr. Abdul Moeloek, RS Jiwa, hingga Dinas Pengelolaan Sumber Daya Air dan Inspektorat).
* Daftar OPD digunakan secara konsisten pada Form Login, Form Pengajuan Usulan, Form Import Excel, dan Checklist Multi-OPD Pengampu BAPPEDA.

### Modul 2: Sesi Siklus Anggaran & Layar Masuk (*Session Isolation Engine*)
* Otentikasi menyajikan tombol preset login cepat untuk memfasilitasi pengujian antar-peran.
* Sesi anggaran mengisolasi data secara kaku antar-siklus (**Murni 2027**, **Perubahan 2027**, **Murni 2028**).

### Modul 3: Mesin Kapasitas Fiskal Kas & Alert Defisit
* TAPD & Superadmin dapat mencatat komponen kas secara dinamis.
* **Formulasi Saldo Kas Real-Time**:
  $$\text{Sisa Kapasitas Kas} = \text{Total Kapasitas Fiskal} - \text{Total Alokasi Disetujui TAPD}$$
* **Alert Defisit Fiskal**: Jika $\text{Sisa Kapasitas Kas} < 0$, sistem menampilkan **Banner Peringatan Defisit Fiskal** berwarna merah menyala (`rose-950`) pada bagian atas dasbor dengan jumlah selisih defisit real-time.

### Modul 4: Model 4 Pilar Anggaran & Penyelarasan Istilah
Sistem menyelaraskan penamaan 4 pilar pagu anggaran sebagai berikut:
1. $P_1$ (**Pagu Awal**): Pagu anggaran berjalan sebelum usulan penambahan diajukan.
2. $P_2$ (**Usulan Pagu**): Nominal penambahan anggaran yang dimohonkan.
3. $P_3$ (**Total Pagu Diminta**): Hasil akumulasi $P_1 + P_2$.
4. $P_4$ (**Pagu Kesepakatan**): Hasil ketuk palu sidang pleno rasionalisasi TAPD.

### Modul 5: Format Angka Full & Alert Lonjakan Usulan OPD
* **Format Angka Full**: Seluruh nominal angka di dalam aplikasi dituliskan secara utuh dengan pemisah ribuan standar Indonesia (`Rp 1.500.000.000`), menghapus penggunaan singkatan `M` atau `Jt`.
* **Alert Lonjakan Usulan OPD**: Header kelompok OPD pada dasbor secara otomatis menampilkan badge peringatan berkedip `Alert: Lonjakan Usulan (+Rp ...)` apabila usulan pagu OPD meningkat lebih dari 50% dibanding Pagu Awal.

### Modul 6: Ruang Sidang & Audit Trail (Riwayat Perubahan)
* **Audit Trail History Log**: Setiap perubahan usulan (pembuatan usulan, import batch, dan penetapan putusan TAPD) merekam jejak audit yang disimpan pada entitas usulan.
* **Timeline Visual**: Ruang Sidang Pleno menyajikan panel khusus **Riwayat Perubahan & Audit Trail Usulan** yang menampilkan tanggal/jam, nama pengubah, peran, status sebelum vs sesudah, serta perubahan alokasi $P_4$.

### Modul 7: Fitur Export & Import Data Excel/CSV
1. **Export ke Excel (.csv)**:
   * Menghasilkan berkas CSV ber-BOM UTF-8 dengan pemisah titik koma (`;`) yang kompatibel langsung dengan Microsoft Excel.
   * Rincian kolom: ID Usulan, Perangkat Daerah, Kategori Usulan, Prioritas, Nama Kegiatan, Sub Kegiatan, Pagu Awal, Usulan Pagu, Total Pagu Diminta, Pagu Kesepakatan, Status, Target Output, Justifikasi, dan Tanggal Input.
2. **Import Batch Usulan Excel/CSV (`modal-import-proposals`)**:
   * Menyediakan fasilitas unduh templat standar `Template_Import_Usulan_Pagu.csv`.
   * Fasilitas pengunggahan berkas CSV dengan pratinjau tabel (*Preview Table*) sebelum eksekusi import massal.

### Modul 8: Portal Manajemen Akun Pengguna (Superadmin)
* Modal khusus **Manajemen Akun Pengguna** untuk peran `SUPERUSER`.
* **Tambah & Edit Akun**: Mengubah Password, Nama Lengkap, Jabatan, Role, serta Instansi OPD. Username dikunci (*readonly*) saat mode edit.
* **Hapus Akun**: Dilengkapi konfirmasi dan proteksi pencegahan hapus akun sendiri (*self-delete protection*).
* **Multi-OPD BAPPEDA**: Menyajikan checklist interaktif untuk menentukan daftar Perangkat Daerah yang diampu oleh setiap penelaah BAPPEDA.

---

## 5. Entity Relationship & Data Model (TypeScript Schema 1.3.0)

```typescript
// 1. Entitas Sesi Siklus Anggaran
export interface FiscalCycle {
  id: string; // contoh: "murni-2027", "perubahan-2027", "murni-2028"
  label: string; // "Murni 2027" | "Perubahan 2027" | "Murni 2028"
  type: 'Murni' | 'Perubahan';
  year: number;
  isActive: boolean;
  createdAt: string;
}

// 2. Entitas Akun Pengguna (User Management)
export interface UserAccount {
  username: string;
  password?: string;
  role: 'SUPERUSER' | 'TAPD' | 'BAPPEDA' | 'OPD';
  opd?: string; // 1 OPD untuk role OPD
  opdList?: string[]; // Multi OPD pengampu untuk role BAPPEDA
  name: string;
  title?: string;
}

// 3. Entitas Audit Trail History Log
export interface AuditHistoryLog {
  timestamp: string;
  author: string;
  role: string;
  action: string;
  oldStatus: string;
  newStatus: string;
  oldP4: number;
  newP4: number;
  note: string;
}

// 4. Entitas Usulan Belanja
export interface BudgetProposal {
  id: string; // Format: "USL-2027M-001"
  cycleId: string;
  opd: string;
  kategoriUsulan: 'Penambahan Pagu OPD' | 'Belanja Hibah' | 'Bantuan Sosial (Bansos)';
  prioritas: 'Prioritas 1 (Wajib)' | 'Prioritas 2 (RPJMD)' | 'Prioritas 3 (Reguler)';
  namaKegiatan: string;
  subKegiatan: string;
  paguAwal: number; // P1 (IDR Full Number)
  usulanTambah: number; // P2 (IDR Full Number)
  setujuTapd: number; // P4 (IDR Full Number)
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
  history?: AuditHistoryLog[];
}

// 5. Basis Data Global System State
export interface FiscalSystemState {
  activeCycleId: string;
  currentUserRole: 'SUPERUSER' | 'TAPD' | 'BAPPEDA' | 'OPD';
  currentAuthUser: UserAccount;
  currentOpdUser: string;
  activeViewMode: 'detailed' | 'compact';
  cycles: Record<string, {
    sumberDanaList: FundingSource[];
    proposals: BudgetProposal[];
  }>;
}
```

---

## 6. Non-Functional Requirements & UX Design Standards

1. **Format Mata Uang Rupiah Utuh**: Seluruh nilai moneter ditampilkan penuh tanpa singkatan, memudahkan pembacaan dokumen resmi TAPD.
2. **Kesiapan Cetak Berita Acara**: Dukungan `@media print` untuk mencetak Berita Acara Pleno tanpa gangguan elemen navigasi UI.
3. **Standar Keamanan Sesi**: Sanitasi teks bebas menggunakan fungsi `sanitize()` untuk mencegah serangan XSS pada forum diskusi dan audit trail.