export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb, verifyRequestToken } from "@/lib/firebase/admin";
import type { UserProfile } from "@/types";

export async function GET(request: Request) {
  const decoded = await verifyRequestToken(request);
  if (!decoded) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const snap = await adminDb.collection("users").doc(decoded.uid).get();
  if (!snap.exists) {
    return NextResponse.json({ profile: null });
  }
  return NextResponse.json({ profile: snap.data() as UserProfile });
}

export async function POST(request: Request) {
  const decoded = await verifyRequestToken(request);
  if (!decoded) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const area = typeof body?.area === "string" ? body.area : "";
  const type = body?.type === "driver" ? "driver" : "rider";

  if (!name) {
    return NextResponse.json({ error: "Enter your full name" }, { status: 400 });
  }

  const ref = adminDb.collection("users").doc(decoded.uid);
  const existing = await ref.get();

  const profile: Record<string, unknown> = {
    uid: decoded.uid,
    phone: decoded.phone_number ?? null,
    name,
    area,
    type,
    rating: existing.exists ? existing.data()?.rating ?? 5.0 : 5.0,
    trips: existing.exists ? existing.data()?.trips ?? 0 : 0,
    createdAt: existing.exists
      ? existing.data()?.createdAt
      : FieldValue.serverTimestamp(),
  };

  await ref.set(profile, { merge: true });

  return NextResponse.json({ profile });
}
