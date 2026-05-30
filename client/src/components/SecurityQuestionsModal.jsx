import { useState } from 'react';
import axios from 'axios';

const SECURITY_QUESTIONS_POOL = [
    'İlk evcil hayvanınızın adı nedir?',
    'En sevdiğiniz film hangisidir?',
    'Annenizin kızlık soyadı nedir?',
    'İlk okulunuzun adı nedir?',
    'Hangi şehirde doğdunuz?',
    'En sevdiğiniz öğretmenin adı nedir?'
];

const SecurityQuestionsModal = ({ user, onCompleted }) => {
    const [q1, setQ1] = useState(SECURITY_QUESTIONS_POOL[0]);
    const [q2, setQ2] = useState(SECURITY_QUESTIONS_POOL[1]);
    const [a1, setA1] = useState('');
    const [a2, setA2] = useState('');
    const [showA1, setShowA1] = useState(false);
    const [showA2, setShowA2] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (q1 === q2) {
            setError('Lütfen iki farklı güvenlik sorusu seçin.');
            return;
        }

        if (!a1.trim() || !a2.trim()) {
            setError('Lütfen tüm cevapları doldurun.');
            return;
        }

        setLoading(true);

        try {
            const response = await axios.put('/api/users/security-questions', {
                securityAnswers: [
                    { question: q1, answer: a1.trim() },
                    { question: q2, answer: a2.trim() }
                ]
            });
            onCompleted(response.data.securityAnswers);
        } catch (err) {
            console.error('Failed to set security questions:', err);
            setError(err.response?.data?.message || 'Güvenlik soruları kaydedilemedi.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(5, 5, 5, 0.85)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            zIndex: 999999,
            padding: '20px',
            fontFamily: "'Inter', sans-serif"
        }}>
            <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '24px',
                padding: '36px',
                maxWidth: '480px',
                width: '100%',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
                textAlign: 'center',
                color: '#fff',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Decorative subtle background glows */}
                <div style={{
                    position: 'absolute',
                    top: '-20%',
                    left: '-20%',
                    width: '60%',
                    height: '60%',
                    background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
                    pointerEvents: 'none'
                }} />
                <div style={{
                    position: 'absolute',
                    bottom: '-20%',
                    right: '-20%',
                    width: '60%',
                    height: '60%',
                    background: 'radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, transparent 70%)',
                    pointerEvents: 'none'
                }} />

                {/* Shield Icon */}
                <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '20px',
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(168, 85, 247, 0.2) 100%)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 24px auto'
                }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                </div>

                <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '10px', background: 'linear-gradient(135deg, #fff 0%, #a5b4fc 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Hesap Güvenliği Duvarı
                </h2>
                <p style={{ fontSize: '13.5px', color: '#b5bac1', lineHeight: '1.6', marginBottom: '28px' }}>
                    Bankacılık standartlarında güvenlik protokolü gereği, hesabınızı kurtarma aşamasında doğrulamak üzere lütfen 2 adet güvenlik sorusu ve cevabı belirleyin.
                </p>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left' }}>
                    {/* Question 1 */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '12px', color: '#949ba4', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>GÜVENLİK SORUSU 1</label>
                        <select
                            value={q1}
                            onChange={(e) => setQ1(e.target.value)}
                            style={{
                                background: 'rgba(0, 0, 0, 0.25)',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                borderRadius: '10px',
                                padding: '12px',
                                color: '#fff',
                                outline: 'none',
                                cursor: 'pointer',
                                fontSize: '13.5px'
                            }}
                        >
                            {SECURITY_QUESTIONS_POOL.map((q) => (
                                <option key={q} value={q} style={{ background: '#111', color: '#fff' }}>{q}</option>
                            ))}
                        </select>
                        <div style={{ position: 'relative', marginTop: '4px' }}>
                            <input
                                type={showA1 ? 'text' : 'password'}
                                placeholder="Cevabınızı yazın"
                                required
                                value={a1}
                                onChange={(e) => setA1(e.target.value)}
                                style={{
                                    width: '100%',
                                    background: 'rgba(0, 0, 0, 0.25)',
                                    border: '1px solid rgba(255, 255, 255, 0.08)',
                                    borderRadius: '10px',
                                    padding: '12px 40px 12px 12px',
                                    color: '#fff',
                                    outline: 'none',
                                    fontSize: '13.5px'
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowA1(!showA1)}
                                style={{
                                    position: 'absolute',
                                    right: '12px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    color: '#949ba4',
                                    cursor: 'pointer',
                                    padding: 0
                                }}
                            >
                                {showA1 ? (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                        <line x1="1" y1="1" x2="23" y2="23" />
                                    </svg>
                                ) : (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                        <circle cx="12" cy="12" r="3" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Question 2 */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '12px', color: '#949ba4', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>GÜVENLİK SORUSU 2</label>
                        <select
                            value={q2}
                            onChange={(e) => setQ2(e.target.value)}
                            style={{
                                background: 'rgba(0, 0, 0, 0.25)',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                borderRadius: '10px',
                                padding: '12px',
                                color: '#fff',
                                outline: 'none',
                                cursor: 'pointer',
                                fontSize: '13.5px'
                            }}
                        >
                            {SECURITY_QUESTIONS_POOL.map((q) => (
                                <option key={q} value={q} style={{ background: '#111', color: '#fff' }}>{q}</option>
                            ))}
                        </select>
                        <div style={{ position: 'relative', marginTop: '4px' }}>
                            <input
                                type={showA2 ? 'text' : 'password'}
                                placeholder="Cevabınızı yazın"
                                required
                                value={a2}
                                onChange={(e) => setA2(e.target.value)}
                                style={{
                                    width: '100%',
                                    background: 'rgba(0, 0, 0, 0.25)',
                                    border: '1px solid rgba(255, 255, 255, 0.08)',
                                    borderRadius: '10px',
                                    padding: '12px 40px 12px 12px',
                                    color: '#fff',
                                    outline: 'none',
                                    fontSize: '13.5px'
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowA2(!showA2)}
                                style={{
                                    position: 'absolute',
                                    right: '12px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    color: '#949ba4',
                                    cursor: 'pointer',
                                    padding: 0
                                }}
                            >
                                {showA2 ? (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                        <line x1="1" y1="1" x2="23" y2="23" />
                                    </svg>
                                ) : (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                        <circle cx="12" cy="12" r="3" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div style={{
                            color: '#ef4444',
                            fontSize: '13px',
                            fontWeight: '600',
                            textAlign: 'center',
                            background: 'rgba(239, 68, 68, 0.1)',
                            padding: '10px',
                            borderRadius: '8px',
                            border: '1px solid rgba(239, 68, 68, 0.2)'
                        }}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            marginTop: '10px',
                            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                            border: 'none',
                            borderRadius: '12px',
                            padding: '14px',
                            color: '#fff',
                            fontWeight: '700',
                            fontSize: '14px',
                            cursor: 'pointer',
                            transition: 'opacity 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
                        onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
                    >
                        {loading ? 'Sorular Kaydediliyor...' : 'Güvenlik Sorularını Kaydet'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default SecurityQuestionsModal;
