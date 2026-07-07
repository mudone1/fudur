export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb, verifyRequestToken } from "@/lib/firebase/admin";
import type { DriverApplication } from "@/types";

export async function GET(request: Request) {
  const decoded = await verifyRequestToken(request);
  if (!decoded) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  const snap = await adminDb
    .collection("driverApplications")
    .doc(decoded.uid)
    .get();
  return NextResponse.json({
    application: snap.exists ? (snap.data() as DriverApplication) : null,
  });
}

export async function POST(request: Request) {
  const decoded = await verifyRequestToken(request);
  if (!decoded) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const required = [
    body.firstName,
    body.lastName,
    body.phone,
    body.route?.from,
    body.route?.to,
    body.car?.make,
    body.car?.plate,
  ];
  if (required.some((v) => !v || String(v).trim() === "")) {
    return NextResponse.json(
      { error: "Please fill in all required fields" },
      { status: 400 }
    );
  }

  const application: Record<string, unknown> = {
    uid: decoded.uid,
    firstName: body.firstName,
    lastName: body.lastName,
    phone: body.phone,
    email: body.email ?? "",
    route: {
      from: body.route.from,
      to: body.route.to,
      departureTime: body.route.departureTime,
      meetingPoint: body.route.meetingPoint,
      days: body.route.days ?? [],
      pricePerSeat: Number(body.route.pricePerSeat) || 0,
    },
    car: {
      make: body.car.make,
      model: body.car.model,
      plate: String(body.car.plate).toUpperCase(),
      year: Number(body.car.year) || null,
      colour: body.car.colour,
      seats: Number(body.car.seats) || 4,
    },
    status: "approved",
    createdAt: FieldValue.serverTimestamp(),
  };

  const batch = adminDb.batch();

  const appRef = adminDb.collection("driverApplications").doc(decoded.uid);
  batch.set(appRef, application, { merge: true });

  // Also create/merge the user profile as a driver so the dashboard is
  // usable immediately; the application status is tracked separately
  // and can gate live bookings once ops approves it.
  const userRef = adminDb.collection("users").doc(decoded.uid);
  batch.set(
    userRef,
    {
      uid: decoded.uid,
      phone: body.phone ?? null,
      name: `${body.firstName} ${body.lastName}`.trim(),
      type: "driver",
      rating: 5.0,
      trips: 0,
      createdAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  // First posted route, mirrored into its own collection for the
  // find-a-ride flow (Phase 2).
  const routeRef = adminDb.collection("routes").doc();
  batch.set(routeRef, {
    driverUid: decoded.uid,
    from: body.route.from,
    to: body.route.to,
    departureTime: body.route.departureTime,
    meetingPoint: body.route.meetingPoint,
    days: body.route.days ?? [],
    pricePerSeat: Number(body.route.pricePerSeat) || 0,
    seats: Number(body.car.seats) || 4,
    seatsBooked: 0,
    active: true,
    car: {
      make: body.car.make,
      model: body.car.model,
      plate: String(body.car.plate).toUpperCase(),
      colour: body.car.colour,
      year: Number(body.car.year) || null,
    },
    createdAt: FieldValue.serverTimestamp(),
  });

  await batch.commit();

  return NextResponse.json({ application });
}
