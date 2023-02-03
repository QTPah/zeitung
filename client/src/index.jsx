import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'


import { AuthProvider } from "./contexts/AuthContext/AuthContext";
import { ThemeProvider } from './contexts/ThemeContext/ThemeContext';
import { ApiProvider } from './contexts/ApiContext/ApiContext';



ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <ApiProvider>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </ApiProvider>
    </AuthProvider>
  </React.StrictMode>,
)