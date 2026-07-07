export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb, verifyRequestToken } from "@/lib/firebase/admin";
import type { DriverRoute, SavedRoute } from "@/types";

export async function GET(request: Request) {
  const decoded = await verifyRequestToken(request);
  if (!decoded) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const snap = await adminDb
    .collection("savedRoutes")
    .where("riderUid", "==", decoded.uid)
    .get();

  const saved = await Promise.all(
    snap.docs.map(async (doc) => {
      const data = doc.data() as SavedRoute;
      const activeSnap = await adminDb
        .collection("routes")
        .where("active", "==", true)
        .where("from", "==", data.from)
        .where("to", "==", data.to)
        .get();

      let driverCount = 0;
      let lowestPrice: number | null = null;
      activeSnap.forEach((r) => {
        const route = r.data() as DriverRoute;
        const seatsLeft = route.seats - (route.seatsBooked ?? 0);
        if (seatsLeft <= 0) return;
        driverCount += 1;
        if (lowestPrice === null || route.pricePerSeat < lowestPrice) {
          lowestPrice = route.pricePerSeat;
        }
      });

      return {
        id: doc.id,
        from: data.from,
        to: data.to,
        driverCount,
        lowestPrice,
      };
    })
  );

  return NextResponse.json({ savedRoutes: saved });
}

export async function POST(request: Request) {
  const decoded = await verifyRequestToken(request);
  if (!decoded) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const from = typeof body?.from === "string" ? body.from : "";
  const to = typeof body?.to === "string" ? body.to : "";
  if (!from || !to) {
    return NextResponse.json({ error: "from and to are required" }, { status: 400 });
  }

  const existing = await adminDb
    .collection("savedRoutes")
    .where("riderUid", "==", decoded.uid)
    .where("from", "==", from)
    .where("to", "==", to)
    .limit(1)
    .get();
  if (!existing.empty) {
    return NextResponse.json({ id: existing.docs[0].id });
  }

  const ref = await adminDb.collection("savedRoutes").add({
    riderUid: decoded.uid,
    from,
    to,
    createdAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ id: ref.id });
}
