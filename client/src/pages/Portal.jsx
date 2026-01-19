import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import PostCard from '../components/PostCard';
import ChannelSidebar from '../components/ChannelSidebar';
import MembersSidebar from '../components/MembersSidebar';
import { useAuth } from '../context/AuthContext';
import { getImageUrl } from '../utils/imageUtils';
import { useUI } from '../context/UIContext';
import './Portal.css';

const Portal = () => {
    const { id } = useParams();
    const { user, updateUser } = useAuth();
    const navigate = useNavigate();
    const { isSidebarOpen } = useUI();

    const [portal, setPortal] = useState(null);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isMember, setIsMember] = useState(false);

    // Channel State
    const [currentChannel, setCurrentChannel] = useState('general');
    const [messageText, setMessageText] = useState('');

    // UI Toggles
    const [showMembers, setShowMembers] = useState(false); // Default to closed as requested

    // Plus Menu State
    const [showPlusMenu, setShowPlusMenu] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            alert(`Dosya seçildi: ${file.name}\n(Bu özellik yakında aktif olacak!)`);
            setShowPlusMenu(false);
        }
    };

    const handleSendMessage = async () => {
        if (!messageText.trim()) return;

        try {
            const res = await axios.post('/api/posts', {
                title: 'Message', // Backend expects title
                content: messageText,
                portalId: id,
                type: 'text'
            });

            // Optimistic update or refresh
            setPosts([res.data, ...posts]);
            setMessageText('');
        } catch (err) {
            console.error('Send message failed', err);
            alert('Mesaj gönderilemedi');
        }
    };

    // Edit State
    const [editing, setEditing] = useState(false);
    const [editLoading, setEditLoading] = useState(false);
    const [editFormData, setEditFormData] = useState({
        name: '',
        description: '',
        privacy: 'public'
    });
    const avatarInputRef = useRef(null);
    const bannerInputRef = useRef(null);

    useEffect(() => {
        fetchPortalData();
    }, [id]);

    useEffect(() => {
        if (portal && user) {
            const memberCheck = portal.members?.includes(user._id) ||
                user.joinedPortals?.some(p => p._id === portal._id || p === portal._id);
            setIsMember(!!memberCheck);
        }
    }, [portal, user]);

    const fetchPortalData = async () => {
        setLoading(true);
        try {
            const [portalRes, postsRes] = await Promise.all([
                axios.get(`/api/portals/${id}`),
                axios.get(`/api/portals/${id}/posts`)
            ]);

            setPortal(portalRes.data);
            setPosts(postsRes.data);
            setEditFormData({
                name: portalRes.data.name,
                description: portalRes.data.description || '',
                privacy: portalRes.data.privacy || 'public'
            });
        } catch (err) {
            setError('Portal yüklenemedi');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleJoin = async () => {
        try {
            await axios.post(`/api/portals/${id}/join`);
            setIsMember(true);
            const updatedUser = {
                ...user,
                joinedPortals: [...(user.joinedPortals || []), portal]
            };
            updateUser(updatedUser);
            // Refresh portal members count
            setPortal(prev => ({ ...prev, members: [...(prev.members || []), user._id] }));
        } catch (err) {
            console.error('Join failed', err);
        }
    };

    const handleLeave = async () => {
        if (!window.confirm('Bu portaldan ayrılmak istediğine emin misin?')) return;
        try {
            await axios.post(`/api/portals/${id}/leave`);
            setIsMember(false);
            const updatedUser = {
                ...user,
                joinedPortals: user.joinedPortals.filter(p => p._id !== id && p !== id)
            };
            updateUser(updatedUser);
            navigate('/');
        } catch (err) {
            console.error('Leave failed', err);
            alert(err.response?.data?.message || 'Ayrılma başarısız');
        }
    };

    import PortalSettingsModal from '../components/PortalSettingsModal';

    // ... (keep earlier imports)

    // Inside Portal component
    // ...
    const isOwner = user && portal && portal.owner && (
        portal.owner._id === user._id || portal.owner === user._id
    );

    const isAdmin = isOwner || (user && portal && portal.admins && portal.admins.some(a => (a._id || a) === user._id));

    // ... (Edit handlers can be removed/simplified as they move to modal, but keep key state like setPortal)

    return (
        <div className="app-wrapper full-height discord-layout">
            <ChannelSidebar
                portal={portal}
                isMember={isMember}
                onEdit={() => (isOwner || isAdmin) && setEditing(true)}
                currentChannel={currentChannel}
                onChangeChannel={setCurrentChannel}
                className={isSidebarOpen ? 'mobile-open' : ''}
            />

            {/* ... Main Content ... */}

            <main className="discord-main-content">
                {/* ... Header and Feed as before ... */}
                <header className="channel-top-bar">
                    <div className="channel-title-wrapper">
                        <span className="hashtag">#</span>
                        <h3 className="channel-name">{currentChannel === 'general' ? 'genel' : currentChannel}</h3>
                    </div>
                    {/* ... */}
                </header>
                {/* ... */}

                <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                    {/* ... Feed Logic ... */}
                    {/* Make sure we aren't showing feed if channel is not general or textual and empty */}
                    {/* ... */}
                </div>

                {/* ... */}

                {/* New Settings Modal Integration */}
                {editing && (
                    <PortalSettingsModal
                        portal={portal}
                        currentUser={user}
                        onClose={() => setEditing(false)}
                        onUpdate={(updatedPortal) => {
                            setPortal(updatedPortal);
                            // If channel name changed or deleted, careful with currentChannel
                        }}
                    />
                )}
            </main>
        </div>
    );
};

export default Portal;
