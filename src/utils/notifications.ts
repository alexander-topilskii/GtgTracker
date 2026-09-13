// Web Notifications and Permission Manager for GtG Tracker

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!isNotificationSupported()) return 'unsupported';
  
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch {
    // Fallback for older WebKit callback API
    return new Promise((resolve) => {
      Notification.requestPermission((perm) => resolve(perm));
    });
  }
}

export interface ExtendedNotificationOptions extends NotificationOptions {
  renotify?: boolean;
  vibrate?: number[];
}

export async function sendNotification(
  title: string,
  options?: ExtendedNotificationOptions
): Promise<boolean> {
  if (!isNotificationSupported()) return false;
  if (Notification.permission !== 'granted') return false;

  const defaultOptions: ExtendedNotificationOptions = {
    icon: './icon.svg',
    badge: './favicon.svg',
    tag: 'gtg-timer-reminder',
    renotify: true,
    ...options,
  };

  // 1. Попытка отправки через Service Worker (наиболее надежно в PWA на Android/iOS/Desktop)
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        await reg.showNotification(title, defaultOptions as NotificationOptions);
        return true;
      }
    } catch (err) {
      console.warn('ServiceWorker.showNotification failed:', err);
    }
  }

  // 2. Фоллбэк на стандартный конструктор Notification
  try {
    new Notification(title, defaultOptions);
    return true;
  } catch (err) {
    console.warn('Notification constructor failed:', err);
    return false;
  }
}

export async function sendRestTimerCompleteNotification(
  exerciseName?: string,
  reps?: number,
  restMinutes?: number
): Promise<boolean> {
  const title = 'GTG Kinetic: Пора на подход! 🔥';
  const body = exerciseName
    ? `Отдых ${restMinutes ? `${restMinutes} мин. ` : ''}завершен. Время выполнить: ${exerciseName} (${reps ? `×${reps}` : 'подход'})`
    : 'Интервал отдыха завершен. Ваши мышцы и связки готовы к следующему подходу!';

  return sendNotification(title, {
    body,
    vibrate: [200, 100, 200, 100, 300],
  });
}
