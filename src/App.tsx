import { useState } from 'react';
import { AppContainer } from './components/layout/AppContainer';
import { Header } from './components/layout/Header';
import { BottomNav, type TabType } from './components/layout/BottomNav';
import { SettingsView } from './components/settings/SettingsView';
import { DashboardView } from './components/dashboard/DashboardView';
import { HistoryView } from './components/history/HistoryView';

import { WorkoutProvider } from './context/WorkoutContext';

export function AppContent() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  return (
    <AppContainer>
      {/* Шапка приложения */}
      <Header />

      {/* Основная рабочая область (без вертикального скролла на дашборде) */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
        {activeTab === 'dashboard' && <DashboardView />}

        {activeTab === 'history' && <HistoryView />}

        {activeTab === 'settings' && <SettingsView />}
      </div>

      {/* Нижняя навигация */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </AppContainer>
  );
}

export function App() {
  return (
    <WorkoutProvider>
      <AppContent />
    </WorkoutProvider>
  );
}

export default App;
