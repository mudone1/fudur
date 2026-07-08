export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { adminDb, verifyRequestToken } from "@/lib/firebase/admin";

export async function GET(request: Request) {
  const decoded = await verifyRequestToken(request);
  if (!decoded) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  let snap;
  try {
    snap = await adminDb
      .collection("trips")
      .where("riderUid", "==", decoded.uid)
      .orderBy("completedAt", "desc")
      .limit(10)
      .get();
  } catch (err) {
    // Most likely cause: the composite index (riderUid + completedAt) hasn't
    // been created yet. Log the real Firestore error — it contains a direct
    // "create index" link — instead of crashing the request for the user.
    console.error("trips/history query failed (likely missing composite index):", err);
    return NextResponse.json({ trips: [], indexPending: true });
  }

  const trips = await Promise.all(
    snap.docs.map(async (doc) => {
      const data = doc.data();
      const driverSnap = await adminDb.collection("users").doc(data.driverUid).get();
      const driver = driverSnap.exists ? driverSnap.data() : null;
      const completedAt = data.completedAt?.toDate ? data.completedAt.toDate() : null;
      return {
        id: doc.id,
        route: data.route,
        fare: data.fare,
        driverName: driver?.name ?? "Driver",
        dateLabel: completedAt
          ? completedAt.toLocaleDateString("en-NG", { weekday: "short", day: "numeric", month: "short" })
          : "",
      };
    })
  );

  return NextResponse.json({ trips });
}
