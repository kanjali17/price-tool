import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { initAmplitude } from './analytics/amplitude'
import App from './App.tsx'
import './index.css'

initAmplitude()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
