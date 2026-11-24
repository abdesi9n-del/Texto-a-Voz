/**
 * Service to manage client-side Web Speech API synthesis reliably across browsers
 */

export interface SpeechProgressCallback {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
  onWordBoundary?: (charIndex: number, charLength: number) => void;
  onPause?: () => void;
  onResume?: () => void;
}

class SpeechSynthesisManager {
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isSpeaking = false;
  private isPaused = false;
  private sessionToken = 0;
  private keepAliveTimer: number | null = null;

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  public getVoices(): Promise<SpeechSynthesisVoice[]> {
    return new Promise((resolve) => {
      if (!this.isSupported()) {
        resolve([]);
        return;
      }

      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        resolve(voices);
        return;
      }

      const handler = () => {
        window.speechSynthesis.removeEventListener('voiceschanged', handler);
        resolve(window.speechSynthesis.getVoices());
      };
      window.speechSynthesis.addEventListener('voiceschanged', handler);

      setTimeout(() => {
        window.speechSynthesis.removeEventListener('voiceschanged', handler);
        resolve(window.speechSynthesis.getVoices());
      }, 600);
    });
  }

  private clearKeepAlive() {
    if (this.keepAliveTimer !== null) {
      window.clearInterval(this.keepAliveTimer);
      this.keepAliveTimer = null;
    }
  }

  private splitIntoChunks(text: string): Array<{ text: string; offset: number }> {
    const clean = text.trim();
    if (!clean) return [];
    if (clean.length <= 180) {
      return [{ text: clean, offset: text.indexOf(clean) }];
    }

    const chunks: Array<{ text: string; offset: number }> = [];
    const regex = /[^.!?\n]+(?:[.!?\n]+|$)/g;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      const part = match[0];
      if (!part.trim()) continue;
      if (part.length <= 180) {
        chunks.push({ text: part, offset: match.index });
      } else {
        // Split further by commas or spaces
        let start = 0;
        while (start < part.length) {
          let end = Math.min(start + 170, part.length);
          if (end < part.length) {
            const lastSpace = part.lastIndexOf(' ', end);
            if (lastSpace > start + 40) end = lastSpace + 1;
          }
          const slice = part.slice(start, end);
          if (slice.trim()) {
            chunks.push({ text: slice, offset: match.index + start });
          }
          start = end;
        }
      }
    }

    return chunks.length > 0 ? chunks : [{ text: clean, offset: 0 }];
  }

  public speak(
    text: string,
    options: {
      voice?: SpeechSynthesisVoice | null;
      rate?: number;
      pitch?: number;
      volume?: number;
      lang?: string;
    },
    callbacks: SpeechProgressCallback = {}
  ): void {
    if (!this.isSupported()) {
      callbacks.onError?.('La síntesis de voz no está soportada en este navegador.');
      return;
    }

    const synth = window.speechSynthesis;
    const wasActive = synth.speaking || synth.pending;

    this.stop();
    const myToken = ++this.sessionToken;

    const chunks = this.splitIntoChunks(text);
    if (chunks.length === 0) {
      callbacks.onEnd?.();
      return;
    }

    const speakChunk = (idx: number) => {
      if (this.sessionToken !== myToken) return;
      if (idx >= chunks.length) {
        this.isSpeaking = false;
        this.isPaused = false;
        this.currentUtterance = null;
        this.clearKeepAlive();
        callbacks.onEnd?.();
        return;
      }

      const chunk = chunks[idx];
      const utterance = new SpeechSynthesisUtterance(chunk.text);

      if (options.voice) {
        utterance.voice = options.voice;
        utterance.lang = options.voice.lang || options.lang || 'es-ES';
      } else {
        utterance.lang = options.lang || 'es-ES';
      }

      utterance.rate = options.rate !== undefined ? options.rate : 1.0;
      utterance.pitch = options.pitch !== undefined ? options.pitch : 1.0;
      utterance.volume = options.volume !== undefined ? options.volume : 1.0;

      utterance.onstart = () => {
        if (this.sessionToken !== myToken) return;
        this.isSpeaking = true;
        this.isPaused = false;
        if (idx === 0) {
          callbacks.onStart?.();
        }
      };

      utterance.onend = () => {
        if (this.sessionToken !== myToken) return;
        speakChunk(idx + 1);
      };

      utterance.onerror = (e: SpeechSynthesisErrorEvent) => {
        if (this.sessionToken !== myToken) return;
        if (e.error === 'canceled' || e.error === 'interrupted') {
          return;
        }
        this.isSpeaking = false;
        this.isPaused = false;
        this.currentUtterance = null;
        this.clearKeepAlive();
        callbacks.onError?.(e);
      };

      utterance.onpause = () => {
        if (this.sessionToken !== myToken) return;
        this.isPaused = true;
        callbacks.onPause?.();
      };

      utterance.onresume = () => {
        if (this.sessionToken !== myToken) return;
        this.isPaused = false;
        callbacks.onResume?.();
      };

      utterance.onboundary = (event) => {
        if (this.sessionToken !== myToken) return;
        if (event.name === 'word') {
          callbacks.onWordBoundary?.(
            chunk.offset + event.charIndex,
            event.charLength || 5
          );
        }
      };

      this.currentUtterance = utterance;

      if (synth.paused) {
        synth.resume();
      }
      synth.speak(utterance);
    };

    // Chrome keep-alive prevents silent freeze on longer utterances
    this.clearKeepAlive();
    this.keepAliveTimer = window.setInterval(() => {
      if (this.sessionToken !== myToken) {
        this.clearKeepAlive();
        return;
      }
      if (synth.speaking && !this.isPaused && !synth.paused) {
        synth.pause();
        synth.resume();
      }
    }, 10000);

    // Avoid Chrome/Safari bug where cancel() + speak() in the same tick cancels the new speech
    if (wasActive) {
      setTimeout(() => speakChunk(0), 60);
    } else {
      speakChunk(0);
    }
  }

  public pause(): void {
    if (this.isSupported() && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
      this.isPaused = true;
    }
  }

  public resume(): void {
    if (this.isSupported() && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      this.isPaused = false;
    }
  }

  public stop(): void {
    this.sessionToken++;
    this.clearKeepAlive();
    if (this.isSupported()) {
      if (window.speechSynthesis.speaking || window.speechSynthesis.pending || window.speechSynthesis.paused) {
        window.speechSynthesis.cancel();
      }
      this.isSpeaking = false;
      this.isPaused = false;
      this.currentUtterance = null;
    }
  }

  public getState() {
    return {
      isSpeaking: this.isSpeaking,
      isPaused: this.isPaused,
    };
  }
}

export const speechManager = new SpeechSynthesisManager();
