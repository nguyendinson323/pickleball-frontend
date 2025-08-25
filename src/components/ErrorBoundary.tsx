/**
 * Error Boundary Component
 * 
 * This component provides comprehensive error handling for the entire application,
 * catching JavaScript errors anywhere in the component tree and displaying
 * a fallback UI instead of crashing the whole app.
 * 
 * @author Pickleball Federation Team
 * @version 2.0.0
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: this.generateErrorId()
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
      errorId: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console for debugging
    console.error('Error Boundary caught an error:', error, errorInfo);
    
    // Update state with error information
    this.setState({
      error,
      errorInfo,
      errorId: this.generateErrorId()
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to external service in production
    if (process.env.NODE_ENV === 'production') {
      this.logErrorToService(error, errorInfo);
    }
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private logErrorToService(error: Error, errorInfo: ErrorInfo) {
    try {
      // In production, you would send this to your error logging service
      // Example: Sentry, LogRocket, etc.
      console.log('Error logged to service:', {
        errorId: this.state.errorId,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString()
      });
    } catch (logError) {
      console.error('Failed to log error to service:', logError);
    }
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: this.generateErrorId()
    });
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleGoBack = () => {
    window.history.back();
  };

  private getErrorMessage(): string {
    if (!this.state.error) return 'An unexpected error occurred';
    
    // Provide user-friendly error messages
    const errorMessage = this.state.error.message;
    
    if (errorMessage.includes('Network Error') || errorMessage.includes('fetch')) {
      return 'Network connection error. Please check your internet connection and try again.';
    }
    
    if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
      return 'Authentication error. Please log in again.';
    }
    
    if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
      return 'Access denied. You don\'t have permission to perform this action.';
    }
    
    if (errorMessage.includes('404') || errorMessage.includes('Not Found')) {
      return 'The requested resource was not found.';
    }
    
    if (errorMessage.includes('500') || errorMessage.includes('Internal Server Error')) {
      return 'Server error. Please try again later.';
    }
    
    return errorMessage || 'An unexpected error occurred';
  }

  private getErrorType(): string {
    if (!this.state.error) return 'Unknown Error';
    
    const errorMessage = this.state.error.message;
    
    if (errorMessage.includes('Network Error') || errorMessage.includes('fetch')) {
      return 'Network Error';
    }
    
    if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
      return 'Authentication Error';
    }
    
    if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
      return 'Permission Error';
    }
    
    if (errorMessage.includes('404') || errorMessage.includes('Not Found')) {
      return 'Not Found Error';
    }
    
    if (errorMessage.includes('500') || errorMessage.includes('Internal Server Error')) {
      return 'Server Error';
    }
    
    return 'Application Error';
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            {/* Error Icon */}
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>

            {/* Error Title */}
            <h1 className="text-xl font-semibold text-gray-900 text-center mb-2">
              {this.getErrorType()}
            </h1>

            {/* Error Message */}
            <p className="text-gray-600 text-center mb-6">
              {this.getErrorMessage()}
            </p>

            {/* Error Details (Development Only) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-6 p-4 bg-gray-100 rounded-lg">
                <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2">
                  Error Details (Development)
                </summary>
                <div className="text-xs text-gray-600 space-y-2">
                  <div>
                    <strong>Error ID:</strong> {this.state.errorId}
                  </div>
                  <div>
                    <strong>Message:</strong> {this.state.error.message}
                  </div>
                  <div>
                    <strong>Stack:</strong>
                    <pre className="mt-1 text-xs overflow-x-auto">
                      {this.state.error.stack}
                    </pre>
                  </div>
                  {this.state.errorInfo && (
                    <div>
                      <strong>Component Stack:</strong>
                      <pre className="mt-1 text-xs overflow-x-auto">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col space-y-3">
              <button
                onClick={this.handleRetry}
                className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </button>
              
              <button
                onClick={this.handleGoBack}
                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </button>
              
              <button
                onClick={this.handleGoHome}
                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-50 transition-colors"
              >
                <Home className="h-4 w-4 mr-2" />
                Go Home
              </button>
            </div>

            {/* Support Information */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                If this problem persists, please contact support.
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Error ID: {this.state.errorId}
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 