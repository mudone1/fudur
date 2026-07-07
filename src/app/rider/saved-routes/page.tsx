"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { authFetch } from "@/lib/authFetch";
import RequireAuth from "@/components/auth/RequireAuth";
import TopNav from "@/components/layout/TopNav";
import Button from "@/components/ui/Button";
import { IconHeartFilled, IconX } from "@tabler/icons-react";

const AREAS = ["Dutse", "Gwarimpa", "Kubwa", "Karu", "Lugbe", "Nyanya", "Life Camp"];
const DESTINATIONS = ["Federal Secretariat", "Wuse", "Area 1", "Katampe", "CBD", "Garki", "Maitama"];

interface SavedRouteItem {
  id: string;
  from: string;
  to: string;
  driverCount: number;
  lowestPrice: number | null;
}

function SavedRoutesContent() {
  const { firebaseUser } = useAuth();
  const router = useRouter();
  const [saved, setSaved] = useState<SavedRouteItem[] | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [from, setFrom] = useState(AREAS[0]);
  const [to, setTo] = useState(DESTINATIONS[0]);

  async function load() {
    const res = await authFetch(firebaseUser, "/api/saved-routes");
    if (res.ok) setSaved((await res.json()).savedRoutes ?? []);
  }

  useEffect(() => {
    if (firebaseUser) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firebaseUser]);

  async function addRoute() {
    await authFetch(firebaseUser, "/api/saved-routes", {
      method: "POST",
      body: JSON.stringify({ from, to }),
    });
    setShowAdd(false);
    load();
  }

  async function removeRoute(id: string) {
    await authFetch(firebaseUser, `/api/saved-routes/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <TopNav
        title="Saved routes"
        action={
          <button onClick={() => setShowAdd((v) => !v)} className="text-orange">
            +
          </button>
        }
      />

      <div className="flex flex-col gap-2.5 p-4">
        {showAdd && (
          <div className="mb-1 flex flex-col gap-2 rounded-xl border border-border p-3.5">
            <div className="grid grid-cols-2 gap-2">
              <select
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="rounded-lg border border-border px-3 py-2 text-sm"
              >
                {AREAS.map((a) => (
                  <option key={a}>{a}</option>
                ))}
              </select>
              <select
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="rounded-lg border border-border px-3 py-2 text-sm"
              >
                {DESTINATIONS.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </div>
            <Button variant="orange" full onClick={addRoute}>
              Save this route
            </Button>
          </div>
        )}

        {saved === null ? (
          <p className="text-center text-sm text-muted">Loading…</p>
        ) : saved.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted">
            No saved routes yet — tap + to save a route you commute often.
          </div>
        ) : (
          saved.map((r) => (
            <div
              key={r.id}
              className="flex items-center gap-3 rounded-xl border border-border p-3.5"
            >
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[10px] bg-orange-light">
                <IconHeartFilled size={20} className="text-orange" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold">
                  {r.from} → {r.to}
                </div>
                <div className="text-xs text-muted">
                  {r.driverCount > 0
                    ? `${r.driverCount} active driver${r.driverCount !== 1 ? "s" : ""}${
                        r.lowestPrice ? ` · From ₦${r.lowestPrice}` : ""
                      }`
                    : "No active drivers on this route right now"}
                </div>
              </div>
              <button
                onClick={() => router.push("/find")}
                className="rounded-lg bg-orange px-3 py-1.5 text-xs font-semibold text-white"
              >
                View
              </button>
              <button onClick={() => removeRoute(r.id)} className="text-muted">
                <IconX size={16} />
              </button>
            </div>
          ))
        )}

        <div className="notice-box notice-green mt-1">
          <strong>Tip:</strong> Saved routes are quick shortcuts back to your
          usual commute — search still works the same either way.
        </div>
      </div>
    </div>
  );
}

export default function SavedRoutesPage() {
  return (
    <RequireAuth>
      <SavedRoutesContent />
    </RequireAuth>
  );
}
