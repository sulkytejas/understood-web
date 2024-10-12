import { useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { useSelector } from 'react-redux';

const useTranslation = () => {
  const recognitionRef = useRef(null);
  const isRecognitionActive = useRef(false);
  const shouldRestartRecognition = useRef(true);
  const segmentCounter = useRef(0);
  const { socket } = useSocket();

  const localSpokenLanguage = useSelector(
    (state) => state.translation.localSpokenLanguage,
  );

  console.log('localSpokenLanguage', localSpokenLanguage);

  const meetingId = useSelector((state) => state.meeting.meetingId);

  // useEffect(() => {
  //   if (socket) {
  //     socket.on('speakerRawText', (text, isFinal, id, meetingId) => {
  //       socket.broadcast.to(meetingId).emit('speakerText', text, isFinal, id);
  //     });
  //   }
  // }, [socket]);

  const handleResult = (event) => {
    let finalTranscript = '';
    let interimTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }
    console.log('Raw transcript:', finalTranscript || interimTranscript);
    const segmentId = segmentCounter.current;

    if (finalTranscript) {
      socket.emit('translateText', finalTranscript, true, segmentId, meetingId);
      segmentCounter.current++;
    } else {
      socket.emit(
        'translateText',
        interimTranscript,
        false,
        segmentId,
        meetingId,
      );
    }
  };

  const initializeRecognition = () => {
    if (recognitionRef.current) {
      return;
    }

    const recognition = new (window.webkitSpeechRecognition ||
      window.SpeechRecognition)();
    recognition.lang = localSpokenLanguage;
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onstart = () => {
      isRecognitionActive.current = true;
      console.log(` Speech recognition started.`);
    };

    recognition.onend = () => {
      isRecognitionActive.current = false;
      if (shouldRestartRecognition.current) {
        try {
          recognition.start();
        } catch (error) {
          console.error('Failed to restart speech recognition:', error);
        }
      }
    };

    recognition.onresult = handleResult;

    recognition.onerror = (event) => {
      if (event.error === 'not-allowed') {
        alert(
          'Microphone access is not allowed. Please enable the microphone permissions.',
        );
        shouldRestartRecognition.current = false;
        recognition.stop();
      } else if (event.error === 'aborted' || event.error === 'network') {
        // recognition.stop();
        // if (isRecognitionActive.current) {
        //   recognition.start();
        // }

        console.warn('Speech recognition aborted or network error.');
      }
    };

    recognitionRef.current = recognition;
  };

  useEffect(() => {
    initializeRecognition();

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then(() => {
        if (!isRecognitionActive.current) {
          recognitionRef.current.start();
          isRecognitionActive.current = true;
        }
      })
      .catch(() => {
        alert(
          'Microphone access is required for speech recognition. Please enable the microphone permissions.',
        );
      });

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        shouldRestartRecognition.current = false;
        // isRecognitionActive.current = false;
      }
    };
  }, []);

  return {};
};

export default useTranslation;
