import { useState, useEffect } from 'react';
import { BookOpen, Package, MapPin, Loader2, Search, AlertCircle, Check, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

// Local interface for content page picks
interface ContentPick {
  id: string;
  title: string;
  description: string;
  category: 'books' | 'products' | 'places';
  profile_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  image_url?: string;
  reference?: string;
  visible?: boolean;
  rank?: number;
  tags?: string[];
  profile: {
    full_name: string;
    avatar_url: string | null;
  };
}

export function ContentPage() {
  const [picks, setPicks] = useState<ContentPick[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'books' | 'products' | 'places'>('all');
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    fetchPicks();
  }, [activeFilter]);

  // Clear notification after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const fetchPicks = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('picks')
        .select(`
          id,
          title,
          description,
          category,
          profile_id,
          status,
          created_at,
          updated_at,
          profile:profiles!picks_profile_id_fkey (
            full_name,
            avatar_url
          )
        `)
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      // Apply category filter if not 'all'
      if (activeFilter !== 'all') {
        query = query.eq('category', activeFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Transform the data to ensure profile is an object, not an array
      const formattedData = (data || []).map(item => {
        // Extract profile data from array if needed
        let profileData: { full_name: string; avatar_url: string | null } = { 
          full_name: '', 
          avatar_url: null 
        };
        
        if (Array.isArray(item.profile) && item.profile.length > 0) {
          // Safely access array item with type assertion
          const profile = item.profile[0] as any;
          profileData = {
            full_name: profile && profile.full_name ? profile.full_name : '',
            avatar_url: profile && profile.avatar_url ? profile.avatar_url : null
          };
        } else if (item.profile && typeof item.profile === 'object') {
          // Use type assertion to safely access properties
          const profile = item.profile as any;
          profileData = {
            full_name: profile.full_name || '',
            avatar_url: profile.avatar_url || null
          };
        }
        
        // Create a properly typed object with all required fields
        const formattedItem: ContentPick = {
          id: item.id || '',
          title: item.title || '',
          description: item.description || '',
          category: (item.category as 'books' | 'products' | 'places') || 'books',
          profile_id: item.profile_id || '',
          status: item.status || '',
          created_at: item.created_at || '',
          updated_at: item.updated_at || '',
          // Optional fields with defaults
          image_url: '',
          reference: '',
          visible: false,
          rank: 0,
          profile: profileData
        };
        
        return formattedItem;
      });
      
      setPicks(formattedData);
    } catch (error) {
      console.error('Error fetching picks:', error);
      setNotification({
        type: 'error',
        message: 'Failed to load content data'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUnpublish = async (pickId: string) => {
    try {
      const { error } = await supabase
        .from('picks')
        .update({
          status: 'draft',
          updated_at: new Date().toISOString(),
        })
        .eq('id', pickId);

      if (error) throw error;

      // Update local state
      setPicks(picks.filter(pick => pick.id !== pickId));
      
      setNotification({
        type: 'success',
        message: 'Content successfully unpublished'
      });
    } catch (error) {
      console.error('Error unpublishing content:', error);
      setNotification({
        type: 'error',
        message: 'Error unpublishing content'
      });
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'books':
        return <BookOpen className="w-5 h-5 text-rose-500" />;
      case 'products':
        return <Package className="w-5 h-5 text-indigo-500" />;
      case 'places':
        return <MapPin className="w-5 h-5 text-green-500" />;
      default:
        return null;
    }
  };

  const filteredPicks = picks.filter(pick => 
    pick.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pick.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pick.profile.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-[#252525]">Published Content</h2>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
          notification.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {notification.type === 'success' ? (
            <Check className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <p>{notification.message}</p>
          <button 
            onClick={() => setNotification(null)}
            className="ml-auto p-1 rounded-full hover:bg-gray-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-4 py-2 rounded-lg ${
              activeFilter === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-muted'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveFilter('books')}
            className={`px-4 py-2 rounded-lg flex items-center gap-1 ${
              activeFilter === 'books'
                ? 'bg-rose-500 text-white'
                : 'bg-secondary text-secondary-foreground hover:bg-muted'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Books
          </button>
          <button
            onClick={() => setActiveFilter('products')}
            className={`px-4 py-2 rounded-lg flex items-center gap-1 ${
              activeFilter === 'products'
                ? 'bg-indigo-500 text-white'
                : 'bg-secondary text-secondary-foreground hover:bg-muted'
            }`}
          >
            <Package className="w-4 h-4" />
            Products
          </button>
          <button
            onClick={() => setActiveFilter('places')}
            className={`px-4 py-2 rounded-lg flex items-center gap-1 ${
              activeFilter === 'places'
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <MapPin className="w-4 h-4" />
            Places
          </button>
        </div>
      </div>

      {/* Content List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : filteredPicks.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-gray-500">No published content found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPicks.map((pick) => (
            <div key={pick.id} className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(pick.category)}
                    <span className="text-sm font-medium capitalize">{pick.category}</span>
                  </div>
                  <button
                    onClick={() => handleUnpublish(pick.id)}
                    className="text-xs text-red-600 hover:text-red-800"
                  >
                    Unpublish
                  </button>
                </div>
                <h3 className="text-lg font-medium text-[#252525] mb-1">{pick.title}</h3>
                <p className="text-sm text-gray-500 line-clamp-2 mb-3">{pick.description}</p>
                <div className="flex items-center gap-2">
                  <img
                    src={pick.profile.avatar_url || 'https://via.placeholder.com/24'}
                    alt={pick.profile.full_name}
                    className="w-6 h-6 rounded-full object-cover bg-gray-100"
                  />
                  <span className="text-xs text-gray-500">{pick.profile.full_name}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ContentPage;
