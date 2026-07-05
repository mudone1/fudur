export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { adminDb, verifyRequestToken } from "@/lib/firebase/admin";
import type { DriverRoute, UserProfile } from "@/types";

export async function GET(request: Request) {
  const decoded = await verifyRequestToken(request);
  if (!decoded) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  let query = adminDb.collection("routes").where("active", "==", true) as FirebaseFirestore.Query;
  if (from) query = query.where("from", "==", from);
  if (to) query = query.where("to", "==", to);

  const snap = await query.get();

  const routes = await Promise.all(
    snap.docs.map(async (doc) => {
      const data = doc.data() as Omit<DriverRoute, "id">;
      const seatsLeft = data.seats - (data.seatsBooked ?? 0);
      if (seatsLeft <= 0) return null;

      const driverSnap = await adminDb.collection("users").doc(data.driverUid).get();
      const driver = driverSnap.exists ? (driverSnap.data() as UserProfile) : null;

      return {
        id: doc.id,
        ...data,
        seatsLeft,
        driverName: driver?.name ?? "Driver",
        driverRating: driver?.rating ?? 5.0,
        driverTrips: driver?.trips ?? 0,
      };
    })
  );

  return NextResponse.json({ routes: routes.filter(Boolean) });
}
