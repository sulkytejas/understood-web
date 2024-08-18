import React from 'react';

const VideoPlayer = ({ localVideoRef, remoteVideoRef, callStarted }) => {
  return (
    <div className="video-player">
      <video
        className="local-video"
        ref={callStarted ? remoteVideoRef : localVideoRef}
        autoPlay
        playsInline
        muted={!callStarted}
      />
      <div className="remote-video">
        <video
          ref={callStarted ? localVideoRef : remoteVideoRef}
          autoPlay
          playsInline
          muted
        />
      </div>
    </div>
  );
};

export default VideoPlayer;
