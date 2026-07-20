const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'src/components/PatientPortalNew.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Match regardless of line endings
const searchRegex = /{\s*activeTab === "home" \? \(\s*currentView === "home" \? \(/;

const replacementStr = `{activeTab === "home" ? (
          currentView === "health_record_list" ? (
            renderHealthRecordList()
          ) : currentView === "home" ? (`;

if (searchRegex.test(content)) {
  content = content.replace(searchRegex, replacementStr);
  fs.writeFileSync(targetFile, content);
  console.log("Routing fixed successfully!");
} else {
  console.log("Could not find target string to replace!");
}
