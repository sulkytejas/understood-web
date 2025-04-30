import React, { useEffect, useState } from 'react';
import { Typography, Container, Avatar, Box, Button, Fab } from '@mui/material';
import { useParams, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { nanoid } from 'nanoid';

import CloseIcon from '@mui/icons-material/Close';
import TranslationOverlay from './TranslationOverlay';
import { useWebRTC } from '../context/WebrtcBridge';
import { setUserPhoneNumber, setUserName, setUid } from '../../redux/userSlice';
import { useSocket } from '../context/SocketContext';

const ProfileHeader = ({ otherPariticpantInfo }) => (
  <Box display="flex" alignItems="center" sx={{ padding: '16px' }}>
    <Avatar
      alt="Lila Harrington"
      src="https://via.placeholder.com/100" // Replace with real image url
      sx={{ width: 56, height: 56, mr: 2 }}
    />
    <Box>
      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
        {otherPariticpantInfo?.user?.username || 'Host'}
      </Typography>
      {/* <Typography variant="body2" color="text.secondary">
        Nexora Dynamics
      </Typography> */}
    </Box>

    {/* Language Toggle Button */}
    <Box sx={{ ml: 'auto' }}>
      <Button variant="outlined" size="small">
        {otherPariticpantInfo?.user?.spokenLanguage}
      </Button>
    </Box>
  </Box>
);

const GuestTranslation = () => {
  const { meetingId } = useParams();
  const dispatch = useDispatch();
  const location = useLocation();
  const { socket, isSocketConnected } = useSocket();
  const { joinRoom } = useWebRTC({ isTranslationOnly: true });
  const [otherPariticpantInfo, setOtherParticipantInfo] = useState({});

  useEffect(() => {
    if (socket && isSocketConnected) {
      if (!meetingId) return;

      const temporaryUid = nanoid(28);
      const queryParams = new URLSearchParams(location.search);
      const hostUid = queryParams.get('hostUid');

      const signInUser = async () => {
        await new Promise((resolve) => setTimeout(resolve, 300));

        try {
          dispatch(setUserPhoneNumber('+11111111111'));
          dispatch(setUserName(`Guest-${meetingId}`));
          dispatch(setUid(temporaryUid));
        } catch (e) {
          console.error('Error signing in user:', e);
        }
      };

      const init = async () => {
        await signInUser();
        const response = await joinRoom(meetingId, temporaryUid);

        if (response?.joined) {
          socket.on('participant-info-response', (data) => {
            console.log('Received participant info:', data);
            // setHostInfo(data);
            // setLoading(false);

            setOtherParticipantInfo(data);

            console.log('pariticipantInfoGuest', data);
          });

          socket.emit('get-participant-info', { hostUid });
        }
      };

      init();

      socket.on('participants-device-info', (info) => {
        console.log('received, other pariticipant info', info);
      });
    }

    return () => {
      socket.off('host-info-response');
    };
  }, [socket, isSocketConnected]);

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        // maxWidth: '430px',
        height: 'calc(var(--vh) * 100)',
        // maxHeight: '932px',
        margin: '0 auto',
        overFlow: 'hidden',
        backgroundColor: '#fff',
        paddingLeft: 0,
        paddingRight: 0,
      }}
    >
      {/* Main Content */}
      <Container
        maxWidth="sm"
        sx={{
          paddingLeft: 0,
          paddingRight: 0,
        }}
      >
        {/* Profile Header */}
        <ProfileHeader otherPariticpantInfo={otherPariticpantInfo} />

        <TranslationOverlay />

        <Box
          sx={{
            position: 'fixed', // or "absolute" if you prefer
            bottom: 0,
            left: 0,
            right: 0,
            py: 2,
            display: 'flex',
            justifyContent: 'center',
            backgroundColor: 'white',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            // a little shadow so it stands out
            boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.1)',
            paddingBottom: '60px',
          }}
        >
          <Fab color="warning">
            <CloseIcon />
          </Fab>
        </Box>
      </Container>

      {/* Floating Action Button for "T" (Translate) */}
    </Box>
  );
};

export default GuestTranslation;
