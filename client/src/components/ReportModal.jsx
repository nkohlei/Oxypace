import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { X, Flag } from 'lucide-react';
import './ReportModal.css';

const ReportModal = ({ targetType, targetId, targetName, onClose }) => {
    const [reason, setReason] = useState('');
    const [details, setDetails] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const modalRef = useRef(null);

    useEffect(() => {
        // Prevent background scrolling
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!reason) {
            setError('Lütfen bir neden seçin.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await axios.post('/api/reports', {
                targetType,
                targetId,
                reason,
                details
            });
            setSuccess(true);
            setTimeout(() => {
                onClose();
            }, 1800);
        } catch (err) {
            console.error('Report submission failed:', err);
            setError(err.response?.data?.message || 'Bildirim iletilemedi. Lütfen tekrar deneyin.');
        } finally {
            setLoading(false);
        }
    };

    const reasons = [
        { value: 'spam', label: 'İstenmeyen İçerik (Spam)', desc: 'Spam, yanıltıcı bağlantılar veya reklam içerikleri.' },
        { value: 'harassment', label: 'Taciz veya Zorbalık', desc: 'Bireylere yönelik hakaret, karalama veya taciz edici eylemler.' },
        { value: 'hate_speech', label: 'Nefret Söylemi', desc: 'Irk, din, cinsiyet veya kimlik üzerinden ayrımcı, aşağılayıcı ifadeler.' },
        { value: 'violence', label: 'Şiddet veya Tehdit', desc: 'Fiziksel zarar, şiddet içeren eylemler veya açık tehditler.' },
        { value: 'sexual_content', label: 'Müstehcenlik veya Cinsel İçerik', desc: 'Uygunsuz görseller, cinsel içerikler veya pornografi.' },
        { value: 'other', label: 'Diğer Nedenler', desc: 'Yukarıdaki kategorilere girmeyen diğer kurallar veya sorunlar.' }
    ];

    return createPortal(
        <div className="report-modal-overlay">
            <div ref={modalRef} className="report-modal-card">
                {/* Header */}
                <div className="report-modal-header">
                    <div className="header-title-box">
                        <Flag size={20} className="report-header-icon" />
                        <h3>{targetType === 'user' ? 'Kullanıcıyı Bildir' : 'Gönderiyi Bildir'}</h3>
                    </div>
                    <button onClick={onClose} className="report-modal-close-btn" disabled={loading}>
                        <X size={20} />
                    </button>
                </div>

                {success ? (
                    <div className="report-success-state">
                        <div className="success-icon-badge">✓</div>
                        <h4>Bildiriminiz Alındı</h4>
                        <p>Oxypace topluluk standartlarını korumamıza yardımcı olduğunuz için teşekkür ederiz. Bildiriminiz en kısa sürede incelenecektir.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="report-modal-form">
                        <div className="report-target-preview">
                            <span className="preview-label">Bildirilen:</span>
                            <span className="preview-name">{targetType === 'user' ? `@${targetName}` : targetName}</span>
                        </div>

                        {error && <div className="report-error-msg">{error}</div>}

                        <div className="report-reasons-container">
                            <label className="section-title">Lütfen bir neden seçin:</label>
                            <div className="reasons-list">
                                {reasons.map((r) => (
                                    <label key={r.value} className={`reason-item-card ${reason === r.value ? 'selected' : ''}`}>
                                        <input
                                            type="radio"
                                            name="reportReason"
                                            value={r.value}
                                            checked={reason === r.value}
                                            onChange={() => setReason(r.value)}
                                            className="reason-radio-hidden"
                                        />
                                        <div className="reason-content-row">
                                            <div className="reason-bullet"></div>
                                            <div className="reason-text-block">
                                                <span className="reason-label">{r.label}</span>
                                                <span className="reason-desc">{r.desc}</span>
                                            </div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="report-details-container">
                            <label htmlFor="reportDetails" className="section-title">Ek Detaylar (İsteğe bağlı):</label>
                            <textarea
                                id="reportDetails"
                                placeholder="Lütfen durumu daha iyi anlamamıza yardımcı olacak detayları buraya yazın..."
                                value={details}
                                onChange={(e) => setDetails(e.target.value)}
                                rows={3}
                                className="report-details-textarea"
                            />
                        </div>

                        <div className="report-modal-footer">
                            <button type="button" onClick={onClose} className="report-btn-secondary" disabled={loading}>
                                İptal
                            </button>
                            <button type="submit" className="report-btn-primary" disabled={loading || !reason}>
                                {loading ? 'Gönderiliyor...' : 'Bildirimi Gönder'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>,
        document.body
    );
};

export default ReportModal;
