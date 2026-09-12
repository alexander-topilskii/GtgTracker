import React from 'react';

interface AppContainerProps {
  children: React.ReactNode;
}

export const AppContainer: React.FC<AppContainerProps> = ({ children }) => {
  return (
    <div className="w-full h-full h-[100dvh] flex justify-center bg-[#050608]">
      <main className="w-full max-w-md h-full flex flex-col bg-[#08090d] relative overflow-hidden shadow-2xl border-x border-white/[0.04]">
        {children}
      </main>
    </div>
  );
};
