import React, { useState } from 'react';
import { useWorkout } from '../../context/WorkoutContext';
import { ExerciseConfig, DayType } from '../../types/workout';
import { Plus, Trash2, Edit3, Save } from 'lucide-react';
import { haptic } from '../../utils/haptics';

export const ProgramVisualEditor: React.FC = () => {
  const { program, updateProgram, settings } = useWorkout();
  const [selectedDayType, setSelectedDayType] = useState<DayType>('A');
  const [editingExercise, setEditingExercise] = useState<ExerciseConfig | null>(null);

  const activeDayPlan = program.days[selectedDayType] || program.days['A'];

  // Сохранение изменений в упражнении
  const handleSaveExercise = (exercise: ExerciseConfig) => {
    haptic.trigger('light', settings.soundFeedbackEnabled);
    const updatedExercises = activeDayPlan.exercises.map((e) =>
      e.id === exercise.id ? exercise : e
    );
    const updatedProgram = {
      ...program,
      days: {
        ...program.days,
        [selectedDayType]: {
          ...activeDayPlan,
          exercises: updatedExercises,
        },
      },
    };
    updateProgram(updatedProgram);
    setEditingExercise(null);
  };

  // Добавление нового упражнения
  const handleAddExercise = () => {
    haptic.trigger('medium', settings.soundFeedbackEnabled);
    const newEx: ExerciseConfig = {
      id: `ex_${Date.now()}`,
      name: 'Новое упражнение',
      targetSets: 4,
      defaultReps: 8,
    };
    const updatedProgram = {
      ...program,
      days: {
        ...program.days,
        [selectedDayType]: {
          ...activeDayPlan,
          exercises: [...activeDayPlan.exercises, newEx],
        },
      },
    };
    updateProgram(updatedProgram);
    setEditingExercise(newEx);
  };

  // Удаление упражнения из программы (история при этом НЕ повреждается!)
  const handleDeleteExercise = (id: string) => {
    haptic.trigger('light', settings.soundFeedbackEnabled);
    const updatedProgram = {
      ...program,
      days: {
        ...program.days,
        [selectedDayType]: {
          ...activeDayPlan,
          exercises: activeDayPlan.exercises.filter((e) => e.id !== id),
        },
      },
    };
    updateProgram(updatedProgram);
    if (editingExercise?.id === id) {
      setEditingExercise(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Селектор редактируемого дня */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-900 border border-white/5">
        {(['A', 'B'] as DayType[]).map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => {
              haptic.trigger('light', settings.soundFeedbackEnabled);
              setSelectedDayType(d);
              setEditingExercise(null);
            }}
            className={`flex-1 py-1.5 text-xs font-mono rounded-lg transition-all ${
              selectedDayType === d
                ? 'bg-zinc-800 text-white font-bold border border-white/10'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {d === 'A' ? 'План дня А (Верх и Руки)' : 'План дня Б (Низ, Плечи, Кор)'}
          </button>
        ))}
      </div>

      {/* Список упражнений дня */}
      <div className="space-y-2.5">
        {activeDayPlan.exercises.map((ex) => {
          const isEditing = editingExercise?.id === ex.id;

          if (isEditing) {
            return (
              <div
                key={ex.id}
                className="p-3.5 rounded-xl bg-zinc-900 border border-[#ccff00]/50 space-y-3"
              >
                <div>
                  <label className="text-[10px] font-mono text-zinc-400 block mb-1">
                    Название движения:
                  </label>
                  <input
                    type="text"
                    value={editingExercise.name}
                    onChange={(e) =>
                      setEditingExercise({ ...editingExercise, name: e.target.value })
                    }
                    className="w-full px-3 py-1.5 rounded-lg bg-zinc-800 text-white text-xs font-sans border border-white/10 focus:outline-none focus:border-[#ccff00]"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] font-mono text-zinc-400 block mb-1">
                      Подходы:
                    </label>
                    <input
                      type="number"
                      value={editingExercise.targetSets}
                      min={1}
                      max={20}
                      onChange={(e) =>
                        setEditingExercise({
                          ...editingExercise,
                          targetSets: Math.max(1, Number(e.target.value) || 1),
                        })
                      }
                      className="w-full px-3 py-1.5 rounded-lg bg-zinc-800 text-white text-xs font-mono border border-white/10 focus:outline-none focus:border-[#ccff00]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-zinc-400 block mb-1">
                      Повторения:
                    </label>
                    <input
                      type="number"
                      value={editingExercise.defaultReps}
                      min={1}
                      max={100}
                      onChange={(e) =>
                        setEditingExercise({
                          ...editingExercise,
                          defaultReps: Math.max(1, Number(e.target.value) || 1),
                        })
                      }
                      className="w-full px-3 py-1.5 rounded-lg bg-zinc-800 text-white text-xs font-mono border border-white/10 focus:outline-none focus:border-[#ccff00]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-zinc-400 block mb-1">
                      Вес (кг):
                    </label>
                    <input
                      type="number"
                      value={editingExercise.weight || ''}
                      placeholder="0"
                      onChange={(e) =>
                        setEditingExercise({
                          ...editingExercise,
                          weight: Number(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-1.5 rounded-lg bg-zinc-800 text-white text-xs font-mono border border-white/10 focus:outline-none focus:border-[#ccff00]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setEditingExercise(null)}
                    className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono"
                  >
                    Отмена
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveExercise(editingExercise)}
                    className="px-3.5 py-1.5 rounded-lg bg-[#ccff00] hover:bg-[#d9f99d] text-black font-bold text-xs font-mono flex items-center gap-1.5 glow-neon"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Сохранить
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div
              key={ex.id}
              className="p-3 rounded-xl bg-zinc-900/80 border border-white/5 flex items-center justify-between"
            >
              <div>
                <div className="text-xs font-bold text-white font-sans">
                  {ex.name}
                </div>
                <div className="text-[11px] font-mono text-zinc-400 mt-0.5">
                  Цель: {ex.targetSets} подх. по {ex.defaultReps} повт.
                  {ex.weight ? ` (${ex.weight} кг)` : ''}
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setEditingExercise(ex)}
                  className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                  title="Редактировать"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteExercise(ex.id)}
                  className="p-2 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  title="Удалить из программы"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={handleAddExercise}
        className="w-full py-2.5 rounded-xl border border-dashed border-white/20 hover:border-[#ccff00]/50 text-zinc-300 hover:text-[#ccff00] text-xs font-mono flex items-center justify-center gap-1.5 transition-all active:scale-98"
      >
        <Plus className="w-4 h-4" />
        Добавить упражнение в план
      </button>
    </div>
  );
};
