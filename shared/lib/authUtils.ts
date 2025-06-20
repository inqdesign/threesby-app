/**
 * Utility functions for authentication
 */

/**
 * Gets the storage key that Supabase uses for the auth token
 * This dynamically generates the key based on the Supabase URL
 * to ensure consistency across the application
 */
export const getSupabaseStorageKey = (): string => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl) {
    console.error('Missing Supabase URL in environment variables');
    return 'sb-auth-token'; // Fallback
  }
  
  try {
    // Extract the project reference from the URL
    // Format: sb-{project-ref}-auth-token
    const projectRef = supabaseUrl.split('//')[1].split('.')[0];
    return `sb-${projectRef}-auth-token`;
  } catch (error) {
    console.error('Error generating Supabase storage key:', error);
    return 'sb-auth-token'; // Fallback
  }
};
