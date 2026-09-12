import React, { useState, useEffect } from 'react';
import { BottomSheet } from '../ui/BottomSheet';
import { useWorkout } from '../../context/WorkoutContext';
import { WorkoutProgramConfig } from '../../types/workout';
import { Download, Upload, RotateCcw, AlertTriangle, Check } from 'lucide-react';
import { haptic } from '../../utils/haptics';

interface ProgramJsonModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProgramJsonModal: React.FC<ProgramJsonModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { program, updateProgram, resetProgramToDefault, settings } = useWorkout();
  const [jsonText, setJsonText] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setJsonText(JSON.stringify(program, null, 2));
      setError(null);
      setSuccessMessage(null);
    }
  }, [isOpen, program]);

  // Валидация и сохранение
  const handleSave = () => {
    try {
      const parsed = JSON.parse(jsonText) as Partial<WorkoutProgramConfig>;

      if (!parsed.days || typeof parsed.days !== 'object') {
        throw new Error('Отсутствует объект "days" с конфигурацией дней');
      }

      // Проверка обязательных полей
      for (const [dayKey, dayPlan] of Object.entries(parsed.days)) {
        if (!dayPlan.exercises || !Array.isArray(dayPlan.exercises)) {
          throw new Error(`В дне "${dayKey}" массив "exercises" не найден`);
        }
      }

      haptic.trigger('medium', settings.soundFeedbackEnabled);
      updateProgram(parsed as WorkoutProgramConfig);
      setError(null);
      setSuccessMessage('Программа успешно обновлена!');
      setTimeout(() => {
        onClose();
      }, 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Невалидный синтаксис JSON');
      haptic.trigger('light', settings.soundFeedbackEnabled);
    }
  };

  // Экспорт program.json
  const handleExport = () => {
    haptic.trigger('light', settings.soundFeedbackEnabled);
    const blob = new Blob([JSON.stringify(program, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gtg-program.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Импорт program.json
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        setJsonText(JSON.stringify(parsed, null, 2));
        setError(null);
      } catch {
        setError('Не удалось прочитать загруженный JSON-файл');
      }
    };
    reader.readAsText(file);
  };

  // Сброс к дефолтной программе
  const handleReset = () => {
    if (window.confirm('Сбросить текущую программу к стандартному сплиту GtG?')) {
      haptic.trigger('medium', settings.soundFeedbackEnabled);
      resetProgramToDefault();
      onClose();
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="JSON-редактор программы">
      <div className="space-y-4">
        {/* Кнопки экспорта/импорта/сброса */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleExport}
            className="flex-1 py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono flex items-center justify-center gap-1.5 border border-white/5 transition-all active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            Экспорт
          </button>

          <label className="flex-1 py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono flex items-center justify-center gap-1.5 border border-white/5 transition-all cursor-pointer active:scale-95">
            <Upload className="w-3.5 h-3.5" />
            Импорт
            <input
              type="file"
              accept=".json,application/json"
              onChange={handleImport}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={handleReset}
            className="py-2 px-3 rounded-xl bg-zinc-800/60 hover:bg-red-500/15 text-zinc-400 hover:text-red-400 text-xs font-mono flex items-center justify-center gap-1.5 border border-white/5 transition-all"
            title="Сбросить к дефолту"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Ошибки валидации */}
        {error && (
          <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs font-mono flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Успешное сохранение */}
        {successMessage && (
          <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Текстовое поле JSON */}
        <div>
          <textarea
            value={jsonText}
            onChange={(e) => {
              setJsonText(e.target.value);
              setError(null);
            }}
            rows={14}
            className="w-full p-3 rounded-xl bg-zinc-950 text-emerald-400 font-mono text-[11px] leading-relaxed border border-white/10 focus:outline-none focus:border-emerald-500 selection:bg-emerald-500/30"
            spellCheck={false}
          />
        </div>

        {/* Кнопка сохранить */}
        <button
          type="button"
          onClick={handleSave}
          className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs font-mono uppercase tracking-wider transition-all duration-200 active:scale-98 glow-emerald"
        >
          Применить изменения JSON
        </button>
      </div>
    </BottomSheet>
  );
};
