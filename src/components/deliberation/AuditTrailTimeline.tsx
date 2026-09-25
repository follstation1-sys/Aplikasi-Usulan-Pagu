/**
 * AuditTrailTimeline Component - SIP-ANGGARAN v1.3.0
 * Renders chronological audit log records for a budget proposal
 */

import React from 'react';
import { AuditHistoryLog } from '../../types/database';
import { formatRp } from '../../lib/currency';

interface AuditTrailTimelineProps {
  logs?: AuditHistoryLog[];
}

export const AuditTrailTimeline: React.FC<AuditTrailTimelineProps> = ({ logs = [] }) => {
  if (!logs || logs.length === 0) {
    return (
      <div className="bg-slate-900/60 rounded-xl p-4 border border-indigo-900/40">
        <p className="text-xs font-bold text-indigo-300 mb-2 uppercase tracking-wider flex items-center gap-2">
          <i className="fas fa-history text-indigo-400"></i> Riwayat Perubahan &amp; Audit Trail Usulan
        </p>
        <p className="text-xs text-slate-500 italic text-center py-3">Belum ada riwayat perubahan.</p>
      </div>
    );
  }

  // Display logs in reverse chronological order (newest first)
  const reversedLogs = [...logs].reverse();

  return (
    <div className="bg-slate-900/60 rounded-xl p-4 border border-indigo-900/40 space-y-3">
      <p className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-2">
        <i className="fas fa-history text-indigo-400"></i> Riwayat Perubahan &amp; Audit Trail Usulan
      </p>

      <div className="space-y-2 max-h-52 overflow-y-auto text-xs pr-1">
        {reversedLogs.map((log, idx) => {
          const roleColor =
            log.actorRole === 'TAPD'
              ? 'text-indigo-400'
              : log.actorRole === 'BAPPEDA'
              ? 'text-emerald-400'
              : log.actorRole === 'SUPERUSER'
              ? 'text-purple-400'
              : 'text-amber-400';

          const hasChange = log.oldStatus !== log.newStatus || log.oldP4 !== log.newP4;

          return (
            <div
              key={log.id || idx}
              className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1.5 transition-all hover:border-slate-700"
            >
              <div className="flex items-center justify-between text-[11px]">
                <span className={`font-bold ${roleColor}`}>
                  {log.actorName} <span className="text-slate-500 font-normal">({log.actorRole})</span>
                </span>
                <span className="text-slate-500 text-[10px] font-mono flex items-center gap-1">
                  <i className="fas fa-clock text-slate-600"></i>
                  {log.timestamp}
                </span>
              </div>

              <p className="text-xs text-slate-200 font-medium leading-relaxed">{log.note || '-'}</p>

              {hasChange && (
                <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1 pt-1.5 border-t border-slate-800/60 flex-wrap">
                  <span>
                    Status: <span className="line-through text-slate-500 mr-1">{log.oldStatus || '-'}</span>
                    &rarr; <span className="text-emerald-300 font-bold ml-1">{log.newStatus}</span>
                  </span>
                  <span className="text-slate-700">|</span>
                  <span>
                    Pagu Kesepakatan (P4):{' '}
                    <span className="line-through text-slate-500 mr-1">{formatRp(log.oldP4)}</span> &rarr;{' '}
                    <span className="text-emerald-300 font-bold ml-1">{formatRp(log.newP4)}</span>
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
