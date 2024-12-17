/* eslint-disable */
import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import TranslationOverlay from './TranslationOverlay';
import VideoControls from './VideoControls';

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

  const remoteVideoRef = useRef(null);
  const videoContainerRef = useRef(null);

  const userUid = useSelector((state) => state.user.uid);
  const meetingIdRedux = useSelector((state) => state.meeting.meetingId);
  const { meetingId } = useParams();
  const dispatch = useDispatch();

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
  } = useWebRTC();

  const { socket } = useSocket();

  useEffect(() => {
    const handleClientReconnect = async () => {
      if (!meetingIdRedux) {
        const storedData = localStorage.getItem('meetingData');
        if (!storedData) return; // No stored data, do nothing

        const meetingDataLocalStorage = JSON.parse(storedData);
        if (
          meetingDataLocalStorage &&
          meetingDataLocalStorage.meetingId === meetingId
        ) {
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
              })
              .catch((error) => {
                console.error('Error re-initializing meeting:', error);
              });
          });
        }
      }
    };

    if (socket && isConnectionManagerReady) {
      handleClientReconnect();
    }
  }, [
    intializeMeeting,
    dispatch,
    meetingId,
    isConnectionManagerReady,
    userUid,
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
