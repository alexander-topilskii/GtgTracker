import React, { useState, useMemo } from 'react';
import { useWorkout } from '../../context/WorkoutContext';
import { parseDateKey } from '../../utils/dateUtils';
import { BarChart3 } from 'lucide-react';

export const VolumeTracker: React.FC = () => {
  const { history } = useWorkout();
  const [periodDays, setPeriodDays] = useState<7 | 30>(7);

  // Расчет статистики за выбранный период
  const stats = useMemo(() => {
    const now = new Date();
    const cutoffTime = now.getTime() - periodDays * 24 * 60 * 60 * 1000;

    let totalRepsAll = 0;
    let totalSetsAll = 0;
    const exerciseMap: Record<string, { name: string; reps: number; sets: number }> = {};

    Object.entries(history).forEach(([dateKey, record]) => {
      const date = parseDateKey(dateKey);
      if (date.getTime() >= cutoffTime && record.completedSets) {
        record.completedSets.forEach((set) => {
          totalRepsAll += set.reps;
          totalSetsAll += 1;

          // Группируем по иммутабельному снапшоту названия!
          const key = set.exerciseNameSnapshot || set.exerciseId;
          if (!exerciseMap[key]) {
            exerciseMap[key] = {
              name: set.exerciseNameSnapshot || key,
              reps: 0,
              sets: 0,
            };
          }
          exerciseMap[key].reps += set.reps;
          exerciseMap[key].sets += 1;
        });
      }
    });

    const exercisesList = Object.values(exerciseMap).sort((a, b) => b.reps - a.reps);
    const maxReps = exercisesList.length > 0 ? exercisesList[0].reps : 1;

    return {
      totalRepsAll,
      totalSetsAll,
      exercisesList,
      maxReps,
    };
  }, [history, periodDays]);

  return (
    <div className="p-4 rounded-2xl bg-[#12151f]/80 backdrop-blur-md border border-white/[0.08]">
      {/* Заголовок и переключатель периода */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <BarChart3 className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white font-sans">
            Объем нагрузок (Volume)
          </h3>
        </div>

        <div className="flex items-center p-0.5 rounded-lg bg-zinc-900 border border-white/5 text-[11px] font-mono">
          <button
            type="button"
            onClick={() => setPeriodDays(7)}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              periodDays === 7
                ? 'bg-zinc-800 text-white font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            7 дней
          </button>
          <button
            type="button"
            onClick={() => setPeriodDays(30)}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              periodDays === 30
                ? 'bg-zinc-800 text-white font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            30 дней
          </button>
        </div>
      </div>

      {/* Общие счетчики */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="p-3 rounded-xl bg-zinc-900/60 border border-white/5">
          <div className="text-[10px] font-mono text-zinc-400 uppercase">Всего повторений</div>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-0.5">
            {stats.totalRepsAll}
          </div>
        </div>
        <div className="p-3 rounded-xl bg-zinc-900/60 border border-white/5">
          <div className="text-[10px] font-mono text-zinc-400 uppercase">Всего подходов</div>
          <div className="text-xl font-bold font-mono text-cyan-400 mt-0.5">
            {stats.totalSetsAll}
          </div>
        </div>
      </div>

      {/* Список упражнений с прогресс-барами */}
      {stats.exercisesList.length === 0 ? (
        <div className="p-4 text-center text-xs font-mono text-zinc-400">
          За выбранный период тренировок не было
        </div>
      ) : (
        <div className="space-y-3">
          {stats.exercisesList.map((item) => {
            const barPercent = Math.min(100, Math.round((item.reps / stats.maxReps) * 100));

            return (
              <div key={item.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-200 truncate pr-2">{item.name}</span>
                  <span className="text-zinc-400 shrink-0">
                    <strong className="text-white">{item.reps}</strong> повт. ({item.sets} сетов)
                  </span>
                </div>
                <div className="h-2 rounded-full bg-zinc-800/80 overflow-hidden border border-white/5">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full transition-all duration-500"
                    style={{ width: `${barPercent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
