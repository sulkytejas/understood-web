import React, { useEffect, useState, useRef } from 'react';
import { Box } from '@mui/material';
import * as faceapi from 'face-api.js';

const UserAvatar = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);

  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = '/models';
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
      await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
      setIsModelLoaded(true);
    };

    loadModels();
  }, []);

  useEffect(() => {
    if (isModelLoaded) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          let video = videoRef.current;
          if (video) {
            video.srcObject = stream;
            video.onloadedmetadata = () => {
              console.log(
                `Video dimensions: ${video.videoWidth}x${video.videoHeight}`,
              );
              canvasRef.current.width = video.videoWidth;
              canvasRef.current.height = video.videoHeight;
              handleVideoPlay();
            };
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
    }
  }, [isModelLoaded]);

  let previousBox = null;
  let smoothingFactor = 0.2; // Lower value gives more smoothing, adjust as needed

  const handleVideoPlay = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video && canvas) {
      const displaySize = {
        width: video.videoWidth,
        height: video.videoHeight,
      };
      faceapi.matchDimensions(canvas, displaySize);

      const processVideo = async () => {
        if (canvas.width > 0 && canvas.height > 0) {
          const detections = await faceapi.detectAllFaces(
            video,
            new faceapi.TinyFaceDetectorOptions(),
          );

          const resizedDetections = faceapi.resizeResults(
            detections,
            displaySize,
          );

          canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);

          if (resizedDetections.length > 0) {
            const detectedBox = resizedDetections[0].box;

            let smoothedBox;

            if (previousBox) {
              // Apply exponential smoothing
              smoothedBox = {
                x:
                  smoothingFactor * detectedBox.x +
                  (1 - smoothingFactor) * previousBox.x,
                y:
                  smoothingFactor * detectedBox.y +
                  (1 - smoothingFactor) * previousBox.y,
                width:
                  smoothingFactor * detectedBox.width +
                  (1 - smoothingFactor) * previousBox.width,
                height:
                  smoothingFactor * detectedBox.height +
                  (1 - smoothingFactor) * previousBox.height,
              };
            } else {
              smoothedBox = detectedBox; // Initialize the smoothed box
            }

            previousBox = smoothedBox; // Update the previous box to the smoothed box

            const { x, y, width, height } = smoothedBox;
            const zoomFactor = 1.5; // Adjust this factor to zoom in more or less

            // Calculate the coordinates for cropping
            const cropX = Math.max(0, x - (width * (zoomFactor - 1)) / 2);
            const cropY = Math.max(0, y - (height * (zoomFactor - 1)) / 2);
            const cropWidth = Math.min(video.videoWidth, width * zoomFactor);
            const cropHeight = Math.min(video.videoHeight, height * zoomFactor);

            // Draw the zoomed and cropped video on the canvas
            canvas.getContext('2d').drawImage(
              video,
              cropX, // source x
              cropY, // source y
              cropWidth, // source width
              cropHeight, // source height
              0, // destination x
              0, // destination y
              canvas.width, // destination width
              canvas.height, // destination height
            );
          }
        }

        requestAnimationFrame(processVideo);
      };

      processVideo();
    }
  };

  return (
    <Box
      sx={{
        position: 'relative',
        width: 150,
        height: 150,
        borderRadius: '50%',
        overflow: 'hidden',
        backgroundColor: '#e0e0e0',
        mb: 3,
      }}
    >
      <video
        ref={videoRef}
        // onPlay={handleVideoPlay}
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
  );
};

export default UserAvatar;
