import React, { useRef, useEffect, useCallback, useMemo, useState } from 'react';
import { ChevronRight, Check, Coffee, Trophy, BatteryCharging, Flame, Plus, Minus, Edit3 } from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';
import { useRestTimer } from '../../hooks/useRestTimer';
import { ScheduleSlot, ExerciseConfig } from '../../types/workout';
import { haptic } from '../../utils/haptics';
import { sparks } from '../../utils/sparks';

interface ActiveSetMonolithProps {
  onOpenModal: (exercise: ExerciseConfig) => void;
}

export const ActiveSetMonolith: React.FC<ActiveSetMonolithProps> = ({ onOpenModal }) => {
  const {
    activeDayPlan,
    activeRecord,
    logSet,
    settings,
    lastSetTimestamp,
    cycleState,
    logTestRecord,
  } = useWorkout();

  // Рефы для нулевой задержки при перетаскивании (0ms latency direct DOM updates)
  const isDraggingRef = useRef<boolean>(false);
  const startXRef = useRef<number>(0);
  const currentDeltaRef = useRef<number>(0);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const thumbRef = useRef<HTMLDivElement | null>(null);
  const ambientGlowRef = useRef<HTMLDivElement | null>(null);
  const percentTextRef = useRef<HTMLSpanElement | null>(null);

  // Живой отсчет таймера готовности до следующего подхода
  const { formattedRemaining, isExpired } = useRestTimer(
    lastSetTimestamp,
    settings.restIntervalMinutes
  );

  const isRestDay = activeRecord.dayType === 'REST';
  const isDeloadDay = activeRecord.dayType === 'DELOAD';
  const isTestPullups = activeRecord.dayType === 'TEST_PULLUPS';
  const isTestDips = activeRecord.dayType === 'TEST_DIPS';
  const isTestDay = isTestPullups || isTestDips;

  // Базовый рекорд для текущего теста
  const defaultTestReps = isTestPullups
    ? (cycleState.testResults?.pullUps ?? cycleState.baseMaxes.pullUps)
    : (cycleState.testResults?.dips ?? cycleState.baseMaxes.dips);

  const [testInputReps, setTestInputReps] = useState<number>(defaultTestReps);
  const [isEditingFinishedTest, setIsEditingFinishedTest] = useState<boolean>(false);

  useEffect(() => {
    setTestInputReps(defaultTestReps);
  }, [defaultTestReps, activeRecord.dayType]);

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

  // Фиксация рекорда на тесте
  const handleConfirmTestRecord = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    sparks.explode(rect.left + rect.width / 2, rect.top + rect.height / 2, 40);
    haptic.trigger('success', settings.soundFeedbackEnabled);

    const testExerciseId = isTestPullups ? 'pull-ups' : 'dips';
    logTestRecord(testExerciseId, Math.max(1, testInputReps));
    setIsEditingFinishedTest(false);
  };

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

  // Экран делоада (Пн-Ср 4-й недели)
  if (isDeloadDay) {
    return (
      <div className="precision-card p-5 text-center transition-all duration-300">
        <div className="w-12 h-12 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-center mx-auto mb-2 text-cyan-400">
          <BatteryCharging className="w-6 h-6" />
        </div>
        <div className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold mb-1">
          НЕДЕЛЯ 4 · ДЕЛОАД
        </div>
        <h3 className="text-lg font-black text-white tracking-tight font-sans">
          Отдых от базовой нагрузки
        </h3>
        <p className="text-[11px] text-zinc-300 font-mono mt-2 leading-relaxed max-w-xs mx-auto">
          Снижение тренировочного стресса для связок и ЦНС перед предельными тестами.
        </p>
        <div className="mt-3 pt-3 border-t border-white/[0.08] flex items-center justify-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-zinc-400">
            <span className="w-2 h-2 rounded-full bg-[#ccff00]" />
            <span>Чт: Тест Подтягиваний</span>
          </div>
          <div className="flex items-center gap-1.5 text-zinc-400">
            <span className="w-2 h-2 rounded-full bg-[#ccff00]" />
            <span>Сб: Тест Брусьев</span>
          </div>
        </div>
      </div>
    );
  }

  // Экран дня тестирования максимума (Четверг: Подтягивания, Суббота: Брусья)
  if (isTestDay) {
    const isCompleted = activeRecord.completedSets.length > 0;
    const completedSet = activeRecord.completedSets[0];
    const testTitle = isTestPullups ? 'ПОДТЯГИВАНИЯ' : 'БРУСЬЯ';
    const testMuscle = isTestPullups ? 'Спина & Бицепс' : 'Грудь & Трицепс';
    const testCue = isTestPullups
      ? 'Подбородок выше перекладины • полная фиксация внизу'
      : 'Угол 90° в локтях • четкий локаут вверху';

    if (isCompleted && !isEditingFinishedTest) {
      const working50 = Math.round(completedSet.reps * 0.5);
      return (
        <div className="precision-card p-5 text-center transition-all duration-300 shadow-2xl space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-[#ccff00]/15 border border-[#ccff00]/30 flex items-center justify-center mx-auto text-[#ccff00] shadow-[0_0_20px_rgba(204,255,0,0.3)]">
            <Trophy className="w-7 h-7 stroke-[2.5]" />
          </div>

          <div>
            <div className="text-[10px] font-mono text-[#ccff00] uppercase tracking-widest font-bold">
              РЕКОРД ЗАФИКСИРОВАН
            </div>
            <h3 className="text-2xl font-black text-white tracking-tight font-sans mt-0.5">
              {testTitle}: {completedSet.reps} ПОВТ.
            </h3>
            <p className="text-xs text-zinc-300 font-mono mt-1">
              Новый рабочий 50% норматив:{' '}
              <strong className="text-[#ccff00] text-sm">{working50} повт.</strong>
            </p>
          </div>

          <div className="p-3 rounded-xl bg-black/40 border border-white/[0.08] text-xs font-mono text-zinc-400">
            Нормативы следующего цикла автоматически пересчитаны с учетом прироста.
          </div>

          <div className="pt-1 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => {
                setTestInputReps(completedSet.reps);
                setIsEditingFinishedTest(true);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-[#1a1f2c] hover:bg-[#222838] border border-white/[0.08] text-xs font-mono text-zinc-300 flex items-center gap-1.5 transition-all"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Изменить рекорд
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="precision-card p-4 sm:p-5 transition-all duration-300 shadow-2xl">
        {/* Шапка теста */}
        <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.08]">
          <span className="text-[10px] font-mono tracking-widest uppercase text-[#ccff00] bg-[#ccff00]/10 border border-[#ccff00]/25 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1.5">
            <Flame className="w-3 h-3 text-[#ccff00]" />
            ТЕСТ 1ПМ · МАКСИМУМ
          </span>

          <span className="text-xs font-mono text-zinc-400">
            {testMuscle}
          </span>
        </div>

        {/* Название теста */}
        <div className="my-3">
          <div className="text-[9px] text-zinc-500 uppercase tracking-[0.2em] mb-0.5 font-mono font-bold">
            1 ПОДХОД ДО ПРЕДЕЛЬНОГО ОТКАЗА
          </div>

          <h2 className="text-2xl font-black text-white tracking-tight uppercase leading-tight font-sans">
            {testTitle}
          </h2>
          <div className="text-[11px] text-zinc-400 font-mono mt-0.5">
            {testCue}
          </div>

          {/* Поле ввода нового рекорда (вместо слайдера) */}
          <div className="mt-3 p-3.5 rounded-2xl bg-black/50 border border-white/[0.08] shadow-inner flex flex-col items-center gap-3">
            <span className="text-[10px] font-mono uppercase text-zinc-400 tracking-wider">
              Введите максимальное число повторений:
            </span>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setTestInputReps((r) => Math.max(1, r - 1))}
                className="w-11 h-11 rounded-2xl bg-[#1a1f2c] hover:bg-[#222838] border border-white/[0.12] flex items-center justify-center text-white text-xl font-black transition-all active:scale-95"
              >
                <Minus className="w-5 h-5 stroke-[2.5]" />
              </button>

              <div className="relative">
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={testInputReps}
                  onChange={(e) => setTestInputReps(Math.max(1, Number(e.target.value) || 1))}
                  className="w-24 py-1.5 text-center text-4xl font-black font-mono tracking-tight text-[#ccff00] bg-transparent border-b-2 border-[#ccff00]/60 focus:border-[#ccff00] focus:outline-none"
                />
              </div>

              <button
                type="button"
                onClick={() => setTestInputReps((r) => r + 1)}
                className="w-11 h-11 rounded-2xl bg-[#1a1f2c] hover:bg-[#222838] border border-white/[0.12] flex items-center justify-center text-white text-xl font-black transition-all active:scale-95"
              >
                <Plus className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>

            <div className="text-[11px] font-mono text-zinc-400">
              Новый рабочий норматив: <strong className="text-[#ccff00]">{Math.round(testInputReps * 0.5)} повт.</strong> (50%)
            </div>
          </div>
        </div>

        {/* Кнопка фиксации рекорда */}
        <div className="mt-3 pt-2.5 border-t border-white/[0.06]">
          <button
            type="button"
            onClick={handleConfirmTestRecord}
            className="w-full py-3.5 px-4 rounded-2xl bg-[#ccff00] hover:bg-[#d9f99d] text-black text-sm font-mono font-black flex items-center justify-center gap-2 transition-all active:scale-98 shadow-lg shadow-[#ccff00]/25 glow-neon"
          >
            <Trophy className="w-4 h-4 stroke-[2.5]" />
            <span>Зафиксировать рекорд ({testInputReps} повт.)</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="precision-card p-4 sm:p-5 transition-all duration-300 shadow-2xl">
      {/* Телеметрия: номер подхода, время отдыха / таймер */}
      <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.08]">
        <span className="text-[10px] font-mono tracking-widest uppercase text-[#ccff00] bg-[#ccff00]/10 border border-[#ccff00]/25 px-2.5 py-0.5 rounded-full font-bold">
          {isAllCompleted
            ? 'ПЛАН ВЫПОЛНЕН'
            : `ПОДХОД ${String(currentIndex + 1).padStart(2, '0')} / ${String(totalTasks).padStart(2, '0')}`}
        </span>

        <div
          className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border font-mono text-xs ${
            !lastSetTimestamp || isExpired
              ? 'bg-[#ccff00]/10 border-[#ccff00]/30 text-[#ccff00]'
              : 'bg-white/[0.06] border-white/[0.10] text-white'
          }`}
        >
          <span className="text-zinc-400 text-[10px] uppercase tracking-wider">
            {!lastSetTimestamp || isExpired ? 'Статус:' : 'Таймер:'}
          </span>
          <span className="font-bold font-mono">
            {!lastSetTimestamp ? 'Готов' : isExpired ? 'Готов! 🔥' : formattedRemaining}
          </span>
        </div>
      </div>

      {/* Фокус на текущем упражнении и нормативе */}
      <div className="my-3">
        <div className="text-[9px] text-zinc-500 uppercase tracking-[0.2em] mb-0.5 font-mono font-bold">
          {isAllCompleted ? 'СТАТУС ТРЕНИРОВКИ' : 'ТЕКУЩЕЕ ДВИЖЕНИЕ'}
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase leading-tight font-sans">
          {isAllCompleted ? 'ВСЕ ПОДХОДЫ ЗАКРЫТЫ' : (currentSlot?.exerciseName || 'Упражнение')}
        </h2>

        {/* Блок повторений и инструкции */}
        <div className="mt-2.5 flex items-center justify-between bg-black/50 rounded-2xl p-3 border border-white/[0.08] shadow-inner">
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl sm:text-4xl font-black font-mono tracking-tighter text-[#ccff00] leading-none">
              {isAllCompleted ? '100%' : (currentSlot?.reps ?? 10)}
            </span>
            <span className="text-xs font-mono text-zinc-400 font-bold uppercase tracking-wider">
              {isAllCompleted ? '' : 'повт.'}
            </span>
            {currentSlot?.weight ? (
              <span className="text-xs font-mono text-zinc-400 ml-1 font-semibold">
                • {currentSlot.weight} кг
              </span>
            ) : null}
          </div>

          <div className="text-right max-w-[55%]">
            <div className="text-[9px] font-mono uppercase text-zinc-500 tracking-wider">
              {isAllCompleted ? 'Итог дня' : 'Инструкция'}
            </div>
            <div className="text-[11px] text-zinc-300 font-medium leading-snug line-clamp-2">
              {isAllCompleted
                ? 'Суммарный объем дня набран чисто и без переутомления.'
                : (currentSlot?.cue || 'Контроль движения • чистое исполнение')}
            </div>
          </div>
        </div>
      </div>

      {/* Тактильный магнитный слайдер "Сдвиг для отметки" */}
      <div className="mt-3 pt-2.5 border-t border-white/[0.06]">
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
