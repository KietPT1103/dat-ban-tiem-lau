"use client";

import { useEffect, useState } from "react";

export default function ReservationPage() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    tableId: "",
    customerName: "",
    phone: "",
    guestCount: 2,
    reservationTime: "",
  });

  useEffect(() => {
    fetch("/api/tables")
      .then((res) => res.json())
      .then((data) => {
        setTables(data);
        setLoading(false);
      });
  }, []);

  const submit = async () => {
    const res = await fetch("/api/reservations", {
      method: "POST",
      body: JSON.stringify(form),
    });

    const data = await res.json();
    if (data.success) alert("Đặt bàn thành công!");
    else alert("Lỗi khi đặt bàn");
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Đặt bàn quán lẩu</h1>

      {loading ? (
        <p>Đang tải danh sách bàn...</p>
      ) : (
        <>
          <label className="font-medium">Chọn bàn</label>
          <select
            className="w-full border p-2 mb-3 rounded"
            value={form.tableId}
            onChange={(e) => setForm({ ...form, tableId: e.target.value })}
          >
            <option value="">-- Chọn bàn --</option>
            {tables.map((t: any) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.capacity} ghế)
              </option>
            ))}
          </select>

          <input
            placeholder="Tên khách"
            className="w-full border p-2 mb-3 rounded"
            onChange={(e) => setForm({ ...form, customerName: e.target.value })}
          />

          <input
            placeholder="Số điện thoại"
            className="w-full border p-2 mb-3 rounded"
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />

          <input
            type="number"
            placeholder="Số khách"
            className="w-full border p-2 mb-3 rounded"
            min={1}
            onChange={(e) =>
              setForm({ ...form, guestCount: Number(e.target.value) })
            }
          />

          <input
            type="datetime-local"
            className="w-full border p-2 mb-3 rounded"
            onChange={(e) =>
              setForm({ ...form, reservationTime: e.target.value })
            }
          />

          <button
            onClick={submit}
            className="w-full bg-red-600 text-white p-3 rounded mt-2"
          >
            Đặt bàn
          </button>
        </>
      )}
    </div>
  );
}
