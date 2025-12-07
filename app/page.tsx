"use client";

import { useEffect, useState } from "react";
import type { Table, ReservationForm } from "@/types/reservation";

export default function ReservationPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);

  const [showPopup, setShowPopup] = useState(false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [filterDate, setFilterDate] = useState<string>("");

  const [form, setForm] = useState<ReservationForm>({
    customerName: "",
    phone: "",
    guestCount: 2,
    reservationTime: "",
  });

  const [errors, setErrors] = useState({
    customerName: "",
    phone: "",
    guestCount: "",
    reservationTime: "",
  });

  useEffect(() => {
    fetch("/api/tables")
      .then((res) => res.json())
      .then((data: Table[]) => {
        setTables(data);
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
    setShowPopup(true);
  };

  const closePopup = () => {
    setSelectedTable(null);
    setShowPopup(false);
    setForm({
      customerName: "",
      phone: "",
      guestCount: 2,
      reservationTime: "",
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

  const validateForm = () => {
    const newErrors = {
      customerName: "",
      phone: "",
      guestCount: "",
      reservationTime: "",
    };

    if (!form.customerName.trim()) {
      newErrors.customerName = "Vui lòng nhập họ tên";
    }

    if (!form.phone.trim()) {
      newErrors.phone = "Vui lòng nhập số điện thoại";
    } else if (!/^0\d{9}$/.test(form.phone)) {
      newErrors.phone = "Số điện thoại không hợp lệ (10 số)";
    }

    if (form.guestCount < 1) {
      newErrors.guestCount = "Số lượng khách phải ≥ 1";
    }

    if (!form.reservationTime) {
      newErrors.reservationTime = "Vui lòng chọn ngày giờ";
    } else if (new Date(form.reservationTime) < new Date()) {
      newErrors.reservationTime = "Không được chọn thời gian trong quá khứ";
    }

    if (selectedTable?.reservations?.length) {
      const selectedTime = new Date(form.reservationTime).getTime();

      for (const booking of selectedTable.reservations) {
        const existing = new Date(booking.reservationTime).getTime();

        const diffHours = Math.abs(selectedTime - existing) / (1000 * 60 * 60);

        if (diffHours < 3) {
          newErrors.reservationTime =
            "Khung giờ này đã có người đặt, vui lòng chọn thời gian cách ít nhất 3 tiếng hoặc chọn bàn khác.";
          break;
        }
      }
    }

    setErrors(newErrors);

    // Kiểm tra nếu có error → return false
    return Object.values(newErrors).every((e) => e === "");
  };

  const submit = async () => {
    if (!selectedTable) return;

    if (!validateForm()) {
      return;
    }
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
      closePopup();
    } else {
      alert("Lỗi khi đặt bàn");
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F5F1] bg-[url('/images/forest-texture.png')] bg-fixed bg-cover px-4 py-6 sm:p-8">
      {/* Logo */}
      <div className="flex justify-center mt-2 mb-8">
        <img
          src="/images/logo.jpg"
          alt="logo"
          className="
          rounded-full w-32 h-32 border-4 border-white
          shadow-[0_5px_20px_rgba(0,0,0,0.2)]
        "
        />
      </div>

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
            className="
            w-full px-4 py-3
            rounded-xl border border-[#CAD2C5] bg-white shadow-sm
            text-gray-700 text-sm
            focus:ring-2 focus:ring-[#52796F] focus:border-[#52796F]
            transition
          "
          />
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <p className="text-center text-gray-600">Đang tải danh sách bàn...</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
          {filteredTables.map((table) => (
            <div
              key={table.id}
              onClick={() => openPopup(table)}
              className="
              animate-fadeIn p-5 rounded-2xl
              bg-white/90 backdrop-blur-sm
              border border-[#DDE5E1]
              shadow-md hover:shadow-xl
              transition cursor-pointer text-center
              hover:-translate-y-1 hover:scale-[1.03]
            "
            >
              <p className="font-bold text-lg text-[#2E4F3D]">{table.name}</p>
              <p className="text-sm text-gray-600">{table.capacity} ghế</p>

              {table.reservationCount > 0 && (
                <p className="text-xs text-red-600 font-semibold mt-2">
                  {table.reservationCount} lượt đặt trước
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Popup */}
      {showPopup && selectedTable && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center p-4 z-50 animate-fadeIn">
          <div className="bg-[#FAF9F7] rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-[#E5E5E5] animate-scaleFade">
            <h2 className="text-2xl font-bold mb-4 text-center text-[#2E4F3D] tracking-wide">
              Đặt bàn: {selectedTable.name}
            </h2>

            {/* Existing reservations */}
            {selectedTable.reservations?.length > 0 && (
              <div className="bg-[#E8F0EB] rounded-lg p-3 mb-4 border border-[#C8D6CD]">
                <p className="font-semibold text-[#2E4F3D] text-sm mb-1">
                  Các khách đã đặt:
                </p>

                {selectedTable.reservations.map((r, index) => (
                  <div key={index} className="text-sm text-gray-800 mb-1">
                    <span className="font-bold text-[#354F39]">
                      {r.customerName}
                    </span>{" "}
                    {new Date(r.reservationTime).toLocaleString("vi-VN")}
                  </div>
                ))}
              </div>
            )}

            {/* Form */}
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
                {errors.customerName && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.customerName}
                  </p>
                )}
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
                {errors.phone && (
                  <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                )}
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
                {errors.guestCount && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.guestCount}
                  </p>
                )}
              </div>

              {/* Time */}
              <div>
                <input
                  type="datetime-local"
                  min={getMinDateTime()}
                  className="
                  w-full border border-[#D3DCD2] rounded-xl p-3 text-sm
                  focus:ring-2 focus:ring-[#52796F] focus:border-[#52796F]
                  bg-white shadow-inner
                "
                  onChange={(e) =>
                    setForm({ ...form, reservationTime: e.target.value })
                  }
                />
                {errors.reservationTime && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.reservationTime}
                  </p>
                )}
              </div>
            </div>

            {/* Buttons */}
            <div className="mt-5 space-y-2">
              <button
                onClick={submit}
                className="
                w-full bg-[#52796F] text-white p-3 rounded-lg font-semibold 
                hover:bg-[#395B50] transition shadow-md
              "
              >
                Xác nhận đặt bàn
              </button>

              <button
                onClick={closePopup}
                className="
                w-full bg-gray-200 text-gray-700 p-3 rounded-lg 
                hover:bg-gray-300 transition
              "
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
