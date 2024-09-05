export const translateText = async (text, targetLanguage) => {
  const response = await fetch(
    `https://translation.googleapis.com/language/translate/v2?key=`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `AIzaSyAZ0pSWf7xR8FOXhvyv96DqSwMmc9CcraM`,
      },
      body: JSON.stringify({
        q: text,
        target: targetLanguage,
      }),
    },
  );
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error.message);
  }
  return data.data.translations[0].translatedText;
};

export const detectLanguage = async (text) => {
  const response = await fetch(
    `https://translation.googleapis.com/language/translate/v2/detect?key=`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: text,
      }),
    },
  );

  const data = await response.json();
  if (data.error) {
    throw new Error(data.error.message);
  }

  return data.data.detections[0][0].language;
};

export const generateDeviceId = () => {
  let deviceId = localStorage.getItem('deviceId');
  if (!deviceId) {
    deviceId = 'device-' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('deviceId', deviceId);
  }
  return deviceId;
};
