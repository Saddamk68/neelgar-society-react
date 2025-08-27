import React from "react";

type Props = { children: React.ReactNode };
type State = { hasError: boolean };

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: any, info: any) {
    // You can later send this to telemetry/logging
    // console.error("ErrorBoundary caught:", error, info);
  }
  handleReload = () => {
    this.setState({ hasError: false });
    // In a real app you might also reset app state or navigate.
    window.location.reload();
  };
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-text-primary p-6">
          <div className="bg-white rounded-xl shadow px-6 py-8 max-w-md text-center">
            <h1 className="text-xl font-semibold mb-2">Something went wrong</h1>
            <p className="text-text-muted mb-6">
              An unexpected error occurred. Please try again.
            </p>
            <button
              onClick={this.handleReload}
              className="px-4 py-2 rounded-md bg-primary text-white shadow-sm hover:shadow transition"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
