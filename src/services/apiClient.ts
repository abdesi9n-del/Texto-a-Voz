/**
 * Safe API client that handles JSON and non-JSON responses gracefully
 * prevents "Unexpected token 'T', 'The page c'... is not valid JSON" errors
 * when deployed to static hosts like Vercel without backend configured.
 */

export async function safeFetchJson<T = any>(
  url: string,
  options?: RequestInit
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, options);
  } catch (netErr: any) {
    throw new Error(
      `No se pudo conectar con el servidor: ${netErr?.message || 'Error de red'}`
    );
  }

  const contentType = res.headers.get('content-type') || '';
  const text = await res.text();

  let data: any = null;
  const isLikelyJson =
    contentType.includes('application/json') ||
    text.trim().startsWith('{') ||
    text.trim().startsWith('[');

  if (isLikelyJson) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    if (data && data.error) {
      throw new Error(data.error);
    }

    if (res.status === 404) {
      throw new Error(
        'El endpoint de IA no está disponible en este servidor (404). ' +
          'Si estás en Vercel, asegúrate de haber configurado GEMINI_API_KEY en las variables de entorno. ' +
          'Puedes usar el motor del Navegador (Web Speech API) sin costo ni configuración.'
      );
    }

    if (res.status === 503) {
      throw new Error(
        data?.error ||
          'El servicio de IA no está configurado (falta GEMINI_API_KEY). Puedes usar las voces locales del navegador.'
      );
    }

    // If it returned HTML (e.g., Vercel error page)
    if (text.includes('<!DOCTYPE') || text.includes('<html') || text.includes('The page could not be found')) {
      throw new Error(
        `Error del servidor (${res.status}): No se encontró la ruta de la API. Cambiando al motor local del navegador.`
      );
    }

    throw new Error(
      `Error del servidor (${res.status}): ${text.slice(0, 150) || res.statusText}`
    );
  }

  if (!data) {
    throw new Error(
      'La respuesta del servidor no tiene un formato JSON válido.'
    );
  }

  return data as T;
}
