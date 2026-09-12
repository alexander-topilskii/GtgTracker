import React, { useRef } from 'react';
import { ExerciseConfig } from '../../types/workout';
import { useWorkout } from '../../context/WorkoutContext';
import { ProgressPips } from './ProgressPips';
import { Plus, SlidersHorizontal, Check } from 'lucide-react';
import { haptic } from '../../utils/haptics';
import { triggerNeonBurst } from '../../utils/celebration';

interface ExerciseCardProps {
  exercise: ExerciseConfig;
  onOpenModal: (exercise: ExerciseConfig) => void;
}

export const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exercise,
  onOpenModal,
}) => {
  const { activeRecord, logSet, settings } = useWorkout();
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Все подходы этого упражнения за сегодня
  const sets = activeRecord.completedSets.filter(
    (s) => s.exerciseId === exercise.id
  );
  const completedCount = sets.length;
  const isTargetCompleted = completedCount >= exercise.targetSets;
  const totalReps = sets.reduce((acc, s) => acc + s.reps, 0);

  // Быстрое добавление подхода
  const handleQuickAdd = (e?: React.MouseEvent<HTMLButtonElement>) => {
    const isFinishing = completedCount + 1 >= exercise.targetSets;
    haptic.trigger(isFinishing ? 'success' : 'light', settings.soundFeedbackEnabled);

    if (isFinishing && !isTargetCompleted) {
      if (e) {
        const rect = e.currentTarget.getBoundingClientRect();
        const originX = (rect.left + rect.width / 2) / window.innerWidth;
        const originY = (rect.top + rect.height / 2) / window.innerHeight;
        triggerNeonBurst(originX, originY);
      } else {
        triggerNeonBurst(0.5, 0.5);
      }
    }

    logSet(exercise);
  };

  // Обработка долгого тапа
  const startLongPress = () => {
    longPressTimerRef.current = setTimeout(() => {
      haptic.trigger('medium', settings.soundFeedbackEnabled);
      onOpenModal(exercise);
    }, 450);
  };

  const cancelLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  return (
    <div
      onMouseDown={startLongPress}
      onMouseUp={cancelLongPress}
      onMouseLeave={cancelLongPress}
      onTouchStart={startLongPress}
      onTouchEnd={cancelLongPress}
      className={`relative w-full p-3.5 rounded-2xl border transition-all duration-200 ${
        isTargetCompleted
          ? 'bg-emerald-950/20 border-emerald-500/30'
          : 'bg-[#12151f]/80 backdrop-blur-md border-white/[0.08] hover:border-white/15'
      }`}
    >
      {/* Верхняя строка: название и кнопка настроек */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-white font-sans tracking-tight leading-tight">
              {exercise.name}
            </h3>
            {isTargetCompleted && (
              <span className="flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-mono font-semibold">
                <Check className="w-2.5 h-2.5 stroke-[3]" />
                Готово
              </span>
            )}
          </div>
          <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
            Норматив: <span className="text-zinc-200">{exercise.defaultReps} повт.</span>
            {exercise.weight ? ` • ${exercise.weight} кг` : ''}
          </p>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenModal(exercise);
          }}
          className="w-8 h-8 rounded-xl bg-zinc-800/60 hover:bg-zinc-700/80 active:scale-90 flex items-center justify-center text-zinc-400 hover:text-white transition-all border border-white/5 shrink-0"
          title="Настройки подхода"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Средняя строка: прогресс-пипы и счетчик */}
      <div className="flex items-center justify-between mb-3">
        <ProgressPips
          targetSets={exercise.targetSets}
          completedSetsCount={completedCount}
          onPipClick={() => onOpenModal(exercise)}
        />
        <div className="text-right">
          <span className="text-xs font-mono font-bold text-white">
            {completedCount}
            <span className="text-zinc-500 font-normal">/{exercise.targetSets}</span>
          </span>
          <div className="text-[10px] text-zinc-400 font-mono">
            {totalReps} повт.
          </div>
        </div>
      </div>

      {/* Нижняя строка: большая кнопка +1 подход */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handleQuickAdd();
        }}
        className={`w-full min-h-[44px] py-2 px-4 rounded-xl flex items-center justify-center gap-2 font-bold text-xs tracking-wider uppercase transition-all duration-200 active:scale-96 select-none ${
          isTargetCompleted
            ? 'bg-zinc-800 hover:bg-zinc-700 text-emerald-400 border border-emerald-500/30'
            : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg shadow-emerald-500/20'
        }`}
      >
        <Plus className="w-4 h-4 stroke-[3]" />
        <span>
          {isTargetCompleted ? 'Добавить экстра-подход' : '+1 подход'}
        </span>
      </button>
    </div>
  );
};
