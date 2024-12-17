import React from 'react';

const PiPVideo = React.memo(({ videoRef }) => {
  console.log('PiPVideo:', videoRef.current);
  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
    />
  );
});

PiPVideo.displayName = 'PiPVideo';

export default PiPVideo;
