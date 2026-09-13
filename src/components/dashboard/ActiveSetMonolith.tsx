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

  // Рефы для нулевой задержки при перетаскивании (0ms latency direct DOM updates)
  const isDraggingRef = useRef<boolean>(false);
  const startXRef = useRef<number>(0);
  const currentDeltaRef = useRef<number>(0);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const thumbRef = useRef<HTMLDivElement | null>(null);
  const ambientGlowRef = useRef<HTMLDivElement | null>(null);
  const percentTextRef = useRef<HTMLSpanElement | null>(null);

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
  const exerciseCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of activeRecord.completedSets) {
      counts[s.exerciseId] = (counts[s.exerciseId] || 0) + 1;
    }
    return counts;
  }, [activeRecord.completedSets]);

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
      sparks.explode(rect.right - 28, rect.top + rect.height / 2, 30);
    }

    haptic.trigger('success', settings.soundFeedbackEnabled);
    logSet(exercise, currentSlot.reps, currentSlot.weight);
  }, [currentSlot, activeDayPlan, settings.soundFeedbackEnabled, logSet]);

  // Физика драга слайдера с мгновенным откликом (без задержек React re-render)
  const handleDragStart = (clientX: number) => {
    if (isAllCompleted || isRestDay) return;
    isDraggingRef.current = true;
    startXRef.current = clientX;
    currentDeltaRef.current = 0;

    if (thumbRef.current) {
      thumbRef.current.style.transition = 'none';
    }
    if (ambientGlowRef.current) {
      ambientGlowRef.current.style.transition = 'none';
    }

    haptic.playClickSound('snap');
  };

  const handleDragMove = useCallback((clientX: number) => {
    if (!isDraggingRef.current || !trackRef.current || !thumbRef.current) return;

    const trackWidth = trackRef.current.clientWidth;
    const thumbWidth = thumbRef.current.clientWidth;
    const maxDistance = Math.max(1, trackWidth - thumbWidth - 12);

    const delta = Math.max(0, Math.min(maxDistance, clientX - startXRef.current));
    currentDeltaRef.current = delta;
    const progress = delta / maxDistance;

    // 1. Мгновенное смещение ползунка строго под пальцем/курсором
    thumbRef.current.style.transform = `translateX(${delta}px)`;

    // 2. Градиент появления фона как функция от прогресса (чем правее — тем ярче свечение)
    if (ambientGlowRef.current) {
      ambientGlowRef.current.style.opacity = Math.pow(progress, 0.85).toFixed(3);
      ambientGlowRef.current.style.boxShadow = `inset 0 0 ${Math.round(progress * 28)}px rgba(204, 255, 0, ${(progress * 0.5).toFixed(2)})`;
    }

    // 3. Текстовый процент
    if (percentTextRef.current) {
      percentTextRef.current.innerText = `${Math.round(progress * 100)}%`;
    }

    // 4. Достижение порога срабатывания
    if (progress >= 0.94) {
      isDraggingRef.current = false;

      // Плавный сброс бегунка и свечения
      if (thumbRef.current) {
        thumbRef.current.style.transition = 'transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)';
        thumbRef.current.style.transform = 'translateX(0px)';
      }
      if (ambientGlowRef.current) {
        ambientGlowRef.current.style.transition = 'opacity 0.2s ease-out';
        ambientGlowRef.current.style.opacity = '0';
      }
      if (percentTextRef.current) {
        percentTextRef.current.innerText = '0%';
      }

      handleCompleteActiveSet();
    }
  }, [handleCompleteActiveSet]);

  const handleDragEnd = useCallback(() => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;

    // Плавный откат бегунка и затухание свечения при отпускании
    if (thumbRef.current) {
      thumbRef.current.style.transition = 'transform 0.22s cubic-bezier(0.2, 0.8, 0.2, 1)';
      thumbRef.current.style.transform = 'translateX(0px)';
    }
    if (ambientGlowRef.current) {
      ambientGlowRef.current.style.transition = 'opacity 0.22s ease-out';
      ambientGlowRef.current.style.opacity = '0';
    }
    if (percentTextRef.current) {
      percentTextRef.current.innerText = '0%';
    }
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
      <div className="precision-card p-5 text-center transition-all duration-300">
        <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center mx-auto mb-2 text-[#ccff00]">
          <Coffee className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-black text-white tracking-tight font-sans">
          Суперкомпенсация
        </h3>
        <p className="text-[11px] text-zinc-400 font-mono mt-1 leading-relaxed max-w-xs mx-auto">
          Сегодня нервная система и связки восстанавливаются. Отдыхайте, пейте воду и готовьтесь к следующей сессии GtG.
        </p>
      </div>
    );
  }

  return (
    <div className="precision-card p-4 sm:p-5 transition-all duration-300 shadow-2xl">
      {/* Телеметрия: номер подхода, группа мышц, время отдыха */}
      <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.10]">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono tracking-widest uppercase text-[#ccff00] bg-[#ccff00]/10 border border-[#ccff00]/25 px-2.5 py-0.5 rounded-full font-bold">
            {isAllCompleted
              ? 'ПЛАН ВЫПОЛНЕН'
              : `ПОДХОД ${String(currentIndex + 1).padStart(2, '0')} / ${String(totalTasks).padStart(2, '0')}`}
          </span>
          <span className="text-[10px] font-mono text-zinc-300 uppercase tracking-wider font-semibold truncate max-w-[130px]">
            {currentSlot?.muscle || (isAllCompleted ? 'ОТЛИЧНАЯ РАБОТА' : 'БАЗОВОЕ ДВИЖЕНИЕ')}
          </span>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.08] font-mono text-xs">
          <span className="text-zinc-400 text-[10px] uppercase tracking-wider">Отдых:</span>
          <span className="font-bold text-white font-mono">{elapsedMinutes}</span>
        </div>
      </div>

      {/* Фокус на текущем упражнении и нормативе */}
      <div className="my-3">
        <div className="flex items-center justify-between">
          <div className="text-[9px] text-zinc-400 uppercase tracking-[0.2em] mb-0.5 font-mono font-bold">
            {isAllCompleted ? 'СТАТУС ТРЕНИРОВКИ' : 'ТЕКУЩЕЕ ДВИЖЕНИЕ'}
          </div>
          {currentSlot && (
            <span className="text-[10px] font-mono text-[#ccff00] font-bold bg-[#ccff00]/10 border border-[#ccff00]/25 px-2 py-0.5 rounded-md">
              ⏰ {currentSlot.time}
            </span>
          )}
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase leading-tight font-sans mt-0.5">
          {isAllCompleted ? 'ВСЕ ПОДХОДЫ ЗАКРЫТЫ' : (currentSlot?.exerciseName || 'Упражнение')}
        </h2>

        {/* Блок повторений и инструкции */}
        <div className="mt-2.5 flex items-center justify-between bg-[#090b12] rounded-2xl p-3 sm:p-3.5 border border-white/[0.11] shadow-[inset_0_2px_6px_rgba(0,0,0,0.65)]">
          <div className="flex items-baseline gap-1.5 pr-2">
            <span className="text-3xl sm:text-4xl font-black font-mono tracking-tighter text-[#ccff00] leading-none text-glow-neon">
              {isAllCompleted ? '100%' : (currentSlot?.reps ?? 10)}
            </span>
            <span className="text-xs font-mono text-zinc-400 font-bold uppercase tracking-wider">
              {isAllCompleted ? '' : 'повт.'}
            </span>
            {currentSlot?.weight ? (
              <span className="text-xs font-mono text-zinc-300 ml-1 font-bold px-1.5 py-0.5 rounded bg-white/[0.07] border border-white/[0.08]">
                {currentSlot.weight} кг
              </span>
            ) : null}
          </div>

          <div className="text-right max-w-[55%] border-l border-white/[0.08] pl-3">
            <div className="text-[9px] font-mono uppercase text-zinc-400 tracking-wider font-semibold">
              {isAllCompleted ? 'Итог дня' : 'Инструкция'}
            </div>
            <div className="text-[11px] text-zinc-300 font-medium leading-snug line-clamp-2 mt-0.5">
              {isAllCompleted
                ? 'Суммарный объем дня набран чисто и без переутомления.'
                : (currentSlot?.cue || 'Контроль движения • чистое исполнение')}
            </div>
          </div>
        </div>
      </div>

      {/* Тактильный магнитный слайдер "Сдвиг для отметки" */}
      <div className="mt-3 pt-2.5 border-t border-white/[0.10]">
        {isAllCompleted ? (
          <button
            type="button"
            onClick={() => {
              if (activeDayPlan?.exercises[0]) {
                onOpenModal(activeDayPlan.exercises[0]);
              }
            }}
            className="w-full py-3 px-4 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs font-mono font-bold text-zinc-300 flex items-center justify-center gap-2 transition-all active:scale-98"
          >
            <Check className="w-4 h-4 text-[#ccff00]" />
            <span>Все подходы выполнены • Добавить экстра-подход</span>
          </button>
        ) : (
          <div>
            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-1.5">
              <span>Сдвиг для отметки</span>
              <span ref={percentTextRef} className="text-[#ccff00] font-bold font-mono">
                0%
              </span>
            </div>

            <div
              ref={trackRef}
              className="slider-track h-13 sm:h-14 p-1.5 flex items-center select-none relative overflow-hidden"
            >
              {/* Градиент появления фона как функция от прогресса (чем правее — тем сильнее светится) */}
              <div
                ref={ambientGlowRef}
                className="absolute inset-0 pointer-events-none rounded-full opacity-0"
                style={{
                  background:
                    'linear-gradient(90deg, rgba(204, 255, 0, 0.08) 0%, rgba(204, 255, 0, 0.25) 50%, rgba(204, 255, 0, 0.55) 100%)',
                }}
              />

              {/* Фоновая надпись с подсказкой */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-xs font-mono font-bold tracking-widest text-zinc-300 uppercase gap-2">
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
                className="slider-thumb relative z-10 w-11 h-11 rounded-full text-zinc-950 flex items-center justify-center font-black text-sm active:scale-95 select-none touch-none"
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
