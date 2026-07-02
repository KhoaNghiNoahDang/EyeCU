const fs = require('fs');
let content = fs.readFileSync('src/routes/index.tsx', 'utf8');

// Replace send({ type: "GPS_START", ... }) with supabase.from('dispatch_records').upsert(...)
const gpsStartOld = "send({\n" +
"        type: \"GPS_START\",\n" +
"        data: { plate: savedPlate, lat: initLat, lng: initLng, eta_seconds: initEta },\n" +
"      });";

const gpsStartNew = "supabase.from('dispatch_records').upsert({\n" +
"        plate: savedPlate,\n" +
"        lat: initLat,\n" +
"        lng: initLng,\n" +
"        eta: initEta,\n" +
"        status: 'active',\n" +
"        added_at: Date.now()\n" +
"      }).then();\n" +
"      send({\n" +
"        type: \"GPS_START\",\n" +
"        data: { plate: savedPlate, lat: initLat, lng: initLng, eta_seconds: initEta },\n" +
"      });";
content = content.replace(gpsStartOld, gpsStartNew);

const gpsCurrentPosOld = "send({\n" +
"            type: \"GPS_START\",\n" +
"            data: { plate: savedPlate, lat: latitude, lng: longitude, eta_seconds: etaSeconds },\n" +
"          });";
const gpsCurrentPosNew = "supabase.from('dispatch_records').upsert({\n" +
"            plate: savedPlate,\n" +
"            lat: latitude,\n" +
"            lng: longitude,\n" +
"            eta: etaSeconds,\n" +
"            status: 'active',\n" +
"            added_at: Date.now()\n" +
"          }).then();\n" +
"          send({\n" +
"            type: \"GPS_START\",\n" +
"            data: { plate: savedPlate, lat: latitude, lng: longitude, eta_seconds: etaSeconds },\n" +
"          });";
content = content.replace(gpsCurrentPosOld, gpsCurrentPosNew);

const gpsWatchOld = "send({\n" +
"            type: \"GPS_UPDATE\",\n" +
"            data: { plate: savedPlate, ambulance_id: \"current\", lat: latitude, lng: longitude, eta_seconds: etaSeconds },\n" +
"          });";
const gpsWatchNew = "supabase.from('dispatch_records').update({\n" +
"            lat: latitude,\n" +
"            lng: longitude,\n" +
"            eta: etaSeconds\n" +
"          }).eq('plate', savedPlate).then();\n" +
"          send({\n" +
"            type: \"GPS_UPDATE\",\n" +
"            data: { plate: savedPlate, ambulance_id: \"current\", lat: latitude, lng: longitude, eta_seconds: etaSeconds },\n" +
"          });";
content = content.replace(gpsWatchOld, gpsWatchNew);

// Replace sendPatientUpdate inside EmsView
const sendPatientOld = "const sendPatientUpdate = (data: any) => {\n" +
"    send({\n" +
"      type: \"PATIENT_UPDATE\",\n" +
"      data: { plate: plateConfirmed, ...data }\n" +
"    });\n" +
"  };";

const sendPatientNew = "const sendPatientUpdate = (data: any) => {\n" +
"    supabase.from('dispatch_records').update({\n" +
"      patient_name: data.patientName,\n" +
"      gender: data.gender,\n" +
"      age: data.age,\n" +
"      cccd: data.cccd,\n" +
"      chronic_conditions: data.chronicConditions,\n" +
"      allergies: data.allergies,\n" +
"      alert_label: data.alertLabel,\n" +
"      er_team: data.erTeam\n" +
"    }).eq('plate', plateConfirmed).then();\n" +
"    send({\n" +
"      type: \"PATIENT_UPDATE\",\n" +
"      data: { plate: plateConfirmed, ...data }\n" +
"    });\n" +
"  };";
content = content.replace(sendPatientOld, sendPatientNew);

fs.writeFileSync('src/routes/index.tsx', content, 'utf8');
console.log("EmsView Supabase integration completed.");
