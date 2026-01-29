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

        console.log('📥 GoogleCallback Mounted');
        console.log('Search:', location.search);
        console.log('Token exists:', !!token);

        if (token) {
            console.log('✅ Token found on URL, attempting login...');
            login(token, null); // Pass null for user, AuthContext will fetch /me

            // Wait a bit before redirect to ensure state is set (though login triggers fetchUser)
            // But login is async if we wait for fetch? No, login is usually sync state update initiation.
            // Let's assume login() handles it.

            if (isNewUser) {
                navigate('/onboarding');
            } else {
                navigate('/');
            }
        } else {
            console.warn('⚠️ No token found, redirecting to login');
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
