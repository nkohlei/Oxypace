import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useGlobalStore = create(
    persist(
        (set, get) => ({
            unreadPostsByPortal: {}, // { [portalId]: [postId1, postId2, ...] }
            isMuted: true, // Default to muted for better initial experience
            usersCache: {},

            setIsMuted: (val) => set({ isMuted: val }),

            addUnreadPost: (portalId, postId) => set((state) => {
                const currentUnread = state.unreadPostsByPortal[portalId] || [];
                if (currentUnread.includes(postId)) return state;
                return {
                    unreadPostsByPortal: {
                        ...state.unreadPostsByPortal,
                        [portalId]: [...currentUnread, postId]
                    }
                };
            }),

            removeUnreadPost: (postId) => set((state) => {
                const newUnread = { ...state.unreadPostsByPortal };
                let modified = false;
                
                Object.keys(newUnread).forEach(portalId => {
                    if (newUnread[portalId].includes(postId)) {
                        newUnread[portalId] = newUnread[portalId].filter(id => id !== postId);
                        if (newUnread[portalId].length === 0) {
                            delete newUnread[portalId];
                        }
                        modified = true;
                    }
                });

                return modified ? { unreadPostsByPortal: newUnread } : state;
            }),

            clearUnreadForPortal: (portalId) => set((state) => {
                const newUnread = { ...state.unreadPostsByPortal };
                delete newUnread[portalId];
                return { unreadPostsByPortal: newUnread };
            }),

            // Auth State
            currentUser: null,
            setCurrentUser: (user) => set({ currentUser: user }),

            setPosts: (updater) => set((state) => ({
                posts: typeof updater === 'function' ? updater(state.posts) : updater
            })),

            addPostEvent: (newPost) => set((state) => {
                if (state.posts.some(p => p._id === newPost._id)) return state;
                return { posts: [newPost, ...state.posts] };
            }),

            updatePostEvent: (updatedPost) => set((state) => ({
                posts: state.posts.map(post => post._id === updatedPost._id ? updatedPost : post)
            })),

            deletePostEvent: (postId) => {
                const state = get();
                // Ensure the post is also removed from unread tracking
                state.removeUnreadPost(postId);
                
                set((state) => ({
                    posts: state.posts.filter(post => post._id !== postId)
                }));
            },

            updateUserEvent: (userId, fullDocument) => set((state) => ({
                usersCache: { ...state.usersCache, [userId]: { ...state.usersCache[userId], ...fullDocument } }
            }))
        }),
        {
            name: 'global-storage', // unique name for localStorage
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({ 
                unreadPostsByPortal: state.unreadPostsByPortal,
                isMuted: state.isMuted
            }), // Only persist notifications and mute preference
        }
    )
);
