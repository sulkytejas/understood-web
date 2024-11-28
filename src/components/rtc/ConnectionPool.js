/**
 * ConnectionPool.js
 * Manages WebRTC transport instances and their lifecycle.
 * Provides efficient transport reuse and cleanup mechanisms.
 */

import EventEmitter from './EventEmitter';

class ConnectionPool extends EventEmitter {
  constructor() {
    super();
    this.producerTransports = new Map();
    this.consumerTransports = new Map();
    this.transportStats = new Map();
    this.lastCleanup = Date.now();
    this.CLEANUP_INTERVAL = 300000; // 5 minutes
    this.TRANSPORT_TIMEOUT = 30000; // 30 seconds
    this.MAX_RETRIES = 3;

    this.TRANSPORT_IDLE_TIMEOUT = 60000; // 1 minute
    this.TRANSPORT_WARNING_TIME = 45000; // 45 seconds
    this.transportWarnings = new Map();
  }

  /**
   * Add a producer transport to the pool
   * @param {string} transportId - Transport identifier
   * @param {Object} transport - Mediasoup transport instance
   */
  addProducerTransport(transportId, transport) {
    if (this.producerTransports.has(transportId)) {
      this.removeProducerTransport(transportId);
    }

    this.producerTransports.set(transportId, {
      transport,
      createdAt: Date.now(),
      lastUsed: Date.now(),
      stats: {
        reconnectCount: 0,
        lastReconnect: null,
        failures: 0,
      },
    });

    // Setup transport event listeners
    this.setupTransportListeners(transport, 'producer', transportId);
  }

  /**
   * Add a consumer transport to the pool
   * @param {string} transportId - Transport identifier
   * @param {Object} transport - Mediasoup transport instance
   */
  addConsumerTransport(transportId, transport) {
    if (this.consumerTransports.has(transportId)) {
      this.removeConsumerTransport(transportId);
    }

    this.consumerTransports.set(transportId, {
      transport,
      createdAt: Date.now(),
      lastUsed: Date.now(),
      stats: {
        reconnectCount: 0,
        lastReconnect: null,
        failures: 0,
      },
    });

    // Setup transport event listeners
    this.setupTransportListeners(transport, 'consumer', transportId);
  }

  /**
   * Setup transport event listeners
   * @private
   * @param {Object} transport - Mediasoup transport
   * @param {string} type - Transport type (producer/consumer)
   * @param {string} transportId - Transport identifier
   */
  setupTransportListeners(transport, type, transportId) {
    transport.on('connectionstatechange', (state) => {
      this.handleConnectionStateChange(type, transportId, state);
    });

    transport.on('icestatechange', (state) => {
      this.handleIceStateChange(type, transportId, state);
    });

    // Monitor stats periodically
    this.startStatsMonitoring(transport, type, transportId);
  }

  /**
   * Handle transport connection state changes
   * @private
   * @param {string} type - Transport type
   * @param {string} transportId - Transport identifier
   * @param {string} state - New connection state
   */
  handleConnectionStateChange(type, transportId, state) {
    const transportData = this.getTransportData(type, transportId);
    if (!transportData) return;

    const now = Date.now();
    transportData.lastStateChange = now;

    switch (state) {
      case 'connected':
        this.clearTransportWarning(transportId);
        break;

      case 'disconnected':
        // Don't immediately fail - set up warning timer
        if (!this.transportWarnings.has(transportId)) {
          const warningTimer = setTimeout(() => {
            this.emit('transportWarning', {
              type,
              transportId,
              message: 'Transport may be stale',
            });
          }, this.TRANSPORT_WARNING_TIME);

          this.transportWarnings.set(transportId, warningTimer);
        }
        break;

      case 'failed':
        if (transportData.stats.failures >= this.MAX_RETRIES) {
          this.handleTransportFailure(type, transportId);
        } else {
          this.attemptTransportRecovery(type, transportId);
        }
        break;
    }

    // Update transport stats
    this.updateTransportStats(type, transportId, state);
  }

  attemptTransportRecovery(type, transportId) {
    const transportData = this.getTransportData(type, transportId);
    if (!transportData) return;

    transportData.stats.failures++;
    transportData.stats.lastRecoveryAttempt = Date.now();

    // Emit recovery attempt event
    this.emit('transportRecoveryAttempt', {
      type,
      transportId,
      attemptCount: transportData.stats.failures,
    });

    // Attempt ICE restart or other recovery mechanisms
    if (transportData.transport.restartIce) {
      transportData.transport.restartIce().catch((error) => {
        console.error('ICE restart failed:', error);
        this.handleTransportFailure(type, transportId);
      });
    }
  }

  clearTransportWarning(transportId) {
    const warningTimer = this.transportWarnings.get(transportId);
    if (warningTimer) {
      clearTimeout(warningTimer);
      this.transportWarnings.delete(transportId);
    }
  }

  /**
   * Handle ICE connection state changes
   * @private
   * @param {string} type - Transport type
   * @param {string} transportId - Transport identifier
   * @param {string} state - New ICE state
   */
  handleIceStateChange(type, transportId, state) {
    const transportMap =
      type === 'producer' ? this.producerTransports : this.consumerTransports;
    const transportData = transportMap.get(transportId);

    if (!transportData) return;

    if (state === 'disconnected') {
      setTimeout(() => {
        const currentData = transportMap.get(transportId);
        if (
          currentData &&
          currentData.transport._handler._pc.iceConnectionState ===
            'disconnected'
        ) {
          this.handleTransportFailure(type, transportId);
        }
      }, 3000); // Wait 3 seconds before handling disconnection
    }
  }

  /**
   * Start monitoring transport stats
   * @private
   * @param {Object} transport - Mediasoup transport
   * @param {string} type - Transport type
   * @param {string} transportId - Transport identifier
   */
  startStatsMonitoring(transport, type, transportId) {
    const statsInterval = setInterval(async () => {
      if (!this.isTransportValid(type, transportId)) {
        clearInterval(statsInterval);
        return;
      }

      try {
        const stats = await transport._handler._pc.getStats();
        this.updateTransportStats(type, transportId, stats);
      } catch (error) {
        console.warn(
          `Failed to get stats for ${type} transport ${transportId}:`,
          error,
        );
      }
    }, 2000); // Every 2 seconds

    // Store interval reference for cleanup
    this.transportStats.set(transportId, statsInterval);
  }

  /**
   * Update transport statistics
   * @private
   * @param {string} type - Transport type
   * @param {string} transportId - Transport identifier
   * @param {RTCStatsReport} stats - WebRTC stats
   */
  updateTransportStats(type, transportId, stats) {
    const transportMap =
      type === 'producer' ? this.producerTransports : this.consumerTransports;
    const transportData = transportMap.get(transportId);

    if (!transportData) return;

    let bytesReceived = 0;
    let bytesSent = 0;
    let packetsLost = 0;
    let rtt = 0;

    stats.forEach((stat) => {
      if (stat.type === 'inbound-rtp') {
        bytesReceived += stat.bytesReceived || 0;
        packetsLost += stat.packetsLost || 0;
      } else if (stat.type === 'outbound-rtp') {
        bytesSent += stat.bytesSent || 0;
      } else if (stat.type === 'candidate-pair' && stat.state === 'succeeded') {
        rtt = stat.currentRoundTripTime * 1000; // Convert to ms
      }
    });

    transportData.stats = {
      ...transportData.stats,
      bytesReceived,
      bytesSent,
      packetsLost,
      rtt,
      timestamp: Date.now(),
    };

    transportMap.set(transportId, transportData);
  }

  /**
   * Handle transport failure
   * @private
   * @param {string} type - Transport type
   * @param {string} transportId - Transport identifier
   */
  async handleTransportFailure(type, transportId) {
    const transportMap =
      type === 'producer' ? this.producerTransports : this.consumerTransports;
    const transportData = transportMap.get(transportId);

    if (!transportData) return;

    try {
      // Clean up the failed transport
      transportData.transport.close();
      this.removeTransportStats(transportId);
      transportMap.delete(transportId);

      // Emit failure event for handling by ConnectionManager
      this.emit('transportFailed', {
        type,
        transportId,
        stats: transportData.stats,
      });
    } catch (error) {
      console.error(`Failed to handle ${type} transport failure:`, error);
    }
  }

  /**
   * Check if a transport is still valid
   * @private
   * @param {string} type - Transport type
   * @param {string} transportId - Transport identifier
   * @returns {boolean} Transport validity
   */
  isTransportValid(type, transportId) {
    const transportMap =
      type === 'producer' ? this.producerTransports : this.consumerTransports;
    const transportData = transportMap.get(transportId);

    return (
      transportData &&
      transportData.transport &&
      !transportData.transport.closed
    );
  }

  /**
   * Get a producer transport
   * @param {string} transportId - Transport identifier
   * @returns {Object} Producer transport
   */
  getProducerTransport(transportId) {
    const transportData = this.producerTransports.get(transportId);
    if (transportData) {
      transportData.lastUsed = Date.now();
      return transportData.transport;
    }
    return null;
  }

  /**
   * Get a consumer transport
   * @param {string} transportId - Transport identifier
   * @returns {Object} Consumer transport
   */
  getConsumerTransport(transportId) {
    const transportData = this.consumerTransports.get(transportId);
    if (transportData) {
      transportData.lastUsed = Date.now();
      return transportData.transport;
    }
    return null;
  }

  /**
   * Remove producer transport
   * @param {string} transportId - Transport identifier
   */
  removeProducerTransport(transportId) {
    const transportData = this.producerTransports.get(transportId);
    if (transportData) {
      transportData.transport.close();
      this.removeTransportStats(transportId);
      this.producerTransports.delete(transportId);
    }
  }

  /**
   * Remove consumer transport
   * @param {string} transportId - Transport identifier
   */
  removeConsumerTransport(transportId) {
    const transportData = this.consumerTransports.get(transportId);
    if (transportData) {
      transportData.transport.close();
      this.removeTransportStats(transportId);
      this.consumerTransports.delete(transportId);
    }
  }

  /**
   * Remove transport stats monitoring
   * @private
   * @param {string} transportId - Transport identifier
   */
  removeTransportStats(transportId) {
    const interval = this.transportStats.get(transportId);
    if (interval) {
      clearInterval(interval);
      this.transportStats.delete(transportId);
    }
  }

  /**
   * Perform periodic cleanup of unused transports
   * @private
   */
  performCleanup() {
    const now = Date.now();
    if (now - this.lastCleanup < this.CLEANUP_INTERVAL) return;

    [...this.producerTransports.entries()].forEach(([id, data]) => {
      if (now - data.lastUsed > this.TRANSPORT_TIMEOUT) {
        this.removeProducerTransport(id);
      }
    });

    [...this.consumerTransports.entries()].forEach(([id, data]) => {
      if (now - data.lastUsed > this.TRANSPORT_TIMEOUT) {
        this.removeConsumerTransport(id);
      }
    });

    this.lastCleanup = now;
  }

  /**
   * Clean up all resources
   */
  cleanup() {
    // Clean up producer transports
    this.producerTransports.forEach((data, id) => {
      this.removeProducerTransport(id);
    });

    // Clean up consumer transports
    this.consumerTransports.forEach((data, id) => {
      this.removeConsumerTransport(id);
    });

    // Clear all stats intervals
    this.transportStats.forEach((interval) => {
      clearInterval(interval);
    });
    this.transportStats.clear();
  }
}

export default ConnectionPool;
