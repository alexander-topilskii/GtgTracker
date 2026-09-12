import React, { useState, useEffect } from 'react';
import { Download, X, Share } from 'lucide-react';
import { haptic } from '../../utils/haptics';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [showIOSGuide, setShowIOSGuide] = useState<boolean>(false);

  useEffect(() => {
    // 1. Проверяем, запущено ли уже в Standalone режиме
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isStandalone) {
      return; // Уже установлено
    }

    // 2. Проверяем, не скрывал ли пользователь баннер недавно
    const dismissedAt = localStorage.getItem('gtg_pwa_dismissed');
    if (dismissedAt) {
      const timeDiff = Date.now() - Number(dismissedAt);
      if (timeDiff < 7 * 24 * 60 * 60 * 1000) {
        return; // Скрыто на 7 дней
      }
    }

    // 3. Определение iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    if (isIosDevice) {
      setShowBanner(true);
    }

    // 4. Перехват beforeinstallprompt для Android / Chrome
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('gtg_pwa_dismissed', String(Date.now()));
    setShowBanner(false);
    setShowIOSGuide(false);
  };

  const handleInstallClick = async () => {
    haptic.trigger('light');
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIOSGuide((prev) => !prev);
    }
  };

  if (!showBanner) return null;

  return (
    <aside aria-label="Установка приложения" className="w-full px-4 pt-2 shrink-0 animate-fade-in">
      <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-cyan-950/30 border border-emerald-500/30 backdrop-blur-md shadow-lg">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white font-sans">
                Установить GtG Tracker
              </div>
              <div className="text-[10px] font-mono text-zinc-400">
                Работа офлайн и без рамок браузера
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleInstallClick}
              className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold font-mono transition-all active:scale-95 glow-emerald"
            >
              {isIOS ? 'Инструкция' : 'Установить'}
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="p-1 rounded-lg text-zinc-400 hover:text-white transition-colors"
              title="Скрыть"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Подсказка для пользователей iPhone */}
        {showIOSGuide && (
          <div className="mt-2.5 pt-2.5 border-t border-white/[0.08] text-[11px] font-mono text-zinc-300 space-y-1.5 animate-slide-up">
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <Share className="w-3.5 h-3.5" />
              <span>Как установить на iOS (Safari):</span>
            </div>
            <p className="text-zinc-400 leading-relaxed">
              1. Нажмите кнопку <strong>«Поделиться»</strong> в нижней панели Safari.
            </p>
            <p className="text-zinc-400 leading-relaxed">
              2. Пролистайте вниз и выберите <strong>«На экран «Домой»»</strong>.
            </p>
          </div>
        )}
      </div>
    </aside>
  );
};
