import { DayType } from '../types/workout';

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
