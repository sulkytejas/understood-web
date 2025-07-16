export const generateDeviceId = () => {
  let deviceId = localStorage.getItem('deviceId');
  if (!deviceId) {
    deviceId = 'device-' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('deviceId', deviceId);
  }
  return deviceId;
};

export const addOrUpdateTranslatedText = (
  id,
  text,
  isFinal,
  setTranslatedTexts,
) => {
  setTranslatedTexts((prev) => {
    const index = prev.findIndex((item) => item.id === id);
    const newTexts = [...prev];

    if (index !== -1) {
      newTexts[index] = { ...newTexts[index], text, isFinal };
    } else {
      newTexts.push({ id, text, isFinal });
    }

    if (newTexts.length > 1) {
      newTexts.shift(); // Remove the oldest text if there are more than 3
    }

    return newTexts;
  });
};

export const isBrowserSupportingL3T3 = () => {
  const ua = navigator.userAgent;

  // Check if the browser is Chrome or Chromium-based
  const isChrome = /Chrome/.test(ua) && /Google Inc/.test(navigator.vendor);
  const chromeVersionMatch = ua.match(/Chrome\/(\d+)/);
  const chromeVersion = chromeVersionMatch
    ? parseInt(chromeVersionMatch[1], 10)
    : 0;

  // Check if the browser is Edge (Chromium-based versions)
  const isEdge = /Edg/.test(ua);

  // Chrome/Chromium version 86+ supports VP9 SVC with L3T3, so we check for this
  if ((isChrome && chromeVersion >= 86) || isEdge) {
    return true; // Supports L3T3
  }

  return false; // Doesn't support L3T3
};

export const getVideoConstraints = async (
  browserName,
  connectionQuality = 'good',
) => {
  if (connectionQuality === 'poor') {
    return {
      video: {
        width: { ideal: 640, max: 1280 },
        height: { ideal: 480, max: 720 },
        frameRate: { ideal: 20, max: 24 },
      },
    };
  }
  // Define resolution presets with consistent format
  const resolutionLevels = [
    // 1080p
    {
      width: { min: 1280, ideal: 1920, max: 1920 },
      height: { min: 720, ideal: 1080, max: 1080 },
    },
    // 720p
    {
      width: { min: 1024, ideal: 1280, max: 1280 },
      height: { min: 576, ideal: 720, max: 720 },
    },
    // 480p
    {
      width: { min: 640, ideal: 854, max: 854 },
      height: { min: 360, ideal: 480, max: 480 },
    },
    // 360p
    {
      width: { min: 480, ideal: 640, max: 640 },
      height: { min: 270, ideal: 360, max: 360 },
    },
  ];

  // For Safari, use simpler constraints but maintain format
  if (browserName === 'Safari') {
    return {
      video: {
        width: { min: 640, ideal: 1920, max: 1920 },
        height: { min: 360, ideal: 1080, max: 1080 },
        aspectRatio: { ideal: 16 / 9 },
        frameRate: { ideal: 30, max: 30 },
      },
      audio: true,
    };
  }

  // Try each resolution level
  for (const resolution of resolutionLevels) {
    try {
      const constraints = {
        video: {
          ...resolution,
          aspectRatio: { ideal: 16 / 9 },
          frameRate: { ideal: 30, max: 30 },
        },
        audio: true,
      };

      // Test the constraints
      const testStream = await navigator.mediaDevices.getUserMedia(constraints);
      const videoTrack = testStream.getVideoTracks()[0];
      const settings = videoTrack.getSettings();

      console.log('Successful resolution:', {
        width: settings.width,
        height: settings.height,
        frameRate: settings.frameRate,
      });

      // Clean up test stream
      testStream.getTracks().forEach((track) => track.stop());

      // Return working constraints in consistent format
      return constraints;
    } catch (error) {
      console.log('Failed resolution:', resolution, error.message);
      continue;
    }
  }

  const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);

  // Fallback to most permissive constraints while maintaining format
  console.log('Falling back to minimum constraints');

  return {
    video: {
      width: { min: 480, ideal: 640, max: 640 },
      height: { min: 270, ideal: 360, max: 360 },
      aspectRatio: { ideal: 16 / 9 },
      frameRate: { ideal: 30, max: 30 },
      ...(isIosDevice && { resizeMode: 'none' }),
    },
    audio: true,
  };
};

export const applyAdvancedCameraControls = async (
  videoTrack,
  connectionQuality = 'good',
) => {
  try {
    const supportedConstraints =
      navigator.mediaDevices.getSupportedConstraints();
    console.log('Supported Constraints:', supportedConstraints);

    // First check and apply resolution if supported
    const resolutionConstraints = {};
    if (supportedConstraints.width && supportedConstraints.height) {
      resolutionConstraints.width = { exact: 1920 };
      resolutionConstraints.height = { exact: 1080 };
    }

    if (Object.keys(resolutionConstraints).length > 0) {
      console.log('Applying resolution constraints:', resolutionConstraints);
      await videoTrack.applyConstraints(resolutionConstraints);
    }

    // Check which camera controls are supported
    const cameraConstraints = {};

    if (supportedConstraints.focusMode) {
      cameraConstraints.focusMode = 'continuous';
    }

    if (supportedConstraints.exposureMode) {
      cameraConstraints.exposureMode = 'continuous';
    }

    if (supportedConstraints.whiteBalanceMode) {
      cameraConstraints.whiteBalanceMode = 'continuous';
    }

    if (supportedConstraints.videoStabilizationMode) {
      cameraConstraints.videoStabilizationMode = 'auto';
    }

    if (supportedConstraints.autoFocus) {
      cameraConstraints.autoFocus = true;
    }

    if (supportedConstraints.stabilizationMode) {
      cameraConstraints.stabilizationMode = 'auto';
    }

    if (supportedConstraints.hdrEnabled) {
      cameraConstraints.hdrEnabled = true;
    }
    if (supportedConstraints.enableHdr) {
      cameraConstraints.enableHdr = true;
    }

    if (supportedConstraints.colorTemperature) {
      cameraConstraints.colorTemperature = 6500;
    }

    if (supportedConstraints.noiseReduction) {
      cameraConstraints.noiseReduction =
        connectionQuality === 'poor' ? 'high' : 'medium';
    }

    if (supportedConstraints.autoWhiteBalanceMode) {
      cameraConstraints.autoWhiteBalanceMode = 'continuous';
    }

    if (supportedConstraints.sharpness) {
      cameraConstraints.sharpness =
        connectionQuality === 'poor'
          ? videoTrack.getCapabilities().sharpness?.min
          : videoTrack.getCapabilities().sharpness?.max;
    }

    // Only apply camera controls if any are supported
    if (Object.keys(cameraConstraints).length > 0) {
      console.log('Applying supported camera controls:', cameraConstraints);
      await videoTrack.applyConstraints(cameraConstraints);
    } else {
      console.log('No supported camera controls found');
    }

    // Log final applied settings
    const finalSettings = videoTrack.getSettings();
    console.log('Final camera settings:', finalSettings);

    return true;
  } catch (error) {
    console.log('Failed to apply camera controls:', error);
    console.log('Error name:', error.name);
    console.log('Error message:', error.message);
    return false;
  }
};

export const applyAdvancedAudioControls = async (
  audioTrack,
  connectionQuality = 'good',
) => {
  try {
    const supportedConstraints =
      navigator.mediaDevices.getSupportedConstraints();
    console.log('Supported Audio Constraints:', supportedConstraints);

    const constraints = {};

    // Noise suppression - reduces background noise
    if (supportedConstraints.noiseSuppression) {
      constraints.noiseSuppression = true;
    }

    // Echo cancellation - prevents echo in calls
    if (supportedConstraints.echoCancellation) {
      constraints.echoCancellation = true;
    }

    // Auto gain control - maintains consistent volume
    if (supportedConstraints.autoGainControl) {
      constraints.autoGainControl = true;
    }

    // Channel count - mono for speech recognition
    if (supportedConstraints.channelCount) {
      constraints.channelCount = 1; // Mono is required for speech recognition
    }

    // Sample rate - 16kHz for Google Speech Recognition
    if (supportedConstraints.sampleRate) {
      constraints.sampleRate = 16000; // Optimized for speech recognition
    }

    // Sample size
    if (supportedConstraints.sampleSize) {
      constraints.sampleSize = 16;
    }

    if (supportedConstraints.latency) {
      constraints.latency = connectionQuality === 'poor' ? 0.1 : 0.05;
    }

    // Apply constraints if any are supported
    if (Object.keys(constraints).length > 0) {
      console.log('Applying audio constraints:', constraints);
      await audioTrack.applyConstraints({ advanced: [constraints] });
    }

    // Log final settings
    const finalSettings = audioTrack.getSettings();
    console.log('Final audio settings:', finalSettings);

    return true;
  } catch (error) {
    console.log('Failed to apply audio controls:', error);
    console.log('Error name:', error.name);
    console.log('Error message:', error.message);
    return false;
  }
};
