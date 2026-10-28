import React from 'react';
import { BookOpen, Newspaper, Megaphone, Heart, MessageSquare } from 'lucide-react';
import { EngineType } from '../types';

interface PresetSelectorProps {
  onSelectPreset: (preset: {
    title: string;
    text: string;
    suggestedVoice: string;
    styleId: string;
    isDialogue?: boolean;
    dialogues?: Array<{ speaker: string; text: string }>;
  }) => void;
}

export const PRESETS = [
  {
    id: 'literatura',
    title: 'Cuento Fantástico',
    icon: BookOpen,
    badge: 'Narración',
    suggestedVoice: 'Kore',
    styleId: 'audiolibro',
    text: 'En lo profundo del valle esmeralda, entre la bruma que descendía de las montañas al amanecer, una extraña melodía comenzó a resonar. No era el canto de las aves ni el susurro del viento entre los sauces, sino algo más antiguo, como si la propia tierra despertara de un sueño centenario.',
  },
  {
    id: 'noticia',
    title: 'Noticia Tecnológica',
    icon: Newspaper,
    badge: 'Informativo',
    suggestedVoice: 'Fenrir',
    styleId: 'noticiero',
    text: 'Última hora: Investigadores internacionales han presentado un nuevo modelo de inteligencia artificial capaz de sintetizar emociones humanas en audio con una naturalidad sin precedentes. Este avance promete transformar la accesibilidad digital y la educación inclusiva en todo el mundo.',
  },
  {
    id: 'comercial',
    title: 'Spot Publicitario',
    icon: Megaphone,
    badge: 'Dinámico',
    suggestedVoice: 'Puck',
    styleId: 'entusiasta',
    text: '¿Listo para llevar tu creatividad al siguiente nivel? Conoce la nueva experiencia donde tus ideas cobran vida en segundos. ¡Pruébalo hoy gratis y descubre de lo que eres capaz!',
  },
  {
    id: 'meditacion',
    title: 'Meditación Guiada',
    icon: Heart,
    badge: 'Calma',
    suggestedVoice: 'Zephyr',
    styleId: 'meditacion',
    text: 'Cierra suavemente los ojos. Inhala profundamente por la nariz ... siente cómo el aire fresco llena tus pulmones ... y exhala lentamente, soltando cualquier tensión acumulada. Permítete disfrutar de este instante de paz.',
  },
  {
    id: 'dialogo',
    title: 'Diálogo Podcast',
    icon: MessageSquare,
    badge: '2 Voces',
    suggestedVoice: 'Fenrir',
    styleId: 'natural',
    isDialogue: true,
    dialogues: [
      {
        speaker: 'Carlos',
        text: '¡Bienvenidos a nuestro episodio especial! Hoy vamos a hablar de cómo el texto a voz ha evolucionado en los últimos años.',
      },
      {
        speaker: 'Lucía',
        text: '¡Exacto Carlos! Antes sonaba robótico, pero hoy las voces neuronales respiran, modulan y transmiten emociones reales.',
      },
      {
        speaker: 'Carlos',
        text: 'Y lo mejor es que cualquiera puede convertir sus artículos o guiones en audiolibros profesionales en cuestión de segundos.',
      },
    ],
    text: 'Carlos: ¡Bienvenidos a nuestro episodio especial! Lucía: ¡Exacto Carlos! Las voces neuronales respiran y transmiten emociones reales.',
  },
];

export const PresetSelector: React.FC<PresetSelectorProps> = ({ onSelectPreset }) => {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
      <span className="text-xs font-semibold text-slate-400 shrink-0">
        Ejemplos rápidos:
      </span>
      {PRESETS.map((preset) => {
        const Icon = preset.icon;
        return (
          <button
            key={preset.id}
            onClick={() => onSelectPreset(preset)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 hover:text-white transition whitespace-nowrap shrink-0 group active:scale-95"
          >
            <Icon className="w-3.5 h-3.5 text-indigo-400 group-hover:text-indigo-300 transition" />
            <span>{preset.title}</span>
            <span className="text-[10px] text-slate-400 px-1 py-0.2 rounded bg-slate-950/80 font-mono">
              {preset.badge}
            </span>
          </button>
        );
      })}
    </div>
  );
};
