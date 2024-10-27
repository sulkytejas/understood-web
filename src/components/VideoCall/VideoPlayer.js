import { useEffect, useRef } from 'react';
import { Box, Alert, Typography } from '@mui/material';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import LoadingSpinner from '../onBoarding/LoadingSpinner';
import useListTracker from '../hooks/useListTracker';
import ListOverlay from './ListOverlay';

import { trackFace } from '../utils/tensorFlowUtils';

const VideoPlayer = ({
  localStream,
  remoteVideoRef,
  connectionState,
  remoteTrack,
  videoContainerRef,
}) => {
  const isMainMenuOpen = useSelector((state) => state.ui.callMenuOpen);
  const localTranslationLanguage = useSelector(
    (state) => state.translation.localTranslationLanguage,
  );

  const { listItems, showList, title } = useListTracker();
  const { t } = useTranslation();
  // Check if the srcObject is available or not
  const showAlert = !remoteVideoRef?.current?.srcObject;
  const showConnectionAlert = connectionState !== 'connected';
  const animationFrameRef = useRef(null);
  const stopTrackRef = useRef(null);

  const handleRemoteTrackProcessing = async () => {
    console.log('remoteTrack', remoteTrack);
    console.log(
      'stream settings',
      localStream.getVideoTracks()[0].getSettings().width,
      localStream.getVideoTracks()[0].getSettings().height,
    );
    if (remoteTrack && remoteVideoRef.current && videoContainerRef.current) {
      const { stopTrack } = await trackFace(
        remoteVideoRef.current,
        videoContainerRef.current,
        remoteTrack,
        animationFrameRef,
      );

      stopTrackRef.current = stopTrack;
    }
  };

  useEffect(() => {
    // Cleanup function to run when component unmounts
    return () => {
      if (stopTrackRef.current) {
        stopTrackRef.current(); // Stop face detection when component unmounts
      }
    };
  }, []);

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
        onLoadedMetadata={handleRemoteTrackProcessing}
      />

      {showList && (
        <ListOverlay listItems={listItems} showList={showList} title={title} />
      )}

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
                {`• ${localTranslationLanguage || t('not set')}`}
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
          <Alert severity="info">
            {t('Waiting for the participant to join...')}
          </Alert>
        </Box>
      )}

      {showConnectionAlert && (
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
          <Box sx={{ marginBottom: '20px', display: 'inline-block' }}>
            <LoadingSpinner />
            <Box
              component="span"
              sx={{
                color: 'white',
                position: 'absolute',
                top: '58%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
              }}
            >
              {t('Attempting to reconnect...')}
            </Box>
          </Box>
        </Box>
      )}
    </div>
  );
};

export default VideoPlayer;
