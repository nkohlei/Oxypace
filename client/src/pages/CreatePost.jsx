import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import './CreatePost.css';

const CreatePost = () => {
    const [content, setContent] = useState('');
    const [externalUrl, setExternalUrl] = useState('');
    const [mediaFile, setMediaFile] = useState(null);
    const [mediaPreview, setMediaPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const location = useLocation(); // Add hook
    const portalId = location.state?.portalId; // Get portalId if exists

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 25 * 1024 * 1024) {
                setError("Dosya boyutu 25MB'dan büyük olamaz.");
                return;
            }
            setMediaFile(file);
            setMediaPreview(URL.createObjectURL(file));
        }
    };

    const removeMedia = () => {
        setMediaFile(null);
        setMediaPreview(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!content && !mediaFile) {
            setError('Lütfen bir içerik veya medya ekleyin');
            return;
        }

        setLoading(true);

        try {
            const formData = new FormData();
            let finalContent = content;
            if (externalUrl) {
                finalContent = content ? content + '\n\n' + externalUrl : externalUrl;
            }
            formData.append('content', finalContent);
            if (mediaFile) {
                formData.append('media', mediaFile);
            }
            if (portalId) {
                formData.append('portalId', portalId);
            }

            // Force direct connection to backend to bypass Vercel 4.5MB limit
            const backendUrl = import.meta.env.DEV
                ? '/api/posts'
                : 'https://globalmessage-backend.koyeb.app/api/posts';

            await axios.post(backendUrl, formData);

            // Redirect back to portal if from portal, else home
            if (portalId) {
                navigate(`/portal/${portalId}`);
            } else {
                navigate('/');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Gönderi oluşturulamadı');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="app-wrapper">
            <Navbar />
            <main className="app-content">
                <div className="create-post-container">
                    <div className="create-header">
                        <button className="close-btn" onClick={() => navigate('/')}>
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                        <h1>Yeni Gönderi</h1>
                        <button
                            className="share-btn"
                            onClick={handleSubmit}
                            disabled={loading || (!content && !mediaFile)}
                        >
                            {loading ? 'Paylaşılıyor...' : 'Paylaş'}
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="create-form">
                        <textarea
                            placeholder="Ne düşünüyorsun?"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            rows="4"
                        />
                        <div className="url-input-container">
                            <input
                                type="text"
                                placeholder="Bağlantı ekle (URL)"
                                value={externalUrl}
                                onChange={(e) => setExternalUrl(e.target.value)}
                                className="url-input"
                            />
                        </div>

                        {mediaPreview && (
                            <div className="media-preview">
                                <img src={mediaPreview} alt="Preview" />
                                <button type="button" onClick={removeMedia} className="remove-btn">
                                    <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                    >
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                            </div>
                        )}

                        {error && <div className="error-message">{error}</div>}

                        <div className="media-options">
                            <label className="media-btn">
                                <input
                                    type="file"
                                    accept="image/*,.gif"
                                    onChange={handleFileChange}
                                    style={{ display: 'none' }}
                                />
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                >
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                    <circle cx="8.5" cy="8.5" r="1.5" />
                                    <polyline points="21 15 16 10 5 21" />
                                </svg>
                                <span>Fotoğraf</span>
                            </label>
                            <label className="media-btn">
                                <input
                                    type="file"
                                    accept="image/gif"
                                    onChange={handleFileChange}
                                    style={{ display: 'none' }}
                                />
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                >
                                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                                </svg>
                                <span>GIF</span>
                            </label>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default CreatePost;
