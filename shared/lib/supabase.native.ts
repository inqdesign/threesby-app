// Mock Supabase implementation for React Native
// This file replaces the real Supabase imports to prevent module errors

// Mock Supabase client
export const supabase = {
  auth: {
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    signUp: () => Promise.resolve({ data: null, error: null }),
    signIn: () => Promise.resolve({ data: null, error: null }),
    signOut: () => Promise.resolve({ error: null }),
    onAuthStateChange: () => ({ data: { subscription: null } })
  },
  storage: {
    from: () => ({
      upload: () => Promise.resolve({ data: null, error: null }),
      getPublicUrl: () => ({ data: { publicUrl: 'https://placeholder.com/image.jpg' } })
    })
  },
  from: () => ({
    select: () => ({
      eq: () => ({
        data: [],
        error: null
      })
    }),
    insert: () => Promise.resolve({ data: null, error: null }),
    update: () => Promise.resolve({ data: null, error: null }),
    delete: () => Promise.resolve({ data: null, error: null })
  }),
  realtime: null
};

// Mock upload functions
export async function uploadImage(): Promise<string> {
  console.log('Mock uploadImage called for React Native');
  return 'https://placeholder.com/mock-image.jpg';
}

export async function deleteImage(): Promise<void> {
  console.log('Mock deleteImage called for React Native');
} 