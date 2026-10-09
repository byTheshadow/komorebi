import { Component } from 'react'

const COPY = {
  zh: { title: '这一块出了点小问题', body: '其他部分不受影响，你的数据也都还在。', retry: '重新加载此页', home: '回到主页' },
  en: { title: 'This part hit a snag', body: 'Everything else is fine and your data is safe.', retry: 'Reload this page', home: 'Back to home' },
}

/** 沙盒隔离舱：某个空间渲染崩了，只在该空间显示降级界面，其他空间照常工作 */
export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error(`[komorebi] space "${this.props.name || 'root'}" crashed`, error, info?.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    const c = COPY[document.documentElement.lang?.startsWith('zh') ? 'zh' : 'en']
    return (
      <div className="flex h-full items-center justify-center px-8">
        <div className="glass w-full max-w-sm rounded-3xl p-6 text-center">
          <div className="text-[16px] font-medium text-ink">{c.title}</div>
          <p className="mt-2 text-[13px] leading-relaxed text-muted">{c.body}</p>
          <p className="selectable mt-3 break-words rounded-xl bg-white/50 px-3 py-2 text-left text-[11px] text-faint">
            {String(this.state.error?.message || this.state.error)}
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <button className="btn-soft" onClick={() => this.setState({ error: null })}>{c.retry}</button>
            {this.props.onHome && (
              <button className="btn-primary" onClick={() => { this.setState({ error: null }); this.props.onHome() }}>{c.home}</button>
            )}
          </div>
        </div>
      </div>
    )
  }
}
