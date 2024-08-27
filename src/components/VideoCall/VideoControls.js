/* eslint-disable */
import React, { useState, useRef } from 'react';
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
  Drawer,
  Backdrop,
  Avatar,
} from '@mui/material';
import { Home, Translate, Chat, MoreVert } from '@mui/icons-material';
import CallEndIcon from '@mui/icons-material/CallEnd';

import TranslatedTextView from './TranslatedText';
import { setLocalTranslationLanguage } from '../../redux/translationSlice';
import { setCallMenuOpen, setCallSideMenu } from '../../redux/uiSlice';
import SideMenu from './SideMenu';
import { color } from '@mui/system';

const CustomBottomNavigationAction = styled(BottomNavigationAction)({
  color: 'white',
  '&:hover': {
    color: 'secondary.light',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
});

const VideoControls = ({
  callStarted,
  localTargetLanguage,
  setLocalTargetLanguage,
  onCallToggle,
  translatedTexts,
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const isMainMenuOpen = useSelector((state) => state.ui.callMenuOpen);
  const isSideMenuOpen = useSelector((state) => state.ui.callSideMenu);
  const dispatch = useDispatch();
  const drawerContainerRef = useRef(null);

  const handleLanguageChange = (lang) => {
    setLocalTargetLanguage(lang);
    handleClose();
    dispatch(setLocalTranslationLanguage(lang));
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    // <div className="video-chat-controls">
    //   <div className={`control-icons ${callStarted && 'call-connected'}`}>
    //     <IconButton onClick={(event) => setAnchorEl(event.currentTarget)}>
    //       {localTargetLanguage ? localTargetLanguage : <Translate />}
    //     </IconButton>
    //     <Menu
    //       anchorEl={anchorEl}
    //       open={Boolean(anchorEl)}
    //       onClose={handleClose}
    //     >
    //       <MenuItem value="en" onClick={() => handleLanguageChange('en')}>
    //         English
    //       </MenuItem>
    //       <MenuItem value="ru" onClick={() => handleLanguageChange('ru')}>
    //         Russian
    //       </MenuItem>
    //       <MenuItem value="hi" onClick={() => handleLanguageChange('hi')}>
    //         Hindi
    //       </MenuItem>
    //     </Menu>
    //     {/* <IconButton><Mic /></IconButton> */}

    //     {/* <IconButton><Chat /></IconButton> */}
    //     <IconButton
    //       onClick={() => onCallToggle()}
    //       // disabled = {!!userRole && !connected || callStarted}
    //     >
    //       <Phone style={{ color: !callStarted ? 'green' : 'red' }} />
    //     </IconButton>
    //     <IconButton>
    //       <Cancel />
    //     </IconButton>
    //   </div>
    // </div>
    // <div className="video-chat-controls">

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
            Select Language
          </Typography>
        </MenuItem>
        <MenuItem
          value="en"
          onClick={() => handleLanguageChange('en')}
          sx={{
            fontSize: '12px',
            color: '#AFAFAF',
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
            U
          </Avatar>
          English
        </MenuItem>
        <MenuItem
          value="ru"
          onClick={() => handleLanguageChange('ru')}
          sx={{
            fontSize: '12px',
            color: '#AFAFAF',
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
            п
          </Avatar>
          Russian
        </MenuItem>
        <MenuItem
          value="hi"
          onClick={() => handleLanguageChange('hi')}
          sx={{
            fontSize: '12px',
            color: '#AFAFAF',
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
            अ
          </Avatar>
          Hindi
        </MenuItem>
      </Menu>
      {callStarted && (
        <Box
          display="flex"
          alignItems="center"
          bgcolor="rgb(116 110 110 / 78%)"
          color="white"
          borderRadius="50px"
          padding="5px 10px"
          bottom="100px"
          left="10px"
          position="absolute"
          border="1px solid #FF7722"
        >
          <Typography variant="body1" style={{ marginLeft: '8px' }}>
            00:47:47
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
          height: 182,
          width: '100%',
          animation: isMainMenuOpen
            ? 'moveUp 0.2s ease-in-out forwards'
            : 'moveDown 0.2s ease-in-out forwards',
        }}
      >
        <Typography>
          <TranslatedTextView translatedTexts={translatedTexts} />
        </Typography>
      </Box>

      <Box
        sx={{
          position: 'absolute',
          top: '-30px' /* Adjust depending on the size of the circle */,
          left: '50%',
          transform: 'translateX(-50%)',
          borderRadius: '50%',
          width: '60px',
          height: '60px',
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
            width: '60px',
            height: '60px',
            backgroundColor: '#FF7722',
            color: '#fff',
          }}
          onClick={() => onCallToggle()}
        >
          <CallEndIcon />
        </Fab>
      </Box>
      {/* <Box
          sx={{
            position: 'absolute',
            width: 19,
            height: 20,
            backgroundColor: 'transparent',
            transform: 'translateY(-38%)',
            borderRadius: '30%',
            '&::before': {
              content: '""',
              position: 'absolute',
              right: '-216px',
              bottom: 26,
              width: 186,
              height: 25,
              transform: 'rotate(180deg)',
              backgroundColor: '#4abcc9', // Light gray color for the notch
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 15,
              boxShadow: '0 10px 20px rgba(0, 0, 0, 0.2)', // Optional: Shadow effect
              zIndex: 1,
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              left: '-216px',
              bottom: 26,
              width: 186,
              height: 25,
              transform: 'rotate(180deg)',
              backgroundColor: '#4abcc9', // Light gray color for the notch
              borderBottomLeftRadius: 15,
              borderBottomRightRadius: 0,
              boxShadow: '0 10px 20px rgba(0, 0, 0, 0.2)', // Optional: Shadow effect
              zIndex: 1,
            },
          }}
        /> */}
      <Box
        sx={{
          backgroundColor: '#4abbc9',
          color: 'white',
          fontSize: '25px',
          WebkitMaskImage:
            'radial-gradient(circle at top, transparent 40px, black 41px)',
          width: '100%',
          height: '92px',
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
            marginTop: '10px',
          }}
        >
          <Box
            sx={{
              display: 'inline-flex', // Prevents the button from taking full width
              justifyContent: 'center',
              alignItems: 'center',
              width: 'auto',
            }}
          >
            <BottomNavigationAction
              icon={<Translate sx={{ fontSize: 36 }} />}
              sx={{
                color: '#fff',
                '&.Mui-selected': {
                  color: '#4db7c4', // Adjust icon color when selected
                  backgroundColor: 'white', // Circle background color
                  borderRadius: '50%', // Make the background circular
                  padding: '8px', // Add padding for a larger circle
                  boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.25)', // Optiona
                },
                '&:hover': {
                  color: '#4db7c4', // Adjust icon color when selected
                  backgroundColor: 'white', // Circle background color
                  borderRadius: '50%', // Make the background circular
                  padding: '8px', // Add padding for a larger circle
                  boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.25)', // Optiona
                },
              }}
              onClick={() => {
                dispatch(setCallMenuOpen(!isMainMenuOpen));

                if (isSideMenuOpen) {
                  dispatch(setCallSideMenu(false));
                }
              }}
            />
          </Box>

          <BottomNavigationAction
            icon={<Home sx={{ fontSize: 36 }} />}
            sx={{ color: 'white' }}
            onClick={(event) => setAnchorEl(event.currentTarget)}
          />

          <BottomNavigationAction
            icon={<Chat sx={{ fontSize: 36, marginLeft: 3 }} />}
            sx={{ color: 'white' }}
          />
          <BottomNavigationAction
            icon={<MoreVert sx={{ fontSize: 36 }} />}
            sx={{ color: 'white' }}
          />
        </BottomNavigation>
      </Box>
    </div>

    // </div>
  );
};

export default VideoControls;
