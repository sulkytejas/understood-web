import { useRef } from 'react';
import axios from 'axios';

const useWebRTC = ({socket}) => {
    const peerConnection = useRef(null);
    const localTrack = useRef(null);
    const remoteTrack = useRef(null);
    const candidates = useRef(new Set());

    const initializePeerConnection = async () => {
        if (peerConnection.current) {
            return; // Prevent re-initializing if already set up
        }

        const turnResponse = await axios.get('http://localhost:5001/api/turnCredentials');
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
            ],
        };

        peerConnection.current = new RTCPeerConnection(configuration);

        peerConnection.current.ontrack = (event) => {
            remoteTrack.current = event.streams[0];
        };

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
            if (peerConnection.current.iceConnectionState === 'failed') {
                peerConnection.current.restartIce();
            }
        };
    };

    const createOffer = async () => {
        await initializePeerConnection();

        const constraints = {
            video: true,
            audio: true,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        localTrack.current = stream;

        stream.getTracks().forEach((track) => {
            peerConnection.current.addTrack(track, stream);
        });

        const offer = await peerConnection.current.createOffer();
        await peerConnection.current.setLocalDescription(offer);

        socket.current.emit('offer', offer);
    };

    const handleAnswer = async (answer) => {
        await initializePeerConnection(); // Ensure peer connection is initialized
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
    };

    const handleOffer = async (offer) => {
        await initializePeerConnection(); // Ensure peer connection is initialized

        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));

        const answer = await peerConnection.current.createAnswer();
        await peerConnection.current.setLocalDescription(answer);

        socket.current.emit('answer', answer);
    };

    return {
        peerConnection,
        localTrack: localTrack.current,
        remoteTrack: remoteTrack.current,
        initializePeerConnection,
        createOffer,
        handleAnswer,
        handleOffer,
    };
};

export default useWebRTC;
