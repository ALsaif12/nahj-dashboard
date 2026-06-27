'use client';
import * as React from 'react';
import { ArrowUpDown, AlertCircle } from 'lucide-react';
import type { Risk } from '@/lib/types';
import { Badge } from './ui/badge';
import { cn, RISK_COLORS } from '@/lib/utils';
import { useI18n } from './i18n-provider';
import { PROGRAM_NAME_TO_KEY, RISK_TYPE_TO_KEY } from '@/lib/i18n';

type SortKey = 'id' | 'score' | 'name' | 'program' | 'type' | 'owner';

export function RiskTable({ risks, onSelect, selectedId }: { risks: Risk[]; onSelect?: (r: Risk) => void; selectedId?: number | null }) {
  const { t } = useI18n();
  const [sortKey, setSortKey] = React.useState<SortKey>('score');
  const [sortDir, setSortDir] = React.useState<'asc' | 'desc'>('desc');
  const [filter, setFilter] = React.useState<'' | 'low' | 'medium' | 'high' | 'critical'>('');
  const [search, setSearch] = React.useState('');

  const sorted = React.useMemo(() => {
    let xs = risks;
    if (filter) xs = xs.filter((r) => r.band === filter);
    if (search.trim()) {
      const s = search.trim().toLowerCase();
      xs = xs.filter((r) =>
        r.name.toLowerCase().includes(s) ||
        r.detail.toLowerCase().includes(s) ||
        (r.owner ?? '').toLowerCase().includes(s) ||
        r.program.includes(s)
      );
    }
    const cmp = (a: Risk, b: Risk) => {
      const av: any = a[sortKey];
      const bv: any = b[sortKey];
      if (typeof av === 'string') return av.localeCompare(bv ?? '');
      return (av ?? 0) - (bv ?? 0);
    };
    return [...xs].sort((a, b) => (sortDir === 'asc' ? cmp(a, b) : -cmp(a, b)));
  }, [risks, sortKey, sortDir, filter, search]);

  const toggleSort = (k: SortKey) => {
    if (k === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(k); setSortDir('desc'); }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          placeholder={t('risk.search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 w-full sm:w-56 rounded-lg glass px-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-nahj-gold/40"
        />
        {(['', 'critical', 'high', 'medium', 'low'] as const).map((b) => (
          <button
            key={b || 'all'}
            onClick={() => setFilter(b)}
            className={cn(
              'h-8 rounded-full px-3 text-xs font-medium border transition',
              filter === b
                ? 'bg-nahj-gold/20 text-nahj-gold-soft border-nahj-gold/40 shadow-glow'
                : 'glass text-white/55 hover:text-white hover:border-white/25',
            )}
          >
            {b ? t(`risk.band${b[0].toUpperCase() + b.slice(1)}` as any) : t('risk.all')}
            {b && <span className="ms-1 opacity-70">({risks.filter((r) => r.band === b).length})</span>}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl glass">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead className="bg-white/[0.03] text-white/85">
              <tr className="border-b border-white/10">
                <Th onClick={() => toggleSort('id')} active={sortKey === 'id'}>{t('risk.column.id')}</Th>
                <Th onClick={() => toggleSort('name')} active={sortKey === 'name'}>{t('risk.column.risk')}</Th>
                <Th onClick={() => toggleSort('program')} active={sortKey === 'program'}>{t('risk.column.program')}</Th>
                <Th onClick={() => toggleSort('type')} active={sortKey === 'type'}>{t('risk.column.type')}</Th>
                <th className="px-3 py-2.5 text-center text-xs font-medium uppercase tracking-wider">{t('risk.column.pir')}</th>
                <Th onClick={() => toggleSort('score')} active={sortKey === 'score'}>{t('risk.column.score')}</Th>
                <Th onClick={() => toggleSort('owner')} active={sortKey === 'owner'}>{t('risk.column.owner')}</Th>
                <th className="px-3 py-2.5 text-start text-xs font-medium uppercase tracking-wider">{t('risk.column.status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {sorted.length === 0 ? (
                <tr><td colSpan={8} className="py-12 text-center text-white/55">
                  <AlertCircle className="mx-auto mb-2 h-6 w-6 opacity-50" />
                  {t('risk.noMatch')}
                </td></tr>
              ) : sorted.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => onSelect?.(r)}
                  className={cn(
                    'hover:bg-white/[0.04] cursor-pointer transition-colors',
                    selectedId === r.id && 'bg-nahj-gold/10',
                  )}
                >
                  <td className="px-3 py-2.5 font-mono text-xs text-white/55">R{r.id}</td>
                  <td className="px-3 py-2.5 max-w-md">
                    <div dir="rtl" lang="ar" className="font-arabic text-sm leading-snug text-white/95 line-clamp-2">{r.name}</div>
                  </td>
                  <td className="px-3 py-2.5 text-xs">
                    <Badge variant="outline" className="font-medium">{PROGRAM_NAME_TO_KEY[r.program] ? t(PROGRAM_NAME_TO_KEY[r.program]) : r.program}</Badge>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-white/65">{RISK_TYPE_TO_KEY[r.type.trim()] ? t(RISK_TYPE_TO_KEY[r.type.trim()]) : r.type}</td>
                  <td className="px-3 py-2.5 text-center font-mono text-xs">
                    <span className="text-white/55">{r.probability}·{r.impact}·{r.readiness}</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white tabular-nums">{r.score}</span>
                      <span
                        className="h-5 w-1.5 rounded-full"
                        style={{ background: RISK_COLORS[r.band], boxShadow: `0 0 6px ${RISK_COLORS[r.band]}` }}
                      />
                      <span className="text-[10px] uppercase tracking-wider text-white/55">{t(`risk.band${r.band[0].toUpperCase() + r.band.slice(1)}` as any)}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-white/65">{r.owner || '—'}</td>
                  <td className="px-3 py-2.5">
                    {r.status ? (
                      <span dir="rtl" className="font-arabic text-xs text-white/65">{r.status}</span>
                    ) : (
                      <span className="text-xs text-white/55">{t('risk.statusOpen')}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Th({ children, onClick, active }: { children: React.ReactNode; onClick?: () => void; active?: boolean }) {
  return (
    <th
      onClick={onClick}
      className={cn(
        'px-3 py-2.5 text-start text-xs font-medium uppercase tracking-wider select-none',
        onClick && 'cursor-pointer hover:text-white',
        active && 'text-nahj-gold',
      )}
    >
      <span className="inline-flex items-center gap-1">{children} {onClick && <ArrowUpDown className="h-3 w-3 opacity-60" />}</span>
    </th>
  );
}
