import { Component } from 'react'
import { FiAlertTriangle, FiRefreshCw } from 'react-icons/fi'

class ErrorBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  handleRetry = () => {
    this.setState({ hasError: false })
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-cream px-5 py-16">
        <div className="max-w-md text-center">
          <FiAlertTriangle className="mx-auto text-5xl text-primary-hover" />
          <h1 className="mt-5 font-heading text-3xl font-bold text-dark">কিছু ভুল হয়েছে</h1>
          <p className="mt-3 leading-7 text-dark-muted">
            এই অংশটি দেখাতে সমস্যা হয়েছে। আবার চেষ্টা করুন।
          </p>
          <button type="button" onClick={this.handleRetry} className="mt-6 inline-flex items-center gap-2 rounded-lg bg-dark px-5 py-3 font-semibold text-white transition hover:bg-dark-gray">
            <FiRefreshCw /> আবার চেষ্টা করুন
          </button>
        </div>
      </div>
    )
  }
}

export default ErrorBoundary
