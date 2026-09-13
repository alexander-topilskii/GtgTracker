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
} from 'lucide-react';
import { haptic } from '../../utils/haptics';
import { InstallBlock } from '../pwa/InstallBanner';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings, refreshData, activeRecord, switchDayType } = useWorkout();
  const [isJsonModalOpen, setIsJsonModalOpen] = useState<boolean>(false);
  const [backupNotice, setBackupNotice] = useState<string | null>(null);

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

  const timerOptions = [30, 45, 60, 75, 90];

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-5">
      {/* 1. Текущий тренировочный день */}
      <div className="p-4 rounded-2xl bg-[#12151f]/80 backdrop-blur-md border border-white/[0.08] space-y-2.5">
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
        <p className="text-xs text-zinc-400 font-mono leading-relaxed">
          Приложение автоматически чередует дни (вчера А → сегодня Б), а каждое воскресенье переходит в режим отдыха. При необходимости выберите день вручную:
        </p>

        <div className="grid grid-cols-3 gap-1.5 pt-1">
          {([
            { type: 'A', label: 'День А', desc: 'Верх (База)' },
            { type: 'B', label: 'День Б', desc: 'Руки & Ноги' },
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
                    : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border border-white/5'
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

      {/* 2. Настройка программы тренировок */}
      <div className="p-4 rounded-2xl bg-[#12151f]/80 backdrop-blur-md border border-white/[0.08]">
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
            className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[#ccff00] text-xs font-mono flex items-center gap-1.5 border border-white/5 transition-all"
          >
            <Code2 className="w-3.5 h-3.5" />
            JSON-код
          </button>
        </div>

        <ProgramVisualEditor />
      </div>

      {/* 2. Настройка таймера отдыха */}
      <div className="p-4 rounded-2xl bg-[#12151f]/80 backdrop-blur-md border border-white/[0.08]">
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
                  : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border border-white/5'
              }`}
            >
              {mins} м
            </button>
          ))}
        </div>
      </div>

      {/* 3. Тактильный и звуковой отклик */}
      <div className="p-4 rounded-2xl bg-[#12151f]/80 backdrop-blur-md border border-white/[0.08] space-y-3">
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

      {/* 4. Установка как приложения (PWA) */}
      <InstallBlock />

      {/* 5. Бэкап и сброс */}
      <div className="p-4 rounded-2xl bg-[#12151f]/80 backdrop-blur-md border border-white/[0.08] space-y-3">
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
            className="py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-mono flex items-center justify-center gap-1.5 border border-white/5 transition-all active:scale-95"
          >
            <Download className="w-4 h-4 text-[#ccff00]" />
            Скачать бэкап
          </button>

          <label className="py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-mono flex items-center justify-center gap-1.5 border border-white/5 transition-all cursor-pointer active:scale-95">
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
            className="w-full py-2.5 px-3 rounded-xl bg-red-950/20 hover:bg-red-900/40 text-red-400 border border-red-500/20 text-xs font-mono flex items-center justify-center gap-1.5 transition-all active:scale-98"
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
