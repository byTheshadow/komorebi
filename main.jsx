import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './core/ErrorBoundary.jsx'

// 全局沙盒容错：整个应用最外层兜底；各空间在 App.jsx 里还有各自的隔离舱
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary name="root">
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
