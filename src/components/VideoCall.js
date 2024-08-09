import React, { useRef, useEffect, useState, useMemo } from 'react';
import io from 'socket.io-client';
import { IconButton, Select, MenuItem, Menu, FormControl } from '@mui/material';
import { Videocam, Mic, VolumeUp, Chat, Phone, Cancel, Translate } from '@mui/icons-material';
import {debounce} from 'lodash';
import axios from 'axios';

import Translation from './Translation';
import LanguageDetection from './LanguageDetection';
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
    const [recognizedText, setRecognizedText] = useState('');
    const [remoteTrack, setRemoteTrack] = useState(null);
    const [localTrack, setLocalTrack] = useState(null);
    const [initiateRecongnization,setInitiateRecongnization] = useState(false);
    const [detectedLanguage, setDetectedLanguage] = useState(null);
    
    const [languageCounts, setLanguageCounts] = useState([]);
    const [activeRequests, setActiveRequests] = useState(0);

    const [translatedTexts, setTranslatedTexts] = useState([]);

    const generateDeviceId = () => {
        let deviceId = localStorage.getItem('deviceId');
        if (!deviceId) {
            deviceId = 'device-' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('deviceId', deviceId);
        }
        return deviceId;
    };

    const addOrUpdateTranslatedText = (id, text, isFinal) => {
        setTranslatedTexts(prev => {
            const index = prev.findIndex(item => item.id === id);
            const newTexts = [...prev];

            if (index !== -1) {
                newTexts[index] = { ...newTexts[index], text, isFinal };
            } else {
                newTexts.push({ id, text, isFinal });
            }

            if (newTexts.length > 2) {
                newTexts.shift(); // Remove the oldest text if there are more than 3
            }

            return newTexts;
        });
    };
    // Setup peerConnection
    const initializePeerConnection = async () => {
        try {
            // const turnResponse = await axios.get('http://localhost:5001/turnCredentials');
            
        const turnResponse = await axios.get('https://socket.platocity.com/turnCredentials');
        const turnConfig = turnResponse.data;

        const configuration = {
            iceServers: [
                {
                    urls: 'turn:turn.platocity.com:3478',
                    username: turnConfig.username,
                    credential: turnConfig.credential
                },
                {
                    urls: 'turns:turn.platocity.com:5349',
                    username: turnConfig.username,
                    credential: turnConfig.credential
                }
            //   {
            //     urls: 'stun:stun.l.google.com:19302'
            //   }
            ]
          };

        peerConnection.current = new RTCPeerConnection(configuration);
        console.log( peerConnection.current)

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

                    const candidate = {
                        candidate: event.candidate.candidate,
                        sdpMid: event.candidate.sdpMid,
                        sdpMLineIndex: event.candidate.sdpMLineIndex,
                        usernameFragment: event.candidate.usernameFragment
                    }

                    socket.current.emit('candidate', {...candidate}, null,false);
                }  
            }
        };


       

        peerConnection.current.oniceconnectionstatechange = () => {
            console.log('ICE connection state:', peerConnection.current.iceConnectionState);
            if (peerConnection.current.iceConnectionState === 'failed') {
                console.log('ICE connection failed, restarting ICE...');
                peerConnection.current.restartIce();
            }
        };

        peerConnection.current.onsignalingstatechange = () => {
            console.log('Signaling state change:', peerConnection.current.signalingState);
        };

        console.log('Initialized new RTCPeerConnection');  
        }catch(error){
            console.error('Error initializing peer connection:', error);
            throw error;
        }
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
            await initializePeerConnection(); // Ensure peer connection is initialized
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
            video: true,
            audio: true
          };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        localVideoRef.current.srcObject = stream;
        setLocalTrack(stream);
        

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

            try {
                const iceCandidate = new RTCIceCandidate({
                    candidate: candidate.candidate,
                    sdpMid: candidate.sdpMid,
                    sdpMLineIndex: candidate.sdpMLineIndex,
                    usernameFragment: candidate.usernameFragment
                });

                console.log('Adding ICE candidate:',iceCandidate, peerConnection.current);
                await peerConnection.current.addIceCandidate(iceCandidate);
                console.log('Added ICE candidate');
            } catch (error) {
                console.error('Error adding received ICE candidate', error);
            }
            
         });
 
        socket.current.on('recognizedText', (text) => {
            setRecognizedText(text);
        });

        socket.current.on('translatedText', ({text,id,isFinal}) => {
            addOrUpdateTranslatedText(id, text, isFinal);
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
            video: true,
            audio: true
          };
        
        // Capture local media stream (video and audio)
       
            navigator.mediaDevices.getUserMedia(constraints)
            .then(stream => {
                
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }
                setLocalTrack(stream);
                setInitiateRecongnization(true);
                
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
           await initializePeerConnection();
        };

        await waitForStableState();
       
        const constraints = {
            video: true,
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
        setTranslatedTexts([]);
        setDetectedLanguage(null);
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

  const blobToBase64 = (blob) => {
    return new Promise((resolve,reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
            const base64data = reader.result.split(',')[1];
            resolve(base64data);
        };

        reader.onerror = error => reject(error);
    });
}

  useEffect(() => {
    if (!localTrack || !callStarted) return;
    

    const audioTracks = localTrack.getAudioTracks();
    const audioStream = new MediaStream(audioTracks);

    const mediaRecorder = new MediaRecorder(audioStream);

    let timeoutId;
    
    const startRecording = () => {
        if (mediaRecorder.state === 'recording') {
            mediaRecorder.stop(); // Stop the existing recording if it's already recording
        }

        mediaRecorder.ondataavailable = async event => {
            console.log("triggered on data")
            if (event.data.size > 0){
                const audioContent = await blobToBase64(event.data);
                setActiveRequests(prev => prev + 1); 
                socket.current.emit('detectLanguage', { audioContent }); 
            }   
        }
    
        mediaRecorder.start();
    
        timeoutId = setTimeout(() => {
            mediaRecorder.stop();
            console.log('Recording stopped after 5 seconds');
        }, 5000); // Stop recording after 5 seconds

    }


    startRecording();
   
    const handleLanguageDetected = (detectedLanguage) => {
        
        // if (detectedLanguage === 'no-language') {
        //     startRecording();
        // } else {
        //     setDetectedLanguage(detectedLanguage);
        // }

        
        // if (detectedLanguage === 'no-language') {
        //     socket.current.on('languageDetected', handleLanguageDetected);
        // }else{
        //     socket.current.off('languageDetected', handleLanguageDetected);
        // }
        let localLanguageCount = 0;
        if (detectedLanguage !== 'no-language'){
            setLanguageCounts(prevCounts => {
                const updateCounts = [...prevCounts, detectedLanguage];
                localLanguageCount = updateCounts.length;
                const languageFrequncy = updateCounts.reduce((acc,lang) => {
                    acc[lang] = (acc[lang] || 0) + 1;
    
                    return acc;
                },{});
    
                if (updateCounts.length <= 7){
                    const mostFrequnctLanguage = Object.keys(languageFrequncy)
                        .reduce((a,b) => languageFrequncy[a] > languageFrequncy[b] ? a:b);
                    setDetectedLanguage(mostFrequnctLanguage);
                    
                    return updateCounts;
                }else {
                    return updateCounts;
                }
            });
    
            setActiveRequests(prev => {
                const newCount = prev - 1;
                
                if (newCount === 0 && localLanguageCount < 5){
                    startRecording();
                }
    
                return newCount;
            });
        }
    };
    startRecording(); 
    socket.current.on('languageDetected', handleLanguageDetected);
    
    return () => {
        // if (mediaRecorder && mediaRecorder.state !== "inactive") {
        //     const handleDataAvailable = mediaRecorder.ondataavailable;
        //     mediaRecorder.ondataavailable = null; // Temporarily remove the event handler to prevent unwanted calls
        //     mediaRecorder.stop(); // Stop recording only if necessary
        //     mediaRecorder.ondataavailable = handleDataAvailable; // Restore the event handler
        //     console.log('Cleanup: Recording stopped');
        // }
        socket.current.off('languageDetected', handleLanguageDetected);
        if (timeoutId) {
            clearTimeout(timeoutId); // Clear the timeout if the effect is cleaned up
        }     
    }
  },[localVideoRef.current?.srcObject,callStarted]);

  console.log(detectedLanguage,"detectedLanguage",languageCounts)
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
                    socket={socket.current}
                />
            } */}
            {detectedLanguage &&  
                <Translation 
                    socket = {socket.current} 
                    role={userRole} 
                    detectedLanguage={detectedLanguage}
                    initiateRecongnization = {initiateRecongnization}
                    targetLanguage={localTargetLanguage}
                />}
           
           <div className="translated-texts">
                {translatedTexts.map((text, index) => {
                    const totalTexts = translatedTexts.length;
                    const opacity = (index + 1) / totalTexts;
                    const scale = 1 - (index * 0.1);
                    const fontSize = index === totalTexts -1 ? 20 : 12;

                    return (
                        <div key={index} className="text-bubble" style={{ opacity, transform: `scale(${scale})`,fontSize }}>
                            {text.text}
                        </div>
                    );
                })}
            </div>    
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

