const fs = require('fs');
const content = fs.readFileSync('app/db/models.py', 'utf-8');

const newContent = content.replace(/( +)(__tablename__ = ["']\w+["'])/g, (match, prefix, tablename) => {
    // skip if next line is already extend_existing
    const nextText = content.substring(content.indexOf(match) + match.length, content.indexOf(match) + match.length + 50);
    if (nextText.includes('extend_existing')) {
        return match;
    }
    return `${prefix}${tablename}\n${prefix}__table_args__ = {'extend_existing': True}`;
});

fs.writeFileSync('app/db/models.py', newContent, 'utf-8');
console.log('Fixed models.py with extend_existing=True for all tables.');
