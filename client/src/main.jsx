import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import './index.css';
import App from './App.jsx';
import AuthProvider from './context/AuthContext.jsx';
import ThemeProvider from './context/ThemeContext.jsx';
import { NotificationProvider } from './context/NotificationContext.jsx';
import { ChatProvider } from './context/ChatContext.jsx';
import { AIChatProvider } from './context/AIChatContext.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
  <NotificationProvider>
    <ChatProvider>
    <AIChatProvider>
    <App />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
            }}
          />
          </AIChatProvider>
          </ChatProvider>
  </NotificationProvider>
</AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
);
