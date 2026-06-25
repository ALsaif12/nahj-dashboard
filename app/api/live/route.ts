// Server-Sent Events stream that announces workbook re-parses to the dashboard.
// Each client gets one connection; the file watcher re-parses on Excel save and
// fires `update` events that we forward as SSE messages.

import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import { getWorkbookBus } from '@/lib/file-watcher';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  const user = await getSession();
  if (!user) return new Response('Unauthorized', { status: 401 });

  const bus = getWorkbookBus();

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\n`));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      // Initial hello (mostly to flush headers via proxies and confirm the stream is live).
      send('hello', { ts: Date.now() });

      const onUpdate = (payload: { loadedAt: string; kpis: number; risks: number }) => {
        send('update', payload);
      };
      bus.on('update', onUpdate);

      // Heartbeat every 25s to keep the connection alive across proxies.
      const heartbeat = setInterval(() => {
        try { controller.enqueue(encoder.encode(`: ping\n\n`)); }
        catch { /* connection closed */ }
      }, 25_000);

      // Cleanup when the client disconnects.
      const close = () => {
        clearInterval(heartbeat);
        bus.off('update', onUpdate);
        try { controller.close(); } catch { /* already closed */ }
      };
      _req.signal.addEventListener('abort', close);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
