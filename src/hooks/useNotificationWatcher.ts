import { useEffect, useCallback, useRef } from 'react';
import { useWorkout } from '../context/WorkoutContext';
import { sendRestTimerCompleteNotification, getNotificationPermission } from '../utils/notifications';
import { haptic } from '../utils/haptics';

const STORAGE_LAST_NOTIFIED_KEY = 'gtg_last_notified_set_timestamp';

export function useNotificationWatcher() {
  const {
    lastSetTimestamp,
    settings,
    activeDayPlan,
    activeRecord,
  } = useWorkout();

  const isTriggeringRef = useRef<boolean>(false);

  // Определение следующего упражнения по расписанию дня
  const getNextExerciseInfo = useCallback(() => {
    if (!activeDayPlan?.schedule || activeDayPlan.schedule.length === 0) {
      return null;
    }

    const exerciseSlotIndices: Record<string, number> = {};
    const counts: Record<string, number> = {};
    for (const s of activeRecord.completedSets) {
      counts[s.exerciseId] = (counts[s.exerciseId] || 0) + 1;
    }

    for (const slot of activeDayPlan.schedule) {
      const curr = exerciseSlotIndices[slot.exerciseId] || 0;
      exerciseSlotIndices[slot.exerciseId] = curr + 1;
      if (curr >= (counts[slot.exerciseId] || 0)) {
        return slot;
      }
    }
    return null;
  }, [activeDayPlan, activeRecord.completedSets]);

  const triggerNotificationIfDue = useCallback(async () => {
    if (!lastSetTimestamp) return;
    if (!settings.notificationsEnabled) return;
    if (getNotificationPermission() !== 'granted') return;
    if (isTriggeringRef.current) return;

    const targetTimestamp = lastSetTimestamp + settings.restIntervalMinutes * 60 * 1000;
    const now = Date.now();

    // Таймер еще не истек
    if (now < targetTimestamp) return;

    // Проверяем дедупликацию: отправляли ли уже для этого подхода
    try {
      const lastNotified = localStorage.getItem(STORAGE_LAST_NOTIFIED_KEY);
      if (lastNotified === String(lastSetTimestamp)) {
        return;
      }
    } catch {
      // Игнорируем ошибки доступа к localStorage
    }

    // Все проверки пройдены — отправляем уведомление!
    isTriggeringRef.current = true;
    try {
      localStorage.setItem(STORAGE_LAST_NOTIFIED_KEY, String(lastSetTimestamp));
    } catch {
      // Игнорируем
    }

    const nextSlot = getNextExerciseInfo();

    await sendRestTimerCompleteNotification(
      nextSlot?.exerciseName,
      nextSlot?.reps,
      settings.restIntervalMinutes
    );

    if (settings.soundFeedbackEnabled) {
      haptic.playClickSound('complete');
    }

    setTimeout(() => {
      isTriggeringRef.current = false;
    }, 1000);
  }, [lastSetTimestamp, settings.notificationsEnabled, settings.restIntervalMinutes, settings.soundFeedbackEnabled, getNextExerciseInfo]);

  useEffect(() => {
    if (!lastSetTimestamp || !settings.notificationsEnabled) {
      return;
    }

    const targetTimestamp = lastSetTimestamp + settings.restIntervalMinutes * 60 * 1000;
    const remainingMs = targetTimestamp - Date.now();

    let timerId: ReturnType<typeof setTimeout> | null = null;

    if (remainingMs <= 0) {
      triggerNotificationIfDue();
    } else {
      timerId = setTimeout(() => {
        triggerNotificationIfDue();
      }, remainingMs);
    }

    // Проверка при возвращении во вкладку после блокировки экрана
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        triggerNotificationIfDue();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (timerId) clearTimeout(timerId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [lastSetTimestamp, settings.notificationsEnabled, settings.restIntervalMinutes, triggerNotificationIfDue]);
}
