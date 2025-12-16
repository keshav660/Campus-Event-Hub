// src/components/ErrorBoundary.jsx
import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Log to console / external service
    console.error("ErrorBoundary caught an error:", error, info);
    this.setState({ info });
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24 }}>
          <h2>Something went wrong</h2>
          <p style={{ color: "#6b7280" }}>
            The app encountered an error. Try refreshing the page. If the issue persists,
            please contact support or check the browser console for details.
          </p>

          <details style={{ whiteSpace: "pre-wrap", marginTop: 12 }}>
            <summary style={{ cursor: "pointer" }}>Error details</summary>
            <pre style={{ fontSize: 12 }}>{String(this.state.error)}</pre>
            {this.state.info && <pre style={{ fontSize: 12 }}>{JSON.stringify(this.state.info, null, 2)}</pre>}
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}
