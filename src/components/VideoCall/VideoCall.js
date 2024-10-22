/* eslint-disable */
import React, { useEffect, useState, useMemo, useRef } from 'react';
// import useWebRTC from '../hooks/useWebRTC';
// import TranslationOverlay from './TranslationOverlay';
import VideoControls from './VideoControls';

import VideoPlayer from './VideoPlayer';
import { useSocket } from '../context/SocketContext';
import { useWebRTC } from '../context/WebrtcContext';
import { useSelector } from 'react-redux';

const VideoCall = () => {
  const [detectedLanguage, setDetectedLanguage] = useState(null);
  const [translatedTexts, setTranslatedTexts] = useState({ text: '' });

  const remoteVideoRef = useRef(null);

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
    }
  }, [remoteStream]);

  const handleClick = () => {
    handleDisconnectCall();
  };

  // const blobToBase64 = (blob) => {
  //   return new Promise((resolve, reject) => {
  //     const reader = new FileReader();
  //     reader.readAsDataURL(blob);
  //     reader.onloadend = () => {
  //       const base64data = reader.result.split(',')[1];
  //       resolve(base64data);
  //     };

  //     reader.onerror = (error) => reject(error);
  //   });
  // };

  // useEffect(() => {
  //   // Get raw text from other person
  //   socket.off('speakerText');

  //   socket.on('speakerText', (text, isFinal, id) => {
  //     socket.emit('translateText', text, localTranslationLanguage, isFinal, id);
  //   });

  //   return () => {
  //     socket.off('speakerText');
  //   };
  // }, [localTranslationLanguage]);

  // useEffect(() => {
  //   if (!localTrack || !callStarted) return;

  //   const audioTracks = localTrack.getAudioTracks();
  //   const audioStream = new MediaStream(audioTracks);

  //   const mediaRecorder = new MediaRecorder(audioStream);

  //   let timeoutId;

  //   const startRecording = () => {
  //     if (mediaRecorder.state === 'recording') {
  //       mediaRecorder.stop(); // Stop the existing recording if it's already recording
  //     }

  //     mediaRecorder.ondataavailable = async (event) => {
  //       console.log('triggered on data');
  //       if (event.data.size > 0) {
  //         const audioContent = await blobToBase64(event.data);
  //         setActiveRequests((prev) => prev + 1);
  //         socket.emit('detectLanguage', { audioContent });
  //       }
  //     };

  //     mediaRecorder.start();

  //     timeoutId = setTimeout(() => {
  //       mediaRecorder.stop();
  //       console.log('Recording stopped after 5 seconds');
  //     }, 5000); // Stop recording after 5 seconds
  //   };

  //   startRecording();

  //   const handleLanguageDetected = (detectedLanguage) => {
  //     let localLanguageCount = 0;
  //     if (detectedLanguage !== 'no-language') {
  //       setLanguageCounts((prevCounts) => {
  //         const updateCounts = [...prevCounts, detectedLanguage];
  //         localLanguageCount = updateCounts.length;
  //         const languageFrequncy = updateCounts.reduce((acc, lang) => {
  //           acc[lang] = (acc[lang] || 0) + 1;

  //           return acc;
  //         }, {});

  //         if (updateCounts.length <= 7) {
  //           const mostFrequnctLanguage = Object.keys(languageFrequncy).reduce(
  //             (a, b) => (languageFrequncy[a] > languageFrequncy[b] ? a : b),
  //           );
  //           setDetectedLanguage(mostFrequnctLanguage);

  //           return updateCounts;
  //         } else {
  //           return updateCounts;
  //         }
  //       });

  //       setActiveRequests((prev) => {
  //         const newCount = prev - 1;

  //         if (newCount === 0 && localLanguageCount < 5) {
  //           startRecording();
  //         }

  //         return newCount;
  //       });
  //     }
  //   };
  //   startRecording();
  //   socket.on('languageDetected', handleLanguageDetected);

  //   return () => {
  //     socket.off('languageDetected', handleLanguageDetected);
  //     if (timeoutId) {
  //       clearTimeout(timeoutId); // Clear the timeout if the effect is cleaned up
  //     }
  //   };
  // }, [localVideoRef.current?.srcObject, callStarted, socket]);

  return (
    <div className="video-chat">
      <VideoPlayer
        localStream={localStream}
        // remoteTrack={remoteStream}
        remoteVideoRef={remoteVideoRef}
        // remoteAudioRef={remoteAudioRef}
        connectionState={connectionState}
      />
      {/* <TranslationOverlay
        detectedLanguage={detectedLanguage}
        localTargetLanguage={localTranslationLanguage}
        setTranslatedTexts={setTranslatedTexts}
        socket={socket}
        callStarted={callStarted}
      /> */}

      <VideoControls
        callStarted={callStarted}
        onCallToggle={handleClick}
        translatedTexts={translatedTexts}
        setTranslatedTexts={setTranslatedTexts}
      />
    </div>
  );
};

export default VideoCall;
