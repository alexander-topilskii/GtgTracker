export type DayType = 'A' | 'B' | 'REST' | string;

export interface ExerciseConfig {
  id: string;
  name: string;
  targetSets: number;
  defaultReps: number;
  weight?: number; // опциональный рабочий вес в кг
  notes?: string;
}

export interface DayPlanConfig {
  dayType: DayType;
  title: string;
  description?: string;
  exercises: ExerciseConfig[];
}

export interface WorkoutProgramConfig {
  version: number;
  name: string;
  defaultRestIntervalMinutes: number; // по умолчанию 60 мин
  days: Record<string, DayPlanConfig>;
}

export interface ExerciseLogItem {
  id: string;
  exerciseId: string;
  exerciseNameSnapshot: string; // Имя упражнения на момент выполнения (иммутабельно)
  targetRepsSnapshot?: number;   // Целевой норматив на момент выполнения
  timestamp: number;            // Date.now()
  reps: number;                 // Фактически выполненные повторения
  weight?: number;              // Фактический вес
}

export interface DayRecord {
  date: string; // Формат YYYY-MM-DD
  dayType: DayType;
  completedSets: ExerciseLogItem[];
  programVersionSnapshot?: number;
  notes?: string;
}

export interface AppSettings {
  restIntervalMinutes: number;
  hapticFeedbackEnabled: boolean;
  soundFeedbackEnabled: boolean;
  theme: 'dark';
}
