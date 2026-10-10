import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
  reference: string;
}

class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: "", reference: "" };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: error.message || "Something went wrong",
      reference: `UI-${Date.now().toString(36).toUpperCase()}`,
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("Unhandled UI error:", error, info.componentStack);
    window.dispatchEvent(new CustomEvent("clinic:ui-error", {
      detail: {
        reference: this.state.reference,
        message: error.message,
        componentStack: info.componentStack,
      },
    }));
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
          <div className="bg-white rounded-lg shadow p-8 max-w-md text-center">
            <h1 className="text-lg font-semibold text-gray-800 mb-2">Something went wrong</h1>
            <p className="text-sm text-gray-500">
              The page could not continue safely. Your reference is{" "}
              <strong>{this.state.reference}</strong>.
            </p>
            {import.meta.env.DEV && (
              <p className="mt-2 break-words text-xs text-gray-400">{this.state.message}</p>
            )}
            <div className="mt-5 flex justify-center gap-2">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="rounded border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Reload Page
              </button>
              <button
                type="button"
                onClick={() => window.location.assign("/dashboard")}
                className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
              >
                Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
