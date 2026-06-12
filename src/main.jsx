import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { runCatalogDiagnostics } from './utils/catalogDiagnostics'

// Запуск автоматической диагностики каталога при старте
runCatalogDiagnostics();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
