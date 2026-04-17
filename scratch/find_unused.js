
import fs from 'fs';
import path from 'path';

const SRC_DIR = 'c:/Projects/globalmessage2/client/src';

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      arrayOfFiles.push(path.join(dirPath, "/", file));
    }
  });

  return arrayOfFiles;
}

const allFiles = getAllFiles(SRC_DIR).filter(f => f.endsWith('.jsx') || f.endsWith('.js') || f.endsWith('.css'));

const entryPoints = [
  path.join(SRC_DIR, 'main.jsx'),
  path.join(SRC_DIR, 'App.jsx'),
  'c:/Projects/globalmessage2/client/index.html'
];

const fileContentMap = {};
allFiles.forEach(file => {
    fileContentMap[file] = fs.readFileSync(file, 'utf8');
});
// Also read index.html
fileContentMap['c:/Projects/globalmessage2/client/index.html'] = fs.readFileSync('c:/Projects/globalmessage2/client/index.html', 'utf8');

const usageCount = {};
allFiles.forEach(file => {
    const basename = path.basename(file, path.extname(file));
    usageCount[file] = 0;
    
    // Check if basename is imported or used in any other file
    Object.keys(fileContentMap).forEach(otherFile => {
        if (file === otherFile) return;
        
        const content = fileContentMap[otherFile];
        // Simple regex check for imports or references
        const regex = new RegExp(`['"/]${basename}(\\.|['" \n]|$)`, 'g');
        if (regex.test(content)) {
            usageCount[file]++;
        }
    });
});

console.log('--- UNUSED/LOW USAGE FILES ---');
allFiles.forEach(file => {
    if (usageCount[file] === 0 && !entryPoints.includes(file)) {
        console.log(`Unused: ${file}`);
    }
});
