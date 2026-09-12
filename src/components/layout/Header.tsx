import React from 'react';
import { Activity } from 'lucide-react';

interface HeaderProps {
  currentDateText?: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentDateText,
}) => {
  const defaultDate = React.useMemo(() => {
    const now = new Date();
    return new Intl.DateTimeFormat('ru-RU', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    }).format(now);
  }, []);

  const displayDate = currentDateText || defaultDate;

  return (
    <header className="w-full px-4 pt-3 pb-2 flex items-center justify-between border-b border-white/[0.06] bg-[#08090d]/80 backdrop-blur-md z-30 shrink-0">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 glow-emerald">
          <Activity className="w-4 h-4" />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5 font-sans">
            GtG Tracker
            <span className="text-[10px] px-1.5 py-0.2 bg-emerald-500/15 text-emerald-400 font-mono rounded-full border border-emerald-500/20">
              PWA
            </span>
          </h1>
          <p className="text-[11px] text-zinc-400 font-mono capitalize">
            {displayDate}
          </p>
        </div>
      </div>
    </header>
  );
};
