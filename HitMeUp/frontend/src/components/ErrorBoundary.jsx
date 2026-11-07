import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("HitMeUp Caught React Error:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#FDFBF7] dark:bg-[#131209] text-[#1F1B16] dark:text-[#FDFBF7]">
          <div className="max-w-md w-full rounded-2xl border border-[#E6E0D6] dark:border-[#272727] bg-[#F7F4EE] dark:bg-[#181818] p-8 text-center shadow-lg">
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center text-xl font-bold">
              !
            </div>
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-sm text-[#7B7266] dark:text-[#A89F91] mb-6">
              A temporary render error occurred. Please reload the page to continue.
            </p>
            {this.state.error?.message && (
              <pre className="mb-6 p-3 rounded-lg bg-black/5 dark:bg-black/30 text-xs text-left overflow-auto text-red-600 dark:text-red-400 font-mono">
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={this.handleReload}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-[#D94832] px-6 text-sm font-medium text-white transition-colors hover:bg-[#C23B26] cursor-pointer"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
