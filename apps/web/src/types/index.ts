// Supabase types

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  title: string | null;
  bio?: string | null;
  social_links: {
    twitter?: string;
    instagram?: string;
    linkedin?: string;
    website?: string;
  };
  message: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  is_admin: boolean;
  is_creator: boolean;
  is_brand?: boolean;
  invite_code?: string | null;
  avatar_url?: string | null;
  location?: string | null;
  interests?: string[];
  onboarding_completed?: boolean;
  picks?: Pick[];
  settings?: {
    emailNotifications?: boolean;
    newFollowers?: boolean;
    pickLikes?: boolean;
    comments?: boolean;
    [key: string]: any;
  };
  username: string;
  followers_count?: number;
  following_count?: number;
  shelf_image_url?: string | null;
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
  status: 'draft' | 'pending_review' | 'published' | 'rejected';
  visible: boolean;
  rank: number;
  favorites_count?: number;
  tags?: string[];
  profiles?: Profile;
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

export type UserRole = 'admin' | 'curator' | 'user';

export type Category = 'places' | 'products' | 'books';

export type Collection = {
  id: string;
  profile_id: string;
  title: string;
  description: string;
  categories: Category[];
  picks: string[]; // Array of pick IDs
  cover_image?: string; // URL to the cover image
  font_color?: 'dark' | 'light'; // Text color for collection card
  issue_number?: number; // Issue number for the collection (starting from 1)
  created_at: string;
  updated_at: string;
  profiles?: Profile;
};

export type CuratorInvite = {
  id: string;
  code: string;
  email: string | null;
  full_name: string;
  expires_at: string;
  created_at: string;
  created_by: string;
  status: 'pending' | 'completed' | 'expired';
};

export type OnboardingStep = 
  | 'welcome'
  | 'profile'
  | 'interests'
  | 'location'
  | 'photo'
  | 'social'
  | 'bio'
  | 'complete';

export type OnboardingData = {
  step: OnboardingStep;
  profile: Partial<Profile>;
};