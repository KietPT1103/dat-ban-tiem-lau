import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

/**
 * CREATE NEW RESERVATION
 */
export async function POST(req: Request) {
  const data = await req.json();

  if (
    !data.tableId ||
    !data.customerName ||
    !data.phone ||
    !data.reservationTime
  ) {
    return NextResponse.json(
      { success: false, message: "Missing fields" },
      { status: 400 }
    );
  }

  const doc = await adminDb.collection("reservations").add({
    tableId: data.tableId,
    customerName: data.customerName,
    phone: data.phone,
    guestCount: data.guestCount,
    reservationTime: new Date(data.reservationTime),
    createdAt: new Date(),
  });

  return NextResponse.json({ success: true, id: doc.id });
}

/**
 * GET ALL RESERVATIONS
 */
export async function GET() {
  const snapshot = await adminDb
    .collection("reservations")
    .orderBy("createdAt", "desc")
    .get();

  const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  return NextResponse.json(data);
}

/**
 * DELETE – two modes:
 * 1) Xoá theo id:   { id: "reservationId" }
 * 2) Xoá theo ngày: { date: "YYYY-MM-DD" }
 */
export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { id, date } = body;

    // --------------------------
    // CASE 1: delete by ID
    // --------------------------
    if (id) {
      await adminDb.collection("reservations").doc(id).delete();
      return NextResponse.json({
        success: true,
        message: "Huỷ đặt bàn thành công",
      });
    }

    // --------------------------
    // CASE 2: delete by DATE (YYYY-MM-DD)
    // --------------------------
    if (date) {
      const snap = await adminDb.collection("reservations").get();

      const batch = adminDb.batch();
      let deleted = 0;

      snap.forEach((doc) => {
        const data = doc.data();

        if (!data.reservationTime?.seconds) return;

        const resDate = new Date(data.reservationTime.seconds * 1000)
          .toISOString()
          .slice(0, 10);

        if (resDate === date) {
          batch.delete(doc.ref);
          deleted++;
        }
      });

      if (deleted > 0) await batch.commit();

      return NextResponse.json({
        success: true,
        message: `Đã xoá ${deleted} đơn của ngày ${date}`,
      });
    }

    // --------------------------
    // INVALID REQUEST
    // --------------------------
    return NextResponse.json(
      { success: false, message: "Missing id or date" },
      { status: 400 }
    );
  } catch (error) {
    console.error("DELETE ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Delete failed" },
      { status: 500 }
    );
  }
}
