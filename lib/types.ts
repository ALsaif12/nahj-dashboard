// Domain types for the NAHJ workbook.
// The Excel file is the single source of truth and is read-only.

export type ProgramKey = 'badir' | 'risala' | 'iktashif';

/**
 * High-level system role assigned to each user. Role is descriptive — the
 * authoritative source of "what they can do" is the `UserPermissions` object.
 * The role exists so the UI (and the seed defaults) can talk about people
 * in human terms.
 */
export type Role =
  | 'ceo'              // sees and edits everything; only role with admin access by default
  | 'program-manager'  // team head: scoped to one program; manages tasks + submits actuals
  | 'team-member'      // scoped to one program; advances only tasks assigned to them
  | 'board-member'     // read-only executive view + strategy + budget summary
  | 'viewer'           // generic read-only access (assignable to any subset of panels)
  | 'sponsor';         // external, scoped to one program they fund

export interface UserPermissions {
  /** Program panels this user can open. Empty array = no program access. */
  accessibleProgramPanels: ProgramKey[];
  canAccessExecutive: boolean;
  canAccessAdmin: boolean;
  canSubmitActuals: boolean;
  /** When true, even the write APIs reject this user (admin can override per-route). */
  readOnly: boolean;
}

export interface UserRecord {
  id: string;
  username: string;
  password: string;       // plaintext for now — local dev tool only
  name: string;
  email: string;
  role: Role;
  permissions: UserPermissions;
  /** For program-manager: the program they own. For sponsor: the program they fund. */
  scope: ProgramKey | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuditEntry {
  id: number;
  ts: string;
  actor: string;          // username of the acting user, or "system"
  action: string;         // e.g. 'actual.submitted', 'user.created', 'workbook.refreshed'
  entity: string | null;  // e.g. 'kpi:4:Q2', 'user:u_xyz'
  meta: Record<string, unknown> | null;
}

export type Quarter = 'Q1' | 'Q2' | 'Q3' | 'Q4';
export type Frequency = 'quarterly' | 'semiannual' | 'annual' | 'unknown';
export type Unit = 'percentage' | 'count' | 'currency' | 'unknown';

export interface BscPillar {
  key: 'students' | 'customers' | 'internal' | 'institutional';
  arabic: string;
  english: string;
}

export interface StrategicObjective {
  id: number;          // 1..14
  pillar: BscPillar['key'];
  arabic: string;      // الهدف الاستراتيجي
  initiatives: string[];
}

export interface StrategySheet {
  vision: string;
  mission: string;
  values: string;
  orgName: string;
  pillars: BscPillar[];
  objectives: StrategicObjective[];
}

export interface KpiQuarter {
  quarter: Quarter;
  target: number | null;
  actualSheet: number | null;   // value pulled from the Excel "achieved" cell (read-only)
  actualSubmitted?: number | null; // overlay from local store (writable via input form)
}

export interface Kpi {
  id: number;            // 1..20
  arabicName: string;    // مؤشر القياس
  description: string;   // وصف المؤشر
  formula: string;       // معادلة المؤشر
  unit: Unit;
  unitArabic: string;
  baseline: number | null;
  annualTarget: number | string | null;
  owner: string | null;  // مالك المؤشر — usually empty in the source
  frequency: Frequency;
  frequencyArabic: string;
  strategicObjective: string;          // الهدف
  strategicObjectiveId: number | null; // resolved against StrategicObjective.id
  pillar: BscPillar['key'] | null;
  linkedProjects: string[];            // raw text rows from قائمة المشاريع المرتبطة
  programs: ProgramKey[];              // resolved: which of the 3 programs the KPI belongs to (may be empty for org-level KPIs)
  quarters: KpiQuarter[];
}

export interface Risk {
  id: number;            // 1..15 (renumbered if source has duplicates)
  sourceId: number | null;
  identifiedAt: string | null;
  program: string;       // المشروع — Arabic program name from the sheet
  programKey: ProgramKey | null;
  type: string;          // نوع الخطر (operational/strategic/financial/safety/legal/communication)
  name: string;          // اسم الخطر
  detail: string;        // تفصيل الخطر
  owner: string | null;  // مالك الخطر
  probability: number;   // 1..5
  impact: number;        // 1..5
  readiness: number;     // 1..5 (lower = better prepared)
  score: number;         // P × I × Readiness (per source)
  scorePI: number;       // P × I (for the 5×5 heat map)
  band: 'low' | 'medium' | 'high' | 'critical';
  tolerance: string | null;
  mitigation: string;
  mitigationOwner: string | null;
  mitigationDate: string | null;
  status: string | null; // حالة خطة التخفيف
  notes: string | null;
}

export interface Milestone {
  id: number;
  name: string;
  start: string | null;  // ISO date string
  end: string | null;
  group: string | null;  // package / batch grouping (e.g. "الحزمة 1", "الدفعة الأولى")
  invalidEnd?: boolean;  // true when end date is OCR-style invalid (Risala)
}

export interface Costline {
  type: string;
  resource: string | null;
  unitValue: number | null;
  quantity: number | null;
  total: number;
}

export interface Project {
  key: ProgramKey;
  arabicName: string;
  englishName: string;
  manager: string | null;
  sponsor: string | null;
  startDate: string | null;
  endDate: string | null;
  challenge: string | null;
  purpose: string | null;
  scopeIn: string | null;
  scopeOut: string | null;
  outputs: string | null;
  expectedBudget: number | null;
  beneficiary: string | null;
  benefits: string | null;
  milestones: Milestone[];
  costs: Costline[];
  totalCost: number;
  risks: string | null;
  challenges: string | null;
  assumptions: string | null;
  preparedBy: string | null;
  preparedByRole: string | null;
  preparedDate: string | null;
}

export interface Workbook {
  loadedAt: string;          // ISO timestamp of last parse
  sourceFile: string;        // file path (relative, for display)
  strategy: StrategySheet;
  kpis: Kpi[];
  risks: Risk[];
  projects: Record<ProgramKey, Project>;
}

export interface ActualSubmission {
  id: number;
  kpiId: number;
  quarter: Quarter;
  value: number;
  submittedBy: string;    // username
  submittedByRole: Role;
  submittedAt: string;
  note: string | null;
}

export interface SessionUser {
  username: string;
  role: Role;
  displayName: string;
  permissions: UserPermissions;
  scope: ProgramKey | null;
}

// ===== Task manager =====
//
// Tasks are the execution layer on top of the (read-only) strategy data. Each
// task belongs to exactly one program and can optionally link to a KPI,
// milestone, or risk so work ties back to strategy.

export type TaskStatus =
  | 'todo'
  | 'in-progress'
  | 'blocked'
  | 'in-review'   // assignee marked it done → awaiting head/CEO approval
  | 'done';       // approved/closed

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

/**
 * Optional link from a task to a strategy entity.
 * - kpi       → Kpi.id (1..20)
 * - risk      → Risk.id (1..15)
 * - milestone → Milestone.id, which is per-project; programKey disambiguates.
 * labelSnapshot is captured at link time so the UI degrades gracefully if the
 * Excel refresh renumbers/renames the entity.
 */
export interface TaskLink {
  kind: 'kpi' | 'milestone' | 'risk';
  programKey: ProgramKey;
  refId: number;
  labelSnapshot: string;
}

export interface TaskComment {
  id: number;            // unique within the task
  author: string;        // username ('system' for automated events)
  authorName: string;    // display-name snapshot
  body: string;
  createdAt: string;     // ISO
  // System events (status transitions, assignment, approval) are stored as
  // comments too, so the thread is a single chronological activity feed.
  system?: {
    kind: 'created' | 'status' | 'assign' | 'approve' | 'request-changes';
    from?: string;
    to?: string;
  };
}

export interface Task {
  id: number;
  programKey: ProgramKey;        // a task belongs to exactly one program
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: string | null;       // username; null = unassigned (head triage)
  assigneeName: string | null;   // display-name snapshot
  createdBy: string;             // username (team head or CEO)
  dueDate: string | null;        // ISO date (yyyy-mm-dd)
  link: TaskLink | null;
  comments: TaskComment[];
  nextCommentId: number;         // per-task comment id counter
  createdAt: string;
  updatedAt: string;
  reviewRequestedAt?: string | null;
  closedAt?: string | null;
  closedBy?: string | null;
}
