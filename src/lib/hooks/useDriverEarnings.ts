"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import type { EarningsSummary, TripLogEntry } from "@/types";

export function useDriverEarnings() {
  const { firebaseUser } = useAuth();
  const [summary, setSummary] = useState<EarningsSummary | null>(null);
  const [tripLog, setTripLog] = useState<TripLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!firebaseUser) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const idToken = await firebaseUser.getIdToken();
      const res = await fetch("/api/driver/earnings", {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (!cancelled && res.ok) {
        const data = await res.json();
        setSummary(data.summary);
        setTripLog(data.tripLog);
      }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [firebaseUser]);

  return { summary, tripLog, loading };
}
