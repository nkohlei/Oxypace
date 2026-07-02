import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

// Vite injects the version from package.json via define in vite.config
// Fallback to the current release tag if env var is unavailable.
const APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.1.6';

const Footer = () => {
    return (
        <footer className="app-footer">
            <div className="footer-copyright">
                &copy; {new Date().getFullYear()} Oxypace. Tüm hakları saklıdır.
            </div>
            <div className="footer-links">
                <Link to="/privacy">Gizlilik Politikası</Link>
                <Link to="/terms">Kullanım Koşulları</Link>
                <Link to="/contact">İletişim</Link>
            </div>
            <div className="footer-version">
                v{APP_VERSION}
            </div>
        </footer>
    );
};

export default Footer;
