# Rencana Aksi & Panduan Teknis Transisi Fase Produksi: SIP-ANGGARAN

Dokumen ini merupakan cetak biru (*blueprint*) teknis resmi versi **1.3.0** bagi tim pengembang dan agen cerdas **Antigravity**. Dokumen ini telah diselaraskan penuh dengan `prd_sip_anggaran.md` (v1.3.0) untuk merealisasikan aplikasi produksi *enterprise* multi-instansi yang aman, terisolasi, dan siap pakai pada sidang pleno TAPD.

---

## 1. Rangkuman Target Fase Produksi (v1.3.0)

| Aspek | Kondisi Prototipe (Fase 1) | Target Produksi (Fase 2 - v1.3.0) |
| :--- | :--- | :--- |
| **Model Hak Akses (RBAC)** | 3 Peran simulasi (TAPD, BAPPEDA, OPD) | **4 Peran Resmi**: `SUPERUSER`, `TAPD`, `BAPPEDA`, dan `OPD` |
| **Kewenangan BAPPEDA** | Akses baca semua OPD secara global | **Multi-OPD Pengampu**: Bappeda hanya mengampu dinas yang ditugaskan + berhak input usulan baru (`+ Usulan Baru`) untuk dinas ampuannya |
| **Manajemen Pengguna** | Akun statis di memori frontend | **Portal Akun Superadmin**: CRUD pengguna, reset sandi, penugasan multi-OPD pengampu Bappeda |
| **Penyimpanan Data** | Array JavaScript & *localStorage* lokal | Basis data relasional PostgreSQL dengan ACID, relasi foreign key, dan indeks teroptimasi |
| **Isolasi OPD & Privasi** | Filter DOM antarmuka (*client-side*) | **Row-Level Security (RLS)** ketat di level basis data PostgreSQL |
| **Audit Jejak & Perubahan** | Catatan simulasi teks biasa | **Audit Trail History Log Terstruktur**: Mencatat `old_status`, `new_status`, `old_p4`, `new_p4`, aktor, role, dan timestamp pada setiap perubahan usulan |
| **Format Nominal Angka** | Penyingkatan nominal (`M` / `Jt`) | **Full Number Format**: Format utuh Rupiah standar Indonesia (`Rp 1.500.000.000`) di seluruh komponen |
| **Integrasi Berkas Massal** | Input manual satu per satu | **Pipeline Import & Export Excel/CSV**: Ekspor CSV ber-BOM UTF-8 dengan pemisah `;` dan import batch dengan *preview table* |
| **Deteksi Risiko Dini** | Pengecekan kas manual | **Dual Alert System**: *Deficit Alert Banner* (kas < 0) & *Lonjakan Pagu Alert* (usulan naik > 50% dari $P_1$) |

---

## 2. Pilihan *Tech Stack* & Lingkungan *Deployment*

### Rekomendasi Utama: Next.js 14+ (App Router) + Supabase / PostgreSQL (BaaS)
* **Frontend**: Next.js 14+ (TypeScript, Tailwind CSS, Lucide-React / FontAwesome).
* **Backend & Database**: **Supabase** (Managed PostgreSQL 15+, Supabase Auth JWT, Realtime Channel WebSocket untuk sidang pleno, Storage Bucket untuk berkas PDF disposisi).
* **Pemrosesan CSV/Excel**: `papaparse` (browser parsing) dan `xlsx` / format streaming text untuk ekspor CSV ber-BOM UTF-8.

---

## 3. Skema Basis Data Relasional & Keamanan (DDL SQL v1.3.0)

Jalankan skrip DDL SQL berikut pada editor basis data PostgreSQL/Supabase untuk membentuk skema data produksi resmi:

```sql
-- ========================================================
-- 1. TABEL MASTER SIKLUS ANGGARAN
-- ========================================================
CREATE TABLE fiscal_cycles (
    id VARCHAR(50) PRIMARY KEY, -- cth: 'murni-2027', 'perubahan-2027', 'murni-2028'
    label VARCHAR(100) NOT NULL, -- cth: 'Murni 2027'
    cycle_type VARCHAR(20) NOT NULL CHECK (cycle_type IN ('Murni', 'Perubahan')),
    fiscal_year INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================================
-- 2. TABEL MASTER ORGANISASI (49 PERANGKAT DAERAH)
-- ========================================================
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL, -- Kode Unit Sub-SKPD SIPD
    name VARCHAR(255) NOT NULL,       -- Nama lengkap OPD
    alias VARCHAR(100),               -- Nama singkatan (misal: 'Dinas Bina Marga')
    category VARCHAR(50) DEFAULT 'OPD',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================================
-- 3. TABEL PENGGUNA SISTEM (APP_USERS)
-- ========================================================
CREATE TABLE app_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    title VARCHAR(150), -- Jabatan resmi ASN
    nip VARCHAR(30),
    role VARCHAR(30) NOT NULL CHECK (role IN ('SUPERUSER', 'TAPD', 'BAPPEDA', 'OPD')),
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL, -- OPD asal (wajib jika role = OPD)
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================================
-- 4. TABEL PENUGASAN MULTI-OPD PENGAMPU BAPPEDA (JUNCTION TABLE)
-- ========================================================
CREATE TABLE bappeda_supervised_organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_bappeda_org UNIQUE (user_id, organization_id)
);

-- ========================================================
-- 5. TABEL KOMPONEN SUMBER KAS FISKAL (HANYA TAPD & SUPERUSER)
-- ========================================================
CREATE TABLE funding_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cycle_id VARCHAR(50) NOT NULL REFERENCES fiscal_cycles(id) ON DELETE CASCADE,
    source_name VARCHAR(255) NOT NULL, -- Input teks bebas: SiLPA BPK, PAD, DBH Sawit, dll
    amount NUMERIC(18, 2) NOT NULL CHECK (amount >= 0),
    legal_basis TEXT,
    input_date DATE DEFAULT CURRENT_DATE,
    created_by UUID REFERENCES app_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================================
-- 6. TABEL USULAN BELANJA (BUDGET_PROPOSALS)
-- ========================================================
CREATE TABLE budget_proposals (
    id VARCHAR(50) PRIMARY KEY, -- Format: USL-2027M-001
    cycle_id VARCHAR(50) NOT NULL REFERENCES fiscal_cycles(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    category VARCHAR(50) NOT NULL CHECK (category IN ('Penambahan Pagu OPD', 'Belanja Hibah', 'Bantuan Sosial (Bansos)')),
    priority VARCHAR(50) NOT NULL CHECK (priority IN ('Prioritas 1 (Wajib)', 'Prioritas 2 (RPJMD)', 'Prioritas 3 (Reguler)')),
    program_name VARCHAR(255) NOT NULL,
    activity_name VARCHAR(255) NOT NULL,
    sub_activity_name VARCHAR(255),
    initial_budget NUMERIC(18, 2) DEFAULT 0,    -- P1: Pagu Awal
    proposed_addition NUMERIC(18, 2) NOT NULL CHECK (proposed_addition > 0), -- P2: Usulan Pagu
    approved_budget NUMERIC(18, 2) DEFAULT 0,  -- P4: Pagu Kesepakatan (Ketuk Palu TAPD)
    status VARCHAR(40) DEFAULT 'Diajukan' CHECK (status IN ('Diajukan', 'Sedang Dibahas', 'Disetujui', 'Disetujui Parsial', 'Perlu Revisi', 'Ditolak')),
    target_output TEXT NOT NULL,
    urgency_justification TEXT NOT NULL,
    attachment_url TEXT,
    attachment_name VARCHAR(255),
    created_by UUID REFERENCES app_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Virtual Computed Column / Helper View untuk P3 (Total Pagu Diminta = P1 + P2)
CREATE OR REPLACE VIEW v_budget_proposals AS
SELECT 
    p.*,
    (p.initial_budget + p.proposed_addition) AS total_requested_budget, -- P3
    CASE 
        WHEN p.initial_budget > 0 AND (p.proposed_addition / p.initial_budget) > 0.5 THEN TRUE
        ELSE FALSE 
    END AS is_spike_alert -- Peringatan lonjakan jika usulan > 50% dari Pagu Awal
FROM budget_proposals p;

-- ========================================================
-- 7. TABEL FORUM CATATAN TELAAH BERJENJANG
-- ========================================================
CREATE TABLE deliberation_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_id VARCHAR(50) NOT NULL REFERENCES budget_proposals(id) ON DELETE CASCADE,
    user_id UUID REFERENCES app_users(id),
    user_name VARCHAR(255) NOT NULL,
    user_role VARCHAR(30) NOT NULL,
    comment_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================================
-- 8. TABEL AUDIT TRAIL RIWAYAT PERUBAHAN RESMI
-- ========================================================
CREATE TABLE proposal_audit_logs (
    id BIGSERIAL PRIMARY KEY,
    proposal_id VARCHAR(50) NOT NULL REFERENCES budget_proposals(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES app_users(id),
    actor_name VARCHAR(255) NOT NULL,
    actor_role VARCHAR(30) NOT NULL,
    action_type VARCHAR(100) NOT NULL, -- cth: 'CREATE_PROPOSAL', 'BATCH_IMPORT', 'TAPD_DECISION'
    old_status VARCHAR(40),
    new_status VARCHAR(40),
    old_p4 NUMERIC(18, 2) DEFAULT 0,
    new_p4 NUMERIC(18, 2) DEFAULT 0,
    note TEXT,
    ip_address VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================================
-- 9. KEBIJAKAN ROW-LEVEL SECURITY (RLS) POSTGRESQL
-- ========================================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE funding_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE bappeda_supervised_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliberation_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper Function untuk mengetahui Role pengguna saat ini
CREATE OR REPLACE FUNCTION current_user_role() 
RETURNS VARCHAR AS $$
  SELECT role FROM app_users WHERE id = auth.uid();
$$ LANGUAGE sql STABLE;

-- RLS: Sumber Pendanaan (Hanya SUPERUSER & TAPD yang berhak melihat & memutasi)
CREATE POLICY funding_sources_access_policy ON funding_sources
FOR ALL TO authenticated
USING (current_user_role() IN ('SUPERUSER', 'TAPD'))
WITH CHECK (current_user_role() IN ('SUPERUSER', 'TAPD'));

-- RLS: Seleksi Usulan Belanja (Select)
CREATE POLICY proposals_select_policy ON budget_proposals
FOR SELECT TO authenticated
USING (
  -- Superuser & TAPD dapat melihat usulan seluruh OPD
  current_user_role() IN ('SUPERUSER', 'TAPD')
  OR
  -- OPD hanya boleh melihat usulan organisasinya sendiri
  (current_user_role() = 'OPD' AND organization_id = (SELECT organization_id FROM app_users WHERE id = auth.uid()))
  OR
  -- BAPPEDA hanya boleh melihat usulan OPD yang berada dalam penugasan ampuannya
  (current_user_role() = 'BAPPEDA' AND organization_id IN (
      SELECT organization_id FROM bappeda_supervised_organizations WHERE user_id = auth.uid()
  ))
);

-- RLS: Input Usulan Belanja Baru (Insert)
CREATE POLICY proposals_insert_policy ON budget_proposals
FOR INSERT TO authenticated
WITH CHECK (
  current_user_role() IN ('SUPERUSER', 'TAPD')
  OR
  -- OPD hanya boleh menginput atas nama OPD-nya sendiri
  (current_user_role() = 'OPD' AND organization_id = (SELECT organization_id FROM app_users WHERE id = auth.uid()))
  OR
  -- BAPPEDA berhak menginput usulan atas nama OPD binaan ampuannya
  (current_user_role() = 'BAPPEDA' AND organization_id IN (
      SELECT organization_id FROM bappeda_supervised_organizations WHERE user_id = auth.uid()
  ))
);

-- RLS: Penetapan Putusan & Nominal P4 (Update)
CREATE POLICY proposals_update_policy ON budget_proposals
FOR UPDATE TO authenticated
USING (current_user_role() IN ('SUPERUSER', 'TAPD'))
WITH CHECK (current_user_role() IN ('SUPERUSER', 'TAPD'));
```

---

## 4. Struktur Direktori Proyek Modular (Next.js 14 Clean Architecture)

```
sip-anggaran/
├── public/
│   ├── logo-provinsi.png
│   └── templates/
│       └── Template_Import_Usulan_Pagu.csv   # Template CSV standar Excel
├── src/
│   ├── app/                                  # Next.js App Router
│   │   ├── (auth)/
│   │   │   └── login/page.tsx                # Sesi Login, Preset Cepat & Pilih Siklus
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx                    # Header, Session Selector, Deficit Alert Banner
│   │   │   ├── page.tsx                      # Meja Pembahasan (Direct Open-Card View)
│   │   │   ├── kapasitas-fiskal/page.tsx     # Modul Kelola Sumber Kas (TAPD/Superuser)
│   │   │   ├── berita-acara/page.tsx         # Dokumen Berita Acara Cetak (@media print)
│   │   │   └── admin/
│   │   │       └── users/page.tsx            # Portal Manajemen Pengguna (Superuser)
│   │   └── api/
│   │       ├── export/csv/route.ts           # Stream CSV BOM UTF-8 (Pemisah Titik Koma)
│   │       ├── import/proposals/route.ts     # Batch Import Parser & Validator
│   │       └── proposals/[id]/decision/      # Endpoint Putusan TAPD + Log Generator
│   ├── components/
│   │   ├── alerts/
│   │   │   ├── DeficitAlertBanner.tsx        # Banner Merah Menyala jika Sisa Kas < 0
│   │   │   └── ProposalSpikeBadge.tsx        # Peringatan Usulan Naik > 50%
│   │   ├── fiscal/
│   │   │   ├── FiscalMetricsBar.tsx          # 5 Metrik Plafon (Angka Full Rp)
│   │   │   └── FundingSourcesManager.tsx     # Input Teks Bebas + Tabel Komponen Kas
│   │   ├── proposals/
│   │   │   ├── ProposalCard.tsx              # Kartu Usulan Terbuka Penuh (P1-P4 Full Rp)
│   │   │   ├── ProposalTableView.tsx         # Mode Tabel Ringkas Berdensitas Tinggi
│   │   │   ├── NewProposalModal.tsx          # Form Pengajuan (OPD & Bappeda Pengampu)
│   │   │   └── ImportProposalModal.tsx       # Modal Upload CSV + Preview Table
│   │   ├── deliberation/
│   │   │   ├── DiscussionRoomModal.tsx       # Ruang Sidang Meja Bahas
│   │   │   ├── DecisionPanel.tsx             # Panel Form Putusan TAPD + Kalkulator
│   │   │   └── AuditTrailTimeline.tsx        # Visual Timeline Riwayat Status & P4
│   │   ├── admin/
│   │   │   ├── UserTable.tsx                 # Tabel Pengguna + Filter Role
│   │   │   └── UserFormModal.tsx             # Form Akun + Checklist Multi-OPD Bappeda
│   │   └── ui/                               # Komponen Reusable (Button, Modal, Input)
│   ├── lib/
│   │   ├── supabase/                         # Client & Server Helper Supabase
│   │   ├── currency.ts                       # Formatter Angka Full Rupiah (No Abbreviation)
│   │   └── csv-parser.ts                     # Parser CSV Titik Koma (;) & Generator BOM
│   └── types/
│       └── database.ts                       # TypeScript Schema Interface (PRD v1.3.0)
```

---

## 5. Rencana Kerja Bertahap (Sprint Roadmap v1.3.0)

```
[ SPRINT 1: PONDASI ARSITEKTUR, 4 PERAN & SEED 49 OPD ]
  ├── Inisialisasi Next.js 14 App Router, TypeScript, dan Tailwind CSS
  ├── Migrasi DDL SQL v1.3.0: 4 Role, Tabel Junction Bappeda, & Seed 49 Perangkat Daerah
  ├── Sesi Login Berbasis Siklus Anggaran (Murni 2027, Perubahan 2027, Murni 2028)
  └── Portal Manajemen Akun Pengguna (/admin/users) khusus Superuser
                 │
                 ▼
[ SPRINT 2: MEJA USULAN, ANGKA FULL & PERINGATAN LONJAKAN PAGU ]
  ├── Penyajian Kartu Terbuka Penuh dengan 4 Pilar: P1, P2, P3, P4 format Rupiah utuh
  ├── Isolasi data OPD ketat & Pengaktifan Multi-OPD Pengampu untuk peran BAPPEDA
  ├── Deteksi otomatis Lonjakan Pagu (> 50% dari P1) dengan badge visual
  └── Modul Pengajuan Usulan Baru (+ Usulan Baru) untuk OPD dan Bappeda Pengampu
                 │
                 ▼
[ SPRINT 3: ALERT DEFISIT FISKAL, RUANG SIDANG & AUDIT TRAIL TIMELINE ]
  ├── Pembatasan Menu Kapasitas Fiskal (hanya TAPD & Superuser)
  ├── Banner Peringatan Defisit Fiskal berkedip (rose-950) saat Sisa Kas < 0
  ├── Ruang Sidang Pleno: Form Ketuk Palu TAPD & 3 tombol kalkulator rasionalisasi
  └── Panel Visual Audit Trail History Log (mencatat old/new status dan nominal P4)
                 │
                 ▼
[ SPRINT 4: PIPELINE IMPORT/EXPORT EXCEL CSV & BERITA ACARA CETAK ]
  ├── Fitur Ekspor Usulan ke CSV (UTF-8 BOM, delimiter titik koma untuk Microsoft Excel)
  ├── Modal Import Batch Usulan CSV dengan unduh template & pratinjau tabel validasi
  ├── Generator Berita Acara Pleno TAPD (@media print) dengan tanda tangan pimpinan
  └── UAT menyeluruh 4 peran & verifikasi pencegahan regresi UI
```

---

## 6. Panduan *Prompt* per Sprint untuk Agen Antigravity (Lengkap dengan Klausul Pengaman)

Saat menginstruksikan Antigravity, **selalu sisipkan Klausul Pengaman** agar tampilan kartu usulan, warna antarmuka, dan komponen yang sudah Anda modifikasi tidak tertimpa.

### 🛡️ Template Klausul Pengaman Standar
```text
PERHATIAN UNTUK ANTIGRAVITY:
Saya telah melakukan modifikasi visual dan logika pada komponen sebelumnya.
1. JANGAN menimpa (overwrite) atau menghapus penataan antarmuka, komponen kartu usulan, dan styling Tailwind yang telah berjalan.
2. Lakukan penambahan fitur ini secara modular/inkremental (merge/integrate).
3. Pertahankan format penomoran Rupiah utuh (full number) dan aturan keamanan yang telah ditetapkan.
```

---

### 🚀 Prompt Sprint 1: Pondasi Basis Data, 4 Peran & Portal Akun Superadmin

```text
Halo Antigravity. Kita mulai Sprint 1 fase produksi SIP-ANGGARAN berdasarkan PRD v1.3.0 dan DDL di rencana_eksekusi_fase_produksi.md.

[SISIPKAN KLAUSUL PENGAMAN DI SINI]

Tugas Sprint 1:
1. Siapkan DDL migrasi basis data PostgreSQL/Supabase mencakup 4 peran ('SUPERUSER', 'TAPD', 'BAPPEDA', 'OPD'), tabel 'bappeda_supervised_organizations', dan seed data 49 instansi Perangkat Daerah resmi.
2. Bangun modul autentikasi dan seleksi sesi kerja:
   - Pengguna memilih Siklus Anggaran ('Murni 2027', 'Perubahan 2027', 'Murni 2028').
   - Disediakan tombol preset login cepat untuk 4 peran guna memudahkan pengujian.
3. Bangun modul Portal Manajemen Akun Pengguna (`src/app/(dashboard)/admin/users/page.tsx`):
   - Hanya dapat diakses oleh peran 'SUPERUSER'.
   - Fitur CRUD akun pengguna: username, password, nama, jabatan, role, dan penugasan OPD.
   - Khusus peran BAPPEDA: sediakan checklist multi-pilih untuk menentukan OPD ampuannya.
   - Proteksi keamanan: larangan menghapus akun sendiri (self-delete protection).

Silakan jalankan eksekusi Sprint 1 sekarang.
```

---

### 📋 Prompt Sprint 2: Meja Usulan, Format Angka Utuh & Lonjakan Pagu Alert

```text
Halo Antigravity. Lanjutkan ke Sprint 2: Meja Usulan Terbuka, Format Angka Utuh, dan Penugasan Bappeda.

[SISIPKAN KLAUSUL PENGAMAN DI SINI]
Catatan: Pertahankan styling antarmuka kartu usulan terbuka yang sudah ada.

Tugas Sprint 2:
1. Terapkan penamaan 4 pilar pagu anggaran pada seluruh tampilan kartu dan tabel:
   - P1: Pagu Awal
   - P2: Usulan Pagu
   - P3: Total Pagu Diminta (P1 + P2)
   - P4: Pagu Kesepakatan
2. Terapkan fungsi pembacaan angka utuh (full number format) tanpa singkatan 'M' atau 'Jt' (contoh: Rp 1.500.000.000).
3. Implementasikan aturan akses data usulan:
   - OPD: hanya melihat usulan instansinya sendiri.
   - BAPPEDA: hanya melihat usulan OPD yang berada dalam daftar pengampuannya.
   - TAPD & Superuser: melihat seluruh usulan.
4. Buat modal pengajuan usulan baru (`NewProposalModal.tsx`) yang dapat diakses oleh OPD dan Bappeda (Bappeda dapat memilih OPD yang diampunya).
5. Tambahkan komponen badge visual peringatan: `Alert: Lonjakan Usulan (+Rp ...)` jika Usulan Pagu (P2) melebihi 50% dari Pagu Awal (P1).

Silakan kerjakan Sprint 2.
```

---

### ⚖️ Prompt Sprint 3: Alert Defisit Fiskal, Ruang Sidang TAPD & Audit Trail

```text
Halo Antigravity. Lanjutkan ke Sprint 3: Alert Defisit Kas, Ruang Sidang TAPD & Audit Trail History.

[SISIPKAN KLAUSUL PENGAMAN DI SINI]
Catatan: Integrasikan logika audit trail dan alert banner tanpa merusak tata letak dasbor yang telah disetujui.

Tugas Sprint 3:
1. Batasi menu dan widget Kapasitas Fiskal Kas: hanya dapat dilihat dan dikelola oleh peran 'TAPD' dan 'SUPERUSER'. Sembunyikan menu ini untuk BAPPEDA dan OPD.
2. Bangun komponen Banner Peringatan Defisit Fiskal (`DeficitAlertBanner.tsx`):
   - Ditampilkan di bagian atas dasbor dengan warna merah menyala (`rose-950`) apabila Sisa Kapasitas Kas < 0.
   - Menampilkan angka selisih nominal defisit secara real-time.
3. Sempurnakan modal Ruang Sidang Pembahasan (`DiscussionRoomModal.tsx`):
   - Panel Form Penetapan Putusan TAPD: input nominal P4 dan 3 tombol kalkulator rasionalisasi (Setuju 100%, Pangkas 50%, Tolak Rp 0). Khusus TAPD & Superuser.
   - Panel Visual Audit Trail History Log: menampilkan riwayat perubahan status usulan, nilai P4 lama vs baru, nama pengubah, peran, catatan putusan, dan stempel waktu.
4. Pastikan setiap eksekusi putusan TAPD otomatis mencatat rekaman baru ke tabel `proposal_audit_logs`.

Silakan implementasikan Sprint 3.
```

---

### 📄 Prompt Sprint 4: Import/Export Excel CSV & Berita Acara Pleno Cetak

```text
Halo Antigravity. Lanjutkan ke Sprint 4: Fitur Import/Export Excel CSV dan Finalisasi Berita Acara Cetak.

[SISIPKAN KLAUSUL PENGAMAN DI SINI]

Tugas Sprint 4:
1. Bangun fitur Ekspor Data ke Excel/CSV (`/api/export/csv`):
   - Menghasilkan berkas CSV ber-BOM UTF-8 dengan pemisah titik koma (`;`) agar langsung rapi dibuka di Microsoft Excel.
   - Menyertakan seluruh kolom usulan: ID, OPD, Kategori, Prioritas, Program, Kegiatan, P1, P2, P3, P4, Status, Target Output, dan Urgensi.
2. Bangun modal Import Usulan Batch (`ImportProposalModal.tsx`):
   - Fasilitas unduh file `Template_Import_Usulan_Pagu.csv`.
   - Unggah berkas CSV dengan pratinjau tabel validasi (*Preview Table*) sebelum data disimpan ke basis data.
3. Sempurnakan dokumen cetak Berita Acara Pleno TAPD (`/berita-acara`):
   - Layout resmi administrasi pemerintahan daerah dengan format angka utuh.
   - Total akumulasi belanja (P1, P2, P4) dan sisa kapasitas fiskal.
   - Blok tanda tangan Kepala Bappeda Provinsi dan Sekretaris Daerah selaku Ketua TAPD.
   - Konfigurasi `@media print` yang bersih dari elemen antarmuka web.

Silakan tuntaskan Sprint 4.
```

---

## 7. Rencana Pengujian & Checklist Verifikasi UAT (Acceptance Criteria)

Sebelum peluncuran ke ruang sidang TAPD sesungguhnya, lakukan verifikasi mandiri atas 8 skenario berikut:

1. [ ] **Verifikasi Akun Superuser**: Buat akun pengguna baru dengan peran BAPPEDA, lalu beri checklist 3 OPD ampuannya. Pastikan akun tersebut hanya dapat melihat 3 OPD tersebut.
2. [ ] **Verifikasi Isolasi OPD**: Masuk sebagai OPD (contoh: *Dinas Kesehatan*). Pastikan usulan *Dinas Bina Marga* sama sekali tidak muncul di kartu, tabel, maupun hasil pencarian.
3. [ ] **Verifikasi Menu Kas Fiskal**: Masuk sebagai OPD dan BAPPEDA. Pastikan tombol/menu kelola kapasitas fiskal kas tersembunyi dan rute URL terproteksi (*forbidden*).
4. [ ] **Verifikasi Alert Defisit**: Tambahkan usulan belanja hingga nominal persetujuan TAPD melampaui kapasitas kas. Pastikan *Banner Merah Defisit* muncul di bagian atas dasbor.
5. [ ] **Verifikasi Alert Lonjakan Pagu**: Buat usulan dengan $P_1 = \text{Rp } 1.000.000.000$ dan $P_2 = \text{Rp } 800.000.000$ (> 50%). Pastikan badge *Lonjakan Usulan* muncul.
6. [ ] **Verifikasi Audit Trail**: Lakukan perubahan putusan TAPD dari *Diajukan* ke *Disetujui Parsial*. Buka modal sidang dan periksa apakah rekaman perubahan status dan mutasi nominal $P_4$ tercatat di panel timeline.
7. [ ] **Verifikasi Format Angka Utuh**: Periksa apakah seluruh tampilan di dasbor, kartu, modal, dan tabel menggunakan format Rupiah utuh (misal: `Rp 2.500.000.000`) tanpa singkatan `M`/`Jt`.
8. [ ] **Verifikasi Import/Export Excel**: Ekspor usulan ke file CSV, lalu buka di Microsoft Excel. Pastikan tidak ada karakter aneh (*encoding issues*) dan kolom terpisah rapi dengan delimiter titik koma.