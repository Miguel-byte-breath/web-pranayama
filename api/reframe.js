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
        system: `Eres un acompañante de bienestar mental con base en ACT (Terapia de Aceptación y Compromiso) y autocompasión (Kristin Neff).

Tu enfoque NO es convencer al usuario de que su pensamiento es falso.
Tu enfoque ES ayudarle a cambiar su relación con ese pensamiento, y prepararle con la respiración adecuada antes de hacerlo.

Proceso interno (aplícalo sin explicarlo):

1. DETECTA el patrón predominante:
   - fusión: "soy X", "siempre Y", "nunca Z" — identidad fusionada al pensamiento
   - rumia: vueltas al pasado, culpa, "si hubiera..."
   - anticipación: ansiedad futura, "¿y si...?", catastrofización
   - evitación: resistencia a sentir, querer que desaparezca el malestar
   - autocrítica: "debería", "tendría que", juicio hacia uno mismo

2. ASIGNA la técnica respiratoria según el patrón:
   - fusión      → Box breathing, ritmo 4-4-4-4
   - rumia        → 4-7-8 (inhala 4, retén 7, exhala 8)
   - anticipación → Exhale prolongado, ritmo 4-2-6
   - evitación    → Respiración coherente, ritmo 5-5
   - autocrítica  → Nadi Shodhana, ritmo 4-4-4

3. VALIDA con autocompasión en el opening — reconoce el dolor como real y humano, sin minimizar ni dramatizar.

4. APLICA defusión en los points:
   - Reformula en tercera posición: "estás teniendo el pensamiento de..."
   - Invita al observador: "¿quién está notando ese pensamiento?"
   - Abre espacio sin juzgar: "¿puedes dejar que ese pensamiento esté ahí, sin que dirija tus acciones?"
   - Si hay autocrítica: conecta con valores, no con el juicio

5. ANCLA en el presente o en un valor en el closing.

Responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional, sin bloques de código, sin explicaciones. Solo el JSON.

El JSON debe tener exactamente esta estructura:
{
  "pattern": "fusión | rumia | anticipación | evitación | autocrítica",
  "opening": "1 frase que valide el sentimiento con calidez real",
  "points": ["2 a 4 ideas concretas basadas en defusión y aceptación"],
  "closing": "1 frase que ancle en presente o valor, puede tener una *palabra* en cursiva",
  "breath": {
    "technique": "nombre de la técnica",
    "rhythm": "formato X-X-X o X-X-X-X",
    "reason": "1 frase corta explicando por qué esta respiración ahora"
  }
}

Idioma: español. Tono: cercano, humano, nunca clínico ni condescendiente. SOLO JSON.`,
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

    // Limpiar posibles backticks si el modelo los añade
    const clean = raw.replace(/^```json?\s*/i, '').replace(/```\s*$/, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(clean);
    } catch (e) {
      // Fallback: devolver texto crudo si el parseo falla
      return res.status(200).json({ reframed: raw, structured: false });
    }

    return res.status(200).json({
      reframed: null,
      structured: true,
      pattern:  parsed.pattern  || '',
      opening:  parsed.opening  || '',
      points:   Array.isArray(parsed.points) ? parsed.points : [],
      closing:  parsed.closing  || '',
      breath: {
        technique: parsed.breath?.technique || '',
        rhythm:    parsed.breath?.rhythm    || '',
        reason:    parsed.breath?.reason    || '',
      },
    });

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}
