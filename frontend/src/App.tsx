import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import AppRoutes from './routes/AppRoutes';
import Toast from './components/common/Toast';
import ErrorBoundary from './components/common/ErrorBoundary';
import ScrollToTop from './components/common/ScrollToTop';
import './App.css';

/**
 * ProfessorMind AI - Main Application Shell
 * 
 * Responsibilities:
 * - Wraps the application in global state management (AppProvider).
 * - Initializes client-side routing (BrowserRouter) for seamless navigation.
 * - Applies global error boundaries to prevent full app crashes.
 * - Manages global UI overlays (Toasts, Modals).
 */
function App() {
  return (
    <AppProvider>
      <ErrorBoundary>
        <BrowserRouter>
          {/* Resets scroll position to top on every route change */}
          <ScrollToTop />
          
          {/* Main Application Routes */}
          <AppRoutes />
          
          {/* Global Toast Notification Container */}
          <Toast />
        </BrowserRouter>
      </ErrorBoundary>
    </AppProvider>
  );
}

export default App;