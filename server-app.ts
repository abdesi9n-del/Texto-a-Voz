import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

export function createExpressApp() {
  const app = express();

  app.use(express.json({ limit: '25mb' }));

  // Helper to get Gemini client dynamically (in serverless, env vars may be injected per invocation)
  const getAiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  };

  // Health / Config endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    const apiKey = process.env.GEMINI_API_KEY;
    res.setHeader('Content-Type', 'application/json');
    res.json({
      status: 'ok',
      hasApiKey: Boolean(apiKey),
    });
  });

  // Available AI Voices metadata
  app.get('/api/tts/voices', (_req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.json({
      voices: [
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
      ],
      styles: [
        { id: 'natural', label: 'Natural & Conversacional', prompt: 'Habla de forma natural, relajada y amigable, con dicción impecable.' },
        { id: 'noticiero', label: 'Presentador de Noticias', prompt: 'Tono formal, seguro, articulado y profesional como presentador de noticias.' },
        { id: 'audiolibro', label: 'Narrador de Audiolibro', prompt: 'Voz expresiva, cautivadora, rica en matices narrativos y tempo envolvente.' },
        { id: 'entusiasta', label: 'Comercial & Enérgico', prompt: 'Tono entusiasta, persuasivo, vibrante y con alta energía para comerciales.' },
        { id: 'meditacion', label: 'Calmado & Meditativo', prompt: 'Tono pausado, respirado, suave, relajante y susurrado para meditación.' },
        { id: 'dramatico', label: 'Dramático / Suspenso', prompt: 'Tono misterioso, con pausas tensas, cadencia teatral y suspenso.' },
      ],
    });
  });

  // Generate single-speaker TTS
  app.post('/api/tts/generate', async (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    try {
      const ai = getAiClient();
      if (!ai) {
        return res.status(503).json({
          error: 'GEMINI_API_KEY no encontrada en las variables de entorno del servidor. Puedes usar las voces del navegador.',
        });
      }

      const {
        text,
        voice = 'Kore',
        styleDescription,
        model = 'gemini-3.8-flash-lite-tts',
      } = req.body || {};

      if (!text || typeof text !== 'string' || !text.trim()) {
        return res.status(400).json({ error: 'Debes proporcionar un texto válido para sintetizar.' });
      }

      const validVoices = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'];
      const selectedVoice = validVoices.includes(voice) ? voice : 'Kore';
      const selectedModel =
        model === 'gemini-3.8-flash-tts'
          ? 'gemini-3.8-flash-tts'
          : 'gemini-3.8-flash-lite-tts';

      const parts: any[] = [
        {
          text: text.trim(),
          ...(styleDescription
            ? {
                speechMetadata: {
                  style: styleDescription,
                },
              }
            : {}),
        },
      ];

      const response = await ai.models.generateContent({
        model: selectedModel,
        contents: [
          {
            role: 'user',
            parts,
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: selectedVoice,
              },
            },
          },
        },
      });

      const candidate = response.candidates?.[0];
      const inlineData = candidate?.content?.parts?.[0]?.inlineData;
      const base64Audio = inlineData?.data;

      if (!base64Audio) {
        return res.status(500).json({
          error: 'No se obtuvo audio en la respuesta del modelo neuronal.',
        });
      }

      return res.json({
        audioBase64: base64Audio,
        mimeType: 'audio/wav',
        voice: selectedVoice,
        model: selectedModel,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error('Error generating audio:', err);
      return res.status(500).json({
        error: err.message || 'Error al generar audio con IA.',
      });
    }
  });

  // Generate multi-speaker dialogue TTS
  app.post('/api/tts/dialogue', async (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    try {
      const ai = getAiClient();
      if (!ai) {
        return res.status(503).json({
          error: 'GEMINI_API_KEY no disponible en el servidor.',
        });
      }

      const {
        dialogues,
        speaker1Name = 'Narrador',
        speaker1Voice = 'Fenrir',
        speaker2Name = 'Entrevistada',
        speaker2Voice = 'Kore',
      } = req.body || {};

      if (!dialogues || !Array.isArray(dialogues) || dialogues.length === 0) {
        return res.status(400).json({ error: 'Proporciona al menos una línea de diálogo.' });
      }

      const parts = dialogues.map((d: { speaker: string; text: string; style?: string }) => ({
        text: `${d.speaker}: ${d.text}`,
        speechMetadata: {
          speaker: d.speaker,
          ...(d.style ? { style: d.style } : {}),
        },
      }));

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-tts',
        contents: [
          {
            role: 'user',
            parts,
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            multiSpeakerVoiceConfig: {
              speakerVoiceConfigs: [
                {
                  speaker: speaker1Name,
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: speaker1Voice },
                  },
                },
                {
                  speaker: speaker2Name,
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: speaker2Voice },
                  },
                },
              ],
            },
          },
        },
      });

      const candidate = response.candidates?.[0];
      const inlineData = candidate?.content?.parts?.[0]?.inlineData;
      const base64Audio = inlineData?.data;

      if (!base64Audio) {
        return res.status(500).json({
          error: 'No se generó el diálogo de audio.',
        });
      }

      return res.json({
        audioBase64: base64Audio,
        mimeType: 'audio/wav',
        speakers: [
          { name: speaker1Name, voice: speaker1Voice },
          { name: speaker2Name, voice: speaker2Voice },
        ],
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error('Error generating dialogue audio:', err);
      return res.status(500).json({
        error: err.message || 'Error al sintetizar el diálogo multi-voz.',
      });
    }
  });

  // Script optimizer / Voice script enhancer using gemini-3.8-flash
  app.post('/api/tts/optimize-script', async (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    try {
      const ai = getAiClient();
      if (!ai) {
        return res.status(503).json({ error: 'GEMINI_API_KEY no disponible.' });
      }

      const { text, targetTone = 'locución natural' } = req.body || {};
      if (!text || !text.trim()) {
        return res.status(400).json({ error: 'Texto requerido.' });
      }

      const prompt = `Actúa como un director de doblaje y locución en español.
Toma el siguiente texto y optimízalo para ser leído en voz alta por un sintetizador de voz (TTS).
Reglas:
1. Convierte cifras, fechas o siglas a su forma fonética hablada natural (ej: "1995" -> "mil novecientos noventa y cinco", "km/h" -> "kilómetros por hora").
2. Añade comas o puntos estratégicos para pausas de respiración y ritmo natural.
3. Mantén el idioma en español y el sentido original intacto.
4. Tono objetivo: ${targetTone}.
5. Devuelve ÚNICAMENTE el texto optimizado listo para leer, sin introducciones, sin comillas adicionales y sin explicaciones.

Texto original:
${text}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });

      return res.json({
        optimizedText: response.text?.trim() || text,
      });
    } catch (err: any) {
      console.error('Error optimizing script:', err);
      return res.status(500).json({
        error: err.message || 'Error optimizando guión.',
      });
    }
  });

  return app;
}

export const app = createExpressApp();
export default app;
