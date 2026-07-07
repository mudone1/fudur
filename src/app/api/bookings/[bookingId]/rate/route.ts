export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb, verifyRequestToken } from "@/lib/firebase/admin";
import type { Booking, DriverRoute, UserProfile } from "@/types";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  const decoded = await verifyRequestToken(request);
  if (!decoded) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { bookingId } = await params;
  const body = await request.json().catch(() => ({}));
  const driverRating = Number(body?.driverRating) || 5;
  const tags: string[] = Array.isArray(body?.tags) ? body.tags : [];
  const comment: string = typeof body?.comment === "string" ? body.comment : "";
  const coRiderRatings: Record<string, number> =
    body?.coRiderRatings && typeof body.coRiderRatings === "object"
      ? body.coRiderRatings
      : {};

  const bookingRef = adminDb.collection("bookings").doc(bookingId);
  const bookingSnap = await bookingRef.get();
  if (!bookingSnap.exists) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }
  const booking = bookingSnap.data() as Booking;
  if (booking.riderUid !== decoded.uid) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const routeSnap = await adminDb.collection("routes").doc(booking.routeId).get();
  const route = routeSnap.exists ? (routeSnap.data() as DriverRoute) : null;

  const batch = adminDb.batch();

  batch.update(bookingRef, { status: "completed" });

  const tripRef = adminDb.collection("trips").doc();
  batch.set(tripRef, {
    driverUid: booking.driverUid,
    riderUid: booking.riderUid,
    bookingId,
    route: route ? `${route.from} → ${route.to}` : "",
    fare: booking.fare,
    passengers: 1,
    riderRating: driverRating,
    tags,
    comment,
    completedAt: FieldValue.serverTimestamp(),
  });

  // Update driver's running average rating.
  const driverRef = adminDb.collection("users").doc(booking.driverUid);
  const driverSnap = await driverRef.get();
  if (driverSnap.exists) {
    const driver = driverSnap.data() as UserProfile;
    const prevTrips = driver.trips ?? 0;
    const prevRating = driver.rating ?? 5;
    const newTrips = prevTrips + 1;
    const newRating = (prevRating * prevTrips + driverRating) / newTrips;
    batch.update(driverRef, {
      trips: newTrips,
      rating: Number(newRating.toFixed(2)),
    });
  }

  // Update co-rider ratings the same way.
  for (const [uid, rating] of Object.entries(coRiderRatings)) {
    const riderRef = adminDb.collection("users").doc(uid);
    const riderSnap = await riderRef.get();
    if (riderSnap.exists) {
      const rider = riderSnap.data() as UserProfile;
      const prevTrips = rider.trips ?? 0;
      const prevRating = rider.rating ?? 5;
      const newTrips = prevTrips + 1;
      const newRating = (prevRating * prevTrips + Number(rating)) / newTrips;
      batch.update(riderRef, {
        trips: newTrips,
        rating: Number(newRating.toFixed(2)),
      });
    }
  }

  await batch.commit();

  return NextResponse.json({ ok: true });
}
