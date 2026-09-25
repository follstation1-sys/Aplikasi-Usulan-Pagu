-- ====================================================================
-- SIP-ANGGARAN PRODUCTION DATABASE MIGRATION SCRIPT (v1.3.0 - SPRINT 1)
-- Target Database: PostgreSQL 15+ / Supabase BaaS
-- Author: Antigravity / BAPPEDA 2026
-- ====================================================================

-- Enable Extension for UUID Generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========================================================
-- 1. TABEL MASTER SIKLUS ANGGARAN (FISCAL CYCLES)
-- ========================================================
CREATE TABLE IF NOT EXISTS fiscal_cycles (
    id VARCHAR(50) PRIMARY KEY, -- e.g. 'murni-2027', 'perubahan-2027', 'murni-2028'
    label VARCHAR(100) NOT NULL, -- e.g. 'Murni 2027'
    cycle_type VARCHAR(20) NOT NULL CHECK (cycle_type IN ('Murni', 'Perubahan')),
    fiscal_year INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed Initial Cycles
INSERT INTO fiscal_cycles (id, label, cycle_type, fiscal_year, is_active) VALUES
('murni-2027', 'APBD Murni 2027', 'Murni', 2027, true),
('perubahan-2027', 'APBD Perubahan 2027', 'Perubahan', 2027, false),
('murni-2028', 'APBD Murni 2028', 'Murni', 2028, false)
ON CONFLICT (id) DO NOTHING;

-- ========================================================
-- 2. TABEL MASTER ORGANISASI (49 PERANGKAT DAERAH)
-- ========================================================
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL, -- Kode Unit SKPD SIPD
    name VARCHAR(255) NOT NULL,       -- Nama lengkap Perangkat Daerah
    alias VARCHAR(100),               -- Nama singkatan
    category VARCHAR(50) DEFAULT 'OPD',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed Master List of 49 Perangkat Daerah
INSERT INTO organizations (code, name, alias) VALUES
('OPD-001', 'Dinas Pendidikan Dan Kebudayaan', 'Disdikbud'),
('OPD-002', 'Dinas Kesehatan', 'Dinkes'),
('OPD-003', 'Rumah Sakit Umum Daerah Bandar Negara Husada', 'RSUD BNH'),
('OPD-004', 'Rumah Sakit Umum Daerah dr. Abdul Moeloek', 'RSUD AM'),
('OPD-005', 'Rumah Sakit Jiwa', 'RS Jiwa'),
('OPD-006', 'Dinas Bina Marga dan Bina Konstruksi', 'Dinas BMBK'),
('OPD-007', 'Dinas Pengelolaan Sumber Daya Air', 'Dinas PSDA'),
('OPD-008', 'Dinas Perumahan, Kawasan Permukiman dan Cipta Karya', 'Dinas PKPCK'),
('OPD-009', 'Satuan Polisi Pamong Praja', 'Satpol PP'),
('OPD-010', 'Badan Penanggulangan Bencana Daerah', 'BPBD'),
('OPD-011', 'Dinas Sosial', 'Dinsos'),
('OPD-012', 'Dinas Tenaga Kerja', 'Disnaker'),
('OPD-013', 'Dinas Pemberdayaan Perempuan dan Perlindungan Anak', 'Dinas PPPA'),
('OPD-014', 'Dinas Lingkungan Hidup', 'DLH'),
('OPD-015', 'Dinas Kependudukan dan Pencatatan Sipil', 'Disdukcapil'),
('OPD-016', 'Dinas Pemberdayaan Masyarakat, Desa dan Transmigrasi', 'DPMDT'),
('OPD-017', 'Dinas Perhubungan', 'Dishub'),
('OPD-018', 'Dinas Komunikasi, Informatika dan Statistik', 'Diskominfotik'),
('OPD-019', 'Dinas Koperasi, Usaha Kecil dan Menengah', 'Diskop UKM'),
('OPD-020', 'Dinas Penanaman Modal dan Pelayanan Terpadu Satu Pintu', 'DPMPTSP'),
('OPD-021', 'Dinas Pemuda dan Olahraga', 'Dispora'),
('OPD-022', 'Dinas Perpustakaan dan Kearsipan', 'Dispusip'),
('OPD-023', 'Dinas Kelautan dan Perikanan', 'DKP'),
('OPD-024', 'Dinas Pariwisata dan Ekonomi Kreatif', 'Disparekraf'),
('OPD-025', 'Dinas Ketahanan Pangan, Tanaman Pangan dan Hortikultura', 'DKPTPH'),
('OPD-026', 'Dinas Perkebunan', 'Disbun'),
('OPD-027', 'Dinas Peternakan dan Kesehatan Hewan', 'Disnakkeswan'),
('OPD-028', 'Dinas Kehutanan', 'Dishut'),
('OPD-029', 'Dinas Energi dan Sumber Daya Mineral', 'ESDM'),
('OPD-030', 'Dinas Perindustrian dan Perdagangan', 'Disperindag'),
('OPD-031', 'Badan Perencanaan Pembangunan Daerah', 'Bappeda'),
('OPD-032', 'Badan Pengelola Keuangan dan Aset Daerah', 'BPKAD'),
('OPD-033', 'Badan Pendapatan Daerah', 'Bapenda'),
('OPD-034', 'Badan Kepegawaian Daerah', 'BKD'),
('OPD-035', 'Badan Pengembangan Sumber Daya Manusia', 'BPSDM'),
('OPD-036', 'Badan Riset dan Inovasi Daerah', 'Brida'),
('OPD-037', 'Badan Penghubung', 'Bapeng'),
('OPD-038', 'Sekretariat Daerah', 'Setda'),
('OPD-039', 'Sekretariat DPRD', 'Setwan'),
('OPD-040', 'Inspektorat', 'Inspektorat'),
('OPD-041', 'Badan Kesatuan Bangsa Dan Politik Daerah', 'Bakesbangpol'),
('OPD-042', 'Dinas Pemberdayaan Masyarakat dan Kelurahan', 'DPMK'),
('OPD-043', 'Dinas Pengendalian Penduduk dan KB', 'DPPKB'),
('OPD-044', 'Dinas Komunikasi dan Informatika', 'Diskominfo'),
('OPD-045', 'Dinas Perdagangan', 'Disdag'),
('OPD-046', 'Dinas Perindustrian', 'Disperin'),
('OPD-047', 'Dinas Transmigrasi dan Tenaga Kerja', 'Distransnaker'),
('OPD-048', 'Dinas Ketahanan Pangan', 'DKP'),
('OPD-049', 'Dinas Pemadam Kebakaran dan Penyelamatan', 'Damkar')
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, alias = EXCLUDED.alias;

-- ========================================================
-- 3. TABEL PENGGUNA SISTEM (APP_USERS - 4 ROLES RBAC)
-- ========================================================
CREATE TABLE IF NOT EXISTS app_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    title VARCHAR(150), -- Jabatan resmi ASN
    nip VARCHAR(30),
    role VARCHAR(30) NOT NULL CHECK (role IN ('SUPERUSER', 'TAPD', 'BAPPEDA', 'OPD')),
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL, -- OPD asal (jika role = OPD)
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================================
-- 4. TABEL JUNCTION MULTI-OPD PENGAMPU BAPPEDA
-- ========================================================
CREATE TABLE IF NOT EXISTS bappeda_supervised_organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_bappeda_org UNIQUE (user_id, organization_id)
);

-- ========================================================
-- 5. TABEL KOMPONEN SUMBER KAS FISKAL (HANYA TAPD & SUPERUSER)
-- ========================================================
CREATE TABLE IF NOT EXISTS funding_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cycle_id VARCHAR(50) NOT NULL REFERENCES fiscal_cycles(id) ON DELETE CASCADE,
    source_name VARCHAR(255) NOT NULL, -- Dynamic input: PAD, SiLPA, DAU, etc.
    amount NUMERIC(18, 2) NOT NULL CHECK (amount >= 0),
    legal_basis TEXT,
    input_date DATE DEFAULT CURRENT_DATE,
    created_by UUID REFERENCES app_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================================
-- 6. TABEL USULAN BELANJA (BUDGET_PROPOSALS)
-- ========================================================
CREATE TABLE IF NOT EXISTS budget_proposals (
    id VARCHAR(50) PRIMARY KEY, -- Format: USL-2027M-001
    cycle_id VARCHAR(50) NOT NULL REFERENCES fiscal_cycles(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    category VARCHAR(50) NOT NULL CHECK (category IN ('Penambahan Pagu OPD', 'Belanja Hibah', 'Bantuan Sosial (Bansos)')),
    priority VARCHAR(50) NOT NULL CHECK (priority IN ('Prioritas 1 (Wajib)', 'Prioritas 2 (RPJMD)', 'Prioritas 3 (Reguler)')),
    program_name VARCHAR(255),
    activity_name VARCHAR(255) NOT NULL,
    sub_activity_name VARCHAR(255),
    initial_budget NUMERIC(18, 2) DEFAULT 0,    -- P1: Pagu Awal (Full Number Rp)
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

-- Helper View P3 & Alert Lonjakan Pagu (> 50% dari Pagu Awal)
CREATE OR REPLACE VIEW v_budget_proposals AS
SELECT 
    p.*,
    (p.initial_budget + p.proposed_addition) AS total_requested_budget, -- P3
    CASE 
        WHEN p.initial_budget > 0 AND (p.proposed_addition / p.initial_budget) > 0.5 THEN TRUE
        ELSE FALSE 
    END AS is_spike_alert
FROM budget_proposals p;

-- ========================================================
-- 7. TABEL FORUM CATATAN TELAAH BERJENJANG
-- ========================================================
CREATE TABLE IF NOT EXISTS deliberation_comments (
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
CREATE TABLE IF NOT EXISTS proposal_audit_logs (
    id BIGSERIAL PRIMARY KEY,
    proposal_id VARCHAR(50) NOT NULL REFERENCES budget_proposals(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES app_users(id),
    actor_name VARCHAR(255) NOT NULL,
    actor_role VARCHAR(30) NOT NULL,
    action_type VARCHAR(100) NOT NULL, -- 'CREATE_PROPOSAL', 'BATCH_IMPORT', 'TAPD_DECISION'
    old_status VARCHAR(40),
    new_status VARCHAR(40),
    old_p4 NUMERIC(18, 2) DEFAULT 0,
    new_p4 NUMERIC(18, 2) DEFAULT 0,
    note TEXT,
    ip_address VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================================
-- 9. ROW-LEVEL SECURITY (RLS) POLICIES
-- ========================================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE funding_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE bappeda_supervised_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliberation_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper Function: Get Role of Current Authenticated User
CREATE OR REPLACE FUNCTION current_user_role() 
RETURNS VARCHAR AS $$
  SELECT role FROM app_users WHERE id = auth.uid();
$$ LANGUAGE sql STABLE;

-- RLS: Funding Sources (Only SUPERUSER & TAPD)
DROP POLICY IF EXISTS funding_sources_access_policy ON funding_sources;
CREATE POLICY funding_sources_access_policy ON funding_sources
FOR ALL TO authenticated
USING (current_user_role() IN ('SUPERUSER', 'TAPD'))
WITH CHECK (current_user_role() IN ('SUPERUSER', 'TAPD'));

-- RLS: Proposals Select Access Policy
DROP POLICY IF EXISTS proposals_select_policy ON budget_proposals;
CREATE POLICY proposals_select_policy ON budget_proposals
FOR SELECT TO authenticated
USING (
  -- Superuser & TAPD can view all OPD proposals
  current_user_role() IN ('SUPERUSER', 'TAPD')
  OR
  -- OPD can only view their own organization's proposals
  (current_user_role() = 'OPD' AND organization_id = (SELECT organization_id FROM app_users WHERE id = auth.uid()))
  OR
  -- BAPPEDA can view proposals from their supervised OPD list
  (current_user_role() = 'BAPPEDA' AND organization_id IN (
      SELECT organization_id FROM bappeda_supervised_organizations WHERE user_id = auth.uid()
  ))
);

-- RLS: Proposals Insert Policy
DROP POLICY IF EXISTS proposals_insert_policy ON budget_proposals;
CREATE POLICY proposals_insert_policy ON budget_proposals
FOR INSERT TO authenticated
WITH CHECK (
  current_user_role() IN ('SUPERUSER', 'TAPD')
  OR
  (current_user_role() = 'OPD' AND organization_id = (SELECT organization_id FROM app_users WHERE id = auth.uid()))
  OR
  (current_user_role() = 'BAPPEDA' AND organization_id IN (
      SELECT organization_id FROM bappeda_supervised_organizations WHERE user_id = auth.uid()
  ))
);

-- RLS: Proposals Decision & P4 Update Policy (Only TAPD & SUPERUSER)
DROP POLICY IF EXISTS proposals_update_policy ON budget_proposals;
CREATE POLICY proposals_update_policy ON budget_proposals
FOR UPDATE TO authenticated
USING (current_user_role() IN ('SUPERUSER', 'TAPD'))
WITH CHECK (current_user_role() IN ('SUPERUSER', 'TAPD'));
