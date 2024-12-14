import { useEffect, useRef } from 'react';
import { trackFace } from '../utils/tensorFlowUtils';

const useFaceTracking = ({
  stream,
  videoRef,
  videoContainerRef,
  otherParticipantInfo,
  applyStudioLight,
  enabled = true,
}) => {
  const faceTrackingRef = useRef({
    isTracking: false,
    currentStreamId: null,
    stopTrack: null,
  });
  const animationFrameRef = useRef(null);

  const stopFaceTracking = async () => {
    if (faceTrackingRef.current.stopTrack) {
      await faceTrackingRef.current.stopTrack();
      faceTrackingRef.current = {
        isTracking: false,
        currentStreamId: null,
        stopTrack: null,
      };
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };

  const startFaceTracking = async () => {
    if (
      !enabled ||
      !stream?.getVideoTracks?.()?.length ||
      !videoRef?.current ||
      !videoContainerRef?.current
    ) {
      return;
    }

    const videoTrack = stream.getVideoTracks()[0];
    const settings = videoTrack.getSettings();
    const streamId = videoTrack.id;

    // Don't start if video resolution is too low
    if (
      !settings?.width ||
      settings.width < videoContainerRef.current.clientWidth
    ) {
      console.log('Video resolution too low for face tracking');
      return;
    }

    // Don't restart if already tracking this stream
    if (
      faceTrackingRef.current.isTracking &&
      faceTrackingRef.current.currentStreamId === streamId
    ) {
      return;
    }

    try {
      await stopFaceTracking();

      // Get remote participant info
      let remoteStreamInfo = null;
      if (otherParticipantInfo) {
        const values = Object.values(otherParticipantInfo)[0];
        remoteStreamInfo = {
          isIOS: values.isIOS,
          userAgent: values.userAgent,
          isLocalDevice: values.isLocalDevice,
          sourceIsIOS: values.sourceIsIOS,
        };
      }

      const { stopTrack } = await trackFace(
        videoRef.current,
        videoContainerRef.current,
        stream,
        animationFrameRef,
        remoteStreamInfo,
        applyStudioLight,
      );

      faceTrackingRef.current = {
        isTracking: true,
        currentStreamId: streamId,
        stopTrack,
      };
    } catch (error) {
      console.error('Error in face tracking:', error);
      faceTrackingRef.current = {
        isTracking: false,
        currentStreamId: null,
        stopTrack: null,
      };
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopFaceTracking();
    };
  }, []);

  return {
    startFaceTracking,
    stopFaceTracking,
    isTracking: faceTrackingRef.current.isTracking,
  };
};

export default useFaceTracking;
