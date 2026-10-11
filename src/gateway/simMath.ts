/** Deterministic helpers for the simulated equipment: the same tag gives the same numbers on every reload. */

/** Deterministic 0..1 from a string (stable per tag across reloads). */
export function hash01(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return ((h >>> 0) % 10_000) / 10_000;
}

/** A value that wanders smoothly around `base` (± spread), deterministic per key. */
export function wander(key: string, now: number, base: number, spread: number, periodMin = 7): number {
  const seed = hash01(key) * 1000;
  const t = now / (periodMin * 60_000);
  const n = Math.sin(t * 2.1 + seed) * 0.55 + Math.sin(t * 5.3 + seed * 1.7) * 0.3 + Math.sin(t * 13.1 + seed * 2.3) * 0.15;
  return base + n * spread;
}
