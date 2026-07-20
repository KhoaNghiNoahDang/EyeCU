const fs = require('fs');
const path = require('path');

const patientPortalPath = path.join(__dirname, 'src/components/PatientPortalNew.tsx');
let ppContent = fs.readFileSync(patientPortalPath, 'utf8');

// 1. Fix ViewState
const viewStateOriginal = 'type ViewState = "home" | "health_dashboard" | "health_record" | "record_lookup" | "community_qa" | "ask_question" | "question_thread" | "invoice_list" | "digital_signature" | "hospital_map" | "payment_confirmation" | "payment_face_capture" | "payment_success";';
const viewStateNew = 'type ViewState = "home" | "health_record_list" | "health_dashboard" | "health_record" | "record_lookup" | "community_qa" | "ask_question" | "question_thread" | "invoice_list" | "digital_signature" | "hospital_map" | "payment_confirmation" | "payment_face_capture" | "payment_success";';

if (ppContent.includes(viewStateOriginal)) {
  ppContent = ppContent.replace(viewStateOriginal, viewStateNew);
} else {
  console.log("Failed to find ViewState original");
}

// 2. Fix Missing States
const currentViewOriginal = '  const [currentView, setCurrentView] = useState<ViewState>("home");\n  const [showFiles, setShowFiles] = useState(false);';
const currentViewNew = '  const [currentView, setCurrentView] = useState<ViewState>("home");\n  const [showFiles, setShowFiles] = useState(false);\n  const [healthRecordFilterYear, setHealthRecordFilterYear] = useState<string>("all");\n  const [selectedRecordDate, setSelectedRecordDate] = useState<string>("1/4/2026");';

if (ppContent.includes(currentViewOriginal)) {
  ppContent = ppContent.replace(currentViewOriginal, currentViewNew);
} else {
  console.log("Failed to find currentView state original");
}

fs.writeFileSync(patientPortalPath, ppContent);
console.log("Fixed ViewState and states!");
