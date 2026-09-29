import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // <-- 加上这一行
import { App } from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
