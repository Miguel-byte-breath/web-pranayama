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

Estructura SIEMPRE tu respuesta exactamente así — sin excepciones:
1. Una frase de apertura corta que valide el sentimiento
2. Entre 2 y 4 puntos, cada uno en su propia línea comenzando con "- "
3. Una frase de cierre en cursiva (*así*)

Normas:
- Usa **texto** para resaltar 1-2 palabras clave
- NUNCA respondas en párrafo continuo
- NUNCA omitas los puntos con "- "
- En español. Tono cálido y humano.

Ejemplo de respuesta correcta para "quiero relajarme y sentirme mejor":

Querer parar y cuidarte es ya un primer paso.

- Empieza notando tu respiración tal como está ahora — sin intentar cambiarla.
- Suelta la idea de que tienes que "hacerlo bien". **El descanso es la acción.**
- Una cosa pequeña: agua, luz natural, o dos minutos sin pantalla.

*Estás exactamente donde necesitas estar. El cuerpo sabe cómo volver.*`,
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
