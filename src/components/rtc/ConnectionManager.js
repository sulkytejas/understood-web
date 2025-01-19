/**
 * ConnectionManager.js
 * Core WebRTC connection management for professional video conferencing.
 * Handles connection lifecycle, media management, and transport coordination.
 */

import SignalingLayer from './SignalingLayer';
import MediaManager from './MediaManager';
import ConnectionPool from './ConnectionPool';
import EventEmitter from './EventEmitter';

const CONNECTION_STATES = {
  NEW: 'new',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  RECONNECTING: 'reconnecting',
  FAILED: 'failed',
  CLOSED: 'closed',
  CLOSING: 'closing',
};

class ConnectionState {
  constructor(onStateChange) {
    this.currentState = CONNECTION_STATES.NEW;
    this.onStateChange = onStateChange;
    this.stateHistory = [];
    this.lastStateChange = Date.now();
  }

  isValidTransition(fromState, toState) {
    const validTransitions = {
      [CONNECTION_STATES.NEW]: [CONNECTION_STATES.CONNECTING],
      [CONNECTION_STATES.CONNECTING]: [
        CONNECTION_STATES.CONNECTED,
        CONNECTION_STATES.FAILED,
      ],
      [CONNECTION_STATES.CONNECTED]: [
        CONNECTION_STATES.RECONNECTING,
        CONNECTION_STATES.CLOSING,
        CONNECTION_STATES.FAILED,
      ],
      [CONNECTION_STATES.RECONNECTING]: [
        CONNECTION_STATES.CONNECTING,
        CONNECTION_STATES.CONNECTED,
        CONNECTION_STATES.FAILED,
      ],
      [CONNECTION_STATES.CLOSING]: [CONNECTION_STATES.CLOSED],
      [CONNECTION_STATES.FAILED]: [
        CONNECTION_STATES.CLOSING,
        CONNECTION_STATES.RECONNECTING,
      ],
      [CONNECTION_STATES.CLOSED]: [], // No valid transitions from closed state
    };

    return validTransitions[fromState]?.includes(toState) ?? false;
  }

  transition(newState) {
    if (this.currentState === newState) {
      return;
    }
    // Validate the state exists
    if (!Object.values(CONNECTION_STATES).includes(newState)) {
      throw new Error(`Invalid state transition attempted: ${newState}`);
    }

    // Validate the transition is allowed
    if (!this.isValidTransition(this.currentState, newState)) {
      console.warn(
        `Invalid state transition from ${this.currentState} to ${newState}`,
      );
      return;
    }

    if (this.currentState === newState) return;

    const transition = {
      from: this.currentState,
      to: newState,
      timestamp: Date.now(),
      duration: Date.now() - this.lastStateChange,
    };

    this.stateHistory.push(transition);
    this.currentState = newState;
    this.lastStateChange = Date.now();

    this.onStateChange?.(newState, transition);
  }

  isStable() {
    return this.currentState === CONNECTION_STATES.CONNECTED;
  }

  canReconnect() {
    return ![
      CONNECTION_STATES.CLOSED,
      CONNECTION_STATES.FAILED,
      CONNECTION_STATES.CLOSING,
    ].includes(this.currentState);
  }
}

class QualityMonitor {
  static Levels = {
    EXCELLENT: 'excellent',
    GOOD: 'good',
    FAIR: 'fair',
    POOR: 'poor',
  };

  constructor(options = {}) {
    this.thresholds = {
      rtt: {
        good: options.rttGood || 150,
        fair: options.rttFair || 300,
        poor: options.rttPoor || 500,
      },
      packetLoss: {
        good: options.packetLossGood || 0.02,
        fair: options.packetLossFair || 0.05,
        poor: options.packetLossPoor || 0.1,
      },
    };

    this.metrics = {
      rtt: [],
      packetLoss: [],
      bitrate: [],
    };

    this.currentLevel = QualityMonitor.Levels.GOOD;
    this.onQualityChange = options.onQualityChange;
    this.historySize = options.historySize || 10;
  }

  update(stats) {
    // Update metrics history
    this.metrics.rtt.push(stats.rtt);
    this.metrics.packetLoss.push(stats.packetLoss);
    this.metrics.bitrate.push(stats.bitrate);

    // Maintain history size
    Object.values(this.metrics).forEach((metric) => {
      if (metric.length > this.historySize) {
        metric.shift();
      }
    });

    // Calculate averages
    const avgRtt = this.average(this.metrics.rtt);
    const avgPacketLoss = this.average(this.metrics.packetLoss);

    // Determine quality level
    const newLevel = this.determineQualityLevel(avgRtt, avgPacketLoss);

    if (newLevel !== this.currentLevel) {
      const oldLevel = this.currentLevel;
      this.currentLevel = newLevel;
      this.onQualityChange?.(newLevel, oldLevel);
    }

    return {
      level: this.currentLevel,
      metrics: {
        avgRtt,
        avgPacketLoss,
        avgBitrate: this.average(this.metrics.bitrate),
      },
    };
  }

  average(array) {
    return array.reduce((a, b) => a + b, 0) / array.length;
  }

  determineQualityLevel(rtt, packetLoss) {
    if (
      rtt <= this.thresholds.rtt.good &&
      packetLoss <= this.thresholds.packetLoss.good
    ) {
      return QualityMonitor.Levels.EXCELLENT;
    } else if (
      rtt <= this.thresholds.rtt.fair &&
      packetLoss <= this.thresholds.packetLoss.fair
    ) {
      return QualityMonitor.Levels.GOOD;
    } else if (
      rtt <= this.thresholds.rtt.poor &&
      packetLoss <= this.thresholds.packetLoss.poor
    ) {
      return QualityMonitor.Levels.FAIR;
    }
    return QualityMonitor.Levels.POOR;
  }
}

class ConnectionManager extends EventEmitter {
  constructor({
    socket,
    userSpokenLanguage,
    onStateChange,
    onStreamsUpdate,
    onError,
    onQualityChange,
    uid,
    onParticipantJoined,
    onMediaFlowing,
    onAudioOnly,
  }) {
    super();
    // Validate required parameters
    if (!socket) {
      throw new Error('Required parameters missing');
    }

    // Core properties
    this.meetingId = null;
    this.userSpokenLanguage = userSpokenLanguage;
    this.device = null;
    this.uid = uid;
    this.audioProducerTransport = null;
    this.videoProducerTransport = null;
    this.consumerTransportId = null;

    // Callback handlers
    this.onStateChange = onStateChange;
    this.onStreamsUpdate = onStreamsUpdate;
    this.onError = onError;
    this.onParticipantJoined = onParticipantJoined;
    this.onMediaFlowing = onMediaFlowing;
    this.onAudioOnly = onAudioOnly;

    // Initialize managers
    this.signaling = new SignalingLayer(socket);
    this.mediaManager = new MediaManager();
    this.connectionPool = new ConnectionPool();

    // Connection state
    this.isReconnecting = false;
    this.reconnectionAttempts = 0;
    this.MAX_RECONNECT_ATTEMPTS = 5;
    this.isHost = false;
    this.hostSocketId = null;
    this.isConsumerReady = false;
    this.socket = socket;

    // Quality monitoring
    this.statsInterval = null;
    this.lastQualityCheck = Date.now();
    this.QUALITY_CHECK_INTERVAL = 2000;

    // Bind methods
    this.attemptReconnect = this.attemptReconnect.bind(this);
    this.handleConnectTransportFailure =
      this.handleConnectTransportFailure.bind(this);
    this.handleConnectionStateChange =
      this.handleConnectionStateChange.bind(this);
    this.handleError = this.handleError.bind(this);
    this.updateState = this.updateState.bind(this);
    this.updateStreams = this.updateStreams.bind(this);
    this.cleanup = this.cleanup.bind(this);

    // Initialize event listeners
    // this.initializeEventListeners();

    this.state = new ConnectionState((newState, transition) => {
      this.handleStateTransition(newState, transition);
      onStateChange?.(newState);
    });

    this.qualityMonitor = new QualityMonitor({
      onQualityChange: this.handleQualityChange.bind(this),
    });

    this.onQualityChange = onQualityChange;

    this.pendingProducers = [];
    this.mediaChecksStarted = false;
    this.mediaFlowing = false;
    this.mediaInactivityDuration = 0; // how long we've gone without media
    this.MEDIA_CHECK_INTERVAL = 5000; // check every 5s
    this.MEDIA_INACTIVITY_THRESHOLD = 20000; // 20s of no media flow
  }

  startMediaFlowChecks() {
    if (this.mediaChecksStarted) return; // don't start twice
    this.mediaChecksStarted = true;

    this.mediaCheckInterval = setInterval(async () => {
      this.mediaFlowing = await this.mediaManager.isInboundMediaFlowing();

      this.onMediaFlowing(
        this.mediaFlowing &&
          this.mediaChecksStarted &&
          this.mediaFlowing !== 'not-ready',
      );

      if (this.mediaFlowing === 'not-ready') {
        console.log('Media not ready for flow checks');
        return;
      }

      if (!this.mediaFlowing) {
        this.mediaInactivityDuration += this.MEDIA_CHECK_INTERVAL;
        if (this.mediaInactivityDuration >= this.MEDIA_INACTIVITY_THRESHOLD) {
          console.warn(
            'No inbound media detected for 20s, triggering full reconnection...',
          );
          this.mediaInactivityDuration = 0;

          if (this.state.currentState !== CONNECTION_STATES.RECONNECTING) {
            this.state.transition(CONNECTION_STATES.RECONNECTING);
          }
          await this.attemptReconnect();
        }
      } else {
        // Media is flowing, reset inactivity counter
        this.mediaInactivityDuration = 0;
      }
    }, this.MEDIA_CHECK_INTERVAL);
  }

  /**
   * Initialize all event listeners
   * @private
   */

  initializeEventListeners() {
    // Use arrow function to preserve 'this' context
    this.connectionPool.on('transportFailed', (data) => {
      this.handleConnectTransportFailure(data);
    });

    this.connectionPool.on('transportWarning', (data) => {
      console.warn(`Transport warning: ${data.message}`, data);
      // Potentially trigger some UI warning or prepare for recovery
    });

    // Setup signaling events
    this.signaling.setupListeners({
      onNewProducer: this.handleNewProducer.bind(this),
      onProducerClosed: (data) => {
        try {
          const { producerId } = data;

          // Remove associated consumer if it exists
          const consumer = this.mediaManager.consumers.get(producerId);
          if (consumer) {
            consumer.close();
            this.mediaManager.consumers.delete(producerId);
          }

          // Update streams to reflect removed media
          this.updateStreams();

          console.log('Producer closed:', producerId);
        } catch (error) {
          this.handleError('Error handling producer closure', error);
        }
      },
      onParticipantDisconnected: (participantId) => {
        this.removeParticipantMedia();

        console.log('Participant disconnected:', participantId);
      },
      onMeetingEnded: () => {
        this.handleCallDisonnect();
      },
      onConnectionError: (error) => {
        console.error('Connection error', error);
        // Trigger the state machine to attempt reconnect

        if (this.state.canReconnect() && !this.isReconnecting) {
          this.isReconnecting = true;
          if (this.state.currentState !== CONNECTION_STATES.RECONNECTING) {
            this.state.transition(CONNECTION_STATES.RECONNECTING);
          }

          // Attempt full reconnection procedure
          this.attemptReconnect().catch((err) => {
            console.error('Reconnection failed:', err);
            // If reconnection fails, state transitions will be handled in attemptReconnect
          });
        } else if (!this.state.canReconnect()) {
          // If we cannot reconnect, transition to FAILED or handle gracefully
          this.handleError(
            'Server connection lost and cannot reconnect',
            error,
          );
        }
      },
      onIceRestart: async ({ transportId, iceParameters }) => {
        console.log('Received ice-restart event from server');

        const transport =
          this.connectionPool.getProducerTransport(transportId) ||
          this.connectionPool.getConsumerTransport(transportId);

        if (!transport) {
          console.warn(
            'No matching transport found for ICE restart. Proceeding to full reconnection...',
          );
          if (this.state.currentState !== CONNECTION_STATES.RECONNECTING) {
            this.state.transition(CONNECTION_STATES.RECONNECTING);
          }

          await this.attemptReconnect(); // Full reconnection if no transport found
          return;
        }

        try {
          await transport.restartIce({ iceParameters });
          console.log(
            'ICE restarted successfully on client with new parameters',
          );

          return;
          // If successful, we stop here. No need for full reconnection.
        } catch (error) {
          console.error('Failed to restart ICE on client:', error);
          // Immediately fallback to full reconnection

          if (this.state.currentState !== CONNECTION_STATES.RECONNECTING) {
            this.state.transition(CONNECTION_STATES.RECONNECTING);
          }

          await this.attemptReconnect();
        }
      },
    });
  }

  async handleNewProducer(data) {
    {
      try {
        console.log('New producer event:', data);

        if (!this.isConsumerReady) {
          // Queue the producer for later processing
          console.log('Queueing producer:', data.producerId);
          this.pendingProducers.push(data);
          return;
        }

        await this.consumeProducer(data);
        this.onParticipantJoined();
      } catch (error) {
        this.handleError('Failed to consume new producer', error);
      }
    }
  }
  /**
   * Establish connection and join meeting
   * @returns {Promise<void>}
   */
  async connect(meetingId, uid) {
    console.log('Consumer ready Connect start:', {
      isConsumerReady: this.isConsumerReady,
      isHost: this.isHost,
    });
    try {
      console.log('Starting connection with meetingId:', meetingId);
      this.state.transition(CONNECTION_STATES.CONNECTING);
      this.meetingId = meetingId;
      this.signaling.setMeetingId(meetingId);
      this.signaling.setUid(uid);

      // Step: Check network conditions
      const networkQuality = await this.runUploadTest();
      console.log('Network quality:', networkQuality);
      let isAudioOnly = false;
      if (networkQuality === 'poor') {
        isAudioOnly = true;
        this.onAudioOnly?.(isAudioOnly);
      }
      this.signaling.setAudioOnly(isAudioOnly);

      // Step 1: Join the room and get capabilities
      const joinResponse = await this.signaling.joinRoom();

      console.log('Join response:', joinResponse);

      if (!joinResponse.success) {
        throw new Error('Failed to join meeting');
      }

      // Step 2: Store role information
      this.isHost = joinResponse.ishost;
      this.hostSocketId = joinResponse.hostSocketId;

      const mediasoupClient = await import('mediasoup-client');
      const { Device } = mediasoupClient;

      // Step 3: Initialize mediasoup device
      this.device = new Device();
      await this.device.load({
        routerRtpCapabilities: joinResponse.routerRtpCapabilities,
      });

      // Step 4: Set joined state
      this.isJoined = true;

      console.log('Connection established:', {
        isHost: this.isHost,
        hostSocketId: this.hostSocketId,
        deviceLoaded: !!this.device,
      });

      // Step 5: Setup transports
      await this.setupTransports();

      // 6: Mark consumer as ready and process any pending producers
      this.isConsumerReady = true;

      await this.processPendingProducers();

      //   this.mediaManager.setHDPreference(true);
      // Step 7: Get and start streaming media

      const { stream, wasFallback } =
        await this.mediaManager.tryAcquireMedia(!isAudioOnly);
      if (wasFallback) {
        isAudioOnly = true;
        this.onAudioOnly?.(isAudioOnly);
      }
      this.signaling.setAudioOnly(isAudioOnly);

      await this.startStreaming(stream);

      this.state.transition(CONNECTION_STATES.CONNECTED);
      this.isReconnecting = false;
      this.reconnectionAttempts = 0;
      console.log(`Connection established - isHost: ${this.isHost}`);

      if (!this.mediaChecksStarted) {
        this.startMediaFlowChecks();
      }
      console.log('Media flow checks started');

      return {
        isHost: this.isHost,
        hostSocketId: this.hostSocketId,
        joined: this.isJoined,
      };
    } catch (error) {
      console.error('Connection failed:', error);
      this.handleError('Connection failed', error);
      throw error;
    }
  }

  handleStateTransition(newState, transition) {
    console.log(
      `Connection state transition: ${transition.from} -> ${newState}`,
    );

    switch (newState) {
      case CONNECTION_STATES.RECONNECTING:
        break;

      case CONNECTION_STATES.CONNECTED:
        this.reconnectionAttempts = 0;
        // this.startQualityMonitoring();
        break;

      case CONNECTION_STATES.CLOSING:
      case CONNECTION_STATES.CLOSED:
      case CONNECTION_STATES.FAILED:
        // cleanup on these states
        this.cleanup();
        break;
    }
  }

  async pollServerReadiness() {
    const maxDuration = 20_000; // 20 seconds total
    const interval = 1000;
    const startTime = Date.now();

    while (Date.now() - startTime < maxDuration) {
      console.log('Server readiness check: emitting');

      const response = await new Promise((resolve, reject) => {
        // Set up a timeout in case the server doesn't respond
        const timeout = setTimeout(() => {
          reject(new Error('No response from server on readiness check'));
        }, 1000); // give the server 1s to respond for each check

        this.socket.emit('checkServerStatus', {}, (resp) => {
          clearTimeout(timeout);
          resolve(resp);
        });
      }).catch((error) => {
        console.error('Poll attempt failed:', error);
        return null; // Return null if we got no response to try again
      });

      // If we got no response (null), continue looping until maxDuration elapsed
      if (response && response.isReady) {
        return true; // Server is ready
      }

      // Wait before next attempt
      await new Promise((resolve) => setTimeout(resolve, interval));
    }

    throw new Error('Server not ready after 20 seconds');
  }

  async initialize(meetingId, uid) {
    this.meetingId = meetingId;
    this.uid = uid;

    // If meetingId and uid are known, and we are not connected, attempt to reconnect
    if (meetingId && uid && this.state.canReconnect()) {
      try {
        const response = await this.connect(meetingId, uid);
        console.log('Auto-reconnect response:', response);

        return response;
        // On success, we are now CONNECTED again
      } catch (error) {
        console.error('Failed to auto-reconnect on initialize:', error);
        // Handle the failure (e.g., transition to FAILED, or notify the UI)
      }
    } else {
      // If for some reason no reconnect is needed, perhaps call connect() fresh
      // or do nothing if the UI triggers connect explicitly later.
    }
  }

  async attemptReconnect() {
    if (!this.state.canReconnect()) {
      console.log('Cannot reconnect, state is not reconnectable.');
      return;
    }

    // First, check max attempts to prevent infinite recursion
    if (this.state.currentState !== CONNECTION_STATES.RECONNECTING) {
      this.state.transition(CONNECTION_STATES.FAILED);
      throw new Error('Cannot reconnect from current state');
    }
    this.isReconnecting = true;

    // Reset media manager and transports
    this.mediaManager.reset();

    await this.pollServerReadiness();

    await this.resetTransports();

    try {
      console.log(
        `Attempt ${this.reconnectionAttempts + 1} of ${this.MAX_RECONNECTION_ATTEMPTS}`,
      );

      if (!this.uid || !this.meetingId) {
        throw new Error('Meeting ID and UID are required for reconnect');
      }

      const networkQuality = await this.runUploadTest();

      let isAudioOnly = false;

      if (networkQuality === 'unavailable') {
        console.warn('Server might be down; skipping normal connect flow.');
      } else if (networkQuality === 'poor') {
        isAudioOnly = true;
        this.onAudioOnly?.(true);
      }

      // Reconnect socket first
      const response = await this.signaling.emitWithTimeout('userRejoin', {
        uid: this.uid,
        meetingId: this.meetingId,
      });

      if (!response.success) {
        throw new Error(response.error || 'Reconnection failed');
      }

      // Add delay before transport setup
      await new Promise((resolve) => setTimeout(resolve, 1000));

      try {
        await this.setupTransports();
        this.isConsumerReady = true;
      } catch (transportError) {
        console.error('Transport setup failed:', transportError);
        throw new Error(
          `Failed to setup transports: ${transportError.message}`,
        );
      }

      await this.processPendingProducers();

      // Check if local media tracks are ended
      let localStream = this.mediaManager.localStream;
      if (
        !localStream ||
        localStream.getTracks().some((t) => t.readyState === 'ended')
      ) {
        console.log('Local media tracks are ended, re-acquiring media');
        const { stream, wasFallback } =
          await this.mediaManager.tryAcquireMedia(!isAudioOnly);
        if (wasFallback) {
          this.onAudioOnly?.(true);
        }
        localStream = stream;
      }

      // Restart streaming with the media stream
      await this.startStreaming(localStream);

      // Reset on success
      this.reconnectionAttempts = 0;
      this.isReconnecting = false;
      this.state.transition(CONNECTION_STATES.CONNECTED);

      return true;
    } catch (error) {
      // this.reconnectionAttempts++;

      console.error('Reconnection attempt failed:', error);
      this.state.transition(CONNECTION_STATES.FAILED);
      this.isReconnecting = false;
      throw error;

      // Add exponential backoff delay
      // const delay = Math.min(
      //   1000 * Math.pow(2, this.reconnectionAttempts),
      //   10000,
      // );
      // await new Promise((resolve) => setTimeout(resolve, delay));

      // Only retry if under max attempts
      // if (this.reconnectionAttempts < this.MAX_RECONNECTION_ATTEMPTS) {
      //   return this.attemptReconnect();
      // } else {
      //   this.state.transition(CONNECTION_STATES.FAILED);
      //   this.isReconnecting = false;
      //   throw new Error('Max reconnection attempts reached');
      // }
    }
  }

  /**
   * Setup media transports
   * @private
   */
  async setupTransports() {
    try {
      const isReconnecting =
        this.state.currentState === CONNECTION_STATES.RECONNECTING;
      console.log('Setting up transports, reconnecting:', isReconnecting);

      if (isReconnecting) {
        // Clear any existing transports first
        if (this.audioProducerTransportId) {
          this.connectionPool.removeProducerTransport(
            this.audioProducerTransportId,
          );
        }
        if (this.videoProducerTransportId) {
          this.connectionPool.removeProducerTransport(
            this.videoProducerTransportId,
          );
        }
        if (this.consumerTransportId) {
          this.connectionPool.removeConsumerTransport(this.consumerTransportId);
        }
      }

      // ----- CREATE AUDIO PRODUCER TRANSPORT -----
      const audioTransportOptions =
        await this.signaling.createProducerTransport('audio');
      this.audioProducerTransport = await this.createProducerTransport(
        audioTransportOptions,
        'audio',
      );

      this.audioProducerTransportId = this.audioProducerTransport.id;
      this.connectionPool.addProducerTransport(
        this.audioProducerTransportId,
        this.audioProducerTransport,
      );

      // ----- CREATE VIDEO PRODUCER TRANSPORT -----
      const videoTransportOptions =
        await this.signaling.createProducerTransport('video');
      this.videoProducerTransport = await this.createProducerTransport(
        videoTransportOptions,
        'video',
      );
      this.videoProducerTransportId = this.videoProducerTransport.id;
      this.connectionPool.addProducerTransport(
        this.videoProducerTransportId,
        this.videoProducerTransport,
      );

      // Setup consumer transport
      const consumerTransportOptions =
        await this.signaling.createConsumerTransport();
      const consumerTransport = await this.createConsumerTransport(
        consumerTransportOptions,
      );

      this.consumerTransportId = consumerTransport.id;
      this.connectionPool.addConsumerTransport(
        consumerTransport.id,
        consumerTransport,
      );

      if (isReconnecting) {
        console.log('Reconnection: Transports setup complete');
      }
    } catch (error) {
      throw new Error(`Failed to setup transports: ${error.message}`);
    }
  }

  /**
   * Create producer transport
   * @private
   * @param {Object} transportOptions - Transport options from server
   * @returns {Promise<Object>} Created transport
   */
  async createProducerTransport(transportOptions, kind) {
    const transport = this.device.createSendTransport(transportOptions);

    transport.on('connect', async ({ dtlsParameters }, callback, errback) => {
      try {
        await this.signaling.connectProducerTransport({
          dtlsParameters,
          transportId: transport.id,
          kind,
        });
        callback();
      } catch (error) {
        errback(error);
      }
    });

    transport.on(
      'produce',
      async ({ kind, rtpParameters }, callback, errback) => {
        try {
          const { producerId } = await this.signaling.produce({
            transportId: transport.id,
            kind,
            rtpParameters,
            userSpokenLanguage: this.userSpokenLanguage,
            meetingId: this.meetingId,
            priority: kind === 'video' ? 128 : 255,
          });
          callback({ id: producerId });
        } catch (error) {
          errback(error);
        }
      },
    );

    transport.on('connectionstatechange', (state) => {
      this.handleConnectionStateChange(transport, 'producer', state);
    });

    return transport;
  }

  /**
   * Create consumer transport
   * @private
   * @param {Object} transportOptions - Transport options from server
   * @returns {Promise<Object>} Created transport
   */
  async createConsumerTransport(transportOptions) {
    const transport = this.device.createRecvTransport(transportOptions);

    transport.on('connect', async ({ dtlsParameters }, callback, errback) => {
      try {
        await this.signaling.connectConsumerTransport({
          dtlsParameters,
          transportId: transport.id,
        });

        callback();
      } catch (error) {
        errback(error);
      }
    });

    transport.on('connectionstatechange', (state) => {
      this.handleConnectionStateChange(transport, 'consumer', state);
    });

    return transport;
  }

  /**
   * Create Consumer
   * @private
   * @param {object} data
   */

  async consumeProducer(data) {
    try {
      console.log('Consuming producer:', data);
      const consumerTransportId = this.consumerTransportId;
      const consumerTransport =
        this.connectionPool.getConsumerTransport(consumerTransportId);

      if (!consumerTransport) {
        throw new Error('No consumer transport available');
      }

      if (!this.device?.rtpCapabilities) {
        throw new Error('Device RTP capabilities not available');
      }

      const response = await this.signaling.consume({
        transportId: consumerTransportId,
        producerId: data.producerId,
        rtpCapabilities: this.device.rtpCapabilities,
        meetingId: this.meetingId,
        kind: data.kind,
      });

      if (!response.rtpParameters) {
        throw new Error('Server did not provide RTP parameters');
      }

      // Create consumer for this producer
      const consumer = await consumerTransport.consume({
        producerId: response.producerId,
        rtpParameters: response.rtpParameters,
        kind: response.kind,
        id: response.id,
      });

      // Add the consumer to media manager
      this.mediaManager.addConsumer(consumer);

      // Update streams to reflect new remote media
      this.updateStreams();

      console.log('Producer consumed successfully:', response.producerId);
    } catch (error) {
      console.error('Failed to consume producer:', error);
      throw error;
    }
  }

  async processPendingProducers() {
    console.log(`Processing ${this.pendingProducers.length} pending producers`);

    while (this.pendingProducers.length > 0) {
      const producerData = this.pendingProducers.shift();
      try {
        await this.consumeProducer(producerData);
      } catch (error) {
        console.error('Failed to process pending producer:', error);
        // Re-queue the producer if it's a temporary failure
        if (error.message !== 'No consumer transport available') {
          this.pendingProducers.unshift(producerData);
        }
      }
    }
  }

  /**
   * Start streaming media
   * @private
   * @param {MediaStream} stream - Local media stream
   */
  async startStreaming(stream) {
    try {
      console.log('Starting streaming with stream:', {
        hasStream: !!stream,
        tracks: stream
          ?.getTracks()
          .map((t) => ({ kind: t.kind, enabled: t.enabled })),
      });

      if (!this.audioProducerTransportId || !this.videoProducerTransportId) {
        throw new Error('Producer transport ID not found');
      }

      let tracks = stream.getTracks();
      const anyEnded = tracks.some((track) => track.readyState === 'ended');
      if (anyEnded) {
        console.log('Some tracks have ended, re-acquiring media');
        stream = await this.mediaManager.acquireMedia();
        tracks = stream.getTracks();
      }

      // Add delay to ensure consumer is ready
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Wait for consumers to be ready
      if (!this.isConsumerReady) {
        await new Promise((resolve) => {
          const checkReady = setInterval(() => {
            if (this.isConsumerReady) {
              clearInterval(checkReady);
              resolve();
            }
          }, 100);
        });
      }

      console.log(
        'Processing tracks:',
        tracks.map((t) => ({
          kind: t.kind,
          enabled: t.enabled,
          readyState: t.readyState,
        })),
      );

      for (const track of tracks) {
        console.log('Producing track:', {
          kind: track.kind,
          enabled: track.enabled,
          settings: track.getSettings(),
        });

        const existingProducer = this.mediaManager.getProducer(track.kind);
        if (existingProducer && !existingProducer.closed) {
          console.log(
            `Producer for ${track.kind} already exists, skipping produce`,
          );
          continue;
        }

        const priority = track.kind === 'video' ? 128 : 255;

        const producerTransport =
          track.kind === 'audio'
            ? this.connectionPool.getProducerTransport(
                this.audioProducerTransportId,
              )
            : this.connectionPool.getProducerTransport(
                this.videoProducerTransportId,
              );

        const producer = await producerTransport.produce({ track, priority });

        if (track.kind === 'video') {
          await producer.pause();
        }

        this.mediaManager.addProducer(producer);
        console.log('Producer added to media manager');
      }
      this.updateStreams();
      console.log('Started streaming all tracks');
    } catch (error) {
      throw new Error(`Failed to start streaming: ${error.message}`);
    }
  }

  removeParticipantMedia() {
    // If there are only two participants, and one leaves,
    // there should be no remote tracks remaining.
    // Simply remove all consumers and clear the remote MediaStream.

    for (const [
      producerId,
      consumer,
    ] of this.mediaManager.consumers.entries()) {
      consumer.close();
      console.log('All consumers removed for participant', producerId);
    }

    this.mediaManager.consumers.clear();

    // Update streams to reflect that no remote tracks remain
    this.updateStreams();
  }

  /**
   * Update media streams
   * @private
   */
  updateStreams() {
    this.onStreamsUpdate({
      local: this.mediaManager.localStream,
      remote: this.mediaManager.getRemoteStream(),
    });
  }

  /**
   * Handle connection state changes
   * @private
   * @param {Object} transport - Mediasoup transport
   * @param {string} type - Transport type
   * @param {string} state - New state
   */
  async handleConnectionStateChange(transport, type, state) {
    console.log(`${type} transport ${transport.id} state: ${state}`);

    switch (state) {
      case 'connected':
        if (this.isReconnecting) {
          this.state.transition(CONNECTION_STATES.CONNECTED);
          this.isReconnecting = false;
          this.reconnectionAttempts = 0;
        }
        break;

      case 'failed':
        this.handleConnectTransportFailure(transport);
        break;

      case 'disconnected':
        if (!this.isReconnecting && this.state.canReconnect()) {
          this.handleConnectTransportFailure(transport);
        }
        break;
    }
  }

  handleConnectTransportFailure(transport) {
    console.log('Transport failure:', transport);
    if (this.state.canReconnect() && !this.isReconnecting) {
      if (this.state.currentState !== CONNECTION_STATES.RECONNECTING) {
        this.state.transition(CONNECTION_STATES.RECONNECTING);
      }
      this.attemptReconnect();
    } else if (!this.state.canReconnect()) {
      this.handleError('Transport failure', new Error('Transport failed'));
    }
  }

  /**
   * Update connection state
   * @private
   * @param {string} state - New state
   */
  updateState(state) {
    this.state.transition(state);
  }

  /**
   * Handle errors
   * @private
   * @param {string} context - Error context
   * @param {Error} error - Error object
   */
  handleError(context, error) {
    console.error(`${context}:`, error);
    this.onError?.({ context, error: error?.message });
    this.updateState('failed');
  }

  /**
   * Clean up all resources
   */
  async cleanup() {
    // Prevent cleanup if already in closing or closed state
    if (
      this.state.currentState === CONNECTION_STATES.CLOSING ||
      this.state.currentState === CONNECTION_STATES.CLOSED
    ) {
      try {
        // Set to closing state
        this.state.transition(CONNECTION_STATES.CLOSING);

        // Stop quality monitoring if running
        if (this.statsInterval) {
          clearInterval(this.statsInterval);
          this.statsInterval = null;
        }

        // Cleanup managers
        const cleanupPromises = [
          this.mediaManager.cleanup({ force: true }),
          this.connectionPool.cleanup(),
          this.signaling.cleanup(),
        ];

        await Promise.all(cleanupPromises);

        this.isConsumerReady = false;
        this.producerTransportId = null;
        this.consumerTransportId = null;
        this.isReconnecting = false;
        this.reconnectionAttempts = 0;

        // Only transition to closed if we're still in closing state
        if (this.state.currentState === CONNECTION_STATES.CLOSING) {
          this.state.transition(CONNECTION_STATES.CLOSED);
        }
      } catch (error) {
        console.error('Error during cleanup:', error);
        // Ensure we reach closed state even if there's an error
        if (this.state.currentState !== CONNECTION_STATES.CLOSED) {
          this.state.transition(CONNECTION_STATES.CLOSED);
        }
      }
    }
  }

  async handleCallDisonnect() {
    if (
      this.state.currentState !== CONNECTION_STATES.CLOSING &&
      this.state.currentState !== CONNECTION_STATES.CLOSED &&
      this.state.currentState !== CONNECTION_STATES.FAILED
    ) {
      this.state.transition(CONNECTION_STATES.CLOSING);
    }

    try {
      await this.cleanup();
    } catch (error) {
      console.error('Error during call disconnect:', error);
    }

    // Cleanup intervals
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
      this.statsInterval = null;
    }

    // Stop media flow checks
    if (this.mediaCheckInterval) {
      clearInterval(this.mediaCheckInterval);
      this.mediaCheckInterval = null;
    }

    this.mediaChecksStarted = false;
  }

  async resetTransports() {
    console.log(
      'Resetting transports and media state for a fresh reconnection attempt',
    );

    // Stop quality monitoring if running
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
      this.statsInterval = null;
    }

    // Cleanup ConnectionPool to remove all transports
    this.connectionPool.cleanup();

    // Reset transport IDs
    this.producerTransportId = null;
    this.consumerTransportId = null;

    // Cleanup MediaManager: remove all producers/consumers, etc.
    // Assuming mediaManager has a method reset or add it:
    this.mediaManager.reset();

    // Clear pending producers array
    this.pendingProducers = [];

    // Reset any consumer readiness flags
    this.isConsumerReady = false;
  }

  // Public methods for external control

  /**
   * Set video enabled state
   * @param {boolean} enabled - Enable/disable video
   */
  async setVideoEnabled(enabled) {
    // 1) Retrieve "video" producer
    const videoProducer = this.mediaManager.getProducer('video');

    if (!videoProducer) {
      console.warn('No video producer found; cannot toggle video');
      return;
    }

    // 2) Pause or resume
    try {
      if (enabled) {
        await videoProducer.resume();
        console.log('Video producer resumed');
      } else {
        await videoProducer.pause();
        console.log('Video producer paused');
      }
    } catch (err) {
      console.error('Failed to toggle video producer state:', err);
    }

    // 3) Reflect in local MediaStream track
    if (this.mediaManager.localStream) {
      const videoTrack = this.mediaManager.localStream
        .getVideoTracks()
        .find((t) => t.kind === 'video');

      if (videoTrack) {
        videoTrack.enabled = enabled;
        console.log(
          `Local video track has been ${enabled ? 'enabled' : 'disabled'}`,
        );
      }
    }

    // This triggers your UI or local state to reflect audio-only vs. not
    this.onAudioOnly?.(!enabled);
  }

  /**
   * Set audio enabled state
   * @param {boolean} enabled - Enable/disable audio
   */
  async setAudioEnabled(enabled) {
    await this.mediaManager.setTrackEnabled('audio', enabled);
  }

  startQualityMonitoring() {
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
    }

    this.statsInterval = setInterval(async () => {
      try {
        // Get stats from all active producers and consumers
        const producerStats = await this.getProducerStats();
        const consumerStats = await this.getConsumerStats();

        // Aggregate stats
        const aggregatedStats = this.aggregateStats(
          producerStats,
          consumerStats,
        );

        // Update quality monitor
        const qualityReport = this.qualityMonitor.update(aggregatedStats);

        // Log quality metrics if significant time has passed
        const now = Date.now();
        if (now - this.lastQualityCheck > 10000) {
          // Log every 10 seconds
          console.log('Connection quality report:', qualityReport);
          this.lastQualityCheck = now;
        }
      } catch (error) {
        console.error('Error monitoring connection quality:', error);
      }
    }, this.QUALITY_CHECK_INTERVAL);
  }

  async getProducerStats() {
    const stats = {
      rtt: [],
      packetLoss: [],
      bitrate: [],
    };

    for (const producer of this.mediaManager.producers.values()) {
      try {
        const producerStats = await producer.getStats();
        for (const stat of producerStats) {
          if (stat.type === 'outbound-rtp') {
            if (stat.roundTripTime) stats.rtt.push(stat.roundTripTime * 1000);
            if (stat.packetsLost && stat.packetsSent) {
              stats.packetLoss.push(stat.packetsLost / stat.packetsSent);
            }
            if (stat.bytesSent && stat.timestamp) {
              stats.bitrate.push(
                (stat.bytesSent * 8) / (stat.timestamp / 1000),
              );
            }
          }
        }
      } catch (error) {
        console.error('Error getting producer stats:', error);
      }
    }

    return stats;
  }

  async getConsumerStats() {
    const stats = {
      rtt: [],
      packetLoss: [],
      bitrate: [],
    };

    for (const consumer of this.mediaManager.consumers.values()) {
      try {
        const consumerStats = await consumer.getStats();
        for (const stat of consumerStats) {
          if (stat.type === 'inbound-rtp') {
            if (stat.roundTripTime) stats.rtt.push(stat.roundTripTime * 1000);
            if (stat.packetsLost && stat.packetsReceived) {
              stats.packetLoss.push(
                stat.packetsLost / (stat.packetsLost + stat.packetsReceived),
              );
            }
            if (stat.bytesReceived && stat.timestamp) {
              stats.bitrate.push(
                (stat.bytesReceived * 8) / (stat.timestamp / 1000),
              );
            }
          }
        }
      } catch (error) {
        console.error('Error getting consumer stats:', error);
      }
    }

    return stats;
  }

  aggregateStats(producerStats, consumerStats) {
    const aggregate = {
      rtt: 0,
      packetLoss: 0,
      bitrate: 0,
    };

    // Combine all RTT measurements
    const allRtt = [...producerStats.rtt, ...consumerStats.rtt];
    aggregate.rtt =
      allRtt.length > 0 ? allRtt.reduce((a, b) => a + b, 0) / allRtt.length : 0;

    // Combine all packet loss measurements
    const allPacketLoss = [
      ...producerStats.packetLoss,
      ...consumerStats.packetLoss,
    ];
    aggregate.packetLoss =
      allPacketLoss.length > 0
        ? allPacketLoss.reduce((a, b) => a + b, 0) / allPacketLoss.length
        : 0;

    // Sum all bitrates
    aggregate.bitrate = [
      ...producerStats.bitrate,
      ...consumerStats.bitrate,
    ].reduce((a, b) => a + b, 0);

    return aggregate;
  }

  adjustVideoBitrate(newBitrate) {
    // Suppose we have a reference to our "video" Producer
    const videoProducer = this.mediaManager.getProducer('video');

    if (!videoProducer) {
      console.warn('No video producer found to adjust bitrate');
      return;
    }

    try {
      videoProducer.setParameters({
        encodings: [
          {
            maxBitrate: newBitrate, // in bps
          },
        ],
      });
      console.log(`Video bitrate set to ${newBitrate} bps`);
    } catch (err) {
      console.error('Error adjusting video bitrate:', err);
    }
  }

  async handleNetworkQuality(result) {
    console.log('Handling network quality:', result);

    let measuredKbps;
    switch (result) {
      case 'poor':
      case 'unavailable':
        // let's assume ~ 500 kbps total
        measuredKbps = 500;
        break;
      case 'fair':
        // let's assume ~ 800 kbps total
        measuredKbps = 800;
        break;
      case 'good':
        // let's assume ~ 1500 kbps total
        measuredKbps = 1500;
        break;
      default:
        measuredKbps = 800;
        break;
    }

    const baseAudioTextKbps = 500;
    const leftover = measuredKbps - baseAudioTextKbps;

    if (leftover <= 0) {
      console.warn('No leftover for video -> disable video');
      await this.setVideoEnabled(false);
      return;
    }

    // We do have leftover for video, let's enable video
    await this.setVideoEnabled(true);

    const leftoverBps = leftover * 1000;
    let targetBitrateBps = Math.min(leftoverBps, 1_500_000);

    if (leftover < 200) {
      console.warn('Very little leftover for video, forcibly low');
      targetBitrateBps = 200_000;
    }

    console.log(
      `Leftover for video is ${leftover} kbps, setting bitrate to`,
      targetBitrateBps,
    );

    this.adjustVideoBitrate(targetBitrateBps);

    if (leftover < 300) {
      console.info('Leftover < 300, forcing low constraints in MediaManager');
      await this.mediaManager.adjustQualityForPoorConnection();
    } else if (leftover < 800) {
      console.info('Moderate leftover, choose medium?');
      await this.mediaManager.changeQuality('medium');
    } else {
      console.info('Plenty leftover -> high constraints');
      await this.mediaManager.optimizeQualityForGoodConnection();
    }
  }

  handleQualityChange(newLevel, oldLevel) {
    console.log(`Connection quality changed: ${oldLevel} -> ${newLevel}`);

    this.handleNetworkQuality(newLevel);
  }

  async runUploadTest() {
    const size = 200_000; // ~0.2 MB
    const data = new Uint8Array(size);
    const start = Date.now();
    const apiURL = process.env.REACT_APP_API_URL;
    const TIMEOUT_MS = 5000; // 5 seconds

    const controller = new AbortController();
    const signal = controller.signal;

    // Timer to abort the request after TIMEOUT_MS
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, TIMEOUT_MS);

    try {
      await fetch(`${apiURL}/api/uploadTest`, {
        method: 'POST',
        body: data,
        signal,
      });
    } catch (error) {
      clearTimeout(timeoutId);
      console.warn('Upload test timed out or failed, returning "poor".', error);
      return 'poor'; // or "unavailable", up to your preference
    }

    clearTimeout(timeoutId);

    const end = Date.now();
    const durationSec = (end - start) / 1000;
    const bandwidthMbps = (size * 8) / (durationSec * 1_000_000);

    console.log(`Upload bandwidth: ${bandwidthMbps.toFixed(2)} Mbps`);

    if (bandwidthMbps < 0.75) {
      return 'poor';
    } else if (bandwidthMbps < 1.25) {
      return 'fair';
    } else {
      return 'good';
    }
  }
}

export default ConnectionManager;
