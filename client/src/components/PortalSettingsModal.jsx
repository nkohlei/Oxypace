import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { getImageUrl } from '../utils/imageUtils';
import { uploadFile } from '../utils/uploadUtils';
import ImageCropper from './ImageCropper';
import PortalBadges from './PortalBadges';
import LocationMapPicker from './LocationMapPicker';

import { Settings, Lock, List, Users, Ban, MapPin, AlertTriangle, X, Globe, Search, Check, Pencil, Trash2, ArrowUp, ArrowDown, UserMinus, ChevronRight, Radio, Bot, Play, Pause, RefreshCw, Plus, Zap, AlertCircle, ExternalLink, Power, Clock, CheckCircle, FileText, Copy, Link2, ShieldAlert, EyeOff, Hash, Volume2, Video, Image as ImageIcon, GripVertical } from 'lucide-react';
import './PortalSettingsModal.css';

const PortalSettingsModal = ({
    portal,
    onClose,
    onUpdate,
    currentUser,
    initialTab = 'overview',
}) => {
    const [activeTab, setActiveTab] = useState(initialTab); // overview, channels, members, banned, access
    const [loading, setLoading] = useState(false);

    // Overview State
    const [formData, setFormData] = useState({
        name: portal.name,
        description: portal.description || '',
        privacy: portal.privacy || 'public',
    });
    const bannerRef = useRef(null);
    const avatarRef = useRef(null);

    // Cropping State
    const [cropperImage, setCropperImage] = useState(null);
    const [cropperMode, setCropperMode] = useState(null); // 'avatar' or 'cover'
    const [selectedFile, setSelectedFile] = useState(null);

    // Channel State
    const [newChannelName, setNewChannelName] = useState('');
    const [newChannelType, setNewChannelType] = useState('text');

    // Member State
    const [memberSearch, setMemberSearch] = useState('');

    // Access Control
    const ownerId = portal.owner?._id || portal.owner;
    const currentUserId = currentUser?._id;
    // Strict Owner check
    const isOwner = ownerId && currentUserId && String(ownerId) === String(currentUserId);
    // Admin check
    const isAdmin =
        isOwner ||
        (portal.admins &&
            currentUserId &&
            portal.admins.some((a) => String(a._id || a) === String(currentUserId)));

    // Blocked Users State
    const [blockedUsers, setBlockedUsers] = useState([]);

    // Channel Editing & Drag Reorder State
    const [editingChannel, setEditingChannel] = useState(null);
    const [draggedChannelIdx, setDraggedChannelIdx] = useState(null);
    const [dragOverChannelIdx, setDragOverChannelIdx] = useState(null);
    const touchDragIdxRef = useRef(null);

    // --- Location State ---
    const [locationData, setLocationData] = useState({
        lat: portal.location?.lat ?? null,
        lng: portal.location?.lng ?? null,
        label: portal.location?.label || '',
    });
    const [showOnMap, setShowOnMap] = useState(portal.showOnMap || false);
    const [locationSearch, setLocationSearch] = useState('');
    const [locationResults, setLocationResults] = useState([]);
    const [locationSearching, setLocationSearching] = useState(false);
    const [locationSaveStatus, setLocationSaveStatus] = useState(null); // 'success' | 'error' | null
    const [manualMode, setManualMode] = useState(false);

    // --- Advanced / Admin State ---
    const [portalStatus, setPortalStatus] = useState(portal.status || 'active');
    const [newOwnerId, setNewOwnerId] = useState('');
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [actionProcessing, setActionProcessing] = useState(false);

    // --- Presets for Portal Bots ---
    const BOT_PRESETS = [
        {
            title: 'Teknoloji',
            defaultName: 'Teknoloji Botu',
            bio: 'TechCrunch ve küresel teknoloji kaynaklarından son dakika haberleri.',
            feed: 'https://techcrunch.com/feed/',
            prefix: '',
            channelHint: 'teknoloji'
        },
        {
            title: 'Oyun Dünyası',
            defaultName: 'Oyun Haber Botu',
            bio: 'IGN ve oyun dünyasından son gelişmeler ve incelemeler.',
            feed: 'https://feeds.feedburner.com/ign/news',
            prefix: '',
            channelHint: 'oyun'
        },
        {
            title: 'Sinema & Dizi',
            defaultName: 'Sinema Botu',
            bio: 'Vizyondaki filmler, diziler ve fragmanlar.',
            feed: 'https://collider.com/feed/',
            prefix: '',
            channelHint: 'sinema'
        },
        {
            title: 'Bilim & Uzay',
            defaultName: 'Bilim Botu',
            bio: 'Uzay keşifleri, NASA haberleri ve bilimsel buluşlar.',
            feed: 'https://www.space.com/feeds/all',
            prefix: '',
            channelHint: 'bilim'
        },
        {
            title: 'Dünya Sporu',
            defaultName: 'Spor Haber Botu',
            bio: 'Dünya sporundan ve futbol liglerinden son dakika gelişmeleri.',
            feed: 'https://www.skysports.com/rss/12040',
            prefix: '',
            channelHint: 'spor'
        }
    ];

    // --- Portal Bots State ---
    const [portalBots, setPortalBots] = useState([]);
    const [loadingBots, setLoadingBots] = useState(false);
    const [showNewBotModal, setShowNewBotModal] = useState(false);
    const [editingBot, setEditingBot] = useState(null);
    const [runningBotId, setRunningBotId] = useState(null);
    const [testRunResult, setTestRunResult] = useState(null);
    const [discoveringFeed, setDiscoveringFeed] = useState(false);

    const handleDiscoverFeed = async (inputUrl, isEdit = false) => {
        if (!inputUrl || !inputUrl.trim()) {
            return alert('Lütfen önce bir web sitesi veya feed bağlantısı girin (Örn: shiftdelete.net).');
        }
        setDiscoveringFeed(true);
        try {
            const { data } = await axios.post(`/api/portals/${portal._id}/bots/discover-feed`, {
                url: inputUrl.trim()
            });
            if (data.success && data.feedUrl) {
                if (isEdit && editingBot) {
                    setEditingBot({
                        ...editingBot,
                        config: { ...editingBot.config, feeds: [data.feedUrl] }
                    });
                } else {
                    setNewBotData(prev => ({
                        ...prev,
                        feedUrl: data.feedUrl,
                        name: prev.name || data.title || ''
                    }));
                }
                alert(` RSS akışı otomatik olarak bulundu ve eklendi!\n\nBesleme: ${data.feedUrl}\nBaşlık: ${data.title || 'Site Beslemesi'}`);
            }
        } catch (err) {
            alert(err.response?.data?.message || err.message || 'RSS beslemesi otomatik olarak bulunamadı.');
        } finally {
            setDiscoveringFeed(false);
        }
    };
    const [newBotData, setNewBotData] = useState({
        name: '',
        bio: '',
        avatar: '',
        channel: portal.channels?.[0]?._id || 'general',
        feedUrl: '',
        intervalMinutes: 15,
        autoTranslate: true,
        postPrefix: '',
        includeSourceLink: true,
    });

    const fetchPortalBots = async () => {
        setLoadingBots(true);
        try {
            const { data } = await axios.get(`/api/portals/${portal._id}/bots`);
            setPortalBots(data);
        } catch (err) {
            console.error('Fetch portal bots error:', err);
        } finally {
            setLoadingBots(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'bots' && isAdmin) {
            fetchPortalBots();
        }
    }, [activeTab, portal._id, isAdmin]);

    const handleApplyPreset = (preset) => {
        const matchingChannel = portal.channels?.find(c => c.name.toLowerCase().includes(preset.channelHint));
        setNewBotData(prev => ({
            ...prev,
            name: preset.defaultName,
            bio: preset.bio,
            feedUrl: preset.feed,
            postPrefix: preset.prefix,
            channel: matchingChannel ? matchingChannel._id : (prev.channel || portal.channels?.[0]?._id || 'general')
        }));
    };

    const handleCreatePortalBot = async (e) => {
        e.preventDefault();
        if (!newBotData.name.trim()) return alert('Bot adı gereklidir.');
        if (!newBotData.feedUrl.trim()) return alert('En az bir web sitesi veya RSS bağlantısı girin.');
        setLoading(true);
        try {
            const payload = {
                ...newBotData,
                feeds: [newBotData.feedUrl.trim()]
            };
            await axios.post(`/api/portals/${portal._id}/bots`, payload);
            setShowNewBotModal(false);
            setNewBotData({
                name: '',
                bio: '',
                avatar: '',
                channel: portal.channels?.[0]?._id || 'general',
                feedUrl: '',
                intervalMinutes: 15,
                autoTranslate: true,
                postPrefix: '',
                includeSourceLink: true,
            });
            fetchPortalBots();
            alert('Bot başarıyla oluşturuldu ve portala bağlandı!');
        } catch (err) {
            alert('Bot oluşturulamadı: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePortalBot = async (e) => {
        e.preventDefault();
        if (!editingBot) return;
        setLoading(true);
        try {
            await axios.put(`/api/portals/${portal._id}/bots/${editingBot._id}`, {
                name: editingBot.profile?.displayName || editingBot.username,
                bio: editingBot.profile?.bio || '',
                avatar: editingBot.profile?.avatar || '',
                channel: editingBot.config?.defaultChannel || 'general',
                feeds: editingBot.config?.feeds || [],
                intervalMinutes: editingBot.config?.intervalMinutes || 15,
                isActive: editingBot.config?.isActive !== false,
                autoTranslate: editingBot.config?.autoTranslate !== false,
                postPrefix: editingBot.config?.postPrefix || '',
                includeSourceLink: editingBot.config?.includeSourceLink !== false
            });
            setEditingBot(null);
            fetchPortalBots();
            alert('Bot ayarları kaydedildi!');
        } catch (err) {
            alert('Bot güncellenemedi: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleDeletePortalBot = async (botId) => {
        if (!window.confirm('Bu botu portaldan silmek istediğinize emin misiniz?')) return;
        try {
            await axios.delete(`/api/portals/${portal._id}/bots/${botId}`);
            setPortalBots(prev => prev.filter(b => b._id !== botId));
            alert('Bot silindi.');
        } catch (err) {
            alert('Bot silinemedi: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleTogglePortalBot = async (bot) => {
        try {
            const updatedActive = !(bot.config?.isActive !== false);
            await axios.put(`/api/portals/${portal._id}/bots/${bot._id}`, {
                isActive: updatedActive
            });
            fetchPortalBots();
        } catch (err) {
            alert('Durum güncellenemedi: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleRunPortalBot = async (botId) => {
        setRunningBotId(botId);
        setTestRunResult(null);
        try {
            const { data } = await axios.post(`/api/portals/${portal._id}/bots/${botId}/run`);
            setTestRunResult({ botId, ...data });
            fetchPortalBots();
        } catch (err) {
            setTestRunResult({
                botId,
                success: false,
                message: err.response?.data?.message || err.message || 'Bot çalıştırılırken hata oluştu.'
            });
        } finally {
            setRunningBotId(null);
        }
    };

    // --- Live Room Settings State ---
    const [liveRoomSettings, setLiveRoomSettings] = useState({
        watchPartyConsensusRule: portal.liveRoomSettings?.watchPartyConsensusRule || 'all'
    });
    const [liveRoomSaveStatus, setLiveRoomSaveStatus] = useState(null); // 'success' | 'error' | null

    // Sync location data when portal prop changes
    useEffect(() => {
        setLocationData({
            lat: portal.location?.lat ?? null,
            lng: portal.location?.lng ?? null,
            label: portal.location?.label || '',
        });
        setShowOnMap(portal.showOnMap || false);
    }, [portal._id]);

    useEffect(() => {
        setLiveRoomSettings({
            watchPartyConsensusRule: portal.liveRoomSettings?.watchPartyConsensusRule || 'all'
        });
    }, [portal.liveRoomSettings]);

    const handleLocationSearch = async (query) => {
        setLocationSearch(query);
        if (!query.trim() || query.length < 2) {
            setLocationResults([]);
            return;
        }
        try {
            setLocationSearching(true);
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
                { headers: { 'Accept-Language': 'tr,en' } }
            );
            const data = await res.json();
            setLocationResults(data);
        } catch (err) {
            console.error('Location search failed', err);
        } finally {
            setLocationSearching(false);
        }
    };

    const handleSelectLocation = (result) => {
        setLocationData({
            lat: parseFloat(result.lat),
            lng: parseFloat(result.lon),
            label: result.display_name.split(',').slice(0, 2).join(', '),
        });
        setLocationSearch('');
        setLocationResults([]);
    };

    const handleSaveLocation = async () => {
        if (!isOwner) return;
        setLoading(true);
        setLocationSaveStatus(null);
        try {
            const payload = {
                location: locationData.lat !== null ? locationData : { lat: null, lng: null, label: '' },
                showOnMap,
            };
            const res = await axios.put(`/api/portals/${portal._id}`, payload);
            onUpdate(res.data);
            setLocationSaveStatus('success');
            setTimeout(() => setLocationSaveStatus(null), 3000);
        } catch (err) {
            setLocationSaveStatus('error');
            setTimeout(() => setLocationSaveStatus(null), 3000);
        } finally {
            setLoading(false);
        }
    };

    const handleClearLocation = async () => {
        if (!isOwner) return;
        if (!window.confirm('Konum bilgisi silinecek. Emin misiniz?')) return;
        setLocationData({ lat: null, lng: null, label: '' });
        setShowOnMap(false);
        try {
            const res = await axios.put(`/api/portals/${portal._id}`, {
                location: { lat: null, lng: null, label: '' },
                showOnMap: false,
            });
            onUpdate(res.data);
        } catch (err) {
            console.error('Clear location failed', err);
        }
    };

    // --- Advanced Actions ---
    const handleToggleStatus = async () => {
        if (!isOwner) return;
        const newStatus = portalStatus === 'active' ? 'closed' : 'active';

        if (newStatus === 'closed') {
            if (!window.confirm('Bu portalı arşive almak istediğinize emin misiniz? Portal aramalarda görünmeyecek ama üyeler erişebilecektir.')) return;
        }

        setActionProcessing(true);
        try {
            const res = await axios.put(`/api/portals/${portal._id}/status`, { status: newStatus });
            setPortalStatus(res.data.status);
            onUpdate(res.data);
            alert(`Portal durumu güncellendi: ${newStatus === 'active' ? 'Aktif' : 'Arşivlenmiş'}`);
        } catch (err) {
            alert('Durum güncellenemedi: ' + (err.response?.data?.message || err.message));
        } finally {
            setActionProcessing(false);
        }
    };

    const handleTransferOwnership = async () => {
        if (!isOwner || !newOwnerId) return;
        if (!window.confirm('Kurucu yetkisini devretmek üzeresiniz. Bu işlem çok tehlikelidir ve geri alınamaz. Devam etmek istiyor musunuz?')) return;

        setActionProcessing(true);
        try {
            const res = await axios.put(`/api/portals/${portal._id}/transfer`, { newOwnerId });
            onUpdate(res.data);
            alert('Sahiplik başarıyla devredildi.');
            onClose(); // Close modal immediately as they are no longer owner
            window.location.reload(); // Hard refresh to wipe owner state
        } catch (err) {
            alert('Sahiplik devredilemedi: ' + (err.response?.data?.message || err.message));
        } finally {
            setActionProcessing(false);
        }
    };

    const handleDeletePortal = async () => {
        if (!isOwner) return;
        if (deleteConfirmText !== portal.name) {
            alert('Lütfen portal adını tam olarak yazın.');
            return;
        }
        if (!window.confirm('Bu portal KESİNLİKLE silinecek, içindeki tüm mesajlar yok olacak. SON KEZ ONAYLIYOR MUSUNUZ?')) return;

        setActionProcessing(true);
        try {
            await axios.delete(`/api/portals/${portal._id}`);
            alert('Portal başarıyla silindi.');
            window.location.href = '/inbox'; // Navigate completely away
        } catch (err) {
            alert('Portal silinemedi: ' + (err.response?.data?.message || err.message));
        } finally {
            setActionProcessing(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'banned' && (isAdmin || isOwner)) {
            fetchBlockedUsers();
        }
    }, [activeTab, portal._id]);

    const fetchBlockedUsers = async () => {
        try {
            const res = await axios.get(`/api/portals/${portal._id}/blocked`);
            setBlockedUsers(res.data);
            setBlockedUsers(res.data);
        } catch (err) {
            console.error('Failed to fetch blocked users', err);
        }
    };

    // --- Block Search State & Handlers ---
    const [blockSearchQuery, setBlockSearchQuery] = useState('');
    const [blockSearchResults, setBlockSearchResults] = useState([]);
    const [isSearchingBlock, setIsSearchingBlock] = useState(false);

    // --- Access Management State ---
    const [accessData, setAccessData] = useState({
        privacy: portal.privacy,
        allowedUsers: portal.allowedUsers || [],
        isReadOnly: Boolean(portal.isReadOnly),
        isNSFW: Boolean(portal.isNSFW),
    });
    const [allowedUserSearch, setAllowedUserSearch] = useState('');
    const [allowedUserResults, setAllowedUserResults] = useState([]);
    const [portalLinkCopied, setPortalLinkCopied] = useState(false);

    // --- Audit Log State ---
    const [auditLogs, setAuditLogs] = useState([]);
    const [auditLoading, setAuditLoading] = useState(false);

    const fetchAuditLogs = async () => {
        if (!isAdmin) return;
        setAuditLoading(true);
        try {
            const res = await axios.get(`/api/portals/${portal._id}/audit-logs?limit=40`);
            setAuditLogs(Array.isArray(res.data?.logs) ? res.data.logs : []);
        } catch (err) {
            console.error('Fetch portal audit logs error:', err);
            setAuditLogs([]);
        } finally {
            setAuditLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'audit' && isAdmin) {
            fetchAuditLogs();
        }
    }, [activeTab, portal._id, isAdmin]);

    // Sync with portal updates
    useEffect(() => {
        setAccessData({
            privacy: portal.privacy,
            allowedUsers: portal.allowedUsers || [],
            isReadOnly: Boolean(portal.isReadOnly),
            isNSFW: Boolean(portal.isNSFW),
        });
    }, [portal]);

    const handleAllowedSearch = async (query) => {
        setAllowedUserSearch(query);
        if (!query.trim()) {
            setAllowedUserResults([]);
            return;
        }
        try {
            const res = await axios.get(`/api/users/search?q=${query}`);
            // Filter out already allowed, members, blocked, and self
            const filtered = res.data.filter(u =>
                !accessData.allowedUsers.some(au => (au._id || au) === u._id) &&
                !portal.members.some(m => (m._id || m) === u._id) &&
                !blockedUsers.some(b => (b._id || b) === u._id) &&
                u._id !== portal.owner?._id
            );
            setAllowedUserResults(filtered);
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddAllowedUser = (user) => {
        setAccessData(prev => ({
            ...prev,
            allowedUsers: [...prev.allowedUsers, user]
        }));
        setAllowedUserSearch('');
        setAllowedUserResults([]);
    };

    const handleRemoveAllowedUser = (userId) => {
        setAccessData(prev => ({
            ...prev,
            allowedUsers: prev.allowedUsers.filter(u => (u._id || u) !== userId)
        }));
    };

    const handleSaveAccess = async () => {
        if (!isOwner) return;
        setLoading(true);
        try {
            // Send only IDs for allowedUsers
            const payload = {
                privacy: accessData.privacy,
                allowedUsers: accessData.allowedUsers.map(u => u._id || u),
                isReadOnly: Boolean(accessData.isReadOnly),
                isNSFW: Boolean(accessData.isNSFW),
            };
            const res = await axios.put(`/api/portals/${portal._id}`, payload);
            onUpdate(res.data);
            alert('Erişim ayarları kaydedildi');
        } catch (err) {
            alert('Hata: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleBlockSearch = async (query) => {
        setBlockSearchQuery(query);
        if (!query.trim()) {
            setBlockSearchResults([]);
            return;
        }

        try {
            setIsSearchingBlock(true);
            const res = await axios.get(`/api/users/search?q=${query}`);
            // Filter out already blocked users and the portal owner
            const filtered = res.data.filter(
                (u) =>
                    !blockedUsers.some((b) => b._id === u._id) &&
                    u._id !== portal.owner &&
                    u._id !== portal.owner?._id
            );
            setBlockSearchResults(filtered);
        } catch (err) {
            console.error('Block search error', err);
        } finally {
            setIsSearchingBlock(false);
        }
    };


    // --- Overview Handlers ---
    const handleSaveOverview = async () => {
        if (!isOwner) return; // double check
        setLoading(true);
        try {
            const res = await axios.put(`/api/portals/${portal._id}`, formData);
            onUpdate(res.data);
            alert('Ayarlar kaydedildi');
        } catch (err) {
            alert('Kaydetme hatası: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleSaveLiveRoomSettings = async () => {
        if (!isAdmin) return;
        setLoading(true);
        setLiveRoomSaveStatus(null);
        try {
            const res = await axios.put(`/api/portals/${portal._id}`, {
                liveRoomSettings
            });
            onUpdate(res.data);
            setLiveRoomSaveStatus('success');
            setTimeout(() => setLiveRoomSaveStatus(null), 3000);
        } catch (err) {
            setLiveRoomSaveStatus('error');
            alert('Canlı oda ayarları kaydedilemedi: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    const uploadImage = async (fileOrBlob, mode) => {
        try {
            setLoading(true);
            // Direct upload to R2
            const mediaKey = await uploadFile(fileOrBlob, mode, portal._id);

            const res = await axios.post(`/api/portals/${portal._id}/${mode}`, { mediaKey });
            onUpdate(res.data);
        } catch (err) {
            const errMsg = err.response?.data?.message || err.message || 'Bilinmeyen hata';
            alert(`${mode} yüklenemedi: ${errMsg}`);
        } finally {
            setLoading(false);
        }
    };


    const handleFileSelect = (e, target) => {
        if (!isOwner) return;
        const file = e.target.files[0];
        if (!file) return;

        setSelectedFile(file);
        const reader = new FileReader();
        reader.onload = () => {
            setCropperImage(reader.result);
            setCropperMode(target === 'avatar' ? 'avatar' : 'banner');
        };
        reader.readAsDataURL(file);
        e.target.value = ''; // Reset input
    };

    const handleCropComplete = async (result) => {
        const mode = cropperMode; // 'avatar' or 'banner'
        setCropperImage(null);
        setCropperMode(null);
        setSelectedFile(null);

        if (!result) return;

        if (typeof result === 'string') {
            const endpoint = mode === 'avatar' 
                ? `/api/portals/${portal._id}/avatar` 
                : `/api/portals/${portal._id}/banner`;
            try {
                setLoading(true);
                const response = await axios.post(endpoint, { mediaKey: result });
                onUpdate(response.data);
            } catch (err) {
                console.error('Error saving processed GIF:', err);
                alert('GIF kaydedilemedi');
            } finally {
                setLoading(false);
            }
        } else {
            await uploadImage(result, mode);
        }
    };

    const handleCropCancel = () => {
        setCropperImage(null);
        setCropperMode(null);
        setSelectedFile(null);
    };

    // --- Channel Handlers ---
    const handleAddChannel = async () => {
        if (!newChannelName.trim()) return;
        if (!isAdmin) return;
        if (!newChannelName || !newChannelName.trim()) return;
        if (newChannelName.trim().length > 20) {
            alert('Kanal adı en fazla 20 karakter olabilir');
            return;
        }
        try {
            const payload = { name: newChannelName.trim(), type: newChannelType };
            // Conference channels default to stage mode
            if (newChannelType === 'conference') {
                payload.roomMode = 'stage';
            } else if (newChannelType === 'voice') {
                payload.roomMode = 'free';
            }
            const res = await axios.post(`/api/portals/${portal._id}/channels`, payload);
            onUpdate({ ...portal, channels: res.data });
            setNewChannelName('');
            setNewChannelType('text');
        } catch (err) {
            alert('Kanal eklenemedi');
        }
    };

    const handleDeleteChannel = async (channelId) => {
        if (!isAdmin) return;
        if (!window.confirm('Bu kanalı silmek istediğinize emin misiniz?')) return;
        try {
            const res = await axios.delete(`/api/portals/${portal._id}/channels/${channelId}`);
            onUpdate({ ...portal, channels: res.data });
        } catch (err) {
            alert('Kanal silinemedi');
        }
    };

    const handleReorderChannels = async (newOrderedChannels) => {
        try {
            const orderedIds = newOrderedChannels.map(ch => ch._id);
            const res = await axios.put(`/api/portals/${portal._id}/channels/reorder`, { orderedIds });
            onUpdate({ ...portal, channels: res.data });
        } catch (err) {
            alert('Sıralama güncellenemedi');
        }
    };

    const reorderChannelsByIndex = (fromIndex, toIndex) => {
        if (fromIndex === null || toIndex === null || fromIndex === toIndex) return;
        const sortedChannels = [...(portal.channels || [])].sort((a, b) => (a.order || 0) - (b.order || 0));
        if (fromIndex < 0 || fromIndex >= sortedChannels.length || toIndex < 0 || toIndex >= sortedChannels.length) return;
        const [moved] = sortedChannels.splice(fromIndex, 1);
        sortedChannels.splice(toIndex, 0, moved);
        handleReorderChannels(sortedChannels);
    };

    const handleChannelTouchStart = (index) => {
        if (!isAdmin || editingChannel) return;
        touchDragIdxRef.current = index;
        setDraggedChannelIdx(index);
        setDragOverChannelIdx(index);
    };

    const handleChannelTouchMove = (e) => {
        if (touchDragIdxRef.current === null) return;
        const touch = e.touches?.[0];
        if (!touch) return;
        const el = document.elementFromPoint(touch.clientX, touch.clientY);
        const row = el?.closest?.('[data-channel-index]');
        if (row) {
            const overIdx = Number(row.getAttribute('data-channel-index'));
            if (!Number.isNaN(overIdx)) {
                setDragOverChannelIdx(overIdx);
            }
        }
    };

    const handleChannelTouchEnd = () => {
        if (touchDragIdxRef.current !== null && dragOverChannelIdx !== null) {
            reorderChannelsByIndex(touchDragIdxRef.current, dragOverChannelIdx);
        }
        touchDragIdxRef.current = null;
        setDraggedChannelIdx(null);
        setDragOverChannelIdx(null);
    };

    const renderChannelTypeIcon = (type) => {
        if (type === 'voice') return <Volume2 size={15} strokeWidth={2} />;
        if (type === 'conference') return <Video size={15} strokeWidth={2} />;
        if (type === 'image') return <ImageIcon size={15} strokeWidth={2} />;
        return <Hash size={15} strokeWidth={2} />;
    };

    const handleUpdateChannel = async () => {
        if (!editingChannel || !editingChannel.name.trim()) return;
        if (editingChannel.name.trim().length > 20) {
            alert('Kanal adı en fazla 20 karakter olabilir');
            return;
        }
        try {
            const payload = {
                name: editingChannel.name.trim(),
                isPrivate: Boolean(editingChannel.isPrivate),
                isReadOnly: Boolean(editingChannel.isReadOnly),
                description: (editingChannel.description || '').trim(),
                type: editingChannel.type,
            };
            if (editingChannel.type === 'voice' || editingChannel.type === 'conference') {
                payload.maxParticipants = Number(editingChannel.maxParticipants) || 25;
                payload.roomMode = editingChannel.roomMode || (editingChannel.type === 'conference' ? 'stage' : 'free');
            }
            const res = await axios.put(`/api/portals/${portal._id}/channels/${editingChannel.id}`, payload);
            onUpdate({ ...portal, channels: res.data });
            setEditingChannel(null);
        } catch (err) {
            alert('Kanal güncellenemedi');
        }
    };

    // --- Member Handlers ---
    const handleKick = async (userId) => {
        if (!isAdmin) return;
        if (!window.confirm('Üyeyi portaldan atmak istiyor musunuz?')) return;
        try {
            await axios.post(`/api/portals/${portal._id}/kick`, { userId });
            const kickedUserId = String(userId);
            onUpdate({
                ...portal,
                members: portal.members.filter((m) => String(m._id || m) !== kickedUserId),
                admins: portal.admins.filter((a) => String(a._id || a) !== kickedUserId),
            });
        } catch (err) {
            alert('Üye atılamadı: ' + (err.response?.data?.message || 'Yetkisiz işlem'));
        }
    };

    const handleRole = async (userId, action) => {
        if (!isOwner) return; // Only Owner can promote/demote admins
        try {
            const res = await axios.post(`/api/portals/${portal._id}/roles`, { userId, action });
            onUpdate({ ...portal, admins: res.data });
        } catch (err) {
            alert('Yetki değiştirilemedi');
        }
    };

    const handleBlock = async (userId) => {
        if (!isAdmin) return;
        if (!window.confirm('Kullanıcıyı engellemek istediğinize emin misiniz?')) return;
        try {
            await axios.post(`/api/portals/${portal._id}/block`, { userId }); // Updated route
            const blockedUserId = String(userId);
            onUpdate({
                ...portal,
                members: portal.members.filter((m) => String(m._id || m) !== blockedUserId),
                admins: portal.admins.filter((a) => String(a._id || a) !== blockedUserId),
            });
            // Refresh blocked list if active
            if (activeTab === 'banned') fetchBlockedUsers();
        } catch (err) {
            alert('User could not be blocked: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleUnblock = async (userId) => {
        if (!isAdmin) return;
        try {
            await axios.post(`/api/portals/${portal._id}/unblock`, { userId });
            setBlockedUsers((prev) => prev.filter((u) => u._id !== userId));
        } catch (err) {
            alert('Engeli kaldırma başarısız');
        }
    };

    const filteredMembers = (portal.members || []).filter((m) => {
        const username = m.username || '';
        return username.toLowerCase().includes(memberSearch.toLowerCase());
    });

    return (
        <div className="settings-modal-overlay" onClick={onClose}>
            <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
                <div className="psm-mobile-sheet-handle" aria-hidden="true" />
                <div className="psm-mobile-topbar">
                    <div className="psm-mobile-topbar-title">
                        <span>{portal.name}</span>
                        <PortalBadges portal={portal} size={15} />
                    </div>
                    <button type="button" className="psm-mobile-close-btn" onClick={onClose} aria-label="Kapat">
                        <X size={20} strokeWidth={2} />
                    </button>
                </div>

                {/* Sidebar */}
                <div className="settings-sidebar">
                    <div className="sidebar-header">
                        <div className="sidebar-portal-name" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>{portal.name}</span>
                            <PortalBadges portal={portal} size={16} />
                        </div>
                    </div>

                    <div
                        className="form-label desktop-only"
                        style={{ paddingLeft: '10px', marginBottom: '8px' }}
                    >
                        Genel
                    </div>
                    <div
                        className={`settings-tab ${activeTab === 'overview' ? 'active' : ''}`}
                        onClick={() => setActiveTab('overview')}
                        title="Genel Bakış"
                    >
                        <Settings size={20} strokeWidth={2} style={{ minWidth: '20px' }} />
                        <span className="tab-label">Genel Bakış</span>
                    </div>

                    <div
                        className="form-label desktop-only"
                        style={{ paddingLeft: '10px', marginTop: '20px', marginBottom: '8px' }}
                    >
                        Yönetim
                    </div>
                    <div
                        className={`settings-tab ${activeTab === 'access' ? 'active' : ''}`}
                        onClick={() => setActiveTab('access')}
                        title="Erişim"
                    >
                        <Lock size={20} strokeWidth={2} style={{ minWidth: '20px' }} />
                        <span className="tab-label">Erişim</span>
                    </div>
                    <div
                        className={`settings-tab ${activeTab === 'channels' ? 'active' : ''}`}
                        onClick={() => setActiveTab('channels')}
                        title="Kanallar"
                    >
                        <List size={20} strokeWidth={2} style={{ minWidth: '20px' }} />
                        <span className="tab-label">Kanallar</span>
                    </div>
                    <div
                        className={`settings-tab ${activeTab === 'members' ? 'active' : ''}`}
                        onClick={() => setActiveTab('members')}
                        title="Üyeler"
                    >
                        <Users size={20} strokeWidth={2} style={{ minWidth: '20px' }} />
                        <span className="tab-label">Üyeler</span>
                    </div>
                    <div
                        className={`settings-tab ${activeTab === 'banned' ? 'active' : ''}`}
                        onClick={() => setActiveTab('banned')}
                        title="Engellenenler"
                    >
                        <Ban size={20} strokeWidth={2} style={{ minWidth: '20px' }} />
                        <span className="tab-label">Engellenenler</span>
                    </div>

                    <div
                        className={`settings-tab ${activeTab === 'location' ? 'active' : ''}`}
                        onClick={() => setActiveTab('location')}
                        title="Konum"
                    >
                        <MapPin size={20} strokeWidth={2} style={{ minWidth: '20px' }} />
                        <span className="tab-label">Konum</span>
                    </div>

                    {isAdmin && (
                        <div
                            className={`settings-tab ${activeTab === 'bots' ? 'active' : ''}`}
                            onClick={() => setActiveTab('bots')}
                            title="Portal Botları"
                        >
                            <Bot size={20} strokeWidth={2} style={{ minWidth: '20px' }} />
                            <span className="tab-label">Portal Botları</span>
                        </div>
                    )}
                    {isAdmin && (
                        <div
                            className={`settings-tab ${activeTab === 'live_rooms' ? 'active' : ''}`}
                            onClick={() => setActiveTab('live_rooms')}
                            title="Canlı Oda Ayarları"
                        >
                            <Radio size={20} strokeWidth={2} style={{ minWidth: '20px' }} />
                            <span className="tab-label">Canlı Odalar</span>
                        </div>
                    )}
                    {isAdmin && (
                        <div
                            className={`settings-tab ${activeTab === 'audit' ? 'active' : ''}`}
                            onClick={() => setActiveTab('audit')}
                            title="Denetim Günlüğü"
                        >
                            <FileText size={20} strokeWidth={2} style={{ minWidth: '20px' }} />
                            <span className="tab-label">Denetim Günlüğü</span>
                        </div>
                    )}

                    {isOwner && (
                        <div
                            className={`settings-tab ${activeTab === 'advanced' ? 'active' : ''}`}
                            onClick={() => setActiveTab('advanced')}
                            title="Gelişmiş"
                            style={{ marginTop: 'auto', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}
                        >
                            <AlertTriangle size={20} strokeWidth={2} color="#ef4444" style={{ minWidth: '20px' }} />
                            <span className="tab-label" style={{ color: '#ef4444' }}>Gelişmiş</span>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="settings-content">
                    <button className="close-settings-btn" onClick={onClose}><X size={24} strokeWidth={2} /></button>

                    {activeTab === 'overview' && (
                        <div className="animate-fade-in">
                            <h2 className="settings-title">Genel Bakış</h2>

                            <div className="psm-stats-strip">
                                <div className="psm-stat-box">
                                    <span className="psm-stat-value">{(portal.members || []).length}</span>
                                    <span className="psm-stat-label">Üye</span>
                                </div>
                                <div className="psm-stat-box">
                                    <span className="psm-stat-value">{(portal.channels || []).length}</span>
                                    <span className="psm-stat-label">Kanal</span>
                                </div>
                                <div className="psm-stat-box">
                                    <span className="psm-stat-value">{portal.postCount || 0}</span>
                                    <span className="psm-stat-label">Gönderi</span>
                                </div>
                            </div>

                            <div className="psm-link-bar">
                                <Link2 size={14} style={{ color: '#8a8a8a', flexShrink: 0 }} />
                                <span className="psm-link-text">oxypace.com.tr/portal/{portal._id}</span>
                                <button
                                    type="button"
                                    className="psm-copy-btn"
                                    onClick={() => {
                                        const url = `https://oxypace.com.tr/portal/${portal._id}`;
                                        navigator.clipboard?.writeText(url).then(() => {
                                            setPortalLinkCopied(true);
                                            setTimeout(() => setPortalLinkCopied(false), 2000);
                                        }).catch(() => {});
                                    }}
                                >
                                    {portalLinkCopied ? <Check size={13} /> : <Copy size={13} />}
                                    <span>{portalLinkCopied ? 'Kopyalandı' : 'Kopyala'}</span>
                                </button>
                            </div>

                            <div className="images-grid">
                                <div
                                    className="image-preview-box banner-box"
                                    onClick={() => isOwner && bannerRef.current.click()}
                                >
                                    {portal.banner ? (
                                        <img
                                            src={getImageUrl(portal.banner)}
                                            alt=""
                                            className="banner-img"
                                        />
                                    ) : (
                                        <div style={{ color: '#72767d' }}>Banner Yok</div>
                                    )}
                                    {isOwner && (
                                        <div className="upload-overlay">Banner Değiştir</div>
                                    )}
                                </div>
                                <div
                                    className="image-preview-box avatar-box"
                                    onClick={() => isOwner && avatarRef.current.click()}
                                >
                                    {portal.avatar ? (
                                        <img
                                            src={getImageUrl(portal.avatar)}
                                            alt=""
                                            className="avatar-img"
                                        />
                                    ) : (
                                        <div
                                            style={{
                                                color: '#72767d',
                                                fontSize: '2rem',
                                                fontWeight: 'bold',
                                            }}
                                        >
                                            {portal.name[0]}
                                        </div>
                                    )}
                                    {isOwner && <div className="upload-overlay">Logo</div>}
                                </div>
                            </div>

                            <input
                                type="file"
                                ref={bannerRef}
                                onChange={(e) => handleFileSelect(e, 'banner')}
                                hidden
                                accept="image/*"
                            />
                            <input
                                type="file"
                                ref={avatarRef}
                                onChange={(e) => handleFileSelect(e, 'avatar')}
                                hidden
                                accept="image/*"
                            />

                            <div className="form-group">
                                <label className="form-label">
                                    Portal Adı <span style={{ fontSize: '11px', color: 'var(--text-secondary, #888)', fontWeight: 'normal' }}>({(formData.name || '').length}/20)</span>
                                </label>
                                <input
                                    className="form-input"
                                    value={formData.name}
                                    maxLength={20}
                                    onChange={(e) =>
                                        setFormData({ ...formData, name: e.target.value.slice(0, 20) })
                                    }
                                    disabled={!isOwner}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Açıklama</label>
                                <textarea
                                    className="form-textarea"
                                    value={formData.description}
                                    onChange={(e) =>
                                        setFormData({ ...formData, description: e.target.value })
                                    }
                                    disabled={!isOwner}
                                />
                            </div>

                            {isOwner && (
                                <button
                                    className="btn-save"
                                    onClick={handleSaveOverview}
                                    disabled={loading}
                                >
                                    {loading ? '...' : 'Değişiklikleri Kaydet'}
                                </button>
                            )}
                        </div>
                    )}

                    {activeTab === 'access' && (
                        <div className="animate-fade-in">
                            <h2 className="settings-title">Erişim Yönetimi</h2>


                            <div className="form-group">
                                <label className="form-label" style={{ marginBottom: '12px' }}>Portal Gizliliği</label>
                                <div className="privacy-options-container">
                                    {/* Public Option */}
                                    <div
                                        className={`privacy-option-row ${accessData.privacy === 'public' ? 'selected' : ''}`}
                                        onClick={() => isOwner && setAccessData({ ...accessData, privacy: 'public' })}
                                    >
                                        <div className="privacy-row-icon-wrapper">
                                            <Globe size={24} strokeWidth={2} className="privacy-row-icon" />
                                        </div>
                                        <div className="privacy-row-content">
                                            <div className="privacy-row-title">Herkese Açık</div>
                                            <div className="privacy-row-desc">Portal tüm ziyaretçilere görünür ve herkes katılabilir.</div>
                                        </div>
                                        <div className="privacy-row-check">
                                            <div className="privacy-row-check-inner"></div>
                                        </div>
                                    </div>

                                    {/* Restricted Option */}
                                    <div
                                        className={`privacy-option-row ${accessData.privacy === 'restricted' ? 'selected' : ''}`}
                                        onClick={() => isOwner && setAccessData({ ...accessData, privacy: 'restricted' })}
                                    >
                                        <div className="privacy-row-icon-wrapper">
                                            <Users size={20} strokeWidth={2} style={{ minWidth: '20px' }} />
                                        </div>
                                        <div className="privacy-row-content">
                                            <div className="privacy-row-title">Belirli Kişiler</div>
                                            <div className="privacy-row-desc">Sadece üyeler ve izin verilen kullanıcılar erişebilir.</div>
                                        </div>
                                        <div className="privacy-row-check">
                                            <div className="privacy-row-check-inner"></div>
                                        </div>
                                    </div>

                                    {/* Private Option */}
                                    <div
                                        className={`privacy-option-row ${accessData.privacy === 'private' ? 'selected' : ''}`}
                                        onClick={() => {
                                            if (isOwner) {
                                                setAccessData({ ...accessData, privacy: 'private' });
                                            }
                                        }}
                                    >
                                        <div className="privacy-row-icon-wrapper">
                                            <Lock size={20} strokeWidth={2} style={{ minWidth: '20px' }} />
                                        </div>
                                        <div className="privacy-row-content">
                                            <div className="privacy-row-title">Gizli</div>
                                            <div className="privacy-row-desc">
                                                Portal görünür ancak içerikler gizlidir. Üye olmak için başvuru gereklidir.
                                            </div>
                                        </div>
                                        <div className="privacy-row-check">
                                            <div className="privacy-row-check-inner"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {accessData.privacy === 'restricted' && (
                                <div className="allowed-users-section">
                                    <div className="section-header">
                                        <div className="section-title">İzinli Kullanıcılar ({accessData.allowedUsers.length + portal.members.length})</div>
                                    </div>

                                    <div className="search-container">
                                        <Search size={18} strokeWidth={2} className="search-icon" />
                                        <input
                                            className="search-input-modern"
                                            placeholder="Kullanıcı adı ile ara ve ekle..."
                                            value={allowedUserSearch}
                                            onChange={(e) => handleAllowedSearch(e.target.value)}
                                            disabled={!isOwner}
                                        />

                                        {allowedUserResults.length > 0 && (
                                            <div className="search-results-dropdown" style={{ top: '45px' }}>
                                                {allowedUserResults.map(user => (
                                                    <div key={user._id} className="user-row" onClick={() => handleAddAllowedUser(user)} style={{ cursor: 'pointer', padding: '10px 12px' }}>
                                                        <img src={getImageUrl(user.profile?.avatar)} className="user-avatar-small" alt="" />
                                                        <span className="user-name">{user.username}</span>
                                                        <div style={{ marginLeft: 'auto', color: '#e5e5e5', fontSize: '0.8rem', fontWeight: '600' }}>EKLE</div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="allowed-list">
                                        {/* Existing Members */}
                                        {portal.members.map(member => (
                                            <div key={member._id} className="user-row">
                                                <img src={getImageUrl(member.profile?.avatar)} className="user-avatar-small" alt="" />
                                                <div className="user-info">
                                                    <span className="user-name">{member.username}</span>
                                                    <span className="user-role-badge role-member">Üye</span>
                                                </div>
                                            </div>
                                        ))}

                                        {/* Allowed Users */}
                                        {accessData.allowedUsers.map(user => (
                                            <div key={user._id || user} className="user-row">
                                                <img src={getImageUrl(user.profile?.avatar)} className="user-avatar-small" alt="" />
                                                <div className="user-info">
                                                    <span className="user-name">{user.username}</span>
                                                    <span className="user-role-badge role-allowed">İzinli</span>
                                                </div>
                                                {isOwner && (
                                                    <button
                                                        className="remove-btn"
                                                        onClick={() => handleRemoveAllowedUser(user._id || user)}
                                                        title="İzni Kaldır"
                                                    >
                                                        <X size={18} strokeWidth={2} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}

                                        {portal.members.length === 0 && accessData.allowedUsers.length === 0 && (
                                            <div className="empty-state-text">Henüz kimseye özel erişim verilmedi.</div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="form-group" style={{ marginTop: '18px' }}>
                                <label className="form-label" style={{ marginBottom: '10px' }}>İçerik ve Yayın Politikası</label>
                                <div className="privacy-options-container">
                                    <div
                                        className={`privacy-option-row ${accessData.isReadOnly ? 'selected' : ''}`}
                                        onClick={() => isOwner && setAccessData((prev) => ({ ...prev, isReadOnly: !prev.isReadOnly }))}
                                    >
                                        <div className="privacy-row-icon-wrapper">
                                            <EyeOff size={18} strokeWidth={2} />
                                        </div>
                                        <div className="privacy-row-content">
                                            <div className="privacy-row-title">Salt Okunur Mod</div>
                                            <div className="privacy-row-desc">Sadece portal yöneticileri yeni gönderi paylaşabilir.</div>
                                        </div>
                                        <span className={`psm-toggle-switch ${accessData.isReadOnly ? 'on' : ''}`} />
                                    </div>

                                    <div
                                        className={`privacy-option-row ${accessData.isNSFW ? 'selected' : ''}`}
                                        onClick={() => isOwner && setAccessData((prev) => ({ ...prev, isNSFW: !prev.isNSFW }))}
                                    >
                                        <div className="privacy-row-icon-wrapper">
                                            <ShieldAlert size={18} strokeWidth={2} />
                                        </div>
                                        <div className="privacy-row-content">
                                            <div className="privacy-row-title">+18 İçerik Etiketi</div>
                                            <div className="privacy-row-desc">Portal kartlarında yaş sınırı uyarısı gösterilir.</div>
                                        </div>
                                        <span className={`psm-toggle-switch ${accessData.isNSFW ? 'on' : ''}`} />
                                    </div>
                                </div>
                            </div>

                            {isOwner && (
                                <div className="modal-actions" style={{ marginTop: '16px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
                                    <button
                                        className="btn-save"
                                        onClick={handleSaveAccess}
                                        disabled={loading}
                                    >
                                        {loading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'audit' && isAdmin && (
                        <div className="animate-fade-in">
                            <div className="psm-audit-header">
                                <h2 className="settings-title" style={{ margin: 0 }}>Denetim Günlüğü</h2>
                                <button
                                    type="button"
                                    className="psm-copy-btn"
                                    onClick={fetchAuditLogs}
                                    disabled={auditLoading}
                                >
                                    <RefreshCw size={13} />
                                    <span>{auditLoading ? 'Yükleniyor...' : 'Yenile'}</span>
                                </button>
                            </div>

                            {auditLoading ? (
                                <div className="empty-state-text">Kayıtlar yükleniyor...</div>
                            ) : auditLogs.length === 0 ? (
                                <div className="empty-state-text">Bu portal için henüz denetim kaydı yok.</div>
                            ) : (
                                <div className="psm-audit-list">
                                    {auditLogs.map((log, idx) => (
                                        <div key={log._id || idx} className="psm-audit-row">
                                            {log.user?.profile?.avatar ? (
                                                <img
                                                    src={getImageUrl(log.user.profile.avatar)}
                                                    alt=""
                                                    className="user-avatar-small"
                                                />
                                            ) : (
                                                <div className="user-avatar-small" style={{ background: '#262626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>
                                                    {(log.user?.username || 'S')[0].toUpperCase()}
                                                </div>
                                            )}
                                            <div className="psm-audit-body">
                                                <div className="user-name">
                                                    <span>{log.user?.profile?.displayName || log.user?.username || 'Sistem'}</span>
                                                    <span className="role-badge">{log.action || log.category || 'İşlem'}</span>
                                                </div>
                                                <div className="psm-audit-meta">
                                                    <span>{log.description || log.details?.message || 'Portal etkinliği'}</span>
                                                    {log.createdAt && (
                                                        <span>· {new Date(log.createdAt).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'channels' && (
                        <div className="animate-fade-in">
                            <h2 className="settings-title">Kanallar</h2>

                            {isAdmin && (
                                <div className="psm-new-channel-card">
                                    <label className="form-label" style={{ marginBottom: '8px' }}>Yeni Kanal Oluştur</label>
                                    <div className="psm-new-channel-row">
                                        <input
                                            className="form-input"
                                            maxLength={20}
                                            placeholder={
                                                newChannelType === 'text'
                                                    ? 'Kanal adı (örn: oyun, müzik)'
                                                    : newChannelType === 'voice'
                                                        ? 'Ses kanalı adı (örn: sohbet)'
                                                        : newChannelType === 'conference'
                                                            ? 'Seminer adı (örn: etkinlik)'
                                                            : 'Görsel kanalı adı (örn: galeri)'
                                            }
                                            value={newChannelName}
                                            onChange={(e) => setNewChannelName(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddChannel()}
                                            style={{ flex: 1, minWidth: 0 }}
                                        />
                                        <select
                                            className="form-input psm-channel-type-select"
                                            value={newChannelType}
                                            onChange={(e) => setNewChannelType(e.target.value)}
                                            aria-label="Kanal Türü"
                                        >
                                            <option value="text">Metin</option>
                                            <option value="voice">Ses</option>
                                            <option value="conference">Seminer</option>
                                            <option value="image">Görsel</option>
                                        </select>
                                        <button
                                            type="button"
                                            className="btn-save"
                                            style={{ float: 'none', whiteSpace: 'nowrap' }}
                                            onClick={handleAddChannel}
                                        >
                                            Oluştur
                                        </button>
                                    </div>
                                    <div className="form-hint" style={{ marginTop: '6px' }}>
                                        {newChannelType === 'voice'
                                            ? 'Ses kanallarında tüm katılımcılar serbestçe konuşabilir.'
                                            : newChannelType === 'conference'
                                                ? 'Seminer kanallarında yöneticiler konuşur, diğer üyeler dinleyicidir.'
                                                : newChannelType === 'image'
                                                    ? 'Görsel kanallarda her gönderide en az bir görsel zorunludur.'
                                                    : 'Sıralamayı değiştirmek için kanalları tutup sürükleyin.'}
                                    </div>
                                </div>
                            )}

                            <div className="channel-list">
                                {portal.channels &&
                                    [...portal.channels].sort((a, b) => (a.order || 0) - (b.order || 0)).map((ch, index) => {
                                        const isEditing = editingChannel && editingChannel.id === ch._id;
                                        const isVoiceOrConf = editingChannel?.type === 'voice' || editingChannel?.type === 'conference';
                                        return (
                                            <div
                                                key={ch._id}
                                                data-channel-index={index}
                                                draggable={isAdmin && !editingChannel}
                                                onDragStart={() => {
                                                    if (!isAdmin || editingChannel) return;
                                                    setDraggedChannelIdx(index);
                                                }}
                                                onDragOver={(e) => {
                                                    if (!isAdmin || editingChannel) return;
                                                    e.preventDefault();
                                                    if (dragOverChannelIdx !== index) {
                                                        setDragOverChannelIdx(index);
                                                    }
                                                }}
                                                onDrop={(e) => {
                                                    e.preventDefault();
                                                    if (draggedChannelIdx !== null && draggedChannelIdx !== index) {
                                                        reorderChannelsByIndex(draggedChannelIdx, index);
                                                    }
                                                    setDraggedChannelIdx(null);
                                                    setDragOverChannelIdx(null);
                                                }}
                                                onDragEnd={() => {
                                                    setDraggedChannelIdx(null);
                                                    setDragOverChannelIdx(null);
                                                }}
                                                className={`channel-row ${isAdmin && !editingChannel ? 'is-draggable' : ''} ${draggedChannelIdx === index ? 'is-dragging' : ''} ${dragOverChannelIdx === index && draggedChannelIdx !== null && draggedChannelIdx !== index ? 'is-drag-over' : ''}`}
                                            >
                                                {isEditing ? (
                                                    <div className="psm-channel-edit-panel">
                                                        <div className="psm-channel-edit-grid">
                                                            <div>
                                                                <label className="form-label">Kanal Adı</label>
                                                                <input
                                                                    className="form-input"
                                                                    maxLength={20}
                                                                    value={editingChannel.name}
                                                                    onChange={(e) =>
                                                                        setEditingChannel({
                                                                            ...editingChannel,
                                                                            name: e.target.value,
                                                                        })
                                                                    }
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="form-label">Kanal Türü</label>
                                                                <select
                                                                    className="form-input"
                                                                    value={editingChannel.type}
                                                                    onChange={(e) =>
                                                                        setEditingChannel({
                                                                            ...editingChannel,
                                                                            type: e.target.value,
                                                                            roomMode: e.target.value === 'conference' ? 'stage' : 'free',
                                                                        })
                                                                    }
                                                                >
                                                                    <option value="text">Metin</option>
                                                                    <option value="voice">Ses</option>
                                                                    <option value="conference">Seminer</option>
                                                                    <option value="image">Görsel</option>
                                                                </select>
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <label className="form-label">Kanal Açıklaması (Opsiyonel)</label>
                                                            <input
                                                                className="form-input"
                                                                maxLength={200}
                                                                placeholder="Bu kanalda neler paylaşılır?"
                                                                value={editingChannel.description || ''}
                                                                onChange={(e) =>
                                                                    setEditingChannel({
                                                                        ...editingChannel,
                                                                        description: e.target.value,
                                                                    })
                                                                }
                                                            />
                                                        </div>

                                                        {isVoiceOrConf && (
                                                            <div className="psm-channel-edit-grid">
                                                                <div>
                                                                    <label className="form-label">Maksimum Katılımcı (2-100)</label>
                                                                    <input
                                                                        type="number"
                                                                        min={2}
                                                                        max={100}
                                                                        className="form-input"
                                                                        value={editingChannel.maxParticipants ?? 25}
                                                                        onChange={(e) =>
                                                                            setEditingChannel({
                                                                                ...editingChannel,
                                                                                maxParticipants: e.target.value,
                                                                            })
                                                                        }
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="form-label">Oda Modu</label>
                                                                    <select
                                                                        className="form-input"
                                                                        value={editingChannel.roomMode || 'free'}
                                                                        onChange={(e) =>
                                                                            setEditingChannel({
                                                                                ...editingChannel,
                                                                                roomMode: e.target.value,
                                                                            })
                                                                        }
                                                                    >
                                                                        <option value="free">Serbest Konuşma</option>
                                                                        <option value="stage">Sahne (Yalnızca Yöneticiler)</option>
                                                                    </select>
                                                                </div>
                                                            </div>
                                                        )}

                                                        <div className="psm-channel-toggles">
                                                            <div
                                                                className="psm-channel-toggle-row"
                                                                onClick={() =>
                                                                    setEditingChannel((prev) => ({
                                                                        ...prev,
                                                                        isPrivate: !prev.isPrivate,
                                                                    }))
                                                                }
                                                            >
                                                                <div>
                                                                    <div className="psm-channel-toggle-title">Gizli Kanal</div>
                                                                    <div className="psm-channel-toggle-desc">Yalnızca yetkili üyeler görebilir.</div>
                                                                </div>
                                                                <span className={`psm-toggle-switch ${editingChannel.isPrivate ? 'on' : ''}`} />
                                                            </div>

                                                            {!isVoiceOrConf && (
                                                                <div
                                                                    className="psm-channel-toggle-row"
                                                                    onClick={() =>
                                                                        setEditingChannel((prev) => ({
                                                                            ...prev,
                                                                            isReadOnly: !prev.isReadOnly,
                                                                        }))
                                                                    }
                                                                >
                                                                    <div>
                                                                        <div className="psm-channel-toggle-title">Salt Okunur (Duyuru)</div>
                                                                        <div className="psm-channel-toggle-desc">Yalnızca yöneticiler gönderi paylaşabilir.</div>
                                                                    </div>
                                                                    <span className={`psm-toggle-switch ${editingChannel.isReadOnly ? 'on' : ''}`} />
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="psm-channel-edit-actions">
                                                            <button
                                                                type="button"
                                                                className="psm-btn-secondary"
                                                                onClick={() => setEditingChannel(null)}
                                                            >
                                                                İptal
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="btn-save"
                                                                style={{ float: 'none' }}
                                                                onClick={handleUpdateChannel}
                                                            >
                                                                Kaydet
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="channel-name" style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                                                            {isAdmin && (
                                                                <span
                                                                    className="psm-channel-drag-handle"
                                                                    title="Sıralamak için tutup sürükleyin"
                                                                    onTouchStart={() => handleChannelTouchStart(index)}
                                                                    onTouchMove={handleChannelTouchMove}
                                                                    onTouchEnd={handleChannelTouchEnd}
                                                                >
                                                                    <GripVertical size={15} />
                                                                </span>
                                                            )}
                                                            <span className="psm-channel-icon-badge" aria-hidden="true">
                                                                {renderChannelTypeIcon(ch.type)}
                                                            </span>
                                                            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                                                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{ch.name}</span>
                                                                    {ch.isPrivate && (
                                                                        <span className="psm-channel-badge" title="Gizli Kanal">
                                                                            <Lock size={11} strokeWidth={2.2} />
                                                                            Gizli
                                                                        </span>
                                                                    )}
                                                                    {ch.isReadOnly && (
                                                                        <span className="psm-channel-badge" title="Salt Okunur">
                                                                            Duyuru
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <span style={{ fontSize: '11px', color: '#8a8a8a' }}>
                                                                    {ch.type === 'image'
                                                                        ? 'Görsel Kanal'
                                                                        : ch.type === 'voice'
                                                                            ? `Ses Kanalı · Maks ${ch.maxParticipants || 25} kişi`
                                                                            : ch.type === 'conference'
                                                                                ? `Seminer Kanalı · Maks ${ch.maxParticipants || 25} kişi`
                                                                                : 'Metin Kanalı'}
                                                                    {ch.description ? ` · ${ch.description}` : ''}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        {isAdmin && (
                                                            <div className="channel-actions" style={{ display: 'flex', gap: '4px', alignItems: 'center', flexShrink: 0 }}>
                                                                <button
                                                                    type="button"
                                                                    className="portal-action-btn-circle"
                                                                    style={{ width: '32px', height: '32px' }}
                                                                    onClick={() =>
                                                                        setEditingChannel({
                                                                            id: ch._id,
                                                                            name: ch.name,
                                                                            description: ch.description || '',
                                                                            isPrivate: Boolean(ch.isPrivate),
                                                                            isReadOnly: Boolean(ch.isReadOnly),
                                                                            type: ch.type || 'text',
                                                                            maxParticipants: ch.maxParticipants || 25,
                                                                            roomMode: ch.roomMode || (ch.type === 'conference' ? 'stage' : 'free'),
                                                                        })
                                                                    }
                                                                    title="Kanal Ayarları"
                                                                >
                                                                    <Pencil size={15} strokeWidth={2} />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    className="portal-action-btn-circle"
                                                                    style={{ width: '32px', height: '32px' }}
                                                                    onClick={() => handleDeleteChannel(ch._id)}
                                                                    title="Kanalı Sil"
                                                                >
                                                                    <Trash2 size={15} strokeWidth={2} color="#ef4444" />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        );
                                    })}
                                {(!portal.channels || portal.channels.length === 0) && (
                                    <div style={{ padding: '20px', textAlign: 'center', color: '#8a8a8a' }}>
                                        Hiç kanal yok.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'members' && (
                        <div className="animate-fade-in">
                            <h2 className="settings-title">
                                Üyeler ({portal.humanMemberCount ?? portal.members?.filter(m => !m.isBot)?.length ?? portal.members?.length ?? 0})
                            </h2>

                            <div className="form-group">
                                <input
                                    className="form-input"
                                    placeholder="Üye ara..."
                                    value={memberSearch}
                                    onChange={(e) => setMemberSearch(e.target.value)}
                                    style={{ padding: '8px 12px', fontSize: '0.9rem' }}
                                />
                            </div>

                            <div className="members-list">
                                {filteredMembers.map((member) => {
                                    const memberId = member._id || member;
                                    const isAdminMember = portal.admins.some(
                                        (a) => String(a._id || a) === String(memberId)
                                    );
                                    const isOwnerMember = String(ownerId) === String(memberId);

                                    return (
                                        <div key={memberId} className="member-card">
                                            <img
                                                src={getImageUrl(member.profile?.avatar)}
                                                alt=""
                                                className="member-avatar"
                                                onError={(e) => (e.target.style.display = 'none')}
                                            />
                                            <div className="member-details">
                                                <div className="member-username">
                                                    {member.username || 'Kullanıcı'}
                                                    {member.isBot && (
                                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '2px 6px', background: 'rgba(255, 255, 255, 0.15)', color: '#e5e5e5', border: '1px solid rgba(255, 255, 255, 0.3)', borderRadius: '4px', fontSize: '11px', fontWeight: 700, marginLeft: '6px' }}>
                                                             BOT
                                                        </span>
                                                    )}
                                                    {isOwnerMember && (
                                                        <span className="role-badge owner">
                                                             As Yönetici
                                                        </span>
                                                    )}
                                                    {isAdminMember && !isOwnerMember && (
                                                        <span className="role-badge admin">
                                                             Er Yönetici
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Action Menu */}
                                            {isAdmin &&
                                                !isOwnerMember &&
                                                // Hide actions if I am Admin but target is also Admin (unless I am Owner)
                                                (isOwner || !isAdminMember) && (
                                                    <div
                                                        className="channel-actions"
                                                        style={{ display: 'flex', gap: '8px' }}
                                                    >
                                                        {isOwner &&
                                                            (!isAdminMember ? (
                                                                <button
                                                                    onClick={() =>
                                                                        handleRole(
                                                                            memberId,
                                                                            'promote'
                                                                        )
                                                                    }
                                                                    title="Er Yönetici Yap"
                                                                    style={{ color: '#e5e5e5' }}
                                                                >
                                                                    <ArrowUp size={18} strokeWidth={2} />
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    onClick={() =>
                                                                        handleRole(
                                                                            memberId,
                                                                            'demote'
                                                                        )
                                                                    }
                                                                    title="Yöneticiliği Al"
                                                                    style={{ color: '#faa61a' }}
                                                                >
                                                                    <ArrowDown size={18} strokeWidth={2} />
                                                                </button>
                                                            ))}

                                                        <button
                                                            onClick={() => handleKick(memberId)}
                                                            title="Portaldan At"
                                                            style={{ color: '#ed4245' }}
                                                        >
                                                            <UserMinus size={18} strokeWidth={2} />
                                                        </button>

                                                        <button
                                                            onClick={() => handleBlock(memberId)}
                                                            title="Engelle"
                                                            style={{ color: '#ed4245' }}
                                                        >
                                                            <Ban size={18} strokeWidth={2} />
                                                        </button>
                                                    </div>
                                                )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {activeTab === 'banned' && (
                        <div className="animate-fade-in">
                            <h2 className="settings-title">Engellenen Kullanıcılar</h2>

                            {/* Block User Search */}
                            <div className="form-group" style={{ marginBottom: '20px' }}>
                                <input
                                    className="form-input"
                                    placeholder="Engellemek için kullanıcı ara..."
                                    value={blockSearchQuery}
                                    onChange={(e) => handleBlockSearch(e.target.value)}
                                    style={{ padding: '8px 12px', fontSize: '0.9rem' }}
                                />
                                {blockSearchResults.length > 0 && (
                                    <div className="search-results-dropdown">
                                        {blockSearchResults.map((user) => (
                                            <div key={user._id} className="member-card full-width">
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '10px',
                                                        flex: 1,
                                                    }}
                                                >
                                                    <img
                                                        src={getImageUrl(user.profile?.avatar)}
                                                        alt=""
                                                        className="member-avatar"
                                                        onError={(e) =>
                                                            (e.target.style.display = 'none')
                                                        }
                                                    />
                                                    <div className="member-username">
                                                        {user.username}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        handleBlock(user._id);
                                                        setBlockSearchQuery('');
                                                        setBlockSearchResults([]);
                                                    }}
                                                    className="btn-save danger-btn"
                                                    style={{
                                                        padding: '4px 12px',
                                                        fontSize: '12px',
                                                        background: '#ed4245',
                                                        color: 'white',
                                                        border: 'none',
                                                    }}
                                                >
                                                    Engelle
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="members-list">
                                {blockedUsers.length > 0 ? (
                                    blockedUsers.map((user) => (
                                        <div key={user._id} className="member-card">
                                            <img
                                                src={getImageUrl(user.profile?.avatar)}
                                                alt=""
                                                className="member-avatar"
                                                onError={(e) => (e.target.style.display = 'none')}
                                            />
                                            <div className="member-details">
                                                <div className="member-username">
                                                    {user.username}
                                                </div>
                                            </div>
                                            <div className="channel-actions">
                                                <button
                                                    onClick={() => handleUnblock(user._id)}
                                                    title="Engeli Kaldır"
                                                    className="btn-save"
                                                    style={{
                                                        padding: '4px 12px',
                                                        fontSize: '12px',
                                                    }}
                                                >
                                                    Kaldır
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div
                                        style={{
                                            color: '#72767d',
                                            padding: '20px',
                                            textAlign: 'center',
                                        }}
                                    >
                                        Engellenen kullanıcı yok.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'location' && isAdmin && (
                        <div className="animate-fade-in">
                            <h2 className="settings-title">Dünya Haritası Konumu</h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', marginTop: '-10px', marginBottom: '16px', lineHeight: '1.5' }}>
                                Harita üzerinden tıklayarak veya arama yaparak portalınızın konumunu belirleyin.
                            </p>

                            {/* Interactive Click-to-Pick Map */}
                            <LocationMapPicker
                                lat={locationData.lat}
                                lng={locationData.lng}
                                disabled={!isOwner}
                                onPick={async (pickedLat, pickedLng) => {
                                    setLocationData((prev) => ({
                                        ...prev,
                                        lat: pickedLat,
                                        lng: pickedLng,
                                        label: prev.label || `${pickedLat.toFixed(4)}, ${pickedLng.toFixed(4)}`,
                                    }));
                                    try {
                                        const resp = await fetch(
                                            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pickedLat}&lon=${pickedLng}&zoom=10&accept-language=tr`
                                        );
                                        const data = await resp.json();
                                        const addr = data?.address || {};
                                        const city = addr.city || addr.town || addr.province || addr.state || '';
                                        const country = addr.country || '';
                                        const cleanLabel = [city, country].filter(Boolean).join(', ') || data?.display_name?.split(',').slice(0, 2).join(', ');
                                        if (cleanLabel) {
                                            setLocationData((prev) => ({ ...prev, label: cleanLabel }));
                                        }
                                    } catch (_) {}
                                }}
                            />

                            {/* Current Location Preview */}
                            {locationData.lat !== null && locationData.lat !== undefined && (
                                <div className="psm-card" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <MapPin size={18} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                                            {locationData.label || 'Konum seçildi'}
                                        </div>
                                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.76rem', fontFamily: 'monospace', marginTop: '2px' }}>
                                            {Number(locationData.lat).toFixed(4)}°, {Number(locationData.lng).toFixed(4)}°
                                        </div>
                                    </div>
                                    <span className="role-badge">
                                        {showOnMap ? 'Haritada' : 'Gizli'}
                                    </span>
                                </div>
                            )}

                            {/* Geocoding Search */}
                            {isOwner && (
                                <div className="form-group">
                                    <label className="form-label">Konum Ara</label>
                                    <div className="search-container">
                                        <Search size={15} strokeWidth={2} className="search-icon" />
                                        <input
                                            className="search-input-modern form-input"
                                            placeholder="Şehir, ülke veya adres ara..."
                                            value={locationSearch}
                                            onChange={(e) => handleLocationSearch(e.target.value)}
                                        />
                                        {locationSearching && (
                                            <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', fontSize: '0.76rem' }}>Aranıyor...</div>
                                        )}
                                        {locationResults.length > 0 && (
                                            <div className="search-results-dropdown" style={{ top: '46px', zIndex: 10 }}>
                                                {locationResults.map((result, i) => (
                                                    <div
                                                        key={i}
                                                        onClick={() => handleSelectLocation(result)}
                                                        style={{ padding: '10px 12px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '2px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
                                                    >
                                                        <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.84rem' }}>
                                                            {result.display_name.split(',').slice(0, 2).join(', ')}
                                                        </span>
                                                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.74rem', fontFamily: 'monospace' }}>
                                                            {parseFloat(result.lat).toFixed(4)}°, {parseFloat(result.lon).toFixed(4)}°
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Manual Coordinate Entry */}
                            {isOwner && (
                                <div style={{ marginBottom: '14px' }}>
                                    <button
                                        type="button"
                                        className="psm-btn-secondary"
                                        onClick={() => setManualMode(!manualMode)}
                                    >
                                        {manualMode ? 'Manuel koordinat girişini gizle' : 'Manuel koordinat gir'}
                                    </button>
                                    {manualMode && (
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '12px' }}>
                                            <div className="form-group" style={{ marginBottom: 0 }}>
                                                <label className="form-label">Enlem (Lat)</label>
                                                <input
                                                    className="form-input"
                                                    type="number"
                                                    step="any"
                                                    placeholder="41.0082"
                                                    value={locationData.lat ?? ''}
                                                    onChange={(e) => setLocationData(prev => ({ ...prev, lat: e.target.value === '' ? null : parseFloat(e.target.value) }))}
                                                />
                                            </div>
                                            <div className="form-group" style={{ marginBottom: 0 }}>
                                                <label className="form-label">Boylam (Lng)</label>
                                                <input
                                                    className="form-input"
                                                    type="number"
                                                    step="any"
                                                    placeholder="28.9784"
                                                    value={locationData.lng ?? ''}
                                                    onChange={(e) => setLocationData(prev => ({ ...prev, lng: e.target.value === '' ? null : parseFloat(e.target.value) }))}
                                                />
                                            </div>
                                            <div className="form-group" style={{ marginBottom: 0, gridColumn: '1 / -1' }}>
                                                <label className="form-label">Konum Etiketi</label>
                                                <input
                                                    className="form-input"
                                                    placeholder="İstanbul, Türkiye"
                                                    value={locationData.label}
                                                    onChange={(e) => setLocationData(prev => ({ ...prev, label: e.target.value }))}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Show on Map Toggle */}
                            {isOwner && (
                                <div
                                    className={`privacy-option-row ${showOnMap && locationData.lat !== null ? 'selected' : ''}`}
                                    style={{ marginBottom: '16px', opacity: locationData.lat === null ? 0.5 : 1 }}
                                    onClick={() => locationData.lat !== null && setShowOnMap((v) => !v)}
                                >
                                    <div className="privacy-row-icon-wrapper">
                                        <Globe size={18} strokeWidth={2} />
                                    </div>
                                    <div className="privacy-row-content">
                                        <div className="privacy-row-title">Dünya Haritasında Göster</div>
                                        <div className="privacy-row-desc">Portalınız 3D dünya haritasında görünür olacak.</div>
                                    </div>
                                    <span className={`psm-toggle-switch ${showOnMap && locationData.lat !== null ? 'on' : ''}`} />
                                </div>
                            )}

                            {!isOwner && (
                                <div className="psm-card" style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                                    Konum ayarları yalnızca portal sahibi tarafından değiştirilebilir.
                                </div>
                            )}

                            {locationSaveStatus === 'success' && (
                                <div className="psm-card" style={{ fontSize: '0.84rem', fontWeight: 600 }}>
                                    Konum başarıyla kaydedildi.
                                </div>
                            )}
                            {locationSaveStatus === 'error' && (
                                <div className="psm-card danger" style={{ fontSize: '0.84rem', color: '#ef4444', fontWeight: 600 }}>
                                    Kaydetme hatası. Lütfen tekrar deneyin.
                                </div>
                            )}

                            {isOwner && (
                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                    {(portal.location?.lat !== null && portal.location?.lat !== undefined) && (
                                        <button
                                            type="button"
                                            className="psm-btn-danger"
                                            onClick={handleClearLocation}
                                            disabled={loading}
                                        >
                                            <Trash2 size={14} />
                                            <span>Konumu Kaldır</span>
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        className="btn-save"
                                        style={{ float: 'none' }}
                                        onClick={handleSaveLocation}
                                        disabled={loading || locationData.lat === null}
                                    >
                                        {loading ? 'Kaydediliyor...' : 'Konumu Kaydet'}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Advanced Tab Content */}
                    {activeTab === 'advanced' && isOwner && (
                        <div className="animate-fade-in">
                            <h2 className="settings-title">Gelişmiş</h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: '-10px', marginBottom: '16px', lineHeight: '1.5' }}>
                                Bu sayfadaki işlemler portalı doğrudan etkiler. Yalnızca portal kurucusu tarafından kullanılabilir.
                            </p>

                            {/* Status Area */}
                            <div className="psm-card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                    <h4 style={{ margin: 0, fontSize: '0.92rem', color: 'var(--text-primary)' }}>Portal Durumu</h4>
                                    <span className="role-badge">{portalStatus === 'active' ? 'Aktif' : 'Arşivde'}</span>
                                </div>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0 0 12px 0', lineHeight: 1.45 }}>
                                    Portalı arşive aldığınızda genel arama sonuçlarında çıkmaz ve yeni üye eklenemez.
                                </p>
                                <button
                                    type="button"
                                    className="psm-btn-secondary"
                                    onClick={handleToggleStatus}
                                    disabled={actionProcessing}
                                >
                                    <Power size={14} />
                                    <span>{portalStatus === 'active' ? 'Portalı Arşive Al' : 'Portalı Aktifleştir'}</span>
                                </button>
                            </div>

                            {/* Transfer Ownership */}
                            <div className="psm-card">
                                <h4 style={{ margin: '0 0 6px 0', fontSize: '0.92rem', color: 'var(--text-primary)' }}>Sahiplik Devri</h4>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0 0 12px 0', lineHeight: 1.45 }}>
                                    Portalın kuruculuğunu başka bir üyeye devredebilirsiniz. Devir sonrası yönetici olarak kalırsınız.
                                </p>
                                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                    <select
                                        className="form-input"
                                        style={{ flex: 1, minWidth: '180px' }}
                                        value={newOwnerId}
                                        onChange={(e) => setNewOwnerId(e.target.value)}
                                        disabled={actionProcessing}
                                    >
                                        <option value="">Devredilecek üyeyi seçin...</option>
                                        {portal.members
                                            .filter(m => String(m._id || m) !== String(currentUserId))
                                            .map(member => (
                                                <option key={member._id} value={member._id}>
                                                    {member.username}
                                                    {portal.admins.some(a => String(a._id || a) === String(member._id)) ? ' (Admin)' : ''}
                                                </option>
                                            ))
                                        }
                                    </select>
                                    <button
                                        type="button"
                                        className="psm-btn-danger"
                                        onClick={handleTransferOwnership}
                                        disabled={actionProcessing || !newOwnerId}
                                    >
                                        Devret
                                    </button>
                                </div>
                            </div>

                            {/* Danger Zone */}
                            <div className="psm-card danger">
                                <h4 style={{ margin: '0 0 6px 0', fontSize: '0.92rem', color: '#ef4444' }}>Tehlikeli Bölge</h4>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0 0 12px 0', lineHeight: 1.45 }}>
                                    Bu işlem geri alınamaz. Portal, tüm kanallar, mesajlar ve dosyalar kalıcı olarak silinir.
                                </p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <label style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                                        Onaylamak için portal adını yazın: <strong style={{ color: 'var(--text-primary)' }}>{portal.name}</strong>
                                    </label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Portal adını yazın..."
                                        value={deleteConfirmText}
                                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                                    />
                                    <div>
                                        <button
                                            type="button"
                                            className="psm-btn-danger"
                                            onClick={handleDeletePortal}
                                            disabled={actionProcessing || deleteConfirmText !== portal.name}
                                        >
                                            <Trash2 size={14} />
                                            <span>Portalı Kalıcı Olarak Sil</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'bots' && (
                        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                                <div>
                                    <h2 className="settings-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Bot size={22} style={{ color: '#e5e5e5' }} />
                                        Portal Botları ({portalBots.length})
                                    </h2>
                                    <p className="settings-desc" style={{ marginTop: '4px', marginBottom: 0 }}>
                                        Hedef web sitelerinden veya RSS akışlarından portalınıza otomatik haber ve içerik aktarın.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    className="btn-modern-primary"
                                    onClick={() => {
                                        setNewBotData({
                                            name: '',
                                            bio: '',
                                            avatar: '',
                                            channel: portal.channels?.[0]?._id || 'general',
                                            feedUrl: '',
                                            intervalMinutes: 15,
                                            autoTranslate: true,
                                            postPrefix: '',
                                            includeSourceLink: true,
                                        });
                                        setShowNewBotModal(true);
                                    }}
                                    style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#ffffff', color: '#090909', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}
                                >
                                    <Plus size={16} />
                                    Yeni Bot Kur
                                </button>
                            </div>

                            {/* Quick Presets Bar */}
                            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '14px' }}>
                                <div style={{ fontSize: '12px', fontWeight: 700, color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Zap size={14} color="#e5e5e5" />
                                    Tek Tıkla Hazır Şablon Botlar
                                </div>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    {BOT_PRESETS.map((preset, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => {
                                                handleApplyPreset(preset);
                                                setShowNewBotModal(true);
                                            }}
                                            style={{
                                                background: 'rgba(255,255,255,0.05)',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                color: '#e5e5e5',
                                                padding: '6px 12px',
                                                borderRadius: '20px',
                                                fontSize: '12px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255,0.15)'; e.currentTarget.style.borderColor = '#e5e5e5'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                                        >
                                            <span>{preset.title}</span>
                                            <span style={{ fontSize: '10px', color: '#e5e5e5', fontWeight: 600 }}>+ Ekle</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Test Run Output Notification */}
                            {testRunResult && (
                                <div style={{
                                    background: testRunResult.success ? 'rgba(255, 255, 255,0.1)' : 'rgba(239,68,68,0.1)',
                                    border: `1px solid ${testRunResult.success ? 'rgba(255, 255, 255,0.3)' : 'rgba(239,68,68,0.3)'}`,
                                    borderRadius: '8px',
                                    padding: '12px 16px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    gap: '12px'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
                                        {testRunResult.success ? (
                                            <CheckCircle size={18} color="#e5e5e5" />
                                        ) : (
                                            <AlertCircle size={18} color="#f87171" />
                                        )}
                                        <div>
                                            <div style={{ fontWeight: 600, color: testRunResult.success ? '#e5e5e5' : '#f87171' }}>
                                                {testRunResult.success ? 'Paylaşım Testi Başarılı!' : 'Test Sonucu / Bilgilendirme'}
                                            </div>
                                            <div style={{ color: '#d4d4d4', fontSize: '12px', marginTop: '2px' }}>
                                                {testRunResult.message}
                                                {testRunResult.title && <strong> "{testRunResult.title}"</strong>}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setTestRunResult(null)}
                                        style={{ background: 'transparent', border: 'none', color: '#a3a3a3', cursor: 'pointer', padding: '4px' }}
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            )}

                            {/* Bots List */}
                            {loadingBots ? (
                                <div style={{ padding: '40px', textAlign: 'center', color: '#8a8a8a' }}>
                                    <RefreshCw size={24} className="spin" style={{ marginBottom: '8px' }} />
                                    <div>Botlar yükleniyor...</div>
                                </div>
                            ) : portalBots.length === 0 ? (
                                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px', padding: '40px 20px', textAlign: 'center' }}>
                                    <Bot size={44} style={{ color: '#737373', marginBottom: '12px' }} />
                                    <h3 style={{ color: '#f4f4f4', margin: '0 0 6px 0', fontSize: '16px' }}>Bu portalda henüz bot bulunmuyor</h3>
                                    <p style={{ color: '#a3a3a3', fontSize: '13px', maxWidth: '420px', margin: '0 auto 16px auto', lineHeight: '1.5' }}>
                                        Yukarıdaki hazır şablonlardan birini seçerek veya "Yeni Bot Kur" butonuna tıklayarak portalınıza otomatik haber botu ekleyebilirsiniz.
                                    </p>
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                                    {portalBots.map((b) => {
                                        const isRunning = runningBotId === b._id;
                                        const isActive = b.config?.isActive !== false;
                                        const hasError = Boolean(b.config?.stats?.lastError);
                                        const targetChannel = portal.channels?.find(c => String(c._id) === String(b.config?.defaultChannel));

                                        return (
                                            <div
                                                key={b._id}
                                                style={{
                                                    background: '#141414',
                                                    border: '1px solid rgba(255,255,255,0.08)',
                                                    borderRadius: '12px',
                                                    padding: '16px',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    justifyContent: 'space-between',
                                                    gap: '14px'
                                                }}
                                            >
                                                <div>
                                                    {/* Header */}
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                            <img
                                                                src={getImageUrl(b.profile?.avatar)}
                                                                alt=""
                                                                style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', background: '#1a1a1a' }}
                                                                onError={(e) => (e.target.style.display = 'none')}
                                                            />
                                                            <div>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                    <span style={{ fontWeight: 700, color: '#ffffff', fontSize: '14px' }}>
                                                                        {b.profile?.displayName || b.username}
                                                                    </span>
                                                                    <span style={{ background: 'rgba(255, 255, 255,0.2)', color: '#e5e5e5', border: '1px solid rgba(255, 255, 255,0.3)', padding: '1px 5px', borderRadius: '4px', fontSize: '10px', fontWeight: 700 }}>
                                                                        BOT
                                                                    </span>
                                                                </div>
                                                                <div style={{ fontSize: '12px', color: '#8a8a8a' }}>@{b.username}</div>
                                                            </div>
                                                        </div>

                                                        {/* Status Pill */}
                                                        <div>
                                                            {hasError ? (
                                                                <span style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                                                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444' }}></span>
                                                                    Hata
                                                                </span>
                                                            ) : !isActive ? (
                                                                <span style={{ background: 'rgba(255, 255, 255,0.15)', color: '#d4d4d4', border: '1px solid rgba(255, 255, 255,0.3)', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                                                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#a3a3a3' }}></span>
                                                                    Duraklatıldı
                                                                </span>
                                                            ) : (
                                                                <span style={{ background: 'rgba(255, 255, 255,0.15)', color: '#e5e5e5', border: '1px solid rgba(255, 255, 255,0.3)', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                                                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#e5e5e5' }}></span>
                                                                    Aktif
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Details */}
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: '#a3a3a3', background: 'rgba(0,0,0,0.25)', padding: '10px', borderRadius: '8px' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                            <span>Hedef Kanal:</span>
                                                            <strong style={{ color: '#e5e5e5' }}>#{targetChannel?.name || b.config?.defaultChannel || 'Genel'}</strong>
                                                        </div>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                            <span>Aralık:</span>
                                                            <strong style={{ color: '#e5e5e5' }}>Her {b.config?.intervalMinutes || 15} dk</strong>
                                                        </div>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                            <span>Toplam Paylaşım:</span>
                                                            <strong style={{ color: '#e5e5e5' }}>{b.config?.stats?.totalPosts || 0} gönderi</strong>
                                                        </div>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                            <span>Son Çalışma:</span>
                                                            <span style={{ color: '#d4d4d4' }}>
                                                                {b.config?.stats?.lastRunAt ? new Date(b.config.stats.lastRunAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' }) : 'Henüz çalışmadı'}
                                                            </span>
                                                        </div>
                                                        <div style={{ marginTop: '4px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '6px' }}>
                                                            <span style={{ color: '#8a8a8a', display: 'block', marginBottom: '2px' }}>Kaynak RSS / Site:</span>
                                                            <span style={{ color: '#a3a3a3', wordBreak: 'break-all', fontSize: '11px' }}>
                                                                {(b.config?.feeds || []).join(', ') || 'Kaynak yok'}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Last Error banner if any */}
                                                    {b.config?.stats?.lastError && (
                                                        <div style={{ marginTop: '8px', padding: '6px 10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '6px', fontSize: '11px', color: '#f87171' }}>
                                                            <strong> Son Hata:</strong> {b.config.stats.lastError}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Actions Footer */}
                                                <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px' }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRunPortalBot(b._id)}
                                                        disabled={isRunning}
                                                        style={{
                                                            flex: 1,
                                                            padding: '8px',
                                                            background: '#ffffff', color: '#090909',
                                                            border: 'none',
                                                            borderRadius: '6px',
                                                            cursor: isRunning ? 'not-allowed' : 'pointer',
                                                            fontSize: '12px',
                                                            fontWeight: 600,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            gap: '6px',
                                                            opacity: isRunning ? 0.7 : 1
                                                        }}
                                                        title="Hemen RSS beslemesini tara ve yeni içerik varsa paylaş"
                                                    >
                                                        {isRunning ? (
                                                            <>
                                                                <RefreshCw size={13} className="spin" />
                                                                Çalışıyor...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Zap size={13} />
                                                                Şimdi Paylaş
                                                            </>
                                                        )}
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleTogglePortalBot(b)}
                                                        style={{
                                                            padding: '8px 10px',
                                                            background: 'rgba(255,255,255,0.05)',
                                                            color: isActive ? '#d4d4d4' : '#e5e5e5',
                                                            border: '1px solid rgba(255,255,255,0.1)',
                                                            borderRadius: '6px',
                                                            cursor: 'pointer',
                                                            fontSize: '12px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '4px'
                                                        }}
                                                        title={isActive ? 'Botu Duraklat' : 'Botu Başlat'}
                                                    >
                                                        {isActive ? <Pause size={14} /> : <Play size={14} />}
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => setEditingBot(JSON.parse(JSON.stringify(b)))}
                                                        style={{
                                                            padding: '8px 10px',
                                                            background: 'rgba(255,255,255,0.05)',
                                                            color: '#d4d4d4',
                                                            border: '1px solid rgba(255,255,255,0.1)',
                                                            borderRadius: '6px',
                                                            cursor: 'pointer',
                                                            fontSize: '12px'
                                                        }}
                                                        title="Bot Ayarlarını Düzenle"
                                                    >
                                                        <Pencil size={14} />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeletePortalBot(b._id)}
                                                        style={{
                                                            padding: '8px 10px',
                                                            background: 'rgba(239,68,68,0.1)',
                                                            color: '#f87171',
                                                            border: '1px solid rgba(239,68,68,0.2)',
                                                            borderRadius: '6px',
                                                            cursor: 'pointer',
                                                            fontSize: '12px'
                                                        }}
                                                        title="Botu Sil"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Modal: Yeni Bot Kur */}
                            {showNewBotModal && (
                                <div className="modal-overlay-modern" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                                    <div style={{ background: '#0b1120', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', maxWidth: '520px', width: '100%', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                                            <h3 style={{ margin: 0, color: '#ffffff', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <Bot size={20} color="#e5e5e5" />
                                                Yeni Portal Botu Kur
                                            </h3>
                                            <button type="button" onClick={() => setShowNewBotModal(false)} style={{ background: 'transparent', border: 'none', color: '#a3a3a3', cursor: 'pointer' }}>
                                                <X size={20} />
                                            </button>
                                        </div>

                                        <form onSubmit={handleCreatePortalBot} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                            <div>
                                                <label style={{ fontSize: '12px', color: '#a3a3a3', display: 'block', marginBottom: '6px' }}>Bot Adı *</label>
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    placeholder="Örn: Teknoloji Botu"
                                                    value={newBotData.name}
                                                    onChange={(e) => setNewBotData({ ...newBotData, name: e.target.value })}
                                                    required
                                                    style={{ width: '100%' }}
                                                />
                                            </div>

                                            <div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                                    <label style={{ fontSize: '12px', color: '#a3a3a3', margin: 0 }}>Hedef Web Sitesi veya RSS Bağlantısı *</label>
                                                    <span style={{ fontSize: '11px', color: '#e5e5e5' }}> Doğrudan site linki de girebilirsiniz</span>
                                                </div>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <input
                                                        type="text"
                                                        className="form-input"
                                                        placeholder="Örn: techcrunch.com veya https://shiftdelete.net/"
                                                        value={newBotData.feedUrl}
                                                        onChange={(e) => setNewBotData({ ...newBotData, feedUrl: e.target.value })}
                                                        required
                                                        style={{ flex: 1 }}
                                                    />
                                                    <button
                                                        type="button"
                                                        disabled={discoveringFeed}
                                                        onClick={() => handleDiscoverFeed(newBotData.feedUrl, false)}
                                                        style={{
                                                            padding: '0 14px',
                                                            background: '#ffffff', color: '#090909',
                                                            border: 'none',
                                                            borderRadius: '6px',
                                                            cursor: discoveringFeed ? 'not-allowed' : 'pointer',
                                                            fontSize: '12px',
                                                            fontWeight: 600,
                                                            whiteSpace: 'nowrap',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '6px'
                                                        }}
                                                        title="Site adresini girip bu butona basarak RSS akışını otomatik bulun"
                                                    >
                                                        {discoveringFeed ? <RefreshCw size={13} className="spin" /> : <Search size={13} />}
                                                        {discoveringFeed ? 'Aranıyor...' : 'Otomatik Bul'}
                                                    </button>
                                                </div>
                                                <span style={{ fontSize: '11px', color: '#8a8a8a', marginTop: '4px', display: 'block' }}>
                                                    Web sitesi linkini yapıştırıp 'Otomatik Bul' butonuna tıklayarak RSS beslemesini saniyeler içinde çıkarabilirsiniz.
                                                </span>
                                            </div>

                                            <div style={{ display: 'flex', gap: '12px' }}>
                                                <div style={{ flex: 1 }}>
                                                    <label style={{ fontSize: '12px', color: '#a3a3a3', display: 'block', marginBottom: '6px' }}>Paylaşılacak Kanal</label>
                                                    <select
                                                        className="form-input"
                                                        value={newBotData.channel}
                                                        onChange={(e) => setNewBotData({ ...newBotData, channel: e.target.value })}
                                                        style={{ width: '100%', background: '#0c0c0c', color: '#fff' }}
                                                    >
                                                        {(portal.channels || []).map((ch) => (
                                                            <option key={ch._id} value={ch._id}>
                                                                #{ch.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div style={{ flex: 1 }}>
                                                    <label style={{ fontSize: '12px', color: '#a3a3a3', display: 'block', marginBottom: '6px' }}>Kontrol Aralığı</label>
                                                    <select
                                                        className="form-input"
                                                        value={newBotData.intervalMinutes}
                                                        onChange={(e) => setNewBotData({ ...newBotData, intervalMinutes: Number(e.target.value) })}
                                                        style={{ width: '100%', background: '#0c0c0c', color: '#fff' }}
                                                    >
                                                        <option value={5}>5 dakikada bir</option>
                                                        <option value={10}>10 dakikada bir</option>
                                                        <option value={15}>15 dakikada bir (Önerilen)</option>
                                                        <option value={30}>30 dakikada bir</option>
                                                        <option value={60}>1 saatte bir</option>
                                                        <option value={120}>2 saatte bir</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', gap: '12px' }}>
                                                <div style={{ flex: 1 }}>
                                                    <label style={{ fontSize: '12px', color: '#a3a3a3', display: 'block', marginBottom: '6px' }}>Gönderi Öneki (Emoji/İkon)</label>
                                                    <input
                                                        type="text"
                                                        className="form-input"
                                                        placeholder=" veya "
                                                        value={newBotData.postPrefix}
                                                        onChange={(e) => setNewBotData({ ...newBotData, postPrefix: e.target.value })}
                                                        style={{ width: '100%' }}
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label style={{ fontSize: '12px', color: '#a3a3a3', display: 'block', marginBottom: '6px' }}>Bot Biyografisi (İsteğe Bağlı)</label>
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    placeholder="Örn: Güncel teknoloji haberlerini paylaşan otomatik portal botu."
                                                    value={newBotData.bio}
                                                    onChange={(e) => setNewBotData({ ...newBotData, bio: e.target.value })}
                                                    style={{ width: '100%' }}
                                                />
                                            </div>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#e5e5e5', cursor: 'pointer' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={newBotData.autoTranslate}
                                                        onChange={(e) => setNewBotData({ ...newBotData, autoTranslate: e.target.checked })}
                                                    />
                                                    <span>Yabancı haberleri otomatik Türkçe'ye çevir</span>
                                                </label>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#e5e5e5', cursor: 'pointer' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={newBotData.includeSourceLink}
                                                        onChange={(e) => setNewBotData({ ...newBotData, includeSourceLink: e.target.checked })}
                                                    />
                                                    <span>Gönderi altına orijinal kaynak linkini ekle</span>
                                                </label>
                                            </div>

                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                                                <button
                                                    type="button"
                                                    className="btn-modern-ghost"
                                                    onClick={() => setShowNewBotModal(false)}
                                                    style={{ padding: '8px 16px', background: 'transparent', color: '#a3a3a3', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', cursor: 'pointer' }}
                                                >
                                                    İptal
                                                </button>
                                                <button
                                                    type="submit"
                                                    className="btn-modern-primary"
                                                    disabled={loading}
                                                    style={{ padding: '8px 20px', background: '#ffffff', color: '#090909', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                                                >
                                                    {loading ? 'Oluşturuluyor...' : 'Botu Başlat'}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}

                            {/* Modal: Bot Ayarlarını Düzenle */}
                            {editingBot && (
                                <div className="modal-overlay-modern" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                                    <div style={{ background: '#0b1120', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', maxWidth: '520px', width: '100%', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                                            <h3 style={{ margin: 0, color: '#ffffff', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <Pencil size={18} color="#e5e5e5" />
                                                Botu Düzenle: @{editingBot.username}
                                            </h3>
                                            <button type="button" onClick={() => setEditingBot(null)} style={{ background: 'transparent', border: 'none', color: '#a3a3a3', cursor: 'pointer' }}>
                                                <X size={20} />
                                            </button>
                                        </div>

                                        <form onSubmit={handleUpdatePortalBot} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                            <div>
                                                <label style={{ fontSize: '12px', color: '#a3a3a3', display: 'block', marginBottom: '6px' }}>Görünen İsim</label>
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    value={editingBot.profile?.displayName || ''}
                                                    onChange={(e) => setEditingBot({
                                                        ...editingBot,
                                                        profile: { ...editingBot.profile, displayName: e.target.value }
                                                    })}
                                                    style={{ width: '100%' }}
                                                />
                                            </div>

                                            <div>
                                                <label style={{ fontSize: '12px', color: '#a3a3a3', display: 'block', marginBottom: '6px' }}>Hedef RSS / Site Bağlantısı</label>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <input
                                                        type="text"
                                                        className="form-input"
                                                        value={editingBot.config?.feeds?.[0] || ''}
                                                        onChange={(e) => setEditingBot({
                                                            ...editingBot,
                                                            config: { ...editingBot.config, feeds: [e.target.value] }
                                                        })}
                                                        style={{ flex: 1 }}
                                                    />
                                                    <button
                                                        type="button"
                                                        disabled={discoveringFeed}
                                                        onClick={() => handleDiscoverFeed(editingBot.config?.feeds?.[0] || '', true)}
                                                        style={{
                                                            padding: '0 14px',
                                                            background: '#ffffff', color: '#090909',
                                                            border: 'none',
                                                            borderRadius: '6px',
                                                            cursor: discoveringFeed ? 'not-allowed' : 'pointer',
                                                            fontSize: '12px',
                                                            fontWeight: 600,
                                                            whiteSpace: 'nowrap',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '6px'
                                                        }}
                                                    >
                                                        {discoveringFeed ? <RefreshCw size={13} className="spin" /> : <Search size={13} />}
                                                        {discoveringFeed ? 'Aranıyor...' : 'Otomatik Bul'}
                                                    </button>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', gap: '12px' }}>
                                                <div style={{ flex: 1 }}>
                                                    <label style={{ fontSize: '12px', color: '#a3a3a3', display: 'block', marginBottom: '6px' }}>Paylaşılacak Kanal</label>
                                                    <select
                                                        className="form-input"
                                                        value={editingBot.config?.defaultChannel || 'general'}
                                                        onChange={(e) => setEditingBot({
                                                            ...editingBot,
                                                            config: { ...editingBot.config, defaultChannel: e.target.value }
                                                        })}
                                                        style={{ width: '100%', background: '#0c0c0c', color: '#fff' }}
                                                    >
                                                        {(portal.channels || []).map((ch) => (
                                                            <option key={ch._id} value={ch._id}>
                                                                #{ch.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div style={{ flex: 1 }}>
                                                    <label style={{ fontSize: '12px', color: '#a3a3a3', display: 'block', marginBottom: '6px' }}>Kontrol Aralığı</label>
                                                    <select
                                                        className="form-input"
                                                        value={editingBot.config?.intervalMinutes || 15}
                                                        onChange={(e) => setEditingBot({
                                                            ...editingBot,
                                                            config: { ...editingBot.config, intervalMinutes: Number(e.target.value) }
                                                        })}
                                                        style={{ width: '100%', background: '#0c0c0c', color: '#fff' }}
                                                    >
                                                        <option value={5}>5 dakikada bir</option>
                                                        <option value={10}>10 dakikada bir</option>
                                                        <option value={15}>15 dakikada bir</option>
                                                        <option value={30}>30 dakikada bir</option>
                                                        <option value={60}>1 saatte bir</option>
                                                        <option value={120}>2 saatte bir</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div>
                                                <label style={{ fontSize: '12px', color: '#a3a3a3', display: 'block', marginBottom: '6px' }}>Biyografi</label>
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    value={editingBot.profile?.bio || ''}
                                                    onChange={(e) => setEditingBot({
                                                        ...editingBot,
                                                        profile: { ...editingBot.profile, bio: e.target.value }
                                                    })}
                                                    style={{ width: '100%' }}
                                                />
                                            </div>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#e5e5e5', cursor: 'pointer' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={editingBot.config?.isActive !== false}
                                                        onChange={(e) => setEditingBot({
                                                            ...editingBot,
                                                            config: { ...editingBot.config, isActive: e.target.checked }
                                                        })}
                                                    />
                                                    <span>Bot Aktif (Otomatik Gönderi Paylaşsın)</span>
                                                </label>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#e5e5e5', cursor: 'pointer' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={editingBot.config?.autoTranslate !== false}
                                                        onChange={(e) => setEditingBot({
                                                            ...editingBot,
                                                            config: { ...editingBot.config, autoTranslate: e.target.checked }
                                                        })}
                                                    />
                                                    <span>Yabancı haberleri otomatik Türkçe'ye çevir</span>
                                                </label>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#e5e5e5', cursor: 'pointer' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={editingBot.config?.includeSourceLink !== false}
                                                        onChange={(e) => setEditingBot({
                                                            ...editingBot,
                                                            config: { ...editingBot.config, includeSourceLink: e.target.checked }
                                                        })}
                                                    />
                                                    <span>Gönderi altına orijinal kaynak linkini ekle</span>
                                                </label>
                                            </div>

                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                                                <button
                                                    type="button"
                                                    className="btn-modern-ghost"
                                                    onClick={() => setEditingBot(null)}
                                                    style={{ padding: '8px 16px', background: 'transparent', color: '#a3a3a3', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', cursor: 'pointer' }}
                                                >
                                                    İptal
                                                </button>
                                                <button
                                                    type="submit"
                                                    className="btn-modern-primary"
                                                    disabled={loading}
                                                    style={{ padding: '8px 20px', background: '#ffffff', color: '#090909', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                                                >
                                                    {loading ? 'Kaydediliyor...' : 'Kaydet'}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'live_rooms' && (
                        <div className="animate-fade-in live-rooms-settings-pane">
                            <h2 className="settings-title">Canlı Oda Ayarları</h2>
                            <p className="settings-desc">
                                Portal içindeki sesli kanallarda birlikte izleme ve canlı oda kurallarını yönetin.
                            </p>

                            <div className="live-rooms-card">
                                <div className="live-rooms-card-header">
                                    <h3 className="live-rooms-card-title">Birlikte İzleme Kapatma Onay Kuralı</h3>
                                    <p className="live-rooms-card-subtitle">
                                        Birlikte video izleme modu aktifken, videoyu kapatmak için gereken minimum katılımcı onay sayısını veya konsensüs şartını belirleyin.
                                    </p>
                                </div>

                                <div className="live-rooms-options-list">
                                    {[
                                        {
                                            id: 'all',
                                            title: 'Odadaki Tüm Katılımcıların Onayı (%100)',
                                            badge: 'Varsayılan',
                                            desc: 'Birlikte izlemenin kapatılması için o anda odadaki aktif tüm katılımcıların onayı istenir. Odadaki herkes onaylamadan video kapanmaz.'
                                        },
                                        {
                                            id: 'majority',
                                            title: 'Salt Çoğunluk (%50+)',
                                            badge: 'Demokratik',
                                            desc: 'Odadaki aktif kullanıcı sayısının yarısından fazlası (salt çoğunluk) onay verdiğinde video kapatılır.'
                                        },
                                        {
                                            id: '2',
                                            title: 'En Az 2 Kişi Onayı',
                                            badge: null,
                                            desc: 'Odada kaç kişi olursa olsun, kapatma işlemini başlatan dahil en az 2 kullanıcının onayı ile video kapatılır.'
                                        },
                                        {
                                            id: '3',
                                            title: 'En Az 3 Kişi Onayı',
                                            badge: null,
                                            desc: 'Odadaki katılımcılardan en az 3 kullanıcının onayı ile birlikte izleme sonlandırılır.'
                                        },
                                        {
                                            id: '4',
                                            title: 'En Az 4 Kişi Onayı',
                                            badge: null,
                                            desc: 'Kalabalık odalar için en az 4 kullanıcının onayı aranır.'
                                        },
                                        {
                                            id: '1',
                                            title: 'Doğrudan Kapatma (Tek Kişi)',
                                            badge: 'Onaysız',
                                            desc: 'Konsensüs aranmaz. Kapatma butonuna basan herhangi bir kullanıcı videoyu anında herkes için kapatabilir.'
                                        }
                                    ].map((option) => {
                                        const isSelected = (liveRoomSettings.watchPartyConsensusRule || 'all') === option.id;
                                        return (
                                            <div
                                                key={option.id}
                                                className={`live-rooms-option-row ${isSelected ? 'selected' : ''}`}
                                                onClick={() => setLiveRoomSettings(prev => ({
                                                    ...prev,
                                                    watchPartyConsensusRule: option.id
                                                }))}
                                            >
                                                <div className="live-rooms-radio-box">
                                                    <div className={`live-rooms-radio-inner ${isSelected ? 'active' : ''}`} />
                                                </div>
                                                <div className="live-rooms-option-content">
                                                    <div className="live-rooms-option-top">
                                                        <span className="live-rooms-option-label">{option.title}</span>
                                                        {option.badge && (
                                                            <span className="live-rooms-badge">{option.badge}</span>
                                                        )}
                                                    </div>
                                                    <p className="live-rooms-option-text">{option.desc}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="live-rooms-footer">
                                    <div className="live-rooms-status-area">
                                        {liveRoomSaveStatus === 'success' && (
                                            <span className="live-rooms-status success"> Değişiklikler başarıyla kaydedildi.</span>
                                        )}
                                        {liveRoomSaveStatus === 'error' && (
                                            <span className="live-rooms-status error"> Kaydedilirken hata oluştu.</span>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        className="live-rooms-submit-btn"
                                        onClick={handleSaveLiveRoomSettings}
                                        disabled={loading}
                                    >
                                        {loading ? 'KAYDEDİLİYOR...' : 'AYARLARI KAYDET'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Image Cropper Modal */}
            {
                cropperImage && (
                    <ImageCropper
                        image={cropperImage}
                        file={selectedFile}
                        portalId={portal._id}
                        mode={cropperMode}
                        onComplete={handleCropComplete}
                        onCancel={handleCropCancel}
                        title={cropperMode === 'avatar' ? 'Portal Logosu' : 'Portal Bannerı'}
                    />
                )
            }
        </div >
    );
};

export default PortalSettingsModal;
