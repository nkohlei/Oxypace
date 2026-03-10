import fs from 'fs';
import path from 'path';

const filesToFix = [
    './routes/users.js',
    './routes/portals.js',
    './routes/messages.js',
    './routes/comments.js',
    './routes/posts.js'
];

filesToFix.forEach(file => {
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        content = content.replace(/process\.env\.BACKEND_URL\s*\|\|\s*'https:\/\/unlikely-rosamond-oxypace-e695aebb\.koyeb\.app'/g, 'process.env.BACKEND_URL');
        fs.writeFileSync(file, content);
    }
});

console.log('Hardcoded URLs replaced successfully.');
