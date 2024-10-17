import useTranslation from '../hooks/useTranslation';
// import './Translation.module.css';

const Translation = ({
  detectedLanguage,
  socket,
  targetLanguage,
  callStarted,
}) => {
  console.log(callStarted, 'callStarted');
  useTranslation({ detectedLanguage, socket, targetLanguage, callStarted });

  return null;
};

export default Translation;
