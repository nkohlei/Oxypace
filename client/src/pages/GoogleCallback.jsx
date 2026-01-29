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
            // Pass token to login, let AuthContext handle the user fetching via its useEffect
            // passing null as second arg ensures 'user' state is null, triggering the fetch
            login(token, null);

            const isNewUser = searchParams.get('isNewUser') === 'true';
            if (isNewUser) {
                navigate('/onboarding');
            } else {
                navigate('/');
            }
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
