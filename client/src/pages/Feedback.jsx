import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Helmet } from 'react-helmet-async';
import Navbar from '../components/Navbar';
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

            setSuccess('Geri bildiriminiz başarıyla iletildi. En kısa sürede Inbox üzerinden dönüş yapacağız!');
            setTimeout(() => navigate('/'), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Bir hata oluştu. Lütfen tekrar deneyin.');
        } finally {
            setLoading(false);
        }
    };

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
                        <Link to="/settings" className="back-btn-pill">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M15 18l-6-6 6-6" />
                            </svg>
                            <span>Ayarlar</span>
                        </Link>
                    </div>
                    <h1 className="gradient-title">Geri Bildirim & Destek</h1>
                    <p className="subtitle">Platformumuzu daha iyi hale getirmek için fikirlerinize ihtiyacımız var.</p>
                </div>

                <div className="feedback-layout-grid">
                    {/* Left Section: Info */}
                    <div className="feedback-info-column">
                        <div className="info-card-premium">
                            <h2>Size Nasıl Yardımcı Olabiliriz?</h2>
                            <p>
                                Oxypace topluluğu olarak, platformu sizlerin ihtiyaçları doğrultusunda şekillendiriyoruz. 
                                Geri bildirimleriniz doğrudan geliştirici ekibimiz tarafından incelenir.
                            </p>
                            
                            <div className="info-item">
                                <div className="icon-box cyan">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>
                                </div>
                                <div>
                                    <h3>Hata Bildirimi</h3>
                                    <p>Bir sorun mu yaşıyorsunuz? Ekran görüntüsüyle birlikte bize iletin.</p>
                                </div>
                            </div>

                            <div className="info-item">
                                <div className="icon-box orange">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                                </div>
                                <div>
                                    <h3>Yeni Özellik Önerisi</h3>
                                    <p>Görmek istediğiniz bir özellik mi var? Hemen paylaşın.</p>
                                </div>
                            </div>

                            <div className="external-contact">
                                <p>Kurumsal iş birlikleri için:</p>
                                <a href="mailto:support@oxypace.com" className="email-link">support@oxypace.com</a>
                            </div>
                        </div>
                    </div>

                    {/* Right Section: Form */}
                    <div className="feedback-form-column">
                        <div className="form-glass-card">
                            {error && <div className="alert-message error">{error}</div>}
                            {success && <div className="alert-message success">{success}</div>}

                            <form onSubmit={handleSubmit}>
                                <div className="form-row">
                                    <div className="form-field">
                                        <label>Kategori</label>
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
                                        rows={6}
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
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                    <polyline points="17 8 12 3 7 8" />
                                                    <line x1="12" y1="3" x2="12" y2="15" />
                                                </svg>
                                            </div>
                                            <span>
                                                {files.length > 0 ? `${files.length} Dosya Seçildi` : 'Görsel veya dosya yüklemek için tıklayın'}
                                            </span>
                                        </label>
                                    </div>
                                    <p className="file-hint">JPG, PNG, PDF veya MP4 formatlarını destekliyoruz.</p>
                                </div>

                                <button type="submit" className="feedback-submit-btn" disabled={loading}>
                                    {loading ? (
                                        <div className="loader-dots">
                                            <span></span><span></span><span></span>
                                        </div>
                                    ) : 'Geri Bildirimi İlet'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Feedback;
