// ─── Error Boundary ───
// Catches React rendering errors to prevent white-screen crashes.

import React, { Component, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('[ErrorBoundary] Uncaught error:', error, errorInfo.componentStack);
  }

  private handleReload = (): void => {
    window.location.reload();
  };

  private handleReturnToMenu = (): void => {
    this.setState({ hasError: false, error: null });
    window.location.hash = '';
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#1a1a2e',
            color: '#e0e0e0',
            fontFamily: "'Courier New', monospace",
            padding: '2rem',
            zIndex: 99999,
          }}
        >
          <h1 style={{ color: '#e74c3c', fontSize: '2rem', marginBottom: '1rem' }}>
            Something went wrong
          </h1>
          <p style={{ color: '#aaa', marginBottom: '0.5rem', maxWidth: '600px', textAlign: 'center' }}>
            The game encountered an unexpected error. This has been logged.
          </p>
          <pre
            style={{
              background: '#0d0d1a',
              padding: '1rem',
              borderRadius: '8px',
              maxWidth: '600px',
              maxHeight: '200px',
              overflow: 'auto',
              fontSize: '0.8rem',
              color: '#e74c3c',
              marginBottom: '1.5rem',
              width: '100%',
            }}
          >
            {this.state.error?.message ?? 'Unknown error'}
          </pre>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={this.handleReload}
              style={{
                padding: '0.75rem 1.5rem',
                fontSize: '1rem',
                backgroundColor: '#e74c3c',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Reload Game
            </button>
            <button
              onClick={this.handleReturnToMenu}
              style={{
                padding: '0.75rem 1.5rem',
                fontSize: '1rem',
                backgroundColor: '#333',
                color: '#fff',
                border: '1px solid #555',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Return to Menu
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}