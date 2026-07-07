export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { adminDb, verifyRequestToken } from "@/lib/firebase/admin";
import type { LeaderboardEntry, UserProfile } from "@/types";

export async function GET(request: Request) {
  const decoded = await verifyRequestToken(request);
  if (!decoded) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") === "rider" ? "rider" : "driver";

  // Ranking is by trip count (ties broken by rating) — simple, transparent,
  // and matches what riders/drivers can actually see about themselves.
  const snap = await adminDb
    .collection("users")
    .where("type", "==", type)
    .orderBy("trips", "desc")
    .limit(50)
    .get();

  const all: LeaderboardEntry[] = snap.docs.map((doc) => {
    const data = doc.data() as UserProfile;
    return { uid: doc.id, name: data.name, rating: data.rating, trips: data.trips };
  });

  const top10 = all.slice(0, 10);
  const myIndex = all.findIndex((u) => u.uid === decoded.uid);
  const myRank = myIndex === -1 ? null : myIndex + 1;

  return NextResponse.json({ top: top10, myRank, myTrips: myIndex === -1 ? null : all[myIndex].trips });
}
