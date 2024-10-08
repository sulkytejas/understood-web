import React, { useEffect } from 'react';
import Translation from '../Translation/Translation';
import { addOrUpdateTranslatedText } from '../utils/peerConnectionUtils';

const TranslationOverlay = ({
  detectedLanguage,
  localTargetLanguage,
  setTranslatedTexts,
  socket,
}) => {
  useEffect(() => {
    socket.on('translatedText', ({ text, id, isFinal }) => {
      addOrUpdateTranslatedText(id, text, isFinal, setTranslatedTexts);
    });

    return () => {
      socket.off('translatedText');
    };
  }, []);

  return (
    <Translation
      socket={socket} // Pass the socket object here
      detectedLanguage={detectedLanguage}
      targetLanguage={localTargetLanguage}
    />
  );
};

export default TranslationOverlay;
