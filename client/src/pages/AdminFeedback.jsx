import { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import './AdminFeedback.css';

const AdminFeedback = () => {
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [selectedFeedback, setSelectedFeedback] = useState(null);
    const [response, setResponse] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [migrationStatus, setMigrationStatus] = useState(null);

    useEffect(() => {
        fetchFeedbacks();
    }, []);

    const fetchFeedbacks = async () => {
        try {
            const res = await axios.get('/api/feedback/admin/list');
            setFeedbacks(res.data);
        } catch (err) {
            console.error('Fetch feedback error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleReply = async (id) => {
        if (!response.trim()) return;
        setSubmitting(true);
        try {
            await axios.post(`/api/feedback/admin/reply/${id}`, { response });
            setResponse('');
            setSelectedFeedback(null);
            fetchFeedbacks();
            alert('Yanıt başarıyla gönderildi ve kullanıcı bilgilendirildi.');
        } catch (err) {
            alert('Yanıt gönderilirken bir hata oluştu.');
        } finally {
            setSubmitting(false);
        }
    };

    const runMigration = async () => {
        if (!window.confirm('Eski iletişim verilerini taşımak istediğinize emin misiniz?')) return;
        try {
            const res = await axios.post('/api/feedback/admin/migrate');
            setMigrationStatus(res.data.results);
            fetchFeedbacks();
            alert('Taşıma işlemi tamamlandı.');
        } catch (err) {
            alert('Taşıma sırasında bir hata oluştu.');
        }
    };

    const filteredFeedbacks = feedbacks.filter(f => {
        if (filter === 'all') return true;
        if (filter === 'new') return f.status === 'new';
        if (filter === 'replied') return f.status === 'replied';
        return true;
    });

    return (
        <div className="admin-feedback-container">
            <Navbar />
            <div className="admin-feedback-content">
                <div className="admin-header">
                    <h1>Geri Bildirim Yönetimi</h1>
                    <div className="admin-actions">
                        <button onClick={runMigration} className="migration-btn">
                            Eski Verileri Taşı
                        </button>
                    </div>
                </div>

                {migrationStatus && (
                    <div className="migration-info">
                        Son Taşıma: {migrationStatus.migrated} yeni, {migrationStatus.skipped} atlandı.
                    </div>
                )}

                <div className="feedback-dashboard">
                    <div className="filter-bar">
                        <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>Tümü</button>
                        <button className={filter === 'new' ? 'active' : ''} onClick={() => setFilter('new')}>Yeni</button>
                        <button className={filter === 'replied' ? 'active' : ''} onClick={() => setFilter('replied')}>Yanıtlananlar</button>
                    </div>

                    <div className="feedback-list">
                        {loading ? (
                            <p>Yükleniyor...</p>
                        ) : filteredFeedbacks.length === 0 ? (
                            <p>Geri bildirim bulunamadı.</p>
                        ) : (
                            filteredFeedbacks.map(fb => (
                                <div 
                                    key={fb._id} 
                                    className={`feedback-item ${fb.status}`}
                                    onClick={() => setSelectedFeedback(fb)}
                                >
                                    <div className="item-header">
                                        <span className="category-tag">{fb.category}</span>
                                        <span className="date">{new Date(fb.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <h3>{fb.subject}</h3>
                                    <p className="sender">Kimden: @{fb.user.username}</p>
                                    {fb.status === 'replied' && <span className="status-badge">Yanıtlandı</span>}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {selectedFeedback && (
                <div className="feedback-modal-overlay" onClick={() => setSelectedFeedback(null)}>
                    <div className="feedback-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Talep Detayı</h2>
                            <button className="close-btn" onClick={() => setSelectedFeedback(null)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="detail-section">
                                <label>Kullanıcı:</label>
                                <p>@{selectedFeedback.user.username} ({selectedFeedback.user.profile.displayName})</p>
                            </div>
                            <div className="detail-section">
                                <label>Konu:</label>
                                <p>{selectedFeedback.subject}</p>
                            </div>
                            <div className="detail-section">
                                <label>Mesaj:</label>
                                <p className="msg-text">{selectedFeedback.message}</p>
                            </div>

                            {selectedFeedback.files && selectedFeedback.files.length > 0 && (
                                <div className="detail-section">
                                    <label>Ekler:</label>
                                    <div className="file-previews">
                                        {selectedFeedback.files.map((file, i) => (
                                            <a key={i} href={file} target="_blank" rel="noreferrer" className="file-link">
                                                Dosya {i + 1}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {selectedFeedback.status === 'replied' ? (
                                <div className="reply-history">
                                    <label>Önceki Yanıtınız:</label>
                                    <p className="history-text">{selectedFeedback.adminResponse}</p>
                                </div>
                            ) : (
                                <div className="reply-section">
                                    <label>Yanıtla (Inbox'a düşer):</label>
                                    <textarea 
                                        value={response}
                                        onChange={e => setResponse(e.target.value)}
                                        placeholder="Kullanıcıya iletilecek yanıtı yazın..."
                                    />
                                    <button 
                                        onClick={() => handleReply(selectedFeedback._id)}
                                        disabled={submitting || !response.trim()}
                                        className="reply-btn"
                                    >
                                        {submitting ? 'Gönderiliyor...' : 'Yanıtı Gönder'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminFeedback;
