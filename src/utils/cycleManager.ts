import {
  CycleState,
  DayType,
  DayPlanConfig,
  WorkoutProgramConfig,
  DayRecord,
} from '../types/workout';
import { parseDateKey, formatToDateKey } from './dateUtils';

// Получение понедельника текущей недели в формате YYYY-MM-DD
export function getMondayOfCurrentWeek(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // подстраиваемся под понедельник
  d.setDate(diff);
  return formatToDateKey(d);
}

// Дефолтное состояние цикла
export const DEFAULT_CYCLE_STATE: CycleState = {
  currentCycle: 1,
  startDate: getMondayOfCurrentWeek(),
  baseMaxes: {
    pullUps: 22, // 50% = 11 рабочих повторений в стартовой программе
    dips: 30,    // 50% = 15 рабочих повторений в стартовой программе
  },
  testResults: {},
  testHistory: [],
};

// Вычисление текущего номера недели (1, 2, 3, 4)
export function getCycleWeekInfo(
  targetDateKey: string,
  cycleState: CycleState
): {
  cycleNumber: number;
  weekNumber: number; // 1, 2, 3, 4
  isDeloadWeek: boolean;
  dayOfWeek: number; // 0=Вс, 1=Пн..6=Сб
} {
  const targetDate = parseDateKey(targetDateKey);
  const dayOfWeek = targetDate.getDay();

  // Если задан ручной оверрайд недели для тестов/проверки
  if (cycleState.manualWeekOverride && cycleState.manualWeekOverride >= 1 && cycleState.manualWeekOverride <= 4) {
    return {
      cycleNumber: cycleState.currentCycle,
      weekNumber: cycleState.manualWeekOverride,
      isDeloadWeek: cycleState.manualWeekOverride === 4,
      dayOfWeek,
    };
  }

  const startDate = parseDateKey(cycleState.startDate);
  const diffMs = targetDate.getTime() - startDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  const totalWeeksElapsed = Math.floor(diffDays / 7);
  const cycleOffset = Math.floor(totalWeeksElapsed / 4);
  const cycleNumber = Math.max(1, cycleState.currentCycle + cycleOffset);
  const weekInCycle = ((totalWeeksElapsed % 4 + 4) % 4) + 1; // 1..4

  return {
    cycleNumber,
    weekNumber: weekInCycle,
    isDeloadWeek: weekInCycle === 4,
    dayOfWeek,
  };
}

// Определение автоматического типа дня с учетом 4-й недели
export function getAutoDayTypeForCycle(
  targetDateKey: string,
  cycleState: CycleState,
  history: Record<string, DayRecord> = {}
): DayType {
  const { weekNumber, isDeloadWeek, dayOfWeek } = getCycleWeekInfo(targetDateKey, cycleState);

  // Вс — всегда отдых
  if (dayOfWeek === 0) {
    return 'REST';
  }

  // Неделя 4: Делоад и тестирование
  if (isDeloadWeek || weekNumber === 4) {
    if (dayOfWeek === 1 || dayOfWeek === 2 || dayOfWeek === 3) {
      // Пн, Вт, Ср — делоад (отдых от базы)
      return 'DELOAD';
    }
    if (dayOfWeek === 4) {
      // Четверг — тест подтягиваний
      return 'TEST_PULLUPS';
    }
    if (dayOfWeek === 5) {
      // Пятница — отдых
      return 'REST';
    }
    if (dayOfWeek === 6) {
      // Суббота — тест брусьев
      return 'TEST_DIPS';
    }
  }

  // Недели 1–3: Чередование Дня А и Дня Б на основе истории
  const pastDates = Object.keys(history)
    .filter((d) => d < targetDateKey)
    .sort((a, b) => b.localeCompare(a));

  for (const date of pastDates) {
    const record = history[date];
    if (record) {
      const hasSets = record.completedSets && record.completedSets.length > 0;
      const isConfiguredDay = record.dayType && (record.dayType === 'A' || record.dayType === 'B');

      if (hasSets || isConfiguredDay) {
        if (record.dayType === 'A') return 'B';
        if (record.dayType === 'B') return 'A';
      }
    }
  }

  return 'A';
}

// Генераторы планов для специальных дней 4-й недели
export function getDeloadPlan(): DayPlanConfig {
  return {
    dayType: 'DELOAD',
    title: 'Неделя 4 · Делоад (Отдых)',
    description: 'Полный отдых от базовых нагрузок. Восстановление связок и ЦНС перед тестами в четверг и субботу.',
    exercises: [],
    schedule: [],
  };
}

export function getPullUpsTestPlan(baseMax: number = 22): DayPlanConfig {
  return {
    dayType: 'TEST_PULLUPS',
    title: 'Тест 1ПМ · Подтягивания',
    description: '1 подход на максимальное количество чистых повторений. Результат определит новые 50% норматива.',
    exercises: [
      {
        id: 'pull-ups',
        name: 'Подтягивания (Тест на максимум)',
        targetSets: 1,
        defaultReps: baseMax,
        muscle: 'Спина & Бицепс',
        code: 'PULL_TEST',
        cue: 'Идеальная техника • подбородок выше перекладины • полная фиксация внизу',
      },
    ],
    schedule: [
      {
        id: 'test_pull_slot',
        time: '12:00',
        exerciseId: 'pull-ups',
        exerciseName: 'Подтягивания (Тест на максимум)',
        reps: baseMax,
        muscle: 'Спина & Бицепс',
        code: 'PULL_TEST',
        cue: '1 подход до отказа с чистой техникой',
      },
    ],
  };
}

export function getDipsTestPlan(baseMax: number = 30): DayPlanConfig {
  return {
    dayType: 'TEST_DIPS',
    title: 'Тест 1ПМ · Брусья',
    description: '1 подход на максимальное количество чистых повторений. Результат определит новые 50% норматива.',
    exercises: [
      {
        id: 'dips',
        name: 'Брусья (Тест на максимум)',
        targetSets: 1,
        defaultReps: baseMax,
        muscle: 'Грудь & Трицепс',
        code: 'DIPS_TEST',
        cue: 'Угол 90° в локтях • четкий локаут вверху без рывков',
      },
    ],
    schedule: [
      {
        id: 'test_dips_slot',
        time: '12:00',
        exerciseId: 'dips',
        exerciseName: 'Брусья (Тест на максимум)',
        reps: baseMax,
        muscle: 'Грудь & Трицепс',
        code: 'DIPS_TEST',
        cue: '1 подход до отказа с чистой техникой',
      },
    ],
  };
}

// Пропорциональный расчет нормативов на новый цикл
export interface RecalculationSummaryItem {
  exerciseId: string;
  name: string;
  day: 'A' | 'B';
  oldReps: number;
  newReps: number;
  gainPercent: number;
}

export function recalculateProgramForNewCycle(
  currentProgram: WorkoutProgramConfig,
  oldPullMax: number,
  newPullMax: number,
  oldDipsMax: number,
  newDipsMax: number
): {
  updatedProgram: WorkoutProgramConfig;
  summary: RecalculationSummaryItem[];
  kPull: number;
  kDips: number;
  kAvg: number;
} {
  // Коэффициенты прироста
  const kPull = oldPullMax > 0 ? newPullMax / oldPullMax : 1;
  const kDips = oldDipsMax > 0 ? newDipsMax / oldDipsMax : 1;
  const kAvg = (kPull + kDips) / 2;

  // Новые рабочие повторения для подтягиваний и брусьев: ровно 50% от зафиксированного теста
  const newPullWorking = Math.max(1, Math.round(newPullMax * 0.5));
  const newDipsWorking = Math.max(1, Math.round(newDipsMax * 0.5));

  const summary: RecalculationSummaryItem[] = [];

  // Клонируем программу
  const updatedProgram: WorkoutProgramConfig = JSON.parse(JSON.stringify(currentProgram));

  // 1. Обновляем День А
  if (updatedProgram.days['A']) {
    const dayA = updatedProgram.days['A'];
    dayA.exercises = dayA.exercises.map((ex) => {
      let newReps = ex.defaultReps;
      if (ex.id === 'pull-ups') {
        newReps = newPullWorking;
      } else if (ex.id === 'dips') {
        newReps = newDipsWorking;
      } else {
        // Бицепс и тяговые масштабируются по тяговому коэффициенту
        newReps = Math.max(1, Math.round(ex.defaultReps * kPull));
      }

      summary.push({
        exerciseId: ex.id,
        name: ex.name,
        day: 'A',
        oldReps: ex.defaultReps,
        newReps,
        gainPercent: Math.round(((newReps - ex.defaultReps) / ex.defaultReps) * 100),
      });

      return {
        ...ex,
        defaultReps: newReps,
      };
    });

    // Обновляем слоты расписания Дня А
    const repsByExId: Record<string, number> = {};
    dayA.exercises.forEach((ex) => {
      repsByExId[ex.id] = ex.defaultReps;
    });

    if (dayA.schedule) {
      dayA.schedule = dayA.schedule.map((slot) => ({
        ...slot,
        reps: repsByExId[slot.exerciseId] ?? slot.reps,
      }));
    }
  }

  // 2. Обновляем День Б
  if (updatedProgram.days['B']) {
    const dayB = updatedProgram.days['B'];
    dayB.exercises = dayB.exercises.map((ex) => {
      let newReps = ex.defaultReps;
      if (ex.id === 'lateral-raises') {
        // Махи плечами масштабируются по жимовому коэффициенту
        newReps = Math.max(1, Math.round(ex.defaultReps * kDips));
      } else {
        // Ноги, наклоны, пресс — по среднему коэффициенту
        newReps = Math.max(1, Math.round(ex.defaultReps * kAvg));
      }

      summary.push({
        exerciseId: ex.id,
        name: ex.name,
        day: 'B',
        oldReps: ex.defaultReps,
        newReps,
        gainPercent: Math.round(((newReps - ex.defaultReps) / ex.defaultReps) * 100),
      });

      return {
        ...ex,
        defaultReps: newReps,
      };
    });

    // Обновляем слоты расписания Дня Б
    const repsByExId: Record<string, number> = {};
    dayB.exercises.forEach((ex) => {
      repsByExId[ex.id] = ex.defaultReps;
    });

    if (dayB.schedule) {
      dayB.schedule = dayB.schedule.map((slot) => ({
        ...slot,
        reps: repsByExId[slot.exerciseId] ?? slot.reps,
      }));
    }
  }

  return {
    updatedProgram,
    summary,
    kPull,
    kDips,
    kAvg,
  };
}
