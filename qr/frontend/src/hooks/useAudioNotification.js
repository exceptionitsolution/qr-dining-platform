import { useCallback } from 'react';

/**
 * Web Audio API synthesizer for instant zero-dependency notifications
 */
export function useAudioNotification() {
  const playNewOrderChime = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      // Pleasant double bell chime
      const playTone = (freq, startTime, duration) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);

        gain.gain.setValueAtTime(0.001, ctx.currentTime + startTime);
        gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + startTime + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + startTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + startTime);
        osc.stop(ctx.currentTime + startTime + duration);
      };

      playTone(587.33, 0.0, 0.4); // D5
      playTone(880.00, 0.15, 0.6); // A5
      playTone(1174.66, 0.3, 0.8); // D6
    } catch (e) {
      console.warn('Audio playback prevented by browser policy:', e);
    }
  }, []);

  const playReadyChime = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      // Celebration chime
      const playTone = (freq, startTime, duration) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);

        gain.gain.setValueAtTime(0.001, ctx.currentTime + startTime);
        gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + startTime + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + startTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + startTime);
        osc.stop(ctx.currentTime + startTime + duration);
      };

      playTone(523.25, 0.0, 0.3); // C5
      playTone(659.25, 0.12, 0.3); // E5
      playTone(783.99, 0.24, 0.3); // G5
      playTone(1046.50, 0.36, 0.7); // C6
    } catch (e) {
      console.warn('Audio playback error:', e);
    }
  }, []);

  return { playNewOrderChime, playReadyChime };
}
