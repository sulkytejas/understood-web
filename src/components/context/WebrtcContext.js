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
  const [currentBitrate, setCurrentBitrate] = useState(null);
  const [packetLoss, setPacketLoss] = useState(null);
  const [rtt, setRtt] = useState(null);
  const [intentionalDisconnect, setIntentionalDisconnect] = useState(false);
  const [connectionState, setConnectionState] = useState('connected');

  const videoProducerRef = useRef(null);
  const audioProducerRef = useRef(null);
  const consumers = useRef({});
  const isReconnecting = useRef(false);

  const meetingId = useSelector((state) => state.meeting.meetingId);
  const isVideoPaused = useSelector((state) => state.videoPlayer.videoPause);
  const isAudioPaused = useSelector((state) => state.videoPlayer.audioPause);

  const userSpokenLanguage = useSelector(
    (state) => state.translation.localSpokenLanguage,
  );

  useEffect(() => {
    console.log('Device state after update:', device);
  }, [device]);

  console.log(packetLoss, rtt, currentBitrate, 'packetLoss,rtt,currentBitrate');

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

  useEffect(() => {
    const interval = setInterval(async () => {
      if (videoProducerRef.current) {
        try {
          const pc = sendTransport._handler._pc;
          const transportStats = await pc.getStats();
          let bitrate;
          let packetsLost;
          let roundTripTime;
          let packetsSent;

          transportStats.forEach((report) => {
            if (report.type === 'outbound-rtp' && report.kind === 'video') {
              console.log('Outbound RTP:', report);
              packetsSent = report.packetsSent;
              bitrate = report.bytesSent;
              setCurrentBitrate(bitrate);
            }
            if (
              report.type === 'candidate-pair' &&
              report.state === 'succeeded' &&
              report.nominated
            ) {
              console.log('Candidate Pair:', report);
              roundTripTime = report.currentRoundTripTime * 1000; // Convert to milliseconds
              setRtt(roundTripTime);
            }
            if (
              report.type === 'remote-inbound-rtp' &&
              report.kind === 'video'
            ) {
              console.log('Remote Inbound RTP:', report);

              packetsLost = report.packetsLost;
            }
          });

          const loss = (packetsLost / packetsSent) * 100;
          setPacketLoss(loss);
          adjustBitrateAndResolution(bitrate, loss, roundTripTime);
          // stats.forEach((report) => {
          //   if (report.type === 'outbound-rtp') {
          //   }
          // });
        } catch (error) {
          console.error('Error fecthing videoproducer stats', error);
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [videoProducerRef.current]);

  const adjustBitrateAndResolution = (bitrate, packetLoss, rtt) => {
    const minBitrate = 500000;
    165817;
    const maxRTT = 200;
    const maxPacketLoss = 5;

    if (packetLoss > maxPacketLoss || rtt > maxRTT) {
      console.log('Packet loss or RTT too high, reducing bitrate');
      reduceBitrate(bitrate);
    } else if (bitrate < minBitrate) {
      switchToLowerResolution();
    } else {
      increaseBitrate(bitrate);
    }
  };

  const switchToLowerResolution = () => {
    // Switch to a lower resolution or different codec
    console.log('Switching to lower resolution');
    const sender = videoProducerRef.current._rtpSender;
    if (sender) {
      const params = sender.getParameters();
      if (params.encodings && params.encodings[0]) {
        if (!params.encodings[0].scaleResolutionDownBy) {
          params.encodings[0].scaleResolutionDownBy = 1.5; // Start with 1.5x downscaling
        } else {
          params.encodings[0].scaleResolutionDownBy *= 1.5;
        }

        // Optionally reduce the bitrate to match lower resolution
        params.encodings[0].maxBitrate = Math.max(
          params.encodings[0].maxBitrate * 0.75,
          300000,
        ); // Reduce bitrate further

        if (!params.encodings[0].maxFramerate) {
          params.encodings[0].maxFramerate = 15; // Lower frame rate if needed
        } else {
          params.encodings[0].maxFramerate = Math.max(
            params.encodings[0].maxFramerate - 5,
            10,
          ); // Gradually lower frame rate
        }

        sender
          .setParameters(params)
          .then(() => {
            console.log(
              'Resolution and bitrate adjusted for poor network conditions',
            );
          })
          .catch((error) =>
            console.error('Error adjusting resolution and bitrate:', error),
          );
      }
    }
  };

  const reduceBitrate = (currentBitrate) => {
    const sender = videoProducerRef.current._rtpSender;

    if (sender) {
      const params = sender.getParameters();
      params.encodings[0].maxBitrate = Math.max(currentBitrate * 0.75, 500000);
      sender.setParameters(params);
      console.log('Reduced bitrate to:', params.encodings[0].maxBitrate);
    }
  };

  const increaseBitrate = (currentBitrate) => {
    const sender = videoProducerRef.current._rtpSender;

    if (sender) {
      const params = sender.getParameters();
      params.encodings[0].maxBitrate = currentBitrate + 100000;
      sender.setParameters(params);

      // if (params.encodings[0].maxBitrate > 1500000) {
      //   switchCodec('VP9');
      //
      // }
      console.log(
        'Increased bitrate to:',
        params.encodings[0].maxBitrate,
        'packetLoss:',
        packetLoss,
        'rtt:',
        rtt,
      );
    }
  };

  // const switchCodec = async (newCodec) => {
  //   console.log('Switching codec to:', newCodec);
  //   try {
  //     const transport = sendTransport;

  //     if (videoProducerRef.current) {
  //       await videoProducerRef.current.close();
  //     }

  //     const videoTrack = localStream.getVideoTracks()[0];

  //     if (videoTrack.readyState === 'ended') {
  //       console.error('Track has already ended, cannot reuse.');
  //       return;
  //     }

  //     let codec;
  //     if (newCodec === 'VP8') {
  //       codec = device.rtpCapabilities.codecs.find(
  //         (c) => c.mimeType === 'video/VP8',
  //       );
  //     } else if (newCodec === 'H264') {
  //       codec = device.rtpCapabilities.codecs.find(
  //         (c) => c.mimeType === 'video/H264',
  //       );
  //     } else if (newCodec === 'VP9') {
  //       codec = device.rtpCapabilities.codecs.find(
  //         (c) => c.mimeType === 'video/VP9',
  //       );
  //     } else {
  //       console.error('Invalid codec:', newCodec);
  //       return;
  //     }

  //     const newVideoProducer = await transport.produce({
  //       track: videoTrack,
  //       encodings: [
  //         { scalabilityMode: 'S1T1', maxBitrate: 1000000 }, // Single encoding for SVC (VP9 doesn’t support simulcast)
  //       ],
  //       codecOptions: {
  //         videoGoogleStartBitrate: 500,
  //       },
  //       codec,
  //       stopTracks: false,
  //     });
  //     videoProducerRef.current = newVideoProducer;

  //     console.log(`Switched codec to ${newCodec}`);
  //   } catch (error) {
  //     console.error('Failed to switch codec:', error);
  //   }
  // };

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

  const attemptReconnect = async () => {
    if (isReconnecting.current) {
      return; // Prevent multiple reconnection attempts
    }
    try {
      isReconnecting.current = true;
      socket.emit('reconnecting', { meetingId, userId: socket.id });
      console.log('Recreating producer transport...');

      // Close existing transports if any
      if (sendTransport) {
        sendTransport.close();
        setSendTransport(null);
      }
      if (recvTransport) {
        recvTransport.close();
        setRecvTransport(null);
      }

      // Close existing producers
      if (videoProducerRef.current) {
        await videoProducerRef.current.close();
        videoProducerRef.current = null;
      }
      if (audioProducerRef.current) {
        await audioProducerRef.current.close();
        audioProducerRef.current = null;
      }

      // Close existing consumers
      Object.values(consumers.current).forEach((consumer) => {
        consumer.close();
      });
      consumers.current = {};

      // Clear remote stream
      setRemoteStream(null);

      // await createProducerTransport();
      console.log('Reconnecting to meeting...');

      // Rejoin the meeting and start media production again
      await joinRoom(meetingId);
      await startStreaming();

      console.log('Reconnection successful.');
      socket.on('reconnected', ({ userId }) => {
        console.log(`${userId} has reconnected to the meeting.`);
      });
    } catch (error) {
      console.error('Error during reconnection:', error);
      setTimeout(attemptReconnect, 3000); // Retry after 3 seconds
    } finally {
      isReconnecting.current = false;
    }
  };

  const handleConnectionStateChange = (state) => {
    console.log(
      'Connection state changed to:',
      state,
      'for transport ID:',
      transport.id,
    );
    setConnectionState(state);
    if (state === 'disconnected' || state === 'failed') {
      console.log('Connection failed for transport ID:', transport.id);
      console.log('Connection lost, attempting to reconnect...');
      if (!intentionalDisconnect) {
        attemptReconnect();
      }
    }
  };

  const createProducerTransport = async () => {
    return new Promise((resolve, reject) => {
      socket.emit(
        'create-producer-transport',
        { meetingId: meetingId },
        async (transportOptions) => {
          try {
            const transport = device.createSendTransport(transportOptions);
            console.log(
              'DTLS Connect event triggered for transport ID:',
              transport.id,
            );
            console.log('Transport Producer created:', transport);

            transport.on('connect', async ({ dtlsParameters }, callback) => {
              console.log(
                'Received DTLS parameters (Server-Side):',
                dtlsParameters,
              );

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
                console.log(
                  'Produce event triggered for transport ID:',
                  transport.id,
                  'kind:',
                  kind,
                );
                // Handle produce event
                const { producerId } = await socket.emit(
                  'produce',
                  {
                    kind,
                    rtpParameters,
                    transportId: transport.id,
                    meetingId: meetingId,
                    userSpokenLanguage: userSpokenLanguage,
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
              console.log(
                'ICE gathering state changed to:',
                state,
                'for transport ID:',
                transport.id,
              );
            });

            transport.on('connectionstatechange', handleConnectionStateChange);
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

            console.log('consumer Transport created:', transport);

            transport.on('connect', async ({ dtlsParameters }, callback) => {
              console.log(
                'Consumer Received DTLS parameters (Server-Side):',
                dtlsParameters,
              );

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
              console.log(
                'ICE gathering state changed to:',
                state,
                'for consumer transport ID:',
                transport.id,
              );
            });

            transport.on('connectionstatechange', handleConnectionStateChange);
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

  const handleProduce = async ({ producerId, kind }) => {
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

        // Store the consumer
        consumers.current[producerId] = consumer;

        setRemoteStream((prevStream) => {
          const newStream = new MediaStream();

          if (prevStream) {
            prevStream.getTracks().forEach((track) => {
              if (track.kind !== kind) {
                newStream.addTrack(track);
              }
            });
          }
          newStream.addTrack(consumer.track);
          setCallStarted(true);
          return newStream;
        });

        // const stream = new MediaStream();

        // if (kind === 'video') {
        //   stream.addTrack(consumer.track);
        //   setRemoteStream(stream);
        // }

        console.log('Consuming media:', consumer);
      },
    );
  };

  useEffect(() => {
    // Set up the listener for new producers
    const handleNewProducer = async ({ producerId, kind }) => {
      await handleProduce({ producerId, kind });
    };

    if (socket && device) {
      socket.on('new-producer', handleNewProducer);
    }

    return () => {
      // Cleanup listener when the component unmounts
      if (socket) {
        socket.off('new-producer', handleNewProducer);
      }
    };
  }, [socket, device]);

  useEffect(() => {
    const handleProducerClosed = ({ producerId }) => {
      const consumer = consumers.current[producerId];

      if (consumer) {
        consumer.close();
        delete consumers.current[producerId];

        setRemoteStream((prevStream) => {
          if (prevStream) {
            const newStream = new MediaStream(
              prevStream
                .getTracks()
                .filter((track) => track.id !== consumer.track.id),
            );

            return newStream;
          }

          return prevStream;
        });
      }
    };

    if (socket) {
      socket.on('producer-closed', handleProducerClosed);
    }

    return () => {
      if (socket) {
        socket.off('producer-closed', handleProducerClosed);
      }
    };
  }, [socket]);

  useEffect(() => {
    const handleMeetingEnded = () => {
      console.log('meeting-ended triggered');
      handleDisconnectCall();
    };

    if (socket) {
      socket.on('meeting-ended', handleMeetingEnded);
    }

    return () => {
      if (socket) {
        socket.off('meeting-ended', handleMeetingEnded);
      }
    };
  }, [socket]);

  const handleDisconnectCall = () => {
    setIntentionalDisconnect(true);
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
      video: {
        width: { ideal: 640 },
        height: { ideal: 360 },
        frameRate: { ideal: 15, max: 30 },
      },
      video: true,
      audio: true,
    });
    setLocalStream(stream);

    const videoTrack = stream.getVideoTracks()[0];
    const audioTrack = stream.getAudioTracks()[0];

    try {
      const capabilities = RTCRtpSender.getCapabilities('video');
      console.log(capabilities, 'capabilities before video producer');
      const videoProducer = await newTransport.produce({
        track: videoTrack,
        encodings: [
          { scalabilityMode: 'L1T1', maxBitrate: 1000000 }, // Single encoding for SVC (VP9 doesn’t support simulcast)
        ],

        codecOptions: {
          videoGoogleStartBitrate: 500,
        },
      }); // Use the transport directly
      const audioProducer = await newTransport.produce({
        track: audioTrack,
      }); // Use the transport directly

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

    // socket.on('meeting-ended', () => {
    //   console.log('meeting-ended triggered');
    //   handleDisconnectCall();
    // });
  };

  return (
    <WebRTCContext.Provider
      value={{
        localStream,
        remoteStream,
        handleDisconnectCall,
        joinRoom,
        startStreaming,
        connectionState,
        callStarted,
      }}
    >
      {children}
    </WebRTCContext.Provider>
  );
};
