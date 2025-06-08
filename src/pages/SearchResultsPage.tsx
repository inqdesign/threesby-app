import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { CategoryFilter, FilterCategory } from '../components/CategoryFilter';
import { SmoothPickCard } from '../components/SmoothPickCard';
import { Footer } from '../components/Footer';
import type { Pick } from '../types';

export function SearchResultsPage() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const searchQuery = queryParams.get('q') || '';
  
  const [searchResults, setSearchResults] = useState<Pick[]>([]);
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
    
    let query = supabase
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
      .ilike('title', `%${searchQuery}%`);
    
    // Add category filter if active
    if (activeCategories.length > 0) {
      query = query.in('category', activeCategories);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching search results:', error);
      setLoading(false);
      return;
    }
    
    setSearchResults(data || []);
    setLoading(false);
  };
  
  // Get category counts
  const categoryCounts = searchResults.reduce((counts, pick) => {
    if (pick.category) {
      counts[pick.category] = (counts[pick.category] || 0) + 1;
    }
    return counts;
  }, {} as Record<string, number>);
  
  return (
    <div className="min-h-screen bg-[#F4F4F4] pb-24">
      <div className="w-full mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
          {/* Main Content */}
          <div className="lg:col-span-12">
            {/* Header with title and filters */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-6">Search Results for "{searchQuery}"</h1>
              
              {/* Category filter */}
              <CategoryFilter
                categories={['books', 'places', 'products'] as FilterCategory[]}
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
                    <div className="w-full aspect-square bg-gray-200 animate-pulse" />
                    {/* Info section skeleton */}
                    <div className="py-4 px-3 space-y-2">
                      <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
                      <div className="h-3 w-1/2 bg-gray-200 rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-xl text-gray-500">No results found for "{searchQuery}"</p>
                <p className="text-gray-400 mt-2">Try a different search term or browse categories</p>
              </div>
            ) : (
              <div className="feed-items grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 md:gap-12">
                {searchResults.map((pick) => (
                  <SmoothPickCard
                    key={pick.id}
                    pick={pick}
                    variant="feed"
                    display="desktop"
                  />
                ))}
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
