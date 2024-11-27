import React, { useEffect } from 'react';
// import Translation from '../Translation/Translation';
import useTranslatedTextDisplay from '../hooks/useTranslatedTextDisplay';
// import { addOrUpdateTranslatedText } from '../utils/peerConnectionUtils';

const TranslationOverlay = ({
  // detectedLanguage,
  // localTargetLanguage,
  setTranslatedTexts,
  socket,
  // callStarted,
}) => {
  const addOrUpdateTranslatedText =
    useTranslatedTextDisplay(setTranslatedTexts);

  useEffect(() => {
    const handleTranslatedText = ({ text, isFinal }) => {
      console.log(' handleTranslatedText', isFinal);
      addOrUpdateTranslatedText(text, isFinal);
    };

    // Listen to translatedText events from the socket
    socket.on('translatedText', handleTranslatedText);

    return () => {
      socket.off('translatedText', handleTranslatedText);
    };
  }, [socket, setTranslatedTexts]);

  return <></>;
};

export default TranslationOverlay;
