import React from 'react';
import { useWorkout } from '../../context/WorkoutContext';
import { useRestTimer } from '../../hooks/useRestTimer';
import { Timer, Zap, Sparkles } from 'lucide-react';

export const RestTimerWidget: React.FC = () => {
  const { lastSetTimestamp, settings, activeRecord } = useWorkout();
  const { formattedTime, readinessState, readinessPercent, statusText } = useRestTimer(
    lastSetTimestamp,
    settings.restIntervalMinutes
  );

  // Если это день отдыха, таймер не показывается
  if (activeRecord.dayType === 'REST') return null;

  const isReady = readinessState === 'READY' || readinessState === 'IDLE';
  const isApproaching = readinessState === 'APPROACHING';

  return (
    <div
      className={`w-full p-3.5 rounded-2xl border transition-all duration-300 relative overflow-hidden backdrop-blur-md ${
        isReady
          ? 'bg-[#ccff00]/10 border-[#ccff00]/30 glow-neon'
          : isApproaching
          ? 'bg-cyan-950/20 border-cyan-500/30 glow-cyan'
          : 'bg-[#12151f]/90 border-white/[0.08]'
      }`}
    >
      {/* Фоновый прогресс-индикатор готовности */}
      <div
        className={`absolute bottom-0 left-0 h-1 transition-all duration-1000 ${
          isReady
            ? 'bg-[#ccff00] glow-neon'
            : isApproaching
            ? 'bg-cyan-400 glow-cyan'
            : 'bg-zinc-600'
        }`}
        style={{ width: `${readinessPercent}%` }}
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-300 ${
              isReady
                ? 'bg-[#ccff00]/20 border-[#ccff00]/40 text-[#ccff00]'
                : isApproaching
                ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400'
                : 'bg-zinc-800 border-white/5 text-zinc-400'
            }`}
          >
            {isReady ? (
              <Zap className="w-5 h-5 fill-[#ccff00]/30 text-[#ccff00] animate-pulse" />
            ) : isApproaching ? (
              <Sparkles className="w-5 h-5 text-cyan-400" />
            ) : (
              <Timer className="w-5 h-5" />
            )}
          </div>

          <div>
            <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>С последнего подхода прошло</span>
              {isReady && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#ccff00] animate-ping" />
              )}
            </div>

            <div className="flex items-baseline gap-2 mt-0.5">
              <span
                className={`text-lg font-bold font-mono tracking-tight transition-colors ${
                  isReady
                    ? 'text-[#ccff00] text-glow-neon'
                    : isApproaching
                    ? 'text-cyan-300'
                    : 'text-zinc-200'
                }`}
              >
                {formattedTime}
              </span>

              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                  isReady
                    ? 'bg-[#ccff00]/15 border-[#ccff00]/30 text-[#ccff00]'
                    : isApproaching
                    ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400'
                    : 'bg-zinc-800/80 border-white/5 text-zinc-400'
                }`}
              >
                {readinessPercent}% готовности
              </span>
            </div>
          </div>
        </div>

        {/* Статус-бейдж */}
        <div className="text-right hidden sm:block">
          <span
            className={`text-[11px] font-mono font-medium block ${
              isReady
                ? 'text-[#ccff00]'
                : isApproaching
                ? 'text-cyan-400'
                : 'text-zinc-400'
            }`}
          >
            {statusText}
          </span>
        </div>
      </div>
    </div>
  );
};
