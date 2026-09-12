import { useState } from 'react';
import { AppContainer } from './components/layout/AppContainer';
import { Header } from './components/layout/Header';
import { BottomNav, type TabType } from './components/layout/BottomNav';
import { Dumbbell, Calendar, Settings } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  return (
    <AppContainer>
      {/* Шапка приложения */}
      <Header />

      {/* Основная рабочая область (без вертикального скролла на дашборде) */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
        {activeTab === 'dashboard' && (
          <div className="flex-1 flex flex-col justify-center items-center p-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 glow-emerald">
              <Dumbbell className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white font-sans mb-1">
              GtG Dashboard
            </h2>
            <p className="text-xs text-zinc-400 max-w-xs font-mono">
              Минималистичный трекер микротренировок Grease the Groove готов к работе
            </p>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="flex-1 flex flex-col justify-center items-center p-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4 glow-cyan">
              <Calendar className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white font-sans mb-1">
              История тренировок
            </h2>
            <p className="text-xs text-zinc-400 max-w-xs font-mono">
              Календарь закрытых дней и аналитика объема (Этап 06)
            </p>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="flex-1 flex flex-col justify-center items-center p-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-zinc-800 border border-white/10 flex items-center justify-center text-zinc-300 mb-4">
              <Settings className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white font-sans mb-1">
              Настройки программы
            </h2>
            <p className="text-xs text-zinc-400 max-w-xs font-mono">
              JSON-редактор тренировочного плана и бэкапы (Этап 07)
            </p>
          </div>
        )}
      </div>

      {/* Нижняя навигация */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </AppContainer>
  );
}

export default App;
