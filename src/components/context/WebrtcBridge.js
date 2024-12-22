import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import ConnectionManager from '../rtc/ConnectionManager';
import { meetingEndedCleanup } from '../../redux/actions';
import { setParticipantInfo } from '../../redux/meetingSlice';
import { useSocket } from './SocketContext';
import { useTranslation } from 'react-i18next';
import {
  setlocalAudioOnly,
  setRemoteAudioOnly,
} from '../../redux/videoPlayerSlice';
const WebRTCContext = createContext();

export const useWebRTC = () => useContext(WebRTCContext);

export const WebRTCBridge = ({ children }) => {
  const { socket, isSocketConnected } = useSocket();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // State from existing WebRTCContext
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callStarted, setCallStarted] = useState(false);
  const [isConnectionManagerReady, setIsConnectionManagerReady] =
    useState(false);
  const [connectionState, setConnectionState] = useState('new');
  const [connectionQuality, setConnectionQuality] = useState('good');
  const [joined, setJoined] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState({
    isAlert: false,
    message: null,
  });
  const [isMediaFlowing, setIsMediaFlowing] = useState(true);
  const [participantLeft, setParticipantLeft] = useState(false);
  const [connectionError, setConnectionError] = useState(null);

  const audioOnlyRef = useRef(false);
  const hostSocketId = useRef(null);
  const isHost = useRef(false);

  // Redux states
  const meetingId = useSelector((state) => state.meeting.meetingId);

  const isVideoPaused = useSelector((state) => state.videoPlayer.videoPause);
  const isAudioPaused = useSelector((state) => state.videoPlayer.audioPause);
  const userSpokenLanguage = useSelector(
    (state) => state.translation.localSpokenLanguage,
  );
  const uid = useSelector((state) => state.user.uid);

  // Connection Manager Reference
  const connectionManager = useRef(null);
  const { t } = useTranslation();

  const ensureConnectionManager = (managerId) => {
    if (!socket || !isSocketConnected) return;

    if (!managerId) return;

    if (!connectionManager.current) {
      // Initialize Connection Manager with all callbacks

      console.log('Initializing new ConnectionManager');

      connectionManager.current = new ConnectionManager({
        socket,
        meetingId: managerId,
        userSpokenLanguage,
        uid,
        onStateChange: (state) => {
          setConnectionState(state);
        },
        onStreamsUpdate: ({ local, remote }) => {
          setLocalStream(local);
          setRemoteStream(remote);
          if (remote) setCallStarted(true);
        },
        onError: (error) => {
          console.error('Connection error:', error);
          setConnectionError(error);
          // Handle UI errors appropriately
        },
        onQualityChange: (quality) => {
          setConnectionQuality(quality);
        },
        onParticipantJoined: () => {
          setParticipantLeft(false);
        },
        onMediaFlowing: (isFlowing) => {
          setIsMediaFlowing(isFlowing);
        },
        onAudioOnly: (isAudioOnly) => {
          console.log('Audio only:', isAudioOnly, meetingId);
          dispatch(setlocalAudioOnly(isAudioOnly));

          audioOnlyRef.current = isAudioOnly;
        },
      });

      // Handle device info (maintain existing functionality)
      socket.emit('device-info', {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
      });

      setIsConnectionManagerReady(true);
    } else {
      console.log('Conditions not met for initializing ConnectionManager');
    }
  };

  // Handle Redux state changes
  useEffect(() => {
    if (connectionManager.current) {
      connectionManager.current.setVideoEnabled(!isVideoPaused);
    }
  }, [isVideoPaused]);

  //meeting ended handler
  useEffect(() => {
    const handleMeetingEnded = async () => {
      console.log('meeting-ended triggered');

      // This happens only when host ends the meeting or host fails to return.
      // Full cleanup and navigation:
      if (connectionManager.current) {
        await connectionManager.current.handleCallDisonnect();
      }

      setLocalStream(null);
      setRemoteStream(null);
      setCallStarted(false);
      setJoined(false);
      hostSocketId.current = null;
      isHost.current = false;
      dispatch(meetingEndedCleanup());
      localStorage.removeItem('meetingData');

      navigate(`/meetingEnded?meetingId=${meetingId || ''}`);
    };

    if (socket) {
      socket.on('meeting-ended', handleMeetingEnded);
    }

    return () => {
      if (socket) {
        socket.off('meeting-ended', handleMeetingEnded);
      }
    };
  }, [socket, meetingId, dispatch, navigate]);

  useEffect(() => {
    if (connectionManager.current) {
      connectionManager.current.setAudioEnabled(!isAudioPaused);
    }
  }, [isAudioPaused]);

  // Effect to handle connection status updates based on state changes
  useEffect(() => {
    // If we've navigated to meetingEnded, no further status updates are needed
    if (connectionState === 'closed') {
      return;
    }

    // Priority:
    // 1. If call not started, no message.
    if (!callStarted) {
      setConnectionStatus({ isAlert: false, message: null });
      return;
    }

    // 2. If participant disconnected during a connected state.
    if (remoteStream === null && connectionState === 'connected') {
      setConnectionStatus({
        isAlert: true,
        message: isHost.current
          ? t('Participant has disconnected. Waiting for rejoin...')
          : t('Host has disconnected. Waiting for rejoin...'),
      });
      return;
    }

    // 3. If not connected (and not ended)
    if (connectionState !== 'connected') {
      setConnectionStatus({
        isAlert: true,
        message: t('Connection lost. Attempting to reconnect...'),
      });
      return;
    }

    if (connectionError === 'Connection failed') {
      setConnectionStatus({
        isAlert: true,
        message: t(
          'Failed to connect to the meeting. Please check your network connection and retry',
        ),
      });
      return;
    }

    if (connectionError === 'Server connection lost and cannot reconnect') {
      setConnectionStatus({
        isAlert: true,
        message: t(
          'Disconnected from the meeting. Please try again later or contact support',
        ),
      });
      return;
    }

    // 4. Could not connect to other participant
    if (connectionError === 'Failed to consume new producer') {
      setConnectionStatus({
        isAlert: true,
        message: t(
          'Failed to connect to the participant. Attempting to reconnect...',
        ),
      });
      return;
    }

    // 4. If media not flowing
    if (!isMediaFlowing && connectionQuality !== 'good') {
      setConnectionStatus({
        isAlert: true,
        message: t('Media connection interrupted. Attempting to restore...'),
      });
      return;
    }

    // 5. If participant left
    if (participantLeft) {
      setConnectionStatus({
        isAlert: true,
        message: 'Participant has left the meeting...',
      });
      return;
    }

    // 6. All good
    setConnectionStatus({
      isAlert: false,
      message: null,
    });
  }, [
    callStarted,
    connectionState,
    participantLeft,
    remoteStream,
    isMediaFlowing,
    isHost,
  ]);

  useEffect(() => {
    if (socket) {
      const handleOtherParticipantAudioOnly = ({
        participantId,
        isAudioOnly,
      }) => {
        console.log('Received audio only state:', participantId, isAudioOnly);
        if (participantId !== socket.id) {
          dispatch(setRemoteAudioOnly(isAudioOnly));
        }
      };

      socket.on(
        'other-participant-audio-only',
        handleOtherParticipantAudioOnly,
      );

      return () => {
        socket.off(
          'other-participant-audio-only',
          handleOtherParticipantAudioOnly,
        );
      };
    }
  }, [socket, dispatch]);

  // Maintain existing public methods with new implementation
  const publicMethods = {
    async joinRoom(enteredMeetingId) {
      if (!connectionManager.current) {
        ensureConnectionManager(enteredMeetingId);
      }

      try {
        await connectionManager.current.initializeEventListeners();
        const result = await connectionManager.current.connect(
          enteredMeetingId,
          uid,
        );
        // Use the result
        isHost.current = result.isHost;

        if (result.joined) {
          socket.emit('client-set-audio-only', {
            meetingId: enteredMeetingId,
            isAudioOnly: audioOnlyRef.current,
          });

          socket.on(
            'existing-participants-audio-only-states',
            ({ audioOnlyStates }) => {
              console.log('audioOnlyStates:', audioOnlyStates);
              // audioOnlyStates is an object { participantId: boolean }
              // Set redux state for each participant or at least for the remote participant if it's a 1:1 call
              const remoteParticipantId = Object.keys(audioOnlyStates).find(
                (pid) => pid !== socket.id,
              );
              if (remoteParticipantId) {
                dispatch(
                  setRemoteAudioOnly(audioOnlyStates[remoteParticipantId]),
                );
              }
            },
          );
        }

        return {
          isHost: result.isHost,
          hostSocketId: result.hostSocketId,
          joined: result.joined,
        };
      } catch (error) {
        console.error('Failed to join room:', error);
        throw error;
      }
    },

    async startStreaming() {
      try {
        await connectionManager.current.startStreaming();
      } catch (error) {
        console.error('Failed to start streaming:', error);
        throw error;
      }
    },

    async attemptReconnect() {
      if (!connectionManager.current) {
        console.warn('ConnectionManager not ready to attempt reconnect');
        return;
      }
      try {
        await connectionManager.current.attemptReconnect();

        if (audioOnlyRef.current) {
          socket.emit('client-set-audio-only', {
            meetingId: meetingId,
            isAudioOnly: audioOnlyRef.current,
          });
        }
      } catch (error) {
        console.error('Failed to reconnect:', error);
      }
    },
    async onEnableHD(enableHD) {
      if (!connectionManager.current) {
        console.warn('ConnectionManager not ready to attempt reconnect');
        return;
      }
      try {
        await connectionManager.current.mediaManager.toggleHD(enableHD);
      } catch (error) {
        console.error('Failed to reconnect:', error);
      }
    },

    async intializeMeeting(meetingId, uid) {
      try {
        if (!connectionManager.current) {
          ensureConnectionManager(meetingId);
        }
        await connectionManager.current.initializeEventListeners();
        const response = await connectionManager.current.initialize(
          meetingId,
          uid,
        );

        return response;
      } catch (error) {
        console.error('Failed to reconnect:', error);
      }
    },

    async handleDisconnectCall(meetingId) {
      if (!connectionManager.current) {
        // There's no manager to disconnect
        console.log('No manager to disconnect. Skipping.');
        return;
      }

      if (isHost.current && meetingId) {
        socket.emit('endMeeting', { meetingId }, ({ error }) => {
          if (error) {
            console.error('Error ending meeting:', error);
          }
        });
      } else {
        console.log('Leaving meeting triggered:', meetingId);
        socket.emit('leaveMeeting', { meetingId }, async ({ error }) => {
          if (error) {
            console.error('Error leaving meeting:', error);
          }
        });
      }

      if (connectionManager.current) {
        await connectionManager.current.handleCallDisonnect();
      }

      setLocalStream(null);
      setRemoteStream(null);
      setCallStarted(false);
      setJoined(false);
      hostSocketId.current = null;
      isHost.current = false;
      connectionManager.current = null;
      dispatch(meetingEndedCleanup());
      setCallStarted(false);
      localStorage.removeItem('meetingData');

      navigate(`/meetingEnded?meetingId=${meetingId || ''}`);
    },
  };

  useEffect(() => {
    const handleOtherParticipantsDeviceInfo = (info) => {
      // Filter out own device info using socket.id
      const otherParticipantInfo = Object.fromEntries(
        Object.entries(info).filter(
          ([participantId]) => participantId !== socket.id,
        ),
      );

      // Update Redux store with other participants' info
      dispatch(setParticipantInfo(otherParticipantInfo));
    };

    if (socket) {
      // Listen for device info updates from other participants
      socket.on('participants-device-info', handleOtherParticipantsDeviceInfo);

      // Send own device info
      socket.emit('device-info', {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
      });
    }

    return () => {
      if (socket) {
        socket.off(
          'participants-device-info',
          handleOtherParticipantsDeviceInfo,
        );
      }
    };
  }, [socket, dispatch]);

  useEffect(() => {
    const handleParticipantLeft = (participantID) => {
      if (participantID === hostSocketId.current) {
        // Handle host leaving
        console.log('Host disconnected, waiting for possible reconnect...');
      }
      // Clear remote stream if participant left
      setParticipantLeft(true);
      setRemoteStream(null);
    };

    if (socket) {
      socket.on('participant-disconnected', handleParticipantLeft);
    }

    return () => {
      if (socket) {
        socket.off('participant-disconnected', handleParticipantLeft);
      }
    };
  }, [socket, hostSocketId, meetingId]);

  // Maintain the same context value structure
  const contextValue = {
    ...publicMethods,
    localStream,
    remoteStream,
    connectionState,
    callStarted,
    connectionQuality,
    isHost: isHost.current,
    joined,
    hostSocketId: hostSocketId.current,
    isConnectionManagerReady,
    connectionStatus,
  };

  return (
    <WebRTCContext.Provider value={contextValue}>
      {children}
    </WebRTCContext.Provider>
  );
};
