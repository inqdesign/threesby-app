import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from './supabase';

interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  factor?: number;
  onRetry?: (attempt: number, error: any) => void;
}

const defaultRetryOptions: RetryOptions = {
  maxRetries: 3,
  initialDelay: 500, // Start with 500ms delay
  maxDelay: 5000, // Maximum delay of 5 seconds
  factor: 2, // Exponential backoff factor
};

/**
 * Executes a Supabase query with retry logic for handling connection issues
 * @param queryFn Function that returns a Supabase query
 * @param options Retry options
 * @returns Result of the query
 */
export async function withRetry<T>(
  queryFn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...defaultRetryOptions, ...options };
  let lastError: any;
  let delay = opts.initialDelay!;

  for (let attempt = 0; attempt < opts.maxRetries! + 1; attempt++) {
    try {
      return await queryFn();
    } catch (error: any) {
      lastError = error;
      
      // Check if this is a network error (Failed to fetch)
      const isNetworkError = error?.message?.includes('Failed to fetch') || 
        error?.message?.includes('Network Error') ||
        error?.code === 'NETWORK_ERROR';
      
      // Don't retry if it's not a network error or we've reached max retries
      if (!isNetworkError || attempt >= opts.maxRetries!) {
        break;
      }
      
      // Call onRetry callback if provided
      if (opts.onRetry) {
        opts.onRetry(attempt + 1, error);
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Increase delay for next attempt using exponential backoff
      delay = Math.min(delay * opts.factor!, opts.maxDelay!);
    }
  }
  
  throw lastError;
}

/**
 * Checks if the Supabase connection is available
 * @returns True if connection is available, false otherwise
 */
export async function checkConnection(): Promise<boolean> {
  try {
    // Perform a lightweight query to check connection
    await supabase.from('health_check').select('count', { count: 'exact', head: true });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Enhanced Supabase client with retry logic
 */
export const enhancedSupabase = {
  from: (table: string) => {
    const query = supabase.from(table);
    
    // Enhance the select method with retry logic
    const originalSelect = query.select.bind(query);
    query.select = function(...args: any[]) {
      const selectQuery = originalSelect(...args);
      
      // Enhance the original execution with retry
      const originalExec = selectQuery.then.bind(selectQuery);
      selectQuery.then = function(onfulfilled, onrejected) {
        const retryPromise = withRetry(() => {
          const freshQuery = supabase.from(table).select(...args);
          return freshQuery.then(r => r);
        });
        
        return retryPromise.then(onfulfilled, onrejected);
      };
      
      return selectQuery;
    };
    
    // Similarly enhance other methods like insert, update, delete
    // (Implementation would be similar to select)
    
    return query;
  },
  // Add other methods as needed
};

/**
 * Utility function to handle Supabase errors consistently
 */
export function handleSupabaseError(error: any, fallbackMessage: string = 'An error occurred'): string {
  if (!error) return fallbackMessage;
  
  // Check for network errors
  if (error.message?.includes('Failed to fetch') || 
      error.message?.includes('Network Error') ||
      error.code === 'NETWORK_ERROR') {
    return 'Connection error. Please check your internet connection and try again.';
  }
  
  // Return Supabase error message if available
  if (error.message) {
    return error.message;
  }
  
  // Fallback to generic message
  return fallbackMessage;
}
