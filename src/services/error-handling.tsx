import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import React from 'react';

export interface ErrorReport {
  error: Error;
  context: {
    operation: string;
    timestamp: string;
    userAgent: string;
    additionalInfo?: Record<string, any>;
  };
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  private retryAttempts: Map<string, number> = new Map();
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000; // 1 second

  private constructor() {}

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  async handleError(error: Error, operation: string, additionalInfo?: Record<string, any>): Promise<void> {
    console.error(`Error in ${operation}:`, error);

    // Create error report
    const errorReport: ErrorReport = {
      error,
      context: {
        operation,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        additionalInfo,
      },
    };

    // Show user-friendly error message
    this.showErrorMessage(error, operation);

    // Log error for analytics
    this.logError(errorReport);

    // Offer to report the error
    this.offerErrorReporting(errorReport);
  }

  private showErrorMessage(error: Error, operation: string): void {
    let userMessage = 'An error occurred. ';
    
    // Add operation-specific context
    switch (operation) {
      case 'file-upload':
        userMessage += 'Failed to upload file(s). ';
        break;
      case 'ai-analysis':
        userMessage += 'Failed to analyze project data. ';
        break;
      case 'prompt-generation':
        userMessage += 'Failed to generate optimized prompt. ';
        break;
      default:
        userMessage += `Failed to complete ${operation}. `;
    }

    // Add specific error details if available
    if (error.message) {
      userMessage += error.message;
    }

    toast({
      variant: "destructive",
      title: "Error",
      description: userMessage,
    });
  }

  private logError(errorReport: ErrorReport): void {
    // TODO: Implement error logging to backend/analytics service
    console.error('Error Report:', errorReport);
  }

  private offerErrorReporting(errorReport: ErrorReport): void {
    // Show toast with option to report error
    toast({
      variant: "default",
      title: "Help us improve",
      description: "Would you like to report this error to help us improve the application?",
      action: (
        <Button
          onClick={() => this.submitErrorReport(errorReport)}
          variant="default"
        >
          Report Error
        </Button>
      ),
    });
  }

  private async submitErrorReport(errorReport: ErrorReport): Promise<void> {
    try {
      // TODO: Implement error report submission to backend
      console.log('Submitting error report:', errorReport);
      
      toast({
        title: "Thank you!",
        description: "Your error report has been submitted successfully.",
      });
    } catch (error) {
      console.error('Failed to submit error report:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to submit error report. Please try again later.",
      });
    }
  }

  public async withRetry<T>(
    operation: string,
    fn: () => Promise<T>,
    additionalInfo?: Record<string, any>
  ): Promise<T> {
    const attemptKey = `${operation}-${Date.now()}`;
    let attempts = this.retryAttempts.get(attemptKey) || 0;

    try {
      return await fn();
    } catch (error) {
      attempts++;
      this.retryAttempts.set(attemptKey, attempts);

      if (attempts < this.MAX_RETRIES) {
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY * attempts));
        return this.withRetry(operation, fn, additionalInfo);
      }

      // Max retries reached, handle the error
      await this.handleError(error as Error, operation, additionalInfo);
      throw error;
    } finally {
      // Clean up retry attempts after a delay
      setTimeout(() => {
        this.retryAttempts.delete(attemptKey);
      }, 5000);
    }
  }
}

export const errorHandler = ErrorHandler.getInstance(); 