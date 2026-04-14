import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import './Feedback.css';

const Feedback = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        category: 'Geribildirim',
        subject: '',
        message: ''
    });
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const categories = ['Hata Bildirimi', 'Öneri', 'Şikayet', 'Genel'];

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

            setSuccess('Geri bildiriminiz başarıyla iletildi. Teşekkür ederiz!');
            setTimeout(() => navigate('/'), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Bir hata oluştu. Lütfen tekrar deneyin.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="feedback-container">
            <Navbar />
            <div className="feedback-content">
                <div className="feedback-glass-card">
                    <h1>Geri Bildirim Gönder</h1>
                    <p className="subtitle">Deneyiminizi geliştirmemize yardımcı olun.</p>

                    {error && <div className="feedback-alert error">{error}</div>}
                    {success && <div className="feedback-alert success">{success}</div>}

                    <form onSubmit={handleSubmit} className="feedback-form">
                        <div className="form-group">
                            <label>Kategori</label>
                            <select 
                                value={formData.category} 
                                onChange={(e) => setFormData({...formData, category: e.target.value})}
                                required
                            >
                                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Konu</label>
                            <input 
                                type="text"
                                placeholder="Kısa bir başlık yazın..."
                                value={formData.subject}
                                onChange={(e) => setFormData({...formData, subject: e.target.value})}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Mesajınız</label>
                            <textarea 
                                placeholder="Geri bildiriminizi detaylandırın..."
                                value={formData.message}
                                onChange={(e) => setFormData({...formData, message: e.target.value})}
                                required
                                rows={5}
                            />
                        </div>

                        <div className="form-group">
                            <label>Dosyalar (Opsiyonel)</label>
                            <div className="file-upload-wrapper">
                                <input 
                                    type="file" 
                                    multiple 
                                    onChange={handleFileChange}
                                    id="file-input"
                                    className="hidden-file-input"
                                />
                                <label htmlFor="file-input" className="file-upload-label">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                        <polyline points="17 8 12 3 7 8" />
                                        <line x1="12" y1="3" x2="12" y2="15" />
                                    </svg>
                                    <span>{files.length > 0 ? `${files.length} Dosya Seçildi` : 'Dosya Seç veya Sürükle'}</span>
                                </label>
                            </div>
                        </div>

                        <button type="submit" className="submit-btn" disabled={loading}>
                            {loading ? 'Gönderiliyor...' : 'Gönder'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Feedback;
