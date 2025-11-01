import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, XCircle, Copy, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

export interface ErrorMessageProps {
  title?: string;
  message: string;
  type?: 'error' | 'warning' | 'info' | 'cors';
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
  showIcon?: boolean;
  retryLabel?: string;
  details?: string; // Added for the stream URL
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
  cors: {
    container: 'bg-orange-500/10 border-orange-500/20',
    icon: 'text-orange-500',
    text: 'text-orange-700 dark:text-orange-400',
    IconComponent: XCircle, // Using XCircle to indicate a block/error
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
  details,
}: ErrorMessageProps) {
  const styles = typeStyles[type];
  const IconComponent = styles.IconComponent;

  const handleCopyUrl = async () => {
    if (details) {
      try {
        await navigator.clipboard.writeText(details);
        toast.success('Stream URL copied to clipboard!');
      } catch (err) {
        console.error('Failed to copy URL: ', err);
        toast.error('Failed to copy URL.');
      }
    }
  };

  // Special rendering for CORS errors
  if (type === 'cors') {
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
              <h3 className={cn('font-semibold mb-2', styles.text)}>{title}</h3>
            )}
            <p className={cn('text-sm mb-4', styles.text)}>{message}</p>
            
            {/* Actionable buttons for CORS error */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyUrl}
                className="gap-2"
              >
                <Copy className="w-4 h-4" />
                Copy Stream URL
              </Button>
              <Button
                variant="outline"
                size="sm"
                asChild
              >
                <a href="https://www.videolan.org/vlc/" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4" />
                  Get VLC Player
                </a>
              </Button>
              {onRetry && (
                <Button
                  variant="ghost"
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
            <p className="text-xs text-muted-foreground mt-3">
              💡 Tip: Pasting the URL in a desktop player like VLC often bypasses this browser limitation.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Default rendering for other error types
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
