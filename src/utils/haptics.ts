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

  // Синтезированные звуки Web Audio API (snap и complete)
  playClickSound(type: 'snap' | 'complete' = 'snap') {
    try {
      this.initAudio();
      if (!this.audioContext) return;
      const now = this.audioContext.currentTime;

      if (type === 'snap') {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.03);

        gain.gain.setValueAtTime(0.09, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

        osc.connect(gain);
        gain.connect(this.audioContext.destination);

        osc.start(now);
        osc.stop(now + 0.03);
      } else if (type === 'complete') {
        [523.25, 659.25, 1046.5].forEach((freq, i) => {
          if (!this.audioContext) return;
          const osc = this.audioContext.createOscillator();
          const gain = this.audioContext.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.035);
          gain.gain.setValueAtTime(0.12 - i * 0.02, now + i * 0.035);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.035 + 0.35);
          osc.connect(gain);
          gain.connect(this.audioContext.destination);
          osc.start(now + i * 0.035);
          osc.stop(now + i * 0.035 + 0.35);
        });
      }
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
      this.playClickSound(type === 'success' ? 'complete' : 'snap');
    }
  }
}

export const haptic = new HapticManager();
