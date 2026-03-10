import fs from 'fs';
import path from 'path';

const portalsFile = './routes/portals.js';
let portalsContent = fs.readFileSync(portalsFile, 'utf8');
portalsContent = portalsContent.replace(/res\.status\(500\)\.json\(\{ message: error\.message \}\);/g, "res.status(500).json({ message: 'Sunucu hatası' });");
fs.writeFileSync(portalsFile, portalsContent);

const commentsFile = './routes/comments.js';
let commentsContent = fs.readFileSync(commentsFile, 'utf8');
commentsContent = commentsContent.replace(/res\.status\(500\)\.json\(\{ message: error\.message \|\| 'Server error' \}\);/g, "res.status(500).json({ message: 'Sunucu hatası' });");
fs.writeFileSync(commentsFile, commentsContent);

console.log('Error handling replaced successfully.');
