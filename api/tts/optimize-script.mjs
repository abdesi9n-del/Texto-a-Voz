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
      return sendJson(res, 503, { error: 'GEMINI_API_KEY no disponible.' });
    }

    const body = await parseJsonBody(req);
    const { text, targetTone = 'locución natural' } = body;
    if (!text || !text.trim()) {
      return sendJson(res, 400, { error: 'Texto requerido.' });
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

    let optimizedText = null;

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
        model: 'gemini-3.8-flash',
        contents: prompt,
      });

      optimizedText = response.text?.trim() || null;
    } catch (sdkErr) {
      console.warn('SDK optimize-script failed, trying REST API:', sdkErr?.message);
      const restRes = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
          }),
        }
      );
      const restJson = await restRes.json();
      if (!restRes.ok) {
        throw new Error(
          restJson?.error?.message ||
            sdkErr?.message ||
            'Error optimizando guión.'
        );
      }
      optimizedText =
        restJson?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
    }

    return sendJson(res, 200, {
      optimizedText: optimizedText || text,
    });
  } catch (err) {
    console.error('Error en /api/tts/optimize-script:', err);
    return sendJson(res, 500, {
      error: err?.message || 'Error optimizando guión.',
    });
  }
}
