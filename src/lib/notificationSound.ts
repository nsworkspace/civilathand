"use client";

// ─────────────────────────────────────────────────────────────────────
// Notification sound — synthesized entirely in-browser with the Web
// Audio API. There is no audio file, sample, or third-party asset
// involved, so there is nothing here that could ever carry a copyright
// or licensing claim — every tone is generated from a plain sine wave
// at request time.
//
// Two distinct chimes are exposed so the client site and the admin
// panel don't sound identical:
//   playClientChime()  — soft two-note "ding-dong", used for the
//                         visitor-facing notification bell.
//   playAdminChime()   — slightly brighter three-note alert, used for
//                         new items landing in the admin panel.
//
// Both are safe to call from anywhere: they lazily create a single
// shared AudioContext, no-op on the server, and never throw (a blocked
// autoplay policy just means the tone silently doesn't play — it never
// breaks the calling code).
// ─────────────────────────────────────────────────────────────────────

let sharedCtx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext || (window as any).webkitAudioContext;
  if (!Ctor) return null;
  if (!sharedCtx) sharedCtx = new Ctor();
  if (sharedCtx.state === "suspended") {
    sharedCtx.resume().catch(() => {});
  }
  return sharedCtx;
}

interface Tone {
  freq: number;
  start: number; // seconds from now
  duration: number; // seconds
  gain?: number;
}

function playTones(tones: Tone[]) {
  try {
    const ctx = getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    tones.forEach(({ freq, start, duration, gain = 0.16 }) => {
      const osc = ctx.createOscillator();
      const amp = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const t0 = now + start;
      const t1 = t0 + duration;
      // Quick fade in/out so each note is a clean "ding", never a click.
      amp.gain.setValueAtTime(0, t0);
      amp.gain.linearRampToValueAtTime(gain, t0 + 0.015);
      amp.gain.linearRampToValueAtTime(gain * 0.5, t1 - duration * 0.35);
      amp.gain.linearRampToValueAtTime(0, t1);
      osc.connect(amp);
      amp.connect(ctx.destination);
      osc.start(t0);
      osc.stop(t1 + 0.02);
    });
  } catch {
    // Audio is a nice-to-have. Never let a sound failure affect the app.
  }
}

/** Soft two-note chime for the client-facing notification bell (Header.tsx). */
export function playClientChime() {
  playTones([
    { freq: 880, start: 0, duration: 0.16, gain: 0.15 },
    { freq: 1318.5, start: 0.13, duration: 0.22, gain: 0.13 },
  ]);
}

/** Slightly brighter three-note alert for new items in the Admin panel. */
export function playAdminChime() {
  playTones([
    { freq: 987.77, start: 0, duration: 0.12, gain: 0.14 },
    { freq: 1244.5, start: 0.1, duration: 0.12, gain: 0.14 },
    { freq: 1567.98, start: 0.2, duration: 0.2, gain: 0.15 },
  ]);
}

/**
 * Browsers block audio until the user has interacted with the page at
 * least once. Call this from any early click/tap/keydown handler to
 * "warm up" the shared AudioContext so the very first real chime later
 * isn't silently dropped.
 */
export function primeNotificationAudio() {
  getContext();
}
