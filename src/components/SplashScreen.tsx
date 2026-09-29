import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
  onLoaded: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onLoaded }) => {
  const [fadeState, setFadeState] = useState<'entering' | 'visible' | 'leaving'>('entering');

  useEffect(() => {
    // 文字优雅渐显
    const enterTimer = setTimeout(() => setFadeState('visible'), 100);
    // 缓冲 1.8 秒后平滑散开淡出
    const leaveTimer = setTimeout(() => setFadeState('leaving'), 1800);
    const finishTimer = setTimeout(() => onLoaded(), 2400);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(leaveTimer);
      clearTimeout(finishTimer);
    };
  }, [onLoaded]);

  return (
    <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#f8fafc] transition-opacity duration-700 ${fadeState === 'leaving' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      {/* 极细几何光斑 */}
      <div className="w-64 h-64 rounded-full bg-sky-100/70 blur-3xl absolute -z-10 animate-pulse" />
      
      <div className="text-center space-y-4 px-6">
        <div 
          className={`transition-all duration-1000 transform ${
            fadeState === 'visible' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
          }`}
        >
          <h1 className="text-3xl font-light tracking-widest text-slate-800 font-serif">
            木漏れ日
          </h1>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400 mt-2 font-mono">
            Project Komorebi
          </p>
        </div>

        <div 
          className={`transition-all duration-1000 delay-300 transform ${
            fadeState === 'visible' ? 'opacity-60 translate-y-0' : 'opacity-0 translate-y-2'
          }`}
        >
          <p className="text-xs text-slate-400 font-light">阳光穿透树叶，落下的光影与平静</p>
        </div>
      </div>
    </div>
  );
};
