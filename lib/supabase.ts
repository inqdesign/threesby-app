import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

const supabaseUrl = 'https://lekahqbhtqxaipvkdznr.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxla2FocWJodHF4YWlwdmtkem5yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTA0OTEwNTEsImV4cCI6MjAyNjA2NzA1MX0.jmYGWTaaPw6QG_w5Ku3n8q_bwjTjgVo5QLU7q7Y_a_U'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Disable for mobile
  },
})

// Types based on the database schema
export type Profile = {
  id: string
  email: string
  full_name: string | null
  title: string | null
  bio?: string | null
  social_links: {
    twitter?: string
    instagram?: string
    linkedin?: string
    website?: string
  }
  message: string | null
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  updated_at: string
  is_admin: boolean
  is_creator: boolean
  is_brand?: boolean
  invite_code?: string | null
  avatar_url?: string | null
  location?: string | null
  interests?: string[]
  username?: string
  followers_count?: number
  following_count?: number
  shelf_image_url?: string | null
}

export type Pick = {
  id: string
  profile_id: string
  category: 'places' | 'products' | 'books'
  title: string
  description: string
  image_url: string
  reference: string
  status: 'draft' | 'pending_review' | 'published' | 'rejected'
  visible: boolean
  created_at: string
  updated_at: string
  rank?: number
  profile?: Profile
}

export type Collection = {
  id: string
  profile_id: string
  title: string
  description: string
  categories: string[]
  picks: string[]
  cover_image?: string
  font_color?: 'dark' | 'light'
  issue_number?: number
  created_at: string
  updated_at: string
  profiles?: Profile
}

// API functions
export const fetchPublishedPicks = async (): Promise<Pick[]> => {
  const { data, error } = await supabase
    .from('picks')
    .select(`
      *,
      profile:profiles(*)
    `)
    .eq('status', 'published')
    .eq('visible', true)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    console.error('Error fetching picks:', error)
    return []
  }

  return data || []
}

export const fetchCollections = async (): Promise<Collection[]> => {
  const { data, error } = await supabase
    .from('collections')
    .select(`
      *,
      profiles(*)
    `)
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    console.error('Error fetching collections:', error)
    return []
  }

  return data || []
}

export const fetchUserProfile = async (userId: string): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error fetching user profile:', error)
    return null
  }

  return data
}

export const fetchUserPicks = async (userId: string): Promise<Pick[]> => {
  const { data, error } = await supabase
    .from('picks')
    .select(`
      *,
      profile:profiles(*)
    `)
    .eq('profile_id', userId)
    .eq('status', 'published')
    .eq('visible', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching user picks:', error)
    return []
  }

  return data || []
} 