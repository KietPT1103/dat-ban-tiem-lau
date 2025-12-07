import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  const body = await req.json();

  const doc = await adminDb.collection("tables").add({
    name: body.name,
    capacity: body.capacity,
    type: body.type ?? "regular",
    description: body.description ?? "",
  });

  return NextResponse.json({ success: true, id: doc.id });
}

export async function GET() {
  const snapshot = await adminDb.collection("tables").get();
  const tables = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  return NextResponse.json(tables);
}
