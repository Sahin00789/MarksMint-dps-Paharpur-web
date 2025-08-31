import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, unstable_HistoryRouter as HistoryRouter } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import App from './App'
import './index.css'
import { ThemeProvider } from './contexts/ThemeContext'


const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      >
      <ThemeProvider>
        <App />
        </ThemeProvider>
        <ToastContainer position="top-right" autoClose={3000} />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
)
