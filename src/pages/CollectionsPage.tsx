import React, { useState, useEffect } from "react";
import { supabase } from '../lib/supabase';
import { CategoryFilter, FilterCategory } from '../components/CategoryFilter';
import { useNavigate } from 'react-router-dom';
import { CollectionCard } from '../components/CollectionCard';
import { Skeleton } from '../components/Skeleton';
import './CollectionScroll.css';
import './CollectionAnimation.css';

// Define Collection type locally until it's properly exported from types
type Collection = {
  id: string;
  profile_id: string;
  title: string;
  description: string;
  categories: string[];
  picks: string[];
  cover_image?: string;
  font_color?: 'dark' | 'light';
  created_at: string;
  updated_at: string;
  profiles?: any;
};

export const CollectionsPage: React.FC = () => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategories, setActiveCategories] = useState<FilterCategory[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const navigate = useNavigate();
  
  // Available categories for filtering
  const availableCategories: FilterCategory[] = [
    'books', 'places', 'products', 'arts', 'design', 
    'interiors', 'fashion', 'food', 'music', 'travel'
  ];
  
  // Fetch collections when component mounts
  useEffect(() => {
    fetchCollections();
  }, []);
  
  // Fetch collections from the database
  const fetchCollections = async () => {
    try {
      setLoading(true);
      console.log('CollectionsPage - Starting to fetch collections');
      
      const { data, error } = await supabase
        .from('collections')
        .select(`
          *,
          profiles:profile_id(full_name, title)
        `)
        .order('created_at', { ascending: false });
      
      console.log('CollectionsPage - Raw data from Supabase:', data);
      console.log('CollectionsPage - Error from Supabase:', error);
      
      if (error) {
        console.error('CollectionsPage - Error fetching collections:', error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        console.log('CollectionsPage - No collections found in the database');
        setCollections([]);
        setLoading(false);
        return;
      }
      
      // Calculate category counts
      const counts: Record<string, number> = {};
      data.forEach((collection: any) => {
        if (collection.categories && Array.isArray(collection.categories)) {
          collection.categories.forEach((category: string) => {
            counts[category] = (counts[category] || 0) + 1;
          });
        }
      });
      
      console.log('CollectionsPage - Category counts:', counts);
      
      // Process collections and add cover images from localStorage if needed
      const collectionsWithCoverImages = data.map((collection: any) => {
        console.log('CollectionsPage - Processing collection:', collection);
        let result = { ...collection };
        
        // If no cover_image in the database, try localStorage
        if (!collection.cover_image) {
          try {
            const localStorageKey = `collection_cover_${collection.id}`;
            const localCoverImage = localStorage.getItem(localStorageKey);
            console.log(`CollectionsPage - LocalStorage key: ${localStorageKey}, value:`, localCoverImage);
            
            if (localCoverImage) {
              result.cover_image = localCoverImage;
            }
          } catch (e) {
            console.log('CollectionsPage - Error retrieving cover image from localStorage', e);
          }
        }
        
        return result;
      });
      
      console.log('CollectionsPage - Final collections with cover images:', collectionsWithCoverImages);
      
      setCategoryCounts(counts);
      setCollections(collectionsWithCoverImages);
    } catch (error) {
      console.error('CollectionsPage - Error fetching collections:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Filter collections based on active categories and search term
  const filteredCollections = collections.filter(collection => {
    // Filter by categories
    const matchesCategory = activeCategories.length === 0 || 
      collection.categories?.some((category: string) => activeCategories.includes(category as FilterCategory));
    
    // Filter by search term
    const matchesSearch = searchTerm === '' || 
      collection.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      collection.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });
  
  // Group collections by curator
  const collectionsByCurator: Record<string, { id: string; name: string; title: string; collections: Collection[] }> = {};
  
  filteredCollections.forEach(collection => {
    const curatorId = collection.profile_id;
    const curatorName = collection.profiles?.full_name || 'Unknown';
    const curatorTitle = collection.profiles?.title || '';
    
    if (!collectionsByCurator[curatorId]) {
      collectionsByCurator[curatorId] = {
        id: curatorId,
        name: curatorName,
        title: curatorTitle,
        collections: []
      };
    }
    
    collectionsByCurator[curatorId].collections.push(collection);
  });
  
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Filter component outside main content with proper background color, padding, and sticky position */}
      <div className="sticky top-0 z-30 bg-background p-4 md:p-8" style={{ position: 'sticky' }}>
        <CategoryFilter
          title="Filter by Category"
          categories={availableCategories}
          activeCategories={activeCategories}
          onCategoryChange={setActiveCategories}
          showSearch={true}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          showCounts={true}
          categoryCounts={categoryCounts}
          pageType="collections"
        />
      </div>
      
      {/* Main content with 1rem padding on all sides */}
      <div className="container mx-auto p-4 md:p-8">
        <div>
          {loading ? (
            // Loading state
            <div className="space-y-12">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border-t border-border pt-6">
                  <div className="flex flex-col md:flex-row md:items-end md:gap-4">
                    <div className="md:w-[24%] mb-2 md:mb-0">
                      <Skeleton className="h-10 w-48" />
                    </div>
                    <div className="md:w-[24%] mb-4 md:mb-0">
                      <Skeleton className="h-6 w-32" />
                    </div>
                    <div className="md:w-[50%] collection-container">
                      <div className="collection-row scrollbar-hide few-cards">
                        {[1, 2, 3].map((j) => (
                          <div key={j} className="collection-card">
                            <Skeleton className="h-6 w-20 mb-2" />
                            <Skeleton className="h-[calc(100% - 30px)] w-full" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Collections grouped by curator
            <div className="space-y-12">
              {Object.values(collectionsByCurator).length > 0 ? (
                Object.values(collectionsByCurator).map((curator) => (
                  <div key={curator.id} className="border-t border-border" style={{ paddingTop: '1.5rem', paddingBottom: '1.5rem', paddingLeft: '0', paddingRight: '0' }}>
                    {/* Three-column layout with bottom alignment */}
                    <div className="flex flex-col md:flex-row md:items-end md:gap-4">
                      {/* Column 1: Curator name - 24% width on desktop */}
                      <div className="md:w-[24%] mb-2 md:mb-0">
                        <h2 className="text-4xl font-sans" style={{ fontFamily: 'Geist, sans-serif' }} data-component-name="CollectionsPage">{curator.name}</h2>
                      </div>
                      
                      {/* Column 2: Curator title - 24% width on desktop */}
                      <div className="md:w-[24%] mb-4 md:mb-0">
                        <p className="text-xl font-mono uppercase text-gray-500">{curator.title}</p>
                      </div>
                      
                      {/* Column 3: Collection list - 50% width on desktop */}
                      <div className="md:w-[50%] collection-container">
                        {/* Scrollable row with conditional alignment based on number of cards */}
                        <div className={`collection-row scrollbar-hide ${curator.collections.length <= 3 ? 'few-cards' : 'many-cards'}`}>
                          {curator.collections.map((collection: Collection, index: number) => (
                            <div 
                              key={collection.id} 
                              className="collection-card cursor-pointer"
                              onClick={() => navigate(`/collections/${collection.id}`)}
                            >
                              <CollectionCard 
                                collection={collection} 
                                linkWrapper={false} 
                                issueNumber={String(curator.collections.length - index).padStart(2, '0')}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">No collections found matching your filters.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CollectionsPage;
