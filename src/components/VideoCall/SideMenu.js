import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box,
  //   IconButton,
  //   Fab,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import VideocamOffOutlinedIcon from '@mui/icons-material/VideocamOffOutlined'; //
import VideocamOutlinedIcon from '@mui/icons-material/VideocamOutlined';
import MicOffOutlinedIcon from '@mui/icons-material/MicOffOutlined';
import MicNoneOutlinedIcon from '@mui/icons-material/MicNoneOutlined';
import ExpandLessOutlinedIcon from '@mui/icons-material/ExpandLessOutlined';

import { setCallMenuOpen, setCallSideMenu } from '../../redux/uiSlice';
import { setVideoPause, setAudioPause } from '../../redux/videoPlayerSlice';

const SideMenu = () => {
  const dispatch = useDispatch();
  const isMainMenuOpen = useSelector((state) => state.ui.callMenuOpen);
  const isSideMenuOpen = useSelector((state) => state.ui.callSideMenu);
  const isVideoPaused = useSelector((state) => state.videoPlayer.videoPause);
  const isAudioPaused = useSelector((state) => state.videoPlayer.audioPause);

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
  ];

  return (
    <Box
      sx={{
        transform: 'translateZ(0px)',
        flexGrow: 1,
        position: 'absolute',
        right: 0,
      }}
    >
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
    </Box>
  );
};

export default SideMenu;
