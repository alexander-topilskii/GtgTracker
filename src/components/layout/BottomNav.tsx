import React from 'react';
import { Dumbbell, CalendarDays, Settings2 } from 'lucide-react';

export type TabType = 'dashboard' | 'history' | 'settings';

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
}) => {
  const tabs = [
    {
      id: 'dashboard' as TabType,
      label: 'Тренировка',
      icon: Dumbbell,
    },
    {
      id: 'history' as TabType,
      label: 'История',
      icon: CalendarDays,
    },
    {
      id: 'settings' as TabType,
      label: 'Настройки',
      icon: Settings2,
    },
  ];

  return (
    <nav className="w-full px-4 py-2 border-t border-white/[0.10] bg-[#181c28]/95 backdrop-blur-lg z-30 shrink-0 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-lg">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center min-h-[48px] min-w-[72px] py-1 px-3 rounded-xl transition-all duration-200 active:scale-95 ${
                isActive
                  ? 'text-[#ccff00] font-bold'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(204,255,0,0.5)]' : ''
                  }`}
                />
                {isActive && (
                  <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#ccff00] shadow-[0_0_8px_#ccff00]" />
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-wide font-mono">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
