import React, { useEffect, useState, useRef } from 'react';
import { initializeSocket, handleDisconnectCall } from '../utils/peerConnectionUtils';
import VideoPlayer from './VideoPlayer';
import VideoControls from './VideoControls';
import TranslationOverlay from './TranslationOverlay';
import useWebRTC from '../hooks/useWebRTC';
// import './VideoCall.module.css';

const VideoCall = () => {
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
   

    const [callStarted, setCallStarted] = useState(false);
    const [userRole, setUserRole] = useState(null);
    const [localTargetLanguage, setLocalTargetLanguage] = useState('');
    const [detectedLanguage, setDetectedLanguage] = useState(null);
    const [socket, setSocket] = useState(null); 
    const {
        peerConnection,
        localTrack,
        remoteTrack,
        initializePeerConnection,
        createOffer,
        handleAnswer,
        handleOffer,
    } = useWebRTC({socket});

    useEffect(() => {
        const socketInstance = initializeSocket({
            handleOffer,
            handleAnswer,
            setUserRole,
            onDisconnect: () => handleDisconnectCall(peerConnection, localVideoRef, remoteVideoRef, setCallStarted),
        });

        setSocket(socketInstance); // Store the socket instance in state

        initializePeerConnection();

        return () => {
            handleDisconnectCall(peerConnection, localVideoRef, remoteVideoRef, setCallStarted, socketInstance);
        };
    }, [peerConnection, localVideoRef, remoteVideoRef]);

    useEffect(() => {
        if (userRole === 'broadcaster') {
            createOffer();
        }
    }, [userRole]);

    return (
        <div className="video-chat">
            <VideoPlayer 
                localVideoRef={localVideoRef} 
                remoteVideoRef={remoteVideoRef} 
                localTrack={localTrack} 
                remoteTrack={remoteTrack} 
                callStarted={callStarted} 
            />
            {socket && (
                <TranslationOverlay
                    detectedLanguage={detectedLanguage}
                    localTargetLanguage={localTargetLanguage}
                    userRole={userRole}
                    socket={socket} 
                />
            )}
            <VideoControls 
                callStarted={callStarted} 
                localTargetLanguage={localTargetLanguage} 
                setLocalTargetLanguage={setLocalTargetLanguage} 
                onCallToggle={setCallStarted} 
            />
        </div>
    );
};

export default VideoCall;
