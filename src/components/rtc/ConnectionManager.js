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

class ConnectionState {
  static States = {
    NEW: 'new',
    CONNECTING: 'connecting',
    CONNECTED: 'connected',
    RECONNECTING: 'reconnecting',
    FAILED: 'failed',
    CLOSED: 'closed',
  };

  constructor(onStateChange) {
    this.currentState = ConnectionState.States.NEW;
    this.onStateChange = onStateChange;
    this.stateHistory = [];
    this.lastStateChange = Date.now();
  }

  transition(newState) {
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
    return this.currentState === ConnectionState.States.CONNECTED;
  }

  canReconnect() {
    return ![
      ConnectionState.States.CLOSED,
      ConnectionState.States.FAILED,
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
    this.connectionState = 'new';

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
        this.updateState('connected');
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
  async connect(meetingId) {
    console.log('Consumer ready Connect start:', {
      isConsumerReady: this.isConsumerReady,
      isHost: this.isHost,
    });
    try {
      console.log('Starting connection with meetingId:', meetingId);
      this.updateState('connecting');
      this.meetingId = meetingId;
      this.signaling.setMeetingId(meetingId);

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

      // Step 7: Get and start streaming media
      const stream = await this.mediaManager.acquireMedia();
      await this.startStreaming(stream);

      this.updateState('connected');
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
      case ConnectionState.States.RECONNECTING:
        if (!this.isReconnecting) {
          this.attemptReconnect();
        }
        break;

      case ConnectionState.States.CONNECTED:
        this.reconnectAttempts = 0;
        this.startQualityMonitoring();
        break;

      case ConnectionState.States.FAILED:
        this.cleanup();
        break;
    }
  }

  /**
   * Setup media transports
   * @private
   */
  async setupTransports() {
    try {
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

      const producerTransport = this.connectionPool.getProducerTransport(
        this.producerTransportId,
      );

      if (!producerTransport) {
        throw new Error('Producer transport not found');
      }

      const tracks = stream.getTracks();

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
  handleConnectionStateChange(transport, type, state) {
    console.log(`${type} transport ${transport.id} state: ${state}`);

    switch (state) {
      case 'connected':
        if (this.isReconnecting) {
          this.handleReconnectionSuccess();
        }
        break;

      case 'failed':
        this.handleTransportFailure(transport);
        break;

      case 'disconnected':
        if (!this.isReconnecting) {
          this.attemptReconnect();
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
    this.connectionState = state;
    this.onStateChange?.(state);
  }

  /**
   * Handle errors
   * @private
   * @param {string} context - Error context
   * @param {Error} error - Error object
   */
  handleError(context, error) {
    console.error(`${context}:`, error);
    this.onError?.({ context, error: error.message });
    this.updateState('failed');
  }

  /**
   * Clean up all resources
   */
  async cleanup() {
    this.updateState('closing');

    // Stop quality monitoring
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
      this.statsInterval = null;
    }

    // Clean up managers
    this.mediaManager.cleanup();
    this.connectionPool.cleanup();
    this.signaling.cleanup();

    this.updateState('closed');
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
