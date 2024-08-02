import React, { useRef, useEffect, useState, useMemo } from 'react';
import io from 'socket.io-client';
import { IconButton, Select, MenuItem, Menu, FormControl } from '@mui/material';
import { Videocam, Mic, VolumeUp, Chat, Phone, Cancel, Translate } from '@mui/icons-material';
import {debounce} from 'lodash';

// import Translation from './Translation';
// import LanguageDetection from './LanguageDetection';
import { translateText } from "../services/translateService";


const VideoCall = () => {
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const peerConnection = useRef(null);
    const socket = useRef(null);
    const candidates = useRef(new Set());
    
    const [connected,setConnected] = useState(false);

    const [callStarted,setCallStarted] = useState(false);
    const [userRole,setUserRole] = useState(null);
    const [localTargetLanguage, setLocalTargetLanguage] = useState('');
    const [remoteTargetLanguage, setRemoteTargetLanguage] = useState('');
    // const [receivedTranslation, setReceivedTranslation] = useState('');
    const [anchorEl, setAnchorEl] = useState(null);
    const [translatedText,setTranslatedText] = useState('');
    const [recognizedText, setRecognizedText] = useState('');
    const [remoteTrack, setRemoteTrack] = useState(null);
    const [localTrack, setLocalTrack] = useState(null);
    const [initiateRecongnization,setInitiateRecongnization] = useState(false);
    const [detectedLanguage, setDetectedLanguage] = useState(false);


    const generateDeviceId = () => {
        let deviceId = localStorage.getItem('deviceId');
        if (!deviceId) {
            deviceId = 'device-' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('deviceId', deviceId);
        }
        return deviceId;
    };

    // Setup peerConnection
    const initializePeerConnection = () => {
        const configuration = {
            iceServers: [
              {
                urls: 'stun:stun.l.google.com:19302'
              }
            ]
          };

        peerConnection.current = new RTCPeerConnection(configuration);

        // Handle incoming media stream from remote peer
         peerConnection.current.ontrack = event => {
            console.log('Received remote track');
            setRemoteTrack(event.streams[0]);
            remoteVideoRef.current.srcObject = event.streams[0]; 
        };

        // When a new ICE candidate is found, this event is triggered
         peerConnection.current.onicecandidate = event => {
            if (event.candidate){
                // Send the ICE candidate to the remote peer via the signaling server
                const candidateString = JSON.stringify(event.candidate);

                if (!candidates.current.has(candidateString)) {
                    candidates.current.add(candidateString);
                    console.log('Sending candidate:', event.candidate);
                    socket.current.emit('candidate', event.candidate, null,false);
                }  
            }
        };


       

        peerConnection.current.oniceconnectionstatechange = () => {
            console.log('ICE connection state:', peerConnection.current.iceConnectionState);
        };

        peerConnection.current.onsignalingstatechange = () => {
            console.log('Signaling state change:', peerConnection.current.signalingState);
        };

        console.log('Initialized new RTCPeerConnection');  
    }

    useMemo(() => {
        if (remoteTrack){
            console.log('Received remote track',remoteTrack);
            remoteVideoRef.current.srcObject = remoteTrack; 
        }
    }, [remoteTrack]);

    useMemo(() => {
        if (localTrack){
            console.log('Received remote track',remoteTrack);
            localVideoRef.current.srcObject = localTrack; 
        }
    }, [localTrack]);

    // Offer Handler
    const handleOffer = async (offer,targetLanguage) => {
        console.log("handle offer triggerd")
        if (!peerConnection.current){
            initializePeerConnection(); // Ensure peer connection is initialized
        }

        if (peerConnection.current.signalingState !== 'stable') {
            console.warn('Received offer in non-stable state, ignoring');
            return;
        }

        if (targetLanguage){
            setRemoteTargetLanguage(targetLanguage)
        }

        console.log('Received offer',remoteTargetLanguage);
        // Set the received offer as the remote description
        
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
        console.log('Set remote description for offer');
        if (!callStarted){
            setCallStarted(true)
        }
        
        const constraints = {
            video: {
              width: { ideal: 1280, max: 1920 },
              height: { ideal: 720, max: 1080 },
              frameRate: { ideal: 30, max: 60 }
            },
            audio: true
          };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        setLocalTrack(stream);
        localVideoRef.current.srcObject = stream;

        if (stream){
            stream.getTracks().forEach(track => {
                peerConnection.current.addTrack(track, stream);
                console.log('Added local track to peer connection:', track);
            });
        }
       

        // Create an answer and set it as the local description
        const answer = await peerConnection.current.createAnswer();
        await peerConnection.current.setLocalDescription(answer);

        console.log('localTargetLanguage', localTargetLanguage)
        // Send the answer back to the remote peer
        socket.current.emit('answer',answer, localTargetLanguage)
    }

    // Answer Handler
    const handleAnswer = async (answer,targetLanguage) => {
        console.log('peerConnection.current.signalingState:',peerConnection.current.signalingState)
        if (peerConnection.current.signalingState !== 'have-local-offer') {
            console.warn('Received answer in non-have-local-offer state, ignoring');
            return;
        }
        console.log('Received answer');
        
        if (targetLanguage){
            setRemoteTargetLanguage(targetLanguage);
        }
        // Set the received answer as the remote description
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
        console.log('Set remote description for answer');
    }

    const initializeSocket = () => {
        // socket.current = io('https://translations-1153aabe3d6b.herokuapp.com');
        socket.current = io('https://socket.platocity.com');
        // socket.current = io('http://localhost:5001');

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
             console.log('Received candidate:',candidate);
             await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
         });
 
        socket.current.on('recognizedText', (text) => {
            setRecognizedText(text);
        });
 
           // Listen for disconnection message
         socket.current.on('userCallDisconnected', () => {
             handleDisconnectCall();
         });
    }

    useEffect(() => {
        initializeSocket();

        const handleBeforeUnload = () => {
            if (socket.current) {
                socket.current.emit('userCallDisconnected');
                socket.current.disconnect();
            }
        };

        const constraints = {
            video: {
              width: { ideal: 1280, max: 1920 },
              height: { ideal: 720, max: 1080 },
              frameRate: { ideal: 30, max: 60 }
            },
            audio: true
          };
        
        // Capture local media stream (video and audio)
       
            navigator.mediaDevices.getUserMedia(constraints)
            .then(stream => {
                setLocalTrack(stream);
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }

                // setInitiateRecongnization(true);
                
            });
        
           
            window.addEventListener('beforeunload', handleBeforeUnload);
        
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            if ( peerConnection.current){
                peerConnection.current.close();
            }
            
            if (socket.current) {
                socket.current.disconnect();
            }
        }
    }, [localTargetLanguage ]);

        // Function to get supported codecs for a given media kind
    function getSupportedCodecs(kind) {
        const codecs = RTCRtpSender.getCapabilities(kind).codecs;
       
        return codecs;
    };

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
    }

    const createOffer = async () => {
       
        // if (peerConnection.current && peerConnection.current.signalingState !== 'stable') {
        //     console.warn('Attempted to create offer in non-stable state, ignoring');
        //     return;
        // }
        
        try {

        // Initialize the peer connection
        if (!peerConnection.current){
            initializePeerConnection();
        };

        await waitForStableState();
       
        const constraints = {
            video: {
              width: { ideal: 1280, max: 1920 },
              height: { ideal: 720, max: 1080 },
              frameRate: { ideal: 30, max: 60 }
            },
            audio: true
          };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        localVideoRef.current.srcObject = stream;
        setLocalTrack(stream);
        console.log(localVideoRef.current.srcObject, "localVideoRef")  
      

        if (stream){
            stream.getTracks().forEach(track => {
                peerConnection.current.addTrack(track, stream);
                console.log('Added local track to peer connection:', track);
            });
        }

        const videoSender = await peerConnection.current.getSenders().find(s => s.track.kind === 'video');
        const videoTransceiver = await peerConnection.current.getTransceivers().find(t => t.sender === videoSender);
        
        if (videoTransceiver) {
            const supportedVideoCodecs = getSupportedCodecs('video');
             // Set codec preferences
             const videoCodecs = [
                {mimeType: "video/AV1"},
                { mimeType: 'video/VP9' },
                { mimeType: 'video/VP8' }
              ]
              
              const allowedCodecs = supportedVideoCodecs.filter(codec => videoCodecs.some(c => codec.mimeType === c.mimeType))
              
              if (allowedCodecs.length > 0) {
                videoTransceiver.setCodecPreferences(allowedCodecs);
              }
        }

        const audioSender = await peerConnection.current.getSenders().find(s => s.track.kind === 'audio');
        const audioTransceiver = await peerConnection.current.getTransceivers().find(t => t.sender === audioSender);
        if (audioTransceiver) {
            const supportedAudioCodecs = getSupportedCodecs('video');  
          const audioCodecs = [
            { mimeType: 'audio/opus', clockRate: 48000 },
            { mimeType: 'audio/PCMU', clockRate: 8000 }, // Fallback codecs
            { mimeType: 'audio/PCMA', clockRate: 8000 }
          ];

          const allowedCodecs = supportedAudioCodecs.filter(codec => audioCodecs.some(c => codec.mimeType === c.mimeType));
          if (allowedCodecs.length > 0) {
            audioTransceiver.setCodecPreferences(allowedCodecs);
          }
          
        }

        const offer = await peerConnection.current.createOffer();
        await peerConnection.current.setLocalDescription(offer);
        console.log('Created and sent offer',localTargetLanguage);

        socket.current.emit('offer', offer,localTargetLanguage);
        setCallStarted(true);
        }catch(error){
            console.error('Error creating offer:', error);
        }

    }


    useEffect(() => {
        if ( userRole === 'broadcaster'){
            createOffer();
        }
    },[userRole,remoteTargetLanguage]);

    // Debounce translated text
    const debouncedText = debounce(async(text,targetLanguage,setTranslation) => {
        try{
            const translation = await translateText(text,targetLanguage);
            setTranslation(translation);
        }catch(error){
            console.error('Translation error:', error);
        }
    },100);

    //Translating on the client side
    useEffect(() => {
        if (recognizedText) {
          debouncedText(recognizedText,localTargetLanguage,setTranslatedText);
        }
    },[recognizedText,localTargetLanguage])

    const handleDisconnectCall = () => {
        // Notify remote user
        socket.current.emit('userCallDisconnected');


        if (socket.current){
            socket.current.disconnect();
        }

        if (peerConnection.current){
            peerConnection.current.close();
            peerConnection.current = null;
        }

        if (localVideoRef.current && localVideoRef.current.srcObject){
            localVideoRef.current.srcObject.getTracks().forEach(track => {
                track.stop();
            });

            localVideoRef.current.srcObject = null;
        }

        if (remoteVideoRef.current && remoteVideoRef.current.srcObject){
            remoteVideoRef.current.srcObject.getTracks().forEach(track => {
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
        setTranslatedText('');
        };   

    const handleClick = () => {
        if (!callStarted){
            socket.current.emit('initiateCall');
        }else {
           handleDisconnectCall();
        }
       
    }


  const handleLanguageChange = (lang) => {
    setLocalTargetLanguage(lang);
    handleClose();
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

    return (
        <div className="video-chat">
        {/* <div className="video-chat-content"> */}
          {/* <div className="video-container"> */}
            <video className="local-video" ref={callStarted ? remoteVideoRef: localVideoRef } autoPlay  playsInline muted = {!callStarted}/>
            <div className="remote-video">
                {<video ref={callStarted ? localVideoRef :remoteVideoRef} autoPlay  playsInline  muted/>}
            </div>
          {/* </div> */}
          <div className="user-info">
            {/* {callStarted && !detectedLanguage && initiateRecongnization && 
                <LanguageDetection
                    onLanguageDetected={setDetectedLanguage}
                    stream={localTrack}
                />
            }
            {detectedLanguage &&  
                <Translation 
                    socket = {socket.current} 
                    role={userRole} 
                    detectedLanguage={detectedLanguage}
                    initiateRecongnization = {initiateRecongnization}
                />}
            */}
            {translatedText && 
                <div>{translatedText}
            </div>}
          </div>
        {/* </div> */}
        <div>
            
        </div>
        <div className="video-chat-controls">
            <div className={`control-icons ${callStarted && 'call-connected'}`}>
                {/* <IconButton><Videocam /></IconButton> */}
                <IconButton onClick={(event) => setAnchorEl(event.currentTarget)}>
                   { localTargetLanguage ? localTargetLanguage : <Translate />}
                </IconButton>
                <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleClose}
                >
                    <MenuItem 
                        value="en"
                        onClick={() => handleLanguageChange('en')}
                    >
                            English
                    </MenuItem>
                    <MenuItem 
                        value="ru"
                        onClick={() => handleLanguageChange('ru')}
                        >
                        Russian
                    </MenuItem>   
                    <MenuItem 
                        value="hi"
                        onClick={() => handleLanguageChange('hi')}
                        >
                        Hindi
                    </MenuItem>   
                </Menu>        
                {/* <IconButton><Mic /></IconButton> */}
              
                {/* <IconButton><Chat /></IconButton> */}
                <IconButton 
                    onClick={handleClick} 
                    // disabled = {!!userRole && !connected || callStarted}
                >
                    <Phone style={{color: (!callStarted )? 'green': 'red'}}/>
                </IconButton>
                <IconButton><Cancel /></IconButton>
            </div>    
        </div>
      </div>
    )
}

export default VideoCall;

