import React, { useEffect, useState } from "react";
import { fetchApi } from "../../lib/api/client";
import { CheckCircle2, Clock, Loader2, MapPin, User, Stethoscope } from "lucide-react";

interface PendingService {
  id: string;
  record_id: string;
  status: string;
  assigned_at: string;
  room_name: string;
  room_type: string;
  floor: number;
  room_number: string;
  patient_name?: string;
  diagnosis?: string;
}

export function ServiceUpdateDashboard({ recordId }: { recordId?: string | null }) {
  const [services, setServices] = useState<PendingService[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadPending = () => {
    const url = recordId ? `/services/records/${recordId}` : "/services/pending";
    fetchApi(url)
      .then((data) => {
        if (data && data.services) {
          setServices(data.services);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPending();
    const interval = setInterval(loadPending, 8000);
    return () => clearInterval(interval);
  }, [recordId]);

  const handleComplete = async (serviceId: string) => {
    setUpdatingId(serviceId);
    try {
      await fetchApi(`/services/${serviceId}/complete`, { method: "POST" });
      setServices((prev) =>
        prev.map((s) => (s.id === serviceId ? { ...s, status: "completed" } : s))
      );
    } catch (err) {
      alert("Lỗi khi cập nhật trạng thái");
    } finally {
      setUpdatingId(null);
    }
  };

  const pendingCount = services.filter((s) => s.status !== "completed").length;

  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Cập nhật trạng thái (Phòng chức năng)</h2>
          <p className="text-[13px] text-slate-500">
            Danh sách bệnh nhân đang chờ tại các phòng ban
          </p>
        </div>
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full font-bold text-sm ${
            pendingCount > 0 ? "bg-orange-100 text-orange-600" : "bg-slate-100 text-slate-400"
          }`}
        >
          {pendingCount}
        </div>
      </div>

      {loading && services.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 text-slate-500">
          <Loader2 className="h-6 w-6 animate-spin mb-2" />
          <p className="text-sm font-medium">Đang tải danh sách chờ...</p>
        </div>
      ) : services.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-slate-400">
          <CheckCircle2 className="h-10 w-10 mb-2 opacity-20 text-emerald-500" />
          <p className="text-[14px]">Tuyệt vời! Không còn bệnh nhân nào đang chờ.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {services.map((srv) => (
            <div
              key={srv.id}
              className={`flex flex-col justify-between rounded-xl border p-4 transition-all hover:shadow-md ${
                srv.status === "completed"
                  ? "border-emerald-100 bg-emerald-50/30"
                  : "border-slate-100 bg-slate-50"
              }`}
            >
              <div>
                {/* Status badge */}
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`rounded px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                      srv.status === "completed"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-orange-100 text-orange-600"
                    }`}
                  >
                    {srv.status === "completed" ? "Hoàn thành" : "Đang chờ"}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {srv.record_id ? srv.record_id.slice(0, 8) : "—"}
                  </span>
                </div>

                {/* Room name */}
                <h3 className="font-bold text-slate-800 text-[15px] mb-2">{srv.room_name}</h3>

                {/* Patient name */}
                {srv.patient_name && srv.patient_name !== "—" && (
                  <div className="flex items-center gap-2 text-[12px] text-slate-600 mb-1">
                    <User className="h-3.5 w-3.5 shrink-0 text-[#0A9BAD]" />
                    <span className="font-semibold">{srv.patient_name}</span>
                  </div>
                )}

                {/* Diagnosis */}
                {srv.diagnosis && (
                  <div className="flex items-start gap-2 text-[12px] text-slate-500 mb-1">
                    <Stethoscope className="h-3.5 w-3.5 shrink-0 mt-0.5 text-slate-400" />
                    <span className="leading-tight">{srv.diagnosis}</span>
                  </div>
                )}

                {/* Location */}
                <div className="flex items-center gap-2 text-[12px] text-slate-500 mt-2">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  Tầng {srv.floor} · Phòng {srv.room_number}
                </div>

                {/* Time */}
                {srv.assigned_at && (
                  <div className="flex items-center gap-2 text-[12px] text-slate-400 mt-1">
                    <Clock className="h-3.5 w-3.5 shrink-0" />
                    {new Date(srv.assigned_at).toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                )}
              </div>

              {/* Complete button */}
              <button
                onClick={() => handleComplete(srv.id)}
                disabled={updatingId === srv.id || srv.status === "completed"}
                className={`mt-4 flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-[13px] font-bold transition-colors disabled:opacity-50 ${
                  srv.status === "completed"
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                    : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 active:scale-95"
                }`}
              >
                {updatingId === srv.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                {srv.status === "completed" ? "Đã Hoàn Thành" : "Đánh dấu Hoàn Thành"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
