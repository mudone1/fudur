export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { adminDb, verifyRequestToken } from "@/lib/firebase/admin";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ driverUid: string }> }
) {
  const decoded = await verifyRequestToken(request);
  if (!decoded) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  const { driverUid } = await params;

  const snap = await adminDb
    .collection("favouriteDrivers")
    .where("riderUid", "==", decoded.uid)
    .where("driverUid", "==", driverUid)
    .get();

  await Promise.all(snap.docs.map((doc) => doc.ref.delete()));

  return NextResponse.json({ ok: true });
}
