import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message || "Something went wrong" };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("Unhandled UI error:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
          <div className="bg-white rounded-lg shadow p-8 max-w-md text-center">
            <h1 className="text-lg font-semibold text-gray-800 mb-2">Something went wrong</h1>
            <p className="text-sm text-gray-500 mb-4">{this.state.message}</p>
            <button
              type="button"
              onClick={() => window.location.assign("/dashboard")}
              className="text-sm bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Back to dashboard
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
