import React, { useState } from 'react';
import { Calendar as CalendarIcon, Clock, Plus, Upload, Repeat } from 'lucide-react';

export default function CalendarSpace() {
  const [viewMode, setViewMode] = useState('week'); // 'week' | 'month'
  const [countdownEvent, setCountdownEvent] = useState({ title: '重要考试 / 里程碑', days: 12 });
  const [intervalTask, setIntervalTask] = useState({ title: '每 2 小时提醒喝水与远眺', hours: 2, enabled: true });

  const handleImportTimetable = () => {
    alert('课表导入器：支持导入 .ics 日历通用格式或粘贴文本课表解析。地基已就绪。');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-28">
      {/* 视图切换与倒数日卡片 */}
      <div className="glass-panel rounded-3xl p-5 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">倒数日追踪</div>
          <div className="text-base font-medium text-slate-800 flex items-center gap-2">
            <span>{countdownEvent.title}</span>
            <span className="px-2 py-0.5 bg-rose-50 text-rose-600 rounded-full text-xs font-semibold">
              还有 {countdownEvent.days} 天
            </span>
          </div>
        </div>

        <div className="flex bg-slate-100/80 p-1 rounded-2xl">
          <button
            onClick={() => setViewMode('week')}
            className={`px-4 py-1.5 text-xs rounded-xl transition-all ${
              viewMode === 'week' ? 'bg-white shadow text-slate-800 font-medium' : 'text-slate-500'
            }`}
          >
            周视图
          </button>
          <button
            onClick={() => setViewMode('month')}
            className={`px-4 py-1.5 text-xs rounded-xl transition-all ${
              viewMode === 'month' ? 'bg-white shadow text-slate-800 font-medium' : 'text-slate-500'
            }`}
          >
            月视图
          </button>
        </div>
      </div>

      {/* 周期性任务 (每 x 小时间隔提醒) */}
      <div className="glass-panel rounded-3xl p-5">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
            <Repeat className="w-3.5 h-3.5 text-sky-500" /> 循环周期与间隔提醒
          </span>
          <button className="text-xs text-sky-600 flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" /> 新建间隔
          </button>
        </div>

        <div className="p-3 bg-white/70 rounded-2xl border border-white/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>{intervalTask.title}</span>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-medium">运行中</span>
        </div>
      </div>

      {/* 课表与日程导入入口 */}
      <div className="glass-panel rounded-3xl p-6 text-center">
        <CalendarIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <h4 className="text-sm font-medium text-slate-700">课表与日历集成</h4>
        <p className="text-xs text-slate-400 mt-1 mb-4">
          支持一键导入教务课表、设定每周重复课程与教室地点提醒
        </p>
        <button
          onClick={handleImportTimetable}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-white rounded-2xl text-xs hover:bg-slate-700 active:scale-95 transition-all shadow-sm"
        >
          <Upload className="w-3.5 h-3.5" /> 导入课表 / ics 日历文件
        </button>
      </div>
    </div>
  );
}
