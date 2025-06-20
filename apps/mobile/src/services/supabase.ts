import { createClient } from '@supabase/supabase-js';

// These would come from environment variables in production
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Only create client if we have valid credentials
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Types for our data models
export interface Pick {
  id: string;
  title: string;
  description: string;
  url: string;
  category: string;
  author_id: string;
  created_at: string;
  updated_at: string;
  image_url?: string;
  reference?: string;
  author: {
    name: string;
    username: string;
  };
}

export interface Collection {
  id: string;
  title: string;
  description: string;
  author_id: string;
  created_at: string;
  updated_at: string;
  picks_count: number;
  author: {
    name: string;
    username: string;
  };
}

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar_url?: string;
  bio?: string;
  created_at: string;
}

// Service functions
export class PicksService {
  static async getFeaturedPicks(): Promise<Pick[]> {
    // If no Supabase client, return mock data
    if (!supabase) {
      return mockPicks.slice(0, 2);
    }

    const { data, error } = await supabase
      .from('picks')
      .select(`
        *,
        author:users(name, username)
      `)
      .eq('featured', true)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;
    return data || [];
  }

  static async getRecentPicks(): Promise<Pick[]> {
    // If no Supabase client, return mock data
    if (!supabase) {
      return mockPicks;
    }

    const { data, error } = await supabase
      .from('picks')
      .select(`
        *,
        author:users(name, username)
      `)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    return data || [];
  }

  static async getPicksByCategory(category: string): Promise<Pick[]> {
    // If no Supabase client, return filtered mock data
    if (!supabase) {
      return mockPicks.filter(pick => pick.category === category);
    }

    const { data, error } = await supabase
      .from('picks')
      .select(`
        *,
        author:users(name, username)
      `)
      .eq('category', category)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getTrendingPicks(): Promise<Pick[]> {
    // If no Supabase client, return mock data
    if (!supabase) {
      return mockPicks.slice(0, 6);
    }

    const { data, error } = await supabase
      .from('picks')
      .select(`
        *,
        author:users(name, username)
      `)
      .eq('trending', true)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;
    return data || [];
  }

  static async getPopularPicks(): Promise<Pick[]> {
    // If no Supabase client, return mock data
    if (!supabase) {
      return mockPicks.slice(0, 8);
    }

    const { data, error } = await supabase
      .from('picks')
      .select(`
        *,
        author:users(name, username)
      `)
      .order('views_count', { ascending: false })
      .limit(20);

    if (error) throw error;
    return data || [];
  }

  static async createPick(pick: Omit<Pick, 'id' | 'created_at' | 'updated_at' | 'author'>): Promise<Pick> {
    // If no Supabase client, return mock pick
    if (!supabase) {
      const newPick: Pick = {
        ...pick,
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        author: { name: 'Current User', username: 'currentuser' }
      };
      return newPick;
    }

    const { data, error } = await supabase
      .from('picks')
      .insert(pick)
      .select(`
        *,
        author:users(name, username)
      `)
      .single();

    if (error) throw error;
    return data;
  }
}

export class CollectionsService {
  static async getFeaturedCollections(): Promise<Collection[]> {
    // If no Supabase client, return mock data
    if (!supabase) {
      return mockCollections.slice(0, 1);
    }

    const { data, error } = await supabase
      .from('collections')
      .select(`
        *,
        author:users(name, username),
        picks_count:collection_picks(count)
      `)
      .eq('featured', true)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;
    return data || [];
  }

  static async getRecentCollections(): Promise<Collection[]> {
    // If no Supabase client, return mock data
    if (!supabase) {
      return mockCollections;
    }

    const { data, error } = await supabase
      .from('collections')
      .select(`
        *,
        author:users(name, username),
        picks_count:collection_picks(count)
      `)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    return data || [];
  }
}

// Mock data for development (remove when connecting to real Supabase)
export const mockPicks: Pick[] = [
  {
    id: '1',
    title: 'Figma',
    description: 'The best design tool for collaborative interface design',
    url: 'https://figma.com',
    category: 'Design',
    author_id: '1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    image_url: 'https://logo.clearbit.com/figma.com',
    reference: 'figma.com',
    author: {
      name: 'John Doe',
      username: 'johndoe'
    }
  },
  {
    id: '2',
    title: 'Linear',
    description: 'Modern issue tracking for software development teams',
    url: 'https://linear.app',
    category: 'Productivity',
    author_id: '1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    image_url: 'https://logo.clearbit.com/linear.app',
    reference: 'linear.app',
    author: {
      name: 'Jane Smith',
      username: 'janesmith'
    }
  },
  {
    id: '3',
    title: 'Notion',
    description: 'All-in-one workspace for notes, docs, and collaboration',
    url: 'https://notion.so',
    category: 'Productivity',
    author_id: '2',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    image_url: 'https://logo.clearbit.com/notion.so',
    reference: 'notion.so',
    author: {
      name: 'Mike Wilson',
      username: 'mikewilson'
    }
  },
  {
    id: '4',
    title: 'Spotify',
    description: 'Music streaming with millions of songs and podcasts',
    url: 'https://spotify.com',
    category: 'Entertainment',
    author_id: '3',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    image_url: 'https://logo.clearbit.com/spotify.com',
    reference: 'spotify.com',
    author: {
      name: 'Alex Chen',
      username: 'alexchen'
    }
  },
  {
    id: '5',
    title: 'GitHub',
    description: 'Development platform for version control and collaboration',
    url: 'https://github.com',
    category: 'Development',
    author_id: '4',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    image_url: 'https://logo.clearbit.com/github.com',
    reference: 'github.com',
    author: {
      name: 'Sarah Kim',
      username: 'sarahkim'
    }
  },
  {
    id: '6',
    title: 'Slack',
    description: 'Team communication and collaboration platform',
    url: 'https://slack.com',
    category: 'Productivity',
    author_id: '5',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    image_url: 'https://logo.clearbit.com/slack.com',
    reference: 'slack.com',
    author: {
      name: 'Marcus Johnson',
      username: 'marcusj'
    }
  }
];

export const mockCollections: Collection[] = [
  {
    id: '1',
    title: 'Design Tools 2024',
    description: 'Essential design tools every creative professional should know about',
    author_id: '1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    picks_count: 12,
    author: {
      name: 'John Doe',
      username: 'johndoe'
    }
  },
  {
    id: '2',
    title: 'Productivity Apps',
    description: 'Apps that will supercharge your productivity workflow',
    author_id: '2',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    picks_count: 8,
    author: {
      name: 'Jane Smith',
      username: 'janesmith'
    }
  }
];

export const mockUsers = [
  {
    id: '1',
    name: 'Alex Thompson',
    username: 'alexthompson',
    bio: 'Designer & product curator sharing the best tools and resources',
    followers_count: 1250,
    following_count: 340,
    picks_count: 47
  },
  {
    id: '2',
    name: 'Sarah Williams',
    username: 'sarahwilliams',
    bio: 'Travel enthusiast curating amazing places and experiences',
    followers_count: 890,
    following_count: 120,
    picks_count: 32
  },
  {
    id: '3',
    name: 'David Chen',
    username: 'davidchen',
    bio: 'Tech enthusiast sharing innovative software and apps',
    followers_count: 2340,
    following_count: 890,
    picks_count: 78
  },
  {
    id: '4',
    name: 'Maria Garcia',
    username: 'mariagarcia',
    bio: 'Book lover and reading curator',
    followers_count: 560,
    following_count: 200,
    picks_count: 65
  }
]; 