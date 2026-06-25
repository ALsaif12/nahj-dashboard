// Storage paths.
//
// In development everything lives under ./data in the project root.
// On Render (or any other host) we mount a persistent disk and set
// NAHJ_DATA_DIR to point the writable JSON stores at it, while the
// read-only Excel workbook continues to ship with the build.
//
//   NAHJ_DATA_DIR        — directory for users.json / actuals.json / audit.json
//                          (default: <cwd>/data)
//   NAHJ_WORKBOOK_PATH   — full path to the source Excel file
//                          (default: <cwd>/data/nahj.xlsx)

import 'server-only';
import path from 'node:path';
import fs from 'node:fs';

export function dataDir(): string {
  const dir = process.env.NAHJ_DATA_DIR || path.join(process.cwd(), 'data');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function workbookPath(): string {
  return process.env.NAHJ_WORKBOOK_PATH || path.join(process.cwd(), 'data', 'nahj.xlsx');
}

export function storeFile(name: string): string {
  return path.join(dataDir(), name);
}
