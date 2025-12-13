
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminDashboard.css';

const AdminDashboard = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const { data } = await axios.get('/api/admin/verification-requests');
            setRequests(data);
            setLoading(false);
        } catch (err) {
            setError('Yetkisiz erişim veya sunucu hatası.');
            setLoading(false);
        }
    };

    const handleApprove = async (id) => {
        if (!window.confirm('Bu kullanıcıyı onaylamak istiyor musunuz?')) return;
        try {
            await axios.post(`/api/admin/verify-user/${id}`);
            setRequests(requests.filter(req => req._id !== id));
            alert('Kullanıcı doğrulandı!');
        } catch (err) {
            alert('İşlem başarısız.');
        }
    };

    const handleReject = async (id) => {
        if (!window.confirm('Bu başvuruyu reddetmek istiyor musunuz?')) return;
        try {
            await axios.post(`/api/admin/reject-verification/${id}`);
            setRequests(requests.filter(req => req._id !== id));
            alert('Başvuru reddedildi.');
        } catch (err) {
            alert('İşlem başarısız.');
        }
    };

    if (loading) return <div className="admin-loading">Yükleniyor...</div>;
    if (error) return <div className="admin-error">{error}</div>;

    return (
        <div className="admin-dashboard">
            <h1 className="admin-title">Yönetici Paneli</h1>

            <div className="admin-section">
                <h2>Bekleyen Doğrulama Talepleri ({requests.length})</h2>

                {requests.length === 0 ? (
                    <p className="no-requests">Bekleyen başvuru bulunmamaktadır.</p>
                ) : (
                    <div className="requests-grid">
                        {requests.map((user) => (
                            <div key={user._id} className="request-card">
                                <div className="request-header">
                                    <img
                                        src={user.profile.avatar || 'https://via.placeholder.com/150'}
                                        alt={user.username}
                                        className="request-avatar"
                                    />
                                    <div className="request-user-info">
                                        <h3>{user.profile.displayName}</h3>
                                        <span>@{user.username}</span>
                                    </div>
                                </div>

                                <div className="request-details">
                                    <div className="detail-item">
                                        <span className="label">Kategori:</span>
                                        <span className="value">{user.verificationRequest.category?.toUpperCase()}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="label">Talep Edilen Rozet:</span>
                                        <span className="badge-pill">
                                            {user.verificationRequest.badgeType?.toUpperCase()}
                                        </span>
                                    </div>
                                </div>

                                <div className="request-actions">
                                    <button
                                        className="reject-btn"
                                        onClick={() => handleReject(user._id)}
                                    >
                                        Reddet
                                    </button>
                                    <button
                                        className="approve-btn"
                                        onClick={() => handleApprove(user._id)}
                                    >
                                        Onayla
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
