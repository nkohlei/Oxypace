/**
 * blog-starter.js
 * Blog (Next.js) sürecini başlatan yardımcı script.
 * Ana server.js tarafından import EDİLMEZ — ayrı bir process olarak spawn edilir.
 * Kullanım: node blog-starter.js
 */
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BLOG_DIR = path.join(__dirname, 'blog');
const BLOG_PORT = process.env.BLOG_PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

console.log(`🌐 Starting Blog (Next.js) on port ${BLOG_PORT}...`);

const isProduction = NODE_ENV === 'production';

// Production: next start, Development: next dev
const args = isProduction
    ? ['start', '-p', String(BLOG_PORT)]
    : ['dev', '--webpack', '-p', String(BLOG_PORT)];

const blogProcess = spawn('npx', ['next', ...args], {
    cwd: BLOG_DIR,
    stdio: 'inherit',
    shell: true,
    env: {
        ...process.env,
        PORT: String(BLOG_PORT),
        HOSTNAME: '127.0.0.1',
    },
});

blogProcess.on('error', (err) => {
    console.error('❌ Blog process error:', err.message);
    process.exit(1);
});

blogProcess.on('exit', (code) => {
    if (code !== 0) {
        console.error(`❌ Blog process exited with code ${code}`);
        process.exit(code);
    }
});

// Forward termination signals
process.on('SIGTERM', () => blogProcess.kill('SIGTERM'));
process.on('SIGINT',  () => blogProcess.kill('SIGINT'));
