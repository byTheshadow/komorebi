import React from 'react';

export class SandboxBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error(`[Sandbox Error in ${this.props.name || 'Component'}]:`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 my-2 rounded-2xl bg-white/40 backdrop-blur-md border border-red-200/50 text-slate-600 text-xs">
          <div className="font-semibold text-rose-500 mb-1">
            [{this.props.name || '当前模块'} 维护隔离中]
          </div>
          <div className="text-slate-400">
            该沙盒组件暂时遇到问题，其他功能不受影响。修复代码即可自动恢复。
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
