// Imagen de vista previa (1200x630) para cada píldora: /api/og?p=4-7-8b&to=María
// La usa la etiqueta og:image de /p/... para que WhatsApp muestre una tarjeta propia.
import { ImageResponse } from '@vercel/og';
import { parsePattern, isValidPattern, cleanName } from './_og/pattern.js';

export const config = { runtime: 'edge' };

// Rutas literales: el empaquetador de Vercel solo incluye los archivos que ve escritos tal cual
const load = url => fetch(url).then(r => r.arrayBuffer());
const fontsP = Promise.all([
  load(new URL('./_og/caveat-700.woff', import.meta.url)),
  load(new URL('./_og/manrope-800.woff', import.meta.url)),
  load(new URL('./_og/manrope-600.woff', import.meta.url)),
]);

// Satori acepta objetos tipo React sin JSX
const h = (type, style, ...children) => {
  const c = children.flat();
  // Satori exige display:flex si children es un array, así que un único hijo va suelto
  return { type, props: { style, children: c.length === 0 ? undefined : c.length === 1 ? c[0] : c } };
};

function orb() {
  const blob = (c1, c2, x, y) => h('div', {
    position: 'absolute', left: x, top: y, width: 230, height: 230, borderRadius: 999,
    backgroundImage: `radial-gradient(circle at 40% 40%, ${c1} 0%, ${c2} 55%, rgba(0,0,0,0) 72%)`, opacity: 0.92,
  });
  return h('div', { position: 'relative', display: 'flex', width: 340, height: 340, flexShrink: 0 },
    h('div', { position: 'absolute', left: -60, top: -60, width: 460, height: 460, borderRadius: 999,
      backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0) 65%)' }),
    blob('#c8e6c9', '#4CAF50', 30, 10),
    blob('#ffe0b2', '#FF9800', 95, 60),
    blob('#bbdefb', '#2196F3', 25, 100),
    h('div', { position: 'absolute', left: 110, top: 110, width: 120, height: 120, borderRadius: 999,
      backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.5) 35%, rgba(255,255,255,0) 70%)' }),
  );
}

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const p = searchParams.get('p') || '';
  const name = cleanName(searchParams.get('to'));
  const phases = isValidPattern(p) ? parsePattern(p) : [];
  const [caveat, manrope800, manrope600] = await fontsP;

  const title = name ? `Para ${name}` : 'Una pausa para ti';
  const titleSize = title.length > 18 ? 76 : title.length > 12 ? 96 : 118;

  const chips = phases.map(ph => h('div', {
    display: 'flex', alignItems: 'baseline', padding: '12px 26px', borderRadius: 999, backgroundColor: ph.c,
    color: '#fff', fontFamily: 'Manrope', fontWeight: 800, fontSize: 32, marginRight: 14, marginBottom: 14,
  }, `${ph.t} ${ph.b}`, ph.mouth ? h('span', { fontWeight: 600, fontSize: 22, marginLeft: 8, opacity: 0.85 }, 'boca') : []));

  const tree = h('div', {
      width: '100%', height: '100%', display: 'flex', alignItems: 'center', padding: '0 70px',
      backgroundColor: '#0d1520',
      backgroundImage: 'radial-gradient(circle at 22% 50%, #22364a 0%, #0d1520 55%), radial-gradient(circle at 90% 10%, rgba(76,175,80,0.25) 0%, rgba(0,0,0,0) 40%)',
    },
    orb(),
    h('div', { display: 'flex', flexDirection: 'column', marginLeft: 50, flex: 1 },
      h('div', { fontFamily: 'Manrope', fontWeight: 600, fontSize: 24, letterSpacing: 6, color: 'rgba(255,255,255,0.6)' },
        'PÍLDORA DE RESPIRACIÓN'),
      h('div', { fontFamily: 'Caveat', fontWeight: 700, fontSize: titleSize, color: '#fff', lineHeight: 1.05, marginTop: 6, marginBottom: 22 },
        title),
      h('div', { display: 'flex', flexWrap: 'wrap' }, chips),
      h('div', { fontFamily: 'Manrope', fontWeight: 600, fontSize: 24, color: 'rgba(255,255,255,0.72)', marginTop: 16 },
        'Toca para abrirla y respirar'),
    ),
  );

  return new ImageResponse(tree, {
    width: 1200, height: 630,
    fonts: [
      { name: 'Caveat', data: caveat, weight: 700, style: 'normal' },
      { name: 'Manrope', data: manrope800, weight: 800, style: 'normal' },
      { name: 'Manrope', data: manrope600, weight: 600, style: 'normal' },
    ],
    headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=604800, immutable' },
  });
}
