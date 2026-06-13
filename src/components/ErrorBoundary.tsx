import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw, WifiOff, Terminal } from 'lucide-react';

interface Props {
  props?: any;
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Critical Workspace Panel Exception captured by Error Boundary:", error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center p-6 bg-zinc-950/90 border border-red-500/25 rounded-2xl shadow-[0_0_30px_rgba(239,68,68,0.1)] text-center max-w-2xl mx-auto my-12 backdrop-blur-md">
          <div className="h-14 w-14 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mb-5 animate-pulse">
            <AlertTriangle className="h-7 w-7 text-rose-500" />
          </div>

          <h2 className="text-lg font-mono font-bold tracking-tight text-white uppercase mb-2">
            Workspace Engine Hold
          </h2>
          
          <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/5 border border-amber-500/20 rounded-md text-amber-500 font-mono text-[10px] uppercase font-bold tracking-widest mb-6 animate-pulse">
            <WifiOff className="h-3.5 w-3.5" />
            ENDPOINT ENGINE CACHED: RECONNECTING TO STREAM...
          </div>

          <p className="text-xs text-zinc-400 font-sans leading-relaxed max-w-md mb-6">
            An unexpected transaction or connection interruption occurred. The workspace data layers are securely cached locally, and system recovery procedures have been initiated.
          </p>

          <div className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-left mb-6 font-mono text-[10px] text-zinc-500 relative overflow-hidden">
            <div className="absolute top-2 right-2 flex items-center gap-1 text-[8px] text-zinc-650 tracking-wider">
              <Terminal className="h-3 w-3" />
              STDOUT/ERR
            </div>
            <div className="text-zinc-400 font-bold mb-1 border-b border-zinc-850 pb-1 uppercase tracking-wider text-[9px]">DIAGNOSTIC LOG:</div>
            <div className="text-rose-400 font-semibold truncate">
              Err: {this.state.error?.message || "Internal Exception Signal"}
            </div>
            <div className="text-[9px] mt-2 text-zinc-500 max-h-[80px] overflow-y-auto font-mono scrollbar-thin">
              {this.state.errorInfo?.componentStack || "Callstack trace captured safely on-device."}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={this.handleReset}
              className="flex items-center gap-1.5 px-4 py-2 font-mono font-bold text-[11px] uppercase tracking-wide bg-amber-500 hover:bg-amber-450 border border-amber-500 text-black rounded-lg transition-all shadow-[0_0_12px_rgba(245,158,11,0.25)] hover:shadow-[0_0_15px_rgba(245,158,11,0.35)] cursor-pointer active:scale-95 duration-150"
            >
              <RefreshCcw className="h-3.5 w-3.5" />
              Reload Workspace
            </button>
            <button
              onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
              className="px-4 py-2 font-mono text-[11px] uppercase tracking-wide bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 rounded-lg transition-all cursor-pointer"
            >
              Suppress Error
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
