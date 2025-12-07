import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-client";
import { collection, getDocs } from "firebase/firestore";
import type { ReservationItem } from "@/types/reservation";

export async function GET() {
  const tablesSnap = await getDocs(collection(db, "tables"));
  const reservationsSnap = await getDocs(collection(db, "reservations"));

  // Convert reservations safely & include ID
  const reservations: ReservationItem[] = reservationsSnap.docs.map((d) => {
    const raw = d.data() as any;

    return {
      id: d.id, 
      tableId: raw.tableId,
      customerName: raw.customerName,
      phone: raw.phone,
      guestCount: raw.guestCount,
      reservationTime: raw.reservationTime?.seconds
        ? new Date(raw.reservationTime.seconds * 1000).toISOString()
        : "",
      createdAt: raw.createdAt?.seconds
        ? new Date(raw.createdAt.seconds * 1000).toISOString()
        : "",
    };
  });

  const tables = tablesSnap.docs.map((doc) => {
    const table = doc.data() as any;

    // group reservations by tableId
    const bookings = reservations.filter((r) => r.tableId === table.id);

    return {
      ...table,
      reservationCount: bookings.length,
      reservations: bookings,
    };
  });

  return NextResponse.json(tables);
}
