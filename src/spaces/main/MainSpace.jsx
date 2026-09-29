import React, { useState, useEffect } from 'react';
import { db, addChatMessage } from '../../core/db';
import { Sparkles, Send, CheckCircle2, Clock, Trash2, MessageSquarePlus } from 'lucide-react';

export default function MainSpace() {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [tasks, setTasks] = useState([]);
  const [nextTask, setNextTask] = useState('14:30 团队周会 · 还有 45 分钟');

  // 读取本地 100 条限制的历史记录与待办
  const loadData = async () => {
    const logs = await db.chatLogs.orderBy('timestamp').toArray();
    const storedTasks = await db.tasks.toArray();
    setMessages(logs);
    setTasks(storedTasks);
  };

  useEffect(() => {
    loadData();
  }, []);

  // 发送对话（含待办自动意图示例）
  const handleSend = async () => {
    if (!inputText.trim()) return;
    const userText = inputText;
    setInputText('');

    // 存入用户消息 (自动控制在 100 条内)
    await addChatMessage('user', userText);

    // 模拟 AI 回复与任务解析提取
    setTimeout(async () => {
      let aiReply = '已为你妥善记录。阳光正好，慢慢来。';
      let capturedId = null;

      if (userText.includes('提醒') || userText.includes('todo') || userText.includes('做')) {
        // 创建任务
        capturedId = await db.tasks.add({
          title: userText,
          category: '日常',
          dueDate: new Date().toISOString().split('T')[0],
          dueTime: '18:00',
          isCompleted: 0,
          isInterval: 0,
          createdAt: Date.now()
        });
        aiReply = `已将「${userText}」整理到待办清单，设定提醒。`;
      }

      await addChatMessage('assistant', aiReply, capturedId);
      loadData();
    }, 600);

    loadData();
  };

  // 清空对话（开启新对话）
  const handleClearChat = async () => {
    if (confirm('确认清空过去的历史对话吗？（待办与日程将保留）')) {
      await db.chatLogs.clear();
      loadData();
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto w-full pb-32">
      {/* 顶部轻提醒 Hero */}
      <div className="text-center py-4">
        <div className="text-xs uppercase tracking-widest text-slate-400 mb-1">NEXT MOMENT</div>
        <div className="text-xl font-medium tracking-tight flex items-center justify-center gap-2">
          <span>{nextTask}</span>
        </div>
      </div>

      {/* 待办与今日事项概览 */}
      <div className="glass-panel rounded-3xl p-5">
        <div className="flex justify-between items-center mb-3">
          <div className="text-xs font-semibold tracking-wider text-slate-400 uppercase">今日待办 & 提醒</div>
          <span className="text-xs text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full font-medium">
            {tasks.filter(t => !t.isCompleted).length} 项进行中
          </span>
        </div>
        <div className="space-y-2">
          {tasks.length === 0 ? (
            <div className="text-xs text-slate-400 py-3 text-center">暂无待办，在下方输入让木漏为你安排</div>
          ) : (
            tasks.map(t => (
              <div key={t.id} className="flex items-center gap-3 text-sm py-1.5 border-b border-slate-100 last:border-none">
                <CheckCircle2 className="w-4 h-4 text-slate-300 hover:text-sky-500 cursor-pointer" />
                <span className="flex-1">{t.title}</span>
                <span className="text-xs text-slate-400">{t.dueTime || '今日'}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 历史对话与追溯记录 (最多100条) */}
      <div className="glass-panel rounded-3xl p-5 flex flex-col">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
            对话记录与记忆沉淀 ({messages.length}/100)
          </span>
          <div className="flex gap-2">
            <button onClick={handleClearChat} title="开启新对话/清空记录" className="p-1 rounded-lg hover:bg-black/5 text-slate-400">
              <MessageSquarePlus className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="max-h-60 overflow-y-auto space-y-3 pr-1 text-sm">
          {messages.length === 0 ? (
            <div className="text-xs text-slate-400 py-6 text-center">你可以随时告诉我任何琐事、灵感或需要提醒的事项。</div>
          ) : (
            messages.map((m, idx) => (
              <div key={idx} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`px-4 py-2.5 rounded-2xl max-w-[85%] leading-relaxed ${
                  m.role === 'user' 
                    ? 'bg-slate-800 text-white rounded-br-sm' 
                    : 'bg-white/80 border border-white/60 text-slate-700 shadow-sm rounded-bl-sm'
                }`}>
                  {m.content}
                </div>
                {m.capturedTaskId && (
                  <span className="text-[10px] text-sky-600 mt-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> 已自动同步至待办日程
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* 吸底固定输入条 */}
      <div className="fixed bottom-6 left-0 right-0 px-4 flex justify-center z-40">
        <div className="w-full max-w-2xl glass-panel rounded-full p-2 flex items-center gap-2 shadow-lg">
          <input
            type="text"
            className="flex-1 bg-transparent px-4 py-2 text-sm outline-none placeholder:text-slate-400 font-light"
            placeholder="交代任务、设置x小时循环、倾诉心事..."
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
          />
          <button 
            onClick={handleSend}
            className="w-10 h-10 rounded-full bg-slate-800 text-white flex items-center justify-center hover:opacity-90 active:scale-95 transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
