// Streamed instantly by Next while a force-dynamic sub-page fetches on the
// server. Keeps the Shell in place and shows pulsing glass placeholders so
// navigation never flashes a blank main area.
export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header line */}
      <div className="space-y-2">
        <div className="h-7 w-56 rounded-lg bg-white/10" />
        <div className="h-3 w-80 max-w-full rounded bg-white/5" />
      </div>

      {/* Sub-nav pills */}
      <div className="h-12 w-full max-w-md rounded-2xl bg-white/[0.06]" />

      {/* Stat tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-white/[0.06] border border-white/10" />
        ))}
      </div>

      {/* Card grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-44 rounded-2xl bg-white/[0.06] border border-white/10" />
        ))}
      </div>
    </div>
  );
}
