/**
 * Helper functions for API calls and error handling
 */

import { PostgrestError } from '@supabase/supabase-js';

/**
 * Options for the withRetry function
 */
export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  onRetry?: (attempt: number, error: any) => void;
}

/**
 * Retry a function with exponential backoff
 * @param fn Function to retry
 * @param options Retry options
 * @returns Promise that resolves with the result of the function
 */
export async function withRetry<T>(
  fn: (attempt: number) => Promise<T>,
  options?: RetryOptions | number
): Promise<T> {
  // Handle legacy usage where second parameter was maxRetries
  let maxRetries = 3;
  let initialDelay = 500;
  let maxDelay = 30000;
  let onRetry: ((attempt: number, error: any) => void) | undefined = undefined;
  
  if (typeof options === 'number') {
    maxRetries = options;
  } else if (options) {
    maxRetries = options.maxRetries ?? maxRetries;
    initialDelay = options.initialDelay ?? initialDelay;
    maxDelay = options.maxDelay ?? maxDelay;
    onRetry = options.onRetry;
  }
  
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn(attempt);
    } catch (error) {
      lastError = error as Error;
      
      // Calculate delay with exponential backoff
      const delay = Math.min(initialDelay * Math.pow(2, attempt - 1), maxDelay);
      
      // Add some jitter to prevent all retries happening at the same time
      const jitter = Math.random() * 100;
      
      // Call onRetry callback if provided
      if (onRetry) {
        onRetry(attempt, error);
      } else {
        console.log(`Retry attempt ${attempt}/${maxRetries} after ${delay + jitter}ms`);
      }
      
      // Wait before next retry
      await new Promise(resolve => setTimeout(resolve, delay + jitter));
    }
  }
  
  // If we get here, all retries failed
  throw lastError || new Error('All retry attempts failed');
}

/**
 * Handle Supabase errors in a consistent way
 * @param error PostgrestError or any other error
 * @returns Formatted error message
 */
export function handleSupabaseError(error: PostgrestError | Error | unknown): string {
  if (!error) return 'An unknown error occurred';
  
  // Handle PostgrestError
  if (typeof error === 'object' && error !== null && 'message' in error && 'code' in error) {
    const pgError = error as PostgrestError;
    
    // Handle specific error codes
    switch (pgError.code) {
      case '23505':
        return 'This record already exists.';
      case '23503':
        return 'This operation references a record that does not exist.';
      case '42P01':
        return 'The requested table does not exist.';
      case '42703':
        return 'The requested column does not exist.';
      default:
        return pgError.message || 'Database error occurred';
    }
  }
  
  // Handle standard Error objects
  if (error instanceof Error) {
    return error.message;
  }
  
  // Handle unknown errors
  return 'An unexpected error occurred';
}
