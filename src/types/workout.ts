export type DayType = 'A' | 'B' | 'REST' | string;

export interface ScheduleSlot {
  id: string;
  time: string; // Например, "10:00", "11:30"
  exerciseId: string;
  exerciseName: string;
  reps: number;
  weight?: number;
}

export interface ExerciseConfig {
  id: string;
  name: string;
  targetSets: number;
  defaultReps: number;
  weight?: number; // опциональный рабочий вес в кг
  timeSlots?: string[]; // Рекомендуемые слоты времени, например: ["10:00", "14:30", "17:30"]
  notes?: string;
}

export interface DayPlanConfig {
  dayType: DayType;
  title: string;
  description?: string;
  exercises: ExerciseConfig[];
  schedule?: ScheduleSlot[];
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
