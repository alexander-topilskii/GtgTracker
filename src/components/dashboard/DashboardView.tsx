import React, { useState } from 'react';
import { useWorkout } from '../../context/WorkoutContext';
import { DaySelector } from './DaySelector';
import { ExerciseCard } from './ExerciseCard';
import { SetEditModal } from './SetEditModal';
import { ExerciseConfig } from '../../types/workout';
import { RestTimerWidget } from './RestTimerWidget';
import { Coffee, Sparkles } from 'lucide-react';

export const DashboardView: React.FC = () => {
  const { activeDayPlan, activeRecord } = useWorkout();
  const [selectedExercise, setSelectedExercise] = useState<ExerciseConfig | null>(null);

  const isRestDay = activeRecord.dayType === 'REST';

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
      {/* Селектор типов дня */}
      <DaySelector />

      {/* Таймер отдыха с последнего подхода */}
      <div className="px-4 py-1 shrink-0">
        <RestTimerWidget />
      </div>

      {/* Контейнер упражнений дня (адаптирован под 100dvh без скролла) */}
      <div className="flex-1 flex flex-col justify-between px-4 py-1 min-h-0 overflow-y-auto no-scrollbar">
        {isRestDay ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 my-auto rounded-3xl bg-zinc-900/60 border border-white/5 backdrop-blur-md">
            <div className="w-16 h-16 rounded-2xl bg-zinc-800/80 border border-white/10 flex items-center justify-center text-zinc-400 mb-4">
              <Coffee className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-white font-sans tracking-tight mb-2">
              День отдыха и суперкомпенсации
            </h2>
            <p className="text-xs text-zinc-400 max-w-xs font-mono leading-relaxed mb-4">
              Методология Grease the Groove требует свежей нервной системы. Сегодня связки и мышцы адаптируются к нагрузкам.
            </p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
              <Sparkles className="w-3.5 h-3.5" />
              Отличный сон и гидратация
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-around gap-2.5 py-1">
            {activeDayPlan?.exercises.map((exercise) => (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                onOpenModal={setSelectedExercise}
              />
            ))}
          </div>
        )}
      </div>

      {/* Модальное окно редактирования/просмотра подходов */}
      <SetEditModal
        exercise={selectedExercise}
        isOpen={selectedExercise !== null}
        onClose={() => setSelectedExercise(null)}
      />
    </div>
  );
};
