import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="flex items-center justify-center" style={{ minHeight: '100vh', background: '#000000' }}>
                <div className="spinner"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        if (location.pathname.startsWith('/portal/')) {
            const portalId = location.pathname.split('/')[2];
            if (portalId) {
                try { localStorage.setItem('oxypace_pending_portal', portalId); } catch (_) {}
            }
        }
        return <Navigate to="/" replace />;
    }

    return children;
};

export default PrivateRoute;
