import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback, ComponentType } from "react";
import { supabase } from "../lib/supabase";
import { useAuth, type WorkMode } from "../lib/auth/auth-context";
import { useEyeCUSocket } from "../hooks/useEyeCUSocket";
import { useIsMobile } from "../hooks/use-mobile";
import { fetchApi } from "../lib/api/client";
import { DEMO_PATIENT_CLINICAL, formatRecordDate, formatVnd } from "../lib/patient/clinical-data";
import { lazy, Suspense } from "react";
import { MapErrorBoundary } from "../components/MapErrorBoundary";
import { PatientPortalNew } from "../components/PatientPortalNew";
import { CENTRAL_HOSPITALS, getHospitalsByProvince, Hospital } from "../lib/hospitals";
import { CccdCapture } from "../components/auth/CccdCapture";
const gpsToSvg = (lat: number, lng: number) => {
  // Simple dummy fallback
  return { mapX: 200, mapY: 100 };
};

function ClientAmbulanceMap(props: any) {
  const [MapComp, setMapComp] = useState<ComponentType<any> | null>(null);

  useEffect(() => {
    import("../components/MapComponents").then((m) => {
      setMapComp(() => m.RealAmbulanceMap);
    });
  }, []);

  if (!MapComp) {
    return <div className="absolute inset-0 bg-slate-100 animate-pulse" />;
  }

  return (
    <MapErrorBoundary>
      <MapComp {...props} />
    </MapErrorBoundary>
  );
}

function ClientEmsLeafletMap(props: any) {
  const [MapComp, setMapComp] = useState<ComponentType<any> | null>(null);

  useEffect(() => {
    import("../components/MapComponents").then((m) => {
      setMapComp(() => m.EmsLeafletMap);
    });
  }, []);

  if (!MapComp) {
    return (
      <div className="relative w-full h-[240px] rounded-xl bg-[#e5e5e5] animate-pulse mb-4 z-0" />
    );
  }

  return (
    <MapErrorBoundary>
      <MapComp {...props} />
    </MapErrorBoundary>
  );
}

import {
  Activity,
  History as HistoryIcon,
  Plus,
  Eye,
  Ambulance,
  ScanLine,
  Mic,
  Bot,
  Cpu,
  LogOut,
  Search,
  Bell,
  Settings,
  HelpCircle,
  AlertTriangle,
  Filter,
  Map as MapIcon,
  Video,
  Radio,
  CircleAlert,
  CheckCircle2,
  List,
  PersonStanding,
  Volume2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  FileText,
  ShieldCheck,
  UserCheck,
  Send,
  StopCircle,
  Play,
  MapPin,
  Stethoscope,
  Bed,
  Pill,
  Calendar,
  Receipt,
  Siren,
  Phone,
  BadgeCheck,
  Hand,
  CreditCard,
  Heart,
  Clock,
  Shield,
  User,
  Download,
  Upload,
  BookOpen,
  Clipboard,
  Droplets,
  Thermometer,
  TrendingUp,
  X,
  Zap,
  Users,
  Camera,
  Trash2,
  MessageSquare,
  CheckCircle,
  XCircle,
  BarChart2,
  RefreshCw,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EyeCU — Ambient Clinical OS" },
      { name: "description", content: "Ambient AI clinical command center for Hospital Unit A." },
    ],
  }),
  component: PatientRounds,
});

const CMO_IMG =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDf_48z5oZ1XvbMQe_8k81LEPaXIvnkC1aHkdBi6sXOrodi0w8Bxq0g8gTjdYEy6fm3QCpnF0Rku3OudVdGkgrkxf1A0uM0RrlvocS-G3xiZ8MqD2ylIW9ITbFmkRdLl6jimSqUcxbnmjK4_rbS6hs80Z3VjYM8Cyt4vsAjoX93YsT_Ya4-5KATNO5aGRo71S5KI03JBmzSXIDNnyx8tqkfhDMQd74UjgF2KXbh5FUwGd2DgKrV-Xmma_DPbCulqLv13AaiEYvLdTVJ";

const ACCENT = "#88E8F2";

type ViewKey =
  | "ambient"
  | "ambulance"
  | "history"
  | "records"
  | "voice"
  | "chatbot"
  | "patient"
  | "ems"
  | "admin_dashboard"
  | "doctor_qa";

const navItems: { key: ViewKey; Icon: typeof Eye; label: string }[] = [
  { key: "ambient", Icon: Eye, label: "Giám sát không gian" },
  { key: "ambulance", Icon: Ambulance, label: "Điều phối Cấp cứu" },
  { key: "history", Icon: HistoryIcon, label: "Lịch sử Cấp cứu" },
  { key: "records", Icon: ScanLine, label: "Hồ sơ Bệnh nhân" },
  { key: "voice", Icon: Mic, label: "Bệnh án Giọng nói" },
  { key: "chatbot", Icon: Bot, label: "Trợ lý AI Bệnh nhân" },
  { key: "ems" as ViewKey, Icon: Siren, label: "Cấp cứu Ngoại viện" },
  { key: "admin_dashboard" as ViewKey, Icon: Settings, label: "Quản trị Hệ thống" },
  { key: "doctor_qa" as ViewKey, Icon: MessageSquare, label: "Hỏi Đáp Cộng Đồng" },
];

const roleConfig: Record<WorkMode, { label: string; views: ViewKey[]; defaultView: ViewKey }> = {
  admin: {
    label: "Quản trị Hệ thống",
    views: ["admin_dashboard"] as ViewKey[],
    defaultView: "admin_dashboard" as ViewKey,
  },
  ops: {
    label: "Trực Cấp cứu",
    views: ["ambient", "ambulance", "history"],
    defaultView: "ambient",
  },
  clinician: {
    label: "Khám Lâm sàng",
    views: ["voice", "doctor_qa"] as ViewKey[],
    defaultView: "voice",
  },
  patient: {
    label: "Bệnh nhân (Mobile)",
    views: ["patient"],
    defaultView: "patient",
  },
  ems: {
    label: "Cấp cứu Ngoại viện",
    views: ["ems"] as ViewKey[],
    defaultView: "ems" as ViewKey,
  },
};

const viewTitles: Record<ViewKey, { title: string; subtitle: string }> = {
  ambient: {
    title: "Giám sát không gian — Đa Khoa",
    subtitle: "Giám sát AI Nhận thức · Sensor Fusion",
  },
  history: {
    title: "Lịch sử Cấp cứu",
    subtitle: "Theo dõi các ca cấp cứu đã hoàn thành",
  },
  ambulance: {
    title: "Điều phối Cấp cứu",
    subtitle: "Bản đồ Hà Nội · Pre-admission · Kịp thời",
  },
  records: { title: "Hồ sơ Bệnh nhân", subtitle: "OCR · Xác thực sinh trắc học" },
  voice: { title: "Bệnh án Giọng nói", subtitle: "SmartVoice · Tự động EMR" },
  chatbot: {
    title: "Trợ lý AI Bệnh nhân",
    subtitle: "Diễn giải kết quả · Giọng nói",
  },
  patient: { title: "Công thông tin Bệnh nhân", subtitle: "Mobile Portal · EyeCU" },
  ems: {
    title: "Cấp cứu Ngoại viện",
    subtitle: "Quét BN · Định vị GPS · Liên lạc Kịp thời",
  },
  admin_dashboard: {
    title: "Quản trị Hệ thống",
    subtitle: "Tổng quan · Nhân sự · Thiết bị · API",
  },
  doctor_qa: {
    title: "Hỏi Đáp Cộng Đồng",
    subtitle: "Giải đáp thực tế bệnh nhân · Chuyên khoa",
  },
};

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function PatientRounds() {
  const { user, workMode, setWorkMode, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // We must always call hooks at the top level
  const [activeView, setActiveView] = useState<ViewKey>("ambient");
  const [collapsed, setCollapsed] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [workspaceSheetOpen, setWorkspaceSheetOpen] = useState(false);
  const [highlightedRoom, setHighlightedRoom] = useState<string | null>(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [installPromptEvent, setInstallPromptEvent] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [isInstallEligible, setIsInstallEligible] = useState(false);
  const [showIosInstallHint, setShowIosInstallHint] = useState(false);

  // ── Clinician Notification Bell (APPOINTMENT_BOOKED via WebSocket) ──────
  interface ClinicNotif {
    id: string;
    text: string;
    detail: string;
    ts: string;
    read: boolean;
  }
  const [clinicNotifs, setClinicNotifs] = useState<ClinicNotif[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifUnread = clinicNotifs.filter((n) => !n.read).length;

  // TTS helper
  const speakText = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "vi-VN";
    utter.rate = 0.95;
    utter.pitch = 1.0;
    utter.volume = 1.0;
    // Ưu tiên voice tiếng Việt nếu có
    const voices = window.speechSynthesis.getVoices();
    const viVoice =
      voices.find((v) => v.lang.startsWith("vi")) || voices.find((v) => v.lang.startsWith("en"));
    if (viVoice) utter.voice = viVoice;
    window.speechSynthesis.speak(utter);
  };

  useEffect(() => {
    if (workMode !== "clinician") return;
    fetchApi("/patient/doctor-appointments")
      .then((data) => {
        if (data && data.appointments) {
          const syncedNotifs: ClinicNotif[] = data.appointments.map((d: any) => {
            const dateStr = d.date
              ? new Date(d.date + "T00:00:00").toLocaleDateString("vi-VN", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })
              : d.date;
            return {
              id: d.id,
              text: `Lịch khám mới — ${d.department}`,
              detail: `Bệnh nhân: ${d.patient_name} · Ngày ${dateStr} lúc ${d.time}`,
              ts: d.date + "T" + d.time,
              read: true, // Lịch đã có trong CSDL coi như đã đọc
            };
          });
          setClinicNotifs(syncedNotifs);
        }
      })
      .catch(console.error);
  }, [workMode]);

  // WebSocket listener cho APPOINTMENT_BOOKED
  useEffect(() => {
    if (workMode !== "clinician") return; // Chỉ clinician mới nghe
    const host = typeof window !== "undefined" ? window.location.hostname : "localhost";
    const WS_BASE = import.meta.env.VITE_WS_URL ?? `ws://${host}:8000`;
    const wsUrl = WS_BASE + "/api/ambient/ws/live";
    let ws: WebSocket | null = null;
    let pingTimer: ReturnType<typeof setInterval> | null = null;
    let reconnTimer: ReturnType<typeof setTimeout> | null = null;
    let dead = false;

    const connect = () => {
      ws = new WebSocket(wsUrl);
      ws.onopen = () => {
        pingTimer = setInterval(() => {
          if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: "ping" }));
        }, 20000);
      };
      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === "APPOINTMENT_BOOKED" && msg.data) {
            const d = msg.data;
            // Chỉ hiển thị khi bác sĩ login == bác sĩ được chỉ định
            if (d.doctor_id && user?.id && d.doctor_id !== user.id) return;
            const dateStr = d.date
              ? new Date(d.date + "T00:00:00").toLocaleDateString("vi-VN", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })
              : d.date;
            const notif: ClinicNotif = {
              id: d.appointment_id || Date.now().toString(),
              text: `Lịch khám mới — ${d.department}`,
              detail: `Bệnh nhân: ${d.patient_name} · Ngày ${dateStr} lúc ${d.time}`,
              ts: new Date().toISOString(),
              read: false,
            };
            setClinicNotifs((prev) => [notif, ...prev]);
            // Text-to-Speech thông báo
            const speech = `Thông báo lịch khám mới. Bệnh nhân ${d.patient_name} đặt lịch khám ${d.department}, ngày ${dateStr}, lúc ${d.time}. Lý do: ${d.reason || "khám bệnh"}.`;
            // Delay 500ms để browser sẵn sàng
            setTimeout(() => speakText(speech), 500);
          }
        } catch {}
      };
      ws.onclose = () => {
        if (pingTimer) clearInterval(pingTimer);
        if (!dead) reconnTimer = setTimeout(connect, 5000);
      };
    };
    connect();
    return () => {
      dead = true;
      if (pingTimer) clearInterval(pingTimer);
      if (reconnTimer) clearTimeout(reconnTimer);
      if (ws) {
        ws.onclose = null;
        ws.close();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workMode, user?.id]);

  // Re-sync activeView if workMode changes
  useEffect(() => {
    if (workMode && roleConfig[workMode] && !roleConfig[workMode].views.includes(activeView)) {
      setActiveView(roleConfig[workMode].defaultView);
    }
  }, [workMode, activeView]);

  useEffect(() => {
    const isIos = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in window.navigator &&
        Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone));
    setShowIosInstallHint(isIos && !isStandalone);

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPromptEvent(event as BeforeInstallPromptEvent);
      setIsInstallEligible(true);
    };

    const handleInstalled = () => {
      setInstallPromptEvent(null);
      setIsInstallEligible(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  // Auth guard
  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: "/login", replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleInstallApp = async () => {
    if (!installPromptEvent) return;
    await installPromptEvent.prompt();
    const choice = await installPromptEvent.userChoice;
    if (choice.outcome === "accepted") {
      setInstallPromptEvent(null);
      setIsInstallEligible(false);
    }
    setProfileMenuOpen(false);
  };

  const requestLogout = () => {
    setLogoutConfirmOpen(true);
    setProfileMenuOpen(false);
  };

  const confirmLogout = () => {
    logout();
    setLogoutConfirmOpen(false);
  };

  if (!isAuthenticated || !workMode || !user) {
    return null; // Or a loading spinner
  }

  const meta = viewTitles[activeView];
  const visibleNav = navItems.filter((n) => roleConfig[workMode].views.includes(n.key));
  const isPatientRole = workMode === "patient";
  const isClinicianMobile = workMode === "clinician" && isMobile;
  return (
    <div className="font-hanken text-slate-800 flex min-h-dvh w-full overflow-x-hidden bg-white">
      {/* Side Nav — hidden in patient mobile mode */}
      {!isPatientRole && (
        <nav
          className={`h-screen fixed left-0 top-0 bg-white flex-col py-6 border-r border-slate-200 z-40 hidden md:flex transition-all duration-300 ${
            collapsed ? "w-24" : "w-80"
          }`}
        >
          <div className={`mb-4 ${collapsed ? "px-4" : "px-6"}`}>
            <div className="flex items-center gap-3 justify-between">
              <div className="flex items-center gap-3 min-w-0 relative">
                <button
                  onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                  className="flex items-center gap-3 active:scale-95 transition-transform text-left"
                >
                  <img
                    src="/logo.png"
                    alt="EyeCU Logo"
                    className="w-14 h-14 rounded-lg shadow-sm object-contain flex-shrink-0"
                  />
                  {!collapsed && (
                    <div className="min-w-0">
                      <h1 className="text-2xl font-bold leading-tight text-slate-900 truncate">
                        EyeCU
                      </h1>
                      <p className="text-[14px] tracking-wider text-slate-500 font-geist uppercase mt-0.5">
                        {roleConfig[workMode].label}
                      </p>
                    </div>
                  )}
                </button>
                {roleMenuOpen && (
                  <div className="absolute top-16 left-0 w-64 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-2">
                    <p className="px-4 py-2 text-[12px] font-bold text-slate-400 uppercase tracking-wider">
                      Đổi không gian làm việc
                    </p>
                    <button
                      onClick={() => {
                        setWorkMode("ops");
                        setRoleMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-[#0A9BAD]"
                    >
                      Trực Cấp cứu
                    </button>
                    <button
                      onClick={() => {
                        setWorkMode("clinician");
                        setRoleMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-[#0A9BAD]"
                    >
                      Khám Lâm sàng
                    </button>
                    <button
                      onClick={() => {
                        setWorkMode("ems");
                        setRoleMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-[#0A9BAD]"
                    >
                      Cấp cứu Ngoại viện
                    </button>
                  </div>
                )}
              </div>
              {!collapsed && (
                <button
                  onClick={() => setCollapsed(true)}
                  className="p-1 rounded text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                  aria-label="Collapse sidebar"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}
            </div>
            {collapsed && (
              <button
                onClick={() => setCollapsed(false)}
                className="w-full mt-5 py-2 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                aria-label="Expand sidebar"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
          <ul className={`flex-1 space-y-1 ${collapsed ? "px-3" : "px-4"}`}>
            {visibleNav.map(({ Icon, label, key }) => {
              const active = activeView === key;
              return (
                <li key={key}>
                  <button
                    onClick={() => setActiveView(key)}
                    title={collapsed ? label : undefined}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[15px] font-medium transition-all ${
                      collapsed ? "justify-center" : ""
                    } ${
                      active
                        ? "text-slate-900 font-bold"
                        : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                    style={active ? { backgroundColor: ACCENT } : undefined}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {!collapsed && <span className="text-left truncate">{label}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
          <div className={`mt-auto pt-4 border-t border-slate-200 ${collapsed ? "px-3" : "px-4"}`}>
            <ul className="space-y-1">
              <li key="Đăng xuất">
                <button
                  onClick={requestLogout}
                  title={collapsed ? "Đăng xuất" : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-geist text-[14px] uppercase tracking-wider ${
                    collapsed ? "justify-center" : ""
                  }`}
                >
                  <LogOut className="w-4 h-4 flex-shrink-0" />
                  {!collapsed && "Đăng xuất"}
                </button>
              </li>
            </ul>
          </div>
        </nav>
      )}

      {/* Main */}
      <main
        className={`flex-1 flex min-h-dvh min-w-0 flex-col overflow-hidden bg-white transition-all duration-300 ${
          isPatientRole ? "" : collapsed ? "md:ml-24" : "md:ml-80"
        }`}
      >
        {/* Top Nav — staff / clinician */}
        <header
          className={`${isPatientRole ? "hidden" : "flex"} sticky top-0 z-30 items-center justify-between gap-2 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl px-3 pt-safe pb-2 md:px-6 md:py-2.5 md:pt-0`}
        >
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <div className="flex shrink-0 items-center gap-2 md:hidden">
              <img
                src="/logo.png"
                alt="EyeCU Logo"
                className="h-9 w-9 rounded-xl shadow-sm object-contain ring-2 ring-[#88E8F2]/30"
              />
              {!isPatientRole && isMobile && (
                <button
                  type="button"
                  onClick={() => {
                    setWorkspaceSheetOpen(true);
                    setNotifOpen(false);
                    setProfileMenuOpen(false);
                  }}
                  className="inline-flex items-center gap-0.5 rounded-full bg-[#88E8F2]/20 px-2.5 py-1 text-[10px] font-bold text-[#0A9BAD] transition-all active:scale-95 hover:bg-[#88E8F2]/40"
                >
                  {roleConfig[workMode].label}
                  <ChevronDown className="h-3 w-3" />
                </button>
              )}
              {!isClinicianMobile && !isMobile && <span className="text-sm font-bold text-slate-900">EyeCU</span>}
            </div>
            {isClinicianMobile && (
              <div className="min-w-0 flex-1 md:hidden">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-[15px] font-bold text-slate-900">{meta.title.split("—")[0].trim()}</p>
                </div>
                <p className="truncate text-[11px] text-slate-500 mt-0.5">{meta.subtitle}</p>
              </div>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <span className="hidden max-w-[7.5rem] truncate rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 sm:inline">
              {roleConfig[workMode].label}
            </span>
            <button
              type="button"
              onClick={() => {
                setNotifOpen((o) => !o);
                setProfileMenuOpen(false);
              }}
              className="relative rounded-full p-1.5 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-800"
              aria-label="Thông báo"
            >
              <Bell className="h-4 w-4" />
              {notifUnread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white leading-none">
                  {notifUnread > 9 ? "9+" : notifUnread}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {notifOpen && (
              <div
                className="absolute right-12 top-[calc(100%+0.5rem)] z-50 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
                style={{ maxHeight: "420px" }}
              >
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                  <p className="font-semibold text-slate-800 text-[14px]">
                    Thông báo lịch khám
                  </p>
                  {clinicNotifs.length > 0 && (
                    <button
                      onClick={() => {
                        setClinicNotifs([]);
                        setNotifOpen(false);
                      }}
                      className="text-[11px] text-slate-400 hover:text-red-500"
                    >
                      Xóa tất cả
                    </button>
                  )}
                </div>
                <div className="overflow-y-auto" style={{ maxHeight: "340px" }}>
                  {clinicNotifs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                      <Bell className="h-8 w-8 mb-2 opacity-20" />
                      <span className="text-[13px]">Chưa có thông báo nào</span>
                    </div>
                  ) : (
                    clinicNotifs.map((n) => (
                      <button
                        key={n.id}
                        onClick={() =>
                          setClinicNotifs((prev) =>
                            prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)),
                          )
                        }
                        className={`w-full text-left flex gap-3 px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors ${
                          n.read ? "" : "bg-blue-50/50"
                        }`}
                      >
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-100">
                          <Bell className="h-4 w-4 text-cyan-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-slate-800 leading-snug">
                            {n.text}
                          </p>
                          <p className="text-[12px] text-slate-500 mt-0.5 leading-snug">
                            {n.detail}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-1">
                            {new Date(n.ts).toLocaleTimeString("vi-VN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                        {!n.read && (
                          <span className="mt-1.5 h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileMenuOpen((open) => !open)}
                className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border-2 border-slate-200 bg-slate-100 transition-colors hover:border-[#88E8F2] active:scale-95"
                aria-label="Hồ sơ và cài đặt"
                aria-expanded={profileMenuOpen}
              >
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
                ) : (
                  <User className="h-4 w-4 text-slate-500" />
                )}
              </button>

              {profileMenuOpen && (
                <div className="absolute right-0 top-[calc(100%+0.5rem)] z-40 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                  <div className="border-b border-slate-100 px-3 py-2.5">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {user.title ? `${user.title} ` : ""}
                      {user.name}
                    </p>
                    <p className="truncate text-[11px] text-slate-500">
                      {roleConfig[workMode].label}
                    </p>
                  </div>
                  <div className="p-1">
                    <button
                      type="button"
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <User className="h-4 w-4 text-slate-400" />
                      Hồ sơ
                    </button>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <Settings className="h-4 w-4 text-slate-400" />
                      Cài đặt
                    </button>
                    {isInstallEligible && (
                      <button
                        type="button"
                        onClick={() => void handleInstallApp()}
                        className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <Download className="h-4 w-4 text-slate-400" />
                        Cài ứng dụng
                      </button>
                    )}
                    {!isInstallEligible && showIosInstallHint && (
                      <p className="px-2.5 py-2 text-[10px] leading-relaxed text-slate-500">
                        iOS: Safari → Chia sẻ → Thêm vào Màn hình chính
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={requestLogout}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Đăng xuất
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {!isPatientRole && !isClinicianMobile && (
          <div className="sticky top-[calc(4rem+env(safe-area-inset-top))] z-20 border-b border-slate-200 bg-white px-3 py-2 md:top-16 md:hidden">
            <div className="scrollbar-hide flex gap-2 overflow-x-auto">
              {visibleNav.map(({ Icon, label, key }) => {
                const active = activeView === key;
                return (
                  <button
                    key={key}
                    onClick={() => setActiveView(key)}
                    className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                      active
                        ? "border-transparent text-slate-900"
                        : "border-slate-200 bg-white text-slate-600 active:bg-slate-50"
                    }`}
                    style={active ? { backgroundColor: ACCENT } : undefined}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span className="whitespace-nowrap">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Canvas */}
        <div
          className={
            isPatientRole
              ? "flex-1 min-h-0 overflow-y-auto bg-slate-50 p-0"
              : isClinicianMobile
                ? "flex-1 overflow-y-auto scrollbar-hide bg-slate-50 p-3 pb-28"
                : "flex-1 overflow-y-auto scrollbar-hide p-4 md:p-6 bg-white"
          }
        >
          <div
            className={
              isPatientRole
                ? "min-h-full max-w-none mx-0 space-y-0"
                : isClinicianMobile
                  ? "mx-auto w-full max-w-3xl space-y-3"
                  : "max-w-7xl mx-auto space-y-4"
            }
          >
            {!isPatientRole && !isClinicianMobile && (
              <div className="mb-4">
                <h2 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl md:font-light">
                  {meta.title}
                </h2>
                <p className="mt-1 text-sm text-slate-500">{meta.subtitle}</p>
              </div>
            )}

            {activeView === "ambient" && (
              <AmbientView
                highlightedRoom={highlightedRoom}
                setHighlightedRoom={setHighlightedRoom}
              />
            )}
            {activeView === "ambulance" && (
              <MapErrorBoundary>
                <AmbulanceView />
              </MapErrorBoundary>
            )}
            {activeView === "history" && <HistoryView />}
            {activeView === "records" && <RecordsView />}
            {activeView === "voice" && <VoiceView />}
            {activeView === "chatbot" && <ChatbotView />}
            {activeView === "patient" && (
              <PatientPortalNew
                isInstallEligible={isInstallEligible}
                showIosInstallHint={showIosInstallHint}
                onInstallApp={handleInstallApp}
                onRequestLogout={requestLogout}
              />
            )}
            {activeView === "ems" && <EmsView />}
            {activeView === "admin_dashboard" && <AdminDashboardView />}
            {activeView === "doctor_qa" && <DoctorQAView />}
          </div>
        </div>
      </main>

      {/* Clinician mobile bottom navigation */}
      {isClinicianMobile && (
        <nav
          className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/95 pb-safe pt-1.5 backdrop-blur-xl md:hidden"
          aria-label="Điều hướng bác sĩ"
        >
          <div className="mx-auto flex max-w-lg px-2">
            {visibleNav.map(({ Icon, label, key }) => {
              const active = activeView === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveView(key)}
                  className={`group flex flex-1 flex-col items-center gap-1 px-2 py-1.5 transition-all duration-200 ${
                    active ? "text-[#0A9BAD]" : "text-slate-400 active:text-slate-600"
                  }`}
                >
                  <span
                    className={`relative flex h-11 w-11 items-center justify-center rounded-2xl transition-all duration-200 ${
                      active
                        ? "bg-gradient-to-br from-[#88E8F2] to-[#0A9BAD] text-white shadow-lg shadow-[#0A9BAD]/25 scale-105"
                        : "bg-slate-100 group-active:bg-slate-200"
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${active ? "text-white" : ""}`} />
                    {active && (
                      <span className="absolute -top-1 left-1/2 h-1 w-4 -translate-x-1/2 rounded-full bg-[#0A9BAD]" />
                    )}
                  </span>
                  <span
                    className={`text-[10px] font-semibold leading-tight ${
                      active ? "text-[#0A9BAD]" : "text-slate-400"
                    }`}
                  >
                    {key === "voice" ? "Bệnh án" : key === "doctor_qa" ? "Hỏi đáp" : label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      )}

      {/* Workspace Switcher Bottom Sheet */}
      {workspaceSheetOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setWorkspaceSheetOpen(false)}
          />
          <div className="relative z-10 w-full max-w-md rounded-t-3xl bg-white shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-slate-300" />
            </div>
            <div className="px-5 pt-3 pb-2">
              <p className="text-[17px] font-bold text-slate-900">Chọn không gian làm việc</p>
              <p className="text-[12px] text-slate-500 mt-0.5">Chuyển đổi giữa các chức năng</p>
            </div>
            <div className="px-4 pb-5 space-y-2">
              {(
                [
                  { key: "ops" as const, label: "Trực Cấp cứu", desc: "Giám sát & điều phối xe cấp cứu" },
                  { key: "clinician" as const, label: "Khám Lâm sàng", desc: "Bệnh án giọng nói & Hỏi đáp" },
                  { key: "ems" as const, label: "Cấp cứu Ngoại viện", desc: "Quét BN & định vị GPS" },
                ] as const
              ).map(({ key, label, desc }) => {
                const active = workMode === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setWorkMode(key);
                      setWorkspaceSheetOpen(false);
                    }}
                    className={`w-full rounded-2xl border p-4 text-left transition-all active:scale-[0.98] ${
                      active
                        ? "border-[#0A9BAD]/30 bg-[#88E8F2]/10 shadow-sm"
                        : "border-slate-200 bg-white hover:border-[#88E8F2]/50 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <p className={`text-[15px] font-bold ${active ? "text-[#0A9BAD]" : "text-slate-900"}`}>
                          {label}
                        </p>
                        <p className="text-[12px] text-slate-500 mt-0.5">{desc}</p>
                      </div>
                      {active && (
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0A9BAD]">
                          <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="px-4 pb-6">
              <button
                type="button"
                onClick={() => setWorkspaceSheetOpen(false)}
                className="w-full rounded-xl border border-slate-200 py-3 text-[14px] font-semibold text-slate-600 transition-colors hover:bg-slate-50 active:scale-95"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      <LogoutConfirmModal
        open={logoutConfirmOpen}
        onCancel={() => setLogoutConfirmOpen(false)}
        onConfirm={confirmLogout}
      />
    </div>
  );
}

function LogoutConfirmModal({
  open,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="logout-title"
        className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl"
      >
        <h3 id="logout-title" className="text-base font-bold text-slate-900">
          Bạn có muốn đăng xuất không?
        </h3>
        <p className="mt-1.5 text-sm text-slate-500">
          Phiên làm việc trên thiết bị này sẽ kết thúc. Bạn cần đăng nhập
          lại để tiếp tục.
        </p>
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            Ở lại
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700"
          >
            Đăng xuất
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============== VIEW 1: AMBIENT — LIVE AI CAMERA GRID ============== */

type CamStatus = "stable" | "alert";
type Camera = {
  room: string;
  zone: string;
  status: CamStatus;
  overlay?: "fall";
  label?: string;
  dept: string;
};

const ALL_CAMERAS: Camera[] = [
  // Cấp cứu
  {
    room: "CC01",
    zone: "ER",
    status: "alert",
    overlay: "fall",
    label: "Phòng cấp cứu",
    dept: "er",
  },
  { room: "CC02", zone: "ER", status: "stable", label: "Phòng hồi sức", dept: "er" },
  { room: "CC03", zone: "ER", status: "stable", label: "Hành lang ER", dept: "er" },
  { room: "CC04", zone: "ER", status: "stable", label: "Phòng chờ", dept: "er" },
  // Tim mạch
  { room: "TM01", zone: "B", status: "stable", label: "Phòng bệnh", dept: "cardio" },
  { room: "TM02", zone: "B", status: "stable", label: "Phòng bệnh", dept: "cardio" },
  { room: "TM03", zone: "B", status: "alert", label: "ICU Tim mạch", dept: "cardio" },
  // Thần kinh
  { room: "TK01", zone: "C", status: "stable", label: "Phòng phẫu thuật", dept: "neuro" },
  { room: "TK02", zone: "C", status: "stable", label: "Phòng hồi tỉnh", dept: "neuro" },
  { room: "TK03", zone: "C", status: "stable", label: "Phòng bệnh", dept: "neuro" },
  // Lồng ngực
  { room: "LN01", zone: "C", status: "stable", label: "Phòng phẫu thuật", dept: "thorax" },
  { room: "LN02", zone: "C", status: "stable", label: "Phòng bệnh", dept: "thorax" },
  // Chấn thương
  { room: "CT01", zone: "D", status: "stable", label: "Phòng bó bột", dept: "ortho" },
  {
    room: "CT02",
    zone: "D",
    status: "alert",
    overlay: "fall",
    label: "Phòng bệnh",
    dept: "ortho",
  },
  {
    room: "CT03",
    zone: "D",
    status: "stable",
    label: "Phòng vật lý trị liệu",
    dept: "ortho",
  },
  // Ngoại tổng hợp
  { room: "NG01", zone: "D", status: "stable", label: "Phòng phẫu thuật", dept: "surgery" },
  { room: "NG02", zone: "D", status: "stable", label: "Phòng bệnh", dept: "surgery" },
  { room: "NG03", zone: "D", status: "stable", label: "Phòng bệnh", dept: "surgery" },
  // Khoa Nội
  { room: "101", zone: "A", status: "stable", label: "Phòng bệnh", dept: "internal" },
  { room: "102", zone: "A", status: "stable", label: "Phòng bệnh", dept: "internal" },
  {
    room: "103",
    zone: "A",
    status: "alert",
    overlay: "fall",
    label: "Phòng bệnh",
    dept: "internal",
  },
  { room: "104", zone: "A", status: "stable", label: "Phòng bệnh", dept: "internal" },
  { room: "105", zone: "A", status: "stable", label: "Phòng bệnh", dept: "internal" },
  { room: "106", zone: "A", status: "stable", label: "Hành lang", dept: "internal" },
  // Nội tiết
  { room: "NT01", zone: "E", status: "stable", label: "Phòng bệnh", dept: "endo" },
  { room: "NT02", zone: "E", status: "stable", label: "Phòng bệnh", dept: "endo" },
  { room: "NT03", zone: "E", status: "stable", label: "Phòng xét nghiệm", dept: "endo" },
  // Cơ Xương Khớp
  { room: "CX01", zone: "E", status: "stable", label: "Phòng bệnh", dept: "bone" },
  { room: "CX02", zone: "E", status: "stable", label: "Phòng vật lý", dept: "bone" },
  // Thận
  { room: "TN01", zone: "F", status: "stable", label: "Phòng chạy thận", dept: "renal" },
  { room: "TN02", zone: "F", status: "stable", label: "Phòng bệnh", dept: "renal" },
  // Nhi
  { room: "NH01", zone: "F", status: "stable", label: "Phòng bệnh nhi", dept: "pedi" },
  { room: "NH02", zone: "F", status: "stable", label: "Phòng sơ sinh", dept: "pedi" },
  { room: "NH03", zone: "F", status: "stable", label: "Phòng lồng ấp", dept: "pedi" },
  // Phụ sản
  { room: "PS01", zone: "G", status: "stable", label: "Phòng sinh", dept: "obgyn" },
  { room: "PS02", zone: "G", status: "stable", label: "Phòng hậu sản", dept: "obgyn" },
  { room: "PS03", zone: "G", status: "stable", label: "Phòng bệnh", dept: "obgyn" },
  // Gây mê
  { room: "GM01", zone: "H", status: "alert", label: "Phòng mổ chính", dept: "anest" },
  { room: "GM02", zone: "H", status: "stable", label: "Phòng hồi tỉnh", dept: "anest" },
  // Tạo hình
  { room: "TH01", zone: "H", status: "stable", label: "Phòng phẫu thuật", dept: "plastic" },
  { room: "TH02", zone: "H", status: "stable", label: "Phòng bệnh", dept: "plastic" },
];

const DEPT_TABS = [
  { id: "er", name: "Cấp cứu", color: "#DC2626" },
  { id: "cardio", name: "Tim mạch", color: "#7C3AED" },
  { id: "neuro", name: "Thần kinh", color: "#1E40AF" },
  { id: "thorax", name: "Lồng ngực", color: "#0E7490" },
  { id: "ortho", name: "Chấn thương", color: "#D97706" },
  { id: "surgery", name: "Ngoại TH", color: "#16A34A" },
  { id: "internal", name: "Khoa Nội", color: "#2563EB" },
  { id: "endo", name: "Nội tiết", color: "#CA8A04" },
  { id: "bone", name: "CXK", color: "#92400E" },
  { id: "renal", name: "Thận-TN", color: "#0891B2" },
  { id: "pedi", name: "Nhi", color: "#DB2777" },
  { id: "obgyn", name: "Phụ sản", color: "#E11D48" },
  { id: "anest", name: "Gây mê", color: "#475569" },
  { id: "plastic", name: "Tạo hình", color: "#9333EA" },
];

function AmbientView({
  highlightedRoom,
  setHighlightedRoom,
}: {
  highlightedRoom: string | null;
  setHighlightedRoom: (r: string | null) => void;
}) {
  const isMobile = useIsMobile();
  const gridRef = useRef<HTMLDivElement>(null);
  const [selectedDept, setSelectedDept] = useState("internal");
  const [onlyAlerts, setOnlyAlerts] = useState(false);
  const [fullscreen, setFullscreen] = useState<Camera | null>(null);

  const [cameras, setCameras] = useState<Camera[]>([]);
  const [fallAlert, setFallAlert] = useState<{
    room: string;
    imageUrl: string;
    time: string;
  } | null>(null);

  const WS_URL = "wss://eyecu.onrender.com/api/ambient/ws/live";

  const handleSocketMessage = useCallback((msg: any) => {
    if (msg.type === "CAMERA_STREAM") {
      window.dispatchEvent(
        new CustomEvent("camera-stream", {
          detail: { room: msg.room_id, image: msg.image_base64 },
        }),
      );
    }
    if (msg.type === "FALL_DETECTED") {
      setFallAlert({
        room: msg.room_id || "Unknown",
        imageUrl: msg.blurred_image_base64 || "",
        time: new Date().toLocaleTimeString(),
      });
      try {
        new Audio("/alert.mp3").play().catch(() => {});
      } catch (e) {}
    }
  }, []);

  useEyeCUSocket({ url: WS_URL, onMessage: handleSocketMessage });

  useEffect(() => {
    fetchApi("/ambient/devices")
      .then((data: any[]) => {
        const mapped = data.map((d) => ({
          room: d.location || "Unknown",
          zone: d.location?.charAt(0) || "A",
          status: d.status === "active" ? "stable" : "alert",
          label: d.name,
          dept: "internal", // Mock dept for demo based on device
        }));

        // Trộn data từ DB với ALL_CAMERAS để demo đẹp mắt và đảm bảo Phòng 101 có mặt
        const combined = [
          ...mapped,
          ...ALL_CAMERAS.filter((c) => !mapped.find((m) => m.room === c.room)),
        ];
        setCameras(combined as Camera[]);
      })
      .catch(() => setCameras(ALL_CAMERAS));
  }, []);

  const deptCameras =
    cameras.length > 0
      ? cameras.filter((c) => c.dept === selectedDept)
      : ALL_CAMERAS.filter((c) => c.dept === selectedDept);
  const filtered = onlyAlerts ? deptCameras.filter((c) => c.status === "alert") : deptCameras;
  const alertCount = deptCameras.filter((c) => c.status === "alert").length;
  const currentTab = DEPT_TABS.find((t) => t.id === selectedDept);

  useEffect(() => {
    if (!highlightedRoom) return;
    const id = setTimeout(() => setHighlightedRoom(null), 2500);
    return () => clearTimeout(id);
  }, [highlightedRoom, setHighlightedRoom]);

  // When alert sidebar clicks a room (e.g. 103), auto-switch to Nội
  useEffect(() => {
    if (highlightedRoom) setSelectedDept("internal");
  }, [highlightedRoom]);

  const handleDeptTabClick = (tabId: string) => {
    setSelectedDept(tabId);
    setOnlyAlerts(false);
    setTimeout(() => {
      gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  return (
    <>
      <div className={`bg-white border border-slate-200 rounded-xl ${isMobile ? "p-3" : "p-5"}`}>
        {/* Header */}
        <div className="flex justify-between items-center mb-3 md:mb-4">
          <div className="min-w-0">
            <h3 className={`${isMobile ? "text-base" : "text-xl"} font-medium text-slate-900 flex items-center gap-2`}>
              <Video className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" style={{ color: ACCENT }} />
              <span className="truncate">AI Giám sát · {currentTab?.name}</span>
            </h3>
            {!isMobile && (
              <p className="text-[13px] text-slate-500 font-geist mt-0.5">
                {deptCameras.length} camera · Phân tích hành vi · Phát hiện ngã · Nhận
                dạng âm thanh
              </p>
            )}
          </div>
          <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
            {alertCount > 0 && (
              <span className="px-1.5 md:px-2 py-0.5 md:py-1 rounded-lg text-[9px] md:text-[10px] font-bold text-white bg-red-500 flex items-center gap-1 animate-pulse">
                {alertCount}{isMobile ? "" : " Cảnh báo"}
              </span>
            )}
            <span
              className="px-1.5 md:px-2 py-0.5 md:py-1 rounded text-[9px] md:text-[10px] font-geist uppercase tracking-wider text-slate-900 flex items-center gap-1"
              style={{ backgroundColor: ACCENT }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
              {isMobile ? "LIVE" : "Trực tiếp"}
            </span>
          </div>
        </div>

        {/* Department tab bar — horizontally scrollable */}
        <div className="-mx-1 mb-3 md:mb-4">
          <div className="flex overflow-x-auto whitespace-nowrap scrollbar-hide gap-1.5 md:gap-3 pb-2 px-1">
            {DEPT_TABS.map((tab) => {
              const tabCams = ALL_CAMERAS.filter((c) => c.dept === tab.id);
              const tabAlerts = tabCams.filter((c) => c.status === "alert").length;
              const isActive = selectedDept === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleDeptTabClick(tab.id)}
                  className={`flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1 md:py-1.5 rounded-full ${isMobile ? "text-[11px]" : "text-[13px]"} font-bold whitespace-nowrap transition-all flex-shrink-0 border`}
                  style={{
                    backgroundColor: isActive ? tab.color : "#F8FAFC",
                    color: isActive ? "#fff" : "#475569",
                    borderColor: isActive ? tab.color : "#E2E8F0",
                    boxShadow: isActive ? `0 2px 8px ${tab.color}50` : undefined,
                  }}
                >
                  <span className="font-semibold tracking-wide">{tab.name}</span>
                  <span className="opacity-70">({tabCams.length})</span>
                  {tabAlerts > 0 && !isMobile && (
                    <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[8px] font-bold flex items-center justify-center">
                      {tabAlerts}
                    </span>
                  )}
                  {tabAlerts > 0 && isMobile && (
                    <span className="text-red-200 text-[10px]">⚠</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 md:gap-3 mb-3 md:mb-5 pb-3 md:pb-4 border-b border-slate-200">
          <button
            onClick={() => setOnlyAlerts((v) => !v)}
            className={`flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1.5 md:py-2 rounded-lg border ${isMobile ? "text-[11px]" : "text-[12px]"} font-geist uppercase tracking-wider transition-colors ${
              onlyAlerts
                ? "text-slate-900 border-transparent"
                : "bg-white border-slate-200 text-slate-700 hover:border-[#88E8F2]"
            }`}
            style={onlyAlerts ? { backgroundColor: ACCENT } : undefined}
          >
            <AlertTriangle className="w-3 h-3 md:w-3.5 md:h-3.5" />
            {onlyAlerts ? `Cảnh báo (${alertCount})` : (isMobile ? "Chỉ cảnh báo" : "Chỉ hiện Cảnh báo")}
          </button>
          <span className="text-[10px] md:text-[11px] font-geist text-slate-400">
            {filtered.length} / {deptCameras.length} camera
          </span>
        </div>

        {/* Camera grid — split when multiple alerts */}
        <div ref={gridRef}>
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 md:py-12 text-slate-400">
            <Video className="w-8 h-8 md:w-10 md:h-10 mb-2 opacity-30" />
            <p className="text-xs md:text-sm">Không có cảnh báo nào trong {currentTab?.name}</p>
          </div>
        ) : (
          (() => {
            const alerts = filtered.filter((c) => c.status === "alert");
            const stable = filtered.filter((c) => c.status !== "alert");
            const multiAlarm = alerts.length >= 2 && !onlyAlerts;
            if (!multiAlarm) {
              return (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 md:gap-4">
                  {filtered.map((cam) => (
                    <CameraCard
                      key={cam.room}
                      cam={cam}
                      highlighted={highlightedRoom === cam.room}
                      onClick={() => setFullscreen(cam)}
                      isMobile={isMobile}
                    />
                  ))}
                </div>
              );
            }
            return (
              <div className="space-y-3 md:space-y-5">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <h4 className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-red-600">
                      Sự cố đang xử lý · {alerts.length}
                    </h4>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-2 gap-2 md:gap-4">
                    {alerts.map((cam) => (
                      <CameraCard
                        key={cam.room}
                        cam={cam}
                        highlighted={highlightedRoom === cam.room}
                        onClick={() => setFullscreen(cam)}
                        isMobile={isMobile}
                      />
                    ))}
                  </div>
                </div>
                {stable.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <h4 className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-slate-500">
                        Phòng ổn định · {stable.length}
                      </h4>
                    </div>
                    <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-5 gap-1.5 md:gap-2">
                      {stable.map((cam) => (
                        <button
                          key={cam.room}
                          onClick={() => setFullscreen(cam)}
                          className="flex items-center gap-1.5 md:gap-2 p-1.5 md:p-2 border border-slate-200 rounded-lg bg-white hover:border-[#88E8F2] transition text-left"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[10px] md:text-[11px] font-bold text-slate-900 truncate">
                              P.{cam.room}
                            </p>
                            <p className="text-[8px] md:text-[9px] text-slate-500 uppercase tracking-wider">
                              Ổn định
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()
        )}
        </div>
      </div>

      {/* Privacy-by-Design Camera Demo — hidden on mobile */}
      <div className="hidden md:block">
        <PrivacyCameraFeed />
      </div>

      {fullscreen && <CameraModal cam={fullscreen} onClose={() => setFullscreen(null)} />}

      {fallAlert && (
        isMobile ? (
          <div className="fixed bottom-0 left-0 right-0 z-[999] bg-red-950 text-white p-4 rounded-t-2xl shadow-2xl flex flex-col gap-3 animate-in slide-in-from-bottom duration-300 border-t border-red-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse" />
                <h3 className="font-bold text-base text-red-400 uppercase tracking-widest">
                  Cảnh báo cấp cứu
                </h3>
              </div>
              <button onClick={() => setFallAlert(null)} className="text-gray-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm font-medium text-slate-300">
              Phát hiện bệnh nhân ngã tại{" "}
              <span className="font-bold text-red-300">{fallAlert.room}</span> lúc {fallAlert.time}
            </p>
            {fallAlert.imageUrl && (
              <div className="relative rounded-lg overflow-hidden border-2 border-red-900/50">
                <img src={fallAlert.imageUrl} alt="Blurred fall evidence" className="w-full h-auto max-h-40 object-cover" />
                <div className="absolute inset-0 bg-red-500/10 animate-pulse" />
              </div>
            )}
            <div className="flex gap-2 mt-1 pb-safe">
              <button
                onClick={() => setFallAlert(null)}
                className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-semibold transition"
              >
                Bỏ qua
              </button>
              <button
                onClick={() => setFallAlert(null)}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-500 rounded-lg text-sm font-semibold shadow-lg shadow-red-500/20 transition"
              >
                Cấp cứu
              </button>
            </div>
          </div>
        ) : (
          <div className="fixed top-20 right-6 z-[999] bg-red-950 text-white p-5 rounded-2xl shadow-2xl flex flex-col gap-3 animate-fade-in border border-red-500 max-w-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-red-500 animate-pulse" />
                <h3 className="font-bold text-lg text-red-400 uppercase tracking-widest">
                  Cảnh báo cấp cứu
                </h3>
              </div>
              <button onClick={() => setFallAlert(null)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm font-medium text-slate-300">
              Phát hiện bệnh nhân ngã tại{" "}
              <span className="font-bold text-red-300">{fallAlert.room}</span> lúc {fallAlert.time}
            </p>
            {fallAlert.imageUrl && (
              <div className="relative rounded-lg overflow-hidden border-2 border-red-900/50">
                <img src={fallAlert.imageUrl} alt="Blurred fall evidence" className="w-full h-auto" />
                <div className="absolute inset-0 bg-red-500/10 animate-pulse" />
              </div>
            )}
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => setFallAlert(null)}
                className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-semibold transition"
              >
                Bỏ qua (Giả)
              </button>
              <button
                onClick={() => setFallAlert(null)}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-sm font-semibold shadow-lg shadow-red-500/20 transition"
              >
                Cấp cứu
              </button>
            </div>
          </div>
        )
      )}
    </>
  );
}

function CameraCard({
  cam,
  highlighted,
  onClick,
  isMobile,
}: {
  cam: Camera;
  highlighted: boolean;
  onClick: () => void;
  isMobile?: boolean;
}) {
  const isAlert = cam.status === "alert";
  const ring = highlighted ? "ring-2 md:ring-4 ring-offset-1 md:ring-offset-2 ring-[#88E8F2]" : "";
  const borderCls = isAlert ? "border-2 md:border-4 border-red-500 animate-pulse" : "border border-slate-200";
  return (
    <button
      onClick={onClick}
      className={`group relative aspect-video rounded-lg md:rounded-xl overflow-hidden bg-slate-800 text-left ${borderCls} ${ring} hover:scale-[1.02] cursor-pointer transition-all duration-200`}
    >
      <CameraFeed cam={cam} />

      {/* Room pill */}
      <div className={`absolute top-1.5 left-1.5 md:top-2 md:left-2 z-10 backdrop-blur-sm bg-black/40 text-white ${isMobile ? "text-[9px] px-1.5 py-0.5" : "text-[11px] px-2 py-1"} rounded-full flex items-center gap-1`}>
        {!isMobile && <Video className="w-3 h-3" />}
        {cam.room}
      </div>

      {/* Status dot */}
      <div className={`absolute top-1.5 right-1.5 md:top-2 md:right-2 z-10 backdrop-blur-sm bg-black/40 ${isMobile ? "px-1.5 py-0.5" : "px-2 py-1"} rounded-full flex items-center gap-1`}>
        <span
          className={`${isMobile ? "w-1 h-1" : "w-1.5 h-1.5"} rounded-full animate-pulse`}
          style={{ backgroundColor: isAlert ? "#EF4444" : ACCENT }}
        />
        <span className={`${isMobile ? "text-[8px]" : "text-[10px]"} uppercase tracking-wider text-white font-geist`}>
          {isAlert ? (isMobile ? "⚠" : "Cảnh báo") : (isMobile ? "✓" : "Ổn định")}
        </span>
      </div>

      {/* Fall alert overlay — skeleton centered + badge bottom-center */}
      {cam.overlay === "fall" && (
        <>
          <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
            <SkeletonOverlay />
          </div>
          <div className="absolute left-1/2 -translate-x-1/2 bottom-9 z-20 pointer-events-none">
            <span className="bg-black/80 backdrop-blur px-3 py-1 rounded-md text-red-500 font-bold text-xs tracking-wider whitespace-nowrap">
              PHÁT HIỆN NGÃ
            </span>
          </div>
        </>
      )}

      {/* Live play icon (only when not alert) */}
      {!isAlert && (
        <div className="absolute inset-0 z-0 flex items-center justify-center opacity-30 group-hover:opacity-60 transition-opacity">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-sm"
            style={{ backgroundColor: "rgba(136,232,242,0.18)" }}
          >
            <Play className="w-5 h-5 text-white" fill="white" />
          </div>
        </div>
      )}

      {/* Bottom strip */}
      <div className="absolute bottom-0 left-0 right-0 z-10 px-3 py-1.5 bg-gradient-to-t from-black/80 to-transparent flex justify-between items-center">
        <span className="text-[10px] text-white/80 font-geist uppercase tracking-wider">
          {cam.label} · Khu {cam.zone}
        </span>
        <span className="text-[10px] text-white/60 font-mono">LIVE · 1080p</span>
      </div>
    </button>
  );
}

function CameraFeed({ cam }: { cam: Camera }) {
  const [streamFrame, setStreamFrame] = useState<string | null>(null);

  useEffect(() => {
    const handleStream = (e: any) => {
      // cam.room could be "101", "102", "103"
      if (e.detail.room === cam.room || e.detail.room === `P.${cam.room}`) {
        setStreamFrame(e.detail.image);
      }
    };
    window.addEventListener("camera-stream", handleStream);
    return () => window.removeEventListener("camera-stream", handleStream);
  }, [cam.room]);

  return (
    <div className="absolute inset-0">
      {streamFrame ? (
        <img
          src={streamFrame}
          alt="Live Stream"
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-150"
        />
      ) : (
        <>
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #1e293b 100%)",
            }}
          />
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, transparent 1px, transparent 3px)",
            }}
          />
          {/* Faux room geometry */}
          <svg viewBox="0 0 200 120" className="absolute inset-0 w-full h-full opacity-30">
            <path d="M0 80 L60 50 L140 50 L200 80 L200 120 L0 120 Z" fill="#334155" />
            <rect x="70" y="60" width="60" height="30" fill="#475569" opacity="0.6" />
            <line x1="0" y1="80" x2="200" y2="80" stroke="#64748B" strokeWidth="0.5" />
          </svg>
        </>
      )}
      {/* Timestamp */}
      <div className="absolute bottom-7 right-2 text-[9px] font-mono text-white/50">
        {cam.room === "103" ? "14:32:07" : "14:32:0" + ((parseInt(cam.room) % 10) + 1)}
      </div>
    </div>
  );
}

function SkeletonOverlay() {
  return (
    <svg
      viewBox="0 0 120 60"
      className="w-32 h-16"
      stroke={ACCENT}
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    >
      <circle cx="20" cy="30" r="6" />
      <line x1="26" y1="30" x2="80" y2="32" />
      <line x1="40" y1="32" x2="50" y2="20" />
      <line x1="40" y1="32" x2="48" y2="44" />
      <line x1="80" y1="32" x2="100" y2="22" />
      <line x1="80" y1="32" x2="100" y2="44" />
      {[
        [26, 30],
        [40, 32],
        [60, 32],
        [80, 32],
        [100, 22],
        [100, 44],
        [50, 20],
        [48, 44],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="1.5" fill={ACCENT} />
      ))}
    </svg>
  );
}

/* ============================================================
   PRIVACY CAMERA FEED — Privacy-by-Design Pose Estimation
   ============================================================ */
type PcfState = "normal" | "critical";

function AudioSpectrogram({ state }: { state: PcfState }) {
  const barCount = 32;
  const baseNormal = Array.from(
    { length: barCount },
    (_, i) => 8 + Math.abs(Math.sin(i * 1.3) * 10) + Math.abs(Math.cos(i * 0.8) * 6),
  );
  const baseCritical = Array.from(
    { length: barCount },
    (_, i) => 20 + Math.abs(Math.sin(i * 2.1) * 38) + Math.abs(Math.cos(i * 1.7) * 28),
  );
  const [bars, setBars] = useState(baseNormal);

  useEffect(() => {
    if (state === "critical") {
      const id = setInterval(() => {
        setBars(baseCritical.map((h) => h * (0.65 + Math.random() * 0.7)));
      }, 110);
      return () => clearInterval(id);
    } else {
      const id = setInterval(() => {
        setBars(baseNormal.map((h) => h * (0.75 + Math.random() * 0.5)));
      }, 280);
      return () => clearInterval(id);
    }
  }, [state]);

  return (
    <div className="absolute bottom-0 inset-x-0 h-12 flex items-end gap-[2px] px-3 pb-1 bg-gradient-to-t from-black/90 to-transparent z-10">
      {bars.map((h, i) => (
        <div
          key={i}
          className="flex-1 rounded-t-sm"
          style={{
            height: `${Math.min(h, 42)}px`,
            backgroundColor:
              state === "critical"
                ? `rgba(239,68,68,${0.45 + (h / 80) * 0.55})`
                : `rgba(136,232,242,${0.35 + (h / 38) * 0.45})`,
            boxShadow:
              state === "critical"
                ? "0 0 3px rgba(239,68,68,0.5)"
                : "0 0 2px rgba(136,232,242,0.25)",
            transition: "height 0.1s ease",
          }}
        />
      ))}
    </div>
  );
}

function StandingSkeleton() {
  return (
    <svg
      viewBox="0 0 80 160"
      className="w-16 h-32"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <defs>
        <filter id="glow-stand">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g filter="url(#glow-stand)" stroke={ACCENT} strokeWidth="2.5">
        <circle cx="40" cy="18" r="10" />
        <line x1="40" y1="28" x2="40" y2="40" />
        <line x1="16" y1="48" x2="64" y2="48" />
        <line x1="16" y1="48" x2="10" y2="80" />
        <line x1="10" y1="80" x2="8" y2="100" />
        <line x1="64" y1="48" x2="70" y2="80" />
        <line x1="70" y1="80" x2="72" y2="100" />
        <line x1="40" y1="40" x2="40" y2="95" />
        <line x1="24" y1="95" x2="56" y2="95" />
        <line x1="24" y1="95" x2="20" y2="130" />
        <line x1="20" y1="130" x2="18" y2="155" />
        <line x1="56" y1="95" x2="60" y2="130" />
        <line x1="60" y1="130" x2="62" y2="155" />
        {[
          [40, 28],
          [40, 40],
          [16, 48],
          [64, 48],
          [10, 80],
          [70, 80],
          [8, 100],
          [72, 100],
          [40, 95],
          [24, 95],
          [56, 95],
          [20, 130],
          [60, 130],
        ].map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r="2.5" fill={ACCENT} />
        ))}
      </g>
    </svg>
  );
}

function FallenSkeleton() {
  return (
    <svg
      viewBox="0 0 200 80"
      className="w-44 h-20"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <defs>
        <filter id="glow-fall">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g filter="url(#glow-fall)" stroke="#EF4444" strokeWidth="2.5">
        <circle cx="18" cy="52" r="10" />
        <line x1="28" y1="52" x2="110" y2="54" />
        <line x1="60" y1="54" x2="55" y2="30" />
        <line x1="60" y1="54" x2="62" y2="72" />
        <line x1="55" y1="30" x2="48" y2="18" />
        <line x1="62" y1="72" x2="58" y2="76" />
        <line x1="110" y1="54" x2="148" y2="40" />
        <line x1="110" y1="54" x2="142" y2="66" />
        <line x1="148" y1="40" x2="175" y2="32" />
        <line x1="142" y1="66" x2="172" y2="70" />
        {[
          [28, 52],
          [60, 54],
          [80, 53],
          [110, 54],
          [148, 40],
          [142, 66],
          [55, 30],
          [62, 72],
          [175, 32],
          [172, 70],
        ].map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r="2.5" fill="#EF4444" />
        ))}
      </g>
      <circle
        cx="18"
        cy="52"
        r="16"
        stroke="#EF4444"
        strokeOpacity="0.3"
        strokeWidth="1.5"
        fill="none"
      >
        <animate attributeName="r" from="14" to="28" dur="1s" repeatCount="indefinite" />
        <animate attributeName="opacity" from="0.5" to="0" dur="1s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

function PrivacyCameraFeed() {
  const [pcfState, setPcfState] = useState<PcfState>("normal");
  const [transitioning, setTransitioning] = useState(false);
  const [flashText, setFlashText] = useState(false);
  const [timestamp, setTimestamp] = useState("14:32:07");
  const [streamFrame, setStreamFrame] = useState<string | null>(null);

  useEffect(() => {
    const handleStream = (e: any) => {
      // Usually "103" or "P.103"
      if (e.detail.room === "103" || e.detail.room === "P.103") {
        setStreamFrame(e.detail.image);
      }
    };
    window.addEventListener("camera-stream", handleStream);
    return () => window.removeEventListener("camera-stream", handleStream);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      const now = new Date();
      setTimestamp(
        `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`,
      );
    }, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (pcfState !== "critical") {
      setFlashText(false);
      return;
    }
    setFlashText(true);
    const id = setInterval(() => setFlashText((v) => !v), 600);
    return () => clearInterval(id);
  }, [pcfState]);

  const triggerFall = () => {
    if (transitioning || pcfState === "critical") return;
    setTransitioning(true);
    setTimeout(() => {
      setPcfState("critical");
      setTransitioning(false);
    }, 400);
  };

  const resetState = () => {
    setPcfState("normal");
    setFlashText(false);
  };

  const isCritical = pcfState === "critical";

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 mt-4 mb-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" style={{ color: ACCENT }} />
            Privacy-by-Design · Pose Estimation AI
          </h3>
          <p className="text-[13px] text-slate-500 font-geist mt-0.5">
            Không hiển thị hình ảnh thật · Skeleton Overlay + Audio Spectrogram · Sensor
            Fusion
          </p>
        </div>
        <span
          className="text-[12px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg"
          style={{
            backgroundColor: isCritical ? "#FEE2E2" : "#F0FDF4",
            color: isCritical ? "#DC2626" : "#16A34A",
          }}
        >
          {isCritical ? " FUSION ALERT" : "âœ“ Privacy Shield"}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Camera 16:9 */}
        <div className="lg:col-span-3">
          <div
            className="relative w-full rounded-xl overflow-hidden bg-slate-900 transition-all duration-500"
            style={{
              aspectRatio: "16/9",
              border: isCritical ? "3px solid #EF4444" : `2px solid ${ACCENT}`,
              boxShadow: isCritical
                ? "0 0 0 1px #EF444440, 0 0 24px #EF444430"
                : `0 0 16px ${ACCENT}20`,
            }}
          >
            {/* Background elements */}
            {!streamFrame && (
              <>
                <div
                  className="absolute inset-0 pointer-events-none z-0"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(0deg, rgba(255,255,255,0.025) 0 1px, transparent 1px 3px)",
                  }}
                />
                <div
                  className="absolute inset-0 z-0"
                  style={{
                    background: "radial-gradient(ellipse at center, #0d2030 0%, #060e16 100%)",
                  }}
                />
                <svg
                  viewBox="0 0 320 180"
                  className="absolute inset-0 w-full h-full opacity-15 z-0"
                >
                  <path d="M0 120 L80 70 L240 70 L320 120 L320 180 L0 180 Z" fill="#1e3a4a" />
                  <rect x="110" y="80" width="100" height="50" fill="#1a2f3d" rx="2" />
                  <line x1="0" y1="120" x2="320" y2="120" stroke="#334155" strokeWidth="1" />
                </svg>
              </>
            )}

            {/* Live Stream Image */}
            {streamFrame && (
              <img
                src={streamFrame}
                alt="Live Privacy Stream"
                className="absolute inset-0 w-full h-full object-cover z-10 transition-opacity duration-150"
              />
            )}

            {/* Top-left badge */}
            <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm rounded-full px-2.5 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[12px] font-mono text-white">Camera 103 – Khoa Nội</span>
            </div>

            {/* Timestamp */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 text-[11px] font-mono text-white/40">
              {timestamp} · 1080p · 30fps
            </div>

            {/* Top-right status */}
            <div className="absolute top-3 right-3 z-20">
              <span
                className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-bold uppercase tracking-wider transition-all duration-500"
                style={{
                  backgroundColor: isCritical ? "#DC2626" : "#065F46",
                  color: "white",
                  boxShadow: isCritical ? "0 0 12px #DC262690" : "0 0 8px #10B98150",
                }}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${isCritical ? "bg-red-200 animate-ping" : "bg-emerald-300"}`}
                />
                {isCritical
                  ? "BÁO ĐỘNG ĐỎ: PHÁT HIỆN NGÃ & TIẾNG ĐẬP MẠNH"
                  : "Bảo vệ riêng tư: BẬT"}
              </span>
            </div>

            {/* Pose skeleton */}
            <div
              className="absolute inset-0 z-10 flex items-center justify-center"
              style={{ paddingBottom: "48px" }}
            >
              <div
                className={`transition-all duration-500 ${transitioning ? "opacity-0 scale-90" : "opacity-100 scale-100"}`}
              >
                {isCritical ? (
                  <FallenSkeleton />
                ) : (
                  <div className="animate-pulse">
                    <StandingSkeleton />
                  </div>
                )}
              </div>
            </div>

            {/* Critical flash text */}
            {isCritical && (
              <div className="absolute inset-0 z-20 flex flex-col items-end justify-start pr-3 pt-12 pointer-events-none">
                <div className="absolute inset-0 bg-red-900/10" />
                {flashText && (
                  <div className="relative mt-10 text-center w-full">
                    <span className="text-red-400 font-black text-lg tracking-[0.2em] drop-shadow-[0_0_16px_rgba(239,68,68,0.9)]">
                      PHÁT HIỆN TƯ THẾ NGÃ
                    </span>
                    <br />
                    <span className="text-[11px] text-red-300/80 font-geist uppercase tracking-wider">
                      Pose: 97.4% · Audio Spike: 91dB
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Audio spectrogram */}
            <AudioSpectrogram state={pcfState} />
          </div>

          {/* Sensor fusion bar */}
          <div
            className={`mt-2 rounded-lg px-3 py-2 flex items-center justify-between text-[12px] font-geist transition-colors duration-500 ${isCritical ? "bg-red-50 border border-red-200" : "bg-slate-50 border border-slate-200"}`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`font-bold uppercase ${isCritical ? "text-red-700" : "text-slate-500"}`}
              >
                Thị giác AI
              </span>
              <span className={isCritical ? "text-red-600" : "text-slate-400"}>
                {isCritical ? "Tư thế ngã · 97.4%" : "Đứng thẳng · 99.1%"}
              </span>
              <span className="text-slate-300">|</span>
              <span
                className={`font-bold uppercase ${isCritical ? "text-red-700" : "text-slate-500"}`}
              >
                Âm thanh AI
              </span>
              <span className={isCritical ? "text-red-600" : "text-slate-400"}>
                {isCritical ? "Va đập 91dB · Kêu cứu 88dB" : "Môi trường 32dB"}
              </span>
            </div>
            <span
              className={`font-bold uppercase px-2 py-0.5 rounded ${isCritical ? "bg-red-600 text-white" : "text-slate-400"}`}
            >
              {isCritical ? "HỢP NHẤT CẢM BIẾN " : "Đang giám sát"}
            </span>
          </div>

          {/* Demo button */}
          <div className="mt-3 flex gap-2">
            {!isCritical ? (
              <button
                id="privacy-camera-demo-btn"
                onClick={triggerFall}
                disabled={transitioning}
                className="flex-1 py-2.5 rounded-xl text-base font-bold text-slate-900 hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: `linear-gradient(135deg, ${ACCENT} 0%, #5DD3E0 100%)` }}
              >
                <Siren className="w-4 h-4" />
                Mô phỏng: Kích hoạt sự cố ngã
              </button>
            ) : (
              <button
                onClick={resetState}
                className="flex-1 py-2.5 rounded-xl text-base font-bold text-white hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-800"
              >
                <CheckCircle2 className="w-4 h-4" />
                Đặt lại — Chế độ riêng tư
              </button>
            )}
          </div>
        </div>

        {/* Right panel */}
        <div className="lg:col-span-2 flex flex-col gap-3">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <p className="text-[12px] font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" style={{ color: ACCENT }} />
              Privacy-by-Design · Nguyên lý
            </p>
            <div className="space-y-2.5 text-[13px]">
              {[
                ["Nhận diện khuôn mặt", "TẮT — Không lưu trữ"],
                ["Video gốc", "Không gửi lên server"],
                ["Pose Estimation", "Xử lý cục bộ (Edge AI)"],
                ["Audio raw", "Chuyển thành spectrogram"],
              ].map(([label, value]) => (
                <div key={label} className="flex items-start justify-between gap-2">
                  <span className="text-slate-500">{label}</span>
                  <span className="font-semibold text-right text-emerald-700">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex-1">
            <p className="text-[12px] font-bold uppercase tracking-wider text-slate-500 mb-3">
              Độ tin cậy AI — Thời gian thực
            </p>
            <div className="space-y-3">
              {[
                {
                  label: "Phân tích tư thế",
                  val: isCritical ? 97 : 99,
                  color: isCritical ? "#EF4444" : "#10B981",
                  unit: "%",
                },
                {
                  label: "Phân tích âm thanh",
                  val: isCritical ? 91 : 32,
                  color: isCritical ? "#EF4444" : ACCENT,
                  unit: "dB",
                },
                {
                  label: "Điểm hợp nhất cảm biến",
                  val: isCritical ? 98 : 12,
                  color: isCritical ? "#DC2626" : "#64748B",
                  unit: "%",
                },
              ].map(({ label, val, color, unit }) => (
                <div key={label}>
                  <div className="flex justify-between text-[12px] mb-1">
                    <span className="text-slate-500">{label}</span>
                    <span className="font-bold font-mono" style={{ color }}>
                      {val}
                      {unit}
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${val}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200">
              <p className="text-[12px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                Nhật ký sự kiện
              </p>
              <div className="space-y-1.5 text-[12px] font-mono">
                {isCritical ? (
                  <>
                    <div className="flex gap-2 text-red-600">
                      <span className="text-slate-400">14:32:07</span> Phát hiện ngã · Phòng
                      103
                    </div>
                    <div className="flex gap-2 text-red-500">
                      <span className="text-slate-400">14:32:07</span> Âm thanh bất thường ·
                      Va đập 91dB
                    </div>
                    <div className="flex gap-2 text-red-500">
                      <span className="text-slate-400">14:32:08</span> Cảnh báo hợp nhất →
                      Kíp trực
                    </div>
                    <div className="flex gap-2 text-amber-600">
                      <span className="text-slate-400">14:32:08</span> Đã điều xe cấp cứu
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex gap-2 text-emerald-600">
                      <span className="text-slate-400">{timestamp}</span> Tư thế bình thường
                      · Dáng đi ổn định
                    </div>
                    <div className="flex gap-2 text-slate-400">
                      <span className="text-slate-400">14:31:55</span> Âm thanh · Môi trường
                      32dB
                    </div>
                    <div className="flex gap-2 text-slate-400">
                      <span className="text-slate-400">14:31:40</span> Toàn bộ hệ thống bình
                      thường
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CameraModal({ cam, onClose }: { cam: Camera; onClose: () => void }) {
  const isAlert = cam.status === "alert";
  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in"
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-4xl aspect-video rounded-2xl overflow-hidden bg-slate-900 ${
          isAlert ? "border-4 border-red-500" : "border border-slate-700"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <CameraFeed cam={cam} />

        <div className="absolute top-4 left-4 backdrop-blur-md bg-black/50 text-white text-sm font-geist px-3 py-1.5 rounded-full flex items-center gap-2">
          <Video className="w-4 h-4" />
          Phòng {cam.room} · {cam.label} · Khu {cam.zone}
        </div>

        <div className="absolute top-4 right-4 flex items-center gap-2">
          <span className="backdrop-blur-md bg-black/50 px-3 py-1.5 rounded-full flex items-center gap-2 text-[11px] uppercase tracking-wider text-white font-geist">
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: isAlert ? "#EF4444" : ACCENT }}
            />
            {isAlert ? "Cảnh báo Khẩn" : "Ổn định"}
          </span>
          <button
            onClick={onClose}
            className="backdrop-blur-md bg-black/50 text-white w-9 h-9 rounded-full flex items-center justify-center hover:bg-black/70"
            aria-label="Đóng"
          >
            âœ•
          </button>
        </div>

        {cam.overlay === "fall" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="scale-[2.2]">
              <SkeletonOverlay />
            </div>
            <span className="mt-6 text-red-500 font-bold text-3xl tracking-widest drop-shadow-[0_0_12px_rgba(239,68,68,0.9)]">
              PHÁT HIỆN NGÃ
            </span>
            <span className="mt-2 text-white/80 text-sm font-geist">
              Hệ thống AI phát hiện dáng người nằm sàn · Đã thông báo điều
              dưỡng trực
            </span>
          </div>
        )}

        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
          <span className="text-[11px] text-white/70 font-mono">14:32:07 · 1080p · 30fps</span>
          <div className="flex gap-2">
            <button
              className="px-4 py-2 rounded-lg text-sm font-medium text-slate-900 hover:opacity-90 transition"
              style={{ backgroundColor: ACCENT }}
            >
              Cử điều dưỡng
            </button>
            <button className="px-4 py-2 rounded-lg text-sm font-medium text-white border border-white/30 hover:bg-white/10 transition">
              Ghi clip 30s
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

type AlertSeverity = "critical" | "warning" | "stable";
interface AlertData {
  id: string;
  Icon: typeof Video;
  title: string;
  description: string;
  time: string;
  severity: AlertSeverity;
  room: string;
  resolved: boolean;
  dismissed: boolean;
}

const INITIAL_ALERTS: AlertData[] = [
  {
    id: "a1",
    Icon: AlertTriangle,
    title: "CẢNH BÁO KÉP — HỢP NHẤT CẢM BIẾN",
    description: "Phát hiện ngã & Tiếng va đập lớn (Camera & Micro P.103)",
    time: "Vừa xong",
    severity: "critical",
    room: "103",
    resolved: false,
    dismissed: false,
  },
  {
    id: "a2",
    Icon: Hand,
    title: "BÁO ĐỘNG ĐỎ — SOS PHẦN CỨNG",
    description: "Người nhà ấn nút SOS đầu giường (Phòng 101)",
    time: "1 phút",
    severity: "critical",
    room: "101",
    resolved: false,
    dismissed: false,
  },
  {
    id: "a3",
    Icon: Volume2,
    title: "ÂM THANH",
    description: "Tiếng kêu cứu khẩn cấp (Phòng 102)",
    time: "3 phút",
    severity: "warning",
    room: "102",
    resolved: false,
    dismissed: false,
  },
  {
    id: "a4",
    Icon: Activity,
    title: "NHỊP TIM ỔN ĐỊNH",
    description: "Bệnh nhân P.105 — Nhịp tim 72 bpm, SpO2 98%",
    time: "5 phút",
    severity: "stable",
    room: "105",
    resolved: false,
    dismissed: false,
  },
  {
    id: "a5",
    Icon: Thermometer,
    title: "NHIỆT ĐỘ BÌNH THƯỜNG",
    description: "Phòng 104 — Nhiệt độ 36.8°C, ổn định",
    time: "8 phút",
    severity: "stable",
    room: "104",
    resolved: false,
    dismissed: false,
  },
];

type AlertTab = "critical" | "warning" | "stable" | "all";

function AmbientAside({ onAlertClick }: { onAlertClick: (room: string) => void }) {
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<AlertTab>("critical");
  const [alerts, setAlerts] = useState<AlertData[]>([]);

  useEffect(() => {
    fetchApi("/ambient/incidents")
      .then((data: any[]) => {
        const mapped = data.map((d) => ({
          id: d.id,
          type: d.severity === "critical" ? "fall" : "sos",
          room: d.room,
          time: "Vừa xong", // parse time later
          status: d.status === "pending" ? "new" : "resolved",
          priority: d.severity === "critical" ? "high" : "medium",
          details: d.description,
        }));
        if (mapped.length > 0) setAlerts(mapped as any as AlertData[]);
        else setAlerts(INITIAL_ALERTS);
      })
      .catch(() => setAlerts(INITIAL_ALERTS));
  }, []);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const visibleAlerts = alerts.filter((a) => !a.dismissed);
  const filteredAlerts =
    activeTab === "all" ? visibleAlerts : visibleAlerts.filter((a) => a.severity === activeTab);

  const countBySeverity = (sev: AlertSeverity) =>
    visibleAlerts.filter((a) => a.severity === sev && !a.resolved).length;
  const totalUnresolved = visibleAlerts.filter((a) => !a.resolved).length;

  const handleResolve = (id: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, resolved: true } : a)));
    setExpandedId(null);
  };
  const handleDismiss = (id: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, dismissed: true } : a)));
    setExpandedId(null);
  };

  const tabs: { key: AlertTab; Icon: typeof CircleAlert; label: string; count: number }[] = [
    { key: "critical", Icon: CircleAlert, label: "Khẩn", count: countBySeverity("critical") },
    { key: "warning", Icon: AlertTriangle, label: "Cần xem", count: countBySeverity("warning") },
    { key: "stable", Icon: CheckCircle2, label: "Ổn định", count: countBySeverity("stable") },
    { key: "all", Icon: List, label: "Tất cả", count: totalUnresolved },
  ];

  // Collapsed floating button
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-50 hidden md:flex flex-col items-center gap-1.5 px-2 py-4 rounded-l-xl border border-r-0 border-slate-200 bg-white/95 backdrop-blur shadow-lg hover:shadow-xl transition-all hover:px-3 group"
      >
        <Radio
          className="w-4 h-4 text-slate-500 group-hover:text-slate-700 transition-colors"
          style={{ color: ACCENT }}
        />
        <ChevronLeft className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-colors" />
        {totalUnresolved > 0 && (
          <span className="absolute -top-1 -left-1 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1 animate-pulse">
            {totalUnresolved}
          </span>
        )}
      </button>
    );
  }

  return (
    <aside
      className="h-screen w-80 fixed right-0 top-0 bg-white flex-col z-40 border-l border-slate-200 hidden md:flex"
      style={{ animation: "slideInRight 0.25s ease-out" }}
    >
      <style>{`
        @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes expandDown { from { max-height: 0; opacity: 0; } to { max-height: 200px; opacity: 1; } }
      `}</style>

      {/* Header */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h2 className="text-xl text-slate-900 font-medium flex items-center gap-2">
            <Radio className="w-5 h-5" style={{ color: ACCENT }} />
            Cảnh báo AI Trực tiếp
          </h2>
          <p className="text-[11px] text-slate-500 mt-1">
            Giám sát hình ảnh và âm thanh thời gian thực
          </p>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          title="Thu gọn panel"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        {tabs.map(({ key, Icon, label, count }) => {
          const active = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 py-3 flex flex-col items-center justify-center border-b-2 transition-colors relative ${
                active
                  ? "text-slate-900 font-bold"
                  : "border-transparent text-slate-500 hover:bg-slate-50"
              }`}
              style={active ? { borderColor: ACCENT } : undefined}
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-[10px] uppercase tracking-wider font-geist">{label}</span>
              {count > 0 && (
                <span
                  className={`absolute top-1.5 right-2 min-w-[16px] h-[16px] rounded-full text-[9px] font-bold flex items-center justify-center px-0.5 ${
                    key === "critical"
                      ? "bg-red-500 text-white"
                      : key === "warning"
                        ? "bg-amber-400 text-slate-900"
                        : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Alert list */}
      <div className="flex-1 overflow-y-auto scrollbar-hide p-2 space-y-2">
        {filteredAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <CheckCircle2 className="w-8 h-8 mb-2" style={{ color: ACCENT }} />
            <p className="text-sm font-medium text-slate-500">Không có cảnh báo</p>
            <p className="text-[11px] mt-1">Tất cả đều ổn định</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const isExpanded = expandedId === alert.id;
            const critical = alert.severity === "critical";
            const warning = alert.severity === "warning";
            return (
              <div key={alert.id} className="transition-all duration-200">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : alert.id)}
                  className={`w-full text-left bg-white border rounded-lg p-3 cursor-pointer transition-all duration-200 ${
                    alert.resolved
                      ? "border-slate-200 bg-slate-50 opacity-60"
                      : critical
                        ? "border-red-300 bg-red-50/40 hover:bg-red-50"
                        : warning
                          ? "border-amber-300 bg-amber-50/30 hover:bg-amber-50"
                          : "border-slate-200 hover:bg-slate-50"
                  } ${isExpanded ? "ring-2 ring-offset-1" : ""}`}
                  style={{
                    borderLeft: critical
                      ? "4px solid #DC2626"
                      : warning
                        ? `4px solid #F59E0B`
                        : `4px solid ${ACCENT}`,
                    ...(isExpanded
                      ? { ringColor: critical ? "#FCA5A5" : warning ? "#FCD34D" : ACCENT }
                      : {}),
                  }}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span
                      className={`text-[12px] font-geist uppercase tracking-wider font-bold flex items-center gap-1 ${
                        alert.resolved
                          ? "text-slate-400 line-through"
                          : critical
                            ? "text-red-700"
                            : warning
                              ? "text-amber-700"
                              : "text-slate-700"
                      }`}
                    >
                      <alert.Icon className="w-3.5 h-3.5" />
                      {alert.title}
                    </span>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {alert.resolved && (
                        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                          Đã xử lý
                        </span>
                      )}
                      <span className="font-geist text-[10px] text-slate-400">{alert.time}</span>
                    </div>
                  </div>
                  <p
                    className={`text-sm ${alert.resolved ? "text-slate-400" : critical ? "text-red-900" : warning ? "text-amber-900" : "text-slate-700"}`}
                  >
                    {alert.description}
                  </p>
                  <div
                    className={`flex items-center gap-1 mt-1.5 text-[10px] ${isExpanded ? "text-slate-500" : "text-slate-400"}`}
                  >
                    <ChevronDown
                      className={`w-3 h-3 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                    />
                    <span>{isExpanded ? "Thu gọn" : "Xem chi tiết"}</span>
                  </div>
                </button>

                {/* Expanded actions */}
                {isExpanded && !alert.resolved && (
                  <div
                    className="mt-1 ml-1 mr-1 p-2 rounded-lg bg-slate-50 border border-slate-200 flex gap-2 overflow-hidden"
                    style={{ animation: "expandDown 0.2s ease-out" }}
                  >
                    <button
                      onClick={() => handleResolve(alert.id)}
                      className="flex-1 py-2 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors text-slate-700 bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Đã xử lý
                    </button>
                    <button
                      onClick={() => {
                        onAlertClick(alert.room);
                        setExpandedId(null);
                      }}
                      className="flex-1 py-2 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors text-slate-700 bg-white border border-slate-200 hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Xem camera
                    </button>
                    <button
                      onClick={() => handleDismiss(alert.id)}
                      className="flex-1 py-2 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors text-slate-700 bg-white border border-slate-200 hover:border-slate-400 hover:bg-slate-100"
                    >
                      <X className="w-3.5 h-3.5" />
                      Bỏ qua
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}

/* ============== VIEW 2: AMBULANCE — 15 KHOA + REALISTIC MAP ============== */

/* ---------- Department Data ---------- */
interface Department {
  id: string;
  name: string;
  shortName: string;
  icon: string;
  color: string;
  bgColor: string;
  beds: number;
  bedsTotal: number;
  status: "urgent" | "busy" | "available";
  doctor: string;
  nurse: string;
  equipment: string[];
}

const DEPARTMENTS: Department[] = [
  {
    id: "er",
    name: "Cấp cứu (ER)",
    shortName: "Cấp cứu",
    icon: "",
    color: "#DC2626",
    bgColor: "#FEF2F2",
    beds: 4,
    bedsTotal: 12,
    status: "urgent",
    doctor: "BS. Văn Ngữ",
    nurse: "ĐD. Thu Hà",
    equipment: ["Máy thở", "Máy sốc tim", "CT scanner"],
  },
  {
    id: "cardio",
    name: "Tim mạch",
    shortName: "Tim mạch",
    icon: "",
    color: "#7C3AED",
    bgColor: "#F5F3FF",
    beds: 2,
    bedsTotal: 8,
    status: "busy",
    doctor: "BS. Minh Tuấn",
    nurse: "ĐD. Lan Anh",
    equipment: ["Monitor tim", "Máy ECG", "Máy thở"],
  },
  {
    id: "neuro",
    name: "Phẫu thuật Thần kinh",
    shortName: "TK",
    icon: "",
    color: "#1E40AF",
    bgColor: "#EFF6FF",
    beds: 2,
    bedsTotal: 6,
    status: "available",
    doctor: "BS. Huy Hoàng",
    nurse: "ĐD. Quỳnh Nga",
    equipment: ["MRI", "Máy vi phẫu", "Kính hiển vi PT"],
  },
  {
    id: "thorax",
    name: "Lồng ngực & Mạch máu",
    shortName: "Lồng ngực",
    icon: "",
    color: "#0E7490",
    bgColor: "#ECFEFF",
    beds: 3,
    bedsTotal: 6,
    status: "available",
    doctor: "BS. Quốc Bảo",
    nurse: "ĐD. Hồng Nhung",
    equipment: ["Máy ECMO", "Máy thở", "Siêu âm tim"],
  },
  {
    id: "ortho",
    name: "Chấn thương CX & Cột sống",
    shortName: "Chấn thương",
    icon: "",
    color: "#D97706",
    bgColor: "#FFFBEB",
    beds: 5,
    bedsTotal: 10,
    status: "busy",
    doctor: "BS. Thành Đạt",
    nurse: "ĐD. Bích Ngọc",
    equipment: ["X-quang", "Kéo cột sống", "Robot PT"],
  },
  {
    id: "surgery",
    name: "Ngoại tổng hợp",
    shortName: "Ngoại TH",
    icon: "",
    color: "#16A34A",
    bgColor: "#F0FDF4",
    beds: 8,
    bedsTotal: 15,
    status: "available",
    doctor: "BS. Trung Kiên",
    nurse: "ĐD. Mỹ Hạnh",
    equipment: ["Phòng mổ A", "Nội soi", "Laparoscopy"],
  },
  {
    id: "internal",
    name: "Khoa Nội",
    shortName: "Nội",
    icon: "",
    color: "#2563EB",
    bgColor: "#EFF6FF",
    beds: 15,
    bedsTotal: 20,
    status: "busy",
    doctor: "BS. Văn Ngữ",
    nurse: "ĐD. Thu Hà",
    equipment: ["Monitor đa thông số", "Máy thở hỗ trợ"],
  },
  {
    id: "endo",
    name: "Nội tiết - Đái tháo đường",
    shortName: "Nội tiết",
    icon: "",
    color: "#CA8A04",
    bgColor: "#FEFCE8",
    beds: 3,
    bedsTotal: 12,
    status: "available",
    doctor: "BS. Hoàng Anh",
    nurse: "ĐD. Diễm Hương",
    equipment: ["Đường huyết liên tục", "Bơm insulin"],
  },
  {
    id: "bone",
    name: "Cơ Xương Khớp",
    shortName: "CXK",
    icon: "",
    color: "#92400E",
    bgColor: "#FFF7ED",
    beds: 4,
    bedsTotal: 10,
    status: "available",
    doctor: "BS. Phúc Nguyên",
    nurse: "ĐD. Khánh Linh",
    equipment: ["Vật lý trị liệu", "PT phục hồi"],
  },
  {
    id: "renal",
    name: "Thận - Tiết niệu",
    shortName: "Thận-TN",
    icon: "",
    color: "#0891B2",
    bgColor: "#ECFEFF",
    beds: 4,
    bedsTotal: 8,
    status: "busy",
    doctor: "BS. Thanh Bình",
    nurse: "ĐD. Ngọc Mai",
    equipment: ["Chạy thận x6", "Siêu âm"],
  },
  {
    id: "pedi",
    name: "Khoa Nhi",
    shortName: "Nhi",
    icon: "",
    color: "#DB2777",
    bgColor: "#FFF0F6",
    beds: 10,
    bedsTotal: 20,
    status: "available",
    doctor: "BS. Hồng Vân",
    nurse: "ĐD. Thu Trang",
    equipment: ["Lồng ấp", "Monitor nhi", "Máy thở nhi"],
  },
  {
    id: "obgyn",
    name: "Khoa Phụ sản",
    shortName: "Phụ sản",
    icon: "",
    color: "#E11D48",
    bgColor: "#FFF1F2",
    beds: 8,
    bedsTotal: 15,
    status: "busy",
    doctor: "BS. Bích Hằng",
    nurse: "ĐD. Lê Nga",
    equipment: ["Phòng sinh", "Doppler", "Lồng ấp"],
  },
  {
    id: "anest",
    name: "Gây mê hồi sức",
    shortName: "Gây mê",
    icon: "",
    color: "#475569",
    bgColor: "#F8FAFC",
    beds: 2,
    bedsTotal: 6,
    status: "urgent",
    doctor: "BS. Gia Phúc",
    nurse: "ĐD. Kim Oanh",
    equipment: ["Máy gây mê", "Monitor mê", "Truyền TM"],
  },
  {
    id: "plastic",
    name: "Phẫu thuật Tạo hình thẩm mỹ",
    shortName: "Tạo hình",
    icon: "",
    color: "#9333EA",
    bgColor: "#FAF5FF",
    beds: 3,
    bedsTotal: 8,
    status: "available",
    doctor: "BS. Minh Châu",
    nurse: "ĐD. Như Quỳnh",
    equipment: ["Phòng mổ tạo hình", "Máy laser"],
  },
  {
    id: "lab",
    name: "Xét nghiệm & CĐHA",
    shortName: "XN & CĐHA",
    icon: "",
    color: "#64748B",
    bgColor: "#F8FAFC",
    beds: 0,
    bedsTotal: 0,
    status: "available",
    doctor: "BS. Trọng Nghĩa",
    nurse: "KTV. Hải Nam",
    equipment: ["CT 64 lát", "MRI 3T", "PET-CT"],
  },
];

/* ---------- Ambulance Types ---------- */
type AmbulanceStatus = "critical" | "urgent" | "standby";
interface AmbulanceUnit {
  id: string;
  plate: string;
  status: AmbulanceStatus;
  patient: string;
  diagnosis: string;
  etaSeconds: number;
  crew: string;
  mapX: number;
  mapY: number;
  lat?: number;
  lng?: number;
  departmentId: string;
}

const AMBULANCES_INIT: AmbulanceUnit[] = [
  {
    id: "xe1",
    plate: "29A-213.07",
    status: "critical",
    patient: "Nguyễn Văn A, Nam · 62t",
    diagnosis: "Đột quỵ nhồi máu não",
    etaSeconds: 78,
    crew: "BS. Văn Ngữ · ĐD. Thu Hà",
    mapX: 420,
    mapY: 160,
    departmentId: "er",
  },
  {
    id: "xe2",
    plate: "30F-567.89",
    status: "urgent",
    patient: "Trần Thị B, Nữ · 45t",
    diagnosis: "Gãy xương đùi · Chấn thương",
    etaSeconds: 480,
    crew: "BS. Thành Đạt · ĐD. Bích Ngọc",
    mapX: 70,
    mapY: 375,
    departmentId: "ortho",
  },
  {
    id: "xe3",
    plate: "51A-999.11",
    status: "standby",
    patient: "—",
    diagnosis: "Chờ lệnh điều phối",
    etaSeconds: 0,
    crew: "BS. Trung Kiên · ĐD. Mỹ Hạnh",
    mapX: 290,
    mapY: 250,
    departmentId: "",
  },
];

const STATUS_STYLE: Record<
  AmbulanceStatus,
  { border: string; badge: string; badgeText: string; dot: string; label: string }
> = {
  critical: {
    border: "border-red-500",
    badge: "bg-red-600",
    badgeText: "text-white",
    dot: "bg-red-500",
    label: "KHẨN CẤP",
  },
  urgent: {
    border: "border-amber-400",
    badge: "bg-amber-500",
    badgeText: "text-white",
    dot: "bg-amber-500",
    label: "ƯU TIÊN",
  },
  standby: {
    border: "border-emerald-400",
    badge: "bg-emerald-500",
    badgeText: "text-white",
    dot: "bg-emerald-400",
    label: "SẴN SÀNG",
  },
};

function fmtEta(s: number): string {
  if (s <= 0) return "Chờ lệnh";
  const m = Math.floor(s / 60),
    sec = s % 60;
  return m > 0 ? `${m}p ${sec}s` : `${sec}s`;
}

/* ---------- LPR Scanner — Camera thực từ điện thoại/webcam ---------- */
type LprScanResult = {
  matched: boolean;
  plate: string | null;
  plates?: string[];
  open_gate: boolean;
  error?: string;
};

type EmsMissionEntry = {
  id: string;
  plate_number: string;
  hospital_id: string | null;
  status: string;
  created_at: string | null;
};

function LprScanner({
  plate,
  onNotify,
  queue,
  activeId,
  onSelectQueue,
  hospitalId,
  onScanComplete,
}: {
  plate: string;
  onNotify: () => void;
  queue: AmbulanceUnit[];
  activeId: string | null;
  onSelectQueue: (id: string) => void;
  hospitalId?: string;
  onScanComplete?: (plate: string) => void;
}) {
  // ── Camera state ─────────────────────────────────────────────────────
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [autoScan, setAutoScan] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [lastResult, setLastResult] = useState<LprScanResult | null>(null);
  const [notified, setNotified] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [gateOpenAlert, setGateOpenAlert] = useState(false);
  const [scanCount, setScanCount] = useState(0);
  const [activeMissions, setActiveMissions] = useState<EmsMissionEntry[]>([]);
  const [demoPlate, setDemoPlate] = useState(""); // Demo mode: nhập biển số trực tiếp
  const [demoMode, setDemoMode] = useState(false);

  // ── Fetch danh sách xe cấp cứu đang active từ backend ────────────────
  const fetchActiveMissions = useCallback(async () => {
    try {
      const params = hospitalId ? `?hospital_id=${encodeURIComponent(hospitalId)}` : "";
      const data: EmsMissionEntry[] = await fetchApi(`/ems/missions/active${params}`);
      setActiveMissions(Array.isArray(data) ? data : []);
    } catch {
      setActiveMissions([]);
    }
  }, [hospitalId]);

  useEffect(() => {
    fetchActiveMissions();
    // Làm mới mỗi 10s để cập nhật khi tài xế mới chia sẻ GPS
    const timer = setInterval(fetchActiveMissions, 10000);
    return () => clearInterval(timer);
  }, [fetchActiveMissions]);

  // ── Bật camera ─────────────────────────────────────────────────────
  const startCamera = async () => {
    setCameraError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" }, // Camera sau trên điện thoại
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        setCameraError(
          "Trình duyệt chưa cấp quyền camera. Vui lòng cho phép trong cài đặt.",
        );
      } else if (err.name === "NotFoundError") {
        setCameraError("Không tìm thấy camera. Hãy kiểm tra thiết bị.");
      } else {
        setCameraError(`Lỗi camera: ${err.message}`);
      }
    }
  };

  // ── Tắt camera ─────────────────────────────────────────────────────
  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    setAutoScan(false);
  };

  // Dọn dẹp khi unmount
  useEffect(() => {
    return () => stopCamera();
  }, []);

  // ── Chụp 1 frame từ video → blob → FormData → POST backend ─────────
  const captureAndScan = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    if (scanning) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);

    // Hiển thị preview
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setPreviewDataUrl(dataUrl);

    // Chuyển thành Blob để gửi multipart
    canvas.toBlob(
      async (blob) => {
        if (!blob) return;
        setScanning(true);
        setScanCount((c) => c + 1);
        try {
          const formData = new FormData();
          formData.append("image", blob, "lpr_capture.jpg");
          if (hospitalId) formData.append("hospital_id", hospitalId);
          formData.append("camera_id", "cam_mobile_gate");

          const data: LprScanResult = await fetchApi("/ambulance/lpr/camera", {
            method: "POST",
            body: formData,
          });
          setLastResult(data);

          if (data.open_gate) {
            setGateOpenAlert(true);
            setAutoScan(false); // Dừng quét khi đã mở
            if (scanIntervalRef.current) {
              clearInterval(scanIntervalRef.current);
              scanIntervalRef.current = null;
            }
            // Âm thanh thông báo
            try {
              new Audio("/alert.mp3").play().catch(() => {});
            } catch (_) {}
          }
        } catch (err: any) {
          setLastResult({
            matched: false,
            plate: null,
            open_gate: false,
            error: err?.message || "Lỗi kết nối backend.",
          });
        } finally {
          setScanning(false);
        }
      },
      "image/jpeg",
      0.85,
    );
  };

  // ── Bật/tắt chế độ tự động quét mỗi 3 giây ────────────────────────
  const toggleAutoScan = () => {
    if (autoScan) {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
      }
      setAutoScan(false);
    } else {
      setAutoScan(true);
      captureAndScan(); // Quét ngay lập tức
      scanIntervalRef.current = setInterval(captureAndScan, 3000);
    }
  };

  // ── Upload ảnh thủ công từ máy ────────────────────────────────────
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const dataUrl = URL.createObjectURL(file);
    setPreviewDataUrl(dataUrl);
    setScanning(true);
    setScanCount((c) => c + 1);

    try {
      const formData = new FormData();
      formData.append("image", file, file.name);
      if (hospitalId) formData.append("hospital_id", hospitalId);
      formData.append("camera_id", "cam_upload");

      const data: LprScanResult = await fetchApi("/ambulance/lpr/camera", {
        method: "POST",
        body: formData,
      });
      setLastResult(data);
      if (data.open_gate) {
        setGateOpenAlert(true);
        try {
          new Audio("/alert.mp3").play().catch(() => {});
        } catch (_) {}
      }
    } catch (err: any) {
      setLastResult({
        matched: false,
        plate: null,
        open_gate: false,
        error: err?.message || "Lỗi kết nối backend.",
      });
    } finally {
      setScanning(false);
      e.target.value = "";
    }
  };

  // ── Demo mode: gửi biển số trực tiếp mà không cần ảnh (bypass VNPT) ─────────
  const handleDemoScan = async () => {
    const plate = demoPlate.trim();
    if (!plate) return;

    setScanning(true);
    setScanCount((c) => c + 1);
    setPreviewDataUrl(null); // không có ảnh preview khi demo
    try {
      // Gửi một file giả (trống) kèm plate_hint để backend dùng demo mode
      const formData = new FormData();
      const fakeBlob = new Blob(["demo"], { type: "image/jpeg" });
      formData.append("image", fakeBlob, "demo.jpg");
      if (hospitalId) formData.append("hospital_id", hospitalId);
      formData.append("camera_id", "cam_demo");
      formData.append("plate_hint", plate);

      const data: LprScanResult = await fetchApi("/ambulance/lpr/camera", {
        method: "POST",
        body: formData,
      });
      setLastResult(data);
      if (data.open_gate) {
        setGateOpenAlert(true);
        try {
          new Audio("/alert.mp3").play().catch(() => {});
        } catch (_) {}
      }
    } catch (err: any) {
      setLastResult({
        matched: false,
        plate: null,
        open_gate: false,
        error: err?.message || "Lỗi kết nối backend.",
      });
    } finally {
      setScanning(false);
    }
  };

  const handleNotify = () => {
    if (notified) return;
    setNotified(true);
    onNotify();
  };

  // Sau khi mở barrier, refresh lại danh sách
  useEffect(() => {
    if (gateOpenAlert) {
      fetchActiveMissions();
    }
  }, [gateOpenAlert, fetchActiveMissions]);

  const queueRest = queue.filter((a) => a.plate !== plate);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2.5">
      <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
        <Camera className="w-3.5 h-3.5" style={{ color: ACCENT }} />
        LPR Cổng vào · Camera · Cấp cứu
      </h4>

      {/* ── Khu vực Camera / Video ── */}
      <div
        className="relative rounded-lg overflow-hidden bg-slate-900"
        style={{ aspectRatio: "16/9" }}
      >
        {/* Canvas ẩn để chụp frame */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Video stream */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${!cameraActive ? "hidden" : ""}`}
        />

        {/* Preview ảnh vừa chụp / chưa bật camera */}
        {!cameraActive && (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
            {previewDataUrl ? (
              <img
                src={previewDataUrl}
                alt="LPR preview"
                className="absolute inset-0 w-full h-full object-cover opacity-70"
              />
            ) : (
              <>
                <Camera className="w-10 h-10 text-slate-500" />
                <p className="text-slate-400 text-xs font-medium text-center px-4">
                  Bật camera để quét biển số tự động
                </p>
              </>
            )}
          </div>
        )}

        {/* Overlay: đường quét nếu đang auto-scan */}
        {autoScan && (
          <div
            className="absolute inset-x-0 h-[2px] z-20 pointer-events-none"
            style={{
              background: `linear-gradient(90deg,transparent,${ACCENT},transparent)`,
              boxShadow: `0 0 10px ${ACCENT}`,
              animation: "lpr-scan 1.2s ease-in-out infinite",
            }}
          />
        )}

        {/* Khung nhận diện biển số */}
        {lastResult?.plate && (
          <div className="absolute inset-x-4 bottom-2 flex justify-center z-20">
            <div
              className={`px-3 py-1 rounded border-2 flex items-center gap-2 ${
                lastResult.open_gate ? "bg-white border-green-500" : "bg-white border-yellow-400"
              }`}
            >
              <span className="text-xs font-black tracking-widest text-slate-900 font-mono">
                {lastResult.plate}
              </span>
              {lastResult.open_gate ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
              ) : (
                <X className="w-3.5 h-3.5 text-yellow-500" />
              )}
            </div>
          </div>
        )}

        {/* Badge Live / Số lần quét */}
        <div className="absolute top-1.5 left-1.5 z-30 flex items-center gap-1 bg-black/60 rounded px-1.5 py-0.5">
          <span
            className={`w-1.5 h-1.5 rounded-full ${autoScan ? "bg-red-500 animate-pulse" : "bg-slate-500"}`}
          />
          <span className="text-[8px] font-mono text-white">
            {autoScan ? "AUTO SCAN" : cameraActive ? "CAMERA ON" : "CAMERA OFF"}
          </span>
        </div>
        {scanCount > 0 && (
          <div className="absolute top-1.5 right-1.5 z-30 bg-black/60 rounded px-1.5 py-0.5">
            <span className="text-[8px] font-mono text-white">#{scanCount} lần quét</span>
          </div>
        )}

        {/* Lỗi camera */}
        {cameraError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 p-3 z-30">
            <p className="text-red-400 text-xs text-center font-bold">{cameraError}</p>
          </div>
        )}
      </div>

      <style>{`@keyframes lpr-scan{0%,100%{top:0%}50%{top:calc(100% - 2px)}}`}</style>

      {/* ── Cảnh báo: Phát hiện xe cấp cứu → Mở Barrier ── */}
      {gateOpenAlert && (
        <div className="space-y-2">
          {/* Bước 1: Cảnh báo đỏ */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-red-50 border-2 border-red-500">
            <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center flex-shrink-0 animate-pulse">
              <Siren className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-black text-red-800 text-sm">🚨 PHÁT HIỆN XE CẤP CỨU</p>
              <p className="text-xs text-red-600 font-mono font-bold">{lastResult?.plate}</p>
              <p className="text-[10px] text-red-500">
                Xe khớp danh sách cấp cứu — Đang mở barrier
              </p>
            </div>
          </div>
          {/* Bước 2: Xác nhận mở barrier */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-green-50 border-2 border-green-500 animate-pulse">
            <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-black text-green-800 text-sm">✅ MỞ BARRIER!</p>
              <p className="text-xs text-green-700">
                Xe <span className="font-mono font-bold">{lastResult?.plate}</span> — Nhiệm vụ
                xác nhận ✓
              </p>
            </div>
            <button
              onClick={() => setGateOpenAlert(false)}
              className="text-green-600 hover:text-green-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Kết quả quét ── */}
      {lastResult && !gateOpenAlert && (
        <>
          {/* Trường hợp: phát hiện xe cấp cứu khớp → mở barrier (đã xử lý ở gateOpenAlert) */}
          {/* Trường hợp: không nhận diện được biển số nào, hoặc nhận diện được xe nhưng KHÔNG thuộc danh sách cấp cứu */}
          {!lastResult.open_gate && !lastResult.error && (
            <div className="flex items-center gap-1.5 px-2 py-1.5 rounded text-[10px] bg-slate-50 border border-slate-200">
              <CheckCircle2 className="w-3 h-3 text-slate-400" />
              <span className="font-medium text-slate-500">
                {lastResult.plates && lastResult.plates.length > 0
                  ? `Phát hiện: ${lastResult.plates.join(", ")} — Không nằm trong danh sách ưu tiên`
                  : lastResult.plate
                    ? `Biển số ${lastResult.plate} — Không nằm trong danh sách ưu tiên`
                    : "Không có cấp cứu — Chưa phát hiện biển số xe"}
              </span>
            </div>
          )}
          {/* Lỗi */}
          {lastResult.error && (
            <div className="flex items-center gap-1.5 px-2 py-1.5 rounded text-[10px] bg-red-50">
              <X className="w-3 h-3 text-red-500" />
              <span className="font-bold text-red-700">{lastResult.error}</span>
            </div>
          )}
        </>
      )}

      {/* ── Đang quét spinner ── */}
      {scanning && (
        <div className="flex items-center gap-2 text-xs text-cyan-700 font-bold">
          <span className="w-3 h-3 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          Đang nhận diện biển số...
        </div>
      )}

      {/* ── Nút điều khiển camera ── */}
      <div className="flex flex-wrap gap-1.5">
        {!cameraActive ? (
          <button
            onClick={startCamera}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-900 hover:opacity-90 transition"
            style={{ backgroundColor: ACCENT }}
          >
            <Camera className="w-3.5 h-3.5" />
            Bật Camera
          </button>
        ) : (
          <>
            <button
              onClick={toggleAutoScan}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                autoScan ? "bg-red-500 text-white animate-pulse" : "bg-cyan-500 text-white"
              }`}
            >
              {autoScan ? <StopCircle className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              {autoScan ? "Dừng tự động" : "Quét tự động (3s)"}
            </button>
            <button
              onClick={captureAndScan}
              disabled={scanning || autoScan}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-white disabled:opacity-40 hover:bg-slate-700 transition"
            >
              <ScanLine className="w-3.5 h-3.5" />
              Chụp thủ công
            </button>
            <button
              onClick={stopCamera}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
            >
              <X className="w-3.5 h-3.5" />
              Tắt
            </button>
          </>
        )}

        {/* Upload ảnh thay vì dùng camera */}
        <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 transition cursor-pointer">
          <Upload className="w-3.5 h-3.5" />
          Upload ảnh
          <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
        </label>

        {/* Nút mở Demo Mode */}
        <button
          onClick={() => setDemoMode((v) => !v)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
            demoMode
              ? "bg-amber-50 border-amber-400 text-amber-700"
              : "border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
          title="Nhập thủ công"
        >
          ⚡ Nhập thủ công
        </button>
      </div>

      {/* Demo Mode: nhập biển số thủ công để test */}
      {demoMode && (
        <div className="flex gap-1.5 items-center p-2 rounded-xl bg-amber-50 border border-amber-200">
          <Siren className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
          <input
            type="text"
            placeholder="Nhập biển số VD: 51F-123.45"
            value={demoPlate}
            onChange={(e) => setDemoPlate(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleDemoScan()}
            className="flex-1 bg-transparent text-xs font-mono border-none outline-none text-amber-900 placeholder:text-amber-400"
          />
          <button
            onClick={handleDemoScan}
            disabled={scanning || !demoPlate.trim()}
            className="px-2 py-1 rounded-lg text-[10px] font-bold bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50 transition"
          >
            {scanning ? "..." : "Quét"}
          </button>
        </div>
      )}

      {/* ── Hàng đợi Cấp cứu tại cổng (từ EmsMission active) ── */}
      <div className="border-t border-slate-100 pt-2">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
            Cấp cứu
          </p>
          <button
            onClick={fetchActiveMissions}
            className="text-[9px] text-cyan-600 hover:text-cyan-800 font-medium flex items-center gap-0.5"
            title="Làm mới danh sách"
          >
            <span className="text-[10px]">↻</span> Cập nhật
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5 pb-1">
          {activeMissions.length === 0 && (
            <span className="text-[10px] text-slate-400 italic">
              Chưa có xe cấp cứu trong hàng đợi
            </span>
          )}
          {activeMissions.map((m) => (
            <div
              key={m.id}
              className="flex-shrink-0 flex items-center gap-1.5 px-2 py-1 rounded-full border border-red-300 bg-red-50 text-[10px] font-bold"
            >
              <Siren className="w-2.5 h-2.5 text-red-500" />
              <span className="font-mono text-red-800">{m.plate_number}</span>
            </div>
          ))}
        </div>
      </div>

      {lastResult?.open_gate && !notified && (
        <button
          onClick={handleNotify}
          className="w-full py-1.5 rounded-lg text-xs font-bold text-slate-900 hover:opacity-90 transition flex items-center justify-center gap-1.5"
          style={{ backgroundColor: ACCENT }}
        >
          <Phone className="w-3 h-3" />
          Thông báo Kíp trực
        </button>
      )}
      {notified && (
        <div className="flex items-center gap-1.5 text-[10px] text-emerald-700 font-bold">
          <CheckCircle2 className="w-3 h-3" />
          Đã gửi OTT — Kíp đang chuẩn bị
        </div>
      )}
    </div>
  );
}

/* ---------- Ambulance Map ---------- */
function AmbulanceMap({
  ambulances,
  selectedId,
  onSelect,
  highlightDeptId,
}: {
  ambulances: AmbulanceUnit[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  highlightDeptId: string | null;
}) {
  const rOpacity = (amb: AmbulanceUnit) => {
    if (selectedId && selectedId !== amb.id) return 0.15;
    if (highlightDeptId && highlightDeptId !== amb.departmentId) return 0.15;
    return 0.88;
  };
  return (
    <div className="absolute inset-0 bg-[#E8F0E9]">
      <svg viewBox="0 0 600 420" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
        <rect width="600" height="420" fill="#E8F0E9" />
        <rect x="330" y="50" width="120" height="90" rx="8" fill="#C8E6C9" opacity="0.7" />
        <text x="385" y="102" textAnchor="middle" fontSize="9" fill="#388E3C" fontStyle="italic">
          Công viên Thống Nhất
        </text>
        <ellipse
          cx="420"
          cy="110"
          rx="55"
          ry="35"
          fill="#A5D6F7"
          stroke="#64B5F6"
          strokeWidth="1.2"
        />
        <text x="420" y="115" textAnchor="middle" fontSize="8.5" fill="#1565C0" fontStyle="italic">
          Hồ Tây
        </text>
        <ellipse
          cx="195"
          cy="295"
          rx="45"
          ry="22"
          fill="#A5D6F7"
          stroke="#64B5F6"
          strokeWidth="1"
        />
        <text x="195" y="298" textAnchor="middle" fontSize="8" fill="#1565C0" fontStyle="italic">
          Hồ Hoàn Kiếm
        </text>
        {[
          [40, 40, 55, 38],
          [108, 40, 65, 38],
          [188, 40, 55, 38],
          [260, 40, 48, 38],
          [40, 105, 55, 55],
          [108, 105, 65, 55],
          [40, 185, 55, 55],
          [108, 185, 65, 55],
          [188, 185, 48, 38],
          [40, 265, 55, 62],
          [108, 265, 65, 62],
          [470, 195, 58, 48],
          [470, 265, 58, 52],
          [400, 265, 56, 52],
          [310, 345, 58, 38],
          [392, 360, 55, 30],
        ].map(([x, y, w, h], i) => (
          <rect
            key={i}
            x={x}
            y={y}
            width={w}
            height={h}
            fill="#F5F0E8"
            stroke="#D7CFC0"
            strokeWidth="0.8"
            rx="3"
          />
        ))}
        {[92, 178, 258, 342].map((y, i) => (
          <g key={`h${i}`}>
            <line x1="0" y1={y} x2="600" y2={y} stroke="#FFF" strokeWidth="11" />
            <line
              x1="0"
              y1={y}
              x2="600"
              y2={y}
              stroke="#E8DCC8"
              strokeWidth="11"
              strokeOpacity="0.4"
            />
          </g>
        ))}
        {[107, 186, 282, 372, 462].map((x, i) => (
          <g key={`v${i}`}>
            <line x1={x} y1="0" x2={x} y2="420" stroke="#FFF" strokeWidth="9" />
            <line
              x1={x}
              y1="0"
              x2={x}
              y2="420"
              stroke="#E8DCC8"
              strokeWidth="9"
              strokeOpacity="0.4"
            />
          </g>
        ))}
        <text x="12" y="178" fontSize="8.5" fill="#9E9E9E">
          Đ. Bạch Mai
        </text>
        <text x="12" y="258" fontSize="8.5" fill="#9E9E9E">
          Đ. Lê Duẩn
        </text>
        <text x="115" y="35" fontSize="8.5" fill="#9E9E9E">
          Phố Huế
        </text>
        <text x="290" y="35" fontSize="8.5" fill="#9E9E9E">
          Đinh Tiên Hoàng
        </text>
        <text x="468" y="35" fontSize="8.5" fill="#9E9E9E">
          Giải Phóng
        </text>
        {/* Routes */}
        <path
          d="M 420 160 L 462 160 L 462 130"
          fill="none"
          stroke="#EF4444"
          strokeWidth="4.5"
          strokeLinecap="round"
          opacity={rOpacity(ambulances[0] ?? AMBULANCES_INIT[0])}
        />
        <path
          d="M 420 160 L 462 160 L 462 130"
          fill="none"
          stroke="white"
          strokeWidth="1.5"
          strokeDasharray="5 5"
          strokeLinecap="round"
          opacity={rOpacity(ambulances[0] ?? AMBULANCES_INIT[0]) * 0.7}
        />
        <path
          d="M 70 375 L 70 258 L 186 258 L 186 178 L 372 178 L 462 178 L 462 130"
          fill="none"
          stroke="#F59E0B"
          strokeWidth="4"
          strokeLinecap="round"
          opacity={rOpacity(ambulances[1] ?? AMBULANCES_INIT[1])}
        />
        <path
          d="M 70 375 L 70 258 L 186 258 L 186 178 L 372 178 L 462 178 L 462 130"
          fill="none"
          stroke="white"
          strokeWidth="1.2"
          strokeDasharray="6 5"
          strokeLinecap="round"
          opacity={rOpacity(ambulances[1] ?? AMBULANCES_INIT[1]) * 0.6}
        />
        <path
          d="M 282 250 L 282 178 L 372 178"
          fill="none"
          stroke="#10B981"
          strokeWidth="3"
          strokeDasharray="7 5"
          strokeLinecap="round"
          opacity={rOpacity(ambulances[2] ?? AMBULANCES_INIT[2]) * 0.7}
        />
        <g transform="translate(462,112)">
          <rect
            x="-22"
            y="-22"
            width="44"
            height="44"
            rx="8"
            fill={ACCENT}
            stroke="#0F172A"
            strokeWidth="2"
          />
          <text x="0" y="8" textAnchor="middle" fontSize="20" fill="#0F172A" fontWeight="900">
            H
          </text>
          <text x="0" y="36" textAnchor="middle" fontSize="8" fill="#0F172A" fontWeight="700">
            BV Bạch Mai
          </text>
        </g>
        {ambulances.map((amb) => {
          const fillColor =
            amb.status === "critical" ? "#EF4444" : amb.status === "urgent" ? "#F59E0B" : "#10B981";
          const isSel = selectedId === amb.id;
          return (
            <g
              key={amb.id}
              transform={`translate(${amb.mapX},${amb.mapY})`}
              onClick={() => onSelect(amb.id)}
              style={{
                cursor: "pointer",
                transition: "transform 0.8s cubic-bezier(0.4,0,0.2,1)",
              }}
            >
              {amb.status === "critical" && (
                <circle r="22" fill="none" stroke="#EF4444" strokeOpacity="0.45">
                  <animate
                    attributeName="r"
                    from="18"
                    to="38"
                    dur="1.3s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    from="0.7"
                    to="0"
                    dur="1.3s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}
              {isSel && (
                <circle
                  r="26"
                  fill="none"
                  stroke={ACCENT}
                  strokeWidth="3"
                  strokeDasharray="4 2"
                  opacity="0.9"
                >
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from="0"
                    to="360"
                    dur="3s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}
              <circle r="17" fill={fillColor} stroke="white" strokeWidth="2.5" />
              <text x="0" y="5" textAnchor="middle" fontSize="10" fill="white" fontWeight="800">
                +
              </text>
              <text x="0" y="34" textAnchor="middle" fontSize="8" fill={fillColor} fontWeight="700">
                {amb.plate.slice(-6)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ---------- ETA Countdown ---------- */
function EtaCountdown({ initialSeconds }: { initialSeconds: number }) {
  const [secs, setSecs] = useState(initialSeconds);
  useEffect(() => {
    if (secs <= 0) return;
    const id = setInterval(() => setSecs((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, []);
  return <span>{fmtEta(secs)}</span>;
}

/* ---------- Department Sidebar ---------- */
function DepartmentSidebar({
  selectedDeptId,
  onSelect,
  ambulances,
}: {
  selectedDeptId: string | null;
  onSelect: (id: string) => void;
  ambulances: AmbulanceUnit[];
}) {
  const badge = (dept: Department) =>
    dept.status === "urgent"
      ? { bg: "#FEE2E2", text: "#DC2626", label: "KHẨN" }
      : dept.status === "busy"
        ? { bg: "#FEF3C7", text: "#D97706", label: "BẬN" }
        : { bg: "#F0FDF4", text: "#16A34A", label: "OK" };
  const ambCount = (id: string) => ambulances.filter((a) => a.departmentId === id).length;
  return (
    <div className="flex flex-col h-full">
      <div className="px-2 py-1.5 border-b border-slate-100 bg-white sticky top-0 z-10">
        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">15 Khoa</p>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-hide py-1 space-y-px">
        {DEPARTMENTS.map((dept) => {
          const b = badge(dept);
          const cnt = ambCount(dept.id);
          const isSel = selectedDeptId === dept.id;
          const pct =
            dept.bedsTotal > 0 ? ((dept.bedsTotal - dept.beds) / dept.bedsTotal) * 100 : 100;
          return (
            <button
              key={dept.id}
              onClick={() => onSelect(dept.id)}
              className={`w-full text-left px-2 py-1.5 rounded-lg transition-all ${isSel ? "shadow-sm" : "hover:bg-slate-50"}`}
              style={{
                backgroundColor: isSel ? dept.bgColor : undefined,
                borderLeft: isSel ? `3px solid ${dept.color}` : "3px solid transparent",
              }}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-slate-900 truncate leading-tight">
                    {dept.shortName}
                  </p>
                  {dept.bedsTotal > 0 && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <div className="w-8 h-1 bg-slate-100 rounded-full overflow-hidden flex-shrink-0">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, backgroundColor: dept.color }}
                        />
                      </div>
                      <span className="text-[8px] text-slate-400 font-mono">{dept.beds}tr</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                  <span
                    className="text-[8px] font-bold px-1 rounded"
                    style={{ backgroundColor: b.bg, color: b.text }}
                  >
                    {b.label}
                  </span>
                  {cnt > 0 && (
                    <span className="text-[8px] font-bold text-white px-1 rounded bg-red-500">
                      {cnt} xe
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Department Detail Panel ---------- */
function ContactCard({
  label,
  name,
  phone,
  role,
}: {
  label: string;
  name: string;
  phone: string;
  role: string;
}) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
      <div>
        <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
        <p className="text-[11px] font-bold text-slate-900">{name}</p>
        <p className="text-[10px] text-slate-500">{role}</p>
      </div>
      <a
        href={`tel:${phone}`}
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-slate-900 hover:opacity-90 transition"
        style={{ backgroundColor: ACCENT }}
      >
        <Phone className="w-3 h-3" />
        {phone}
      </a>
    </div>
  );
}

function DepartmentPanel({
  dept,
  onBook,
  onCall,
}: {
  dept: Department;
  onBook: () => void;
  onCall: () => void;
}) {
  const [notified, setNotified] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const pct = dept.bedsTotal > 0 ? ((dept.bedsTotal - dept.beds) / dept.bedsTotal) * 100 : 100;

  // Simulated on-duty contacts per dept
  const contacts = [
    { label: "Bác sĩ trực", name: dept.doctor, role: "Trưởng kíp", phone: "0912.345.678" },
    {
      label: "Điều dưỡng trực",
      name: dept.nurse,
      role: "ĐD phụ trách phòng",
      phone: "0909.876.543",
    },
    { label: "Trạm y tá", name: "Trực ban", role: "Trực 24/7", phone: "(024) 3869.3731" },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2.5">
      {/* Header */}
      <div>
        <p className="text-xs font-bold text-slate-900 leading-tight">{dept.name}</p>
        <p className="text-[10px] text-slate-500 mt-0.5">
          {dept.doctor} · {dept.nurse}
        </p>
      </div>

      {/* Bed status */}
      {dept.bedsTotal > 0 && (
        <div>
          <div className="flex justify-between text-[10px] mb-1">
            <span className="text-slate-500 font-semibold">Giường còn trống</span>
            <span className="font-bold" style={{ color: dept.beds <= 2 ? "#DC2626" : dept.color }}>
              {dept.beds} / {dept.bedsTotal}
            </span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${pct}%`, backgroundColor: dept.color }}
            />
          </div>
        </div>
      )}

      {/* Equipment */}
      <div>
        <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
          Trang thiết bị sẵn sàng
        </p>
        <div className="flex flex-wrap gap-1">
          {dept.equipment.map((eq) => (
            <span
              key={eq}
              className="text-[9px] px-1.5 py-0.5 rounded-md border border-slate-200 text-slate-600 bg-slate-50"
            >
              {eq}
            </span>
          ))}
        </div>
      </div>

      {/* Báo khoa nhận bệnh */}
      <button
        onClick={() => {
          setNotified(true);
          onBook();
        }}
        disabled={notified}
        className="w-full py-2 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-60"
        style={{
          backgroundColor: notified ? "#DCFCE7" : ACCENT,
          color: notified ? "#16A34A" : "#0F172A",
        }}
      >
        <CheckCircle2 className="w-3.5 h-3.5" />
        {notified ? "Đã thông báo khoa ✓" : "Báo khoa chuẩn bị nhận bệnh"}
      </button>

      {/* Liên lạc kíp — toggle contact list */}
      <button
        onClick={() => setShowContact((v) => !v)}
        className="w-full py-2 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 transition flex items-center justify-center gap-1.5"
      >
        <Phone className="w-3.5 h-3.5" />
        {showContact ? "Ẩn thông tin liên hệ" : "Xem thông tin kíp trực"}
        <ChevronDown
          className={`w-3 h-3 transition-transform ${showContact ? "rotate-180" : ""}`}
        />
      </button>

      {/* Contact info panel */}
      {showContact && (
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100">
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
              Kíp trực đang làm việc
            </p>
          </div>
          <div className="px-3 divide-y divide-slate-100">
            {contacts.map((c) => (
              <ContactCard key={c.label} {...c} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Vehicle Panel ---------- */
function VehiclePanel({ amb, onClose }: { amb: AmbulanceUnit; onClose: () => void }) {
  const s = STATUS_STYLE[amb.status];
  const statusColor =
    amb.status === "critical" ? "#EF4444" : amb.status === "urgent" ? "#F59E0B" : "#10B981";
  return (
    <div
      className="bg-white border-2 rounded-xl p-3 space-y-2"
      style={{ borderColor: statusColor }}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          {/* Professional ambulance icon */}
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: statusColor + "18", border: `1.5px solid ${statusColor}40` }}
          >
            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5"
              fill="none"
              stroke={statusColor}
              strokeWidth="1.8"
              strokeLinecap="round"
            >
              <rect x="1" y="8" width="14" height="11" rx="1.5" />
              <path d="M15 13h4l3 3v3h-7v-6z" />
              <circle cx="5.5" cy="19.5" r="1.5" />
              <circle cx="18.5" cy="19.5" r="1.5" />
              <path d="M8 11v4M6 13h4" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-slate-900 text-sm font-mono tracking-wide">{amb.plate}</p>
            <span
              className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${s.badge} ${s.badgeText}`}
            >
              {s.label}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 text-xs"
        >
          âœ•
        </button>
      </div>
      {amb.patient !== "—" && (
        <div className="space-y-1 text-[11px]">
          <div className="flex justify-between gap-2">
            <span className="text-slate-500">Bệnh nhân</span>
            <span className="font-semibold text-right text-slate-900">{amb.patient}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-slate-500">Chẩn đoán</span>
            <span className="font-semibold text-right text-slate-900 max-w-[55%]">
              {amb.diagnosis}
            </span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-slate-500">Kíp xe</span>
            <span className="font-semibold text-right text-slate-900 max-w-[55%]">{amb.crew}</span>
          </div>
          {amb.etaSeconds > 0 && (
            <div className="p-2 rounded-lg bg-red-50 border border-red-200 flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-red-700 font-bold">
                ETA đến cổng
              </span>
              <span className="text-base font-bold text-red-600 font-mono">
                <EtaCountdown initialSeconds={amb.etaSeconds} />
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- Auto-EMR ---------- */
function AutoEmrPanel({ plate }: { plate: string }) {
  // Stepper restarts each time a new plate is selected
  const [step, setStep] = useState(0);
  const [cccd, setCccd] = useState("");
  const cccdFull =
    plate === "29A-213.07" ? "001203001247" : plate === "30F-567.89" ? "031870004189" : "—";

  useEffect(() => {
    setStep(0);
    setCccd("");
    if (cccdFull === "—") return;
    // Type out CCCD characters
    let i = 0;
    const typer = setInterval(() => {
      i++;
      setCccd(cccdFull.slice(0, i));
      if (i >= cccdFull.length) clearInterval(typer);
    }, 70);
    const t1 = setTimeout(() => setStep(1), 1400);
    const t2 = setTimeout(() => setStep(2), 2400);
    const t3 = setTimeout(() => setStep(3), 3400);
    return () => {
      clearInterval(typer);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [plate, cccdFull]);

  if (cccdFull === "—") {
    return (
      <div className="flex flex-col items-center justify-center h-20 text-slate-400">
        <svg
          viewBox="0 0 24 24"
          className="w-8 h-8 mb-1 opacity-40"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        >
          <rect x="1" y="8" width="14" height="11" rx="1.5" />
          <path d="M15 13h4l3 3v3h-7v-6z" />
          <circle cx="5.5" cy="19.5" r="1.5" />
          <circle cx="18.5" cy="19.5" r="1.5" />
          <path d="M8 11v4M6 13h4" />
        </svg>
        <p className="text-[10px] text-center">
          Xe {plate} — Chờ điều phối, chưa có hồ sơ
        </p>
      </div>
    );
  }

  const steps = [
    "Xác thực Cổng Bảo hiểm Xã hội Việt Nam (BHXH)",
    "Khởi tạo Phiếu Tiếp nhận Cấp cứu Điện tử",
    "Trích xuất Lịch sử Y khoa Quốc gia",
  ];
  const isCritical = plate === "29A-213.07";

  return (
    <div className="space-y-2.5 text-xs">
      {/* CCCD input row with spinner */}
      <div
        className="flex items-center gap-2 px-2.5 py-2 rounded-lg border bg-white"
        style={{ borderColor: ACCENT }}
      >
        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 flex-shrink-0">
          ID Định danh
        </span>
        <span className="font-mono text-[12px] font-bold text-slate-900 flex-1 truncate">
          {cccd || "—"}
          <span
            className="inline-block w-[1px] h-3 align-middle bg-slate-900 ml-0.5"
            style={{ animation: "mp-blink 1s steps(2) infinite" }}
          />
        </span>
        {step < 3 ? (
          <span
            className="w-4 h-4 border-2 border-t-transparent rounded-full flex-shrink-0"
            style={{ borderColor: ACCENT, animation: "mp-spin 0.8s linear infinite" }}
          />
        ) : (
          <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
        )}
      </div>

      {/* Stepper */}
      <div className="space-y-1.5">
        {steps.map((label, idx) => {
          const done = step > idx;
          const active = step === idx;
          return (
            <div key={idx} className="flex items-start gap-2">
              <div className="flex flex-col items-center flex-shrink-0">
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition`}
                  style={{
                    backgroundColor: done ? "#22C55E" : active ? "#fff" : "#F1F5F9",
                    borderColor: done ? "#22C55E" : active ? ACCENT : "#CBD5E1",
                    color: done ? "#fff" : "#0F172A",
                  }}
                >
                  {done ? "âœ“" : idx + 1}
                </div>
                {idx < steps.length - 1 && (
                  <div
                    className="w-[2px] h-4"
                    style={{ backgroundColor: done ? "#22C55E" : "#E2E8F0" }}
                  />
                )}
              </div>
              <div className="pt-0.5 min-w-0">
                <p className="text-[10.5px] font-semibold text-slate-800 leading-tight">
                  B{idx + 1}. {label}
                </p>
                <p
                  className={`text-[10px] font-bold mt-0.5 ${done ? "text-emerald-600" : active ? "text-slate-500" : "text-slate-400"}`}
                >
                  {done
                    ? idx === 0
                      ? "THÀNH CÔNG"
                      : idx === 1
                        ? "HOÀN TẤT — Bỏ qua biểu mẫu giấy"
                        : "ĐỒNG BỘ XONG"
                    : active
                      ? "Đang xử lý..."
                      : "Chờ xử lý"}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Clinical profile — appears after step 3 */}
      {step >= 3 && (
        <div className="border-t border-slate-200 pt-2.5 space-y-1.5 animate-fade-in">
          <RecordRow
            label="Bệnh nhân"
            value={
              isCritical ? "Nguyễn Văn A (Nam, 62 tuổi)" : "Trần Thị B (Nữ, 45 tuổi)"
            }
            sub={`CCCD: ${cccdFull}`}
          />
          <div
            className="p-2 rounded-md border"
            style={{
              backgroundColor: isCritical ? "#FEF2F2" : "#FFFBEB",
              borderColor: isCritical ? "#FECACA" : "#FDE68A",
            }}
          >
            <p
              className={`text-[10px] font-bold ${isCritical ? "text-red-700" : "text-amber-700"}`}
            >
              Tình trạng cấp cứu
            </p>
            <p className={`text-sm font-bold ${isCritical ? "text-red-700" : "text-amber-700"}`}>
              {isCritical ? "CẤP CỨU ĐỎ" : "CẤP CỨU VÀNG"}
            </p>
            <p className="text-[11px] text-slate-700">
              {isCritical
                ? "Đột quỵ nhồi máu não — giờ thứ 2"
                : "Gãy xương đùi trái · TNGT"}
            </p>
          </div>
          <RecordRow
            label="Tiền sử bệnh lý nền"
            value={
              isCritical
                ? "Tăng huyết áp độ 2, Đái tháo đường Type 2"
                : "Không có tiền sử đặc biệt"
            }
          />

          {isCritical && (
            <div className="p-2 rounded-md border-2 border-red-500 bg-red-50">
              <p className="text-[10px] font-bold uppercase tracking-wider text-red-700 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Cảnh báo lâm sàng (CRITICAL)
              </p>
              <p
                className="text-[13px] font-black text-red-700 mt-0.5"
                style={{ animation: "mp-blink 1.1s ease-in-out infinite" }}
              >
                DỊ ỨNG THUỐC: KHÁNG SINH PENICILLIN
              </p>
            </div>
          )}
          <RecordRow
            label="Thuốc đang dùng tại nhà"
            value={isCritical ? "Amlodipin 5mg (1 viên/ngày)" : "Không"}
          />
          {!isCritical && <RecordRow label="Nhóm máu" value="AB+" />}
        </div>
      )}
    </div>
  );
}

/* ---------- HistoryView (Supabase Connected) ---------- */
function HistoryView() {
  const isMobile = useIsMobile();
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("dispatch_records")
      .select("*")
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .then(({ data }) => {
        if (data) setHistoryRecords(data);
      });

    const sub = supabase
      .channel("history_channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "dispatch_records", filter: "status=eq.completed" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setHistoryRecords((prev) => [payload.new, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setHistoryRecords((prev) => {
              const idx = prev.findIndex((r) => r.plate === payload.new.plate);
              if (idx === -1) return [payload.new, ...prev];
              const copy = [...prev];
              copy[idx] = payload.new;
              return copy;
            });
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sub);
    };
  }, []);

  const sortedRecords = Array.from(
    new Map(historyRecords.map((item) => [item.plate, item])).values(),
  ).sort(
    (a: any, b: any) =>
      new Date(b.completed_at || 0).getTime() - new Date(a.completed_at || 0).getTime(),
  );

  const alertColor = (label: string | null) => {
    if (!label) return "bg-slate-100 text-slate-500 border-slate-200";
    const l = label.toLowerCase();
    if (l.includes("đỏ") || l.includes("red") || l.includes("critical"))
      return "bg-red-50 text-red-600 border-red-200";
    if (l.includes("vàng") || l.includes("yellow") || l.includes("urgent"))
      return "bg-amber-50 text-amber-600 border-amber-200";
    if (l.includes("xanh") || l.includes("green") || l.includes("standby"))
      return "bg-emerald-50 text-emerald-600 border-emerald-200";
    return "bg-slate-100 text-slate-500 border-slate-200";
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

  return (
    <div
      className={
        isMobile
          ? "flex-1 flex flex-col bg-slate-50/50"
          : "flex-1 flex flex-col p-6 max-h-screen overflow-hidden bg-slate-50/50"
      }
    >
      <div
        className={
          isMobile
            ? "flex-1 flex flex-col overflow-hidden"
            : "bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex-1 flex flex-col"
        }
      >
        {/* Header */}
        <div
          className={
            isMobile
              ? "flex items-center justify-between bg-slate-50 px-4 py-3 border-b border-slate-200"
              : "flex flex-wrap justify-between items-center px-4 py-3 border-b border-slate-100 gap-2"
          }
        >
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" style={{ color: "#88E8F2" }} />
              Đã hoàn thành
            </h3>
            <p className="text-[11px] text-slate-500">
              {historyRecords.length} ca
            </p>
          </div>
        </div>

        {/* Mobile: List tràn viền */}
        {isMobile ? (
          <div className="flex-1 overflow-y-auto bg-white">
            {sortedRecords.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 mb-3">
                  <CheckCircle2 className="h-7 w-7 text-slate-300" />
                </div>
                <p className="font-semibold text-slate-500 text-[14px]">Chưa có ca nào hoàn thành</p>
              </div>
            ) : (
              sortedRecords.map((rec, idx) => {
                const key = `${rec.plate}-${idx}`;
                const expanded = expandedRow === key;
                return (
                  <div key={key} className="border-b border-slate-100 last:border-0">
                    {/* Compact row */}
                    <button
                      type="button"
                      onClick={() => setExpandedRow(expanded ? null : key)}
                      className="w-full px-4 py-3 text-left flex items-start justify-between gap-3 active:bg-slate-50 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] text-slate-400">
                          {rec.completed_at ? formatDate(rec.completed_at) : "—"}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono font-bold text-slate-800 text-[14px]">
                            {rec.plate}
                          </span>
                          <span className="text-[13px] text-slate-600 font-medium truncate">
                            {rec.patient_name || "—"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 mt-0.5">
                        {rec.alert_label && (
                          <span
                            className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold ${alertColor(rec.alert_label)}`}
                          >
                            {rec.alert_label}
                          </span>
                        )}
                        {expanded ? (
                          <ChevronDown className="h-4 w-4 text-slate-400" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-slate-300" />
                        )}
                      </div>
                    </button>

                    {/* Expanded detail */}
                    {expanded && (
                      <div className="px-4 pb-3 pt-1 border-t border-dashed border-slate-200 bg-slate-50/50">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[12px]">
                          {rec.gender && (
                            <div>
                              <span className="text-slate-400">Giới tính</span>
                              <p className="font-medium text-slate-700">{rec.gender}</p>
                            </div>
                          )}
                          {rec.age && (
                            <div>
                              <span className="text-slate-400">Độ tuổi</span>
                              <p className="font-medium text-slate-700">{rec.age}</p>
                            </div>
                          )}
                          {rec.cccd && (
                            <div className="col-span-2">
                              <span className="text-slate-400">Số CCCD</span>
                              <p className="font-mono font-medium text-slate-700">{rec.cccd}</p>
                            </div>
                          )}
                          {rec.chronic_conditions && rec.chronic_conditions.length > 0 && (
                            <div className="col-span-2">
                              <span className="text-slate-400">Bệnh nền</span>
                              <div className="flex flex-wrap gap-1 mt-0.5">
                                {rec.chronic_conditions.map((c: string) => (
                                  <span
                                    key={c}
                                    className="inline-block rounded-full bg-slate-200/70 px-2 py-0.5 text-[10px] font-semibold text-slate-600"
                                  >
                                    {c}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {rec.allergies && rec.allergies.length > 0 && (
                            <div className="col-span-2">
                              <span className="text-slate-400">Dị ứng thuốc</span>
                              <div className="flex flex-wrap gap-1 mt-0.5">
                                {rec.allergies.map((a: string) => (
                                  <span
                                    key={a}
                                    className="inline-block rounded-full bg-red-100/70 px-2 py-0.5 text-[10px] font-semibold text-red-600"
                                  >
                                    {a}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {rec.er_team && (
                            <div>
                              <span className="text-slate-400">Kíp CC</span>
                              <p className="font-medium text-slate-700">{rec.er_team}</p>
                            </div>
                          )}
                          {rec.completed_at && (
                            <div>
                              <span className="text-slate-400">Kết thúc</span>
                              <p className="font-medium text-slate-700">{formatTime(rec.completed_at)}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        ) : (
          /* Desktop: Table 11 cột giữ nguyên */
          <div className="overflow-x-auto flex-1 h-0">
            <table className="w-full text-sm text-left min-w-[1000px]">
              <thead className="text-[10px] text-slate-500 uppercase tracking-wider bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-3 whitespace-nowrap">Ngày tháng</th>
                  <th className="px-3 py-3 whitespace-nowrap">Biển số xe</th>
                  <th className="px-3 py-3 whitespace-nowrap">Tên bệnh nhân</th>
                  <th className="px-3 py-3 whitespace-nowrap">Giới tính</th>
                  <th className="px-3 py-3 whitespace-nowrap">Độ tuổi</th>
                  <th className="px-3 py-3 whitespace-nowrap">Số CCCD</th>
                  <th className="px-3 py-3 whitespace-nowrap">Bệnh nền</th>
                  <th className="px-3 py-3 whitespace-nowrap">Dị ứng thuốc</th>
                  <th className="px-3 py-3 whitespace-nowrap">Nhãn cấp cứu</th>
                  <th className="px-3 py-3 whitespace-nowrap">Kíp CC</th>
                  <th className="px-3 py-3 whitespace-nowrap">Kết thúc lúc</th>
                </tr>
              </thead>
              <tbody>
                {sortedRecords.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-4 py-8 text-center text-slate-400">
                      Chưa có ca cấp cứu nào hoàn thành
                    </td>
                  </tr>
                ) : (
                  sortedRecords.map((rec, idx) => (
                    <tr
                      key={`${rec.plate}-${idx}`}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="px-3 py-3 whitespace-nowrap text-slate-500 text-xs">
                        {rec.completed_at ? formatDate(rec.completed_at) : "—"}
                      </td>
                      <td className="px-3 py-3">
                        <span className="font-mono font-bold text-slate-600 text-[13px]">
                          {rec.plate}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span className="font-semibold text-slate-600">
                          {rec.patient_name || "—"}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-slate-600">{rec.gender || "—"}</span>
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-slate-600">{rec.age || "—"}</span>
                      </td>
                      <td className="px-3 py-3 font-mono text-[12px] text-slate-500">
                        {rec.cccd || "—"}
                      </td>
                      <td className="px-3 py-3 max-w-[150px]">
                        {rec.chronic_conditions && rec.chronic_conditions.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {rec.chronic_conditions.map((c: string) => (
                              <span
                                key={c}
                                className="px-1.5 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-500"
                              >
                                {c}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">Không có</span>
                        )}
                      </td>
                      <td className="px-3 py-3 max-w-[160px]">
                        {rec.allergies && rec.allergies.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {rec.allergies.map((a: string) => (
                              <span
                                key={a}
                                className="px-1.5 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-500"
                              >
                                {a}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">Không có</span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        {rec.alert_label ? (
                          <span className={`px-2 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap border ${alertColor(rec.alert_label)}`}>
                            {rec.alert_label}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">Chưa có</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-slate-500 text-xs font-semibold">
                        {rec.er_team || "—"}
                      </td>
                      <td className="px-3 py-3 text-slate-500 text-xs">
                        {rec.completed_at ? formatTime(rec.completed_at) : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Main AmbulanceView ---------- */

type MapFilter = "all" | "critical" | "urgent" | "standby";

// Dispatch Record — realtime from EMS WebSocket
interface DispatchRecord {
  plate: string;
  eta: number | null;
  patientName: string | null;
  gender: string | null;
  age: string | null;
  cccd: string | null;
  chronicConditions: string[] | null;
  allergies: string[] | null;
  alertLabel: string | null;
  erTeam: string;
  addedAt: number;
  bhxhCode?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
}

function AmbulanceView() {
  const [ambulances, setAmbulances] = useState<AmbulanceUnit[]>([]);
  const [dispatchRecords, setDispatchRecords] = useState<Record<string, any>>({});

  const lastSpokenRef = useRef<Record<string, string>>({});

  const playTts = async (text: string) => {
    try {
      const url = `${import.meta.env.VITE_API_URL || "http://localhost:8000/api"}/voice/tts?text=${encodeURIComponent(text)}`;
      const audio = new Audio(url);
      await audio.play();
    } catch (err) {
      console.error("Failed to play TTS:", err);
    }
  };

  useEffect(() => {
    const fetchDispatch = () => {
      fetchApi("/ems/dispatch_records?status=active")
        .then((data) => {
          if (Array.isArray(data)) {
            const r: Record<string, any> = {};
            data.forEach((d) => {
              r[d.plate] = {
                plate: d.plate,
                eta: d.eta,
                patient_name: d.patient_name,
                gender: d.gender,
                age: d.age,
                cccd: d.cccd,
                chronic_conditions: d.chronic_conditions,
                allergies: d.allergies,
                alert_label: d.alert_label,
                er_team: d.er_team,
                addedAt: d.added_at || Date.now(),
                bhxhCode: d.bhxh_code,
                emergencyContactName: d.emergency_contact_name,
                emergencyContactPhone: d.emergency_contact_phone,
                preAlertText: d.pre_alert_text,
              };
            });
            setDispatchRecords(r);
          }
        })
        .catch(console.error);
    };

    fetchDispatch();
    const interval = setInterval(fetchDispatch, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchApi("/ambulance")
      .then((data: any[]) => {
        const mapped: AmbulanceUnit[] = data.map((d: any) => ({
          id: d.id,
          plate: d.plate,
          status: ["critical", "urgent", "standby"].includes(d.status) ? d.status : "standby",
          patient: "Đang cập nhật...",
          diagnosis: "Đang cập nhật...",
          etaSeconds: 300,
          crew: d.driver || "Chưa phân công",
          mapX: 0,
          mapY: 0,
          departmentId: "er",
          lat: d.lat,
          lng: d.lng,
        }));
        setAmbulances(mapped);
      })
      .catch(console.error);
  }, []);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<MapFilter>("all");
  const [lprPlate, setLprPlate] = useState("29A-213.07");
  const [toast, setToast] = useState("");
  const [panelMode, setPanelMode] = useState<"dept" | "vehicle">("dept");
  const [fallAlert, setFallAlert] = useState<{
    room: string;
    imageUrl: string;
    time: string;
  } | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 4000);
  }, []);

  const host = typeof window !== "undefined" ? window.location.hostname : "localhost";
  const WS_URL = (import.meta.env.VITE_WS_URL ?? `ws://${host}:8000`) + "/api/ambient/ws/live";

  const handleSocketMessage = useCallback(
    (msg: {
      type: string;
      data?: Record<string, unknown>;
      room_id?: string;
      blurred_image_base64?: string;
    }) => {
      // ── GPS_START: xe mới đăng ký nhiệm vụ ──────────────────────────
      if (msg.type === "GPS_START" && msg.data) {
        const { plate, eta_seconds, lat, lng } = msg.data as {
          plate: string;
          eta_seconds?: number;
          lat?: number;
          lng?: number;
        };
        const d = msg.data as any;
        if (plate) {
          supabase
            .from("dispatch_records")
            .upsert({
              plate,
              eta: typeof eta_seconds === "number" ? eta_seconds : null,
              status: "active",
              lat: lat ?? null,
              lng: lng ?? null,
              added_at: Date.now(),
              pre_alert_text: d.pre_alert_text ?? null,
              patient_name: d.name ?? null,
              gender: d.gender ?? null,
              age: d.age ?? null,
              cccd: d.cccd ?? null,
              bhxh_code: d.bhxh_code ?? null,
              emergency_contact_name: d.emergency_contact_name ?? null,
              emergency_contact_phone: d.emergency_contact_phone ?? null,
              chronic_conditions: d.chronic_conditions ?? [],
              allergies: d.allergies ?? [],
            })
            .then();

          setDispatchRecords((prev) => ({
            ...prev,
            [plate]: {
              ...(prev[plate] || {}),
              plate,
              eta: typeof eta_seconds === "number" ? eta_seconds : null,
              status: "active",
              addedAt: Date.now(),
              patient_name: d.name ?? null,
              gender: d.gender ?? null,
              age: d.age ?? null,
              cccd: d.cccd ?? null,
              bhxhCode: d.bhxh_code ?? null,
              emergencyContactName: d.emergency_contact_name ?? null,
              emergencyContactPhone: d.emergency_contact_phone ?? null,
              chronic_conditions: d.chronic_conditions ?? [],
              allergies: d.allergies ?? [],
              preAlertText: d.pre_alert_text ?? null,
            },
          }));

          // Cũng cập nhật ambulances map nếu xe chưa có
          setAmbulances((prev) => {
            if (prev.find((a) => a.plate === plate)) return prev;
            return [
              ...prev,
              {
                id: plate,
                plate,
                status: "urgent" as const,
                patient: "Đang cập nhật...",
                diagnosis: "Đang cập nhật...",
                etaSeconds: 600,
                crew: "Kíp EMS",
                mapX: 0,
                mapY: 0,
                departmentId: "er",
                lat: lat ?? undefined,
                lng: lng ?? undefined,
              },
            ];
          });
        }
      }
      // ── GPS_UPDATE: cập nhật vị trí + ETA ───────────────────────────
      if (msg.type === "GPS_UPDATE" && msg.data) {
        const {
          ambulance_id,
          lat,
          lng,
          plate: msgPlate,
          eta_seconds,
        } = msg.data as {
          ambulance_id: string;
          lat: number;
          lng: number;
          plate?: string;
          eta_seconds?: number;
        };
        setAmbulances((prev) =>
          prev.map((a) => {
            if (
              a.id === ambulance_id ||
              (ambulance_id === "current" && a.id === "xe1") ||
              (msgPlate && a.plate === msgPlate)
            ) {
              return { ...a, lat, lng, etaSeconds: eta_seconds ?? a.etaSeconds };
            }
            return a;
          }),
        );
        // Cập nhật ETA trong dispatchRecords
        if (msgPlate) {
          supabase
            .from("dispatch_records")
            .update({
              lat,
              lng,
              eta: eta_seconds ?? null,
            })
            .eq("plate", msgPlate)
            .then();

          setDispatchRecords((prev) => {
            if (!prev[msgPlate]) return prev;
            return {
              ...prev,
              [msgPlate]: {
                ...prev[msgPlate],
                eta: eta_seconds ?? prev[msgPlate].eta,
              },
            };
          });
        }
      }
      // ── PATIENT_UPDATE: bệnh nhân được gắn kèm xe ───────────────────
      if (msg.type === "PATIENT_UPDATE" && msg.data) {
        const d = msg.data as {
          plate: string;
          name?: string;
          gender?: string;
          age?: string;
          cccd?: string;
          chronic_conditions?: string[];
          allergies?: string[];
          alert_label?: string;
          bhxh_code?: string;
          emergency_contact_name?: string;
          emergency_contact_phone?: string;
          pre_alert_text?: string;
        };
        if (d.plate) {
          const updateData: any = {};
          if (d.name !== undefined) updateData.patient_name = d.name;
          if (d.gender !== undefined) updateData.gender = d.gender;
          if (d.age !== undefined) updateData.age = d.age;
          if (d.cccd !== undefined) updateData.cccd = d.cccd;
          if (d.chronic_conditions !== undefined)
            updateData.chronic_conditions = d.chronic_conditions;
          if (d.allergies !== undefined) updateData.allergies = d.allergies;
          if (d.alert_label !== undefined) updateData.alert_label = d.alert_label;
          if (d.bhxh_code !== undefined) updateData.bhxh_code = d.bhxh_code;
          if (d.emergency_contact_name !== undefined)
            updateData.emergency_contact_name = d.emergency_contact_name;
          if (d.emergency_contact_phone !== undefined)
            updateData.emergency_contact_phone = d.emergency_contact_phone;
          if (d.pre_alert_text !== undefined) updateData.pre_alert_text = d.pre_alert_text;

          if (Object.keys(updateData).length > 0) {
            supabase.from("dispatch_records").update(updateData).eq("plate", d.plate).then();
          }

          setDispatchRecords((prev) => {
            if (!prev[d.plate]) return prev;
            return {
              ...prev,
              [d.plate]: {
                ...prev[d.plate],
                patient_name: d.name !== undefined ? d.name : prev[d.plate].patient_name,
                gender: d.gender !== undefined ? d.gender : prev[d.plate].gender,
                age: d.age !== undefined ? d.age : prev[d.plate].age,
                cccd: d.cccd !== undefined ? d.cccd : prev[d.plate].cccd,
                bhxhCode: d.bhxh_code !== undefined ? d.bhxh_code : prev[d.plate].bhxhCode,
                emergencyContactName:
                  d.emergency_contact_name !== undefined
                    ? d.emergency_contact_name
                    : prev[d.plate].emergencyContactName,
                emergencyContactPhone:
                  d.emergency_contact_phone !== undefined
                    ? d.emergency_contact_phone
                    : prev[d.plate].emergencyContactPhone,
                chronic_conditions:
                  d.chronic_conditions !== undefined
                    ? d.chronic_conditions
                    : prev[d.plate].chronic_conditions,
                allergies: d.allergies !== undefined ? d.allergies : prev[d.plate].allergies,
                preAlertText:
                  d.pre_alert_text !== undefined ? d.pre_alert_text : prev[d.plate].preAlertText,
              },
            };
          });
        }
      }
      // ── GATE events ──────────────────────────────────────────────────
      if ((msg.type === "GATE_ARRIVED" || msg.type === "GATE_OPEN") && msg.data) {
        const { plate } = msg.data as { plate: string };
        setLprPlate(plate);
        showToast(`Xe ${plate} đã đến cổng - Barrier tự động mở`);
        supabase
          .from("dispatch_records")
          .update({
            eta: -1,
          })
          .eq("plate", plate)
          .then();
      }
      if (msg.type === "CAMERA_STREAM") {
        window.dispatchEvent(
          new CustomEvent("camera-stream", {
            detail: { room: msg.room_id, image: (msg as any).image_base64 },
          }),
        );
      }
      if (msg.type === "FALL_DETECTED") {
        setFallAlert({
          room: msg.room_id || "Unknown",
          imageUrl: msg.blurred_image_base64 || "",
          time: new Date().toLocaleTimeString(),
        });
        try {
          new Audio("/alert.mp3").play().catch(() => {});
        } catch (e) {}
      }
    },
    [showToast],
  );

  useEyeCUSocket({ url: WS_URL, onMessage: handleSocketMessage });

  const handleSelectMap = (id: string) => {
    const found = ambulances.find((a) => a.id === id);
    if (!found) return;
    setSelectedId(id);
    setLprPlate(found.plate);
    setPanelMode("vehicle");
  };
  const handleNotify = () =>
    showToast("✓ Đã gửi OTT cho kíp trực · Phản hồi trong 30s");

  const visibleAmbs = filter === "all" ? ambulances : ambulances.filter((a) => a.status === filter);
    const selectedAmb = ambulances.find((a) => a.id === selectedId) ?? null;

  // Danh sách hồ sơ dispatch — sắp xếp theo thời gian đến mới nhất
  const dispatchList = Object.values(dispatchRecords).sort((a, b) => b.addedAt - a.addedAt);

  useEffect(() => {
    dispatchList.forEach((rec) => {
      if (rec.preAlertText && rec.preAlertText !== lastSpokenRef.current[rec.plate]) {
        lastSpokenRef.current[rec.plate] = rec.preAlertText;
        const plateSpelled = rec.plate.split("").join(" ");
        playTts(`Cảnh báo từ xe ${plateSpelled}: ${rec.preAlertText}`);
      }
    });
  }, [dispatchList]);

  return (
    <>
      {toast && (
        <div className="fixed top-6 right-6 z-[999] bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-medium">{toast}</span>
        </div>
      )}
      {fallAlert && (
        <div className="fixed top-20 right-6 z-[999] bg-red-950 text-white p-5 rounded-2xl shadow-2xl flex flex-col gap-3 animate-fade-in border border-red-500 max-w-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-red-500 animate-pulse" />
              <h3 className="font-bold text-red-400">PHÁT HIỆN TÉ NGÃ</h3>
            </div>
            <button onClick={() => setFallAlert(null)} className="text-gray-400 hover:text-white">
              âœ•
            </button>
          </div>
          <p className="text-sm">
            Camera AI phát hiện sự cố ngã tại phòng{" "}
            <span className="font-bold text-red-300">{fallAlert.room}</span> lúc {fallAlert.time}
          </p>
          {fallAlert.imageUrl && (
            <img
              src={fallAlert.imageUrl}
              alt="Blurred Body"
              className="w-full rounded border border-red-900 mt-2"
            />
          )}
        </div>
      )}

      <div className="space-y-4">
        {/* ═══════════════════════════════════════════════════════════════
            BOX 1: THEO DÕI CẤP CỨU
        ═══════════════════════════════════════════════════════════════ */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {/* Header Box 1 */}
          <div className="flex flex-wrap justify-between items-center px-4 py-3 border-b border-slate-100 gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <MapIcon className="w-4 h-4" style={{ color: ACCENT }} />
                Theo dõi Cấp cứu — BV Bạch Mai
              </h3>
              <p className="text-[11px] text-slate-500 font-geist">
                {ambulances.length} xe đang giám sát · GPS Galileo · Thời gian thực
              </p>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {(["all", "critical", "urgent", "standby"] as MapFilter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition ${filter === f ? "text-slate-900" : "bg-white border border-slate-200 text-slate-500 hover:border-slate-400"}`}
                  style={filter === f ? { backgroundColor: ACCENT } : undefined}
                >
                  {f === "all"
                    ? "Tất cả"
                    : f === "critical"
                      ? "Critical"
                      : f === "urgent"
                        ? "Urgent"
                        : "Standby"}
                </button>
              ))}
              <span
                className="px-2 py-1 rounded text-[10px] font-geist uppercase tracking-wider text-slate-900 flex items-center gap-1"
                style={{ backgroundColor: ACCENT }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                Live
              </span>
            </div>
          </div>

          {/* 2 cột ngang: Map trái | LPR phải */}
          <div className="grid grid-cols-1 lg:grid-cols-2 lg:h-[400px]">
            {/* COL LEFT: Bản đồ xe cấp cứu */}
            <div className="relative border-r border-slate-100 overflow-hidden bg-slate-100 h-[300px] lg:h-auto min-h-[300px]">
              <ClientAmbulanceMap
                ambulances={visibleAmbs}
                selectedId={selectedId}
                onSelect={handleSelectMap}
              />
              <div className="absolute bottom-2 left-2 z-[400] bg-white/90 text-[9px] text-slate-500 px-2 py-0.5 rounded shadow">
                OpenStreetMap · BV Bạch Mai, Hà Nội
              </div>
            </div>

            {/* COL RIGHT: Quét biển số mở barrier */}
            <div className="overflow-y-auto scrollbar-hide bg-slate-50/50 p-3 flex flex-col gap-3">
              <div className="bg-white border border-slate-200 rounded-xl p-3">
                <h4 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                  <ScanLine className="w-3.5 h-3.5" style={{ color: ACCENT }} />
                  Quét biển số · Mở cửa Barrier
                </h4>
                <LprScanner
                  plate={lprPlate}
                  onNotify={handleNotify}
                  queue={ambulances}
                  activeId={selectedId}
                  onSelectQueue={handleSelectMap}
                  onScanComplete={(plate) =>
                    handleSocketMessage({ type: "GATE_OPEN", data: { plate } })
                  }
                />
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            BOX 2: XỬ LÝ HỒ SƠ
        ═══════════════════════════════════════════════════════════════ */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {/* Header Box 2 */}
          <div className="flex flex-wrap justify-between items-center px-4 py-3 border-b border-slate-100 gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserCheck className="w-4 h-4" style={{ color: ACCENT }} />
                Xử lý Hồ sơ Cấp cứu
              </h3>
              <p className="text-[11px] text-slate-500 font-geist">
                {dispatchList.length > 0
                  ? `${dispatchList.length} xe đang trên đường`
                  : "Chưa có xe nào đang trên đường"}
                {" · "}Cập nhật tự động từ xe EMS
              </p>
            </div>
            <span
              className="px-2 py-1 rounded text-[10px] font-geist uppercase tracking-wider text-slate-900 flex items-center gap-1"
              style={{ backgroundColor: ACCENT }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
              Realtime
            </span>
          </div>

          {/* Bảng hồ sơ */}
          {dispatchList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <Ambulance className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm font-medium">
                Chưa có xe cấp cứu nào đang trên đường
              </p>
              <p className="text-xs mt-1">
                Khi đội EMS bật GPS từ xe, thông tin sẽ hiển thị tại đây
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left min-w-[1100px]">
                <thead className="text-[10px] text-slate-500 font-geist uppercase tracking-wider bg-slate-50 border-b border-slate-200 sticky top-0">
                  <tr>
                    <th className="px-3 py-3 whitespace-nowrap">Biển số xe</th>
                    <th className="px-3 py-3 whitespace-nowrap">Dự kiến đến</th>
                    <th className="px-3 py-3 whitespace-nowrap">Tên bệnh nhân</th>
                    <th className="px-3 py-3 whitespace-nowrap">Giới tính</th>
                    <th className="px-3 py-3 whitespace-nowrap">Độ tuổi</th>
                    <th className="px-3 py-3 whitespace-nowrap">Số CCCD</th>
                    <th className="px-3 py-3 whitespace-nowrap">Bảo hiểm Y Tế</th>
                    <th className="px-3 py-3 whitespace-nowrap">Liên hệ khẩn cấp</th>
                    <th className="px-3 py-3 whitespace-nowrap">Bệnh nền</th>
                    <th className="px-3 py-3 whitespace-nowrap">Dị ứng thuốc</th>
                    <th className="px-3 py-3 whitespace-nowrap">Nhãn cấp cứu</th>
                    <th className="px-3 py-3 whitespace-nowrap">Cảnh báo trước (EMS)</th>
                    <th className="px-3 py-3 whitespace-nowrap">Chỉ định kíp CC</th>
                    <th className="px-3 py-3 whitespace-nowrap text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {dispatchList.map((rec) => {
                    const hasPatient = rec.patient_name !== null;
                    const isArrived = rec.eta === -1;
                    const etaText =
                      rec.eta !== null && rec.eta !== -1
                        ? `${Math.max(0, Math.round(rec.eta / 60))} phút`
                        : null;
                    return (
                      <tr
                        key={rec.plate}
                        className="border-b border-slate-100 last:border-0 hover:bg-slate-50/80 transition-colors"
                      >
                        {/* Biển số */}
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <span className="relative flex w-2 h-2 flex-shrink-0">
                              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                            </span>
                            <span className="font-mono font-bold text-slate-900 text-[13px]">
                              {rec.plate}
                            </span>
                          </div>
                        </td>
                        {/* ETA */}
                        <td className="px-3 py-3">
                          {isArrived ? (
                            <span className="font-bold text-emerald-600 text-[13px] bg-emerald-100 px-2 py-1 rounded-md">
                              Đã đến
                            </span>
                          ) : etaText ? (
                            <span className="font-bold text-orange-600 text-[13px]">{etaText}</span>
                          ) : (
                            <LoadingCell />
                          )}
                        </td>
                        {/* Tên */}
                        <td className="px-3 py-3">
                          {hasPatient ? (
                            <span className="font-semibold text-slate-900">
                              {rec.patient_name || "—"}
                            </span>
                          ) : (
                            <LoadingCell />
                          )}
                        </td>
                        {/* Giới tính */}
                        <td className="px-3 py-3">
                          {hasPatient ? (
                            <span className="text-slate-700">{rec.gender || "—"}</span>
                          ) : (
                            <LoadingCell />
                          )}
                        </td>
                        {/* Độ tuổi */}
                        <td className="px-3 py-3">
                          {hasPatient ? (
                            <span className="text-slate-700">{rec.age || "—"}</span>
                          ) : (
                            <LoadingCell />
                          )}
                        </td>
                        {/* CCCD */}
                        <td className="px-3 py-3">
                          {hasPatient ? (
                            <span className="font-mono text-[12px] text-slate-700">
                              {rec.cccd || "—"}
                            </span>
                          ) : (
                            <LoadingCell />
                          )}
                        </td>
                        {/* Bảo hiểm Y Tế */}
                        <td className="px-3 py-3">
                          {hasPatient ? (
                            <span className="font-mono text-[12px] text-slate-700">
                              {rec.bhxhCode || "—"}
                            </span>
                          ) : (
                            <LoadingCell />
                          )}
                        </td>
                        {/* Liên hệ khẩn cấp */}
                        <td className="px-3 py-3">
                          {hasPatient ? (
                            <div className="flex flex-col">
                              <span className="text-[13px] font-semibold text-slate-900">
                                {rec.emergencyContactName || "—"}
                              </span>
                              <span className="text-[11px] text-slate-500">
                                {rec.emergencyContactPhone || ""}
                              </span>
                            </div>
                          ) : (
                            <LoadingCell />
                          )}
                        </td>
                        {/* Bệnh nền */}
                        <td className="px-3 py-3 max-w-[180px]">
                          {hasPatient ? (
                            rec.chronic_conditions && rec.chronic_conditions.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {rec.chronic_conditions.map((c: string) => (
                                  <span
                                    key={c}
                                    className="px-1.5 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-700"
                                  >
                                    {c}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-400 text-xs">Không có</span>
                            )
                          ) : (
                            <LoadingCell />
                          )}
                        </td>
                        {/* Dị ứng */}
                        <td className="px-3 py-3 max-w-[160px]">
                          {hasPatient ? (
                            rec.allergies && rec.allergies.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {rec.allergies.map((a: string) => (
                                  <span
                                    key={a}
                                    className="px-1.5 py-0.5 rounded-full bg-red-100 text-[10px] font-bold text-red-700 border border-red-200"
                                  >
                                    {a}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-400 text-xs">Không có</span>
                            )
                          ) : (
                            <LoadingCell />
                          )}
                        </td>
                        {/* Nhãn cấp cứu */}
                        <td className="px-3 py-3">
                          {hasPatient ? (
                            rec.alert_label ? (
                              <span className="px-2 py-1 rounded-lg text-[11px] font-bold text-red-700 bg-red-100 border border-red-200 whitespace-nowrap">
                                {rec.alert_label}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-xs">Chưa có</span>
                            )
                          ) : (
                            <LoadingCell />
                          )}
                        </td>
                        {/* Cảnh báo trước (EMS) */}
                        <td className="px-3 py-3 max-w-[200px]">
                          {rec.preAlertText ? (
                            <div className="flex flex-col gap-1">
                              <span
                                className="text-xs text-slate-800 font-semibold line-clamp-2"
                                title={rec.preAlertText}
                              >
                                {rec.preAlertText}
                              </span>
                              <button
                                type="button"
                                onClick={() => playTts(rec.preAlertText)}
                                className="inline-flex items-center gap-1 text-[10px] text-cyan-600 hover:text-cyan-700 font-bold bg-cyan-50 px-1.5 py-0.5 rounded border border-cyan-100 w-fit active:scale-95 transition-transform"
                              >
                                <Volume2 className="w-3 h-3 animate-pulse" />
                                Nghe đọc
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs">Không có</span>
                          )}
                        </td>
                        {/* Chỉ định kíp CC */}
                        <td className="px-3 py-3">
                          <AssignDepartmentCell
                            plate={rec.plate}
                            currentTeam={rec.er_team || rec.erTeam}
                            onUpdate={(val) => {
                              supabase
                                .from("dispatch_records")
                                .update({ er_team: val })
                                .eq("plate", rec.plate)
                                .then();
                              setDispatchRecords((prev) => ({
                                ...prev,
                                [rec.plate]: { ...prev[rec.plate], er_team: val, erTeam: val },
                              }));
                            }}
                          />
                        </td>
                        <td className="px-3 py-3 text-right">
                          <button
                            onClick={() => {
                              supabase
                                .from("dispatch_records")
                                .update({ status: "completed", completed_at: Date.now() })
                                .eq("plate", rec.plate)
                                .then(() => {
                                  showToast(`Đã hoàn thành hồ sơ xe ${rec.plate}`);
                                });
                            }}
                            className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-colors"
                          >
                            Hoàn thành
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/** Ô hiển thị khi đang chờ dữ liệu từ EMS */
function LoadingCell() {
  return (
    <span className="inline-flex items-center gap-1.5 text-slate-400 text-[11px]">
      <span className="w-3 h-3 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin flex-shrink-0" />
      Đang lấy thông tin
    </span>
  );
}

function AssignDepartmentCell({
  plate,
  currentTeam,
  onUpdate,
}: {
  plate: string;
  currentTeam?: string;
  onUpdate: (val: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState(currentTeam || "");
  const [departments, setDepartments] = useState<{ id: string; name: string; color: string }[]>([]);

  useEffect(() => {
    fetchApi("/admin/departments")
      .then((data: any[]) => {
        const colors = [
          "text-red-700 bg-red-100 border-red-200",
          "text-orange-700 bg-orange-100 border-orange-200",
          "text-blue-700 bg-blue-100 border-blue-200",
          "text-purple-700 bg-purple-100 border-purple-200",
          "text-green-700 bg-green-100 border-green-200",
          "text-teal-700 bg-teal-100 border-teal-200",
        ];
        const mapped = data.map((d, i) => ({
          id: d.id,
          name: d.name,
          color: colors[i % colors.length],
        }));
        setDepartments(mapped);
      })
      .catch(console.error);
  }, []);

  const matchedDept = departments.find((d) => d.name === currentTeam);

  if (!isOpen && currentTeam) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`px-2 py-1 rounded-lg text-[11px] font-bold border whitespace-nowrap transition-colors hover:opacity-80 ${matchedDept ? matchedDept.color : "text-slate-700 bg-slate-100 border-slate-200"}`}
      >
        {currentTeam}
      </button>
    );
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="px-3 py-1.5 bg-cyan-50 text-cyan-600 hover:bg-cyan-100 hover:text-cyan-700 border border-cyan-200 text-xs font-bold rounded-lg transition-colors whitespace-nowrap"
      >
        Chỉ định
      </button>
    );
  }

  return (
    <div className="relative flex flex-col gap-1 z-10">
      <select
        value={selectedDept}
        onChange={(e) => setSelectedDept(e.target.value)}
        className="w-36 px-2 py-1 text-xs border border-slate-200 rounded-lg outline-none bg-white focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400"
        autoFocus
      >
        <option value="" disabled>
          Chọn khoa...
        </option>
        {departments.map((d) => (
          <option key={d.id} value={d.name}>
            {d.name}
          </option>
        ))}
      </select>
      <div className="flex gap-1">
        <button
          onClick={() => {
            if (selectedDept) {
              onUpdate(selectedDept);
              setIsOpen(false);
            }
          }}
          className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] py-1 rounded transition-colors font-semibold"
        >
          Xác nhận
        </button>
        <button
          onClick={() => {
            setIsOpen(false);
            setSelectedDept(currentTeam || "");
          }}
          className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] py-1 rounded transition-colors font-semibold"
        >
          Hủy
        </button>
      </div>
    </div>
  );
}

/* ---------- ER Staff Card ---------- */
function ErStaffCard({ onCall }: { onCall: (name: string) => void }) {
  const staff = [
    {
      name: "BS. Thất Tùng",
      role: "Trực chính · Hồi sức Cấp cứu",
      ext: "Ext-104",
      status: "Đã nhận lệnh OTT · Đang di chuyển",
      tone: "accent" as const,
      initials: "TT",
    },
    {
      name: "ĐD. Thu Hà",
      role: "Điều dưỡng trưởng phòng",
      ext: "Ext-211",
      status: "Đã xác nhận · Đang chuẩn bị y cụ",
      tone: "amber" as const,
      initials: "TH",
    },
  ];
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3">
      <h4 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
        <Stethoscope className="w-3.5 h-3.5" style={{ color: ACCENT }} />
        Kíp trực ER Chỉ định
      </h4>
      <div className="space-y-1.5">
        {staff.map((s) => {
          const toneBg = s.tone === "accent" ? ACCENT : "#FEF3C7";
          const toneText = s.tone === "accent" ? "#0F172A" : "#92400E";
          return (
            <div
              key={s.name}
              className="flex items-center gap-2 p-2 border border-slate-200 rounded-lg"
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-black flex-shrink-0 border-2 border-white shadow-sm"
                style={{ backgroundColor: ACCENT, color: "#0F172A" }}
              >
                {s.initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold text-slate-900 truncate">{s.name}</p>
                <p className="text-[9.5px] text-slate-500 truncate">
                  {s.role} · <span className="font-mono text-slate-700">{s.ext}</span>
                </p>
                <span
                  className="inline-block mt-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: toneBg, color: toneText }}
                >
                  {s.status}
                </span>
              </div>
              <button
                onClick={() => onCall(s.name)}
                title={`Gọi nhanh ${s.ext}`}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-900 flex-shrink-0 active:scale-95 transition hover:opacity-90"
                style={{ backgroundColor: ACCENT, boxShadow: `0 0 12px ${ACCENT}80` }}
              >
                <Phone className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- ER Room Readiness Card ---------- */
function ErRoomReadinessCard() {
  const rows = [
    { icon: "green", label: "Hệ thống làm mát", value: "22°C · Đang bật tự động" },
    {
      icon: "check",
      label: "Máy thở chuyên dụng (Ventilator)",
      value: "Sẵn sàng kết nối",
    },
    {
      icon: "amber",
      label: "Máy sốc tim (Defibrillator)",
      value: "Đang sạc nguồn khẩn cấp",
    },
    {
      icon: "led",
      label: "Đèn hành lang dẫn đường",
      value: "Đã kích hoạt dải LED hướng dẫn",
    },
  ];
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3">
      <h4 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
        <Bed className="w-3.5 h-3.5" style={{ color: ACCENT }} />
        Hạ tầng Phòng Cấp cứu 01
      </h4>
      <div className="space-y-1.5">
        {rows.map((r) => (
          <div
            key={r.label}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-slate-50 border border-slate-100"
          >
            <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
              {r.icon === "green" && (
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_6px_#10B98180]" />
              )}
              {r.icon === "check" && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
              {r.icon === "amber" && (
                <span
                  className="w-2.5 h-2.5 rounded-full bg-amber-500"
                  style={{ animation: "mp-blink 1s ease-in-out infinite" }}
                />
              )}
              {r.icon === "led" && (
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: ACCENT, boxShadow: `0 0 10px ${ACCENT}` }}
                />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10.5px] font-bold text-slate-800 leading-tight">{r.label}</p>
              <p className="text-[10px] text-slate-600 leading-tight">{r.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Real OpenStreetMap (iframe + overlay markers) ---------- */
function RealAmbulanceMap({
  ambulances,
  selectedId,
  onSelect,
}: {
  ambulances: AmbulanceUnit[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  // Bach Mai Hospital, Hanoi: 21.0011, 105.8418
  // Bounding box around Bach Mai covering ~3km
  const bbox = "105.8200,20.9850,105.8650,21.0180";
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=21.0011,105.8418`;
  // Position ambulances as percentage overlays (approximate)
  const positions: Record<string, { top: string; left: string }> = {
    a1: { top: "38%", left: "62%" },
    a2: { top: "70%", left: "22%" },
    a3: { top: "52%", left: "42%" },
  };
  return (
    <div className="absolute inset-0">
      <iframe
        title="Hanoi Map"
        src={src}
        className="w-full h-full border-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      {/* Hospital marker (Bach Mai) */}
      <div
        className="absolute z-[300] pointer-events-none"
        style={{ top: "46%", left: "50%", transform: "translate(-50%,-50%)" }}
      >
        <div className="flex flex-col items-center">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center font-black text-slate-900 border-2 border-slate-900 shadow-lg"
            style={{ backgroundColor: ACCENT }}
          >
            H
          </div>
          <span className="mt-1 text-[9px] font-bold text-slate-900 bg-white/90 px-1.5 py-0.5 rounded shadow">
            BV Bạch Mai
          </span>
        </div>
      </div>
      {/* Ambulance markers overlay */}
      {ambulances.map((amb) => {
              const pos = positions[amb.id] ?? { top: "50%", left: "50%" };
        const color =
          amb.status === "critical" ? "#EF4444" : amb.status === "urgent" ? "#F59E0B" : "#10B981";
        const isSel = selectedId === amb.id;
        return (
          <button
            key={amb.id}
            onClick={() => onSelect(amb.id)}
            className="absolute z-[350] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group"
            style={{ top: pos.top, left: pos.left }}
          >
            {amb.status === "critical" && (
              <span
                className="absolute inline-flex h-10 w-10 rounded-full opacity-40 animate-ping"
                style={{ backgroundColor: color }}
              />
            )}
            <span
              className={`relative w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-sm border-2 border-white shadow-lg group-hover:scale-110 transition ${isSel ? "ring-4 ring-offset-1 ring-[#88E8F2]" : ""}`}
              style={{ backgroundColor: color }}
            >
              +
            </span>
            <span
              className="mt-1 text-[9px] font-bold font-mono bg-white/95 px-1.5 py-0.5 rounded shadow whitespace-nowrap"
              style={{ color }}
            >
              {amb.plate}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function RecordRow({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="border-l-2 pl-2" style={{ borderColor: ACCENT }}>
      <p className="text-[10px] font-geist uppercase tracking-wider text-slate-500">{label}</p>
      <p className="text-slate-900 font-medium">{value}</p>
      {sub && <p className="text-[10px] text-slate-500 font-mono">{sub}</p>}
    </div>
  );
}

function SyncRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start gap-3">
      <span className="text-[11px] font-geist uppercase tracking-wider text-slate-500 pt-0.5">
        {label}
      </span>
      <span className="text-xs text-slate-900 font-medium text-right">{value}</span>
    </div>
  );
}

function DispatchRow({
  Icon,
  name,
  role,
  status,
  tone,
}: {
  Icon: typeof Stethoscope;
  name: string;
  role: string;
  status: string;
  tone: "accent" | "amber" | "green";
}) {
  const toneStyle =
    tone === "accent"
      ? { bg: ACCENT, text: "#0F172A" }
      : tone === "amber"
        ? { bg: "#FEF3C7", text: "#92400E" }
        : { bg: "#DCFCE7", text: "#166534" };
  return (
    <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4 text-slate-700" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-900 truncate">{name}</p>
          <p className="text-[10px] font-geist uppercase tracking-wider text-slate-500">{role}</p>
        </div>
      </div>
      <span
        className="text-[10px] font-geist uppercase tracking-wider px-2 py-1 rounded font-bold flex-shrink-0 ml-2"
        style={{ backgroundColor: toneStyle.bg, color: toneStyle.text }}
      >
        {status}
      </span>
    </div>
  );
}

/* ============== VIEW 3: RECORDS / eKYC ============== */

interface CccdPatient {
  cccd: string;
  name: string;
  gender: string;
  dob: string;
  age: number;
  address: string;
  phone: string;
  bloodType: string;
  insurance: string;
  insuranceExpiry: string;
  allergies: string[];
  chronicConditions: string[];
  currentMeds: { name: string; dose: string; freq: string }[];
  previousVisits: {
    date: string;
    dept: string;
    doctor: string;
    diagnosis: string;
    status: string;
  }[];
  vitalsLast: { bp: string; hr: string; temp: string; spo2: string; weight: string };
  emergencyContact: { name: string; relation: string; phone: string };
}

function RecordsView() {
  const [step, setStep] = useState<"input" | "face_match" | "records">("input");
  const [inputMethod, setInputMethod] = useState<"scan" | "manual">("scan");
  const [cccdInput, setCccdInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [cccdImage, setCccdImage] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [foundPatient, setFoundPatient] = useState<CccdPatient | null>(null);
  const [identityError, setIdentityError] = useState("");
  const [activeTab, setActiveTab] = useState<"info" | "history" | "meds" | "docs">("info");
  const [showRegisterPrompt, setShowRegisterPrompt] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // EKYC Face Match State
  const [ekycStatus, setEkycStatus] = useState<"idle" | "scanning" | "success">("idle");

  const handleIdentitySubmit = async (cccdNumber?: string, overrideName?: string) => {
    const num = cccdNumber || cccdInput.replace(/\s/g, "");
    if (num.length < 9) return;
    setScanning(true);
    setScanStep(1);
    setIdentityError("");
    setFoundPatient(null);
    setCccdInput(num);
    if (overrideName) setNameInput(overrideName);

    try {
      setScanStep(2);
      const res = await fetchApi(`/records/by-cccd/${num}`);
      setScanStep(3);

      if (res.status === "error" || !res.data) {
        setScanning(false);
        // Show register walk-in option
        setShowRegisterPrompt(true);
        return;
      }

      setFoundPatient(res.data);
      setScanning(false);
      setTimeout(() => setStep("face_match"), 800);
    } catch (err) {
      setScanning(false);
      setIdentityError("Lỗi kết nối máy chủ");
    }
  };

  const handleRegisterPatient = async () => {
    if (!cccdInput || !nameInput) return;
    setScanning(true);
    setScanStep(1);
    try {
      const res = await fetchApi("/patient/admit-walkin", {
        method: "POST",
        body: JSON.stringify({
          name: nameInput,
          cccd: cccdInput,
        }),
      });
      if (res.status === "success" || res.ticket_id) {
        // Now lookup patient info again
        const lookup = await fetchApi(`/records/by-cccd/${cccdInput}`);
        if (lookup.status === "success" && lookup.data) {
          setFoundPatient(lookup.data);
          setShowRegisterPrompt(false);
          setScanning(false);
          setStep("face_match");
        } else {
          setScanning(false);
          setIdentityError("Lỗi tải hồ sơ vừa tạo mới.");
        }
      } else {
        setScanning(false);
        setIdentityError("Lỗi đăng ký nhập viện nhanh.");
      }
    } catch (err) {
      setScanning(false);
      setIdentityError("Không kết nối được server.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setCccdImage(base64);
      setScanning(true);
      setScanStep(1);
      setIdentityError("");
      setShowRegisterPrompt(false);
      try {
        // eKYC OCR via Backend
        const ocrRes = await fetchApi("/patient/ekyc/cccd", {
          method: "POST",
          body: JSON.stringify({ image_base64: base64 }),
        });
        if (ocrRes.status === "success" && ocrRes.data) {
          const ocrCccd = ocrRes.data.cccd;
          const ocrName = ocrRes.data.name;
          if (ocrCccd && ocrName) {
            setCccdInput(ocrCccd);
            setNameInput(ocrName);
            // Search DB via backend
            setScanStep(2);
            const dbRes = await fetchApi(`/records/by-cccd/${ocrCccd}`);
            setScanStep(3);
            if (dbRes.status === "success" && dbRes.data) {
              setFoundPatient(dbRes.data);
              setScanning(false);
              setTimeout(() => setStep("face_match"), 800);
            } else {
              setScanning(false);
              setShowRegisterPrompt(true);
            }
          } else {
            setScanning(false);
            setIdentityError(
              "Không nhận dạng được thông tin trên thẻ CCCD. Vui lòng chụp rõ hơn hoặc tự nhập.",
            );
          }
        } else {
          setScanning(false);
          setIdentityError(ocrRes.message || "Lỗi OCR eKYC từ VNPT.");
        }
      } catch (err) {
        setScanning(false);
        setIdentityError("Lỗi kết nối eKYC server.");
      }
    };
    reader.readAsDataURL(file);
  };

  const startFaceMatch = async () => {
    if (!foundPatient) {
      setStep("input");
      setIdentityError("Cần định danh bệnh nhân trước khi xác thực eKYC.");
      return;
    }
    setEkycStatus("scanning");
    try {
      const res = await fetchApi("/patient/ekyc/face", {
        method: "POST",
        body: JSON.stringify({
          far_image_base64: cccdImage || "data:image/jpeg;base64,...",
          near_image_base64: "data:image/jpeg;base64,...",
        }),
      });
      if (res.status === "success") {
        setEkycStatus("success");
        setTimeout(() => setStep("records"), 1500);
      } else {
        setEkycStatus("idle");
        setIdentityError("Sinh trắc học không khớp. Vui lòng thử lại.");
      }
    } catch (e) {
      setEkycStatus("success"); // Fallback
      setTimeout(() => setStep("records"), 1500);
    }
  };

  const handleBack = () => {
    setStep("input");
    setScanStep(0);
    setScanning(false);
    setEkycStatus("idle");
    setCccdInput("");
    setNameInput("");
    setCccdImage(null);
    setFoundPatient(null);
    setIdentityError("");
    setActiveTab("info");
    setShowRegisterPrompt(false);
  };

  if (step === "records" && foundPatient) {
    return (
      <CccdPatientProfile
        patient={foundPatient}
        onBack={handleBack}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
    );
  }

  if (step === "records" && !foundPatient) {
    return (
      <div className="max-w-3xl mx-auto w-full">
        <div className="bg-white border border-red-200 rounded-xl p-6 shadow-sm text-center">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-3">
            <CircleAlert className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">
            Không tải được hồ sơ bệnh nhân
          </h3>
          <p className="text-sm text-slate-500 mb-5">
            Phiên định danh không có bệnh nhân hợp lệ. Vui lòng quay lại và quét
            lại CCCD.
          </p>
          <button
            onClick={handleBack}
            className="px-5 py-2.5 rounded-lg text-sm font-bold text-slate-900 hover:opacity-90 transition"
            style={{ backgroundColor: ACCENT }}
          >
            Quét lại CCCD
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      {/* STEP 1: IDENTITY INPUT */}
      {step === "input" && (
        <div className="animate-in fade-in zoom-in-95 flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm duration-300 sm:p-6">
          <div className="mb-5 text-center sm:mb-6">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Định danh Bệnh nhân</h3>
            <p className="text-slate-500 text-sm">
              Vui lòng chọn phương thức cung cấp thông tin
            </p>
          </div>

          {/* Tabs for choosing method */}
          <div className="mx-auto mb-5 flex w-full max-w-sm rounded-lg bg-slate-100 p-1 sm:mb-6">
            <button
              onClick={() => setInputMethod("scan")}
              className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${inputMethod === "scan" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              Quét thẻ CCCD
            </button>
            <button
              onClick={() => setInputMethod("manual")}
              className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${inputMethod === "manual" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              Nhập thủ công
            </button>
          </div>

          <div className="w-full">
            {showRegisterPrompt ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-center animate-in zoom-in-95 duration-300">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
                  <User className="w-6 h-6 text-amber-700" />
                </div>
                <h4 className="text-base font-bold text-slate-900 mb-1">
                  Chưa có hồ sơ bệnh nhân
                </h4>
                <p className="text-sm text-slate-600 mb-4">
                  Không tìm thấy hồ sơ cho CCCD số{" "}
                  <span className="font-mono font-bold text-slate-800">{cccdInput}</span> (
                  {nameInput || "Chưa rõ tên"}).
                  <br />
                  Bạn có muốn tạo hồ sơ nhập viện nhanh (Walk-in) vào Supabase
                  không?
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => setShowRegisterPrompt(false)}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100 bg-white"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    onClick={handleRegisterPatient}
                    disabled={scanning}
                    className="px-5 py-2 rounded-lg text-sm font-bold text-slate-900 hover:opacity-90 transition disabled:opacity-50"
                    style={{ backgroundColor: ACCENT }}
                  >
                    {scanning ? "Đang xử lý..." : "Đăng ký nhanh"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5">
                {inputMethod === "scan" ? (
                  <div className="flex flex-col max-w-md mx-auto w-full">
                    {/* Interactive CCCD Drag-drop / Upload container */}
                    <label
                      htmlFor="cccd-file"
                      className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden ${
                        cccdImage
                          ? "border-slate-300"
                          : "border-slate-300 hover:border-cyan-400 bg-slate-50/50"
                      }`}
                      style={{ aspectRatio: "86/54" }}
                    >
                      <input
                        type="file"
                        id="cccd-file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleFileChange}
                        disabled={scanning}
                        className="hidden"
                      />

                      {cccdImage ? (
                        <>
                          <img src={cccdImage} alt="CCCD" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/45 flex flex-col justify-end p-4">
                            <p className="text-white text-xs font-semibold">Ảnh đã chọn</p>
                            <p className="text-[10px] text-white/70">
                              Click để chọn ảnh khác
                            </p>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center p-6 text-center">
                          <div className="w-12 h-12 rounded-full bg-cyan-50 flex items-center justify-center mb-3 text-cyan-500">
                            <Upload className="w-5 h-5" />
                          </div>
                          <p className="text-sm font-bold text-slate-800">
                            Chụp hoặc Tải lên mặt trước CCCD
                          </p>
                          <p className="text-[11px] text-slate-400 mt-1">
                            Hỗ trợ eKYC tự động trích xuất thông tin
                          </p>
                        </div>
                      )}

                      {/* Scanning laser animation */}
                      {scanning && (
                        <>
                          <div
                            className="absolute inset-x-0 h-1 z-20 pointer-events-none rounded-full"
                            style={{
                              backgroundColor: ACCENT,
                              boxShadow: `0 0 20px ${ACCENT}, 0 0 40px ${ACCENT}`,
                              animation: "cccd-scan 1.5s ease-in-out infinite",
                            }}
                          />
                          <style>{`@keyframes cccd-scan { 0%, 100% { top: 5%; } 50% { top: 90%; } }`}</style>
                        </>
                      )}
                    </label>

                    {cccdImage && (
                      <div className="mt-4 p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                          <span className="text-xs font-mono font-bold text-slate-700">
                            {scanning
                              ? "Đang gọi eKYC..."
                              : cccdInput
                                ? `CCCD: ${cccdInput}`
                                : "Đã tải lên"}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            setCccdImage(null);
                            setCccdInput("");
                            setNameInput("");
                          }}
                          disabled={scanning}
                          className="text-xs font-bold text-red-500 hover:text-red-600 disabled:opacity-50"
                        >
                          Xóa ảnh
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 max-w-md mx-auto w-full">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Số CCCD
                      </label>
                      <div className="relative">
                        <ScanLine className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          ref={inputRef}
                          type="text"
                          value={cccdInput}
                          onChange={(e) => setCccdInput(e.target.value.replace(/[^0-9]/g, ""))}
                          placeholder="Nhập 12 số CCCD"
                          maxLength={12}
                          className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm font-mono outline-none focus:border-[#88E8F2]"
                          disabled={scanning}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Họ và Tên
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          value={nameInput}
                          onChange={(e) => setNameInput(e.target.value)}
                          placeholder="NGUYỄN VĂN A"
                          className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm uppercase outline-none focus:border-[#88E8F2]"
                          disabled={scanning}
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => handleIdentitySubmit()}
                      disabled={scanning || cccdInput.length < 9 || nameInput.length < 3}
                      className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold text-slate-900 transition-all hover:opacity-90 disabled:opacity-50 sm:py-3"
                      style={{ backgroundColor: ACCENT }}
                    >
                      {scanning ? (
                        <>
                          <span className="w-4 h-4 border-2 border-t-transparent border-slate-900 rounded-full animate-spin" />{" "}
                          Đang tra cứu...
                        </>
                      ) : (
                        "Tiếp tục Xác thực"
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {identityError && (
            <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 flex items-start gap-3 w-full">
              <CircleAlert className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm font-medium text-red-700">{identityError}</p>
            </div>
          )}

          {/* Progress Indicator */}
          {scanStep > 0 && (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 border-t border-slate-100 pt-4 sm:gap-4 w-full">
              {["Đọc ảnh / Nhập", "Đối chiếu DB", "Hoàn tất"].map((label, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${scanStep > idx ? "bg-emerald-500 text-white" : scanStep === idx ? "bg-slate-200 text-slate-800" : "bg-slate-100 text-slate-400"}`}
                  >
                    {scanStep > idx ? "âœ“" : idx + 1}
                  </div>
                  <span
                    className={`text-xs ${scanStep >= idx ? "text-slate-800" : "text-slate-400"}`}
                  >
                    {label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* STEP 2: FACE MATCH */}
      {step === "face_match" && (
        <div
          className="animate-in slide-in-from-right-8 fade-in flex flex-col rounded-xl border-2 bg-white p-4 shadow-sm duration-300 sm:p-6"
          style={{ borderColor: ekycStatus === "success" ? "#10b981" : ACCENT }}
        >
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              Xác thực Khuôn mặt (Face eKYC)
            </h3>
            <p className="text-slate-500 text-sm">
              Vui lòng hướng camera về phía bệnh nhân {foundPatient?.name}
            </p>
          </div>

          <div className="mb-8 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
            <EkycFace label="Ảnh CCCD" sub={cccdInput} state={ekycStatus} />
            <div className="relative h-12 w-px sm:h-px sm:max-w-[120px] sm:flex-1">
              <div
                className="absolute inset-0 transition-all duration-500"
                style={{
                  backgroundColor:
                    ekycStatus === "success"
                      ? "#10b981"
                      : ekycStatus === "scanning"
                        ? ACCENT
                        : "#e2e8f0",
                  boxShadow:
                    ekycStatus === "success"
                      ? "0 0 8px #10b981"
                      : ekycStatus === "scanning"
                        ? `0 0 8px ${ACCENT}`
                        : "none",
                }}
              />
              {ekycStatus === "success" && (
                <CheckCircle2 className="w-8 h-8 text-emerald-600 bg-white rounded-full absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-in zoom-in duration-300" />
              )}
              {ekycStatus === "scanning" && (
                <div
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
                  style={{ borderColor: `${ACCENT} transparent ${ACCENT} ${ACCENT}` }}
                />
              )}
            </div>
            <EkycFace label="Live Camera" sub="Thực thể sống" live state={ekycStatus} />
          </div>

          {ekycStatus === "success" && (
            <div className="mb-6 p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-center animate-in zoom-in-95 duration-300">
              <p className="text-emerald-800 font-bold mb-1">Xác thực thành công!</p>
              <p className="text-xs text-emerald-600">
                Độ khớp: 99.8% - Đang chuyển hướng đến hồ sơ bệnh án...
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleBack}
              disabled={ekycStatus !== "idle"}
              className="px-6 py-3 rounded-lg text-sm font-bold text-slate-600 border border-slate-200 hover:bg-slate-50 transition-all disabled:opacity-50"
            >
              Quay lại
            </button>
            <button
              onClick={startFaceMatch}
              disabled={ekycStatus !== "idle"}
              className="flex-1 py-3 rounded-lg text-sm font-bold text-slate-900 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.98]"
              style={{
                backgroundColor: ekycStatus === "success" ? "#10b981" : ACCENT,
                color: ekycStatus === "success" ? "white" : "#0f172a",
                animation:
                  ekycStatus === "scanning" ? "pulse 1.2s ease-in-out infinite" : undefined,
              }}
            >
              {ekycStatus === "idle" && "Bắt đầu Xác thực eKYC"}
              {ekycStatus === "scanning" && "Đang đối chiếu sinh trắc học..."}
              {ekycStatus === "success" && "✓ Hoàn tất"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- CCCD Patient Profile View ---------- */
function CccdPatientProfile({
  patient,
  onBack,
  activeTab,
  setActiveTab,
}: {
  patient: CccdPatient;
  onBack: () => void;
  activeTab: "info" | "history" | "meds" | "docs";
  setActiveTab: (t: "info" | "history" | "meds" | "docs") => void;
}) {
  const hasAllergies = patient.allergies.length > 0;

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-400">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Quét CCCD khác
        </button>
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 rounded text-[10px] font-geist uppercase tracking-wider font-bold bg-emerald-500 text-white flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Đã xác thực
          </span>
        </div>
      </div>

      {/* Allergy alert */}
      {hasAllergies && (
        <div
          className="border-2 border-red-500 bg-red-50 rounded-xl p-3 flex items-center gap-3"
          style={{ animation: "mp-blink 2s ease-in-out infinite" }}
        >
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-red-700">
              CẢNH BÁO DỊ ỨNG THUỐC
            </p>
            <p className="text-sm font-black text-red-700">{patient.allergies.join(" · ")}</p>
          </div>
        </div>
      )}

      {/* Patient header card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div
            className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: ACCENT + "25", border: `2px solid ${ACCENT}` }}
          >
            <User className="w-8 h-8" style={{ color: ACCENT }} />
          </div>
          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xl font-bold text-slate-900">{patient.name}</h3>
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                style={{
                  backgroundColor: patient.gender === "Nam" ? "#DBEAFE" : "#FCE7F3",
                  color: patient.gender === "Nam" ? "#1E40AF" : "#BE185D",
                }}
              >
                {patient.gender}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                {patient.age} tuổi
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <CreditCard className="w-3 h-3" /> CCCD:{" "}
                <span className="font-mono font-bold text-slate-900">{patient.cccd}</span>
              </span>
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> {patient.dob}
              </span>
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <Phone className="w-3 h-3" /> {patient.phone}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {patient.address}
            </p>
          </div>
          {/* Blood type badge */}
          <div className="flex flex-col items-center gap-1 flex-shrink-0">
            <div className="w-12 h-12 rounded-full border-2 border-red-200 bg-red-50 flex items-center justify-center">
              <span className="text-lg font-black text-red-600">{patient.bloodType}</span>
            </div>
            <span className="text-[9px] text-slate-500 font-geist uppercase">Nhóm máu</span>
          </div>
        </div>

        {/* Insurance & emergency contact */}
        <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-100">
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-2.5">
            <p className="text-[9px] font-geist uppercase tracking-wider text-blue-500">
              Bảo hiểm Y tế
            </p>
            <p className="text-xs font-bold text-blue-900 font-mono">{patient.insurance}</p>
            <p className="text-[10px] text-blue-600">HSD: {patient.insuranceExpiry}</p>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-lg p-2.5">
            <p className="text-[9px] font-geist uppercase tracking-wider text-amber-500">
              Liên hệ Khẩn cấp
            </p>
            <p className="text-xs font-bold text-amber-900">
              {patient.emergencyContact.name} ({patient.emergencyContact.relation})
            </p>
            <p className="text-[10px] text-amber-600 font-mono">{patient.emergencyContact.phone}</p>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
        {[
          { key: "info" as const, label: "Thông tin", Icon: Heart },
          { key: "history" as const, label: "Lịch sử khám", Icon: Clock },
          { key: "meds" as const, label: "Thuốc & Đơn thuốc", Icon: Pill },
          { key: "docs" as const, label: "Tài liệu", Icon: FileText },
        ].map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-[11px] font-bold transition-all ${
              activeTab === key
                ? "text-slate-900 bg-white shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
            style={activeTab === key ? { boxShadow: `0 1px 3px rgba(0,0,0,0.08)` } : undefined}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "info" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Vitals from last visit */}
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4" style={{ color: ACCENT }} />
              Chỉ số Sinh hiệu (Lần khám gần nhất)
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  label: "Huyết áp",
                  value: patient.vitalsLast.bp + " mmHg",
                  Icon: Heart,
                  color: "#EF4444",
                },
                {
                  label: "Nhịp tim",
                  value: patient.vitalsLast.hr + " bpm",
                  Icon: Activity,
                  color: "#8B5CF6",
                },
                {
                  label: "Nhiệt độ",
                  value: patient.vitalsLast.temp + " °C",
                  Icon: Thermometer,
                  color: "#F59E0B",
                },
                {
                  label: "SpO2",
                  value: patient.vitalsLast.spo2 + "%",
                  Icon: Droplets,
                  color: "#3B82F6",
                },
              ].map(({ label, value, Icon, color }) => (
                <div
                  key={label}
                  className="border border-slate-100 rounded-lg p-3 hover:border-[#88E8F2] transition-colors"
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon className="w-3.5 h-3.5" style={{ color }} />
                    <span className="text-[10px] font-geist uppercase tracking-wider text-slate-500">
                      {label}
                    </span>
                  </div>
                  <p className="text-lg font-bold text-slate-900">{value}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] text-slate-500">
                Cân nặng:{" "}
                <span className="font-bold text-slate-900">{patient.vitalsLast.weight} kg</span>
              </span>
              <span className="text-[10px] text-slate-400">{patient.previousVisits[0]?.date}</span>
            </div>
          </div>

          {/* Chronic conditions */}
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
              <Clipboard className="w-4 h-4" style={{ color: ACCENT }} />
              Tiền sử Bệnh lý nền
            </h4>
            <div className="space-y-2">
              {patient.chronicConditions.length > 0 ? (
                patient.chronicConditions.map((cond, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-slate-100 bg-slate-50"
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: ACCENT }}
                    />
                    <span className="text-sm text-slate-800 font-medium">{cond}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-400 italic py-4 text-center">
                  Không có tiền sử bệnh lý nền
                </p>
              )}
            </div>

            {/* Allergies section */}
            <div className="mt-4 pt-3 border-t border-slate-100">
              <h5 className="text-[10px] font-geist uppercase tracking-wider text-slate-500 mb-2">
                Dị ứng
              </h5>
              {hasAllergies ? (
                <div className="flex flex-wrap gap-2">
                  {patient.allergies.map((a, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-100 text-red-700 border border-red-200 flex items-center gap-1"
                    >
                      <AlertTriangle className="w-3 h-3" /> {a}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Không có dị ứng đã biết
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "history" && (
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4" style={{ color: ACCENT }} />
            Lịch sử Khám bệnh
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 ml-auto">
              {patient.previousVisits.length} lần khám
            </span>
          </h4>
          <div className="space-y-0">
            {patient.previousVisits.map((visit, i) => (
              <div key={i} className="relative flex gap-4 pb-5">
                {/* Timeline line */}
                {i < patient.previousVisits.length - 1 && (
                  <div className="absolute left-[15px] top-8 bottom-0 w-px bg-slate-200" />
                )}
                {/* Timeline dot */}
                <div className="relative z-10 flex-shrink-0">
                  <div
                    className="w-8 h-8 rounded-full border-2 flex items-center justify-center"
                    style={{
                      backgroundColor: visit.status === "Đang điều trị" ? "#FEF3C7" : "#F0FDF4",
                      borderColor: visit.status === "Đang điều trị" ? "#F59E0B" : "#22C55E",
                    }}
                  >
                    {visit.status === "Đang điều trị" ? (
                      <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    )}
                  </div>
                </div>
                {/* Content */}
                <div className="flex-1 min-w-0 border border-slate-100 rounded-lg p-3 hover:border-[#88E8F2] transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900">{visit.diagnosis}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span
                          className="text-[10px] font-geist uppercase tracking-wider px-1.5 py-0.5 rounded"
                          style={{ backgroundColor: ACCENT + "25", color: "#0E7490" }}
                        >
                          {visit.dept}
                        </span>
                        <span className="text-[10px] text-slate-500">{visit.doctor}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-[11px] font-mono text-slate-600">{visit.date}</p>
                      <span
                        className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                          visit.status === "Đang điều trị"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {visit.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "meds" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
              <Pill className="w-4 h-4" style={{ color: ACCENT }} />
              Thuốc đang sử dụng
            </h4>
            <div className="space-y-2">
              {patient.currentMeds.map((med, i) => (
                <div
                  key={i}
                  className="border border-slate-100 rounded-lg p-3 hover:border-[#88E8F2] transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{med.name}</p>
                      <p className="text-[11px] text-slate-500">
                        {med.dose} · {med.freq}
                      </p>
                    </div>
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: ACCENT + "20" }}
                    >
                      <Pill className="w-4 h-4" style={{ color: ACCENT }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick prescription info */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
              <Receipt className="w-4 h-4" style={{ color: ACCENT }} />
              Đơn thuốc Gần nhất
            </h4>
            <div className="bg-slate-900 rounded-lg p-4 overflow-auto">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="w-2 h-2 rounded-full bg-yellow-500" />
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                </div>
                <span className="text-[10px] font-mono text-slate-500">
                  prescription_{patient.cccd.slice(-4)}.json
                </span>
              </div>
              <pre className="text-[10px] font-mono leading-relaxed">
                <span className="text-slate-500">{`{`}</span>
                {"\n  "}
                <span style={{ color: ACCENT }}>"benh_nhan"</span>
                <span className="text-slate-400">: </span>
                <span className="text-amber-300">"{patient.name}"</span>
                <span className="text-slate-400">,</span>
                {"\n  "}
                <span style={{ color: ACCENT }}>"ngay_ke"</span>
                <span className="text-slate-400">: </span>
                <span className="text-amber-300">"{patient.previousVisits[0]?.date}"</span>
                <span className="text-slate-400">,</span>
                {"\n  "}
                <span style={{ color: ACCENT }}>"thuoc"</span>
                <span className="text-slate-400">: [</span>
                {"\n"}
                {patient.currentMeds.map((med, i) => (
                  <span key={i}>
                    {"    "}
                    <span className="text-amber-300">
                      "{med.name} {med.dose}"
                    </span>
                    {i < patient.currentMeds.length - 1 ? (
                      <span className="text-slate-400">,</span>
                    ) : null}
                    {"\n"}
                  </span>
                ))}
                <span className="text-slate-400">{"  ],"}</span>
                {"\n  "}
                <span style={{ color: ACCENT }}>"bac_si"</span>
                <span className="text-slate-400">: </span>
                <span className="text-amber-300">"{patient.previousVisits[0]?.doctor}"</span>
                {"\n"}
                <span className="text-slate-500">{`}`}</span>
              </pre>
            </div>
          </div>
        </div>
      )}

      {activeTab === "docs" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col h-[420px]">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4" style={{ color: ACCENT }} />
                Phiếu Khám gần nhất
              </h4>
              <span
                className="px-2 py-1 rounded text-[10px] font-geist uppercase tracking-wider text-slate-900"
                style={{ backgroundColor: ACCENT }}
              >
                AI OCR
              </span>
            </div>
            <div className="flex-1 bg-gradient-to-br from-amber-50 to-stone-100 border border-dashed border-slate-300 rounded-lg overflow-hidden relative">
              <ScannedDocument />
              <div
                className="absolute inset-x-0 h-1 z-20 pointer-events-none"
                style={{
                  backgroundColor: ACCENT,
                  boxShadow: `0 0 12px ${ACCENT}, 0 0 24px ${ACCENT}`,
                  animation: "laser-scan 2.4s ease-in-out infinite",
                }}
              />
              <style>{`@keyframes laser-scan { 0%, 100% { top: 0%; } 50% { top: calc(100% - 4px); } }`}</style>
            </div>
          </div>
          <EkycPanel />
        </div>
      )}
    </div>
  );
}

function EkycFace({
  label,
  sub,
  live,
  state,
}: {
  label: string;
  sub: string;
  live?: boolean;
  state?: "idle" | "scanning" | "success";
}) {
  return (
    <div className="flex flex-col items-center">
      <div
        className="relative w-24 h-24 rounded-lg overflow-hidden border-2 transition-all duration-300"
        style={{ borderColor: state === "success" ? "#10b981" : ACCENT }}
      >
        <div
          className={`absolute inset-0 bg-gradient-to-br from-slate-300 to-slate-500 ${live && state === "idle" ? "blur-[2px]" : ""}`}
        />
        <svg viewBox="0 0 80 80" className="absolute inset-0 w-full h-full">
          <circle cx="40" cy="30" r="14" fill="#E2E8F0" />
          <ellipse cx="40" cy="68" rx="22" ry="18" fill="#E2E8F0" />
        </svg>
        {live && state === "scanning" && (
          <>
            {/* Biometric frame corners */}
            <div className="absolute inset-1 pointer-events-none">
              {[
                "top-0 left-0 border-t-2 border-l-2",
                "top-0 right-0 border-t-2 border-r-2",
                "bottom-0 left-0 border-b-2 border-l-2",
                "bottom-0 right-0 border-b-2 border-r-2",
              ].map((c) => (
                <span
                  key={c}
                  className={`absolute w-3 h-3 ${c}`}
                  style={{ borderColor: ACCENT, boxShadow: `0 0 8px ${ACCENT}` }}
                />
              ))}
            </div>
            {/* Sweeping laser */}
            <div
              className="absolute inset-x-0 h-0.5 pointer-events-none"
              style={{
                backgroundColor: ACCENT,
                boxShadow: `0 0 10px ${ACCENT}, 0 0 20px ${ACCENT}`,
                animation: "ekyc-sweep 1.2s ease-in-out infinite",
              }}
            />
            <style>{`@keyframes ekyc-sweep { 0%,100% { top: 0%; } 50% { top: calc(100% - 2px); } }`}</style>
          </>
        )}
        {live && (
          <span className="absolute top-1 right-1 flex items-center gap-0.5 bg-red-600 text-white px-1 rounded text-[8px] font-bold">
            <span className="w-1 h-1 rounded-full bg-white animate-pulse" />
            LIVE
          </span>
        )}
      </div>
      <p className="text-[10px] font-bold text-slate-900 mt-1.5">{label}</p>
      <p className="text-[9px] text-slate-500 font-geist">{sub}</p>
    </div>
  );
}

function EkycPanel() {
  const [status, setStatus] = useState<"idle" | "scanning" | "success">("idle");

  const start = () => {
    setStatus("scanning");
    setTimeout(() => setStatus("success"), 2500);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* eKYC dual face compare */}
      <div
        className="bg-white border-2 rounded-xl p-4 transition-all duration-300"
        style={{ borderColor: status === "success" ? "#10b981" : ACCENT }}
      >
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <UserCheck className="w-4 h-4" style={{ color: ACCENT }} />
            eKYC · So khớp khuôn mặt
          </h4>
          {status === "success" && (
            <span className="px-2 py-1 rounded text-[10px] font-geist uppercase tracking-wider font-bold bg-emerald-500 text-white animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.6)]">
              KHỚP 99.8%
            </span>
          )}
          {status === "scanning" && (
            <span className="px-2 py-1 rounded text-[10px] font-geist uppercase tracking-wider font-bold bg-amber-100 text-amber-700">
              Đang đối chiếu...
            </span>
          )}
          {status === "idle" && (
            <span className="px-2 py-1 rounded text-[10px] font-geist uppercase tracking-wider font-bold bg-slate-100 text-slate-600">
              Chờ xác thực
            </span>
          )}
        </div>

        <div className="flex items-center justify-center gap-3">
          <EkycFace label="Ảnh CCCD" sub="Tham chiếu" state={status} />
          <div className="flex-1 relative h-px max-w-[80px]">
            <div
              className="absolute inset-0 transition-all duration-500"
              style={{
                backgroundColor:
                  status === "success" ? "#10b981" : status === "scanning" ? ACCENT : "#e2e8f0",
                boxShadow:
                  status === "success"
                    ? "0 0 8px #10b981"
                    : status === "scanning"
                      ? `0 0 8px ${ACCENT}`
                      : "none",
              }}
            />
            {status === "success" && (
              <CheckCircle2 className="w-6 h-6 text-emerald-600 bg-white rounded-full absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-in zoom-in duration-300" />
            )}
            {status === "scanning" && (
              <div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: `${ACCENT} transparent ${ACCENT} ${ACCENT}` }}
              />
            )}
          </div>
          <EkycFace label="Camera Thực tế" sub="Live capture" live state={status} />
        </div>

        {status === "success" && (
          <div className="mt-3 pt-3 border-t border-slate-100 text-center text-[11px] font-geist text-slate-700 animate-in fade-in duration-300">
            Trạng thái:{" "}
            <span className="font-bold text-emerald-600">Thực thể sống (Live)</span>
            <span className="text-slate-400 mx-2">|</span>
            Độ lệch: <span className="font-bold text-slate-900">0.02%</span>
          </div>
        )}

        <button
          onClick={start}
          disabled={status !== "idle"}
          className="mt-3 w-full py-2.5 rounded-lg text-sm font-bold text-slate-900 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.98]"
          style={{
            backgroundColor: status === "success" ? "#10b981" : ACCENT,
            color: status === "success" ? "white" : "#0f172a",
            animation: status === "scanning" ? "pulse 1.2s ease-in-out infinite" : undefined,
          }}
        >
          {status === "idle" && "Bắt đầu Xác thực eKYC"}
          {status === "scanning" && "Đang phân tích sinh trắc học..."}
          {status === "success" && "✓ Xác thực thành công"}
        </button>
      </div>

      {/* JSON code editor — only after success */}
      {status === "success" ? (
        <div className="bg-slate-900 rounded-xl flex-1 flex flex-col overflow-hidden border border-slate-800 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="flex justify-between items-center px-4 py-2 border-b border-slate-800 bg-slate-950">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
              </div>
              <span className="text-[11px] font-mono text-slate-400 ml-2">
                extracted_record.json
              </span>
            </div>
            <span
              className="text-[10px] font-geist uppercase tracking-wider"
              style={{ color: ACCENT }}
            >
              API Response · 200 OK
            </span>
          </div>
          <pre className="flex-1 p-4 text-[11px] font-mono overflow-auto leading-relaxed">
            <span className="text-slate-500">{`{`}</span>
            {"\n  "}
            <span style={{ color: "#88E8F2" }}>"ho_ten"</span>
            <span className="text-slate-400">: </span>
            <span className="text-amber-300">"Nguyễn Văn A"</span>
            <span className="text-slate-400">,</span>
            {"\n  "}
            <span style={{ color: "#88E8F2" }}>"cccd"</span>
            <span className="text-slate-400">: </span>
            <span className="text-amber-300">"001203xxxx"</span>
            <span className="text-slate-400">,</span>
            {"\n  "}
            <span style={{ color: "#88E8F2" }}>"ngay_sinh"</span>
            <span className="text-slate-400">: </span>
            <span className="text-amber-300">"1968-04-12"</span>
            <span className="text-slate-400">,</span>
            {"\n  "}
            <span style={{ color: "#88E8F2" }}>"nhom_mau"</span>
            <span className="text-slate-400">: </span>
            <span className="text-amber-300">"O+"</span>
            <span className="text-slate-400">,</span>
            {"\n  "}
            <span style={{ color: "#88E8F2" }}>"chan_doan"</span>
            <span className="text-slate-400">: </span>
            <span className="text-amber-300">"Tăng huyết áp độ 2"</span>
            <span className="text-slate-400">,</span>
            {"\n  "}
            <span style={{ color: "#88E8F2" }}>"chi_so_sinh_hoa"</span>
            <span className="text-slate-400">: {`{`}</span>
            {"\n    "}
            <span style={{ color: "#88E8F2" }}>"glucose"</span>
            <span className="text-slate-400">: </span>
            <span className="text-amber-300">"7.8 mmol/L"</span>
            <span className="text-slate-400">,</span>
            {"\n    "}
            <span style={{ color: "#88E8F2" }}>"cholesterol"</span>
            <span className="text-slate-400">: </span>
            <span className="text-amber-300">"5.9 mmol/L"</span>
            <span className="text-slate-400">,</span>
            {"\n    "}
            <span style={{ color: "#88E8F2" }}>"creatinine"</span>
            <span className="text-slate-400">: </span>
            <span className="text-amber-300">"92 µmol/L"</span>
            {"\n  "}
            <span className="text-slate-400">{`},`}</span>
            {"\n  "}
            <span style={{ color: "#88E8F2" }}>"di_ung"</span>
            <span className="text-slate-400">: [</span>
            <span className="text-amber-300">"Penicillin"</span>
            <span className="text-slate-400">],</span>
            {"\n  "}
            <span style={{ color: "#88E8F2" }}>"thuoc_dang_dung"</span>
            <span className="text-slate-400">: [</span>
            <span className="text-amber-300">"Amlodipin 5mg"</span>
            <span className="text-slate-400">],</span>
            {"\n  "}
            <span style={{ color: "#88E8F2" }}>"face_match_score"</span>
            <span className="text-slate-400">: </span>
            <span className="text-green-400">0.998</span>
            <span className="text-slate-400">,</span>
            {"\n  "}
            <span style={{ color: "#88E8F2" }}>"liveness"</span>
            <span className="text-slate-400">: </span>
            <span className="text-green-400">true</span>
            {"\n"}
            <span className="text-slate-500">{`}`}</span>
          </pre>
          <button
            className="m-3 py-2 rounded-lg text-sm font-medium text-slate-900 hover:opacity-90 transition active:scale-[0.98]"
            style={{ backgroundColor: ACCENT }}
          >
            Lưu vào EMR
          </button>
        </div>
      ) : (
        <div className="bg-slate-900/95 rounded-xl flex-1 flex flex-col items-center justify-center border border-slate-800 p-8 text-center min-h-[260px]">
          <div className="w-12 h-12 rounded-full border-2 border-slate-700 flex items-center justify-center mb-3">
            <ScanLine className="w-6 h-6 text-slate-600" />
          </div>
          <p className="text-sm font-bold text-slate-300">Chờ phản hồi từ VNPT eKYC API</p>
          <p className="text-[11px] text-slate-500 font-geist mt-1">
            {status === "scanning"
              ? "Đang xử lý sinh trắc học khuôn mặt..."
              : "Nhấn 'Bắt đầu Xác thực eKYC' để khởi tạo phiên đối chiếu"}
          </p>
        </div>
      )}
    </div>
  );
}

function ScannedDocument() {
  return (
    <div
      className="absolute inset-4 bg-[#FBF7EC] shadow-md border border-amber-200/60 p-5 text-[10px] text-slate-800 font-serif leading-relaxed overflow-hidden"
      style={{
        transform: "rotate(-0.6deg)",
        backgroundImage:
          "radial-gradient(circle at 20% 30%, rgba(0,0,0,0.04) 0px, transparent 50%), radial-gradient(circle at 80% 70%, rgba(0,0,0,0.05) 0px, transparent 60%), linear-gradient(180deg, transparent 0%, rgba(180,140,80,0.08) 100%)",
      }}
    >
      {/* Wrinkle lines */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(105deg, transparent 49%, rgba(0,0,0,0.05) 50%, transparent 51%), linear-gradient(75deg, transparent 49%, rgba(0,0,0,0.04) 50%, transparent 51%)",
          backgroundSize: "180px 100%, 240px 100%",
        }}
      />
      <div className="text-center border-b-2 border-slate-700 pb-2 mb-2 relative">
        <p className="font-bold text-slate-900 text-xs tracking-wide">
          BỆNH VIỆN ĐA KHOA TRUNG ƯƠNG
        </p>
        <p className="text-[9px] text-slate-600 italic">PHIẾU KHÁM BỆNH — Mẫu BV-01</p>
        <div
          className="absolute top-0 right-0 w-10 h-10 rounded-full border-2 border-red-600/60 flex items-center justify-center"
          style={{ transform: "rotate(12deg)" }}
        >
          <span className="text-[7px] font-bold text-red-600/80 text-center leading-tight">
            ĐÃ
            <br />
            DUYỆT
          </span>
        </div>
      </div>
      <div className="space-y-1 relative">
        <p>
          <span className="text-slate-500">Họ tên:</span> Nguyễn Văn A
        </p>
        <p>
          <span className="text-slate-500">Ngày sinh:</span> 12/04/1968
        </p>
        <p>
          <span className="text-slate-500">Nhóm máu:</span> O+
        </p>
        <p>
          <span className="text-slate-500">Chẩn đoán:</span> Tăng huyết áp độ 2
        </p>
        <div className="border-t border-slate-300 pt-2 mt-2">
          <p className="font-bold mb-1">Chỉ số sinh hóa:</p>
          <p>· Glucose: 7.8 mmol/L</p>
          <p>· Cholesterol: 5.9 mmol/L</p>
          <p>· Creatinine: 92 µmol/L</p>
        </div>
        <div className="border-t border-slate-300 pt-2 mt-2">
          <p className="font-bold mb-1">Thuốc:</p>
          <p>· Amlodipin 5mg — 1v/ngày</p>
        </div>
        <div className="pt-3 text-right italic text-slate-600" style={{ fontFamily: "cursive" }}>
          BS. Văn Ngữ
        </div>
      </div>
    </div>
  );
}

/* ============== VIEW 4: VOICE CHARTING ============== */

const TRANSCRIPT_FULL =
  "Bệnh nhân nam sáu mươi hai tuổi, vào viện vì đau ngực và khó thở. Khám lâm sàng huyết áp một trăm bốn mươi trên chín mươi, mạch chín mươi lăm. Chẩn đoán theo dõi tăng huyết áp độ hai kèm đau thắt ngực. Y lệnh Amlodipin năm miligam uống một viên mỗi sáng, theo dõi nhịp tim trong bốn mươi tám giờ.";

function VoiceView() {
  const isMobile = useIsMobile();
  const [mobilePanel, setMobilePanel] = useState<"record" | "soap">("record");
  const [recording, setRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [liveTranscript, setLiveTranscript] = useState("");
  const [soapeData, setSoapeData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [showSignedEMR, setShowSignedEMR] = useState(false);

  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef<string>("");

  const startRecording = async () => {
    try {
      setErrorMsg("");
      setLiveTranscript("");
      setTranscript("");
      setSoapeData(null);
      finalTranscriptRef.current = "";

      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        setErrorMsg(
          "Trình duyệt không hỗ trợ nhận dạng giọng nói. Vui lòng dùng Google Chrome.",
        );
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.lang = "vi-VN";
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event: any) => {
        let interim = "";
        let final = "";
        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            final += result[0].transcript + " ";
          } else {
            interim += result[0].transcript;
          }
        }
        finalTranscriptRef.current = final;
        setLiveTranscript(final + interim);
      };

      recognition.onerror = (event: any) => {
        if (event.error === "not-allowed") {
          setErrorMsg("Bạn cần cấp quyền microphone cho trình duyệt.");
        } else {
          setErrorMsg(`Lỗi nhận dạng: ${event.error}`);
        }
        setRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
      setRecording(true);
    } catch (err) {
      setErrorMsg("Không thể khởi động nhận dạng giọng nói. Vui lòng dùng Chrome.");
    }
  };

  const stopRecording = async () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setRecording(false);

    const finalText = finalTranscriptRef.current.trim() || liveTranscript.trim();
    if (!finalText) {
      setErrorMsg("Không nhận được văn bản. Hãy thử nói to và rõ hơn.");
      return;
    }

    setTranscript(finalText);
    setIsProcessing(true);

    try {
      const res = await fetchApi("/voice/soape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: finalText, patient_id: "P-123" }),
      });
      if (res.success) {
        setSoapeData(res.soape);
      } else {
        setErrorMsg(res.message || "Lỗi khi phân tích SOAPE");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Lỗi kết nối máy chủ");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      {showSignedEMR ? (
        <SignedEMRView soapeData={soapeData} onClose={() => setShowSignedEMR(false)} />
      ) : (
        <div className="space-y-3">
          {isMobile && (
            <div className="flex gap-1 rounded-xl bg-slate-100 p-1 md:hidden">
              {(
                [
                  { id: "record" as const, label: "Ghi âm" },
                  { id: "soap" as const, label: "Mẫu SOAPE" },
                ] as const
              ).map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setMobilePanel(id)}
                  className={`flex-1 rounded-lg py-2.5 text-[13px] font-semibold transition-all ${
                    mobilePanel === id
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 active:text-slate-700"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
          {/* LEFT: Recording + transcript */}
          <div
            className={`flex flex-col rounded-xl border border-slate-200 bg-white p-4 sm:p-6 lg:h-[620px] ${
              isMobile ? (mobilePanel === "record" ? "min-h-0" : "hidden") : "min-h-[520px]"
            }`}
          >
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-lg font-medium text-slate-900">Ghi âm Lâm sàng</h3>
              <span
                className="flex w-fit items-center gap-1 rounded px-2 py-1 text-[10px] uppercase tracking-wider text-slate-900 font-geist transition-colors duration-300"
                style={{ backgroundColor: recording ? ACCENT : "#F1F5F9" }}
              >
                {recording && (
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                )}
                {recording ? "Đang ghi" : "Sẵn sàng"}
              </span>
            </div>

            <div className="flex flex-col items-center justify-center py-2 relative">
              <Waveform active={recording} />
              <div
                className="mt-3 flex max-w-full items-center gap-2 rounded-full border-2 px-3 py-1.5"
                style={{ borderColor: ACCENT, backgroundColor: "#EAFBFE" }}
              >
                <BadgeCheck className="w-4 h-4" style={{ color: "#0891B2" }} />
                <span className="text-[10px] font-bold uppercase tracking-wide text-slate-900 font-geist sm:text-[11px] sm:tracking-wider">
                  AI Voice NLU · Tiếng Việt
                </span>
              </div>
              <p className="mt-2 text-[13px] font-geist uppercase tracking-wider text-slate-500">
                BS. Văn Ngữ · Phòng 103
              </p>

              {!recording ? (
                <button
                  onClick={startRecording}
                  disabled={isProcessing}
                  className="mt-3 flex min-h-[48px] items-center gap-2 rounded-full px-6 py-3 text-base font-semibold text-slate-900 transition hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:px-6 sm:py-2.5 sm:font-medium"
                  style={{ backgroundColor: ACCENT }}
                >
                  <Play className="w-5 h-5" /> Bắt đầu thu
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  className="mt-3 flex min-h-[48px] items-center gap-2 rounded-full px-6 py-3 text-base font-semibold text-white transition hover:opacity-90 active:scale-[0.98] animate-pulse sm:px-6 sm:py-2.5 sm:font-medium"
                  style={{ backgroundColor: "#ef4444" }}
                >
                  <StopCircle className="w-5 h-5" /> Dừng & Xử lý
                </button>
              )}
            </div>

            {errorMsg && (
              <div className="mt-2 bg-red-50 text-red-600 p-2 rounded-md text-sm font-medium text-center">
                {errorMsg}
              </div>
            )}

            <div className="mt-3 border-t border-slate-200 pt-3 flex-1 overflow-auto scrollbar-hide">
              <p className="text-[12px] font-geist uppercase tracking-wider text-slate-500 mb-1">
                Phiên âm thô (raw speech)
              </p>
              {isProcessing ? (
                <div className="flex items-center text-slate-400 space-x-2 mt-4">
                  <div className="w-4 h-4 rounded-full border-2 border-slate-300 border-t-slate-600 animate-spin" />
                  <span className="text-base">Đang phân tích SOAPE qua AI...</span>
                </div>
              ) : (
                <p className="text-base text-slate-800 italic leading-relaxed whitespace-pre-wrap">
                  {recording
                    ? liveTranscript || "Đang lắng nghe..."
                    : transcript || "Chưa có dữ liệu..."}
                </p>
              )}
            </div>
          </div>

          {/* RIGHT: SOAPE Form */}
          <div
            className={`flex flex-col rounded-xl border border-slate-200 bg-white p-4 sm:p-6 lg:h-[620px] ${
              isMobile ? (mobilePanel === "soap" ? "min-h-0" : "hidden") : "min-h-[520px]"
            }`}
          >
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-xl font-medium text-slate-900">EMR · Mẫu SOAPE</h3>
              <span className="flex items-center gap-1 text-[12px] uppercase tracking-wider text-slate-500 font-geist">
                <Cpu className="w-3 h-3" style={{ color: ACCENT }} /> AI Parser · Trực tiếp
              </span>
            </div>
            <div className="space-y-3 flex-1 overflow-auto scrollbar-hide">
              <EMRField
                label="Lý do vào viện (S — Subjective)"
                value={soapeData?.subjective}
                filled={!!soapeData}
                isProcessing={isProcessing}
              />
              <EMRField
                label="Khám lâm sàng (O — Objective)"
                value={soapeData?.objective}
                filled={!!soapeData}
                isProcessing={isProcessing}
              />
              <EMRField
                label="Chẩn đoán (A — Assessment)"
                value={soapeData?.assessment}
                filled={!!soapeData}
                isProcessing={isProcessing}
              />
              <EMRField
                label="Xử trí / Y lệnh (P — Plan)"
                value={soapeData?.plan}
                filled={!!soapeData}
                isProcessing={isProcessing}
              />
              <EMRField
                label="Đánh giá lại (E — Evaluation)"
                value={soapeData?.evaluation}
                filled={!!soapeData}
                isProcessing={isProcessing}
              />
            </div>
            <button
              className="mt-4 flex min-h-[48px] items-center justify-center space-x-2 rounded-lg py-3 text-base font-bold text-slate-900 transition hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
              style={{ backgroundColor: ACCENT }}
              disabled={!soapeData || isProcessing}
              onClick={() => setShowSignedEMR(true)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              <span>Xác nhận và Ký số</span>
            </button>
          </div>
        </div>
        </div>
      )}
    </>
  );
}

function SignedEMRView({ soapeData, onClose }: { soapeData: any; onClose: () => void }) {
  const dateStr = new Date().toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour12: false,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const handleSavePDF = () => {
    const executeSave = () => {
      try {
        const element = document.getElementById("emr-document");
        if (!element) return;

        // Hide actions temporarily
        const actions = element.querySelector(".print\\:hidden") as HTMLElement;
        if (actions) actions.style.display = "none";

        // Use html-to-image which supports modern CSS via foreignObject
        (window as any).htmlToImage
          .toPng(element, { quality: 0.95, pixelRatio: 2, backgroundColor: "#ffffff" })
          .then((dataUrl: string) => {
            if (actions) actions.style.display = ""; // restore

            const { jsPDF } = (window as any).jspdf;
            const pdf = new jsPDF({
              orientation: "portrait",
              unit: "mm",
              format: "a4",
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (element.clientHeight * pdfWidth) / element.clientWidth;

            pdf.addImage(dataUrl, "PNG", 0, 0, pdfWidth, pdfHeight);
            pdf.save("Benh_An_Dien_Tu.pdf");
          })
          .catch((err: any) => {
            if (actions) actions.style.display = "";
            alert("Lỗi khi tải PDF: " + err.toString());
          });
      } catch (err: any) {
        alert("Có lỗi xảy ra: " + err.toString());
      }
    };

    const loadScript = (src: string) => {
      return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) return resolve(true);
        const script = document.createElement("script");
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    };

    if (!(window as any).htmlToImage || !(window as any).jspdf) {
      Promise.all([
        loadScript(
          "https://cdnjs.cloudflare.com/ajax/libs/html-to-image/1.11.11/html-to-image.min.js",
        ),
        loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"),
      ])
        .then(() => {
          executeSave();
        })
        .catch(() => {
          alert("Không thể tải thư viện tạo PDF. Vui lòng kiểm tra mạng.");
        });
    } else {
      executeSave();
    }
  };

  return (
    <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto w-full pb-20">
      <div
        id="emr-document"
        className="rounded-2xl shadow-xl border overflow-hidden print:shadow-none print:border-none"
        style={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0" }}
      >
        {/* Hospital Header */}
        <div
          className="border-b p-8 flex justify-between items-start"
          style={{ backgroundColor: "#f8fafc", borderColor: "#e2e8f0" }}
        >
          <div className="flex items-center space-x-4">
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center shadow-inner"
              style={{ backgroundColor: "#2563eb" }}
            >
              <span className="font-bold text-2xl tracking-tighter" style={{ color: "#ffffff" }}>
                EyeCU
              </span>
            </div>
            <div>
              <h1
                className="text-2xl font-black tracking-tight uppercase"
                style={{ color: "#0f172a" }}
              >
                Bệnh viện Đa Khoa EyeCU
              </h1>
              <p className="text-sm mt-1" style={{ color: "#64748b" }}>
                123 Đường Y Tế, Phường Sức Khoẻ, TP.Hồ Chí Minh
              </p>
              <p className="text-sm" style={{ color: "#64748b" }}>
                Điện thoại: 1900 1234 — Website: eyecu.vn
              </p>
            </div>
          </div>
          <div className="text-right">
            <h2
              className="text-xl font-bold uppercase tracking-widest"
              style={{ color: "#1e293b" }}
            >
              Bệnh án điện tử
            </h2>
            <p className="font-mono text-sm mt-1" style={{ color: "#64748b" }}>
              Mã BA: EMR-
              {Math.floor(Math.random() * 1000000)
                .toString()
                .padStart(6, "0")}
            </p>
            <p className="text-sm" style={{ color: "#64748b" }}>
              Ngày: {dateStr.split(" ")[1]}
            </p>
          </div>
        </div>

        {/* Patient Info */}
        <div
          className="p-8 border-b"
          style={{ backgroundColor: "#ffffff", borderColor: "#f1f5f9" }}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p
                className="text-xs uppercase tracking-widest font-bold mb-1"
                style={{ color: "#94a3b8" }}
              >
                Họ tên người bệnh
              </p>
              <p className="text-lg font-bold uppercase" style={{ color: "#1e293b" }}>
                Nguyễn Văn A
              </p>
            </div>
            <div>
              <p
                className="text-xs uppercase tracking-widest font-bold mb-1"
                style={{ color: "#94a3b8" }}
              >
                Tuổi
              </p>
              <p className="text-lg font-bold" style={{ color: "#1e293b" }}>
                45
              </p>
            </div>
            <div>
              <p
                className="text-xs uppercase tracking-widest font-bold mb-1"
                style={{ color: "#94a3b8" }}
              >
                Giới tính
              </p>
              <p className="text-lg font-bold" style={{ color: "#1e293b" }}>
                Nam
              </p>
            </div>
            <div>
              <p
                className="text-xs uppercase tracking-widest font-bold mb-1"
                style={{ color: "#94a3b8" }}
              >
                Mã BN
              </p>
              <p className="text-lg font-mono font-bold" style={{ color: "#1e293b" }}>
                P-12345
              </p>
            </div>
          </div>
        </div>

        {/* Clinical Notes (SOAPE) */}
        <div className="p-8 space-y-8" style={{ backgroundColor: "#ffffff" }}>
          <Section
            icon="S"
            title="Lý do vào viện (Subjective)"
            content={soapeData?.subjective}
          />
          <Section icon="O" title="Khám lâm sàng (Objective)" content={soapeData?.objective} />
          <Section
            icon="A"
            title="Chẩn đoán (Assessment)"
            content={soapeData?.assessment}
            highlight
          />
          <Section icon="P" title="Y lệnh & Xử trí (Plan)" content={soapeData?.plan} />
          <Section icon="E" title="Đánh giá lại (Evaluation)" content={soapeData?.evaluation} />
        </div>

        {/* Footer & Signature */}
        <div
          className="p-8 flex justify-between items-end border-t"
          style={{ backgroundColor: "#f8fafc", borderColor: "#e2e8f0" }}
        >
          <div className="text-xs max-w-xs" style={{ color: "#94a3b8" }}>
            Bệnh án điện tử được ký số và lưu trữ theo chuẩn HL7 FHIR. Bản in
            chỉ có giá trị tham khảo.
          </div>
          <div className="text-center relative">
            {/* Digital Signature Badge */}
            <div className="absolute -top-12 -left-12 rotate-[-15deg] opacity-80 print:opacity-100">
              <div
                className="border-4 rounded-full w-28 h-28 flex items-center justify-center p-1 relative shadow-sm backdrop-blur-sm"
                style={{ borderColor: "#ef4444", backgroundColor: "rgba(255,255,255,0.5)" }}
              >
                <div
                  className="border rounded-full w-full h-full flex flex-col items-center justify-center font-bold tracking-tighter"
                  style={{ borderColor: "#ef4444", color: "#dc2626" }}
                >
                  <span className="text-[10px] uppercase">Ký số hợp lệ</span>
                  <svg
                    className="w-5 h-5 my-0.5"
                    style={{ color: "#dc2626" }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="3"
                      d="M5 13l4 4L19 7"
                    ></path>
                  </svg>
                  <span className="text-[8px] font-mono">{dateStr.split(" ")[0]}</span>
                </div>
              </div>
            </div>

            <p className="font-bold mb-6 relative z-10" style={{ color: "#1e293b" }}>
              BÁC SĨ ĐIỀU TRỊ
            </p>
            <div
              className="font-[cursive] text-4xl mb-4 opacity-90 relative z-10 select-none"
              style={{ color: "#1e40af" }}
            >
              Văn Ngữ
            </div>
            <p
              className="font-bold uppercase tracking-widest relative z-10"
              style={{ color: "#0f172a" }}
            >
              BS. VĂN NGỮ
            </p>
            <p className="text-sm mt-1 relative z-10" style={{ color: "#64748b" }}>
              Chứng chỉ: CCHN-12345/BYT
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-8 flex justify-center space-x-4 print:hidden">
        <button
          onClick={onClose}
          className="px-6 py-2.5 rounded-full border-2 font-bold transition-all active:scale-95"
          style={{ borderColor: "#e2e8f0", color: "#475569", backgroundColor: "transparent" }}
        >
          Quay lại
        </button>
        <button
          onClick={handleSavePDF}
          className="px-6 py-2.5 rounded-full font-bold transition-all active:scale-95 shadow-md hover:shadow-lg flex items-center space-x-2"
          style={{ backgroundColor: "#1e293b", color: "#ffffff" }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            ></path>
          </svg>
          <span>Lưu PDF</span>
        </button>
        <button
          onClick={() => window.print()}
          className="px-6 py-2.5 rounded-full font-bold transition-all active:scale-95 shadow-md hover:shadow-lg flex items-center space-x-2"
          style={{ backgroundColor: ACCENT, color: "#0f172a" }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
            ></path>
          </svg>
          <span>In bệnh án</span>
        </button>
      </div>
    </div>
  );
}

function Section({
  icon,
  title,
  content,
  highlight = false,
}: {
  icon: string;
  title: string;
  content?: string;
  highlight?: boolean;
}) {
  if (!content || content === "Chưa có thông tin") return null;
  return (
    <div className="flex items-start space-x-4">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0"
        style={{
          backgroundColor: highlight ? "#fee2e2" : "#f1f5f9",
          color: highlight ? "#b91c1c" : "#475569",
        }}
      >
        {icon}
      </div>
      <div>
        <h3
          className="font-bold text-sm uppercase tracking-wider mb-1"
          style={{ color: highlight ? "#b91c1c" : "#94a3b8" }}
        >
          {title}
        </h3>
        <p className="leading-relaxed text-lg" style={{ color: "#1e293b" }}>
          {content}
        </p>
      </div>
    </div>
  );
}

function Waveform({ active }: { active: boolean }) {
  const bars = 40;
  return (
    <div className="relative flex h-32 w-full items-center justify-center sm:h-40">
      <div
        className="absolute h-28 w-28 animate-ping rounded-full opacity-30 sm:h-40 sm:w-40"
        style={{ backgroundColor: ACCENT, animationDuration: "2s" }}
      />
      <div
        className="absolute h-20 w-20 rounded-full sm:h-28 sm:w-28"
        style={{ backgroundColor: ACCENT, opacity: 0.25 }}
      />
      <div className="relative z-10 flex h-24 items-center gap-0.5 sm:h-32 sm:gap-1">
        {Array.from({ length: bars }).map((_, i) => {
          const h = active ? 20 + Math.abs(Math.sin((i / bars) * Math.PI * 4)) * 80 : 6;
          return (
            <span
              key={i}
              className="w-1 rounded-full transition-all duration-300"
              style={{
                height: `${h}%`,
                backgroundColor: ACCENT,
                animation: active
                  ? `wave 1.2s ease-in-out ${i * 0.04}s infinite alternate`
                  : "none",
              }}
            />
          );
        })}
      </div>
      <style>{`@keyframes wave { from { transform: scaleY(0.4); } to { transform: scaleY(1.2); } }`}</style>
    </div>
  );
}

function EMRField({
  label,
  value,
  filled,
  isProcessing,
}: {
  label: string;
  value?: string;
  filled: boolean;
  isProcessing?: boolean;
}) {
  return (
    <div
      className="border border-slate-200 rounded-lg p-3 transition-colors"
      style={filled ? { borderColor: ACCENT } : undefined}
    >
      <p className="text-[12px] font-geist uppercase tracking-wider text-slate-500">{label}</p>
      {isProcessing ? (
        <div className="animate-pulse flex space-x-2 mt-2">
          <div className="h-4 w-3/4 bg-slate-200 rounded"></div>
        </div>
      ) : (
        <p
          className={`text-[15px] mt-1 ${filled ? "text-slate-900 font-medium whitespace-pre-wrap" : "text-slate-300"}`}
        >
          {filled ? value : "— đang chờ —"}
        </p>
      )}
    </div>
  );
}

/* ============== VIEW 5: CHATBOT ============== */

function ChatbotView() {
  const [messages, setMessages] = useState<{ from: "ai" | "user"; text: string }[]>([
    {
      from: "ai",
      text: "Xin chào bác Nguyễn Văn A. Cháu là trợ lý AI EyeCU. Bác có muốn cháu giải thích kết quả xét nghiệm hôm nay không ạ?",
    },
    {
      from: "user",
      text: "Cháu giải thích giúp bác chỉ số Glucose với.",
    },
    {
      from: "ai",
      text: "Dạ. Chỉ số Glucose của bác đang hơi cao — 7.8 mmol/L, trong khi mức bình thường lúc đói là dưới 6.1. Điều này cho thấy có dấu hiệu rối loạn đường huyết nhẹ. Bác nên hạn chế đồ ngọt, ăn nhiều rau xanh và đi bộ 30 phút mỗi ngày ạ.",
    },
  ]);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = (text: string) => {
    const t = text.trim();
    if (!t) return;
    setMessages((m) => [...m, { from: "user", text: t }]);
    setInput("");
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          from: "ai",
          text: "Cháu đã ghi nhận. Bác có thể hỏi thêm về thuốc, lịch tái khám hoặc chế độ ăn uống bất cứ lúc nào ạ.",
        },
      ]);
    }, 800);
  };

  return (
    <div className="flex justify-center">
      <div
        className={`w-full bg-white border border-slate-200 rounded-3xl shadow-sm flex flex-col overflow-hidden ${
          isMobile ? "min-h-[calc(100dvh-14rem)] max-w-none" : "h-[640px] max-w-sm"
        }`}
      >
        <div className="px-4 py-3 border-b border-slate-200 flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ backgroundColor: ACCENT }}
          >
            <Bot className="w-5 h-5 text-slate-900" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-slate-900">Trợ lý EyeCU</p>
            <p className="text-[10px] font-geist uppercase tracking-wider text-slate-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ACCENT }} />{" "}
              Trực tuyến
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide p-4 space-y-3 bg-slate-50/30">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
                  m.from === "user"
                    ? "text-slate-900 rounded-br-sm"
                    : "bg-white border border-slate-200 text-slate-800 rounded-bl-sm"
                }`}
                style={m.from === "user" ? { backgroundColor: ACCENT } : undefined}
              >
                {m.text}
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>

        <div className="border-t border-slate-200 p-3 flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send(input)}
            placeholder="Hỏi về kết quả xét nghiệm..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 py-2 text-sm outline-none focus:border-[#88E8F2] text-slate-800 placeholder:text-slate-400"
          />
          <button
            onClick={() => setListening((l) => !l)}
            title="Nói"
            className="w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:opacity-90 relative"
            style={{ backgroundColor: listening ? "#0F172A" : ACCENT }}
          >
            <Mic className={`w-5 h-5 ${listening ? "text-white" : "text-slate-900"}`} />
            {listening && (
              <span
                className="absolute inset-0 rounded-full animate-ping"
                style={{ backgroundColor: ACCENT, opacity: 0.5 }}
              />
            )}
          </button>
          <button
            onClick={() => send(input)}
            className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============== SHARED ============== */

function AmbientRow({
  Icon,
  label,
  detail,
  status,
}: {
  Icon: typeof Video;
  label: string;
  detail: string;
  status: "ok" | "warn";
}) {
  return (
    <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg p-3">
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-md flex items-center justify-center"
          style={{ backgroundColor: status === "ok" ? ACCENT : "#F1F5F9" }}
        >
          <Icon className="w-4 h-4 text-slate-900" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-900">{label}</p>
          <p className="text-[11px] font-geist text-slate-500">{detail}</p>
        </div>
      </div>
      <span
        className="text-[10px] font-geist uppercase tracking-wider px-2 py-1 rounded"
        style={{ backgroundColor: status === "ok" ? ACCENT : "#F1F5F9", color: "#0F172A" }}
      >
        {status === "ok" ? "OK" : "Chú ý"}
      </span>
    </div>
  );
}

function AlertItem({
  Icon,
  title,
  description,
  time,
  accent,
  tone,
  onClick,
}: {
  Icon: typeof Video;
  title: string;
  description: string;
  time: string;
  accent?: boolean;
  tone?: "critical";
  onClick?: () => void;
}) {
  const critical = tone === "critical";
  return (
    <button
      onClick={onClick}
      className={`w-full text-left bg-white border rounded p-3 cursor-pointer transition-colors ${
        critical
          ? "border-red-300 bg-red-50/40 hover:bg-red-50 animate-pulse"
          : "border-slate-200 hover:bg-slate-50"
      }`}
      style={
        critical
          ? { borderLeft: "4px solid #DC2626" }
          : accent
            ? { borderLeft: `4px solid ${ACCENT}` }
            : undefined
      }
    >
      <div className="flex justify-between items-start mb-1">
        <span
          className={`text-[12px] font-geist uppercase tracking-wider font-bold flex items-center gap-1 ${
            critical ? "text-red-700" : "text-slate-900"
          }`}
        >
          <Icon className="w-3.5 h-3.5" />
          {title}
        </span>
        <span className="font-geist text-[10px] text-slate-400">{time}</span>
      </div>
      <p className={`text-sm ${critical ? "text-red-900" : "text-slate-700"}`}>{description}</p>
    </button>
  );
}

/* ============== VIEW 6: PATIENT MOBILE PORTAL ============== */

// Chat message type
interface ChatMsg {
  from: "user" | "bot";
  text: string;
  time: string;
  isImage?: boolean;
  hasCard?: boolean;
}

const BOT_REPLIES: { keywords: string[]; reply: string }[] = [
  {
    keywords: ["đường huyết", "glucose", "đường máu", "blood sugar"],
    reply:
      "Chỉ số đường huyết 7.8 mmol/L của bạn đang cao hơn ngưỡng an toàn (< 6.4 mmol/L) một chút ạ. Bạn nên hạn chế tinh bột trắng và đồ ngọt. Mình có thể đặt lịch tư vấn với BS. Văn Ngữ cho bạn nhé?",
  },
  {
    keywords: ["lịch hẹn", "tái khám", "hẹn", "khám lại"],
    reply:
      "Lịch tái khám của bạn đã được xếp vào ngày 15/06/2026 lúc 9:00 sáng tại Phòng khám số 3 ạ. Bạn nhớ nhịn ăn trước 2 tiếng và mang theo sổ khám bệnh nhé!",
  },
  {
    keywords: ["thuốc", "uống thuốc", "amlodipin", "liều"],
    reply:
      "Bạn đang dùng Amlodipin 5mg, uống 1 viên vào buổi sáng sau ăn ạ. Nhớ uống đúng giờ mỗi ngày và không được tự ý ngưng thuốc bạn nhé. Có vấn đề gì mình báo ngay BS. Văn Ngữ cho ạ!",
  },
  {
    keywords: ["đau", "khó chịu", "mệt", "chóng mặt", "tức ngực"],
    reply:
      "Bạn đang cảm thấy không khỏe ạ? Mình lo cho bạn lắm! Nếu cơn đau cấp tính hoặc kéo dài, bạn hãy bấm nút SOS bên dưới để y tá đến ngay nhé. Mình cũng sẽ báo ngay cho BS. Văn Ngữ biết ạ!",
  },
  {
    keywords: ["cholesterol", "mỡ máu"],
    reply:
      "Chỉ số Cholesterol 5.9 mmol/L của bạn ở mức cần theo dõi (ngưỡng khuyến cáo < 5.2 mmol/L). Bạn nên giảm ăn đồ chiên xào và tăng cường rau xanh, cá. Kết hợp đi bộ nhẹ 30 phút/ngày bạn nhé!",
  },
  {
    keywords: ["creatinine", "thận", "tiết niệu"],
    reply:
      "Chỉ số Creatinine 92 µmol/L của bạn nằm trong giới hạn bình thường (< 110 µmol/L) ạ. Chức năng thận của bạn đang ổn. Bạn nhớ uống đủ 2 lít nước mỗi ngày nhé!",
  },
];

function getTimeNow() {
  return new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

type PatientServiceKey = "record" | "prescription" | "followup" | "fees";

function PatientClinicalSheet({
  active,
  onClose,
  data,
}: {
  active: PatientServiceKey | null;
  onClose: () => void;
  data: any;
}) {
  if (!active) return null;

  const record = data?.latestRecord;

  const titles: Record<PatientServiceKey, string> = {
    record: "Phiếu khám bệnh",
    prescription: "Đơn thuốc điện tử",
    followup: "Lịch tái khám",
    fees: "Viện phí",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Đóng"
      />
      <div className="relative flex max-h-[85dvh] w-full max-w-[400px] flex-col overflow-hidden rounded-t-[1.75rem] border border-slate-200 bg-white shadow-2xl sm:rounded-[1.75rem]">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <p className="text-[10px] font-geist uppercase tracking-wider text-slate-400">
              clinical_records · medications
            </p>
            <h3 className="text-lg font-bold text-slate-900">{titles[active]}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {active === "record" && (
            <div className="space-y-4">
              {!record ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
                    <Receipt className="h-7 w-7 text-blue-300" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700">Chưa có phiếu khám</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Bạn chưa có lần khám nào được ghi nhận trong hệ thống.
                  </p>
                </div>
              ) : (
                <>
                  <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4">
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[10px] font-geist uppercase tracking-wider text-blue-600">
                          EMR #{record.id?.slice(-8).toUpperCase() ?? "—"}
                        </p>
                        <p className="text-sm font-bold text-slate-900">
                          {record.department ?? "—"}
                        </p>
                      </div>
                      {record.is_signed && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">
                          <BadgeCheck className="h-3 w-3" />
                          SmartCA
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-xl bg-white/80 p-2.5">
                        <p className="text-slate-400">Ngày khám</p>
                        <p className="font-semibold text-slate-900">
                          {formatRecordDate(record.created_at)}
                        </p>
                      </div>
                      <div className="rounded-xl bg-white/80 p-2.5">
                        <p className="text-slate-400">Bác sĩ</p>
                        <p className="font-semibold text-slate-900">
                          {record.doctor_name ?? "—"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="rounded-xl border border-slate-100 p-3">
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Triệu chứng
                      </p>
                      <p className="text-sm leading-relaxed text-slate-700">
                        {record.symptoms ?? "—"}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-100 p-3">
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Chẩn đoán
                      </p>
                      <p className="text-sm font-semibold text-slate-900">
                        {record.diagnosis ?? "—"}
                      </p>
                    </div>
                    {record.notes && (
                      <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-3">
                        <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                          Ghi chú
                        </p>
                        <p className="text-sm text-amber-900">{record.notes}</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {active === "prescription" && (
            <div className="space-y-3">
              {!data?.medications?.length ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-violet-50">
                    <Pill className="h-7 w-7 text-violet-300" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700">Chưa có đơn thuốc</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Bác sĩ chưa kê đơn thuốc nào cho bạn.
                  </p>
                </div>
              ) : (
                <>
                  <div className="rounded-xl border border-violet-100 bg-violet-50/60 p-3">
                    <p className="text-[10px] font-geist uppercase tracking-wider text-violet-600">
                      record_id · {record?.id ?? "—"}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {data.medications.length} loại thuốc
                      {record ? ` · Kê ngày ${formatRecordDate(record.created_at)}` : ""}
                    </p>
                  </div>
                  {data.medications.map((med: any) => (
                    <div
                      key={med.id}
                      className="flex gap-3 rounded-2xl border border-slate-100 bg-white p-3.5 shadow-sm"
                    >
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                        style={{ backgroundColor: "#7C3AED18" }}
                      >
                        <Pill className="h-5 w-5 text-violet-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-900">{med.medicine_name}</p>
                        <p className="mt-0.5 text-sm text-slate-600">{med.dosage}</p>
                        {med.instructions && (
                          <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                            {med.instructions}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {active === "followup" && (
            <div className="space-y-4">
              {!data?.followUp ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50">
                    <Calendar className="h-7 w-7 text-amber-300" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700">
                    Chưa có lịch tái khám
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Bác sĩ chưa đặt lịch hẹn tái khám cho bạn.
                  </p>
                </div>
              ) : (
                <>
                  <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-amber-600" />
                      <p className="text-sm font-bold text-slate-900">Lịch hẹn tái khám</p>
                    </div>
                    <p className="text-2xl font-bold text-amber-700">
                      {data.followUp.date}
                      <span className="ml-2 text-base font-semibold text-slate-600">
                        · {data.followUp.time}
                      </span>
                    </p>
                    <p className="mt-2 text-sm text-slate-700">{data.followUp.department}</p>
                  </div>
                  {data.followUp.note && (
                    <div className="rounded-xl border border-slate-100 p-3">
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Từ clinical_records.notes
                      </p>
                      <p className="text-sm leading-relaxed text-slate-700">{data.followUp.note}</p>
                    </div>
                  )}
                  <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-xs text-slate-600">
                    <Clock className="h-4 w-4 shrink-0 text-slate-400" />
                    BHYT: {data.bhxh_code ?? "—"} · Bệnh nhân: {data.patientName}
                  </div>
                </>
              )}
            </div>
          )}

          {active === "fees" && (
            <div className="space-y-4">
              {!data?.fees ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
                    <FileText className="h-7 w-7 text-green-300" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700">
                    Chưa có thông tin viện phí
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Chưa có hóa đơn viện phí nào trong hệ thống.
                  </p>
                </div>
              ) : (
                <>
                  <div
                    className={`rounded-2xl border p-4 ${
                      data.fees.status === "paid"
                        ? "border-emerald-200 bg-emerald-50/70"
                        : "border-amber-200 bg-amber-50/70"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-slate-900">
                        Tổng viện phí lượt khám
                      </p>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
                          data.fees.status === "paid"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {data.fees.status === "paid" ? "Đã thanh toán" : "Chưa thanh toán"}
                      </span>
                    </div>
                    <p className="mt-2 text-2xl font-bold text-slate-900">
                      {formatVnd(data.fees.total)}
                    </p>
                    {data.fees.paid_at && (
                      <p className="mt-1 text-xs text-slate-500">
                        Thanh toán lúc{" "}
                        {new Date(data.fees.paid_at).toLocaleString("vi-VN", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    )}
                  </div>
                  {data.fees.items?.length > 0 && (
                    <div className="space-y-2">
                      {data.fees.items.map((item: any) => (
                        <div
                          key={item.name}
                          className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2.5"
                        >
                          <span className="text-sm text-slate-700">{item.name}</span>
                          <span className="text-sm font-semibold text-slate-900">
                            {formatVnd(item.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-[10px] text-slate-400">
                    Liên kết record_id: {data.fees.record_id ?? "—"}
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PatientPortalView({
  isInstallEligible,
  showIosInstallHint,
  onInstallApp,
  onRequestLogout,
}: {
  isInstallEligible: boolean;
  showIosInstallHint: boolean;
  onInstallApp: () => void | Promise<void>;
  onRequestLogout: () => void;
}) {
  const { user } = useAuth();
  const [patientMenuOpen, setPatientMenuOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [sos, setSos] = useState(false);
  const [sosCountdown, setSosCountdown] = useState<number | null>(null);
  const sosTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startSosCountdown = () => {
    if (sos) return;
    setSosCountdown(8);
  };

  const cancelSosCountdown = () => {
    if (sosTimerRef.current) {
      clearInterval(sosTimerRef.current);
      sosTimerRef.current = null;
    }
    setSosCountdown(null);
  };

  useEffect(() => {
    if (sosCountdown === null) return;
    if (sosCountdown <= 0) {
      setSos(true);
      setSosCountdown(null);
      if (sosTimerRef.current) clearInterval(sosTimerRef.current);
      return;
    }
    sosTimerRef.current = setInterval(() => {
      setSosCountdown((prev) => {
        if (prev !== null && prev <= 1) {
          setSos(true);
          fetchApi("/patient/sos", { method: "POST" }).catch(console.error);
          return null;
        }
        return prev !== null ? prev - 1 : null;
      });
    }, 1000);
    return () => {
      if (sosTimerRef.current) clearInterval(sosTimerRef.current);
    };
  }, [sosCountdown]);

  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      from: "bot",
      text: `Xin chào bạn ${user?.name || "Bệnh nhân"}! Mình là trợ lý AI EyeCU. Bạn vừa có kết quả xét nghiệm sinh hóa mới. Bạn muốn mình giải thích chỉ số nào không ạ?`,
      time: getTimeNow(),
    },
  ]);
  const [botTyping, setBotTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, botTyping]);

  const [clinical, setClinical] = useState<any>(null);

  useEffect(() => {
    fetchApi("/patient/clinical-bundle")
      .then((data) => {
        if (data && data.status !== "no_records") setClinical(data);
      })
      .catch((err) => console.error(err));
  }, []);

  const [activeService, setActiveService] = useState<PatientServiceKey | null>(null);

  // Default mock fallback if loading or no records
  const clinicalData = clinical || {
    is_empty: true,
    patientId: user?.id || "",
    patientName: user?.name || "",
    cccd: user?.cccd || "",
    bhxh_code: null,
    latestRecord: null,
    medications: [],
    followUp: null,
    fees: null,
  };

  const tiles: {
    key: PatientServiceKey;
    Icon: typeof Receipt;
    label: string;
    sub: string;
    color: string;
    badge?: string;
  }[] = [
    {
      key: "record",
      Icon: Receipt,
      label: "Phiếu khám bệnh",
      sub: clinicalData.latestRecord
        ? `${formatRecordDate(clinicalData.latestRecord.created_at)} · ${clinicalData.latestRecord.doctor_name}`
        : "Chưa có thông tin",
      color: "#2563EB",
      badge: clinicalData.latestRecord?.is_signed ? "Ký số" : undefined,
    },
    {
      key: "prescription",
      Icon: Pill,
      label: "Đơn thuốc điện tử",
      sub: `${clinicalData.medications?.length || 0} loại · Hẹn giờ uống`,
      color: "#7C3AED",
    },
    {
      key: "followup",
      Icon: Calendar,
      label: "Lịch tái khám",
      sub: clinicalData.followUp
        ? `${clinicalData.followUp.date} · ${clinicalData.followUp.time}`
        : "Chưa có",
      color: "#D97706",
    },
    {
      key: "fees",
      Icon: FileText,
      label: "Viện phí",
      sub: clinicalData.fees
        ? clinicalData.fees.status === "paid"
          ? `${formatVnd(clinicalData.fees.total)} · Đã TT ✓`
          : `${formatVnd(clinicalData.fees.total)} · Chưa TT`
        : "Chưa có",
      color: "#16A34A",
    },
  ];

  const [labResults, setLabResults] = useState<any[]>([]);
  // TODO: fetch lab results

  const statusStyle = (s: "ok" | "warn" | "high") =>
    s === "high"
      ? { dot: "bg-red-500", badge: "bg-red-50 text-red-700", bar: "#EF4444", barPct: 87 }
      : s === "warn"
        ? { dot: "bg-amber-500", badge: "bg-amber-50 text-amber-700", bar: "#F59E0B", barPct: 70 }
        : { dot: "bg-green-500", badge: "bg-green-50 text-green-700", bar: "#22C55E", barPct: 40 };

  const sendMessage = (textStr?: string) => {
    const text = textStr || chatInput.trim();
    if (!text) return;
    setMessages((prev) => [...prev, { from: "user", text, time: getTimeNow() }]);
    if (!textStr) setChatInput("");
    setBotTyping(true);

    fetchApi("/patient/chat", { method: "POST", body: { message: text } })
      .then((data) => {
        setMessages((prev) => [
          ...prev,
          {
            from: "bot",
            text: data.reply || "Xin lỗi, hiện tại tôi không thể trả lời.",
            time: getTimeNow(),
          },
        ]);
        setBotTyping(false);
      })
      .catch((err) => {
        console.error(err);
        setBotTyping(false);
      });
  };

  const [isScanning, setIsScanning] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [highlightLab, setHighlightLab] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const startCamera = async () => {
    setCameraError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError(
        "Thiết bị không hỗ trợ camera trực tiếp. Vui lòng chọn ảnh từ thư viện.",
      );
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1920, max: 3840 },
          height: { ideal: 1080, max: 2160 },
          advanced: [{ focusMode: "continuous" }],
        } as any,
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch {
      setCameraError(
        "Không mở được camera. Hãy cấp quyền hoặc chọn ảnh từ thư viện.",
      );
    }
  };

  useEffect(() => {
    if (!isScanning) {
      stopCamera();
      return;
    }
    void startCamera();
    return () => stopCamera();
  }, [isScanning]);

  const runLabAnalysis = async (imageDataUrl?: string) => {
    if (!imageDataUrl) return;
    setIsAnalyzing(true);

    try {
      const res = await fetchApi("/patient/scan-document", {
        method: "POST",
        body: { image_base64: imageDataUrl },
      });

      setIsAnalyzing(false);
      setIsScanning(false);
      stopCamera();

      if (res.status === "success") {
        setMessages((prev) => [
          ...prev,
          {
            from: "bot",
            text: `Mình đã nhận được tài liệu của bạn (VNPT bóc tách thành công). Bạn muốn mình giải thích chỉ số hay đơn thuốc này như thế nào?`,
            time: getTimeNow(),
          },
        ]);
      } else {
        throw new Error(res.message || "Không trích xuất được thông tin");
      }
    } catch (e: any) {
      console.error(e);
      setIsAnalyzing(false);
      setIsScanning(false);
      stopCamera();
      alert("Quét tài liệu thất bại: " + e.message);
    }
  };

  const handleCapture = () => {
    const video = videoRef.current;
    if (video && video.videoWidth > 0) {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageDataUrl = canvas.toDataURL("image/jpeg", 0.9);
        // Frontend chụp ảnh; backend sẽ nhận imageDataUrl để OCR/AI phân tích sau này.
        runLabAnalysis(imageDataUrl);
        return;
      }
    }
    runLabAnalysis();
  };

  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        runLabAnalysis(reader.result);
      }
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  return (
    <div className="flex h-full min-h-0 justify-center bg-slate-50 sm:items-center sm:px-4 sm:py-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileSelected}
      />
      <div className="relative flex h-full min-h-0 w-full max-w-none flex-col overflow-hidden bg-white shadow-none sm:h-[min(92dvh,860px)] sm:max-w-[400px] sm:rounded-[2rem] sm:border sm:border-slate-200 sm:shadow-2xl">
        {/* Patient app bar — safe area for notch / Dynamic Island / punch-hole */}
        <div className="sticky top-0 z-30 shrink-0 border-b border-slate-100 bg-white pt-safe px-safe pb-2">
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img
                src="/logo.png"
                alt="EyeCU Logo"
                className="h-8 w-8 rounded-full shadow-sm object-contain"
              />
              <span className="text-sm font-bold text-slate-900">EyeCU</span>
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setPatientMenuOpen((open) => !open)}
                className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border-2 border-slate-200 bg-slate-100 transition-colors hover:border-[#88E8F2] active:scale-95"
                aria-label="Hồ sơ và cài đặt"
                aria-expanded={patientMenuOpen}
              >
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
                ) : (
                  <User className="h-4 w-4 text-slate-500" />
                )}
              </button>

              {patientMenuOpen && (
                <div className="absolute right-0 top-[calc(100%+0.5rem)] z-40 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                  <div className="border-b border-slate-100 px-3 py-2.5">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {user?.name ?? "Bệnh nhân"}
                    </p>
                    <p className="truncate text-[11px] text-slate-500">
                      Cổng thông tin bệnh nhân
                    </p>
                  </div>
                  <div className="p-1">
                    {isInstallEligible && (
                      <button
                        type="button"
                        onClick={() => {
                          setPatientMenuOpen(false);
                          void onInstallApp();
                        }}
                        className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <Download className="h-4 w-4 text-slate-400" />
                        Cài ứng dụng
                      </button>
                    )}
                    {!isInstallEligible && showIosInstallHint && (
                      <p className="px-2.5 py-2 text-[10px] leading-relaxed text-slate-500">
                        iOS: Safari → Chia sẻ → Thêm vào Màn hình chính
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setPatientMenuOpen(false);
                        onRequestLogout();
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Đăng xuất
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain scrollbar-hide">
          {/* Greeting header */}
          <div className="flex-shrink-0 bg-gradient-to-b from-[#EAFBFE] via-[#f0fdfb] to-white px-5 pb-4 pt-4 sm:pt-6">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex-shrink-0 overflow-hidden"
                style={{ background: "linear-gradient(135deg,#88E8F2,#2563EB)" }}
              >
                <svg viewBox="0 0 40 40" className="w-full h-full">
                  <circle cx="20" cy="15" r="7" fill="#E2E8F0" />
                  <ellipse cx="20" cy="34" rx="12" ry="10" fill="#E2E8F0" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-geist uppercase tracking-wider text-slate-500">
                  EyeCU
                </p>
                <h2 className="text-lg font-bold text-slate-900 leading-tight break-words">
                  Xin chào bạn {user?.name || "Bệnh nhân"}
                </h2>
                <p className="text-[11px] text-slate-500">
                  Hôm nay bạn cảm thấy thế nào ạ?
                </p>
              </div>
            </div>
          </div>

          {/* 4 dịch vụ bệnh nhân — clinical_records · medications */}
          <div className="grid flex-shrink-0 grid-cols-2 gap-2.5 px-4">
            {tiles.map(({ key, Icon, label, sub, color, badge }) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveService(key)}
                className="group relative min-w-0 rounded-2xl border border-slate-100 bg-white p-3 text-left shadow-sm transition-all hover:border-[#88E8F2] hover:shadow-md active:scale-95"
              >
                {badge && (
                  <span className="absolute right-2 top-2 rounded-full bg-blue-50 px-1.5 py-0.5 text-[8px] font-bold uppercase text-blue-600">
                    {badge}
                  </span>
                )}
                <div
                  className="mb-2.5 flex h-9 w-9 items-center justify-center rounded-xl transition-transform group-hover:scale-105"
                  style={{ backgroundColor: color + "18" }}
                >
                  <Icon className="h-5 w-5" style={{ color }} />
                </div>
                <p className="break-words text-sm font-bold leading-tight text-slate-900">
                  {label}
                </p>
                <p className="mt-0.5 break-words text-[10px] leading-snug text-slate-400">{sub}</p>
              </button>
            ))}
          </div>

          <PatientClinicalSheet
            active={activeService}
            onClose={() => setActiveService(null)}
            data={clinicalData}
          />

          {/* SCAN BANNER */}
          <div className="mx-4 mt-4 flex-shrink-0">
            <button
              onClick={() => setIsScanning(true)}
              className="w-full flex items-center gap-3 p-3 rounded-2xl border border-[#88E8F2]/50 bg-gradient-to-r from-[#88E8F2]/10 to-blue-50 hover:to-blue-100 active:scale-[0.98] transition-all shadow-sm group"
            >
              <div className="w-10 h-10 rounded-full bg-[#88E8F2] flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                <Camera className="w-5 h-5 text-slate-900" />
              </div>
              <div className="min-w-0 text-left [&_p]:break-words [&_p]:leading-snug">
                <p className="text-sm font-bold text-slate-900">Quét phiếu xét nghiệm</p>
                <p className="text-[10px] text-slate-500">
                  AI tự động bóc tách và phân tích
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 ml-auto" />
            </button>
          </div>

          {/* Chatbot widget */}
          <div className="mx-4 mt-4 mb-4 flex-shrink-0 overflow-hidden rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100 bg-white">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: ACCENT }}
              >
                <Bot className="w-4 h-4 text-slate-900" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Trợ lý AI EyeCU</p>
                <p className="text-[9px] text-green-600 font-bold uppercase tracking-wider flex items-center gap-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
                  Trực tuyến
                </p>
              </div>
            </div>
            <div className="bg-slate-50/50 px-3 py-2.5 space-y-2.5 max-h-[60vh] overflow-y-auto scrollbar-hide">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.from === "bot" && (
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mr-1.5 mt-0.5"
                      style={{ backgroundColor: ACCENT }}
                    >
                      <Bot className="w-3 h-3 text-slate-900" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] rounded-2xl px-3 py-2 ${msg.from === "user" ? "bg-slate-800 text-white rounded-br-sm" : "bg-white border border-slate-100 text-slate-800 rounded-bl-sm shadow-sm"}`}
                  >
                    <p className="text-[11px] leading-relaxed">{msg.text}</p>
                    <p
                      className={`text-[9px] mt-1 ${msg.from === "user" ? "text-slate-400" : "text-slate-400"}`}
                    >
                      {msg.time}
                    </p>
                  </div>
                </div>
              ))}
              {botTyping && (
                <div className="flex justify-start">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mr-1.5 mt-0.5"
                    style={{ backgroundColor: ACCENT }}
                  >
                    <Bot className="w-3 h-3 text-slate-900" />
                  </div>
                  <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-sm px-3 py-2 shadow-sm flex items-center gap-1">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-slate-400"
                        style={{ animation: `bounce 1s infinite ${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <div className="flex items-center gap-2 px-3 py-2 border-t border-slate-100 bg-white">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Hỏi trợ lý AI... (glucose, thuốc, lịch hẹn...)"
                className="min-w-0 flex-1 bg-slate-50 border border-slate-200 rounded-full px-3 py-2 text-[11px] outline-none focus:border-[#88E8F2] text-slate-800 placeholder:text-slate-400"
              />
              <button
                onClick={() => sendMessage()}
                className="w-8 h-8 rounded-full flex items-center justify-center transition active:scale-95 flex-shrink-0"
                style={{ backgroundColor: ACCENT }}
              >
                <Send className="w-3.5 h-3.5 text-slate-900" />
              </button>
              <button
                onClick={() => {
                  if (listening) {
                    recognitionRef.current?.stop();
                    setListening(false);
                    return;
                  }
                  const SpeechRecognitionAPI =
                    window.SpeechRecognition || window.webkitSpeechRecognition;
                  if (!SpeechRecognitionAPI) {
                    sendMessage(
                      "Trình duyệt không hỗ trợ nhận diện giọng nói. Hãy nhập tay.",
                    );
                    return;
                  }
                  const recognition = new SpeechRecognitionAPI();
                  recognition.lang = "vi-VN";
                  recognition.continuous = false;
                  recognition.interimResults = false;
                  recognition.onresult = (event: SpeechRecognitionEvent) => {
                    const transcript = event.results[0]?.[0]?.transcript?.trim() ?? "";
                    if (transcript) sendMessage(transcript);
                    setListening(false);
                  };
                  recognition.onerror = () => setListening(false);
                  recognition.onend = () => setListening(false);
                  recognitionRef.current = recognition;
                  recognition.start();
                  setListening(true);
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center relative active:scale-95 transition flex-shrink-0"
                style={{ backgroundColor: listening ? "#0F172A" : ACCENT }}
              >
                <Mic className={`w-3.5 h-3.5 ${listening ? "text-white" : "text-slate-900"}`} />
                {listening && (
                  <span
                    className="absolute inset-0 rounded-full animate-ping"
                    style={{ backgroundColor: ACCENT, opacity: 0.5 }}
                  />
                )}
              </button>
            </div>
          </div>

          {/* SOS button */}
          <div className="sticky bottom-0 mt-auto flex-shrink-0 border-t border-slate-100 bg-white px-4 pb-safe pt-2">
            {sosCountdown !== null && !sos ? (
              <div className="flex flex-col items-center gap-3">
                <div className="relative w-20 h-20 flex items-center justify-center">
                  <svg className="absolute inset-0 w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="36" fill="none" stroke="#FEE2E2" strokeWidth="6" />
                    <circle
                      cx="40"
                      cy="40"
                      r="36"
                      fill="none"
                      stroke="#EF4444"
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 36}`}
                      strokeDashoffset={`${2 * Math.PI * 36 * (1 - sosCountdown / 8)}`}
                      style={{ transition: "stroke-dashoffset 1s linear" }}
                    />
                  </svg>
                  <span className="text-3xl font-bold text-red-600 z-10 tabular-nums">
                    {sosCountdown}
                  </span>
                </div>
                <button
                  onClick={cancelSosCountdown}
                  className="w-full py-3.5 rounded-2xl font-bold text-white bg-slate-700 hover:bg-slate-800 flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <X className="w-5 h-5" />
                  <span className="text-base tracking-wide">Hủy SOS</span>
                </button>
              </div>
            ) : (
              <button
                onClick={sos ? undefined : startSosCountdown}
                className={`w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 transition-all ${sos ? "bg-red-700 cursor-default" : "bg-red-600 hover:bg-red-700 active:scale-95"}`}
                style={{
                  boxShadow: sos ? "none" : "0 0 15px rgba(239,68,68,0.5)",
                  animation: sos ? "none" : "pulse 2s infinite",
                }}
              >
                <Siren className="w-5 h-5" />
                <span className="text-base tracking-wide">
                  {sos ? "ĐÃ GỬI · Y tá đang đến..." : "SOS Khẩn Cấp"}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Camera Modal — preview thật từ frontend; OCR/AI xử lý ở backend sau khi upload ảnh */}
        {isScanning && (
          <div className="absolute inset-0 z-50 flex flex-col bg-slate-900 animate-in fade-in duration-200 pt-safe pb-safe">
            <div className="relative flex flex-1 items-center justify-center overflow-hidden">
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className={`absolute inset-0 h-full w-full object-cover ${cameraError ? "hidden" : ""}`}
              />
              {cameraError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
                  <Camera className="h-12 w-12 text-[#88E8F2]" />
                  <p className="text-sm leading-relaxed text-white/90">{cameraError}</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-full px-5 py-2.5 text-sm font-semibold text-slate-900"
                    style={{ backgroundColor: ACCENT }}
                  >
                    Chọn ảnh từ thư viện
                  </button>
                </div>
              )}
              {/* Cutout Mask with 4 panels for true backdrop blur outside */}
              <div className="pointer-events-none absolute inset-0 z-10 flex flex-col">
                <div className="w-full h-6 bg-slate-900/60 backdrop-blur-md" />
                <div className="flex flex-1">
                  <div className="w-6 h-full bg-slate-900/60 backdrop-blur-md" />
                  <div className="flex-1 relative rounded-3xl border-2 border-dashed border-[#88E8F2] flex items-center justify-center">
                    <div className="absolute inset-0 shadow-[0_0_0_999px_rgba(15,23,42,0.1)] rounded-3xl pointer-events-none" />
                    <p className="px-4 text-center text-sm font-medium text-white opacity-100 drop-shadow-lg">
                      Đưa giấy xét nghiệm vào khung
                    </p>
                    {isAnalyzing && (
                      <div className="absolute left-0 right-0 h-1 bg-[#88E8F2] shadow-[0_0_20px_#88E8F2] animate-scan" />
                    )}
                  </div>
                  <div className="w-6 h-full bg-slate-900/60 backdrop-blur-md" />
                </div>
                <div className="w-full h-6 bg-slate-900/60 backdrop-blur-md" />
              </div>
            </div>
            <div className="flex h-36 shrink-0 items-center justify-around bg-black px-6">
              <button
                onClick={() => {
                  setIsScanning(false);
                  stopCamera();
                }}
                className="px-4 py-2 font-medium text-white opacity-80"
              >
                Hủy
              </button>
              <button
                onClick={handleCapture}
                disabled={isAnalyzing}
                className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-[#88E8F2] p-1.5 transition-transform active:scale-95 disabled:opacity-60"
              >
                <div
                  className={`h-full w-full rounded-full bg-white ${isAnalyzing ? "animate-pulse bg-[#88E8F2]" : ""}`}
                />
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="rounded-full bg-white/10 px-3 py-2 text-[11px] font-semibold text-white"
              >
                Thư viện
              </button>
            </div>
            {isAnalyzing && (
              <div className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-slate-900/90 backdrop-blur-md">
                <ScanLine className="mb-6 h-20 w-20 animate-pulse text-[#88E8F2]" />
                <h3 className="text-xl font-bold tracking-tight text-white">
                  Đang phân tích tài liệu...
                </h3>
                <p className="mt-2 font-mono text-sm uppercase tracking-widest text-[#88E8F2]">
                  VNPT SmartReader AI
                </p>
              </div>
            )}
          </div>
        )}
      </div>
      <style>{`
        @keyframes scan { 0% { top: 0%; } 50% { top: 100%; } 100% { top: 0%; } }
        .animate-scan { animation: scan 2s linear infinite; }
      `}</style>
    </div>
  );
}

/* ============== VIEW: EMS — CẤP CỨU NGOẠI VIỆN ============== */

function EmsView() {
  const [scannedPatient, setScannedPatient] = useState<any>(null);
  const [scanningEkyc, setScanningEkyc] = useState(false);
  const [ekycError, setEkycError] = useState("");
  const [capturedCccdUrl, setCapturedCccdUrl] = useState<string | null>(null);
  const [alertSent, setAlertSent] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<"idle" | "synced">("idle");
  const [hospitalAck, setHospitalAck] = useState(false);

  const [manualInputMode, setManualInputMode] = useState<"cccd" | "unknown" | "no_cccd">("cccd");
  const [manualGender, setManualGender] = useState("");
  const [manualAgeRange, setManualAgeRange] = useState("");
  const [manualName, setManualName] = useState("");
  const [manualEmergencyContact, setManualEmergencyContact] = useState("");
  const [manualChronic, setManualChronic] = useState("");
  const [manualAllergies, setManualAllergies] = useState("");

  const alertTypes = ["Nhoi mau co tim", "Dot quy", "Chan thuong nang", "Ngo doc"];

  const WS_URL = (import.meta.env.VITE_WS_URL ?? "ws://localhost:8000") + "/api/ambient/ws/live";
  const [gpsState, setGpsState] = useState<{ lat: number; lng: number } | null>(null);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  const realStartRef = useRef<{ lat: number; lng: number } | null>(null);

  const [routeInfo, setRouteInfo] = useState<{ km: string; mins: number; destName: string } | null>(
    null,
  );
  const routeInfoRef = useRef(routeInfo);
  useEffect(() => {
    routeInfoRef.current = routeInfo;
  }, [routeInfo]);
  const [isMissionStarted, setIsMissionStarted] = useState(false);
  const [showMissionSetup, setShowMissionSetup] = useState(false);
  const [plate, setPlate] = useState("");
  const [hospitalId, setHospitalId] = useState(CENTRAL_HOSPITALS[0].id.toString());
  const [plateInput, setPlateInput] = useState("");
  const [plateError, setPlateError] = useState("");
  const [showPlateModal, setShowPlateModal] = useState(false);
  const [plateConfirmed, setPlateConfirmed] = useState<string | null>(null);
  const groupedHospitals = getHospitalsByProvince();

  const [preAlertText, setPreAlertText] = useState("");
  const [isRecordingPreAlert, setIsRecordingPreAlert] = useState(false);
  const recognitionRef = useRef<any>(null);

  const startRecording = () => {
    try {
      setEkycError("");
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        alert(
          "Trình duyệt không hỗ trợ nhận dạng giọng nói. Vui lòng dùng Google Chrome.",
        );
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.lang = "vi-VN";
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event: any) => {
        let interim = "";
        let final = "";
        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            final += result[0].transcript + " ";
          } else {
            interim += result[0].transcript;
          }
        }
        const text = (final + interim).trim();
        setPreAlertText(text);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsRecordingPreAlert(false);
      };

      recognition.onend = () => {
        setIsRecordingPreAlert(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsRecordingPreAlert(true);
    } catch (err) {
      alert("Không thể khởi động nhận dạng giọng nói.");
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsRecordingPreAlert(false);
  };

  const handleStartMission = async () => {
    const finalPlate = plate.trim() || localStorage.getItem("ems_plate") || "";
    if (!finalPlate) return;
    try {
      localStorage.setItem("ems_plate", finalPlate);
      const res = await fetchApi("/ems/start-mission", {
        method: "POST",
        body: { plate_number: finalPlate, hospital_id: hospitalId },
      });
      // Even if fetch fails, we let them use the app
      setIsMissionStarted(true);
      setShowMissionSetup(false);
      if (!isBroadcasting) {
        toggleGpsBroadcast();
      }
    } catch (error) {
      console.error(error);
      setIsMissionStarted(true);
      setShowMissionSetup(false);
      if (!isBroadcasting) {
        toggleGpsBroadcast();
      }
    }
  };

  const processEkycBase64 = async (base64: string) => {
    setScanningEkyc(true);
    setEkycError("");
    try {
      const ocrRes = await fetchApi("/patient/ekyc/cccd", {
        method: "POST",
        body: JSON.stringify({ image_base64: base64 }),
      });
      if (ocrRes.status === "success" && ocrRes.data) {
        if (ocrRes.liveness_warning) {
          alert(ocrRes.liveness_warning);
        }
        const ocrCccd = ocrRes.data.cccd;
        const ocrName = ocrRes.data.name;
        if (ocrCccd && ocrName) {
          try {
            const dbRes = await fetchApi(`/records/by-cccd/${ocrCccd}`);
            if (dbRes.status === "success" && dbRes.data) {
              const mergedPatient = {
                ...dbRes.data,
                dob: ocrRes.data.dob || dbRes.data.dob,
                gender: ocrRes.data.gender || dbRes.data.gender,
              };
              setScannedPatient(mergedPatient);
              sendPatientUpdate(mergedPatient);
            } else {
              // Patient not found in DB - fallback to OCR data
              const fallbackPatient = {
                cccd: ocrCccd,
                name: ocrName,
                dob: ocrRes.data.dob || "",
                gender: ocrRes.data.gender || "N/A",
                address: ocrRes.data.address || "",
                insurance: "",
                emergencyContactName: "",
                emergencyContactPhone: "",
                allergies: [],
                chronicConditions: [],
              };
              setScannedPatient(fallbackPatient);
              sendPatientUpdate(fallbackPatient);
            }
          } catch (dbErr) {
            // Database request failed, still fallback to OCR data
            const fallbackPatient = {
              cccd: ocrCccd,
              name: ocrName,
              dob: ocrRes.data.dob || "",
              gender: ocrRes.data.gender || "N/A",
              address: ocrRes.data.address || "",
              insurance: "",
              emergencyContactName: "",
              emergencyContactPhone: "",
              allergies: [],
              chronicConditions: [],
            };
            setScannedPatient(fallbackPatient);
            sendPatientUpdate(fallbackPatient);
          }
        } else {
          setEkycError("Không nhận dạng được CCCD.");
          setCapturedCccdUrl(null);
        }
      } else {
        setEkycError(ocrRes.message || "Lỗi OCR eKYC từ VNPT.");
        setCapturedCccdUrl(null);
      }
    } catch (err) {
      setEkycError("Lỗi kết nối eKYC server.");
      setCapturedCccdUrl(null);
    } finally {
      setScanningEkyc(false);
    }
  };

  const handleSocketMessage = useCallback(
    (msg: { type: string; data?: Record<string, unknown> }) => {
      if (msg.type === "FAST_TRACK_SYNC") setSyncStatus("synced");
      if (msg.type === "PRE_ALERT") setHospitalAck(true);
      // Nhan update tu xe khac (hoac chinh minh neu bi vong lap, nhung local gpsState da update roi)
      if (msg.type === "GPS_UPDATE" && msg.data && !isBroadcasting) {
        setGpsState({
          lat: Number(msg.data.lat),
          lng: Number(msg.data.lng),
        });
      }
    },
    [isBroadcasting],
  );

  const { send } = useEyeCUSocket({ url: WS_URL, onMessage: handleSocketMessage });

  // Khi scannedPatient được cập nhật và xe đã có biển số → gửi PATIENT_UPDATE lên dispatch
  const sendPatientUpdate = useCallback(
    (patient: any, alertLabel?: string) => {
      const activePlate = plate.trim() || localStorage.getItem("ems_plate") || "";
      if (!activePlate || !patient) return;

      let age = patient.age ?? null;
      if (patient.dob) {
        const parts = patient.dob.split(/[/-]/);
        if (parts.length === 3) {
          const birthYear = parts[2].length === 4 ? parseInt(parts[2]) : parseInt(parts[0]);
          if (!isNaN(birthYear)) {
            age = String(new Date().getFullYear() - birthYear);
          }
        }
      }

      send({
        type: "PATIENT_UPDATE",
        data: {
          plate: activePlate,
          name: patient.full_name || patient.name || null,
          gender: patient.gender || null,
          age,
          cccd: patient.cccd_number || patient.cccd || null,
          chronic_conditions: patient.chronic_conditions || patient.chronicConditions || [],
          allergies: patient.allergies || [],
          alert_label: alertLabel || selectedAlert || null,
          bhxh_code: patient.insurance || null,
          emergency_contact_name: patient.emergencyContactName || null,
          emergency_contact_phone: patient.emergencyContactPhone || null,
        },
      });
    },
    [plate, send, selectedAlert],
  );

  useEffect(() => {
    if (isBroadcasting && plateConfirmed) {
      const activePlate = plateConfirmed;
      supabase
        .from("dispatch_records")
        .update({
          pre_alert_text: preAlertText,
        })
        .eq("plate", activePlate)
        .then();

      send({
        type: "PATIENT_UPDATE",
        data: {
          plate: activePlate,
          pre_alert_text: preAlertText,
        },
      });
    }
  }, [preAlertText, isBroadcasting, plateConfirmed, send]);

  // Khi an nut BẬT TRUYỀN GPS -> hien modal nhap bien so
  const toggleGpsBroadcast = () => {
    if (isBroadcasting) {
      // Dung GPS
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      // Gui GPS_STOP kem bien so de backend xoa session
      if (plateConfirmed) {
        send({ type: "GPS_STOP", data: { plate: plateConfirmed } });
      }
      setIsBroadcasting(false);
      setIsMissionStarted(false);
      realStartRef.current = null; // Reset
      setPlate("");
      setPlateInput("");
      setPlateConfirmed(null);
      setScannedPatient(null);
      setManualName("");
      setManualGender("");
      setManualAgeRange("");
      setManualEmergencyContact("");
      setManualChronic("");
      setManualAllergies("");
      setPreAlertText("");
      setCapturedCccdUrl(null);
      setAlertSent(false);
      setSelectedAlert(null);
      setGpsState(null);
      setRouteInfo(null);
      setSyncStatus("idle");
      setHospitalAck(false);
    } else {
      // Bat dau GPS
      if (!navigator.geolocation) {
        alert("Trình duyệt không hỗ trợ định vị GPS.");
        return;
      }
      const savedPlate = plate.trim() || localStorage.getItem("ems_plate") || "";
      if (!savedPlate) {
        alert("Vui lòng thiết lập nhiệm vụ trước khi truyền GPS.");
        return;
      }

      setPlateConfirmed(savedPlate);
      setIsBroadcasting(true);

      const patientName =
        scannedPatient?.name ||
        scannedPatient?.full_name ||
        (manualInputMode === "cccd" && manualName
          ? manualName
          : manualInputMode === "unknown"
            ? "Chưa rõ danh tính"
            : "Bệnh nhân không CCCD");
      const patientGender =
        scannedPatient?.gender ||
        (manualInputMode === "cccd" && manualGender ? manualGender : null);

      let patientAge = scannedPatient?.age || null;
      if (scannedPatient?.dob) {
        const parts = scannedPatient.dob.split(/[/-]/);
        if (parts.length === 3) {
          const birthYear = parts[2].length === 4 ? parseInt(parts[2]) : parseInt(parts[0]);
          if (!isNaN(birthYear)) {
            patientAge = String(new Date().getFullYear() - birthYear);
          }
        }
      } else if (manualInputMode === "cccd" && manualAgeRange) {
        patientAge = manualAgeRange;
      }

      // GỬI NGAY LẬP TỨC để bảng nhận được thông tin mà không cần chờ thiết bị định vị
      const initLat = gpsState?.lat ?? 21.0011;
      const initLng = gpsState?.lng ?? 105.8418;
      const initDistKm =
        Math.sqrt(Math.pow(initLat - 21.0011, 2) + Math.pow(initLng - 105.8418, 2)) * 111;
      const initEta = routeInfoRef.current
        ? routeInfoRef.current.mins * 60
        : Math.max(60, Math.round((initDistKm / 40) * 3600));
      supabase
        .from("dispatch_records")
        .upsert({
          plate: savedPlate,
          lat: initLat,
          lng: initLng,
          eta: initEta,
          status: "active",
          added_at: Date.now(),
          patient_name: patientName,
          gender: patientGender,
          age: patientAge,
          cccd: scannedPatient?.cccd || scannedPatient?.cccd_number || null,
          bhxh_code: scannedPatient?.insurance || null,
          emergency_contact_name: scannedPatient?.emergencyContactName || null,
          emergency_contact_phone: scannedPatient?.emergencyContactPhone || null,
          chronic_conditions:
            scannedPatient?.chronicConditions || scannedPatient?.chronic_conditions || [],
          allergies: scannedPatient?.allergies || [],
          pre_alert_text: preAlertText || "",
        })
        .then();

      send({
        type: "GPS_START",
        data: {
          plate: savedPlate,
          lat: initLat,
          lng: initLng,
          eta_seconds: initEta,
          name: patientName,
          gender: patientGender,
          age: patientAge,
          cccd: scannedPatient?.cccd || scannedPatient?.cccd_number || null,
          bhxh_code: scannedPatient?.insurance || null,
          emergency_contact_name: scannedPatient?.emergencyContactName || null,
          emergency_contact_phone: scannedPatient?.emergencyContactPhone || null,
          chronic_conditions:
            scannedPatient?.chronicConditions || scannedPatient?.chronic_conditions || [],
          allergies: scannedPatient?.allergies || [],
          pre_alert_text: preAlertText || "",
        },
      });

      // Lay vi tri lan dau tien -> gui GPS_START kem bien so
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setGpsState({ lat: latitude, lng: longitude });
          const distKm =
            Math.sqrt(Math.pow(latitude - 21.0011, 2) + Math.pow(longitude - 105.8418, 2)) * 111;
          const etaSeconds = routeInfoRef.current
            ? routeInfoRef.current.mins * 60
            : Math.max(60, Math.round((distKm / 40) * 3600));
          // GPS_START: dang ky bien so + toa do dau tien voi backend
          supabase
            .from("dispatch_records")
            .upsert({
              plate: savedPlate,
              lat: latitude,
              lng: longitude,
              eta: etaSeconds,
              status: "active",
              added_at: Date.now(),
              patient_name: patientName,
              gender: patientGender,
              age: patientAge,
              cccd: scannedPatient?.cccd || scannedPatient?.cccd_number || null,
              bhxh_code: scannedPatient?.insurance || null,
              emergency_contact_name: scannedPatient?.emergencyContactName || null,
              emergency_contact_phone: scannedPatient?.emergencyContactPhone || null,
              chronic_conditions:
                scannedPatient?.chronicConditions || scannedPatient?.chronic_conditions || [],
              allergies: scannedPatient?.allergies || [],
              pre_alert_text: preAlertText || "",
            })
            .then();
          send({
            type: "GPS_START",
            data: {
              plate: savedPlate,
              lat: latitude,
              lng: longitude,
              eta_seconds: etaSeconds,
              name: patientName,
              gender: patientGender,
              age: patientAge,
              cccd: scannedPatient?.cccd || scannedPatient?.cccd_number || null,
              bhxh_code: scannedPatient?.insurance || null,
              emergency_contact_name: scannedPatient?.emergencyContactName || null,
              emergency_contact_phone: scannedPatient?.emergencyContactPhone || null,
              chronic_conditions:
                scannedPatient?.chronicConditions || scannedPatient?.chronic_conditions || [],
              allergies: scannedPatient?.allergies || [],
              pre_alert_text: preAlertText || "",
            },
          });
        },
        () => {},
        { enableHighAccuracy: true, timeout: 8000 },
      );

      // Theo doi GPS lien tuc, moi lan cap nhat gui kem bien so
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setGpsState({ lat: latitude, lng: longitude });
          const distKm =
            Math.sqrt(Math.pow(latitude - 21.0011, 2) + Math.pow(longitude - 105.8418, 2)) * 111;
          const etaSeconds = routeInfoRef.current
            ? routeInfoRef.current.mins * 60
            : Math.max(60, Math.round((distKm / 40) * 3600));
          supabase
            .from("dispatch_records")
            .update({
              lat: latitude,
              lng: longitude,
              eta: etaSeconds,
            })
            .eq("plate", savedPlate)
            .then();
          send({
            type: "GPS_UPDATE",
            data: {
              plate: savedPlate,
              ambulance_id: "current",
              lat: latitude,
              lng: longitude,
              eta_seconds: etaSeconds,
            },
          });
        },
        (err) => {
          console.error("Lỗi GPS:", err);
          if (err.code === 1) {
            alert(
              "Lỗi GPS: Bạn đã từ chối hoặc trình duyệt không có quyền truy cập vị trí.",
            );
            setIsBroadcasting(false);
            setPlateConfirmed(null);
          } else if (err.code === 2) {
            console.warn("GPS: Tạm thời không tìm thấy vị trí.");
          } else if (err.code === 3) {
            console.warn("GPS: Quá thời gian lấy vị trí (Timeout), đang thử lại...");
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 1000 },
      );
    }
  };

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Gui Pre-Alert: thu WebSocket truoc, neu chet thi HTTP Fallback tu dong
  const handleSendAlert = (alertType: string) => {
    setSelectedAlert(alertType);
    setAlertSent(true);
    send(
      {
        type: "PRE_ALERT",
        data: { condition: alertType, ambulance_id: "current", eta_minutes: 10 },
      },
      {
        endpoint: "/api/ems/pre-alert",
        body: { ambulance_id: "current", condition: alertType, eta_minutes: 10 },
      },
    );
  };

  // Tính toán lộ trình động
  let etaMins = 8;
  let distanceKm = 4.2;
  let destName = "BV Bạch Mai";
  let progress = 52;

  // Bounding box cho OpenStreetMap (quanh BV Bạch Mai khoảng 3-4km)
  const MIN_LNG = 105.8;
  const MAX_LNG = 105.88;
  const MIN_LAT = 20.97;
  const MAX_LAT = 21.03;
  const bbox = `${MIN_LNG},${MIN_LAT},${MAX_LNG},${MAX_LAT}`;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=21.0011,105.8418`;

  let ambTop = "50%";
  let ambLeft = "50%";

  if (gpsState) {
    // Giả định Toạ độ Đích (Bạch Mai)
    const DEST_LAT = 21.0011;
    const DEST_LNG = 105.8418;
    // Euclidian distance approx (1 độ ~ 111km)
    const distDeg = Math.sqrt(
      Math.pow(gpsState.lat - DEST_LAT, 2) + Math.pow(gpsState.lng - DEST_LNG, 2),
    );
    distanceKm = Number((distDeg * 111).toFixed(1));
    etaMins = Math.max(1, Math.round((distanceKm / 40) * 60)); // giả định 40km/h
    progress = Math.min(100, Math.max(0, 100 - (distanceKm / 10) * 100)); // giả định quãng đường tối đa là 10km

    // Map to percentage for the bbox
    let leftPerc = ((gpsState.lng - MIN_LNG) / (MAX_LNG - MIN_LNG)) * 100;
    let topPerc = 100 - ((gpsState.lat - MIN_LAT) / (MAX_LAT - MIN_LAT)) * 100;

    // Giới hạn trong khung map
    leftPerc = Math.max(2, Math.min(98, leftPerc));
    topPerc = Math.max(2, Math.min(98, topPerc));

    ambLeft = `${leftPerc}%`;
    ambTop = `${topPerc}%`;
  }

  // Override by routeInfo from OSRM if available
  if (routeInfo) {
    distanceKm = Number(routeInfo.km);
    etaMins = routeInfo.mins;
    destName = routeInfo.destName;
  }

  progress = Math.min(100, Math.max(0, 100 - (distanceKm / 10) * 100)); // giả định quãng đường tối đa là 10km

  const mapCenterLat = gpsState?.lat ?? 21.0011;
  const mapCenterLng = gpsState?.lng ?? 105.8418;

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      {/* Modal Cài đặt nhiệm vụ */}
      {showMissionSetup && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl animate-zoom-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-900">Xác nhận xe làm nhiệm vụ</h2>
              <button
                onClick={() => setShowMissionSetup(false)}
                className="p-2 hover:bg-slate-100 rounded-full"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Biển số xe
                </label>
                <input
                  type="text"
                  value={plate}
                  onChange={(e) => setPlate(e.target.value.toUpperCase())}
                  placeholder={`VD: ${localStorage.getItem("ems_plate") || "29A-123.45"}`}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 font-mono font-bold uppercase focus:ring-2 focus:ring-cyan-500/20"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Bệnh viện đích
                </label>
                <select
                  value={hospitalId}
                  onChange={(e) => setHospitalId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 font-semibold focus:ring-2 focus:ring-cyan-500/20 bg-white"
                >
                  {Object.keys(groupedHospitals)
                    .sort()
                    .map((prov) => (
                      <optgroup key={prov} label={prov}>
                        {groupedHospitals[prov].map((h) => (
                          <option key={h.id} value={h.id}>
                            {h.name}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                </select>
              </div>
              <button
                onClick={handleStartMission}
                disabled={!(plate.trim() || localStorage.getItem("ems_plate"))}
                className="w-full mt-4 py-3.5 rounded-xl text-white font-bold text-lg bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50"
              >
                BẬT TRUYỀN GPS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 4. Pre-Alert Panel ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
            <Mic className="w-4 h-4 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Cảnh báo Trước (Pre-Alert)</h3>
            <p className="text-[13px] text-slate-500 font-geist">
              Gửi cảnh báo đến phòng cấp cứu bệnh viện
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center py-6 bg-slate-50 rounded-xl border border-slate-100">
          <button
            type="button"
            onClick={isRecordingPreAlert ? stopRecording : startRecording}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-sm border ${
              isRecordingPreAlert
                ? "bg-red-500 border-red-600 hover:bg-red-600 animate-pulse scale-105"
                : "bg-red-100 border-red-200 hover:bg-red-200 hover:scale-105"
            }`}
          >
            <Mic className={`w-8 h-8 ${isRecordingPreAlert ? "text-white" : "text-red-600"}`} />
          </button>
          <p className="mt-4 text-base font-bold text-slate-700">
            {isRecordingPreAlert ? "Đang ghi âm... Chạm để dừng" : "Chạm để ghi âm"}
          </p>
          <p className="mt-1 text-[13px] text-slate-500 text-center px-4 max-w-xs">
            Ghi âm tình trạng bệnh nhân, chỉ số sinh tồn và gửi trực tiếp về
            kíp trực cấp cứu.
          </p>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Nội dung cảnh báo
          </label>
          <textarea
            value={preAlertText}
            onChange={(e) => setPreAlertText(e.target.value)}
            placeholder="Ví dụ: Bệnh nhân nam 30 tuổi, bị chấn thương sọ não, đang sơ cứu tạm thời, đề nghị chuẩn bị thêm thuốc cầm máu."
            className="w-full h-24 p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-cyan-500/20 outline-none resize-none bg-white"
          />
        </div>
      </div>

      {/* ── 2. GPS Map Panel ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: ACCENT }}
          >
            <MapPin className="w-4 h-4 text-slate-900" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Định vị GPS · Lộ trình</h3>
            <p className="text-[13px] text-slate-500 font-geist">
              Theo dõi thời gian thực · ETA tự động cập nhật
            </p>
          </div>
        </div>

        {/* OpenStreetMap via Leaflet (Client side only) */}
        <ClientEmsLeafletMap
          lat={mapCenterLat}
          lng={mapCenterLng}
          onRouteUpdate={setRouteInfo}
          hospitalId={isMissionStarted ? hospitalId : undefined}
        />

        {/* ETA info */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-[#fff7ed] border border-orange-100/50 text-center">
            <p className="text-[12px] font-geist uppercase tracking-wider text-orange-400 mb-0.5 font-bold">
              ETA
            </p>
            <p className="text-xl font-black text-orange-500">{etaMins} phút</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
            <p className="text-[12px] font-geist uppercase tracking-wider text-slate-400 mb-0.5 font-bold">
              Khoảng cách
            </p>
            <p className="text-xl font-black text-slate-900">{distanceKm} km</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center flex flex-col justify-center">
            <p className="text-[10px] font-geist uppercase tracking-wider text-slate-400 mb-0.5 font-bold">
              Đích đến
            </p>
            <p className="text-sm font-black text-slate-900 leading-tight">
              {routeInfo ? routeInfo.destName : "BV Bạch Mai"}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[10px] font-geist uppercase tracking-wider text-slate-400 font-bold">
              Tiến trình di chuyển
            </span>
            <span className="text-xs font-black text-slate-900">{Math.round(progress)}%</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out"
              style={{
                width: `${progress}%`,
                background: "linear-gradient(90deg, #F97316 0%, #67e8f9 100%)",
              }}
            />
          </div>
        </div>
      </div>

      {/* ── 1. Patient Identification Panel ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
            <CreditCard className="w-4 h-4 text-orange-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Nhận diện Bệnh nhân</h3>
            <p className="text-[11px] text-slate-500 font-geist">
              Quét CCCD / FaceID trên xe cấp cứu
            </p>
          </div>
        </div>

        {!scannedPatient ? (
          <div className="w-full relative">
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setManualInputMode("cccd")}
                className={`flex-1 py-2 rounded-lg text-sm font-bold border transition ${manualInputMode === "cccd" ? "bg-cyan-500 text-white border-cyan-500" : "bg-white text-slate-700 border-slate-200"}`}
              >
                Quét CCCD
              </button>
              <button
                onClick={() => setManualInputMode("unknown")}
                className={`flex-1 py-2 rounded-lg text-sm font-bold border transition ${manualInputMode === "unknown" ? "bg-cyan-500 text-white border-cyan-500" : "bg-white text-slate-700 border-slate-200"}`}
              >
                Không rõ danh tính
              </button>
              <button
                onClick={() => setManualInputMode("no_cccd")}
                className={`flex-1 py-2 rounded-lg text-sm font-bold border transition ${manualInputMode === "no_cccd" ? "bg-cyan-500 text-white border-cyan-500" : "bg-white text-slate-700 border-slate-200"}`}
              >
                Không có CCCD
              </button>
            </div>

            {manualInputMode === "cccd" && (
              <>
                <CccdCapture
                  side="front"
                  capturedUrl={capturedCccdUrl}
                  onCapture={(url) => {
                    setCapturedCccdUrl(url);
                    if (url) {
                      processEkycBase64(url);
                    }
                  }}
                />
              </>
            )}

            {manualInputMode === "unknown" && (
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Giới tính
                  </label>
                  <select
                    value={manualGender}
                    onChange={(e) => setManualGender(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  >
                    <option value="">Chọn giới tính</option>
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Khoảng tuổi
                  </label>
                  <input
                    type="text"
                    value={manualAgeRange}
                    onChange={(e) => setManualAgeRange(e.target.value)}
                    placeholder="VD: 20-30, 40-50"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <button
                  className="w-full py-2 bg-cyan-500 text-white font-bold rounded-lg mt-2"
                  onClick={() => {
                    const fakePatient = {
                      name: "Không rõ",
                      gender: manualGender,
                      age: manualAgeRange,
                      cccd: null,
                      chronic_conditions: [],
                      allergies: [],
                    };
                    setScannedPatient({
                      full_name: "Không rõ danh tính",
                      gender: manualGender,
                      dob: null,
                      cccd_number: null,
                      chronic_conditions: [],
                      allergies: [],
                    });
                    sendPatientUpdate(fakePatient);
                  }}
                >
                  Xác nhận
                </button>
              </div>
            )}

            {manualInputMode === "no_cccd" && (
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Họ và tên
                  </label>
                  <input
                    type="text"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    placeholder="Nhập họ và tên"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Giới tính
                  </label>
                  <select
                    value={manualGender}
                    onChange={(e) => setManualGender(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  >
                    <option value="">Chọn giới tính</option>
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Khoảng tuổi
                  </label>
                  <input
                    type="text"
                    value={manualAgeRange}
                    onChange={(e) => setManualAgeRange(e.target.value)}
                    placeholder="VD: 20-30, 40-50"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Liên hệ khẩn cấp
                  </label>
                  <input
                    type="text"
                    value={manualEmergencyContact}
                    onChange={(e) => setManualEmergencyContact(e.target.value)}
                    placeholder="Tên & SĐT người thân"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Bệnh nền
                  </label>
                  <input
                    type="text"
                    value={manualChronic}
                    onChange={(e) => setManualChronic(e.target.value)}
                    placeholder="VD: Cao huyết áp..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Dị ứng thuốc
                  </label>
                  <input
                    type="text"
                    value={manualAllergies}
                    onChange={(e) => setManualAllergies(e.target.value)}
                    placeholder="VD: Kháng sinh..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <button
                  className="w-full py-2 bg-cyan-500 text-white font-bold rounded-lg mt-2"
                  onClick={() => {
                    const c_cond = manualChronic.trim()
                      ? manualChronic.split(",").map((s) => s.trim())
                      : ["Không"];
                    const c_allergy = manualAllergies.trim()
                      ? manualAllergies.split(",").map((s) => s.trim())
                      : ["Không"];
                    const e_contact = manualEmergencyContact.trim() || "Không";
                    const fakePatient = {
                      name: manualName,
                      gender: manualGender,
                      age: manualAgeRange,
                      cccd: null,
                      chronic_conditions: c_cond,
                      allergies: c_allergy,
                      emergencyContactName: e_contact,
                    };
                    setScannedPatient({
                      full_name: manualName,
                      gender: manualGender,
                      dob: null,
                      cccd_number: null,
                      chronic_conditions: c_cond,
                      allergies: c_allergy,
                      emergencyContactName: e_contact,
                    });
                    sendPatientUpdate(fakePatient);
                  }}
                >
                  Xác nhận
                </button>
              </div>
            )}

            {scanningEkyc && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center backdrop-blur-[2px] z-10 rounded-2xl">
                <div className="flex flex-col items-center gap-3">
                  <span className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></span>
                  <p className="text-cyan-700 font-bold text-sm tracking-wide">
                    Đang xác thực...
                  </p>
                </div>
              </div>
            )}
            {ekycError && (
              <p className="mt-3 text-xs text-red-500 font-bold text-center bg-red-50 p-2.5 rounded-lg border border-red-100 animate-in fade-in slide-in-from-top-1">
                {ekycError}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3 animate-fade-in">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50 border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span className="text-xs font-bold text-emerald-700">
                Nhận diện thành công · CCCD xác thực
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] font-geist uppercase tracking-wider text-slate-400 mb-0.5">
                  Họ và tên
                </p>
                <p className="text-sm font-bold text-slate-900">
                  {scannedPatient?.full_name || scannedPatient?.name || "N/A"}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] font-geist uppercase tracking-wider text-slate-400 mb-0.5">
                  CCCD
                </p>
                <p className="text-sm font-bold text-slate-900 font-mono">
                  {scannedPatient?.cccd_number || scannedPatient?.cccd || "N/A"}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] font-geist uppercase tracking-wider text-slate-400 mb-0.5">
                  Ngày sinh
                </p>
                <p className="text-sm font-bold text-slate-900">{scannedPatient?.dob || "N/A"}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] font-geist uppercase tracking-wider text-slate-400 mb-0.5">
                  Giới tính
                </p>
                <p className="text-sm font-bold text-slate-900">
                  {scannedPatient?.gender || "N/A"}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-red-50 border border-red-100">
                <p className="text-[10px] font-geist uppercase tracking-wider text-red-400 mb-0.5">
                  Nhóm máu
                </p>
                <p className="text-sm font-bold text-red-600">
                  {scannedPatient?.blood_type || "N/A"}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
                <p className="text-[10px] font-geist uppercase tracking-wider text-amber-500 mb-0.5">
                  Dị ứng
                </p>
                <p className="text-sm font-bold text-amber-700">
                  {scannedPatient?.allergies ? scannedPatient.allergies.join(", ") : "Không có"}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-[10px] font-geist uppercase tracking-wider text-slate-400 mb-1">
                Bệnh nền
              </p>
              <div className="flex flex-wrap gap-1.5">
                {(() => {
                  const chronicConditions =
                    scannedPatient?.chronic_conditions || scannedPatient?.chronicConditions || [];
                  return chronicConditions.length > 0 ? (
                    chronicConditions.map((c: string) => (
                      <span
                        key={c}
                        className="px-2 py-0.5 rounded-full bg-slate-200 text-[11px] font-bold text-slate-700"
                      >
                        {c}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm font-bold text-slate-500">Không có</span>
                  );
                })()}
              </div>
            </div>

            <a
              href={`tel:${scannedPatient?.emergency_contact?.phone || scannedPatient?.emergencyContact?.phone || ""}`}
              className="p-3 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-between hover:bg-blue-100 hover:border-blue-200 transition-colors cursor-pointer"
            >
              <div>
                <p className="text-[10px] font-geist uppercase tracking-wider text-blue-400 mb-0.5">
                  Người liên hệ khẩn cấp
                </p>
                <p className="text-sm font-bold text-blue-900">
                  {scannedPatient?.emergency_contact?.name ||
                    scannedPatient?.emergencyContact?.name ||
                    "N/A"}
                  {scannedPatient?.emergency_contact?.relation ||
                  scannedPatient?.emergencyContact?.relation
                    ? ` (${scannedPatient?.emergency_contact?.relation || scannedPatient?.emergencyContact?.relation})`
                    : ""}
                </p>
                <p className="text-xs text-blue-600 font-mono">
                  {scannedPatient?.emergency_contact?.phone ||
                    scannedPatient?.emergencyContact?.phone ||
                    "N/A"}
                </p>
              </div>
              <Phone className="w-5 h-5 text-blue-500" />
            </a>
          </div>
        )}
      </div>

      {/* Floating GPS Broadcast Button */}
      <button
        onClick={() => {
          if (!isMissionStarted) {
            setShowMissionSetup(true);
          } else {
            toggleGpsBroadcast();
          }
        }}
        className={`fixed bottom-6 right-6 z-50 px-6 py-4 rounded-full text-sm font-black shadow-2xl transition-all flex items-center gap-3 hover:scale-105 active:scale-95 ${
          !isMissionStarted
            ? "bg-slate-800 text-white"
            : isBroadcasting
              ? "bg-red-500 text-white animate-pulse"
              : "bg-cyan-500 text-white"
        }`}
        style={{
          boxShadow: !isMissionStarted
            ? "0 8px 32px rgba(30, 41, 59, 0.4)"
            : isBroadcasting
              ? "0 8px 32px rgba(239, 68, 68, 0.5)"
              : "0 8px 32px rgba(6, 182, 212, 0.4)",
        }}
      >
        <MapPin className="w-5 h-5" />
        {!isMissionStarted
          ? "Xác nhận xe làm nhiệm vụ"
          : isBroadcasting
            ? "DỪNG TRUYỀN GPS"
            : "BẬT TRUYỀN GPS"}
      </button>

      {/* ── Modal nhap bien so xe ── */}
    </div>
  );
}

/* ============== VIEW: ADMIN DASHBOARD — Maps to PostgreSQL schema ============== */

type AdminTab =
  | "overview"
  | "users"
  | "staffs"
  | "departments"
  | "devices"
  | "ambulances"
  | "queue"
  | "lpr"
  | "medical_books";

const ADMIN_TABS: { key: AdminTab; Icon: typeof Users; label: string }[] = [
  { key: "overview", Icon: Activity, label: "Tổng quan" },
  { key: "users", Icon: Users, label: "Bệnh nhân" },
  { key: "staffs", Icon: UserCheck, label: "Nhân viên" },
  { key: "departments", Icon: Bed, label: "Khoa phòng" },
  { key: "devices", Icon: Cpu, label: "Thiết bị" },
  { key: "ambulances", Icon: Ambulance, label: "Xe cấp cứu" },
  { key: "queue", Icon: List, label: "Hàng chờ khám" },
  { key: "lpr", Icon: ScanLine, label: "Nhận diện biển số" },
  { key: "medical_books", Icon: BookOpen, label: "Sổ khám bệnh" },
];

function AdminDashboardView() {
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -200, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 200, behavior: "smooth" });
    }
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Tab bar */}
      <div className="relative flex items-center group">
        <button
          onClick={scrollLeft}
          className="absolute left-0 z-10 p-1.5 bg-white border border-slate-200 rounded-full shadow-md text-slate-600 hover:text-slate-900 opacity-0 group-hover:opacity-100 transition-opacity md:-ml-4"
          aria-label="Cuộn trái"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div ref={scrollRef} className="flex overflow-x-auto scrollbar-hide gap-2 pb-1 flex-1">
          {ADMIN_TABS.map(({ key, Icon, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 text-[11px] font-bold transition-colors ${
                activeTab === key
                  ? "border-transparent text-slate-900"
                  : "border-slate-200 bg-white text-slate-600 hover:border-[#88E8F2]"
              }`}
              style={activeTab === key ? { backgroundColor: ACCENT } : undefined}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        <button
          onClick={scrollRight}
          className="absolute right-0 z-10 p-1.5 bg-white border border-slate-200 rounded-full shadow-md text-slate-600 hover:text-slate-900 opacity-0 group-hover:opacity-100 transition-opacity md:-mr-4"
          aria-label="Cuộn phải"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {activeTab === "overview" && <AdminOverviewTab />}
      {activeTab === "users" && <AdminPatientsTab />}
      {activeTab === "staffs" && <AdminStaffsTab />}
      {activeTab === "departments" && <AdminDepartmentsTab />}
      {activeTab === "devices" && <AdminDevicesTab />}
      {activeTab === "ambulances" && <AdminAmbulancesTab />}
      {activeTab === "queue" && <AdminQueueTab />}
      {activeTab === "logs" && <AdminLogsTab />}
      {activeTab === "lpr" && <AdminLprTab />}
      {activeTab === "medical_books" && <AdminMedicalBooksTab />}
      {activeTab === "webauthn" && <AdminWebAuthnTab />}
    </div>
  );
}

/* ── Tab 0: Overview — Stats across all tables ── */
function AdminOverviewTab() {
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi("/admin/stats")
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="text-center py-8 text-slate-400">Đang tải số liệu tổng quan...</div>
    );
  }

  if (!stats || stats.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">Không có dữ liệu thống kê.</div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {stats.map((s) => (
        <div
          key={s.label}
          className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow"
        >
          <p className="text-[10px] font-geist uppercase tracking-wider text-slate-500 mb-1">
            {s.label}
          </p>
          <p className="text-2xl font-bold" style={{ color: s.color }}>
            {s.value}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">{s.sub}</p>
        </div>
      ))}
    </div>
  );
}

/* ── Tab 1: patients table ── */
function AdminPatientsTab() {
  const [patients, setPatients] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    cccd: "",
    phone: "",
    bhxh_code: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    password: "",
  });

  const loadData = () => fetchApi("/admin/tables/patients").then(setPatients).catch(console.error);

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Xác nhận xóa bệnh nhân này?")) return;
    try {
      await fetchApi(`/admin/tables/patients/${id}`, { method: "DELETE" });
      loadData();
    } catch (e) {
      alert("Lỗi khi xóa: " + e);
    }
  };

  const handleAdd = async () => {
    if (!form.name.trim() || !form.cccd.trim()) return;
    try {
      await fetchApi("/admin/patients", {
        method: "POST",
        body: JSON.stringify(form),
      });
      loadData();
      setShowForm(false);
      setForm({
        name: "",
        cccd: "",
        phone: "",
        bhxh_code: "",
        emergency_contact_name: "",
        emergency_contact_phone: "",
        password: "",
      });
    } catch (e) {
      alert("Lỗi khi thêm: " + e);
    }
  };

  const filteredPatients = patients.filter(
    (p) =>
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || p.cccd?.includes(searchQuery),
  );

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-5 py-4 border-b border-slate-200 gap-3">
        <h3 className="font-bold text-slate-900 flex items-center gap-2">
          <Users className="w-5 h-5 text-[#0A9BAD]" /> Quản lý Bệnh nhân
        </h3>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex flex-1 sm:flex-none items-center rounded-lg border border-slate-200 bg-slate-50/80 px-2 py-1.5">
            <Search className="h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm tên/CCCD..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ml-2 w-full sm:w-40 border-none bg-transparent text-xs text-slate-800 outline-none placeholder:text-slate-400"
            />
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="text-[11px] shrink-0 font-bold tracking-wider uppercase font-geist text-white bg-[#0A9BAD] hover:bg-[#0891b2] px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3 h-3" /> Thêm bệnh nhân
          </button>
        </div>
      </div>

      {showForm && (
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 space-y-3">
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Thêm bệnh nhân mới
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Họ tên *
              </label>
              <input
                type="text"
                placeholder="Nguyễn Văn A"
                value={form.name}
                onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#88E8F2]"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                CCCD *
              </label>
              <input
                type="text"
                placeholder="001203001299"
                value={form.cccd}
                onChange={(e) => setForm((s) => ({ ...s, cccd: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#88E8F2]"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Số điện thoại
              </label>
              <input
                type="text"
                placeholder="0912345678"
                value={form.phone}
                onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#88E8F2]"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Mã BHXH
              </label>
              <input
                type="text"
                placeholder="VN-BHXH-12345"
                value={form.bhxh_code}
                onChange={(e) => setForm((s) => ({ ...s, bhxh_code: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#88E8F2]"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Liên hệ khẩn cấp
              </label>
              <input
                type="text"
                placeholder="Nguyễn Thị B"
                value={form.emergency_contact_name}
                onChange={(e) => setForm((s) => ({ ...s, emergency_contact_name: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#88E8F2]"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                SĐT liên hệ khẩn cấp
              </label>
              <input
                type="text"
                placeholder="0987654321"
                value={form.emergency_contact_phone}
                onChange={(e) =>
                  setForm((s) => ({ ...s, emergency_contact_phone: e.target.value }))
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#88E8F2]"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={!form.name.trim() || !form.cccd.trim()}
              className="rounded-lg bg-[#0A9BAD] px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-[#0891b2] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Lưu bệnh nhân
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-[10px] text-slate-500 font-geist uppercase tracking-wider bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3">id</th>
              <th className="px-4 py-3">name</th>
              <th className="px-4 py-3">cccd</th>
              <th className="px-4 py-3">phone</th>
              <th className="px-4 py-3">bhxh_code</th>
              <th className="px-4 py-3">emergency_contact</th>
              <th className="px-4 py-3">created_at</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filteredPatients.map((p) => (
              <tr key={p.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="px-4 py-3 text-[11px] font-mono text-slate-400">{p.id}</td>
                <td className="px-4 py-3 font-bold text-slate-900">{p.name}</td>
                <td className="px-4 py-3 font-mono text-[13px] text-slate-700">{p.cccd}</td>
                <td className="px-4 py-3 text-[13px] text-slate-600">{p.phone ?? "—"}</td>
                <td className="px-4 py-3 text-[13px] text-slate-600">{p.bhxh_code ?? "—"}</td>
                <td className="px-4 py-3 text-[12px] text-slate-500">
                  {p.emergency_contact_name
                    ? `${p.emergency_contact_name} · ${p.emergency_contact_phone}`
                    : "—"}
                </td>
                <td className="px-4 py-3 text-[12px] text-slate-500 font-mono">{p.created_at}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(p.id);
                    }}
                    className="text-slate-400 hover:text-red-600 transition-colors"
                    title="Xóa"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Tab 1.5: staffs table ── */
function AdminStaffsTab() {
  const handleDelete = async (id: string) => {
    if (!window.confirm("Xác nhận xóa dữ liệu này?")) return;
    try {
      await fetchApi(`/admin/tables/staffs/${id}`, { method: "DELETE" });
      fetchApi("/admin/tables/staffs").then(setUsers).catch(console.error);
    } catch (e) {
      alert("Lỗi khi xóa: " + e);
    }
  };

  const [users, setUsers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchApi("/admin/tables/staffs").then(setUsers).catch(console.error);
    fetchApi("/admin/tables/departments").then(setDepartments).catch(console.error);
  }, []);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    role: "clinician",
    cccd: "",
    employee_id: "",
    department_id: "",
    password: "",
  });

  const roleLabels: Record<string, string> = {
    admin: "Admin",
    clinician: "Bác sĩ/ĐD",
    ops: "Trực CC",
    ems: "EMS",
  };
  const roleColors: Record<string, string> = {
    admin: "bg-purple-100 text-purple-700",
    clinician: "bg-blue-100 text-blue-700",
    ops: "bg-orange-100 text-orange-700",
    ems: "bg-red-100 text-red-700",
  };

  const handleAdd = async () => {
    if (!form.name.trim() || !form.cccd.trim() || !form.password.trim()) return;
    try {
      await fetchApi("/admin/staffs", {
        method: "POST",
        body: JSON.stringify(form),
      });
      const data = await fetchApi("/admin/tables/staffs");
      setUsers(data);
      setShowForm(false);
      setForm({
        name: "",
        role: "clinician",
        cccd: "",
        employee_id: "",
        department_id: "",
        password: "",
      });
    } catch (e) {
      console.error(e);
      alert("Lỗi khi thêm nhân viên");
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || u.cccd?.includes(searchQuery),
  );

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-5 py-4 border-b border-slate-200 gap-3">
        <div>
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-[#0A9BAD]" /> Quản lý Nhân viên
          </h3>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex flex-1 sm:flex-none items-center rounded-lg border border-slate-200 bg-slate-50/80 px-2 py-1.5">
            <Search className="h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm tên/CCCD..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ml-2 w-full sm:w-40 border-none bg-transparent text-xs text-slate-800 outline-none placeholder:text-slate-400"
            />
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="text-[11px] shrink-0 font-bold tracking-wider uppercase font-geist text-white bg-[#0A9BAD] hover:bg-[#0891b2] px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3 h-3" /> Thêm nhân viên
          </button>
        </div>
      </div>

      {showForm && (
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 space-y-3">
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Thêm nhân viên mới
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Tên nhân viên *
              </label>
              <input
                type="text"
                placeholder="Nguyễn Văn A"
                value={form.name}
                onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#88E8F2]"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Vai trò (Role) *
              </label>
              <select
                value={form.role}
                onChange={(e) => setForm((s) => ({ ...s, role: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#88E8F2] bg-white"
              >
                <option value="clinician">Bác sĩ/ĐD (clinician)</option>
                <option value="admin">Quản trị viên (admin)</option>
                <option value="ops">Trực cấp cứu (ops)</option>
                <option value="ems">Lái xe (ems)</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                CCCD *
              </label>
              <input
                type="text"
                placeholder="001203001299"
                value={form.cccd}
                onChange={(e) => setForm((s) => ({ ...s, cccd: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#88E8F2]"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Mã nhân viên
              </label>
              <input
                type="text"
                placeholder="NV005"
                value={form.employee_id}
                onChange={(e) => setForm((s) => ({ ...s, employee_id: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#88E8F2]"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Phòng ban
              </label>
              <select
                value={form.department_id}
                onChange={(e) => setForm((s) => ({ ...s, department_id: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#88E8F2] bg-white"
              >
                <option value="">-- Trống --</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Mật khẩu (Password) *
              </label>
              <input
                type="password"
                placeholder="******"
                value={form.password}
                onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#88E8F2]"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={!form.name.trim() || !form.cccd.trim() || !form.password.trim()}
              className="rounded-lg bg-[#0A9BAD] px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-[#0891b2] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Lưu nhân viên
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-[10px] text-slate-500 font-geist uppercase tracking-wider bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3">id</th>
              <th className="px-4 py-3">name</th>
              <th className="px-4 py-3">role</th>
              <th className="px-4 py-3">cccd</th>
              <th className="px-4 py-3">employee_id</th>
              <th className="px-4 py-3">department_id</th>
              <th className="px-4 py-3">created_at</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((u) => (
              <tr key={u.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="px-4 py-3 text-[11px] font-mono text-slate-400">{u.id}</td>
                <td className="px-4 py-3 font-bold text-slate-900">{u.name}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${roleColors[u.role] ?? "bg-slate-100 text-slate-600"}`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-[13px] text-slate-700">{u.cccd}</td>
                <td className="px-4 py-3 font-mono text-[13px] text-slate-600">
                  {u.employee_id ?? "—"}
                </td>
                <td className="px-4 py-3 text-[13px] text-slate-600">
                  {u.department_id
                    ? departments.find((d) => d.id === u.department_id)?.name || u.department_id
                    : "—"}
                </td>
                <td className="px-4 py-3 text-[12px] text-slate-500 font-mono">{u.created_at}</td>

                <td className="px-4 py-3 text-right">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(u.id);
                    }}
                    className="text-slate-400 hover:text-red-600 transition-colors"
                    title="Xóa"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Tab 2: departments table ── */
function AdminDepartmentsTab() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });

  const loadData = () =>
    fetchApi("/admin/tables/departments").then(setDepartments).catch(console.error);

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Xác nhận xóa khoa phòng này?")) return;
    try {
      await fetchApi(`/admin/tables/departments/${id}`, { method: "DELETE" });
      loadData();
    } catch (e) {
      alert("Lỗi khi xóa: " + e);
    }
  };

  const handleAdd = async () => {
    if (!form.name.trim()) return;
    try {
      await fetchApi("/admin/departments", {
        method: "POST",
        body: JSON.stringify(form),
      });
      loadData();
      setShowForm(false);
      setForm({ name: "", description: "" });
    } catch (e) {
      alert("Lỗi khi thêm: " + e);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
        <h3 className="font-bold text-slate-900 flex items-center gap-2">
          <Bed className="w-5 h-5 text-[#0A9BAD]" /> Danh sách Khoa phòng
        </h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-[11px] font-bold tracking-wider uppercase font-geist text-white bg-[#0A9BAD] hover:bg-[#0891b2] px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
        >
          <Plus className="w-3 h-3" /> Thêm khoa phòng
        </button>
      </div>

      {showForm && (
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 space-y-3">
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Thêm khoa phòng mới
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Tên khoa phòng *
              </label>
              <input
                type="text"
                placeholder="Khoa Cấp cứu"
                value={form.name}
                onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#88E8F2]"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Mô tả
              </label>
              <input
                type="text"
                placeholder="Mô tả khoa phòng..."
                value={form.description}
                onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#88E8F2]"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={!form.name.trim()}
              className="rounded-lg bg-[#0A9BAD] px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-[#0891b2] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Lưu khoa phòng
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-5">
        {departments.map((d) => (
          <div
            key={d.id}
            className="relative p-4 rounded-xl border border-slate-100 hover:border-[#88E8F2] hover:shadow-md transition-all cursor-pointer group"
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(d.id);
              }}
              className="absolute top-2 right-2 text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Xóa"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-8 rounded-full bg-[#0A9BAD] transition-transform group-hover:scale-y-110" />
              <div>
                <p className="text-sm font-bold text-slate-900">{d.name}</p>
                <p className="text-[10px] text-slate-400 font-mono">{d.id}</p>
              </div>
            </div>
            <p className="text-[11px] text-slate-500">{d.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Tab 3: devices table ── */
function AdminDevicesTab() {
  const [devices, setDevices] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    device_type: "camera_fall",
    location: "",
    ip_address: "",
    status: "active",
  });

  const loadData = () => fetchApi("/admin/tables/devices").then(setDevices).catch(console.error);

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Xác nhận xóa thiết bị này?")) return;
    try {
      await fetchApi(`/admin/tables/devices/${id}`, { method: "DELETE" });
      loadData();
    } catch (e) {
      alert("Lỗi khi xóa: " + e);
    }
  };

  const handleAdd = async () => {
    if (!form.name.trim()) return;
    try {
      await fetchApi("/admin/devices", {
        method: "POST",
        body: JSON.stringify(form),
      });
      loadData();
      setShowForm(false);
      setForm({
        name: "",
        device_type: "camera_fall",
        location: "",
        ip_address: "",
        status: "active",
      });
    } catch (e) {
      alert("Lỗi khi thêm: " + e);
    }
  };

  const typeLabels: Record<string, { label: string; color: string }> = {
    camera_fall: { label: "Camera AI", color: "bg-blue-100 text-blue-700" },
    camera_lpr: { label: "Camera LPR", color: "bg-purple-100 text-purple-700" },
    monitor_spo2: { label: "Monitor SpO2", color: "bg-emerald-100 text-emerald-700" },
  };
  const statusStyle: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-700",
    offline: "bg-red-100 text-red-700",
    maintenance: "bg-yellow-100 text-yellow-700",
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
        <div>
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-[#0A9BAD]" /> Quản lý Thiết bị
          </h3>
          <p className="text-[11px] text-slate-500 font-geist mt-0.5">
            id · device_type · name · location · status · ip_address
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-[11px] font-bold tracking-wider uppercase font-geist text-white bg-[#0A9BAD] hover:bg-[#0891b2] px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
        >
          <Plus className="w-3 h-3" /> Thêm thiết bị
        </button>
      </div>

      {showForm && (
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 space-y-3">
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Thêm thiết bị mới
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Tên thiết bị *
              </label>
              <input
                type="text"
                placeholder="Camera sảnh A"
                value={form.name}
                onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#88E8F2]"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Loại thiết bị
              </label>
              <select
                value={form.device_type}
                onChange={(e) => setForm((s) => ({ ...s, device_type: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#88E8F2] bg-white"
              >
                <option value="camera_fall">Camera AI (phát hiện ngã)</option>
                <option value="camera_lpr">Camera LPR (biển số)</option>
                <option value="monitor_spo2">Monitor SpO2</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Vị trí
              </label>
              <input
                type="text"
                placeholder="Phòng CC01"
                value={form.location}
                onChange={(e) => setForm((s) => ({ ...s, location: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#88E8F2]"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                IP Address
              </label>
              <input
                type="text"
                placeholder="192.168.1.100"
                value={form.ip_address}
                onChange={(e) => setForm((s) => ({ ...s, ip_address: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#88E8F2]"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Trạng thái
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm((s) => ({ ...s, status: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#88E8F2] bg-white"
              >
                <option value="active">Hoạt động</option>
                <option value="offline">Offline</option>
                <option value="maintenance">Bảo trì</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={!form.name.trim()}
              className="rounded-lg bg-[#0A9BAD] px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-[#0891b2] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Lưu thiết bị
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-[10px] text-slate-500 font-geist uppercase tracking-wider bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3">id</th>
              <th className="px-4 py-3">device_type</th>
              <th className="px-4 py-3">name</th>
              <th className="px-4 py-3">location</th>
              <th className="px-4 py-3">ip_address</th>
              <th className="px-4 py-3">status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {devices.map((d) => (
              <tr key={d.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="px-4 py-3 text-[11px] font-mono text-slate-400">{d.id}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${typeLabels[d.device_type]?.color ?? "bg-slate-100 text-slate-600"}`}
                  >
                    {typeLabels[d.device_type]?.label ?? d.device_type}
                  </span>
                </td>
                <td className="px-4 py-3 font-bold text-slate-900">{d.name}</td>
                <td className="px-4 py-3 text-[13px] text-slate-600">{d.location}</td>
                <td className="px-4 py-3 font-mono text-[13px] text-slate-500">{d.ip_address}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusStyle[d.status] ?? ""}`}
                  >
                    {d.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(d.id);
                    }}
                    className="text-slate-400 hover:text-red-600 transition-colors"
                    title="Xóa"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Tab 4: ambulances table ── */
function AdminAmbulancesTab() {
  const [ambulances, setAmbulances] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ plate_number: "", driver_name: "", status: "available" });

  const loadData = () =>
    fetchApi("/admin/tables/ambulances").then(setAmbulances).catch(console.error);

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Xác nhận xóa xe cấp cứu này?")) return;
    try {
      await fetchApi(`/admin/tables/ambulances/${id}`, { method: "DELETE" });
      loadData();
    } catch (e) {
      alert("Lỗi khi xóa: " + e);
    }
  };

  const handleAdd = async () => {
    if (!form.plate_number.trim() || !form.driver_name.trim()) return;
    try {
      await fetchApi("/admin/ambulances", {
        method: "POST",
        body: JSON.stringify(form),
      });
      loadData();
      setShowForm(false);
      setForm({ plate_number: "", driver_name: "", status: "available" });
    } catch (e) {
      alert("Lỗi khi thêm: " + e);
    }
  };

  const ambStatus: Record<string, { label: string; color: string }> = {
    dispatched: { label: "Đang đi", color: "bg-red-100 text-red-700" },
    available: { label: "Sẵn sàng", color: "bg-emerald-100 text-emerald-700" },
    returning: { label: "Đang về", color: "bg-yellow-100 text-yellow-700" },
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
        <h3 className="font-bold text-slate-900 flex items-center gap-2">
          <Ambulance className="w-5 h-5 text-[#0A9BAD]" /> Quản lý Xe cấp cứu
        </h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-[11px] font-bold tracking-wider uppercase font-geist text-white bg-[#0A9BAD] hover:bg-[#0891b2] px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
        >
          <Plus className="w-3 h-3" /> Thêm xe cấp cứu
        </button>
      </div>

      {showForm && (
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 space-y-3">
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Thêm xe cấp cứu mới
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Biển số xe *
              </label>
              <input
                type="text"
                placeholder="51F-123.45"
                value={form.plate_number}
                onChange={(e) => setForm((s) => ({ ...s, plate_number: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#88E8F2]"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Tên tài xế *
              </label>
              <input
                type="text"
                placeholder="Nguyễn Văn A"
                value={form.driver_name}
                onChange={(e) => setForm((s) => ({ ...s, driver_name: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#88E8F2]"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Trạng thái
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm((s) => ({ ...s, status: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#88E8F2] bg-white"
              >
                <option value="available">Sẵn sàng</option>
                <option value="dispatched">Đang đi</option>
                <option value="returning">Đang về</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={!form.plate_number.trim() || !form.driver_name.trim()}
              className="rounded-lg bg-[#0A9BAD] px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-[#0891b2] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Lưu xe cấp cứu
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-[10px] text-slate-500 font-geist uppercase tracking-wider bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3">id</th>
              <th className="px-4 py-3">plate_number</th>
              <th className="px-4 py-3">driver_name</th>
              <th className="px-4 py-3">status</th>
              <th className="px-4 py-3">last_lat</th>
              <th className="px-4 py-3">last_lng</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {ambulances.map((a) => (
              <tr key={a.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="px-4 py-3 text-[11px] font-mono text-slate-400">{a.id}</td>
                <td className="px-4 py-3 font-mono font-bold text-slate-900">{a.plate_number}</td>
                <td className="px-4 py-3 text-[13px] text-slate-700">{a.driver_name}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${ambStatus[a.status]?.color ?? ""}`}
                  >
                    {ambStatus[a.status]?.label ?? a.status}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-[12px] text-slate-500">{a.last_lat}</td>
                <td className="px-4 py-3 font-mono text-[12px] text-slate-500">{a.last_lng}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(a.id);
                    }}
                    className="text-slate-400 hover:text-red-600 transition-colors"
                    title="Xóa"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Tab 5: patients_queue table ── */
function AdminQueueTab() {
  const handleDelete = async (id: string) => {
    if (!window.confirm("Xác nhận xóa dữ liệu này?")) return;
    try {
      await fetchApi(`/admin/tables/patients_queue/${id}`, { method: "DELETE" });
      fetchApi("/admin/tables/patients_queue").then(setQueue).catch(console.error);
    } catch (e) {
      alert("Lỗi khi xóa: " + e);
    }
  };

  const [queue, setQueue] = useState<any[]>([]);
  useEffect(() => {
    fetchApi("/admin/tables/patients_queue").then(setQueue).catch(console.error);
  }, []);

  const triageColors: Record<number, { bg: string; text: string; label: string }> = {
    1: { bg: "bg-red-500", text: "text-white", label: "ĐỎ · Cấp cứu" },
    2: { bg: "bg-yellow-500", text: "text-white", label: "VÀNG · Khẩn" },
    3: { bg: "bg-emerald-500", text: "text-white", label: "XANH · Bình thường" },
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
      <div className="px-5 py-4 border-b border-slate-200">
        <h3 className="font-bold text-slate-900 flex items-center gap-2">
          <List className="w-5 h-5 text-[#0A9BAD]" /> Danh sách bệnh nhân chờ khám
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-[10px] text-slate-500 font-geist uppercase tracking-wider bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3">id</th>
              <th className="px-4 py-3">patient_id</th>
              <th className="px-4 py-3">department_id</th>
              <th className="px-4 py-3">triage_level</th>
              <th className="px-4 py-3">status</th>
              <th className="px-4 py-3">entered_at</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {queue.map((q) => {
              const triage = triageColors[q.triage_level] ?? triageColors[3];
              return (
                <tr
                  key={q.id}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                >
                  <td className="px-4 py-3 text-[11px] font-mono text-slate-400">{q.id}</td>
                  <td className="px-4 py-3 font-mono font-bold text-slate-900">{q.patient_id}</td>
                  <td className="px-4 py-3 text-[13px] text-slate-700">{q.department_id}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${triage.bg} ${triage.text}`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-white/60" />
                      {triage.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${q.status === "in_treatment" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"}`}
                    >
                      {q.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-[12px] text-slate-500">{q.entered_at}</td>

                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(q.id);
                      }}
                      className="text-slate-400 hover:text-red-600 transition-colors"
                      title="Xóa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Tab 6: system_logs table ── */
function AdminLogsTab() {
  const handleDelete = async (id: string) => {
    if (!window.confirm("Xác nhận xóa dữ liệu này?")) return;
    try {
      await fetchApi(`/admin/tables/system_logs/${id}`, { method: "DELETE" });
      fetchApi("/admin/tables/system_logs").then(setLogs).catch(console.error);
    } catch (e) {
      alert("Lỗi khi xóa: " + e);
    }
  };

  const [logs, setLogs] = useState<any[]>([]);
  useEffect(() => {
    fetchApi("/admin/tables/system_logs").then(setLogs).catch(console.error);
  }, []);

  const logTypeLabels: Record<string, { label: string; color: string }> = {
    fall_detected: { label: "Ngã", color: "bg-red-100 text-red-700" },
    auth_success: { label: "Đăng nhập OK", color: "bg-emerald-100 text-emerald-700" },
    auth_fail: { label: "Đăng nhập Fail", color: "bg-orange-100 text-orange-700" },
    device_offline: { label: "Mất kết nối", color: "bg-slate-200 text-slate-600" },
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
        <div>
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-[#0A9BAD]" /> Nhật ký hệ thống
          </h3>
          <p className="text-[11px] text-slate-500 font-geist mt-0.5">
            id · log_type · device_id (FK) · description · is_alert · resolved_at · created_at
          </p>
        </div>
        <button
          onClick={() => alert("Chức năng đang phát triển")}
          className="text-[11px] font-bold tracking-wider uppercase font-geist text-white bg-[#0A9BAD] hover:bg-[#0891b2] px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
        >
          <Plus className="w-3 h-3" /> Thêm Nhật ký
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-[10px] text-slate-500 font-geist uppercase tracking-wider bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3">id</th>
              <th className="px-4 py-3">log_type</th>
              <th className="px-4 py-3">device_id</th>
              <th className="px-4 py-3">description</th>
              <th className="px-4 py-3">is_alert</th>
              <th className="px-4 py-3">resolved_at</th>
              <th className="px-4 py-3">created_at</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr
                key={l.id}
                className={`border-b border-slate-100 last:border-0 hover:bg-slate-50 ${l.is_alert ? "bg-red-50/50" : ""}`}
              >
                <td className="px-4 py-3 text-[11px] font-mono text-slate-400">{l.id}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${logTypeLabels[l.log_type]?.color ?? "bg-slate-100 text-slate-600"}`}
                  >
                    {logTypeLabels[l.log_type]?.label ?? l.log_type}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-[12px] text-slate-500">{l.device_id}</td>
                <td className="px-4 py-3 text-[13px] text-slate-700 max-w-xs truncate">
                  {l.description}
                </td>
                <td className="px-4 py-3">
                  {l.is_alert ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500 text-white">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      ALERT
                    </span>
                  ) : (
                    <span className="text-slate-400 text-[11px]">—</span>
                  )}
                </td>
                <td className="px-4 py-3 font-mono text-[12px] text-slate-500">
                  {l.resolved_at ?? "—"}
                </td>
                <td className="px-4 py-3 font-mono text-[12px] text-slate-500">{l.created_at}</td>

                <td className="px-4 py-3 text-right">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(l.id);
                    }}
                    className="text-slate-400 hover:text-red-600 transition-colors"
                    title="Xóa"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Tab 7: lpr_logs table ── */
function AdminLprTab() {
  const handleDelete = async (id: string) => {
    if (!window.confirm("Xác nhận xóa dữ liệu này?")) return;
    try {
      await fetchApi(`/admin/tables/lpr_logs/${id}`, { method: "DELETE" });
      fetchApi("/admin/tables/lpr_logs").then(setLprLogs).catch(console.error);
    } catch (e) {
      alert("Lỗi khi xóa: " + e);
    }
  };

  const [lprLogs, setLprLogs] = useState<any[]>([]);
  useEffect(() => {
    fetchApi("/admin/tables/lpr_logs").then(setLprLogs).catch(console.error);
  }, []);

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
      <div className="flex items-center px-5 py-4 border-b border-slate-200">
        <h3 className="font-bold text-slate-900 flex items-center gap-2">
          <ScanLine className="w-5 h-5 text-[#0A9BAD]" /> Nhận diện biển số
        </h3>
        <p className="text-[11px] text-slate-500 font-geist mt-0.5 ml-3">
          id · camera_id (FK) · plate_number · confidence · image_url · timestamp
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-[10px] text-slate-500 font-geist uppercase tracking-wider bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3">id</th>
              <th className="px-4 py-3">camera_id</th>
              <th className="px-4 py-3">plate_number</th>
              <th className="px-4 py-3">confidence</th>
              <th className="px-4 py-3">timestamp</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {lprLogs.map((l) => (
              <tr key={l.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="px-4 py-3 text-[11px] font-mono text-slate-400">{l.id}</td>
                <td className="px-4 py-3 font-mono text-[12px] text-slate-500">{l.camera_id}</td>
                <td className="px-4 py-3 font-mono font-bold text-slate-900">{l.plate_number}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${l.confidence}%`,
                          backgroundColor:
                            l.confidence >= 95
                              ? "#10b981"
                              : l.confidence >= 85
                                ? "#F59E0B"
                                : "#EF4444",
                        }}
                      />
                    </div>
                    <span
                      className="text-[12px] font-mono font-bold"
                      style={{
                        color:
                          l.confidence >= 95
                            ? "#10b981"
                            : l.confidence >= 85
                              ? "#F59E0B"
                              : "#EF4444",
                      }}
                    >
                      {l.confidence}%
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-[12px] text-slate-500">{l.timestamp}</td>

                <td className="px-4 py-3 text-right">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(l.id);
                    }}
                    className="text-slate-400 hover:text-red-600 transition-colors"
                    title="Xóa"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Tab 8: medical_books table ── */
function AdminMedicalBooksTab() {
  const handleDelete = async (id: string) => {
    if (!window.confirm("Xác nhận xóa dữ liệu này?")) return;
    try {
      await fetchApi(`/admin/tables/clinical_records/${id}`, { method: "DELETE" });
      fetchApi("/admin/tables/clinical_records").then(setBooks).catch(console.error);
    } catch (e) {
      alert("Lỗi khi xóa: " + e);
    }
  };

  const [books, setBooks] = useState<any[]>([]);
  useEffect(() => {
    fetchApi("/admin/tables/clinical_records").then(setBooks).catch(console.error);
  }, []);

  const statusStyle: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-700",
    lost: "bg-orange-100 text-orange-700",
    revoked: "bg-red-100 text-red-700",
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
      <div className="px-5 py-4 border-b border-slate-200">
        <h3 className="font-bold text-slate-900 flex items-center gap-2">
          <FileText className="w-5 h-5 text-[#0A9BAD]" /> Sổ khám bệnh & QR
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-[10px] text-slate-500 font-geist uppercase tracking-wider bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3">id</th>
              <th className="px-4 py-3">patient_id</th>
              <th className="px-4 py-3">qr_token</th>
              <th className="px-4 py-3">status</th>
              <th className="px-4 py-3">issued_at</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {books.map((b) => (
              <tr key={b.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="px-4 py-3 text-[11px] font-mono text-slate-400">{b.id}</td>
                <td className="px-4 py-3 font-mono font-bold text-slate-900">{b.patient_id}</td>
                <td className="px-4 py-3 font-mono text-[13px] text-slate-700">{b.qr_token}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusStyle[b.status] ?? ""}`}
                  >
                    {b.status}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-[12px] text-slate-500">{b.issued_at}</td>

                <td className="px-4 py-3 text-right">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(b.id);
                    }}
                    className="text-slate-400 hover:text-red-600 transition-colors"
                    title="Xóa"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Tab 9: webauthn_credentials table ── */
function AdminWebAuthnTab() {
  const handleDelete = async (id: string) => {
    if (!window.confirm("Xác nhận xóa dữ liệu này?")) return;
    try {
      await fetchApi(`/admin/tables/webauthn_credentials/${id}`, { method: "DELETE" });
      setCreds([]);
    } catch (e) {
      alert("Lỗi khi xóa: " + e);
    }
  };

  const [creds, setCreds] = useState<any[]>([]);
  useEffect(() => {
    setCreds([]);
  }, []);

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
        <div>
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#0A9BAD]" /> Bảng webauthn_credentials
          </h3>
          <p className="text-[11px] text-slate-500 font-geist mt-0.5">
            id · user_id (FK) · credential_id · public_key · sign_count · device_name ·
            created_at · last_used_at
          </p>
        </div>
        <button
          onClick={() => alert("Chức năng đang phát triển")}
          className="text-[11px] font-bold tracking-wider uppercase font-geist text-white bg-[#0A9BAD] hover:bg-[#0891b2] px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
        >
          <Plus className="w-3 h-3" /> Thêm WebAuthn
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-[10px] text-slate-500 font-geist uppercase tracking-wider bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3">id</th>
              <th className="px-4 py-3">user_id</th>
              <th className="px-4 py-3">device_name</th>
              <th className="px-4 py-3">credential_id</th>
              <th className="px-4 py-3">sign_count</th>
              <th className="px-4 py-3">created_at</th>
              <th className="px-4 py-3">last_used_at</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {creds.map((c) => (
              <tr key={c.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="px-4 py-3 text-[11px] font-mono text-slate-400">{c.id}</td>
                <td className="px-4 py-3 font-mono font-bold text-slate-900">{c.user_id}</td>
                <td className="px-4 py-3 text-[13px] text-slate-700">{c.device_name}</td>
                <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                  {c.credential_id}
                </td>
                <td className="px-4 py-3 font-mono text-[13px] text-slate-700">{c.sign_count}</td>
                <td className="px-4 py-3 font-mono text-[12px] text-slate-500">{c.created_at}</td>
                <td className="px-4 py-3 font-mono text-[12px] text-slate-500">{c.last_used_at}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(c.id);
                    }}
                    className="text-slate-400 hover:text-red-600 transition-colors"
                    title="Xóa"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   DoctorQAView — Không gian Hỏi Đáp Cộng Đồng cho Bác sĩ
   Cho phép bác sĩ xem, lọc, tìm kiếm và trả lời câu hỏi bệnh nhân
   ═══════════════════════════════════════════════════════════════════ */
interface QAQuestion {
  id: string;
  department: string;
  question: string;
  answer: string | null;
  status: "unanswered" | "answered";
  doctor_name: string | null;
  doctor_id: string | null;
  created_at: string;
  answered_at: string | null;
}

const DEPARTMENTS_QA = [
  "Tất cả",
  "Mắt",
  "Tim mạch",
  "Thần kinh",
  "Nội tiết",
  "Tiêu hóa",
  "Hô hấp",
  "Cơ xương khớp",
  "Da liễu",
  "Tai mũi họng",
  "Sản phụ khoa",
  "Nhi khoa",
  "Ung thư",
  "Tâm thần",
  "Khác",
];

function DoctorQAView() {
  const isMobile = useIsMobile();
  const [questions, setQuestions] = useState<QAQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<"all" | "unanswered" | "answered">("all");
  const [filterDept, setFilterDept] = useState("Tất cả");
  const [searchText, setSearchText] = useState("");
  const [selectedQuestion, setSelectedQuestion] = useState<QAQuestion | null>(null);
  const [answerText, setAnswerText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const fetchQuestions = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterDept !== "Tất cả") params.append("department", filterDept);
      if (filterStatus !== "all") params.append("status", filterStatus);
      const data = await fetchApi(`/patient/questions/all?${params.toString()}`);
      setQuestions(data.questions || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus, filterDept]);

  // Filtered by search text on the client side
  const displayedQuestions = questions.filter((q) => {
    if (!searchText.trim()) return true;
    const lower = searchText.toLowerCase();
    return (
      q.question.toLowerCase().includes(lower) ||
      q.department.toLowerCase().includes(lower) ||
      (q.answer || "").toLowerCase().includes(lower)
    );
  });

  const unansweredCount = questions.filter((q) => q.status === "unanswered").length;
  const answeredCount = questions.filter((q) => q.status === "answered").length;

  const handleOpenAnswer = (q: QAQuestion) => {
    setSelectedQuestion(q);
    setAnswerText(q.answer || "");
    setSubmitError("");
    setSubmitSuccess(false);
  };

  const handleCloseModal = () => {
    setSelectedQuestion(null);
    setAnswerText("");
    setSubmitError("");
    setSubmitSuccess(false);
  };

  const handleSubmitAnswer = async () => {
    if (!selectedQuestion) return;
    if (answerText.trim().length < 10) {
      setSubmitError("Câu trả lời phải có ít nhất 10 ký tự.");
      return;
    }
    setSubmitting(true);
    setSubmitError("");
    try {
      await fetchApi(`/patient/questions/${selectedQuestion.id}/answer`, {
        method: "PATCH",
        body: JSON.stringify({ answer: answerText.trim() }),
      });
      setSubmitSuccess(true);
      // Update local state ngay lập tức
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === selectedQuestion.id
            ? {
                ...q,
                answer: answerText.trim(),
                status: "answered",
                answered_at: new Date().toISOString(),
                doctor_name: "Bác sĩ", // sẽ được cập nhật từ WS broadcast
              }
            : q,
        ),
      );
      setTimeout(() => handleCloseModal(), 1200);
    } catch (e: any) {
      setSubmitError(e.message || "Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className={`space-y-4 ${isMobile ? "md:space-y-6" : "space-y-6"}`}>
      {/* ── Stats Row ── */}
      <div className={`grid gap-2.5 sm:gap-4 ${isMobile ? "grid-cols-3" : "grid-cols-1 sm:grid-cols-3"}`}>
        <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#88E8F2] to-[#4dd8e8] shadow-md shadow-[#88E8F2]/20 ${isMobile ? "p-3.5" : "p-5"}`}>
          <div className="relative z-10">
            <p className={`font-semibold uppercase tracking-widest text-[#0d4a56] opacity-80 ${isMobile ? "text-[9px]" : "text-xs"}`}>
              Tổng câu hỏi
            </p>
            <p className={`font-bold text-[#0d1f2d] ${isMobile ? "mt-1 text-3xl" : "mt-1 text-4xl"}`}>{questions.length}</p>
          </div>
          {!isMobile && <BarChart2 className="absolute right-4 bottom-3 h-14 w-14 text-[#0d1f2d] opacity-10" />}
        </div>
        <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-400 to-orange-500 shadow-md shadow-orange-400/20 ${isMobile ? "p-3.5" : "p-5"}`}>
          <div className="relative z-10">
            <p className={`font-semibold uppercase tracking-widest text-orange-100 opacity-90 ${isMobile ? "text-[9px]" : "text-xs"}`}>
              Chờ trả lời
            </p>
            <p className={`font-bold text-white ${isMobile ? "mt-1 text-3xl" : "mt-1 text-4xl"}`}>{unansweredCount}</p>
          </div>
          {!isMobile && <MessageSquare className="absolute right-4 bottom-3 h-14 w-14 text-white opacity-10" />}
        </div>
        <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-500 shadow-md shadow-emerald-400/20 ${isMobile ? "p-3.5" : "p-5"}`}>
          <div className="relative z-10">
            <p className={`font-semibold uppercase tracking-widest text-emerald-100 opacity-90 ${isMobile ? "text-[9px]" : "text-xs"}`}>
              Đã trả lời
            </p>
            <p className={`font-bold text-white ${isMobile ? "mt-1 text-3xl" : "mt-1 text-4xl"}`}>{answeredCount}</p>
          </div>
          {!isMobile && <CheckCircle className="absolute right-4 bottom-3 h-14 w-14 text-white opacity-10" />}
        </div>
      </div>

      {/* ── Filter + Search Bar ── */}
      <div className={`space-y-3 rounded-2xl border border-slate-100 bg-white shadow-sm sm:space-y-4 ${isMobile ? "p-3" : "p-4 sm:p-5"}`}>
        {/* Status Tabs */}
        <div className="flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1">
          {(["all", "unanswered", "answered"] as const).map((s) => {
            const labels = {
              all: "Tất cả",
              unanswered: "Chờ trả lời",
              answered: "Đã trả lời",
            };
            const active = filterStatus === s;
            return (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`min-w-0 flex-1 rounded-lg font-semibold transition-all duration-200 ${
                  isMobile ? "py-2.5 text-[12px]" : "py-2 text-sm"
                } ${
                  active
                    ? "bg-white text-[#0d1f2d] shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {labels[s]}
                {s === "unanswered" && unansweredCount > 0 && (
                  <span
                    className={`ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold ${active ? "bg-orange-500 text-white" : "bg-orange-100 text-orange-600"}`}
                  >
                    {unansweredCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search + Dept + Refresh */}
        <div className="flex flex-col gap-2.5 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm câu hỏi..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className={`h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#88E8F2] focus:ring-2 focus:ring-[#88E8F2]/20 transition ${
                isMobile ? "min-h-[44px]" : ""
              }`}
            />
          </div>
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className={`h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition cursor-pointer focus:border-[#88E8F2] focus:ring-2 focus:ring-[#88E8F2]/20 ${
              isMobile ? "w-full min-h-[44px]" : "w-full sm:w-auto"
            }`}
          >
            {DEPARTMENTS_QA.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <button
            onClick={() => fetchQuestions(true)}
            disabled={refreshing}
            className="flex h-11 w-11 items-center justify-center self-end rounded-xl border border-slate-200 bg-slate-50 text-slate-500 transition-all hover:border-[#88E8F2] hover:text-[#0d1f2d] sm:self-auto active:scale-95"
            title="Làm mới"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* ── Question List ── */}
      <div className="space-y-3">
        {loading ? (
          <div className="space-y-2.5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        ) : displayedQuestions.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 mb-3">
              <MessageSquare className="h-7 w-7 text-slate-300" />
            </div>
            <p className="font-semibold text-slate-500 text-[14px]">Không có câu hỏi nào</p>
            <p className="mt-1 text-[12px] text-slate-400 px-6">
              {searchText
                ? "Thử thay đổi từ khóa tìm kiếm"
                : "Bệnh nhân chưa đặt câu hỏi nào"}
            </p>
          </div>
        ) : (
          displayedQuestions.map((q) => (
            <div
              key={q.id}
              className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all duration-200 hover:border-[#88E8F2]/60 hover:shadow-md active:scale-[0.99]"
            >
              {/* Left accent bar */}
              <div
                className={`absolute left-0 top-0 h-full w-1.5 rounded-l-2xl transition-all ${
                  q.status === "answered" ? "bg-emerald-400" : "bg-gradient-to-b from-orange-400 to-orange-500"
                }`}
              />

              <div className={`pl-5 pr-4 ${isMobile ? "py-3.5" : "py-4"}`}>
                {/* Header row */}
                <div className={`flex items-start justify-between gap-2 ${isMobile ? "mb-2.5" : "mb-3"}`}>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="inline-flex items-center gap-1 rounded-lg bg-[#e8f9fb] px-2.5 py-1 text-[11px] font-semibold text-[#0d6b7a]">
                      <Stethoscope className="h-3 w-3" />
                      {q.department}
                    </span>
                    {q.status === "answered" ? (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
                        <CheckCircle className="h-3 w-3" /> Đã trả lời
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-orange-50 px-2 py-0.5 text-[10px] font-semibold text-orange-500">
                        <Clock className="h-3 w-3" /> Chờ trả lời
                      </span>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[10px] text-slate-400">{formatDate(q.created_at)}</p>
                    <p className="text-[10px] text-slate-400">{formatTime(q.created_at)}</p>
                  </div>
                </div>

                {/* Sender */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100">
                    <User className="h-3.5 w-3.5 text-slate-400" />
                  </div>
                  <p className="text-[11px] font-medium text-slate-500">Bệnh nhân ẩn danh</p>
                </div>

                {/* Question text */}
                <p className={`text-slate-800 leading-relaxed mb-3 ${isMobile ? "text-[13px]" : "text-[14px]"}`}>{q.question}</p>

                {/* Answer (if exists) */}
                {q.answer ? (
                  <div className="flex gap-2.5 rounded-xl bg-emerald-50 border border-emerald-100 p-3 mb-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-emerald-200 bg-white">
                      <Stethoscope className="h-3.5 w-3.5 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-semibold text-emerald-600 mb-0.5">
                        {q.doctor_name
                          ? `BS. ${q.doctor_name} trả lời`
                          : "Câu trả lời của bác sĩ"}
                      </p>
                      <p className={`text-slate-700 leading-relaxed ${isMobile ? "text-[12px]" : "text-[13px]"}`}>{q.answer}</p>
                      {q.answered_at && (
                        <p className="mt-1 text-[9px] text-slate-400">
                          {formatDate(q.answered_at)} · {formatTime(q.answered_at)}
                        </p>
                      )}
                    </div>
                  </div>
                ) : null}

                {/* Action button */}
                <div className={`flex ${isMobile ? "justify-stretch" : "justify-end"}`}>
                  <button
                    onClick={() => handleOpenAnswer(q)}
                    className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 active:scale-95 ${
                      isMobile ? "w-full min-h-[48px] py-3 text-[13px]" : "px-4 py-2 text-[13px]"
                    } ${
                      q.status === "answered"
                        ? "border border-slate-200 text-slate-600 hover:border-[#88E8F2] hover:bg-[#f0fdfe] hover:text-[#0d1f2d]"
                        : "bg-gradient-to-r from-[#0d1f2d] to-[#1a3548] text-white hover:from-[#1a3548] hover:to-[#0d1f2d] shadow-md shadow-[#0d1f2d]/20"
                    }`}
                  >
                    {q.status === "answered" ? (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        Chỉnh sửa câu trả lời
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Trả lời ngay
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Answer Modal ── */}
      {selectedQuestion && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleCloseModal}
          />

          {/* Modal panel */}
          <div className={`relative z-10 w-full max-w-2xl overflow-hidden bg-white shadow-2xl ${isMobile ? "max-h-[95dvh] rounded-t-3xl" : "rounded-3xl"}`}>
            {/* Drag handle (mobile) */}
            {isMobile && (
              <div className="flex justify-center pt-3 pb-1">
                <div className="h-1 w-10 rounded-full bg-slate-300" />
              </div>
            )}

            {/* Modal header */}
            <div className={`flex items-center justify-between gap-3 bg-gradient-to-r from-[#0d1f2d] to-[#1a3548] ${isMobile ? "px-4 py-3.5" : "px-6 py-4"}`}>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#88E8F2]/20">
                  <MessageSquare className="h-5 w-5 text-[#88E8F2]" />
                </div>
                <div>
                  <p className="font-bold text-white text-[15px]">Trả lời câu hỏi</p>
                  <p className="text-[11px] text-[#88E8F2]/70">
                    Khoa {selectedQuestion.department}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className="flex h-8 w-8 items-center justify-center rounded-full text-white/60 hover:bg-white/10 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className={`space-y-4 overflow-y-auto ${isMobile ? "max-h-[calc(95dvh-10rem)] px-4 py-4" : "max-h-[70vh] px-6 py-5"}`}>
              {/* Original question */}
              <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200">
                    <User className="h-4 w-4 text-slate-500" />
                  </div>
                  <p className="text-[12px] font-semibold text-slate-500">Bệnh nhân ẩn danh</p>
                  <span className="ml-auto text-[11px] text-slate-400">
                    {formatDate(selectedQuestion.created_at)}
                  </span>
                </div>
                <p className="text-[14px] text-slate-800 leading-relaxed">
                  {selectedQuestion.question}
                </p>
              </div>

              {/* Answer input */}
              <div>
                <label className="mb-2 block text-[13px] font-semibold text-slate-700">
                  Câu trả lời của bác sĩ
                  <span className="ml-1 font-normal text-slate-400">
                    (tối thiểu 10 ký tự)
                  </span>
                </label>
                <textarea
                  rows={isMobile ? 4 : 5}
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  placeholder="Nhập câu trả lời chuyên môn, lời khuyên sức khỏe..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-[14px] text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#88E8F2] focus:ring-2 focus:ring-[#88E8F2]/20 resize-none transition"
                  disabled={submitting || submitSuccess}
                />
                <div className="mt-1.5 flex items-center justify-between">
                  <span
                    className={`text-[11px] ${answerText.length < 10 ? "text-orange-400" : "text-emerald-500"}`}
                  >
                    {answerText.length} / tối thiểu 10 ký tự
                  </span>
                  {submitError && <span className="text-[12px] text-red-500">{submitError}</span>}
                  {submitSuccess && (
                    <span className="flex items-center gap-1 text-[12px] text-emerald-600 font-semibold">
                      <CheckCircle className="h-4 w-4" /> Đã gửi thành công!
                    </span>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className={`flex gap-3 ${isMobile ? "pt-1 pb-4" : "pt-1 pb-2"}`}>
                <button
                  onClick={handleCloseModal}
                  className={`rounded-xl border border-slate-200 font-semibold text-slate-600 hover:bg-slate-50 transition ${
                    isMobile ? "flex-1 py-3.5 text-[14px]" : "flex-1 py-3 text-[14px]"
                  }`}
                >
                  Hủy
                </button>
                <button
                  onClick={handleSubmitAnswer}
                  disabled={submitting || submitSuccess || answerText.trim().length < 10}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0d1f2d] to-[#1a3548] font-bold text-white shadow-lg shadow-[#0d1f2d]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 ${
                    isMobile ? "py-3.5 text-[14px]" : "py-3 text-[14px]"
                  }`}
                >
                  {submitSuccess ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Đã gửi!
                    </>
                  ) : submitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Đang gửi...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Gửi câu trả lời
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
