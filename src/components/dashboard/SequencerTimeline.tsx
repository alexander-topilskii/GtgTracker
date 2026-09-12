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

    // Находим связанный ExerciseLogItem для отображения точного времени выполнения
    let loggedTimeString = '';
    if (isDone) {
      const setsOfThisEx = activeRecord.completedSets.filter((s) => s.exerciseId === slot.exerciseId);
      if (setsOfThisEx[currIndex]) {
        const d = new Date(setsOfThisEx[currIndex].timestamp);
        loggedTimeString = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
      }
    }

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
      loggedTimeString,
      matchingSetId: isDone
        ? activeRecord.completedSets.filter((s) => s.exerciseId === slot.exerciseId)[currIndex]?.id
        : undefined,
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
    <div className="flex flex-col gap-1.5 shrink-0">
      {/* Шапка секвенсора */}
      <div className="flex items-center justify-between px-1">
        <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 flex items-center gap-2">
          <span>СЕКВЕНСОР ДНЯ</span>
          <span className="text-zinc-700">•</span>
          <span className="text-[#ccff00] font-bold">
            {completedCount} ИЗ {totalTasks}
          </span>
        </div>
        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
          ТАП ДЛЯ ОТМЕТКИ
        </span>
      </div>

      {/* Список подходов в прецизионном контейнере */}
      <div className="precision-card p-2 max-h-48 overflow-y-auto no-scrollbar flex flex-col gap-1.5">
        {slotsMeta.map((item) => {
          return (
            <div
              key={item.slot.id}
              onClick={(e) => handleSlotClick(item, e)}
              className={`flex items-center justify-between px-3 py-2 rounded-xl transition-all duration-150 cursor-pointer active:scale-98 ${
                item.isCurrent
                  ? 'bg-[#ccff00]/10 border border-[#ccff00]/40 text-white shadow-sm'
                  : item.isDone
                  ? 'bg-zinc-950/40 text-zinc-500 border border-transparent'
                  : 'hover:bg-white/[0.03] text-zinc-300 border border-white/[0.03]'
              }`}
            >
              {/* Левая часть: номер/галочка + упражнение и группа мышц */}
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-mono font-bold shrink-0 transition-all ${
                    item.isDone
                      ? 'bg-[#ccff00] text-zinc-950 shadow-[0_0_10px_rgba(204,255,0,0.4)]'
                      : item.isCurrent
                      ? 'bg-[#ccff00]/20 text-[#ccff00] border border-[#ccff00]/40'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {item.isDone ? '✓' : item.idx + 1}
                </span>

                <div className="flex flex-col min-w-0">
                  <span
                    className={`text-xs font-semibold truncate ${
                      item.isDone ? 'line-through text-zinc-500' : 'text-zinc-200'
                    }`}
                  >
                    {item.slot.exerciseName}
                  </span>
                  <span className="text-[9px] font-mono text-zinc-500 uppercase truncate">
                    ⏰ {item.slot.time} {item.slot.code ? `• ${item.slot.code}` : ''} {item.slot.muscle ? `· ${item.slot.muscle}` : ''}
                  </span>
                </div>
              </div>

              {/* Правая часть: время выполнения (если готово) и бейдж повторений */}
              <div className="flex items-center gap-2 text-[11px] font-mono shrink-0 ml-2">
                {item.isDone && item.loggedTimeString && (
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {item.loggedTimeString}
                  </span>
                )}
                <span
                  className={`font-bold px-2 py-0.5 rounded-md ${
                    item.isCurrent
                      ? 'bg-[#ccff00] text-zinc-950 font-black'
                      : 'text-zinc-400 bg-white/[0.04]'
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
