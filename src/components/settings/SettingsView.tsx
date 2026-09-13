import React, { useState } from 'react';
import { useWorkout } from '../../context/WorkoutContext';
import { ProgramVisualEditor } from './ProgramVisualEditor';
import { ProgramJsonModal } from './ProgramJsonModal';
import { exportBackup, importBackup, resetAllData } from '../../services/storage';
import {
  Code2,
  Timer,
  Vibrate,
  Volume2,
  Download,
  Upload,
  AlertOctagon,
  RefreshCw,
  Calendar,
  Bell,
  BellRing,
  Send,
  AlertCircle,
  Trophy,
  Minus,
  Plus,
} from 'lucide-react';
import { haptic } from '../../utils/haptics';
import { InstallBlock } from '../pwa/InstallBanner';
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  sendNotification,
} from '../../utils/notifications';

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    refreshData,
    activeRecord,
    switchDayType,
    cycleState,
    updateCycleState,
    weekInfo,
    applyCycleRecalculation,
  } = useWorkout();
  const [isJsonModalOpen, setIsJsonModalOpen] = useState<boolean>(false);
  const [backupNotice, setBackupNotice] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<NotificationPermission | 'unsupported'>(() =>
    getNotificationPermission()
  );

  // Выгрузка полного бэкапа
  const handleExportBackup = () => {
    haptic.trigger('light', settings.soundFeedbackEnabled);
    const backupJson = exportBackup();
    const blob = new Blob([backupJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    a.href = url;
    a.download = `gtg-backup-${dateStr}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setBackupNotice('Резервная копия успешно выгружена!');
    setTimeout(() => setBackupNotice(null), 3000);
  };

  // Импорт бэкапа
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const success = importBackup(text);
      if (success) {
        haptic.trigger('success', settings.soundFeedbackEnabled);
        refreshData();
        setBackupNotice('База данных успешно восстановлена!');
      } else {
        haptic.trigger('light', settings.soundFeedbackEnabled);
        alert('Ошибка: не удалось восстановить данные из файла');
      }
      setTimeout(() => setBackupNotice(null), 3000);
    };
    reader.readAsText(file);
  };

  // Полный сброс
  const handleFactoryReset = () => {
    const confirmed = window.confirm(
      'ВНИМАНИЕ! Это действие сотрет всю историю тренировок и вернет программу к дефолтной. Продолжить?'
    );
    if (confirmed) {
      const secondConfirm = window.prompt('Для подтверждения напишите СБРОС:');
      if (secondConfirm === 'СБРОС') {
        resetAllData();
        refreshData();
        haptic.trigger('medium', settings.soundFeedbackEnabled);
        alert('Все данные сброшены к начальным');
      }
    }
  };

  // Управление уведомлениями
  const handleToggleNotifications = async () => {
    if (settings.notificationsEnabled) {
      updateSettings({ notificationsEnabled: false });
      haptic.trigger('light', settings.soundFeedbackEnabled);
      return;
    }

    if (!isNotificationSupported()) {
      alert('Ваш браузер не поддерживает Web Notifications.');
      return;
    }

    const currentPerm = getNotificationPermission();
    if (currentPerm === 'granted') {
      updateSettings({ notificationsEnabled: true });
      haptic.trigger('success', settings.soundFeedbackEnabled);
      setPermissionState('granted');
    } else {
      const result = await requestNotificationPermission();
      setPermissionState(result);
      if (result === 'granted') {
        updateSettings({ notificationsEnabled: true });
        haptic.trigger('success', settings.soundFeedbackEnabled);
        sendNotification('GTG Kinetic: Уведомления включены! 🔔', {
          body: `Таймер настроен на ${settings.restIntervalMinutes} мин. Мы пришлем сигнал перед следующим подходом.`,
        });
      } else {
        updateSettings({ notificationsEnabled: false });
        haptic.trigger('light', settings.soundFeedbackEnabled);
      }
    }
  };

  const handleSendTestNotification = async () => {
    haptic.trigger('light', settings.soundFeedbackEnabled);
    const sent = await sendNotification('GTG Kinetic: Тестовое уведомление 🔥', {
      body: 'Уведомления работают отлично! Напоминания о подходах будут приходить вовремя.',
    });
    if (!sent && permissionState === 'denied') {
      alert('Уведомления заблокированы браузером. Разрешите их в настройках сайта.');
    }
  };

  const timerOptions = [30, 45, 60, 75, 90];

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-5">
      {/* 1. Текущий тренировочный день */}
      <div className="p-4 rounded-2xl bg-[#131622] border border-white/[0.12] shadow-xl shadow-black/40 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#ccff00]" />
            <h3 className="text-sm font-bold text-white font-sans">
              Текущий тренировочный день
            </h3>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#ccff00]/10 border border-[#ccff00]/25 text-[#ccff00]">
            Авто-отсчет
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1.5 pt-1">
          {([
            { type: 'A', label: 'День А', desc: 'Верх и Руки' },
            { type: 'B', label: 'День Б', desc: 'Низ, Плечи, Кор' },
            { type: 'REST', label: 'Отдых', desc: 'Пауза' },
          ] as const).map((opt) => {
            const isActive = activeRecord.dayType === opt.type;
            return (
              <button
                key={opt.type}
                type="button"
                onClick={() => {
                  haptic.trigger('light', settings.soundFeedbackEnabled);
                  switchDayType(opt.type);
                }}
                className={`py-2 px-2 rounded-xl text-center transition-all ${
                  isActive
                    ? 'bg-[#ccff00] text-black font-bold shadow-md shadow-[#ccff00]/25'
                    : 'bg-[#1a1f2c] text-zinc-300 hover:bg-[#222838] border border-white/[0.08]'
                }`}
              >
                <div className="text-xs font-sans font-bold">{opt.label}</div>
                <div
                  className={`text-[9px] font-mono mt-0.5 ${
                    isActive ? 'text-black/80 font-medium' : 'text-zinc-500'
                  }`}
                >
                  {opt.desc}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. 4-недельный цикл и тестирование */}
      <div className="p-4 rounded-2xl bg-[#131622] border border-white/[0.12] shadow-xl shadow-black/40 space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-[#ccff00]" />
            <h3 className="text-sm font-bold text-white font-sans">
              4-недельный цикл и тесты
            </h3>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#ccff00]/15 border border-[#ccff00]/30 text-[#ccff00] font-bold">
            Цикл {cycleState.currentCycle} · Неделя {weekInfo.weekNumber}/4
          </span>
        </div>

        <p className="text-xs text-zinc-400 font-mono leading-relaxed">
          Недели 1-3: базовая работа 50% от рекордов. Неделя 4: Делоад (Пн-Ср) и тестирование максимума: Четверг — Подтягивания, Суббота — Брусья.
        </p>

        {/* Переключатель недели */}
        <div className="space-y-1.5 pt-1">
          <div className="text-[11px] font-mono text-zinc-300 font-bold uppercase tracking-wider flex items-center justify-between">
            <span>Неделя цикла:</span>
            {cycleState.manualWeekOverride ? (
              <span className="text-[10px] text-amber-400 font-mono lowercase">ручной выбор</span>
            ) : (
              <span className="text-[10px] text-[#ccff00] font-mono lowercase">авто-отсчет</span>
            )}
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            <button
              type="button"
              onClick={() => {
                haptic.trigger('light', settings.soundFeedbackEnabled);
                updateCycleState({ manualWeekOverride: null });
              }}
              className={`py-2 px-1 rounded-xl text-center text-xs font-mono font-bold transition-all ${
                cycleState.manualWeekOverride === null || cycleState.manualWeekOverride === undefined
                  ? 'bg-[#ccff00] text-black shadow-md shadow-[#ccff00]/25'
                  : 'bg-[#1a1f2c] text-zinc-300 hover:bg-[#222838] border border-white/[0.08]'
              }`}
            >
              Авто
            </button>
            {[1, 2, 3, 4].map((w) => {
              const isSelected = cycleState.manualWeekOverride === w || (cycleState.manualWeekOverride == null && weekInfo.weekNumber === w);
              const isDeload = w === 4;
              return (
                <button
                  key={w}
                  type="button"
                  onClick={() => {
                    haptic.trigger('light', settings.soundFeedbackEnabled);
                    updateCycleState({ manualWeekOverride: w });
                  }}
                  className={`py-2 px-1 rounded-xl text-center text-xs font-mono font-bold transition-all ${
                    isSelected
                      ? isDeload
                        ? 'bg-cyan-400 text-black shadow-md shadow-cyan-400/25'
                        : 'bg-[#ccff00] text-black shadow-md shadow-[#ccff00]/25'
                      : 'bg-[#1a1f2c] text-zinc-300 hover:bg-[#222838] border border-white/[0.08]'
                  }`}
                >
                  {w} {isDeload ? '🔥' : 'нед'}
                </button>
              );
            })}
          </div>
        </div>

        {/* Базовые максимумы для расчета нормативов */}
        <div className="pt-2 border-t border-white/[0.06] space-y-2">
          <div className="text-[11px] font-mono text-zinc-300 font-bold uppercase tracking-wider">
            Базовые максимумы (1ПМ):
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* Подтягивания */}
            <div className="p-2.5 rounded-xl bg-[#1a1f2c] border border-white/[0.08] space-y-1.5">
              <div className="text-[11px] font-sans font-bold text-white">Подтягивания</div>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    haptic.trigger('light', settings.soundFeedbackEnabled);
                    const newPull = Math.max(1, cycleState.baseMaxes.pullUps - 1);
                    updateCycleState({
                      baseMaxes: { ...cycleState.baseMaxes, pullUps: newPull },
                    });
                  }}
                  className="w-7 h-7 rounded-lg bg-[#222838] hover:bg-[#2b3347] active:scale-95 text-white flex items-center justify-center text-xs"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>

                <div className="text-center">
                  <div className="text-sm font-mono font-bold text-[#ccff00]">
                    {cycleState.baseMaxes.pullUps} повт.
                  </div>
                  <div className="text-[9px] font-mono text-zinc-400">
                    50% = {Math.round(cycleState.baseMaxes.pullUps * 0.5)} повт.
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    haptic.trigger('light', settings.soundFeedbackEnabled);
                    const newPull = cycleState.baseMaxes.pullUps + 1;
                    updateCycleState({
                      baseMaxes: { ...cycleState.baseMaxes, pullUps: newPull },
                    });
                  }}
                  className="w-7 h-7 rounded-lg bg-[#222838] hover:bg-[#2b3347] active:scale-95 text-white flex items-center justify-center text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Брусья */}
            <div className="p-2.5 rounded-xl bg-[#1a1f2c] border border-white/[0.08] space-y-1.5">
              <div className="text-[11px] font-sans font-bold text-white">Брусья</div>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    haptic.trigger('light', settings.soundFeedbackEnabled);
                    const newDips = Math.max(1, cycleState.baseMaxes.dips - 1);
                    updateCycleState({
                      baseMaxes: { ...cycleState.baseMaxes, dips: newDips },
                    });
                  }}
                  className="w-7 h-7 rounded-lg bg-[#222838] hover:bg-[#2b3347] active:scale-95 text-white flex items-center justify-center text-xs"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>

                <div className="text-center">
                  <div className="text-sm font-mono font-bold text-[#ccff00]">
                    {cycleState.baseMaxes.dips} повт.
                  </div>
                  <div className="text-[9px] font-mono text-zinc-400">
                    50% = {Math.round(cycleState.baseMaxes.dips * 0.5)} повт.
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    haptic.trigger('light', settings.soundFeedbackEnabled);
                    const newDips = cycleState.baseMaxes.dips + 1;
                    updateCycleState({
                      baseMaxes: { ...cycleState.baseMaxes, dips: newDips },
                    });
                  }}
                  className="w-7 h-7 rounded-lg bg-[#222838] hover:bg-[#2b3347] active:scale-95 text-white flex items-center justify-center text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              haptic.trigger('success', settings.soundFeedbackEnabled);
              applyCycleRecalculation(cycleState.baseMaxes.pullUps, cycleState.baseMaxes.dips);
              alert('Нормативы программы пересчитаны на основе базовых максимумов!');
            }}
            className="w-full py-2 px-3 rounded-xl bg-[#1a1f2c] hover:bg-[#222838] text-[#ccff00] text-xs font-mono font-bold border border-white/[0.08] flex items-center justify-center gap-1.5 transition-all active:scale-98"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Пересчитать программу по базам
          </button>
        </div>

        {/* История рекордов / последние тесты */}
        {cycleState.testResults && (cycleState.testResults.pullUps || cycleState.testResults.dips) && (
          <div className="pt-2 border-t border-white/[0.06] text-xs font-mono text-zinc-300">
            <span className="text-zinc-500">Результаты 4-й недели: </span>
            {cycleState.testResults.pullUps ? `Подтягивания: ${cycleState.testResults.pullUps} повт. ` : ''}
            {cycleState.testResults.dips ? `Брусья: ${cycleState.testResults.dips} повт.` : ''}
          </div>
        )}
      </div>

      {/* 3. Настройка программы тренировок */}
      <div className="p-4 rounded-2xl bg-[#131622] border border-white/[0.12] shadow-xl shadow-black/40">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-white font-sans">
            План упражнений
          </h3>
          <button
            type="button"
            onClick={() => {
              haptic.trigger('light', settings.soundFeedbackEnabled);
              setIsJsonModalOpen(true);
            }}
            className="px-2.5 py-1 rounded-lg bg-[#1a1f2c] hover:bg-[#222838] text-[#ccff00] text-xs font-mono flex items-center gap-1.5 border border-white/[0.08] transition-all"
          >
            <Code2 className="w-3.5 h-3.5" />
            JSON-код
          </button>
        </div>

        <ProgramVisualEditor />
      </div>

      {/* 3. Настройка таймера отдыха */}
      <div className="p-4 rounded-2xl bg-[#131622] border border-white/[0.12] shadow-xl shadow-black/40">
        <div className="flex items-center gap-2 mb-2">
          <Timer className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-white font-sans">
            Интервал готовности мышц
          </h3>
        </div>
        <p className="text-xs text-zinc-400 font-mono mb-3">
          Время отдыха между подходами для перехода индикатора в статус готовности (100% READY).
        </p>

        <div className="grid grid-cols-5 gap-1.5">
          {timerOptions.map((mins) => (
            <button
              key={mins}
              type="button"
              onClick={() => {
                haptic.trigger('light', settings.soundFeedbackEnabled);
                updateSettings({ restIntervalMinutes: mins });
              }}
              className={`py-2 rounded-xl text-xs font-mono font-bold transition-all ${
                settings.restIntervalMinutes === mins
                  ? 'bg-[#ccff00] text-black shadow-lg shadow-[#ccff00]/25'
                  : 'bg-[#1a1f2c] text-zinc-300 hover:bg-[#222838] border border-white/[0.08]'
              }`}
            >
              {mins} м
            </button>
          ))}
        </div>
      </div>

      {/* 4. Уведомления о готовности к подходу */}
      <div className="p-4 rounded-2xl bg-[#131622] border border-white/[0.12] shadow-xl shadow-black/40 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#ccff00]" />
            <h3 className="text-sm font-bold text-white font-sans">
              Уведомления о подходе
            </h3>
          </div>
          <span
            className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full border font-bold ${
              permissionState === 'granted'
                ? 'bg-[#ccff00]/15 text-[#ccff00] border-[#ccff00]/30'
                : permissionState === 'denied'
                ? 'bg-red-500/15 text-red-400 border-red-500/30'
                : 'bg-[#1a1f2c] text-zinc-400 border border-white/[0.08]'
            }`}
          >
            {permissionState === 'granted'
              ? 'Разрешено'
              : permissionState === 'denied'
              ? 'Заблокировано'
              : 'Требуется разрешение'}
          </span>
        </div>

        <p className="text-xs text-zinc-400 font-mono leading-relaxed">
          Отправлять пуш-уведомление по завершении таймера ({settings.restIntervalMinutes} мин. отдыха) до следующего упражнения.
        </p>

        {/* Слайдер-переключатель уведомлений */}
        <div className="flex items-center justify-between py-1 border-t border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <BellRing className="w-4 h-4 text-zinc-400" />
            <div>
              <div className="text-xs font-semibold text-zinc-200 font-sans">
                Включить уведомления
              </div>
              <div className="text-[10px] text-zinc-400 font-mono">
                {settings.notificationsEnabled && permissionState === 'granted'
                  ? 'Уведомления активны'
                  : 'Уведомления отключены'}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleToggleNotifications}
            className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
              settings.notificationsEnabled && permissionState === 'granted'
                ? 'bg-[#ccff00]'
                : 'bg-zinc-800'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full ${
                settings.notificationsEnabled && permissionState === 'granted'
                  ? 'bg-black'
                  : 'bg-white'
              } transition-transform ${
                settings.notificationsEnabled && permissionState === 'granted'
                  ? 'translate-x-5'
                  : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Тестовое уведомление */}
        {settings.notificationsEnabled && permissionState === 'granted' && (
          <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between">
            <span className="text-[11px] font-mono text-zinc-400">Проверить работу:</span>
            <button
              type="button"
              onClick={handleSendTestNotification}
              className="px-3 py-1.5 rounded-lg bg-[#1a1f2c] hover:bg-[#222838] text-[#ccff00] text-xs font-mono font-medium border border-white/[0.08] active:scale-95 transition-all flex items-center gap-1.5"
            >
              <Send className="w-3 h-3" />
              Отправить тест
            </button>
          </div>
        )}

        {permissionState === 'denied' && (
          <div className="p-2.5 rounded-xl bg-red-950/30 border border-red-500/20 text-red-300 text-xs font-mono flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>
              Уведомления заблокированы в браузере. Разрешите их в настройках сайта для получения сигналов готовности к подходу.
            </span>
          </div>
        )}
      </div>

      {/* 5. Тактильный и звуковой отклик */}
      <div className="p-4 rounded-2xl bg-[#131622] border border-white/[0.12] shadow-xl shadow-black/40 space-y-3">
        <h3 className="text-sm font-bold text-white font-sans mb-1">
          Тактильный отклик и звук
        </h3>

        {/* Вибрация */}
        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-2.5">
            <Vibrate className="w-4 h-4 text-zinc-400" />
            <div>
              <div className="text-xs font-semibold text-zinc-200 font-sans">
                Вибрация (Haptic)
              </div>
              <div className="text-[10px] text-zinc-400 font-mono">
                Виброотклик при кликах (на Android)
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              const newVal = !settings.hapticFeedbackEnabled;
              updateSettings({ hapticFeedbackEnabled: newVal });
              haptic.trigger('light', settings.soundFeedbackEnabled);
            }}
            className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
              settings.hapticFeedbackEnabled ? 'bg-[#ccff00]' : 'bg-zinc-800'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full ${
                settings.hapticFeedbackEnabled ? 'bg-black' : 'bg-white'
              } transition-transform ${
                settings.hapticFeedbackEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Звуковой щелчок */}
        <div className="flex items-center justify-between py-1 border-t border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <Volume2 className="w-4 h-4 text-zinc-400" />
            <div>
              <div className="text-xs font-semibold text-zinc-200 font-sans">
                Аудио-щелчок (Web Audio)
              </div>
              <div className="text-[10px] text-zinc-400 font-mono">
                Синтезированный микроклик (для iOS Safari)
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              const newVal = !settings.soundFeedbackEnabled;
              updateSettings({ soundFeedbackEnabled: newVal });
              haptic.trigger('light', newVal);
            }}
            className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
              settings.soundFeedbackEnabled ? 'bg-[#ccff00]' : 'bg-zinc-800'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full ${
                settings.soundFeedbackEnabled ? 'bg-black' : 'bg-white'
              } transition-transform ${
                settings.soundFeedbackEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Установка как приложения (PWA) */}
      <InstallBlock />

      {/* 6. Бэкап и сброс */}
      <div className="p-4 rounded-2xl bg-[#131622] border border-white/[0.12] shadow-xl shadow-black/40 space-y-3">
        <h3 className="text-sm font-bold text-white font-sans mb-1">
          Резервное копирование и данные
        </h3>

        {backupNotice && (
          <div className="p-2.5 rounded-xl bg-[#ccff00]/15 border border-[#ccff00]/30 text-[#ccff00] text-xs font-mono flex items-center gap-2">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>{backupNotice}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleExportBackup}
            className="py-2.5 px-3 rounded-xl bg-[#1a1f2c] hover:bg-[#222838] text-white text-xs font-mono flex items-center justify-center gap-1.5 border border-white/[0.08] transition-all active:scale-95"
          >
            <Download className="w-4 h-4 text-[#ccff00]" />
            Скачать бэкап
          </button>

          <label className="py-2.5 px-3 rounded-xl bg-[#1a1f2c] hover:bg-[#222838] text-white text-xs font-mono flex items-center justify-center gap-1.5 border border-white/[0.08] transition-all cursor-pointer active:scale-95">
            <Upload className="w-4 h-4 text-cyan-400" />
            Восстановить
            <input
              type="file"
              accept=".json,application/json"
              onChange={handleImportBackup}
              className="hidden"
            />
          </label>
        </div>

        {/* Опасная зона */}
        <div className="pt-2 border-t border-white/[0.06]">
          <button
            type="button"
            onClick={handleFactoryReset}
            className="w-full py-2.5 px-3 rounded-xl bg-red-950/25 hover:bg-red-900/40 text-red-400 border border-red-500/25 text-xs font-mono flex items-center justify-center gap-1.5 transition-all active:scale-98"
          >
            <AlertOctagon className="w-4 h-4" />
            Сбросить все данные
          </button>
        </div>
      </div>

      {/* Модальное окно прямого редактирования JSON */}
      <ProgramJsonModal
        isOpen={isJsonModalOpen}
        onClose={() => setIsJsonModalOpen(false)}
      />
    </div>
  );
};
