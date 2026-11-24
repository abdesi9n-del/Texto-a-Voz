export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  res.statusCode = 200;
  res.end(
    JSON.stringify({
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
    })
  );
}
