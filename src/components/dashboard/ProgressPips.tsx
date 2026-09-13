import React from 'react';

interface ProgressPipsProps {
  targetSets: number;
  completedSetsCount: number;
  onPipClick?: (index: number) => void;
}

export const ProgressPips: React.FC<ProgressPipsProps> = ({
  targetSets,
  completedSetsCount,
  onPipClick,
}) => {
  const pips = Array.from({ length: Math.max(targetSets, completedSetsCount) });

  return (
    <div className="flex items-center gap-1.5 py-1">
      {pips.map((_, i) => {
        const isCompleted = i < completedSetsCount;
        const isExtra = i >= targetSets;

        return (
          <button
            key={i}
            type="button"
            onClick={() => onPipClick?.(i)}
            title={`Подход ${i + 1}${isCompleted ? ' (выполнен)' : ''}`}
            className={`h-2.5 rounded-full transition-all duration-300 relative ${
              pips.length > 5 ? 'w-4' : 'w-5 sm:w-6'
            } ${
              isCompleted
                ? isExtra
                  ? 'bg-cyan-400 glow-cyan shadow-[0_0_10px_rgba(6,182,212,0.8)]'
                  : 'bg-[#ccff00] glow-neon shadow-[0_0_10px_rgba(204,255,0,0.8)]'
                : 'bg-zinc-800 border border-white/10'
            }`}
          />
        );
      })}
    </div>
  );
};
