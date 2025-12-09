"use client";

import { useEffect, useState } from "react";
import type { Table, ReservationForm } from "@/types/reservation";

export default function ReservationPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);

  const [showPopup, setShowPopup] = useState(false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [filterDate, setFilterDate] = useState<string>("");

  const [showReservationsPopup, setShowReservationsPopup] = useState(false);
  const [showCreatePopup, setShowCreatePopup] = useState(false);

  const [form, setForm] = useState<ReservationForm>({
    customerName: "",
    phone: "",
    guestCount: 2,
    reservationTime: "",
    note: "",
  });

  useEffect(() => {
    fetch("/api/tables")
      .then((res) => res.json())
      .then((data: Table[]) => {
        // Sort bàn theo số trong name
        const sorted = data.sort((a, b) => {
          const numA = parseInt(a.name.replace("Bàn ", ""));
          const numB = parseInt(b.name.replace("Bàn ", ""));
          return numA - numB;
        });

        setTables(sorted);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const runCleanup = async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const date = yesterday.toISOString().slice(0, 10);
      console.log("Cleaning table...");
      await fetch("/api/reservations", {
        method: "DELETE",
        body: JSON.stringify({ date }),
      });
    };

    runCleanup();
  }, []);

  const openPopup = (table: Table) => {
    setSelectedTable(table);
    console.log(table);
    if (!table.reservations || table.reservations.length === 0) {
      setShowCreatePopup(true);
    } else {
      setShowReservationsPopup(true);
    }
  };

  const closePopup = () => {
    setSelectedTable(null);
    setShowPopup(false);
    setForm({
      customerName: "",
      phone: "",
      guestCount: 2,
      reservationTime: "",
      note: "",
    });
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset()); // fix lệch múi giờ
    return now.toISOString().slice(0, 16);
  };

  const filteredTables = filterDate
    ? tables.filter((table) =>
        table.reservations?.some(
          (r) => r.reservationTime.slice(0, 10) === filterDate
        )
      )
    : tables;

  const submit = async () => {
    if (!selectedTable) return;
    const payload = {
      tableId: selectedTable.id,
      ...form,
    };
    const res = await fetch("/api/reservations", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (data.success) {
      alert("Đặt bàn thành công!");
      fetch("/api/tables")
        .then((res) => res.json())
        .then((tablesData) => {
          // Sort lại
          const sorted = tablesData.sort((a: Table, b: Table) => {
            const numA = parseInt(a.name.replace("Bàn ", ""));
            const numB = parseInt(b.name.replace("Bàn ", ""));
            return numA - numB;
          });

          setTables(sorted);
        });

      closePopup();
      setShowCreatePopup(false);
    } else {
      alert("Lỗi khi đặt bàn");
    }
  };

  const deleteReservation = async (
    reservationId: string,
    customerName: string
  ) => {
    if (!confirm(`Bạn có chắc muốn huỷ đặt bàn của khách: "${customerName}" ?`))
      return;

    const res = await fetch("/api/reservations", {
      method: "DELETE",
      body: JSON.stringify({ id: reservationId }),
    });

    const data = await res.json();

    if (data.success) {
      alert(`Đã xoá đặt bàn của "${customerName}" thành công!`);

      // Cập nhật selectedTable local
      setSelectedTable({
        ...selectedTable!,
        reservations: (selectedTable?.reservations ?? []).filter(
          (r) => r.id !== reservationId
        ),
      });

      // Reload lại bảng
      fetch("/api/tables")
        .then((res) => res.json())
        .then((tablesData) => {
          // Sort lại
          const sorted = tablesData.sort((a: Table, b: Table) => {
            const numA = parseInt(a.name.replace("Bàn ", ""));
            const numB = parseInt(b.name.replace("Bàn ", ""));
            return numA - numB;
          });

          setTables(sorted);
        });
    } else {
      alert("Không thể xoá, vui lòng thử lại.");
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F5F1] bg-fixed bg-cover px-4 py-6 sm:p-8">
      {/* Title */}
      <h1 className="text-3xl font-bold text-center tracking-wide text-[#2E4F3D] mb-6">
        Danh sách Bàn
      </h1>

      {/* Date filter */}
      <div className="flex justify-center mb-6">
        <div className="relative w-full max-w-xs">
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            placeholder="Tìm theo ngày"
            className="
            w-full px-4 py-3
            rounded-xl border border-[#CAD2C5] bg-white shadow-sm
            text-gray-700 text-sm
            focus:ring-2 focus:ring-[#52796F] focus:border-[#52796F]
            transition
          "
          />
        </div>
        {filterDate && (
          <button
            onClick={() => setFilterDate("")}
            className="text-red-500 hover:text-red-700 text-sm px-2 py-1 rounded hover:bg-red-50 transition"
            title="Clear date"
          >
            ✕
          </button>
        )}
      </div>

      {/* Loading */}
      {loading ? (
        <p className="text-center text-gray-600">Đang tải danh sách bàn...</p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-5">
          {filteredTables.map((table) => (
            <div
              key={table.id}
              onClick={() => openPopup(table)}
              className={`
                animate-fadeIn p-3 rounded-2xl
                backdrop-blur-sm border border-[#DDE5E1]
                shadow-md hover:shadow-xl transition cursor-pointer text-center
                hover:-translate-y-1 hover:scale-[1.03]
                ${
                  (table.reservationCount ?? 0) > 0
                    ? "bg-[#25466f] text-white"
                    : ""
                }
              `}
            >
              <p className="font-bold text-lg">{table.name}</p>
              {(table.reservationCount ?? 0) > 0 && (
                <p className="text-xs font-semibold mt-2 text-red-600 border border-red-400 rounded-full px-2 py-[2px] bg-red-50 shadow-sm">
                  {table.reservationCount} lượt
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Popup */}
      {showReservationsPopup && selectedTable && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 shadow-xl w-full max-w-sm animate-scaleFade">
            {/* TITLE */}
            <h2 className="text-2xl font-bold text-[#2E4F3D] mb-4 text-center tracking-wide">
              Đặt bàn – {selectedTable.name}
            </h2>

            {/* NO RESERVATION */}
            {(selectedTable.reservations?.length ?? 0) === 0 && (
              <div className="text-center text-gray-500 py-6 text-sm">
                Chưa có khách nào đặt bàn này.
              </div>
            )}

            {/* LIST */}
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {selectedTable.reservations?.map((r) => (
                <div
                  key={r.id}
                  className="flex justify-between items-center bg-[#F2F5F3] border border-[#DDE5E1] p-3 rounded-lg shadow-sm hover:shadow-md transition"
                >
                  <div>
                    <p className="font-semibold text-[#354F39] text-sm">
                      {r.customerName} - {r.phone}
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {new Date(r.reservationTime).toLocaleString("vi-VN")}
                    </p>
                    {r.note && (
                      <p className="text-xs text-gray-500 mt-1 italic">
                        Ghi chú: {r.note}
                      </p>
                    )}
                  </div>

                  {/* icon Delete */}
                  <button
                    onClick={() => deleteReservation(r.id, r.customerName)}
                    className="text-red-500 hover:text-red-700 text-sm px-2 py-1 rounded hover:bg-red-50 transition"
                    title="Xoá đặt bàn"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {/* BUTTONS */}
            <div className="mt-6 flex justify-between gap-3">
              {/* <button
                onClick={() => {
                  setShowReservationsPopup(false);
                  setShowCreatePopup(true);
                }}
                className="flex-1 bg-[#52796F] text-white py-2 rounded-lg text-sm font-semibold hover:bg-[#395B50] shadow transition"
              >
                + Tạo mới
              </button> */}

              <button
                onClick={() => setShowReservationsPopup(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg text-sm font-semibold hover:bg-gray-300 shadow transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreatePopup && selectedTable && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 shadow-xl w-full max-w-sm">
            <h2 className="text-xl font-bold text-[#2E4F3D] mb-4">
              Tạo đặt bàn – {selectedTable.name}
            </h2>

            {/* Form như cũ */}
            <div className="space-y-3">
              {/* Name */}
              <div>
                <input
                  placeholder="Họ và tên"
                  className="
                  w-full border border-[#D3DCD2] rounded-xl p-3 text-sm
                  focus:ring-2 focus:ring-[#52796F] focus:border-[#52796F]
                  bg-white shadow-inner
                "
                  onChange={(e) =>
                    setForm({ ...form, customerName: e.target.value })
                  }
                />
              </div>

              {/* Phone */}
              <div>
                <input
                  placeholder="Số điện thoại"
                  className="
                  w-full border border-[#D3DCD2] rounded-xl p-3 text-sm
                  focus:ring-2 focus:ring-[#52796F] focus:border-[#52796F]
                  bg-white shadow-inner
                "
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>

              {/* Guests */}
              <div>
                <input
                  type="number"
                  min={1}
                  placeholder="Số lượng khách"
                  className="
                  w-full border border-[#D3DCD2] rounded-xl p-3 text-sm
                  focus:ring-2 focus:ring-[#52796F] focus:border-[#52796F]
                  bg-white shadow-inner
                "
                  onChange={(e) =>
                    setForm({ ...form, guestCount: Number(e.target.value) })
                  }
                />
              </div>

              {/* Time */}
              <div>
                <input
                  type="datetime-local"
                  min={getMinDateTime()}
                  placeholder="Ngày và giờ đặt"
                  className="
                  w-full border border-[#D3DCD2] rounded-xl p-3 text-sm
                  focus:ring-2 focus:ring-[#52796F] focus:border-[#52796F]
                  bg-white shadow-inner
                "
                  onChange={(e) =>
                    setForm({ ...form, reservationTime: e.target.value })
                  }
                />
              </div>

              {/* Note */}
              <div>
                <textarea
                  placeholder="Ghi chú"
                  className="
                    w-full border border-[#D3DCD2] rounded-xl p-3 text-sm
                    focus:ring-2 focus:ring-[#52796F] focus:border-[#52796F]
                    bg-white shadow-inner
                    "
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center justify-between mt-4 gap-2">
              <button
                onClick={() => setShowCreatePopup(false)}
                className="w-full bg-gray-300 p-3 rounded-lg"
              >
                Đóng
              </button>
              <button
                onClick={submit}
                className="w-full bg-[#52796F] text-white p-3 rounded-lg font-semibold"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
