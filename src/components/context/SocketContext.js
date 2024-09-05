import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { generateDeviceId } from '../utils/peerConnectionUtils';

const SocketContext = createContext();

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isSocketConnected, setSocketIsConnected] = useState(false);

  useEffect(() => {
    const newSocket = io('http://localhost:5001');
    newSocket.on('connect', () => {
      const deviceId = generateDeviceId();
      newSocket.emit('registerDevice', deviceId);
      console.log('Connected to server with socket ID:', newSocket.id);
      setSocket(newSocket); // Set the socket after connection
      setSocketIsConnected(true);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isSocketConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
