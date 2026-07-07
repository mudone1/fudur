export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb, verifyRequestToken } from "@/lib/firebase/admin";
import type { DriverRoute, FavouriteDriver, UserProfile } from "@/types";

export async function GET(request: Request) {
  const decoded = await verifyRequestToken(request);
  if (!decoded) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const snap = await adminDb
    .collection("favouriteDrivers")
    .where("riderUid", "==", decoded.uid)
    .get();

  const favourites = await Promise.all(
    snap.docs.map(async (doc) => {
      const data = doc.data() as FavouriteDriver;
      const driverSnap = await adminDb.collection("users").doc(data.driverUid).get();
      const driver = driverSnap.exists ? (driverSnap.data() as UserProfile) : null;

      const routeSnap = await adminDb
        .collection("routes")
        .where("driverUid", "==", data.driverUid)
        .where("active", "==", true)
        .limit(1)
        .get();
      const route = routeSnap.empty
        ? null
        : ({ id: routeSnap.docs[0].id, ...(routeSnap.docs[0].data() as Omit<DriverRoute, "id">) });

      return {
        id: doc.id,
        driverUid: data.driverUid,
        name: driver?.name ?? "Driver",
        rating: driver?.rating ?? 5,
        trips: driver?.trips ?? 0,
        activeRoute: route
          ? { id: route.id, from: route.from, to: route.to, departureTime: route.departureTime }
          : null,
      };
    })
  );

  return NextResponse.json({ favourites });
}

export async function POST(request: Request) {
  const decoded = await verifyRequestToken(request);
  if (!decoded) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const driverUid = typeof body?.driverUid === "string" ? body.driverUid : "";
  if (!driverUid) {
    return NextResponse.json({ error: "driverUid is required" }, { status: 400 });
  }

  const existing = await adminDb
    .collection("favouriteDrivers")
    .where("riderUid", "==", decoded.uid)
    .where("driverUid", "==", driverUid)
    .limit(1)
    .get();
  if (!existing.empty) {
    return NextResponse.json({ id: existing.docs[0].id });
  }

  const ref = await adminDb.collection("favouriteDrivers").add({
    riderUid: decoded.uid,
    driverUid,
    createdAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ id: ref.id });
}
