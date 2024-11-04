import { useRef, useEffect, useState } from 'react';
import { styled } from '@mui/material/styles';
import logoIcon from '../assets/logo_black.png';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import { Typography, Fab, Menu, MenuItem, Avatar, Button } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAudioTranscription } from '../context/AudioTranscriptionContext';
import { useSocket } from '../context/SocketContext';
import useTranslatedTextDisplay from '../hooks/useTranslatedTextDisplay';
import TranslatedTextView from '../VideoCall/TranslatedText';
// import { trackFace } from '../utils/tensorFlowUtils';
import Check from '@mui/icons-material/Check';

const Item = styled(Paper)(() => ({
  backgroundColor: '#fff',
  boxShadow: 'none',
  textAlign: 'center',
}));

const TranslationDropDown = ({ socket }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('en-US'); // Default selected language
  const { t } = useTranslation();

  const languages = [
    {
      code: 'IN',
      languageCode: 'hi-IN',
      language: t('Hindi'),
      avatar: 'अ',
    },
    {
      code: 'RU',
      languageCode: 'ru-RU',
      language: t('Russian'),
      avatar: 'Б',
    },
    {
      code: 'US',
      languageCode: 'en-US',
      language: t('English'),
      avatar: 'C',
    },
  ];

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageChange = (languageCode) => {
    setSelectedLanguage(languageCode);
    socket.emit('changeLanguagePracticeMode', languageCode);
    handleClose(); // Close the menu after selection
  };

  const selectedLang = languages.find(
    (lang) => lang.languageCode === selectedLanguage,
  );

  return (
    <div>
      {/* Button that displays the selected language's avatar and name */}
      <Button
        variant="outlined"
        onClick={handleClick}
        sx={{ textTransform: 'none', display: 'flex', alignItems: 'center' }}
      >
        <img
          loading="lazy"
          src={`https://flagcdn.com/w20/${selectedLang?.code.toLowerCase()}.png`}
          srcSet={`https://flagcdn.com/w40/${selectedLang?.code.toLowerCase()}.png 2x`}
          alt={selectedLang?.name}
          style={{ width: 24, height: 24, marginRight: 8 }}
        />
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        sx={{
          fontSize: '12px',
        }}
      >
        <MenuItem
          disabled
          key="title_side_menu"
          sx={{
            '&.Mui-disabled': {
              opacity: 1,
              padding: 0,
              fontSize: 14,
            },
          }}
        >
          <Typography
            sx={{
              fontSize: 14,
              color: '#4abbc9',
              padding: '3px 10px 5px 10px',
              borderBottom: '1px solid #d9d9d9',
              fontWeight: 500,
            }}
          >
            {t('Select Language')}
          </Typography>
        </MenuItem>

        {languages.map((lang) => (
          <MenuItem
            key={lang.languageCode}
            value={lang.languageCode}
            onClick={() => handleLanguageChange(lang.languageCode)}
            sx={{
              fontSize: '12px',
              color:
                selectedLanguage === lang.languageCode ? '#4abbc9' : '#AFAFAF',
            }}
          >
            <Avatar
              sx={{
                bgcolor: '#4abbc9',
                color: '#fff',
                height: 20,
                width: 20,
                marginRight: 3,
              }}
            >
              {lang.avatar}
            </Avatar>
            {lang.language}
            {selectedLanguage === lang.languageCode && (
              <Check
                sx={{
                  height: '20px',
                  width: '18px',
                  marginLeft: '10px',
                }}
              />
            )}
          </MenuItem>
        ))}
      </Menu>
    </div>
  );
};

const PracticeMain = () => {
  const videoRef = useRef(null);
  const { startAudioStream, stopAudioStream } = useAudioTranscription();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [translatedText, setTranslatedText] = useState('');

  const addOrUpdateTranslatedText = useTranslatedTextDisplay(setTranslatedText);

  const addOrUpdateTranscripts = useTranslatedTextDisplay(setText);

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({
        video: true,
        audio: true,
      })
      .then(async (stream) => {
        videoRef.current.srcObject = stream;
        await startAudioStream(stream);
      });

    return () => {
      stopAudioStream();
    };
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('practiceModeTranscription', ({ text, isFinal }) => {
        addOrUpdateTranscripts(text, isFinal);
      });

      socket.on('practiceModeTranslatedText', ({ text, isFinal }) => {
        addOrUpdateTranslatedText(text, isFinal);
      });
    }

    return () => {
      socket.off('practiceModeTranscription');
      socket.off('practiceModeTranslatedTex');
    };
  }, [socket]);

  const handleDisconnect = () => {
    // Stop video and audio streams
    const stream = videoRef.current?.srcObject;
    if (stream && stream.getTracks) {
      stream.getTracks().forEach((track) => track.stop()); // Stop all tracks (audio and video)
      videoRef.current.srcObject = null; // Clear the video reference
    }

    // Stop audio transcription
    stopAudioStream();

    // Remove socket listeners
    if (socket) {
      socket.emit('disconnect-practice-mode');
      socket.off('practiceModeTranscription');
      socket.off('practiceModeTranslatedText');
    }

    // Optionally reset the component state if needed
    setText('');
    setTranslatedText('');

    navigate('/login', { state: { fromMeetingEnded: false } });
    window.location.reload();
    // Additional cleanup logic if needed
    console.log('Disconnected and cleaned up');
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        width: '100%',
        height: '100vh',
      }}
    >
      <Box sx={{ width: '50%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ height: '45%' }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              padding: 2,
              height: '16%',
            }}
          >
            <img style={{ width: 40, height: 40 }} src={logoIcon} />
            <Typography variant="h4">
              {/* Adjust size as needed */}
              Vibe
            </Typography>
          </Box>

          <Item sx={{ height: '84%', backgroundColor: '#000', color: '#fff' }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                zIndex: 1,
                transition: 'transform 0.5s ease, top 0.5s',
              }}
            />
          </Item>
        </Box>
        <Box sx={{ height: '55%' }}>
          <Item
            sx={{
              height: '100%',
              backgroundColor: '#c2eef3',
            }}
          >
            <div>
              <Typography variant="h4"> Your speech</Typography>
            </div>

            <TranslatedTextView translatedTexts={text} />
          </Item>
        </Box>
      </Box>
      <Box sx={{ width: '50%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ height: '65%' }}>
          <Item
            sx={{
              height: '100%',
              backgroundColor: '#f3c1ad',
            }}
          >
            <div>
              <Typography variant="h4"> Translations</Typography>
              <TranslationDropDown socket={socket} />
            </div>

            <TranslatedTextView translatedTexts={translatedText} />
          </Item>
        </Box>
        <Box sx={{ height: '35%' }}>
          <Item sx={{ height: '100%', backgroundColor: '#f7f5c8' }}>
            {' '}
            <Typography variant="h5"> Pronounciation Detector</Typography>
            <Typography sx={{ color: '#a9a9a9' }}>
              {' '}
              Coming Early 2025
            </Typography>
          </Item>
        </Box>
      </Box>
      <Fab
        color="secondary"
        aria-label="disconnect"
        onClick={handleDisconnect}
        sx={{
          position: 'fixed',
          bottom: 16,
          right: '45%',
          zIndex: 1000,
          bgcolor: '#ff5252', // Background color for the button
          '&:hover': { bgcolor: '#ff0000' }, // Darker color on hover
        }}
      >
        <CloseIcon />
      </Fab>
    </Box>
  );
};

export default PracticeMain;
