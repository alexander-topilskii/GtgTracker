import React, { useState, useMemo } from 'react';
import { useWorkout } from '../../context/WorkoutContext';
import { CalendarHeatmap } from './CalendarHeatmap';
import { VolumeTracker } from './VolumeTracker';
import { formatToDateKey, formatFriendlyDate } from '../../utils/dateUtils';
import {
  getCycleWeekInfo,
  getAutoDayTypeForCycle,
  getDeloadPlan,
  getPullUpsTestPlan,
  getDipsTestPlan,
} from '../../utils/cycleManager';
import {
  Clock,
  Calendar,
  CheckCircle2,
  CircleDashed,
  Plus,
  Minus,
  Dumbbell,
  BatteryCharging,
  Trophy,
  Sliders,
} from 'lucide-react';
import { haptic } from '../../utils/haptics';

export const HistoryView: React.FC = () => {
  const {
    history,
    todayDate,
    cycleState,
    program,
    updateExerciseInProgram,
    settings,
  } = useWorkout();

  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return formatToDateKey(new Date());
  });

  const [isEditingPlan, setIsEditingPlan] = useState<boolean>(false);

  const selectedRecord = history[selectedDate];
  const isToday = selectedDate === todayDate;

  // Определение типа дня для выбранной даты
  const effectiveDayType = useMemo(() => {
    return selectedRecord?.dayType ?? getAutoDayTypeForCycle(selectedDate, cycleState, history);
  }, [selectedRecord?.dayType, selectedDate, cycleState, history]);

  // Неделя цикла для выбранной даты
  const dateWeekInfo = useMemo(() => {
    return getCycleWeekInfo(selectedDate, cycleState);
  }, [selectedDate, cycleState]);

  // План на выбранный день
  const scheduledPlan = useMemo(() => {
    if (effectiveDayType === 'DELOAD') {
      return getDeloadPlan();
    }
    if (effectiveDayType === 'TEST_PULLUPS') {
      return getPullUpsTestPlan(cycleState.baseMaxes.pullUps);
    }
    if (effectiveDayType === 'TEST_DIPS') {
      return getDipsTestPlan(cycleState.baseMaxes.dips);
    }
    if (effectiveDayType === 'REST') {
      return null;
    }
    return program.days[effectiveDayType] || program.days['A'];
  }, [effectiveDayType, cycleState.baseMaxes, program.days]);

  // Оформление бейджа дня
  const dayBadge = useMemo(() => {
    switch (effectiveDayType) {
      case 'A':
        return { text: 'День А (Верх и Руки)', color: 'bg-[#ccff00]/15 text-[#ccff00] border-[#ccff00]/30' };
      case 'B':
        return { text: 'День Б (Низ, Плечи, Кор)', color: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30' };
      case 'DELOAD':
        return { text: 'Делоад (Отдых от базы)', color: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30' };
      case 'TEST_PULLUPS':
        return { text: 'Тест: Подтягивания', color: 'bg-[#ccff00]/25 text-[#ccff00] border-[#ccff00]/40 font-bold' };
      case 'TEST_DIPS':
        return { text: 'Тест: Брусья', color: 'bg-[#ccff00]/25 text-[#ccff00] border-[#ccff00]/40 font-bold' };
      case 'REST':
      default:
        return { text: 'День отдыха', color: 'bg-zinc-800 text-zinc-400 border-white/5' };
    }
  }, [effectiveDayType]);

  const handleRepsChange = (exerciseId: string, currentReps: number, delta: number, currentWeight?: number) => {
    haptic.trigger('light', settings.soundFeedbackEnabled);
    const newReps = Math.max(1, currentReps + delta);
    updateExerciseInProgram(effectiveDayType, exerciseId, newReps, currentWeight);
  };

  const handleWeightChange = (exerciseId: string, currentWeight: number, delta: number, currentReps: number) => {
    haptic.trigger('light', settings.soundFeedbackEnabled);
    const newWeight = Math.max(0, currentWeight + delta);
    updateExerciseInProgram(effectiveDayType, exerciseId, currentReps, newWeight > 0 ? newWeight : undefined);
  };

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4">
      {/* 1. Интерактивный календарь с точками статусов */}
      <CalendarHeatmap
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
      />

      {/* 2. Детализация выбранного дня и план */}
      <div className="p-4 rounded-2xl bg-[#131622] border border-white/[0.12] shadow-xl shadow-black/40 space-y-4">
        {/* Шапка выбранного дня */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#ccff00]" />
            <h4 className="text-sm font-bold text-white font-sans">
              {formatFriendlyDate(selectedDate)}
              {isToday && (
                <span className="ml-2 text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#ccff00]/15 text-[#ccff00] border border-[#ccff00]/30 font-bold">
                  Сегодня
                </span>
              )}
            </h4>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-zinc-400">
              W{dateWeekInfo.weekNumber}/4
            </span>
            <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full border font-semibold ${dayBadge.color}`}>
              {dayBadge.text}
            </span>
          </div>
        </div>

        {/* БЛОК 1: ПЛАН НА ВЫБРАННЫЙ ДЕНЬ С РЕДАКТИРОВАНИЕМ ПАРАМЕТРОВ */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 font-bold">
              <Dumbbell className="w-3.5 h-3.5 text-[#ccff00]" />
              План на день
            </span>

            {(effectiveDayType === 'A' || effectiveDayType === 'B') && (
              <button
                type="button"
                onClick={() => setIsEditingPlan((v) => !v)}
                className={`text-[10px] font-mono px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1 ${
                  isEditingPlan
                    ? 'bg-[#ccff00] text-black font-bold border-[#ccff00]'
                    : 'bg-[#1a1f2c] text-zinc-300 hover:text-white border-white/[0.08]'
                }`}
              >
                <Sliders className="w-3 h-3" />
                {isEditingPlan ? 'Готово' : 'Настроить нормативы'}
              </button>
            )}
          </div>

          {/* Вариант А / Б: список упражнений плана с кнопками редактирования */}
          {scheduledPlan && scheduledPlan.exercises.length > 0 && (effectiveDayType === 'A' || effectiveDayType === 'B') && (
            <div className="space-y-2">
              {scheduledPlan.exercises.map((ex) => {
                const currentWeight = ex.weight ?? 0;

                return (
                  <div
                    key={ex.id}
                    className="p-3 rounded-xl bg-[#1a1f2c] border border-white/[0.08] flex items-center justify-between shadow-sm transition-all"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="text-xs font-bold text-white font-sans truncate">
                        {ex.name}
                      </div>
                      <div className="text-[10px] font-mono text-zinc-400 mt-0.5">
                        {ex.targetSets} подх. • {ex.muscle || 'Базовое движение'}
                      </div>
                    </div>

                    {/* Параметры повторений и веса (с возможностью быстрой правки) */}
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Степпер повторений */}
                      <div className="flex items-center gap-1 bg-[#131622] p-1 rounded-lg border border-white/[0.08]">
                        {isEditingPlan && (
                          <button
                            type="button"
                            onClick={() => handleRepsChange(ex.id, ex.defaultReps, -1, ex.weight)}
                            className="w-6 h-6 rounded-md bg-[#222838] hover:bg-[#2b3347] active:scale-95 text-white flex items-center justify-center text-xs"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                        )}

                        <span className="px-2 text-xs font-mono font-bold text-[#ccff00] min-w-9 text-center">
                          {ex.defaultReps} повт.
                        </span>

                        {isEditingPlan && (
                          <button
                            type="button"
                            onClick={() => handleRepsChange(ex.id, ex.defaultReps, 1, ex.weight)}
                            className="w-6 h-6 rounded-md bg-[#222838] hover:bg-[#2b3347] active:scale-95 text-white flex items-center justify-center text-xs"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      {/* Вес (если задан или в режиме редактирования) */}
                      {(currentWeight > 0 || isEditingPlan) && (
                        <div className="flex items-center gap-1 bg-[#131622] p-1 rounded-lg border border-white/[0.08]">
                          {isEditingPlan && (
                            <button
                              type="button"
                              onClick={() => handleWeightChange(ex.id, currentWeight, -1, ex.defaultReps)}
                              className="w-6 h-6 rounded-md bg-[#222838] hover:bg-[#2b3347] active:scale-95 text-zinc-300 flex items-center justify-center text-xs"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                          )}

                          <span className="px-1.5 text-xs font-mono text-zinc-300 min-w-8 text-center font-medium">
                            {currentWeight} кг
                          </span>

                          {isEditingPlan && (
                            <button
                              type="button"
                              onClick={() => handleWeightChange(ex.id, currentWeight, 1, ex.defaultReps)}
                              className="w-6 h-6 rounded-md bg-[#222838] hover:bg-[#2b3347] active:scale-95 text-zinc-300 flex items-center justify-center text-xs"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Вариант: День тестирования */}
          {(effectiveDayType === 'TEST_PULLUPS' || effectiveDayType === 'TEST_DIPS') && (
            <div className="p-3.5 rounded-xl bg-black/40 border border-[#ccff00]/25 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#ccff00]">
                <Trophy className="w-4 h-4" />
                <span>1 подход на максимальное число повторений</span>
              </div>
              <p className="text-[11px] text-zinc-300 font-mono">
                {effectiveDayType === 'TEST_PULLUPS' ? 'Тест подтягиваний' : 'Тест брусьев'} с идеальной техникой.
                Текущая база:{' '}
                <strong className="text-white">
                  {effectiveDayType === 'TEST_PULLUPS' ? cycleState.baseMaxes.pullUps : cycleState.baseMaxes.dips} повт.
                </strong>{' '}
                (рабочие 50% = {Math.round((effectiveDayType === 'TEST_PULLUPS' ? cycleState.baseMaxes.pullUps : cycleState.baseMaxes.dips) * 0.5)}).
              </p>
            </div>
          )}

          {/* Вариант: Делоад */}
          {effectiveDayType === 'DELOAD' && (
            <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-500/20 space-y-1">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-300">
                <BatteryCharging className="w-4 h-4" />
                <span>Делоад: отдых от базы</span>
              </div>
              <p className="text-[11px] text-zinc-400 font-mono">
                Снижение тренировочного стресса для связок и ЦНС перед предельными тестами в четверг и субботу.
              </p>
            </div>
          )}

          {/* Вариант: Обычный день отдыха */}
          {effectiveDayType === 'REST' && (
            <div className="p-3.5 rounded-xl bg-[#1a1f2c]/50 border border-white/[0.06] text-xs font-mono text-zinc-400">
              День отдыха и суперкомпенсации. Базовые упражнения не запланированы.
            </div>
          )}
        </div>

        {/* БЛОК 2: ФАКТИЧЕСКИ ВЫПОЛНЕННЫЕ ПОДХОДЫ */}
        <div className="pt-2 border-t border-white/[0.06] space-y-2.5">
          <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider flex items-center justify-between font-bold">
            <span>Фактически выполнено</span>
            {selectedRecord && selectedRecord.completedSets.length > 0 && (
              <span className="text-[#ccff00] flex items-center gap-1 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {selectedRecord.completedSets.reduce((a, s) => a + s.reps, 0)} повт. ({selectedRecord.completedSets.length} подх.)
              </span>
            )}
          </div>

          {!selectedRecord || selectedRecord.completedSets.length === 0 ? (
            <div className="py-4 rounded-xl bg-[#1a1f2c]/40 border border-white/[0.06] text-center text-xs font-mono text-zinc-500 flex flex-col items-center gap-1">
              <CircleDashed className="w-5 h-5 text-zinc-600 stroke-[1.5]" />
              <span>
                {selectedDate > todayDate
                  ? 'Будущий тренировочный день. Нормативы можно скорректировать выше.'
                  : 'Подходы за этот день еще не зафиксированы.'}
              </span>
            </div>
          ) : (
            <div className="space-y-1.5">
              {selectedRecord.completedSets.map((set, idx) => {
                const timeStr = new Intl.DateTimeFormat('ru-RU', {
                  hour: '2-digit',
                  minute: '2-digit',
                }).format(new Date(set.timestamp));

                return (
                  <div
                    key={set.id}
                    className="p-2.5 rounded-xl bg-[#1a1f2c] border border-white/[0.08] flex items-center justify-between shadow-sm"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-[#ccff00]/10 text-[#ccff00] text-[10px] font-mono font-bold flex items-center justify-center border border-[#ccff00]/25">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="text-xs font-semibold text-white font-sans">
                          {set.exerciseNameSnapshot}
                        </div>
                        <div className="text-[10px] font-mono text-zinc-400 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {timeStr}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold font-mono text-[#ccff00]">
                        {set.reps} повт.
                      </span>
                      {set.weight ? (
                        <div className="text-[10px] font-mono text-zinc-400">
                          {set.weight} кг
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 3. Трекер суммарного объема нагрузки */}
      <VolumeTracker />
    </div>
  );
};
