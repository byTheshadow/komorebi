import React, { useState, useEffect } from 'react';
import { db } from '../../core/db';
import { Folder, FolderOpen, Trash2, Edit3, Sparkles } from 'lucide-react';

export default function AchievementsSpace() {
  const [openFolder, setOpenFolder] = useState(null);
  const [archivedTasks, setArchivedTasks] = useState([
    { id: 1, title: '雅思高频词第一轮复习', categoryFolder: '英语进阶', completedAt: '2026-09-28', userNote: '感觉阅读长难句更顺手了' },
    { id: 2, title: '整理换季羊毛大衣干洗', categoryFolder: '日常归档', completedAt: '2026-09-29', userNote: '干洗店周五去拿' },
  ]);

  const categories = ['英语进阶', '日常归档', '工作复盘', '健康打卡'];

  const handleDeleteItem = (id) => {
    if (confirm('确认从成就墙彻底清除该归档？此操作不可逆。')) {
      setArchivedTasks(archivedTasks.filter(item => item.id !== id));
    }
  };

  const handleUpdateNote = (id) => {
    const newNote = prompt('添加或修改心得备注：');
    if (newNote !== null) {
      setArchivedTasks(archivedTasks.map(item => item.id === id ? { ...item, userNote: newNote } : item));
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-28">
      <div className="text-center py-2">
        <h2 className="text-lg font-medium text-slate-800">沉淀成就墙</h2>
        <p className="text-xs text-slate-400 mt-1">模拟分类文件夹收纳 · 手动持久化归档</p>
      </div>

      {/* 模拟实体文件夹交互卡片 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {categories.map(cat => {
          const count = archivedTasks.filter(t => t.categoryFolder === cat).length;
          const isOpen = openFolder === cat;
          return (
            <div
              key={cat}
              onClick={() => setOpenFolder(isOpen ? null : cat)}
              className={`cursor-pointer glass-panel rounded-2xl p-4 flex flex-col items-center justify-center transition-all ${
                isOpen ? 'ring-2 ring-sky-500/50 bg-white/90 scale-105' : 'hover:scale-[1.02]'
              }`}
            >
              {isOpen ? (
                <FolderOpen className="w-8 h-8 text-sky-500 mb-2" />
              ) : (
                <Folder className="w-8 h-8 text-slate-400 mb-2" />
              )}
              <span className="text-xs font-medium text-slate-700">{cat}</span>
              <span className="text-[10px] text-slate-400 mt-0.5">{count} 个归档</span>
            </div>
          );
        })}
      </div>

      {/* 文件夹内部展开明细 */}
      <div className="glass-panel rounded-3xl p-6">
        <div className="flex justify-between items-center mb-4">
          <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
            {openFolder ? `文件夹: ${openFolder}` : '全部已归档成就'}
          </span>
          <span className="text-xs text-slate-400">仅支持手动清理</span>
        </div>

        <div className="space-y-3">
          {archivedTasks
            .filter(item => !openFolder || item.categoryFolder === openFolder)
            .map(item => (
              <div key={item.id} className="p-4 rounded-2xl bg-white/70 border border-white/80 shadow-sm flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-sm font-medium text-slate-800 flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      {item.title}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      完成时间: {item.completedAt} · 所属: {item.categoryFolder}
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => handleUpdateNote(item.id)} className="p-1 text-slate-400 hover:text-slate-600">
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDeleteItem(item.id)} className="p-1 text-slate-400 hover:text-rose-500">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* 备注区域 */}
                <div className="text-xs bg-slate-50/80 rounded-xl p-2.5 text-slate-600 flex items-start gap-2">
                  <span className="text-slate-400 text-[10px] uppercase font-semibold">备注:</span>
                  <span className="flex-1">{item.userNote || '暂无心得备注，点击右上角铅笔添加'}</span>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
