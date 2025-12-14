import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
    return (
        <footer className="app-footer">
            <div className="footer-links">
                <Link to="/privacy">Gizlilik Politikası</Link>
                <Link to="/terms">Kullanım Koşulları</Link>
                <Link to="/contact">İletişim</Link>
            </div>
            <div className="footer-copyright">
                &copy; {new Date().getFullYear()} Deepace. Tüm hakları saklıdır.
            </div>
        </footer>
    );
};

export default Footer;
