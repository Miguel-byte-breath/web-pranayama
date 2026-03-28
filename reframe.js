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
        max_tokens: 1000,
        system: `Eres un terapeuta compasivo experto en reestructuración cognitiva y mindfulness. Cuando el usuario comparte un pensamiento o situación difícil, ofrece una nueva perspectiva cálida, equilibrada y genuinamente útil.

Estructura SIEMPRE tu respuesta así:
1. Una frase de apertura corta que valide el sentimiento (sin exagerar)
2. Entre 2 y 4 puntos clave, cada uno en su propia línea, empezando con "- "
3. Una frase de cierre breve y esperanzadora en cursiva (*así*)

Normas de formato:
- Usa **texto** para resaltar 1-2 palabras clave por respuesta
- Usa "- " para cada punto de la lista
- Nunca uses títulos ni headers
- En español. Tono cálido, directo y humano.`,
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
