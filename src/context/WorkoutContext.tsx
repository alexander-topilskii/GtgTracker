import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import {
  WorkoutProgramConfig,
  DayRecord,
  ExerciseConfig,
  ExerciseLogItem,
  DayType,
  AppSettings,
  DayPlanConfig,
} from '../types/workout';
import * as storage from '../services/storage';
import { formatToDateKey, getAutoDayType } from '../utils/dateUtils';
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
}

const WorkoutContext = createContext<WorkoutContextValue | null>(null);

export const WorkoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const todayDate = useMemo(() => formatToDateKey(new Date()), []);
  const [activeDate, setActiveDate] = useState<string>(todayDate);
  const [program, setProgramState] = useState<WorkoutProgramConfig>(() => storage.getProgram());
  const [history, setHistoryState] = useState<Record<string, DayRecord>>(() => storage.getHistory());
  const [settings, setSettingsState] = useState<AppSettings>(() => storage.getSettings());

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

  // Запись за активный день (если нет в истории, автоматически вычисляем день А/Б или отдых)
  const activeRecord = useMemo<DayRecord>(() => {
    if (history[activeDate]) {
      return history[activeDate];
    }
    const autoDayType = getAutoDayType(activeDate, history);
    return {
      date: activeDate,
      dayType: autoDayType,
      completedSets: [],
    };
  }, [history, activeDate]);

  // План упражнений для типа дня из активной записи
  const activeDayPlan = useMemo<DayPlanConfig | undefined>(() => {
    return program.days[activeRecord.dayType] || program.days['A'];
  }, [program, activeRecord.dayType]);

  // Переключение типа дня (День А / День Б / Отдых)
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
