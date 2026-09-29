import React, { Component, type ReactNode } from 'react';

interface Props {
  name: string;
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class SandboxErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 my-2 rounded-2xl bg-white/40 backdrop-blur-md border border-red-200/50 text-slate-600 text-xs">
          <p className="font-medium text-slate-800">沙盒 [{this.props.name}] 遇到了小问题</p>
          <p className="mt-1 text-slate-400">其他功能运作正常。数据安全已落盘。</p>
          <button 
            onClick={() => this.setState({ hasError: false })}
            className="mt-2 px-3 py-1 bg-white/80 rounded-lg text-slate-700 text-xs border border-slate-200 hover:bg-white"
          >
            重试加载
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
