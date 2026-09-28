import { StrictMode, Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

// ==================================================
// Global Error Boundary (Rule 17: Graceful Error Handling)
// ==================================================

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class GlobalErrorBoundary extends Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // In a production environment, integrate with Sentry, LogRocket, etc.
    console.error('ProfessorMind AI | Global Error Boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Inline styles ensure the fallback UI renders beautifully 
      // even if global CSS fails to load or is blocked.
      return (
        <div
          style={{
            display: 'flex',
            minHeight: '100vh',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f8fafc',
            padding: '2rem',
            textAlign: 'center',
            fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
            color: '#0f172a',
          }}
        >
          <div
            style={{
              maxWidth: '28rem',
              borderRadius: '1.5rem',
              backgroundColor: '#ffffff',
              padding: '2.5rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02)',
              border: '1px solid #e2e8f0',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                margin: '0 auto 1.5rem',
                borderRadius: '9999px',
                backgroundColor: '#fee2e2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ef4444',
                fontSize: '24px',
                fontWeight: 'bold',
              }}
            >
              !
            </div>
            <h1
              style={{
                marginBottom: '0.75rem',
                fontSize: '1.5rem',
                fontWeight: 700,
                letterSpacing: '-0.025em',
                color: '#0f172a',
              }}
            >
              Application Error
            </h1>
            <p
              style={{
                marginBottom: '2rem',
                fontSize: '0.95rem',
                lineHeight: 1.6,
                color: '#64748b',
              }}
            >
              ProfessorMind AI encountered an unexpected issue. 
              Please refresh the page to restore your session.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                borderRadius: '0.75rem',
                backgroundColor: '#0f172a',
                padding: '0.75rem 2rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 6px -1px rgba(15, 23, 42, 0.1)',
              }}
              onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseOut={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              Refresh Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ==================================================
// Application Bootstrap & Mounting
// ==================================================

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error(
    'Root element not found. Ensure index.html contains <div id="root"></div>.'
  );
}

// Enhance body for premium app-like feel (Rule 7 & 13)
document.body.classList.add('antialiased', 'scroll-smooth', 'overflow-x-hidden');

// Prevent default touch behaviors that break app-like scrolling on mobile
document.body.style.overscrollBehavior = 'none';

const root = createRoot(rootElement);

root.render(
  <StrictMode>
    <GlobalErrorBoundary>
      <App />
    </GlobalErrorBoundary>
  </StrictMode>
);