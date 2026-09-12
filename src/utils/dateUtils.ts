import { DayType, DayRecord } from '../types/workout';

// Форматирование даты в YYYY-MM-DD в локальном часовом поясе
export function formatToDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Парсинг YYYY-MM-DD в Date
export function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
}

// Человекопонятная строка даты («Пт, 12 сент.»)
export function formatFriendlyDate(dateKey: string): string {
  const date = parseDateKey(dateKey);
  return new Intl.DateTimeFormat('ru-RU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(date);
}

// Определение дефолтного дня тренировки (Воскресенье = Отдых, четные дни = А, нечетные = Б)
export function getDefaultDayTypeForDate(date: Date = new Date()): DayType {
  const dayOfWeek = date.getDay(); // 0 = Вс
  if (dayOfWeek === 0) {
    return 'REST';
  }
  // Чередование на основе дня года
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((date.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
  return dayOfYear % 2 === 0 ? 'A' : 'B';
}

/**
 * Автоматический расчет типа дня на основе истории:
 * - Если воскресенье -> всегда отдых ('REST')
 * - Если в предыдущий зафиксированный день был 'A' -> сегодня 'B'
 * - Если в предыдущий зафиксированный день был 'B' -> сегодня 'A'
 * - Если истории нет -> 'A'
 */
export function getAutoDayType(
  targetDateKey: string,
  history: Record<string, DayRecord> = {}
): DayType {
  const targetDate = parseDateKey(targetDateKey);

  // Каждое воскресенье — день отдыха
  if (targetDate.getDay() === 0) {
    return 'REST';
  }

  // Находим все предыдущие дни в истории до целевой даты
  const pastDates = Object.keys(history)
    .filter((d) => d < targetDateKey)
    .sort((a, b) => b.localeCompare(a)); // Свежие первыми

  // Ищем последний тренировочный день (с подходами или явно заданный не-REST)
  for (const date of pastDates) {
    const record = history[date];
    if (record) {
      const hasSets = record.completedSets && record.completedSets.length > 0;
      const isConfiguredDay = record.dayType && record.dayType !== 'REST';

      if (hasSets || isConfiguredDay) {
        if (record.dayType === 'A') return 'B';
        if (record.dayType === 'B') return 'A';
      }
    }
  }

  // Если истории нет, начинаем с дня А
  return 'A';
}
