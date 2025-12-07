import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  const data = await req.json();

  if (!data.tableId || !data.customerName || !data.phone || !data.reservationTime) {
    return NextResponse.json({ success: false, message: "Missing fields" }, { status: 400 });
  }

  const doc = await adminDb.collection("reservations").add({
    tableId: data.tableId,
    customerName: data.customerName,
    phone: data.phone,
    guestCount: data.guestCount,
    reservationTime: new Date(data.reservationTime),
    status: "pending",
    createdAt: new Date(),
  });

  return NextResponse.json({ success: true, id: doc.id });
}

export async function GET() {
  const snapshot = await adminDb
    .collection("reservations")
    .orderBy("createdAt", "desc")
    .get();

  const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  return NextResponse.json(data);
}
