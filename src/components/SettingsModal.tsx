import React, { useState } from 'react';
import { X, CheckCircle2, ShieldCheck, Moon, Globe, Bot } from 'lucide-react';

interface Props {
  onClose: () => void;
  currentTheme: 'mist' | 'peach';
  onThemeChange: (theme: 'mist' | 'peach') => void;
}

export const SettingsModal: React.FC<Props> = ({ onClose, currentTheme, onThemeChange }) => {
  const [lang, setLang] = useState<'zh' | 'en'>('zh');
  const [baseUrl, setBaseUrl] = useState('https://api.openai.com/v1');
  const [apiKey, setApiKey] = useState('');
  const [models, setModels] = useState<string[]>(['gpt-4o-mini', 'gpt-4o']);
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');
  const [persona, setPersona] = useState('gentle'); // gentle / rational / concise
  const [testStatus, setTestStatus] = useState<string>('');

  // 连通性测试 + 模型下拉框拉取
  const testConnection = async () => {
    if (!apiKey) {
      setTestStatus('请先填写 API Key');
      return;
    }
    setTestStatus('正在连接 /models ...');
    try {
      const res = await fetch(`${baseUrl.replace(/\/+$/, '')}/models`, {
        headers: { Authorization: `Bearer ${apiKey}` }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data && Array.isArray(data.data)) {
        const modelNames = data.data.map((m: any) => m.id);
        setModels(modelNames);
        if (modelNames.length > 0) setSelectedModel(modelNames[0]);
        setTestStatus('连接成功！模型列表已刷新');
      } else {
        setTestStatus('连接成功，但模型数据结构不规范');
      }
    } catch (e: any) {
      setTestStatus(`连接失败: ${e.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-md">
      <div className="bg-white/90 backdrop-blur-2xl border border-white/90 rounded-3xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto shadow-2xl relative">
        
        {/* 头部 */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
          <h2 className="text-base font-medium text-slate-800">系统偏好设置</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-6 pt-4 text-xs text-slate-600">
          
          {/* 1. 语言与主题 */}
          <div className="space-y-2">
            <label className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Globe size={13} /> 界面语言与色彩主题
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex rounded-xl bg-slate-100/70 p-1">
                <button 
                  onClick={() => setLang('zh')} 
                  className={`flex-1 py-1.5 rounded-lg text-center font-medium transition-all ${lang === 'zh' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400'}`}>
                  中文 (简体)
                </button>
                <button 
                  onClick={() => setLang('en')} 
                  className={`flex-1 py-1.5 rounded-lg text-center font-medium transition-all ${lang === 'en' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400'}`}>
                  English
                </button>
              </div>

              <div className="flex rounded-xl bg-slate-100/70 p-1">
                <button 
                  onClick={() => onThemeChange('mist')} 
                  className={`flex-1 py-1.5 rounded-lg text-center font-medium transition-all ${currentTheme === 'mist' ? 'bg-white shadow-sm text-sky-700' : 'text-slate-400'}`}>
                  冰川白蓝
                </button>
                <button 
                  onClick={() => onThemeChange('peach')} 
                  className={`flex-1 py-1.5 rounded-lg text-center font-medium transition-all ${currentTheme === 'peach' ? 'bg-white shadow-sm text-rose-700' : 'text-slate-400'}`}>
                  珍珠白粉
                </button>
              </div>
            </div>
          </div>

          {/* 2. API 接口配置与模型下拉 */}
          <div className="space-y-3 p-4 rounded-2xl bg-slate-50/70 border border-slate-200/50">
            <label className="font-semibold text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5"><Bot size={13} /> OpenAI-Compatible 智能引擎</span>
              <span className="text-[10px] text-emerald-600 font-normal">支持本地/中转服务</span>
            </label>
            
            <div className="space-y-1.5">
              <span className="text-slate-400">Base URL</span>
              <input 
                type="text" 
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 outline-none text-xs" 
              />
            </div>

            <div className="space-y-1.5">
              <span className="text-slate-400">API Key</span>
              <input 
                type="password" 
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 outline-none text-xs" 
              />
            </div>

            {/* 模型选择下拉框 (非用户手填) */}
            <div className="space-y-1.5">
              <span className="text-slate-400">AI 模型</span>
              <select 
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 outline-none text-xs cursor-pointer"
              >
                {models.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between pt-1">
              <button 
                onClick={testConnection}
                className="px-3 py-1.5 rounded-xl bg-slate-800 text-white text-xs hover:bg-slate-700 transition-colors"
              >
                测试连通性并拉取模型
              </button>
              {testStatus && <span className="text-[11px] text-slate-500">{testStatus}</span>}
            </div>
          </div>

          {/* 3. 助手性格 */}
          <div className="space-y-2">
            <label className="font-semibold text-slate-700">助手陪伴性格预设</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'gentle', label: '温柔治愈', desc: '轻声鼓励与同理心' },
                { id: 'rational', label: '高效理性', desc: '专注执行与精准把控' },
                { id: 'poetic', label: '沉静诗意', desc: '充满空间感与留白' }
              ].map(item => (
                <div 
                  key={item.id}
                  onClick={() => setPersona(item.id)}
                  className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                    persona === item.id ? 'bg-sky-50/60 border-sky-300 text-sky-900' : 'bg-white border-slate-200/70 text-slate-600'
                  }`}
                >
                  <p className="font-medium text-xs">{item.label}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 4. 原生通知提醒授权 */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-white border border-slate-100">
            <div>
              <p className="font-medium text-slate-700">iOS / 桌面系统原生推送</p>
              <p className="text-[11px] text-slate-400">开启后到点将通过 Web Push 唤醒通知</p>
            </div>
            <button 
              onClick={() => {
                if ('Notification' in window) {
                  Notification.requestPermission();
                }
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
            >
              开启权限
            </button>
          </div>

          {/* 5. 备用云端推送中转配置 */}
          <div className="space-y-1.5 opacity-60">
            <span className="text-slate-500 font-medium">自建后端 Push 中转节点 (备用)</span>
            <input 
              type="text" 
              placeholder="https://push.yourdomain.com"
              className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 outline-none text-xs" 
            />
          </div>

        </div>

        {/* 底部水印声明 */}
        <div className="mt-8 pt-4 border-t border-slate-100 flex justify-between items-center text-[11px] text-slate-400">
          <span>Komorebi v0.1.0 · 本地优先架构</span>
          <span className="font-mono text-slate-400 tracking-wider">by shadow</span>
        </div>

      </div>
    </div>
  );
};
