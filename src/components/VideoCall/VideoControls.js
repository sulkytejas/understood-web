/* eslint-disable */
import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import {
  Box,
  BottomNavigation,
  BottomNavigationAction,
  Fab,
  styled,
  Typography,
  Menu,
  MenuItem,
  Avatar,
} from '@mui/material';
import { MoreVert, Check } from '@mui/icons-material';
import CallEndIcon from '@mui/icons-material/CallEnd';
import { useTranslation } from 'react-i18next';
import TranslatedTextView from './TranslatedText';
import { setLocalTranslationLanguage } from '../../redux/translationSlice';
import { setCallMenuOpen, setCallSideMenu } from '../../redux/uiSlice';
import SideMenu from './SideMenu';
import { ReactComponent as CurvedMenuBackground } from './assets/curved_menu.svg';
import { ReactComponent as CaptionIcon } from './assets/caption_icon.svg';
import { ReactComponent as MessageIcon } from './assets/message.svg';
import { ReactComponent as TranslationIcon } from './assets/translation_icon.svg';
import { useSocket } from '../context/SocketContext';

const CustomBottomNavigationAction = styled(BottomNavigationAction)({
  color: 'white',
  minWidth: '60px',
  padding: 0,
  flexGrow: 0,
  margin: '0 20px',
  // fontSize: '36 px',
  '&.Mui-selected': {
    backgroundColor: 'white',
    borderRadius: '50%',
    width: '60px',
    height: '60px',
    transition: 'all 0.3s ease',
    '& svg': {
      fill: '#008080',
    },
  },
  '&:hover': {
    backgroundColor: 'white',
    borderRadius: '50%',
    width: '60px',
    height: '60px',
    transition: 'all 0.3s ease',
    '& svg': {
      fill: '#008080',
      color: '#4abbc9',
    },
  },
});

const VideoControls = ({
  callStarted,
  onCallToggle,
  translatedTexts,
  setTranslatedTexts,
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [timeInSeconds, setTimeInSeconds] = useState(15 * 60);
  const [isMeetingEndingSoon, setIsMeetingEndingSoon] = useState(false);

  const isMainMenuOpen = useSelector((state) => state.ui.callMenuOpen);
  const isSideMenuOpen = useSelector((state) => state.ui.callSideMenu);
  const userTranslationLanguage = useSelector(
    (state) => state.translation.localTranslationLanguage,
  );
  const { t } = useTranslation();
  const { socket } = useSocket();

  const translationTextBoxRef = useRef(null);

  // Function to format the time as HH:MM:SS
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  };

  useEffect(() => {
    let timerInterval = null;
    if (callStarted) {
      timerInterval = setInterval(() => {
        setTimeInSeconds((prevTime) => {
          if (prevTime <= 0) {
            clearInterval(timerInterval);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }

    // Cleanup the interval when the component unmounts or connectionState changes
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, [callStarted]);

  useEffect(() => {
    const handleMeetingEndingSoon = ({ message }) => {
      if (message === 'meetingEndingSoon') {
        setIsMeetingEndingSoon(true);
      }
    };
    if (socket) {
      socket.on('meetingWarning', handleMeetingEndingSoon);
    }

    return () => {
      if (socket) {
        socket.off('meetingWarning', handleMeetingEndingSoon);
      }
    };
  }, [socket]);

  const langauges = [
    {
      language: t('Hindi'),
      languageCode: 'hi-IN',
      avatar: 'अ',
    },
    {
      language: t('Russian'),
      languageCode: 'ru-RU',
      avatar: 'Б',
    },
    {
      language: t('English'),
      languageCode: 'en-US',
      avatar: 'C',
    },
  ];

  const dispatch = useDispatch();
  const drawerContainerRef = useRef(null);

  const handleLanguageChange = (lang) => {
    handleClose();
    dispatch(setLocalTranslationLanguage(lang));
    localStorage.setItem('translationLanguagePreference', languageCode);
    socket.emit('setLanguagePreference', { languageCode: lang });
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const checkOverFlow = () => {
    const container = translationTextBoxRef.current;

    if (container) {
      if (container.scrollHeight > container.clientHeight) {
        setTranslatedTexts([]);
      }
    }
  };

  useEffect(() => {
    checkOverFlow();
  }, [translatedTexts]);

  return (
    <div className="video-chat-controls" ref={drawerContainerRef}>
      <SideMenu />
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
            {t('Select Language ')}
          </Typography>
        </MenuItem>
        {langauges.map((lang) => (
          <MenuItem
            key={lang.languageCode}
            value={lang.languageCode}
            onClick={() => handleLanguageChange(lang.languageCode)}
            sx={{
              fontSize: '12px',
              color:
                userTranslationLanguage === lang.languageCode
                  ? '#4abbc9'
                  : '#AFAFAF',
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
            {userTranslationLanguage === lang.languageCode && (
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
      {callStarted && (
        <Box
          display="flex"
          alignItems="center"
          bgcolor="rgb(116 110 110 / 78%)"
          color="white"
          borderRadius="50px"
          padding="5px 10px"
          bottom={isMainMenuOpen ? '240px' : '140px'}
          left="10px"
          position="absolute"
          border="1px solid #FF7722"
          sx={{
            animation: isMainMenuOpen
              ? 'moveUpTimer 0.5s ease-in-out forwards'
              : 'moveDownTimer 0.5s ease-in-out forwards',
          }}
        >
          <Typography variant="body1" style={{ marginLeft: '8px' }}>
            {isMeetingEndingSoon
              ? 'Meeting will end soon'
              : formatTime(timeInSeconds)}
          </Typography>
        </Box>
      )}

      <Box
        sx={{
          position: 'fixed',
          color: '#25293B',
          paddingTop: '10px',
          background: '#fff',
          borderRadius: '30px 30px 0 0',
          fontSize: '12px',
          textAlign: 'center',
          lineHeight: '18px',
          fontWeight: 500,
          height: 182,
          width: '100%',
          animation: isMainMenuOpen
            ? 'moveUp 0.2s ease-in-out forwards'
            : 'moveDown 0.2s ease-in-out forwards',
        }}
      >
        <Box
          ref={translationTextBoxRef}
          sx={{
            padding: '10px',
            height: '75px',
            overflow: 'hidden',
          }}
        >
          {!userTranslationLanguage &&
            t('Please select the language for translation')}
          {userTranslationLanguage && translatedTexts?.text?.length > 0 && (
            <TranslatedTextView translatedTexts={translatedTexts} />
          )}

          {userTranslationLanguage &&
            !translatedTexts?.text.length &&
            t('Translated text will appear here')}
        </Box>
      </Box>

      <Box
        sx={{
          position: 'absolute',
          top: '-44px' /* Adjust depending on the size of the circle */,
          left: '50%',
          transform: 'translateX(-50%)',
          borderRadius: '50%',
          width: '66px',
          height: '66px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Fab
          aria-label="end call"
          sx={{
            position: 'absolute',
            top: '0px',
            boxShadow: '0px 3px 10px rgba(0, 0, 0, 0.2)',
            width: '66px',
            height: '66px',
            backgroundColor: '#DF4303',
            color: '#fff',
          }}
          onClick={() => onCallToggle()}
        >
          <CallEndIcon />
        </Fab>
      </Box>

      <Box
        sx={{
          // backgroundColor: '#4abbc9',
          // color: 'white',
          // fontSize: '25px',
          // WebkitMaskImage:
          //   'radial-gradient(circle at top, transparent 40px, black 41px)',
          // width: '100%',
          // height: '92px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%', // Ensure the container takes full width
          height: '95px', // Set the desired height
          overflow: 'hidden',
        }}
      >
        <BottomNavigation
          showLabels
          sx={{
            backgroundColor: 'transparent',
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            height: '100%',
            top: '7px',
            position: 'absolute',
            zIndex: 1,
            width: '100%',
            justifyContent: 'space-around',
          }}
        >
          <CustomBottomNavigationAction
            icon={<CaptionIcon sx={{ fontSize: 36 }} />}
            onClick={() => {
              dispatch(setCallMenuOpen(!isMainMenuOpen));

              if (isSideMenuOpen) {
                dispatch(setCallSideMenu(false));
              }
            }}
          />

          <CustomBottomNavigationAction
            icon={<TranslationIcon sx={{ fontSize: 36 }} />}
            onClick={(event) => setAnchorEl(event.currentTarget)}
          />

          <CustomBottomNavigationAction
            icon={<MessageIcon sx={{ fontSize: 36, marginLeft: 3 }} />}
            sx={{ color: 'white' }}
          />
          <CustomBottomNavigationAction
            icon={<MoreVert sx={{ fontSize: 36 }} />}
          />
        </BottomNavigation>
        <CurvedMenuBackground
          style={{
            position: 'relative',
            bottom: 0,
            left: 0,
            preserveAspectRatio: 'none',
            width: '100%', // Full width
            height: '100%', // Adjust the height to match your design
          }}
        />
      </Box>
    </div>

    // </div>
  );
};

export default VideoControls;
