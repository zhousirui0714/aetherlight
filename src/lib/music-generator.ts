const PENTATONIC_SCALE = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 783.99, 880.0];

const STYLE_CONFIG: Record<string, { waveform: OscillatorType; baseOctave: number; tempo: number; notes: number }> = {
  "古琴雅韵": { waveform: "sine", baseOctave: 2, tempo: 0.6, notes: 12 },
  "琵琶铮铮": { waveform: "triangle", baseOctave: 3, tempo: 0.35, notes: 20 },
  "笛箫悠扬": { waveform: "sine", baseOctave: 4, tempo: 0.5, notes: 14 },
  "丝竹合奏": { waveform: "triangle", baseOctave: 3, tempo: 0.4, notes: 16 },
  "戏曲唱腔": { waveform: "sawtooth", baseOctave: 3, tempo: 0.45, notes: 15 },
  "民间乐曲": { waveform: "square", baseOctave: 3, tempo: 0.3, notes: 18 },
};

export interface GeneratedMusic {
  style: string;
  prompt: string;
  duration: number;
  noteCount: number;
}

let audioCtx: AudioContext | null = null;
let currentStop: (() => void) | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
}

export function generateMelody(style: string, prompt: string): GeneratedMusic {
  const config = STYLE_CONFIG[style] || STYLE_CONFIG["古琴雅韵"];
  
  let seed = 0;
  for (let i = 0; i < prompt.length; i++) {
    seed = ((seed << 5) - seed + prompt.charCodeAt(i)) | 0;
  }
  
  return {
    style,
    prompt,
    duration: config.notes * config.tempo + 1,
    noteCount: config.notes,
  };
}

export function playMelody(style: string, prompt: string, onProgress?: (t: number) => void): { stop: () => void; duration: number } {
  stopMelody();
  
  const ctx = getCtx();
  const config = STYLE_CONFIG[style] || STYLE_CONFIG["古琴雅韵"];
  
  let seed = 0;
  for (let i = 0; i < prompt.length; i++) {
    seed = ((seed << 5) - seed + prompt.charCodeAt(i)) | 0;
  }
  
  function rand(): number {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  }
  
  const notes: { freq: number; start: number; duration: number }[] = [];
  let time = 0;
  
  for (let i = 0; i < config.notes; i++) {
    const idx = Math.floor(rand() * PENTATONIC_SCALE.length);
    const freq = PENTATONIC_SCALE[idx] * Math.pow(2, config.baseOctave - 3);
    const dur = config.tempo * (0.5 + rand() * 1);
    notes.push({ freq, start: time, duration: dur });
    time += dur * (0.7 + rand() * 0.3);
  }
  
  const totalDuration = time + 0.5;
  const startTime = ctx.currentTime;
  const masterGain = ctx.createGain();
  masterGain.gain.value = 0.15;
  masterGain.connect(ctx.destination);
  
  const oscillators: OscillatorNode[] = [];
  
  notes.forEach(({ freq, start, duration }) => {
    const osc = ctx.createOscillator();
    osc.type = config.waveform;
    osc.frequency.value = freq;
    
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, startTime + start);
    gain.gain.linearRampToValueAtTime(0.8, startTime + start + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + start + duration);
    
    osc.connect(gain);
    gain.connect(masterGain);
    
    osc.start(startTime + start);
    osc.stop(startTime + start + duration + 0.05);
    
    oscillators.push(osc);
  });
  
  let stopped = false;
  const stop = () => {
    if (stopped) return;
    stopped = true;
    oscillators.forEach((o) => {
      try { o.stop(); } catch {}
    });
    currentStop = null;
  };
  
  currentStop = stop;
  
  if (onProgress) {
    const interval = setInterval(() => {
      const elapsed = ctx.currentTime - startTime;
      if (elapsed >= totalDuration || stopped) {
        clearInterval(interval);
        if (!stopped) currentStop = null;
        return;
      }
      onProgress(Math.min(1, elapsed / totalDuration));
    }, 100);
  }
  
  return { stop, duration: totalDuration };
}

export function stopMelody() {
  if (currentStop) {
    currentStop();
    currentStop = null;
  }
}
