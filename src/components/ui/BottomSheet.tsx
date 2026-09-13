import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  children,
}) => {
  // Закрытие по Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Затемненный фон с размытием */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Выдвижная панель снизу */}
      <div className="relative w-full max-w-md bg-[#131724] border-t border-white/15 rounded-t-3xl p-5 shadow-2xl z-10 animate-slide-up max-h-[85vh] flex flex-col">
        {/* Ручка шторки */}
        <div className="w-10 h-1 rounded-full bg-zinc-700 mx-auto mb-3 shrink-0" />

        {/* Заголовок */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.09] shrink-0">
          <h3 className="text-base font-bold text-white font-sans tracking-tight">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-800/80 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Контент */}
        <div className="flex-1 overflow-y-auto no-scrollbar pt-4">
          {children}
        </div>
      </div>
    </div>
  );
};
