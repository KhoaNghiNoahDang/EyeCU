import React, { useEffect, useState } from "react";
import { fetchApi } from "../../lib/api/client";
import { Check, Loader2, Plus, X } from "lucide-react";

interface FunctionalRoom {
  id: string;
  name: string;
  room_type: string;
  floor: number;
  room_number: string;
}

interface ServiceAssignmentFieldProps {
  selectedRoomIds: string[];
  onChange: (ids: string[]) => void;
  isProcessing?: boolean;
  suggestedServices?: string[];
  planText?: string;
}

const KEYWORD_RULES: { kw: string[]; roomName: string }[] = [
  { kw: ["tai mũi họng", "amidan", "viêm họng", "viêm mũi", "viêm xoang", "tmh"],  roomName: "Phòng Khám Tai Mũi Họng" },
  { kw: ["mắt", "viêm kết mạc"],                                                     roomName: "Phòng Khám Mắt" },
  { kw: ["da liễu", "viêm da", "dị ứng"],                                            roomName: "Phòng Khám Da Liễu" },
  { kw: ["nhi", "trẻ em"],                                                           roomName: "Phòng Khám Nhi" },
  { kw: ["tim mạch", "tăng huyết áp", "suy tim", "điện tim", "ecg"],               roomName: "Phòng Khám Tim Mạch" },
  { kw: ["nội tiết", "đái tháo đường", "tuyến giáp"],                               roomName: "Phòng Khám Nội Tiết" },
  { kw: ["thần kinh", "đau đầu", "tiền đình"],                                      roomName: "Phòng Khám Thần Kinh" },
  { kw: ["cơ xương khớp", "khớp", "gút", "thoát vị", "viêm khớp"],               roomName: "Phòng Khám Cơ Xương Khớp" },
  { kw: ["tiêu hóa", "dạ dày", "ruột", "đại tràng"],                               roomName: "Phòng Khám Tiêu Hóa" },
  { kw: ["hô hấp", "phế quản", "phổi", "ho nhiều", "khó thở"],                    roomName: "Phòng Khám Hô Hấp" },
  { kw: ["răng", "hàm mặt", "nha"],                                                 roomName: "Phòng Khám Răng Hàm Mặt" },
  { kw: ["sản", "phụ khoa", "thai"],                                                roomName: "Phòng Khám Sản Phụ Khoa" },
  { kw: ["xét nghiệm máu", "công thức máu", "huyết học"],                          roomName: "Phòng Lấy Máu Xét Nghiệm 1" },
  { kw: ["xét nghiệm nước tiểu", "nước tiểu"],                                     roomName: "Phòng Lấy Mẫu Nước Tiểu / Phân" },
  { kw: ["sinh hóa", "đường huyết", "cholesterol", "hba1c", "gan", "creatinin"],   roomName: "Phòng Lấy Máu Xét Nghiệm 1" },
  { kw: ["x-quang", "x quang", "xquang", "chụp phổi"],                            roomName: "Phòng X-Quang 1" },
  { kw: ["siêu âm bụng", "siêu âm tổng quát"],                                    roomName: "Phòng Siêu Âm Tổng Quát" },
  { kw: ["siêu âm tim"],                                                            roomName: "Phòng Siêu Âm Tim - Mạch Máu" },
  { kw: ["điện tâm đồ", "điện tim", "đo điện tim"],                               roomName: "Phòng Điện Tâm Đồ (ECG)" },
  { kw: ["nội soi dạ dày", "nội soi đại tràng"],                                   roomName: "Phòng Nội Soi Dạ Dày - Đại Tràng" },
  { kw: ["nội soi tai mũi họng"],                                                   roomName: "Phòng Nội Soi Tai Mũi Họng" },
  { kw: ["ct scan", "cắt lớp"],                                                    roomName: "Phòng Chụp Cắt Lớp Vi Tính (CT)" },
];

const TYPE_ORDER = ["khám bệnh", "xét nghiệm", "thăm dò chức năng", "chẩn đoán hình ảnh"];
const TYPE_LABEL: Record<string, string> = {
  "khám bệnh": "Khám bệnh",
  "xét nghiệm": "Xét nghiệm",
  "thăm dò chức năng": "Thăm dò chức năng",
  "chẩn đoán hình ảnh": "Chẩn đoán hình ảnh",
};

export function ServiceAssignmentField({
  selectedRoomIds,
  onChange,
  isProcessing,
  suggestedServices = [],
  planText = "",
}: ServiceAssignmentFieldProps) {
  const [rooms, setRooms] = useState<FunctionalRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasAutoAssigned, setHasAutoAssigned] = useState(false);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetchApi("/services/rooms")
      .then((data) => {
        if (data && data.rooms) setRooms(data.rooms);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Auto assign using keyword rules
  useEffect(() => {
    if ((suggestedServices.length > 0 || planText) && rooms.length > 0 && !hasAutoAssigned) {
      const combinedText = [...suggestedServices, planText].join(" ").toLowerCase();
      const roomByName = Object.fromEntries(rooms.map((r) => [r.name, r]));
      const matchedIds = new Set<string>();

      for (const rule of KEYWORD_RULES) {
        if (rule.kw.some((kw) => combinedText.includes(kw))) {
          const room = roomByName[rule.roomName];
          if (room) matchedIds.add(room.id);
        }
      }

      const newIds = Array.from(matchedIds);
      if (newIds.length > 0) onChange(newIds);
      setHasAutoAssigned(true);
    }
  }, [suggestedServices, planText, rooms, hasAutoAssigned, onChange]);

  const toggleRoom = (id: string) => {
    if (selectedRoomIds.includes(id)) {
      onChange(selectedRoomIds.filter((x) => x !== id));
    } else {
      onChange([...selectedRoomIds, id]);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-slate-500 p-4 rounded-xl border border-slate-200 bg-white">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Đang tải danh sách phòng...</span>
      </div>
    );
  }

  // Group all rooms by type
  const groupedAll = rooms.reduce((acc, room) => {
    const key = room.room_type?.toLowerCase().trim() || "khác";
    if (!acc[key]) acc[key] = [];
    acc[key].push(room);
    return acc;
  }, {} as Record<string, FunctionalRoom[]>);

  const selectedCount = selectedRoomIds.length;

  // Types with selections
  const typeOrder = [...TYPE_ORDER, ...Object.keys(groupedAll).filter((t) => !TYPE_ORDER.includes(t))];

  return (
    <div className="flex flex-col rounded-xl border border-[#88E8F2] bg-white transition-all">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#88E8F2]/40">
        <label className="text-sm font-bold text-[#0A9BAD]">
          Thứ tự khám tự động (AI) · {selectedCount} phòng đã chọn
        </label>
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="text-[11px] font-bold text-[#0A9BAD] hover:underline flex items-center gap-1"
        >
          {showAll ? "Ẩn bớt" : <><Plus className="h-3 w-3" /> Chọn thêm phòng</>}
        </button>
      </div>

      <div className="p-4 space-y-4">
        {typeOrder.map((type) => {
          const allRoomsOfType = groupedAll[type] || [];
          const selectedOfType = allRoomsOfType.filter((r) => selectedRoomIds.includes(r.id));

          // In collapsed mode, show only selected rooms; in expanded, show all
          const roomsToShow = showAll ? allRoomsOfType : selectedOfType;
          if (roomsToShow.length === 0) return null;

          return (
            <div key={type}>
              <p className="mb-2 text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                {TYPE_LABEL[type] || type}
              </p>
              <div className="flex flex-wrap gap-2">
                {roomsToShow.map((room) => {
                  const isSelected = selectedRoomIds.includes(room.id);
                  return (
                    <button
                      key={room.id}
                      type="button"
                      onClick={() => toggleRoom(room.id)}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-bold shadow-sm transition-all active:scale-95 ${
                        isSelected
                          ? "bg-[#0A9BAD] text-white"
                          : "bg-slate-100 text-slate-500 hover:bg-[#88E8F2]/40"
                      }`}
                    >
                      {isSelected ? (
                        <Check className="h-3.5 w-3.5 shrink-0" />
                      ) : (
                        <Plus className="h-3.5 w-3.5 shrink-0" />
                      )}
                      {room.name}
                      <span className="text-[10px] opacity-70 font-mono">{room.room_number}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {selectedCount === 0 && !showAll && (
          <p className="text-[13px] text-slate-400 italic">
            AI chưa phát hiện dịch vụ cần chỉ định. Ấn "Chọn thêm phòng" để thêm thủ công.
          </p>
        )}
      </div>
    </div>
  );
}
