/**
 * SignalingLayer.js
 * Handles all WebRTC signaling communication with the server.
 * Responsible for managing socket events and providing a clean interface for signaling.
 */

class SignalingLayer {
  constructor(socket) {
    if (!socket) throw new Error('Socket instance is required');

    this.socket = socket;
    this.meetingId = null;
    this.uid = null;
    this.isAudioOnly = false;
    this.eventHandlers = new Map();
    this.pendingRequests = new Map();
    this.timeouts = {
      joinRoom: 15000, // 15s for initial join
      transport: 10000, // 10s for transport operations
      media: 20000, // 20s for media operations
      reconnect: 30000, // 30s for reconnection attempts
    };
  }

  /**
   * Emit a socket event with timeout and error handling
   * @param {string} event - Event name
   * @param {Object} data - Event data
   * @param {number} [timeout] - Custom timeout in ms
   * @returns {Promise} Response from server
   */
  emitWithTimeout(event, data, customTimeout) {
    // Choose appropriate timeout based on operation type
    const timeout = customTimeout || this.getTimeoutForEvent(event);

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error(`${event} request timed out after ${timeout}ms`));
      }, timeout);

      const requestId = `${event}-${Date.now()}-${Math.random()}`;
      this.pendingRequests.set(requestId, { resolve, reject, timeoutId });

      // Add retry logic for critical operations
      let retryCount = 0;
      const maxRetries = 2;

      const attemptEmit = () => {
        this.socket.emit(event, { ...data, requestId }, (response) => {
          clearTimeout(timeoutId);
          this.pendingRequests.delete(requestId);

          if (response?.error && retryCount < maxRetries) {
            retryCount++;
            setTimeout(attemptEmit, 1000); // Retry after 1s
          } else {
            if (response?.error) {
              reject(new Error(response.error));
            } else {
              resolve(response);
            }
          }
        });
      };

      attemptEmit();
    });
  }

  getTimeoutForEvent(event) {
    if (event.includes('join')) return this.timeouts.joinRoom;
    if (event.includes('transport')) return this.timeouts.transport;
    if (event.includes('media')) return this.timeouts.media;
    if (event.includes('reconnect')) return this.timeouts.reconnect;
    return this.timeouts.transport; // default
  }

  setMeetingId(meetingId) {
    if (!meetingId) {
      throw new Error('Meeting ID is required');
    }
    this.meetingId = meetingId;
  }

  setUid(uid) {
    if (!uid) {
      throw new Error('Uid  is required');
    }
    this.uid = uid;
  }

  setAudioOnly(isAudioOnly) {
    if (!isAudioOnly === null || isAudioOnly === undefined) {
      throw new Error('isAudioOnly indication  is required');
    }
    this.isAudioOnly = isAudioOnly;
  }

  /**
   * Join meeting room
   * @returns {Promise<Object>} Router capabilities and role information
   */
  async joinRoom() {
    if (!this.meetingId) {
      throw new Error('Meeting ID not set');
    }

    console.log('Joining room with meeting ID:', this.meetingId);
    return this.emitWithTimeout('joinMeeting', {
      meetingId: this.meetingId,
      uid: this.uid,
      isAudioOnly: this.isAudioOnly,
    });
  }

  async createProducerTransport(kind) {
    return this.emitWithTimeout('create-producer-transport', {
      meetingId: this.meetingId,
      kind,
    });
  }

  async createConsumerTransport() {
    return this.emitWithTimeout('create-consumer-transport', {
      meetingId: this.meetingId,
    });
  }

  async connectProducerTransport(params) {
    return this.emitWithTimeout('connect-producer-transport', {
      ...params,
      meetingId: this.meetingId,
      kind: params.kind,
    });
  }

  async connectConsumerTransport(params) {
    return this.emitWithTimeout('connect-consumer-transport', {
      ...params,
      meetingId: this.meetingId,
    });
  }

  async produce(params) {
    return this.emitWithTimeout('produce', {
      ...params,
      meetingId: this.meetingId,
      kind: params.kind,
    });
  }

  async consume(params) {
    return this.emitWithTimeout('consume', {
      ...params,
      meetingId: this.meetingId,
    });
  }

  /**
   * Setup event listeners
   * @param {Object} handlers - Event handler functions
   */
  setupListeners(handlers) {
    const events = {
      'new-producer': handlers.onNewProducer,
      'producer-closed': handlers.onProducerClosed,
      'participant-disconnected': handlers.onParticipantDisconnected,
      'meeting-ended': handlers.onMeetingEnded,
      'connection-quality-changed': handlers.onConnectionQualityChanged,
    };

    // Remove any existing listeners
    this.cleanup();

    // Set up new listeners
    Object.entries(events).forEach(([event, handler]) => {
      if (handler) {
        this.socket.on(event, handler);
        this.eventHandlers.set(event, handler);
      }
    });

    // Setup reconnection handling
    this.socket.on('connect_error', (error) => {
      console.warn('Socket connection error from server:', error);
      handlers.onConnectionError?.(error);
    });

    this.socket.on('disconnect', (reason) => {
      console.warn('Socket disconnected from server:', reason);
      // Trigger onConnectionError callback

      const possibleReasons = [
        'io server disconnect',
        'transport close',
        'ping timeout',
        'transport error',
      ];

      if (possibleReasons.includes(reason)) {
        handlers.onConnectionError?.(new Error(reason));
      }
    });
  }

  /**
   * Send reconnection request
   * @param {Object} params - Reconnection parameters
   * @returns {Promise<Object>} Reconnection result
   */
  // async requestReconnection(params) {
  //   return this.emitWithTimeout(
  //     'reconnecting',
  //     {
  //       ...params,
  //       meetingId: this.meetingId,
  //     },
  //     15000, // passing custom timeout for reconnection
  //   );
  // }

  once(event, handler) {
    // Use socket.once directly
    this.socket.once(event, handler);

    // Track it in eventHandlers for cleanup
    this.eventHandlers.set(`once:${event}`, handler);
  }

  off(event, handler) {
    // If handler provided, remove specific handler
    if (handler) {
      this.socket.off(event, handler);
      // Remove from tracked handlers
      for (const [key, trackedHandler] of this.eventHandlers) {
        if (key.endsWith(event) && trackedHandler === handler) {
          this.eventHandlers.delete(key);
        }
      }
    } else {
      // If no handler, remove all handlers for this event
      this.socket.off(event);
      // Remove all tracked handlers for this event
      for (const [key] of this.eventHandlers) {
        if (key.endsWith(event)) {
          this.eventHandlers.delete(key);
        }
      }
    }
  }

  /**
   * Clean up all listeners and pending requests
   */
  cleanup() {
    // Clear all event listeners
    this.eventHandlers.forEach((handler, event) => {
      this.socket.off(event, handler);
    });
    this.eventHandlers.clear();

    // Clear any pending requests
    this.pendingRequests.forEach(({ timeoutId }) => {
      clearTimeout(timeoutId);
    });
    this.pendingRequests.clear();
  }
}

export default SignalingLayer;
