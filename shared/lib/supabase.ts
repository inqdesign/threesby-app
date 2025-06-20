import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';
import { getSupabaseStorageKey } from './authUtils';
import { env } from './env';

// Helper function to compress images and convert to WebP
async function compressImage(file: File): Promise<File | null> {
  return new Promise((resolve) => {
    try {
      // Create an image element to load the file
      const img = new Image();
      const reader = new FileReader();
      
      reader.onload = (e) => {
        img.src = e.target?.result as string;
        
        img.onload = () => {
          // Create a canvas to resize and compress the image
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Calculate new dimensions while maintaining aspect ratio
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          
          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round(height * (MAX_WIDTH / width));
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round(width * (MAX_HEIGHT / height));
              height = MAX_HEIGHT;
            }
          }
          
          // Set canvas dimensions
          canvas.width = width;
          canvas.height = height;
          
          // Draw image on canvas
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(null);
            return;
          }
          
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to WebP with quality setting
          canvas.toBlob((blob) => {
            if (!blob) {
              resolve(null);
              return;
            }
            
            // Create a new File object from the blob
            const compressedFile = new File([blob], 'compressed-image.webp', {
              type: 'image/webp',
              lastModified: Date.now()
            });
            
            resolve(compressedFile);
          }, 'image/webp', 0.85); // 0.85 quality (85%)
        };
      };
      
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error compressing image:', error);
      resolve(null);
    }
  });
}

// Use validated environment variables
const { supabaseUrl, supabaseAnonKey } = env;

/**
 * Supabase client with optimized configuration for robust auth persistence:
 * - persistSession: Ensures session is saved to storage
 * - autoRefreshToken: Automatically refreshes token before expiry
 * - detectSessionInUrl: Enabled for OAuth flows
 * - storage: Uses browser's localStorage for session persistence
 * - storageKey: Custom key for better identification in localStorage
 * - flowType: PKCE flow for better security
 */
// Get the actual storage key that Supabase is using
const SUPABASE_STORAGE_KEY = getSupabaseStorageKey();

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: localStorage,
    // Use the dynamically generated storage key to match what Supabase is actually using
    storageKey: SUPABASE_STORAGE_KEY,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'x-app-version': '1.0.0',
    },
  }
});

export async function uploadImage(file: File, userId: string): Promise<string> {
  if (!file) {
    throw new Error('No file provided for upload');
  }
  
  if (file.size > 5 * 1024 * 1024) { // 5MB
    throw new Error('Image size must be less than 5MB');
  }

  // Create a unique filename
  const timestamp = new Date().getTime();
  const randomString = Math.random().toString(36).substring(2, 15);
  
  // Use the original file extension instead of forcing WebP
  const fileExtension = file.name.split('.').pop() || 'jpg';
  const filePath = `${userId}/${timestamp}-${randomString}.${fileExtension}`;
  
  // Use the original file without compression to ensure compatibility
  const fileToUpload = file;

  try {
    // First check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User must be authenticated to upload images');
    }

    console.log('Uploading file to Supabase storage:', {
      bucket: 'picks',
      filePath,
      contentType: file.type,
      fileSize: file.size
    });

    // Upload the file to Supabase storage
    const { error: uploadError, data } = await supabase.storage
      .from('picks')
      .upload(filePath, fileToUpload, {
        cacheControl: '3600',
        upsert: true, // Use upsert to overwrite if file exists
        contentType: file.type // Use the original content type
      });

    if (uploadError) {
      console.error('Supabase storage upload error:', uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    if (!data) {
      throw new Error('No data returned from upload');
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('picks')
      .getPublicUrl(filePath);

    if (!urlData) {
      throw new Error('Failed to get public URL');
    }
    
    console.log('Image uploaded successfully, public URL:', urlData.publicUrl);
    
    // Return the full public URL
    return urlData.publicUrl;
  } catch (error) {
    // Log the detailed error for debugging
    console.error('Error uploading image:', error);
    
    // Preserve the original error message if it's an Error object
    if (error instanceof Error) {
      throw error;
    } else {
      // Otherwise create a new error with a generic message
      throw new Error('Failed to upload image. Please try again.');
    }
  }
}

// Function to upload collection cover images
export async function uploadCollectionCover(dataUrl: string, userId: string): Promise<string> {
  try {
    // Convert data URL to File object
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    const file = new File([blob], 'collection-cover.webp', { type: 'image/webp' });
    
    // Create a unique filename with WebP extension
    const timestamp = new Date().getTime();
    const randomString = Math.random().toString(36).substring(2, 15);
    const filePath = `collections/${userId}/${timestamp}-${randomString}.webp`;
    
    // Compress and convert the image to WebP format
    const compressedFile = await compressImage(file);
    if (!compressedFile) {
      throw new Error('Failed to compress image');
    }
    
    // First check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User must be authenticated to upload images');
    }
    
    // Create the collections bucket if it doesn't exist
    const { data: buckets } = await supabase.storage.listBuckets();
    if (!buckets?.find(bucket => bucket.name === 'collections')) {
      await supabase.storage.createBucket('collections', {
        public: true
      });
    }
    
    // Upload the image to Supabase storage
    const { error: uploadError, data } = await supabase.storage
      .from('collections')
      .upload(filePath, compressedFile, {
        cacheControl: '3600',
        upsert: false,
        contentType: 'image/webp'
      });
    
    if (uploadError) {
      console.error('Supabase storage upload error:', uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }
    
    if (!data) {
      throw new Error('No data returned from upload');
    }
    
    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('collections')
      .getPublicUrl(filePath);
    
    if (!urlData) {
      throw new Error('Failed to get public URL');
    }
    
    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading collection cover:', error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('Failed to upload collection cover. Please try again.');
    }
  }
}

export function getImageUrl(path: string): string {
  if (!path) return 'https://via.placeholder.com/400x400?text=No+Image';
  
  // If it's already a full URL, return as is
  if (path.startsWith('http')) {
    return path;
  }

  try {
    // Get public URL from Supabase
    const { data } = supabase.storage
      .from('picks')
      .getPublicUrl(path);

    return data.publicUrl;
  } catch (error) {
    console.error('Error getting image URL:', error);
    return 'https://via.placeholder.com/400x400?text=Error+Loading+Image';
  }
}