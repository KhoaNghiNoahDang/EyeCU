import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { useAuth, type WorkMode } from "../lib/auth/auth-context";
import {
  Activity,
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
  Clipboard,
  Droplets,
  Thermometer,
  TrendingUp,
  X,
  Zap,
  Users,
  Camera,
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
  | "records"
  | "voice"
  | "chatbot"
  | "patient"
  | "ems"
  | "admin_dashboard";

const navItems: { key: ViewKey; Icon: typeof Eye; label: string }[] = [
  { key: "ambient", Icon: Eye, label: "Giám sát Không gian" },
  { key: "ambulance", Icon: Ambulance, label: "Điều phối Cấp cứu" },
  { key: "records", Icon: ScanLine, label: "Hồ sơ Bệnh nhân" },
  { key: "voice", Icon: Mic, label: "Bệnh án Giọng nói" },
  { key: "chatbot", Icon: Bot, label: "Trợ lý AI Bệnh nhân" },
  { key: "ems" as ViewKey, Icon: Siren, label: "Cấp cứu Ngoại viện" },
  { key: "admin_dashboard" as ViewKey, Icon: Settings, label: "Quản trị Hệ thống" },
];

const roleConfig: Record<WorkMode, { label: string; views: ViewKey[]; defaultView: ViewKey }> = {
  admin: {
    label: "Quản trị Hệ thống",
    views: ["admin_dashboard"] as ViewKey[],
    defaultView: "admin_dashboard" as ViewKey,
  },
  ops: {
    label: "Trực Cấp cứu",
    views: ["ambient", "ambulance"],
    defaultView: "ambient",
  },
  clinician: {
    label: "Khám Lâm sàng",
    views: ["voice", "records"],
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
    title: "Giám sát Không gian — Đa Khoa",
    subtitle: "Giám sát AI Nhận thức · Sensor Fusion",
  },
  ambulance: { title: "Điều phối Cấp cứu", subtitle: "Bản đồ Hà Nội · Pre-admission · Kíp trực" },
  records: { title: "Hồ sơ Bệnh nhân", subtitle: "OCR · Xác thực sinh trắc học" },
  voice: { title: "Bệnh án Giọng nói", subtitle: "SmartVoice · Tự điền EMR" },
  chatbot: { title: "Trợ lý AI Bệnh nhân", subtitle: "Diễn giải kết quả · Giọng nói" },
  patient: { title: "Cổng thông tin Bệnh nhân", subtitle: "Mobile Portal · EyeCU" },
  ems: { title: "Cấp cứu Ngoại viện", subtitle: "Quét BN · Định vị GPS · Liên lạc Kíp trực" },
  admin_dashboard: { title: "Quản trị Hệ thống", subtitle: "Tổng quan · Nhân sự · Thiết bị · API" },
};

function PatientRounds() {
  const { user, workMode, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  // We must always call hooks at the top level
  const [activeView, setActiveView] = useState<ViewKey>("ambient");
  const [collapsed, setCollapsed] = useState(false);
  const [highlightedRoom, setHighlightedRoom] = useState<string | null>(null);

  // Re-sync activeView if workMode changes
  useEffect(() => {
    if (workMode && roleConfig[workMode] && !roleConfig[workMode].views.includes(activeView)) {
      setActiveView(roleConfig[workMode].defaultView);
    }
  }, [workMode, activeView]);

  // Auth guard
  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: "/login", replace: true });
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated || !workMode || !user) {
    return null; // Or a loading spinner
  }

  const meta = viewTitles[activeView];
  const visibleNav = navItems.filter((n) => roleConfig[workMode].views.includes(n.key));
  const isPatientRole = workMode === "patient";
  return (
    <div className="font-hanken text-slate-800 flex h-screen w-full overflow-hidden bg-white">
      {/* Side Nav — hidden in patient mobile mode */}
      {!isPatientRole && (
        <nav
          className={`h-screen fixed left-0 top-0 bg-white flex-col py-6 border-r border-slate-200 z-40 hidden md:flex transition-all duration-300 ${
            collapsed ? "w-20" : "w-64"
          }`}
        >
          <div className={`mb-4 ${collapsed ? "px-4" : "px-6"}`}>
            <div className="flex items-center gap-3 justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: ACCENT }}
                >
                  <Activity className="w-5 h-5 text-slate-900" strokeWidth={2.5} />
                </div>
                {!collapsed && (
                  <div className="min-w-0">
                    <h1 className="text-base font-bold leading-tight text-slate-900 truncate">
                      EyeCU
                    </h1>
                    <p className="text-[11px] tracking-wider text-slate-500 font-geist uppercase">
                      {roleConfig[workMode].label}
                    </p>
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
            {collapsed ? (
              <button
                onClick={() => setCollapsed(false)}
                className="w-full mt-5 py-2 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                aria-label="Expand sidebar"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                className="w-full mt-5 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 text-slate-900 hover:opacity-90 transition"
                style={{ backgroundColor: ACCENT }}
              >
                <Plus className="w-4 h-4" />
                Tiếp nhận mới
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
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all ${
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
              <li key="Trạng thái">
                <button
                  title={collapsed ? "Trạng thái" : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-geist text-[12px] uppercase tracking-wider ${
                    collapsed ? "justify-center" : ""
                  }`}
                >
                  <Cpu className="w-4 h-4 flex-shrink-0" />
                  {!collapsed && "Trạng thái"}
                </button>
              </li>
              <li key="Đăng xuất">
                <button
                  onClick={() => logout()}
                  title={collapsed ? "Đăng xuất" : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-geist text-[12px] uppercase tracking-wider ${
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
        className={`flex-1 flex flex-col h-full overflow-hidden bg-white transition-all duration-300 ${
          isPatientRole ? "" : collapsed ? "md:ml-20" : "md:ml-64"
        }`}
      >
        {/* Top Nav */}
        <header className="flex justify-between items-center w-full px-6 md:px-10 h-16 sticky top-0 z-30 bg-white border-b border-slate-200">
          <div className="flex items-center gap-4">
            <span className="text-xl font-bold md:hidden text-slate-900">EyeCU</span>
            {!isPatientRole && (
              <div className="hidden md:flex items-center bg-white border border-slate-200 rounded-full px-3 py-1">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm mã bệnh nhân..."
                  className="bg-transparent border-none outline-none text-sm w-48 ml-2 placeholder:text-slate-400 text-slate-800"
                />
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            {/* Current user */}
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-full px-3 py-1.5 text-[12px] font-geist tracking-wider text-slate-700">
              <span className="text-slate-400 normal-case tracking-normal text-[11px] uppercase">
                Ca hiện tại:
              </span>
              <span className="text-slate-900 font-bold uppercase">
                {roleConfig[workMode].label}
              </span>
            </div>
            {!isPatientRole && (
              <>
                <button className="text-slate-600 hover:bg-slate-50 p-2 rounded-full transition-colors">
                  <Bell className="w-5 h-5" />
                </button>
                <button className="text-slate-600 hover:bg-slate-50 p-2 rounded-full hidden sm:block transition-colors">
                  <Settings className="w-5 h-5" />
                </button>
                <button className="text-slate-600 hover:bg-slate-50 p-2 rounded-full hidden sm:block transition-colors">
                  <HelpCircle className="w-5 h-5" />
                </button>
                <button
                  className="text-slate-900 text-[12px] font-geist uppercase tracking-wider px-4 py-2 rounded-full transition-colors flex items-center gap-2 hover:opacity-90"
                  style={{ backgroundColor: ACCENT }}
                >
                  <AlertTriangle className="w-4 h-4" />
                  Khẩn cấp
                </button>
              </>
            )}
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
              {user.avatar ? (
                <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-4 h-4 text-slate-400" />
              )}
            </div>
          </div>
        </header>

        {/* Canvas */}
        <div className="flex-1 overflow-y-auto scrollbar-hide p-4 md:p-6 bg-white">
          <div className="max-w-7xl mx-auto space-y-4">
            {!isPatientRole && (
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
                <div>
                  <h2 className="text-3xl font-light tracking-tight text-slate-900">
                    {meta.title}
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">{meta.subtitle}</p>
                </div>
                <div className="mt-4 md:mt-0 flex gap-2">
                  {[
                    { Icon: Filter, l: "Lọc" },
                    { Icon: MapIcon, l: "Bản đồ" },
                  ].map(({ Icon, l }) => (
                    <button
                      key={l}
                      className="bg-white border border-slate-200 px-4 py-2 rounded-lg text-[12px] font-geist uppercase tracking-wider flex items-center gap-2 text-slate-700 hover:border-[#88E8F2] transition-colors"
                    >
                      <Icon className="w-4 h-4" />
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeView === "ambient" && (
              <AmbientView
                highlightedRoom={highlightedRoom}
                setHighlightedRoom={setHighlightedRoom}
              />
            )}
            {activeView === "ambulance" && <AmbulanceView />}
            {activeView === "records" && <RecordsView />}
            {activeView === "voice" && <VoiceView />}
            {activeView === "chatbot" && <ChatbotView />}
            {activeView === "patient" && <PatientPortalView />}
            {activeView === "ems" && <EmsView />}
            {activeView === "admin_dashboard" && <AdminDashboardView />}
          </div>
        </div>
      </main>
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
  { room: "CT02", zone: "D", status: "alert", overlay: "fall", label: "Phòng bệnh", dept: "ortho" },
  { room: "CT03", zone: "D", status: "stable", label: "Phòng vật lý trị liệu", dept: "ortho" },
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
  const [selectedDept, setSelectedDept] = useState("internal");
  const [onlyAlerts, setOnlyAlerts] = useState(false);
  const [fullscreen, setFullscreen] = useState<Camera | null>(null);

  const deptCameras = ALL_CAMERAS.filter((c) => c.dept === selectedDept);
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

  return (
    <>
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-medium text-slate-900 flex items-center gap-2">
              <Video className="w-5 h-5" style={{ color: ACCENT }} />
              Camera AI Giám sát — {currentTab?.name}
            </h3>
            <p className="text-[11px] text-slate-500 font-geist mt-0.5">
              {deptCameras.length} camera · Phân tích hành vi · Phát hiện ngã · Nhận dạng âm thanh
            </p>
          </div>
          <div className="flex items-center gap-2">
            {alertCount > 0 && (
              <span className="px-2 py-1 rounded-lg text-[10px] font-bold text-white bg-red-500 flex items-center gap-1 animate-pulse">
                ⚠ {alertCount} Cảnh báo
              </span>
            )}
            <span
              className="px-2 py-1 rounded text-[10px] font-geist uppercase tracking-wider text-slate-900 flex items-center gap-1"
              style={{ backgroundColor: ACCENT }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
              Trực tiếp
            </span>
          </div>
        </div>

        {/* Department tab bar — horizontally scrollable */}
        <div className="-mx-1 mb-4">
          <div className="flex overflow-x-auto whitespace-nowrap scrollbar-hide gap-3 pb-2 px-1">
            {DEPT_TABS.map((tab) => {
              const tabCams = ALL_CAMERAS.filter((c) => c.dept === tab.id);
              const tabAlerts = tabCams.filter((c) => c.status === "alert").length;
              const isActive = selectedDept === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setSelectedDept(tab.id);
                    setOnlyAlerts(false);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all flex-shrink-0 border"
                  style={{
                    backgroundColor: isActive ? tab.color : "#F8FAFC",
                    color: isActive ? "#fff" : "#475569",
                    borderColor: isActive ? tab.color : "#E2E8F0",
                    boxShadow: isActive ? `0 2px 8px ${tab.color}50` : undefined,
                  }}
                >
                  <span className="text-[12px] font-semibold tracking-wide">{tab.name}</span>
                  <span className="opacity-70 text-[9px]">({tabCams.length})</span>
                  {tabAlerts > 0 && (
                    <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[8px] font-bold flex items-center justify-center">
                      {tabAlerts}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-200">
          <button
            onClick={() => setOnlyAlerts((v) => !v)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-[12px] font-geist uppercase tracking-wider transition-colors ${
              onlyAlerts
                ? "text-slate-900 border-transparent"
                : "bg-white border-slate-200 text-slate-700 hover:border-[#88E8F2]"
            }`}
            style={onlyAlerts ? { backgroundColor: ACCENT } : undefined}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            {onlyAlerts ? `Cảnh báo (${alertCount})` : "Chỉ hiện Cảnh báo"}
          </button>
          <span className="text-[11px] font-geist text-slate-400">
            {filtered.length} / {deptCameras.length} camera
          </span>
        </div>

        {/* Camera grid — split when multiple alerts */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <Video className="w-10 h-10 mb-2 opacity-30" />
            <p className="text-sm">Không có cảnh báo nào trong {currentTab?.name}</p>
          </div>
        ) : (
          (() => {
            const alerts = filtered.filter((c) => c.status === "alert");
            const stable = filtered.filter((c) => c.status !== "alert");
            const multiAlarm = alerts.length >= 2 && !onlyAlerts;
            if (!multiAlarm) {
              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filtered.map((cam) => (
                    <CameraCard
                      key={cam.room}
                      cam={cam}
                      highlighted={highlightedRoom === cam.room}
                      onClick={() => setFullscreen(cam)}
                    />
                  ))}
                </div>
              );
            }
            return (
              <div className="space-y-5">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <h4 className="text-[11px] font-bold uppercase tracking-widest text-red-600">
                      Sự cố đang xử lý · {alerts.length}
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {alerts.map((cam) => (
                      <CameraCard
                        key={cam.room}
                        cam={cam}
                        highlighted={highlightedRoom === cam.room}
                        onClick={() => setFullscreen(cam)}
                      />
                    ))}
                  </div>
                </div>
                {stable.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <h4 className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                        Phòng ổn định · {stable.length}
                      </h4>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                      {stable.map((cam) => (
                        <button
                          key={cam.room}
                          onClick={() => setFullscreen(cam)}
                          className="flex items-center gap-2 p-2 border border-slate-200 rounded-lg bg-white hover:border-[#88E8F2] transition text-left"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[11px] font-bold text-slate-900 truncate">
                              Phòng {cam.room}
                            </p>
                            <p className="text-[9px] text-slate-500 uppercase tracking-wider">
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

      {/* Privacy-by-Design Camera Demo */}
      <PrivacyCameraFeed />

      {fullscreen && <CameraModal cam={fullscreen} onClose={() => setFullscreen(null)} />}
    </>
  );
}

function CameraCard({
  cam,
  highlighted,
  onClick,
}: {
  cam: Camera;
  highlighted: boolean;
  onClick: () => void;
}) {
  const isAlert = cam.status === "alert";
  const ring = highlighted ? "ring-4 ring-offset-2 ring-[#88E8F2]" : "";
  const borderCls = isAlert ? "border-4 border-red-500 animate-pulse" : "border border-slate-200";
  return (
    <button
      onClick={onClick}
      className={`group relative aspect-video rounded-xl overflow-hidden bg-slate-800 text-left ${borderCls} ${ring} hover:scale-[1.02] cursor-pointer transition-all duration-200`}
    >
      <CameraFeed cam={cam} />

      {/* Room pill */}
      <div className="absolute top-2 left-2 z-10 backdrop-blur-sm bg-black/40 text-white text-[11px] font-geist px-2 py-1 rounded-full flex items-center gap-1.5">
        <Video className="w-3 h-3" />
        Phòng {cam.room}
      </div>

      {/* Status dot */}
      <div className="absolute top-2 right-2 z-10 backdrop-blur-sm bg-black/40 px-2 py-1 rounded-full flex items-center gap-1.5">
        <span
          className="w-1.5 h-1.5 rounded-full animate-pulse"
          style={{ backgroundColor: isAlert ? "#EF4444" : ACCENT }}
        />
        <span className="text-[10px] uppercase tracking-wider text-white font-geist">
          {isAlert ? "Cảnh báo" : "Ổn định"}
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
  return (
    <div className="absolute inset-0">
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
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" style={{ color: ACCENT }} />
            Privacy-by-Design · Pose Estimation AI
          </h3>
          <p className="text-[11px] text-slate-500 font-geist mt-0.5">
            Không hiển thị hình ảnh thật · Skeleton Overlay + Audio Spectrogram · Sensor Fusion
          </p>
        </div>
        <span
          className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg"
          style={{
            backgroundColor: isCritical ? "#FEE2E2" : "#F0FDF4",
            color: isCritical ? "#DC2626" : "#16A34A",
          }}
        >
          {isCritical ? "⚠ FUSION ALERT" : "✓ Privacy Shield"}
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
            {/* Scanlines */}
            <div
              className="absolute inset-0 pointer-events-none z-0"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(0deg, rgba(255,255,255,0.025) 0 1px, transparent 1px 3px)",
              }}
            />
            {/* Room bg */}
            <div
              className="absolute inset-0 z-0"
              style={{ background: "radial-gradient(ellipse at center, #0d2030 0%, #060e16 100%)" }}
            />
            <svg viewBox="0 0 320 180" className="absolute inset-0 w-full h-full opacity-15 z-0">
              <path d="M0 120 L80 70 L240 70 L320 120 L320 180 L0 180 Z" fill="#1e3a4a" />
              <rect x="110" y="80" width="100" height="50" fill="#1a2f3d" rx="2" />
              <line x1="0" y1="120" x2="320" y2="120" stroke="#334155" strokeWidth="1" />
            </svg>

            {/* Top-left badge */}
            <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm rounded-full px-2.5 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[10px] font-mono text-white">Camera 103 – Khoa Nội</span>
            </div>

            {/* Timestamp */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 text-[9px] font-mono text-white/40">
              {timestamp} · 1080p · 30fps
            </div>

            {/* Top-right status */}
            <div className="absolute top-3 right-3 z-20">
              <span
                className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-all duration-500"
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
                    <span className="text-red-400 font-black text-base tracking-[0.2em] drop-shadow-[0_0_16px_rgba(239,68,68,0.9)]">
                      PHÁT HIỆN TƯ THẾ NGÃ
                    </span>
                    <br />
                    <span className="text-[9px] text-red-300/80 font-geist uppercase tracking-wider">
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
            className={`mt-2 rounded-lg px-3 py-2 flex items-center justify-between text-[10px] font-geist transition-colors duration-500 ${isCritical ? "bg-red-50 border border-red-200" : "bg-slate-50 border border-slate-200"}`}
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
              {isCritical ? "HỢP NHẤT CẢM BIẾN ⚡" : "Đang giám sát"}
            </span>
          </div>

          {/* Demo button */}
          <div className="mt-3 flex gap-2">
            {!isCritical ? (
              <button
                id="privacy-camera-demo-btn"
                onClick={triggerFall}
                disabled={transitioning}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-slate-900 hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: `linear-gradient(135deg, ${ACCENT} 0%, #5DD3E0 100%)` }}
              >
                <Siren className="w-4 h-4" />
                Mô phỏng: Kích hoạt sự cố ngã
              </button>
            ) : (
              <button
                onClick={resetState}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-800"
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
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" style={{ color: ACCENT }} />
              Privacy-by-Design · Nguyên lý
            </p>
            <div className="space-y-2.5 text-[11px]">
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
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">
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
                  <div className="flex justify-between text-[10px] mb-1">
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
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                Nhật ký sự kiện
              </p>
              <div className="space-y-1.5 text-[10px] font-mono">
                {isCritical ? (
                  <>
                    <div className="flex gap-2 text-red-600">
                      <span className="text-slate-400">14:32:07</span> Phát hiện ngã · Phòng 103
                    </div>
                    <div className="flex gap-2 text-red-500">
                      <span className="text-slate-400">14:32:07</span> Âm thanh bất thường · Va đập
                      91dB
                    </div>
                    <div className="flex gap-2 text-red-500">
                      <span className="text-slate-400">14:32:08</span> Cảnh báo hợp nhất → Kíp trực
                    </div>
                    <div className="flex gap-2 text-amber-600">
                      <span className="text-slate-400">14:32:08</span> Đã điều xe cấp cứu
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex gap-2 text-emerald-600">
                      <span className="text-slate-400">{timestamp}</span> Tư thế bình thường · Dáng
                      đi ổn định
                    </div>
                    <div className="flex gap-2 text-slate-400">
                      <span className="text-slate-400">14:31:55</span> Âm thanh · Môi trường 32dB
                    </div>
                    <div className="flex gap-2 text-slate-400">
                      <span className="text-slate-400">14:31:40</span> Toàn bộ hệ thống bình thường
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
            ✕
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
              Hệ thống AI phát hiện dáng người nằm sàn · Đã thông báo điều dưỡng trực
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
  const [alerts, setAlerts] = useState<AlertData[]>(INITIAL_ALERTS);
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
    icon: "🚨",
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
    icon: "🫀",
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
    icon: "🧠",
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
    icon: "🫁",
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
    icon: "🦴",
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
    icon: "🏥",
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
    icon: "💊",
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
    icon: "🧪",
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
    icon: "🦷",
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
    icon: "🫘",
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
    icon: "👶",
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
    icon: "🤰",
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
    icon: "💉",
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
    icon: "🎨",
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
    icon: "🔬",
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

/* ---------- LPR Scanner ---------- */
const AMBULANCE_PHOTO_SRC = "/img/ambulance_real.jpg";
type LprStage = "scanning" | "detecting" | "done";

function LprScanner({
  plate,
  onNotify,
  queue,
  activeId,
  onSelectQueue,
}: {
  plate: string;
  onNotify: () => void;
  queue: AmbulanceUnit[];
  activeId: string | null;
  onSelectQueue: (id: string) => void;
}) {
  const [stage, setStage] = useState<LprStage>("scanning");
  const [progress, setProgress] = useState(0);
  const [notified, setNotified] = useState(false);
  useEffect(() => {
    setStage("scanning");
    setProgress(0);
    setNotified(false);
    const t1 = setTimeout(() => setStage("detecting"), 1800);
    const t2 = setTimeout(() => {
      setStage("done");
      setProgress(100);
    }, 3200);
    const prog = setInterval(() => setProgress((p) => Math.min(p + 4, 99)), 120);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearInterval(prog);
    };
  }, [plate]);
  const handleNotify = () => {
    if (notified) return;
    setNotified(true);
    onNotify();
  };
  const activePlate = plate;
  const queueRest = queue.filter((a) => a.plate !== activePlate);
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3">
      <h4 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
        <Video className="w-3.5 h-3.5" style={{ color: ACCENT }} /> LPR Cổng vào · Camera AI · Hàng
        đợi {queue.length}
      </h4>
      <div className="relative h-28 bg-slate-900 rounded-lg overflow-hidden mb-2">
        <img
          src={AMBULANCE_PHOTO_SRC}
          alt="xe"
          className="absolute inset-0 w-full h-full object-cover opacity-90"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "repeating-linear-gradient(0deg,rgba(0,0,0,0.08) 0 1px,transparent 1px 3px)",
          }}
        />
        {stage !== "done" && (
          <div
            className="absolute inset-x-0 h-[2px] z-20 pointer-events-none"
            style={{
              background: `linear-gradient(90deg,transparent,${ACCENT},transparent)`,
              boxShadow: `0 0 10px ${ACCENT}`,
              animation: "lpr-scan 1.2s ease-in-out infinite",
            }}
          />
        )}
        <style>{`@keyframes lpr-scan{0%,100%{top:0%}50%{top:calc(100% - 2px)}} @keyframes mp-blink{0%,100%{opacity:1}50%{opacity:.35}} @keyframes mp-spin{to{transform:rotate(360deg)}}`}</style>
        {stage !== "scanning" && (
          <div
            className="absolute border-2 rounded-sm z-10 transition-all"
            style={{
              bottom: "14%",
              left: "22%",
              right: "22%",
              height: "18%",
              borderColor: stage === "done" ? "#22C55E" : "#FACC15",
              boxShadow: stage === "done" ? "0 0 8px #22C55E88" : "0 0 8px #FACC1588",
            }}
          />
        )}
        {stage === "done" && (
          <div className="absolute inset-x-0 bottom-0 flex justify-center pb-1 z-20">
            <div className="bg-white border-2 border-green-500 px-2 py-0.5 rounded flex items-center gap-1.5">
              <span className="text-xs font-bold tracking-widest text-slate-900 font-mono">
                {plate}
              </span>
              <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
            </div>
          </div>
        )}
        <div className="absolute top-1.5 left-1.5 z-30 flex items-center gap-1 bg-black/50 rounded px-1.5 py-0.5">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[8px] font-mono text-white">CAM-GATE-01</span>
        </div>
        <div className="absolute top-1.5 right-1.5 z-30 bg-black/50 rounded px-1.5 py-0.5">
          <span className="text-[8px] font-mono text-white">
            {stage === "done" ? "AI: 99.2%" : `AI: ${progress}%`}
          </span>
        </div>
      </div>
      <div className="h-1 bg-slate-100 rounded-full overflow-hidden mb-1.5">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${stage === "done" ? 100 : progress}%`,
            background: stage === "done" ? "#22C55E" : ACCENT,
          }}
        />
      </div>
      <div
        className="flex items-center gap-1.5 px-2 py-1 rounded text-[10px] mb-1.5"
        style={{ backgroundColor: stage === "done" ? "#F0FDF4" : "#EAFBFE" }}
      >
        {stage === "done" ? (
          <CheckCircle2 className="w-3 h-3 text-green-600" />
        ) : (
          <span
            className="w-3 h-3 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: "#0891B2" }}
          />
        )}
        <span className="font-bold text-slate-900">
          {stage === "scanning" && "Đang quét khung hình…"}
          {stage === "detecting" && "Phát hiện biển số · Đang xác thực…"}
          {stage === "done" && `Mở Barrier ✓ ${plate} — Cho phép vào cổng`}
        </span>
      </div>

      {/* Horizontal queue strip */}
      <div className="border-t border-slate-100 pt-2 mt-1">
        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
          Hàng đợi tiếp theo tại cổng
        </p>
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
          {queueRest.length === 0 && (
            <span className="text-[10px] text-slate-400 italic">Không còn xe trong hàng đợi</span>
          )}
          {queueRest.map((a) => {
            const c =
              a.status === "critical" ? "#EF4444" : a.status === "urgent" ? "#F59E0B" : "#10B981";
            const lbl =
              a.status === "critical"
                ? "Đỏ/Khẩn cấp"
                : a.status === "urgent"
                  ? "Vàng/Khẩn cấp"
                  : "Xanh/Chờ lệnh";
            const sel = activeId === a.id;
            return (
              <button
                key={a.id}
                onClick={() => onSelectQueue(a.id)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-2 py-1 rounded-full border text-[10px] font-bold transition active:scale-95 ${sel ? "ring-2 ring-offset-1" : ""}`}
                style={{
                  borderColor: c,
                  color: "#0F172A",
                  backgroundColor: "#fff",
                  boxShadow: sel ? `0 0 0 2px ${ACCENT}` : undefined,
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c }} />
                <span className="font-mono">Xe {a.plate}</span>
                <span className="text-slate-500 font-normal">• {lbl}</span>
              </button>
            );
          })}
        </div>
      </div>

      {stage === "done" && !notified && (
        <button
          onClick={handleNotify}
          className="mt-2 w-full py-1.5 rounded-lg text-xs font-bold text-slate-900 hover:opacity-90 transition flex items-center justify-center gap-1.5"
          style={{ backgroundColor: ACCENT }}
        >
          <Phone className="w-3 h-3" />
          Thông báo Kíp trực
        </button>
      )}
      {notified && (
        <div className="mt-2 flex items-center gap-1.5 text-[10px] text-emerald-700 font-bold">
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
              style={{ cursor: "pointer" }}
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
          ✕
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
        <p className="text-[10px] text-center">Xe {plate} — Chờ điều phối, chưa có hồ sơ</p>
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
                  {done ? "✓" : idx + 1}
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
            value={isCritical ? "Nguyễn Văn A (Nam, 62 tuổi)" : "Trần Thị B (Nữ, 45 tuổi)"}
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
              {isCritical ? "Đột quỵ nhồi máu não — giờ thứ 2" : "Gãy xương đùi trái · TNGT"}
            </p>
          </div>
          <RecordRow
            label="Tiền sử bệnh lý nền"
            value={
              isCritical ? "Tăng huyết áp độ 2, Đái tháo đường Type 2" : "Không có tiền sử đặc biệt"
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

/* ---------- Main AmbulanceView ---------- */
type MapFilter = "all" | "critical" | "urgent" | "standby";

function AmbulanceView() {
  const [ambulances, setAmbulances] = useState<AmbulanceUnit[]>(AMBULANCES_INIT);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>("er");
  const [filter, setFilter] = useState<MapFilter>("all");
  const [lprPlate, setLprPlate] = useState("29A-213.07");
  const [toast, setToast] = useState("");
  const [panelMode, setPanelMode] = useState<"dept" | "vehicle">("dept");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 4000);
  };

  const handleSelectMap = (id: string) => {
    const found = ambulances.find((a) => a.id === id);
    if (!found) return;
    setSelectedId(id);
    setLprPlate(found.plate);
    setPanelMode("vehicle");
  };
  const handleSelectDept = (deptId: string) => {
    setSelectedDeptId(deptId);
    setPanelMode("dept");
    setSelectedId(null);
  };
  const handleAssignDept = (deptId: string) => {
    if (!selectedId) return;
    const dept = DEPARTMENTS.find((d) => d.id === deptId);
    const amb = ambulances.find((a) => a.id === selectedId);
    setAmbulances((prev) =>
      prev.map((a) => (a.id === selectedId ? { ...a, departmentId: deptId } : a)),
    );
    showToast(`✓ Đã phân công xe ${amb?.plate} → ${dept?.name}`);
    setPanelMode("dept");
    setSelectedDeptId(deptId);
    setSelectedId(null);
  };
  const handleNotify = () => showToast("✓ Đã gửi OTT cho kíp trực · Phản hồi trong 30s");
  const handleBook = () => showToast("✓ Đã đặt giường khẩn · Phòng đang chuẩn bị");
  const handleCall = (dept: Department) => showToast(`📞 Đang gọi ${dept.doctor}...`);

  const visibleAmbs = filter === "all" ? ambulances : ambulances.filter((a) => a.status === filter);
  const selectedAmb = ambulances.find((a) => a.id === selectedId) ?? null;
  const selectedDept = DEPARTMENTS.find((d) => d.id === selectedDeptId) ?? null;

  return (
    <>
      {toast && (
        <div className="fixed top-6 right-6 z-[999] bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-medium">{toast}</span>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center px-4 py-3 border-b border-slate-100 gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <MapIcon className="w-4 h-4" style={{ color: ACCENT }} />
              Theo dõi Cấp cứu — BV Bạch Mai · {DEPARTMENTS.length} Khoa
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

        {/* 2-column body — real interactive map + right command panel */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] lg:h-[560px]">
          {/* COL 1: Real interactive map */}
          <div className="relative border-r border-slate-100 overflow-hidden bg-slate-100 h-[420px] lg:h-auto min-h-[420px]">
            <RealAmbulanceMap
              ambulances={visibleAmbs}
              selectedId={selectedId}
              onSelect={handleSelectMap}
            />
            {/* ETA cards top-right */}
            <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-[400] max-w-[180px]">
              {ambulances
                .filter((a) => a.status !== "standby")
                .map((amb) => {
                  const s = STATUS_STYLE[amb.status];
                  const isSel = selectedId === amb.id;
                  return (
                    <button
                      key={amb.id}
                      onClick={() => handleSelectMap(amb.id)}
                      className={`bg-white border-2 ${s.border} rounded-xl shadow-lg px-2.5 py-1.5 text-left transition hover:shadow-xl ${isSel ? "ring-2 ring-offset-1 ring-sky-400" : ""}`}
                    >
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="relative flex w-2 h-2">
                          <span
                            className={`absolute inline-flex h-full w-full rounded-full ${s.dot} opacity-75 animate-ping`}
                          />
                          <span className={`relative inline-flex rounded-full h-2 w-2 ${s.dot}`} />
                        </span>
                        <span className="text-[10px] font-bold text-slate-900 font-mono">
                          {amb.plate}
                        </span>
                        <span
                          className={`ml-auto text-[8px] font-bold uppercase px-1 py-0.5 rounded ${s.badge} ${s.badgeText}`}
                        >
                          {s.label}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-600 truncate">{amb.diagnosis}</p>
                      <p
                        className="text-[10px] font-bold"
                        style={{ color: amb.status === "critical" ? "#DC2626" : "#D97706" }}
                      >
                        ETA: <EtaCountdown initialSeconds={amb.etaSeconds} />
                      </p>
                    </button>
                  );
                })}
            </div>
            <div className="absolute bottom-2 left-2 z-[400] bg-white/90 text-[9px] text-slate-500 px-2 py-0.5 rounded shadow">
              © OpenStreetMap · BV Bạch Mai, Hà Nội
            </div>
          </div>

          {/* COL 2: Right command panel */}
          <div className="overflow-y-auto scrollbar-hide bg-slate-50/50 max-h-[560px] lg:max-h-none">
            {panelMode === "vehicle" && selectedAmb && (
              <div className="p-2.5 border-b border-slate-100">
                <VehiclePanel
                  amb={selectedAmb}
                  onClose={() => {
                    setSelectedId(null);
                    setPanelMode("dept");
                  }}
                />
              </div>
            )}
            {/* LPR + Queue */}
            <div className="p-2.5 border-b border-slate-100">
              <LprScanner
                plate={lprPlate}
                onNotify={handleNotify}
                queue={ambulances}
                activeId={selectedId}
                onSelectQueue={handleSelectMap}
              />
            </div>

            {/* Hồ sơ Tốc hành — administrative automation */}
            <div className="p-2.5 border-b border-slate-100">
              <div className="bg-white border border-slate-200 rounded-xl p-3">
                <h4 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5" style={{ color: ACCENT }} />
                  Xử lý Hồ sơ Tốc hành & Số hóa Thủ tục
                </h4>
                <AutoEmrPanel plate={lprPlate} />
              </div>
            </div>

            {/* Kíp trực ER Chỉ định */}
            <div className="p-2.5 border-b border-slate-100">
              <ErStaffCard onCall={(name) => showToast(`📞 Đang gọi nội bộ ${name}...`)} />
            </div>

            {/* Hạ tầng Phòng Cấp cứu 01 */}
            <div className="p-2.5">
              <ErRoomReadinessCard />
            </div>
          </div>
        </div>
      </div>
    </>
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
    { icon: "check", label: "Máy thở chuyên dụng (Ventilator)", value: "Sẵn sàng kết nối" },
    { icon: "amber", label: "Máy sốc tim (Defibrillator)", value: "Đang sạc nguồn khẩn cấp" },
    { icon: "led", label: "Đèn hành lang dẫn đường", value: "Đã kích hoạt dải LED hướng dẫn" },
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

/* --- CCCD Patient Database (mock) --- */
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

const CCCD_PATIENTS: Record<string, CccdPatient> = {
  "001203001247": {
    cccd: "001203001247",
    name: "Nguyễn Văn A",
    gender: "Nam",
    dob: "12/04/1968",
    age: 58,
    address: "45 Phạm Văn Đồng, Cầu Giấy, Hà Nội",
    phone: "0912 345 678",
    bloodType: "O+",
    insurance: "DN4015002345678",
    insuranceExpiry: "31/12/2026",
    allergies: ["Penicillin", "Sulfonamid"],
    chronicConditions: ["Tăng huyết áp độ 2", "Đái tháo đường Type 2", "Rối loạn lipid máu"],
    currentMeds: [
      { name: "Amlodipin", dose: "5mg", freq: "1 viên/sáng" },
      { name: "Metformin", dose: "850mg", freq: "2 viên/ngày" },
      { name: "Atorvastatin", dose: "20mg", freq: "1 viên/tối" },
    ],
    previousVisits: [
      {
        date: "25/05/2026",
        dept: "Tim mạch",
        doctor: "BS. Trần Minh",
        diagnosis: "Tăng huyết áp — kiểm soát tốt",
        status: "Hoàn tất",
      },
      {
        date: "10/04/2026",
        dept: "Nội tiết",
        doctor: "BS. Lê Hương",
        diagnosis: "Đái tháo đường — HbA1c 7.2%",
        status: "Hoàn tất",
      },
      {
        date: "15/02/2026",
        dept: "Cấp cứu",
        doctor: "BS. Phạm Quang",
        diagnosis: "Đau ngực cấp — loại trừ NMCT",
        status: "Hoàn tất",
      },
      {
        date: "08/01/2026",
        dept: "Khám tổng quát",
        doctor: "BS. Nguyễn Hà",
        diagnosis: "Khám định kỳ quý 1",
        status: "Hoàn tất",
      },
      {
        date: "20/11/2025",
        dept: "Mắt",
        doctor: "BS. Vũ Linh",
        diagnosis: "Khám đáy mắt — bệnh võng mạc ĐTĐ gđ 1",
        status: "Hoàn tất",
      },
    ],
    vitalsLast: { bp: "140/90", hr: "95", temp: "36.8", spo2: "97", weight: "72" },
    emergencyContact: { name: "Nguyễn Thị Lan", relation: "Vợ", phone: "0987 654 321" },
  },
  "031870004189": {
    cccd: "031870004189",
    name: "Trần Thị B",
    gender: "Nữ",
    dob: "22/08/1981",
    age: 45,
    address: "12 Nguyễn Trãi, Thanh Xuân, Hà Nội",
    phone: "0978 123 456",
    bloodType: "AB+",
    insurance: "DN4015006789012",
    insuranceExpiry: "30/06/2027",
    allergies: [],
    chronicConditions: ["Thiếu máu thiếu sắt"],
    currentMeds: [
      { name: "Sắt Fumarate", dose: "200mg", freq: "1 viên/ngày" },
      { name: "Vitamin C", dose: "500mg", freq: "1 viên/ngày" },
    ],
    previousVisits: [
      {
        date: "01/06/2026",
        dept: "Chấn thương",
        doctor: "BS. Hoàng Nam",
        diagnosis: "Gãy xương đùi trái · TNGT",
        status: "Đang điều trị",
      },
      {
        date: "15/03/2026",
        dept: "Huyết học",
        doctor: "BS. Đỗ Mai",
        diagnosis: "Thiếu máu — Hb 10.2 g/dL",
        status: "Hoàn tất",
      },
      {
        date: "10/12/2025",
        dept: "Khám tổng quát",
        doctor: "BS. Nguyễn Hà",
        diagnosis: "Khám sức khỏe định kỳ",
        status: "Hoàn tất",
      },
    ],
    vitalsLast: { bp: "115/75", hr: "78", temp: "36.5", spo2: "99", weight: "58" },
    emergencyContact: { name: "Trần Văn C", relation: "Chồng", phone: "0901 234 567" },
  },
  "079200012345": {
    cccd: "079200012345",
    name: "Lê Hoàng D",
    gender: "Nam",
    dob: "05/11/2000",
    age: 25,
    address: "88 Lê Lợi, Quận 1, TP. HCM",
    phone: "0933 456 789",
    bloodType: "B+",
    insurance: "HS4079001234567",
    insuranceExpiry: "31/12/2026",
    allergies: ["Aspirin"],
    chronicConditions: ["Hen phế quản"],
    currentMeds: [
      { name: "Salbutamol MDI", dose: "100mcg", freq: "Khi cần" },
      { name: "Budesonide", dose: "200mcg", freq: "2 lần/ngày" },
    ],
    previousVisits: [
      {
        date: "05/06/2026",
        dept: "Hô hấp",
        doctor: "BS. Ngô Thanh",
        diagnosis: "Cơn hen cấp — kiểm soát",
        status: "Hoàn tất",
      },
      {
        date: "22/03/2026",
        dept: "Hô hấp",
        doctor: "BS. Ngô Thanh",
        diagnosis: "Tái khám hen — PEF 85%",
        status: "Hoàn tất",
      },
    ],
    vitalsLast: { bp: "120/80", hr: "72", temp: "36.6", spo2: "98", weight: "68" },
    emergencyContact: { name: "Lê Thị E", relation: "Mẹ", phone: "0918 765 432" },
  },
};

function RecordsView() {
  const [step, setStep] = useState<"input" | "face_match" | "records">("input");
  const [inputMethod, setInputMethod] = useState<"scan" | "manual">("scan");
  const [cccdInput, setCccdInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [foundPatient, setFoundPatient] = useState<CccdPatient | null>(null);
  const [identityError, setIdentityError] = useState("");
  const [activeTab, setActiveTab] = useState<"info" | "history" | "meds" | "docs">("info");
  const inputRef = useRef<HTMLInputElement>(null);

  // EKYC Face Match State
  const [ekycStatus, setEkycStatus] = useState<"idle" | "scanning" | "success">("idle");

  const handleIdentitySubmit = (cccdNumber?: string, overrideName?: string) => {
    const num = cccdNumber || cccdInput.replace(/\s/g, "");
    if (num.length < 9) return;
    setScanning(true);
    setScanStep(0);
    setIdentityError("");
    setFoundPatient(null);
    setCccdInput(num);
    if (overrideName) setNameInput(overrideName);

    // Simulate scanning/verifying identity steps
    const t1 = setTimeout(() => setScanStep(1), 600);
    const t2 = setTimeout(() => setScanStep(2), 1200);
    const t3 = setTimeout(() => {
      setScanStep(3);
      const patient = CCCD_PATIENTS[num] || null;
      setFoundPatient(patient);
      setScanning(false);
      if (!patient) {
        setIdentityError(
          "Không tìm thấy hồ sơ bệnh nhân cho số CCCD này. Vui lòng kiểm tra lại hoặc chọn hồ sơ demo.",
        );
        return;
      }
      setTimeout(() => setStep("face_match"), 800);
    }, 1800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  };

  const handleDemoScan = (cccd: string) => {
    const p = CCCD_PATIENTS[cccd];
    setCccdInput(cccd);
    setNameInput(p.name);
    handleIdentitySubmit(cccd, p.name);
  };

  const startFaceMatch = () => {
    if (!foundPatient) {
      setStep("input");
      setIdentityError("Cần định danh bệnh nhân trước khi xác thực eKYC.");
      return;
    }
    setEkycStatus("scanning");
    setTimeout(() => {
      setEkycStatus("success");
      // Move to records after success
      setTimeout(() => setStep("records"), 1500);
    }, 2500);
  };

  const handleBack = () => {
    setStep("input");
    setScanStep(0);
    setScanning(false);
    setEkycStatus("idle");
    setCccdInput("");
    setNameInput("");
    setFoundPatient(null);
    setIdentityError("");
    setActiveTab("info");
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
          <h3 className="text-lg font-bold text-slate-900 mb-2">Không tải được hồ sơ bệnh nhân</h3>
          <p className="text-sm text-slate-500 mb-5">
            Phiên định danh không có bệnh nhân hợp lệ. Vui lòng quay lại và quét lại CCCD.
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
    <div className="max-w-3xl mx-auto w-full">
      {/* STEP 1: IDENTITY INPUT */}
      {step === "input" && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col animate-in fade-in zoom-in-95 duration-300">
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Định danh Bệnh nhân</h3>
            <p className="text-slate-500 text-sm">Vui lòng chọn phương thức cung cấp thông tin</p>
          </div>

          {/* Tabs for choosing method */}
          <div className="flex p-1 bg-slate-100 rounded-lg mb-6 max-w-sm mx-auto">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-4">
              {inputMethod === "scan" ? (
                <div className="flex flex-col">
                  {/* CCCD visual card with real image */}
                  <div
                    className="relative rounded-xl mb-4 overflow-hidden"
                    style={{ aspectRatio: "86/54" }}
                  >
                    {/* Real CCCD image */}
                    <img
                      src="/cccd-template.png"
                      alt="Căn Cước Công Dân"
                      className="w-full h-full object-cover rounded-xl"
                      draggable={false}
                    />
                    {/* Dark overlay for better readability of overlaid elements */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 rounded-xl pointer-events-none" />

                    {/* Scanning laser animation */}
                    {scanning && (
                      <>
                        <div
                          className="absolute inset-x-0 h-1 z-20 pointer-events-none rounded-full"
                          style={{
                            backgroundColor: ACCENT,
                            boxShadow: `0 0 20px ${ACCENT}, 0 0 40px ${ACCENT}, 0 0 60px ${ACCENT}40`,
                            animation: "cccd-scan 1.5s ease-in-out infinite",
                          }}
                        />
                        <style>{`@keyframes cccd-scan { 0%, 100% { top: 5%; } 50% { top: 90%; } }`}</style>
                        {/* Scanning frame corners */}
                        <div className="absolute inset-3 pointer-events-none z-20">
                          {[
                            "top-0 left-0 border-t-2 border-l-2",
                            "top-0 right-0 border-t-2 border-r-2",
                            "bottom-0 left-0 border-b-2 border-l-2",
                            "bottom-0 right-0 border-b-2 border-r-2",
                          ].map((c) => (
                            <span
                              key={c}
                              className={`absolute w-5 h-5 ${c}`}
                              style={{ borderColor: ACCENT, boxShadow: `0 0 8px ${ACCENT}` }}
                            />
                          ))}
                        </div>
                      </>
                    )}

                    {/* Status badge - top right */}
                    <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 backdrop-blur-sm bg-black/50 px-2.5 py-1 rounded-full">
                      <span
                        className="w-2 h-2 rounded-full animate-pulse"
                        style={{
                          backgroundColor: scanning
                            ? "#EF4444"
                            : scanStep >= 3 && foundPatient
                              ? "#22C55E"
                              : "#64748B",
                        }}
                      />
                      <span className="text-[10px] text-white font-mono font-bold">
                        {scanning
                          ? "SCANNING"
                          : scanStep >= 3 && foundPatient
                            ? "VERIFIED"
                            : "READY"}
                      </span>
                    </div>

                    {/* CCCD Number overlay - bottom */}
                    <div className="absolute bottom-0 left-0 right-0 z-10 px-4 py-3 bg-gradient-to-t from-black/80 to-transparent">
                      <p className="text-[9px] text-white/60 font-geist uppercase tracking-wider mb-0.5">
                        Số CCCD đang quét
                      </p>
                      <div className="flex items-center justify-between">
                        <p
                          className="text-lg font-mono font-bold tracking-[0.15em]"
                          style={{ color: ACCENT }}
                        >
                          {cccdInput || "--- --- --- ---"}
                          {scanning && (
                            <span
                              className="inline-block w-0.5 h-4 align-middle ml-1"
                              style={{
                                backgroundColor: ACCENT,
                                animation: "mp-blink 1s steps(2) infinite",
                              }}
                            />
                          )}
                        </p>
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded text-[7px] font-bold uppercase tracking-wider bg-white/15 text-white/80 backdrop-blur-sm">
                            NFC
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[7px] font-bold uppercase tracking-wider bg-white/15 text-white/80 backdrop-blur-sm">
                            CHIP
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[7px] font-bold uppercase tracking-wider bg-white/15 text-white/80 backdrop-blur-sm">
                            QR
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleIdentitySubmit("001203001247", "NGUYỄN VĂN A")}
                    disabled={scanning}
                    className="mt-2 w-full py-3 rounded-lg text-sm font-bold text-slate-900 transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                    style={{ backgroundColor: ACCENT }}
                  >
                    {scanning ? (
                      <>
                        <span className="w-4 h-4 border-2 border-t-transparent border-slate-900 rounded-full animate-spin" />{" "}
                        Đang tra cứu...
                      </>
                    ) : (
                      "Bắt đầu Quét thẻ"
                    )}
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Số CCCD</label>
                    <div className="relative">
                      <ScanLine className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        ref={inputRef}
                        type="text"
                        value={cccdInput}
                        onChange={(e) => setCccdInput(e.target.value.replace(/[^0-9]/g, ""))}
                        placeholder="Nhập 12 số CCCD"
                        maxLength={12}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-sm font-mono focus:border-[#88E8F2] outline-none"
                        disabled={scanning}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Họ và Tên</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        placeholder="NGUYỄN VĂN A"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-sm uppercase focus:border-[#88E8F2] outline-none"
                        disabled={scanning}
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => handleIdentitySubmit()}
                    disabled={scanning || cccdInput.length < 9 || nameInput.length < 3}
                    className="mt-2 w-full py-3 rounded-lg text-sm font-bold text-slate-900 transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
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

            {/* Scan / Demo */}
            <div className="flex flex-col border-t md:border-t-0 md:border-l border-slate-200 pt-6 md:pt-0 md:pl-6">
              <p className="text-xs font-bold text-slate-700 mb-3 text-center md:text-left">
                Hoặc quét nhanh (Demo)
              </p>
              <div className="flex flex-col gap-2">
                {Object.entries(CCCD_PATIENTS).map(([cccd, p]) => (
                  <button
                    key={cccd}
                    onClick={() => handleDemoScan(cccd)}
                    disabled={scanning}
                    className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-white hover:border-[#88E8F2] transition-all text-left disabled:opacity-50 group"
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-[#88E8F2]/20">
                      <CreditCard className="w-4 h-4 text-slate-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{p.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{cccd}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {identityError && (
            <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 flex items-start gap-3">
              <CircleAlert className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm font-medium text-red-700">{identityError}</p>
            </div>
          )}

          {/* Progress Indicator */}
          {scanStep > 0 && (
            <div className="mt-6 border-t border-slate-100 pt-4 flex items-center justify-center gap-4">
              {["Quét dữ liệu", "Kiểm tra DB", "Hoàn tất"].map((label, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${scanStep > idx ? "bg-emerald-500 text-white" : scanStep === idx ? "bg-slate-200 text-slate-800" : "bg-slate-100 text-slate-400"}`}
                  >
                    {scanStep > idx ? "✓" : idx + 1}
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
          className="bg-white border-2 rounded-xl p-6 shadow-sm flex flex-col animate-in slide-in-from-right-8 fade-in duration-300"
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

          <div className="flex items-center justify-center gap-6 mb-8">
            <EkycFace label="Ảnh CCCD" sub={cccdInput} state={ekycStatus} />
            <div className="flex-1 relative h-px max-w-[120px]">
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
              ⚠ CẢNH BÁO DỊ ỨNG THUỐC
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
            Trạng thái: <span className="font-bold text-emerald-600">Thực thể sống (Live)</span>
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
  const [recording, setRecording] = useState(true);
  const [transcript, setTranscript] = useState("");

  useEffect(() => {
    if (!recording) return;
    setTranscript("");
    let i = 0;
    const id = setInterval(() => {
      i += 2;
      setTranscript(TRANSCRIPT_FULL.slice(0, i));
      if (i >= TRANSCRIPT_FULL.length) clearInterval(id);
    }, 50);
    return () => clearInterval(id);
  }, [recording]);

  const L = transcript.length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* LEFT: Recording + transcript */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col h-[620px]">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-medium text-slate-900">Ghi âm Lâm sàng</h3>
          <span
            className="px-2 py-1 rounded text-[10px] font-geist uppercase tracking-wider text-slate-900 flex items-center gap-1"
            style={{ backgroundColor: recording ? ACCENT : "#F1F5F9" }}
          >
            {recording && <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />}
            {recording ? "Đang ghi" : "Tạm dừng"}
          </span>
        </div>

        <div className="flex flex-col items-center justify-center py-2">
          <Waveform active={recording} />
          <div
            className="mt-3 px-3 py-1.5 rounded-full flex items-center gap-2 border-2"
            style={{ borderColor: ACCENT, backgroundColor: "#EAFBFE" }}
          >
            <BadgeCheck className="w-4 h-4" style={{ color: "#0891B2" }} />
            <span className="text-[11px] font-bold text-slate-900 font-geist uppercase tracking-wider">
              AI Voice NLU · Tiếng Việt
            </span>
          </div>
          <p className="mt-2 text-[11px] font-geist uppercase tracking-wider text-slate-500">
            BS. Văn Ngữ · Phòng 103
          </p>
          <button
            onClick={() => setRecording((r) => !r)}
            className="mt-3 px-6 py-2.5 rounded-full font-medium text-slate-900 hover:opacity-90 flex items-center gap-2 transition"
            style={{ backgroundColor: ACCENT }}
          >
            {recording ? <StopCircle className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {recording ? "Dừng ghi" : "Bắt đầu lại"}
          </button>
        </div>

        <div className="mt-3 border-t border-slate-200 pt-3 flex-1 overflow-auto scrollbar-hide">
          <p className="text-[10px] font-geist uppercase tracking-wider text-slate-500 mb-1">
            Phiên âm thô (raw speech)
          </p>
          <p className="text-sm text-slate-800 italic leading-relaxed">
            "{transcript}
            {recording && L < TRANSCRIPT_FULL.length && (
              <span className="inline-block w-0.5 h-4 bg-slate-800 ml-0.5 animate-pulse align-middle" />
            )}
            "
          </p>
        </div>
      </div>

      {/* RIGHT: SOAPE Form */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col h-[620px]">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-medium text-slate-900">EMR · Mẫu SOAPE</h3>
          <span className="text-[10px] font-geist uppercase tracking-wider text-slate-500 flex items-center gap-1">
            <Cpu className="w-3 h-3" style={{ color: ACCENT }} /> AI Parser · Trực tiếp
          </span>
        </div>
        <div className="space-y-3 flex-1 overflow-auto scrollbar-hide">
          <EMRField
            label="Lý do vào viện (S — Subjective)"
            value="Đau ngực, khó thở"
            filled={L > 60}
          />
          <EMRField
            label="Khám lâm sàng (O — Objective)"
            value="HA: 140/90 mmHg · Mạch: 95 lần/phút"
            filled={L > 140}
          />
          <EMRField
            label="Chẩn đoán (A — Assessment)"
            value="TD: Tăng huyết áp độ 2 / Đau thắt ngực"
            filled={L > 210}
          />
          <EMRField
            label="Xử trí / Y lệnh (P — Plan)"
            value="Amlodipin 5mg · 1 viên/sáng · TD nhịp tim 48h"
            filled={L > 280}
          />
          <EMRField
            label="Đánh giá lại (E — Evaluation)"
            value="Tái khám sau 7 ngày"
            filled={L >= TRANSCRIPT_FULL.length}
          />
        </div>
        <button
          className="mt-4 py-2.5 rounded-lg text-sm font-bold text-slate-900 hover:opacity-90 transition"
          style={{ backgroundColor: ACCENT }}
        >
          Xác nhận và Ký số
        </button>
      </div>
    </div>
  );
}

function Waveform({ active }: { active: boolean }) {
  const bars = 40;
  return (
    <div className="relative w-full h-40 flex items-center justify-center">
      <div
        className="absolute w-40 h-40 rounded-full opacity-30 animate-ping"
        style={{ backgroundColor: ACCENT, animationDuration: "2s" }}
      />
      <div
        className="absolute w-28 h-28 rounded-full"
        style={{ backgroundColor: ACCENT, opacity: 0.25 }}
      />
      <div className="relative flex items-center gap-1 h-32 z-10">
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

function EMRField({ label, value, filled }: { label: string; value: string; filled: boolean }) {
  return (
    <div
      className="border border-slate-200 rounded-lg p-3 transition-colors"
      style={filled ? { borderColor: ACCENT } : undefined}
    >
      <p className="text-[10px] font-geist uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`text-sm mt-1 ${filled ? "text-slate-900 font-medium" : "text-slate-300"}`}>
        {filled ? value : "— đang chờ —"}
      </p>
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
      <div className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl shadow-sm flex flex-col h-[640px] overflow-hidden">
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
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ACCENT }} /> Trực
              tuyến
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
      "Chỉ số đường huyết 7.8 mmol/L của bác đang cao hơn ngưỡng an toàn (< 6.4 mmol/L) một chút ạ. Bác nên hạn chế tinh bột trắng và đồ ngọt. Cháu có thể đặt lịch tư vấn với BS. Văn Ngữ cho bác nhé?",
  },
  {
    keywords: ["lịch hẹn", "tái khám", "hẹn", "khám lại"],
    reply:
      "Lịch tái khám của bác đã được xếp vào ngày 15/06/2026 lúc 9:00 sáng tại Phòng khám số 3, Khoa Nội ạ. Bác nhớ nhịn ăn trước 2 tiếng và mang theo sổ khám bệnh nhé!",
  },
  {
    keywords: ["thuốc", "uống thuốc", "amlodipin", "liều"],
    reply:
      "Bác đang dùng Amlodipin 5mg, uống 1 viên vào buổi sáng sau ăn ạ. Nhớ uống đúng giờ mỗi ngày và không được tự ý ngưng thuốc bác nhé. Có vấn đề gì cháu báo ngay BS. Văn Ngữ cho ạ!",
  },
  {
    keywords: ["đau", "khó chịu", "mệt", "chóng mặt", "tức ngực"],
    reply:
      "Bác đang cảm thấy không khỏe ạ? Cháu lo cho bác lắm! Nếu cơn đau cấp tính hoặc kéo dài, bác hãy bấm nút SOS bên dưới để y tá đến ngay nhé. Cháu cũng sẽ báo ngay cho BS. Văn Ngữ biết ạ!",
  },
  {
    keywords: ["cholesterol", "mỡ máu"],
    reply:
      "Chỉ số Cholesterol 5.9 mmol/L của bác ở mức cần theo dõi (ngưỡng khuyến cáo < 5.2 mmol/L). Bác nên giảm ăn đồ chiên xào và tăng cường rau xanh, cá. Kết hợp đi bộ nhẹ 30 phút/ngày bác nhé!",
  },
  {
    keywords: ["creatinine", "thận", "tiết niệu"],
    reply:
      "Chỉ số Creatinine 92 µmol/L của bác nằm trong giới hạn bình thường (< 110 µmol/L) ạ. Chức năng thận của bác đang ổn. Bác nhớ uống đủ 2 lít nước mỗi ngày nhé!",
  },
];

function getTimeNow() {
  return new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

function PatientPortalView() {
  const [chatInput, setChatInput] = useState("");
  const [listening, setListening] = useState(false);
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
      setSosCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => {
      if (sosTimerRef.current) clearInterval(sosTimerRef.current);
    };
  }, [sosCountdown]);

  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      from: "bot",
      text: "Xin chào bác Nguyễn Văn A! Cháu là trợ lý AI EyeCU. Bác vừa có kết quả xét nghiệm sinh hóa mới. Bác muốn cháu giải thích chỉ số nào không ạ? 😊",
      time: getTimeNow(),
    },
  ]);
  const [botTyping, setBotTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, botTyping]);

  const tiles = [
    { Icon: Receipt, label: "Phiếu khám bệnh", sub: "Lượt khám hôm nay", color: "#2563EB" },
    { Icon: Pill, label: "Đơn thuốc điện tử", sub: "3 loại đang dùng", color: "#7C3AED" },
    { Icon: Calendar, label: "Lịch tái khám", sub: "15/06 · 9:00", color: "#D97706" },
    { Icon: FileText, label: "Viện phí", sub: "Đã thanh toán ✓", color: "#16A34A" },
  ];

  const [labResults, setLabResults] = useState([
    { name: "Glucose", value: "7.8", unit: "mmol/L", ref: "< 6.4", status: "high" as const },
    { name: "Cholesterol", value: "5.9", unit: "mmol/L", ref: "< 5.2", status: "warn" as const },
    { name: "Creatinine", value: "92", unit: "µmol/L", ref: "< 110", status: "ok" as const },
    { name: "HbA1c", value: "6.8", unit: "%", ref: "< 6.5", status: "warn" as const },
  ]);

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
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          from: "bot",
          text: "Cháu đã ghi nhận ý kiến của bác rồi ạ. Bác cần hỗ trợ thêm gì không?",
          time: getTimeNow(),
        },
      ]);
      setBotTyping(false);
    }, 1200);
  };

  const [isScanning, setIsScanning] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [highlightLab, setHighlightLab] = useState(false);

  const handleCapture = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setIsScanning(false);

      setHighlightLab(true);
      setLabResults((prev) =>
        prev.map((lab) =>
          lab.name === "Glucose" ? { ...lab, value: "8.5", status: "high" } : lab,
        ),
      );

      setBotTyping(true);
      setTimeout(() => {
        setBotTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            from: "bot",
            text: "Cháu vừa nhận và cập nhật được kết quả xét nghiệm mới. Chỉ số Glucose của bác đã tăng nhẹ lên 8.5 mmol/L. Bác chú ý hạn chế ăn tinh bột nhé ạ!",
            time: getTimeNow(),
          },
        ]);
        setTimeout(() => setHighlightLab(false), 3000);
      }, 1500);
    }, 2500);
  };

  return (
    <div className="flex justify-center py-4">
      <div
        className="w-full max-w-[400px] bg-white border border-slate-200 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col relative"
        style={{ height: "min(92vh,860px)" }}
      >
        <div className="bg-white px-6 py-1.5 flex justify-between items-center text-[10px] font-mono text-slate-700 z-20 flex-shrink-0">
          <span className="font-bold">9:41</span>
          <span>● ● ● 100%</span>
        </div>
        <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-24 h-6 bg-slate-900 rounded-full z-30" />

        <div className="flex-1 overflow-y-auto scrollbar-hide flex flex-col">
          {/* Greeting header */}
          <div className="px-5 pt-10 pb-4 bg-gradient-to-b from-[#EAFBFE] via-[#f0fdfb] to-white flex-shrink-0">
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
              <div>
                <p className="text-[10px] font-geist uppercase tracking-wider text-slate-500">
                  EyeCU · Khoa Nội
                </p>
                <h2 className="text-lg font-bold text-slate-900 leading-tight">
                  Xin chào bác Nguyễn Văn A
                </h2>
                <p className="text-[11px] text-slate-500">Hôm nay bác cảm thấy thế nào ạ?</p>
              </div>
            </div>
          </div>

          {/* 4 Tiles - Original Layout */}
          <div className="px-4 grid grid-cols-2 gap-2.5 flex-shrink-0">
            {tiles.map(({ Icon, label, sub, color }) => (
              <button
                key={label}
                className="text-left p-3 border border-slate-100 rounded-2xl hover:border-[#88E8F2] hover:shadow-md active:scale-95 transition-all bg-white shadow-sm"
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center mb-2.5"
                  style={{ backgroundColor: color + "18" }}
                >
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <p className="text-sm font-bold text-slate-900 leading-tight">{label}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>
              </button>
            ))}
          </div>

          {/* SCAN BANNER */}
          <div className="mx-4 mt-4 flex-shrink-0">
            <button
              onClick={() => setIsScanning(true)}
              className="w-full flex items-center gap-3 p-3 rounded-2xl border border-[#88E8F2]/50 bg-gradient-to-r from-[#88E8F2]/10 to-blue-50 hover:to-blue-100 active:scale-[0.98] transition-all shadow-sm group"
            >
              <div className="w-10 h-10 rounded-full bg-[#88E8F2] flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                <Camera className="w-5 h-5 text-slate-900" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-slate-900">Quét phiếu xét nghiệm</p>
                <p className="text-[10px] text-slate-500">AI tự động bóc tách và phân tích</p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 ml-auto" />
            </button>
          </div>

          {/* Lab Results card */}
          <div
            className={`mx-4 mt-4 border ${highlightLab ? "border-[#88E8F2] shadow-[0_0_15px_rgba(136,232,242,0.5)]" : "border-slate-100"} rounded-2xl overflow-hidden shadow-sm flex-shrink-0 transition-all duration-500`}
          >
            <div
              className="flex items-center gap-2 px-3 py-2.5"
              style={{ background: "linear-gradient(90deg,#EAFBFE,#f0f9ff)" }}
            >
              <ScanLine className="w-3.5 h-3.5" style={{ color: ACCENT }} />
              <p className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">
                Kết quả xét nghiệm · 07/06/2026
              </p>
            </div>
            <div className="px-3 py-2 space-y-2 bg-white">
              {labResults.map((lab) => {
                const st = statusStyle(lab.status);
                const isUpdating = highlightLab && lab.name === "Glucose";
                return (
                  <div key={lab.name} className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${isUpdating ? "animate-ping bg-[#88E8F2]" : st.dot}`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[11px] font-semibold text-slate-700">{lab.name}</span>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[10px] font-bold ${isUpdating ? "text-[#0ea5e9] scale-110" : "text-slate-900"} transition-all`}
                          >
                            {lab.value}{" "}
                            <span className="text-slate-400 font-normal">{lab.unit}</span>
                          </span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${st.badge}`}
                          >
                            {lab.status === "high" ? "CAO" : lab.status === "warn" ? "CHÚ Ý" : "OK"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${st.barPct}%`, backgroundColor: st.bar }}
                          />
                        </div>
                        <span className="text-[9px] text-slate-400 flex-shrink-0">
                          Ref: {lab.ref}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chatbot widget - Original layout */}
          <div className="mx-4 mt-4 border border-slate-100 rounded-2xl overflow-hidden shadow-sm flex-shrink-0 mb-4">
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
            <div className="bg-slate-50/50 px-3 py-2.5 space-y-2.5 max-h-48 overflow-y-auto scrollbar-hide">
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
                className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-3 py-1.5 text-[11px] outline-none focus:border-[#88E8F2] text-slate-800 placeholder:text-slate-400"
              />
              <button
                onClick={() => sendMessage()}
                className="w-8 h-8 rounded-full flex items-center justify-center transition active:scale-95 flex-shrink-0"
                style={{ backgroundColor: ACCENT }}
              >
                <Send className="w-3.5 h-3.5 text-slate-900" />
              </button>
              <button
                onClick={() => setListening((l) => !l)}
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
          <div className="mt-auto px-4 pb-6 pt-2 bg-white flex-shrink-0 border-t border-slate-100">
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

        {/* Camera Modal */}
        {isScanning && (
          <div className="absolute inset-0 bg-slate-900 z-50 flex flex-col animate-in fade-in duration-200">
            <div className="flex-1 relative overflow-hidden flex items-center justify-center">
              <div className="absolute inset-6 border-2 border-dashed border-[#88E8F2] rounded-3xl flex items-center justify-center bg-slate-800/50 backdrop-blur-sm">
                <p className="text-white text-sm font-medium opacity-70">
                  Đưa giấy xét nghiệm vào khung
                </p>
                {isAnalyzing && (
                  <div className="absolute left-0 right-0 h-1 bg-[#88E8F2] shadow-[0_0_20px_#88E8F2] animate-scan" />
                )}
              </div>
            </div>
            <div className="h-40 bg-black flex items-center justify-around px-6 pb-8">
              <button
                onClick={() => setIsScanning(false)}
                className="text-white font-medium px-4 py-2 opacity-80"
              >
                Hủy
              </button>
              <button
                onClick={handleCapture}
                disabled={isAnalyzing}
                className="w-20 h-20 rounded-full border-4 border-[#88E8F2] flex items-center justify-center p-1.5 active:scale-95 transition-transform"
              >
                <div
                  className={`w-full h-full bg-white rounded-full ${isAnalyzing ? "animate-pulse bg-[#88E8F2]" : ""}`}
                />
              </button>
              <div className="w-12" />
            </div>
            {isAnalyzing && (
              <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-md flex flex-col items-center justify-center z-50">
                <ScanLine className="w-20 h-20 text-[#88E8F2] animate-pulse mb-6" />
                <h3 className="text-white font-bold text-xl tracking-tight">
                  Đang phân tích tài liệu...
                </h3>
                <p className="text-[#88E8F2] text-sm mt-2 font-mono uppercase tracking-widest">
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

const MOCK_EMS_PATIENT = {
  name: "Trần Đức Minh",
  cccd: "001090012345",
  dob: "15/03/1962",
  gender: "Nam",
  bloodType: "O+",
  allergies: ["Penicillin", "Aspirin"],
  chronicConditions: ["Tiểu đường type 2", "Tăng huyết áp"],
  emergencyContact: { name: "Trần Thị Lan", relation: "Vợ", phone: "0912-345-678" },
};

function EmsView() {
  const [scanned, setScanned] = useState(false);
  const [alertSent, setAlertSent] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<string | null>(null);

  const alertTypes = ["Nhồi máu cơ tim", "Đột quỵ", "Chấn thương nặng", "Ngộ độc"];

  const handleSendAlert = (alertType: string) => {
    setSelectedAlert(alertType);
    setAlertSent(true);
  };

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
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

        {!scanned ? (
          <button
            onClick={() => setScanned(true)}
            className="w-full py-4 rounded-xl border-2 border-dashed border-orange-300 bg-orange-50/50 hover:bg-orange-50 transition-all flex flex-col items-center justify-center gap-2 group"
          >
            <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ScanLine className="w-8 h-8 text-orange-600" />
            </div>
            <span className="font-bold text-slate-900 text-sm">Quét CCCD gắn chip / FaceID</span>
            <span className="text-xs text-slate-500">Chạm để bắt đầu nhận diện bệnh nhân</span>
          </button>
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
                <p className="text-sm font-bold text-slate-900">{MOCK_EMS_PATIENT.name}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] font-geist uppercase tracking-wider text-slate-400 mb-0.5">
                  CCCD
                </p>
                <p className="text-sm font-bold text-slate-900 font-mono">
                  {MOCK_EMS_PATIENT.cccd}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] font-geist uppercase tracking-wider text-slate-400 mb-0.5">
                  Ngày sinh
                </p>
                <p className="text-sm font-bold text-slate-900">{MOCK_EMS_PATIENT.dob}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] font-geist uppercase tracking-wider text-slate-400 mb-0.5">
                  Giới tính
                </p>
                <p className="text-sm font-bold text-slate-900">{MOCK_EMS_PATIENT.gender}</p>
              </div>
              <div className="p-3 rounded-xl bg-red-50 border border-red-100">
                <p className="text-[10px] font-geist uppercase tracking-wider text-red-400 mb-0.5">
                  Nhóm máu
                </p>
                <p className="text-sm font-bold text-red-600">{MOCK_EMS_PATIENT.bloodType}</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
                <p className="text-[10px] font-geist uppercase tracking-wider text-amber-500 mb-0.5">
                  Dị ứng
                </p>
                <p className="text-sm font-bold text-amber-700">
                  {MOCK_EMS_PATIENT.allergies.join(", ")}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-[10px] font-geist uppercase tracking-wider text-slate-400 mb-1">
                Bệnh nền
              </p>
              <div className="flex flex-wrap gap-1.5">
                {MOCK_EMS_PATIENT.chronicConditions.map((c) => (
                  <span
                    key={c}
                    className="px-2 py-0.5 rounded-full bg-slate-200 text-[11px] font-bold text-slate-700"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-geist uppercase tracking-wider text-blue-400 mb-0.5">
                  Người liên hệ khẩn cấp
                </p>
                <p className="text-sm font-bold text-blue-900">
                  {MOCK_EMS_PATIENT.emergencyContact.name} (
                  {MOCK_EMS_PATIENT.emergencyContact.relation})
                </p>
                <p className="text-xs text-blue-600 font-mono">
                  {MOCK_EMS_PATIENT.emergencyContact.phone}
                </p>
              </div>
              <Phone className="w-5 h-5 text-blue-500" />
            </div>
          </div>
        )}
      </div>

      {/* ── 2. GPS Map Panel ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: ACCENT }}
          >
            <MapPin className="w-4 h-4 text-slate-900" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Định vị GPS · Lộ trình</h3>
            <p className="text-[11px] text-slate-500 font-geist">
              Theo dõi thời gian thực · ETA tự động cập nhật
            </p>
          </div>
        </div>

        {/* Simulated map */}
        <div className="relative w-full aspect-[2/1] rounded-xl bg-slate-800 overflow-hidden mb-4">
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #1e293b 100%)" }}
          />
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: "radial-gradient(#88E8F2 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />
          {/* Route line */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 200">
            <path
              d="M 50 150 Q 120 80 200 100 Q 280 120 350 50"
              fill="none"
              stroke={ACCENT}
              strokeWidth="3"
              strokeDasharray="8 4"
              opacity="0.8"
            />
            <circle cx="50" cy="150" r="8" fill="#F97316" stroke="#FFF" strokeWidth="2" />
            <circle cx="350" cy="50" r="8" fill="#22C55E" stroke="#FFF" strokeWidth="2" />
            {/* Ambulance position */}
            <circle cx="200" cy="100" r="6" fill={ACCENT} stroke="#FFF" strokeWidth="2">
              <animate attributeName="r" values="6;9;6" dur="1.5s" repeatCount="indefinite" />
            </circle>
          </svg>
          {/* Labels */}
          <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white text-[10px] font-geist px-2 py-1 rounded-md flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-orange-500" /> Vị trí hiện tại
          </div>
          <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white text-[10px] font-geist px-2 py-1 rounded-md flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> BV Bạch Mai
          </div>
        </div>

        {/* ETA info */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-orange-50 border border-orange-100 text-center">
            <p className="text-[10px] font-geist uppercase tracking-wider text-orange-500 mb-0.5">
              ETA
            </p>
            <p className="text-xl font-bold text-orange-600">8 phút</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
            <p className="text-[10px] font-geist uppercase tracking-wider text-slate-400 mb-0.5">
              Khoảng cách
            </p>
            <p className="text-xl font-bold text-slate-900">4.2 km</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
            <p className="text-[10px] font-geist uppercase tracking-wider text-slate-400 mb-0.5">
              Đích đến
            </p>
            <p className="text-sm font-bold text-slate-900 leading-tight">BV Bạch Mai</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-geist uppercase tracking-wider text-slate-400">
              Tiến trình di chuyển
            </span>
            <span className="text-[10px] font-bold text-slate-900">52%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: "52%", background: `linear-gradient(90deg, #F97316, ${ACCENT})` }}
            />
          </div>
        </div>
      </div>

      {/* ── 3. Communication Panel ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
            <Radio className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Liên lạc Khẩn cấp</h3>
            <p className="text-[11px] text-slate-500 font-geist">Kết nối trực tiếp · VoIP mã hóa</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button className="flex items-center gap-3 p-4 rounded-xl border-2 border-slate-100 hover:border-[#88E8F2] hover:bg-[#88E8F2]/5 transition-all group text-left">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
              <Phone className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <span className="font-bold text-slate-900 text-sm block">📞 Gọi Người thân</span>
              <span className="text-xs text-slate-500">Liên hệ người thân bệnh nhân</span>
            </div>
          </button>

          <button className="flex items-center gap-3 p-4 rounded-xl border-2 border-slate-100 hover:border-[#88E8F2] hover:bg-[#88E8F2]/5 transition-all group text-left">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
              <Radio className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <span className="font-bold text-slate-900 text-sm block">
                📡 Liên lạc Kíp trực BV
              </span>
              <span className="text-xs text-slate-500">Kết nối trực tiếp phòng Cấp cứu</span>
            </div>
          </button>
        </div>
      </div>

      {/* ── 4. Pre-Alert Panel ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
            <Siren className="w-4 h-4 text-red-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Cảnh báo Trước (Pre-Alert)</h3>
            <p className="text-[11px] text-slate-500 font-geist">
              Gửi thông báo sớm cho Kíp trực Bệnh viện
            </p>
          </div>
        </div>

        {alertSent ? (
          <div className="flex flex-col items-center gap-3 py-4 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <div className="text-center">
              <p className="font-bold text-slate-900">Đã gửi cảnh báo trước tới BV</p>
              <p className="text-sm text-slate-500 mt-1">
                Loại: <span className="font-bold text-red-600">{selectedAlert}</span>
              </p>
              <p className="text-xs text-slate-400 mt-2">
                Kíp trực BV Bạch Mai đã nhận thông báo và đang chuẩn bị
              </p>
            </div>
            <button
              onClick={() => {
                setAlertSent(false);
                setSelectedAlert(null);
              }}
              className="mt-2 px-4 py-2 rounded-lg border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              Gửi cảnh báo khác
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-slate-500">Chọn loại tình huống:</p>
            <div className="grid grid-cols-2 gap-2">
              {alertTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => handleSendAlert(type)}
                  className="p-3 rounded-xl border-2 border-slate-100 hover:border-red-300 hover:bg-red-50 transition-all text-left group"
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400 group-hover:text-red-600 transition-colors flex-shrink-0" />
                    <span className="text-sm font-bold text-slate-900">{type}</span>
                  </div>
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 font-geist text-center mt-2">
              Cảnh báo sẽ được gửi tới Phòng Cấp cứu BV Bạch Mai
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============== VIEW: ADMIN DASHBOARD ============== */

function AdminDashboardView() {
  return (
    <div className="space-y-6 pb-20">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Panel 1: Tổng quan Hệ thống */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#0A9BAD]" /> Tổng quan Hệ thống
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <p className="text-[10px] text-slate-500 font-geist uppercase tracking-wider mb-1">
                Uptime
              </p>
              <p className="text-xl font-bold text-[#0A9BAD]">99.99%</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <p className="text-[10px] text-slate-500 font-geist uppercase tracking-wider mb-1">
                Active Users
              </p>
              <p className="text-xl font-bold text-slate-900">124</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <p className="text-[10px] text-slate-500 font-geist uppercase tracking-wider mb-1">
                Cảnh báo h.nay
              </p>
              <p className="text-xl font-bold text-red-500">12</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <p className="text-[10px] text-slate-500 font-geist uppercase tracking-wider mb-1">
                Băng thông
              </p>
              <p className="text-xl font-bold text-slate-900">4.2 TB</p>
            </div>
          </div>
        </div>

        {/* Panel 5: API VNPT Monitor */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#0A9BAD]" /> API VNPT Monitor
          </h3>
          <div className="space-y-4">
            {[
              { label: "VNPT eKYC", usage: 4500, limit: 5000, percent: 90 },
              { label: "SmartVoice", usage: 1200, limit: 10000, percent: 12 },
              { label: "SmartCA", usage: 850, limit: 2000, percent: 42.5 },
            ].map((api) => (
              <div key={api.label}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-bold text-slate-700">{api.label}</span>
                  <span className="text-slate-500 text-[11px] font-geist tracking-wider">
                    {api.usage} / {api.limit} req
                  </span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${api.percent}%`,
                      backgroundColor: api.percent > 80 ? "#EF4444" : "#0A9BAD",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Panel 3: Quản lý Thiết bị */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-[#0A9BAD]" /> Quản lý Thiết bị
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50">
              <div className="flex items-center gap-3">
                <Video className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-sm font-bold text-slate-900">Camera AI</p>
                  <p className="text-[11px] text-slate-500">38 thiết bị</p>
                </div>
              </div>
              <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full">
                36 Online
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50">
              <div className="flex items-center gap-3">
                <Ambulance className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-sm font-bold text-slate-900">Xe Cấp cứu</p>
                  <p className="text-[11px] text-slate-500">12 thiết bị</p>
                </div>
              </div>
              <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full">
                12 Online
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50">
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-sm font-bold text-slate-900">Tablet Điều dưỡng</p>
                  <p className="text-[11px] text-slate-500">45 thiết bị</p>
                </div>
              </div>
              <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-[10px] font-bold rounded-full">
                42 Online
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel 2: Quản lý Nhân sự */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-[#0A9BAD]" /> Quản lý Nhân sự
            </h3>
            <button className="text-[11px] font-bold tracking-wider uppercase font-geist text-[#0A9BAD] hover:underline">
              Xem tất cả
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[10px] text-slate-500 font-geist uppercase tracking-wider bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 rounded-tl-lg">Nhân viên</th>
                  <th className="px-4 py-3">Chức vụ</th>
                  <th className="px-4 py-3">Khoa</th>
                  <th className="px-4 py-3 rounded-tr-lg">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    name: "BS. Nguyễn Văn A",
                    role: "Trưởng khoa",
                    dept: "Cấp cứu",
                    status: "Đang trực",
                  },
                  {
                    name: "ĐD. Trần Thị B",
                    role: "Điều dưỡng trưởng",
                    dept: "Cấp cứu",
                    status: "Đang trực",
                  },
                  { name: "BS. Lê Văn C", role: "Bác sĩ", dept: "Tim mạch", status: "Nghỉ" },
                  { name: "BS. Phạm Thị D", role: "Bác sĩ", dept: "Nội tiết", status: "Đang trực" },
                ].map((s, i) => (
                  <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3 font-bold text-slate-900">{s.name}</td>
                    <td className="px-4 py-3 text-slate-600 text-[13px]">{s.role}</td>
                    <td className="px-4 py-3 text-slate-600 text-[13px]">{s.dept}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-[10px] font-bold ${s.status === "Đang trực" ? "bg-[#88E8F2] text-[#0d1f2d]" : "bg-slate-100 text-slate-600"}`}
                      >
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Panel 4: Quản lý Khoa phòng */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Bed className="w-5 h-5 text-[#0A9BAD]" /> Quản lý Khoa phòng
            </h3>
            <button className="text-[11px] font-bold tracking-wider uppercase font-geist text-[#0A9BAD] hover:underline flex items-center gap-1">
              <Plus className="w-3 h-3" /> Thêm khoa
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { name: "Khoa Cấp cứu", beds: 20, occ: 18, color: "#DC2626" },
              { name: "Khoa Tim mạch", beds: 40, occ: 35, color: "#7C3AED" },
              { name: "Khoa Thần kinh", beds: 30, occ: 20, color: "#1E40AF" },
              { name: "Khoa Nội", beds: 50, occ: 48, color: "#2563EB" },
              { name: "Khoa Nhi", beds: 40, occ: 25, color: "#DB2777" },
              { name: "Khoa Phụ sản", beds: 35, occ: 15, color: "#E11D48" },
            ].map((d) => (
              <div
                key={d.name}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-[#88E8F2] transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-2 h-8 rounded-full transition-transform group-hover:scale-y-110"
                    style={{ backgroundColor: d.color }}
                  />
                  <div>
                    <p className="text-sm font-bold text-slate-900">{d.name}</p>
                    <p className="text-[11px] text-slate-500 font-geist tracking-wider">
                      {d.occ}/{d.beds} giường
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Panel 6: Nhật ký Hoạt động */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#0A9BAD]" /> Nhật ký Hoạt động
          </h3>
          <button className="text-[11px] font-bold tracking-wider uppercase font-geist text-[#0A9BAD] hover:underline flex items-center gap-1">
            <Filter className="w-3 h-3" /> Lọc nhật ký
          </button>
        </div>
        <div className="space-y-0 relative before:absolute before:inset-y-0 before:left-[17px] before:w-px before:bg-slate-200 ml-1">
          {[
            {
              time: "10:45:21",
              user: "Admin",
              action: "Cập nhật hệ thống camera khu Cấp cứu",
              icon: Settings,
            },
            {
              time: "10:30:05",
              user: "BS. Nguyễn Văn A",
              action: "Đăng nhập hệ thống (FaceID)",
              icon: UserCheck,
            },
            {
              time: "10:15:42",
              user: "Hệ thống",
              action: "Phát hiện ngã tại phòng CC01 (Đã xử lý)",
              icon: AlertTriangle,
              alert: true,
            },
            {
              time: "09:50:11",
              user: "Admin",
              action: "Thêm thiết bị Tablet mới (ID: TAB-045)",
              icon: Plus,
            },
          ].map((log, i) => {
            const Icon = log.icon;
            return (
              <div key={i} className="flex gap-4 relative py-3 group">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 z-10 border-4 border-white transition-transform group-hover:scale-110 ${log.alert ? "bg-red-100" : "bg-slate-50"}`}
                >
                  <Icon className={`w-4 h-4 ${log.alert ? "text-red-500" : "text-[#0A9BAD]"}`} />
                </div>
                <div>
                  <p className="text-[13px] font-bold text-slate-900">{log.action}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 font-geist tracking-wider">
                    {log.time} · {log.user}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
