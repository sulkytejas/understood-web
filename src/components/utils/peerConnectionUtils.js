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

export const isBrowserSupportingL3T3 = () => {
  const ua = navigator.userAgent;

  // Check if the browser is Chrome or Chromium-based
  const isChrome = /Chrome/.test(ua) && /Google Inc/.test(navigator.vendor);
  const chromeVersionMatch = ua.match(/Chrome\/(\d+)/);
  const chromeVersion = chromeVersionMatch
    ? parseInt(chromeVersionMatch[1], 10)
    : 0;

  // Check if the browser is Edge (Chromium-based versions)
  const isEdge = /Edg/.test(ua);

  // Chrome/Chromium version 86+ supports VP9 SVC with L3T3, so we check for this
  if ((isChrome && chromeVersion >= 86) || isEdge) {
    return true; // Supports L3T3
  }

  return false; // Doesn't support L3T3
};

// Example usage
if (!isBrowserSupportingL3T3()) {
  console.log('The browser does not support L3T3 for VP9 SVC.');
  // Fallback to another scalability mode or codec
}
