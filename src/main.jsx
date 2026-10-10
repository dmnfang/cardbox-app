import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './clr.css'
import App from './App.jsx'
import { initStableViewportHeight } from './lib/stableViewport'

initStableViewportHeight()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)