import React from 'react';
import { useWorkout } from '../../context/WorkoutContext';
import { ScheduleSlot, ExerciseConfig } from '../../types/workout';
import { Check, Clock, Plus } from 'lucide-react';
import { haptic } from '../../utils/haptics';
import { triggerNeonBurst } from '../../utils/celebration';

interface DayScheduleTimelineProps {
  onOpenModal: (exercise: ExerciseConfig) => void;
}

export const DayScheduleTimeline: React.FC<DayScheduleTimelineProps> = ({ onOpenModal }) => {
  const { activeDayPlan, activeRecord, logSet, settings } = useWorkout();

  if (!activeDayPlan || !activeDayPlan.schedule || activeDayPlan.schedule.length === 0) {
    return null;
  }

  // Считаем прогресс по каждому упражнению
  const exerciseCounts: Record<string, number> = {};
  for (const s of activeRecord.completedSets) {
    exerciseCounts[s.exerciseId] = (exerciseCounts[s.exerciseId] || 0) + 1;
  }

  // Для каждого слота в расписании определяем порядковый номер в рамках этого упражнения
  const exerciseSlotIndices: Record<string, number> = {};

  const slotsWithStatus = activeDayPlan.schedule.map((slot: ScheduleSlot) => {
    const currentIndex = exerciseSlotIndices[slot.exerciseId] || 0;
    exerciseSlotIndices[slot.exerciseId] = currentIndex + 1;

    const completedCount = exerciseCounts[slot.exerciseId] || 0;
    const isCompleted = currentIndex < completedCount;

    return {
      slot,
      isCompleted,
      slotIndexForExercise: currentIndex,
    };
  });

  const handleSlotClick = (
    slot: ScheduleSlot,
    isCompleted: boolean,
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    const exercise = activeDayPlan.exercises.find((ex) => ex.id === slot.exerciseId);
    if (!exercise) return;

    if (isCompleted) {
      // Если уже выполнено — открываем настройки/историю подходов
      haptic.trigger('light', settings.soundFeedbackEnabled);
      onOpenModal(exercise);
      return;
    }

    // Выполняем слот
    const rect = e.currentTarget.getBoundingClientRect();
    const originX = (rect.left + rect.width / 2) / window.innerWidth;
    const originY = (rect.top + rect.height / 2) / window.innerHeight;
    triggerNeonBurst(originX, originY);

    haptic.trigger('success', settings.soundFeedbackEnabled);
    logSet(exercise, slot.reps, slot.weight);
  };

  const completedSlotsCount = slotsWithStatus.filter((s) => s.isCompleted).length;
  const totalSlots = slotsWithStatus.length;

  return (
    <div className="flex flex-col gap-2 pb-4">
      {/* Шапка расписания */}
      <div className="flex items-center justify-between px-1 mb-1">
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-xs font-mono font-semibold text-zinc-300">
            Расписание на день
          </span>
        </div>
        <span className="text-[11px] font-mono text-zinc-400">
          Выполнено: <strong className="text-emerald-400">{completedSlotsCount}</strong> / {totalSlots}
        </span>
      </div>

      {/* Список временных слотов */}
      <div className="space-y-1.5">
        {slotsWithStatus.map(({ slot, isCompleted }) => {
          return (
            <button
              key={slot.id}
              type="button"
              onClick={(e) => handleSlotClick(slot, isCompleted, e)}
              className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-left transition-all duration-200 active:scale-98 ${
                isCompleted
                  ? 'bg-emerald-950/20 border-emerald-500/30 text-zinc-300'
                  : 'bg-[#12151f]/80 backdrop-blur-md border-white/[0.08] hover:border-emerald-500/30 text-white'
              }`}
            >
              {/* Левая часть: время и название упражнения */}
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={`text-xs font-mono px-2 py-0.5 rounded border shrink-0 font-bold ${
                    isCompleted
                      ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400 line-through'
                      : 'bg-zinc-800/80 border-white/10 text-emerald-400'
                  }`}
                >
                  {slot.time}
                </span>

                <div className="truncate">
                  <div
                    className={`text-xs font-semibold truncate ${
                      isCompleted ? 'line-through text-zinc-400' : 'text-zinc-100'
                    }`}
                  >
                    {slot.exerciseName}
                  </div>
                  <div className="text-[10px] text-zinc-400 font-mono">
                    {slot.reps} повт.{slot.weight ? ` • ${slot.weight} кг` : ''}
                  </div>
                </div>
              </div>

              {/* Правая часть: статус или кнопка быстрой отметки */}
              <div className="shrink-0 ml-2">
                {isCompleted ? (
                  <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-medium">
                    <Check className="w-3 h-3 stroke-[3]" />
                    Сделано
                  </span>
                ) : (
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-[10px] font-bold uppercase tracking-wider shadow-sm shadow-emerald-500/20">
                    <Plus className="w-3 h-3 stroke-[3]" />
                    Отметить
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
