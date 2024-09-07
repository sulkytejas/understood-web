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

  useEffect(() => {
    // Get raw text from other person
    socket.off('speakerText');

    socket.on('speakerText', (text, isFinal, id) => {
      socket.emit('translateText', text, localTargetLanguage, isFinal, id);
    });

    return () => {
      socket.off('speakerText');
    };
  }, [localTargetLanguage]);

  return (
    <Translation
      socket={socket} // Pass the socket object here
      detectedLanguage={detectedLanguage}
      targetLanguage={localTargetLanguage}
    />
  );
};

export default TranslationOverlay;
