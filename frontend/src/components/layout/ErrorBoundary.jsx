import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Button from '../ui/Button';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('RapidAid UI Error Caught:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-6 text-slate-100">
          <div className="max-w-md w-full bg-[#1E293B]/80 backdrop-blur-xl border border-red-500/30 rounded-2xl p-8 shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 bg-red-950/80 border border-red-500/50 rounded-2xl flex items-center justify-center mx-auto text-red-500 shadow-lg shadow-red-900/30">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white">Something went wrong</h2>
              <p className="text-sm text-slate-400 mt-2">
                An unexpected UI rendering issue occurred in the dispatch telemetry view.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-left text-xs font-mono text-red-400 overflow-x-auto max-h-32">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <Button variant="outline" size="md" icon={Home} onClick={() => (window.location.href = '/')}>
                Go Home
              </Button>
              <Button variant="primary" size="md" icon={RefreshCw} onClick={this.handleReset}>
                Reload Application
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
