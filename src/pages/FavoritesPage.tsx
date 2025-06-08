import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import type { Pick } from '../types';
import { CategoryFilter, FilterCategory } from '../components/CategoryFilter';
import { SmoothPickCard } from '../components/SmoothPickCard';
import { Footer } from '../components/Footer';
import { getUserFavorites } from '../services/favoritesService';

export function FavoritesPage() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Pick[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategories, setActiveCategories] = useState<FilterCategory[]>([]);

  useEffect(() => {
    if (user) {
      fetchFavorites();
    }
  }, [user, activeCategories]);

  const fetchFavorites = async () => {
    if (!user) return;

    setLoading(true);
    
    try {
      // Get user favorites using the favorites service
      const favoritedPicks = await getUserFavorites();
      
      // Filter by category if needed
      const filteredPicks = activeCategories.length > 0
        ? favoritedPicks.filter(pick => pick && activeCategories.includes(pick.category as FilterCategory))
        : favoritedPicks;
      
      setFavorites(filteredPicks);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get category counts
  const categoryCounts = favorites.reduce((counts, pick) => {
    if (pick.category) {
      counts[pick.category] = (counts[pick.category] || 0) + 1;
    }
    return counts;
  }, {} as Record<string, number>);
  
  // Filter favorites by category if needed
  const filteredFavorites = activeCategories.length > 0
    ? favorites.filter(pick => activeCategories.includes(pick.category as FilterCategory))
    : favorites;

  return (
    <div className="min-h-screen bg-[#F4F4F4] pb-24">
      <div className="w-full mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
          {/* Main Content */}
          <div className="lg:col-span-12">
            {/* Header with filters only */}
            <div className="mb-8">
              {/* Category filter */}
              <CategoryFilter
                categories={['books', 'places', 'products'] as FilterCategory[]}
                activeCategories={activeCategories}
                onCategoryChange={(categories) => {
                  setActiveCategories(categories);
                }}
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
            ) : filteredFavorites.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-xl text-gray-500">No favorites found</p>
                <p className="text-gray-400 mt-2">You haven't added any favorites yet or none match your current filters</p>
              </div>
            ) : (
              <div className="feed-items grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 md:gap-12">
                {filteredFavorites.map((pick) => (
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