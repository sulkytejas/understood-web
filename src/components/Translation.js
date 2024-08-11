import { useEffect, useRef, useState } from 'react';

const Translation = ({ role, detectedLanguage, socket, targetLanguage }) => {
  const [recognizing, setRecognizing] = useState(false);
  const recognitionRef = useRef(null);
  const isRecongnitionActive = useRef(false);
  const segmentCounter = useRef(0);

  // Handle transcript results
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

    const segmentId = segmentCounter.current;

    if (finalTranscript) {
      socket.emit(
        'translateText',
        finalTranscript,
        targetLanguage,
        true,
        segmentId,
      );
      segmentCounter.current++;
    } else {
      socket.emit(
        'translateText',
        interimTranscript,
        targetLanguage,
        false,
        segmentId,
      );
    }
  };

  // Initial speech instance
  const initializeRecognition = () => {
    if (recognitionRef.current) {
      return; // Prevent multiple initializations
    }

    const recognition = new (window.webkitSpeechRecognition ||
      window.SpeechRecognition)();
    recognition.lang = detectedLanguage;
    recognition.interimResults = true;
    recognition.continous = true;

    recognition.onstart = () => {
      setRecognizing(true);
      isRecongnitionActive.current = true;

      console.log(`[${role}] Speech recognition started.`);
    };

    recognition.onend = () => {
      if (isRecongnitionActive.current) {
        recognition.start();
      } else {
        setRecognizing(false);
      }
    };

    recognition.onresult = handleResult;

    recognition.onerror = (event) => {
      console.error('Speech recognition error', event);

      // Handle 'not-allowed' error specifically
      if (event.error === 'not-allowed') {
        alert(
          'Microphone access is not allowed. Please enable the microphone permissions.',
        );
        recognition.stop();
      }
      // Restart recognition on other errors
      if (event.error === 'aborted' || event.error === 'network') {
        recognition.stop();
        if (isRecongnitionActive.current) {
          recognition.start();
        }
      }
    };

    recognitionRef.current = recognition;
  };

  useEffect(() => {
    initializeRecognition();
    // Request microphone permissions
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then(() => {
        console.log(isRecongnitionActive.current);
        if (!isRecongnitionActive.current) {
          recognitionRef.current.start();
          isRecongnitionActive.current = true;
        }
      })
      .catch((err) => {
        console.error(`[${role}] Microphone access denied`, err);
        alert(
          'Microphone access is required for speech recognition. Please enable the microphone permissions.',
        );
      });

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        isRecongnitionActive.current = false;
      }
    };
  }, [role, detectedLanguage]);

  // useEffect(() => {
  //     if (userSpeechToText){
  //         socket.emit('userSpeechToText',userSpeechToText);
  //     }
  // },[userSpeechToText,socket]);

  return <></>;
};

export default Translation;
