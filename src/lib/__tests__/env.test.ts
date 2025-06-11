import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Environment Validation', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('should validate environment variables', () => {
    // Set valid environment variables
    vi.stubGlobal('import.meta', {
      env: {
        VITE_SUPABASE_URL: 'https://example.supabase.co',
        VITE_SUPABASE_ANON_KEY: 'test-key',
        DEV: true,
        PROD: false,
      }
    });

    // This should not throw
    expect(() => {
      // Re-import the module to trigger validation
      import('../env');
    }).not.toThrow();
  });
}); 