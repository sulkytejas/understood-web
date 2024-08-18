import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { generateDeviceId } from '../utils/peerConnectionUtils';

const SocketContext = createContext();

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io('http://localhost:5001');
    newSocket.on('connect', () => {
      const deviceId = generateDeviceId();
      newSocket.emit('registerDevice', deviceId);
      console.log('Connected to server with socket ID:', newSocket.id);
      setSocket(newSocket); // Set the socket after connection
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};
