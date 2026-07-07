export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import type { Booking, DriverRoute, UserProfile } from "@/types";

/**
 * Deliberately unauthenticated — this is what a trusted contact opens from
 * a shared link, and they don't have a Fudur account. Only returns the
 * minimum needed to reassure someone their contact is on a real, verified
 * ride: route, driver identity/car/phone, and status. No exact GPS
 * position is tracked by this app, so none is exposed here either.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  const { bookingId } = await params;
  const bookingSnap = await adminDb.collection("bookings").doc(bookingId).get();
  if (!bookingSnap.exists) {
    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  }
  const booking = bookingSnap.data() as Booking;

  const [routeSnap, driverSnap, riderSnap] = await Promise.all([
    adminDb.collection("routes").doc(booking.routeId).get(),
    adminDb.collection("users").doc(booking.driverUid).get(),
    adminDb.collection("users").doc(booking.riderUid).get(),
  ]);
  const route = routeSnap.exists ? (routeSnap.data() as DriverRoute) : null;
  const driver = driverSnap.exists ? (driverSnap.data() as UserProfile) : null;
  const rider = riderSnap.exists ? (riderSnap.data() as UserProfile) : null;

  return NextResponse.json({
    status: booking.status,
    tripDate: booking.tripDate,
    riderName: rider?.name ?? "A Fudur rider",
    route: route
      ? {
          from: route.from,
          to: route.to,
          departureTime: route.departureTime,
          meetingPoint: route.meetingPoint,
        }
      : null,
    driver: driver
      ? { name: driver.name, phone: driver.phone, rating: driver.rating }
      : null,
    car: route?.car ?? null,
  });
}
