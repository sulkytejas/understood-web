import io from 'socket.io-client';

export const initializeSocket = ({ handleOffer, handleAnswer, setUserRole, onDisconnect }) => {
    const socket = io('http://localhost:5001');

    socket.on('connect', () => {
        const deviceId = localStorage.getItem('deviceId') || 'device-' + Math.random().toString(36).substr(2, 9);
        socket.emit('registerDevice', deviceId);
    });

    socket.on('roleAssignment', (role) => setUserRole(role));
    socket.on('offer', handleOffer);
    socket.on('answer', handleAnswer);

    socket.on('disconnect', () => {
        onDisconnect();
    });

    return socket;
};

export const handleDisconnectCall = (peerConnection, localVideoRef, remoteVideoRef, setCallStarted, socket) => {
    if (peerConnection.current) {
        peerConnection.current.close();
    }

    if (localVideoRef.current && localVideoRef.current.srcObject) {
        localVideoRef.current.srcObject.getTracks().forEach((track) => track.stop());
        localVideoRef.current.srcObject = null;
    }

    if (remoteVideoRef.current && remoteVideoRef.current.srcObject) {
        remoteVideoRef.current.srcObject.getTracks().forEach((track) => track.stop());
        remoteVideoRef.current.srcObject = null;
    }

    setCallStarted(false);

    if (socket) {
        socket.disconnect();
    }
};
