export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { url } = req.body;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL requerida' });
  }

  try {
    const response = await fetch('https://cleanuri.com/api/v1/shorten', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `url=${encodeURIComponent(url)}`
    });
    if (!response.ok) throw new Error('cleanuri error');
    const data = await response.json();
    if (!data.result_url) throw new Error('sin resultado');
    return res.status(200).json({ short: data.result_url });
  } catch (e) {
    // Fallback: devolver la URL original si cleanuri falla
    return res.status(200).json({ short: url });
  }
}
