import {
  WorkoutProgramConfig,
  DayRecord,
  ExerciseConfig,
  ExerciseLogItem,
  DayType,
  AppSettings,
  CycleState,
} from '../types/workout';
import defaultProgramData from '../data/defaultProgram.json';
import { DEFAULT_CYCLE_STATE } from '../utils/cycleManager';

const STORAGE_KEYS = {
  PROGRAM: 'gtg_program_v1',
  HISTORY: 'gtg_history_v1',
  SETTINGS: 'gtg_settings_v1',
  CYCLE: 'gtg_cycle_v1',
} as const;

export const DEFAULT_SETTINGS: AppSettings = {
  restIntervalMinutes: 60,
  hapticFeedbackEnabled: true,
  soundFeedbackEnabled: false,
  notificationsEnabled: false,
  theme: 'dark',
};

// Безопасная работа с localStorage (защита от приватного режима Safari и квот)
class SafeStorage {
  private memoryFallback: Map<string, string> = new Map();

  getItem(key: string): string | null {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch {
      // Игнорируем ошибку и используем memory fallback
    }
    return this.memoryFallback.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
        return;
      }
    } catch {
      // Игнорируем ошибку и используем memory fallback
    }
    this.memoryFallback.set(key, value);
  }

  removeItem(key: string): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch {
      // Игнорируем
    }
    this.memoryFallback.delete(key);
  }
}

const safeStorage = new SafeStorage();

// Получение текущей программы
export function getProgram(): WorkoutProgramConfig {
  const raw = safeStorage.getItem(STORAGE_KEYS.PROGRAM);
  if (!raw) {
    const initialProgram = defaultProgramData as WorkoutProgramConfig;
    saveProgram(initialProgram);
    return initialProgram;
  }
  try {
    const parsed = JSON.parse(raw) as WorkoutProgramConfig;
    // Автоматическая миграция на новую версию программы по умолчанию при обновлении
    if (!parsed.version || parsed.version < defaultProgramData.version) {
      const updated = defaultProgramData as WorkoutProgramConfig;
      saveProgram(updated);
      return updated;
    }
    return parsed;
  } catch {
    return defaultProgramData as WorkoutProgramConfig;
  }
}

// Сохранение программы (НЕ мутирует исторические записи!)
export function saveProgram(program: WorkoutProgramConfig): void {
  safeStorage.setItem(STORAGE_KEYS.PROGRAM, JSON.stringify(program));
}

// Получение всей истории тренировок
export function getHistory(): Record<string, DayRecord> {
  const raw = safeStorage.getItem(STORAGE_KEYS.HISTORY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, DayRecord>;
  } catch {
    return {};
  }
}

// Сохранение всей истории
export function saveHistory(history: Record<string, DayRecord>): void {
  safeStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
}

// Получение записи за конкретный день
export function getDayRecord(date: string, fallbackDayType: DayType = 'A'): DayRecord {
  const history = getHistory();
  if (history[date]) {
    return history[date];
  }
  return {
    date,
    dayType: fallbackDayType,
    completedSets: [],
  };
}

// Сохранение записи за день
export function saveDayRecord(record: DayRecord): void {
  const history = getHistory();
  history[record.date] = record;
  saveHistory(history);
}

// Фиксация подхода с ОБЯЗАТЕЛЬНЫМ сохранением снапшота названия и норматива
export function logSet(
  date: string,
  dayType: DayType,
  exercise: ExerciseConfig,
  reps?: number,
  weight?: number
): ExerciseLogItem {
  const record = getDayRecord(date, dayType);

  const newSet: ExerciseLogItem = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `set_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    exerciseId: exercise.id,
    exerciseNameSnapshot: exercise.name, // ИММУТАБЕЛЬНЫЙ СНАПШОТ НАЗВАНИЯ
    targetRepsSnapshot: exercise.defaultReps, // ИММУТАБЕЛЬНЫЙ СНАПШОТ НОРМАТИВА
    timestamp: Date.now(),
    reps: reps ?? exercise.defaultReps,
    weight: weight ?? exercise.weight,
  };

  record.completedSets.push(newSet);
  record.dayType = dayType;
  saveDayRecord(record);

  return newSet;
}

// Удаление подхода по ID
export function deleteSet(date: string, setId: string): void {
  const history = getHistory();
  const record = history[date];
  if (!record) return;

  record.completedSets = record.completedSets.filter((set) => set.id !== setId);
  saveHistory(history);
}

// Обновление параметров подхода (повторения/вес)
export function updateSet(
  date: string,
  setId: string,
  updates: Partial<Pick<ExerciseLogItem, 'reps' | 'weight'>>
): void {
  const history = getHistory();
  const record = history[date];
  if (!record) return;

  const targetIndex = record.completedSets.findIndex((set) => set.id !== setId);
  if (targetIndex !== -1) {
    record.completedSets[targetIndex] = {
      ...record.completedSets[targetIndex],
      ...updates,
    };
    saveHistory(history);
  }
}

// Настройки приложения
export function getSettings(): AppSettings {
  const raw = safeStorage.getItem(STORAGE_KEYS.SETTINGS);
  if (!raw) return DEFAULT_SETTINGS;
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  safeStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
}

// Получение состояния 4-недельного цикла
export function getCycleState(): CycleState {
  const raw = safeStorage.getItem(STORAGE_KEYS.CYCLE);
  if (!raw) return DEFAULT_CYCLE_STATE;
  try {
    return { ...DEFAULT_CYCLE_STATE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_CYCLE_STATE;
  }
}

// Сохранение состояния 4-недельного цикла
export function saveCycleState(cycleState: CycleState): void {
  safeStorage.setItem(STORAGE_KEYS.CYCLE, JSON.stringify(cycleState));
}

// Полный экспорт бэкапа
export interface BackupData {
  version: number;
  exportedAt: string;
  program: WorkoutProgramConfig;
  history: Record<string, DayRecord>;
  settings: AppSettings;
  cycle: CycleState;
}

export function exportBackup(): string {
  const backup: BackupData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    program: getProgram(),
    history: getHistory(),
    settings: getSettings(),
    cycle: getCycleState(),
  };
  return JSON.stringify(backup, null, 2);
}

// Восстановление из бэкапа
export function importBackup(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString) as Partial<BackupData>;
    if (data.program) saveProgram(data.program);
    if (data.history) saveHistory(data.history);
    if (data.settings) saveSettings({ ...DEFAULT_SETTINGS, ...data.settings });
    if (data.cycle) saveCycleState({ ...DEFAULT_CYCLE_STATE, ...data.cycle });
    return true;
  } catch (err) {
    console.error('Failed to import backup:', err);
    return false;
  }
}

// Полный сброс к заводским настройкам
export function resetAllData(): void {
  safeStorage.removeItem(STORAGE_KEYS.PROGRAM);
  safeStorage.removeItem(STORAGE_KEYS.HISTORY);
  safeStorage.removeItem(STORAGE_KEYS.SETTINGS);
  safeStorage.removeItem(STORAGE_KEYS.CYCLE);
}
