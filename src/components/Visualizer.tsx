import React, { useEffect, useRef } from 'react';

interface VisualizerProps {
  isPlaying: boolean;
  isPaused?: boolean;
  audioElement?: HTMLAudioElement | null;
  mode?: 'bars' | 'wave' | 'circle';
  accentColor?: string;
}

export const Visualizer: React.FC<VisualizerProps> = ({
  isPlaying,
  isPaused = false,
  audioElement,
  mode = 'bars',
  accentColor = '#6366f1', // Indigo
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  // Setup Web Audio API when audioElement is provided
  useEffect(() => {
    if (!audioElement) return;

    try {
      if (!audioContextRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          audioContextRef.current = ctx;
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 128;
          analyserRef.current = analyser;

          // Connect element only once
          try {
            const source = ctx.createMediaElementSource(audioElement);
            source.connect(analyser);
            analyser.connect(ctx.destination);
            sourceRef.current = source;
          } catch (e) {
            // Already connected in some cases
          }
        }
      }
    } catch (err) {
      console.warn('AudioContext setup skipped:', err);
    }

    return () => {
      // Audio context cleanup is handled on unmount
    };
  }, [audioElement]);

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

      let dataArray: Uint8Array | null = null;
      if (analyserRef.current && isPlaying && !isPaused) {
        const bufferLength = analyserRef.current.frequencyBinCount;
        const buffer = new ArrayBuffer(bufferLength);
        const uintArray = new Uint8Array(buffer);
        analyserRef.current.getByteFrequencyData(uintArray as any);
        dataArray = uintArray;
      }

      if (mode === 'bars') {
        const barCount = 48;
        const barWidth = (width / barCount) * 0.7;
        const spacing = (width / barCount) * 0.3;

        for (let i = 0; i < barCount; i++) {
          let value = 0.15; // idle baseline

          if (isPlaying && !isPaused) {
            if (dataArray && dataArray.length > 0) {
              const dataIdx = Math.floor((i / barCount) * (dataArray.length * 0.7));
              value = Math.max(0.12, (dataArray[dataIdx] || 0) / 255);
            } else {
              // Simulated organic wave for synthetic speech or fallback
              const freq1 = Math.sin((i * 0.3) + phase * 0.08) * 0.35;
              const freq2 = Math.cos((i * 0.15) - phase * 0.05) * 0.3;
              const freq3 = Math.sin((i * 0.5) + phase * 0.12) * 0.2;
              value = Math.max(0.12, 0.45 + freq1 + freq2 + freq3);
            }
          }

          const barHeight = Math.max(4, value * (height - 10));
          const x = i * (barWidth + spacing) + spacing / 2;
          const y = height / 2 - barHeight / 2;

          // Gradient for bars
          const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
          if (isPlaying && !isPaused) {
            gradient.addColorStop(0, '#818cf8'); // light indigo
            gradient.addColorStop(0.5, '#c084fc'); // purple
            gradient.addColorStop(1, '#38bdf8'); // sky blue
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
        // Wave mode
        ctx.beginPath();
        ctx.lineWidth = 3;
        ctx.strokeStyle = isPlaying && !isPaused ? '#a855f7' : '#475569';

        const sliceWidth = width / 64;
        let x = 0;

        for (let i = 0; i < 64; i++) {
          let v = 0;
          if (isPlaying && !isPaused) {
            v = Math.sin((i * 0.2) + phase * 0.1) * 20 + Math.sin(phase * 0.05 + i * 0.1) * 10;
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
  }, [isPlaying, isPaused, mode, accentColor]);

  return (
    <div className="relative w-full h-16 md:h-20 bg-slate-950/70 border border-slate-800/80 rounded-xl overflow-hidden flex items-center justify-center p-2 backdrop-blur-sm shadow-inner">
      <canvas
        ref={canvasRef}
        width={600}
        height={80}
        className="w-full h-full block"
      />
      {/* Glow highlight */}
      {isPlaying && !isPaused && (
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-cyan-500/10 pointer-events-none animate-pulse-glow" />
      )}
    </div>
  );
};
