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
    this.eventHandlers = new Map();
    this.pendingRequests = new Map();
    this.requestTimeout = 10000; // 10 seconds timeout for requests
  }

  /**
   * Emit a socket event with timeout and error handling
   * @param {string} event - Event name
   * @param {Object} data - Event data
   * @param {number} [timeout] - Custom timeout in ms
   * @returns {Promise} Response from server
   */
  emitWithTimeout(event, data, timeout = this.requestTimeout) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`${event} request timed out after ${timeout}ms`));
      }, timeout);

      const requestId = `${event}-${Date.now()}-${Math.random()}`;
      this.pendingRequests.set(requestId, { resolve, reject, timeoutId });

      this.socket.emit(event, { ...data, requestId }, (response) => {
        clearTimeout(timeoutId);
        this.pendingRequests.delete(requestId);

        if (response?.error) {
          reject(new Error(response.error));
        } else {
          resolve(response);
        }
      });
    });
  }

  setMeetingId(meetingId) {
    if (!meetingId) {
      throw new Error('Meeting ID is required');
    }
    this.meetingId = meetingId;
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
    return this.emitWithTimeout('joinMeeting', { meetingId: this.meetingId });
  }

  async createProducerTransport() {
    return this.emitWithTimeout('create-producer-transport', {
      meetingId: this.meetingId,
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
      'other-participant-audio-only': handlers.onAudioOnly,
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
    this.socket.on('connect_error', () => {
      handlers.onConnectionError?.();
    });

    this.socket.on('connect', () => {
      handlers.onReconnected?.();
    });
  }

  /**
   * Send reconnection request
   * @param {Object} params - Reconnection parameters
   * @returns {Promise<Object>} Reconnection result
   */
  async requestReconnection(params) {
    return this.emitWithTimeout(
      'reconnecting',
      {
        ...params,
        meetingId: this.meetingId,
      },
      15000, // passing custom timeout for reconnection
    );
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
