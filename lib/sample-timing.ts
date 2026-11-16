// Sample-mode AI response time: 4 to 8 seconds with jitter, so the staged progress steps read like a
// real call. Live calls add no delay; they report the measured latency instead.
export function sampleDelayMs(): number {
  return 4000 + Math.round(Math.random() * 4000);
}

export function wait(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms));
}
