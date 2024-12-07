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
import { cleanupState } from '../../redux/actions';
import { setParticipantInfo } from '../../redux/meetingSlice';
import { useSocket } from './SocketContext';

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
  const [connectionState, setConnectionState] = useState('new');
  const [connectionQuality, setConnectionQuality] = useState('good');
  const [joined, setJoined] = useState(false);
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

  useEffect(() => {
    console.log('WebRTCBridge Effect - Socket state:', {
      hasSocket: !!socket,
      meetingId,
      connectionManagerExists: !!connectionManager.current,
    });
    if (socket && !connectionManager.current && isSocketConnected) {
      // Initialize Connection Manager with all callbacks

      console.log('Initializing new ConnectionManager');

      connectionManager.current = new ConnectionManager({
        socket,
        meetingId,
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
          // Handle UI errors appropriately
        },
        onQualityChange: (quality) => {
          setConnectionQuality(quality);
        },
      });

      // Handle device info (maintain existing functionality)
      socket.emit('device-info', {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
      });
    } else {
      console.log('Conditions not met for initializing ConnectionManager');
    }

    return () => {
      console.log('WebRTCBridge cleanup triggered');

      if (socket && isSocketConnected) {
        if (connectionManager.current) {
          connectionManager.current.cleanup();
          connectionManager.current = null;
        }
      } else {
        console.log(
          'Socket disconnected, but not cleaning up ConnectionManager',
        );
      }
    };
  }, [socket, isSocketConnected]);

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
      await publicMethods.handleDisconnectCall(meetingId);
    };

    if (socket) {
      socket.on('meeting-ended', handleMeetingEnded);
    }

    return () => {
      if (socket) {
        socket.off('meeting-ended', handleMeetingEnded);
      }
    };
  }, [socket, meetingId]);

  useEffect(() => {
    if (connectionManager.current) {
      connectionManager.current.setAudioEnabled(!isAudioPaused);
    }
  }, [isAudioPaused]);

  // Debugger for webrtc

  // Maintain existing public methods with new implementation
  const publicMethods = {
    async joinRoom(enteredMeetingId) {
      try {
        await connectionManager.current.initializeEventListeners();
        const result = await connectionManager.current.connect(
          enteredMeetingId,
          uid,
        );
        // Use the result
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
      try {
        await connectionManager.current.attemptReconnect();
      } catch (error) {
        console.error('Failed to reconnect:', error);
        throw error;
      }
    },

    async handleDisconnectCall(meetingId) {
      if (connectionManager.current) {
        await connectionManager.current.cleanup();
      }

      setLocalStream(null);
      setRemoteStream(null);
      setCallStarted(false);
      setJoined(false);
      hostSocketId.current = null;
      isHost.current = false;

      dispatch(cleanupState());
      setCallStarted(false);

      if (socket) {
        socket.disconnect();
      }

      navigate(`/meetingEnded?meetingId=${meetingId}`);
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
        publicMethods.handleDisconnectCall(meetingId);
      }
      // Clear remote stream if participant left
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
  };

  return (
    <WebRTCContext.Provider value={contextValue}>
      {children}
    </WebRTCContext.Provider>
  );
};
