/**
 * Created by kenta on 2/18/17.
 */
class Recorder {
  bufferLen = 4096;
  recording = false;
  websocket;

  constructor(source) {
    this.context = source.context;
    if (!this.context.createScriptProcessor) {
      this.node = this.context.createJavaScriptNode(this.bufferLen, 2, 2);
    } else {
      this.node = this.context.createScriptProcessor(this.bufferLen, 2, 2);
    }

    this.node.onaudioprocess = (event) => {
      if (!this.recording) return;

      const channelData = event.inputBuffer.getChannelData(0);
      const length = Math.floor(channelData.length / 3);
      const result = new Float32Array(length);

      let index = 0,
        inputIndex = 0;

      while (index < length) {
        result[index++] = channelData[inputIndex];
        inputIndex += 3;
      }

      let offset = 0;
      const buffer = new ArrayBuffer(length * 2);
      const spectrum = new DataView(buffer);
      for (let i = 0; i < result.length; i++, offset += 2) {
        const amplitude = Math.max(-1, Math.min(1, result[i]));
        spectrum.setInt16(offset, amplitude < 0 ? amplitude * 0x8000 : amplitude * 0x7FFF, true);
      }

      this.websocket.send(spectrum);
    }

    source.connect(this.node);
    this.node.connect(this.context.destination);
  }

  record(ws) {
    this.websocket = ws;
    this.recording = true;
  }

  stop() {
    this.recording = false;
    this.node.disconnect(0);
  }

  writeString(buffer, offset, string) {
    for (let i = 0; i < string.length; i++) {
      buffer.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  sendHeader(ws) {
    const sampleLength = 1000000;
    const mono = true;
    const sampleRate = 16000;
    const buffer = new ArrayBuffer(44);
    const eventBuffer = new DataView(buffer);

    this.writeString(eventBuffer, 0, 'RIFF');
    /* file length */
    eventBuffer.setUint32(4, 32 + sampleLength * 2, true);
    /* RIFF type */
    this.writeString(eventBuffer, 8, 'WAVE');
    /* format chunk identifier */
    this.writeString(eventBuffer, 12, 'fmt ');
    /* format chunk length */
    eventBuffer.setUint32(16, 16, true);
    /* sample format (raw) */
    eventBuffer.setUint16(20, 1, true);
    /* channel count */
    eventBuffer.setUint16(22, mono ? 1 : 2, true);
    /* sample rate */
    eventBuffer.setUint32(24, sampleRate, true);
    /* byte rate (sample rate * block align) */
    eventBuffer.setUint32(28, sampleRate * 2, true);
    /* block align (channel count * bytes per sample) */
    eventBuffer.setUint16(32, 2, true);
    /* bits per sample */
    eventBuffer.setUint16(34, 16, true);
    /* data chunk identifier */
    this.writeString(eventBuffer, 36, 'data');
    /* data chunk length */
    eventBuffer.setUint32(40, sampleLength * 2, true);

    ws.send(eventBuffer);
  }
}

export default Recorder;
