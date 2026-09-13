import React from 'react';
import { useWorkout } from '../../context/WorkoutContext';
import { ScheduleSlot, ExerciseConfig } from '../../types/workout';
import { haptic } from '../../utils/haptics';
import { sparks } from '../../utils/sparks';

interface SequencerTimelineProps {
  onOpenModal: (exercise: ExerciseConfig) => void;
}

export const SequencerTimeline: React.FC<SequencerTimelineProps> = ({ onOpenModal }) => {
  const { activeDayPlan, activeRecord, logSet, settings } = useWorkout();

  if (!activeDayPlan || !activeDayPlan.schedule || activeDayPlan.schedule.length === 0) {
    return null;
  }

  const schedule = activeDayPlan.schedule;

  // Подсчет подходов по каждому упражнению
  const exerciseCounts: Record<string, number> = {};
  for (const s of activeRecord.completedSets) {
    exerciseCounts[s.exerciseId] = (exerciseCounts[s.exerciseId] || 0) + 1;
  }

  // Для каждого слота определяем статус
  const exerciseSlotIndices: Record<string, number> = {};
  let currentNextFound = false;

  const slotsMeta = schedule.map((slot: ScheduleSlot, idx: number) => {
    const currIndex = exerciseSlotIndices[slot.exerciseId] || 0;
    exerciseSlotIndices[slot.exerciseId] = currIndex + 1;

    const completed = exerciseCounts[slot.exerciseId] || 0;
    const isDone = currIndex < completed;

    let isCurrent = false;
    if (!isDone && !currentNextFound) {
      isCurrent = true;
      currentNextFound = true;
    }

    return {
      slot,
      idx,
      isDone,
      isCurrent,
    };
  });

  const handleSlotClick = (
    item: (typeof slotsMeta)[number],
    e: React.MouseEvent<HTMLDivElement>
  ) => {
    const exercise = activeDayPlan.exercises.find((ex) => ex.id === item.slot.exerciseId);
    if (!exercise) return;

    if (item.isDone) {
      // Если уже выполнено — открываем модалку для редактирования или просмотра
      haptic.playClickSound('snap');
      onOpenModal(exercise);
    } else {
      // Отмечаем подход
      const rect = e.currentTarget.getBoundingClientRect();
      sparks.explode(rect.right - 25, rect.top + rect.height / 2, 24);

      haptic.trigger('success', settings.soundFeedbackEnabled);
      logSet(exercise, item.slot.reps, item.slot.weight);
    }
  };

  return (
    <div className="precision-card p-2.5 sm:p-3 flex-1 min-h-0 flex flex-col overflow-hidden shadow-2xl">
      {/* Список подходов в прецизионном контейнере */}
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar flex flex-col gap-1.5">
        {slotsMeta.map((item) => {
          return (
            <div
              key={item.slot.id}
              onClick={(e) => handleSlotClick(item, e)}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-150 cursor-pointer active:scale-98 ${
                item.isCurrent
                  ? 'bg-[#ccff00]/12 border border-[#ccff00]/45 text-white shadow-sm shadow-[#ccff00]/10'
                  : item.isDone
                  ? 'bg-black/35 text-zinc-500 border border-transparent'
                  : 'bg-white/[0.04] hover:bg-white/[0.08] text-zinc-200 border border-white/[0.07]'
              }`}
            >
              {/* Левая часть: номер в порядке и название упражнения */}
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-mono font-bold shrink-0 transition-all ${
                    item.isDone
                      ? 'bg-[#ccff00] text-zinc-950 shadow-[0_0_10px_rgba(204,255,0,0.4)]'
                      : item.isCurrent
                      ? 'bg-[#ccff00]/20 text-[#ccff00] border border-[#ccff00]/40'
                      : 'bg-[#1e2332] text-zinc-400 border border-white/[0.08]'
                  }`}
                >
                  {item.isDone ? '✓' : item.idx + 1}
                </span>

                <span
                  className={`text-xs sm:text-sm font-semibold truncate ${
                    item.isDone ? 'line-through text-zinc-500' : 'text-zinc-100'
                  }`}
                >
                  {item.slot.exerciseName}
                </span>
              </div>

              {/* Правая часть: бейдж повторений */}
              <div className="shrink-0 ml-2">
                <span
                  className={`font-bold px-2.5 py-0.5 rounded-md text-xs font-mono ${
                    item.isCurrent
                      ? 'bg-[#ccff00] text-zinc-950 font-black shadow-sm'
                      : 'text-zinc-300 bg-white/[0.06] border border-white/[0.06]'
                  }`}
                >
                  ×{item.slot.reps}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
