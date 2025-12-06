import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import axios from 'axios'

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
    console.log('API Base URL set to:', baseUrl);
} else if (!import.meta.env.DEV) {
    console.warn("VITE_API_BASE_URL not set in production!");
}

import ErrorBoundary from './components/ErrorBoundary.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <ErrorBoundary>
            <App />
        </ErrorBoundary>
    </React.StrictMode>,
)
