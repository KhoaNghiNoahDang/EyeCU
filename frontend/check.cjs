const ts = require('typescript');
const fs = require('fs');
const src = fs.readFileSync('src/routes/index.tsx', 'utf8');
const sourceFile = ts.createSourceFile('index.tsx', src, ts.ScriptTarget.Latest, true);
if (sourceFile.parseDiagnostics.length) {
    sourceFile.parseDiagnostics.forEach(d => {
        const pos = sourceFile.getLineAndCharacterOfPosition(d.start);
        console.log(`Line ${pos.line + 1}: ${d.messageText}`);
    });
} else {
    console.log('No parse errors!');
}
