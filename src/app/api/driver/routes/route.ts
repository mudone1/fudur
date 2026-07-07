export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { adminDb, verifyRequestToken } from "@/lib/firebase/admin";
import type { DriverRoute } from "@/types";

export async function GET(request: Request) {
  const decoded = await verifyRequestToken(request);
  if (!decoded) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const snap = await adminDb
    .collection("routes")
    .where("driverUid", "==", decoded.uid)
    .get();

  const routes: DriverRoute[] = snap.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<DriverRoute, "id">),
  }));

  return NextResponse.json({ routes });
}
