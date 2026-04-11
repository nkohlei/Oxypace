import { create } from 'zustand';

export const useGlobalStore = create((set) => ({
    posts: [],
    unreadCounts: {}, // { [portalId]: number }
    usersCache: {},

    incrementUnreadCount: (portalId) => set((state) => ({
        unreadCounts: {
            ...state.unreadCounts,
            [portalId]: (state.unreadCounts[portalId] || 0) + 1
        }
    })),

    clearUnreadCount: (portalId) => set((state) => {
        const newCounts = { ...state.unreadCounts };
        delete newCounts[portalId];
        return { unreadCounts: newCounts };
    }),

    // Auth State (if we need to sync it later, optional but good for context)
    currentUser: null,
    setCurrentUser: (user) => set({ currentUser: user }),

    setPosts: (updater) => set((state) => ({
        posts: typeof updater === 'function' ? updater(state.posts) : updater
    })),

    addPostEvent: (newPost) => set((state) => {
        // Prevent duplicate posts if already in state
        if (state.posts.some(p => p._id === newPost._id)) return state;
        return { posts: [newPost, ...state.posts] };
    }),

    updatePostEvent: (updatedPost) => set((state) => ({
        posts: state.posts.map(post => post._id === updatedPost._id ? updatedPost : post)
    })),

    deletePostEvent: (postId) => set((state) => ({
        posts: state.posts.filter(post => post._id !== postId)
    })),

    updateUserEvent: (userId, fullDocument) => set((state) => ({
        usersCache: { ...state.usersCache, [userId]: { ...state.usersCache[userId], ...fullDocument } }
    }))
}));
