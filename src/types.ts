export type EngineType = 'gemini-ai' | 'browser';

export interface AIVoice {
  id: string;
  name: string;
  gender: string;
  tone: string;
  bestFor: string;
  avatarColor: string;
}

export interface VoiceStyle {
  id: string;
  label: string;
  prompt: string;
}

export interface DialogueLine {
  id: string;
  speaker: string; // e.g. "Speaker 1" or "Speaker 2"
  text: string;
  style?: string;
}

export interface AudioHistoryItem {
  id: string;
  title: string;
  textSnippet: string;
  engine: EngineType;
  voiceName: string;
  createdAt: string;
  audioUrl?: string; // object URL or base64 data URI
  duration?: number; // in seconds
  mimeType?: string;
  model?: string;
}
