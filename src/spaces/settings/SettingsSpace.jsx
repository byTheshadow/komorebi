import React, { useState, useEffect } from 'react';
import { db } from '../../core/db';
import { pushManager } from '../../core/pushManager';
import { Check, Wifi, Bell, Shield } from 'lucide-react';

export default function SettingsSpace() {
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('https://api.openai.com/v1');
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState('');
  const [language, setLanguage] = useState('zh');
  const [personalityPreset, setPersonalityPreset] = useState('温暖治愈');
  const [customPrompt, setCustomPrompt] = useState('你是一个温和清澈的助手，用简洁治愈的口吻回答，默默梳理任务。');
  const [cloudRelayUrl, setCloudRelayUrl] = useState('');
  const [noticeStatus, setNoticeStatus] = useState(pushManager.getPermission());

  // 连通性测试并获取模型列表 (不让用户手动写模型名称，从 /models 获取)
  const testConnectionAndFetchModels = async () => {
    if (!apiKey) {
      setTestResult('请先填写 API Key');
      return;
    }
    setIsTesting(true);
    setTestResult('正在测试连接并调取模型列表...');
    try {
      const res = await fetch(`${baseUrl.replace(/\/+$/, '')}/models`, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const modelList = (data.data || []).map(m => m.id);
      setModels(modelList);
      if (modelList.length > 0) setSelectedModel(modelList[0]);
      setTestResult(`连接成功！已获取 ${modelList.length} 个模型供选择。`);
    } catch (err) {
      setTestResult(`连接失败: ${err.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  const handleRequestNotice = async () => {
    const res = await pushManager.requestPermission();
    setNoticeStatus(pushManager.getPermission());
    if (res.success) {
      pushManager.sendLocalNotice('Komorebi · 木漏', '系统通知提醒已成功开启');
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-28">
      {/* 语言配置 */}
      <div className="glass-panel rounded-3xl p-5">
        <h3 className="text-xs font-semibold tracking-wider text-slate-400 uppercase mb-3">界面语言 / Language</h3>
        <div className="flex gap-3">
          {['zh', 'en'].map(lang => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              className={`flex-1 py-2 text-xs rounded-xl border transition-all ${
                language === lang ? 'border-sky-500 bg-sky-50 text-sky-700 font-medium' : 'border-slate-200 text-slate-600'
              }`}
            >
              {lang === 'zh' ? '简体中文 (SC)' : 'English (EN)'}
            </button>
          ))}
        </div>
      </div>

      {/* AI API 配置 */}
      <div className="glass-panel rounded-3xl p-5 space-y-4">
        <h3 className="text-xs font-semibold tracking-wider text-slate-400 uppercase flex items-center justify-between">
          <span>AI 核心配置 (OpenAI 兼容)</span>
          <Wifi className="w-3.5 h-3.5 text-slate-400" />
        </h3>

        <div>
          <label className="text-xs text-slate-500 mb-1 block">Base URL</label>
          <input
            className="w-full bg-white/60 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-sky-500"
            value={baseUrl}
            onChange={e => setBaseUrl(e.target.value)}
          />
        </div>

        <div>
          <label className="text-xs text-slate-500 mb-1 block">API Key</label>
          <input
            type="password"
            className="w-full bg-white/60 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-sky-500"
            value={apiKey}
            placeholder="sk-..."
            onChange={e => setApiKey(e.target.value)}
          />
        </div>

        <div className="flex gap-2 items-center">
          <button
            onClick={testConnectionAndFetchModels}
            disabled={isTesting}
            className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs hover:bg-slate-700"
          >
            {isTesting ? '正在探测...' : '测试连通性并拉取模型'}
          </button>
          {testResult && <span className="text-xs text-slate-500">{testResult}</span>}
        </div>

        {models.length > 0 && (
          <div>
            <label className="text-xs text-slate-500 mb-1 block">选择已拉取的模型 (禁止手动输错)</label>
            <select
              className="w-full bg-white/80 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none"
              value={selectedModel}
              onChange={e => setSelectedModel(e.target.value)}
            >
              {models.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* 性格设定 */}
      <div className="glass-panel rounded-3xl p-5 space-y-3">
        <h3 className="text-xs font-semibold tracking-wider text-slate-400 uppercase">AI 助手性格设定</h3>
        <div className="flex gap-2">
          {['温暖治愈', '高效干练', '极简静默'].map(preset => (
            <button
              key={preset}
              onClick={() => setPersonalityPreset(preset)}
              className={`px-3 py-1.5 text-xs rounded-xl border ${personalityPreset === preset ? 'border-sky-500 bg-sky-50 text-sky-700' : 'border-slate-200'}`}
            >
              {preset}
            </button>
          ))}
        </div>
        <textarea
          rows={3}
          className="w-full bg-white/60 border border-slate-200 rounded-xl p-3 text-xs outline-none resize-none"
          value={customPrompt}
          onChange={e => setCustomPrompt(e.target.value)}
        />
      </div>

      {/* 推送通知与备用云端配置 */}
      <div className="glass-panel rounded-3xl p-5 space-y-4">
        <h3 className="text-xs font-semibold tracking-wider text-slate-400 uppercase flex items-center justify-between">
          <span>提醒与推送服务 (iOS PWA 原生支持)</span>
          <Bell className="w-3.5 h-3.5 text-slate-400" />
        </h3>
        
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-600">浏览器通知权限：{noticeStatus}</span>
          <button onClick={handleRequestNotice} className="text-xs px-3 py-1.5 bg-slate-100 rounded-xl hover:bg-slate-200">
            {noticeStatus === 'granted' ? '已授权通知' : '申请通知权限'}
          </button>
        </div>

        <div>
          <label className="text-xs text-slate-500 mb-1 block">云端 Push 中转节点 (备用，用于iOS息屏推送)</label>
          <input
            className="w-full bg-white/60 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none"
            placeholder="https://your-push-relay.com"
            value={cloudRelayUrl}
            onChange={e => setCloudRelayUrl(e.target.value)}
          />
        </div>
      </div>

      {/* 底部专属水印 */}
      <div className="text-center pt-4 text-xs text-slate-400 tracking-wider">
        <span>Komorebi · </span>
        <span className="font-medium text-slate-500">by shadow</span>
      </div>
    </div>
  );
}
