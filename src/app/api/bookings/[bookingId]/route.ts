export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { adminDb, verifyRequestToken } from "@/lib/firebase/admin";
import type { Booking, DriverRoute, UserProfile } from "@/types";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  const decoded = await verifyRequestToken(request);
  if (!decoded) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { bookingId } = await params;
  const bookingSnap = await adminDb.collection("bookings").doc(bookingId).get();
  if (!bookingSnap.exists) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }
  const booking = { id: bookingSnap.id, ...(bookingSnap.data() as Omit<Booking, "id">) };

  if (booking.riderUid !== decoded.uid && booking.driverUid !== decoded.uid) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const routeSnap = await adminDb.collection("routes").doc(booking.routeId).get();
  const route = routeSnap.exists
    ? { id: routeSnap.id, ...(routeSnap.data() as Omit<DriverRoute, "id">) }
    : null;

  const driverSnap = await adminDb.collection("users").doc(booking.driverUid).get();
  const driver = driverSnap.exists ? (driverSnap.data() as UserProfile) : null;

  const coRidersSnap = await adminDb
    .collection("bookings")
    .where("routeId", "==", booking.routeId)
    .where("tripDate", "==", booking.tripDate)
    .where("status", "==", "active")
    .get();

  const coRiders = await Promise.all(
    coRidersSnap.docs
      .filter((d) => d.id !== bookingId)
      .map(async (doc) => {
        const b = doc.data() as Booking;
        const riderSnap = await adminDb.collection("users").doc(b.riderUid).get();
        const rider = riderSnap.exists ? (riderSnap.data() as UserProfile) : null;
        return {
          uid: b.riderUid,
          name: rider?.name ?? "Rider",
          rating: rider?.rating ?? 5.0,
        };
      })
  );

  return NextResponse.json({
    booking,
    route,
    driver: driver
      ? { uid: booking.driverUid, name: driver.name, rating: driver.rating }
      : null,
    coRiders,
  });
}
