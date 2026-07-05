# 🌬️ Respira

**Aplicación web progresiva de respiración consciente.**  
Minimalista, sin publicidad, sin cuentas. Solo tú y tu respiración.

🔗 **[Pruébala en vivo → web-pranayama.vercel.app](https://web-pranayama.vercel.app)**

---

## ¿Qué es Respira?

Respira es una PWA diseñada para acompañar la práctica de respiración consciente (pranayama). Sin distracciones, sin registro, sin datos que recopilar. Funciona desde el navegador y se puede instalar como app nativa en Android.

El diseño tiene un toque naif y orgánico: fuentes a mano, iconos de trazo suave, colores tierra. La idea es que la herramienta no compita con la práctica.

---

## Funcionalidades

**Respiración guiada**  
Patrones clásicos de pranayama con animación visual y metrónomo orgánico:
- Respiración de caja (4-4-4-4)
- Técnica 4-7-8
- Nadi Shodhana (respiración alterna) con indicador visual de fosa nasal
- Patrón personalizado

**Haz Foco**  
Ruido blanco y frecuencias binaurales para concentración o descanso.

**Paisaje sonoro**  
Ambiente sonoro durante las sesiones (lluvia, naturaleza).

**Píldora de Sabiduría — Los Niyamas**  
Serie de 5 lecciones sobre los principios del yoga interior: Saucha, Santosha, Tapas, Svadhyaya e Ishvara Pranidhana.

**Rincón de Lectura**  
Curación de artículos sobre bienestar y práctica contemplativa.

**Transforma tus Pensamientos**  
Reencuadre cognitivo asistido por IA (Claude de Anthropic) para cambiar el diálogo interno en momentos difíciles.

**Enviar Píldora**  
Comparte una sesión de respiración con alguien por WhatsApp o enlace.

---

## Instalación

**Desde el navegador (Android / iOS)**  
Visita [web-pranayama.vercel.app](https://web-pranayama.vercel.app) → menú del navegador → *Añadir a pantalla de inicio*.

**Google Play Store**  
Disponible próximamente como TWA (Trusted Web Activity) en la Play Store.

---

## Stack técnico

| Capa | Tecnología |
|---|---|
| Frontend | HTML + CSS + JavaScript puro (sin frameworks) |
| PWA | Service Worker con estrategia network-first |
| Despliegue | [Vercel](https://vercel.com) (auto-deploy desde GitHub) |
| IA | [Claude API](https://anthropic.com) (reencuadre cognitivo) |
| Audio | Web Audio API |
| Android nativo | TWA vía [PWABuilder](https://pwabuilder.com) |

---

## Estructura del proyecto

```
web-pranayama/
├── index.html          # HTML estructural
├── style.css           # Todo el CSS (~2400 líneas)
├── app.js              # Todo el JS (~2000 líneas, incluye lógica PWA y contenido)
├── service-worker.js   # SW de la PWA
├── manifest.json       # Manifest PWA
├── privacidad.html     # Política de privacidad
├── api/
│   ├── reframe.js      # Serverless: reencuadre cognitivo con Claude
│   └── shorten.js      # Serverless: acortador de URLs
└── nadi-assets/        # Ilustraciones naif para Nadi Shodhana
```

---

## Privacidad

Respira no recoge ningún dato personal. No hay cuentas, no hay analíticas, no hay cookies de seguimiento.

La función *Transforma tus Pensamientos* envía el texto introducido a la API de Anthropic para generar el reencuadre. Ese texto no se almacena.

→ [Política de privacidad completa](https://web-pranayama.vercel.app/privacidad.html)

---

## Licencia

Proyecto personal. Código compartido con fines de aprendizaje e inspiración.  
Si te resulta útil o quieres adaptarlo, adelante — con mención agradecida 🙏
