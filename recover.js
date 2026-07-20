const fs = require('fs');
const win1252ToByte = new Map();
for (let i = 0; i <= 255; i++) {
    if (i >= 0x80 && i <= 0x9F) continue;
    win1252ToByte.set(i, i);
}
const cp1252 = {
    0x80: 0x20AC, 0x82: 0x201A, 0x83: 0x0192, 0x84: 0x201E,
    0x85: 0x2026, 0x86: 0x2020, 0x87: 0x2021, 0x88: 0x02C6,
    0x89: 0x2030, 0x8A: 0x0160, 0x8B: 0x2039, 0x8C: 0x0152,
    0x8E: 0x017D, 0x91: 0x2018, 0x92: 0x2019, 0x93: 0x201C,
    0x94: 0x201D, 0x95: 0x2022, 0x96: 0x2013, 0x97: 0x2014,
    0x98: 0x02DC, 0x99: 0x2122, 0x9A: 0x0161, 0x9B: 0x203A,
    0x9C: 0x0153, 0x9E: 0x017E, 0x9F: 0x0178
};
for (const [byte, codePoint] of Object.entries(cp1252)) {
    win1252ToByte.set(codePoint, parseInt(byte));
}
[0x81, 0x8D, 0x8F, 0x90, 0x9D].forEach(b => win1252ToByte.set(b, b));

const file = 'frontend/src/routes/index.tsx';
let str = fs.readFileSync(file, 'utf8');
if (str.charCodeAt(0) === 0xFEFF) str = str.slice(1);

const bytes = new Uint8Array(str.length);
let badCount = 0;
let i = 0;
for (const char of str) {
    const cp = char.codePointAt(0);
    let byte = win1252ToByte.get(cp);
    if (byte === undefined) {
        byte = cp & 0xFF;
        badCount++;
    }
    bytes[i++] = byte;
}

const recovered = Buffer.from(bytes.buffer, 0, i).toString('utf8');
fs.writeFileSync('frontend/src/routes/index.recovered.tsx', recovered, 'utf8');
console.log('Recovered with bad count:', badCount);
