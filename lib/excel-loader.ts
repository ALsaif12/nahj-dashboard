// Server-only loader for the NAHJ workbook.
// Reads data/nahj.xlsx, parses 6 sheets, returns a typed Workbook object.
// The Excel file is never written.
//
// PARSER NOTES — KPI sheet layout (verified against source on 2026-04-27):
//
// The KPIs sheet uses a paired-block layout with merged cells. Each block is
// 17 rows tall and contains UP TO TWO KPIs side-by-side:
//   • LEFT block uses cols A–K  (matrix indices 0..10)   — even-numbered KPIs
//   • RIGHT block uses cols M–W (matrix indices 12..22)  — odd-numbered KPIs
//
// Per-block field offsets (relative to the block's first row, in matrix 0-indexed
// (row, col) where col is offset from the block's baseCol):
//
//   KPI ID                  → (1, 9)        label "رقم المؤشر" sits at (1, 10)
//   Goal/objective text     → (2, 5)        label "الهدف"        at (2, 10)
//   Baseline value          → (2, 0)        label "خط الأساس"     at (2, 4)
//   Annual target value     → (3, 0)        label "المستهدف"      at (3, 4)
//   Indicator name          → (3, 5)        label "مؤشر القياس"   at (3, 10)
//   Description text        → (4, 5)        label "وصف المؤشر"    at (4, 10)
//   Q1..Q4 ACHIEVED values  → (4..7, 2)     label "القيمة المحققة" merged in col 1
//                                           quarter labels "الربع الأول" .. at col 3
//   Unit                    → (8, 0)        label "وحدة القياس"   at (8, 4)
//   Owner (empty in source) → (8, 5)        label "مالك المؤشر"   at (8, 6)
//   Formula                 → (8, 7)        label "معادلة المؤشر" at (8, 10)
//   Frequency               → (9, 0)        label "تكرار القياس"  at (9, 4)
//   Linked projects (start) → (12..16, 5)   header at (10, 10), col headers at (11, .)
//
// The OLD parser had these offsets wrong: it read the annual target from the
// label column (col +4) and the achieved values from another label column,
// producing "no data" everywhere on the dashboard. The new parser is fully
// label-driven and verified against KPI 1 (Target 70%, Q1 30%, Q2 50%, Q3 60%, Q4 70%).

import 'server-only';
import * as XLSX from 'xlsx';
import fs from 'node:fs';
import { workbookPath } from './paths';
import {
  Workbook, Kpi, KpiQuarter, Risk, Project, ProgramKey, Milestone, Costline,
  StrategySheet, BscPillar, StrategicObjective, Quarter, Frequency, Unit,
} from './types';
import { isBlank, riskBand, toNumber } from './utils';

const SHEET_STRATEGY = 'Strategy-Arabic vf';
const SHEET_KPIS = 'KPIs';
const SHEET_RISKS = 'Risk Register';
const SHEET_BADIR = 'بادر';
const SHEET_RISALA = 'رسالة';
const SHEET_IKTASHIF = 'اكتشف نهجك';

let cache: Workbook | null = null;

export function clearWorkbookCache(): void { cache = null; }

export function loadWorkbook(): Workbook {
  if (cache) return cache;
  const file = workbookPath();
  if (!fs.existsSync(file)) {
    throw new Error(`Workbook not found at ${file}. Drop the source Excel into the data/ folder.`);
  }
  const buffer = fs.readFileSync(file);
  const wb = XLSX.read(buffer, { cellDates: true, type: 'buffer' });

  const strategy = parseStrategy(asMatrix(wb, SHEET_STRATEGY));
  const kpis = parseKpis(asMatrix(wb, SHEET_KPIS), strategy.objectives);
  const risks = parseRisks(asMatrix(wb, SHEET_RISKS));
  const projects: Record<ProgramKey, Project> = {
    badir: parseProject(asMatrix(wb, SHEET_BADIR), 'badir', 'بادر', 'Badir', { titleCol: 1, dateColStart: 4, dateColEnd: 6 }),
    risala: parseProject(asMatrix(wb, SHEET_RISALA), 'risala', 'رسالة', 'Risala', { titleCol: 0, dateColStart: 3, dateColEnd: 5 }),
    iktashif: parseProject(asMatrix(wb, SHEET_IKTASHIF), 'iktashif', 'اكتشف نهجك', 'Iktashif Nahj', { titleCol: 1, dateColStart: 4, dateColEnd: 6 }),
  };

  // Resolve KPI → program from the linked-projects column.
  for (const k of kpis) k.programs = resolvePrograms(k.linkedProjects);

  cache = {
    loadedAt: new Date().toISOString(),
    sourceFile: 'data/nahj.xlsx',
    strategy,
    kpis,
    risks,
    projects,
  };
  return cache;
}

// ----- Helpers ------------------------------------------------------------

type Matrix = (string | number | Date | null)[][];

function asMatrix(wb: XLSX.WorkBook, sheetName: string): Matrix {
  const ws = wb.Sheets[sheetName];
  if (!ws) throw new Error(`Sheet not found: ${sheetName}`);
  const rows = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, raw: true, defval: null }) as any[][];
  return rows.map((row) => row.map((c) => (c === undefined ? null : c)));
}

function cellStr(m: Matrix, r: number, c: number): string {
  const v = m[r]?.[c];
  if (isBlank(v)) return '';
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v).trim();
}

function cellNum(m: Matrix, r: number, c: number): number | null {
  return toNumber(m[r]?.[c]);
}

function cellDate(m: Matrix, r: number, c: number): { iso: string | null; invalid: boolean } {
  const v = m[r]?.[c];
  if (isBlank(v)) return { iso: null, invalid: false };
  if (v instanceof Date && !Number.isNaN(v.getTime())) return { iso: v.toISOString().slice(0, 10), invalid: false };
  if (typeof v === 'number') {
    const epoch = new Date(Date.UTC(1899, 11, 30));
    const d = new Date(epoch.getTime() + v * 86400000);
    return { iso: d.toISOString().slice(0, 10), invalid: false };
  }
  if (typeof v === 'string') {
    const s = v.trim();
    const m1 = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
    if (m1) {
      const [, dd, mm, yyyy] = m1;
      const yr = Number(yyyy);
      const d = new Date(Date.UTC(yr < 100 ? 2000 + yr : yr, Number(mm) - 1, Number(dd)));
      const invalid = yr > 2026 || yr < 2024;
      return { iso: d.toISOString().slice(0, 10), invalid };
    }
    const d = new Date(s);
    if (!Number.isNaN(d.getTime())) return { iso: d.toISOString().slice(0, 10), invalid: false };
  }
  return { iso: null, invalid: true };
}

// ----- Strategy sheet ----------------------------------------------------

const PILLARS: BscPillar[] = [
  { key: 'students', arabic: 'القيمة للطلاب', english: 'Value to Students' },
  { key: 'customers', arabic: 'العملاء', english: 'Customers' },
  { key: 'internal', arabic: 'العمليات الداخلية', english: 'Internal Operations' },
  { key: 'institutional', arabic: 'القدرات المؤسساتية: الحوكمة والتنظيم', english: 'Institutional Capabilities' },
];

function parseStrategy(m: Matrix): StrategySheet {
  const vision = cellStr(m, 2, 0);
  const mission = cellStr(m, 2, 1);
  const values = cellStr(m, 2, 5);
  const orgName = cellStr(m, 2, 6);

  const objectives: StrategicObjective[] = [];
  let currentPillar: BscPillar['key'] = 'students';
  for (let r = 6; r < m.length; r++) {
    const pillarText = cellStr(m, r, 9);
    if (pillarText) {
      const found = PILLARS.find((p) => p.arabic === pillarText.trim());
      if (found) currentPillar = found.key;
    }
    const objText = cellStr(m, r, 7);
    const objId = cellNum(m, r, 8);
    const initiative = cellStr(m, r, 0);
    if (objText && objId !== null) {
      objectives.push({
        id: Math.round(objId),
        pillar: currentPillar,
        arabic: objText,
        initiatives: initiative ? [initiative] : [],
      });
    } else if (initiative) {
      const last = objectives[objectives.length - 1];
      if (last) last.initiatives.push(initiative);
    }
  }
  return { vision, mission, values, orgName, pillars: PILLARS, objectives };
}

// ----- KPIs sheet --------------------------------------------------------

/**
 * Discover KPI block starts by scanning for the Arabic label "رقم المؤشر" (KPI ID)
 * which appears once per side at column K (10) for the LEFT block and column W (22)
 * for the RIGHT block. The block's data start row is exactly one row above the label.
 */
function findKpiBlocks(m: Matrix): number[] {
  const starts = new Set<number>();
  for (let r = 0; r < m.length; r++) {
    for (const labelCol of [10, 22]) {
      const v = cellStr(m, r, labelCol);
      if (v && v.includes('رقم المؤشر')) {
        starts.add(r - 1);
      }
    }
  }
  return Array.from(starts).sort((a, b) => a - b);
}

function parseKpis(m: Matrix, objectives: StrategicObjective[]): Kpi[] {
  const blocks = findKpiBlocks(m);
  const kpis: Kpi[] = [];
  for (const startRow of blocks) {
    // Try LEFT side first (baseCol=0), then RIGHT (baseCol=12).
    const left = buildKpi(m, startRow, 0, objectives);
    if (left) kpis.push(left);
    const right = buildKpi(m, startRow, 12, objectives);
    if (right) kpis.push(right);
  }
  // Dedupe by id; keep first occurrence.
  const byId = new Map<number, Kpi>();
  for (const k of kpis) if (!byId.has(k.id)) byId.set(k.id, k);
  return Array.from(byId.values()).sort((a, b) => a.id - b.id);
}

/**
 * Read a value from any of the 4 cells to the LEFT of a label cell.
 * The KPIs sheet places annual target / baseline / unit / frequency in a
 * merged region (cols baseCol+0..3) just left of the label at col +4. Most
 * KPIs put the value at col +0, but a few (e.g. KPI 16) leave that merge
 * unset and the value lands at col +3. We scan all four positions and return
 * the first non-empty cell we find.
 */
function readValueLeftOfLabel(m: Matrix, row: number, baseCol: number): unknown {
  for (let off = 0; off <= 3; off++) {
    const v = m[row]?.[baseCol + off];
    if (!isBlank(v)) return v;
  }
  return null;
}
function readNumberLeftOfLabel(m: Matrix, row: number, baseCol: number): number | null {
  return toNumber(readValueLeftOfLabel(m, row, baseCol));
}
function readStringLeftOfLabel(m: Matrix, row: number, baseCol: number): string {
  const v = readValueLeftOfLabel(m, row, baseCol);
  if (isBlank(v)) return '';
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v).trim();
}

function buildKpi(m: Matrix, startRow: number, baseCol: number, objectives: StrategicObjective[]): Kpi | null {
  // The KPI ID lives at row+1, col +9. If it's missing, this side of the block has no KPI.
  const idRaw = m[startRow + 1]?.[baseCol + 9];
  const idNum = toNumber(idRaw);
  if (idNum === null) return null;

  // Verify expected labels are where we think they are (defensive — logs a warning if not).
  const labelTarget = cellStr(m, startRow + 3, baseCol + 4);
  if (labelTarget && !labelTarget.includes('المستهدف')) {
    console.warn(`[KPI parser] Unexpected label at (${startRow + 3}, ${baseCol + 4}): "${labelTarget}" (expected "المستهدف")`);
  }

  // Annual target value lives in the merged region cols +0..+3 (left of the label).
  const annualTargetRaw = readValueLeftOfLabel(m, startRow + 3, baseCol);
  const annualTargetNum = toNumber(annualTargetRaw);
  // Some KPIs (e.g. KPI 19) store the target as "100 الف" — keep the string
  // form alongside the number when present, so the UI can render the original.
  const annualTarget: number | string | null = annualTargetNum !== null
    ? annualTargetNum
    : (typeof annualTargetRaw === 'string' && annualTargetRaw.trim() ? annualTargetRaw.trim() : null);

  const baseline = readNumberLeftOfLabel(m, startRow + 2, baseCol);
  const goal = cellStr(m, startRow + 2, baseCol + 5);
  const indicator = cellStr(m, startRow + 3, baseCol + 5);
  const description = cellStr(m, startRow + 4, baseCol + 5);

  // Quarterly ACHIEVED values are at (row+4..7, col+2). The "achieved value"
  // header sits at col+1 (merged across all 4 quarter rows); quarter labels
  // ("الربع الأول" etc.) are at col+3.
  const quarters: KpiQuarter[] = (['Q1', 'Q2', 'Q3', 'Q4'] as Quarter[]).map((q, i) => ({
    quarter: q,
    target: null, // The workbook stores only an annual target.
    actualSheet: cellNum(m, startRow + 4 + i, baseCol + 2),
  }));

  const unitArabic = readStringLeftOfLabel(m, startRow + 8, baseCol);
  const owner = cellStr(m, startRow + 8, baseCol + 5) || null;
  const formula = cellStr(m, startRow + 8, baseCol + 7);
  const frequencyArabic = readStringLeftOfLabel(m, startRow + 9, baseCol);

  // Linked projects: rows 12..16 of the block at col+5.
  const linkedProjects: string[] = [];
  for (let r = startRow + 12; r <= startRow + 16 && r < m.length; r++) {
    const v = cellStr(m, r, baseCol + 5);
    if (v) linkedProjects.push(v);
  }

  const unit: Unit = unitArabic.includes('نسبة') ? 'percentage'
    : unitArabic.includes('عدد') ? 'count'
    : unitArabic.includes('ريال') ? 'currency' : 'unknown';
  const frequency: Frequency = frequencyArabic.includes('ربعي') ? 'quarterly'
    : frequencyArabic.includes('نصف') ? 'semiannual'
    : frequencyArabic.includes('سنوي') ? 'annual' : 'unknown';

  const matchedObjective = objectives.find((o) => o.arabic.trim() === goal.trim());

  return {
    id: Math.round(idNum),
    arabicName: indicator,
    description,
    formula,
    unit,
    unitArabic,
    baseline,
    annualTarget,
    owner,
    frequency,
    frequencyArabic,
    strategicObjective: goal,
    strategicObjectiveId: matchedObjective?.id ?? null,
    pillar: matchedObjective?.pillar ?? null,
    linkedProjects,
    programs: [],
    quarters,
  };
}

/**
 * Match a KPI's linked-project text to the 3 program keys.
 * The source uses several phrasings that map to the same program.
 */
function resolvePrograms(linkedProjects: string[]): ProgramKey[] {
  const tags = new Set<ProgramKey>();
  for (const lp of linkedProjects) {
    const t = lp.toLowerCase();
    if (lp.includes('بادر') || t.includes('badir')) tags.add('badir');
    if (lp.includes('رسالة') || lp.includes('الرسالة') || t.includes('risala')) tags.add('risala');
    if (lp.includes('اكتشف نهجك') || t.includes('iktashif') ||
        lp.includes('اكتشف مسارك') || lp.includes('اكتشف نفسك')) {
      // Disambiguate: "اكتشف نفسك: بادر" → badir; "اكتشف مسارك: مشروع رسالة" → risala;
      // anything else under the اكتشف umbrella → iktashif (the discovery program).
      if (!lp.includes('بادر') && !lp.includes('رسالة')) tags.add('iktashif');
    }
  }
  return Array.from(tags);
}

// ----- Risk Register -----------------------------------------------------

function programKeyFromArabic(s: string): ProgramKey | null {
  if (!s) return null;
  if (s.includes('بادر')) return 'badir';
  if (s.includes('رسالة')) return 'risala';
  if (s.includes('اكتشف نهجك') || s.includes('اكتشف')) return 'iktashif';
  return null;
}

function parseRisks(m: Matrix): Risk[] {
  // Header rows occupy R005-R006 (matrix 4-5); risk rows start at R007 (matrix 6).
  // We discover the data start row dynamically: first row with a numeric ID in col 0
  // and a non-empty risk name in col 12.
  const risks: Risk[] = [];
  let nextId = 1;
  for (let r = 0; r < m.length; r++) {
    const sourceId = cellNum(m, r, 0);
    const name = cellStr(m, r, 12);
    if (!sourceId || !name) continue;

    const probability = Math.max(1, Math.min(5, cellNum(m, r, 16) ?? 0));
    const impact = Math.max(1, Math.min(5, cellNum(m, r, 17) ?? 0));
    const readiness = Math.max(1, Math.min(5, cellNum(m, r, 18) ?? 0));
    if (probability === 0 || impact === 0 || readiness === 0) continue; // not a risk row

    const score = cellNum(m, r, 19) ?? probability * impact * readiness;

    risks.push({
      id: nextId++,
      sourceId: Math.round(sourceId),
      identifiedAt: cellStr(m, r, 1) || null,
      program: cellStr(m, r, 6),
      programKey: programKeyFromArabic(cellStr(m, r, 6)),
      type: cellStr(m, r, 10),
      name,
      detail: cellStr(m, r, 15),
      owner: cellStr(m, r, 14) || null,
      probability,
      impact,
      readiness,
      score,
      scorePI: probability * impact,
      band: riskBand(score),
      tolerance: cellStr(m, r, 20) || null,
      mitigation: cellStr(m, r, 21),
      mitigationOwner: cellStr(m, r, 22) || null,
      mitigationDate: cellStr(m, r, 23) || null,
      status: cellStr(m, r, 26) || null,
      notes: cellStr(m, r, 27) || null,
    });
  }
  return risks;
}

// ----- Project sheets ----------------------------------------------------

interface ProjectColumns { titleCol: number; dateColStart: number; dateColEnd: number; }

function parseProject(m: Matrix, key: ProgramKey, arName: string, enName: string, cols: ProjectColumns): Project {
  const labelCol = cols.titleCol;
  const valueCol = cols.titleCol + 1;

  const findRow = (label: string, col: number = labelCol): number =>
    m.findIndex((row) => typeof row[col] === 'string' && (row[col] as string).trim() === label);

  const challengeRow = findRow('التحدي او المشكلة');
  const purposeRow = m.findIndex((row) => typeof row[labelCol] === 'string' && /^(الهدف من المشروع|الغرض من المشروع)$/.test((row[labelCol] as string).trim()));
  const scopeInRow = m.findIndex((row) => typeof row[labelCol] === 'string' && /(ضمن النطاق|ضمن نطاق المشروع)/.test(row[labelCol] as string));
  const scopeOutRow = m.findIndex((row) => typeof row[labelCol] === 'string' && /(خارج النطاق|خارج نطاق المشروع)/.test(row[labelCol] as string));
  const outputsRow = m.findIndex((row) => typeof row[labelCol] === 'string' && /المخرجات/.test(row[labelCol] as string));
  const milestonesHeader = m.findIndex((row) => typeof row[labelCol] === 'string' && (
    (row[labelCol] as string).includes('ااسم المعلم') ||
    (row[labelCol] as string).trim() === 'المعالم' ||
    (row[labelCol] as string).includes('اسم المعلم')
  ));

  const headerRow = m.findIndex((row) => typeof row[labelCol] === 'string' && (row[labelCol] as string).includes('اسم المشروع'));
  const manager = cellStr(m, headerRow + 1, labelCol + 3) || null;
  const sponsor = cellStr(m, headerRow + 1, labelCol + 5) || null;

  // Start / end dates — try several possible label cells.
  let startDate: string | null = null;
  let endDate: string | null = null;
  for (let r = 0; r < m.length; r++) {
    for (const lblCol of [labelCol + 3, labelCol + 4]) {
      const lbl = cellStr(m, r, lblCol);
      if (!lbl) continue;
      if (/(تاريخ بدء المشروع|التاريخ المتوقع لبدء المشروع|تاريخ البدء المتوقع|تاريخ بدء)/.test(lbl)) {
        const d = cellDate(m, r + 1, lblCol);
        if (d.iso) startDate = d.iso;
      }
      if (/(التاريخ المتوقع لانتهاء المشروع|تاريخ الإكمال المتوقع|تاريخ انتهاء المشروع)/.test(lbl)) {
        const d = cellDate(m, r + 1, lblCol + 2);
        if (d.iso) endDate = d.iso;
      }
    }
  }

  const expectedBudget = (() => {
    for (let r = 0; r < m.length; r++) {
      for (const lblCol of [labelCol + 5, labelCol + 4]) {
        const lbl = cellStr(m, r, lblCol);
        if (lbl && (lbl.includes('التكلفة المتوقعة') || lbl.includes('التكاليف المتوقعة'))) {
          const v = cellNum(m, r + 1, lblCol);
          if (v) return v;
        }
      }
    }
    return null;
  })();

  // Milestones — read after the milestone header until a section break.
  const milestones: Milestone[] = [];
  let currentGroup: string | null = null;
  let milestoneId = 1;
  if (milestonesHeader >= 0) {
    for (let r = milestonesHeader + 1; r < m.length; r++) {
      const name = cellStr(m, r, labelCol);
      if (!name) continue;
      if (/^(الموارد|الموارد والدعم المطلوب|التكلفة|التكاليف|اغلاق المشروع|المنافع|المنافع والعملاء|المخاطر|اعداد|تم الاعداد|التكلفة\s*$)/.test(name)) break;
      const start = cellDate(m, r, cols.dateColStart);
      const end = cellDate(m, r, cols.dateColEnd);
      if (!start.iso && !end.iso) {
        currentGroup = name;
        continue;
      }
      milestones.push({
        id: milestoneId++,
        name,
        start: start.iso,
        end: end.iso,
        group: currentGroup,
        invalidEnd: end.invalid || (end.iso !== null && new Date(end.iso).getUTCFullYear() > 2026),
      });
    }
  }

  // Cost lines — find the cost header.
  const costs: Costline[] = [];
  let totalCost = 0;
  const costHeaderRow = m.findIndex((row) => typeof row[labelCol] === 'string' && (row[labelCol] as string).includes('نوع التكلفة'));
  if (costHeaderRow >= 0) {
    for (let r = costHeaderRow + 1; r < Math.min(costHeaderRow + 12, m.length); r++) {
      const type = cellStr(m, r, labelCol);
      const totalLabel = cellStr(m, r, labelCol + 3);
      if (totalLabel.includes('التكلفة الاجمالية') || totalLabel.includes('إجمالي') || totalLabel.includes('اجمالي')) {
        totalCost = cellNum(m, r, labelCol + 5) ?? 0;
        break;
      }
      if (!type) continue;
      const total = cellNum(m, r, labelCol + 5) ?? 0;
      costs.push({
        type,
        resource: cellStr(m, r, labelCol + 1) || null,
        unitValue: cellNum(m, r, labelCol + 3),
        quantity: cellNum(m, r, labelCol + 4),
        total,
      });
    }
  }

  // Project budget for Iktashif uses a different structure (4 phases × 2 batches).
  // If totalCost is 0 but expectedBudget exists, fall back to expectedBudget.
  if (totalCost === 0 && expectedBudget) totalCost = expectedBudget;

  return {
    key, arabicName: arName, englishName: enName,
    manager, sponsor, startDate, endDate,
    challenge: cellStr(m, challengeRow, valueCol) || null,
    purpose: cellStr(m, purposeRow, valueCol) || null,
    scopeIn: cellStr(m, scopeInRow, valueCol) || null,
    scopeOut: cellStr(m, scopeOutRow, valueCol) || null,
    outputs: cellStr(m, outputsRow, valueCol) || null,
    expectedBudget,
    beneficiary: null,
    benefits: null,
    milestones,
    costs,
    totalCost,
    risks: null,
    challenges: null,
    assumptions: null,
    preparedBy: null,
    preparedByRole: null,
    preparedDate: null,
  };
}
