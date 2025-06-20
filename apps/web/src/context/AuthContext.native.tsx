import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import type { Profile } from '../types';

// Simple auth context for React Native
interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // For now, let's create a mock user to test the UI
  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      // Mock user for testing
      const mockUser: User = {
        id: 'mock-user-id',
        email: 'test@example.com',
        aud: 'authenticated',
        role: 'authenticated',
        app_metadata: {},
        user_metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as User;

      const mockProfile: Profile = {
        id: 'mock-user-id',
        email: 'test@example.com',
        full_name: 'Test User',
        username: 'testuser',
        avatar_url: null,
        bio: 'This is a test user for development',
        title: 'React Native Developer',
        social_links: {},
        message: null,
        is_admin: false,
        is_creator: true,
        is_brand: false,
        status: 'approved',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        followers_count: 42,
        following_count: 12,
      };

      setUser(mockUser);
      setProfile(mockProfile);
      setLoading(false);
    }, 1000);
  }, []);

  const signOut = async () => {
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
