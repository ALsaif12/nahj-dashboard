# NAHJ Dashboard

A production-grade web dashboard for **NAHJ** (جمعية نهج لتمكين الشباب) — Saudi
non-profit youth empowerment society. Tracks 20 KPIs, 15 risks, 14 strategic
objectives across 4 BSC pillars, and 3 active programs (Badir, Risala, Iktashif Nahj).

The Excel strategy workbook is the **single source of truth**. The dashboard reads
it, never writes it. Quarterly actuals submitted via the in-app forms live in a
separate local SQLite store (`data/actuals.db`) and overlay — but never modify —
the source values.

## Quick start

```bash
npm install
npm run dev
# open http://localhost:3000
```

Default accounts (override via env vars before deploying):

| Username    | Password         | Sees                          |
|-------------|------------------|-------------------------------|
| `executive` | `nahj-exec`      | All KPIs, risks, programs     |
| `badir`     | `nahj-badir`     | Badir KPIs, risks R10–R15     |
| `risala`    | `nahj-risala`    | Risala KPIs, risks R1–R3      |
| `iktashif`  | `nahj-iktashif`  | Iktashif KPIs, risks R4–R9    |

## Swap the source Excel

1. Drop the new file at `data/nahj.xlsx` (overwrite the existing one).
2. Hit **Refresh data** in the sidebar — the parser cache is cleared and the
   workbook re-read on the next request.

The parser expects the same 6 sheets:

- `Strategy-Arabic vf` — vision/mission/values + 14 strategic objectives
- `KPIs` — 20 KPIs in the paired-block layout (2 KPIs side-by-side per block)
- `Risk Register` — 15 risks with P/I/Readiness scoring
- `بادر`, `رسالة`, `اكتشف نهجك` — PMI-style project charters

If the column layout changes, edit `lib/excel-loader.ts`.

## Add or change users

Edit `lib/auth.ts` — the `ACCOUNTS` array is the source of truth. For real
deployments, swap it for an IDP (NextAuth's Microsoft, Google, or SAML provider).
Set passwords via env vars in production:

```
NAHJ_PW_EXEC=...
NAHJ_PW_BADIR=...
NAHJ_PW_RISALA=...
NAHJ_PW_IKTASHIF=...
NAHJ_SESSION_SECRET=<32-byte random string>
```

## Deploy to Vercel

The app is a standard Next.js 14 project, deployable as-is.

1. Push to a Git repo and import into Vercel.
2. Set the env vars above in **Project Settings → Environment Variables**.
3. The Excel file is committed under `data/nahj.xlsx` — to update it in
   production, push a new commit (or wire a separate storage backend).

> **Note:** `better-sqlite3` is a native dependency and is built at install time.
> Vercel's Node runtime supports it; the SQLite file persists across requests
> within a single function instance. For long-term durability of submitted
> actuals, swap `lib/db.ts` for a hosted database (Postgres, Turso, etc.).

## Architecture

```
┌─────────────────────┐
│ data/nahj.xlsx      │   read-only source
└──────────┬──────────┘
           │  parsed once, cached in process
           ▼
┌─────────────────────┐
│ lib/excel-loader.ts │   typed Workbook
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐    ┌──────────────────────┐
│ lib/data-service.ts │◄──►│ data/actuals.db      │  writable overlay
└──────────┬──────────┘    └──────────────────────┘
           │
           ▼
┌────────────────────────────────────────┐
│ Server Components → role-filtered data │
└──────────┬─────────────────────────────┘
           │
           ▼
┌────────────────────────────────────────┐
│ Client Components → KPICard, Heatmap,  │
│ Gantt, RiskTable, InputForm, Scorecard │
└────────────────────────────────────────┘
```

## Conventions

- **Bilingual + RTL-aware.** UI chrome is English; Arabic content from the sheet
  is rendered verbatim with `dir="rtl"` and the Cairo font. Toggle the body dir
  in the header (LTR/RTL).
- **RAG.** Green ≥ target, Amber within 10% below, Red >10% below.
- **Risk score.** P × I × Readiness (matches the source workbook). The 5×5 heat
  map plots P × I; dot color carries the full P×I×R band (Low ≤24, Medium 25–49,
  High 50–79, Critical ≥80).
- **KPI → program.** Resolved automatically from the sheet's "linked projects"
  column. KPIs not linked to a program show only on the Executive panel.

## Outstanding items for the NAHJ team

- Many KPIs in the source have no `مالك المؤشر` (owner) populated.
- Most `Q*` "achieved" cells are blank — submit through the team panel.
- Risala milestones in package 3 have OCR-style date errors (2027–2031); these
  are flagged with an amber badge in the Gantt chart.
- Risk IDs 10 and 12 are duplicated in the source — the dashboard renumbers
  them (R1–R15) for display.
