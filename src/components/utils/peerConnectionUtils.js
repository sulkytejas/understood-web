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

    if (newTexts.length > 1) {
      newTexts.shift(); // Remove the oldest text if there are more than 3
    }

    return newTexts;
  });
};
