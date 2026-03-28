export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { thought } = req.body;

  if (!thought || typeof thought !== 'string' || thought.trim().length === 0) {
    return res.status(400).json({ error: 'El campo "thought" es requerido' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: `Eres un terapeuta compasivo experto en reestructuración cognitiva y mindfulness.

Responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional, sin bloques de código, sin explicaciones. Solo el JSON.

El JSON debe tener exactamente esta estructura:
{
  "opening": "Una frase corta que valide el sentimiento del usuario",
  "points": ["Punto 1", "Punto 2", "Punto 3"],
  "closing": "Una frase de cierre breve y esperanzadora"
}

Reglas:
- "opening": 1 frase, cálida, que reconozca lo que siente
- "points": entre 2 y 4 strings, cada uno una idea concreta y útil
- "closing": 1 frase inspiradora, puede incluir una palabra en *cursiva* con asteriscos
- En español. Tono humano, cercano y esperanzador.
- SOLO JSON. Nada más.`,
        messages: [{ role: 'user', content: thought.trim() }],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Anthropic API error:', error);
      return res.status(502).json({ error: 'Error al conectar con la IA' });
    }

    const data = await response.json();
    const raw = data.content?.map(b => b.text || '').join('').trim() || '';

    // Parsear JSON — limpiar posibles backticks si el modelo los añade
    const clean = raw.replace(/^```json?\s*/i, '').replace(/```\s*$/, '').trim();
    let parsed;
    try {
      parsed = JSON.parse(clean);
    } catch(e) {
      // Fallback: devolver el texto crudo si el parseo falla
      return res.status(200).json({ reframed: raw, structured: false });
    }

    return res.status(200).json({
      reframed: null,
      structured: true,
      opening: parsed.opening || '',
      points: Array.isArray(parsed.points) ? parsed.points : [],
      closing: parsed.closing || '',
    });

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}
