import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { VoiceSelector } from './components/VoiceSelector';
import { TextEditor } from './components/TextEditor';
import { DialogueEditor } from './components/DialogueEditor';
import { AudioPlayerBar } from './components/AudioPlayerBar';
import { PresetSelector, PRESETS } from './components/PresetSelector';
import { HistoryDrawer } from './components/HistoryDrawer';
import { speechManager } from './services/speechSynthesisService';
import {
  AIVoice,
  VoiceStyle,
  DialogueLine,
  AudioHistoryItem,
  EngineType,
} from './types';
import {
  AlertCircle,
  Sparkles,
  Info,
  CheckCircle2,
  X,
} from 'lucide-react';

const DEFAULT_AI_VOICES: AIVoice[] = [
  {
    id: 'Kore',
    name: 'Kore',
    gender: 'Femenina',
    tone: 'Cálida, equilibrada y natural',
    bestFor: 'Audiolibros, documentales, narración general',
    avatarColor: 'from-amber-400 to-rose-400',
  },
  {
    id: 'Fenrir',
    name: 'Fenrir',
    gender: 'Masculina',
    tone: 'Profunda, resonante y autoritaria',
    bestFor: 'Trailers, audiolibros épicos, anuncios corporativos',
    avatarColor: 'from-blue-600 to-indigo-800',
  },
  {
    id: 'Puck',
    name: 'Puck',
    gender: 'Masculina / Juvenil',
    tone: 'Enérgica, entusiasta y moderna',
    bestFor: 'Podcasts, videos de YouTube, publicidad dinámica',
    avatarColor: 'from-emerald-400 to-teal-600',
  },
  {
    id: 'Charon',
    name: 'Charon',
    gender: 'Masculina',
    tone: 'Serena, profunda, pausada y madura',
    bestFor: 'Reflexiones, meditación, filosofía, relatos históricos',
    avatarColor: 'from-purple-600 to-slate-800',
  },
  {
    id: 'Zephyr',
    name: 'Zephyr',
    gender: 'Femenina / Neutra',
    tone: 'Suave, clara, pedagógica y reconfortante',
    bestFor: 'Tutoriales, meditación guiada, asistencia al cliente',
    avatarColor: 'from-cyan-400 to-blue-500',
  },
];

const DEFAULT_STYLES: VoiceStyle[] = [
  { id: 'natural', label: 'Natural & Conversacional', prompt: 'Habla de forma natural, relajada y amigable, con dicción impecable.' },
  { id: 'noticiero', label: 'Presentador de Noticias', prompt: 'Tono formal, seguro, articulado y profesional como presentador de noticias.' },
  { id: 'audiolibro', label: 'Narrador de Audiolibro', prompt: 'Voz expresiva, cautivadora, rica en matices narrativos y tempo envolvente.' },
  { id: 'entusiasta', label: 'Comercial & Enérgico', prompt: 'Tono entusiasta, persuasivo, vibrante y con alta energía para comerciales.' },
  { id: 'meditacion', label: 'Calmado & Meditativo', prompt: 'Tono pausado, respirado, suave, relajante y susurrado para meditación.' },
  { id: 'dramatico', label: 'Dramático / Suspenso', prompt: 'Tono misterioso, con pausas tensas, cadencia teatral y suspenso.' },
];

export default function App() {
  // Navigation tab
  const [activeTab, setActiveTab] = useState<'standard' | 'dialogue'>('standard');

  // Engine configuration
  const [engine, setEngine] = useState<EngineType>('gemini-ai');
  const [hasApiKey, setHasApiKey] = useState<boolean>(true);

  // AI Voices & Styles
  const [aiVoices, setAiVoices] = useState<AIVoice[]>(DEFAULT_AI_VOICES);
  const [selectedAIVoice, setSelectedAIVoice] = useState<string>('Kore');
  const [voiceStyles, setVoiceStyles] = useState<VoiceStyle[]>(DEFAULT_STYLES);
  const [selectedStyleId, setSelectedStyleId] = useState<string>('natural');

  // Browser voices configuration
  const [browserVoices, setBrowserVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedBrowserVoice, setSelectedBrowserVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [rate, setRate] = useState<number>(1.0);
  const [pitch, setPitch] = useState<number>(1.0);

  // Standard editor text
  const [text, setText] = useState<string>(
    'Bienvenido a VocalStudio. Esta aplicación transforma cualquier texto en voz con una naturalidad excepcional. Puedes elegir entre diferentes voces neuronales con inteligencia artificial, modular su estilo narrativo o utilizar las voces integradas en tu navegador.'
  );

  // Multi-speaker dialogue lines
  const [speaker1Name, setSpeaker1Name] = useState<string>('Carlos');
  const [speaker1Voice, setSpeaker1Voice] = useState<string>('Fenrir');
  const [speaker2Name, setSpeaker2Name] = useState<string>('Lucía');
  const [speaker2Voice, setSpeaker2Voice] = useState<string>('Kore');
  const [dialogues, setDialogues] = useState<DialogueLine[]>([
    {
      id: '1',
      speaker: 'Carlos',
      text: '¡Hola Lucía! Qué increíble suena esta tecnología de síntesis vocal con inteligencia artificial.',
    },
    {
      id: '2',
      speaker: 'Lucía',
      text: 'Totalmente de acuerdo Carlos. La entonación y las pausas respiratorias suenan increíblemente humanas.',
    },
    {
      id: '3',
      speaker: 'Carlos',
      text: 'Y podemos descargar el archivo de audio directamente en alta definición en formato WAV.',
    },
  ]);

  // Player state
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [activeCharIndex, setActiveCharIndex] = useState<number | null>(null);
  const [activeCharLength, setActiveCharLength] = useState<number>(0);

  // History & Notifications
  const [history, setHistory] = useState<AudioHistoryItem[]>([]);
  const [activeHistoryPlayingId, setActiveHistoryPlayingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Load server voices and check health on mount
  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.hasApiKey === 'boolean') {
          setHasApiKey(data.hasApiKey);
          if (!data.hasApiKey) {
            setEngine('browser');
          }
        }
      })
      .catch(() => {});

    fetch('/api/tts/voices')
      .then((res) => res.json())
      .then((data) => {
        if (data.voices) setAiVoices(data.voices);
        if (data.styles) setVoiceStyles(data.styles);
      })
      .catch(() => {});
  }, []);

  // Load browser voices
  useEffect(() => {
    speechManager.getVoices().then((voices) => {
      setBrowserVoices(voices);
      if (voices.length > 0) {
        // Find best Spanish voice default
        const esVoice =
          voices.find((v) => v.lang.startsWith('es') || v.lang.startsWith('ES')) ||
          voices[0];
        setSelectedBrowserVoice(esVoice);
      }
    });
  }, []);

  // Load history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('vocalstudio_history_v1');
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, []);

  // Save history to localStorage
  const saveHistoryItem = (item: AudioHistoryItem) => {
    setHistory((prev) => {
      const updated = [item, ...prev].slice(0, 20); // Keep max 20 items
      try {
        localStorage.setItem('vocalstudio_history_v1', JSON.stringify(updated));
      } catch {
        // ignore quota
      }
      return updated;
    });
  };

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification((curr) => (curr?.message === message ? null : curr));
    }, 4500);
  };

  // Convert base64 audio to Blob URL
  const base64ToBlobUrl = (base64Data: string, mimeType = 'audio/wav') => {
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });
    return URL.createObjectURL(blob);
  };

  // Handle Generate and Play for standard text
  const handleGenerateAndPlay = async () => {
    if (!text.trim()) {
      showToast('error', 'Por favor ingresa un texto para convertir a voz.');
      return;
    }

    // Stop any existing playback
    handleStop();

    if (engine === 'gemini-ai') {
      setIsGenerating(true);
      try {
        const activeStyle = voiceStyles.find((s) => s.id === selectedStyleId);
        const res = await fetch('/api/tts/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: text.trim(),
            voice: selectedAIVoice,
            styleDescription: activeStyle?.prompt,
            model: 'gemini-3.8-flash-lite-tts',
          }),
        });

        const data = await res.json();
        if (!res.ok || data.error) {
          throw new Error(data.error || 'Error en el servidor al generar la voz.');
        }

        const newAudioUrl = base64ToBlobUrl(data.audioBase64, data.mimeType || 'audio/wav');
        setAudioUrl(newAudioUrl);
        setIsPlaying(true);
        setIsPaused(false);
        setActiveHistoryPlayingId(null);

        // Add to history
        const activeVoiceObj = aiVoices.find((v) => v.id === selectedAIVoice);
        saveHistoryItem({
          id: Date.now().toString(),
          title: `Locución ${activeVoiceObj?.name || selectedAIVoice}`,
          textSnippet: text.trim().substring(0, 100) + (text.length > 100 ? '...' : ''),
          engine: 'gemini-ai',
          voiceName: activeVoiceObj?.name || selectedAIVoice,
          createdAt: new Date().toISOString(),
          audioUrl: newAudioUrl,
          model: data.model,
        });

        showToast('success', 'Audio generado exitosamente en alta definición.');
      } catch (err: any) {
        console.error('Gemini TTS error:', err);
        showToast('error', err.message || 'No se pudo generar el audio con IA. Cambiando al motor del navegador...');
        // Fallback to browser synthesis
        handlePlayWithBrowser();
      } finally {
        setIsGenerating(false);
      }
    } else {
      // Browser Web Speech API
      handlePlayWithBrowser();
    }
  };

  // Play using Web Speech API
  const handlePlayWithBrowser = () => {
    setIsPlaying(true);
    setIsPaused(false);
    setActiveCharIndex(null);

    speechManager.speak(
      text,
      {
        voice: selectedBrowserVoice,
        rate,
        pitch,
      },
      {
        onStart: () => {
          setIsPlaying(true);
          setIsPaused(false);
        },
        onEnd: () => {
          setIsPlaying(false);
          setIsPaused(false);
          setActiveCharIndex(null);
        },
        onError: (err) => {
          setIsPlaying(false);
          setIsPaused(false);
          setActiveCharIndex(null);
          showToast('error', 'Error en la síntesis del navegador.');
        },
        onPause: () => {
          setIsPaused(true);
        },
        onResume: () => {
          setIsPaused(false);
        },
        onWordBoundary: (charIndex, charLength) => {
          setActiveCharIndex(charIndex);
          setActiveCharLength(charLength);
        },
      }
    );

    // Save to history metadata
    saveHistoryItem({
      id: Date.now().toString(),
      title: `Voz Navegador (${selectedBrowserVoice?.name || 'Local'})`,
      textSnippet: text.trim().substring(0, 100) + (text.length > 100 ? '...' : ''),
      engine: 'browser',
      voiceName: selectedBrowserVoice?.name || 'Voz del sistema',
      createdAt: new Date().toISOString(),
    });
  };

  // Handle Dialogue multi-speaker generation
  const handleGenerateDialogue = async () => {
    const validLines = dialogues.filter((d) => d.text.trim());
    if (validLines.length === 0) {
      showToast('error', 'Agrega texto para los personajes antes de generar.');
      return;
    }

    handleStop();
    setIsGenerating(true);

    try {
      const res = await fetch('/api/tts/dialogue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dialogues: validLines,
          speaker1Name,
          speaker1Voice,
          speaker2Name,
          speaker2Voice,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Error al generar diálogo.');
      }

      const newAudioUrl = base64ToBlobUrl(data.audioBase64, data.mimeType || 'audio/wav');
      setAudioUrl(newAudioUrl);
      setIsPlaying(true);
      setIsPaused(false);

      saveHistoryItem({
        id: Date.now().toString(),
        title: `Diálogo ${speaker1Name} & ${speaker2Name}`,
        textSnippet: validLines.map((l) => `${l.speaker}: ${l.text}`).join(' | ').substring(0, 110) + '...',
        engine: 'gemini-ai',
        voiceName: `${speaker1Voice} & ${speaker2Voice}`,
        createdAt: new Date().toISOString(),
        audioUrl: newAudioUrl,
        model: 'gemini-3.8-flash-tts',
      });

      showToast('success', 'Diálogo multi-voz sintetizado exitosamente.');
    } catch (err: any) {
      console.error('Dialogue error:', err);
      showToast('error', err.message || 'Error al generar el diálogo.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Pause or Resume
  const handlePause = () => {
    if (engine === 'browser' && speechManager.getState().isSpeaking) {
      speechManager.pause();
    }
    setIsPaused(true);
  };

  const handleResume = () => {
    if (engine === 'browser' && speechManager.getState().isPaused) {
      speechManager.resume();
    }
    setIsPaused(false);
  };

  const handleStop = () => {
    speechManager.stop();
    setIsPlaying(false);
    setIsPaused(false);
    setActiveCharIndex(null);
  };

  // AI Script Optimizer
  const handleOptimizeScript = async () => {
    if (!text.trim()) return;
    setIsOptimizing(true);
    try {
      const styleObj = voiceStyles.find((s) => s.id === selectedStyleId);
      const res = await fetch('/api/tts/optimize-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          targetTone: styleObj?.label || 'locución natural',
        }),
      });
      const data = await res.json();
      if (data.optimizedText) {
        setText(data.optimizedText);
        showToast('success', 'Texto optimizado para lectura y dicción natural.');
      }
    } catch (err) {
      showToast('error', 'No se pudo optimizar el guión.');
    } finally {
      setIsOptimizing(false);
    }
  };

  // Preset Selection
  const handleSelectPreset = (preset: any) => {
    if (preset.isDialogue && preset.dialogues) {
      setActiveTab('dialogue');
      setDialogues(
        preset.dialogues.map((d: any, idx: number) => ({
          id: (idx + 1).toString(),
          speaker: d.speaker,
          text: d.text,
        }))
      );
      setSpeaker1Name(preset.dialogues[0].speaker);
      setSpeaker2Name(preset.dialogues[1]?.speaker || 'Invitado');
    } else {
      setActiveTab('standard');
      setText(preset.text);
      if (preset.suggestedVoice) setSelectedAIVoice(preset.suggestedVoice);
      if (preset.styleId) setSelectedStyleId(preset.styleId);
    }
    showToast('info', `Cargado ejemplo: ${preset.title}`);
  };

  // History action: play item
  const handlePlayHistoryItem = (item: AudioHistoryItem) => {
    if (item.audioUrl) {
      handleStop();
      setAudioUrl(item.audioUrl);
      setActiveHistoryPlayingId(item.id);
      setIsPlaying(true);
      setIsPaused(false);
      showToast('info', `Reproduciendo: ${item.title}`);
    } else {
      setText(item.textSnippet);
      showToast('info', 'Texto cargado en el editor');
    }
  };

  const handleDeleteHistoryItem = (id: string) => {
    const updated = history.filter((h) => h.id !== id);
    setHistory(updated);
    try {
      localStorage.setItem('vocalstudio_history_v1', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleClearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem('vocalstudio_history_v1');
    } catch {
      // ignore
    }
  };

  const activeVoiceName =
    activeTab === 'dialogue'
      ? `${speaker1Voice} & ${speaker2Voice}`
      : engine === 'gemini-ai'
      ? selectedAIVoice
      : selectedBrowserVoice?.name || 'Voz del Navegador';

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        engine={engine}
        hasApiKey={hasApiKey}
      />

      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-20 right-4 z-50 max-w-md animate-in fade-in slide-in-from-top-4 duration-200">
          <div
            className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl shadow-2xl border text-xs sm:text-sm ${
              notification.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
                : notification.type === 'error'
                ? 'bg-rose-950/90 border-rose-500/50 text-rose-200'
                : 'bg-indigo-950/90 border-indigo-500/50 text-indigo-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : notification.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              ) : (
                <Info className="w-4 h-4 text-indigo-400 shrink-0" />
              )}
              <span>{notification.message}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-slate-400 hover:text-white p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Studio Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Quick Presets Bar */}
        <PresetSelector onSelectPreset={handleSelectPreset} />

        {/* Studio Center Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Voice & Controls Configuration (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <VoiceSelector
              engine={engine}
              aiVoices={aiVoices}
              selectedAIVoice={selectedAIVoice}
              onSelectAIVoice={setSelectedAIVoice}
              voiceStyles={voiceStyles}
              selectedStyleId={selectedStyleId}
              onSelectStyle={setSelectedStyleId}
              browserVoices={browserVoices}
              selectedBrowserVoice={selectedBrowserVoice}
              onSelectBrowserVoice={setSelectedBrowserVoice}
              rate={rate}
              onRateChange={setRate}
              pitch={pitch}
              onPitchChange={setPitch}
              hasApiKey={hasApiKey}
              onToggleEngine={(eng) => {
                setEngine(eng);
                handleStop();
              }}
            />

            {/* History Drawer */}
            <HistoryDrawer
              history={history}
              onPlayItem={handlePlayHistoryItem}
              onDeleteItem={handleDeleteHistoryItem}
              onClearHistory={handleClearHistory}
              onLoadTextIntoEditor={(t) => {
                setText(t);
                setActiveTab('standard');
                showToast('info', 'Texto cargado en el editor');
              }}
              activePlayingId={activeHistoryPlayingId}
              onNotify={showToast}
            />
          </div>

          {/* Right Column: Editor & Player (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Audio Player Bar */}
            <AudioPlayerBar
              audioUrl={audioUrl}
              isPlaying={isPlaying}
              isPaused={isPaused}
              onPlay={handleGenerateAndPlay}
              onPause={handlePause}
              onResume={handleResume}
              onStop={handleStop}
              activeVoiceName={activeVoiceName}
              engineName={
                engine === 'gemini-ai'
                  ? 'Gemini 3.8 Neural'
                  : 'Web Speech API'
              }
              isGenerating={isGenerating}
              onNotify={showToast}
            />

            {/* Mode switch view: Standard vs Dialogue */}
            {activeTab === 'standard' ? (
              <TextEditor
                text={text}
                onChange={setText}
                activeCharIndex={activeCharIndex}
                activeCharLength={activeCharLength}
                isGenerating={isGenerating}
                isPlaying={isPlaying}
                isPaused={isPaused}
                onGenerateAndPlay={handleGenerateAndPlay}
                onPauseOrResume={() => (isPaused ? handleResume() : handlePause())}
                onOptimizeScript={handleOptimizeScript}
                isOptimizing={isOptimizing}
                engineName={engine === 'gemini-ai' ? 'IA' : 'Navegador'}
              />
            ) : (
              <DialogueEditor
                dialogues={dialogues}
                onDialoguesChange={setDialogues}
                speaker1Name={speaker1Name}
                onSpeaker1NameChange={setSpeaker1Name}
                speaker1Voice={speaker1Voice}
                onSpeaker1VoiceChange={setSpeaker1Voice}
                speaker2Name={speaker2Name}
                onSpeaker2NameChange={setSpeaker2Name}
                speaker2Voice={speaker2Voice}
                onSpeaker2VoiceChange={setSpeaker2Voice}
                aiVoices={aiVoices}
                isGenerating={isGenerating}
                onGenerateDialogue={handleGenerateDialogue}
              />
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/70 py-4 text-center text-xs text-slate-500">
        <p>
          VocalStudio • Síntesis de voz de alta fidelidad con inteligencia artificial y Web Speech API
        </p>
      </footer>
    </div>
  );
}
