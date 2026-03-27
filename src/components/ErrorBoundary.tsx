'use client';

import React from 'react';

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Syndicate Neural Crash:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full w-full bg-black flex flex-col items-center justify-center p-10 border-l border-white/10 text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center mb-6">
             <span className="text-2xl">⚠️</span>
          </div>
          <h3 className="text-xl font-syncopate font-black uppercase italic text-white mb-2">Neural Leak Detected</h3>
          <p className="text-[10px] text-white/40 uppercase tracking-widest max-w-[200px]">The link to this identity has desynchronized. Purging cache...</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-8 px-6 py-3 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-xl"
          >
            Re-Establish Link
          </button>
          {process.env.NODE_ENV === 'development' && (
            <pre className="mt-10 p-4 bg-zinc-900 border border-white/5 rounded-xl text-[8px] text-red-400 text-left overflow-auto max-w-xs whitespace-pre-wrap">
              {this.state.error?.message}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
