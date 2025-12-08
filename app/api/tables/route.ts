import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { collection, getDocs } from "firebase/firestore";
import type { ReservationItem, Table } from "@/types/reservation";

interface TableDoc {
  name: string;
  capacity: number;
}

interface ReservationDoc {
  tableId: string;
  customerName: string;
  phone: string;
  guestCount: number;
  reservationTime?: { seconds: number };
}

export async function GET() {
  // Lấy danh sách bàn
  const tablesSnap = await adminDb.collection("tables").get();
  const reservationsSnap = await adminDb.collection("reservations").get();

  // Chuẩn hoá reservation
  const reservations: ReservationItem[] = reservationsSnap.docs.map((doc) => {
    const raw = doc.data() as ReservationDoc;

    return {
      id: doc.id,
      tableId: raw.tableId,
      customerName: raw.customerName ?? "",
      phone: raw.phone ?? "",
      guestCount: raw.guestCount ?? 0,
      reservationTime: raw.reservationTime?.seconds
        ? new Date(raw.reservationTime.seconds * 1000).toISOString()
        : "",
    };
  });

  // Build danh sách Table
  const tables: Table[] = tablesSnap.docs.map((doc) => {
    const raw = doc.data() as TableDoc;
    const tableId = doc.id;

    const bookings = reservations.filter((r) => r.tableId === tableId);

    return {
      id: tableId,
      name: raw.name,
      capacity: raw.capacity,
      reservationCount: bookings.length,
      reservations: bookings,
    };
  });

  return NextResponse.json(tables);
}
