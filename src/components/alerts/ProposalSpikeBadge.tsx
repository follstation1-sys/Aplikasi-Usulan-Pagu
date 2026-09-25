/**
 * ProposalSpikeBadge Component - SIP-ANGGARAN v1.3.0
 * Renders an animated warning badge if Usulan Pagu (P2) > 50% of Pagu Awal (P1)
 */

import React from 'react';

interface ProposalSpikeBadgeProps {
  initialBudget: number;
  proposedAddition: number;
  compact?: boolean;
}

export const ProposalSpikeBadge: React.FC<ProposalSpikeBadgeProps> = ({
  initialBudget,
  proposedAddition,
  compact = false
}) => {
  if (!initialBudget || initialBudget <= 0 || proposedAddition <= initialBudget * 0.5) {
    return null;
  }

  const formattedExcess = 'Rp ' + Math.round(proposedAddition).toLocaleString('id-ID');
  const pctIncrease = Math.round((proposedAddition / initialBudget) * 100);

  if (compact) {
    return (
      <span
        className="badge bg-amber-950/90 text-amber-300 border border-amber-700/80 text-[10px] animate-pulse flex items-center gap-1"
        title={`Perhatian: Usulan Pagu meningkat ${pctIncrease}% dari Pagu Awal`}
      >
        <i class="fas fa-exclamation-triangle text-amber-400"></i> Lonjakan Usulan
      </span>
    );
  }

  return (
    <span
      className="badge bg-amber-950/90 text-amber-300 border border-amber-700/80 flex items-center gap-1.5 py-0.5 px-2.5 shadow-sm animate-pulse"
      title={`Perhatian: Usulan Pagu (+${pctIncrease}%) melampaui 50% dari Pagu Awal`}
    >
      <i class="fas fa-exclamation-triangle text-amber-400 text-xs"></i>
      <span>Alert: Lonjakan Usulan (+{formattedExcess})</span>
    </span>
  );
};
