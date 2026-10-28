/**
 * Service to manage client-side Web Speech API synthesis
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

      // If voices are not yet loaded, wait for event
      const handler = () => {
        window.speechSynthesis.removeEventListener('voiceschanged', handler);
        resolve(window.speechSynthesis.getVoices());
      };
      window.speechSynthesis.addEventListener('voiceschanged', handler);

      // Fallback timeout
      setTimeout(() => {
        window.speechSynthesis.removeEventListener('voiceschanged', handler);
        resolve(window.speechSynthesis.getVoices());
      }, 500);
    });
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

    this.stop();

    const utterance = new SpeechSynthesisUtterance(text);
    if (options.voice) {
      utterance.voice = options.voice;
    }
    if (options.rate !== undefined) utterance.rate = options.rate;
    if (options.pitch !== undefined) utterance.pitch = options.pitch;
    if (options.volume !== undefined) utterance.volume = options.volume;
    if (options.lang) utterance.lang = options.lang;

    utterance.onstart = () => {
      this.isSpeaking = true;
      this.isPaused = false;
      callbacks.onStart?.();
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this.isPaused = false;
      this.currentUtterance = null;
      callbacks.onEnd?.();
    };

    utterance.onerror = (e) => {
      this.isSpeaking = false;
      this.isPaused = false;
      this.currentUtterance = null;
      callbacks.onError?.(e);
    };

    utterance.onpause = () => {
      this.isPaused = true;
      callbacks.onPause?.();
    };

    utterance.onresume = () => {
      this.isPaused = false;
      callbacks.onResume?.();
    };

    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        callbacks.onWordBoundary?.(event.charIndex, event.charLength || 5);
      }
    };

    this.currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
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
    if (this.isSupported()) {
      window.speechSynthesis.cancel();
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
