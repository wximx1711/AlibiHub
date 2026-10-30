// Original deterministic synthesized ambience, bundled for offline playback.
const fs = require('fs');
fs.mkdirSync('assets/audio', { recursive: true });
const rate = 22050, seconds = 8;
for (const kind of ['classic', 'digital', 'office', 'cafe', 'street', 'hospital']) {
  const data = Buffer.alloc(44 + rate * seconds * 2);
  data.write('RIFF'); data.writeUInt32LE(data.length - 8, 4); data.write('WAVEfmt ', 8);
  data.writeUInt32LE(16, 16); data.writeUInt16LE(1, 20); data.writeUInt16LE(1, 22);
  data.writeUInt32LE(rate, 24); data.writeUInt32LE(rate * 2, 28); data.writeUInt16LE(2, 32); data.writeUInt16LE(16, 34);
  data.write('data', 36); data.writeUInt32LE(data.length - 44, 40);
  let seed = 713, low = 0;
  for (let i = 0; i < rate * seconds; i++) {
    const t = i / rate, sin = f => Math.sin(t * Math.PI * 2 * f);
    seed = (1664525 * seed + 1013904223) >>> 0;
    const noise = seed / 2147483648 - 1;
    low = low * 0.98 + noise * 0.02;
    let v = 0;
    if (kind === 'classic' || kind === 'digital') {
      const phase = t % 4;
      const gate = phase < 1.2 || (phase > 1.5 && phase < 2.7);
      v = gate ? (sin(kind === 'classic' ? 440 : 800) + sin(kind === 'classic' ? 480 : 1000)) * 0.22 : 0;
    } else if (kind === 'office') v = low * 0.5 + (t % 0.19 < 0.012 ? noise * 0.22 : 0);
    else if (kind === 'cafe') v = low * 1.7 + (sin(183) + sin(247)) * (0.025 + 0.015 * sin(0.75)) + (t % 2 < 0.035 ? sin(2400) * 0.08 : 0);
    else if (kind === 'street') v = low * 2 + sin(70) * (0.04 + 0.035 * sin(0.25));
    else v = low * 0.3 + (t % 2 < 0.12 ? sin(880) * 0.12 : 0);
    const fade = Math.min(1, t * 50, (seconds - t) * 50);
    data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, v * fade)) * 32767), 44 + i * 2);
  }
  fs.writeFileSync(`assets/audio/${kind}.wav`, data);
}
