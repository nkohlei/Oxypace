import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const AuthProcess = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { login } = useAuth();
    const [status, setStatus] = useState('İşleniyor...');

    useEffect(() => {
        const processAuth = async () => {
            const token = searchParams.get('token');
            // Get intent from CLIENT storage (Reliable)
            const intent = sessionStorage.getItem('auth_intent') || 'login';

            if (!token) {
                navigate('/login?error=NoToken');
                return;
            }

            try {
                // Validate with Backend
                const response = await axios.post('/api/auth/google/validate', {
                    token,
                    intent
                });

                const { action, user, token: authToken, preToken, message } = response.data;

                if (action === 'login') {
                    login(authToken, user);
                    navigate('/'); // Success!
                } else if (action === 'onboarding') {
                    // Redirect to onboarding with the pre-token
                    navigate(`/onboarding?preToken=${preToken}`);
                } else {
                    // Start over
                    navigate('/login');
                }

                // Clear intent
                sessionStorage.removeItem('auth_intent');

            } catch (error) {
                console.error('Auth Process Error:', error);
                const msg = error.response?.data?.message || 'AuthFailed';
                if (intent === 'register' && msg.includes('found')) {
                    navigate('/login?error=AccountExists');
                } else if (intent === 'login' && msg.includes('not found')) {
                    navigate('/login?error=AccountNotFound');
                } else {
                    navigate(`/login?error=${msg}`);
                }
            }
        };

        processAuth();
    }, [navigate, searchParams, login]);

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            width: '100%',
            background: '#09090b',
            color: 'white'
        }}>
            <div style={{ textAlign: 'center' }}>
                <div className="spinner" style={{ margin: '0 auto 20px' }}></div>
                <h2>Google Hesabınız doğrulanıyor...</h2>
                <p style={{ color: '#aaa' }}>{status}</p>
            </div>
        </div>
    );
};

export default AuthProcess;
