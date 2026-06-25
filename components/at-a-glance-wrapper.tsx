'use client';
import * as React from 'react';
import type { Kpi, Risk, Project } from '@/lib/types';
import { AtAGlance } from './at-a-glance';
import { RiskDetailPanel } from './risk-detail-panel';

export function AtAGlanceWrapper(props: { kpis: Kpi[]; risks: Risk[]; projects: Project[] }) {
  const [selected, setSelected] = React.useState<Risk | null>(null);
  return (
    <>
      <AtAGlance {...props} onSelectRisk={setSelected} />
      <RiskDetailPanel risk={selected} onClose={() => setSelected(null)} />
    </>
  );
}
