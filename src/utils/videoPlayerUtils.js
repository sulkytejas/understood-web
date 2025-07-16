// Function to apply video enhancements only for local stream
// const applyVideoEnhancements = (videoElement, isLocalStream = false) => {
//   if (!videoElement || !isLocalStream) return;

//   // Apply CSS filters for better clarity and cinematic look
//   videoElement.style.filter = `
//       contrast(1.1)                 /* Slightly increase contrast */
//       brightness(1.05)              /* Subtle brightness boost */
//       saturate(1.1)                /* Slightly enhance colors */
//     `;

//   // Add subtle vignette effect using box-shadow
//   videoElement.style.boxShadow = 'inset 0 0 100px rgba(0,0,0,0.4)';
// };

const applyVideoEnhancements = (videoElement) => {
  if (!videoElement) return;

  // Set basic video properties
  videoElement.style.objectFit = 'cover';
  videoElement.style.transform = 'scale(1.01)'; // Prevent potential white edges

  // Clear any existing filters or effects
  videoElement.style.filter = 'none';
  videoElement.style.boxShadow = 'none';
};

// Function to optimize video stream settings
const optimizeVideoStream = (stream, isLocalStream = false) => {
  if (!stream || !isLocalStream) return;

  const videoTrack = stream.getVideoTracks()[0];
  if (!videoTrack) return;

  try {
    // Get current constraints
    const capabilities = videoTrack.getCapabilities();

    // Prepare enhanced constraints
    const enhancedConstraints = {
      advanced: [
        {
          frameRate: capabilities.frameRate?.max ?? 30,
          width: { ideal: capabilities.width?.max ?? 1280 },
          height: { ideal: capabilities.height?.max ?? 720 },
          sharpness: capabilities.sharpness?.max ?? 1,
          exposureMode: 'continuous',
          exposureCompensation: capabilities.exposureCompensation?.max ?? 0,
          brightness: capabilities.brightness?.max ?? 1,
          contrast: capabilities.contrast?.max ?? 1,
          autoExposureMode: 'continuous',
          autoWhiteBalanceMode: 'continuous',
          noiseReduction: 'high',
        },
      ],
    };

    // Apply the enhanced constraints
    videoTrack.applyConstraints(enhancedConstraints).catch((error) => {
      console.warn('Some video enhancements not supported:', error);
    });
  } catch (error) {
    console.warn('Error applying video optimizations:', error);
  }
};

// Enhance video container
// const enhanceVideoContainer = (containerRef, isLocalVideoActive = false) => {
//   if (!containerRef?.current) return;

//   if (isLocalVideoActive) {
//     containerRef.current.style.background =
//       'linear-gradient(180deg, #000000 0%, rgba(0,0,0,0.8) 50%, #000000 100%)';

//     const existingAmbientLight =
//       containerRef.current.querySelector('.ambient-light');
//     if (!existingAmbientLight) {
//       const ambientLight = document.createElement('div');
//       ambientLight.className = 'ambient-light';
//       ambientLight.style.cssText = `
//           position: absolute;
//           top: 0;
//           left: 0;
//           right: 0;
//           bottom: 0;
//           pointer-events: none;
//           background: radial-gradient(
//             circle at 50% 50%,
//             rgba(255,255,255,0.1) 0%,
//             rgba(0,0,0,0) 70%
//           );
//           mix-blend-mode: screen;
//         `;
//       containerRef.current.appendChild(ambientLight);
//     }
//   } else {
//     // Reset container styles when not showing local stream
//     containerRef.current.style.background = '#000';
//     const ambientLight = containerRef.current.querySelector('.ambient-light');
//     if (ambientLight) {
//       ambientLight.remove();
//     }
//   }
// };

const enhanceVideoContainer = (containerRef) => {
  if (!containerRef?.current) return;

  // Set basic container background
  containerRef.current.style.background = '#000000';

  // Remove any existing effects
  const ambientLight = containerRef.current.querySelector('.ambient-light');
  if (ambientLight) {
    ambientLight.remove();
  }
};

export { applyVideoEnhancements, optimizeVideoStream, enhanceVideoContainer };
