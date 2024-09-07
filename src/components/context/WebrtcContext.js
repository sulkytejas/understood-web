/* eslint-disable */
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Device } from 'mediasoup-client';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { useSocket } from '../context/SocketContext';
import { cleanupState } from '../../redux/actions';

const WebRTCContext = createContext();

export const useWebRTC = () => useContext(WebRTCContext);

export const WebRTCProvider = ({ children }) => {
  const { socket } = useSocket();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callStarted, setCallStarted] = useState(false);
  const [device, setDevice] = useState(null);
  const [joined, setJoined] = useState(false);
  const [sendTransport, setSendTransport] = useState(null);
  const [recvTransport, setRecvTransport] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);

  const videoProducerRef = useRef(null);
  const audioProducerRef = useRef(null);

  const meetingId = useSelector((state) => state.meeting.meetingId);
  const isVideoPaused = useSelector((state) => state.videoPlayer.videoPause);
  const isAudioPaused = useSelector((state) => state.videoPlayer.audioPause);

  useEffect(() => {
    console.log('Device state after update:', device);
  }, [device]);

  useEffect(() => {
    if (videoProducerRef.current) {
      if (isVideoPaused) {
        videoProducerRef.current.pause();
      } else {
        videoProducerRef.current.resume();
      }
    }
  }, [isVideoPaused, videoProducerRef.current]);

  useEffect(() => {
    if (audioProducerRef.current) {
      if (isAudioPaused) {
        audioProducerRef.current.pause();
      } else {
        audioProducerRef.current.resume();
      }
    }
  }, [isAudioPaused, audioProducerRef.current]);

  const joinRoom = (enteredMeetingId) => {
    return new Promise((resolve, reject) => {
      socket.emit(
        'joinMeeting',
        enteredMeetingId,
        async ({
          success,
          routerRtpCapabilities,
          isHost,
          hostSocketId,
          error,
        }) => {
          console.log(enteredMeetingId);
          if (success) {
            const newDevice = new Device();

            try {
              await newDevice.load({ routerRtpCapabilities });

              setDevice(newDevice);
              setJoined(true);
              console.log('Joined room:', enteredMeetingId);
              console.log('Device state after setDevice:', device);

              resolve({ hostSocketId, isHost, joined: true });
            } catch (error) {
              reject(error);
            }
          } else {
            reject({ error });
          }
        },
      );
    });
  };

  const createProducerTransport = async () => {
    return new Promise((resolve, reject) => {
      socket.emit(
        'create-producer-transport',
        { meetingId: meetingId },
        async (transportOptions) => {
          try {
            const transport = device.createSendTransport(transportOptions);

            console.log('Transport Producer created:', transport);

            transport.on('connect', async ({ dtlsParameters }, callback) => {
              console.log('Connect event triggered');

              await socket.emit(
                'connect-producer-transport',
                {
                  dtlsParameters,
                  transportId: transport.id,
                  meetingId: meetingId,
                },
                callback,
              );
            });

            transport.on(
              'produce',
              async ({ kind, rtpParameters }, callback) => {
                // Handle produce event
                const { producerId } = await socket.emit(
                  'produce',
                  {
                    kind,
                    rtpParameters,
                    transportId: transport.id,
                    meetingId: meetingId,
                  },
                  ({ producerId, error }) => {
                    if (error) {
                      console.error('Error in producing media:', error);
                      callback({ error }); // Call the callback with the error
                      return;
                    }
                    console.log('Producer created with ID:', producerId);

                    callback({ id: producerId });
                  },
                );
              },
            );

            // Debug ICE states
            transport.on('icegatheringstatechange', (state) => {
              console.log('ICE gathering state changed:', state);
            });

            transport.on('icestatechange', (state) => {
              console.log('ICE state changed:', state);
            });
            setSendTransport(transport);

            resolve(transport);
          } catch (error) {
            console.error('Error creating transport:', error);
            reject(error);
          }
        },
      );
    });
  };

  const createConsumerTransport = async () => {
    return new Promise((resolve, reject) => {
      socket.emit(
        'create-consumer-transport',
        { meetingId: meetingId },
        async (transportOptions) => {
          try {
            const transport = device.createRecvTransport(transportOptions);

            console.log('Transport created:', transport);

            transport.on('connect', async ({ dtlsParameters }, callback) => {
              console.log('Connect event triggered');

              await socket.emit(
                'connect-consumer-transport',
                {
                  dtlsParameters,
                  transportId: transport.id,
                  meetingId: meetingId,
                },
                callback,
              );
            });

            // Debug ICE states
            transport.on('icegatheringstatechange', (state) => {
              console.log('ICE gathering state changed:', state);
            });

            transport.on('icestatechange', (state) => {
              console.log('ICE state changed:', state);
            });
            setRecvTransport(transport);

            resolve(transport);
          } catch (error) {
            console.error('Error creating transport:', error);
            reject(error);
          }
        },
      );
    });
  };

  useEffect(() => {
    // Set up the listener for new producers
    if (socket && device) {
      socket.on('new-producer', async ({ producerId, kind }) => {
        const newRecvTransport = await createConsumerTransport();

        console.log('producer meeting id', producerId);
        socket.emit(
          'consume',
          {
            meetingId: meetingId,
            transportId: newRecvTransport.id,
            producerId,
            kind,
            rtpCapabilities: device.rtpCapabilities,
          },
          async ({ id, producerId, kind, rtpParameters }) => {
            const consumer = await newRecvTransport.consume({
              id,
              producerId,
              rtpParameters,
              kind,
            });

            setRemoteStream((prevStream) => {
              const stream = prevStream || new MediaStream();
              stream.addTrack(consumer.track); // Add the received track to the stream
              return stream;
            });

            // const stream = new MediaStream();

            // if (kind === 'video') {
            //   stream.addTrack(consumer.track);
            //   setRemoteStream(stream);
            // }

            console.log('Consuming media:', consumer);
          },
        );
      });
    }

    return () => {
      // Cleanup listener when the component unmounts
      if (socket) {
        socket.off('new-producer');
      }
    };
  }, [socket, device]);

  const handleDisconnectCall = () => {
    const scoppedMeetingId = meetingId;
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

    // Dispatch Redux cleanup action
    dispatch(cleanupState());
    setCallStarted(false);
    navigate(`/meetingEnded?meetingId=${scoppedMeetingId}`);
  };

  const startStreaming = async () => {
    if (isStreaming) {
      console.log('startStreaming already in progress, skipping...');
      return;
    }
    setIsStreaming(true);

    const newTransport = await createProducerTransport();
    console.log('Transport ready, starting to produce media...');

    const stream = await navigator.mediaDevices.getUserMedia({
      // video: {
      //   width: { ideal: 1280 },
      //   height: { ideal: 720 },
      //   frameRate: { ideal: 30 },
      // },
      video: true,
      audio: true,
    });
    setLocalStream(stream);

    const videoTrack = stream.getVideoTracks()[0];
    const audioTrack = stream.getAudioTracks()[0];

    try {
      const videoProducer = await newTransport.produce({
        track: videoTrack,
        encodings: [
          { maxBitrate: 500000, scaleResolutionDownBy: 3 }, // Low resolution
          { maxBitrate: 1000000, scaleResolutionDownBy: 2 }, // Medium resolution
          { maxBitrate: 1500000 }, // High resolution
        ],
        scalabilityMode: 'L3T3',
        dtx: true,
        codecOptions: {
          videoGoogleStartBitrate: 1000,
        },
      }); // Use the transport directly
      const audioProducer = await newTransport.produce({ track: audioTrack }); // Use the transport directly

      videoProducerRef.current = videoProducer;
      audioProducerRef.current = audioProducer;

      console.log(
        'Audio video producer setup complete:',
        videoProducer,
        audioProducer,
      );
    } catch (error) {
      console.error('Failed to produce video:', error);
    } finally {
      setIsStreaming(false);
    }

    socket.on('meeting-ended', () => {
      console.log('meeting-ended triggered');
      handleDisconnectCall();
    });
  };

  return (
    <WebRTCContext.Provider
      value={{
        localStream,
        remoteStream,
        handleDisconnectCall,
        joinRoom,
        startStreaming,
      }}
    >
      {children}
    </WebRTCContext.Provider>
  );
};
