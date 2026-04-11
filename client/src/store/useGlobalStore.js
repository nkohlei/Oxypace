import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useGlobalStore = create(
    persist(
        (set, get) => ({
            posts: [],
            unreadPostsByPortal: {}, // { [portalId]: [postId1, postId2, ...] }
            unreadPostsByChannel: {}, // { [channelId]: [postId1, postId2, ...] }
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

            addUnreadChannelPost: (channelId, postId) => set((state) => {
                const currentUnread = state.unreadPostsByChannel[channelId] || [];
                if (currentUnread.includes(postId)) return state;
                return {
                    unreadPostsByChannel: {
                        ...state.unreadPostsByChannel,
                        [channelId]: [...currentUnread, postId]
                    }
                };
            }),

            removeUnreadPost: (postId) => set((state) => {
                const newState = {
                    unreadPostsByPortal: { ...state.unreadPostsByPortal },
                    unreadPostsByChannel: { ...state.unreadPostsByChannel }
                };
                let modified = false;
                
                // Clear from portals
                Object.keys(newState.unreadPostsByPortal).forEach(portalId => {
                    if (newState.unreadPostsByPortal[portalId].includes(postId)) {
                        newState.unreadPostsByPortal[portalId] = newState.unreadPostsByPortal[portalId].filter(id => id !== postId);
                        if (newState.unreadPostsByPortal[portalId].length === 0) {
                            delete newState.unreadPostsByPortal[portalId];
                        }
                        modified = true;
                    }
                });

                // Clear from channels
                Object.keys(newState.unreadPostsByChannel).forEach(channelId => {
                    if (newState.unreadPostsByChannel[channelId].includes(postId)) {
                        newState.unreadPostsByChannel[channelId] = newState.unreadPostsByChannel[channelId].filter(id => id !== postId);
                        if (newState.unreadPostsByChannel[channelId].length === 0) {
                            delete newState.unreadPostsByChannel[channelId];
                        }
                        modified = true;
                    }
                });

                return modified ? newState : state;
            }),

            clearUnreadForPortal: (portalId) => set((state) => {
                const newUnread = { ...state.unreadPostsByPortal };
                delete newUnread[portalId];
                return { unreadPostsByPortal: newUnread };
            }),

            clearUnreadForChannel: (channelId) => set((state) => {
                const newUnread = { ...state.unreadPostsByChannel };
                delete newUnread[channelId];
                return { unreadPostsByChannel: newUnread };
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
                unreadPostsByChannel: state.unreadPostsByChannel,
                isMuted: state.isMuted
            }), // Persist all unread lists and mute preference
        }
    )
);
