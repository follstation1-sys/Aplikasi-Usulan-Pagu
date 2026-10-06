/**
 * Supabase Service Integration Layer - SIP-ANGGARAN v1.3.0
 * Path: src/lib/supabaseService.ts
 * Provides full CRUD integration for Supabase PostgreSQL Database tables
 */

import { supabase, isSupabaseConfigured } from './supabaseClient';
import { BudgetProposal, Organization, FundingSource, DeliberationComment, UserAccount } from '../types/database';

// ═══════════════════════════════════════════════════════════
// 1. ORGANIZATIONS (MASTER OPD)
// ═══════════════════════════════════════════════════════════

export async function fetchOrganizationsFromSupabase(): Promise<Organization[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .order('code', { ascending: true });

    if (error) {
      console.error('Error fetching organizations from Supabase:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('Unexpected error fetching organizations:', err);
    return [];
  }
}

export async function createOrganizationInSupabase(org: { code: string; name: string; alias?: string }) {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data, error } = await supabase
    .from('organizations')
    .insert([org])
    .select()
    .single();

  if (error) {
    console.error('Error creating organization in Supabase:', error);
    throw error;
  }
  return data;
}

export async function updateOrganizationInSupabase(id: string, updates: { name?: string; alias?: string }) {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data, error } = await supabase
    .from('organizations')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating organization in Supabase:', error);
    throw error;
  }
  return data;
}

export async function deleteOrganizationFromSupabase(id: string) {
  if (!isSupabaseConfigured || !supabase) return false;
  const { error } = await supabase
    .from('organizations')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting organization from Supabase:', error);
    throw error;
  }
  return true;
}

// ═══════════════════════════════════════════════════════════
// 2. BUDGET PROPOSALS (USULAN BELANJA)
// ═══════════════════════════════════════════════════════════

export async function fetchProposalsFromSupabase(cycleId: string): Promise<BudgetProposal[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  try {
    const { data, error } = await supabase
      .from('budget_proposals')
      .select(`
        *,
        organizations (name, alias),
        deliberation_comments (*)
      `)
      .eq('cycle_id', cycleId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching budget proposals from Supabase:', error);
      return [];
    }

    // Map database snake_case columns to camelCase domain model
    return (data || []).map((row: any) => ({
      id: row.id,
      cycleId: row.cycle_id,
      organizationId: row.organization_id,
      opd: row.organizations?.name || row.opd_name || 'Perangkat Daerah',
      category: row.category,
      priority: row.priority,
      programName: row.program_name,
      activityName: row.activity_name,
      subActivityName: row.sub_activity_name,
      initialBudget: Number(row.initial_budget || 0),
      proposedAddition: Number(row.proposed_addition || 0),
      approvedBudget: Number(row.approved_budget || 0),
      status: row.status,
      targetOutput: row.target_output,
      urgencyJustification: row.urgency_justification,
      attachment: row.attachment_name ? { name: row.attachment_name, size: 'PDF Dokumen', url: row.attachment_url } : null,
      tanggalInput: row.created_at ? new Date(row.created_at).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      comments: (row.deliberation_comments || []).map((c: any) => ({
        id: c.id,
        proposalId: c.proposal_id,
        author: c.user_name,
        role: c.user_role,
        time: new Date(c.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
        text: c.comment_text
      }))
    }));
  } catch (err) {
    console.error('Unexpected error fetching proposals from Supabase:', err);
    return [];
  }
}

export async function createProposalInSupabase(proposal: BudgetProposal) {
  if (!isSupabaseConfigured || !supabase) return null;

  const dbRow = {
    id: proposal.id,
    cycle_id: proposal.cycleId,
    category: proposal.category,
    priority: proposal.priority,
    program_name: proposal.programName || '',
    activity_name: proposal.activityName,
    sub_activity_name: proposal.subActivityName,
    initial_budget: proposal.initialBudget,
    proposed_addition: proposal.proposedAddition,
    approved_budget: proposal.approvedBudget,
    status: proposal.status,
    target_output: proposal.targetOutput,
    urgency_justification: proposal.urgencyJustification,
    attachment_name: proposal.attachment?.name || null,
    attachment_url: proposal.attachment?.url || null
  };

  const { data, error } = await supabase
    .from('budget_proposals')
    .insert([dbRow])
    .select()
    .single();

  if (error) {
    console.error('Error inserting budget proposal to Supabase:', error);
    throw error;
  }
  return data;
}

export async function updateProposalDecisionInSupabase(
  proposalId: string,
  updates: { status: string; approvedBudget: number; note?: string },
  actor: { name: string; role: string }
) {
  if (!isSupabaseConfigured || !supabase) return null;

  // 1. Update proposal status & approved_budget
  const { data, error } = await supabase
    .from('budget_proposals')
    .update({
      status: updates.status,
      approved_budget: updates.approvedBudget,
      updated_at: new Date().toISOString()
    })
    .eq('id', proposalId)
    .select()
    .single();

  if (error) {
    console.error('Error updating proposal decision in Supabase:', error);
    throw error;
  }

  // 2. Insert audit log
  await supabase.from('proposal_audit_logs').insert([{
    proposal_id: proposalId,
    actor_name: actor.name,
    actor_role: actor.role,
    action_type: 'TAPD_DECISION',
    new_status: updates.status,
    new_p4: updates.approvedBudget,
    note: updates.note || `Ketuk palu TAPD: Status ${updates.status}`
  }]);

  return data;
}

// ═══════════════════════════════════════════════════════════
// 3. DELIBERATION COMMENTS (CATATAN FORUM TELAAH)
// ═══════════════════════════════════════════════════════════

export async function addCommentToSupabase(comment: { proposalId: string; author: string; role: string; text: string }) {
  if (!isSupabaseConfigured || !supabase) return null;

  const { data, error } = await supabase
    .from('deliberation_comments')
    .insert([{
      proposal_id: comment.proposalId,
      user_name: comment.author,
      user_role: comment.role,
      comment_text: comment.text
    }])
    .select()
    .single();

  if (error) {
    console.error('Error adding deliberation comment to Supabase:', error);
    throw error;
  }
  return data;
}

// ═══════════════════════════════════════════════════════════
// 4. FUNDING SOURCES (SUMBER DANA FISKAL)
// ═══════════════════════════════════════════════════════════

export async function fetchFundingSourcesFromSupabase(cycleId: string): Promise<FundingSource[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data, error } = await supabase
    .from('funding_sources')
    .select('*')
    .eq('cycle_id', cycleId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching funding sources from Supabase:', error);
    return [];
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    cycleId: row.cycle_id,
    sourceName: row.source_name,
    amount: Number(row.amount || 0),
    legalBasis: row.legal_basis,
    inputDate: row.input_date
  }));
}

export async function saveFundingSourceToSupabase(source: { cycleId: string; sourceName: string; amount: number; legalBasis?: string }) {
  if (!isSupabaseConfigured || !supabase) return null;

  const { data, error } = await supabase
    .from('funding_sources')
    .insert([{
      cycle_id: source.cycleId,
      source_name: source.sourceName,
      amount: source.amount,
      legal_basis: source.legalBasis || null
    }])
    .select()
    .single();

  if (error) {
    console.error('Error saving funding source to Supabase:', error);
    throw error;
  }
  return data;
}
