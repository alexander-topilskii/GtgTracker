import { useState, useEffect, useMemo, useCallback } from 'react';

export type ReadinessState = 'IDLE' | 'RECOVERY' | 'APPROACHING' | 'READY';

export interface RestTimerData {
  elapsedSeconds: number;
  formattedTime: string;
  readinessState: ReadinessState;
  readinessPercent: number; // 0 to 100
  statusText: string;
}

export function useRestTimer(
  lastTimestamp: number | null,
  targetRestMinutes: number = 60
): RestTimerData {
  const [now, setNow] = useState<number>(Date.now());

  // Пересчет времени каждую секунду
  useEffect(() => {
    const updateTime = () => setNow(Date.now());
    const interval = setInterval(updateTime, 1000);

    // Мгновенный пересчет при возвращении во вкладку
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        setNow(Date.now());
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const formatTime = useCallback((totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    if (hours > 0) {
      return `${hours} ч. ${minutes} мин.`;
    }
    return `${minutes} мин.`;
  }, []);

  return useMemo<RestTimerData>(() => {
    if (lastTimestamp === null) {
      return {
        elapsedSeconds: 0,
        formattedTime: '0 мин.',
        readinessState: 'IDLE',
        readinessPercent: 100,
        statusText: 'Готов к первому подходу',
      };
    }

    const elapsedSeconds = Math.max(0, Math.floor((now - lastTimestamp) / 1000));
    const elapsedMinutes = elapsedSeconds / 60;
    const targetSeconds = targetRestMinutes * 60;

    const percent = Math.min(100, Math.round((elapsedSeconds / targetSeconds) * 100));

    let state: ReadinessState;
    let statusText: string;

    if (elapsedMinutes < 45) {
      state = 'RECOVERY';
      statusText = 'Восстановление связок и ЦНС';
    } else if (elapsedMinutes < targetRestMinutes) {
      state = 'APPROACHING';
      statusText = 'Приближение к готовности';
    } else {
      state = 'READY';
      statusText = 'Мышцы готовы к подходу! 🔥';
    }

    return {
      elapsedSeconds,
      formattedTime: formatTime(elapsedSeconds),
      readinessState: state,
      readinessPercent: percent,
      statusText,
    };
  }, [now, lastTimestamp, targetRestMinutes, formatTime]);
}
