/**
 * On-Device Synthesizer using Browser Web Audio API
 * Generates custom, premium chimes and alarm pulses on-demand
 */

export const ALERT_SOUNDS = [
  { id: 'chime_classic', name: 'Classic Chime', frequency: 880, type: 'sine' as const, description: 'Sweet decaying dual-harmonic chime' },
  { id: 'cosmic_pulse', name: 'Cosmic Sweep', frequency: 523.25, type: 'triangle' as const, description: 'Warm galactic swell sound wave' },
  { id: 'rapid_beep', name: 'Urgent Double Pulsar', frequency: 1200, type: 'square' as const, description: 'Rapid high-intensity repeating chirp' },
  { id: 'synth_laser', name: 'Digital Blip-Blap', frequency: 660, type: 'sawtooth' as const, description: 'Retro digital synthesizer notification' },
  { id: 'zen_tone', name: 'Zen Bowl Resonance', frequency: 330, type: 'sine' as const, description: 'Deep, meditative resonance frequency' }
];

export function playSynthesizedSound(soundId: string) {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const sound = ALERT_SOUNDS.find((s) => s.id === soundId) || ALERT_SOUNDS[0];

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = sound.type;
    osc.frequency.setValueAtTime(sound.frequency, ctx.currentTime);

    gainNode.gain.setValueAtTime(0.15, ctx.currentTime);

    // Dynamic audio envelopes for that professional polished touch
    if (sound.id === 'rapid_beep') {
      // Rapid double pulse
      osc.frequency.setValueAtTime(sound.frequency, ctx.currentTime);
      gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      
      setTimeout(() => {
        try {
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.type = sound.type;
          osc2.frequency.setValueAtTime(sound.frequency * 1.2, ctx.currentTime);
          gain2.gain.setValueAtTime(0.2, ctx.currentTime);
          gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
          osc2.connect(gain2);
          gain2.connect(ctx.destination);
          osc2.start();
          osc2.stop(ctx.currentTime + 0.2);
        } catch (e) {}
      }, 180);

    } else if (sound.id === 'chime_classic') {
      // Double note classic chime
      osc.frequency.setValueAtTime(sound.frequency, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(sound.frequency * 1.5, ctx.currentTime + 0.15);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

    } else if (sound.id === 'synth_laser') {
      // Laser slide down
      osc.frequency.setValueAtTime(sound.frequency, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.25);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

    } else if (sound.id === 'cosmic_pulse') {
      // Triangle swell
      osc.frequency.setValueAtTime(120, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(sound.frequency, ctx.currentTime + 0.12);
      gainNode.gain.setValueAtTime(0.01, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

    } else {
      // Meditation custom long decay
      osc.frequency.setValueAtTime(sound.frequency, ctx.currentTime);
      gainNode.gain.setValueAtTime(0.25, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
    }

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + (sound.id === 'zen_tone' ? 1.5 : 0.8));
  } catch (error) {
    console.warn('Web Audio API not allowed or supported yet (Interacted needed first).', error);
  }
}
