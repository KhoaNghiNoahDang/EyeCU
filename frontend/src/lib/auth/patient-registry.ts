/** Lưu hồ sơ bệnh nhân đã đăng ký (mock DB local — sẽ thay bằng API + PostgreSQL) */

export interface RegisteredPatient {
  id: string;
  cccd: string;
  name: string;
  phone: string;
  bhxh_code: string | null;
  /** Ảnh khuôn mặt gốc — dùng so khớp VNPT Face (users.avatar_url) */
  avatar_url: string | null;
  /** WebAuthn credential id (base64url) */
  credentialId: string;
  /** Mã QR riêng trên sổ khám bệnh */
  qrToken: string;
  /** CCCD front photo (data URL) */
  cccdFrontUrl: string | null;
  /** CCCD back photo (data URL) */
  cccdBackUrl: string | null;
  /** Emergency contact name */
  emergency_contact_name: string | null;
  /** Emergency contact phone */
  emergency_contact_phone: string | null;
  createdAt: string;
}

const STORAGE_KEY = "eyecu_patient_registry";

function loadAll(): RegisteredPatient[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveAll(patients: RegisteredPatient[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(patients));
}

export function findPatientByCccdAndPhone(cccd: string, phone: string): RegisteredPatient | null {
  const normalizedPhone = normalizePhone(phone);
  return (
    loadAll().find((p) => p.cccd === cccd.trim() && normalizePhone(p.phone) === normalizedPhone) ??
    null
  );
}

export function findPatientByQrToken(token: string): RegisteredPatient | null {
  return loadAll().find((p) => p.qrToken === token) ?? null;
}

export function findPatientByCccd(cccd: string): RegisteredPatient | null {
  return loadAll().find((p) => p.cccd === cccd.trim()) ?? null;
}

export function isCccdRegistered(cccd: string): boolean {
  return loadAll().some((p) => p.cccd === cccd.trim());
}

export function registerPatient(
  data: Omit<RegisteredPatient, "id" | "qrToken" | "createdAt">,
): RegisteredPatient {
  const all = loadAll();
  if (all.some((p) => p.cccd === data.cccd.trim())) {
    throw new Error("Số CCCD đã được đăng ký");
  }
  const patient: RegisteredPatient = {
    ...data,
    cccdFrontUrl: data.cccdFrontUrl ?? null,
    cccdBackUrl: data.cccdBackUrl ?? null,
    emergency_contact_name: data.emergency_contact_name ?? null,
    emergency_contact_phone: data.emergency_contact_phone ?? null,
    id: crypto.randomUUID(),
    qrToken: crypto.randomUUID().replace(/-/g, "").slice(0, 16),
    createdAt: new Date().toISOString(),
  };
  all.push(patient);
  saveAll(all);
  return patient;
}

export function getPatientQrUrl(patient: RegisteredPatient): string {
  if (typeof window === "undefined") return `/scan?t=${patient.qrToken}`;
  return `${window.location.origin}/scan?t=${patient.qrToken}`;
}

export function updatePatientCredentialId(cccd: string, credentialId: string): RegisteredPatient {
  const all = loadAll();
  const idx = all.findIndex((p) => p.cccd === cccd.trim());
  if (idx === -1) {
    const availableCccds = all.map(p => `"${p.cccd}"`).join(", ");
    throw new Error(`Không tìm thấy bệnh nhân. CCCD cần tìm: "${cccd.trim()}". Các CCCD có sẵn: ${availableCccds}`);
  }
  all[idx]!.credentialId = credentialId;
  saveAll(all);
  return all[idx]!;
}

export function toAuthUser(patient: RegisteredPatient) {
  return {
    id: patient.id,
    name: patient.name,
    type: "patient" as const,
    cccd: patient.cccd,
    phone: patient.phone,
    avatar: patient.avatar_url ?? undefined,
  };
}

function normalizePhone(phone: string) {
  return phone.replace(/\D/g, "");
}

/** Seed demo nếu chưa có ai — tiện test trên desktop không có WebAuthn */
export function ensureDemoPatient() {
  if (loadAll().length > 0) return;
  registerPatient({
    cccd: "001203001247",
    name: "Nguyễn Văn A",
    phone: "0912345678",
    bhxh_code: "DN4015002345678",
    avatar_url: null,
    credentialId: "",
    cccdFrontUrl: null,
    cccdBackUrl: null,
    emergency_contact_name: "Nguyễn Thị B",
    emergency_contact_phone: "0987654321",
  });
}
