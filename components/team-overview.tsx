'use client';

import * as React from 'react';
import type { Project, Kpi, Risk, ProgramKey, Task } from '@/lib/types';
import { StatusBanner } from './status-banner';
import { TrafficLightStrip } from './traffic-light-strip';
import { ProjectCharterAccordion } from './project-charter-accordion';
import { AtAGlanceWrapper } from './at-a-glance-wrapper';

interface Props {
  programKey: ProgramKey;
  project: Project;
  kpis: Kpi[];
  risks: Risk[];
  tasks?: Task[];
  viewer?: { username: string; managePrograms: ProgramKey[] };
  stats: {
    onTrack: number; totalKpis: number; atRisk: number; offTrack: number;
    totalRisks: number; criticalRisks: number; totalBudget: number;
  };
}

export function TeamOverview({ programKey, project, kpis, risks, tasks, viewer, stats }: Props) {
  return (
    <div className="space-y-6">
      <StatusBanner
        onTrack={stats.onTrack}
        totalKpis={stats.totalKpis}
        atRisk={stats.atRisk}
        offTrack={stats.offTrack}
        totalRisks={stats.totalRisks}
        criticalRisks={stats.criticalRisks}
        totalBudget={stats.totalBudget}
        programs={[project]}
        scope={programKey}
        basePath={`/dashboard/${programKey}`}
      />

      {kpis.length > 0 && <TrafficLightStrip kpis={kpis} groupSize={10} />}

      <ProjectCharterAccordion project={project} />

      <AtAGlanceWrapper kpis={kpis} risks={risks} projects={[project]} tasks={tasks} viewer={viewer} />
    </div>
  );
}
