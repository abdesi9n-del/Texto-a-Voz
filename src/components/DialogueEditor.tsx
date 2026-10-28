import React from 'react';
import {
  Users,
  Plus,
  Trash2,
  Sparkles,
  Play,
  ArrowUpDown,
  Mic2,
} from 'lucide-react';
import { DialogueLine, AIVoice } from '../types';

interface DialogueEditorProps {
  dialogues: DialogueLine[];
  onDialoguesChange: (lines: DialogueLine[]) => void;
  speaker1Name: string;
  onSpeaker1NameChange: (val: string) => void;
  speaker1Voice: string;
  onSpeaker1VoiceChange: (val: string) => void;
  speaker2Name: string;
  onSpeaker2NameChange: (val: string) => void;
  speaker2Voice: string;
  onSpeaker2VoiceChange: (val: string) => void;
  aiVoices: AIVoice[];
  isGenerating: boolean;
  onGenerateDialogue: () => void;
}

export const DialogueEditor: React.FC<DialogueEditorProps> = ({
  dialogues,
  onDialoguesChange,
  speaker1Name,
  onSpeaker1NameChange,
  speaker1Voice,
  onSpeaker1VoiceChange,
  speaker2Name,
  onSpeaker2NameChange,
  speaker2Voice,
  onSpeaker2VoiceChange,
  aiVoices,
  isGenerating,
  onGenerateDialogue,
}) => {
  const addLine = (speaker: string) => {
    const newLine: DialogueLine = {
      id: Math.random().toString(36).substring(2, 9),
      speaker,
      text: '',
    };
    onDialoguesChange([...dialogues, newLine]);
  };

  const updateLineText = (id: string, text: string) => {
    onDialoguesChange(
      dialogues.map((d) => (d.id === id ? { ...d, text } : d))
    );
  };

  const toggleLineSpeaker = (id: string) => {
    onDialoguesChange(
      dialogues.map((d) => {
        if (d.id !== id) return d;
        const newSpeaker =
          d.speaker === speaker1Name ? speaker2Name : speaker1Name;
        return { ...d, speaker: newSpeaker };
      })
    );
  };

  const removeLine = (id: string) => {
    if (dialogues.length <= 1) return;
    onDialoguesChange(dialogues.filter((d) => d.id !== id));
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl backdrop-blur-md space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-400" />
            Modo Diálogo / Guión Multi-Voz (Gemini 3.8 Flash TTS)
          </h2>
          <p className="text-xs text-slate-400">
            Crea conversaciones naturales entre dos interlocutores con alternancia automática de voces
          </p>
        </div>

        <button
          onClick={onGenerateDialogue}
          disabled={isGenerating || dialogues.every((d) => !d.text.trim())}
          className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/30 transition active:scale-95 disabled:opacity-50"
        >
          {isGenerating ? (
            <>
              <Sparkles className="w-4 h-4 animate-spin text-amber-300" />
              <span>Sintetizando diálogo...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>Generar Diálogo Completo</span>
            </>
          )}
        </button>
      </div>

      {/* Speaker Config Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Speaker 1 */}
        <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              Personaje 1
            </span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={speaker1Name}
              onChange={(e) => onSpeaker1NameChange(e.target.value)}
              placeholder="Nombre (ej. Alex)"
              className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
            <select
              value={speaker1Voice}
              onChange={(e) => onSpeaker1VoiceChange(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              {aiVoices.map((v) => (
                <option key={v.id} value={v.id}>
                  Voz {v.name} ({v.gender})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Speaker 2 */}
        <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              Personaje 2
            </span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={speaker2Name}
              onChange={(e) => onSpeaker2NameChange(e.target.value)}
              placeholder="Nombre (ej. Sam)"
              className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
            />
            <select
              value={speaker2Voice}
              onChange={(e) => onSpeaker2VoiceChange(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
            >
              {aiVoices.map((v) => (
                <option key={v.id} value={v.id}>
                  Voz {v.name} ({v.gender})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Dialogue Lines Flow */}
      <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
        {dialogues.map((line, index) => {
          const isSpeaker1 = line.speaker === speaker1Name;
          return (
            <div
              key={line.id}
              className={`p-3 rounded-xl border transition-all ${
                isSpeaker1
                  ? 'bg-indigo-950/20 border-indigo-900/50'
                  : 'bg-purple-950/20 border-purple-900/50'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => toggleLineSpeaker(line.id)}
                  title="Cambiar quién habla"
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition ${
                    isSpeaker1
                      ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-600/50'
                      : 'bg-purple-600/30 text-purple-300 border border-purple-500/40 hover:bg-purple-600/50'
                  }`}
                >
                  <Mic2 className="w-3 h-3" />
                  <span>{line.speaker}</span>
                  <ArrowUpDown className="w-3 h-3 opacity-60 ml-1" />
                </button>

                <span className="text-[11px] text-slate-500 font-mono">
                  #{index + 1}
                </span>

                <button
                  type="button"
                  onClick={() => removeLine(line.id)}
                  title="Eliminar turno"
                  disabled={dialogues.length <= 1}
                  className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition disabled:opacity-30"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <textarea
                value={line.text}
                onChange={(e) => updateLineText(line.id, e.target.value)}
                placeholder={`Lo que dice ${line.speaker}...`}
                rows={2}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-lg p-2.5 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
              />
            </div>
          );
        })}
      </div>

      {/* Add turn buttons */}
      <div className="flex items-center justify-center gap-2 pt-2">
        <button
          onClick={() => addLine(speaker1Name)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-300 border border-indigo-800/60 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Añadir turno ({speaker1Name})</span>
        </button>
        <button
          onClick={() => addLine(speaker2Name)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-purple-950/60 hover:bg-purple-900/80 text-purple-300 border border-purple-800/60 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Añadir turno ({speaker2Name})</span>
        </button>
      </div>
    </div>
  );
};
