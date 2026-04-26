import { useState, useEffect } from 'react';
import axios from 'axios';
import './LinkPreview.css';

const LinkPreview = ({ url }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchPreview = async () => {
            try {
                // Ensure url is valid and absolute
                let targetUrl = url;
                if (!targetUrl.startsWith('http')) {
                    targetUrl = `https://${targetUrl}`;
                }

                const response = await axios.get(`/api/preview?url=${encodeURIComponent(targetUrl)}`);
                if (response.data && response.data.title) {
                    setData(response.data);
                } else {
                    setError(true);
                }
            } catch (err) {
                console.error('Failed to fetch link preview:', err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        if (url) {
            fetchPreview();
        }
    }, [url]);

    if (loading || error || !data) {
        return null;
    }

    const domain = new URL(data.url).hostname.replace('www.', '');

    return (
        <a 
            href={data.url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="link-preview-container"
            onClick={(e) => e.stopPropagation()}
        >
            <div className="link-preview-content">
                {data.image && (
                    <div className="link-preview-image-container">
                        <img 
                            src={data.image} 
                            alt={data.title} 
                            className="link-preview-image"
                            onError={(e) => e.target.style.display = 'none'}
                        />
                    </div>
                )}
                <div className="link-preview-text">
                    <span className="link-preview-site">{data.siteName || domain}</span>
                    <h4 className="link-preview-title">{data.title}</h4>
                    {data.description && (
                        <p className="link-preview-description">{data.description}</p>
                    )}
                </div>
            </div>
        </a>
    );
};

export default LinkPreview;
