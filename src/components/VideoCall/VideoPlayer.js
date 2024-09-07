import React from 'react';
import { Box, Typography, Alert } from '@mui/material';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

const VideoPlayer = ({ localStream, remoteVideoRef, callStarted }) => {
  const isMainMenuOpen = useSelector((state) => state.ui.callMenuOpen);
  const { t } = useTranslation();
  // Check if the srcObject is available or not
  const showAlert = !remoteVideoRef?.current?.srcObject;

  const circularRemoteVideo = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: '#DF4303',
    borderRadius: '50px',
    padding: ' 4px',
    width: '60pxpx',
    height: '100px',
    boxShadow: '0px 3px 10px rgba(0, 0, 0, 0.2)',
    border: '1px solid #fff',
    transition: 'all 0.5s ease-in-out',
  };

  const circularRemoteVideoInner = {
    width: '55px',
    height: '55px',
    borderRadius: '50%',
    overflow: 'hidden',
    marginBottom: '10px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  };

  const mainRemoteVideo = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100px',
    height: '140px',
    boxShadow: '0px 3px 10px rgba(0, 0, 0, 0.2)',
  };

  const mainRemoteVideoInner = {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    transition: 'all 0.5s ease-in-out',
  };

  return (
    <div className="video-player">
      <video
        className="local-video"
        ref={remoteVideoRef}
        autoPlay
        playsInline
        muted={!callStarted}
      />
      <div className="remote-video">
        <Box sx={isMainMenuOpen ? circularRemoteVideo : mainRemoteVideo}>
          {/* Circular Video */}
          <Box
            sx={
              isMainMenuOpen ? circularRemoteVideoInner : mainRemoteVideoInner
            }
          >
            <video
              ref={(video) => {
                if (video) {
                  video.srcObject = localStream;
                }
              }}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          </Box>

          {/* Language Label */}
          {isMainMenuOpen && (
            <Box
              sx={{
                backgroundColor: 'white',
                borderRadius: '20px',
                padding: '2px 10px',
                textAlign: 'center',
                marginTop: '4px',
              }}
            >
              <Typography
                variant="body2"
                sx={{ color: '#4EC7CF', fontWeight: 'bold', fontSize: '9px' }}
              >
                • EN
              </Typography>
            </Box>
          )}
        </Box>
      </div>

      {showAlert && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.5)', // Optional dark overlay
          }}
        >
          <Alert severity="warning">
            {t('Waiting for the participant to join...')}
          </Alert>
        </Box>
      )}
    </div>
  );
};

export default VideoPlayer;
