// Frontend React error boundary example (Remix/React)

import React from 'react'

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    // send error to backend for diagnostics
    fetch('/api/errors/report', { method: 'POST', body: JSON.stringify({ error: String(error), info }) })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div>
          <h2>Something went wrong</h2>
          <p>Please try refreshing the page or contact support.</p>
        </div>
      )
    }
    return this.props.children
  }
}
