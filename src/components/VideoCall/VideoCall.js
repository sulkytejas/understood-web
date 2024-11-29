/* eslint-disable */
import React, { useEffect, useState, useRef } from 'react';

import TranslationOverlay from './TranslationOverlay';
import VideoControls from './VideoControls';

import VideoPlayer from './VideoPlayer';
import { useSocket } from '../context/SocketContext';
// import { useWebRTC } from '../context/WebrtcContext';
import { useWebRTC } from '../context/WebrtcBridge';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';

const pageVariants = {
  initial: { opacity: 0 },
  in: { opacity: 1 },
  out: { opacity: 0 },
};
const pageTransition = {
  duration: 0.3,
};

const VideoCall = () => {
  const [detectedLanguage, setDetectedLanguage] = useState(null);
  const [translatedTexts, setTranslatedTexts] = useState({ text: '' });
  const [isRemoteConnected, setIsRemoteConnected] = useState(false);

  const remoteVideoRef = useRef(null);
  const videoContainerRef = useRef(null);

  const localTranslationLanguage = useSelector(
    (state) => state.translation.localTranslationLanguage,
  );

  const userUid = useSelector((state) => state.user.uid);

  const {
    // startStreaming,
    handleDisconnectCall,
    localStream,
    remoteStream,
    callStarted,
    connectionState,
  } = useWebRTC();

  const { socket } = useSocket();

  console.log(connectionState, 'connectionState');

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (socket) {
        handleDisconnectCall();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [socket]);
  console.log(remoteStream, 'remoteTrack');

  // useEffect(() => {
  //   if (remoteVideoRef.current) {
  //     if (remoteStream && remoteStream.getTracks().length > 0 && callStarted) {
  //       console.log(
  //         'Setting remote stream with tracks:',
  //         remoteStream.getTracks(),
  //       );
  //       remoteVideoRef.current.srcObject = remoteStream;
  //       setIsRemoteConnected(true);
  //     } else {
  //       console.log('No remote stream or tracks yet');
  //       remoteVideoRef.current.srcObject = null;
  //       setIsRemoteConnected(false);
  //     }
  //   }
  // }, [remoteStream, callStarted, remoteVideoRef]);

  useEffect(() => {
    if (socket) {
      if (localTranslationLanguage) {
        socket.emit('updateLanguages', {
          uid: userUid,
          translationLanguage: localTranslationLanguage,
        });
      }
    }
  }, [socket]);

  const handleClick = () => {
    handleDisconnectCall();
  };

  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
    >
      <div className="video-chat" ref={videoContainerRef}>
        <VideoPlayer
          localStream={localStream}
          remoteTrack={remoteStream}
          remoteVideoRef={remoteVideoRef}
          videoContainerRef={videoContainerRef}
          callStarted={callStarted}
          connectionState={connectionState}
          isRemoteConnected={isRemoteConnected}
        />
        <TranslationOverlay
          detectedLanguage={detectedLanguage}
          localTargetLanguage={localTranslationLanguage}
          setTranslatedTexts={setTranslatedTexts}
          socket={socket}
          callStarted={callStarted}
        />

        <VideoControls
          callStarted={callStarted}
          onCallToggle={handleClick}
          translatedTexts={translatedTexts}
          setTranslatedTexts={setTranslatedTexts}
        />
      </div>
    </motion.div>
  );
};

export default VideoCall;
