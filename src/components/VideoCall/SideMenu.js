import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box,
  //   IconButton,
  //   Fab,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Typography,
  Modal,
  MenuItem,
  Tooltip,
} from '@mui/material';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import VideocamOffOutlinedIcon from '@mui/icons-material/VideocamOffOutlined'; //
import VideocamOutlinedIcon from '@mui/icons-material/VideocamOutlined';
import MicOffOutlinedIcon from '@mui/icons-material/MicOffOutlined';
import MicNoneOutlinedIcon from '@mui/icons-material/MicNoneOutlined';
import ExpandLessOutlinedIcon from '@mui/icons-material/ExpandLessOutlined';
import BluetoothAudioIcon from '@mui/icons-material/BluetoothAudio';

// import { useTranslation } from 'react-i18next';

import { setCallMenuOpen, setCallSideMenu } from '../../redux/uiSlice';
import { setVideoPause, setAudioPause } from '../../redux/videoPlayerSlice';

const SideMenu = () => {
  const dispatch = useDispatch();
  const isMainMenuOpen = useSelector((state) => state.ui.callMenuOpen);
  const isSideMenuOpen = useSelector((state) => state.ui.callSideMenu);
  const isVideoPaused = useSelector((state) => state.videoPlayer.videoPause);
  const isAudioPaused = useSelector((state) => state.videoPlayer.audioPause);

  const [openModal, setOpenModal] = useState(false);
  const [openTooltip, setOpenTooltip] = useState(true);

  // const { t } = useTranslation();

  // console.log(t);

  // // Fetch available audio output devices
  // useEffect(() => {
  //   navigator.mediaDevices.enumerateDevices().then((devices) => {
  //     const outputs = devices.filter((device) => device.kind === 'audiooutput');
  //     setAudioOutputs(outputs);
  //   });
  // }, []);

  const actions = [
    {
      icon: !isVideoPaused ? (
        <VideocamOutlinedIcon
          sx={{
            color: '#4abbc9', // Makes the inside of the icon transparent
            // '&:hover': {
            //   color: 'white', // Optional: Changes to white on hover
            // },
            // stroke: '#4abbc9', // Sets the border color of the icon
            // // strokeWidth: 1.5, // Adjust the border thickness
          }}
        />
      ) : (
        <VideocamOffOutlinedIcon
          sx={{
            color: '#4abbc9', // Makes the inside of the icon transparent
            // '&:hover': {
            //   color: 'white', // Optional: Changes to white on hover
            // },
            // stroke: '#4abbc9', // Sets the border color of the icon
            // // strokeWidth: 1.5, // Adjust the border thickness
          }}
        />
      ),
      name: isVideoPaused ? 'Video Off' : 'Video On',
      clickEvent: () => {
        console.log('clicked video cams');
        dispatch(setVideoPause(!isVideoPaused));
      },
    },
    {
      icon: isAudioPaused ? (
        <MicOffOutlinedIcon
          sx={{
            color: '#4abbc9', // Makes the inside of the icon transparent
            //   '&:hover': {
            //     color: 'white', // Optional: Changes to white on hover
            //   },
            //   stroke: '#4abbc9', // Sets the border color of the icon
          }}
        />
      ) : (
        <MicNoneOutlinedIcon
          sx={{
            color: '#4abbc9', // Makes the inside of the icon transparent
            //   '&:hover': {
            //     color: 'white', // Optional: Changes to white on hover
            //   },
            //   stroke: '#4abbc9', // Sets the border color of the icon
          }}
        />
      ),
      name: isAudioPaused ? 'Unmute' : 'Mute',
      clickEvent: () => {
        dispatch(setAudioPause(!isAudioPaused));
      },
    },
    {
      icon: <BluetoothAudioIcon sx={{ color: '#4abbc9' }} />,
      name: 'Audio Output',
      clickEvent: () => setOpenModal(true),
    },
  ];

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  // // Handle the selection of an audio output device
  // const handleAudioOutputChange = async (deviceId) => {
  //   setSelectedOutput(deviceId);

  //   const audioElement = document.getElementById('audio');
  //   if (audioElement && typeof audioElement.sinkId !== 'undefined') {
  //     try {
  //       await audioElement.setSinkId(deviceId);
  //       handleCloseModal();
  //       console.log(`Audio output switched to: ${deviceId}`);
  //     } catch (error) {
  //       console.error('Error switching audio output:', error);
  //     }
  //   } else {
  //     console.warn('Browser does not support audio output switching.');
  //   }
  // };

  useEffect(() => {
    // Set a timeout to close the tooltip after 3 seconds (3000ms)
    const timer = setTimeout(() => {
      setOpenTooltip(false);
    }, 10000); // Adjust the time as needed

    return () => clearTimeout(timer); // Clean up the timer on unmount
  }, []);

  const tooltipTitle = 'Control your video and audio settings.';

  // const tooltipTitle = t('Control your video and audio settings.');

  return (
    <Box
      sx={{
        transform: 'translateZ(0px)',
        flexGrow: 1,
        position: 'absolute',
        right: 0,
      }}
    >
      <Tooltip title={tooltipTitle} open={openTooltip} placement="top" arrow>
        <SpeedDial
          ariaLabel="SpeedDial basic example"
          onClick={() => {
            dispatch(setCallSideMenu(!isSideMenuOpen));

            if (isMainMenuOpen) {
              dispatch(setCallMenuOpen(false));
            }
          }}
          sx={{
            position: 'absolute',
            bottom: 100,
            right: 0,
            '& .MuiFab-primary': {
              backgroundColor: 'rgb(116 110 110 / 98%)', // Change background color
              color: 'white', // Change icon color
              width: '40px',
              height: '40px',
              '&:hover': {
                backgroundColor: 'rgb(116 110 110 / 78%)', // Change background on hover
              },
            },
          }}
          icon={
            <SpeedDialIcon
              icon={<ExpandMoreIcon />}
              openIcon={<ExpandLessOutlinedIcon />}
            />
          }
          direction="down"
        >
          {actions.map((action) => (
            <SpeedDialAction
              key={action.name}
              icon={action.icon}
              tooltipTitle={action.name}
              onClick={() => action.clickEvent()}
            />
          ))}
        </SpeedDial>
      </Tooltip>

      {/* Modal for Audio Output Selection */}
      <Modal open={openModal} onClose={handleCloseModal}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 'auto', // Make the width adjust automatically
            maxWidth: '90%', // Ensure it doesn't go beyond screen width
            backgroundColor: 'white',
            boxShadow: 24,
            padding: '20px',
            borderRadius: '8px',
            textAlign: 'center',
            overflow: 'hidden',
          }}
        >
          <MenuItem
            disabled
            key="title_audio_output_menu"
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
                fontSize: 16,
                color: '#000',
                padding: '10px',
                whiteSpace: 'normal', // Ensure text wraps properly
                wordWrap: 'break-word', // Break long words if needed
              }}
            >
              Use your Phone control center to change audio output after
              connecting the call.
              {/* {t(
                'Use your Phone control center to change audio output after connecting the call.',
              )} */}
            </Typography>
          </MenuItem>

          {/* {audioOutputs.map((device) => (
            <MenuItem
              key={device.deviceId}
              value={device.deviceId}
              onClick={() => handleAudioOutputChange(device.deviceId)}
              sx={{
                fontSize: '12px',
              }}
            >
              {device.label || `Device ${device.deviceId}`}
              {selectedOutput === device.deviceId && (
                <Check
                  sx={{
                    height: '20px',
                    width: '18px',
                    marginLeft: '10px',
                  }}
                />
              )}
            </MenuItem>
          ))} */}
        </Box>
      </Modal>
    </Box>
  );
};

export default SideMenu;
