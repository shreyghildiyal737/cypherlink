import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string }) {
    if (typeof console !== "undefined") {
      console.error("[ErrorBoundary]", error, info);
    }
  }

  handleReset = () => {
    this.setState({ error: null });
  };

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
        <div className="max-w-md text-center">
          <p className="font-headline-lg-mobile text-2xl font-semibold text-on-surface">
            The signal dropped.
          </p>
          <p className="mt-3 font-body-md text-on-surface-variant/50">
            Something on this page didn't load right. We're still here — try again or head back home.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={this.handleReset}
              className="rounded-full bg-primary px-5 py-2.5 font-label-sm text-sm font-semibold text-on-surface transition hover:brightness-110"
            >
              Try again
            </button>
            <a
              href="/home"
              className="rounded-full border border-white/[0.12] px-5 py-2.5 font-label-sm text-sm text-on-surface-variant/70 transition hover:border-white/[0.25]"
            >
              Go home
            </a>
          </div>
        </div>
      </div>
    );
  }
}
