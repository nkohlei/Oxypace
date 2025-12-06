import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import axios from 'axios'

// Set default base URL for all axios requests
// In dev, usage of proxy in vite.config.js usually handles this, but explicit setting is safer for prod
if (import.meta.env.VITE_API_BASE_URL) {
    axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL;
} else if (!import.meta.env.DEV) {
    // Fallback if env var is missing in prod (should not happen if configured correctly)
    console.warn("VITE_API_BASE_URL not set in production!");
}

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)
