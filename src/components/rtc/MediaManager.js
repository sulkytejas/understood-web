/**
 * MediaManager.js
 * Handles all media stream operations and track management.
 * Responsible for managing local and remote media streams.
 */

class MediaManager {
  constructor() {
    this.localStream = null;
    this.producers = new Map();
    this.consumers = new Map();
    this.deviceConstraints = this.getDefaultConstraints();
    this.activeDevices = new Map();
    this.lastQuality = 'high';
  }

  /**
   * Get default media constraints
   * @private
   * @returns {Object} Default constraints
   */
  getDefaultConstraints() {
    return {
      //   audio: {
      //     echoCancellation: true,
      //     noiseSuppression: true,
      //     autoGainControl: true,
      //     sampleRate: 16000,
      //     sampleSize: 16,
      //     channelCount: 1,
      //     latency: 0.05,
      //   },
      audio: true,
      video: {
        width: { ideal: 1280, max: 1920 },
        height: { ideal: 720, max: 1080 },
        frameRate: { ideal: 30, max: 30 },
        aspectRatio: { ideal: 1.7777777778 },
      },
      qualityProfiles: {
        high: {
          video: {
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 },
            frameRate: { ideal: 30, max: 30 },
            bitrate: { min: 1000000, ideal: 2500000 },
          },
        },
        medium: {
          video: {
            width: { ideal: 640, max: 1280 },
            height: { ideal: 480, max: 720 },
            frameRate: { ideal: 25, max: 30 },
            bitrate: { min: 500000, ideal: 1000000 },
          },
        },
        low: {
          video: {
            width: { ideal: 320, max: 640 },
            height: { ideal: 240, max: 480 },
            frameRate: { ideal: 20, max: 25 },
            bitrate: { min: 250000, ideal: 500000 },
          },
        },
      },
    };
  }

  mergeConstraints(defaultConstraints, customConstraints) {
    return {
      audio: {
        ...defaultConstraints.audio,
        ...customConstraints.audio,
      },
      video: {
        ...defaultConstraints.video,
        ...customConstraints.video,
      },
    };
  }

  /**
   * Acquire media streams with specified constraints
   * @param {Object} [customConstraints] - Optional custom constraints
   * @returns {Promise<MediaStream>} The acquired media stream
   */
  async acquireMedia(customConstraints = {}) {
    try {
      const constraints = this.mergeConstraints(
        this.deviceConstraints,
        customConstraints,
      );

      // First check if we have permission
      await this.checkMediaPermissions(constraints);

      // Get the stream
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.localStream = stream;

      // Store device information
      await this.updateActiveDevices(stream);

      return stream;
    } catch (error) {
      console.error('Failed to acquire media:', error);
      throw new Error(`Media acquisition failed: ${error.message}`);
    }
  }

  /**
   * Check media permissions
   * @private
   * @param {Object} constraints - Media constraints
   */
  async checkMediaPermissions(constraints) {
    try {
      const permissionStatus = await Promise.all([
        navigator.permissions.query({ name: 'microphone' }),
        navigator.permissions.query({ name: 'camera' }),
      ]);

      const [micPermission, cameraPermission] = permissionStatus;

      if (constraints.audio && micPermission.state === 'denied') {
        throw new Error('Microphone permission denied');
      }
      if (constraints.video && cameraPermission.state === 'denied') {
        throw new Error('Camera permission denied');
      }
    } catch (error) {
      console.warn('Permission check failed:', error);
      // Continue anyway as some browsers don't support permission API
    }
  }

  /**
   * Update active device information
   * @private
   * @param {MediaStream} stream - Media stream
   */
  async updateActiveDevices(stream) {
    const devices = await navigator.mediaDevices.enumerateDevices();

    stream.getTracks().forEach((track) => {
      const settings = track.getSettings();
      const device = devices.find((d) => d.deviceId === settings.deviceId);
      if (device) {
        this.activeDevices.set(track.kind, {
          deviceId: device.deviceId,
          label: device.label,
          settings,
        });
      }
    });
  }

  /**
   * Add a producer
   * @param {Object} producer - Mediasoup producer
   */
  addProducer(producer) {
    this.producers.set(producer.kind, producer);

    producer.on('transportclose', () => {
      this.producers.delete(producer.kind);
    });

    producer.on('trackended', () => {
      this.producers.delete(producer.kind);
    });
  }

  /**
   * Add a consumer
   * @param {Object} consumer - Mediasoup consumer
   */
  addConsumer(consumer) {
    this.consumers.set(consumer.producerId, consumer);

    consumer.on('transportclose', () => {
      this.consumers.delete(consumer.producerId);
    });

    consumer.on('trackended', () => {
      this.consumers.delete(consumer.producerId);
    });
  }

  /**
   * Get producer by kind
   * @param {string} kind - Media kind (audio/video)
   * @returns {Object} Producer
   */
  getProducer(kind) {
    return this.producers.get(kind);
  }

  /**
   * Change stream quality
   * @param {string} quality - Quality profile name
   */
  async changeQuality(quality) {
    if (this.lastQuality === quality) return;

    const profile = this.deviceConstraints.qualityProfiles[quality];
    if (!profile) return;

    const videoTrack = this.localStream?.getVideoTracks()?.[0];
    if (videoTrack) {
      try {
        await videoTrack.applyConstraints(profile.video);
        this.lastQuality = quality;
      } catch (error) {
        console.error('Failed to apply quality constraints:', error);
      }
    }
  }

  /**
   * Control track state
   * @param {string} kind - Media kind (audio/video)
   * @param {boolean} enabled - Enable/disable track
   */
  async setTrackEnabled(kind, enabled) {
    const producer = this.producers.get(kind);
    if (producer) {
      if (enabled) {
        await producer.resume();
      } else {
        await producer.pause();
      }
    }

    if (this.localStream) {
      const track = this.localStream.getTracks().find((t) => t.kind === kind);
      if (track) track.enabled = enabled;
    }
  }

  /**
   * Get remote media stream
   * @returns {MediaStream} Combined remote stream
   */
  getRemoteStream() {
    if (this.consumers.size === 0) {
      console.log('No consumers available yet');
      return null;
    }
    const stream = new MediaStream();
    this.consumers.forEach((consumer) => {
      stream.addTrack(consumer.track);
    });
    return stream.getTracks().length > 0 ? stream : null;
  }

  /**
   * Clean up all resources
   */
  async cleanup(options = { force: false }) {
    if (this.localStream) {
      const tracks = this.localStream.getTracks();

      // Check if tracks are still in use before stopping
      tracks.forEach((track) => {
        const producer = this.producers.get(track.kind);
        if (options.force || !producer || producer.closed) {
          track.stop();
        }
      });

      // Only null the stream if all tracks are stopped
      if (tracks.every((track) => track.readyState === 'ended')) {
        this.localStream = null;
      }
    }

    // Cleanup producers and consumers with checks
    for (const [kind, producer] of this.producers) {
      if (!producer.closed) {
        try {
          await producer.pause();
          producer.close();
        } catch (error) {
          console.warn(`Error closing producer ${kind}:`, error);
        }
      }
    }
    this.producers.clear();

    // Similar careful cleanup for consumers
    for (const [id, consumer] of this.consumers) {
      if (!consumer.closed) {
        try {
          await consumer.pause();
          consumer.close();
        } catch (error) {
          console.warn(`Error closing consumer ${id}:`, error);
        }
      }
    }
    this.consumers.clear();
  }

  /**
   * Adjust quality for poor connection
   */
  async adjustQualityForPoorConnection() {
    try {
      // Change to low quality profile
      await this.changeQuality('low');

      // Get video track
      const videoTrack = this.localStream?.getVideoTracks()?.[0];
      if (videoTrack) {
        // Apply reduced constraints
        const constraints = {
          width: { ideal: 320, max: 640 },
          height: { ideal: 240, max: 480 },
          frameRate: { ideal: 20, max: 25 },
        };
        await videoTrack.applyConstraints(constraints);
      }
    } catch (error) {
      console.error('Failed to adjust quality for poor connection:', error);
    }
  }

  /**
   * Optimize quality for good connection
   */
  async optimizeQualityForGoodConnection() {
    try {
      // Change to high quality profile
      await this.changeQuality('high');

      // Get video track
      const videoTrack = this.localStream?.getVideoTracks()?.[0];
      if (videoTrack) {
        // Apply optimal constraints
        const constraints = {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30, max: 30 },
        };
        await videoTrack.applyConstraints(constraints);
      }
    } catch (error) {
      console.error('Failed to optimize quality:', error);
    }
  }
}

export default MediaManager;
