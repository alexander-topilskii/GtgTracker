import React, { useState } from 'react';
import { ActiveSetMonolith } from './ActiveSetMonolith';
import { SequencerTimeline } from './SequencerTimeline';
import { SetEditModal } from './SetEditModal';
import { ExerciseConfig } from '../../types/workout';

export const DashboardView: React.FC = () => {
  const [selectedExercise, setSelectedExercise] = useState<ExerciseConfig | null>(null);

  return (
    <div className="flex-1 flex flex-col justify-between min-h-0 overflow-hidden px-4 py-2 gap-2.5">
      {/* Центр: Монолитная карточка активного подхода с магнитным слайдером */}
      <main className="my-auto py-1 shrink-0">
        <ActiveSetMonolith onOpenModal={setSelectedExercise} />
      </main>

      {/* Низ: Секвенсор всех подходов дня */}
      <footer className="shrink-0 pb-1">
        <SequencerTimeline onOpenModal={setSelectedExercise} />
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
