export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb, verifyRequestToken } from "@/lib/firebase/admin";
import type { Booking, UserProfile } from "@/types";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Records an SOS alert for later review, and returns the rider's first
 * saved trusted contact (if any) so the client can immediately open a
 * tel: link. There's no ops/support team monitoring this collection in
 * real time yet — see README — so the UI copy must not claim otherwise.
 */
export async function POST(request: Request) {
  const decoded = await verifyRequestToken(request);
  if (!decoded) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const userSnap = await adminDb.collection("users").doc(decoded.uid).get();
  const user = userSnap.exists ? (userSnap.data() as UserProfile) : null;

  const activeBookingSnap = await adminDb
    .collection("bookings")
    .where("riderUid", "==", decoded.uid)
    .where("tripDate", "==", todayKey())
    .where("status", "==", "active")
    .limit(1)
    .get();
  const activeBooking = activeBookingSnap.empty
    ? null
    : ({ id: activeBookingSnap.docs[0].id, ...(activeBookingSnap.docs[0].data() as Booking) });

  await adminDb.collection("sosAlerts").add({
    riderUid: decoded.uid,
    riderName: user?.name ?? "Unknown",
    riderPhone: user?.phone ?? null,
    bookingId: activeBooking?.id ?? null,
    routeId: activeBooking?.routeId ?? null,
    driverUid: activeBooking?.driverUid ?? null,
    createdAt: FieldValue.serverTimestamp(),
  });

  const contactsSnap = await adminDb
    .collection("users")
    .doc(decoded.uid)
    .collection("trustedContacts")
    .limit(1)
    .get();
  const contact = contactsSnap.empty
    ? null
    : { name: contactsSnap.docs[0].data().name, phone: contactsSnap.docs[0].data().phone };

  return NextResponse.json({ ok: true, contact, bookingId: activeBooking?.id ?? null });
}
