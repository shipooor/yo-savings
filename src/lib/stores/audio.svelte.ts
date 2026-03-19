// Ambient audio system — Web Audio API
// Lazy-initialized on first user gesture (browser requirement)

let enabled = $state(false);

let actx: AudioContext | null = null;
let ambNodes: { master: GainNode; oscs: OscillatorNode[] } | null = null;
let shimmerTimer: ReturnType<typeof setTimeout> | null = null;
let lastDropTime = 0;
const DROP_COOLDOWN = 0.4;

// Pentatonic shimmer palette
const SHIMMER_NOTES = [220, 261.6, 329.6, 392, 440, 523.3, 659.3];
// Chime arpeggio: C4 E4 G4 C5
const CHIME_NOTES = [262, 330, 392, 523];

function initAudioContext(): void {
	if (typeof window === 'undefined') return;
	if (!actx) {
		actx = new (window.AudioContext || (window as any).webkitAudioContext)();
	}
}

// --- Ambient drone layer ---

function startAmbient(): void {
	if (!actx || ambNodes) return;

	const t = actx.currentTime;

	// Master gain for entire ambient layer — 3s fade in
	const master = actx.createGain();
	master.gain.setValueAtTime(0, t);
	master.gain.linearRampToValueAtTime(1, t + 3);
	master.connect(actx.destination);

	// Base drone — two detuned sines for warmth
	const droneA = actx.createOscillator();
	const droneB = actx.createOscillator();
	const droneG = actx.createGain();
	droneA.type = 'sine';
	droneB.type = 'sine';
	droneA.frequency.setValueAtTime(55, t); // A1
	droneB.frequency.setValueAtTime(55.15, t); // slightly detuned — slow beating
	droneG.gain.setValueAtTime(0.035, t);
	droneA.connect(droneG);
	droneB.connect(droneG);
	droneG.connect(master);
	droneA.start();
	droneB.start();

	// Pad — soft fifth above, with LFO on gain for breathing
	const padO = actx.createOscillator();
	const padG = actx.createGain();
	const lfo = actx.createOscillator();
	const lfoG = actx.createGain();
	padO.type = 'sine';
	padO.frequency.setValueAtTime(82.4, t); // E2
	padG.gain.setValueAtTime(0.02, t);
	lfo.frequency.setValueAtTime(0.08, t); // ~12s breath cycle
	lfoG.gain.setValueAtTime(0.015, t);
	lfo.connect(lfoG);
	lfoG.connect(padG.gain);
	padO.connect(padG);
	padG.connect(master);
	padO.start();
	lfo.start();

	// High harmonic — barely audible octave shimmer
	const hiO = actx.createOscillator();
	const hiG = actx.createGain();
	hiO.type = 'sine';
	hiO.frequency.setValueAtTime(440, t); // A4
	hiG.gain.setValueAtTime(0.004, t);
	hiO.connect(hiG);
	hiG.connect(master);
	hiO.start();

	ambNodes = { master, oscs: [droneA, droneB, padO, lfo, hiO] };

	// Random shimmers — gentle high tones that drift in and out
	scheduleShimmer();
}

function scheduleShimmer(): void {
	if (shimmerTimer) clearTimeout(shimmerTimer);
	function tick() {
		if (!enabled || !actx) return;
		playShimmer();
		// Re-schedule with a fresh random delay each time
		shimmerTimer = setTimeout(tick, 4000 + Math.random() * 6000);
	}
	shimmerTimer = setTimeout(tick, 4000 + Math.random() * 6000);
}

function stopAmbient(): void {
	if (!ambNodes || !actx) return;

	const t = actx.currentTime;
	ambNodes.master.gain.linearRampToValueAtTime(0, t + 2); // 2s fade out

	const nodes = ambNodes;
	setTimeout(() => {
		nodes.oscs.forEach((o) => {
			try {
				o.stop();
			} catch {
				/* already stopped */
			}
		});
		try {
			nodes.master.disconnect();
		} catch {
			/* already disconnected */
		}
	}, 2500);

	ambNodes = null;

	if (shimmerTimer) {
		clearTimeout(shimmerTimer);
		shimmerTimer = null;
	}
}

// --- Shimmer — random pentatonic tone that fades in/out ---

function playShimmer(): void {
	if (!enabled || !actx) return;

	const freq = SHIMMER_NOTES[Math.floor(Math.random() * SHIMMER_NOTES.length)];
	const dur = 2 + Math.random() * 3;
	const t = actx.currentTime;

	const o = actx.createOscillator();
	const g = actx.createGain();
	o.type = 'sine';
	o.frequency.setValueAtTime(freq, t);
	o.frequency.linearRampToValueAtTime(freq * (1 + (Math.random() - 0.5) * 0.01), t + dur);
	g.gain.setValueAtTime(0, t);
	g.gain.linearRampToValueAtTime(0.008 + Math.random() * 0.006, t + dur * 0.3);
	g.gain.linearRampToValueAtTime(0, t + dur);
	o.connect(g);
	g.connect(actx.destination);
	o.start();
	o.stop(t + dur + 0.1);
}

// --- UI sounds ---

function playDrop(): void {
	if (typeof window === 'undefined') return;
	if (!enabled) return;
	if (!actx) initAudioContext();
	if (!actx) return;

	const now = actx.currentTime;
	if (now - lastDropTime < DROP_COOLDOWN) return;
	lastDropTime = now;

	// Fundamental — warm low tone
	const o1 = actx.createOscillator();
	const g1 = actx.createGain();
	o1.type = 'sine';
	o1.frequency.setValueAtTime(280, now);
	o1.frequency.exponentialRampToValueAtTime(220, now + 0.3);
	g1.gain.setValueAtTime(0, now);
	g1.gain.linearRampToValueAtTime(0.035, now + 0.01);
	g1.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
	o1.connect(g1);
	g1.connect(actx.destination);
	o1.start(now);
	o1.stop(now + 0.45);

	// Harmonic — soft octave above for sparkle
	const o2 = actx.createOscillator();
	const g2 = actx.createGain();
	o2.type = 'sine';
	o2.frequency.setValueAtTime(560, now);
	o2.frequency.exponentialRampToValueAtTime(440, now + 0.2);
	g2.gain.setValueAtTime(0, now);
	g2.gain.linearRampToValueAtTime(0.012, now + 0.01);
	g2.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
	o2.connect(g2);
	g2.connect(actx.destination);
	o2.start(now);
	o2.stop(now + 0.3);
}

function playChime(): void {
	if (typeof window === 'undefined') return;
	if (!enabled) return;
	if (!actx) initAudioContext();
	if (!actx) return;

	const now = actx.currentTime;
	CHIME_NOTES.forEach((f, i) => {
		const o = actx!.createOscillator();
		const g = actx!.createGain();
		o.type = 'sine';
		o.frequency.setValueAtTime(f, now + i * 0.12);
		g.gain.setValueAtTime(0, now + i * 0.12);
		g.gain.linearRampToValueAtTime(0.025, now + i * 0.12 + 0.02);
		g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.5);
		o.connect(g);
		g.connect(actx!.destination);
		o.start(now + i * 0.12);
		o.stop(now + i * 0.12 + 0.55);
	});
}

// --- Public API ---

export const audio = {
	get enabled() {
		return enabled;
	},

	toggle(): void {
		if (typeof window === 'undefined') return;
		initAudioContext();
		enabled = !enabled;
		if (enabled) {
			playDrop();
			startAmbient();
		} else {
			stopAmbient();
		}
	},

	drop(): void {
		playDrop();
	},

	chime(): void {
		playChime();
	}
};
