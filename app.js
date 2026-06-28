    // --- VARIABLES Y CONFIGURACIÓN ---
    const C_INHALE = '#4CAF50';
    const C_HOLD = '#FF9800';
    const C_EXHALE = '#2196F3';

    // --- AUDIO AMBIENTAL ---
    const ambientAudio = new Audio('ambient.mp3');
    ambientAudio.loop = true;
    ambientAudio.volume = 0.5;

    let patterns = {
        '4-4-6-2': [
            {t:'INHALA', b:4, y:'rise', c:C_INHALE, m:'nose'},
            {t:'MANTÉN', b:4, y:'holdhigh', c:C_HOLD, m:'nose'},
            {t:'EXHALA', b:6, y:'fall', c:C_EXHALE, m:'nose'},
            {t:'SOSTÉN', b:2, y:'holdlow', c:C_HOLD, m:'nose'}
        ],
        '4-7-8b': [
            {t:'INHALA', b:4, y:'rise', c:C_INHALE, m:'nose'},
            {t:'MANTÉN', b:7, y:'holdhigh', c:C_HOLD, m:'nose'},
            {t:'EXHALA', b:8, y:'fall', c:C_EXHALE, m:'mouth'}
        ],
        'box': [
            {t:'INHALA', b:4, y:'rise', c:C_INHALE, m:'nose'},
            {t:'MANTÉN', b:4, y:'holdhigh', c:C_HOLD, m:'nose'},
            {t:'EXHALA', b:4, y:'fall', c:C_EXHALE, m:'nose'},
            {t:'SOSTÉN', b:4, y:'holdlow', c:C_HOLD, m:'nose'}
        ],
        '5-5': [
            {t:'INHALA', b:5, y:'rise', c:C_INHALE, m:'nose'},
            {t:'EXHALA', b:5, y:'fall', c:C_EXHALE, m:'nose'}
        ]
    };

    // --- FRASES ZEN ---
    const pSubjects = ['El río antiguo', 'La brisa suave', 'El bambú flexible', 'La montaña quieta', 'Tu mente clara', 'El momento presente', 'La hoja seca', 'El agua profunda', 'Este aliento', 'La nube blanca', 'El vacío fértil', 'La raíz fuerte', 'El amor inmenso', 'La belleza oculta', 'Tu corazón sabio', 'La flor del alma', 'La luz interior'];
    const pActions = ['fluye sin esfuerzo', 'no opone resistencia', 'se dobla sin romperse', 'observa en silencio', 'refleja el cielo', 'encuentra su camino', 'suelta el control', 'descansa en paz', 'existe sin más', 'acepta el cambio', 'danza con el viento', 'crece despacio', 'abraza lo que es', 'florece sin prisa', 'sana las heridas', 'irradia calidez', 'ama sin apego', 've la verdad'];
    const pConclusions = ['Sé como el agua.', 'Todo es perfecto.', 'Paz infinita.', 'Vuelve al centro.', 'Nada que hacer.', 'Mente serena.', 'Simple y puro.', 'Aquí y ahora.', 'Conecta contigo.', 'Fluye con todo.', 'Amor es todo.', 'Belleza pura.', 'Eres el amor.', 'Suelta y confía.', 'Eres suficiente.', 'Luz radiante.'];
    const masterQuotes = ['El vacío es forma, la forma es vacío.', 'Si te doblas como el junco, el viento no te romperá.', 'El viaje de mil millas comienza con un aliento.', 'Conoce lo blanco, pero conserva lo negro.', 'Sé el valle del universo, recíbelo todo.', 'Poco a poco, el barro se asienta y el agua se aclara.', 'Haz nada, y nada quedará sin hacer.', 'El amor no reclama posesión, sino que da libertad.', 'La belleza no está en el rostro, sino en la luz del corazón.', 'Aceptar es el verdadero acto de transformación.'];

    function getWuWeiQuote() {
        if(Math.random() < 0.3) {
            return masterQuotes[Math.floor(Math.random() * masterQuotes.length)];
        } else {
            const s = pSubjects[Math.floor(Math.random() * pSubjects.length)];
            const a = pActions[Math.floor(Math.random() * pActions.length)];
            const c = pConclusions[Math.floor(Math.random() * pConclusions.length)];
            return `${s} ${a}. ${c}`;
        }
    }

    // STATE V1.3.0 Quotes ENABLED by default
    let state = {pk:null, data:[], dur:0, tempo:1.0, run:false, paused:false, startAudioTime:0, cyc:0, snd:false, met:false, quotesEnabled: true, music: true};

    let audioCtx = null;
    let nextNoteTime = 0.0;
    let currentBeatIndex = 0;
    let scheduleTimerID = null;
    const lookahead = 25.0;
    const scheduleAheadTime = 0.1;

    // --- DOM REFERENCES ---
    const els = {
        menu: document.getElementById('selectionMenu'),
        sph: document.getElementById('sphere'),
        ph: document.getElementById('phaseText'),
        cnt: document.getElementById('counterText'),
        qt: document.getElementById('phraseContent'),
        cvs: document.getElementById('breathGraph'),
        ctx: document.getElementById('breathGraph').getContext('2d'),
        cyc: document.getElementById('cycleBadge'),
        pat: document.getElementById('patternDisplay'),
        load: document.getElementById('loadingOverlay'),
        shareModal: document.getElementById('shareModal'),
        shareText: document.getElementById('shareText'),
        customOverlay: document.getElementById('customOverlay'),
        customInput: document.getElementById('customPatternInput'),
        shareConfigOverlay: document.getElementById('shareConfigOverlay'),
        pillPatternInput: document.getElementById('pillPatternInput'),
        pillNameInput: document.getElementById('pillNameInput'),
        pillMessageInput: document.getElementById('pillMessageInput'),
        modeIcon: document.getElementById('modeIcon')
    };

    function formatPatternInput(input) {
        let raw = input.value.replace(/[^0-9bBg]/g, '').toLowerCase();
        let formatted = '';
        for(let i=0; i < raw.length; i++) {
            const char = raw[i];
            const isDigit = /[0-9]/.test(char);
            if(isDigit) {
                if(formatted.length > 0) formatted += '-';
                formatted += char;
            } else {
                if(formatted.length > 0 && formatted.slice(-1) !== 'b') formatted += char;
            }
        }
        input.value = formatted;
    }

    if(els.customInput) {
        els.customInput.addEventListener('input', e => formatPatternInput(e.target));
    }

    if(els.pillPatternInput) {
        els.pillPatternInput.addEventListener('input', e => formatPatternInput(e.target));
    }

    window.toggleTooltip = function(el) {
        const tip = el.querySelector('.info-tooltip');
        if(tip) tip.classList.toggle('visible');
    };

    let deferredPrompt;
    const installBtn = document.getElementById('installBtn');

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        installBtn.style.display = 'flex';
    });

    // Cuando el sistema confirma la instalación, guardamos el flag
    window.addEventListener('appinstalled', () => {
        localStorage.setItem('respira_installed', '1');
        deferredPrompt = null;
        installBtn.style.display = 'none';
    });

    async function installApp() {
        const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) ||
                      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        if (isIOS) {
            alert('Para instalar en iPhone/iPad:\n\n1. Pulsa el botón compartir ↑ (barra inferior de Safari)\n2. Pulsa "Añadir a pantalla de inicio"\n3. Pulsa "Añadir"\n\n💡 Si ya la tienes instalada, ábrela desde tu pantalla de inicio.');
            return;
        }
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            deferredPrompt = null;
            if (outcome === 'accepted') {
                localStorage.setItem('respira_installed', '1');
                installBtn.style.display = 'none';
            }
            return;
        }
        // Standalone: abierta desde la app instalada
        if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
            alert('¡La app ya está instalada en tu dispositivo! 🎉');
            return;
        }
        // Flag local: instaló en este navegador/dispositivo
        if (localStorage.getItem('respira_installed') === '1') {
            alert('¡La app ya está instalada! 🎉\nÁbrela desde el menú Inicio, escritorio o barra de tareas.');
            return;
        }
        // Sin señal clara — mensaje neutro sin bucle
        alert('Si ya tienes la app instalada, ábrela desde el menú Inicio o escritorio.\n\nSi no la tienes aún, recarga la página y pulsa de nuevo.');
    }

    function openCustomModal() {
        els.customOverlay.style.display = 'flex';
        els.customInput.value = '';
        els.customInput.focus();
    }

    function parsePatternString(str) {
        const chunks = str.split('-');
        const defs = [
            {t:'INHALA', y:'rise', c:C_INHALE},
            {t:'MANTÉN', y:'holdhigh', c:C_HOLD},
            {t:'EXHALA', y:'fall', c:C_EXHALE},
            {t:'SOSTÉN', y:'holdlow', c:C_HOLD},
            {t:'PAUSA', y:'holdlow', c:C_HOLD}
        ];
        let newPattern = [];
        chunks.forEach((chunk, i) => {
            let beats = parseInt(chunk.replace(/[^0-9]/g, ''));
            if(!isNaN(beats) && beats > 0) {
                let mode = 'nose';
                if(chunk.toLowerCase().includes('b')) mode = 'mouth';
                let defIdx = i % defs.length;
                newPattern.push({t: defs[defIdx].t, b: beats, y: defs[defIdx].y, c: defs[defIdx].c, m: mode});
            }
        });
        return newPattern;
    }
    // Exponer al scope global para que startWinterMode pueda usarla
    window._parsePatternString = parsePatternString;
    window._patterns = patterns;

    function startCustom() {
        const val = els.customInput.value.trim();
        const newPattern = parsePatternString(val);
        if(newPattern.length < 2) {
            alert('Introduce al menos 2 fases válidas.');
            return;
        }
        patterns['custom'] = newPattern;
        els.customOverlay.style.display = 'none';
        start('custom');
    }

    function initAudio() {
        if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if(audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
    }

    function playTone(freq, type, dur, time) {
        if(!state.snd && !state.met) return;
        try {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, time);
            let vol = 0.0;
            if(state.snd) vol = 0.05;
            if(state.met && type === 'square') vol = 0.05;
            if(state.met && state.snd && type === 'square') vol = 0.08;
            gain.gain.setValueAtTime(vol, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(time);
            osc.stop(time + dur);
        } catch(e) {}
    }

    function scheduleNote(beatNumber, time) {
        if(state.paused) return;
        let accumulatedBeats = 0;
        let phase = null;
        let beatInPhase = 0;
        for(let p of state.data) {
            if(beatNumber >= accumulatedBeats && beatNumber < accumulatedBeats + p.b) {
                phase = p;
                beatInPhase = beatNumber - accumulatedBeats + 1;
                break;
            }
            accumulatedBeats += p.b;
        }
        if(phase) {
            if(beatInPhase === 1) {
                let freq = 440;
                if(phase.y === 'rise') freq = 300;
                else if(phase.y === 'holdhigh') freq = 450;
                else if(phase.y === 'fall') freq = 400;
                else freq = 250;
                playTone(freq, 'sine', 0.2, time);
            }
            if(state.met) {
                playTone(beatInPhase === 1 ? 1200 : 800, 'square', 0.05, time);
            }
        }
    }

    function nextBeat() {
        if(state.paused) return;
        const secondsPerBeat = state.tempo;
        nextNoteTime += secondsPerBeat;
        currentBeatIndex++;
        const totalBeats = state.data.reduce((acc, p) => acc + p.b, 0);
        if(currentBeatIndex >= totalBeats) {
            currentBeatIndex = 0;
            state.cyc++;
            if(state.quotesEnabled) updateQuote();
        }
    }

    function updateQuote() {
        const rawQuote = getWuWeiQuote();
        els.qt.innerHTML = rawQuote.replace('. ', '.<br>');
    }

    function scheduler() {
        if(state.run) {
            if(!state.paused) {
                while(nextNoteTime < audioCtx.currentTime + scheduleAheadTime) {
                    scheduleNote(currentBeatIndex, nextNoteTime);
                    nextBeat();
                }
            } else {
                nextNoteTime = audioCtx.currentTime;
            }
            scheduleTimerID = setTimeout(scheduler, lookahead);
        }
    }

    function togglePause() {
        if(!state.run) return;
        state.paused = !state.paused;
        if(state.paused) {
            els.ph.textContent = 'PAUSA';
            els.ph.style.color = '#78909c';
            els.modeIcon.style.opacity = 0.5;
        } else {
            nextNoteTime = audioCtx.currentTime;
        }
    }

    // --- V1.3.0 LOGICA TOGGLE FRASES ---
    function toggleQuotes() {
        state.quotesEnabled = !state.quotesEnabled;
        const btn = document.getElementById('quoteToggleBtn');
        if(state.quotesEnabled) {
            // ENCENDIDO: Botón brilla, frase aparece y se actualiza
            btn.classList.add('active');
            updateQuote(); // Cargar nueva frase al encender
            els.qt.style.opacity = '1';
        } else {
            // APAGADO: Botón normal, frase se desvanece pero el hueco queda
            btn.classList.remove('active');
            els.qt.style.opacity = '0';
        }
    }

    function draw() {
        if(!state.run) return;
        if(state.paused) {
            requestAnimationFrame(draw);
            return;
        }
        const currentTime = audioCtx.currentTime;
        const elapsed = currentTime - state.startAudioTime;
        const totalCycleDur = state.dur;
        const cycleCountVisual = Math.floor(elapsed / totalCycleDur);
        els.cyc.textContent = cycleCountVisual;
        const timeInCycle = (elapsed % totalCycleDur);
        const p = state.data.find(x => timeInCycle >= x.start && timeInCycle < x.end);
        
        if(p) {
            // Actualizar textos y colores si cambian
            if(els.ph.textContent !== p.t) {
                els.ph.textContent = p.t;
                els.ph.style.color = p.c;
            }
            
            // Iconos
            const isHold = (p.y === 'holdhigh' || p.y === 'holdlow');
            if(isHold) {
                els.modeIcon.textContent = '⏸';
                els.modeIcon.classList.add('visible');
            } else if(p.m === 'mouth') {
                els.modeIcon.textContent = '💨';
                els.modeIcon.classList.add('visible');
            } else {
                els.modeIcon.textContent = '👃';
                els.modeIcon.classList.add('visible');
            }
            els.sph.style.setProperty('--c-phase', p.c);
            
            // Indicador de pasos (puntos abajo)
            const currentPhaseIdx = state.data.indexOf(p);
            state.data.forEach((_, idx) => {
                const el = document.getElementById(`p-step-${idx}`);
                if(el) {
                    if(idx === currentPhaseIdx) el.classList.add('active');
                    else el.classList.remove('active');
                }
            });
            
            // Contador numérico
            const timeInPhase = timeInCycle - p.start;
            let currentBeat = Math.floor(timeInPhase / state.tempo) + 1;
            currentBeat = Math.min(currentBeat, p.b);
            els.cnt.textContent = currentBeat;
            
            // --- CORRECCIÓN MATEMÁTICA ---
            const progress = timeInPhase / p.dur;
            // Esta fórmula va suavemente de 0 a 1 (sin negativos)
            const ease = (1 - Math.cos(Math.PI * progress)) / 2;
            
            let maxScale = 1.45;
            if(window.innerWidth < 400) maxScale = 1.35;
            let rawScale = 1;
            
            if(p.y === 'rise') rawScale = 0.8 + (maxScale - 0.8) * ease;
            else if(p.y === 'fall') rawScale = maxScale - (maxScale - 0.8) * ease;
            else if(p.y === 'holdhigh') rawScale = maxScale;
            else rawScale = 0.8;
            
            els.sph.style.transform = `scale(${rawScale})`;
        }
        
        // --- DIBUJADO DE CANVAS (Línea de tiempo) ---
        const w = els.cvs.width / (window.devicePixelRatio||1);
        const h = els.cvs.height / (window.devicePixelRatio||1);
        els.ctx.clearRect(0, 0, w, h);
        const centerX = w / 2;
        const trackY = h / 2;
        const trackH = 14;
        const pxPerSec = (w / 7) / state.tempo;
        for(let c = cycleCountVisual - 1; c <= cycleCountVisual + 1; c++) {
            const cycleStartTime = c * totalCycleDur;
            state.data.forEach(phase => {
                const pStartAbs = cycleStartTime + phase.start;
                const pEndAbs = cycleStartTime + phase.end;
                const xStart = centerX + (pStartAbs - elapsed) * pxPerSec;
                const xEnd = centerX + (pEndAbs - elapsed) * pxPerSec;
                if(xEnd < 0 || xStart > w) return;
                els.ctx.fillStyle = phase.c;
                els.ctx.fillRect(xStart, trackY - trackH/2, xEnd - xStart, trackH);
                els.ctx.strokeStyle = 'rgba(255,255,255,0.9)';
                els.ctx.lineWidth = 2;
                for(let b = 0; b <= phase.b; b++) {
                    const beatTimeAbs = pStartAbs + b * state.tempo;
                    const markX = centerX + (beatTimeAbs - elapsed) * pxPerSec;
                    els.ctx.beginPath();
                    els.ctx.moveTo(markX, trackY - trackH - 2);
                    els.ctx.lineTo(markX, trackY + trackH + 2);
                    els.ctx.stroke();
                }
            });
        }
        els.ctx.beginPath();
        els.ctx.fillStyle = '#FFFFFF';
        els.ctx.arc(centerX, trackY, 9, 0, Math.PI * 2);
        els.ctx.fill();
        els.ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        els.ctx.lineWidth = 1;
        els.ctx.stroke();
        els.ctx.beginPath();
        els.ctx.fillStyle = '#37474f';
        els.ctx.moveTo(centerX - 6, trackY - 25);
        els.ctx.lineTo(centerX + 6, trackY - 25);
        els.ctx.lineTo(centerX, trackY - 15);
        els.ctx.fill();
        requestAnimationFrame(draw);
    }

    function prepareData(k) {
        if(!patterns[k]) return false;
        state.pk = k;
        state.data = [];
        let acc = 0;
        patterns[k].forEach(x => {
            const d = x.b * state.tempo;
            state.data.push({...x, start:acc, end:acc+d, dur:d});
            acc += d;
        });
        state.dur = acc;
        return true;
    }

    function initCanvas() {
        if(!els.cvs) return;
        const dpr = window.devicePixelRatio || 1;
        const rect = els.cvs.getBoundingClientRect();
        els.cvs.width = rect.width * dpr;
        els.cvs.height = rect.height * dpr;
        els.ctx.scale(dpr, dpr);
    }

    function renderPattern(k) {
        if(!patterns[k]) return;
        els.pat.innerHTML = '';
        patterns[k].forEach((step, idx) => {
            const numSpan = document.createElement('span');
            numSpan.textContent = step.b;
            if(step.m === 'mouth') {
                const sub = document.createElement('span');
                sub.textContent = 'b';
                sub.className = 'p-mode-sub';
                numSpan.appendChild(sub);
            }
            numSpan.className = 'p-num';
            numSpan.id = `p-step-${idx}`;
            els.pat.appendChild(numSpan);
            if(idx < patterns[k].length - 1) {
                const sep = document.createElement('span');
                sep.textContent = '—';
                sep.className = 'p-sep';
                els.pat.appendChild(sep);
            }
        });
    }

    function start(k) {
        if(!prepareData(k)) {
            alert('Error: Patrón no encontrado');
            return;
        }
        // MÚSICA: Solo arranca ambient si NO estamos en modo Paisaje Sonoro
        if(state.music && !state.winterMode) {
            ambientAudio.currentTime = 0;
            ambientAudio.play().catch(e => console.log('Audio error', e));
        }
        initAudio();
        renderPattern(k);
        els.menu.style.opacity = '0';
        setTimeout(() => els.menu.style.display='none', 400);

        // V1.3.0 Reset states: Queremos que empiece ENCENDIDO por defecto
        // NOTA: state.winterMode NO se toca aquí — lo gestiona startWinterMode() y stop()
        state.quotesEnabled = true;
        const btn = document.getElementById('quoteToggleBtn');
        btn.classList.add('active'); // Botón iluminado
        els.qt.style.opacity = '1'; // Frase visible
        els.qt.textContent = 'Sigue el ritmo, respira, nada más.'; // Frase inicial

        setTimeout(() => {
            initCanvas();
            state.run = true;
            state.paused = false;
            state.startAudioTime = audioCtx ? audioCtx.currentTime : 0;
            nextNoteTime = state.startAudioTime;
            currentBeatIndex = 0;
            state.cyc = 0;
            if(audioCtx) scheduler();
            requestAnimationFrame(draw);
        }, 100);
    }

    function stop() {
        // --- LIMPIEZA MODO INVIERNO ---
        const wasWinterMode = document.querySelector('.app-layout').classList.contains('winter-mode');
        document.querySelector('.app-layout').classList.remove('winter-mode');

        // Apagamos vídeo y audio de invierno
        const vid = document.getElementById('bgVideo');
        const aud = document.getElementById('winterAudio');
        if(vid) vid.pause();
        if(aud) { aud.pause(); aud.currentTime = 0; }
        // --------------------------------------
        ambientAudio.pause();
        state.run = false;
        clearTimeout(scheduleTimerID);
        els.sph.style.transform = 'scale(0.8)';
        els.ph.textContent = 'LISTO';
        els.ph.style.color = 'var(--accent)';
        els.modeIcon.classList.remove('visible');
        els.cnt.textContent = '';
        els.cyc.textContent = '0';
        els.sph.style.setProperty('--c-phase', '#4CAF50');
        els.pat.innerHTML = '';
        els.ctx.clearRect(0, 0, els.cvs.width, els.cvs.height);

        state.winterMode = false;

        // Si veníamos del Paisaje Sonoro, volvemos a su pantalla intermedia
        if (wasWinterMode) {
            openSoundscapeSettings();
        } else if (_fromReframe) {
            _fromReframe = false;
            reopenReframeOverlay();
        } else {
            // Volver al overlay de Respiración
            openBreathingOverlay();
        }
    }

    function toggleTempo() {
        const t = [1.0, 1.5, 2.0];
        const idx = t.indexOf(state.tempo);
        const next = t[(idx+1)%t.length];
        state.tempo = next;
        document.getElementById('tempoBtn').innerText = next===1.0?'1x':next===1.5?'Lento':'Zen';
        if(state.run) start(state.pk);
    }

    function toggleSound() {
        state.snd=!state.snd;
        document.getElementById('soundBtn').textContent=state.snd?'🔔':'🔕';
        if(state.run) initAudio();
    }

    function toggleMetronome() {
        state.met=!state.met;
        document.getElementById('metronomeBtn').classList.toggle('active');
    }

    function toggleMusic() {
    state.music = !state.music;
    const audPaisaje = document.getElementById('winterAudio');
    const musicBtn = document.getElementById('musicBtn');

    // Feedback visual en el botón
    if (musicBtn) musicBtn.style.opacity = state.music ? '1' : '0.35';

    if (state.music) {
        if (state.winterMode) {
            if (audPaisaje) audPaisaje.play().catch(e => console.log(e));
        } else {
            if (typeof ambientAudio !== 'undefined') ambientAudio.play().catch(e => console.log(e));
        }
    } else {
        if (state.winterMode) {
            if (audPaisaje) audPaisaje.pause();
        } else {
            if (typeof ambientAudio !== 'undefined') ambientAudio.pause();
        }
    }
}

    function openShareConfig() {
        let lastP = state.pk;
        if(lastP && lastP !== 'custom') {
            els.pillPatternInput.value = lastP;
        }
        els.shareConfigOverlay.style.display = 'flex';
        els.pillPatternInput.focus();
    }

    async function generateShareLink() {
        let pString = els.pillPatternInput.value.trim();
        if(!pString) {
            alert('Falta el patrón.');
            return;
        }
        const testP = parsePatternString(pString);
        if(testP.length < 2) {
            alert('Patrón inválido. Ej: 4-7-8b');
            return;
        }
        const n = els.pillNameInput.value.trim() || 'Amigo';
        const m = els.pillMessageInput.value.trim() || 'Respira conmigo...';
        els.shareConfigOverlay.style.display = 'none';
        els.load.style.display = 'flex';
        const baseUrl = location.href.split('?')[0];
        const longUrl = `${baseUrl}?p=${encodeURIComponent(pString)}&to=${encodeURIComponent(n)}&msg=${encodeURIComponent(m)}`;
        let finalUrl = longUrl;
        try {
            const response = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(longUrl)}`);
            if(response.ok) finalUrl = await response.text();
        } catch(e) {}
        els.load.style.display = 'none';
        els.shareText.value = `Píldora de Respiración:\n${m}\n→ ${pString}\n${finalUrl}`;
        els.shareModal.style.display = 'flex';
    }

    function sendWhatsapp() {
        window.open(`https://wa.me/?text=${encodeURIComponent(els.shareText.value)}`, '_blank');
    }

    function copyToClipboard() {
        els.shareText.select();
        els.shareText.setSelectionRange(0, 99999);
        try {
            navigator.clipboard.writeText(els.shareText.value).then(() => alert('¡Copiado!'));
        } catch(e) {
            document.execCommand('copy');
            alert('¡Copiado!');
        }
    }

    function closePill() {
        document.getElementById('pillOverlay').style.display = 'none';
        document.documentElement.classList.remove('has-pill');
    }

    // CHECK SHARE
    window.addEventListener('load', () => {
        const params = new URLSearchParams(window.location.search);
        if(params.has('p')) {
            const pString = params.get('p');
            const to = params.get('to') || 'Amigo';
            const msg = params.get('msg') || 'Respira conmigo...';
            document.getElementById('pillRecipient').textContent = `Para ${to}`;
            document.getElementById('pillMessage').textContent = msg;
            const newPattern = parsePatternString(pString);
            if(newPattern.length >= 2) {
                patterns['pill'] = newPattern;
                // pillOverlay ya visible via CSS has-pill — solo rellenamos datos
            }
        }
    });
// --- LÓGICA TRANSFORMA TUS PENSAMIENTOS ---

function openLecturaOverlay() {
    const menu = document.getElementById('selectionMenu');
    menu.style.opacity = '0';
    setTimeout(() => menu.style.display = 'none', 400);
    document.getElementById('lecturaSelectOverlay').style.display = 'flex';
}

function closeLecturaOverlay() {
    document.getElementById('lecturaSelectOverlay').style.display = 'none';
    const menu = document.getElementById('selectionMenu');
    menu.style.display = 'flex';
    setTimeout(() => menu.style.opacity = '1', 10);
}

function openReframeOverlay() {
    const overlay = document.getElementById('reframeOverlay');
    if (overlay) {
        overlay.style.display = 'flex';
        resetReframe();
        setTimeout(() => document.getElementById('reframeInput').focus(), 100);
    }
}

function closeReframeOverlay() {
    const overlay = document.getElementById('reframeOverlay');
    if (overlay) overlay.style.display = 'none';
}

function resetReframe() {
    document.getElementById('reframeInput').value = '';
    document.getElementById('reframeInput').style.display = 'block';
    document.getElementById('reframeBtn').style.display = 'block';
    document.getElementById('reframeBtn').disabled = false;
    document.getElementById('reframeBtn').textContent = 'Transformar';
    document.getElementById('reframeSpinner').classList.remove('visible');
    document.getElementById('reframeResult').classList.remove('visible');
    document.getElementById('reframeError').classList.remove('visible');
    document.getElementById('reframeNewBtn').style.display = 'none';
    document.getElementById('reframeShareBtn').style.display = 'none';
    document.getElementById('reframeShareHint').style.display = 'none';
    document.getElementById('reframeInput').focus();
}

let _lastReframeData = null;

function shareReframe() {
    if (!_lastReframeData) return;
    const d = _lastReframeData;
    const lines = [];
    if (d.opening) lines.push(d.opening);
    if (d.points && d.points.length) d.points.forEach(p => lines.push('• ' + p));
    if (d.closing) lines.push('\n' + d.closing);
    if (d.breath && d.breath.technique) lines.push('\n🌬 ' + d.breath.technique + ' · ' + d.breath.rhythm);
    const text = lines.join('\n');

    if (navigator.share) {
        navigator.clipboard.writeText(text).catch(() => {});
        navigator.share({ title: 'Mi reencuadre · Respira', text }).catch(() => {});
    } else {
        navigator.clipboard.writeText(text).then(() => {
            const btn = document.getElementById('reframeShareBtn');
            const orig = btn.textContent;
            btn.textContent = '✓ Copiado';
            setTimeout(() => btn.textContent = orig, 2000);
        }).catch(() => {});
    }
}

// Mapa patrón ACT → clave de patrón respiratorio disponible en la app
const BREATH_PATTERN_MAP = {
    'fusión':       'box',
    'rumia':        '4-7-8b',
    'anticipación': '4-4-6-2',
    'evitación':    '5-5',
    'autocrítica':  'box',
};

let _fromReframe = false;

function launchBreath(patternKey) {
    _fromReframe = true;
    closeReframeOverlay();
    if (typeof start === 'function') start(patternKey);
}

function reopenReframeOverlay() {
    const overlay = document.getElementById('reframeOverlay');
    if (overlay) overlay.style.display = 'flex';
}

function renderStructuredReframe(data) {
    let html = '';
    // Apertura — Cinzel, color accent
    if (data.opening) {
        html += `<p class="rf-opening">${escapeHtml(data.opening)}</p>`;
    }
    // Puntos — bullets con dot de color
    if (data.points && data.points.length) {
        data.points.forEach(p => {
            html += `<div class="rf-bullet"><span class="rf-bullet-dot">•</span><span>${applyInlineMarkdown(escapeHtml(p))}</span></div>`;
        });
    }
    // Cierre — cursiva sutil
    if (data.closing) {
        html += `<p class="rf-closing">${applyInlineMarkdown(escapeHtml(data.closing))}</p>`;
    }
    // Sugerencia respiratoria — al final, tras leer la respuesta completa
    if (data.breath && data.breath.technique) {
        const patternKey = BREATH_PATTERN_MAP[data.pattern] || 'box';
        html += `
        <div class="rf-breath">
            <div class="rf-breath-header">
                <span class="rf-breath-title">🌬 ${escapeHtml(data.breath.technique)}</span>
                <span class="rf-breath-rhythm">${escapeHtml(data.breath.rhythm)}</span>
            </div>
            <p class="rf-breath-reason">${escapeHtml(data.breath.reason)}</p>
            <button class="rf-breath-btn" onclick="launchBreath('${patternKey}')">Respirar ahora →</button>
        </div>`;
    }
    return html;
}

function escapeHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function applyInlineMarkdown(str) {
    return str
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>');
}

function formatReframe(text) {
    // Seguridad HTML
    let t = text
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    // Markdown inline
    t = t.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    t = t.replace(/\*(.+?)\*/g, '<em>$1</em>');
    // Procesar línea a línea
    const lines = t.split('\n');
    let html = '';
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        if (/^[•\-\u2013]\s+/.test(trimmed)) {
            // Bullet — div con punto de color
            const body = trimmed.replace(/^[•\-\u2013]\s+/, '');
            html += `<div class="rf-bullet"><span class="rf-bullet-dot">•</span><span>${body}</span></div>`;
        } else {
            html += `<p>${trimmed}</p>`;
        }
    }
    return html;
}

async function reframeThought() {
    const input = document.getElementById('reframeInput');
    const thought = input.value.trim();

    if (!thought) {
        input.focus();
        return;
    }

    const btn      = document.getElementById('reframeBtn');
    const spinner  = document.getElementById('reframeSpinner');
    const result   = document.getElementById('reframeResult');
    const errorEl  = document.getElementById('reframeError');
    const newBtn   = document.getElementById('reframeNewBtn');
    const textEl   = document.getElementById('reframeText');

    // Estado: cargando
    btn.disabled = true;
    btn.textContent = 'Transformando…';
    spinner.classList.add('visible');
    result.classList.remove('visible');
    errorEl.classList.remove('visible');

    try {
        const response = await fetch('/api/reframe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ thought })
        });

        const data = await response.json();

        if (!response.ok) throw new Error(data.error || 'Error desconocido');

        // Mostrar resultado — estructurado (JSON) o fallback texto plano
        if (data.structured) {
            _lastReframeData = data;
            textEl.innerHTML = renderStructuredReframe(data);
        } else {
            _lastReframeData = null;
            textEl.innerHTML = formatReframe(data.reframed || '');
        }
        result.classList.add('visible');
        input.style.display = 'none';
        btn.style.display = 'none';
        newBtn.style.display = 'block';
        document.getElementById('reframeShareBtn').style.display = 'block';
        document.getElementById('reframeShareHint').style.display = 'block';

    } catch (err) {
        console.error('Reframe error:', err);
        errorEl.classList.add('visible');
        btn.disabled = false;
        btn.textContent = 'Transformar';
    } finally {
        spinner.classList.remove('visible');
    }
}

// --- LÓGICA DEFINITIVA PAISAJE SONORO ---

function openSoundscapeSettings(fromBreathing) {
    const overlay = document.getElementById('psOverlay');
    if(overlay) {
        overlay.style.display = 'flex';
        overlay._fromBreathing = !!fromBreathing;
        const input = document.getElementById('psPatternInput');
        if(input) input.value = ''; // Limpia textos anteriores
    }
}

function closeSoundscapeSettings() {
    const overlay = document.getElementById('psOverlay');
    const fromBreathing = overlay && overlay._fromBreathing;
    if(overlay) { overlay.style.display = 'none'; overlay._fromBreathing = false; }
    if (typeof state !== 'undefined' && !state.run) {
        if (fromBreathing) {
            openBreathingOverlay();
        } else {
            const menu = document.getElementById('selectionMenu');
            if(menu) { menu.style.display = 'flex'; menu.style.opacity = '1'; }
        }
    }
}

// Función exclusiva para los guiones de esta ventana
function formatPsPattern(inputCaja) {
    let val = inputCaja.value.replace(/[^0-9b]/g, '');
    if (val.length > 0) {
        let formatted = val[0];
        for (let i = 1; i < val.length; i++) {
            if (val[i] === 'b' || val[i-1] === 'b') formatted += val[i];
            else formatted += '-' + val[i];
        }
        inputCaja.value = formatted.substring(0, 10);
    }
}

function startWinterMode() {
    // 1. Recoger el ritmo desde el overlay del Paisaje Sonoro
    const psInput = document.getElementById('psPatternInput');
    let ritmo = psInput ? psInput.value.trim() : "4-4-4-4";
    if (!ritmo) ritmo = "4-4-4-4";

    // 2. SOLUCIÓN DEFINITIVA: construir el array del patrón directamente
    //    y asignarlo a patterns['custom'], sin pasar por el DOM.
    if (typeof window._parsePatternString !== 'function' || typeof window._patterns === 'undefined') {
        alert('Error interno: el motor aún no está listo. Inténtalo de nuevo.');
        return;
    }
    const newPattern = window._parsePatternString(ritmo);
    if (newPattern.length < 2) {
        alert('Introduce al menos 2 fases válidas, por ejemplo: 4-4-4-4');
        return;
    }
    window._patterns['custom'] = newPattern;

    // 3. Cerrar la ventana blanca directamente (sin tocar navegación)
    const psOverlay = document.getElementById('psOverlay');
    if(psOverlay) { psOverlay.style.display = 'none'; psOverlay._fromBreathing = false; }

    // 4. Iniciar el motor nativo y silenciar el ambient (no aplica en modo Paisaje)
    try {
        start('custom');
    } catch (e) {
        console.error("Error al arrancar:", e);
    }
    // start() puede haber arrancado ambientAudio — lo paramos de inmediato
    if (typeof ambientAudio !== 'undefined' && ambientAudio) {
        ambientAudio.pause();
        ambientAudio.currentTime = 0;
    }

    // 5. Activar modo paisaje y audio
    // Lo hacemos con un pequeño delay para que el motor esté estable
    setTimeout(() => {
        if (typeof state !== 'undefined' && state.run === true) {
            state.winterMode = true;
            document.querySelector('.app-layout').classList.add('winter-mode');
            
            const vid = document.getElementById('bgVideo');
            if(vid) { vid.currentTime = 0; vid.play().catch(e=>console.log(e)); }
            
            // El <audio id="winterAudio"> ya tiene el src fijo en el HTML, no lo reasignamos
            const aud = document.getElementById('winterAudio');
            if(aud) {
                aud.currentTime = 0;
                aud.volume = 0.5;
                if(state.music) aud.play().catch(e=>console.log(e));
            }

            document.documentElement.style.setProperty('--c-phase', '#ffffff');
        }
    }, 200);
}

// ══════════════════════════════════════════════
// HAZ FOCO — LÓGICA COMPLETA
// ══════════════════════════════════════════════

const FOCUS_CONFIG = {
    brown: {
        type: 'RUIDO MARRÓN',
        name: 'Tierra y Liberación',
        freq: '174 Hz · liberación de tensión',
        hz: 174,
        orbFrom: 'radial-gradient(circle at 35% 35%, #a1887f, #6d4c41)',
        noiseType: 'brown'
    },
    pink: {
        type: 'RUIDO ROSA',
        name: 'Claridad',
        freq: '528 Hz · reparación y claridad',
        hz: 528,
        orbFrom: 'radial-gradient(circle at 35% 35%, #f48fb1, #c2185b)',
        noiseType: 'pink'
    },
    green: {
        type: 'RUIDO VERDE',
        name: 'Calma Activa',
        freq: '396 Hz · liberación del miedo',
        hz: 396,
        orbFrom: 'radial-gradient(circle at 35% 35%, #a5d6a7, #388e3c)',
        noiseType: 'green'
    }
};

let focusAudioCtx = null;
let focusAudioNodes = [];
let focusRunning = false;
let focusSeconds = 0;
let focusInterval = null;
let focusCurrentType = null;
let focusMasterGain = null;
let focusToneGain = null;   // ganancia independiente del tono
let focusNoiseGain = null;  // ganancia independiente del ruido
let focusCountdownTotal = 0;   // segundos totales elegidos (0 = sin límite)
let focusTimerIndex = 0;       // índice seleccionado en el scroll
let focusMode = 'both';     // 'both' | 'noise' | 'tone'

// ── ENTORNO PERSONALIZADO — PAD ──
const PAD_FREQ_DESCS = {
    0:   'Sin tono · solo ruido',
    174: '174 Hz · alivio del dolor y la tensión',
    396: '396 Hz · liberación del miedo y la culpa',
    528: '528 Hz · reparación y transformación',
    639: '639 Hz · conexión y relaciones',
    741: '741 Hz · expresión y solución de problemas',
};

let padPosX = 0.5;   // 0=marrón, 0.5=rosa, 1=verde
let padPosY = 0.6;   // 0=arriba(suave), 1=abajo(intenso)
let padFreqHz = 174;
let padRunning = false;
let padAudioCtx = null;
let padNoiseNode = null, padNoiseGain = null;
let padToneOsc = null, padToneGain = null;
let padAnimFrame = null;
let padCountdownTotal = 0;
let padSeconds = 0;
let padInterval = null;
let padTimerNotify = true;
let ptpIndex = 0;
let ptpInitialized = false;

function openNoisePad() {
    document.getElementById('focusSelectOverlay').style.display = 'none';
    const overlay = document.getElementById('focusPadOverlay');
    overlay.classList.add('open');
    initPadCanvas();
    updatePadCursor();
}

function closeNoisePad() {
    clearInterval(padInterval);
    stopPadAudio();
    document.getElementById('focusPadOverlay').classList.remove('open');
    document.getElementById('padTimerPanel').style.display = 'none';
    padRunning = false;
    padSeconds = 0;
    padCountdownTotal = 0;
    ptpIndex = 0;
    ptpInitialized = false;
    document.getElementById('padPlayBtn').textContent = 'Iniciar';
    document.getElementById('padTimerBtn').classList.remove('active', 'has-time');
    document.getElementById('padTimerBadge').textContent = '';
    document.getElementById('focusSelectOverlay').style.display = 'flex';
}

function initPadCanvas() {
    const canvas = document.getElementById('noisePadCanvas');
    const wrap = document.getElementById('padWrap');
    const size = wrap.offsetWidth;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Gradiente horizontal: marrón → rosa → verde
    const gX = ctx.createLinearGradient(0, 0, size, 0);
    gX.addColorStop(0,    '#8d6e63');
    gX.addColorStop(0.5,  '#f06292');
    gX.addColorStop(1,    '#66bb6a');
    ctx.fillStyle = gX;
    ctx.fillRect(0, 0, size, size);

    // Overlay vertical: arriba blanco (suave) → abajo oscuro (intenso)
    const gY = ctx.createLinearGradient(0, 0, 0, size);
    gY.addColorStop(0,   'rgba(255,255,255,0.7)');
    gY.addColorStop(0.5, 'rgba(255,255,255,0)');
    gY.addColorStop(1,   'rgba(0,0,0,0.45)');
    ctx.fillStyle = gY;
    ctx.fillRect(0, 0, size, size);

    // Eventos touch y mouse
    const onMove = (nx, ny) => {
        padPosX = Math.max(0, Math.min(1, nx));
        padPosY = Math.max(0, Math.min(1, ny));
        updatePadCursor();
        if (padRunning) applyPadAudio();
    };

    wrap.addEventListener('mousedown', (e) => {
        const r = wrap.getBoundingClientRect();
        onMove((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
        const onMM = (e) => {
            const r = wrap.getBoundingClientRect();
            onMove((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
        };
        window.addEventListener('mousemove', onMM);
        window.addEventListener('mouseup', () => window.removeEventListener('mousemove', onMM), { once: true });
    });

    wrap.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const r = wrap.getBoundingClientRect();
        const t = e.touches[0];
        onMove((t.clientX - r.left) / r.width, (t.clientY - r.top) / r.height);
    }, { passive: false });

    wrap.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const r = wrap.getBoundingClientRect();
        const t = e.touches[0];
        onMove((t.clientX - r.left) / r.width, (t.clientY - r.top) / r.height);
    }, { passive: false });
}

function updatePadCursor() {
    const wrap = document.getElementById('padWrap');
    const cursor = document.getElementById('padCursor');
    cursor.style.left = (padPosX * 100) + '%';
    cursor.style.top  = (padPosY * 100) + '%';
}

function setPadFreq(hz) {
    padFreqHz = hz;
    document.querySelectorAll('.pad-freq-btn').forEach(b => b.classList.toggle('active', parseInt(b.dataset.hz) === hz));
    document.getElementById('padFreqDesc').textContent = PAD_FREQ_DESCS[hz] || '';
    if (padRunning && padToneOsc) {
        if (hz === 0) {
            padToneGain.gain.setTargetAtTime(0, padAudioCtx.currentTime, 0.1);
        } else {
            padToneOsc.frequency.setValueAtTime(hz, padAudioCtx.currentTime);
            padToneGain.gain.setTargetAtTime(0.06, padAudioCtx.currentTime, 0.1);
        }
    }
}

function togglePadSession() {
    if (!padRunning) {
        padRunning = true;
        document.getElementById('padPlayBtn').textContent = 'Pausar';
        startPadAudio();
        padInterval = setInterval(() => {
            if (padCountdownTotal > 0) {
                const remaining = padCountdownTotal - padSeconds - 1;
                if (remaining <= 0) {
                    clearInterval(padInterval);
                    padRunning = false;
                    document.getElementById('padPlayBtn').textContent = 'Iniciar';
                    // Fade out suave 3 segundos
                    if (padAudioCtx && padNoiseGain) {
                        const t = padAudioCtx.currentTime;
                        padNoiseGain.gain.linearRampToValueAtTime(0, t + 3);
                        if (padToneGain) padToneGain.gain.linearRampToValueAtTime(0, t + 3);
                        setTimeout(() => {
                            stopPadAudio();
                            if (padTimerNotify) {
                                setTimeout(() => alert('✅ Sesión completada\n\n¡Bien hecho! Has completado tu sesión de foco.'), 200);
                            }
                        }, 3100);
                    }
                    return;
                }
                padSeconds++;
            } else {
                padSeconds++;
            }
        }, 1000);
    } else {
        padRunning = false;
        document.getElementById('padPlayBtn').textContent = 'Continuar';
        clearInterval(padInterval);
        if (padAudioCtx) padAudioCtx.suspend().catch(() => {});
    }
}

function startPadAudio() {
    if (!padAudioCtx) padAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (padAudioCtx.state === 'suspended') padAudioCtx.resume();

    // Nodo de ruido blanco (buffer)
    const bufSize = padAudioCtx.sampleRate * 2;
    const buf = padAudioCtx.createBuffer(1, bufSize, padAudioCtx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;

    padNoiseNode = padAudioCtx.createBufferSource();
    padNoiseNode.buffer = buf;
    padNoiseNode.loop = true;

    // Filtro para dar color al ruido según posX
    const filter = padAudioCtx.createBiquadFilter();
    padNoiseNode.connect(filter);

    padNoiseGain = padAudioCtx.createGain();
    filter.connect(padNoiseGain);
    padNoiseGain.connect(padAudioCtx.destination);
    padNoiseNode.start();

    // Tono Solfeggio
    padToneOsc = padAudioCtx.createOscillator();
    padToneOsc.type = 'sine';
    padToneOsc.frequency.value = padFreqHz || 174;
    padToneGain = padAudioCtx.createGain();
    padToneGain.gain.value = padFreqHz === 0 ? 0 : 0.06;
    padToneOsc.connect(padToneGain);
    padToneGain.connect(padAudioCtx.destination);
    padToneOsc.start();

    // Guardar referencia al filtro para applyPadAudio
    padNoiseNode._filter = filter;
    applyPadAudio();
}

function setPadVolume(val) {
    if (!padAudioCtx) return;
    const v = val / 100;
    const t = padAudioCtx.currentTime;
    if (padNoiseGain) padNoiseGain.gain.setTargetAtTime(v * (0.15 + padPosY * 0.45), t, 0.1);
    if (padToneGain && padFreqHz > 0) padToneGain.gain.setTargetAtTime(v * 0.06, t, 0.1);
}

function applyPadAudio() {
    if (!padAudioCtx || !padNoiseNode) return;
    const filter = padNoiseNode._filter;
    const t = padAudioCtx.currentTime;

    // Eje X → tipo de ruido via filtro pasa-bajos / pasa-altos
    // X=0 (marrón): freq baja, X=0.5 (rosa): media, X=1 (verde): alta
    const freq = 200 + padPosX * 2800;  // 200Hz → 3000Hz
    const Q = 0.8 + padPosX * 0.6;
    filter.type = padPosX < 0.5 ? 'lowpass' : 'bandpass';
    filter.frequency.setTargetAtTime(freq, t, 0.1);
    filter.Q.setTargetAtTime(Q, t, 0.1);

    // Eje Y → volumen base · modulado por el slider
    const sliderVal = (document.getElementById('padVolume')?.value || 60) / 100;
    const vol = sliderVal * (0.15 + padPosY * 0.45);
    padNoiseGain.gain.setTargetAtTime(vol, t, 0.1);
}

function stopPadAudio() {
    if (padNoiseNode) { try { padNoiseNode.stop(); } catch(e) {} padNoiseNode = null; }
    if (padToneOsc)   { try { padToneOsc.stop();   } catch(e) {} padToneOsc = null; }
    if (padAudioCtx)  { padAudioCtx.close().catch(() => {}); padAudioCtx = null; }
    padNoiseGain = null; padToneGain = null;
}

function togglePadTimerPanel() {
    const panel = document.getElementById('padTimerPanel');
    const isOpen = panel.style.display === 'flex';
    if (isOpen) {
        panel.style.display = 'none';
    } else {
        initPtpScroll();
        panel.style.display = 'flex';
    }
}

function initPtpScroll() {
    const track = document.getElementById('ptpTrack');
    if (!ptpInitialized) {
        track.innerHTML = '';
        FOCUS_DURATIONS.forEach((d, i) => {
            const el = document.createElement('div');
            el.className = 'ftp-item' + (i === ptpIndex ? ' sel' : '');
            el.textContent = d.label;
            el.dataset.index = i;
            track.appendChild(el);
        });
        const wrap = document.getElementById('ptpScrollWrap');
        wrap.addEventListener('wheel', (e) => {
            e.preventDefault();
            if (e.deltaY > 0 && ptpIndex < FOCUS_DURATIONS.length - 1) ptpIndex++;
            else if (e.deltaY < 0 && ptpIndex > 0) ptpIndex--;
            updatePtpScroll();
        }, { passive: false });
        let lastY = 0;
        wrap.addEventListener('touchstart', (e) => { lastY = e.touches[0].clientY; });
        wrap.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const dy = lastY - e.touches[0].clientY;
            lastY = e.touches[0].clientY;
            if (Math.abs(dy) > 10) {
                if (dy > 0 && ptpIndex < FOCUS_DURATIONS.length - 1) ptpIndex++;
                else if (dy < 0 && ptpIndex > 0) ptpIndex--;
                updatePtpScroll();
            }
        }, { passive: false });
        track.addEventListener('click', (e) => {
            const item = e.target.closest('.ftp-item');
            if (item) { ptpIndex = parseInt(item.dataset.index); updatePtpScroll(); }
        });
        ptpInitialized = true;
    }
    updatePtpScroll();
}

function updatePtpScroll() {
    document.querySelectorAll('#ptpTrack .ftp-item').forEach((el, i) => el.classList.toggle('sel', i === ptpIndex));
    const offset = -ptpIndex * 44 + 55;
    document.getElementById('ptpTrack').style.transform = `translateY(${offset}px)`;
}

function confirmPadTimer() {
    const d = FOCUS_DURATIONS[ptpIndex];
    padCountdownTotal = d.seconds;
    padTimerNotify = document.getElementById('ptpNotifyCheck').checked;
    document.getElementById('padTimerPanel').style.display = 'none';
    const btn = document.getElementById('padTimerBtn');
    const badge = document.getElementById('padTimerBadge');
    if (d.seconds > 0) {
        btn.classList.add('active', 'has-time');
        badge.textContent = d.label;
    } else {
        btn.classList.remove('active', 'has-time');
        badge.textContent = '';
    }
    padSeconds = 0;
}

function openFocusSelect() {
    document.getElementById('focusSelectOverlay').style.display = 'flex';
}

function closeFocusSelect() {
    document.getElementById('focusSelectOverlay').style.display = 'none';
}

// ── TEMPORIZADOR DE SESIÓN ──
const FOCUS_DURATIONS = [
    { label: 'Sin límite', seconds: 0 },
    { label: '5 min',  seconds: 5 * 60 },
    { label: '10 min', seconds: 10 * 60 },
    { label: '15 min', seconds: 15 * 60 },
    { label: '20 min', seconds: 20 * 60 },
    { label: '25 min', seconds: 25 * 60 },
    { label: '30 min', seconds: 30 * 60 },
    { label: '45 min', seconds: 45 * 60 },
    { label: '60 min', seconds: 60 * 60 },
    { label: '90 min', seconds: 90 * 60 },
];

let ftpIndex = 0;
let ftpNotify = true;
let ftpInitialized = false;

function toggleFocusTimerPanel() {
    const panel = document.getElementById('focusTimerPanel');
    const isOpen = panel.classList.contains('open');
    if (isOpen) {
        panel.classList.remove('open');
    } else {
        initFtpScroll();
        panel.classList.add('open');
    }
}

function initFtpScroll() {
    const track = document.getElementById('ftpTrack');
    if (!ftpInitialized) {
        track.innerHTML = '';
        FOCUS_DURATIONS.forEach((d, i) => {
            const el = document.createElement('div');
            el.className = 'ftp-item' + (i === ftpIndex ? ' sel' : '');
            el.textContent = d.label;
            el.dataset.index = i;
            track.appendChild(el);
        });
        // Rueda ratón
        const wrap = document.getElementById('ftpScrollWrap');
        wrap.addEventListener('wheel', (e) => {
            e.preventDefault();
            if (e.deltaY > 0 && ftpIndex < FOCUS_DURATIONS.length - 1) ftpIndex++;
            else if (e.deltaY < 0 && ftpIndex > 0) ftpIndex--;
            updateFtpScroll();
        }, { passive: false });
        // Touch
        let lastY = 0;
        wrap.addEventListener('touchstart', (e) => { lastY = e.touches[0].clientY; });
        wrap.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const dy = lastY - e.touches[0].clientY;
            lastY = e.touches[0].clientY;
            if (Math.abs(dy) > 10) {
                if (dy > 0 && ftpIndex < FOCUS_DURATIONS.length - 1) ftpIndex++;
                else if (dy < 0 && ftpIndex > 0) ftpIndex--;
                updateFtpScroll();
            }
        }, { passive: false });
        // Click
        track.addEventListener('click', (e) => {
            const item = e.target.closest('.ftp-item');
            if (item) { ftpIndex = parseInt(item.dataset.index); updateFtpScroll(); }
        });
        ftpInitialized = true;
    }
    updateFtpScroll();
}

function updateFtpScroll() {
    document.querySelectorAll('.ftp-item').forEach((el, i) => el.classList.toggle('sel', i === ftpIndex));
    const offset = -ftpIndex * 44 + 55;
    document.getElementById('ftpTrack').style.transform = `translateY(${offset}px)`;
}

function confirmFocusTimer() {
    const d = FOCUS_DURATIONS[ftpIndex];
    focusCountdownTotal = d.seconds;
    ftpNotify = document.getElementById('ftpNotifyCheck').checked;
    // Cerrar panel
    document.getElementById('focusTimerPanel').classList.remove('open');
    // Actualizar botón con badge
    const btn = document.getElementById('focusTimerBtn');
    const badge = document.getElementById('focusTimerBadge');
    if (d.seconds > 0) {
        btn.classList.add('active', 'has-time');
        badge.textContent = d.label;
        // Actualizar display del orbe
        const m = String(Math.floor(d.seconds / 60)).padStart(2, '0');
        const s = String(d.seconds % 60).padStart(2, '0');
        document.getElementById('focusTimer').textContent = `${m}:${s}`;
        document.getElementById('focusTimerLabel').textContent = 'restante';
    } else {
        btn.classList.remove('active', 'has-time');
        badge.textContent = '';
        if (!focusRunning) {
            document.getElementById('focusTimer').textContent = '00:00';
            document.getElementById('focusTimerLabel').textContent = 'en curso';
        }
    }
    focusSeconds = 0;
}

function initFocusTimerScroll() {}  // legacy — ya no se usa desde focusSelectOverlay
function updateFocusTimerScroll() {}

function startFocusSession(type) {
    focusCurrentType = type;
    const cfg = FOCUS_CONFIG[type];

    // Actualizar textos
    document.getElementById('focusSessionType').textContent = cfg.type;
    document.getElementById('focusSessionName').textContent = cfg.name;
    document.getElementById('focusSessionFreq').textContent = cfg.freq;

    // Color de la orb
    document.getElementById('focusOrb').style.background = cfg.orbFrom;

    // Reset estado
    focusRunning = false;
    focusSeconds = 0;
    focusCountdownTotal = 0;
    ftpIndex = 0;
    ftpInitialized = false;
    focusMode = 'both';
    document.getElementById('focusTimer').textContent = '00:00';
    document.getElementById('focusTimerLabel').textContent = 'en curso';
    document.getElementById('focusMainBtn').textContent = 'Iniciar';
    // Reset botón timer
    const timerBtn = document.getElementById('focusTimerBtn');
    timerBtn.classList.remove('active', 'has-time');
    document.getElementById('focusTimerBadge').textContent = '';
    document.getElementById('focusTimerPanel').classList.remove('open');
    document.getElementById('focusVolume').value = 70;
    // Reset selector de modo
    ['modeBtnBoth','modeBtnNoise','modeBtnTone'].forEach(id => document.getElementById(id).classList.remove('active'));
    document.getElementById('modeBtnBoth').classList.add('active');
    // Nota 174 Hz — solo en marrón
    document.getElementById('focus174note').style.display = (type === 'brown') ? 'block' : 'none';

    // Cerrar selección y abrir sesión
    closeFocusSelect();
    document.getElementById('focusSessionOverlay').style.display = 'flex';
}

function toggleFocusSession() {
    if (!focusRunning) {
        focusRunning = true;
        document.getElementById('focusMainBtn').textContent = 'Pausar';
        startFocusAudio(focusCurrentType);
        focusInterval = setInterval(() => {
            if (focusCountdownTotal > 0) {
                // Cuenta regresiva
                const remaining = focusCountdownTotal - focusSeconds - 1;
                if (remaining <= 0) {
                    clearInterval(focusInterval);
                    focusRunning = false;
                    document.getElementById('focusTimer').textContent = '00:00';
                    document.getElementById('focusTimerLabel').textContent = 'completado ✓';
                    document.getElementById('focusMainBtn').textContent = 'Iniciar';
                    // Fade out suave 3 segundos
                    if (focusAudioCtx && focusNoiseGain && focusToneGain) {
                        const t = focusAudioCtx.currentTime;
                        focusNoiseGain.gain.linearRampToValueAtTime(0, t + 3);
                        focusToneGain.gain.linearRampToValueAtTime(0, t + 3);
                        setTimeout(() => {
                            stopFocusAudio();
                            const orb = document.getElementById('focusOrb');
                            orb.style.background = 'radial-gradient(circle at 40% 35%, #a5d6a7, #43a047)';
                            if (ftpNotify) {
                                setTimeout(() => alert('✅ Sesión completada\n\n¡Bien hecho! Has completado tu sesión de foco.'), 200);
                            }
                        }, 3100);
                    }
                    return;
                }
                focusSeconds++;
                const m = String(Math.floor(remaining / 60)).padStart(2, '0');
                const s = String(remaining % 60).padStart(2, '0');
                document.getElementById('focusTimer').textContent = `${m}:${s}`;
            } else {
                // Cronómetro ascendente (sin límite)
                focusSeconds++;
                const m = String(Math.floor(focusSeconds / 60)).padStart(2, '0');
                const s = String(focusSeconds % 60).padStart(2, '0');
                document.getElementById('focusTimer').textContent = `${m}:${s}`;
            }
        }, 1000);
    } else {
        focusRunning = false;
        document.getElementById('focusMainBtn').textContent = 'Continuar';
        clearInterval(focusInterval);
        if (focusAudioCtx) focusAudioCtx.suspend().catch(() => {});
    }
}

function stopFocusSession() {
    clearInterval(focusInterval);
    focusRunning = false;
    stopFocusAudio();
    focusSeconds = 0;
    document.getElementById('focusTimerPanel').classList.remove('open');
    document.getElementById('focusSessionOverlay').style.display = 'none';
    document.getElementById('focusSelectOverlay').style.display = 'flex';
}

function setFocusVolume(val) {
    if (!focusAudioCtx) return;
    const v = val / 100;
    if (focusNoiseGain) focusNoiseGain.gain.setTargetAtTime(
        (focusMode === 'tone') ? 0 : v * 0.42, focusAudioCtx.currentTime, 0.1);
    if (focusToneGain) focusToneGain.gain.setTargetAtTime(
        (focusMode === 'noise') ? 0 : v * 0.18, focusAudioCtx.currentTime, 0.1);
}

function setFocusMode(mode) {
    focusMode = mode;
    // Actualizar botones
    ['modeBtnBoth','modeBtnNoise','modeBtnTone'].forEach(id => document.getElementById(id).classList.remove('active'));
    const map = { both:'modeBtnBoth', noise:'modeBtnNoise', tone:'modeBtnTone' };
    document.getElementById(map[mode]).classList.add('active');
    // Aplicar volumen inmediatamente si hay audio activo
    if (focusAudioCtx && focusRunning) {
        const v = document.getElementById('focusVolume').value / 100;
        const now = focusAudioCtx.currentTime;
        // Cancelar cualquier ramp pendiente antes de cambiar — esto es clave
        if (focusNoiseGain) {
            focusNoiseGain.gain.cancelScheduledValues(now);
            focusNoiseGain.gain.setTargetAtTime((mode === 'tone')  ? 0 : v * 0.42, now, 0.3);
        }
        if (focusToneGain) {
            focusToneGain.gain.cancelScheduledValues(now);
            focusToneGain.gain.setTargetAtTime((mode === 'noise') ? 0 : v * 0.18, now, 0.3);
        }
    }
}

// ── MOTOR DE AUDIO ──────────────────────────────

function startFocusAudio(type) {
    stopFocusAudio();
    try {
        focusAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (focusAudioCtx.state === 'suspended') focusAudioCtx.resume();
        focusAudioNodes = [];

        const v = document.getElementById('focusVolume').value / 100;

        // Ganancia independiente para el ruido
        focusNoiseGain = focusAudioCtx.createGain();
        focusNoiseGain.gain.setValueAtTime(0, focusAudioCtx.currentTime);
        const noiseTarget = (focusMode === 'tone') ? 0 : v * 0.42;
        focusNoiseGain.gain.linearRampToValueAtTime(noiseTarget, focusAudioCtx.currentTime + 3);
        focusNoiseGain.connect(focusAudioCtx.destination);

        // Ganancia independiente para el tono
        focusToneGain = focusAudioCtx.createGain();
        focusToneGain.gain.setValueAtTime(0, focusAudioCtx.currentTime);
        const toneTarget = (focusMode === 'noise') ? 0 : v * 0.18;
        focusToneGain.gain.linearRampToValueAtTime(toneTarget, focusAudioCtx.currentTime + 5);
        focusToneGain.connect(focusAudioCtx.destination);

        if (type === 'brown') createFocusBrownNoise();
        else if (type === 'pink') createFocusPinkNoise();
        else if (type === 'green') createFocusGreenNoise();

        addFocusTone(FOCUS_CONFIG[type].hz);
    } catch(e) { console.warn('Focus audio error', e); }
}

function stopFocusAudio() {
    if (focusAudioCtx) {
        focusAudioNodes.forEach(n => { try { n.stop?.(); } catch(e) {} });
        focusAudioCtx.close().catch(() => {});
        focusAudioCtx = null;
        focusAudioNodes = [];
        focusMasterGain = null;
        focusToneGain = null;
        focusNoiseGain = null;
    }
}

function createFocusBrownNoise() {
    const bufferSize = focusAudioCtx.sampleRate * 4;
    const buffer = focusAudioCtx.createBuffer(1, bufferSize, focusAudioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = data[i];
        data[i] *= 3.5;
    }
    const source = focusAudioCtx.createBufferSource();
    source.buffer = buffer; source.loop = true;
    const filter = focusAudioCtx.createBiquadFilter();
    filter.type = 'lowpass'; filter.frequency.value = 600;
    source.connect(filter); filter.connect(focusNoiseGain);
    source.start();
    focusAudioNodes.push(source);
}

function createFocusPinkNoise() {
    const bufferSize = focusAudioCtx.sampleRate * 4;
    const buffer = focusAudioCtx.createBuffer(1, bufferSize, focusAudioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;
    for (let i = 0; i < bufferSize; i++) {
        const w = Math.random() * 2 - 1;
        b0=0.99886*b0+w*0.0555179; b1=0.99332*b1+w*0.0750759;
        b2=0.96900*b2+w*0.1538520; b3=0.86650*b3+w*0.3104856;
        b4=0.55000*b4+w*0.5329522; b5=-0.7616*b5-w*0.0168980;
        data[i] = (b0+b1+b2+b3+b4+b5+b6+w*0.5362)*0.11;
        b6 = w*0.115926;
    }
    const source = focusAudioCtx.createBufferSource();
    source.buffer = buffer; source.loop = true;
    source.connect(focusNoiseGain);
    source.start();
    focusAudioNodes.push(source);
}

function createFocusGreenNoise() {
    const bufferSize = focusAudioCtx.sampleRate * 4;
    const buffer = focusAudioCtx.createBuffer(1, bufferSize, focusAudioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;
    for (let i = 0; i < bufferSize; i++) {
        const w = Math.random() * 2 - 1;
        b0=0.99886*b0+w*0.0555179; b1=0.99332*b1+w*0.0750759;
        b2=0.96900*b2+w*0.1538520; b3=0.86650*b3+w*0.3104856;
        b4=0.55000*b4+w*0.5329522; b5=-0.7616*b5-w*0.0168980;
        data[i] = (b0+b1+b2+b3+b4+b5+b6+w*0.5362)*0.11;
        b6 = w*0.115926;
    }
    const source = focusAudioCtx.createBufferSource();
    source.buffer = buffer; source.loop = true;
    // Filtro bandpass para el tono "verde" — más cálido que el rosa puro
    const filter = focusAudioCtx.createBiquadFilter();
    filter.type = 'bandpass'; filter.frequency.value = 1200; filter.Q.value = 0.8;
    source.connect(filter); filter.connect(focusNoiseGain);
    source.start();
    focusAudioNodes.push(source);
}

function addFocusTone(hz) {
    const osc = focusAudioCtx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = hz;
    osc.connect(focusToneGain);
    osc.start();
    focusAudioNodes.push(osc);
}


function openBreathingOverlay() {
    // Asegurarse de que el menú principal esté visible detrás
    const menu = document.getElementById('selectionMenu');
    menu.style.display = 'flex';
    menu.style.opacity = '1';
    document.getElementById('breathingOverlay').style.display = 'flex';
}
function closeBreathingOverlay() {
    document.getElementById('breathingOverlay').style.display = 'none';
    // Restaurar menú principal explícitamente
    const menu = document.getElementById('selectionMenu');
    menu.style.display = 'flex';
    menu.style.opacity = '1';
}
function openFocusnautOverlay() {
    document.getElementById('focusnautOverlay').style.display = 'flex';
}
function closeFocusnautOverlay() {
    document.getElementById('focusnautOverlay').style.display = 'none';
}

// ── REGISTRO DEL SERVICE WORKER ──────────────────────────────────────────────
// Sin esto, el SW existe pero nunca se activa y Chrome trata la app como
// un simple shortcut web, mucho más fácil de eliminar.
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js', { scope: '/' })
            .then((reg) => {
                console.log('[App] Service Worker registrado. Scope:', reg.scope);


function showUpdateBanner(worker) {
    const banner = document.createElement('div');
    banner.id = 'sw-update-banner';
    banner.style.cssText = `
        position: fixed; bottom: 16px; left: 50%; transform: translateX(-50%);
        background: #37474f; color: white; padding: 12px 20px;
        border-radius: 30px; font-family: 'Manrope', sans-serif; font-size: 0.88rem;
        font-weight: 600; display: flex; align-items: center; gap: 12px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.25); z-index: 9999;
        white-space: nowrap;
    `;
    banner.innerHTML = `
        <span>Nueva versión disponible</span>
        <button onclick="applyUpdate()" style="
            background: #4CAF50; color: white; border: none; border-radius: 20px;
            padding: 6px 14px; font-family: 'Manrope', sans-serif; font-size: 0.82rem;
            font-weight: 700; cursor: pointer;">Actualizar</button>
        <button onclick="this.closest('#sw-update-banner').remove()" style="
            background: transparent; color: rgba(255,255,255,0.6); border: none;
            font-size: 1.1rem; cursor: pointer; padding: 0 4px;">✕</button>
    `;
    document.body.appendChild(banner);
    setTimeout(() => banner.remove?.(), 12000);
    window._pendingWorker = worker;
}

function applyUpdate() {
    if (window._pendingWorker) {
        window._pendingWorker.postMessage({ type: 'SKIP_WAITING' });
    }
}
