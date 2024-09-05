import useTranslation from '../hooks/useTranslation';
// import './Translation.module.css';

const Translation = ({ detectedLanguage, socket, targetLanguage }) => {
  useTranslation({ detectedLanguage, socket, targetLanguage });

  return null;
};

export default Translation;
