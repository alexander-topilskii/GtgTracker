import React from 'react';
import { AmbientAuraShader } from '../shaders/AmbientAuraShader';
import { FilmGrainOverlay } from '../shaders/FilmGrainOverlay';

interface AppContainerProps {
  children: React.ReactNode;
}

export const AppContainer: React.FC<AppContainerProps> = ({ children }) => {
  return (
    <div className="w-full h-full h-[100dvh] flex justify-center bg-[#050608]">
      <main className="w-full max-w-md h-full flex flex-col bg-[#08090d] relative overflow-hidden shadow-2xl border-x border-white/[0.04]">
        {/* Живой WebGL шейдер ауры */}
        <AmbientAuraShader />

        {/* Тактильная процедурная зернистость без бандинга */}
        <FilmGrainOverlay />

        {/* Основной контент */}
        <div className="relative z-10 w-full h-full flex flex-col overflow-hidden">
          {children}
        </div>
      </main>
    </div>
  );
};
