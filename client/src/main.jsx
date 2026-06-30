import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import axios from 'axios';

import { Capacitor } from '@capacitor/core';

const isNative = Capacitor.isNativePlatform();

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
    axios.defaults.baseURL = isNative ? 'https://api.oxypace.com.tr' : '';
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

const renderApp = () => {
    ReactDOM.createRoot(document.getElementById('root')).render(
        <React.StrictMode>
            <HelmetProvider>
                <ErrorBoundary>
                    <App />
                </ErrorBoundary>
            </HelmetProvider>
        </React.StrictMode>
    );
};

const show404Page = () => {
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
};

const init = async () => {
    // 1. Eğer kullanıcı oturum açmışsa, doğrudan uygulamayı başlat
    const token = localStorage.getItem('token');
    if (token) {
        renderApp();
        return;
    }

    try {
        // 2. Bakım durumunu API'den sorgula
        const res = await fetch('/api/auth/maintenance-status');
        const data = await res.json();
        
        if (data.active) {
            // Bakım aktif ve yetki yoksa sahte 404 sayfasına yönlendir
            show404Page();
        } else {
            // Bakım pasifse uygulamayı normal başlat
            renderApp();
        }
    } catch (err) {
        // API bağlantı hatası durumunda kullanıcıyı engelleme (fail-safe)
        renderApp();
    }
};

init();

