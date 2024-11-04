class Processor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufferSize = 1024; // Small buffer size for frequent sending
    this.buffer = new Float32Array(this.bufferSize);
    this.position = 0;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0][0];
    if (input) {
      for (let i = 0; i < input.length; i++) {
        this.buffer[this.position++] = input[i];
        if (this.position === this.bufferSize) {
          // Post message to the main thread with a copy of the buffer
          this.port.postMessage({ buffer: this.buffer.slice(0) });
          this.position = 0;
        }
      }
    }
    return true;
  }
}

registerProcessor('processor', Processor);
