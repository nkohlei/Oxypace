import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import axios from 'axios';

const isNative = typeof Capacitor !== 'undefined' ? Capacitor.isNativePlatform() : (window.Capacitor && window.Capacitor.isNativePlatform());

// For production web, ALWAYS force relative URL to utilize Netlify Proxy and bypass ISP blocks.
// For native, use VITE_API_BASE_URL if available, otherwise fallback to Koyeb absolute URL.
if (!isNative && !import.meta.env.DEV) {
    console.log('🌐 Web Environment Detected: Forcing relative paths for ISP Bypass Proxy.');
    axios.defaults.baseURL = '';
} else if (import.meta.env.VITE_API_BASE_URL) {
    let baseUrl = import.meta.env.VITE_API_BASE_URL;
    // Remove trailing /api if present to avoid double /api/api in requests
    if (baseUrl.endsWith('/api')) {
        baseUrl = baseUrl.slice(0, -4);
    }
    // Remove trailing slash if present
    if (baseUrl.endsWith('/')) {
        baseUrl = baseUrl.slice(0, -1);
    }
    axios.defaults.baseURL = baseUrl;
} else if (!import.meta.env.DEV) {
    console.warn('⚠️ VITE_API_BASE_URL not set! Defaulting to ' + (isNative ? 'production backend' : 'relative proxy') + '.');
    axios.defaults.baseURL = isNative ? 'https://unlikely-rosamond-oxypace-e695aebb.koyeb.app' : '';
}

// Initialize Auth Header from localStorage immediately to prevent race conditions
const token = localStorage.getItem('token');
if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

// Clean scroll memory on page reload
const isReload = 
    (performance.getEntriesByType && 
     performance.getEntriesByType('navigation')[0] && 
     performance.getEntriesByType('navigation')[0].type === 'reload') ||
    (window.performance && window.performance.navigation && window.performance.navigation.type === 1);

if (isReload) {
    console.log('[Oxypace Scroll] Page reload detected globally. Clearing scroll memory.');
    sessionStorage.removeItem('oxypace_home_scroll');
}

import ErrorBoundary from './components/ErrorBoundary.jsx';
import { HelmetProvider } from 'react-helmet-async';

// Global error handler for Vite dynamic import chunk errors
window.addEventListener('vite:preloadError', (event) => {
    console.warn('Vite preload error (chunk mismatch) detected. Reloading page...', event);
    window.location.reload();
});

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <HelmetProvider>
            <ErrorBoundary>
                <App />
            </ErrorBoundary>
        </HelmetProvider>
    </React.StrictMode>
);

