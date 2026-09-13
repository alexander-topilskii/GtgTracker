import React, { useState } from 'react';
import { ActiveSetMonolith } from './ActiveSetMonolith';
import { SequencerTimeline } from './SequencerTimeline';
import { SetEditModal } from './SetEditModal';
import { ExerciseConfig } from '../../types/workout';

export const DashboardView: React.FC = () => {
  const [selectedExercise, setSelectedExercise] = useState<ExerciseConfig | null>(null);

  return (
    <div className="flex-1 flex flex-col justify-between min-h-0 overflow-hidden px-3.5 pt-2.5 pb-2 gap-3">
      {/* Верх: Секвенсор всех заданий на сегодня */}
      <main className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <SequencerTimeline onOpenModal={setSelectedExercise} />
      </main>

      {/* Низ: Монолитная карточка активного упражнения со слайдером (удобная зона большого пальца) */}
      <footer className="shrink-0">
        <ActiveSetMonolith onOpenModal={setSelectedExercise} />
      </footer>

      {/* Модальное окно редактирования/просмотра подходов */}
      <SetEditModal
        exercise={selectedExercise}
        isOpen={selectedExercise !== null}
        onClose={() => setSelectedExercise(null)}
      />
    </div>
  );
};
