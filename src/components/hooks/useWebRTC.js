/* eslint-disable */
import { useRef, useState, useMemo } from 'react';
import axios from 'axios';
import { useDispatch } from 'react-redux';

import { addOrUpdateTranslatedText } from '../utils/peerConnectionUtils';
import { useSelector } from 'react-redux';
import { useSocket } from '../context/SocketContext';

import { selectMeetingId } from '../../redux/meetingSlice';
import { cleanupState } from '../../redux/actions';

const useWebRTC = ({
  localTargetLanguage,
  setRemoteTargetLanguage,
  setLocalTargetLanguage,
  setDetectedLanguage,
  setTranslatedTexts,
}) => {
  const [remoteTrack, setRemoteTrack] = useState(null);
  const [localTrack, setLocalTrack] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [callStarted, setCallStarted] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [recognizedText, setRecognizedText] = useState('');
  const [initiateRecongnization, setInitiateRecongnization] = useState(false);

  // eslint-disable-next-line no-unused-vars
  const [connected, setConnected] = useState(false);
  const socket = useSocket();
  const offerCreated = useRef(false);

  const candidates = useRef(new Set());
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnection = useRef(null);
  const hostStartedMeeting = useRef(false);
  // const participantJoinedMeeting = useRef(false);

  const meetingId = useSelector(selectMeetingId);
  const hostSocketIdRedux = useSelector((state) => state.meeting.hostSocketId);
  const translationLanguage = useSelector(
    (state) => state.translation.localTranslationLanguage,
  );

  const dispatch = useDispatch();

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
        console.log(
          'Received remote track in peerConnection',
          event.streams[0],
        );
        setRemoteTrack(event.streams[0]);
        // remoteVideoRef.current.srcObject = event.streams[0];
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

            socket.emit('candidate', { ...candidate }, meetingId);
          }
        }
      };

      peerConnection.current.oniceconnectionstatechange = () => {
        console.log(
          'ICE connection state:',
          peerConnection.current.iceConnectionState,
        );
        if (
          peerConnection.current.iceConnectionState === 'failed' ||
          peerConnection.current.iceConnectionState === 'disconnected'
        ) {
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

  // useMemo(() => {
  //   if (localTrack) {
  //     console.log('Received local track', localTrack);
  //     localVideoRef.current.srcObject = localTrack;
  //   }
  // }, [localTrack]);

  const waitForStableState = () => {
    return new Promise((resolve) => {
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

  let isCreateOfferTriggered = false;
  const createOffer = async () => {
    // if (peerConnection.current && peerConnection.current.signalingState !== 'stable') {
    //     console.warn('Attempted to create offer in non-stable state, ignoring');
    //     return;
    // }
    console.log('create offer triggered');
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

      setLocalTrack(stream);

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

      if (!isCreateOfferTriggered) {
        const offer = await peerConnection.current.createOffer();
        await peerConnection.current.setLocalDescription(offer);
        console.log('Created and sent offer', localTargetLanguage);
        socket.emit('offer', offer, localTargetLanguage, meetingId);
        setCallStarted(true);
        isCreateOfferTriggered = true;
      }
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  };

  // Retry mechanism for remote description
  const retrySetRemoteDescription = async (
    description,
    retries = 3,
    delay = 1000,
  ) => {
    for (let i = 0; i < retries; i++) {
      try {
        if (
          peerConnection.current.signalingState === 'stable' ||
          peerConnection.current.signalingState === 'have-local-offer'
        ) {
          await peerConnection.current.setRemoteDescription(
            new RTCSessionDescription(description),
          );
          console.log('Set remote description after retry');
          return;
        } else {
          console.warn(
            'Signaling state not ready for setting remote description. Retrying...',
          );
          await new Promise((res) => setTimeout(res, delay));
        }
      } catch (error) {
        console.error('Retry failed to set remote description:', error);
      }
    }
    console.error('Failed to set remote description after retries');
  };

  let isAnswerCreated = false;

  // Offer Handler
  const handleOffer = async (offer, targetLanguage) => {
    console.log('handle offer triggerd');
    if (!peerConnection.current) {
      await initializePeerConnection(); // Ensure peer connection is initialized
    }

    // if (peerConnection.current.signalingState !== 'stable') {
    //   console.warn('Received offer in non-stable state, ignoring');
    //   return;
    // }

    if (targetLanguage) {
      setRemoteTargetLanguage(targetLanguage);
    }

    // // Set the received offer as the remote description

    try {
      await retrySetRemoteDescription(offer);
    } catch (error) {
      console.error('Failed to handle offer:', error);
    }
    console.log('Set remote description for offer');

    if (!callStarted) {
      setCallStarted(true);
    }

    const constraints = {
      video: true,
      audio: true,
    };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    setLocalTrack(stream);

    if (stream) {
      stream.getTracks().forEach((track) => {
        peerConnection.current.addTrack(track, stream);
        console.log('Added local track to peer connection:', track);
      });
    }

    if (!isAnswerCreated) {
      // Create an answer and set it as the local description
      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);

      console.log('localTargetLanguage', localTargetLanguage);
      // Send the answer back to the remote peer
      socket.emit('answer', answer, localTargetLanguage, meetingId);
      isAnswerCreated = true;
    }
  };

  // Answer Handler
  const handleAnswer = async (answer, targetLanguage) => {
    console.log(
      'peerConnection.current.signalingState:',
      peerConnection.current.signalingState,
    );
    console.log('Received answer');

    if (targetLanguage) {
      setRemoteTargetLanguage(targetLanguage);
    }
    // Set the received answer as the remote description
    try {
      await retrySetRemoteDescription(answer);
    } catch (error) {
      console.error('Failed to handle answer:', error);
    }

    console.log('Set remote description for answer');
  };

  const handleParticipantDisconnect = (participantId) => {
    console.log('Participant disconnected:', participantId);

    if (peerConnection.current) {
      // Remove all tracks associated with the participant
      const senders = peerConnection.current.getSenders();
      senders.forEach((sender) => {
        if (sender.track) {
          sender.track.stop();
          peerConnection.current.removeTrack(sender);
        }
      });
    }

    // Reset offer creation state to allow for new offer on rejoin
    offerCreated.current = false;
    isCreateOfferTriggered = false;
    setCallStarted(false);
    setRemoteTrack(null);
  };

  const initializeWebRTCSocket = () => {
    if (!socket) {
      return;
    }

    // socket event
    socket.on('roleAssignment', (role) => setUserRole(role));
    socket.on('offer', handleOffer);
    socket.on('answer', handleAnswer);

    socket.on('candidate', async (candidate) => {
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

    socket.on('recognizedText', (text) => {
      setRecognizedText(text);
    });

    socket.on('translatedText', ({ text, id, isFinal }) => {
      addOrUpdateTranslatedText(id, text, isFinal, setTranslatedTexts);
    });

    socket.on('createOfferForMeeting', async ({ hostSocketId }) => {
      console.log('created offer called', offerCreated.current);
      if (hostSocketId === socket.id && !offerCreated.current) {
        // Now that both User A and User B are connected, create the offer
        offerCreated.current = true;
        await createOffer();
      }
    });

    // Listen for disconnection message
    socket.on('endMeeting', (message) => {
      console.log(message);
      handleDisconnectCall();
    });

    socket.on('participantDisconnected', handleParticipantDisconnect);

    if (!hostStartedMeeting.current) {
      if (hostSocketIdRedux === socket.id) {
        socket.emit('hostStartMeeting', meetingId);
      } else {
        socket.emit('joinMeeting', meetingId);
      }
      hostStartedMeeting.current = true;
    }

    // if (hostSocketIdRedux === socket.id && !hostStartedMeeting.current) {
    //   socket.emit('hostStartMeeting', meetingId);
    //   hostStartedMeeting.current = true;
    // } else if (!participantJoinedMeeting.current) {
    //   console.log('asking to join meeting');
    //   socket.emit('joinMeeting', meetingId);
    //   participantJoinedMeeting.current = true;
    // }
  };

  const handleDisconnectCall = () => {
    if (socket) {
      socket.disconnect();
    }

    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }

    // if (localVideoRef.current && localVideoRef.current.srcObject) {
    //   localVideoRef.current.srcObject.getTracks().forEach((track) => {
    //     track.stop();
    //   });

    //   localVideoRef.current.srcObject = null;
    // }

    if (localTrack) {
      localTrack.getTracks().forEach((track) => {
        track.stop();
      });

      setLocalTrack(null);
      // localVideoRef.current.srcObject = null;
    }

    if (remoteVideoRef.current && remoteVideoRef.current.srcObject) {
      remoteVideoRef.current.srcObject.getTracks().forEach((track) => {
        track.stop();
      });

      setRemoteTrack(null);
      remoteVideoRef.current.srcObject = null;

      // Dispatch Redux cleanup action
      dispatch(cleanupState());
      window.location.href = '/meeting-ended';
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
    initializeWebRTCSocket,
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
    initiateRecongnization,
  };
};

export default useWebRTC;
