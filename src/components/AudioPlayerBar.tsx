import React, { useRef, useState, useEffect } from 'react';
import {
  Play,
  Pause,
  Square,
  Volume2,
  VolumeX,
  Download,
  RotateCcw,
  Sparkles,
  Check,
  Copy,
  ChevronDown,
  Music,
  FileAudio,
  Loader2,
} from 'lucide-react';
import { Visualizer } from './Visualizer';
import { wavToMp3Blob, triggerFileDownload } from '../utils/audioConverter';

interface AudioPlayerBarProps {
  audioUrl: string | null;
  isPlaying: boolean;
  isPaused: boolean;
  onPlay: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  activeVoiceName: string;
  engineName: string;
  isGenerating?: boolean;
  onNotify?: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const AudioPlayerBar: React.FC<AudioPlayerBarProps> = ({
  audioUrl,
  isPlaying,
  isPaused,
  onPlay,
  onPause,
  onResume,
  onStop,
  activeVoiceName,
  engineName,
  isGenerating = false,
  onNotify,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [copied, setCopied] = useState(false);

  // MP3 Export States
  const [isConvertingMp3, setIsConvertingMp3] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [selectedBitrate, setSelectedBitrate] = useState<number>(192);

  const downloadMenuRef = useRef<HTMLDivElement | null>(null);

  // Close download menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        downloadMenuRef.current &&
        !downloadMenuRef.current.contains(event.target as Node)
      ) {
        setShowDownloadMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync internal HTMLAudioElement when audioUrl changes
  useEffect(() => {
    if (!audioRef.current) return;
    if (audioUrl) {
      audioRef.current.src = audioUrl;
      audioRef.current.playbackRate = playbackRate;
      audioRef.current.volume = isMuted ? 0 : volume;
      audioRef.current.load();
    }
  }, [audioUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => {
      setDuration(audio.duration || 0);
    };
    const onEnded = () => {
      onStop();
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
    };
  }, [onStop]);

  // Synchronize playback if audioUrl is active
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;

    if (isPlaying && !isPaused) {
      audio.play().catch(() => {});
    } else if (isPaused) {
      audio.pause();
    } else {
      audio.pause();
      audio.currentTime = 0;
      setCurrentTime(0);
    }
  }, [isPlaying, isPaused, audioUrl]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current && audioUrl) {
      audioRef.current.currentTime = time;
    }
  };

  const handleRateChange = () => {
    const rates = [0.8, 1.0, 1.25, 1.5, 2.0];
    const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
    const nextRate = rates[nextIdx];
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const toggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    if (audioRef.current) {
      audioRef.current.volume = nextMute ? 0 : volume;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setIsMuted(val === 0);
    if (audioRef.current) {
      audioRef.current.volume = val;
    }
  };

  // Download as MP3 (with direct LameJS conversion)
  const handleDownloadMp3 = async (bitrate = selectedBitrate) => {
    if (!audioUrl) return;
    setIsConvertingMp3(true);
    setShowDownloadMenu(false);

    try {
      const mp3Blob = await wavToMp3Blob(audioUrl, bitrate);
      const safeName = activeVoiceName.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const filename = `vocalstudio_${safeName}_${Date.now()}.mp3`;

      triggerFileDownload(mp3Blob, filename);
      onNotify?.('success', `¡Audio descargado en formato MP3 (${bitrate} kbps)!`);
    } catch (err: any) {
      console.error('Error al convertir a MP3:', err);
      onNotify?.('error', 'No se pudo convertir a MP3. Se descargará en formato WAV.');
      handleDownloadWav();
    } finally {
      setIsConvertingMp3(false);
    }
  };

  // Download as native WAV
  const handleDownloadWav = () => {
    if (!audioUrl) return;
    setShowDownloadMenu(false);
    const safeName = activeVoiceName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const filename = `vocalstudio_${safeName}_${Date.now()}.wav`;
    triggerFileDownload(audioUrl, filename);
    onNotify?.('success', '¡Audio descargado en formato WAV (calidad estudio sin compresión)!');
  };

  const handleCopyAudio = async () => {
    if (!audioUrl) return;
    try {
      await navigator.clipboard.writeText(audioUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      onNotify?.('info', 'Enlace de audio copiado al portapapeles');
    } catch {
      // ignore
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="w-full bg-slate-900/95 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xl backdrop-blur-xl transition-all">
      {/* Hidden audio element for WAV playback */}
      <audio ref={audioRef} preload="metadata" />

      {/* Header with status badge & format downloads */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            {isGenerating ? (
              <Sparkles className="w-4 h-4 animate-spin text-amber-400" />
            ) : isPlaying ? (
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            ) : (
              <Volume2 className="w-4 h-4 text-slate-400" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-200">
                {isGenerating
                  ? 'Sintetizando audio...'
                  : isPlaying
                  ? 'Reproduciendo voz'
                  : audioUrl
                  ? 'Audio listo para escuchar y exportar'
                  : 'Listo para locución'}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-slate-800 text-indigo-300 border border-slate-700">
                {engineName}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Voz: <strong className="text-slate-300">{activeVoiceName}</strong>
            </p>
          </div>
        </div>

        {/* Action items: Rate, MP3 & WAV Downloads */}
        <div className="flex items-center gap-2">
          {audioUrl && (
            <>
              {/* Speed rate toggle */}
              <button
                onClick={handleRateChange}
                title="Cambiar velocidad de reproducción"
                className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              >
                {playbackRate}x
              </button>

              {/* Combined MP3 & WAV Download Group */}
              <div className="relative inline-flex rounded-xl shadow-sm" ref={downloadMenuRef}>
                {/* Primary Button: Descargar MP3 */}
                <button
                  onClick={() => handleDownloadMp3(selectedBitrate)}
                  disabled={isConvertingMp3}
                  title={`Guardar archivo de audio en MP3 (${selectedBitrate} kbps)`}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-l-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-900/30 transition active:scale-95 disabled:opacity-60 cursor-pointer"
                >
                  {isConvertingMp3 ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Convirtiendo MP3...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>Guardar en MP3</span>
                      <span className="text-[10px] bg-black/25 px-1 py-0.2 rounded font-mono">
                        .mp3
                      </span>
                    </>
                  )}
                </button>

                {/* Dropdown toggle for options (WAV / different bitrates) */}
                <button
                  onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                  disabled={isConvertingMp3}
                  title="Opciones de descarga (WAV / Calidad MP3)"
                  className="flex items-center px-2 py-1.5 text-xs font-bold rounded-r-xl bg-emerald-700 hover:bg-emerald-600 border-l border-emerald-500/40 text-white transition disabled:opacity-60 cursor-pointer"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>

                {/* Download formats popover menu */}
                {showDownloadMenu && (
                  <div className="absolute right-0 top-full mt-1.5 w-60 z-50 bg-slate-900 border border-slate-800 rounded-xl p-2 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-2 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800/80 mb-1">
                      Opciones de Exportación
                    </div>

                    {/* MP3 Presets */}
                    <div className="space-y-1 mb-2">
                      <div className="text-[10px] text-slate-500 font-semibold px-2 pt-1 flex items-center gap-1">
                        <Music className="w-3 h-3 text-emerald-400" />
                        Formato MP3 (Comprimido universal)
                      </div>
                      <button
                        onClick={() => {
                          setSelectedBitrate(192);
                          handleDownloadMp3(192);
                        }}
                        className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs text-left text-slate-200 hover:bg-emerald-950/60 hover:text-emerald-300 rounded-lg transition"
                      >
                        <div className="flex flex-col">
                          <span className="font-semibold">MP3 Alta Calidad</span>
                          <span className="text-[10px] text-slate-400">Recomendado para la mayoría</span>
                        </div>
                        <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400 font-bold">
                          192 kbps
                        </span>
                      </button>

                      <button
                        onClick={() => {
                          setSelectedBitrate(320);
                          handleDownloadMp3(320);
                        }}
                        className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs text-left text-slate-200 hover:bg-emerald-950/60 hover:text-emerald-300 rounded-lg transition"
                      >
                        <div className="flex flex-col">
                          <span className="font-semibold">MP3 Calidad Máxima</span>
                          <span className="text-[10px] text-slate-400">Máxima fidelidad sonora</span>
                        </div>
                        <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400 font-bold">
                          320 kbps
                        </span>
                      </button>

                      <button
                        onClick={() => {
                          setSelectedBitrate(128);
                          handleDownloadMp3(128);
                        }}
                        className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs text-left text-slate-200 hover:bg-emerald-950/60 hover:text-emerald-300 rounded-lg transition"
                      >
                        <div className="flex flex-col">
                          <span className="font-semibold">MP3 Tamaño Reducido</span>
                          <span className="text-[10px] text-slate-400">Archivo más liviano</span>
                        </div>
                        <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-bold">
                          128 kbps
                        </span>
                      </button>
                    </div>

                    {/* WAV Option */}
                    <div className="pt-1.5 border-t border-slate-800/80">
                      <div className="text-[10px] text-slate-500 font-semibold px-2 mb-1 flex items-center gap-1">
                        <FileAudio className="w-3 h-3 text-indigo-400" />
                        Formato WAV (Sin compresión)
                      </div>
                      <button
                        onClick={handleDownloadWav}
                        className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs text-left text-slate-200 hover:bg-indigo-950/60 hover:text-indigo-300 rounded-lg transition"
                      >
                        <div className="flex flex-col">
                          <span className="font-semibold">WAV Original Estudio</span>
                          <span className="text-[10px] text-slate-400">Audio PCM 24kHz puro</span>
                        </div>
                        <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-indigo-400 font-bold">
                          .wav
                        </span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Copy audio DataURI button */}
              <button
                onClick={handleCopyAudio}
                title="Copiar enlace DataURI de audio"
                className="p-1.5 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Visualizer Canvas */}
      <div className="mb-4">
        <Visualizer
          isPlaying={isPlaying}
          isPaused={isPaused}
          audioElement={audioRef.current}
          mode="bars"
        />
      </div>

      {/* Scrubber timeline */}
      <div className="space-y-1 mb-3">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-slate-400 w-10 text-right">
            {formatTime(currentTime)}
          </span>
          <div className="relative flex-1 flex items-center">
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              disabled={!audioUrl}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed"
            />
          </div>
          <span className="text-xs font-mono text-slate-400 w-10">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Playback control buttons */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
        <div className="flex items-center gap-2">
          {isPlaying && !isPaused ? (
            <button
              onClick={onPause}
              disabled={isGenerating}
              className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md font-bold transition active:scale-95"
              title="Pausar (Espacio)"
            >
              <Pause className="w-5 h-5 fill-current" />
            </button>
          ) : (
            <button
              onClick={isPaused ? onResume : onPlay}
              disabled={isGenerating}
              className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/30 font-bold transition active:scale-95 disabled:opacity-50"
              title="Reproducir / Escuchar"
            >
              <Play className="w-5 h-5 fill-current ml-0.5" />
            </button>
          )}

          <button
            onClick={onStop}
            disabled={!isPlaying && !isPaused && currentTime === 0}
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            title="Detener"
          >
            <Square className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              if (audioRef.current) {
                audioRef.current.currentTime = 0;
                setCurrentTime(0);
              }
            }}
            disabled={!audioUrl}
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            title="Reiniciar desde el inicio"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Volume controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleMute}
            className="p-1.5 text-slate-400 hover:text-slate-200 transition"
            title={isMuted ? 'Activar sonido' : 'Silenciar'}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-16 sm:w-20 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            title="Volumen"
          />
        </div>
      </div>
    </div>
  );
};
