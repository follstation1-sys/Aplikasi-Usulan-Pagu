/**
 * Database Interfaces & Schema Definitions for SIP-ANGGARAN v1.3.0
 * Based on prd_sip_anggaran.md v1.3.0 & rencana_eksekusi_fase_produksi_sip_anggaran.md
 */

// 1. Roles & Permissions
export type AppRole = 'SUPERUSER' | 'TAPD' | 'BAPPEDA' | 'OPD';
export type CycleType = 'Murni' | 'Perubahan';
export type ProposalCategory = 'Penambahan Pagu OPD' | 'Belanja Hibah' | 'Bantuan Sosial (Bansos)';
export type ProposalPriority = 'Prioritas 1 (Wajib)' | 'Prioritas 2 (RPJMD)' | 'Prioritas 3 (Reguler)';
export type ProposalStatus = 'Diajukan' | 'Sedang Dibahas' | 'Disetujui' | 'Disetujui Parsial' | 'Perlu Revisi' | 'Ditolak';

// 2. Entitas Sesi Siklus Anggaran (Fiscal Cycle)
export interface FiscalCycle {
  id: string; // e.g. 'murni-2027', 'perubahan-2027', 'murni-2028'
  label: string; // e.g. 'Murni 2027'
  type: CycleType;
  year: number;
  isActive: boolean;
  createdAt: string;
}

// 3. Entitas Master Organisasi / 49 Perangkat Daerah (Organization)
export interface Organization {
  id: string; // UUID
  code: string; // SKPD Code
  name: string; // Full OPD name e.g. 'Dinas Kesehatan'
  alias?: string; // Short name
  category?: string;
  createdAt?: string;
}

// 4. Entitas Akun Pengguna System User (User Account)
export interface UserAccount {
  id?: string; // UUID
  username: string;
  password?: string;
  fullName: string;
  title?: string; // Jabatan ASN
  nip?: string;
  role: AppRole;
  organizationId?: string; // Assigned OPD ID if role === 'OPD'
  opd?: string; // OPD name helper
  opdList?: string[]; // Multi-OPD supervised list for BAPPEDA role
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// 5. Entitas Penugasan Multi-OPD Pengampu BAPPEDA (Junction Entity)
export interface BappedaSupervisedOrg {
  id: string;
  userId: string;
  organizationId: string;
  assignedAt: string;
}

// 6. Entitas Komponen Sumber Dana Kas (Funding Source)
export interface FundingSource {
  id: string;
  cycleId: string;
  sourceName: string; // Dynamic free text input: SiLPA BPK, PAD, DAU, etc.
  amount: number; // IDR full number
  legalBasis?: string;
  inputDate?: string;
  createdBy?: string;
  createdAt?: string;
}

// 7. Entitas Audit Trail History Log (Proposal Audit Log)
export interface AuditHistoryLog {
  id?: string | number;
  proposalId: string;
  actorId?: string;
  actorName: string;
  actorRole: AppRole | string;
  actionType: string; // e.g. 'CREATE_PROPOSAL', 'BATCH_IMPORT', 'TAPD_DECISION'
  oldStatus: string;
  newStatus: string;
  oldP4: number; // Pagu Kesepakatan before change
  newP4: number; // Pagu Kesepakatan after change
  note: string;
  ipAddress?: string;
  timestamp: string;
}

// 8. Entitas Catatan Telaah Forum (Deliberation Comment)
export interface DeliberationComment {
  id: string;
  proposalId: string;
  userId?: string;
  author: string;
  role: AppRole | string;
  time: string;
  text: string;
}

// 9. Entitas Usulan Belanja Utama (Budget Proposal)
export interface BudgetProposal {
  id: string; // Format e.g. 'USL-2027M-001'
  cycleId: string;
  organizationId?: string;
  opd: string; // OPD Name
  category: ProposalCategory;
  priority: ProposalPriority;
  programName?: string;
  activityName: string;
  subActivityName: string;
  initialBudget: number; // P1: Pagu Awal
  proposedAddition: number; // P2: Usulan Pagu
  approvedBudget: number; // P4: Pagu Kesepakatan (Ketuk Palu TAPD)
  status: ProposalStatus;
  targetOutput: string;
  urgencyJustification: string;
  attachment?: {
    name: string;
    size: string;
    url?: string;
  } | null;
  createdBy?: string;
  tanggalInput: string;
  comments: DeliberationComment[];
  history?: AuditHistoryLog[];
}

// 10. Computations & Dashboard Aggregates
export interface FiscalMetrics {
  totalCapacity: number;
  totalAllocated: number;
  remainingCapacity: number;
  totalRequested: number;
  pendingCount: number;
  approvedCount: number;
  isDeficit: boolean;
}

// 11. State System Context Interface
export interface FiscalSystemState {
  activeCycleId: string;
  currentUserRole: AppRole;
  currentAuthUser: UserAccount;
  currentOpdUser: string;
  activeViewMode: 'detailed' | 'compact';
  cycles: Record<string, {
    sumberDanaList: FundingSource[];
    proposals: BudgetProposal[];
  }>;
}
