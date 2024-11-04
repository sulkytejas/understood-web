// AudioTranscriptionContext.js

import React, { createContext, useContext, useRef } from 'react';
import { useSocket } from './SocketContext';

const AudioTranscriptionContext = createContext();

export const useAudioTranscription = () =>
  useContext(AudioTranscriptionContext);

export const AudioTranscriptionProvider = ({ children }) => {
  const { socket } = useSocket();
  const audioContextRef = useRef(null);
  const audioWorkletNodeRef = useRef(null);
  const sourceNodeRef = useRef(null);

  async function startAudioStream(stream) {
    try {
      // Create an AudioContext if it doesn't exist
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext ||
          window.webkitAudioContext)();
      }

      // Create a MediaStreamAudioSourceNode from the microphone input
      const source = audioContextRef.current.createMediaStreamSource(stream);
      sourceNodeRef.current = source;

      // Load the AudioWorklet module
      await audioContextRef.current.audioWorklet.addModule('/processor.js');

      // Create an instance of the AudioWorkletNode
      const audioWorkletNode = new AudioWorkletNode(
        audioContextRef.current,
        'processor',
        {
          processorOptions: { bufferSize: 1024 },
        },
      );
      audioWorkletNodeRef.current = audioWorkletNode;

      // Connect the nodes
      source.connect(audioWorkletNode);
      audioWorkletNode.connect(audioContextRef.current.destination);

      console.log(
        'AudioContext sample rate:',
        audioContextRef.current.sampleRate,
      );

      // Handle messages from the AudioWorkletNode
      audioWorkletNode.port.onmessage = (event) => {
        const audioBuffer = event.data.buffer;

        // Emit the audio buffer data to the server via Socket.IO in real-time
        if (socket && socket.connected) {
          socket.emit('practiceModeAudioData', audioBuffer);
        }
      };
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  }

  function stopAudioStream() {
    // Disconnect and close AudioWorkletNode and AudioContext
    if (audioWorkletNodeRef.current) {
      audioWorkletNodeRef.current.disconnect();
      audioWorkletNodeRef.current.port.close();
      audioWorkletNodeRef.current = null;
    }

    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  }

  return (
    <AudioTranscriptionContext.Provider
      value={{
        startAudioStream,
        stopAudioStream,
      }}
    >
      {children}
    </AudioTranscriptionContext.Provider>
  );
};
