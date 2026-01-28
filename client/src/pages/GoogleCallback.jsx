import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const GoogleCallback = () => {
    const [searchParams] = useSearchParams();
    const { login } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const token = searchParams.get('token');

        if (token) {
            // The token is provided, but we need to fetch user data
            fetch('/api/users/me', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
                .then(res => res.json())
                .then(userData => {
                    login(token, userData);
                    const isNewUser = searchParams.get('isNewUser') === 'true';
                    if (isNewUser) {
                        navigate('/onboarding');
                    } else {
                        navigate('/');
                    }
                })
                .catch(error => {
                    console.error('Failed to fetch user:', error);
                    navigate('/login');
                });
        } else {
            navigate('/login');
        }
    }, [searchParams, login, navigate]);

    return (
        <div className="auth-container">
            <div className="auth-card card glass fade-in text-center">
                <div className="spinner" style={{ margin: '0 auto 24px' }}></div>
                <h2>Completing Google Sign-In...</h2>
                <p className="text-secondary">Please wait</p>
            </div>
        </div>
    );
};

export default GoogleCallback;
