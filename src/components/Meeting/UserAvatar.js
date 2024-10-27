import React, { useEffect, useRef, useState } from 'react';
import { Box } from '@mui/material';
import { avatarFaceProcessing } from '../utils/tensorFlowUtils';

const UserAvatar = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isSmiling, setIsSmiling] = useState(false);

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        let video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          video
            .play()
            .then(() => {
              console.log('Video is playing');
            })
            .catch((err) => {
              console.error('Error starting video playback:', err);
            });
        }
      })
      .catch((err) => {
        console.error('Error accessing webcam: ', err);
      });
  }, []);

  const handleFaceProcessing = async () => {
    await avatarFaceProcessing(
      videoRef.current,
      canvasRef.current,
      setIsSmiling,
    );
  };
  console.log(isSmiling, 'isSmiling');
  return (
    <Box
      sx={{
        position: 'relative',
        width: 130, // Slightly larger than the avatar for glowing effect
        height: 130,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        background: isSmiling
          ? 'conic-gradient(from 0deg, #df4303, #df4303 15%, #4abbc9 30%, transparent 45%, #df4303 60%, #4abbc9 75%, transparent 90%)'
          : 'none',
        backgroundSize: '200% 200%',
        // animation: 'waveGlow 9s linear infinite', // Animate the background position
        '&::before': {
          content: '""',
          position: 'absolute',
          top: -5,
          left: -5,
          right: -5,
          bottom: -5,
          borderRadius: '50%',
          background: 'inherit',
          padding: '8px', // Controls thickness of the glow
          filter: 'blur(8px)',
          zIndex: -1,
        },
      }}
    >
      <Box
        sx={{
          position: 'relative',
          width: 120,
          height: 120,
          borderRadius: '50%',
          overflow: 'hidden',
          backgroundColor: '#fff',
          boxShadow: isSmiling
            ? `0 0 8px rgba(0, 255, 0, 0.6), 
                    0 0 16px rgba(0, 255, 0, 0.6), 
                    0 0 24px rgba(0, 255, 0, 0.6),
                    0 0 32px rgba(0, 255, 0, 0.6)`
            : 'none',
          animation: isSmiling ? 'pulseGlow 2s infinite' : 'none',
        }}
      >
        <video
          ref={videoRef}
          onLoadedMetadata={handleFaceProcessing}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: '50%',
          }}
          playsInline
        />
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
          }}
        />
      </Box>
    </Box>
  );
};

export default UserAvatar;
