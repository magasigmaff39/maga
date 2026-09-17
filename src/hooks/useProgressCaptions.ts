import { useEffect, useState } from 'react';

/**
 * Rotates human-readable progress captions while a long AI request runs ("Reading your portfolio…",
 * "Checking KAIST requirements…"). Purely cosmetic — the captions describe the real pipeline stages.
 */
export function useProgressCaptions(active: boolean, captions: string[], intervalMs = 3500): string {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (!active) {
      setIndex(0);
      return;
    }
    const id = window.setInterval(() => setIndex((i) => Math.min(i + 1, captions.length - 1)), intervalMs);
    return () => window.clearInterval(id);
  }, [active, captions.length, intervalMs]);
  return active ? captions[Math.min(index, captions.length - 1)] || '' : '';
}
