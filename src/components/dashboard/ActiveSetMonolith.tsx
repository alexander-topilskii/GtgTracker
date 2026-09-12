import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { ChevronRight, Check, Coffee } from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';
import { ScheduleSlot, ExerciseConfig } from '../../types/workout';
import { haptic } from '../../utils/haptics';
import { sparks } from '../../utils/sparks';

interface ActiveSetMonolithProps {
  onOpenModal: (exercise: ExerciseConfig) => void;
}

export const ActiveSetMonolith: React.FC<ActiveSetMonolithProps> = ({ onOpenModal }) => {
  const { activeDayPlan, activeRecord, logSet, settings, lastSetTimestamp } = useWorkout();

  // Состояние слайдера
  const [sliderProgress, setSliderProgress] = useState<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  const startXRef = useRef<number>(0);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const thumbRef = useRef<HTMLDivElement | null>(null);

  // Расчет времени с последнего подхода
  const [elapsedMinutes, setElapsedMinutes] = useState<string>('—');

  useEffect(() => {
    const updateTime = () => {
      if (!lastSetTimestamp) {
        setElapsedMinutes('—');
        return;
      }
      const mins = Math.floor((Date.now() - lastSetTimestamp) / 60000);
      setElapsedMinutes(`${mins}м`);
    };

    updateTime();
    const timer = setInterval(updateTime, 10000);
    return () => clearInterval(timer);
  }, [lastSetTimestamp]);

  const isRestDay = activeRecord.dayType === 'REST';
  const schedule = activeDayPlan?.schedule || [];
  const totalTasks = schedule.length;

  // Подсчет выполненных подходов по упражнениям для определения текущего активного слота
  const exerciseCounts: Record<string, number> = {};
  for (const s of activeRecord.completedSets) {
    exerciseCounts[s.exerciseId] = (exerciseCounts[s.exerciseId] || 0) + 1;
  }

  const { currentSlot, currentIndex, isAllCompleted } = useMemo<{
    currentSlot: ScheduleSlot | null;
    currentIndex: number;
    isAllCompleted: boolean;
  }>(() => {
    const exerciseSlotIndices: Record<string, number> = {};
    let foundSlot: ScheduleSlot | null = null;
    let foundIndex = -1;

    for (let idx = 0; idx < schedule.length; idx++) {
      const slot = schedule[idx];
      const curr = exerciseSlotIndices[slot.exerciseId] || 0;
      exerciseSlotIndices[slot.exerciseId] = curr + 1;

      const completed = exerciseCounts[slot.exerciseId] || 0;
      if (curr >= completed && foundSlot === null) {
        foundSlot = slot;
        foundIndex = idx;
      }
    }

    const allDone = totalTasks > 0 && foundSlot === null;
    return {
      currentSlot: foundSlot,
      currentIndex: foundIndex,
      isAllCompleted: allDone,
    };
  }, [schedule, exerciseCounts, totalTasks]);

  // Завершение подхода через слайдер
  const handleCompleteActiveSet = useCallback(() => {
    if (!currentSlot || !activeDayPlan) return;

    const exercise = activeDayPlan.exercises.find((ex) => ex.id === currentSlot.exerciseId);
    if (!exercise) return;

    // Взрыв микро-искр у правого края слайдера
    if (trackRef.current) {
      const rect = trackRef.current.getBoundingClientRect();
      sparks.explode(rect.right - 28, rect.top + rect.height / 2, 28);
    }

    haptic.trigger('success', settings.soundFeedbackEnabled);
    logSet(exercise, currentSlot.reps, currentSlot.weight);
  }, [currentSlot, activeDayPlan, settings.soundFeedbackEnabled, logSet]);

  // Физика драга слайдера (Touch & Mouse)
  const handleDragStart = (clientX: number) => {
    if (isAllCompleted || isRestDay) return;
    isDraggingRef.current = true;
    startXRef.current = clientX;
    haptic.playClickSound('snap');
  };

  const handleDragMove = useCallback((clientX: number) => {
    if (!isDraggingRef.current || !trackRef.current || !thumbRef.current) return;

    const trackWidth = trackRef.current.clientWidth;
    const thumbWidth = thumbRef.current.clientWidth;
    const maxDistance = Math.max(1, trackWidth - thumbWidth - 12);

    const delta = Math.max(0, Math.min(maxDistance, clientX - startXRef.current));
    const progress = delta / maxDistance;

    setSliderProgress(progress);

    if (progress >= 0.95) {
      isDraggingRef.current = false;
      setSliderProgress(0);
      handleCompleteActiveSet();
    }
  }, [handleCompleteActiveSet]);

  const handleDragEnd = useCallback(() => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setSliderProgress(0);
  }, []);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => handleDragMove(e.clientX);
    const onMouseUp = () => handleDragEnd();
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) handleDragMove(e.touches[0].clientX);
    };
    const onTouchEnd = () => handleDragEnd();

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [handleDragMove, handleDragEnd]);

  // Экран дня отдыха
  if (isRestDay) {
    return (
      <div className="precision-card p-6 text-center my-auto transition-all duration-300">
        <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center mx-auto mb-3 text-emerald-400">
          <Coffee className="w-7 h-7" />
        </div>
        <h3 className="text-xl font-black text-white tracking-tight font-sans">
          Суперкомпенсация
        </h3>
        <p className="text-xs text-zinc-400 font-mono mt-2 leading-relaxed max-w-xs mx-auto">
          Сегодня нервная система и связки восстанавливаются. Отдыхайте, пейте воду и готовьтесь к следующей сессии GtG.
        </p>
      </div>
    );
  }

  // Расчет физического смещения thumb
  const maxThumbDistance = trackRef.current && thumbRef.current
    ? trackRef.current.clientWidth - thumbRef.current.clientWidth - 12
    : 240;
  const thumbTranslateX = sliderProgress * maxThumbDistance;
  const fillPercent = Math.round(sliderProgress * 100);

  return (
    <div className="precision-card p-5 sm:p-6 transition-all duration-300 shadow-2xl">
      {/* Телеметрия: номер подхода, группа мышц, время отдыха */}
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono tracking-widest uppercase text-[#ccff00] bg-[#ccff00]/10 border border-[#ccff00]/25 px-2.5 py-0.5 rounded-full font-bold">
            {isAllCompleted
              ? 'ПЛАН ВЫПОЛНЕН'
              : `ПОДХОД ${String(currentIndex + 1).padStart(2, '0')} / ${String(totalTasks).padStart(2, '0')}`}
          </span>
          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider font-semibold truncate max-w-[130px]">
            {currentSlot?.muscle || (isAllCompleted ? 'ОТЛИЧНАЯ РАБОТА' : 'БАЗОВОЕ ДВИЖЕНИЕ')}
          </span>
        </div>

        <div className="flex items-center gap-1 font-mono text-xs">
          <span className="text-zinc-500 text-[10px] uppercase tracking-wider">Отдых:</span>
          <span className="font-bold text-white font-mono">{elapsedMinutes}</span>
        </div>
      </div>

      {/* Фокус на текущем упражнении и нормативе */}
      <div className="my-4">
        <div className="flex items-center justify-between">
          <div className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] mb-1 font-mono font-bold">
            {isAllCompleted ? 'СТАТУС ТРЕНИРОВКИ' : 'ТЕКУЩЕЕ ДВИЖЕНИЕ'}
          </div>
          {currentSlot && (
            <span className="text-[10px] font-mono text-[#ccff00] font-bold">
              ⏰ {currentSlot.time}
            </span>
          )}
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase leading-tight font-sans">
          {isAllCompleted ? 'ВСЕ ПОДХОДЫ ЗАКРЫТЫ' : (currentSlot?.exerciseName || 'Упражнение')}
        </h2>

        {/* Блок повторений и инструкции */}
        <div className="mt-3.5 flex items-center justify-between bg-black/40 rounded-2xl p-3.5 border border-white/[0.04]">
          <div className="flex items-baseline gap-1.5">
            <span className="text-4xl sm:text-5xl font-black font-mono tracking-tighter text-[#ccff00] leading-none">
              {isAllCompleted ? '100%' : (currentSlot?.reps ?? 10)}
            </span>
            <span className="text-xs font-mono text-zinc-400 font-bold uppercase tracking-wider">
              {isAllCompleted ? '' : 'повт.'}
            </span>
            {currentSlot?.weight ? (
              <span className="text-xs font-mono text-zinc-400 ml-1">
                • {currentSlot.weight} кг
              </span>
            ) : null}
          </div>

          <div className="text-right max-w-[55%]">
            <div className="text-[9px] font-mono uppercase text-zinc-500 tracking-wider">
              {isAllCompleted ? 'Итог дня' : 'Инструкция'}
            </div>
            <div className="text-xs text-zinc-300 font-medium leading-snug line-clamp-2">
              {isAllCompleted
                ? 'Суммарный объем дня набран чисто и без переутомления.'
                : (currentSlot?.cue || 'Контроль движения • чистое исполнение')}
            </div>
          </div>
        </div>
      </div>

      {/* Тактильный магнитный слайдер "Сдвиг для отметки" */}
      <div className="mt-4 pt-3 border-t border-white/[0.06]">
        {isAllCompleted ? (
          <button
            type="button"
            onClick={() => {
              if (activeDayPlan?.exercises[0]) {
                onOpenModal(activeDayPlan.exercises[0]);
              }
            }}
            className="w-full py-3.5 px-4 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs font-mono font-bold text-zinc-300 flex items-center justify-center gap-2 transition-all active:scale-98"
          >
            <Check className="w-4 h-4 text-[#ccff00]" />
            <span>Все 8 подходов выполнены • Добавить экстра-подход</span>
          </button>
        ) : (
          <div>
            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-2">
              <span>Сдвиг для отметки</span>
              <span className="text-[#ccff00] font-bold font-mono">{fillPercent}%</span>
            </div>

            <div
              ref={trackRef}
              className="slider-track h-14 p-1.5 flex items-center select-none relative"
            >
              {/* Динамическая лазерная полоса заполнения */}
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#ccff00]/15 via-[#ccff00]/25 to-[#ccff00]/40 border-r-2 border-[#ccff00] pointer-events-none transition-all duration-75"
                style={{ width: `${fillPercent}%` }}
              />

              {/* Фоновая надпись с подсказкой */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-xs font-mono font-bold tracking-widest text-zinc-400 uppercase gap-2">
                <span>СДВИНЬТЕ ВПРАВО</span>
                <ChevronRight className="w-4 h-4 text-[#ccff00] animate-pulse" />
              </div>

              {/* Магнитный бегунок слайдера */}
              <div
                ref={thumbRef}
                onMouseDown={(e) => handleDragStart(e.clientX)}
                onTouchStart={(e) => {
                  if (e.touches.length > 0) handleDragStart(e.touches[0].clientX);
                }}
                style={{ transform: `translateX(${thumbTranslateX}px)` }}
                className="slider-thumb relative z-10 w-11 h-11 rounded-full text-zinc-950 flex items-center justify-center font-black text-sm active:scale-95 select-none"
              >
                <ChevronRight className="w-5 h-5 stroke-[2.8]" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
