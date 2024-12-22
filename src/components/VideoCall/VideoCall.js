/* eslint-disable */
import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import TranslationOverlay from './TranslationOverlay';
import VideoControls from './VideoControls';
import { useNavigate } from 'react-router-dom';
import VideoPlayer from './VideoPlayer';
import { useSocket } from '../context/SocketContext';
// import { useWebRTC } from '../context/WebrtcContext';
import { useWebRTC } from '../context/WebrtcBridge';
import { useSelector, useDispatch } from 'react-redux';
import {
  joinMeeting,
  setHostSocketId,
  setIsHost,
  setMeetingPhrase,
} from '../../redux/meetingSlice';

const VideoCall = () => {
  const [isRemoteConnected, setIsRemoteConnected] = useState(false);
  const [isMeetingStarted, setIsMeetingStarted] = useState(false);
  const remoteVideoRef = useRef(null);
  const videoContainerRef = useRef(null);

  const userUid = useSelector((state) => state.user.uid);
  const meetingIdRedux = useSelector((state) => state.meeting.meetingId);
  const pendingMeetingId = useSelector(
    (state) => state.meeting.pendingMeetingId,
  );
  const { meetingId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    // startStreaming,
    handleDisconnectCall,
    localStream,
    remoteStream,
    callStarted,
    connectionState,
    attemptReconnect,
    intializeMeeting,
    isConnectionManagerReady,
    onEnableHD,
    connectionStatus,
    connectionQuality,
    joinRoom,
  } = useWebRTC();

  const { socket } = useSocket();

  useEffect(() => {
    const handleClientConnect = async () => {
      const storedData = localStorage.getItem('meetingData');
      const meetingDataLocalStorage = JSON.parse(storedData);

      if (meetingDataLocalStorage && meetingDataLocalStorage.meetingId) {
        await Promise.all([
          dispatch(joinMeeting(meetingDataLocalStorage.meetingId)),
          dispatch(setIsHost(meetingDataLocalStorage.isHost)),
          dispatch(setMeetingPhrase(meetingDataLocalStorage.meetingPhrase)),
        ]).then(() => {
          console.log(
            'Meeting data restored from local storage and initializing meeting',
          );
          intializeMeeting(meetingDataLocalStorage.meetingId, userUid)
            .then((response) => {
              console.log('Meeting re-initialized:', response);
              dispatch(setHostSocketId(response.hostSocketId));
              setIsMeetingStarted(true);
            })
            .catch((error) => {
              console.error('Error re-initializing meeting:', error);
            });
        });
      } else if (pendingMeetingId) {
        const { joined, hostSocketId, isHost } =
          await joinRoom(pendingMeetingId);

        if (joined) {
          dispatch(joinMeeting(pendingMeetingId));
          dispatch(setHostSocketId(hostSocketId));
          dispatch(setIsHost(isHost));
        }

        const JSONData = JSON.stringify({
          meetingId: pendingMeetingId,
          isHost,
          hostSocketId,
        });

        localStorage.setItem('meetingData', JSONData);
        setIsMeetingStarted(true);
      } else {
        navigate('/');
      }
    };

    if (socket) {
      handleClientConnect();
    }
  }, [
    // intializeMeeting,
    dispatch,
    // meetingId,
    pendingMeetingId,
    // isConnectionManagerReady,
    // userUid,
    socket,
  ]);

  const handleClick = () => {
    handleDisconnectCall(meetingIdRedux);
  };

  return (
    <div className="video-chat" ref={videoContainerRef}>
      <VideoPlayer
        localStream={localStream}
        remoteTrack={remoteStream}
        remoteVideoRef={remoteVideoRef}
        videoContainerRef={videoContainerRef}
        callStarted={callStarted}
        connectionState={connectionState}
        isRemoteConnected={isRemoteConnected}
        onNoMediaFlow={attemptReconnect}
        connectionStatus={connectionStatus}
        connectionQuality={connectionQuality}
        isMeetingStarted={isMeetingStarted}
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
        onEnableHD={onEnableHD}
      />
    </div>
  );
};

export default VideoCall;
