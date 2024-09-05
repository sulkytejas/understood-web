import React from 'react';
import Translation from '../Translation/Translation';

const TranslationOverlay = ({
  detectedLanguage,
  localTargetLanguage,

  socket,
}) => {
  return (
    <Translation
      socket={socket} // Pass the socket object here
      detectedLanguage={detectedLanguage}
      targetLanguage={localTargetLanguage}
    />
  );
};

export default TranslationOverlay;
