import React, { useState, useEffect, useRef } from 'react';
import { X, MoreVertical, Share2, Copy, ExternalLink, RefreshCw } from 'lucide-react';
import { Browser } from '@capacitor/browser';
import { Share } from '@capacitor/share';
import { Clipboard } from '@capacitor/clipboard';
import { Capacitor } from '@capacitor/core';

const InAppBrowser = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [url, setUrl] = useState('');
    const [showMenu, setShowMenu] = useState(false);
    const [title, setTitle] = useState('Yükleniyor...');
    const menuRef = useRef(null);

    useEffect(() => {
        const handleOpen = (e) => {
            const targetUrl = e.detail?.url;
            if (targetUrl) {
                setUrl(targetUrl);
                setIsOpen(true);
                setTitle(targetUrl.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]);
                setShowMenu(false);
            }
        };

        window.addEventListener('open-inapp-browser', handleOpen);

        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            window.removeEventListener('open-inapp-browser', handleOpen);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    if (!isOpen) return null;

    const handleClose = () => {
        setIsOpen(false);
        setUrl('');
    };

    const handleRefresh = () => {
        const iframe = document.getElementById('inapp-browser-iframe');
        if (iframe) {
            iframe.src = url;
        }
    };

    const handleOpenInSystemBrowser = async () => {
        try {
            await Browser.open({ url });
        } catch (e) {
            console.error('System browser open error:', e);
            window.open(url, '_blank');
        }
        setShowMenu(false);
    };

    const handleShare = async () => {
        try {
            if (Capacitor.isNativePlatform()) {
                await Share.share({
                    title: 'Bağlantıyı Paylaş',
                    url: url,
                    dialogTitle: 'Bağlantıyı şununla paylaş:'
                });
            } else if (navigator.share) {
                await navigator.share({
                    title: 'Bağlantıyı Paylaş',
                    url: url
                });
            } else {
                alert('Paylaşma bu cihazda desteklenmiyor.');
            }
        } catch (e) {
            console.error('Share error:', e);
        }
        setShowMenu(false);
    };

    const handleCopyToClipboard = async () => {
        try {
            if (Capacitor.isNativePlatform()) {
                await Clipboard.write({
                    string: url
                });
            } else {
                await navigator.clipboard.writeText(url);
            }
            // Temporarily show success feedback in title
            const prevTitle = title;
            setTitle('Kopyalandı!');
            setTimeout(() => setTitle(prevTitle), 2000);
        } catch (e) {
            console.error('Copy error:', e);
        }
        setShowMenu(false);
    };

    return (
        <div style={styles.overlay}>
            <div style={styles.header}>
                <button onClick={handleClose} style={styles.iconBtn} aria-label="Kapat">
                    <X size={22} color="#fff" />
                </button>
                
                <div style={styles.titleContainer}>
                    <span style={styles.title}>{title}</span>
                    <span style={styles.subtitle}>{url}</span>
                </div>

                <div style={styles.actions}>
                    <button onClick={handleRefresh} style={styles.iconBtn} aria-label="Yenile">
                        <RefreshCw size={18} color="#aaa" />
                    </button>
                    <div style={{ position: 'relative' }} ref={menuRef}>
                        <button onClick={() => setShowMenu(!showMenu)} style={styles.iconBtn} aria-label="Menü">
                            <MoreVertical size={20} color="#fff" />
                        </button>

                        {showMenu && (
                            <div style={styles.dropdown}>
                                <button onClick={handleOpenInSystemBrowser} style={styles.menuItem}>
                                    <ExternalLink size={16} />
                                    <span>Chrome'da Görüntüle</span>
                                </button>
                                <button onClick={handleShare} style={styles.menuItem}>
                                    <Share2 size={16} />
                                    <span>Paylaş</span>
                                </button>
                                <button onClick={handleCopyToClipboard} style={styles.menuItem}>
                                    <Copy size={16} />
                                    <span>Bağlantıyı Kopyala</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            <div style={styles.iframeContainer}>
                <iframe
                    id="inapp-browser-iframe"
                    src={url}
                    style={styles.iframe}
                    title="In-App Browser Content"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                />
            </div>
        </div>
    );
};

const styles = {
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
        backgroundColor: '#0a0a0a',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Inter', sans-serif"
    },
    header: {
        height: '60px',
        background: 'rgba(15, 15, 15, 0.95)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        boxSizing: 'border-box'
    },
    iconBtn: {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        transition: 'background 0.2s',
        outline: 'none'
    },
    titleContainer: {
        flex: 1,
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '0 16px',
        overflow: 'hidden'
    },
    title: {
        color: '#fff',
        fontSize: '14px',
        fontWeight: '600',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
    },
    subtitle: {
        color: '#888',
        fontSize: '11px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        marginTop: '2px'
    },
    actions: {
        display: 'flex',
        alignItems: 'center',
        gap: '4px'
    },
    dropdown: {
        position: 'absolute',
        top: '40px',
        right: 0,
        backgroundColor: '#161618',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '10px',
        padding: '6px 0',
        width: '200px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        zIndex: 100000,
        display: 'flex',
        flexDirection: 'column'
    },
    menuItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        background: 'none',
        border: 'none',
        color: '#eee',
        fontSize: '14px',
        textAlign: 'left',
        cursor: 'pointer',
        width: '100%',
        transition: 'background 0.2s'
    },
    iframeContainer: {
        flex: 1,
        backgroundColor: '#fff',
        position: 'relative'
    },
    iframe: {
        width: '100%',
        height: '100%',
        border: 'none',
        backgroundColor: '#fff'
    }
};

export default InAppBrowser;
