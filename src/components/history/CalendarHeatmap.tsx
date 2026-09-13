import React, { useState } from 'react';
import { useWorkout } from '../../context/WorkoutContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatToDateKey } from '../../utils/dateUtils';
import { getCycleWeekInfo } from '../../utils/cycleManager';
import { haptic } from '../../utils/haptics';

interface CalendarHeatmapProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

export const CalendarHeatmap: React.FC<CalendarHeatmapProps> = ({
  selectedDate,
  onSelectDate,
}) => {
  const { history, program, settings, cycleState } = useWorkout();

  // Текущий отображаемый месяц и год
  const [currentMonth, setCurrentMonth] = useState<Date>(() => new Date());

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const handlePrevMonth = () => {
    haptic.trigger('light', settings.soundFeedbackEnabled);
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    haptic.trigger('light', settings.soundFeedbackEnabled);
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const monthTitle = new Intl.DateTimeFormat('ru-RU', {
    month: 'long',
    year: 'numeric',
  }).format(currentMonth);

  // Дни в месяце
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7; // Понедельник = 0

  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const weekDayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  const todayKey = formatToDateKey(new Date());

  return (
    <div className="p-4 rounded-2xl bg-[#131622] border border-white/[0.12] shadow-xl shadow-black/40">
      {/* Шапка календаря */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-white font-sans capitalize">
          {monthTitle}
        </h3>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="w-7 h-7 rounded-lg bg-[#1a1f2c] hover:bg-[#222838] border border-white/[0.08] flex items-center justify-center text-zinc-300 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="w-7 h-7 rounded-lg bg-[#1a1f2c] hover:bg-[#222838] border border-white/[0.08] flex items-center justify-center text-zinc-300 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Дни недели */}
      <div className="grid grid-cols-7 gap-1 text-center mb-1">
        {weekDayNames.map((d) => (
          <div key={d} className="text-[10px] font-mono text-zinc-400 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Сетка дней */}
      <div className="grid grid-cols-7 gap-1">
        {/* Пустые ячейки до первого дня */}
        {Array.from({ length: firstDayIndex }).map((_, i) => (
          <div key={`empty-${i}`} className="h-9" />
        ))}

        {daysArray.map((dayNum) => {
          const dateObj = new Date(year, month, dayNum);
          const dateKey = formatToDateKey(dateObj);
          const record = history[dateKey];
          const isSelected = selectedDate === dateKey;
          const isToday = todayKey === dateKey;
          const weekInfo = getCycleWeekInfo(dateKey, cycleState);
          const isWeek4TestDay = weekInfo.isDeloadWeek && (weekInfo.dayOfWeek === 4 || weekInfo.dayOfWeek === 6);

          // Статус дня: неон/желтый (выполнен план), янтарный (частично), серый (отдых/нет)
          let statusDot = null;

          if (record && record.completedSets && record.completedSets.length > 0) {
            const plan = program.days[record.dayType] || program.days['A'];
            const totalRequired = plan?.exercises?.reduce((acc, ex) => acc + ex.targetSets, 0) || 1;
            const totalDone = record.completedSets.length;

            if (totalDone >= totalRequired) {
              statusDot = <span className="w-1.5 h-1.5 rounded-full bg-[#ccff00] glow-neon" />;
            } else {
              statusDot = <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />;
            }
          } else if (record && record.dayType === 'REST') {
            statusDot = <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />;
          } else if (isWeek4TestDay) {
            statusDot = <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_6px_rgba(34,211,238,0.8)]" />;
          }

          return (
            <button
              key={dateKey}
              type="button"
              onClick={() => {
                haptic.trigger('light', settings.soundFeedbackEnabled);
                onSelectDate(dateKey);
              }}
              className={`h-9 rounded-xl flex flex-col items-center justify-center relative transition-all active:scale-95 ${
                isSelected
                  ? 'bg-[#22283a] text-white font-bold border border-white/20 shadow-md'
                  : isToday
                  ? 'bg-[#ccff00]/10 text-[#ccff00] font-semibold border border-[#ccff00]/40'
                  : 'text-zinc-300 hover:bg-[#1a1f2c]/50'
              }`}
            >
              <span className="text-xs font-mono leading-none">{dayNum}</span>
              <div className="h-2 flex items-center justify-center mt-0.5">
                {statusDot}
              </div>
            </button>
          );
        })}
      </div>

      {/* Легенда */}
      <div className="flex flex-wrap items-center justify-center gap-3 mt-3 pt-2.5 border-t border-white/[0.06] text-[10px] font-mono text-zinc-400">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#ccff00] glow-neon" />
          <span>План закрыт</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          <span>Частично</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          <span>Тест (Н4)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
          <span>Отдых</span>
        </div>
      </div>
    </div>
  );
};
