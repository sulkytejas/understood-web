import React, { useRef, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { IconButton, Select, MenuItem, Menu, FormControl } from '@mui/material';
import { Videocam, Mic, VolumeUp, Chat, Phone, Cancel, Translate } from '@mui/icons-material';

import Translation from './Translation';


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
    const [receivedTranslation, setReceivedTranslation] = useState('');
    const [anchorEl, setAnchorEl] = useState(null);

    // Setup peerConnection
    const initializePeerConnection = () => {
        peerConnection.current = new RTCPeerConnection();

        // Handle incoming media stream from remote peer
         peerConnection.current.ontrack = event => {
            console.log('Received remote track');
            remoteVideoRef.current.srcObject = event.streams[0]
        };

        // When a new ICE candidate is found, this event is triggered
         peerConnection.current.onicecandidate = event => {
            if (event.candidate){
                // Send the ICE candidate to the remote peer via the signaling server
                const candidateString = JSON.stringify(event.candidate);

                if (!candidates.current.has(candidateString)) {
                    candidates.current.add(candidateString);
                    console.log('Sending candidate:', event.candidate);
                    socket.current.emit('candidate', event.candidate);
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

    // Offer Handler
    const handleOffer = async (offer,targetLanguage) => {
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
        
        
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio:true });
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
        socket.current = io('https://translations-1153aabe3d6b.herokuapp.com');

        console.log('localTargetLanguage', localTargetLanguage)
        

        socket.current.on('connect', () => {
            setConnected(true);
            console.log('Connected to signaling server');
        });

         // socket event

         socket.current.on('roleAssignment', setUserRole);
         socket.current.on('offer', handleOffer);
         socket.current.on('answer', handleAnswer);
 
         socket.current.on('candidate', async (candidate) => {
             console.log('Received candidate:',candidate);
             await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
         });
 
 
         socket.current.on('receivedTranslations', (rt) => {
             setReceivedTranslation(rt)
         });
 
           // Listen for disconnection message
         socket.current.on('userCallDisconnected', () => {
             handleDisconnectCall();
         });
    }

    useEffect(() => {
        initializeSocket();

        // Capture local media stream (video and audio)
        navigator.mediaDevices.getUserMedia({ video:true, audio:true})
            .then(stream => {
                localVideoRef.current.srcObject = stream;
            });
        
        return () => {
            if ( peerConnection.current){
                peerConnection.current.close();
            }
            
            if (socket.current) {
                socket.current.disconnect();
            }
        }
    }, [localTargetLanguage]);

    const createOffer = async () => {

        if (peerConnection.current && peerConnection.current.signalingState !== 'stable') {
            console.warn('Attempted to create offer in non-stable state, ignoring');
            return;
        }

        // Initialize the peer connection
        if (!peerConnection.current){
            initializePeerConnection();
        }
       

        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio:true });
        localVideoRef.current.srcObject = stream;

        if (stream){
            stream.getTracks().forEach(track => {
                peerConnection.current.addTrack(track, stream);
                console.log('Added local track to peer connection:', track);
            });
        }

        const offer = await peerConnection.current.createOffer();
        await peerConnection.current.setLocalDescription(offer);
        console.log('Created and sent offer');

        socket.current.emit('offer', offer,localTargetLanguage);
        setCallStarted(true);
    }


    useEffect(() => {
        if (userRole === 'caller'){
            createOffer();
        }
    },[userRole,remoteTargetLanguage]);


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
        setReceivedTranslation('');
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

  console.log(remoteTargetLanguage,"remoteTargetLanguage")

    return (
        <div className="video-chat">
        {/* <div className="video-chat-content"> */}
          {/* <div className="video-container"> */}
            <video className="local-video" ref={localVideoRef } autoPlay muted />
            <div className="remote-video">
                <video ref={remoteVideoRef} autoPlay muted />
            </div>
          {/* </div> */}
          <div className="user-info">
          {remoteTargetLanguage && 
            <Translation 
                socket = {socket.current} 
                role={userRole} 
                targetLanguage={remoteTargetLanguage} 
            />}
            {receivedTranslation && 
                <div>{receivedTranslation}
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