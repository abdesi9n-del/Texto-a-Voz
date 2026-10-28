import { Mp3Encoder } from '@breezystack/lamejs';

/**
 * Converts a WAV Blob, ArrayBuffer, or audio URL into an MP3 Blob using LameJS
 */
export async function wavToMp3Blob(
  audioSource: Blob | ArrayBuffer | string,
  bitrate = 192
): Promise<Blob> {
  let arrayBuffer: ArrayBuffer;

  if (typeof audioSource === 'string') {
    // If it's a data URI or URL
    const res = await fetch(audioSource);
    arrayBuffer = await res.arrayBuffer();
  } else if (audioSource instanceof Blob) {
    arrayBuffer = await audioSource.arrayBuffer();
  } else {
    arrayBuffer = audioSource;
  }

  // Use AudioContext to decode audio data robustly
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  const audioCtx = new AudioCtx();

  try {
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;

    const mp3encoder = new Mp3Encoder(numChannels, sampleRate, bitrate);
    const mp3Data: Uint8Array[] = [];
    const sampleBlockSize = 1152;

    if (numChannels === 1) {
      const floatSamples = audioBuffer.getChannelData(0);
      const int16Samples = new Int16Array(floatSamples.length);

      for (let i = 0; i < floatSamples.length; i++) {
        const s = Math.max(-1, Math.min(1, floatSamples[i]));
        int16Samples[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
      }

      for (let i = 0; i < int16Samples.length; i += sampleBlockSize) {
        const chunk = int16Samples.subarray(i, i + sampleBlockSize);
        const mp3buf = mp3encoder.encodeBuffer(chunk);
        if (mp3buf.length > 0) {
          mp3Data.push(new Uint8Array(mp3buf));
        }
      }
    } else {
      // Stereo
      const leftFloat = audioBuffer.getChannelData(0);
      const rightFloat = audioBuffer.getChannelData(1);
      const leftInt16 = new Int16Array(leftFloat.length);
      const rightInt16 = new Int16Array(rightFloat.length);

      for (let i = 0; i < leftFloat.length; i++) {
        const sL = Math.max(-1, Math.min(1, leftFloat[i]));
        leftInt16[i] = sL < 0 ? sL * 0x8000 : sL * 0x7fff;

        const sR = Math.max(-1, Math.min(1, rightFloat[i]));
        rightInt16[i] = sR < 0 ? sR * 0x8000 : sR * 0x7fff;
      }

      for (let i = 0; i < leftInt16.length; i += sampleBlockSize) {
        const leftChunk = leftInt16.subarray(i, i + sampleBlockSize);
        const rightChunk = rightInt16.subarray(i, i + sampleBlockSize);
        const mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);
        if (mp3buf.length > 0) {
          mp3Data.push(new Uint8Array(mp3buf));
        }
      }
    }

    const endBuf = mp3encoder.flush();
    if (endBuf.length > 0) {
      mp3Data.push(new Uint8Array(endBuf));
    }

    return new Blob(mp3Data as any, { type: 'audio/mp3' });
  } finally {
    if (audioCtx.state !== 'closed') {
      audioCtx.close().catch(() => {});
    }
  }
}

/**
 * Trigger immediate download in the browser
 */
export function triggerFileDownload(blobOrUrl: Blob | string, filename: string) {
  let url: string;
  let shouldRevoke = false;

  if (blobOrUrl instanceof Blob) {
    url = URL.createObjectURL(blobOrUrl);
    shouldRevoke = true;
  } else {
    url = blobOrUrl;
  }

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  if (shouldRevoke) {
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
}
