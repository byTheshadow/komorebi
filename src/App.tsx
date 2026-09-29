import React, { useState, useEffect } from 'react';
import { SplashScreen } from './components/SplashScreen';
import { SandboxErrorBoundary } from './components/SandboxErrorBoundary';
import { SettingsModal } from './components/SettingsModal';
import { Settings as SettingsIcon, Calendar, Archive, Send, Sparkles } from 'lucide-react';

export function App() {
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<'mist' | 'peach'>('mist');
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<'main' | 'calendar' | 'archive'>('main');
  const [inputValue, setInputValue] = useState('');

  return (
    <>
      {/* 缓冲缓冲与开屏动画 */}
      {loading && <SplashScreen onLoaded={() => setLoading(false)} />}

      <div className={`min-h-screen relative font-sans transition-colors duration-700 ${
        theme === 'mist' 
          ? 'bg-gradient-to-br from-sky-50 via-slate-50 to-emerald-50 text-slate-800' 
          : 'bg-gradient-to-br from-rose-50 via-stone-50 to-amber-50 text-stone-800'
      }`}>
        
        {/* 背景光斑 */}
        <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
          <div className={`w-[500px] h-[500px] rounded-full blur-[100px] absolute -top-20 -left-20 transition-colors duration-700 ${
            theme === 'mist' ? 'bg-sky-200/40' : 'bg-rose-200/40'
          }`} />
          <div className={`w-[450px] h-[450px] rounded-full blur-[100px] absolute -bottom-20 -right-20 transition-colors duration-700 ${
            theme === 'mist' ? 'bg-indigo-100/40' : 'bg-orange-100/40'
          }`} />
        </div>

        {/* 顶部常驻导航 */}
        <header className="max-w-2xl mx-auto px-6 pt-6 flex justify-between items-center">
          <button 
            onClick={() => setActiveTab(activeTab === 'archive' ? 'main' : 'archive')} 
            className="w-10 h-10 rounded-2xl bg-white/60 backdrop-blur-md border border-white/80 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-all shadow-sm hover:scale-105"
            title="成就墙 (归档文件夹)"
          >
            <Archive size={17} strokeWidth={1.5} />
          </button>

          <span className="text-xs uppercase tracking-widest font-mono text-slate-400">
            Komorebi
          </span>

          <div className="flex gap-2">
            <button 
              onClick={() => setActiveTab(activeTab === 'calendar' ? 'main' : 'calendar')}
              className="w-10 h-10 rounded-2xl bg-white/60 backdrop-blur-md border border-white/80 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-all shadow-sm hover:scale-105"
              title="月/周视图与课表"
            >
              <Calendar size={17} strokeWidth={1.5} />
            </button>
            <button 
              onClick={() => setShowSettings(true)}
              className="w-10 h-10 rounded-2xl bg-white/60 backdrop-blur-md border border-white/80 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-all shadow-sm hover:scale-105"
              title="设置"
            >
              <SettingsIcon size={17} strokeWidth={1.5} />
            </button>
          </div>
        </header>

        {/* 主视口内容区 (带沙盒保护) */}
        <main className="max-w-xl mx-auto px-6 pt-10 pb-36">
          
          {/* 沙盒 1: Hero 轻提醒 */}
          <SandboxErrorBoundary name="Hero Zone">
            <section className="text-center mb-8">
              <p className="text-xs text-slate-400 tracking-wide">下午好</p>
              <div className="mt-2 inline-flex items-center gap-3">
                <span className="text-2xl font-normal tracking-tight">下一项：团队周会</span>
                <span className="text-xs px-2.5 py-1 rounded-full bg-sky-500/10 text-sky-700 font-medium">
                  14:30
                </span>
              </div>
            </section>
          </SandboxErrorBoundary>

          {/* 沙盒 2: AI 即时捕获与反馈状态 */}
          <SandboxErrorBoundary name="AI Feedback">
            <div className="p-4 rounded-3xl bg-white/70 backdrop-blur-lg border border-white/90 shadow-[0_15px_30px_-10px_rgba(0,0,0,0.05)] mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={14} className="text-sky-600" />
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">AI 待办记录确认</span>
              </div>
              <p className="text-sm font-normal text-slate-700">“下班顺路取大衣” 已记入日程</p>
              <div className="flex gap-2 mt-2">
                <span className="text-[11px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md">今日 18:30 提醒</span>
                <span className="text-[11px] bg-sky-50 text-sky-600 px-2 py-0.5 rounded-md">离线保活已就绪</span>
              </div>
            </div>
          </SandboxErrorBoundary>

          {/* 沙盒 3: 待办主列表 */}
          <SandboxErrorBoundary name="Tasks Board">
            <div className="space-y-2">
              <div className="p-4 rounded-2xl bg-white/50 backdrop-blur-sm border border-white/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-lg border border-slate-300 hover:border-sky-500 cursor-pointer transition-colors" />
                  <span className="text-sm text-slate-700">下午 14:30 团队周度复盘会</span>
                </div>
                <span className="text-xs text-slate-400">14:30</span>
              </div>
            </div>
          </SandboxErrorBoundary>

        </main>

        {/* 沙盒 4: 吸底输入胶囊 */}
        <div className="fixed bottom-6 inset-x-0 px-6 flex justify-center z-30">
          <div className="w-full max-w-xl bg-white/80 backdrop-blur-xl border border-white/90 rounded-full p-2 pl-6 flex items-center shadow-lg shadow-slate-400/10">
            <input 
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="交代任务、设提醒，或与木漏说说话..." 
              className="flex-1 bg-transparent border-none outline-none text-sm text-slate-700 placeholder-slate-400"
            />
            <button className="w-10 h-10 rounded-full bg-slate-800 text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all">
              <Send size={15} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* 沙盒 5: 设置面板 Modal */}
        {showSettings && (
          <SettingsModal 
            onClose={() => setShowSettings(false)} 
            currentTheme={theme}
            onThemeChange={(newTheme) => setTheme(newTheme)}
          />
        )}

      </div>
    </>
  );
}
