export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { adminDb, verifyRequestToken } from "@/lib/firebase/admin";
import type { DriverRoute, UserProfile, Booking } from "@/types";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ routeId: string }> }
) {
  const decoded = await verifyRequestToken(request);
  if (!decoded) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { routeId } = await params;
  const routeSnap = await adminDb.collection("routes").doc(routeId).get();
  if (!routeSnap.exists) {
    return NextResponse.json({ error: "Route not found" }, { status: 404 });
  }
  const route = { id: routeSnap.id, ...(routeSnap.data() as Omit<DriverRoute, "id">) };

  const driverSnap = await adminDb.collection("users").doc(route.driverUid).get();
  const driver = driverSnap.exists ? (driverSnap.data() as UserProfile) : null;

  const bookingsSnap = await adminDb
    .collection("bookings")
    .where("routeId", "==", routeId)
    .where("tripDate", "==", todayKey())
    .where("status", "==", "active")
    .get();

  const passengers = await Promise.all(
    bookingsSnap.docs.map(async (doc) => {
      const booking = doc.data() as Booking;
      const riderSnap = await adminDb.collection("users").doc(booking.riderUid).get();
      const rider = riderSnap.exists ? (riderSnap.data() as UserProfile) : null;
      return {
        bookingId: doc.id,
        uid: booking.riderUid,
        name: rider?.name ?? "Rider",
        rating: rider?.rating ?? 5.0,
      };
    })
  );

  const seatsLeft = route.seats - passengers.length;

  return NextResponse.json({
    route,
    driver: driver
      ? { name: driver.name, rating: driver.rating, trips: driver.trips }
      : null,
    passengers,
    seatsLeft,
  });
}
