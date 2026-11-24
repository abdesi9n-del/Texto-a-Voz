export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  res.statusCode = 200;
  res.end(
    JSON.stringify({
      status: 'ok',
      message: 'VocalStudio API Serverless está activo',
      hasApiKey: Boolean(apiKey),
      endpoints: [
        '/api/health',
        '/api/tts/voices',
        '/api/tts/generate',
        '/api/tts/dialogue',
        '/api/tts/optimize-script',
      ],
    })
  );
}
