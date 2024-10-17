import { useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { useSelector } from 'react-redux';

const useTranslation = ({ callStarted }) => {
  const mediaRecorderRef = useRef(null);
  const isRecordingActive = useRef(false);
  const shouldRestartRecording = useRef(true);
  const segmentCounter = useRef(0);
  const { socket } = useSocket();

  const localSpokenLanguage = useSelector(
    (state) => state.translation.localSpokenLanguage,
  );
  const isAudioPaused = useSelector((state) => state.videoPlayer.audioPause);
  const meetingId = useSelector((state) => state.meeting.meetingId);

  const handleDataAvailable = (event) => {
    if (event.data && event.data.size > 0) {
      const audioBlob = event.data;
      const segmentId = segmentCounter.current;

      audioBlob.arrayBuffer().then((audioBuffer) => {
        // const uint8Array = new Uint8Array(audioBuffer);
        console.log('Sending audio buffer of size:', audioBuffer.byteLength);
        socket.emit(
          'audioDatas',
          { audioBuffer: audioBuffer },
          segmentId,
          meetingId,
        );
        segmentCounter.current++;
      });
    }
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

  // const handleDataAvailable = async (event) => {
  //   if (event.data && event.data.size > 0) {
  //     const audioBlob = event.data;
  //     const segmentId = segmentCounter.current;

  //     const base64AudioData = await blobToBase64(audioBlob);
  //     console.log('Sending base64 audio data of size:', base64AudioData.length);
  //     socket.emit('audioData', base64AudioData, segmentId, meetingId);
  //     segmentCounter.current++;
  //   }
  // };

  const initializeRecording = () => {
    if (mediaRecorderRef.current) {
      return;
    }

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        // Choose an appropriate MIME type
        let options = { mimeType: 'audio/webm; codecs=opus' };
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          options = { mimeType: 'audio/webm' };
          if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            options = { mimeType: '' }; // Let the browser choose
          }
        }

        const mediaRecorder = new MediaRecorder(stream, options);

        mediaRecorder.ondataavailable = handleDataAvailable;

        mediaRecorder.onstart = () => {
          isRecordingActive.current = true;
          console.log('MediaRecorder started.');
        };

        mediaRecorder.onstop = () => {
          isRecordingActive.current = false;
          console.log('MediaRecorder stopped.');
          if (shouldRestartRecording.current) {
            try {
              mediaRecorder.start(5000); // Start recording with 1-second chunks
            } catch (error) {
              console.error('Failed to restart MediaRecorder:', error);
            }
          }
        };

        mediaRecorder.onerror = (event) => {
          console.error('MediaRecorder error:', event.error);
        };

        mediaRecorderRef.current = mediaRecorder;

        // Start recording with 1-second timeslices
        mediaRecorder.start(5000);
      })
      .catch((error) => {
        console.error('Error accessing microphone:', error);
        alert(
          'Microphone access is required for speech recognition. Please enable microphone permissions.',
        );
      });
  };

  useEffect(() => {
    if (callStarted) {
      socket.emit('startRecognitions', {
        meetingId,
        userSpokenLanguage: localSpokenLanguage,
      });
    }
  }, [callStarted]);

  useEffect(() => {
    if (isAudioPaused || !callStarted) {
      if (mediaRecorderRef.current && isRecordingActive.current) {
        mediaRecorderRef.current.stop();
        shouldRestartRecording.current = false;
        isRecordingActive.current = false;
      }
      return;
    }

    shouldRestartRecording.current = true;
    initializeRecording();

    return () => {
      if (mediaRecorderRef.current && isRecordingActive.current) {
        mediaRecorderRef.current.stop();
        shouldRestartRecording.current = false;
        isRecordingActive.current = false;
      }
    };
  }, [isAudioPaused, callStarted]);

  return {};
};

export default useTranslation;
