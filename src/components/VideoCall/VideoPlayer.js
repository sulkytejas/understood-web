import React from 'react';
import { Box, Typography } from '@mui/material';
import { useSelector } from 'react-redux';

const VideoPlayer = ({ localVideoRef, remoteVideoRef, callStarted }) => {
  // useEffect(() => {
  //   if (callStarted) {
  //     const remoteTrack = remoteVideoRef.current.srcObject;

  //     remoteVideoRef.current.srcObject = localVideoRef.current.srcObject;
  //     localVideoRef.current.srcObject = remoteTrack;
  //   }
  // }, [callStarted]);
  const isMainMenuOpen = useSelector((state) => state.ui.callMenuOpen);

  const circularRemoteVideo = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: '#4EC7CF',
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
              ref={localVideoRef}
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
    </div>
  );
};

export default VideoPlayer;
