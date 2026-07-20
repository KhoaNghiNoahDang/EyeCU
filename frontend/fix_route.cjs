const fs = require('fs');
const filePath = 'src/components/PatientPortalNew.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const target = `          ) : currentView === "digital_signature" ? (\r\n            renderDigitalSignature()\r\n          ) : (\r\n            renderHospitalMap()\r\n          )`;

const replacement = `          ) : currentView === "digital_signature" ? (\r\n            renderDigitalSignature()\r\n          ) : currentView === "health_record_list" ? (\r\n            renderHealthRecordList()\r\n          ) : (\r\n            renderHospitalMap()\r\n          )`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(filePath, content);
  console.log('SUCCESS: added health_record_list to routing');
} else {
  // Try with LF only
  const targetLF = `          ) : currentView === "digital_signature" ? (\n            renderDigitalSignature()\n          ) : (\n            renderHospitalMap()\n          )`;
  const replacementLF = `          ) : currentView === "digital_signature" ? (\n            renderDigitalSignature()\n          ) : currentView === "health_record_list" ? (\n            renderHealthRecordList()\n          ) : (\n            renderHospitalMap()\n          )`;
  if (content.includes(targetLF)) {
    content = content.replace(targetLF, replacementLF);
    fs.writeFileSync(filePath, content);
    console.log('SUCCESS (LF): added health_record_list to routing');
  } else {
    console.log('FAILED: could not find target. Checking for renderHealthRecordList in routing...');
    if (content.includes('renderHealthRecordList()') && content.includes(') : currentView === "health_record_list"')) {
      console.log('Already patched!');
    } else {
      console.log('Not found. Content around digital_signature:');
      const idx = content.indexOf('renderDigitalSignature()');
      console.log(JSON.stringify(content.substring(idx - 50, idx + 200)));
    }
  }
}
