/**
 * DeficitAlertBanner Component - SIP-ANGGARAN v1.3.0
 * Renders a prominent red alert banner at the top of the dashboard when Sisa Kas < 0
 */

import React from 'react';
import { formatRp } from '../../lib/currency';

interface DeficitAlertBannerProps {
  remainingCapacity: number; // Positive or negative
  onManageFiscal?: () => void;
}

export const DeficitAlertBanner: React.FC<DeficitAlertBannerProps> = ({
  remainingCapacity,
  onManageFiscal
}) => {
  if (remainingCapacity >= 0) {
    return null;
  }

  const deficitAmount = Math.abs(remainingCapacity);

  return (
    <div
      id="dash-alert-banner"
      className="mb-6 bg-rose-950/90 border border-rose-800/90 rounded-2xl p-4 flex items-center justify-between text-rose-200 text-xs shadow-lg shadow-rose-950/40 fade-in"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-rose-900/60 border border-rose-700/80 flex items-center justify-center text-rose-400 text-lg flex-shrink-0">
          <i className="fas fa-triangle-exclamation animate-pulse"></i>
        </div>
        <div>
          <h4 className="font-extrabold text-white text-sm">Peringatan Defisit Anggaran &amp; Over-Budget Fiskal!</h4>
          <p className="text-rose-300 mt-0.5 leading-relaxed">
            Total alokasi kesepakatan TAPD melampaui Kapasitas Kas Daerah sebesar{' '}
            <strong className="text-white font-mono">{formatRp(deficitAmount)}</strong>.
          </p>
        </div>
      </div>

      {onManageFiscal && (
        <button
          onClick={onManageFiscal}
          className="px-3.5 py-2 bg-rose-800 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-all shadow flex items-center gap-1.5 whitespace-nowrap ml-4 flex-shrink-0"
        >
          <i className="fas fa-coins"></i> Kelola Kapasitas Fiskal
        </button>
      )}
    </div>
  );
};
