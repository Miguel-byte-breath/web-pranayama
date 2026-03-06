export default async function handler(req, res) {
  // Solo permitir POST
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
        max_tokens: 300,
        system: `Eres un acompañante compasivo experto en reestructuración cognitiva y mindfulness.
Cuando el usuario comparte un pensamiento negativo, ansioso o difícil, tu tarea es:
1. Validar brevemente el sentimiento (sin exagerar)
2. Ofrecer UNA perspectiva nueva, más compasiva y equilibrada del mismo pensamiento
3. Ser cálido, cercano y genuinamente útil

Responde SOLO con el pensamiento reencuadrado, sin introducciones ni explicaciones.
Máximo 3 frases. En español. Usa un tono cálido y esperanzador pero realista.`,
        messages: [{ role: 'user', content: thought.trim() }],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Anthropic API error:', error);
      return res.status(502).json({ error: 'Error al conectar con la IA' });
    }

    const data = await response.json();
    const reframed = data.content?.map(b => b.text || '').join('') || '';

    return res.status(200).json({ reframed });

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}
