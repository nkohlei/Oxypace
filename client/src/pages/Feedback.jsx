import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
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
            const data = new FormData();
            data.append('category', formData.category);
            data.append('subject', formData.subject);
            data.append('message', formData.message);
            files.forEach(file => data.append('files', file));

            await axios.post('/api/feedback/submit', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

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

    return (
        <div className="feedback-page-root">
            <Helmet>
                <title>Geri Bildirim | Oxypace</title>
                <meta name="description" content="Oxypace deneyiminizi paylaşın, platformu birlikte geliştirelim." />
            </Helmet>

            <Navbar />

            <main className="feedback-main-wrapper">
                <div className="feedback-header-section">
                    <div className="back-nav">
                        <Link to="/" className="back-btn-pill">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M15 18l-6-6 6-6" />
                            </svg>
                            <span>Ana Sayfa</span>
                        </Link>
                    </div>
                    <h1 className="gradient-title">Geri Bildirim & Destek</h1>
                    <p className="subtitle">Platformumuzu daha iyi hale getirmek için fikirlerinize ihtiyacımız var.</p>
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
                                            <span>Geri Bildirimi İlet</span>
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                <path d="M5 12h14M12 5l7 7-7 7" />
                                            </svg>
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Right Section: History */}
                    <div className="feedback-history-column">
                        <div className="history-glass-card">
                            <h2 className="section-subtitle">Geçmiş Taleplerim</h2>
                            
                            <div className="history-list-container">
                                {loadingHistory ? (
                                    <div className="history-loader">Talepler yükleniyor...</div>
                                ) : history.length === 0 ? (
                                    <div className="no-history-msg">
                                        Henüz bir geri bildirim talebiniz bulunmuyor.
                                    </div>
                                ) : (
                                    history.map(item => (
                                        <div key={item._id} className={`history-ticket-card ${item.status}`}>
                                            <div className="ticket-header">
                                                <span className="ticket-id">{getTicketId(item._id)}</span>
                                                <span className={`status-badge ${item.status}`}>
                                                    {getStatusText(item.status)}
                                                </span>
                                            </div>
                                            <div className="ticket-body">
                                                <div className="ticket-meta">{item.category}</div>
                                                <div className="ticket-subject">{item.subject}</div>
                                                
                                                {/* Files Display */}
                                                {item.files && item.files.length > 0 && (
                                                    <div className="ticket-attachments-preview">
                                                        {item.files.map((file, idx) => (
                                                            <div key={idx} className="attachment-thumb">
                                                                <img src={getImageUrl(file)} alt="attachment" />
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                <div className="ticket-date">
                                                    {new Date(item.createdAt).toLocaleDateString('tr-TR')}
                                                </div>
                                            </div>

                                            {item.adminResponse && (
                                                <div className="ticket-response">
                                                    <div className="response-label">Yanıt:</div>
                                                    <p>{item.adminResponse}</p>
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
        </div>
    );
};

export default Feedback;
