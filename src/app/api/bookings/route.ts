export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb, verifyRequestToken } from "@/lib/firebase/admin";
import { sendPushToUser } from "@/lib/firebase/push";
import type { DriverRoute, UserProfile } from "@/types";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export async function POST(request: Request) {
  const decoded = await verifyRequestToken(request);
  if (!decoded) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const routeId = body?.routeId as string | undefined;
  if (!routeId) {
    return NextResponse.json({ error: "routeId is required" }, { status: 400 });
  }

  const routeRef = adminDb.collection("routes").doc(routeId);
  const tripDate = todayKey();

  try {
    let driverUid = "";
    let routeLabel = "";
    const bookingId = await adminDb.runTransaction(async (tx) => {
      const routeSnap = await tx.get(routeRef);
      if (!routeSnap.exists) throw new Error("Route not found");
      const route = routeSnap.data() as DriverRoute;
      const seatsBooked = route.seatsBooked ?? 0;
      if (seatsBooked >= route.seats) {
        throw new Error("No seats left on this ride");
      }
      driverUid = route.driverUid;
      routeLabel = `${route.from} → ${route.to}`;

      const bookingRef = adminDb.collection("bookings").doc();
      tx.set(bookingRef, {
        routeId,
        riderUid: decoded.uid,
        driverUid: route.driverUid,
        status: "active",
        tripDate,
        fare: route.pricePerSeat,
        createdAt: FieldValue.serverTimestamp(),
      });
      tx.update(routeRef, { seatsBooked: seatsBooked + 1 });
      return bookingRef.id;
    });

    const riderSnap = await adminDb.collection("users").doc(decoded.uid).get();
    const rider = riderSnap.exists ? (riderSnap.data() as UserProfile) : null;
    await sendPushToUser(driverUid, {
      title: "New rider booked your ride",
      body: `${rider?.name ?? "A rider"} booked a seat on ${routeLabel}`,
      url: "/driver/dashboard",
    });

    return NextResponse.json({ bookingId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Booking failed";
    return NextResponse.json({ error: message }, { status: 409 });
  }
}
