import React, { useState } from 'react';
import { BottomSheet } from '../ui/BottomSheet';
import { ExerciseConfig, ExerciseLogItem } from '../../types/workout';
import { useWorkout } from '../../context/WorkoutContext';
import { Plus, Minus, Trash2, Clock } from 'lucide-react';
import { haptic } from '../../utils/haptics';

interface SetEditModalProps {
  exercise: ExerciseConfig | null;
  isOpen: boolean;
  onClose: () => void;
}

export const SetEditModal: React.FC<SetEditModalProps> = ({
  exercise,
  isOpen,
  onClose,
}) => {
  const { activeRecord, logSet, deleteSet, settings } = useWorkout();

  const [customReps, setCustomReps] = useState<number>(exercise?.defaultReps ?? 5);
  const [customWeight, setCustomWeight] = useState<number>(exercise?.weight ?? 0);

  // Синхронизация при открытии
  React.useEffect(() => {
    if (exercise) {
      setCustomReps(exercise.defaultReps);
      setCustomWeight(exercise.weight ?? 0);
    }
  }, [exercise]);

  if (!exercise) return null;

  // Подходы сегодняшнего дня именно по этому упражнению
  const exerciseSets = activeRecord.completedSets.filter(
    (s) => s.exerciseId === exercise.id
  );

  const handleAddCustomSet = () => {
    haptic.trigger('medium', settings.soundFeedbackEnabled);
    logSet(exercise, customReps, customWeight > 0 ? customWeight : undefined);
    onClose();
  };

  const handleDeleteSet = (setId: string) => {
    haptic.trigger('light', settings.soundFeedbackEnabled);
    deleteSet(setId);
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={exercise.name}>
      <div className="space-y-5">
        {/* Блок настройки повторений для нового подхода */}
        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-white/[0.08]">
          <div className="text-xs font-mono text-zinc-400 mb-3 uppercase tracking-wider">
            Записать подход с ручными параметрами
          </div>

          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-zinc-200">Повторения:</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCustomReps((r) => Math.max(1, r - 1))}
                className="w-9 h-9 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:scale-95 flex items-center justify-center text-white text-lg font-bold border border-white/5"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-10 text-center text-xl font-bold font-mono text-emerald-400">
                {customReps}
              </span>
              <button
                type="button"
                onClick={() => setCustomReps((r) => r + 1)}
                className="w-9 h-9 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:scale-95 flex items-center justify-center text-white text-lg font-bold border border-white/5"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Рабочий вес (если актуально) */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-zinc-200">Вес (кг):</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={customWeight || ''}
                placeholder="0"
                onChange={(e) => setCustomWeight(Number(e.target.value) || 0)}
                className="w-20 px-3 py-1.5 rounded-xl bg-zinc-800 text-center font-mono text-white text-sm border border-white/10 focus:outline-none focus:border-emerald-500"
              />
              <span className="text-xs text-zinc-400 font-mono">кг</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddCustomSet}
            className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm tracking-wide transition-all duration-200 active:scale-98 glow-emerald flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            Зафиксировать подход ({customReps} повт.)
          </button>
        </div>

        {/* Список выполненных подходов за сегодня */}
        <div>
          <div className="text-xs font-mono text-zinc-400 mb-2.5 uppercase tracking-wider flex items-center justify-between">
            <span>Выполнено за сегодня</span>
            <span className="text-emerald-400">
              {exerciseSets.length} / {exercise.targetSets}
            </span>
          </div>

          {exerciseSets.length === 0 ? (
            <div className="p-4 rounded-xl bg-zinc-900/40 border border-white/5 text-center text-xs text-zinc-500 font-mono">
              Подходов еще не зафиксировано
            </div>
          ) : (
            <div className="space-y-2">
              {exerciseSets.map((set: ExerciseLogItem, index: number) => {
                const timeStr = new Intl.DateTimeFormat('ru-RU', {
                  hour: '2-digit',
                  minute: '2-digit',
                }).format(new Date(set.timestamp));

                return (
                  <div
                    key={set.id}
                    className="p-3 rounded-xl bg-zinc-900/90 border border-white/[0.06] flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-mono flex items-center justify-center font-bold">
                        {index + 1}
                      </span>
                      <div>
                        <div className="text-sm font-bold text-zinc-100 font-mono">
                          {set.reps} повторений
                          {set.weight ? ` • ${set.weight} кг` : ''}
                        </div>
                        <div className="text-[11px] text-zinc-400 flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3" />
                          {timeStr}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteSet(set.id)}
                      className="p-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Удалить подход"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </BottomSheet>
  );
};
