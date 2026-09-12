// Утилита тактильного и звукового отклика с поддержкой Web Audio API (для iOS Safari)
export type HapticType = 'light' | 'medium' | 'success';

class HapticManager {
  private audioContext: AudioContext | null = null;

  private initAudio() {
    if (typeof window === 'undefined') return;
    try {
      if (!this.audioContext) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          this.audioContext = new AudioCtx();
        }
      }
      if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
    } catch {
      // Игнорируем
    }
  }

  // Синтезированный короткий тактильный щелчок через Web Audio API
  playClickSound() {
    try {
      this.initAudio();
      if (!this.audioContext) return;

      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, this.audioContext.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, this.audioContext.currentTime + 0.025);

      gain.gain.setValueAtTime(0.12, this.audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.025);

      osc.connect(gain);
      gain.connect(this.audioContext.destination);

      osc.start();
      osc.stop(this.audioContext.currentTime + 0.025);
    } catch {
      // Игнорируем
    }
  }

  trigger(type: HapticType = 'light', enableSound: boolean = false) {
    // 1. Web Vibrations API (Android / поддерживаемые браузеры)
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        if (type === 'light') {
          navigator.vibrate(12);
        } else if (type === 'medium') {
          navigator.vibrate(35);
        } else if (type === 'success') {
          navigator.vibrate([25, 40, 40]);
        }
      } catch {
        // Игнорируем ошибки вибро
      }
    }

    // 2. Опциональный звуковой клик (особенно полезен для iOS)
    if (enableSound) {
      this.playClickSound();
    }
  }
}

export const haptic = new HapticManager();
