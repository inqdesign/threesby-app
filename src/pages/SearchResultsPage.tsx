import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { CategoryFilter, FilterCategory } from '../components/CategoryFilter';
import { SmoothPickCard } from '../components/SmoothPickCard';
import { Footer } from '../components/Footer';
import type { Pick } from '../types';

// Add collection type for search results
interface Collection {
  id: string;
  title: string;
  description: string;
  categories: string[];
  picks: string[];
  created_at: string;
  updated_at: string;
  profile_id: string;
  profiles?: {
    id: string;
    full_name: string;
    title: string;
    avatar_url: string;
    is_admin: boolean;
    is_creator: boolean;
    is_brand: boolean;
  };
}

interface SearchResult {
  type: 'pick' | 'collection';
  data: Pick | Collection;
}

export function SearchResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const searchQuery = queryParams.get('q') || '';
  
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategories, setActiveCategories] = useState<FilterCategory[]>([]);
  
  useEffect(() => {
    if (searchQuery) {
      fetchSearchResults();
    } else {
      setSearchResults([]);
      setLoading(false);
    }
  }, [searchQuery, activeCategories]);
  
  const fetchSearchResults = async () => {
    setLoading(true);
    
          try {
        // Search picks - first by title/description
        // Query 1: Search in pick title, description, and reference
        let picksQuery1 = supabase
          .from('picks')
          .select(`
            *,
            profile:profiles (
              id,
              full_name,
              title,
              avatar_url,
              is_admin,
              is_creator,
              is_brand
            )
          `)
          .eq('status', 'published')
          .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,reference.ilike.%${searchQuery}%`);

        // Query 2: Search picks by creator name
        let picksQuery2 = supabase
          .from('profiles')
          .select(`
            id,
            full_name,
            title,
            avatar_url,
            is_admin,
            is_creator,
            is_brand,
            picks!picks_profile_id_fkey (
              *
            )
          `)
          .or(`full_name.ilike.%${searchQuery}%,title.ilike.%${searchQuery}%`)
          .not('picks', 'is', null);

        // Query 3: Search picks by tags
        let picksQuery3 = supabase
          .from('pick_tags')
          .select(`
            picks!inner (
              *,
              profile:profiles (
                id,
                full_name,
                title,
                avatar_url,
                is_admin,
                is_creator,
                is_brand
              )
            ),
            tags!inner (
              name
            )
          `)
          .eq('picks.status', 'published')
          .ilike('tags.name', `%${searchQuery}%`);
      
        // Add category filter for picks if active
        if (activeCategories.length > 0) {
          const validPickCategories = activeCategories.filter(cat => ['books', 'places', 'products'].includes(cat));
          if (validPickCategories.length > 0) {
            picksQuery1 = picksQuery1.in('category', validPickCategories);
            picksQuery3 = picksQuery3.in('picks.category', validPickCategories);
          }
        }

        // Search collections
        let collectionsQuery = supabase
          .from('collections')
          .select(`
            *,
            profiles (
              id,
              full_name,
              title,
              avatar_url,
              is_admin,
              is_creator,
              is_brand
            )
          `)
          .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);

        // Search collections by creator name
        let collectionsQuery2 = supabase
          .from('profiles')
          .select(`
            id,
            full_name,
            title,
            avatar_url,
            is_admin,
            is_creator,
            is_brand,
            collections!collections_profile_id_fkey (
              *
            )
          `)
          .or(`full_name.ilike.%${searchQuery}%,title.ilike.%${searchQuery}%`)
          .not('collections', 'is', null);

        // Add category filter for collections if active
        if (activeCategories.length > 0) {
          const validCollectionCategories = activeCategories.filter(cat => !['books', 'places', 'products'].includes(cat));
          if (validCollectionCategories.length > 0) {
            collectionsQuery = collectionsQuery.overlaps('categories', validCollectionCategories);
          }
        }

        // Execute all queries in parallel
        const [picksResponse1, picksResponse2, picksResponse3, collectionsResponse1, collectionsResponse2] = await Promise.all([
          picksQuery1,
          picksQuery2,
          picksQuery3,
          collectionsQuery,
          collectionsQuery2
        ]);
    
              if (picksResponse1.error) {
          console.error('Error fetching pick search results:', picksResponse1.error);
        }
        
        if (picksResponse2.error) {
          console.error('Error fetching creator pick search results:', picksResponse2.error);
        }

        if (picksResponse3.error) {
          console.error('Error fetching tag pick search results:', picksResponse3.error);
        }
        
        if (collectionsResponse1.error) {
          console.error('Error fetching collection search results:', collectionsResponse1.error);
        }

        if (collectionsResponse2.error) {
          console.error('Error fetching creator collection search results:', collectionsResponse2.error);
        }

        // Process picks from all queries
        const picks1 = picksResponse1.data || [];
        const picks2: Pick[] = [];
        const picks3: Pick[] = [];
        
        // Extract picks from creator query (picksResponse2)
        if (picksResponse2.data) {
          picksResponse2.data.forEach((profile: any) => {
            if (profile.picks) {
              profile.picks.forEach((pick: any) => {
                if (pick.status === 'published') {
                  picks2.push({
                    ...pick,
                    profile: {
                      id: profile.id,
                      full_name: profile.full_name,
                      title: profile.title,
                      avatar_url: profile.avatar_url,
                      is_admin: profile.is_admin,
                      is_creator: profile.is_creator,
                      is_brand: profile.is_brand,
                    }
                  });
                }
              });
            }
          });
        }

        // Extract picks from tag query (picksResponse3)
        if (picksResponse3.data) {
          picksResponse3.data.forEach((pickTag: any) => {
            if (pickTag.picks) {
              picks3.push({
                ...pickTag.picks,
                profile: pickTag.picks.profile
              });
            }
          });
        }

        // Process collections from both queries
        const collections1 = collectionsResponse1.data || [];
        const collections2: Collection[] = [];
        
        // Extract collections from creator query (collectionsResponse2)
        if (collectionsResponse2.data) {
          collectionsResponse2.data.forEach((profile: any) => {
            if (profile.collections) {
              profile.collections.forEach((collection: any) => {
                collections2.push({
                  ...collection,
                  profiles: {
                    id: profile.id,
                    full_name: profile.full_name,
                    title: profile.title,
                    avatar_url: profile.avatar_url,
                    is_admin: profile.is_admin,
                    is_creator: profile.is_creator,
                    is_brand: profile.is_brand,
                  }
                });
              });
            }
          });
        }

        // Combine and deduplicate results
        const allPicks = [...picks1, ...picks2, ...picks3];
        const allCollections = [...collections1, ...collections2];
        
        // Remove duplicates by ID
        const uniquePicks = allPicks.filter((pick, index, self) => 
          index === self.findIndex(p => p.id === pick.id)
        );
        const uniqueCollections = allCollections.filter((collection, index, self) => 
          index === self.findIndex(c => c.id === collection.id)
        );

        // Combine results
        const combinedResults: SearchResult[] = [
          ...uniquePicks.map((pick: Pick) => ({ type: 'pick' as const, data: pick })),
          ...uniqueCollections.map((collection: Collection) => ({ type: 'collection' as const, data: collection }))
        ];

      setSearchResults(combinedResults);
    } catch (error) {
      console.error('Error fetching search results:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Get category counts from both picks and collections
  const categoryCounts = searchResults.reduce((counts, result) => {
    if (result.type === 'pick') {
      const pick = result.data as Pick;
      if (pick.category) {
        counts[pick.category] = (counts[pick.category] || 0) + 1;
      }
    } else if (result.type === 'collection') {
      const collection = result.data as Collection;
      collection.categories?.forEach(category => {
        counts[category] = (counts[category] || 0) + 1;
      });
    }
    return counts;
  }, {} as Record<string, number>);
  
  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="w-full mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
          {/* Main Content */}
          <div className="lg:col-span-12">
            {/* Header with title and filters */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-6">Search Results for "{searchQuery}"</h1>
              <p className="text-muted-foreground mb-4">
                Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} 
                {searchResults.length > 0 && (
                  <span className="ml-2">
                    ({searchResults.filter(r => r.type === 'pick').length} picks, {searchResults.filter(r => r.type === 'collection').length} collections)
                  </span>
                )}
              </p>
              
              {/* Category filter */}
              <CategoryFilter
                categories={['books', 'places', 'products', 'arts', 'design', 'interiors', 'fashion', 'food', 'music', 'travel'] as FilterCategory[]}
                activeCategories={activeCategories}
                onCategoryChange={setActiveCategories}
                showCounts={true}
                categoryCounts={categoryCounts}
                showSearch={false}
              />
            </div>
            
            {/* Content */}
            {loading ? (
              <div className="feed-items grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 md:gap-12">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="space-y-4 pick-card-container overflow-hidden">
                    {/* Image skeleton */}
                    <div className="w-full aspect-square bg-muted animate-pulse" />
                    {/* Info section skeleton */}
                    <div className="py-4 px-3 space-y-2">
                      <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
                      <div className="h-3 w-1/2 bg-muted rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-xl text-muted-foreground">No results found for "{searchQuery}"</p>
                <p className="text-muted-foreground mt-2">Try a different search term or browse categories</p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Group results by type */}
                {searchResults.filter(r => r.type === 'pick').length > 0 && (
                  <div>
                    <h2 className="text-xl font-semibold mb-4">Picks ({searchResults.filter(r => r.type === 'pick').length})</h2>
                    <div className="feed-items grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 md:gap-12">
                      {searchResults
                        .filter(result => result.type === 'pick')
                        .map((result) => (
                          <SmoothPickCard
                            key={result.data.id}
                            pick={result.data as Pick}
                            variant="feed"
                            display="desktop"
                          />
                        ))}
                    </div>
                  </div>
                )}

                {/* Collections section */}
                {searchResults.filter(r => r.type === 'collection').length > 0 && (
                  <div>
                    <h2 className="text-xl font-semibold mb-4">Collections ({searchResults.filter(r => r.type === 'collection').length})</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                      {searchResults
                        .filter(result => result.type === 'collection')
                        .map((result) => {
                          const collection = result.data as Collection;
                                                     return (
                             <div 
                               key={collection.id} 
                               className="bg-card rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                               onClick={() => {
                        // Use the modal system instead of navigation to prevent page reload
                        const event = new CustomEvent('openCollectionModal', {
                          detail: { collectionId: collection.id }
                        });
                        window.dispatchEvent(event);
                      }}
                             >
                              <div className="p-4">
                                                                 <h3 className="font-semibold text-lg mb-2 overflow-hidden" style={{
                                   display: '-webkit-box',
                                   WebkitLineClamp: 2,
                                   WebkitBoxOrient: 'vertical'
                                 }}>{collection.title}</h3>
                                 {collection.description && (
                                   <p className="text-muted-foreground text-sm mb-3 overflow-hidden" style={{
                                     display: '-webkit-box',
                                     WebkitLineClamp: 3,
                                     WebkitBoxOrient: 'vertical'
                                   }}>{collection.description}</p>
                                 )}
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                                  <span>{collection.picks?.length || 0} picks</span>
                                  {collection.categories && collection.categories.length > 0 && (
                                    <>
                                      <span>•</span>
                                      <span>{collection.categories.join(', ')}</span>
                                    </>
                                  )}
                                </div>
                                {collection.profiles && (
                                  <div className="flex items-center gap-2">
                                    {collection.profiles.avatar_url ? (
                                      <img 
                                        src={collection.profiles.avatar_url} 
                                        alt={collection.profiles.full_name}
                                        className="w-6 h-6 rounded-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                                        <span className="text-xs">{collection.profiles.full_name?.[0]}</span>
                                      </div>
                                    )}
                                    <span className="text-sm text-muted-foreground">{collection.profiles.full_name}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Footer (Desktop Only) */}
          <div className="lg:col-span-12 hidden lg:block">
            <div className="space-y-6">
              <div className="footer-container">
                <Footer />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
