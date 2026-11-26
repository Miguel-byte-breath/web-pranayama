// Página de cada píldora: /p/4-7-8b/María (vercel.json la reescribe a /api/pill?p=...&to=...)
// Sirve las etiquetas Open Graph de ESA píldora (WhatsApp muestra la tarjeta con su imagen)
// y manda al instante a la app, que abre el sobre como siempre.
import { parsePattern, isValidPattern, cleanName } from './_og/pattern.js';

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export default function handler(req, res) {
  const p = String(req.query.p || '');
  const name = cleanName(req.query.to);

  if (!isValidPattern(p)) {
    res.setHeader('Cache-Control', 'no-store');
    return res.redirect(302, '/');
  }

  const qs = `p=${encodeURIComponent(p)}${name ? `&to=${encodeURIComponent(name)}` : ''}`;
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const origin = `https://${host}`;
  const appUrl = `/?${qs}`;
  const image = `${origin}/api/og?${qs}`;
  const pasos = parsePattern(p).map(ph => `${ph.t} ${ph.b}${ph.mouth ? ' por la boca' : ''}`).join(' · ');
  const title = name ? `Una píldora de respiración para ${name}` : 'Te han enviado una píldora de respiración';
  const desc = `${pasos}. Ábrela y respira.`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=86400');
  res.status(200).send(`<!DOCTYPE html>
<html lang="es"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Respira">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${esc(image)}">
<meta property="og:image:type" content="image/png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:url" content="${esc(origin + req.url)}">
<meta name="twitter:card" content="summary_large_image">
<meta http-equiv="refresh" content="0; url=${esc(appUrl)}">
<style>body{margin:0;background:#0d1520;color:#fff;font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh}a{color:#81c784}</style>
</head><body>
<p>Abriendo tu píldora… <a href="${esc(appUrl)}">toca aquí si no se abre</a></p>
<script>location.replace(${JSON.stringify(appUrl)});</script>
</body></html>`);
}
