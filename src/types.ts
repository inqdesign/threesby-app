import { User } from '@supabase/supabase-js';

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  title: string | null;
  username?: string | null;
  social_links: {
    twitter?: string;
    instagram?: string;
    linkedin?: string;
    website?: string;
  };
  message: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'draft' | 'unpublished' | 'active' | 'review';
  created_at: string;
  updated_at: string;
  last_submitted_at?: string;
  rejection_note?: string;
  is_admin: boolean;
  is_creator: boolean;
  is_brand?: boolean;
  invite_code?: string | null;
  avatar_url?: string | null;
  tags?: string[];
  bio?: string;
  picks?: Pick[];
  followers_count?: number;
  following_count?: number;
  current_city?: string;
  location?: string;
  shelf_image_url?: string;
  interests?: string[];
};

export type Pick = {
  id: string;
  profile_id: string;
  category: 'places' | 'products' | 'books';
  title: string;
  description: string;
  image_url: string;
  reference: string;
  created_at: string;
  updated_at: string;
  last_updated_at?: string;
  status: 'draft' | 'pending_review' | 'published' | 'rejected';
  visible: boolean;
  rank: number;
  profile?: {
    id: string;
    full_name: string | null;
    title: string | null;
    avatar_url?: string | null;
    is_admin?: boolean;
    is_creator?: boolean;
    is_brand?: boolean;
  };
};

export type Category = 'books' | 'products' | 'places';

export type UserRole = 'admin' | 'creator' | 'brand' | 'user';