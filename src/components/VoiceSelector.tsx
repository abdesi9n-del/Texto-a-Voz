import React from 'react';
import {
  Mic,
  Sliders,
  Sparkles,
  Bot,
  User,
  Radio,
  Flame,
  Moon,
  Volume2,
  Check,
} from 'lucide-react';
import { AIVoice, VoiceStyle, EngineType } from '../types';

interface VoiceSelectorProps {
  engine: EngineType;
  aiVoices: AIVoice[];
  selectedAIVoice: string;
  onSelectAIVoice: (id: string) => void;
  voiceStyles: VoiceStyle[];
  selectedStyleId: string;
  onSelectStyle: (id: string) => void;
  browserVoices: SpeechSynthesisVoice[];
  selectedBrowserVoice: SpeechSynthesisVoice | null;
  onSelectBrowserVoice: (voice: SpeechSynthesisVoice) => void;
  rate: number;
  onRateChange: (rate: number) => void;
  pitch: number;
  onPitchChange: (pitch: number) => void;
  hasApiKey: boolean;
  onToggleEngine: (engine: EngineType) => void;
}

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  engine,
  aiVoices,
  selectedAIVoice,
  onSelectAIVoice,
  voiceStyles,
  selectedStyleId,
  onSelectStyle,
  browserVoices,
  selectedBrowserVoice,
  onSelectBrowserVoice,
  rate,
  onRateChange,
  pitch,
  onPitchChange,
  hasApiKey,
  onToggleEngine,
}) => {
  // Filter Spanish voices first
  const spanishBrowserVoices = browserVoices.filter(
    (v) => v.lang.startsWith('es') || v.lang.startsWith('ES')
  );
  const otherBrowserVoices = browserVoices.filter(
    (v) => !v.lang.startsWith('es') && !v.lang.startsWith('ES')
  );

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl backdrop-blur-md">
      {/* Engine Switcher */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
        <div>
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Mic className="w-4 h-4 text-indigo-400" />
            Configuración de Voz y Motor
          </h2>
          <p className="text-xs text-slate-400">
            Elige entre voces neuronales de alta fidelidad o síntesis nativa
          </p>
        </div>

        <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800">
          <button
            onClick={() => onToggleEngine('gemini-ai')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              engine === 'gemini-ai'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Voz IA (Gemini)</span>
          </button>
          <button
            onClick={() => onToggleEngine('browser')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              engine === 'browser'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Navegador (Local)</span>
          </button>
        </div>
      </div>

      {/* Engine: Gemini AI */}
      {engine === 'gemini-ai' ? (
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Voz Neuronal Estudio (Gemini TTS)
              </span>
              <span className="text-[11px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                24kHz Estudio Hi-Fi
              </span>
            </div>

            {/* Voice Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {aiVoices.map((voice) => {
                const isSelected = selectedAIVoice === voice.id;
                return (
                  <button
                    key={voice.id}
                    onClick={() => onSelectAIVoice(voice.id)}
                    className={`relative text-left p-3 rounded-xl border transition-all text-xs ${
                      isSelected
                        ? 'bg-indigo-950/40 border-indigo-500 shadow-md ring-1 ring-indigo-500/50'
                        : 'bg-slate-950/50 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-7 h-7 rounded-lg bg-gradient-to-tr ${voice.avatarColor} flex items-center justify-center font-bold text-white shadow-sm text-xs`}
                        >
                          {voice.name[0]}
                        </div>
                        <div>
                          <div className="font-bold text-slate-100 flex items-center gap-1">
                            {voice.name}
                            <span className="text-[10px] text-slate-400 font-normal">
                              ({voice.gender})
                            </span>
                          </div>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-1 mb-1">
                      {voice.tone}
                    </p>
                    <span className="inline-block text-[10px] text-indigo-300/80 bg-indigo-950/50 px-1.5 py-0.5 rounded border border-indigo-900/40 truncate max-w-full">
                      {voice.bestFor}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Voice Style Selector */}
          <div>
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
              Estilo Emocional y Tono de Locución
            </span>
            <div className="flex flex-wrap gap-1.5">
              {voiceStyles.map((style) => {
                const isSelected = selectedStyleId === style.id;
                return (
                  <button
                    key={style.id}
                    onClick={() => onSelectStyle(style.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      isSelected
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-500 shadow-sm'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    {style.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Engine: Browser SpeechSynthesis */
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
              Voces Instaladas en tu Sistema / Navegador
            </label>
            <select
              value={selectedBrowserVoice?.voiceURI || ''}
              onChange={(e) => {
                const found = browserVoices.find(
                  (v) => v.voiceURI === e.target.value
                );
                if (found) onSelectBrowserVoice(found);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              {spanishBrowserVoices.length > 0 && (
                <optgroup label="Voces en Español (Recomendadas)">
                  {spanishBrowserVoices.map((v) => (
                    <option key={v.voiceURI} value={v.voiceURI}>
                      {v.name} ({v.lang}) {v.default ? '★ Por defecto' : ''}
                    </option>
                  ))}
                </optgroup>
              )}
              {otherBrowserVoices.length > 0 && (
                <optgroup label="Otros Idiomas y Voces del Sistema">
                  {otherBrowserVoices.slice(0, 30).map((v) => (
                    <option key={v.voiceURI} value={v.voiceURI}>
                      {v.name} ({v.lang})
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          {/* Sliders for Pitch and Rate */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                  Velocidad (Cadencia):
                </span>
                <span className="font-mono text-indigo-300 font-bold">
                  {rate.toFixed(2)}x
                </span>
              </div>
              <input
                type="range"
                min={0.5}
                max={2.0}
                step={0.05}
                value={rate}
                onChange={(e) => onRateChange(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0.5x (Lento)</span>
                <span>1.0x (Normal)</span>
                <span>2.0x (Rápido)</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-purple-400" />
                  Tono (Agudo / Grave):
                </span>
                <span className="font-mono text-purple-300 font-bold">
                  {pitch.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min={0.5}
                max={1.5}
                step={0.05}
                value={pitch}
                onChange={(e) => onPitchChange(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0.5 (Grave)</span>
                <span>1.0 (Natural)</span>
                <span>1.5 (Agudo)</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
