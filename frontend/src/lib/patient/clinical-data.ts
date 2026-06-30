/** Mock dữ liệu bệnh nhân — khớp schema PostgreSQL (clinical_records, medications, users) */

export interface ClinicalRecord {
  id: string;
  patient_id: string;
  doctor_id: string;
  symptoms: string | null;
  diagnosis: string | null;
  notes: string | null;
  created_at: string;
  is_signed: boolean;
  doctor_name: string;
  department: string;
}

export interface Medication {
  id: string;
  record_id: string;
  medicine_name: string;
  dosage: string;
  instructions: string | null;
}

export interface HospitalFeeItem {
  name: string;
  amount: number;
}

export interface HospitalFee {
  record_id: string;
  items: HospitalFeeItem[];
  total: number;
  status: "paid" | "pending";
  paid_at: string | null;
}

export interface PatientClinicalBundle {
  patientId: string;
  patientName: string;
  cccd: string;
  bhxh_code: string | null;
  latestRecord: ClinicalRecord;
  medications: Medication[];
  followUp: {
    date: string;
    time: string;
    department: string;
    note: string;
  };
  fees: HospitalFee;
}

const RECORD_ID = "cr-001203001247-20260625";
const PATIENT_ID = "p-001203001247";

export const DEMO_PATIENT_CLINICAL: PatientClinicalBundle = {
  patientId: PATIENT_ID,
  patientName: "Nguyễn Văn A",
  cccd: "001203001247",
  bhxh_code: "DN4015002345678",
  latestRecord: {
    id: RECORD_ID,
    patient_id: PATIENT_ID,
    doctor_id: "doc-tran-minh",
    symptoms: "Đau đầu, chóng mặt khi đứng dậy; huyết áp cao buổi sáng",
    diagnosis: "Tăng huyết áp vô căn độ II — kiểm soát chưa tốt",
    notes: "Tái khám sau 7 ngày · Nhịn ăn 8h trước xét nghiệm lipid máu · Mang sổ khám & thẻ BHYT",
    created_at: "2026-06-25T09:30:00",
    is_signed: true,
    doctor_name: "BS. Trần Minh",
    department: "Khoa Nội — Tim mạch",
  },
  medications: [
    {
      id: "med-1",
      record_id: RECORD_ID,
      medicine_name: "Amlodipin",
      dosage: "5mg — 1 viên/sáng",
      instructions: "Uống sau ăn sáng, không ngưng thuốc đột ngột",
    },
    {
      id: "med-2",
      record_id: RECORD_ID,
      medicine_name: "Metformin",
      dosage: "850mg — 2 viên/ngày",
      instructions: "1 viên sáng, 1 viên tối sau ăn",
    },
    {
      id: "med-3",
      record_id: RECORD_ID,
      medicine_name: "Atorvastatin",
      dosage: "20mg — 1 viên/tối",
      instructions: "Uống trước khi ngủ",
    },
  ],
  followUp: {
    date: "02/07/2026",
    time: "09:00",
    department: "Phòng khám số 3 — Khoa Nội",
    note: "Tái khám sau 7 ngày · Đo HA tại nhà 3 lần/ngày · Mang kết quả xét nghiệm",
  },
  fees: {
    record_id: RECORD_ID,
    items: [
      { name: "Khám bệnh", amount: 150_000 },
      { name: "Xét nghiệm sinh hóa", amount: 320_000 },
      { name: "Thuốc theo đơn", amount: 185_000 },
    ],
    total: 655_000,
    status: "paid",
    paid_at: "2026-06-25T10:15:00",
  },
};

export function formatVnd(amount: number) {
  return amount.toLocaleString("vi-VN") + " ₫";
}

export function formatRecordDate(iso: string) {
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
