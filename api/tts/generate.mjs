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
          'GEMINI_API_KEY no está configurada en Vercel. Ve a Settings > Environment Variables en Vercel, agrega GEMINI_API_KEY y realiza un Redeploy. Mientras tanto, puedes usar el motor del Navegador.',
      });
    }

    const body = await parseJsonBody(req);
    const {
      text,
      voice = 'Kore',
      styleDescription,
      model = 'gemini-3.8-flash-lite-tts',
    } = body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return sendJson(res, 400, {
        error: 'Debes proporcionar un texto válido para sintetizar.',
      });
    }

    const validVoices = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'];
    const selectedVoice = validVoices.includes(voice) ? voice : 'Kore';
    const selectedModel =
      model === 'gemini-3.8-flash-tts'
        ? 'gemini-3.8-flash-tts'
        : 'gemini-3.8-flash-lite-tts';

    const parts = [
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

    const payload = {
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
        model: selectedModel,
        contents: payload.contents,
        config: payload.config,
      });

      const partsList = response.candidates?.[0]?.content?.parts || [];
      const audioPart = partsList.find((p) => p.inlineData?.data);
      base64Audio = audioPart?.inlineData?.data || null;
      if (audioPart?.inlineData?.mimeType) {
        audioMimeType = audioPart.inlineData.mimeType;
      }
    } catch (sdkErr) {
      console.warn('SDK call failed, trying direct REST API:', sdkErr?.message);
      const restRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          body: JSON.stringify({
            contents: payload.contents,
            generationConfig: {
              responseModalities: ['AUDIO'],
              speechConfig: payload.config.speechConfig,
            },
          }),
        }
      );

      const restJson = await restRes.json();
      if (!restRes.ok) {
        throw new Error(
          restJson?.error?.message ||
            sdkErr?.message ||
            'Error al comunicarse con la API de Gemini.'
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
        error: 'No se obtuvo audio en la respuesta del modelo neuronal.',
      });
    }

    return sendJson(res, 200, {
      audioBase64: base64Audio,
      mimeType: audioMimeType,
      voice: selectedVoice,
      model: selectedModel,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Error en /api/tts/generate:', err);
    return sendJson(res, 500, {
      error: err?.message || 'Error al generar audio con IA.',
    });
  }
}
