import React from 'react';
import { DayType } from '../../types/workout';
import { useWorkout } from '../../context/WorkoutContext';
import { haptic } from '../../utils/haptics';

export const DaySelector: React.FC = () => {
  const { activeRecord, switchDayType, settings } = useWorkout();

  const handleSelect = (dayType: DayType) => {
    if (dayType === activeRecord.dayType) return;
    haptic.trigger('light', settings.soundFeedbackEnabled);
    switchDayType(dayType);
  };

  const options: { type: DayType; label: string; short: string }[] = [
    { type: 'A', label: 'День А', short: 'Верх (База)' },
    { type: 'B', label: 'День Б', short: 'Руки & Ноги' },
    { type: 'REST', label: 'Отдых', short: 'Пауза' },
  ];

  return (
    <div className="w-full px-4 pt-2.5 pb-1 shrink-0">
      <div className="p-1 rounded-2xl bg-zinc-900/90 border border-white/[0.08] flex items-center gap-1 shadow-inner backdrop-blur-md">
        {options.map((opt) => {
          const isActive = activeRecord.dayType === opt.type;

          return (
            <button
              key={opt.type}
              onClick={() => handleSelect(opt.type)}
              className={`flex-1 py-1.5 px-2 rounded-xl transition-all duration-200 text-center relative ${
                isActive
                  ? 'bg-zinc-800 text-white font-semibold shadow-md border border-white/10'
                  : 'text-zinc-400 hover:text-zinc-200 active:scale-95'
              }`}
            >
              {isActive && (
                <span className="absolute top-1 right-2 w-1.5 h-1.5 rounded-full bg-[#ccff00] glow-neon" />
              )}
              <div className="text-xs font-bold font-sans tracking-tight">
                {opt.label}
              </div>
              <div
                className={`text-[9px] font-mono transition-colors ${
                  isActive ? 'text-[#ccff00]' : 'text-zinc-500'
                }`}
              >
                {opt.short}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
