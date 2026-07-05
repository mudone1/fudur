"use client";

import RequireAuth from "@/components/auth/RequireAuth";
import TopNav from "@/components/layout/TopNav";
import DriverBottomNav from "@/components/layout/DriverBottomNav";
import { useDriverEarnings } from "@/lib/hooks/useDriverEarnings";
import { IconCheck } from "@tabler/icons-react";

function EarningsContent() {
  const { summary, tripLog, loading } = useDriverEarnings();

  return (
    <div className="pb-24">
      <TopNav title="Earnings" />

      <div className="bg-gradient-to-br from-green to-green-dark px-4 py-6 text-white">
        <div className="mb-1 text-[13px] opacity-80">
          Total earned this month
        </div>
        <div className="mb-4 text-4xl font-bold">
          ₦{(summary?.thisMonth ?? 0).toLocaleString()}
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-lg font-bold">{summary?.totalTrips ?? 0}</div>
            <div className="text-[11px] opacity-80">Total trips</div>
          </div>
          <div>
            <div className="text-lg font-bold">
              {summary?.totalPassengers ?? 0}
            </div>
            <div className="text-[11px] opacity-80">Passengers</div>
          </div>
          <div>
            <div className="text-lg font-bold">
              {(summary?.avgRating ?? 5).toFixed(1)} ★
            </div>
            <div className="text-[11px] opacity-80">Avg rating</div>
          </div>
        </div>
      </div>

      <div className="p-4">
        <p className="mb-2.5 text-sm font-bold">Trip log</p>
        {loading ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : tripLog.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted">
            No completed trips yet. Once you finish rides, they&apos;ll show
            up here with your earnings.
          </div>
        ) : (
          tripLog.map((t) => (
            <div key={t.id} className="flex items-center gap-3 py-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-light text-green">
                <IconCheck size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">
                  {t.route}
                </div>
                <div className="text-xs text-muted">
                  {t.dateLabel} · {t.timeLabel} · {t.passengers} passengers
                </div>
              </div>
              <div className="text-sm font-bold">
                ₦{t.fare.toLocaleString()}
              </div>
            </div>
          ))
        )}
      </div>

      <DriverBottomNav />
    </div>
  );
}

export default function DriverEarningsPage() {
  return (
    <RequireAuth driverOnly>
      <EarningsContent />
    </RequireAuth>
  );
}
