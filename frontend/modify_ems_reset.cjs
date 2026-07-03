const fs = require('fs');

const path = "d:\\\\HACKAITHON\\\\EyeCU\\\\frontend\\\\src\\\\routes\\\\index.tsx";
let content = fs.readFileSync(path, 'utf8');

const targetStr = `      setIsBroadcasting(false);
      setIsMissionStarted(false);
      realStartRef.current = null; // Reset`;
const windowsTargetStr = targetStr.replace(/\n/g, '\r\n');

let index = content.indexOf(targetStr);
let matchStr = targetStr;
if (index === -1) {
  index = content.indexOf(windowsTargetStr);
  matchStr = windowsTargetStr;
}

if (index !== -1) {
  const replacement = `      setIsBroadcasting(false);
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
      setHospitalAck(false);`;
      
  content = content.slice(0, index) + replacement + content.slice(index + matchStr.length);
  fs.writeFileSync(path, content, 'utf8');
  console.log("Successfully replaced GPS Stop logic!");
} else {
  console.log("Could not find the target string.");
}
