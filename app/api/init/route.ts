import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET() {
  try {
    const tablesRef = adminDb.collection("tables");

    // 1) XÓA TOÀN BỘ BÀN HIỆN TẠI
    const snap = await tablesRef.get();
    const batch = adminDb.batch();

    snap.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    // 2) TẠO 50 BÀN MỚI
    const batch2 = adminDb.batch();

    for (let i = 1; i <= 50; i++) {
      const docRef = tablesRef.doc(); // Firestore tự tạo ID
      batch2.set(docRef, {
        name: `Bàn ${i}`,
        capacity: i <= 10 ? 2 : i <= 30 ? 4 : 6,   // tuỳ bạn muốn điều chỉnh
        createdAt: new Date(),
      });
    }

    await batch2.commit();

    return NextResponse.json({
      success: true,
      message: "Đã tạo mới 50 bàn theo thứ tự.",
    });

  } catch (error) {
    console.error("RESET TABLES ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Không thể tạo bàn." },
      { status: 500 }
    );
  }
}
