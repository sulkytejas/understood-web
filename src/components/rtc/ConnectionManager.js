/**
 * ConnectionManager.js
 * Core WebRTC connection management for professional video conferencing.
 * Handles connection lifecycle, media management, and transport coordination.
 */

import { Device } from 'mediasoup-client';
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

    // Callback handlers
    this.onStateChange = onStateChange;
    this.onStreamsUpdate = onStreamsUpdate;
    this.onError = onError;

    // Initialize managers
    this.signaling = new SignalingLayer(socket);
    this.mediaManager = new MediaManager();
    this.connectionPool = new ConnectionPool();

    // Connection state
    this.isReconnecting = false;
    this.reconnectAttempts = 0;
    this.MAX_RECONNECT_ATTEMPTS = 5;
    this.isHost = false;
    this.hostSocketId = null;
    this.isConsumerReady = false;

    // Quality monitoring
    this.statsInterval = null;
    this.lastQualityCheck = Date.now();
    this.QUALITY_CHECK_INTERVAL = 2000;

    // Bind methods

    // this.handleTransportFailure = this.handleTransportFailure.bind(this);
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

    // this.qualityMonitor = new QualityMonitor({
    //   onQualityChange: this.handleQualityChange.bind(this),
    // });

    this.onQualityChange = onQualityChange;

    this.qualityMonitor = new QualityMonitor({
      onQualityChange: (newLevel, oldLevel) => {
        console.log(`Connection quality changed: ${oldLevel} -> ${newLevel}`);
        this.onQualityChange?.(newLevel); // Call the callback

        if (newLevel === QualityMonitor.Levels.POOR) {
          this.mediaManager.adjustQualityForPoorConnection();
        } else if (newLevel === QualityMonitor.Levels.EXCELLENT) {
          this.mediaManager.optimizeQualityForGoodConnection();
        }
      },
    });

    this.pendingProducers = [];
  }

  /**
   * Initialize all event listeners
   * @private
   */

  initializeEventListeners() {
    // Use arrow function to preserve 'this' context
    this.connectionPool.on('transportFailed', (data) => {
      this.handleTransportFailure(data);
    });

    this.signaling.socket.on('reconnect', () => {
      console.log('Socket reconnected');
      if (this.state.currentState === CONNECTION_STATES.RECONNECTING) {
        this.attemptReconnect();
      }
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
        if (participantId === this.hostSocketId) {
          this.cleanup();
        }
      },
      onMeetingEnded: () => {
        this.cleanup();
      },
      onConnectionError: (error) => {
        this.handleError('Connection error', error);
      },
      onReconnected: () => {
        if (
          this.state.currentState === CONNECTION_STATES.FAILED ||
          this.state.currentState === CONNECTION_STATES.RECONNECTING
        ) {
          if (this.state.currentState !== CONNECTION_STATES.RECONNECTING) {
            this.state.transition(CONNECTION_STATES.RECONNECTING);
          }
          this.attemptReconnect();
        } else {
          this.updateState('connected');
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

      // Step 1: Join the room and get capabilities
      const joinResponse = await this.signaling.joinRoom();

      console.log('Join response:', joinResponse);

      if (!joinResponse.success) {
        throw new Error('Failed to join meeting');
      }

      // Step 2: Store role information
      this.isHost = joinResponse.ishost;
      this.hostSocketId = joinResponse.hostSocketId;

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
      const stream = await this.mediaManager.acquireMedia();
      await this.startStreaming(stream);

      this.state.transition(CONNECTION_STATES.CONNECTED);
      console.log(`Connection established - isHost: ${this.isHost}`);

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
        if (!this.isReconnecting) {
          this.attemptReconnect();
        }
        break;

      case CONNECTION_STATES.CONNECTED:
        this.reconnectAttempts = 0;
        // this.startQualityMonitoring();
        break;

      case CONNECTION_STATES.CLOSED:
        // case CONNECTION_STATES.FAILED:
        this.cleanup();
        break;
    }
  }

  async attemptReconnect() {
    // First, check max attempts to prevent infinite recursion
    if (this.reconnectionAttempts >= this.MAX_RECONNECTION_ATTEMPTS) {
      this.state.transition(CONNECTION_STATES.FAILED);
      throw new Error('Max reconnection attempts reached');
    }

    try {
      console.log(
        `Attempt ${this.reconnectionAttempts + 1} of ${this.MAX_RECONNECTION_ATTEMPTS}`,
      );

      // Reconnect socket first
      const response = await this.signaling.emitWithTimeout('reconnect', {
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
      } catch (transportError) {
        console.error('Transport setup failed:', transportError);
        throw new Error(
          `Failed to setup transports: ${transportError.message}`,
        );
      }

      // Check if local media tracks are ended
      const localStream = this.mediaManager.localStream;
      if (localStream) {
        const tracks = localStream.getTracks();
        const anyEnded = tracks.some((track) => track.readyState === 'ended');
        if (anyEnded) {
          console.log(
            'Re-acquiring media tracks because existing tracks have ended',
          );
          // Re-acquire media
          await this.mediaManager.acquireMedia();
        }
      } else {
        // If no local stream exists, acquire media
        await this.mediaManager.acquireMedia();
      }

      // Restart streaming with the media stream
      await this.startStreaming(this.mediaManager.localStream);

      // Reset on success
      this.reconnectionAttempts = 0;
      this.state.transition(CONNECTION_STATES.CONNECTED);
      this.isReconnecting = false;

      return true;
    } catch (error) {
      console.error('Reconnection attempt failed:', error);
      this.reconnectionAttempts++;

      // Add exponential backoff delay
      const delay = Math.min(
        1000 * Math.pow(2, this.reconnectionAttempts),
        10000,
      );
      await new Promise((resolve) => setTimeout(resolve, delay));

      // Only retry if under max attempts
      if (this.reconnectionAttempts < this.MAX_RECONNECTION_ATTEMPTS) {
        return this.attemptReconnect();
      } else {
        this.state.transition(CONNECTION_STATES.FAILED);
        throw new Error('Max reconnection attempts reached');
      }
    }
  }

  async waitForServerReady() {
    const response = await this.signaling.emitWithTimeout(
      'checkServerStatus',
      {},
    );

    if (response.isReady) {
      return true;
    } else {
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          this.signaling.off('server-ready');
          reject(new Error('Server ready timeout'));
        }, 10000); // 10 second timeout

        this.signaling.once('server-ready', () => {
          clearTimeout(timeout);
          resolve(true);
        });
      });
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
        if (this.producerTransportId) {
          this.connectionPool.removeProducerTransport(this.producerTransportId);
        }
        if (this.consumerTransportId) {
          this.connectionPool.removeConsumerTransport(this.consumerTransportId);
        }
      }

      // Setup producer transport
      const producerTransportOptions =
        await this.signaling.createProducerTransport();
      const producerTransport = await this.createProducerTransport(
        producerTransportOptions,
      );

      this.producerTransportId = producerTransport.id;

      this.connectionPool.addProducerTransport(
        producerTransport.id,
        producerTransport,
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
  async createProducerTransport(transportOptions) {
    const transport = this.device.createSendTransport(transportOptions);

    transport.on('connect', async ({ dtlsParameters }, callback, errback) => {
      try {
        await this.signaling.connectProducerTransport({
          dtlsParameters,
          transportId: transport.id,
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

      if (!this.producerTransportId) {
        throw new Error('Producer transport ID not found');
      }

      let tracks = stream.getTracks();
      const anyEnded = tracks.some((track) => track.readyState === 'ended');
      if (anyEnded) {
        console.log('Some tracks have ended, re-acquiring media');
        stream = await this.mediaManager.acquireMedia();
        tracks = stream.getTracks();
      }

      const producerTransport = this.connectionPool.getProducerTransport(
        this.producerTransportId,
      );

      if (!producerTransport) {
        throw new Error('Producer transport not found');
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
        const producer = await producerTransport.produce({ track });

        this.mediaManager.addProducer(producer);
        console.log('Producer added to media manager');
      }
      this.updateStreams();
      console.log('Started streaming all tracks');
    } catch (error) {
      throw new Error(`Failed to start streaming: ${error.message}`);
    }
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
        }
        break;

      case 'failed':
        this.handleTransportFailure(transport);
        break;

      case 'disconnected':
        try {
          const currentParams = await transport.getIceParameters();
          console.log('Current ICE params before restart:', currentParams);

          await transport.restartIce();
          console.log('ICE restart completed');
          // Give it some time to reconnect
          await new Promise((resolve) => setTimeout(resolve, 3000));
        } catch (error) {
          console.warn('ICE restart failed:', error);
        }

        if (!this.isReconnecting && this.state.canReconnect()) {
          this.isReconnecting = true;
          this.state.transition(CONNECTION_STATES.RECONNECTING);
          await this.waitForServerReady(); // Wait for socket reconnection
          await this.attemptReconnect();
        }
        break;
    }
  }

  handleTransportFailure(transport) {
    console.log('Transport failure:', transport);
    if (this.state.canReconnect()) {
      this.attemptReconnect();
    } else {
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

        // Cleanup intervals
        if (this.statsInterval) {
          clearInterval(this.statsInterval);
          this.statsInterval = null;
        }

        // Cleanup managers
        const cleanupPromises = [
          this.mediaManager.cleanup(),
          this.connectionPool.cleanup(),
          this.signaling.cleanup(),
        ];

        await Promise.all(cleanupPromises);

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

  // Public methods for external control

  /**
   * Set video enabled state
   * @param {boolean} enabled - Enable/disable video
   */
  async setVideoEnabled(enabled) {
    await this.mediaManager.setTrackEnabled('video', enabled);
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

  handleQualityChange(newLevel, oldLevel) {
    console.log(`Connection quality changed: ${oldLevel} -> ${newLevel}`);

    if (newLevel === QualityMonitor.Levels.POOR) {
      this.mediaManager.adjustQualityForPoorConnection();
    } else if (newLevel === QualityMonitor.Levels.EXCELLENT) {
      this.mediaManager.optimizeQualityForGoodConnection();
    }
  }
}

export default ConnectionManager;
