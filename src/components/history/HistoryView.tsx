import React, { useState } from 'react';
import { useWorkout } from '../../context/WorkoutContext';
import { CalendarHeatmap } from './CalendarHeatmap';
import { VolumeTracker } from './VolumeTracker';
import { formatToDateKey, formatFriendlyDate } from '../../utils/dateUtils';
import { Clock, Calendar, CheckCircle2, CircleDashed } from 'lucide-react';

export const HistoryView: React.FC = () => {
  const { history, todayDate } = useWorkout();
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    // Выбираем сегодняшний день или последнюю дату из истории
    return formatToDateKey(new Date());
  });

  const selectedRecord = history[selectedDate];
  const isToday = selectedDate === todayDate;

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4">
      {/* 1. Интерактивный календарь с точками статусов */}
      <CalendarHeatmap
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
      />

      {/* 2. Детализация выбранного дня */}
      <div className="p-4 rounded-2xl bg-[#12151f]/80 backdrop-blur-md border border-white/[0.08]">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <h4 className="text-sm font-bold text-white font-sans">
              {formatFriendlyDate(selectedDate)}
              {isToday && (
                <span className="ml-2 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Сегодня
                </span>
              )}
            </h4>
          </div>

          <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-white/5">
            {selectedRecord?.dayType
              ? selectedRecord.dayType === 'REST'
                ? 'День отдыха'
                : `День ${selectedRecord.dayType}`
              : 'Без записи'}
          </span>
        </div>

        {/* Список выполненных подходов за выбранный день */}
        {!selectedRecord || selectedRecord.completedSets.length === 0 ? (
          <div className="py-6 text-center text-xs font-mono text-zinc-400 flex flex-col items-center gap-1.5">
            <CircleDashed className="w-6 h-6 text-zinc-500 stroke-[1.5]" />
            <span>В этот день тренировок не зафиксировано</span>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-[11px] font-mono text-zinc-400 flex items-center justify-between pb-1">
              <span>Выполнено: {selectedRecord.completedSets.length} подходов</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                {selectedRecord.completedSets.reduce((a, s) => a + s.reps, 0)} повторений
              </span>
            </div>

            {selectedRecord.completedSets.map((set, idx) => {
              const timeStr = new Intl.DateTimeFormat('ru-RU', {
                hour: '2-digit',
                minute: '2-digit',
              }).format(new Date(set.timestamp));

              return (
                <div
                  key={set.id}
                  className="p-2.5 rounded-xl bg-zinc-900/70 border border-white/5 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-mono font-bold flex items-center justify-center border border-emerald-500/20">
                      {idx + 1}
                    </span>
                    <div>
                      {/* ОТОБРАЖЕНИЕ ИММУТАБЕЛЬНОГО СНАПШОТА НАЗВАНИЯ! */}
                      <div className="text-xs font-semibold text-white font-sans">
                        {set.exerciseNameSnapshot}
                      </div>
                      <div className="text-[10px] font-mono text-zinc-400 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {timeStr}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold font-mono text-emerald-400">
                      {set.reps} повт.
                    </span>
                    {set.weight ? (
                      <div className="text-[10px] font-mono text-zinc-400">
                        {set.weight} кг
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Трекер суммарного объема нагрузки */}
      <VolumeTracker />
    </div>
  );
};
