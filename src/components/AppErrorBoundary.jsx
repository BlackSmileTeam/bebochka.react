import { Component, lazy, Suspense } from 'react'
import RouteFallback from './RouteFallback'

const ServerError = lazy(() => import('../pages/ServerError'))

export default class AppErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error('App error boundary:', error, info)
  }

  handleRetry = () => {
    this.setState({ hasError: false })
  }

  render() {
    if (this.state.hasError) {
      return (
        <Suspense fallback={<RouteFallback />}>
          <ServerError onRetry={this.handleRetry} />
        </Suspense>
      )
    }
    return this.props.children
  }
}
