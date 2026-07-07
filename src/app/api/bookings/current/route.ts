export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { adminDb, verifyRequestToken } from "@/lib/firebase/admin";
import type { Booking, DriverRoute, UserProfile } from "@/types";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export async function GET(request: Request) {
  const decoded = await verifyRequestToken(request);
  if (!decoded) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const snap = await adminDb
    .collection("bookings")
    .where("riderUid", "==", decoded.uid)
    .where("tripDate", "==", todayKey())
    .where("status", "==", "active")
    .limit(1)
    .get();

  if (snap.empty) {
    return NextResponse.json({ booking: null });
  }

  const doc = snap.docs[0];
  const booking = { id: doc.id, ...(doc.data() as Omit<Booking, "id">) };

  const routeSnap = await adminDb.collection("routes").doc(booking.routeId).get();
  const route = routeSnap.exists
    ? { id: routeSnap.id, ...(routeSnap.data() as Omit<DriverRoute, "id">) }
    : null;

  const driverSnap = await adminDb.collection("users").doc(booking.driverUid).get();
  const driver = driverSnap.exists ? (driverSnap.data() as UserProfile) : null;

  const passengersSnap = await adminDb
    .collection("bookings")
    .where("routeId", "==", booking.routeId)
    .where("tripDate", "==", todayKey())
    .where("status", "==", "active")
    .get();

  return NextResponse.json({
    booking,
    route,
    driver: driver ? { name: driver.name, rating: driver.rating, phone: driver.phone } : null,
    seatsFilled: passengersSnap.size,
  });
}
