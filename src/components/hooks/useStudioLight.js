import { useEffect, useRef } from 'react';

const useStudioLight = (videoRef, enabled = true) => {
  const filterRef = useRef(null);

  useEffect(() => {
    if (!videoRef.current || !enabled) return;

    const applyStudioLight = () => {
      const video = videoRef.current;

      // Studio light effect using CSS filters
      const filters = [
        'brightness(1.08)', // Slight brightness boost
        'contrast(1.1)', // Mild contrast
        'saturate(1.05)', // Subtle color enhancement
        'sepia(0.15)', // Warm tone
      ].join(' ');

      // Store current filter for cleanup
      filterRef.current = video.style.filter;

      // Apply filters
      video.style.filter = filters;

      // Add warm overlay
      let overlay = video.parentElement.querySelector('.studio-light-overlay');
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'studio-light-overlay';
        video.parentElement.appendChild(overlay);
      }

      // Style the overlay
      Object.assign(overlay.style, {
        position: 'absolute',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        background:
          'radial-gradient(circle at 50% 0%, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 75%)',
        mixBlendMode: 'soft-light',
        opacity: '0.7',
        zIndex: '1',
      });
    };

    // Apply effect when video metadata is loaded
    const handleVideoLoad = () => {
      applyStudioLight();
    };

    videoRef.current.addEventListener('loadedmetadata', handleVideoLoad);

    // Apply immediately if video is already loaded
    if (videoRef.current.videoWidth) {
      applyStudioLight();
    }

    // Cleanup function
    return () => {
      if (videoRef.current) {
        videoRef.current.removeEventListener('loadedmetadata', handleVideoLoad);
        // Restore original filter
        if (filterRef.current !== null) {
          videoRef.current.style.filter = filterRef.current;
        }
      }
      // Remove overlay
      const overlay = document.querySelector('.studio-light-overlay');
      if (overlay) {
        overlay.remove();
      }
    };
  }, [enabled, videoRef]);

  return {
    enabled,
  };
};

export default useStudioLight;
