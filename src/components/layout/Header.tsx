import React from 'react';
import { Volume2, VolumeX, Settings } from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';
import { useRestTimer } from '../../hooks/useRestTimer';
import { haptic } from '../../utils/haptics';

interface HeaderProps {
  onOpenSettings?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSettings }) => {
  const { activeRecord, settings, updateSettings, lastSetTimestamp } = useWorkout();
  const { formattedRemaining, isExpired } = useRestTimer(lastSetTimestamp, settings.restIntervalMinutes);

  const dateText = React.useMemo(() => {
    const now = new Date();
    return new Intl.DateTimeFormat('ru-RU', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    }).format(now).toUpperCase();
  }, []);

  const dayBadgeText = React.useMemo(() => {
    if (activeRecord.dayType === 'REST') return 'ОТДЫХ';
    return `ДЕНЬ ${activeRecord.dayType}`;
  }, [activeRecord.dayType]);

  const handleToggleSound = () => {
    const nextSound = !settings.soundFeedbackEnabled;
    updateSettings({ soundFeedbackEnabled: nextSound });
    if (nextSound) {
      haptic.playClickSound('complete');
    }
  };

  return (
    <header className="w-full px-4 pt-3 pb-2 flex items-center justify-between border-b border-white/[0.10] bg-[#181c28]/95 backdrop-blur-md z-30 shrink-0 shadow-sm">
      <div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#ccff00] shadow-[0_0_8px_#ccff00]" />
          <h1 className="text-xs font-black tracking-[0.2em] text-white uppercase font-mono">
            GTG · KINETIC
          </h1>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.08] border border-white/[0.12] text-zinc-200 font-bold uppercase tracking-wider">
            {dayBadgeText}
          </span>
        </div>

        <div className="text-[11px] font-mono text-zinc-400 mt-1 flex items-center gap-2">
          <span className="text-zinc-400 font-medium">{dateText}</span>
          <span className="text-zinc-700">/</span>
          {isExpired ? (
            <span className="text-[#ccff00] font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ccff00] animate-ping" />
              100% готовность
            </span>
          ) : (
            <span className="text-[#f59e0b] font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />
              таймер {formattedRemaining}
            </span>
          )}
        </div>
      </div>

      {/* Кнопки быстрого звука и настроек */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleToggleSound}
          aria-label="Звук"
          className="w-9 h-9 rounded-2xl bg-[#222738] border border-white/[0.12] hover:border-white/[0.22] flex items-center justify-center text-zinc-300 hover:text-white transition-all active:scale-95"
          title={settings.soundFeedbackEnabled ? 'Звук включен' : 'Звук выключен'}
        >
          {settings.soundFeedbackEnabled ? (
            <Volume2 className="w-4 h-4 text-[#ccff00]" />
          ) : (
            <VolumeX className="w-4 h-4 text-zinc-500" />
          )}
        </button>

        {onOpenSettings && (
          <button
            type="button"
            onClick={onOpenSettings}
            aria-label="Настройки"
            className="w-9 h-9 rounded-2xl bg-[#222738] border border-white/[0.12] hover:border-white/[0.22] flex items-center justify-center text-zinc-300 hover:text-white transition-all active:scale-95"
          >
            <Settings className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
};
