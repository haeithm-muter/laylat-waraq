// One-off generator for Day 5 placeholder sound effects — pure sine-wave
// synthesis written directly to WAV (PCM), no external assets or libraries.
// Run: node scripts/generate-sounds.mjs
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const SAMPLE_RATE = 44100;
const OUT_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'sounds');

/** One tone: sine wave at `freq` Hz for `ms` milliseconds, with a short
 * linear fade-in/out envelope so notes don't click at the edges. */
function tone(freq, ms, amp = 0.3) {
  const n = Math.round((SAMPLE_RATE * ms) / 1000);
  const fadeN = Math.min(Math.round(SAMPLE_RATE * 0.008), Math.floor(n / 4)); // ~8ms fade, capped
  const samples = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const envelope = i < fadeN ? i / fadeN : i > n - fadeN ? (n - i) / fadeN : 1;
    samples[i] = Math.sin((2 * Math.PI * freq * i) / SAMPLE_RATE) * amp * envelope;
  }
  return samples;
}

/** Silence for `ms` milliseconds. */
function silence(ms) {
  return new Float64Array(Math.round((SAMPLE_RATE * ms) / 1000));
}

function concat(...chunks) {
  const total = chunks.reduce((sum, c) => sum + c.length, 0);
  const out = new Float64Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.length;
  }
  return out;
}

function writeWav(filename, samples) {
  const numSamples = samples.length;
  const dataSize = numSamples * 2; // 16-bit mono
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // PCM fmt chunk size
  buffer.writeUInt16LE(1, 20); // AudioFormat = PCM
  buffer.writeUInt16LE(1, 22); // NumChannels = mono
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28); // ByteRate
  buffer.writeUInt16LE(2, 32); // BlockAlign
  buffer.writeUInt16LE(16, 34); // BitsPerSample
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < numSamples; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(Math.round(clamped * 32767), 44 + i * 2);
  }

  writeFileSync(path.join(OUT_DIR, filename), buffer);
  console.log(`wrote ${filename} (${(dataSize / 1024).toFixed(1)} KB, ${(numSamples / SAMPLE_RATE).toFixed(2)}s)`);
}

// C5, E5, G5, C6 — a bright major arpeggio for "win"
const NOTE = { C5: 523.25, E5: 659.25, G5: 783.99, C6: 1046.5, A4: 440.0, F4: 349.23 };

writeWav('correct.wav', concat(tone(NOTE.C5, 100), tone(NOTE.E5, 150)));
writeWav('wrong.wav', concat(tone(NOTE.A4, 100, 0.28), tone(NOTE.F4, 180, 0.28)));
writeWav('tick.wav', tone(900, 50, 0.22));
writeWav('alarm.wav', concat(tone(880, 120, 0.32), silence(80), tone(880, 120, 0.32)));
writeWav(
  'win.wav',
  concat(tone(NOTE.C5, 90), tone(NOTE.E5, 90), tone(NOTE.G5, 90), tone(NOTE.C6, 160))
);
