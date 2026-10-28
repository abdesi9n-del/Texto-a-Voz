import React, { useRef } from 'react';
import {
  FileText,
  Clock,
  Sparkles,
  Trash2,
  Copy,
  Plus,
  Wand2,
  Play,
  RotateCcw,
  Check,
  Pause,
} from 'lucide-react';

interface TextEditorProps {
  text: string;
  onChange: (newText: string) => void;
  activeCharIndex?: number | null;
  activeCharLength?: number;
  isGenerating: boolean;
  isPlaying: boolean;
  isPaused: boolean;
  onGenerateAndPlay: () => void;
  onPauseOrResume: () => void;
  onOptimizeScript: () => void;
  isOptimizing: boolean;
  engineName: string;
}

export const TextEditor: React.FC<TextEditorProps> = ({
  text,
  onChange,
  activeCharIndex = null,
  activeCharLength = 0,
  isGenerating,
  isPlaying,
  isPaused,
  onGenerateAndPlay,
  onPauseOrResume,
  onOptimizeScript,
  isOptimizing,
  engineName,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [copied, setCopied] = React.useState(false);

  // Statistics
  const charCount = text.length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  // Average reading speed: ~130 words per minute for Spanish TTS
  const estimatedSeconds = Math.ceil((words / 130) * 60);
  const estMins = Math.floor(estimatedSeconds / 60);
  const estSecs = estimatedSeconds % 60;
  const timeFormatted =
    words === 0 ? '0s' : estMins > 0 ? `${estMins}m ${estSecs}s` : `${estSecs}s`;

  const insertText = (snippet: string) => {
    const el = textareaRef.current;
    if (!el) {
      onChange(text + snippet);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const newText = text.substring(0, start) + snippet + text.substring(end);
    onChange(newText);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + snippet.length, start + snippet.length);
    }, 10);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore
    }
  };

  // Keyboard shortcut: Ctrl + Enter / Cmd + Enter to speak
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      onGenerateAndPlay();
    }
  };

  // Word highlighting representation if browser is reading
  const renderHighlightedPreview = () => {
    if (activeCharIndex === null || activeCharIndex === undefined || !isPlaying) {
      return null;
    }

    const before = text.substring(0, activeCharIndex);
    const highlighted = text.substring(
      activeCharIndex,
      activeCharIndex + (activeCharLength || 6)
    );
    const after = text.substring(activeCharIndex + (activeCharLength || 6));

    return (
      <div className="p-3 mb-2 text-xs rounded-xl bg-indigo-950/40 border border-indigo-500/40 text-slate-300 font-sans leading-relaxed select-none">
        <span className="text-[10px] uppercase font-bold text-indigo-400 block mb-1">
          Lectura en tiempo real:
        </span>
        <span>{before}</span>
        <span className="bg-indigo-500 text-white px-1 py-0.5 rounded font-semibold shadow-sm animate-pulse">
          {highlighted}
        </span>
        <span>{after}</span>
      </div>
    );
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl backdrop-blur-md flex flex-col h-full">
      {/* Editor Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-indigo-400" />
          <span className="text-sm font-bold text-slate-100">
            Texto para Locución
          </span>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onOptimizeScript}
            disabled={isOptimizing || !text.trim()}
            title="Optimizar texto con IA para dicción, números y pausas de respiración"
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-purple-950/60 hover:bg-purple-900/80 text-purple-300 border border-purple-800/60 transition disabled:opacity-40"
          >
            <Wand2 className={`w-3.5 h-3.5 ${isOptimizing ? 'animate-spin' : ''}`} />
            <span>{isOptimizing ? 'Optimizando...' : 'Optimizar con IA'}</span>
          </button>

          <button
            type="button"
            onClick={() => insertText(' ... ')}
            title="Insertar pausa de silencio (...)"
            className="px-2 py-1 text-xs font-mono font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
          >
            + Pausa (...)
          </button>

          <button
            type="button"
            onClick={handleCopy}
            title="Copiar texto"
            className="p-1.5 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={() => onChange('')}
            disabled={!text}
            title="Limpiar texto"
            className="p-1.5 text-xs rounded-lg bg-slate-800 hover:bg-rose-950/50 hover:text-rose-400 text-slate-400 border border-slate-700 transition disabled:opacity-30"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Live word boundary indicator when browser TTS is reading */}
      {renderHighlightedPreview()}

      {/* Textarea */}
      <div className="relative flex-1 min-h-[220px]">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe o pega aquí el texto que deseas convertir a voz en español... Puedes incluir narraciones, artículos, mensajes o historias."
          className="w-full h-full min-h-[220px] bg-slate-950/70 border border-slate-800/90 rounded-xl p-3.5 text-sm sm:text-base text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 resize-y leading-relaxed font-sans"
        />
      </div>

      {/* Footer stats & Play Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 mt-3 border-t border-slate-800">
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span title="Palabras">{words} palabras</span>
          <span className="text-slate-600">•</span>
          <span title="Caracteres">{charCount} caracteres</span>
          <span className="text-slate-600">•</span>
          <span className="flex items-center gap-1 text-slate-300" title="Tiempo estimado de lectura">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            ~{timeFormatted}
          </span>
        </div>

        {/* Big Action button */}
        <div className="flex items-center gap-2">
          {isPlaying ? (
            <button
              onClick={onPauseOrResume}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20 transition active:scale-95"
            >
              {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4 fill-current" />}
              <span>{isPaused ? 'Reanudar' : 'Pausar'}</span>
            </button>
          ) : (
            <button
              onClick={onGenerateAndPlay}
              disabled={isGenerating || !text.trim()}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/30 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin text-amber-300" />
                  <span>Sintetizando...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Generar y Escuchar</span>
                  <span className="hidden sm:inline-block text-[10px] opacity-75 font-mono ml-1 px-1.5 py-0.5 rounded bg-black/20">
                    Ctrl+Enter
                  </span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
