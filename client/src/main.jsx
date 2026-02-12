import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import axios from 'axios';

// Set default base URL for all axios requests
if (import.meta.env.VITE_API_BASE_URL) {
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
    console.warn('⚠️ VITE_API_BASE_URL not set! Defaulting to production backend.');
    axios.defaults.baseURL = 'https://unlikely-rosamond-oxypace-e695aebb.koyeb.app';
}

// Initialize Auth Header from localStorage immediately to prevent race conditions
const token = localStorage.getItem('token');
if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

import ErrorBoundary from './components/ErrorBoundary.jsx';

import { HelmetProvider } from 'react-helmet-async';

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <HelmetProvider>
            <ErrorBoundary>
                <App />
            </ErrorBoundary>
        </HelmetProvider>
    </React.StrictMode>
);

