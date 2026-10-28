import React, { useState } from 'react';
import {
  History,
  Play,
  Download,
  Trash2,
  FileText,
  Volume2,
  Music,
  FileAudio,
  Loader2,
  ChevronDown,
} from 'lucide-react';
import { AudioHistoryItem } from '../types';
import { wavToMp3Blob, triggerFileDownload } from '../utils/audioConverter';

interface HistoryDrawerProps {
  history: AudioHistoryItem[];
  onPlayItem: (item: AudioHistoryItem) => void;
  onDeleteItem: (id: string) => void;
  onClearHistory: () => void;
  onLoadTextIntoEditor: (text: string) => void;
  activePlayingId: string | null;
  onNotify?: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  history,
  onPlayItem,
  onDeleteItem,
  onClearHistory,
  onLoadTextIntoEditor,
  activePlayingId,
  onNotify,
}) => {
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const handleDownloadMp3 = async (item: AudioHistoryItem) => {
    if (!item.audioUrl) return;
    setConvertingId(item.id);
    setOpenMenuId(null);
    try {
      const mp3Blob = await wavToMp3Blob(item.audioUrl, 192);
      const safeName = item.title.toLowerCase().replace(/[^a-z0-9]/g, '_');
      triggerFileDownload(mp3Blob, `${safeName}_${Date.now()}.mp3`);
      onNotify?.('success', '¡Audio descargado en formato MP3 (192 kbps)!');
    } catch (err) {
      console.error('Error al exportar a MP3:', err);
      handleDownloadWav(item);
    } finally {
      setConvertingId(null);
    }
  };

  const handleDownloadWav = (item: AudioHistoryItem) => {
    if (!item.audioUrl) return;
    setOpenMenuId(null);
    const safeName = item.title.toLowerCase().replace(/[^a-z0-9]/g, '_');
    triggerFileDownload(item.audioUrl, `${safeName}_${Date.now()}.wav`);
    onNotify?.('success', '¡Audio descargado en formato WAV original!');
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-bold text-slate-100">
            Historial de Audios Generados
          </h3>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
            {history.length}
          </span>
        </div>

        {history.length > 0 && (
          <button
            onClick={onClearHistory}
            className="text-xs text-slate-400 hover:text-rose-400 transition"
            title="Borrar historial"
          >
            Limpiar todo
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="py-8 text-center text-slate-500 text-xs">
          <Volume2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p>No tienes grabaciones en el historial aún.</p>
          <p className="text-[11px] text-slate-600 mt-0.5">
            Las voces generadas aparecerán aquí con opción de descarga en MP3 y WAV.
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
          {history.map((item) => {
            const isPlaying = activePlayingId === item.id;
            const isConverting = convertingId === item.id;
            const isMenuOpen = openMenuId === item.id;

            return (
              <div
                key={item.id}
                className={`p-3 rounded-xl border transition-all text-xs flex flex-col gap-2 ${
                  isPlaying
                    ? 'bg-indigo-950/40 border-indigo-500 shadow-sm'
                    : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-[10px]">
                      {item.voiceName[0]}
                    </span>
                    <div className="truncate">
                      <span className="font-semibold text-slate-200">
                        {item.title}
                      </span>
                      <span className="text-[10px] text-slate-500 ml-2">
                        {formatDate(item.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 relative">
                    {item.audioUrl && (
                      <>
                        <button
                          onClick={() => onPlayItem(item)}
                          title="Reproducir este audio"
                          className="p-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white transition"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                        </button>

                        {/* MP3 Download Button */}
                        <button
                          onClick={() => handleDownloadMp3(item)}
                          disabled={isConverting}
                          title="Descargar en MP3 (192 kbps)"
                          className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800/60 text-emerald-300 hover:text-white transition font-semibold text-[11px]"
                        >
                          {isConverting ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <>
                              <Download className="w-3 h-3" />
                              <span>MP3</span>
                            </>
                          )}
                        </button>

                        {/* WAV option button */}
                        <button
                          onClick={() => handleDownloadWav(item)}
                          title="Descargar en WAV original"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition text-[10px] font-mono"
                        >
                          WAV
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => onLoadTextIntoEditor(item.textSnippet)}
                      title="Cargar texto en el editor"
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition"
                    >
                      <FileText className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteItem(item.id)}
                      title="Eliminar de historial"
                      className="p-1.5 rounded-lg hover:bg-rose-950/50 text-slate-500 hover:text-rose-400 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 line-clamp-2 italic font-serif">
                  "{item.textSnippet}"
                </p>

                <div className="flex items-center gap-2 text-[10px] text-slate-500">
                  <span className="px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-400">
                    Voz: {item.voiceName}
                  </span>
                  <span>•</span>
                  <span>{item.engine === 'gemini-ai' ? 'IA Neural' : 'Navegador'}</span>
                  <span>•</span>
                  <span className="text-emerald-400 font-mono">MP3 / WAV disponible</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
