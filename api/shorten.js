export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { url } = req.body;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL requerida' });
  }

  try {
    const response = await fetch(
      `https://is.gd/create.php?format=simple&url=${encodeURIComponent(url)}`
    );
    if (!response.ok) throw new Error('is.gd error');
    const short = await response.text();
    return res.status(200).json({ short: short.trim() });
  } catch (e) {
    // Fallback: devolver la URL original si is.gd falla
    return res.status(200).json({ short: url });
  }
}
