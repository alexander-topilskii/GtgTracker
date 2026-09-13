export type DayType = 'A' | 'B' | 'REST' | 'DELOAD' | 'TEST_PULLUPS' | 'TEST_DIPS' | string;

export interface CycleTestHistoryItem {
  cycle: number;
  date: string;
  oldPullUps: number;
  newPullUps: number;
  oldDips: number;
  newDips: number;
  pullUpsWorking: number;
  dipsWorking: number;
}

export interface CycleState {
  currentCycle: number; // 1, 2, ...
  startDate: string; // YYYY-MM-DD (понедельник недели 1)
  manualWeekOverride?: number | null; // 1..4 (для тестирования или ручного сдвига)
  baseMaxes: {
    pullUps: number; // Стартовый рекорд (например, 22 или 20)
    dips: number;    // Стартовый рекорд (например, 30)
  };
  testResults?: {
    pullUps?: number;
    dips?: number;
    pullUpsTestedAt?: string;
    dipsTestedAt?: string;
  };
  testHistory?: CycleTestHistoryItem[];
}

export interface ScheduleSlot {
  id: string;
  time: string; // Например, "10:00", "11:30"
  exerciseId: string;
  exerciseName: string;
  reps: number;
  weight?: number;
  muscle?: string;
  cue?: string;
  code?: string;
}

export interface ExerciseConfig {
  id: string;
  name: string;
  targetSets: number;
  defaultReps: number;
  weight?: number; // опциональный рабочий вес в кг
  timeSlots?: string[]; // Рекомендуемые слоты времени, например: ["10:00", "14:30", "17:30"]
  notes?: string;
  muscle?: string;
  cue?: string;
  code?: string;
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
  notificationsEnabled: boolean;
  theme: 'dark';
}
