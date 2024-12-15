import React, { useEffect } from 'react';
// import Translation from '../Translation/Translation';
import useTranslatedTextDisplay from '../hooks/useTranslatedTextDisplay';
import { useSelector } from 'react-redux';
import { isRTL } from '../utils/countriesConfig';

const TranslationOverlay = ({
  // detectedLanguage,
  // localTargetLanguage,
  setTranslatedTexts,
  socket,
  // callStarted,
}) => {
  const translationLanguage = useSelector(
    (state) => state.translation.localTranslationLanguage,
  );
  const languageDirection = isRTL(translationLanguage) ? 'rtl' : 'ltr';

  console.log('TranslationOverlay:', translationLanguage, languageDirection);

  const addOrUpdateTranslatedText = useTranslatedTextDisplay(
    setTranslatedTexts,
    languageDirection,
  );

  useEffect(() => {
    const handleTranslatedText = ({ text, isFinal }) => {
      console.log(' handleTranslatedText', isFinal);
      addOrUpdateTranslatedText(text, isFinal);
    };

    if (socket) {
      // Listen to translatedText events from the socket
      socket.on('translatedText', handleTranslatedText);
    }

    return () => {
      if (socket) {
        socket.off('translatedText', handleTranslatedText);
      }
    };
  }, [socket, setTranslatedTexts]);

  return <></>;
};

export default TranslationOverlay;
