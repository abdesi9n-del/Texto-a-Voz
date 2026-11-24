import React, { useEffect, useRef, useState } from 'react';

interface VisualizerProps {
  isPlaying: boolean;
  isPaused?: boolean;
  audioUrl?: string | null;
  currentTime?: number;
  duration?: number;
  mode?: 'bars' | 'wave' | 'circle';
  accentColor?: string;
}

export const Visualizer: React.FC<VisualizerProps> = ({
  isPlaying,
  isPaused = false,
  audioUrl = null,
  currentTime = 0,
  duration = 0,
  mode = 'bars',
  accentColor = '#6366f1',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [waveformPeaks, setWaveformPeaks] = useState<number[] | null>(null);

  // Decode audioUrl read-only into waveform peaks without hijacking <audio> output
  useEffect(() => {
    let cancelled = false;
    if (!audioUrl) {
      setWaveformPeaks(null);
      return;
    }

    const extractPeaks = async () => {
      let ctx: AudioContext | null = null;
      try {
        const res = await fetch(audioUrl);
        const arrayBuffer = await res.arrayBuffer();
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx || cancelled) return;

        ctx = new AudioCtx();
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
        if (cancelled) return;

        const channelData = audioBuffer.getChannelData(0);
        const barCount = 48;
        const blockSize = Math.max(1, Math.floor(channelData.length / barCount));
        const peaks: number[] = [];

        for (let i = 0; i < barCount; i++) {
          const start = i * blockSize;
          let max = 0;
          for (let j = 0; j < blockSize && start + j < channelData.length; j += 4) {
            const val = Math.abs(channelData[start + j]);
            if (val > max) max = val;
          }
          peaks.push(Math.min(1, Math.max(0.14, max * 1.4)));
        }

        if (!cancelled) {
          setWaveformPeaks(peaks);
        }
      } catch {
        if (!cancelled) setWaveformPeaks(null);
      } finally {
        if (ctx && ctx.state !== 'closed') {
          ctx.close().catch(() => {});
        }
      }
    };

    extractPeaks();

    return () => {
      cancelled = true;
    };
  }, [audioUrl]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let phase = 0;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const progress = duration > 0 ? Math.min(1, Math.max(0, currentTime / duration)) : 0;

      if (mode === 'bars') {
        const barCount = 48;
        const barWidth = (width / barCount) * 0.7;
        const spacing = (width / barCount) * 0.3;

        for (let i = 0; i < barCount; i++) {
          let value = 0.15;

          if (waveformPeaks && waveformPeaks.length === barCount) {
            const basePeak = waveformPeaks[i];
            if (isPlaying && !isPaused) {
              const pulse = 0.12 * Math.sin(phase * 0.15 + i * 0.45);
              value = Math.min(1, Math.max(0.14, basePeak + pulse));
            } else {
              value = Math.max(0.14, basePeak * 0.75);
            }
          } else if (isPlaying && !isPaused) {
            const freq1 = Math.sin(i * 0.3 + phase * 0.08) * 0.35;
            const freq2 = Math.cos(i * 0.15 - phase * 0.05) * 0.3;
            const freq3 = Math.sin(i * 0.5 + phase * 0.12) * 0.2;
            value = Math.max(0.12, 0.45 + freq1 + freq2 + freq3);
          }

          const barHeight = Math.max(4, value * (height - 10));
          const x = i * (barWidth + spacing) + spacing / 2;
          const y = height / 2 - barHeight / 2;

          const barRatio = i / barCount;
          const isPlayedBar = waveformPeaks && duration > 0 && barRatio <= progress;

          const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
          if (isPlaying && !isPaused) {
            if (isPlayedBar || !waveformPeaks) {
              gradient.addColorStop(0, '#818cf8');
              gradient.addColorStop(0.5, '#c084fc');
              gradient.addColorStop(1, '#38bdf8');
            } else {
              gradient.addColorStop(0, '#475569');
              gradient.addColorStop(1, '#334155');
            }
          } else if (isPlayedBar) {
            gradient.addColorStop(0, '#6366f1');
            gradient.addColorStop(1, '#4f46e5');
          } else {
            gradient.addColorStop(0, '#334155');
            gradient.addColorStop(1, '#1e293b');
          }

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, 3);
          ctx.fill();
        }
      } else {
        ctx.beginPath();
        ctx.lineWidth = 3;
        ctx.strokeStyle = isPlaying && !isPaused ? '#a855f7' : '#475569';

        const sliceWidth = width / 64;
        let x = 0;

        for (let i = 0; i < 64; i++) {
          let v = 0;
          if (isPlaying && !isPaused) {
            v = Math.sin(i * 0.2 + phase * 0.1) * 20 + Math.sin(phase * 0.05 + i * 0.1) * 10;
          }
          const y = height / 2 + v;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }
        ctx.stroke();
      }

      phase += 1;
      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, isPaused, mode, accentColor, waveformPeaks, currentTime, duration]);

  return (
    <div className="relative w-full h-16 md:h-20 bg-slate-950/70 border border-slate-800/80 rounded-xl overflow-hidden flex items-center justify-center p-2 backdrop-blur-sm shadow-inner">
      <canvas
        ref={canvasRef}
        width={600}
        height={80}
        className="w-full h-full block"
      />
      {isPlaying && !isPaused && (
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-cyan-500/10 pointer-events-none animate-pulse-glow" />
      )}
    </div>
  );
};
