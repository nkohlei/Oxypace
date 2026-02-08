import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
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
                manualChunks: {
                    // Split vendor chunks for better caching
                    vendor: ['react', 'react-dom', 'react-router-dom'],
                    socket: ['socket.io-client'],
                },
            },
        },
        chunkSizeWarningLimit: 500,
    },
    esbuild: {
        drop: ['console', 'debugger'], // Remove console.log in production
    },
});
