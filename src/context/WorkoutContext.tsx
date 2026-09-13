import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import {
  WorkoutProgramConfig,
  DayRecord,
  ExerciseConfig,
  ExerciseLogItem,
  DayType,
  AppSettings,
  DayPlanConfig,
  CycleState,
} from '../types/workout';
import * as storage from '../services/storage';
import { formatToDateKey } from '../utils/dateUtils';
import {
  getCycleWeekInfo,
  getAutoDayTypeForCycle,
  getDeloadPlan,
  getPullUpsTestPlan,
  getDipsTestPlan,
  recalculateProgramForNewCycle,
  getMondayOfCurrentWeek,
} from '../utils/cycleManager';
import defaultProgramJson from '../data/defaultProgram.json';

interface WorkoutContextValue {
  program: WorkoutProgramConfig;
  updateProgram: (program: WorkoutProgramConfig) => void;
  resetProgramToDefault: () => void;
  history: Record<string, DayRecord>;
  activeDate: string;
  setActiveDate: (date: string) => void;
  todayDate: string;
  activeRecord: DayRecord;
  activeDayPlan: DayPlanConfig | undefined;
  switchDayType: (dayType: DayType) => void;
  logSet: (exercise: ExerciseConfig, reps?: number, weight?: number) => ExerciseLogItem;
  deleteSet: (setId: string) => void;
  updateSet: (setId: string, updates: Partial<Pick<ExerciseLogItem, 'reps' | 'weight'>>) => void;
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;
  lastSetTimestamp: number | null;
  refreshData: () => void;
  // 4-недельный цикл и тестирование
  cycleState: CycleState;
  updateCycleState: (updates: Partial<CycleState>) => void;
  weekInfo: {
    cycleNumber: number;
    weekNumber: number;
    isDeloadWeek: boolean;
    dayOfWeek: number;
  };
  logTestRecord: (exerciseId: 'pull-ups' | 'dips', maxReps: number) => ExerciseLogItem;
  applyCycleRecalculation: (newPullMax: number, newDipsMax: number) => void;
  updateExerciseInProgram: (dayKey: string, exerciseId: string, reps: number, weight?: number) => void;
}

const WorkoutContext = createContext<WorkoutContextValue | null>(null);

export const WorkoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const todayDate = useMemo(() => formatToDateKey(new Date()), []);
  const [activeDate, setActiveDate] = useState<string>(todayDate);
  const [program, setProgramState] = useState<WorkoutProgramConfig>(() => storage.getProgram());
  const [history, setHistoryState] = useState<Record<string, DayRecord>>(() => storage.getHistory());
  const [settings, setSettingsState] = useState<AppSettings>(() => storage.getSettings());
  const [cycleState, setCycleState] = useState<CycleState>(() => storage.getCycleState());

  // Обновление состояния цикла
  const updateCycleState = useCallback((updates: Partial<CycleState>) => {
    setCycleState((prev) => {
      const updated = { ...prev, ...updates };
      storage.saveCycleState(updated);
      return updated;
    });
  }, []);

  // Информация о неделе в рамках активной даты
  const weekInfo = useMemo(() => {
    return getCycleWeekInfo(activeDate, cycleState);
  }, [activeDate, cycleState]);

  // Обновление программы тренировок
  const updateProgram = useCallback((newProgram: WorkoutProgramConfig) => {
    storage.saveProgram(newProgram);
    setProgramState(newProgram);
  }, []);

  // Сброс программы к дефолтной
  const resetProgramToDefault = useCallback(() => {
    const defaultProg = defaultProgramJson as WorkoutProgramConfig;
    storage.saveProgram(defaultProg);
    setProgramState(defaultProg);
  }, []);

  // Обновление настроек
  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    const updated = { ...settings, ...updates };
    storage.saveSettings(updated);
    setSettingsState(updated);
  }, [settings]);

  // Запись за активный день (автоматический расчет с учетом недели цикла)
  const activeRecord = useMemo<DayRecord>(() => {
    if (history[activeDate]) {
      return history[activeDate];
    }
    const autoDayType = getAutoDayTypeForCycle(activeDate, cycleState, history);
    return {
      date: activeDate,
      dayType: autoDayType,
      completedSets: [],
    };
  }, [history, activeDate, cycleState]);

  // План упражнений для типа дня из активной записи
  const activeDayPlan = useMemo<DayPlanConfig | undefined>(() => {
    if (activeRecord.dayType === 'DELOAD') {
      return getDeloadPlan();
    }
    if (activeRecord.dayType === 'TEST_PULLUPS') {
      return getPullUpsTestPlan(cycleState.baseMaxes.pullUps);
    }
    if (activeRecord.dayType === 'TEST_DIPS') {
      return getDipsTestPlan(cycleState.baseMaxes.dips);
    }
    return program.days[activeRecord.dayType] || program.days['A'];
  }, [program, activeRecord.dayType, cycleState.baseMaxes]);

  // Переключение типа дня
  const switchDayType = useCallback((dayType: DayType) => {
    const current = history[activeDate] || {
      date: activeDate,
      dayType,
      completedSets: [],
    };
    const updated: DayRecord = {
      ...current,
      dayType,
    };
    storage.saveDayRecord(updated);
    setHistoryState((prev) => ({ ...prev, [activeDate]: updated }));
  }, [activeDate, history]);

  // Фиксация подхода
  const logSet = useCallback((exercise: ExerciseConfig, reps?: number, weight?: number) => {
    const newSet = storage.logSet(activeDate, activeRecord.dayType, exercise, reps, weight);
    const updatedRecord = storage.getDayRecord(activeDate, activeRecord.dayType);
    setHistoryState((prev) => ({ ...prev, [activeDate]: updatedRecord }));
    return newSet;
  }, [activeDate, activeRecord.dayType]);

  // Фиксация рекорда в день теста
  const logTestRecord = useCallback((exerciseId: 'pull-ups' | 'dips', maxReps: number) => {
    const isPullUps = exerciseId === 'pull-ups';
    const testExercise: ExerciseConfig = {
      id: exerciseId,
      name: isPullUps ? 'Подтягивания (Тест максимума)' : 'Брусья (Тест максимума)',
      targetSets: 1,
      defaultReps: maxReps,
      muscle: isPullUps ? 'Спина & Бицепс' : 'Грудь & Трицепс',
      code: isPullUps ? 'PULL_TEST' : 'DIPS_TEST',
      cue: '1 подход на максимум повторений',
    };

    const newSet = storage.logSet(activeDate, activeRecord.dayType, testExercise, maxReps);
    const updatedRecord = storage.getDayRecord(activeDate, activeRecord.dayType);
    setHistoryState((prev) => ({ ...prev, [activeDate]: updatedRecord }));

    // Сохраняем результат в cycleState
    const updatedResults = {
      ...cycleState.testResults,
      [isPullUps ? 'pullUps' : 'dips']: maxReps,
      [isPullUps ? 'pullUpsTestedAt' : 'dipsTestedAt']: activeDate,
    };

    const nextState: CycleState = {
      ...cycleState,
      testResults: updatedResults,
    };
    storage.saveCycleState(nextState);
    setCycleState(nextState);

    // Автоматический пересчет нормативов для нового цикла
    const pullMax = updatedResults.pullUps ?? cycleState.baseMaxes.pullUps;
    const dipsMax = updatedResults.dips ?? cycleState.baseMaxes.dips;

    const { updatedProgram } = recalculateProgramForNewCycle(
      program,
      cycleState.baseMaxes.pullUps,
      pullMax,
      cycleState.baseMaxes.dips,
      dipsMax
    );
    storage.saveProgram(updatedProgram);
    setProgramState(updatedProgram);

    return newSet;
  }, [activeDate, activeRecord.dayType, cycleState, program]);

  // Принудительное применение пересчета цикла
  const applyCycleRecalculation = useCallback((newPullMax: number, newDipsMax: number) => {
    const { updatedProgram } = recalculateProgramForNewCycle(
      program,
      cycleState.baseMaxes.pullUps,
      newPullMax,
      cycleState.baseMaxes.dips,
      newDipsMax
    );

    // Сохраняем программу
    storage.saveProgram(updatedProgram);
    setProgramState(updatedProgram);

    // Записываем в историю тестов
    const historyItem = {
      cycle: cycleState.currentCycle,
      date: activeDate,
      oldPullUps: cycleState.baseMaxes.pullUps,
      newPullUps: newPullMax,
      oldDips: cycleState.baseMaxes.dips,
      newDips: newDipsMax,
      pullUpsWorking: Math.round(newPullMax * 0.5),
      dipsWorking: Math.round(newDipsMax * 0.5),
    };

    const nextCycleState: CycleState = {
      currentCycle: cycleState.currentCycle + 1,
      startDate: getMondayOfCurrentWeek(),
      manualWeekOverride: null,
      baseMaxes: {
        pullUps: newPullMax,
        dips: newDipsMax,
      },
      testResults: {},
      testHistory: [historyItem, ...(cycleState.testHistory || [])],
    };

    storage.saveCycleState(nextCycleState);
    setCycleState(nextCycleState);
  }, [activeDate, cycleState, program]);

  // Изменение нормативов упражнения в программе (из календаря или редактора)
  const updateExerciseInProgram = useCallback((dayKey: string, exerciseId: string, reps: number, weight?: number) => {
    if (dayKey !== 'A' && dayKey !== 'B') return;

    const dayPlan = program.days[dayKey];
    if (!dayPlan) return;

    const updatedExercises = dayPlan.exercises.map((ex) =>
      ex.id === exerciseId ? { ...ex, defaultReps: Math.max(1, reps), weight } : ex
    );

    const updatedSchedule = dayPlan.schedule?.map((slot) =>
      slot.exerciseId === exerciseId ? { ...slot, reps: Math.max(1, reps), weight } : slot
    );

    const updatedProgram: WorkoutProgramConfig = {
      ...program,
      days: {
        ...program.days,
        [dayKey]: {
          ...dayPlan,
          exercises: updatedExercises,
          schedule: updatedSchedule,
        },
      },
    };

    storage.saveProgram(updatedProgram);
    setProgramState(updatedProgram);
  }, [program]);

  // Удаление подхода
  const deleteSet = useCallback((setId: string) => {
    storage.deleteSet(activeDate, setId);
    const updatedRecord = storage.getDayRecord(activeDate, activeRecord.dayType);
    setHistoryState((prev) => ({ ...prev, [activeDate]: updatedRecord }));
  }, [activeDate, activeRecord.dayType]);

  // Обновление параметров подхода
  const updateSet = useCallback((setId: string, updates: Partial<Pick<ExerciseLogItem, 'reps' | 'weight'>>) => {
    storage.updateSet(activeDate, setId, updates);
    const updatedRecord = storage.getDayRecord(activeDate, activeRecord.dayType);
    setHistoryState((prev) => ({ ...prev, [activeDate]: updatedRecord }));
  }, [activeDate, activeRecord.dayType]);

  // Самый свежий timestamp подхода за сегодня
  const lastSetTimestamp = useMemo<number | null>(() => {
    const todayRec = history[todayDate];
    if (!todayRec || !todayRec.completedSets.length) return null;
    return Math.max(...todayRec.completedSets.map((s) => s.timestamp));
  }, [history, todayDate]);

  // Принудительное обновление данных из хранилища
  const refreshData = useCallback(() => {
    setProgramState(storage.getProgram());
    setHistoryState(storage.getHistory());
    setSettingsState(storage.getSettings());
    setCycleState(storage.getCycleState());
  }, []);

  return (
    <WorkoutContext.Provider
      value={{
        program,
        updateProgram,
        resetProgramToDefault,
        history,
        activeDate,
        setActiveDate,
        todayDate,
        activeRecord,
        activeDayPlan,
        switchDayType,
        logSet,
        deleteSet,
        updateSet,
        settings,
        updateSettings,
        lastSetTimestamp,
        refreshData,
        cycleState,
        updateCycleState,
        weekInfo,
        logTestRecord,
        applyCycleRecalculation,
        updateExerciseInProgram,
      }}
    >
      {children}
    </WorkoutContext.Provider>
  );
};

export function useWorkout(): WorkoutContextValue {
  const context = useContext(WorkoutContext);
  if (!context) {
    throw new Error('useWorkout must be used within a WorkoutProvider');
  }
  return context;
}
