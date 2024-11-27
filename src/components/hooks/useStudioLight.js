// src/hooks/useStudioLight.js
import { useEffect, useRef } from 'react';

const useStudioLight = (videoRef, enabled = true) => {
  const filterRef = useRef(null);
  const overlaysRef = useRef([]);

  const applyStudioLight = async (predictions) => {
    if (!videoRef.current || !enabled || !predictions?.length) return;

    const video = videoRef.current;
    const videoParent = video.parentElement;

    const face = predictions[0];
    const { landmarks } = face;
    // const [x1, y1] = topLeft;
    // const [x2, y2] = bottomRight;

    // Get specific facial landmarks
    const leftEye = landmarks[1];
    const rightEye = landmarks[0];
    const nose = landmarks[2];
    const mouth = landmarks[3];
    const leftCheek = [leftEye[0], mouth[1]];
    const rightCheek = [rightEye[0], mouth[1]];

    // Calculate positions as percentages
    const toPercent = (point) => ({
      x: (point[0] / video.videoWidth) * 100,
      y: (point[1] / video.videoHeight) * 100,
    });

    const eyeLine = toPercent([(leftEye[0] + rightEye[0]) / 2, leftEye[1]]);
    const nosePos = toPercent(nose);
    // const mouthPos = toPercent(mouth);
    const leftCheekPos = toPercent(leftCheek);
    const rightCheekPos = toPercent(rightCheek);

    // Base video adjustments
    const filters = [
      'brightness(0.88)', // Slightly darker base
      'contrast(1.06)', // Subtle contrast
      'saturate(1.02)', // Minimal color enhancement
    ].join(' ');

    filterRef.current = video.style.filter;
    video.style.filter = filters;

    // Setup wrapper
    let wrapper = videoParent.querySelector('.studio-light-wrapper');
    if (!wrapper) {
      wrapper = document.createElement('div');
      wrapper.className = 'studio-light-wrapper';
      Object.assign(wrapper.style, {
        position: 'absolute',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: '1',
        overflow: 'hidden',
      });
      videoParent.appendChild(wrapper);
    }

    // Clear existing overlays
    overlaysRef.current.forEach((overlay) => overlay.remove());
    overlaysRef.current = [];

    // Main face illumination following facial structure
    const mainLight = document.createElement('div');
    mainLight.className = 'studio-light-main';
    Object.assign(mainLight.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      background: `
        radial-gradient(
          circle 40% at ${leftCheekPos.x}% ${eyeLine.y}%, 
          rgba(255,255,255,0.2) 0%,
          rgba(255,255,255,0.1) 30%,
          transparent 60%
        ),
        radial-gradient(
          circle 30% at ${rightCheekPos.x}% ${eyeLine.y}%, 
          rgba(255,255,255,0.15) 0%,
          rgba(255,255,255,0.08) 30%,
          transparent 60%
        )
      `,
      mixBlendMode: 'soft-light',
      transform: 'translateZ(0)',
      opacity: '0.9',
    });
    wrapper.appendChild(mainLight);
    overlaysRef.current.push(mainLight);

    // Precise feature highlights
    const featureHighlights = document.createElement('div');
    featureHighlights.className = 'studio-light-features';
    Object.assign(featureHighlights.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      background: `
        radial-gradient(
          circle 15% at ${(leftEye[0] / video.videoWidth) * 100}% ${(leftEye[1] / video.videoHeight) * 100}%, 
          rgba(255,255,255,0.12) 0%,
          transparent 80%
        ),
        radial-gradient(
          circle 15% at ${(rightEye[0] / video.videoWidth) * 100}% ${(rightEye[1] / video.videoHeight) * 100}%, 
          rgba(255,255,255,0.12) 0%,
          transparent 80%
        ),
        radial-gradient(
          ellipse 20% 15% at ${nosePos.x}% ${nosePos.y}%, 
          rgba(255,255,255,0.1) 0%,
          transparent 100%
        )
      `,
      mixBlendMode: 'screen',
      transform: 'translateZ(0)',
      opacity: '0.7',
    });
    wrapper.appendChild(featureHighlights);
    overlaysRef.current.push(featureHighlights);

    // Soft fill light
    const fillLight = document.createElement('div');
    fillLight.className = 'studio-light-fill';
    Object.assign(fillLight.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      background: `
        radial-gradient(
          circle 60% at ${rightCheekPos.x + 10}% ${eyeLine.y}%, 
          rgba(255,255,255,0.08) 0%,
          transparent 70%
        )
      `,
      mixBlendMode: 'soft-light',
      transform: 'translateZ(0)',
      opacity: '0.6',
    });
    wrapper.appendChild(fillLight);
    overlaysRef.current.push(fillLight);

    // Natural skin tone enhancement
    const skinTone = document.createElement('div');
    skinTone.className = 'studio-light-skin';
    Object.assign(skinTone.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      background: `
        radial-gradient(
          ellipse 70% 90% at 50% ${eyeLine.y}%, 
          rgba(255,228,213,0.07) 0%,
          transparent 70%
        )
      `,
      mixBlendMode: 'color',
      transform: 'translateZ(0)',
      opacity: '0.5',
    });
    wrapper.appendChild(skinTone);
    overlaysRef.current.push(skinTone);

    // Subtle vignette for depth
    const vignette = document.createElement('div');
    vignette.className = 'studio-light-vignette';
    Object.assign(vignette.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      background: `
        radial-gradient(
          ellipse 180% 180% at 50% ${eyeLine.y}%, 
          transparent 40%,
          rgba(0,0,0,0.4) 80%,
          rgba(0,0,0,0.6) 100%
        )
      `,
      mixBlendMode: 'multiply',
      transform: 'translateZ(0)',
      opacity: '0.75',
    });
    wrapper.appendChild(vignette);
    overlaysRef.current.push(vignette);
  };

  useEffect(() => {
    return () => {
      if (videoRef.current) {
        videoRef.current.style.filter = filterRef.current || 'none';
      }
      overlaysRef.current.forEach((overlay) => overlay.remove());
      const wrapper = document.querySelector('.studio-light-wrapper');
      if (wrapper) {
        wrapper.remove();
      }
    };
  }, []);

  return {
    applyStudioLight,
  };
};

export default useStudioLight;
