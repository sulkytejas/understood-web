import React from 'react';
import useTranslation from '../hooks/useTranslation';
// import './Translation.module.css';

const Translation = ({ role, detectedLanguage, socket, targetLanguage }) => {
  useTranslation({ role, detectedLanguage, socket, targetLanguage });

  return null;
};

export default Translation;
