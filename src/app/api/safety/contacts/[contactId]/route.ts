export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { adminDb, verifyRequestToken } from "@/lib/firebase/admin";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ contactId: string }> }
) {
  const decoded = await verifyRequestToken(request);
  if (!decoded) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  const { contactId } = await params;
  await adminDb
    .collection("users")
    .doc(decoded.uid)
    .collection("trustedContacts")
    .doc(contactId)
    .delete();

  return NextResponse.json({ ok: true });
}
