'use client';

import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface LLMErrorProps {
  error: Error | string;
  provider?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export function LLMError({
  error,
  provider,
  onRetry,
  onDismiss,
}: LLMErrorProps) {
  const errorMessage = typeof error === 'string' ? error : error.message;

  // Detect error type and provide specific guidance
  const getErrorDetails = () => {
    const msg = errorMessage.toLowerCase();

    if (msg.includes('rate limit') || msg.includes('429')) {
      return {
        title: 'Rate Limit Exceeded',
        description: `The ${provider || 'LLM'} API has rate limited your requests. Please wait a few moments and try again.`,
        suggestion: 'Consider upgrading your API plan for higher rate limits.',
        canRetry: true,
      };
    }

    if (msg.includes('quota') || msg.includes('insufficient')) {
      return {
        title: 'Quota Exceeded',
        description: `Your ${provider || 'LLM'} API quota has been exceeded.`,
        suggestion:
          'Check your API usage in your provider dashboard and add credits if needed.',
        canRetry: false,
      };
    }

    if (
      msg.includes('invalid') ||
      msg.includes('unauthorized') ||
      msg.includes('401')
    ) {
      return {
        title: 'Authentication Error',
        description: `The ${provider || 'LLM'} API key is invalid or has expired.`,
        suggestion:
          'Please update your API key in Settings > LLM Configuration.',
        canRetry: false,
      };
    }

    if (msg.includes('timeout') || msg.includes('timed out')) {
      return {
        title: 'Request Timeout',
        description: `The request to ${provider || 'the LLM provider'} took too long and timed out.`,
        suggestion:
          'This is usually temporary. Try again in a few moments.',
        canRetry: true,
      };
    }

    if (
      msg.includes('context length') ||
      msg.includes('token limit') ||
      msg.includes('too long')
    ) {
      return {
        title: 'Content Too Long',
        description:
          'The feature description or template is too long for the model to process.',
        suggestion:
          'Try shortening your feature description or using a different template.',
        canRetry: false,
      };
    }

    // Generic error
    return {
      title: 'Generation Failed',
      description: errorMessage,
      suggestion:
        'Please check your internet connection and API configuration.',
      canRetry: true,
    };
  };

  const details = getErrorDetails();

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-6">
      <div className="flex">
        <div className="flex-shrink-0">
          <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">
            {details.title}
          </h3>
          <div className="mt-2 text-sm text-red-700">
            <p>{details.description}</p>
          </div>
          {details.suggestion && (
            <div className="mt-3 text-sm text-red-700">
              <p>
                <strong>Suggestion:</strong> {details.suggestion}
              </p>
            </div>
          )}
          <div className="mt-4 flex space-x-3">
            {details.canRetry && onRetry && (
              <Button
                onClick={onRetry}
                variant="outline"
                size="sm"
                className="inline-flex items-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Try Again</span>
              </Button>
            )}
            {onDismiss && (
              <Button onClick={onDismiss} variant="ghost" size="sm">
                Dismiss
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
