// Watches the source Excel workbook for changes and emits an event whenever
// it's been re-saved. The /api/live SSE endpoint subscribes to this stream
// and forwards updates to connected clients.
//
// READ-ONLY: this module never writes to the file. If the file is locked
// (someone has it open in Excel), the parse retry waits briefly and retries.

import 'server-only';
import fs from 'node:fs';
import { EventEmitter } from 'node:events';
import chokidar, { type FSWatcher } from 'chokidar';
import { clearWorkbookCache, loadWorkbook } from './excel-loader';
import { log } from './audit-log';
import { workbookPath } from './paths';

/** Singleton event bus for live updates. */
class WorkbookBus extends EventEmitter {
  private started = false;
  private watcher?: FSWatcher;
  private debounceTimer?: NodeJS.Timeout;

  start() {
    if (this.started) return;
    this.started = true;

    const file = workbookPath();
    if (!fs.existsSync(file)) {
      // The watcher will still be created — chokidar tolerates a missing file.
      console.warn(`[live] Workbook not present at ${file} — watcher will pick it up when it appears.`);
    }

    this.watcher = chokidar.watch(file, {
      persistent: true,
      // Excel does atomic-rename on save → wait until size stops changing
      // before we accept the change. Avoids reading mid-save.
      awaitWriteFinish: { stabilityThreshold: 500, pollInterval: 100 },
      ignoreInitial: true,
    });

    const onChange = () => {
      // Debounce so rapid stat events from Excel only trigger one reparse.
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => this.reparseWithRetry(), 250);
    };

    this.watcher.on('add', onChange);
    this.watcher.on('change', onChange);
    this.watcher.on('error', (err) => console.error('[live] watcher error:', err));
  }

  /**
   * Re-parse the workbook with retries — Excel briefly locks the file during
   * save which can cause EBUSY/EPERM. We give it up to ~3s.
   */
  private async reparseWithRetry(attempt = 0): Promise<void> {
    try {
      clearWorkbookCache();
      const wb = loadWorkbook();
      log({
        actor: 'system',
        action: 'workbook.autoRefreshed',
        entity: 'workbook',
        meta: { kpis: wb.kpis.length, risks: wb.risks.length },
      });
      this.emit('update', { loadedAt: wb.loadedAt, kpis: wb.kpis.length, risks: wb.risks.length });
    } catch (err) {
      if (attempt < 8) {
        // 8 retries × 400ms ≈ 3s upper bound
        setTimeout(() => this.reparseWithRetry(attempt + 1), 400);
      } else {
        console.error('[live] reparse failed after retries:', err);
      }
    }
  }
}

declare global {
  // Persist the bus across hot-reloads in dev.

  var __nahjWorkbookBus: WorkbookBus | undefined;
}

export function getWorkbookBus(): WorkbookBus {
  if (!global.__nahjWorkbookBus) {
    global.__nahjWorkbookBus = new WorkbookBus();
    global.__nahjWorkbookBus.start();
  }
  return global.__nahjWorkbookBus;
}
