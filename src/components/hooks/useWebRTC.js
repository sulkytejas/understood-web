import { useRef, useState, useMemo } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import {
  generateDeviceId,
  addOrUpdateTranslatedText,
} from '../utils/peerConnectionUtils';

const useWebRTC = ({
  localTargetLanguage,
  setRemoteTargetLanguage,
  setLocalTargetLanguage,
  setDetectedLanguage,
  remoteTargetLanguage,
}) => {
  const [remoteTrack, setRemoteTrack] = useState(null);
  const [localTrack, setLocalTrack] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [callStarted, setCallStarted] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const [initiateRecongnization, setInitiateRecongnization] = useState(false);
  const [translatedTexts, setTranslatedTexts] = useState([]);
  const [connected, setConnected] = useState(false);

  const candidates = useRef(new Set());
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnection = useRef(null);
  const socket = useRef(null);

  // Setup peerConnection
  const initializePeerConnection = async () => {
    try {
      const turnResponse = await axios.get(
        'http://localhost:5001/api/turnCredentials',
      );

      // const turnResponse = await axios.get('https://socket.platocity.com/turnCredentials');
      const turnConfig = turnResponse.data;

      const configuration = {
        iceServers: [
          {
            urls: 'turn:turn.platocity.com:3478',
            username: turnConfig.username,
            credential: turnConfig.credential,
          },
          {
            urls: 'turns:turn.platocity.com:5349',
            username: turnConfig.username,
            credential: turnConfig.credential,
          },
          //   {
          //     urls: 'stun:stun.l.google.com:19302'
          //   }
        ],
      };

      peerConnection.current = new RTCPeerConnection(configuration);
      console.log(peerConnection.current);

      // Handle incoming media stream from remote peer
      peerConnection.current.ontrack = (event) => {
        console.log('Received remote track');
        setRemoteTrack(event.streams[0]);
        remoteVideoRef.current.srcObject = event.streams[0];
      };

      // When a new ICE candidate is found, this event is triggered
      peerConnection.current.onicecandidate = (event) => {
        if (event.candidate) {
          // Send the ICE candidate to the remote peer via the signaling server
          const candidateString = JSON.stringify(event.candidate);

          if (!candidates.current.has(candidateString)) {
            candidates.current.add(candidateString);
            console.log('Sending candidate:', event.candidate);

            const candidate = {
              candidate: event.candidate.candidate,
              sdpMid: event.candidate.sdpMid,
              sdpMLineIndex: event.candidate.sdpMLineIndex,
              usernameFragment: event.candidate.usernameFragment,
            };

            socket.current.emit('candidate', { ...candidate }, null, false);
          }
        }
      };

      peerConnection.current.oniceconnectionstatechange = () => {
        console.log(
          'ICE connection state:',
          peerConnection.current.iceConnectionState,
        );
        if (peerConnection.current.iceConnectionState === 'failed') {
          console.log('ICE connection failed, restarting ICE...');
          peerConnection.current.restartIce();
        }
      };

      peerConnection.current.onsignalingstatechange = () => {
        console.log(
          'Signaling state change:',
          peerConnection.current.signalingState,
        );
      };

      console.log('Initialized new RTCPeerConnection');
    } catch (error) {
      console.error('Error initializing peer connection:', error);
      throw error;
    }
  };

  useMemo(() => {
    if (remoteTrack) {
      console.log('Received remote track', remoteTrack);
      remoteVideoRef.current.srcObject = remoteTrack;
    }
  }, [remoteTrack]);

  useMemo(() => {
    if (localTrack) {
      console.log('Received remote track', remoteTrack);
      localVideoRef.current.srcObject = localTrack;
    }
  }, [localTrack]);

  const waitForStableState = () => {
    return new Promise((resolve, reject) => {
      const checkState = () => {
        if (peerConnection.current.signalingState === 'stable') {
          resolve();
        } else {
          setTimeout(checkState, 100); // Retry after 100ms
        }
      };
      checkState();
    });
  };

  // Function to get supported codecs for a given media kind
  function getSupportedCodecs(kind) {
    const codecs = RTCRtpSender.getCapabilities(kind).codecs;

    return codecs;
  }

  const createOffer = async () => {
    // if (peerConnection.current && peerConnection.current.signalingState !== 'stable') {
    //     console.warn('Attempted to create offer in non-stable state, ignoring');
    //     return;
    // }

    try {
      // Initialize the peer connection
      if (!peerConnection.current) {
        await initializePeerConnection();
      }

      await waitForStableState();

      const constraints = {
        video: true,
        audio: true,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localVideoRef.current.srcObject = stream;
      setLocalTrack(stream);
      console.log(localVideoRef.current.srcObject, 'localVideoRef');

      if (stream) {
        stream.getTracks().forEach((track) => {
          peerConnection.current.addTrack(track, stream);
          console.log('Added local track to peer connection:', track);
        });
      }

      const videoSender = await peerConnection.current
        .getSenders()
        .find((s) => s.track.kind === 'video');
      const videoTransceiver = await peerConnection.current
        .getTransceivers()
        .find((t) => t.sender === videoSender);

      if (videoTransceiver) {
        const supportedVideoCodecs = getSupportedCodecs('video');
        // Set codec preferences
        const videoCodecs = [
          { mimeType: 'video/AV1' },
          { mimeType: 'video/VP9' },
          { mimeType: 'video/VP8' },
        ];

        const allowedCodecs = supportedVideoCodecs.filter((codec) =>
          videoCodecs.some((c) => codec.mimeType === c.mimeType),
        );

        if (allowedCodecs.length > 0) {
          videoTransceiver.setCodecPreferences(allowedCodecs);
        }
      }

      const audioSender = await peerConnection.current
        .getSenders()
        .find((s) => s.track.kind === 'audio');
      const audioTransceiver = await peerConnection.current
        .getTransceivers()
        .find((t) => t.sender === audioSender);
      if (audioTransceiver) {
        const supportedAudioCodecs = getSupportedCodecs('video');
        const audioCodecs = [
          { mimeType: 'audio/opus', clockRate: 48000 },
          { mimeType: 'audio/PCMU', clockRate: 8000 }, // Fallback codecs
          { mimeType: 'audio/PCMA', clockRate: 8000 },
        ];

        const allowedCodecs = supportedAudioCodecs.filter((codec) =>
          audioCodecs.some((c) => codec.mimeType === c.mimeType),
        );
        if (allowedCodecs.length > 0) {
          audioTransceiver.setCodecPreferences(allowedCodecs);
        }
      }

      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);
      console.log('Created and sent offer', localTargetLanguage);

      socket.current.emit('offer', offer, localTargetLanguage);
      setCallStarted(true);
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  };

  // Offer Handler
  const handleOffer = async (offer, targetLanguage) => {
    console.log('handle offer triggerd');
    if (!peerConnection.current) {
      await initializePeerConnection(); // Ensure peer connection is initialized
    }

    if (peerConnection.current.signalingState !== 'stable') {
      console.warn('Received offer in non-stable state, ignoring');
      return;
    }

    if (targetLanguage) {
      setRemoteTargetLanguage(targetLanguage);
    }

    console.log('Received offer', remoteTargetLanguage);
    // Set the received offer as the remote description

    await peerConnection.current.setRemoteDescription(
      new RTCSessionDescription(offer),
    );
    console.log('Set remote description for offer');
    if (!callStarted) {
      setCallStarted(true);
    }

    const constraints = {
      video: true,
      audio: true,
    };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    localVideoRef.current.srcObject = stream;
    setLocalTrack(stream);

    if (stream) {
      stream.getTracks().forEach((track) => {
        peerConnection.current.addTrack(track, stream);
        console.log('Added local track to peer connection:', track);
      });
    }

    // Create an answer and set it as the local description
    const answer = await peerConnection.current.createAnswer();
    await peerConnection.current.setLocalDescription(answer);

    console.log('localTargetLanguage', localTargetLanguage);
    // Send the answer back to the remote peer
    socket.current.emit('answer', answer, localTargetLanguage);
  };

  // Answer Handler
  const handleAnswer = async (answer, targetLanguage) => {
    console.log(
      'peerConnection.current.signalingState:',
      peerConnection.current.signalingState,
    );
    if (peerConnection.current.signalingState !== 'have-local-offer') {
      console.warn('Received answer in non-have-local-offer state, ignoring');
      return;
    }
    console.log('Received answer');

    if (targetLanguage) {
      setRemoteTargetLanguage(targetLanguage);
    }
    // Set the received answer as the remote description
    await peerConnection.current.setRemoteDescription(
      new RTCSessionDescription(answer),
    );
    console.log('Set remote description for answer');
  };

  const initializeSocket = () => {
    // socket.current = io('https://socket.platocity.com');
    socket.current = io('http://localhost:5001');

    socket.current.on('connect', () => {
      setConnected(true);
      const deviceId = generateDeviceId();
      socket.current.emit('registerDevice', deviceId);

      console.log('Connected to signaling server');
    });

    // socket event

    socket.current.on('roleAssignment', (role) => setUserRole(role));
    socket.current.on('offer', handleOffer);
    socket.current.on('answer', handleAnswer);

    socket.current.on('candidate', async (candidate) => {
      console.log('Received candidate:', candidate);

      try {
        const iceCandidate = new RTCIceCandidate({
          candidate: candidate.candidate,
          sdpMid: candidate.sdpMid,
          sdpMLineIndex: candidate.sdpMLineIndex,
          usernameFragment: candidate.usernameFragment,
        });

        console.log(
          'Adding ICE candidate:',
          iceCandidate,
          peerConnection.current,
        );
        await peerConnection.current.addIceCandidate(iceCandidate);
        console.log('Added ICE candidate');
      } catch (error) {
        console.error('Error adding received ICE candidate', error);
      }
    });

    socket.current.on('recognizedText', (text) => {
      setRecognizedText(text);
    });

    socket.current.on('translatedText', ({ text, id, isFinal }) => {
      addOrUpdateTranslatedText(id, text, isFinal);
    });

    // Listen for disconnection message
    socket.current.on('userCallDisconnected', () => {
      handleDisconnectCall();
    });
  };

  const handleDisconnectCall = () => {
    // Notify remote user
    socket.current.emit('userCallDisconnected');

    if (socket.current) {
      socket.current.disconnect();
    }

    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }

    if (localVideoRef.current && localVideoRef.current.srcObject) {
      localVideoRef.current.srcObject.getTracks().forEach((track) => {
        track.stop();
      });

      localVideoRef.current.srcObject = null;
    }

    if (remoteVideoRef.current && remoteVideoRef.current.srcObject) {
      remoteVideoRef.current.srcObject.getTracks().forEach((track) => {
        track.stop();
      });

      localVideoRef.current.srcObject = null;
    }

    setCallStarted(false);
    setConnected(false);
    setUserRole(null);
    setLocalTargetLanguage('');
    setRemoteTargetLanguage('');
    setRecognizedText('');
    setTranslatedTexts([]);
    setDetectedLanguage(null);
  };

  return {
    initializePeerConnection,
    initializeSocket,
    handleDisconnectCall,
    createOffer: () => createOffer(), // Ensure this accesses the latest ref values
    handleAnswer: (answer, targetLanguage) =>
      handleAnswer(answer, targetLanguage),
    handleOffer: (offer, targetLanguage) => handleOffer(offer, targetLanguage),
    socket,
    localVideoRef,
    setLocalTrack,
    setInitiateRecongnization,
    peerConnection,
    userRole,
    callStarted,
    localTrack,
    remoteVideoRef,
    translatedTexts,
    initiateRecongnization,
  };
};

export default useWebRTC;
