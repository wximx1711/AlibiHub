// Smooth, continuous synthesized ambience with seamless looping and zero clicks/impulses.
const fs = require('fs');
fs.mkdirSync('assets/audio', { recursive: true });
const rate = 22050, seconds = 8;

for (const kind of ['classic', 'digital', 'office', 'cafe', 'street', 'hospital']) {
  const data = Buffer.alloc(44 + rate * seconds * 2);
  data.write('RIFF'); data.writeUInt32LE(data.length - 8, 4); data.write('WAVEfmt ', 8);
  data.writeUInt32LE(16, 16); data.writeUInt16LE(1, 20); data.writeUInt16LE(1, 22);
  data.writeUInt32LE(rate, 24); data.writeUInt32LE(rate * 2, 28); data.writeUInt16LE(2, 32); data.writeUInt16LE(16, 34);
  data.write('data', 36); data.writeUInt32LE(data.length - 44, 40);

  let seed = 713;
  let low = 0;
  let low2 = 0;

  for (let i = 0; i < rate * seconds; i++) {
    const t = i / rate;
    const sin = f => Math.sin(t * Math.PI * 2 * f);

    // Linear congruential generator for soft noise
    seed = (1664525 * seed + 1013904223) >>> 0;
    const noise = seed / 2147483648 - 1;
    low = low * 0.985 + noise * 0.015; // Low-pass pink noise
    low2 = low2 * 0.992 + noise * 0.008; // Deep rumble

    let v = 0;
    if (kind === 'classic' || kind === 'digital') {
      // Ringtone alert
      const phase = t % 4;
      const gate = phase < 1.2 || (phase > 1.5 && phase < 2.7);
      v = gate ? (sin(kind === 'classic' ? 440 : 800) + sin(kind === 'classic' ? 480 : 1000)) * 0.22 : 0;
    } else if (kind === 'office') {
      // Smooth subtle air circulation and background presence (ZERO clicks/ticks)
      v = low * 0.25 + low2 * 0.15;
    } else if (kind === 'cafe') {
      // Soft gentle murmur room tone
      v = low * 0.35 + (sin(140) + sin(210)) * 0.015;
    } else if (kind === 'street') {
      // Gentle distant low rumble of street traffic
      v = low * 0.35 + low2 * 0.3 + sin(55) * 0.02;
    } else if (kind === 'hospital') {
      // Gentle quiet room tone with ultra-soft white noise (no loud beeps)
      v = low * 0.2 + low2 * 0.1;
    }

    // Seamless loop crossfade at the boundaries (0.2s fade-in and fade-out to prevent buffer pops)
    const fadeDuration = 0.2;
    let envelope = 1;
    if (t < fadeDuration) {
      envelope = t / fadeDuration;
    } else if (t > seconds - fadeDuration) {
      envelope = (seconds - t) / fadeDuration;
    }

    const sample = Math.round(Math.max(-1, Math.min(1, v * envelope)) * 32767);
    data.writeInt16LE(sample, 44 + i * 2);
  }

  fs.writeFileSync(`assets/audio/${kind}.wav`, data);
  console.log(`Regenerated smooth audio: assets/audio/${kind}.wav`);
}
