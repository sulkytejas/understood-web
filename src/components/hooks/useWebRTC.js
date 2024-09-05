/* eslint-disable */
import { useRef, useState, useEffect } from 'react';
import { Device } from 'mediasoup-client';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { addOrUpdateTranslatedText } from '../utils/peerConnectionUtils';
import { useSelector } from 'react-redux';
import { useSocket } from '../context/SocketContext';
import { selectMeetingId } from '../../redux/meetingSlice';
import { cleanupState } from '../../redux/actions';

const useWebRTC = () => {
  const { socket } = useSocket();
  const dispatch = useDispatch();

  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callStarted, setCallStarted] = useState(false);
  const [device, setDevice] = useState(null); // mediasoup Device
  const [joined, setJoined] = useState(false);
  const [sendTransport, setSendTransport] = useState(null);
  const [recvTransport, setRecvTransport] = useState(null);

  const meetingId = useSelector(selectMeetingId);
  const hostSocketIdRedux = useSelector((state) => state.meeting.hostSocketId);
  const translationLanguage = useSelector(
    (state) => state.translation.localTranslationLanguage,
  );
  const navigate = useNavigate();
  const joinRoom = () => {
    return new Promise((resolve, reject) => {
      socket.emit(
        'joinMeeting',
        meetingId,
        async ({ success, routerRtpCapabilities, isHost, hostSocketId }) => {
          if (success) {
            const newDevice = new Device();
            try {
              await newDevice.load({ routerRtpCapabilities });
              setDevice(newDevice);
              setJoined(true);
              console.log('Joined room:', meetingId);

              if (!meetingId) {
                dispatch(joinMeeting(meetingId));
                dispatch(setHostSocketId(hostSocketId));
                dispatch(setIsHost(isHost));
              }
              navigate(`/videocall/${meetingId}`);

              resolve({ hostSocketId, isHost, joined });
            } catch (error) {
              reject(error);
            }
          } else {
            reject({ error: 'cannot join meeting in socket io' });
          }
        },
      );
    });
  };

  const createTransport = async (direction) => {
    socket.emit(
      'create-transport',
      { meetingId, direction },
      async (transportOptions) => {
        const transport =
          direction === 'send'
            ? device.createSendTransport(transportOptions)
            : device.createRecvTransport(transportOptions);
        transport.on('connect', async ({ dtlsParameters }, callback) => {
          socket.emit(
            'connect-transport',
            { dtlsParameters, transportId: transport.id },
            callback,
          );
        });

        if (direction === 'send') {
          setSendTransport(transport);
        } else {
          setRecvTransport(transport);
        }
      },
    );
  };

  const startStreaming = async () => {
    await createTransport('send');

    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    setLocalStream(stream);

    const track = stream.getVideoTracks()[0];
    const params = {
      track,
      // encodings: [
      //   { maxBitrate: 100000, scaleResolutionDownBy: 3 }, // Low resolution
      //   { maxBitrate: 300000, scaleResolutionDownBy: 2 }, // Medium resolution
      //   { maxBitrate: 1000000 }, // Full resolution
      // ],
      // codecOptions: {
      //   videoGoogleStartBitrate: 100000,
      // },
    };

    const producer = await sendTransport.produce(params);
    console.log('Producing video:', producer);
  };

  const handleDisconnectCall = () => {
    if (socket) {
      socket.disconnect();
    }
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());

      setLocalStream(null);
    }

    if (remoteStream) {
      remoteStream.getTracks().forEach((track) => track.stop());
      setRemoteStream(null);
    }

    // Notify the server
    socket.emit('disconnectCall');

    // Dispatch Redux cleanup action
    dispatch(cleanupState());
    setCallStarted(false);
    // setTranslatedTexts([]);
    navigate(`/meetingEnded?meetingId=${meetingId}`);
  };

  return {
    localStream,
    remoteStream,
    handleDisconnectCall,
    joinRoom,
    startStreaming,
  };
};

export default useWebRTC;
