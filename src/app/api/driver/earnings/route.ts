export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { adminDb, verifyRequestToken } from "@/lib/firebase/admin";
import type { EarningsSummary, TripLogEntry } from "@/types";

// Trips are expected to live in a top-level "trips" collection with shape:
// { driverUid, route: "Dutse → Fed. Secretariat", fare, passengers,
//   completedAt: Timestamp }
// This route aggregates them per-driver. Until trips exist for a driver,
// it returns zeroed totals rather than fabricated numbers.
export async function GET(request: Request) {
  const decoded = await verifyRequestToken(request);
  if (!decoded) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const tripsSnap = await adminDb
    .collection("trips")
    .where("driverUid", "==", decoded.uid)
    .orderBy("completedAt", "desc")
    .limit(50)
    .get();

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  let today = 0;
  let thisWeek = 0;
  let thisMonth = 0;
  let totalTrips = 0;
  let totalPassengers = 0;
  let ratingSum = 0;
  let ratingCount = 0;
  const tripLog: TripLogEntry[] = [];

  tripsSnap.forEach((doc) => {
    const data = doc.data();
    const completedAt: Date | null = data.completedAt?.toDate
      ? data.completedAt.toDate()
      : null;
    const fare = Number(data.fare) || 0;
    const passengers = Number(data.passengers) || 0;

    totalTrips += 1;
    totalPassengers += passengers;
    if (typeof data.riderRating === "number") {
      ratingSum += data.riderRating;
      ratingCount += 1;
    }

    if (completedAt) {
      if (completedAt >= startOfToday) today += fare;
      if (completedAt >= startOfWeek) thisWeek += fare;
      if (completedAt >= startOfMonth) thisMonth += fare;
    }

    if (tripLog.length < 10) {
      tripLog.push({
        id: doc.id,
        route: data.route ?? "",
        dateLabel: completedAt
          ? completedAt.toLocaleDateString("en-NG", {
              weekday: "short",
              day: "numeric",
              month: "short",
            })
          : "",
        timeLabel: completedAt
          ? completedAt.toLocaleTimeString("en-NG", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "",
        passengers,
        fare,
      });
    }
  });

  const summary: EarningsSummary = {
    today,
    thisWeek,
    thisMonth,
    totalTrips,
    totalPassengers,
    avgRating: ratingCount ? Number((ratingSum / ratingCount).toFixed(1)) : 5.0,
  };

  return NextResponse.json({ summary, tripLog });
}
