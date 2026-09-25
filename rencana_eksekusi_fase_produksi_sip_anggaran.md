# Rencana Aksi & Panduan Teknis Transisi Fase Produksi: SIP-ANGGARAN

Dokumen ini menjadi cetak biru (*blueprint*) operasional bagi tim pengembang dan agen cerdas **Antigravity** untuk mengubah prototipe visual SIP-ANGGARAN menjadi aplikasi produksi *enterprise* multi-instansi yang aman, terisolasi, dan siap pakai pada sidang TAPD.

---

## 1. Rangkuman Target Fase Produksi

| Aspek | Kondisi Prototipe (Fase 1) | Target Produksi (Fase 2) |
| :--- | :--- | :--- |
| **Penyimpanan Data** | Variabel JavaScript *in-memory* & *localStorage* lokal | Basis data relasional PostgreSQL dengan jaminan ACID |
| **Isolasi OPD** | Filter logika tampilan di antarmuka (DOM / client-side) | *Row-Level Security* (RLS) langsung di level basis data |
| **Akses Konkurensi** | Hanya di 1 laptop penguji peramban | Puluhan OPD dan TAPD dapat input dan telaah serentak |
| **Otorisasi & Akun** | Pengalihan role bebas via tombol dropdown | Autentikasi sesi berbasis JWT / Role resmi ASN terverifikasi |
| **Audit Jejak Data** | Komentar simulasi sementara | Tabel riwayat mutasi nilai pagu, IP address, dan *audit log* |

---

## 2. Pilihan *Tech Stack* & Lingkungan *Deployment*

Pilih salah satu dari 2 skenario lingkungan infrastruktur berikut sesuai kebijakan Diskominfo / Pemda Anda:

### Skenario A: Modern Serverless / BaaS (Paling Cepat dieksekusi di Antigravity)
* **Frontend**: Next.js 14+ (App Router, TypeScript) + Tailwind CSS + Lucide Icons.
* **Backend & Database**: **Supabase** (Managed PostgreSQL, Auth, Realtime WebSocket, dan Storage dokumen proposal).
* **Kelebihan**: Waktu pembangunan 3–5 kali lebih cepat karena autentikasi dan isolasi RLS sudah *built-in*.

### Skenario B: On-Premise Pusat Data Pemda / Diskominfo (Mandiri Penuh)
* **Frontend**: React (Vite / Next.js) + Tailwind CSS.
* **Backend**: Node.js (NestJS / Fastify / Express) atau Go (Fiber).
* **Database**: PostgreSQL 15+ murni terpasang di peladen lokal Pemda.
* **Container**: Docker & Docker Compose untuk kemudahan instalasi oleh tim teknis Diskominfo.

---

## 3. Skema Basis Data Relasional & Keamanan (DDL SQL)

Jalankan skrip DDL SQL berikut pada basis data PostgreSQL untuk membentuk struktur data resmi:

```sql
-- 1. Tabel Master Siklus & Tahun Anggaran
CREATE TABLE fiscal_cycles (
    id VARCHAR(50) PRIMARY KEY, -- cth: 'murni-2027', 'perubahan-2027'
    label VARCHAR(100) NOT NULL, -- cth: 'Murni 2027'
    cycle_type VARCHAR(20) NOT NULL CHECK (cycle_type IN ('Murni', 'Perubahan')),
    fiscal_year INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabel Master Pengguna & Organisasi Perangkat Daerah (OPD)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL, -- Kode Unit SIPD / Renja
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) DEFAULT 'OPD',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE app_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    nip VARCHAR(30),
    role VARCHAR(30) NOT NULL CHECK (role IN ('TAPD', 'BAPPEDA', 'OPD')),
    organization_id UUID REFERENCES organizations(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabel Komponen Sumber Kas Pembentuk Kapasitas Fiskal
CREATE TABLE funding_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cycle_id VARCHAR(50) REFERENCES fiscal_cycles(id) ON DELETE CASCADE,
    source_name VARCHAR(255) NOT NULL,
    amount NUMERIC(18, 2) NOT NULL CHECK (amount >= 0),
    legal_basis TEXT,
    input_date DATE DEFAULT CURRENT_DATE,
    created_by UUID REFERENCES app_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabel Usulan Belanja Daerah
CREATE TABLE budget_proposals (
    id VARCHAR(50) PRIMARY KEY, -- Format: USL-2027M-001
    cycle_id VARCHAR(50) REFERENCES fiscal_cycles(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('Penambahan Pagu OPD', 'Belanja Hibah', 'Bantuan Sosial (Bansos)')),
    priority VARCHAR(50) NOT NULL CHECK (priority IN ('Prioritas 1 (Wajib)', 'Prioritas 2 (RPJMD)', 'Prioritas 3 (Reguler)')),
    program_name VARCHAR(255) NOT NULL,
    activity_name VARCHAR(255) NOT NULL,
    sub_activity_name VARCHAR(255),
    initial_budget NUMERIC(18, 2) DEFAULT 0, -- P1
    proposed_addition NUMERIC(18, 2) NOT NULL CHECK (proposed_addition > 0), -- P2
    approved_budget NUMERIC(18, 2) DEFAULT 0, -- P4 (Putusan TAPD)
    status VARCHAR(40) DEFAULT 'Diajukan' CHECK (status IN ('Diajukan', 'Sedang Dibahas', 'Disetujui', 'Disetujui Parsial', 'Perlu Revisi', 'Ditolak')),
    target_output TEXT NOT NULL,
    urgency_justification TEXT NOT NULL,
    attachment_url TEXT,
    attachment_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabel Catatan Pembahasan & Telaah Sidang Pleno
CREATE TABLE deliberation_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_id VARCHAR(50) REFERENCES budget_proposals(id) ON DELETE CASCADE,
    user_id UUID REFERENCES app_users(id),
    user_name VARCHAR(255) NOT NULL,
    user_role VARCHAR(30) NOT NULL,
    comment_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Tabel Rekam Jejak Audit (Audit Trail Compliance BPK/Inspektorat)
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    proposal_id VARCHAR(50),
    actor_id UUID REFERENCES app_users(id),
    action VARCHAR(100) NOT NULL,
    old_value JSONB,
    new_value JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Penerapan Kebijakan Row-Level Security (RLS) PostgreSQL
```sql
ALTER TABLE budget_proposals ENABLE ROW LEVEL SECURITY;

-- Aturan 1: OPD hanya boleh membaca usulannya sendiri
CREATE POLICY opd_isolation_select_policy ON budget_proposals
FOR SELECT TO authenticated
USING (
  (SELECT role FROM app_users WHERE id = auth.uid()) IN ('TAPD', 'BAPPEDA')
  OR 
  organization_id = (SELECT organization_id FROM app_users WHERE id = auth.uid())
);

-- Aturan 2: OPD hanya boleh menginput usulan atas nama organisasinya sendiri
CREATE POLICY opd_isolation_insert_policy ON budget_proposals
FOR INSERT TO authenticated
WITH CHECK (
  organization_id = (SELECT organization_id FROM app_users WHERE id = auth.uid())
);

-- Aturan 3: Hanya TAPD yang boleh memutasi nominal persetujuan & status putusan
CREATE POLICY tapd_update_policy ON budget_proposals
FOR UPDATE TO authenticated
USING (
  (SELECT role FROM app_users WHERE id = auth.uid()) = 'TAPD'
);
```

---

## 4. Struktur Direktori Proyek Modular (Frontend & Backend)

Rekomendasi struktur direktori bersih (*Clean Architecture*) untuk repositori proyek di Antigravity:

```
sip-anggaran/
├── public/
│   ├── logo-provinsi.png
│   └── favicon.ico
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/
│   │   │   └── login/page.tsx        # Layar Masuk Akun ASN & Pemilihan Sesi
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx            # Header, Session Selector, & RBAC Guard
│   │   │   ├── page.tsx              # Meja Pembahasan Utama (Kartu Usulan)
│   │   │   ├── kapasitas-fiskal/     # Modul Kelola Sumber Kas TAPD
│   │   │   └── berita-acara/         # Dokumen Resmi Siap Cetak
│   │   └── api/                      # Endpoint Server / Webhook
│   ├── components/
│   │   ├── fiscal/
│   │   │   ├── FiscalMetricsBar.tsx  # 5 Indikator Plafon Kas & Defisit
│   │   │   └── SourceHistoryTable.tsx
│   │   ├── proposals/
│   │   │   ├── ProposalCard.tsx      # Tampilan Kartu Terbuka Penuh
│   │   │   ├── ProposalTableView.tsx # Mode Tabel Ringkas
│   │   │   └── NewProposalModal.tsx  # Form Input Usulan Belanja
│   │   ├── deliberation/
│   │   │   ├── DiscussionRoom.tsx    # Kolom Diskusi & Telaah Bappeda
│   │   │   └── DecisionPanel.tsx     # Form Ketuk Palu TAPD + Kalkulator
│   │   └── ui/                       # Komponen Dasar (Button, Badge, Modal)
│   ├── lib/
│   │   ├── supabase/                 # Client & Server DB Connection
│   │   ├── currency.ts               # Format Rupiah & Fungsi Terbilang
│   │   └── permissions.ts            # RBAC Rule Helpers
│   └── types/
│       └── database.ts               # Tipe TypeScript hasil generate Supabase
├── middleware.ts                     # Proteksi Route Berdasarkan Sesi Akun
├── package.json
└── tailwind.config.ts
```

---

## 5. Rencana Kerja Bertahap (Sprint Roadmap untuk Antigravity)

Eksekusi pengembangan sebaiknya dibagi menjadi 4 sprint terstruktur agar dapat diuji secara bertahap:

```
[ Sprint 1: Pondasi Basis Data & Autentikasi ]
  ├── Setup repositori Next.js + Tailwind + Database PostgreSQL
  ├── Migrasi DDL skema tabel & implementasi aturan RLS
  └── Form Login dengan autentikasi akun & seleksi siklus aktif
                 │
                 ▼
[ Sprint 2: Isolasi Data OPD & Manajemen Usulan ]
  ├── Halaman Meja Usulan dengan 2 tampilan (Kartu Terbuka vs Tabel)
  ├── Form pengajuan usulan baru dengan unggah dokumen PDF/DOCX
  └── Pengujian isolasi: verifikasi OPD lain tidak bisa melihat data
                 │
                 ▼
[ Sprint 3: Mesin Kapasitas Kas & Ruang Sidang TAPD ]
  ├── Modul input bebas sumber pendanaan & tabel riwayat kas
  ├── Sinkronisasi kalkulator rasionalisasi (Pangkas 50%, Tolak, Setuju)
  └── Forum catatan telaah berjenjang (TAPD, Bappeda, OPD)
                 │
                 ▼
[ Sprint 4: Berita Acara, Realtime Sync & UAT Sidang ]
  ├── Generator Berita Acara cetak resmi dengan total kalkulasi
  ├── Integrasi WebSocket realtime saat ketuk palu sidang berlangsung
  └── Simulasi sidang pleno TAPD bersama pimpinan & UAT
```

---

## 6. Contoh Panduan *Prompt* per Sprint untuk Agen Antigravity

Gunakan urutan instruksi (*prompts*) berikut saat memerintahkan Antigravity untuk menulis kode aplikasi:

### Prompt Sprint 1 (Inisialisasi Project & Database Migration):
> *"Inisialisasi proyek SIP-ANGGARAN menggunakan Next.js 14 (App Router, TypeScript, Tailwind CSS). Rancang skema database menggunakan Supabase/PostgreSQL berdasarkan DDL yang ada di rencana_eksekusi_fase_produksi.md. Buat modul autentikasi dan seleksi sesi tahun anggaran yang memvalidasi peran pengguna (TAPD, BAPPEDA, atau OPD) serta mengikat pengguna OPD ke organization_id masing-masing."*

### Prompt Sprint 2 (Komponen UI Kartu Terbuka & Formulir Usulan):
> *"Berdasarkan PRD SIP-ANGGARAN, bangun komponen `ProposalCard` yang menyajikan data usulan secara langsung dan terbuka (menampilkan 4 pilar pagu anggaran P1-P4, target output fisik, justifikasi urgensi tanpa line-clamp, dan berkas lampiran). Terapkan logika penyaringan di mana pengguna dengan peran OPD hanya diizinkan mengambil data usulan miliknya sendiri."*

### Prompt Sprint 3 (Mesin Kas Fiskal & Modul Ketuk Palu TAPD):
> *"Implementasikan modul pengelolaan sumber pendanaan kas TAPD dengan input bebas teks dan tabel histori sumber dana. Kemudian buat modal ruang sidang pembahasan TAPD yang dilengkapi kalkulator rasionalisasi cepat (Setuju 100%, 50%, Tolak Rp 0) yang hanya dapat diubah oleh peran TAPD, sedangkan peran BAPPEDA hanya dapat menambahkan catatan telaah keselarasan target RPJMD."*

### Prompt Sprint 4 (Berita Acara Cetak & Pelaporan):
> *"Bangun modul cetak Berita Acara Hasil Pembahasan Sidang Pleno TAPD. Pastikan dokumen memiliki tata letak formal pemerintah daerah, tabel komparasi usulan lengkap dengan baris total belanja, format media cetak (@media print) yang bersih dari tombol navigasi, serta blok tanda tangan digital Kepala Bappeda dan Sekretaris Daerah selaku Ketua TAPD."*

---

## 7. Langkah Aksi Pertama yang Harus Anda Lakukan Sekarang

1. **Tentukan Tempat Hosting / Database**:
   - Jika ingin langsung memulai tanpa konfigurasi server rumit, buat proyek gratis/pro di [Supabase.com](https://supabase.com) dan salin kredensial *API URL* & *Anon Key*.
   - Jika diwajibkan *on-premise*, minta tim IT Diskominfo menyiapkan satu instansi PostgreSQL dan Node.js server.
2. **Jalankan Skrip DDL**:
   - Salin blok kode SQL di Bagian 3 ke dalam SQL Editor database Anda untuk membuat seluruh tabel dan aturan keamanan RLS.
3. **Mulai Perintahkan Antigravity**:
   - Berikan berkas `prd_sip_anggaran.md` bersama `rencana_eksekusi_fase_produksi.md` ini kepada Antigravity, lalu mulai dengan mengeksekusi **Prompt Sprint 1**.