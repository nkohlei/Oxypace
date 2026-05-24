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

import ErrorBoundary from './components/ErrorBoundary.jsx';
import { HelmetProvider } from 'react-helmet-async';

// Global error handler for Vite dynamic import chunk errors
window.addEventListener('vite:preloadError', (event) => {
    console.warn('Vite preload error (chunk mismatch) detected. Reloading page...', event);
    window.location.reload();
});

// ── Client-side Access Control Fallback ────────────────────────────────
const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
};

const urlParams = new URLSearchParams(window.location.search);
let hasAccess = getCookie('admin_access') === 'true';

if (urlParams.get('access') === 'oxypace') {
    // 30 gün geçerli çerez ata
    const date = new Date();
    date.setTime(date.getTime() + (30 * 24 * 60 * 60 * 1000));
    document.cookie = `admin_access=true; expires=${date.toUTCString()}; path=/; SameSite=Lax; Secure`;
    hasAccess = true;

    // URL parametresini temizle
    const cleanUrl = new URL(window.location.href);
    cleanUrl.searchParams.delete('access');
    window.history.replaceState({}, '', cleanUrl.pathname + cleanUrl.search);
}

if (hasAccess) {
    ReactDOM.createRoot(document.getElementById('root')).render(
        <React.StrictMode>
            <HelmetProvider>
                <ErrorBoundary>
                    <App />
                </ErrorBoundary>
            </HelmetProvider>
        </React.StrictMode>
    );
} else {
    // Çerez yoksa React uygulamasını yükleme, sahte 404 sayfasını sessizce çekip göster (silent rewrite)
    fetch('/404.html')
        .then((res) => res.text())
        .then((html) => {
            document.open();
            document.write(html);
            document.close();
        })
        .catch(() => {
            window.location.href = '/404.html';
        });
}

