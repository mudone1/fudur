export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { adminDb, verifyRequestToken } from "@/lib/firebase/admin";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ savedRouteId: string }> }
) {
  const decoded = await verifyRequestToken(request);
  if (!decoded) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  const { savedRouteId } = await params;

  const ref = adminDb.collection("savedRoutes").doc(savedRouteId);
  const snap = await ref.get();
  if (snap.exists && snap.data()?.riderUid !== decoded.uid) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await ref.delete();

  return NextResponse.json({ ok: true });
}
