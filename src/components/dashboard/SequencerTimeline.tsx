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
  const totalTasks = schedule.length;

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

  const completedCount = slotsMeta.filter((s) => s.isDone).length;

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
    <div className="precision-card p-3 sm:p-3.5 flex-1 min-h-0 flex flex-col overflow-hidden shadow-2xl">
      {/* Шапка секвенсора */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/[0.10] shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono tracking-widest uppercase text-[#ccff00] bg-[#ccff00]/10 border border-[#ccff00]/25 px-2.5 py-0.5 rounded-full font-bold">
            СЕКВЕНСОР ДНЯ
          </span>
          <span className="text-[10px] font-mono text-zinc-300 font-bold">
            {completedCount} ИЗ {totalTasks}
          </span>
        </div>
        <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
          ТАП ДЛЯ ОТМЕТКИ
        </span>
      </div>

      {/* Список подходов в прецизионном контейнере */}
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar flex flex-col gap-1.5">
        {slotsMeta.map((item) => {
          return (
            <div
              key={item.slot.id}
              onClick={(e) => handleSlotClick(item, e)}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-150 cursor-pointer active:scale-98 ${
                item.isCurrent
                  ? 'bg-[#ccff00]/[0.08] border-2 border-[#ccff00]/60 text-white shadow-[0_0_16px_rgba(204,255,0,0.12)]'
                  : item.isDone
                  ? 'bg-[#090b11]/70 text-zinc-500 border border-white/[0.05] opacity-75'
                  : 'bg-[#10131d]/90 hover:bg-[#161a28] text-zinc-200 border border-white/[0.09] hover:border-white/[0.16] shadow-sm'
              }`}
            >
              {/* Левая часть: номер в порядке и название упражнения */}
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-mono font-bold shrink-0 transition-all ${
                    item.isDone
                      ? 'bg-[#ccff00] text-zinc-950 font-black shadow-[0_0_10px_rgba(204,255,0,0.35)]'
                      : item.isCurrent
                      ? 'bg-[#ccff00] text-zinc-950 font-black shadow-[0_0_12px_rgba(204,255,0,0.45)]'
                      : 'bg-[#191f2e] text-zinc-300 border border-white/[0.10]'
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
                      ? 'bg-[#ccff00] text-zinc-950 font-black shadow-[0_0_8px_rgba(204,255,0,0.3)]'
                      : item.isDone
                      ? 'text-zinc-500 bg-white/[0.03] border border-white/[0.04]'
                      : 'text-zinc-300 bg-white/[0.06] border border-white/[0.08]'
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
