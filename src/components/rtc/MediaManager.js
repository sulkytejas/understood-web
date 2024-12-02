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
    this.browserName = this.detectBrowser();
    this.isHDEnabled = false; // Add HD flag initialization
  }

  detectBrowser() {
    const userAgent = navigator.userAgent;
    if (/Safari/.test(userAgent) && !/Chrome/.test(userAgent)) {
      return 'Safari';
    }
    return 'Other';
  }

  /**
   * Set HD preference
   * @param {boolean} enabled - Whether HD should be enabled
   */
  setHDPreference(enabled) {
    this.isHDEnabled = enabled;
    // Update constraints if stream is active
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        this.applyQualityConstraints(videoTrack, this.lastQuality);
      }
    }
  }

  /**
   * Get default media constraints
   * @private
   * @returns {Object} Default constraints
   */
  getDefaultConstraints() {
    const baseConstraints = {
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 16000,
        sampleSize: 16,
        channelCount: 1,
        latency: 0.05,
      },
      video: this.getBrowserVideoConstraints(),
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
        hd: {
          video: {
            width: { ideal: 1920, max: 1920 },
            height: { ideal: 1080, max: 1080 },
            frameRate: { ideal: 30, max: 60 },
            bitrate: { min: 2500000, ideal: 4000000 },
          },
        },
      },
    };

    return baseConstraints;
  }

  getBrowserVideoConstraints() {
    const hdConstraints = {
      width: { min: 1280, ideal: 1920, max: 1920 },
      height: { min: 720, ideal: 1080, max: 1080 },
      frameRate: { ideal: 30, max: 60 },
      aspectRatio: { ideal: 16 / 9 },
    };

    const standardConstraints = {
      width: { ideal: 1280, max: 1920 },
      height: { ideal: 720, max: 1080 },
      frameRate: { ideal: 30, max: 30 },
      aspectRatio: { ideal: 1.7777777778 },
    };

    if (this.browserName === 'Safari') {
      return this.isHDEnabled
        ? hdConstraints
        : {
            width: { min: 640, ideal: 1280, max: 1920 },
            height: { min: 360, ideal: 720, max: 1080 },
            aspectRatio: { ideal: 16 / 9 },
            frameRate: { ideal: 30, max: 30 },
          };
    }

    return this.isHDEnabled ? hdConstraints : standardConstraints;
  }

  async applyQualityConstraints(videoTrack, quality) {
    try {
      const profile =
        this.isHDEnabled && quality === 'high'
          ? this.deviceConstraints.qualityProfiles.hd
          : this.deviceConstraints.qualityProfiles[quality];

      if (profile) {
        await videoTrack.applyConstraints(profile.video);
      }
    } catch (error) {
      console.warn('Failed to apply quality constraints:', error);
    }
  }

  /**
   * Change stream quality
   * @param {string} quality - Quality profile name
   */

  async changeQuality(quality) {
    if (this.lastQuality === quality) return;

    const profile =
      this.isHDEnabled && quality === 'high'
        ? this.deviceConstraints.qualityProfiles.hd
        : this.deviceConstraints.qualityProfiles[quality];

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

  async applyAdvancedCameraControls(videoTrack) {
    try {
      const supportedConstraints =
        navigator.mediaDevices.getSupportedConstraints();
      const cameraConstraints = {};

      // Resolution constraints based on HD preference
      if (supportedConstraints.width && supportedConstraints.height) {
        const quality = this.lastQuality;
        const profile =
          this.isHDEnabled && quality === 'high'
            ? this.deviceConstraints.qualityProfiles.hd
            : this.deviceConstraints.qualityProfiles[quality];

        if (profile) {
          Object.assign(cameraConstraints, profile.video);
        }
      }

      // Standard camera features
      if (supportedConstraints.focusMode) {
        cameraConstraints.focusMode = 'continuous';
      }
      if (supportedConstraints.exposureMode) {
        cameraConstraints.exposureMode = 'continuous';
      }
      if (supportedConstraints.whiteBalanceMode) {
        cameraConstraints.whiteBalanceMode = 'continuous';
      }

      // Apply constraints if any are supported
      if (Object.keys(cameraConstraints).length > 0) {
        try {
          await videoTrack.applyConstraints(cameraConstraints);

          // Log applied settings
          const settings = videoTrack.getSettings();
          console.log('Applied camera settings:', {
            width: settings.width,
            height: settings.height,
            frameRate: settings.frameRate,
            focusMode: settings.focusMode,
            exposureMode: settings.exposureMode,
            whiteBalanceMode: settings.whiteBalanceMode,
          });
        } catch (error) {
          // Try applying constraints individually if bulk application fails
          for (const [key, value] of Object.entries(cameraConstraints)) {
            try {
              await videoTrack.applyConstraints({ [key]: value });
            } catch (constraintError) {
              console.warn(
                `Failed to apply camera constraint ${key}:`,
                constraintError,
              );
            }
          }
        }
      }

      return true;
    } catch (error) {
      console.warn('Failed to apply camera controls:', error);
      return false;
    }
  }

  async applyAdvancedAudioControls(audioTrack) {
    try {
      const supportedConstraints =
        navigator.mediaDevices.getSupportedConstraints();
      const audioConstraints = {};

      // Basic audio quality features
      if (supportedConstraints.noiseSuppression) {
        audioConstraints.noiseSuppression = true;
      }
      if (supportedConstraints.echoCancellation) {
        audioConstraints.echoCancellation = true;
      }
      if (supportedConstraints.autoGainControl) {
        audioConstraints.autoGainControl = true;
      }

      // Speech optimization
      if (supportedConstraints.channelCount) {
        audioConstraints.channelCount = 1; // Mono for better speech clarity
      }
      if (supportedConstraints.sampleRate) {
        audioConstraints.sampleRate = 16000; // Optimal for speech
      }
      if (supportedConstraints.sampleSize) {
        audioConstraints.sampleSize = 16; // Standard sample size
      }

      // Latency and performance settings
      if (supportedConstraints.latency) {
        audioConstraints.latency = this.lastQuality === 'low' ? 0.1 : 0.05;
      }

      // Advanced audio processing based on quality settings
      if (supportedConstraints.googEchoCancellation) {
        audioConstraints.googEchoCancellation = true;
      }
      if (supportedConstraints.googAutoGainControl) {
        audioConstraints.googAutoGainControl = true;
      }
      if (supportedConstraints.googNoiseSuppression) {
        audioConstraints.googNoiseSuppression = true;
      }
      if (supportedConstraints.googHighpassFilter) {
        audioConstraints.googHighpassFilter = true;
      }

      // Volume and gain control
      if (supportedConstraints.volume) {
        audioConstraints.volume = 1.0; // Max volume
      }
      if (supportedConstraints.gain) {
        // Adjust gain based on quality profile
        audioConstraints.gain = this.lastQuality === 'low' ? 0.8 : 1.0;
      }

      // Apply constraints if any are supported
      if (Object.keys(audioConstraints).length > 0) {
        console.log('Applying audio constraints:', audioConstraints);

        try {
          await audioTrack.applyConstraints({ advanced: [audioConstraints] });

          // Log applied settings
          const settings = audioTrack.getSettings();
          console.log('Applied audio settings:', {
            echoCancellation: settings.echoCancellation,
            noiseSuppression: settings.noiseSuppression,
            autoGainControl: settings.autoGainControl,
            sampleRate: settings.sampleRate,
            channelCount: settings.channelCount,
            latency: settings.latency,
          });
        } catch (constraintError) {
          console.warn(
            'Some audio constraints could not be applied:',
            constraintError,
          );
          // Try applying constraints individually if bulk application fails
          for (const [key, value] of Object.entries(audioConstraints)) {
            try {
              await audioTrack.applyConstraints({
                advanced: [{ [key]: value }],
              });
            } catch (error) {
              console.warn(`Failed to apply audio constraint ${key}:`, error);
            }
          }
        }
      }

      // Get final settings to verify what was actually applied
      const finalSettings = audioTrack.getSettings();
      console.log('Final audio settings:', finalSettings);

      return true;
    } catch (error) {
      console.warn('Failed to apply audio controls:', error);
      console.log('Error name:', error.name);
      console.log('Error message:', error.message);
      return false;
    }
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
      // Check if HD is available on the device before proceeding
      const capabilities = await this.getDeviceCapabilities();
      const canSupportHD = capabilities.supportsHD;

      // If HD is requested but not supported, log a warning and continue with standard quality
      if (this.isHDEnabled && !canSupportHD) {
        console.warn(
          'HD requested but device does not support it. Falling back to standard quality.',
        );
        this.isHDEnabled = false;
      }

      // Get appropriate constraints based on HD preference and browser
      const baseConstraints = this.getDefaultConstraints();
      let constraints = this.mergeConstraints(
        baseConstraints,
        customConstraints,
      );

      // Modify video constraints based on HD preference
      if (this.isHDEnabled && canSupportHD) {
        constraints.video = {
          ...constraints.video,
          ...this.deviceConstraints.qualityProfiles.hd.video,
        };
      }

      // First check permission
      await this.checkMediaPermissions(constraints);

      // Try to get the stream with preferred constraints
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (error) {
        // If failed and was trying HD, fallback to standard high quality
        if (this.isHDEnabled && error.name === 'OverconstrainedError') {
          console.warn(
            'Failed to get HD stream, falling back to standard quality',
          );
          this.isHDEnabled = false;
          constraints.video = {
            ...this.deviceConstraints.qualityProfiles.high.video,
          };
          stream = await navigator.mediaDevices.getUserMedia(constraints);
        } else {
          throw error;
        }
      }

      // Store the stream
      this.localStream = stream;

      // Get tracks
      const videoTrack = stream.getVideoTracks()[0];
      const audioTrack = stream.getAudioTracks()[0];

      // Log initial settings
      if (videoTrack) {
        const settings = videoTrack.getSettings();
        console.log('Initial video settings:', {
          width: settings.width,
          height: settings.height,
          frameRate: settings.frameRate,
          deviceId: settings.deviceId,
        });
      }

      // Apply advanced controls
      if (videoTrack) {
        const appliedCamera =
          await this.applyAdvancedCameraControls(videoTrack);
        if (!appliedCamera) {
          console.warn('Some camera controls could not be applied');
        }
      }

      if (audioTrack) {
        const appliedAudio = await this.applyAdvancedAudioControls(audioTrack);
        if (!appliedAudio) {
          console.warn('Some audio controls could not be applied');
        }
      }

      // Update device information
      await this.updateActiveDevices(stream);

      // Verify final stream quality
      if (videoTrack) {
        const finalSettings = videoTrack.getSettings();
        console.log('Final video settings:', {
          width: finalSettings.width,
          height: finalSettings.height,
          frameRate: finalSettings.frameRate,
        });

        // Check if we got the quality we wanted
        if (
          this.isHDEnabled &&
          (finalSettings.width < 1920 || finalSettings.height < 1080)
        ) {
          console.warn('Stream is not full HD despite HD being enabled');
        }
      }

      return stream;
    } catch (error) {
      console.error('Failed to acquire media:', error);
      throw new Error(`Media acquisition failed: ${error.message}`);
    }
  }

  // Helper method to check device capabilities
  async getDeviceCapabilities() {
    try {
      // Get list of video devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(
        (device) => device.kind === 'videoinput',
      );

      if (videoDevices.length === 0) {
        return { supportsHD: false };
      }

      // Try to get capabilities of the first video device
      const testConstraints = {
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      };

      try {
        const testStream =
          await navigator.mediaDevices.getUserMedia(testConstraints);
        const videoTrack = testStream.getVideoTracks()[0];
        const capabilities = videoTrack.getCapabilities();

        // Clean up test stream
        testStream.getTracks().forEach((track) => track.stop());

        // Check if device supports HD resolution
        const supportsHD =
          capabilities.width?.max >= 1920 && capabilities.height?.max >= 1080;

        return {
          supportsHD,
          maxWidth: capabilities.width?.max,
          maxHeight: capabilities.height?.max,
          maxFrameRate: capabilities.frameRate?.max,
        };
      } catch (error) {
        console.warn('Failed to get device capabilities:', error);
        return { supportsHD: false };
      }
    } catch (error) {
      console.warn('Failed to enumerate devices:', error);
      return { supportsHD: false };
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
