"use client";

import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { logger } from "@/lib/logger";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, info: unknown) {
    logger.error("ErrorBoundary caught", {
      message: error.message,
      stack: error.stack,
      info: info instanceof Error ? info.message : String(info),
    });
  }

  override render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center min-h-[300px] p-6">
          <div className="rounded-xl border p-6 max-w-2xl w-full text-center space-y-4">
            <div className="text-4xl">⚠️</div>
            <h2 className="text-lg font-semibold">Terjadi Kesalahan</h2>
            <p className="text-sm font-medium text-destructive break-words">
              {this.state.error?.message ?? "Terjadi kesalahan tak terduga."}
            </p>
            {this.state.error?.stack && (
              <details className="text-left">
                <summary className="cursor-pointer text-xs text-muted-foreground">
                  Detail error (untuk dilaporkan)
                </summary>
                <pre className="mt-2 max-h-48 overflow-auto rounded bg-muted p-2 text-[10px] leading-snug text-muted-foreground whitespace-pre-wrap">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
            <Button
              variant="outline"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
            >
              Coba Lagi
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
