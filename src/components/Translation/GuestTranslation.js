import React, { useEffect } from 'react';
import { Typography, Container, Avatar, Box, Button, Fab } from '@mui/material';
import { useParams } from 'react-router-dom';

import CloseIcon from '@mui/icons-material/Close';
import TranslationOverlay from './TranslationOverlay';
import { useWebRTC } from '../context/WebrtcBridge';

const ProfileHeader = () => (
  <Box display="flex" alignItems="center" sx={{ padding: '16px' }}>
    <Avatar
      alt="Lila Harrington"
      src="https://via.placeholder.com/100" // Replace with real image url
      sx={{ width: 56, height: 56, mr: 2 }}
    />
    <Box>
      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
        Lila Harrington
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Nexora Dynamics
      </Typography>
    </Box>

    {/* Language Toggle Button */}
    <Box sx={{ ml: 'auto' }}>
      <Button variant="outlined" size="small">
        EN — RU
      </Button>
    </Box>
  </Box>
);

const GuestTranslation = () => {
  const { joinRoom } = useWebRTC({ isTranslationOnly: true });
  const { meetingId } = useParams();

  useEffect(() => {
    // On mount, just call joinRoom to produce audio only
    if (meetingId) {
      joinRoom(meetingId);
    }
  }, []);

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
        <ProfileHeader />

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
