class EventEmitter {
  constructor() {
    this.events = new Map();
    this.onceEvents = new Map();
  }

  on(event, callback) {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event).add(callback);

    return () => this.off(event, callback);
  }

  once(event, callback) {
    const onceWrapper = (...args) => {
      this.off(event, onceWrapper);
      callback(...args);
    };

    this.onceEvents.set(callback, onceWrapper);
    return this.on(event, onceWrapper);
  }

  off(event, callback) {
    const callbacks = this.events.get(event);
    const onceWrapper = this.onceEvents.get(callback);

    if (callbacks) {
      callbacks.delete(onceWrapper || callback);
      if (callbacks.size === 0) {
        this.events.delete(event);
      }
    }

    if (onceWrapper) {
      this.onceEvents.delete(callback);
    }
  }

  emit(event, ...args) {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(...args);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  removeAllListeners(event) {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
    this.onceEvents.clear();
  }
}

export default EventEmitter;
