/* eslint-disable */
import React, { useEffect, useState, useMemo, useRef } from 'react';
import useWebRTC from '../hooks/useWebRTC';
import TranslationOverlay from './TranslationOverlay';
import VideoControls from './VideoControls';
import TranslatedTextView from './TranslatedText';
import VideoPlayer from './VideoPlayer';
import { useSocket } from '../context/SocketContext';
import { useSelector } from 'react-redux';

const VideoCall = () => {
  const [localTargetLanguage, setLocalTargetLanguage] = useState('');
  const [remoteTargetLanguage, setRemoteTargetLanguage] = useState('');
  const [detectedLanguage, setDetectedLanguage] = useState(null);
  const [translatedTexts, setTranslatedTexts] = useState([]);

  // eslint-disable-next-line no-unused-vars
  const [languageCounts, setLanguageCounts] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [activeRequests, setActiveRequests] = useState(0);

  const meetingId = useSelector((state) => state.meeting.meetingId);
  const hostId = useSelector((state) => state.meeting.hostId);

  const {
    initializeWebRTCSocket,
    handleDisconnectCall,
    // localVideoRef,
    setLocalTrack,
    setInitiateRecongnization,
    peerConnection,
    userRole,
    callStarted,
    localTrack,
    remoteVideoRef,
    remoteTrack,
  } = useWebRTC({
    localTargetLanguage,
    setRemoteTargetLanguage,
    setLocalTargetLanguage,
    setDetectedLanguage,
    remoteTargetLanguage,
    setTranslatedTexts,
  });

  const socket = useSocket();
  const localVideoRef = useRef(null);

  useEffect(() => {
    if (localTrack && localVideoRef.current) {
      localVideoRef.current.srcObject = localTrack;
    }
  }, [localTrack]);

  console.log(
    localVideoRef.current?.srcObject,
    'localtrack',
    localTrack,
    'callStarted',
  );
  // Initialize socket connection
  useEffect(() => {
    if (socket) {
      socket.off('createOfferForMeeting');
      socket.off('roleAssignment');
      socket.off('offer');
      socket.off('answer');
      socket.off('candidate');
      socket.off('userCallDisconnected');

      initializeWebRTCSocket();
    }

    return () => {
      socket.off('createOfferForMeeting');
      socket.off('roleAssignment');
      socket.off('offer');
      socket.off('answer');
      socket.off('candidate');
      socket.off('userCallDisconnected');
    };
  }, [socket]);

  useEffect(() => {
    // const handleBeforeUnload = () => {
    //   if (socket) {
    //     socket.emit('userCallDisconnected');
    //     socket.disconnect();
    //   }
    // };

    const constraints = {
      video: true,
      audio: true,
    };

    // Capture local media stream (video and audio)

    navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      setLocalTrack(stream);
    });

    // window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      // window.removeEventListener('beforeunload', handleBeforeUnload);
      if (peerConnection.current) {
        peerConnection.current.close();
      }

      // if (socket) {
      //   socket.disconnect();
      // }
    };
  }, [socket]);

  const handleClick = () => {
    handleDisconnectCall();
  };

  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        const base64data = reader.result.split(',')[1];
        resolve(base64data);
      };

      reader.onerror = (error) => reject(error);
    });
  };

  useEffect(() => {
    // Get raw text from other person
    socket.off('speakerText');

    socket.on('speakerText', (text, isFinal, id) => {
      console.log('received raw text', text);
      socket.emit('translateText', text, localTargetLanguage, isFinal, id);
    });

    return () => {
      socket.off('speakerText');
    };
  }, [localTargetLanguage]);

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
        localVideoRef={localVideoRef}
        remoteVideoRef={remoteVideoRef}
        localTrack={localTrack}
        remoteTrack={remoteTrack}
        callStarted={callStarted}
      />
      <TranslationOverlay
        detectedLanguage={detectedLanguage}
        localTargetLanguage={localTargetLanguage}
        userRole={userRole}
        socket={socket}
      />

      {/* <TranslatedTextView translatedTexts={translatedTexts} /> */}

      <VideoControls
        callStarted={callStarted}
        localTargetLanguage={localTargetLanguage}
        setLocalTargetLanguage={setLocalTargetLanguage}
        onCallToggle={handleClick}
        translatedTexts={translatedTexts}
      />
    </div>
  );
};

export default VideoCall;
