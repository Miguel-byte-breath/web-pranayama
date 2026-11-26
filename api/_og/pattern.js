// Traduce "4-7-8b" a fases legibles. Misma lógica que parsePatternString() en app.js.
const DEFS = [
  { t: 'Inhala', c: '#4CAF50', air: true },
  { t: 'Mantén', c: '#FF9800' },
  { t: 'Exhala', c: '#2196F3', air: true },
  { t: 'Sostén', c: '#FF9800' },
  { t: 'Pausa',  c: '#FF9800' },
];

export function parsePattern(str) {
  const out = [];
  String(str || '').split('-').forEach((chunk, i) => {
    const b = parseInt(chunk.replace(/[^0-9]/g, ''), 10);
    if (!isNaN(b) && b > 0) {
      const d = DEFS[i % DEFS.length];
      out.push({ t: d.t, b, c: d.c, mouth: d.air && /b/i.test(chunk) });
    }
  });
  return out;
}

export const isValidPattern = p => /^[0-9bB-]{1,20}$/.test(p || '') && parsePattern(p).length >= 2;
export const cleanName = n => String(n || '').replace(/[<>"'&\/\\]/g, '').trim().slice(0, 24);
