import React, { useRef, useEffect, useState, useMemo } from 'react';
import io from 'socket.io-client';
import { IconButton, Select, MenuItem, Menu, FormControl, Button } from '@mui/material';
import { Videocam, Mic, VolumeUp, Chat, Phone, Cancel, Translate } from '@mui/icons-material';

import Translation from './Translation';
import { translateText } from "../services/translateService";


const BroadcastVid = () =>  {
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const peerConnection = useRef([]);
    const socket = useRef(null);
    const candidates = useRef(new Set());
    const userRoleRef = useRef(null);
    const localSocketId = useRef(null);
    const candidatesQueue = useRef({});

    const [connected,setConnected] = useState(false);

    const [callStarted,setCallStarted] = useState(false);
    const [userRole,setUserRole] = useState(null);
    const [localTargetLanguage, setLocalTargetLanguage] = useState('');
    const [remoteTargetLanguage, setRemoteTargetLanguage] = useState('');
    // const [receivedTranslation, setReceivedTranslation] = useState('');
    const [anchorEl, setAnchorEl] = useState(null);
    const [translatedText,setTranslatedText] = useState('');
    const [recognizedText, setRecognizedText] = useState('');
    const [isBroadcasting, setIsBroadcasting] = useState(false);
    const [remoteVideoRefs, setRemoteVideoRefs] = useState([]);

    console.log(localSocketId.current, "localSocketId.current", peerConnection.current);
    // Setup peerConnection
    const initializePeerConnection = () => {
        peerConnection.current[localSocketId.current] = new RTCPeerConnection();

        const pc =  peerConnection.current[localSocketId.current];
        // Handle incoming media stream from remote peer
        pc.ontrack = event => {
            console.log('Received remote track');
            // remoteVideoRef.current.srcObject = event.streams[0] 
            setRemoteVideoRefs(prev => {
                const prevObj = [...prev];
                prevObj.push(event.streams[0]);

                return prevObj;
            })
        };

        // When a new ICE candidate is found, this event is triggered
        pc.onicecandidate = event => {
            if (event.candidate){
                // Send the ICE candidate to the remote peer via the signaling server
                const candidateString = JSON.stringify(event.candidate);

                if (!candidates.current.has(candidateString)) {
                    candidates.current.add(candidateString);

                    if (!candidatesQueue.current[localSocketId.current]){
                        candidatesQueue.current[localSocketId.current] = [];
                    }
                    candidatesQueue.current[localSocketId.current].push(event.candidate);
                    console.log('Sending candidate from initialize:', event.candidate);
                    socket.current.emit('candidate', event.candidate, localSocketId.current,true);
                }  
            }
        };


        pc.oniceconnectionstatechange = () => {
            console.log('ICE connection state:', peerConnection.current.iceConnectionState);
        };

        pc.onsignalingstatechange = () => {
            console.log('Signaling state change:', peerConnection.current.signalingState);
        };

        console.log('Initialized new RTCPeerConnection');  
    }

    // Offer Handler
    const handleOffer = async (offer,targetLanguage,remoteSocketId) => {
        let pc;
        // if (userRoleRef.current === 'broadcaster'){
        //     console.log("if this will ever work")
        //     if (!peerConnection.current[remoteSocketId]){
                
        //             peerConnection.current[remoteSocketId] = new RTCPeerConnection();
    
        //             pc =  peerConnection.current[remoteSocketId];
        //             // Handle incoming media stream from remote peer
        //             pc.ontrack = event => {
        //                 console.log('Received remote track');
        //                 setRemoteVideoRefs(prev => {
        //                     const prevObj = [...prev];
        //                     prevObj.push(event.streams[0]) ;
    
        //                     return prevObj;
        //                 })
        //                 console.log(remoteVideoRefs)
        //             };
    
        //             // When a new ICE candidate is found, this event is triggered
        //             pc.onicecandidate = event => {
        //                 if (event.candidate){
        //                     // Send the ICE candidate to the remote peer via the signaling server
        //                     const candidateString = JSON.stringify(event.candidate);
    
        //                     if (!candidates.current.has(candidateString)) {
        //                         candidates.current.add(candidateString);
        //                         console.log('Sending candidate:', event.candidate);
        //                         socket.current.emit('candidate', event.candidate, remoteSocketId,true);
        //                     }  
        //                 }
        //             };
    
        //     }else {
        //         pc = peerConnection.current[remoteSocketId];
        //     }
    
        // }else {
            // await initializePeerConnection();
            // pc = peerConnection.current[localSocketId.current];

            // if (!peerConnection.current[remoteSocketId]){
            //     peerConnection.current[remoteSocketId] = new RTCPeerConnection();
            // }
            peerConnection.current[remoteSocketId] = new RTCPeerConnection();
            pc =  peerConnection.current[remoteSocketId];

            pc.ontrack = event => {
                console.log('Received remote track from viewer');
                setRemoteVideoRefs(prev => {
                    const prevObj = [...prev];
                    prevObj.push(event.streams[0]) ;

                    return prevObj;
                })
                console.log(remoteVideoRefs)
            };

            
            // When a new ICE candidate is found, this event is triggered
            pc.onicecandidate = event => {
                if (event.candidate){
                    // Send the ICE candidate to the remote peer via the signaling server
                    const candidateString = JSON.stringify(event.candidate);

                    if (!candidates.current.has(candidateString)) {
                        candidates.current.add(candidateString);


                        if (!candidatesQueue.current[remoteSocketId]){
                            candidatesQueue.current[remoteSocketId] = [];
                        }
                        candidatesQueue.current[remoteSocketId].push(event.candidate);
                        console.log('Sending candidate from offer:', event.candidate);
                        socket.current.emit('candidate', event.candidate, remoteSocketId,true);
                    }  
                }
            };


            const stream = localVideoRef.current.srcObject;
            // Broadcaster will add its local track                   
            if (stream){
                stream.getTracks().forEach(track => {
                    pc.addTrack(track,stream);
                });
            }
           
        
        console.log('pc before signalling', pc)
        if (pc.signalingState !== 'stable') {
            console.warn('Received offer in non-stable state, ignoring');
            return;
        }

        if (targetLanguage){
            setRemoteTargetLanguage(targetLanguage)
        }

        console.log('Received offer',remoteTargetLanguage);
        // Set the received offer as the remote description
        await peerConnection.current[remoteSocketId].setRemoteDescription(new RTCSessionDescription(offer));
        console.log('Set remote description for offer');
           
        if (!callStarted){
            setCallStarted(true)
        }
        
        
        // const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio:true });
        // localVideoRef.current.srcObject = stream;

        // if (stream){
        //     stream.getTracks().forEach(track => {
        //         peerConnection.current.addTrack(track, stream);
        //         console.log('Added local track to peer connection:', track);
        //     });
        // }
       

        // Create an answer and set it as the local description
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        console.log('localTargetLanguage', localTargetLanguage)
        // Send the answer back to the remote peer
        socket.current.emit('answer',answer, localTargetLanguage,remoteSocketId,true);


        if (candidatesQueue.current[remoteSocketId].length){
            candidatesQueue.current[remoteSocketId].forEach(async candidate => {
                await pc.addIceCandidate(candidate);
            });
            candidatesQueue.current[remoteSocketId] = [];
        }

    }

    // Answer Handler
    const handleAnswer = async (answer,targetLanguage,remoteSocketId,_) => {
        let pc = peerConnection.current[remoteSocketId];;
        // if (userRoleRef.current === 'broadcaster') {
        //     // Broadcaster handling an answer from a viewer
        //     pc = peerConnection.current[remoteSocketId];
        // } else {
        //     // Viewer handling an answer from the broadcaster
        //     pc = peerConnection.current[localSocketId.current];
        // }

        console.log('peerConnection.current.signalingState:',pc.signalingState)
        if (pc.signalingState !== 'have-local-offer') {
            console.warn('Received answer in non-have-local-offer state, ignoring');
            return;
        }
        console.log('Received answer');
        
        if (targetLanguage){
            setRemoteTargetLanguage(targetLanguage);
        }
        // Set the received answer as the remote description
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        console.log('Set remote description for answer');

        if (candidatesQueue.current[remoteSocketId].length){
            candidatesQueue.current[remoteSocketId].forEach(async candidate => {
                await pc.addIceCandidate(candidate);
            });
            candidatesQueue.current[remoteSocketId] = [];
        }
    }

    const initializeSocket = () => {
        // socket.current = io('https://translations-1153aabe3d6b.herokuapp.com');
        socket.current = io('https://3.25.64.73/socket');

        console.log('localTargetLanguage', localTargetLanguage)
        

        socket.current.on('connect', () => {
            setConnected(true);
            console.log('Connected to signaling server');
        });

         // socket event

         socket.current.on('roleAssignment', (role,socketId) => { 
            setUserRole(role);
            localSocketId.current = socketId;

            if (role === 'broadcaster'){
                initializePeerConnection();
                initiateMediaStream().then(stream => {
                    const pc = peerConnection.current[socketId];
                    stream.getTracks().forEach(track => {
                        pc.addTrack(track,stream);
                    });

                    setIsBroadcasting(true);
                })
            }
        });
         socket.current.on('offer', (offer,targetLanguage, remoteSocketId,isBroadcast) => handleOffer(offer,targetLanguage, remoteSocketId));
         socket.current.on('answer', (answer,targetLanguage, remoteSocketId,isBroadcast) => handleAnswer(answer,targetLanguage, remoteSocketId));
         socket.current.on('broadcast-started', () => setIsBroadcasting(true));
 
         socket.current.on('candidate', async (candidate,remoteSocketId) => {
             console.log('Received candidate:',candidate);
             let pc;
            //  if (userRoleRef.current === 'broadcaster') {
            //      pc = peerConnection.current[remoteSocketId];
            //  } else {
            //      pc = peerConnection.current[localSocketId.current];
            //  }
            pc = peerConnection.current[remoteSocketId];
            console.log("remote Description",pc.remoteDescription);

            if (pc.remoteDescription){
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
            }else{
                if (!candidatesQueue.current[remoteSocketId]){
                    candidatesQueue.current[remoteSocketId] = [];
                }
                candidatesQueue.current[remoteSocketId].push(candidate);
            }

            

            
         });


        socket.current.on('initiateViewer', (viewerId) => {

            const createBroadcasterOffer = async () => {
                peerConnection.current[viewerId] = new RTCPeerConnection();

                const pc =  peerConnection.current[viewerId];
                // Handle incoming media stream from remote peer
                pc.ontrack = event => {
                    console.log('Received remote track',event);
                    setRemoteVideoRefs(prev => {
                        const prevObj = [...prev];
                        prevObj.push(event.streams[0]);

                        return prevObj;
                    })
                };

                // When a new ICE candidate is found, this event is triggered
                pc.onicecandidate = event => {
                    if (event.candidate){
                        // Send the ICE candidate to the remote peer via the signaling server
                        const candidateString = JSON.stringify(event.candidate);

                        if (!candidates.current.has(candidateString)) {
                            candidates.current.add(candidateString);

                            if (!candidatesQueue.current[viewerId]){
                                candidatesQueue.current[viewerId] = [];
                            }
                            candidatesQueue.current[viewerId].push(event.candidate);

                            console.log('Sending candidate:', event.candidate);
                            socket.current.emit('candidate', event.candidate, viewerId,true);
                        }  
                    }
                };

                const stream = localVideoRef.current.srcObject;
               // Broadcaster will add its local track                   
                if (stream){
                    stream.getTracks().forEach(track => {
                        peerConnection.current[viewerId].addTrack(track,stream);
                    });
                }

                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                console.log('Created and sent offer');

                socket.current.emit('offer', offer,localTargetLanguage,viewerId,true);
            }

            if (userRoleRef.current === 'broadcaster'){
                createBroadcasterOffer();

                
            }else {
                setCallStarted(true);
                const stream = localVideoRef.current.srcObject;
                
            }
        }); 
 
        socket.current.on('recognizedText', (text) => {
            setRecognizedText(text);
        });
 
           // Listen for disconnection message
         socket.current.on('userCallDisconnected', () => {
             handleDisconnectCall();
         });
    }

    // Update userrole ref with userRole    
    userRoleRef.current = useMemo(() => userRole,[userRole])

    const initiateMediaStream = async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (stream){
            localVideoRef.current.srcObject = stream;
        }
        

        return stream;
    };

    useEffect(() => {
        initializeSocket();
        
        // Capture local media stream (video and audio)
        
        
        initiateMediaStream();   
        
        
        return () => {
            // if ( peerConnection.current){
            //     peerConnection.current[localSocketId.current].close();
            // }
            
            if (socket.current) {
                socket.current.disconnect();
            }
        }
    }, []);


    // useEffect(() => {
    //     // if (!peerConnection.current){
    //     //     initializePeerConnection();
    //     // }
        
    //     // initializePeerConnection();

    //     if ( userRole === 'broadcaster'){
    //         if (!localVideoRef.current.srcObject){
    //             initiateMediaStream();
    //         }
    //         // const stream = localVideoRef.current.srcObject;
    //         // if (stream){
    //         //     stream.getTracks().forEach(track => {
    //         //         peerConnection.current[localSocketId.current].addTrack(track, stream);
    //         //         console.log('Added local track to peer connection:', track);
    //         //     });
    //         // }
    //         setIsBroadcasting(true);
   
    //     }
    // },[userRole]);

    //Translating on the client side
    useEffect(() => {
        if (recognizedText) {
            const translate = async () => {
                const translated = await translateText(recognizedText, localTargetLanguage);
                setTranslatedText(translated);
            };

            translate();
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
            socket.current.emit('initiateCall', true);
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
  console.log(remoteVideoRefs,"remoteVideoRefs", localVideoRef)
    return (
        <div className="video-chat">
        {/* <div className="video-chat-content"> */}
          <div className="video-container">
          {
            (userRole === 'viewer' && remoteVideoRefs.length ) ? 
                <video 
                    className="local-video"
                    ref={(el) => {
                        if (el) {
                            el.srcObject = remoteVideoRefs[0];
                        }
                    }}
                autoPlay  playsInline muted />
                :
             
                <video className={isBroadcasting && remoteVideoRefs.length ? 'hide-video' : 'local-video'} ref={localVideoRef } autoPlay  playsInline muted />
            }
           
            {(isBroadcasting && userRole === 'broadcaster') && <div className="live-text">LIVE</div>}
            </div>
            {/* <div className="remote-video"> */}
                {/* {<video ref={callStarted ? localVideoRef :remoteVideoRef} autoPlay  playsInline muted />} */}
                 {userRole === 'broadcaster' &&
                 (
                    <div className="remote-videos-broadcast">
                         {remoteVideoRefs.map((remoteStream, index) => (
                            <div key={index} className="video-container">
                                 <video
                                className="remote-video-broadcast"
                                ref={(el) => {
                                    if (el) {
                                        el.srcObject = remoteStream;
                                    }
                                }}
                                autoPlay
                                playsInline
                            />
                            </div>
                         ))}
                    </div>
                    
                )
                 
                 }
                
            {/* </div> */}
          {/* </div> */}
          <div className="user-info">
            {callStarted &&  
                <Translation 
                    socket = {socket.current} 
                    role={userRole} 
                    targetLanguage="en" 
                />}
           
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
                {(isBroadcasting && userRole !== 'broadcaster') ? 
                    <Button onClick={handleClick} >Join</Button> 
                    : 
                
                <IconButton 
                    onClick={handleClick} 
                    // disabled = {!!userRole && !connected || callStarted}
                >
                    <Phone style={{color: ((userRole === 'broadcaster' && isBroadcasting)  )? 'red': 'green'}}/>
                </IconButton> 
                }
                <IconButton><Cancel /></IconButton>
            </div>    
        </div>
      </div>
    )
}

export default BroadcastVid;

