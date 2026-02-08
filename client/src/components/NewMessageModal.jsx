import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { getImageUrl } from '../utils/imageUtils';
import Badge from './Badge';

const NewMessageModal = ({ onClose, onSelectUser, currentUser }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [friends, setFriends] = useState([]); // Suggested users (following/followers)
    const modalRef = useRef(null);

    useEffect(() => {
        // Fetch suggestions (friends/following) on mount
        const fetchSuggestions = async () => {
            try {
                // Ideally this endpoint returns people the user follows or interacts with
                // For now, we might rely on the user object passed in if it has following
                // Or fetch a dedicated list. Let's assume we can fetch 'following' or similar.
                // Fallback: If no dedicated endpoint, we might just leave this empty until search
                // But generally, a "users/following" or similar is good.
                // Let's try to filter locally if user object has it, otherwise fetch.

                if (currentUser?.following?.length > 0) {
                    // If we have IDs, we might need to fetch full objects.
                    // Let's assume we search for them or they are hydrated.
                    // If they are just IDs, we skip for now to avoid complex fetching logic in modal
                    // and rely on search.
                }

                // If we want "global" search capability, we wait for input.
            } catch (err) {
                console.error('Failed to fetch suggestions', err);
            }
        };
        fetchSuggestions();
    }, [currentUser]);

    useEffect(() => {
        const searchUsers = async () => {
            if (!searchQuery.trim()) {
                setResults([]);
                return;
            }

            setLoading(true);
            try {
                // Search API
                const res = await axios.get(`/api/users/search?q=${searchQuery}`);
                setResults(res.data);
            } catch (err) {
                console.error('Search failed', err);
            } finally {
                setLoading(false);
            }
        };

        const timeoutId = setTimeout(searchUsers, 300);
        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    return (
        <div
            className="modal-overlay"
            style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(0,0,0,0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2000,
                backdropFilter: 'blur(5px)',
            }}
        >
            <div
                ref={modalRef}
                className="new-message-modal"
                style={{
                    width: '100%',
                    maxWidth: '500px',
                    backgroundColor: 'var(--bg-card)',
                    borderRadius: '16px',
                    boxShadow: 'var(--shadow-popover)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    maxHeight: '80vh',
                    overflow: 'hidden',
                    animation: 'zoomIn 0.2s ease',
                }}
            >
                {/* Header */}
                <div
                    style={{
                        padding: '16px',
                        borderBottom: '1px solid var(--border-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}
                >
                    <h2 style={{ margin: 0, fontSize: '18px', color: 'var(--text-primary)' }}>
                        Yeni Mesaj
                    </h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            padding: '4px',
                        }}
                    >
                        <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                {/* Search Input */}
                <div style={{ padding: '16px 16px 8px 16px' }}>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            backgroundColor: 'var(--bg-input)', // was dark
                            borderRadius: '8px',
                            padding: '0 12px',
                            border: '1px solid var(--border-subtle)',
                        }}
                    >
                        <span style={{ color: 'var(--text-tertiary)' }}>Kime:</span>
                        <input
                            autoFocus
                            type="text"
                            placeholder="Birini ara..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                flex: 1,
                                background: 'transparent',
                                border: 'none',
                                padding: '12px',
                                color: 'var(--text-primary)', // was white
                                outline: 'none',
                                fontSize: '15px',
                            }}
                        />
                    </div>
                </div>

                {/* Suggested Friends (Horizontal List) */}
                {!searchQuery && currentUser?.following?.length > 0 && (
                    <div style={{ padding: '0 16px 16px 16px' }}>
                        <div
                            style={{
                                fontSize: '13px',
                                fontWeight: '600',
                                color: 'var(--text-secondary)',
                                marginBottom: '10px',
                            }}
                        >
                            Önerilenler
                        </div>
                        <div
                            className="suggested-friends-scroll"
                            style={{
                                display: 'flex',
                                gap: '12px',
                                overflowX: 'auto',
                                paddingBottom: '4px',
                                scrollbarWidth: 'none' /* Firefox */,
                                msOverflowStyle: 'none' /* IE 10+ */,
                            }}
                        >
                            {
                                /* Hide scrollbar for Chrome/Safari/Opera */
                                <style>{`
                                .suggested-friends-scroll::-webkit-scrollbar { 
                                    display: none; 
                                }
                             `}</style>
                            }

                            {currentUser.following.map((friendId) => {
                                // Assuming 'following' is an array of IDs or objects.
                                // If IDs, we can't show much without fetching.
                                // Ideally, user.following would be populated.
                                // If not, we might fail to show avatar/name.
                                // Let's check if it's an object.
                                const friend =
                                    typeof friendId === 'object'
                                        ? friendId
                                        : { _id: friendId, username: 'User', profile: {} };
                                // Fallback if data is missing, real implementation needs hydration.

                                return (
                                    <div
                                        key={friend._id}
                                        onClick={() => onSelectUser(friend)}
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            cursor: 'pointer',
                                            minWidth: '64px',
                                        }}
                                    >
                                        <div style={{ position: 'relative', marginBottom: '4px' }}>
                                            {friend.profile?.avatar ? (
                                                <img
                                                    src={getImageUrl(friend.profile.avatar)}
                                                    alt={friend.username}
                                                    style={{
                                                        width: '48px',
                                                        height: '48px',
                                                        borderRadius: '50%',
                                                        objectFit: 'cover',
                                                        border: '2px solid var(--bg-card)',
                                                    }}
                                                />
                                            ) : (
                                                <div
                                                    style={{
                                                        width: '48px',
                                                        height: '48px',
                                                        borderRadius: '50%',
                                                        backgroundColor: 'var(--primary-cyan)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontWeight: 'bold',
                                                        color: '#000',
                                                        fontSize: '18px',
                                                        border: '2px solid var(--bg-card)',
                                                    }}
                                                >
                                                    {friend.username?.[0]?.toUpperCase() || '?'}
                                                </div>
                                            )}
                                        </div>
                                        <span
                                            style={{
                                                fontSize: '12px',
                                                color: 'var(--text-primary)',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                maxWidth: '64px',
                                                textAlign: 'center',
                                            }}
                                        >
                                            {friend.profile?.displayName?.split(' ')[0] ||
                                                friend.username}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Results List */}
                <div
                    style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '0 16px 16px 16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        borderTop: '1px solid var(--border-subtle)',
                    }}
                >
                    {loading ? (
                        <div
                            style={{
                                padding: '20px',
                                textAlign: 'center',
                                color: 'var(--text-secondary)',
                            }}
                        >
                            Aranıyor...
                        </div>
                    ) : results.length > 0 ? (
                        results.map((user) => (
                            <div
                                key={user._id}
                                onClick={() => onSelectUser(user)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '10px',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    transition: 'background 0.2s',
                                    backgroundColor: 'transparent',
                                }}
                                onMouseEnter={(e) =>
                                    (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')
                                }
                                onMouseLeave={(e) =>
                                    (e.currentTarget.style.backgroundColor = 'transparent')
                                }
                            >
                                <div style={{ position: 'relative' }}>
                                    {user.profile?.avatar ? (
                                        <img
                                            src={getImageUrl(user.profile.avatar)}
                                            alt={user.username}
                                            style={{
                                                width: '40px',
                                                height: '40px',
                                                borderRadius: '50%',
                                                objectFit: 'cover',
                                            }}
                                        />
                                    ) : (
                                        <div
                                            style={{
                                                width: '40px',
                                                height: '40px',
                                                borderRadius: '50%',
                                                backgroundColor: 'var(--primary-cyan)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontWeight: 'bold',
                                                color: '#000',
                                            }}
                                        >
                                            {user.username[0].toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontWeight: '600',
                                                color: 'var(--text-primary)',
                                            }}
                                        >
                                            {user.profile?.displayName || user.username}
                                        </span>
                                        <Badge type={user.verificationBadge} />
                                    </div>
                                    <span
                                        style={{ fontSize: '13px', color: 'var(--text-secondary)' }}
                                    >
                                        @{user.username}
                                    </span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div
                            style={{
                                padding: '20px',
                                textAlign: 'center',
                                color: 'var(--text-tertiary)',
                            }}
                        >
                            {searchQuery
                                ? 'Kullanıcı bulunamadı.'
                                : 'Sohbet başlatmak için birini ara.'}
                        </div>
                    )}
                </div>
            </div>
            <style>{`
                @keyframes zoomIn {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default NewMessageModal;
