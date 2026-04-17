import { useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const GoogleCallback = () => {
    const [searchParams] = useSearchParams();
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation(); // Added useLocation hook

    useEffect(() => {
        const query = new URLSearchParams(location.search);
        const token = query.get('token');
        const isNewUser = query.get('isNewUser') === 'true';

        if (token) {
            login(token, null); // Pass null for user, AuthContext will fetch /me

            if (isNewUser) {
                navigate('/onboarding');
            } else {
                window.location.href = '/'; // Full reload for clean layout
            }
        } else {
            navigate('/login');
        }
    }, [location, login, navigate]);

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
