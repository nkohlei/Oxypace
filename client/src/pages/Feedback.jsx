import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { uploadFile } from '../utils/uploadUtils';

import { useAuth } from '../context/AuthContext';
import { Helmet } from 'react-helmet-async';
import Navbar from '../components/Navbar';
import { getImageUrl } from '../utils/imageUtils';
import './Feedback.css';

const Feedback = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        category: 'Hata Bildirimi',
        subject: '',
        message: ''
    });
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // History state
    const [history, setHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [showHistoryMobile, setShowHistoryMobile] = useState(false);

    const categories = ['Hata Bildirimi', 'Öneri', 'Şikayet', 'Genel'];

    useEffect(() => {
        if (user) {
            fetchHistory();
        }
    }, [user]);

    const fetchHistory = async () => {
        setLoadingHistory(true);
        try {
            const res = await axios.get('/api/feedback/me');
            setHistory(res.data);
        } catch (err) {
            console.error('Failed to fetch feedback history:', err);
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        setFiles(selectedFiles);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const mediaKeys = [];
            for (const file of files) {
                // Direct upload to R2
                const key = await uploadFile(file, 'feedback', user._id);
                mediaKeys.push(key);
            }

            const feedbackData = {
                category: formData.category,
                subject: formData.subject,
                message: formData.message,
                mediaKeys
            };

            await axios.post('/api/feedback/submit', feedbackData);


            setSuccess('Geri bildiriminiz başarıyla iletildi. Listeden takip edebilirsiniz.');
            setFormData({ category: 'Hata Bildirimi', subject: '', message: '' });
            setFiles([]);
            fetchHistory(); // Refresh history
            
            // Clear success after 5s
            setTimeout(() => setSuccess(''), 5000);
        } catch (err) {
            setError(err.response?.data?.message || 'Bir hata oluştu. Lütfen tekrar deneyin.');
        } finally {
            setLoading(false);
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'new': return 'İletildi';
            case 'reviewed': return 'İnceleniyor';
            case 'replied': return 'Yanıtlandı';
            case 'resolved': return 'Çözüldü';
            default: return status;
        }
    };

    const getTicketId = (id) => `#${id.substring(id.length - 6)}`;

    // Detail Modal Component
    const TicketDetailModal = ({ ticket, onClose }) => {
        if (!ticket) return null;
        return (
            <div className="ticket-modal-overlay" onClick={onClose}>
                <div className="ticket-modal-content" onClick={e => e.stopPropagation()}>
                    <div className="ticket-modal-header">
                        <div className="header-id-group">
                            <span className="modal-ticket-id">{getTicketId(ticket._id)}</span>
                            <span className={`status-badge-mini ${ticket.status}`}>{getStatusText(ticket.status)}</span>
                        </div>
                        <button className="modal-close-btn" onClick={onClose}>&times;</button>
                    </div>
                    
                    <div className="ticket-modal-scroll-body">
                        <div className="modal-section">
                            <label>Kategori</label>
                            <div className="modal-value-chip">{ticket.category}</div>
                        </div>

                        <div className="modal-section">
                            <label>Konu</label>
                            <h3 className="modal-subject">{ticket.subject}</h3>
                        </div>

                        <div className="modal-section">
                            <label>Mesajınız</label>
                            <div className="modal-message-box">{ticket.message}</div>
                        </div>

                        {ticket.files && ticket.files.length > 0 && (
                            <div className="modal-section">
                                <label>Ekli Dosyalar ({ticket.files.length})</label>
                                <div className="modal-gallery">
                                    {ticket.files.map((file, idx) => (
                                        <div key={idx} className="modal-gallery-item">
                                            <img src={getImageUrl(file)} alt="attachment" onClick={() => window.open(getImageUrl(file), '_blank')} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {ticket.adminResponse && (
                            <div className="modal-section admin-response-section">
                                <label>Yönetici Yanıtı</label>
                                <div className="modal-response-box">
                                    {ticket.adminResponse}
                                </div>
                            </div>
                        )}

                        <div className="modal-footer-date">
                            İletilme Tarihi: {new Date(ticket.createdAt).toLocaleString('tr-TR')}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="feedback-page-root">
            <Helmet>
                <title>Destek | Oxypace</title>
                <meta name="description" content="Oxypace destek merkezi. Taleplerinizi iletin, platformu birlikte geliştirelim." />
            </Helmet>

            <Navbar />

            <main className="feedback-main-wrapper">
                <div className="feedback-header-section">
                    <div className="title-with-back">
                        <Link to="/" className="minimal-back-btn" title="Ana Sayfa">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <path d="M15 18l-6-6 6-6" />
                            </svg>
                        </Link>
                        <h1 className="gradient-title">Destek & Yardım</h1>
                    </div>
                    <p className="subtitle">Platformumuzu daha iyi hale getirmek için fikirlerinize ve geri bildirimlerinize ihtiyacımız var.</p>
                </div>

                <div className="feedback-layout-grid">
                    {/* Left Section: Form */}
                    <div className="feedback-form-column">
                        <div className="form-glass-card">
                            <h2 className="section-subtitle">Yeni Talep Oluştur</h2>
                            {error && <div className="alert-message error">{error}</div>}
                            {success && <div className="alert-message success">{success}</div>}

                            <form onSubmit={handleSubmit} className="modern-feedback-form">
                                <div className="form-field">
                                    <label>Kategori</label>
                                    <div className="select-wrapper">
                                        <select 
                                            value={formData.category} 
                                            onChange={(e) => setFormData({...formData, category: e.target.value})}
                                            required
                                        >
                                            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="form-field">
                                    <label>Konu</label>
                                    <input 
                                        type="text"
                                        placeholder="Talebinizi özetleyen bir başlık..."
                                        value={formData.subject}
                                        onChange={(e) => setFormData({...formData, subject: e.target.value})}
                                        required
                                    />
                                </div>

                                <div className="form-field">
                                    <label>Mesajınız</label>
                                    <textarea 
                                        placeholder="Lütfen mesajınızı buraya yazın..."
                                        value={formData.message}
                                        onChange={(e) => setFormData({...formData, message: e.target.value})}
                                        required
                                        rows={5}
                                    />
                                </div>

                                <div className="form-field">
                                    <label>Ek Dosyalar (Opsiyonel)</label>
                                    <div className="drag-upload-zone">
                                        <input 
                                            type="file" 
                                            multiple 
                                            onChange={handleFileChange}
                                            id="f-files"
                                            className="hidden-input"
                                        />
                                        <label htmlFor="f-files" className="upload-btn-creative">
                                            <div className="pulse-icon">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                    <polyline points="17 8 12 3 7 8" />
                                                    <line x1="12" y1="3" x2="12" y2="15" />
                                                </svg>
                                            </div>
                                            <span className="upload-text">
                                                {files.length > 0 ? `${files.length} Dosya Seçildi` : 'Görsel veya dosya yükleyin'}
                                            </span>
                                        </label>
                                    </div>
                                </div>

                                <button type="submit" className="feedback-submit-btn-premium" disabled={loading}>
                                    {loading ? (
                                        <div className="loader-dots">
                                            <span></span><span></span><span></span>
                                        </div>
                                    ) : (
                                        <>
                                            <span>Talep İlet</span>
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                <path d="M5 12h14M12 5l7 7-7 7" />
                                            </svg>
                                        </>
                                    )}
                                </button>
                                
                                {/* Mobile History Toggle */}
                                <button 
                                    type="button" 
                                    className="mobile-history-trigger"
                                    onClick={() => setShowHistoryMobile(true)}
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>Geçmiş Taleplerim</span>
                                    {history.length > 0 && <span className="history-count-badge">{history.length}</span>}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Right Section: History */}
                    <div className={`feedback-history-column ${showHistoryMobile ? 'show-mobile' : ''}`}>
                        <div className="history-glass-card">
                            <div className="history-card-header">
                                <h2 className="section-subtitle">Geçmiş Taleplerim</h2>
                                <button className="mobile-history-close" onClick={() => setShowHistoryMobile(false)}>&times;</button>
                            </div>
                            
                            <div className="history-list-container">
                                {loadingHistory ? (
                                    <div className="history-loader">Talepler yükleniyor...</div>
                                ) : history.length === 0 ? (
                                    <div className="no-history-msg">
                                        Henüz bir geri bildirim talebiniz bulunmuyor.
                                    </div>
                                ) : (
                                    history.map(item => (
                                        <div 
                                            key={item._id} 
                                            className={`history-ticket-card ${item.status}`}
                                            onClick={() => {
                                                setSelectedTicket(item);
                                                setShowHistoryMobile(false);
                                            }}
                                        >
                                            <div className="ticket-header">
                                                <span className="ticket-id">{getTicketId(item._id)}</span>
                                                <span className={`status-badge ${item.status}`}>
                                                    {getStatusText(item.status)}
                                                </span>
                                            </div>
                                            <div className="ticket-body">
                                                <div className="ticket-meta">{item.category}</div>
                                                <div className="ticket-subject">{item.subject}</div>
                                                <div className="ticket-excerpt">{item.message}</div>
                                                
                                                {/* Files Indicator */}
                                                {item.files && item.files.length > 0 && (
                                                    <div className="ticket-attachments-indicator">
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
                                                        </svg>
                                                        <span>{item.files.length} Ek</span>
                                                    </div>
                                                )}
 
                                                <div className="ticket-date">
                                                    {new Date(item.createdAt).toLocaleDateString('tr-TR')}
                                                </div>
                                            </div>
 
                                            {item.adminResponse && (
                                                <div className="ticket-response-preview">
                                                    <div className="response-label">Yanıtlandı</div>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <TicketDetailModal 
                ticket={selectedTicket} 
                onClose={() => setSelectedTicket(null)} 
            />
        </div>
    );
};

export default Feedback;
