class ErrorHandler {
  private maxRetries = 3;
  private retryDelay = 1000; // 1 second

  async withRetry<T>(
    operationName: string,
    operation: () => Promise<T>,
    retries: number = this.maxRetries
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (retries > 0) {
        console.warn(`${operationName} failed, retrying... (${retries} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        return this.withRetry(operationName, operation, retries - 1);
      }
      throw error;
    }
  }
}

export const errorHandler = new ErrorHandler();
