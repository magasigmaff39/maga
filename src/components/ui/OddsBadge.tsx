import React from 'react';

export type OddsLevel = 'high' | 'medium' | 'boost';

export function scoreToOdds(matchScore: number): OddsLevel {
  if (matchScore >= 85) return 'high';
  if (matchScore >= 70) return 'medium';
  return 'boost';
}

const LABELS: Record<OddsLevel, { title: string; className: string }> = {
  high: {
    title: 'High',
    className: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-800',
  },
  medium: {
    title: 'Medium',
    className: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-800',
  },
  boost: {
    title: 'Boost Needed',
    className: 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-200 dark:border-rose-800',
  },
};

export const OddsBadge: React.FC<{ score: number; className?: string }> = ({ score, className = '' }) => {
  const odds = scoreToOdds(score);
  const meta = LABELS[odds];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${meta.className} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${odds === 'high' ? 'bg-emerald-500' : odds === 'medium' ? 'bg-amber-500' : 'bg-rose-500'}`} />
      {meta.title}
    </span>
  );
};
