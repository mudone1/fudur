export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb, verifyRequestToken } from "@/lib/firebase/admin";
import type { TrustedContact } from "@/types";

export async function GET(request: Request) {
  const decoded = await verifyRequestToken(request);
  if (!decoded) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const snap = await adminDb
    .collection("users")
    .doc(decoded.uid)
    .collection("trustedContacts")
    .get();

  const contacts: TrustedContact[] = snap.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<TrustedContact, "id">),
  }));

  return NextResponse.json({ contacts });
}

export async function POST(request: Request) {
  const decoded = await verifyRequestToken(request);
  if (!decoded) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
  if (!name || !phone) {
    return NextResponse.json({ error: "Name and phone are required" }, { status: 400 });
  }

  const ref = await adminDb
    .collection("users")
    .doc(decoded.uid)
    .collection("trustedContacts")
    .add({ name, phone, createdAt: FieldValue.serverTimestamp() });

  return NextResponse.json({ contact: { id: ref.id, name, phone } });
}
