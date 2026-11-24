function sendJson(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

async function parseJsonBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Método no permitido. Utiliza POST.' });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return sendJson(res, 503, {
        error:
          'GEMINI_API_KEY no está configurada en Vercel. Ve a Settings > Environment Variables en Vercel, agrega GEMINI_API_KEY y realiza un Redeploy.',
      });
    }

    const body = await parseJsonBody(req);
    const {
      dialogues,
      speaker1Name = 'Narrador',
      speaker1Voice = 'Fenrir',
      speaker2Name = 'Entrevistada',
      speaker2Voice = 'Kore',
    } = body;

    if (!dialogues || !Array.isArray(dialogues) || dialogues.length === 0) {
      return sendJson(res, 400, {
        error: 'Proporciona al menos una línea de diálogo.',
      });
    }

    const parts = dialogues.map((d) => ({
      text: `${d.speaker}: ${d.text}`,
      speechMetadata: {
        speaker: d.speaker,
        ...(d.style ? { style: d.style } : {}),
      },
    }));

    const contents = [
      {
        role: 'user',
        parts,
      },
    ];

    const speechConfig = {
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
    };

    let base64Audio = null;
    let audioMimeType = 'audio/wav';

    try {
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-tts',
        contents,
        config: {
          responseModalities: ['AUDIO'],
          speechConfig,
        },
      });

      const partsList = response.candidates?.[0]?.content?.parts || [];
      const audioPart = partsList.find((p) => p.inlineData?.data);
      base64Audio = audioPart?.inlineData?.data || null;
      if (audioPart?.inlineData?.mimeType) {
        audioMimeType = audioPart.inlineData.mimeType;
      }
    } catch (sdkErr) {
      console.warn('SDK dialogue failed, trying REST API:', sdkErr?.message);
      const restRes = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash-tts:generateContent',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          body: JSON.stringify({
            contents,
            generationConfig: {
              responseModalities: ['AUDIO'],
              speechConfig,
            },
          }),
        }
      );

      const restJson = await restRes.json();
      if (!restRes.ok) {
        throw new Error(
          restJson?.error?.message ||
            sdkErr?.message ||
            'Error al sintetizar el diálogo multi-voz.'
        );
      }

      const partsList = restJson?.candidates?.[0]?.content?.parts || [];
      const audioPart = partsList.find((p) => p.inlineData?.data);
      base64Audio = audioPart?.inlineData?.data || null;
      if (audioPart?.inlineData?.mimeType) {
        audioMimeType = audioPart.inlineData.mimeType;
      }
    }

    if (!base64Audio) {
      return sendJson(res, 500, {
        error: 'No se generó el diálogo de audio.',
      });
    }

    return sendJson(res, 200, {
      audioBase64: base64Audio,
      mimeType: audioMimeType,
      speakers: [
        { name: speaker1Name, voice: speaker1Voice },
        { name: speaker2Name, voice: speaker2Voice },
      ],
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Error en /api/tts/dialogue:', err);
    return sendJson(res, 500, {
      error: err?.message || 'Error al sintetizar el diálogo multi-voz.',
    });
  }
}
