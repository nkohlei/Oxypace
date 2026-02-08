import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within SocketProvider');
    }
    return context;
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [connected, setConnected] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const { user, isAuthenticated } = useAuth();

    useEffect(() => {
        if (isAuthenticated && user) {
            // Determine Socket URL
            let socketUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

            // Remove '/api' suffix if present, as Socket.io connects to root
            if (socketUrl.endsWith('/api')) {
                socketUrl = socketUrl.slice(0, -4);
            }
            if (socketUrl.endsWith('/')) {
                socketUrl = socketUrl.slice(0, -1);
            }

            console.log('Connecting to socket:', socketUrl);

            const newSocket = io(socketUrl, {
                transports: ['websocket'],
                // Add secure option for https
                secure: true,
            });

            newSocket.on('connect', () => {
                console.log('✅ Socket connected');
                setConnected(true);
                newSocket.emit('join', user._id);
            });

            newSocket.on('getOnlineUsers', (users) => {
                setOnlineUsers(users);
            });

            newSocket.on('disconnect', () => {
                console.log('❌ Socket disconnected');
                setConnected(false);
            });

            setSocket(newSocket);

            return () => {
                newSocket.close();
            };
        }
    }, [isAuthenticated, user]);

    const value = {
        socket,
        connected,
        onlineUsers,
    };

    return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};
