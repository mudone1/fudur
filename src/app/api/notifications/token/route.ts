export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { adminDb, verifyRequestToken } from "@/lib/firebase/admin";

export async function POST(request: Request) {
  const decoded = await verifyRequestToken(request);
  if (!decoded) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const fcmToken = typeof body?.fcmToken === "string" ? body.fcmToken : null;
  if (!fcmToken) {
    return NextResponse.json({ error: "fcmToken is required" }, { status: 400 });
  }

  await adminDb.collection("users").doc(decoded.uid).set(
    { fcmToken },
    { merge: true }
  );

  return NextResponse.json({ ok: true });
}
