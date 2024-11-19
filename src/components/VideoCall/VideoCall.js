/* eslint-disable */
import React, { useEffect, useState, useRef } from 'react';

import TranslationOverlay from './TranslationOverlay';
import VideoControls from './VideoControls';

import VideoPlayer from './VideoPlayer';
import { useSocket } from '../context/SocketContext';
import { useWebRTC } from '../context/WebrtcContext';
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

  const remoteVideoRef = useRef(null);
  const videoContainerRef = useRef(null);

  const localTranslationLanguage = useSelector(
    (state) => state.translation.localTranslationLanguage,
  );

  const {
    startStreaming,
    handleDisconnectCall,
    localStream,
    remoteStream,
    callStarted,
    connectionState,
  } = useWebRTC();

  const { socket } = useSocket();

  useEffect(() => {
    startStreaming();
  }, []);

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
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    } else if (remoteVideoRef.current.srcObject) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  useEffect(() => {
    if (socket) {
      if (localTranslationLanguage) {
        socket.emit('setLanguagePreference', {
          languageCode: localTranslationLanguage,
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
          // remoteAudioRef={remoteAudioRef}
          connectionState={connectionState}
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
