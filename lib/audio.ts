/**
 * Audio utility for playing sound effects
 */

export function playChimeSound() {
  try {
    const audio = new Audio('/magic-chime.mp3');
    audio.volume = 0.6;
    audio.play().catch((err) => {
      console.log('[v0] Chime sound play failed:', err);
    });
  } catch (err) {
    console.log('[v0] Audio playback error:', err);
  }
}

export function playSuccessSound() {
  try {
    // Use Web Audio API to create a success beep if mp3 unavailable
    const context = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.1);

    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + 0.1);
  } catch (err) {
    console.log('[v0] Success sound error:', err);
  }
}
