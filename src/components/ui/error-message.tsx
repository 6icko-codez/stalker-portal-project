import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, XCircle } from 'lucide-react';

export interface ErrorMessageProps {
  title?: string;
  message: string;
  type?: 'error' | 'warning' | 'info';
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
  showIcon?: boolean;
  retryLabel?: string;
}

const typeStyles = {
  error: {
    container: 'bg-red-500/10 border-red-500/20',
    icon: 'text-red-500',
    text: 'text-red-700 dark:text-red-400',
    IconComponent: XCircle,
  },
  warning: {
    container: 'bg-yellow-500/10 border-yellow-500/20',
    icon: 'text-yellow-500',
    text: 'text-yellow-700 dark:text-yellow-400',
    IconComponent: AlertCircle,
  },
  info: {
    container: 'bg-blue-500/10 border-blue-500/20',
    icon: 'text-blue-500',
    text: 'text-blue-700 dark:text-blue-400',
    IconComponent: AlertCircle,
  },
};

export function ErrorMessage({
  title,
  message,
  type = 'error',
  onRetry,
  onDismiss,
  className,
  showIcon = true,
  retryLabel = 'Try Again',
}: ErrorMessageProps) {
  const styles = typeStyles[type];
  const IconComponent = styles.IconComponent;

  return (
    <div
      className={cn(
        'rounded-lg border p-4 backdrop-blur-sm',
        styles.container,
        className
      )}
      role="alert"
    >
      <div className="flex items-start gap-3">
        {showIcon && (
          <IconComponent className={cn('w-5 h-5 flex-shrink-0 mt-0.5', styles.icon)} />
        )}
        <div className="flex-1 min-w-0">
          {title && (
            <h3 className={cn('font-semibold mb-1', styles.text)}>{title}</h3>
          )}
          <p className={cn('text-sm', styles.text)}>{message}</p>
          {(onRetry || onDismiss) && (
            <div className="flex items-center gap-2 mt-3">
              {onRetry && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRetry}
                  className="gap-2"
                >
                  <RefreshCw className="w-3 h-3" />
                  {retryLabel}
                </Button>
              )}
              {onDismiss && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDismiss}
                >
                  Dismiss
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
