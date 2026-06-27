// Tiny per-key async write-mutex.
//
// The JSON stores do read-modify-write with an atomic rename, but two
// concurrent requests can still read the same state and clobber each other.
// withLock() serializes mutations sharing a key (e.g. one per store file)
// within this Node process. The deployment is single-instance (Render), so an
// in-process mutex is sufficient; horizontal scaling would need a real file
// lock or a database.

import 'server-only';

const chains = new Map<string, Promise<unknown>>();

export function withLock<T>(key: string, fn: () => T | Promise<T>): Promise<T> {
  const prev = chains.get(key) ?? Promise.resolve();
  // Run fn after the previous op settles, whether it resolved or rejected.
  const next = prev.then(() => fn(), () => fn());
  // Keep the chain alive but never leave it in a rejected state.
  chains.set(key, next.then(() => {}, () => {}));
  return next;
}
