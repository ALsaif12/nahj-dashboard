'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, ChevronRight } from 'lucide-react';
import type { Risk } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { RiskHeatmap } from './risk-heatmap';
import { RiskTable } from './risk-table';
import { RiskDetailPanel } from './risk-detail-panel';
import { InfoTooltip } from './info-tooltip';
import { RISK_COLORS } from '@/lib/utils';
import { useI18n } from './i18n-provider';
import { PROGRAM_NAME_TO_KEY } from '@/lib/i18n';

export function RiskExplorer({ risks }: { risks: Risk[] }) {
  const { t } = useI18n();
  const [selected, setSelected] = React.useState<Risk | null>(null);
  const top3 = React.useMemo(() => [...risks].sort((a, b) => b.score - a.score).slice(0, 3), [risks]);

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                {t('risk.heatmap.title')}
                <InfoTooltip body={t('glossary.heatmap.body')} />
              </CardTitle>
              <Badge variant="outline" className="text-[10px]">{risks.length}</Badge>
            </div>
            <CardDescription>{t('risk.heatmap.subtitle')}</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <RiskHeatmap risks={risks} onSelect={setSelected} selectedId={selected?.id ?? null} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-7">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {t('risk.top3.title')}
              <InfoTooltip body={t('glossary.pir.body')} />
            </CardTitle>
            <CardDescription>{t('risk.top3.subtitle')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {top3.length === 0 ? (
              <div className="rounded-lg border border-dashed border-white/15 p-8 text-center text-sm text-white/55">
                {t('risk.top3.allClear')}
              </div>
            ) : top3.map((r, i) => (
              <motion.button
                key={r.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setSelected(r)}
                className="w-full text-start rounded-xl glass p-3 hover:bg-white/[0.07] hover:border-nahj-gold/30 transition-all group"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="h-12 w-12 rounded-lg flex flex-col items-center justify-center text-white shrink-0"
                    style={{
                      background: RISK_COLORS[r.band],
                      boxShadow: `0 0 16px ${RISK_COLORS[r.band]}80`,
                    }}
                  >
                    <AlertTriangle className="h-3 w-3 mb-0.5" />
                    <div className="text-sm font-bold leading-none">{r.score}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge variant="outline" className="font-mono text-[10px]">R{r.id}</Badge>
                      {PROGRAM_NAME_TO_KEY[r.program] && <Badge variant="outline" className="text-[10px]">{t(PROGRAM_NAME_TO_KEY[r.program])}</Badge>}
                      <span className="text-[10px] uppercase tracking-wider text-white/55">{t(`risk.band${r.band[0].toUpperCase() + r.band.slice(1)}` as any)}</span>
                    </div>
                    <p dir="rtl" className="font-arabic text-sm leading-snug text-white/95 line-clamp-2">{r.name}</p>
                    <div className="mt-1.5 text-[10px] text-white/55 flex items-center gap-2 flex-wrap">
                      <span>P×I×R = {r.probability}·{r.impact}·{r.readiness}</span>
                      {r.owner && <span>· {t('risk.owner')}: {r.owner}</span>}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-white/30 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0" />
                </div>
              </motion.button>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{t('risk.register.title')}</CardTitle>
          <CardDescription>{t('risk.register.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <RiskTable risks={risks} onSelect={setSelected} selectedId={selected?.id ?? null} />
        </CardContent>
      </Card>

      <RiskDetailPanel risk={selected} onClose={() => setSelected(null)} />
    </>
  );
}
