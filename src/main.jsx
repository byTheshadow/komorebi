import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

// 引入防崩隔离舱
import { SandboxBoundary } from './core/ErrorBoundary';

// 引入四大空间
import MainSpace from './spaces/main/MainSpace';
import SettingsSpace from './spaces/settings/SettingsSpace';
import AchievementsSpace from './spaces/achievements/AchievementsSpace';
import CalendarSpace from './spaces/calendar/CalendarSpace';

import { Sparkles, Settings, FolderHeart, Calendar, Sun, Moon } from 'lucide-react';

function App() {
  const [currentSpace, setCurrentSpace] = useState('main'); // 'main' | 'calendar' | 'achievements' | 'settings'
  const [theme, setTheme] = useState('ice'); // 'ice' (蓝白) | 'peach' (粉白)

  useEffect(() => {
    // 渐隐移除开屏缓冲层，确保后台 IndexedDB 与界面完全就绪
    const timer = setTimeout(() => {
      const loader = document.getElementById('splash-loader');
      if (loader) loader.classList.add('loaded');
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'ice' ? 'peach' : 'ice';
    setTheme(nextTheme);
    if (nextTheme === 'peach') {
      document.documentElement.setAttribute('data-theme', 'peach');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  };

  return (
    <div className="relative min-h-screen px-4 pt-6">
      {/* 弥散柔光 */}
      <div className="ambient-orb w-[420px] h-[420px] -top-24 -left-24 bg-sky-200/50" />
      <div className="ambient-orb w-[480px] h-[480px] -bottom-24 -right-24 bg-indigo-100/50" />

      {/* 顶栏控制 */}
      <header className="max-w-2xl mx-auto flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold tracking-wider text-slate-800">KOMOREBI</span>
          <span className="text-[10px] text-slate-400 tracking-widest uppercase">木漏</span>
        </div>

        <button
          onClick={toggleTheme}
          className="p-2 rounded-2xl glass-panel text-slate-600 hover:text-slate-900 transition-all"
          title="切换白蓝/白粉主题"
        >
          <Sparkles className="w-4 h-4" />
        </button>
      </header>

      {/* 沙盒隔离容器：一个崩了绝对不影响其他空间 */}
      <main className="max-w-2xl mx-auto">
        {currentSpace === 'main' && (
          <SandboxBoundary name="主界面与AI对话">
            <MainSpace />
          </SandboxBoundary>
        )}

        {currentSpace === 'calendar' && (
          <SandboxBoundary name="日历与课表">
            <CalendarSpace />
          </SandboxBoundary>
        )}

        {currentSpace === 'achievements' && (
          <SandboxBoundary name="成就墙与文件夹">
            <AchievementsSpace />
          </SandboxBoundary>
        )}

        {currentSpace === 'settings' && (
          <SandboxBoundary name="设置面板">
            <SettingsSpace />
          </SandboxBoundary>
        )}
      </main>

      {/* 全局空间切换底栏 */}
      <nav className="fixed bottom-0 left-0 right-0 p-3 bg-white/70 backdrop-blur-xl border-t border-white/60 flex justify-around items-center max-w-lg mx-auto rounded-t-3xl z-50">
        <button
          onClick={() => setCurrentSpace('main')}
          className={`flex flex-col items-center gap-1 text-[11px] ${currentSpace === 'main' ? 'text-sky-600 font-medium' : 'text-slate-400'}`}
        >
          <Sparkles className="w-4 h-4" />
          <span>对话</span>
        </button>

        <button
          onClick={() => setCurrentSpace('calendar')}
          className={`flex flex-col items-center gap-1 text-[11px] ${currentSpace === 'calendar' ? 'text-sky-600 font-medium' : 'text-slate-400'}`}
        >
          <Calendar className="w-4 h-4" />
          <span>日程</span>
        </button>

        <button
          onClick={() => setCurrentSpace('achievements')}
          className={`flex flex-col items-center gap-1 text-[11px] ${currentSpace === 'achievements' ? 'text-sky-600 font-medium' : 'text-slate-400'}`}
        >
          <FolderHeart className="w-4 h-4" />
          <span>成就</span>
        </button>

        <button
          onClick={() => setCurrentSpace('settings')}
          className={`flex flex-col items-center gap-1 text-[11px] ${currentSpace === 'settings' ? 'text-sky-600 font-medium' : 'text-slate-400'}`}
        >
          <Settings className="w-4 h-4" />
          <span>设置</span>
        </button>
      </nav>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
