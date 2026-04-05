import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import './Auth.css';

const VerifyEmail = () => {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState('verifying'); // verifying, success, error
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const verifyEmail = async () => {
            const token = searchParams.get('token');

            if (!token) {
                setStatus('error');
                setMessage('Invalid verification link');
                return;
            }

            try {
                const response = await axios.get(`/api/auth/verify-email?token=${token}`);
                setStatus('success');
                setMessage(response.data.message);

                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            } catch (error) {
                setStatus('error');
                setMessage(error.response?.data?.message || 'Verification failed');
            }
        };

        verifyEmail();
    }, [searchParams, navigate]);

    // Disable body scroll when component mounts
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
        };
    }, []);

    return (
        <div className="auth-container">
            <div className="auth-card card glass fade-in text-center">
                {status === 'verifying' && (
                    <>
                        <div className="spinner" style={{ margin: '0 auto 24px' }}></div>
                        <h2>Verifying your email...</h2>
                        <p className="text-secondary">Please wait while we verify your account</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div style={{ fontSize: '4rem', marginBottom: '16px' }}>✅</div>
                        <h2>Email Verified!</h2>
                        <p className="text-secondary">{message}</p>
                        <p className="text-tertiary mt-2">Redirecting to login...</p>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div style={{ fontSize: '4rem', marginBottom: '16px' }}>❌</div>
                        <h2>Verification Failed</h2>
                        <p className="text-secondary">{message}</p>
                        <button
                            onClick={() => navigate('/register')}
                            className="btn btn-primary mt-3"
                        >
                            Back to Register
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default VerifyEmail;
