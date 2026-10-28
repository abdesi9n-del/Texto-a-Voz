import React from 'react';
import { Volume2, Sparkles, MessageSquare, Headphones, Layers } from 'lucide-react';
import { EngineType } from '../types';

interface NavbarProps {
  activeTab: 'standard' | 'dialogue';
  onTabChange: (tab: 'standard' | 'dialogue') => void;
  engine: EngineType;
  hasApiKey: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  engine,
  hasApiKey,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-500 text-white shadow-lg shadow-indigo-500/25">
            <Volume2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent flex items-center gap-2">
              VocalStudio
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                Texto a Voz
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Síntesis de voz neuronal y locución profesional en español
            </p>
          </div>
        </div>

        {/* Studio Modes Tabs */}
        <div className="flex items-center p-1 bg-slate-900/90 rounded-xl border border-slate-800">
          <button
            onClick={() => onTabChange('standard')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'standard'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Headphones className="w-3.5 h-3.5" />
            <span>Narración Simple</span>
          </button>
          <button
            onClick={() => onTabChange('dialogue')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'dialogue'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Guión Multi-Voz</span>
          </button>
        </div>

        {/* Engine status indicator */}
        <div className="hidden md:flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800">
            <span
              className={`w-2 h-2 rounded-full ${
                hasApiKey ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span className="text-slate-300 font-medium text-[11px]">
              {hasApiKey ? 'Gemini TTS Activo' : 'Navegador WebSpeech'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
