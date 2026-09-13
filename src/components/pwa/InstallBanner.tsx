import React, { useState, useEffect } from 'react';
import { Download, Smartphone, Share, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { haptic } from '../../utils/haptics';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [showGuide, setShowGuide] = useState<boolean>(false);
  const [installedSuccessfully, setInstalledSuccessfully] = useState<boolean>(false);

  useEffect(() => {
    // 1. Проверяем режим Standalone
    const checkStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;

    setIsStandalone(checkStandalone);

    // 2. Проверка iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // 3. Перехват beforeinstallprompt для Android / Chrome
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    haptic.trigger('light');
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setInstalledSuccessfully(true);
      }
      setDeferredPrompt(null);
    } else {
      setShowGuide((prev) => !prev);
    }
  };

  if (isStandalone || installedSuccessfully) {
    return (
      <div className="p-4 rounded-2xl bg-[#131622] border border-[#ccff00]/30 shadow-xl shadow-black/40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#ccff00]/15 border border-[#ccff00]/30 flex items-center justify-center text-[#ccff00] shrink-0">
            <Check className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="text-xs font-bold text-white font-sans flex items-center gap-1.5">
              Приложение установлено
              <span className="px-1.5 py-0.2 rounded-full bg-[#ccff00]/20 text-[#ccff00] font-mono text-[9px]">
                Standalone
              </span>
            </div>
            <div className="text-[11px] font-mono text-zinc-400 mt-0.5">
              Запущено с домашнего экрана. Доступно 100% офлайн.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-2xl bg-[#131622] border border-white/[0.12] shadow-xl shadow-black/40 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#ccff00]/10 border border-[#ccff00]/25 flex items-center justify-center text-[#ccff00] shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white font-sans">
              Установить на устройство (PWA)
            </h3>
            <p className="text-[11px] font-mono text-zinc-400 mt-0.5">
              Полноэкранный режим без рамок браузера и мгновенный доступ.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1">
        {deferredPrompt ? (
          <button
            type="button"
            onClick={handleInstallClick}
            className="flex-1 py-2.5 px-4 rounded-xl bg-[#ccff00] hover:bg-[#d9f99d] text-black text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all active:scale-98 shadow-md shadow-[#ccff00]/25"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span>Установить сейчас</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              haptic.trigger('light');
              setShowGuide((prev) => !prev);
            }}
            className="flex-1 py-2.5 px-4 rounded-xl bg-[#1a1f2c] hover:bg-[#222838] text-zinc-200 text-xs font-mono font-semibold flex items-center justify-center gap-2 border border-white/[0.08] transition-all active:scale-98"
          >
            <Share className="w-3.5 h-3.5 text-[#ccff00]" />
            <span>Инструкция по установке</span>
            {showGuide ? (
              <ChevronUp className="w-3.5 h-3.5 text-zinc-400" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
            )}
          </button>
        )}
      </div>

      {/* Раскрывающаяся инструкция */}
      {showGuide && (
        <div className="p-3 rounded-xl bg-zinc-900/90 border border-white/10 text-xs font-mono text-zinc-300 space-y-2 animate-fade-in">
          {isIOS ? (
            <>
              <div className="flex items-center gap-1.5 text-[#ccff00] font-bold">
                <Share className="w-3.5 h-3.5" />
                <span>Для пользователей iPhone / iPad (Safari):</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-zinc-400 leading-relaxed text-[11px]">
                <li>Нажмите кнопку <strong>«Поделиться»</strong> (иконка со стрелкой вверх) в нижней панели Safari.</li>
                <li>Пролистайте меню вниз и выберите <strong>«На экран «Домой»»</strong> (Add to Home Screen).</li>
                <li>Нажмите <strong>«Добавить»</strong> в правом верхнем углу.</li>
              </ol>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1.5 text-[#ccff00] font-bold">
                <Download className="w-3.5 h-3.5" />
                <span>Для Android / Chrome:</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-zinc-400 leading-relaxed text-[11px]">
                <li>Нажмите на меню браузера (<strong>три точки</strong> в правом верхнем углу).</li>
                <li>Выберите пункт <strong>«Установить приложение»</strong> или <strong>«Добавить на главный экран»</strong>.</li>
              </ol>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export const InstallBlock = InstallBanner;
