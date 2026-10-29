/**
 * How loud Bryan is right now, read off the call's audio with Web Audio. The
 * call look's ring follows it, and it can tell when he has actually gone
 * quiet, which Anam's own events only report once a whole line is done.
 *
 * The level is smoothed the way a speaking indicator is: it jumps up with a
 * syllable and eases back down over a few hundred milliseconds, so the gaps
 * between words don't flicker. The smoothing runs on elapsed time, not on how
 * often `level()` is read, so a drawing loop and a slower check can share it.
 */

/**
 * The loudness (dBFS) that reads 0 and 1. On a live call his voice measured
 * -31 at the 25th percentile, -20 at the median and -11 at the 90th, peaking
 * near -7; pauses between phrases fell to -80 and an idle stream sits at
 * -110. So -50 is safely below speech, and -10 leaves headroom for the ring
 * to breathe instead of sitting full.
 */
const FLOOR_DB = -50;
const CEILING_DB = -10;
/** How fast the level rises to a louder sound, and falls after it (seconds). */
const ATTACK = 0.04;
const RELEASE = 0.28;

export type VoiceLevel = {
  /** Reads this stream from now on, in place of any before it. */
  listen: (stream: MediaStream) => void;
  /** The smoothed loudness, from 0 (silent) to 1 (speaking up). */
  level: () => number;
  /** Lets go of the stream and closes the audio context. */
  stop: () => void;
};

/**
 * Call it from a click (the call's start button): browsers only run an
 * AudioContext that a user gesture started. Without Web Audio it reads 0.
 */
export function createVoiceLevel(): VoiceLevel {
  let context: AudioContext | null = null;
  try {
    context = new AudioContext();
    void context.resume().catch(() => {});
  } catch {
    // No Web Audio here; the meter stays at silence.
  }
  let source: MediaStreamAudioSourceNode | null = null;
  let analyser: AnalyserNode | null = null;
  let samples: Float32Array<ArrayBuffer> | null = null;
  let smoothed = 0;
  let readAt = 0;

  return {
    listen(stream) {
      if (!context || context.state === "closed" || !stream.getAudioTracks().length) return;
      source?.disconnect();
      if (!analyser) {
        analyser = context.createAnalyser();
        analyser.fftSize = 1024;
        samples = new Float32Array(analyser.fftSize);
        // A silent path to the speakers: some browsers only process nodes
        // that reach the output. The sound itself plays from the <video>.
        const sink = context.createGain();
        sink.gain.value = 0;
        analyser.connect(sink).connect(context.destination);
      }
      try {
        source = context.createMediaStreamSource(stream);
        source.connect(analyser);
      } catch {
        source = null;
      }
    },

    level() {
      const now = performance.now();
      // Capped, so a long pause between reads can't jump the smoothing.
      const elapsed = readAt ? Math.min((now - readAt) / 1000, 0.25) : 0;
      readAt = now;

      let target = 0;
      if (analyser && samples && source) {
        analyser.getFloatTimeDomainData(samples);
        let sum = 0;
        for (const sample of samples) sum += sample * sample;
        const db = 20 * Math.log10(Math.sqrt(sum / samples.length) || 1e-9);
        target = Math.min(1, Math.max(0, (db - FLOOR_DB) / (CEILING_DB - FLOOR_DB)));
      }
      const tau = target > smoothed ? ATTACK : RELEASE;
      smoothed += (target - smoothed) * (1 - Math.exp(-elapsed / tau));
      return smoothed;
    },

    stop() {
      source?.disconnect();
      source = null;
      analyser = null;
      samples = null;
      smoothed = 0;
      void context?.close().catch(() => {});
      context = null;
    },
  };
}
