const fs = require('fs');
const path = require('path');

const patientPortalPath = path.join(__dirname, 'src/components/PatientPortalNew.tsx');
let ppContent = fs.readFileSync(patientPortalPath, 'utf8');

// Use regex to find currentView state regardless of line endings
const searchRegex = /const \[showFiles, setShowFiles\] = useState\(false\);/;
const replacementStr = `const [showFiles, setShowFiles] = useState(false);\n  const [healthRecordFilterYear, setHealthRecordFilterYear] = useState<string>("all");\n  const [selectedRecordDate, setSelectedRecordDate] = useState<string>("1/4/2026");`;

if (searchRegex.test(ppContent) && !ppContent.includes("healthRecordFilterYear")) {
  ppContent = ppContent.replace(searchRegex, replacementStr);
  fs.writeFileSync(patientPortalPath, ppContent);
  console.log("Successfully added states!");
} else {
  console.log("States already added or not found.");
}
