export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { adminDb, verifyRequestToken } from "@/lib/firebase/admin";
import { sendPushToUser } from "@/lib/firebase/push";
import type { Booking, DriverRoute, UserProfile } from "@/types";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Notifies chat participants after a message is sent. Two calling shapes:
 *
 * 1. Rider side: { bookingId, scope: "group" | "driver", text }
 * 2. Driver side: { routeId, scope: "group" | "direct", riderUid?, text }
 *    (driver has no single bookingId — they're messaging either everyone
 *    booked on their route today, or one specific rider)
 */
export async function POST(request: Request) {
  const decoded = await verifyRequestToken(request);
  if (!decoded) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const text = typeof body?.text === "string" ? body.text.slice(0, 120) : "";
  const senderSnap = await adminDb.collection("users").doc(decoded.uid).get();
  const sender = senderSnap.exists ? (senderSnap.data() as UserProfile) : null;
  const senderName = sender?.name ?? "Someone";

  let routeId: string;
  let driverUid: string;
  let tripDate: string;
  let scope: "group" | "driver" | "direct";
  let chatUrl: string;
  const recipients = new Set<string>();

  if (body?.bookingId) {
    // --- Rider-initiated ---
    const bookingSnap = await adminDb.collection("bookings").doc(body.bookingId).get();
    if (!bookingSnap.exists) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }
    const booking = bookingSnap.data() as Booking;
    routeId = booking.routeId;
    driverUid = booking.driverUid;
    tripDate = booking.tripDate;
    scope = body.scope === "driver" ? "driver" : "group";
    chatUrl = `/trip/${body.bookingId}/chat`;

    if (scope === "driver") {
      recipients.add(decoded.uid === driverUid ? booking.riderUid : driverUid);
    } else {
      recipients.add(driverUid);
      const coBookingsSnap = await adminDb
        .collection("bookings")
        .where("routeId", "==", routeId)
        .where("tripDate", "==", tripDate)
        .where("status", "==", "active")
        .get();
      coBookingsSnap.forEach((doc) => recipients.add((doc.data() as Booking).riderUid));
    }
  } else if (body?.routeId) {
    // --- Driver-initiated ---
    const routeSnap = await adminDb.collection("routes").doc(body.routeId).get();
    if (!routeSnap.exists) {
      return NextResponse.json({ error: "Route not found" }, { status: 404 });
    }
    const route = routeSnap.data() as DriverRoute;
    routeId = body.routeId;
    driverUid = route.driverUid;
    tripDate = todayKey();
    chatUrl = `/driver/route/${routeId}/chat`;

    if (body.scope === "direct" && body.riderUid) {
      scope = "direct";
      recipients.add(body.riderUid);
    } else {
      scope = "group";
      const bookingsSnap = await adminDb
        .collection("bookings")
        .where("routeId", "==", routeId)
        .where("tripDate", "==", tripDate)
        .where("status", "==", "active")
        .get();
      bookingsSnap.forEach((doc) => recipients.add((doc.data() as Booking).riderUid));
    }
  } else {
    return NextResponse.json({ error: "bookingId or routeId is required" }, { status: 400 });
  }

  recipients.delete(decoded.uid);

  const label = scope === "group" ? "Ride group" : "Chat";
  await Promise.all(
    Array.from(recipients).map((uid) =>
      sendPushToUser(uid, {
        title: `${senderName} · ${label}`,
        body: text || "New message",
        url: chatUrl,
      })
    )
  );

  return NextResponse.json({ ok: true, notified: recipients.size });
}
