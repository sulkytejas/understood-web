import io from 'socket.io-client';

export const initializeSocket = ({
  handleOffer,
  handleAnswer,
  setUserRole,
  onDisconnect,
}) => {
  const socket = io('http://localhost:5001');

  socket.on('connect', () => {
    const deviceId =
      localStorage.getItem('deviceId') ||
      'device-' + Math.random().toString(36).substr(2, 9);
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

export const generateDeviceId = () => {
  let deviceId = localStorage.getItem('deviceId');
  if (!deviceId) {
    deviceId = 'device-' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('deviceId', deviceId);
  }
  return deviceId;
};

export const addOrUpdateTranslatedText = (
  id,
  text,
  isFinal,
  setTranslatedTexts,
) => {
  setTranslatedTexts((prev) => {
    const index = prev.findIndex((item) => item.id === id);
    const newTexts = [...prev];

    if (index !== -1) {
      newTexts[index] = { ...newTexts[index], text, isFinal };
    } else {
      newTexts.push({ id, text, isFinal });
    }

    if (newTexts.length > 2) {
      newTexts.shift(); // Remove the oldest text if there are more than 3
    }

    return newTexts;
  });
};
