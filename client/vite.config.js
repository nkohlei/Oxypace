import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'fs';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8'));

export default defineConfig({
    base: process.env.VITE_APP_TARGET === 'desktop' ? './' : '/',
    plugins: [react()],
    define: {
        // Inject package.json version so Footer (and any component) can read it at runtime
        'import.meta.env.VITE_APP_VERSION': JSON.stringify(pkg.version),
    },
    server: {
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://localhost:5000',
                changeOrigin: true,
                secure: false,
            },
        },
    },
    build: {
        outDir: 'dist',
        emptyOutDir: true,
        sourcemap: false,
        // Performance optimizations (esbuild is default and faster)
        minify: 'esbuild',
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes('node_modules')) {
                        if (id.includes('three') || id.includes('globe.gl') || id.includes('react-globe.gl')) {
                            return 'globe-visualization';
                        }
                        if (id.includes('@livekit') || id.includes('livekit-client')) {
                            return 'livekit';
                        }
                        if (id.includes('lucide-react')) {
                            return 'lucide';
                        }
                        if (id.includes('socket.io-client')) {
                            return 'socket';
                        }
                        return 'vendor';
                    }
                }
            }
        },
        chunkSizeWarningLimit: 500,
    },
    esbuild: {
        drop: ['console', 'debugger'], // Remove console.log in production
    },
});
