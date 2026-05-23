import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);

console.log('process.argv[1]:', process.argv[1]);
console.log('__filename:     ', __filename);
console.log('Direct equal:   ', process.argv[1] === __filename);
console.log('Resolved equal: ', path.resolve(process.argv[1]) === path.resolve(__filename));
console.log('Lowercased equal:', path.resolve(process.argv[1]).toLowerCase() === path.resolve(__filename).toLowerCase());
