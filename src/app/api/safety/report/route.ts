export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb, verifyRequestToken } from "@/lib/firebase/admin";

export async function POST(request: Request) {
  const decoded = await verifyRequestToken(request);
  if (!decoded) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const reason = typeof body?.reason === "string" ? body.reason : "";
  const description = typeof body?.description === "string" ? body.description.slice(0, 2000) : "";
  const bookingId = typeof body?.bookingId === "string" ? body.bookingId : null;

  if (!reason) {
    return NextResponse.json({ error: "Select a reason" }, { status: 400 });
  }

  await adminDb.collection("reports").add({
    reporterUid: decoded.uid,
    reason,
    description,
    bookingId,
    status: "open",
    createdAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ ok: true });
}
