import { useState, useEffect, useMemo, useCallback } from 'react';

export type ReadinessState = 'IDLE' | 'RECOVERY' | 'APPROACHING' | 'READY';

export interface RestTimerData {
  elapsedSeconds: number;
  remainingSeconds: number;
  formattedTime: string;
  formattedRemaining: string;
  readinessState: ReadinessState;
  readinessPercent: number; // 0 to 100
  isExpired: boolean;
  targetTimestamp: number | null;
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

  const formatRemaining = useCallback((totalSeconds: number): string => {
    if (totalSeconds <= 0) return '00:00';
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}ч ${String(minutes).padStart(2, '0')}м`;
    }
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }, []);

  return useMemo<RestTimerData>(() => {
    const targetSeconds = targetRestMinutes * 60;

    if (lastTimestamp === null) {
      return {
        elapsedSeconds: 0,
        remainingSeconds: 0,
        formattedTime: '0 мин.',
        formattedRemaining: '00:00',
        readinessState: 'READY',
        readinessPercent: 100,
        isExpired: true,
        targetTimestamp: null,
        statusText: 'Готов к первому подходу',
      };
    }

    const elapsedSeconds = Math.max(0, Math.floor((now - lastTimestamp) / 1000));
    const elapsedMinutes = elapsedSeconds / 60;
    const remainingSeconds = Math.max(0, targetSeconds - elapsedSeconds);
    const isExpired = elapsedSeconds >= targetSeconds;
    const targetTimestamp = lastTimestamp + targetSeconds * 1000;

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
      remainingSeconds,
      formattedTime: formatTime(elapsedSeconds),
      formattedRemaining: formatRemaining(remainingSeconds),
      readinessState: state,
      readinessPercent: percent,
      isExpired,
      targetTimestamp,
      statusText,
    };
  }, [now, lastTimestamp, targetRestMinutes, formatTime, formatRemaining]);
}
