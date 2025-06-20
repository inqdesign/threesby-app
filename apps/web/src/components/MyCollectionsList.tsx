import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { CollectionCard } from './CollectionCard';

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

interface MyCollectionsListProps {
  userId: string;
  onCreateCollection: () => void;
  onEditCollection?: (collection: Collection) => void;
}

export interface MyCollectionsListRef {
  refreshCollections: () => Promise<void>;
}

export const MyCollectionsList = forwardRef<MyCollectionsListRef, MyCollectionsListProps>(
  ({ userId, onCreateCollection, onEditCollection }, ref) => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);
  const [newCollectionTitle, setNewCollectionTitle] = useState('New Collection');
  // We're not showing pick counts in the new design, so we don't need this state
  // const [userPicks, setUserPicks] = useState<Record<string, Pick>>({});
  
  // Fetch user's collections
  useEffect(() => {
    if (userId) {
      console.log('MyCollectionsList - Fetching collections for user:', userId);
      fetchCollections();
      // Also fetch all collections directly for debugging
      fetchAllCollectionsForDebugging();
      // We don't need to fetch user picks for the new design
      // fetchUserPicks();
    } else {
      console.log('MyCollectionsList - No userId provided');
    }
  }, [userId]);
  
  // Handle creating a new collection with placeholder
  const handleCreateCollection = () => {
    setIsCreatingCollection(true);
    
    // Add a temporary placeholder to the UI
    const tempId = `temp-${Date.now()}`;
    const placeholderCollection: Collection = {
      id: tempId,
      profile_id: userId,
      title: newCollectionTitle,
      description: '',
      categories: [],
      picks: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    // Add the placeholder to the beginning of the collections array
    setCollections(prev => [placeholderCollection, ...prev]);
    
    // Call the parent's onCreateCollection function
    onCreateCollection();
    
    // After a delay, refresh the collections to get the real data
    setTimeout(() => {
      fetchCollections();
      setIsCreatingCollection(false);
    }, 2000); // 2 second delay to allow for collection creation
  };
  
  // Debug function to fetch all collections without any filters
  const fetchAllCollectionsForDebugging = async () => {
    try {
      console.log('MyCollectionsList - Fetching ALL collections for debugging');
      
      const { data, error } = await supabase
        .from('collections')
        .select('*');
      
      console.log('MyCollectionsList - ALL collections in database:', data);
      console.log('MyCollectionsList - Error fetching ALL collections:', error);
      
      if (data && data.length > 0) {
        console.log('MyCollectionsList - Found', data.length, 'collections in the database');
        // Log each collection's profile_id to check if it matches the current user
        data.forEach(collection => {
          console.log(`Collection ${collection.id} has profile_id: ${collection.profile_id}, current userId: ${userId}`);
        });
      } else {
        console.log('MyCollectionsList - No collections found in the database at all');
      }
    } catch (error) {
      console.error('MyCollectionsList - Error in debug fetch:', error);
    }
  };
  
  const fetchCollections = async () => {
    try {
      setLoading(true);
      
      console.log('MyCollectionsList - Fetching collections for userId:', userId);
      
      // Make sure we have a valid userId before fetching
      if (!userId) {
        console.log('MyCollectionsList - No valid userId provided');
        setCollections([]);
        setLoading(false);
        return;
      }
      
      // Fetch collections for this specific user
      const { data, error } = await supabase
        .from('collections')
        .select('*')
        .eq('profile_id', userId)
        .order('created_at', { ascending: false });
        
      console.log('MyCollectionsList - Collections for this user:', data);
      console.log('MyCollectionsList - Error from Supabase:', error);
      
      if (error) {
        console.error('MyCollectionsList - Error fetching collections:', error);
        throw error;
      }
      
      // If no data or empty array, set empty collections and return
      if (!data || data.length === 0) {
        console.log('MyCollectionsList - No collections found for this user');
        setCollections([]);
        setLoading(false);
        return;
      }
      
      // Process collections and add cover images from localStorage if needed
      const collectionsWithCoverImages = data.map((collection: any) => {
        console.log('MyCollectionsList - Processing collection:', collection);
        let result = { ...collection };
        
        // If no cover_image in the database, try localStorage
        if (!collection.cover_image) {
          try {
            const localStorageKey = `collection_cover_${collection.id}`;
            const localCoverImage = localStorage.getItem(localStorageKey);
            console.log(`MyCollectionsList - LocalStorage key: ${localStorageKey}, value:`, localCoverImage);
            
            if (localCoverImage) {
              result.cover_image = localCoverImage;
            }
          } catch (e) {
            console.log('Error retrieving cover image from localStorage', e);
          }
        }
        
        return result;
      });
      
      console.log('MyCollectionsList - Final collections with cover images:', collectionsWithCoverImages);
      
      // Set the collections state with the processed data
      setCollections(collectionsWithCoverImages);
    } catch (error) {
      console.error('MyCollectionsList - Error fetching collections:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // This function is no longer needed for the new design
  // const fetchUserPicks = async () => {
  //   try {
  //     const { data, error } = await supabase
  //       .from('picks')
  //       .select('*')
  //       .eq('profile_id', userId);
  //     
  //     if (error) throw error;
  //     
  //     // Create a map of picks by ID for easy lookup
  //     const picksMap: Record<string, Pick> = {};
  //     (data as Pick[]).forEach(pick => {
  //       picksMap[pick.id] = pick;
  //     });
  //     
  //     setUserPicks(picksMap);
  //   } catch (error) {
  //     console.error('Error fetching user picks:', error);
  //   }
  // };
  
  // These functions were removed as they're not used in the new design
  // but we're keeping the component API compatible
  
  if (loading) {
    return (
      <div className="mt-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium">My Collections</h2>
          <button
            onClick={onCreateCollection}
            className="px-3 py-1 text-sm rounded-full bg-[#252525] text-white hover:bg-[#111111] flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            <span>Create</span>
          </button>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-gray-100 animate-pulse h-16 rounded-md"></div>
          ))}
        </div>
      </div>
    );
  }
  
  // Debug function to display all collections in the database
  const renderDebugCollections = () => {
    return (
      <div className="mt-4 p-4 bg-gray-100 rounded-md">
        <h3 className="text-lg font-bold mb-2">Debug: All Collections</h3>
        <pre className="text-xs overflow-auto max-h-40">
          {JSON.stringify(collections, null, 2)}
        </pre>
      </div>
    );
  };

  useImperativeHandle(ref, () => ({
    refreshCollections: fetchCollections,
  }));

  return (
    <div className="my-collections mt-6 mb-8">
      {/* Debug section - only shown when collections array is empty */}
      {collections.length === 0 && renderDebugCollections()}
      
      <div className="flex flex-col md:flex-row w-full">
        {/* First column: Header and description */}
        <div className="w-full md:w-2/6 md:pr-9">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-mono font-medium">MY COLLECTIONS</h2>
            <span className="text-sm font-mono text-gray-500">({collections.length})</span>
          </div>
          <p className="text-sm text-gray-600 mb-4">Curate your own way to share your picks.</p>
        </div>
        
        {/* Second column: Collection cards */}
        <div className="w-full md:w-4/6">
          <div className="flex gap-2 md:gap-3 overflow-x-auto pb-4 -mx-4 px-4 md:px-0 md:mx-0">
            {/* Add Collection Card - Always first */}
            <div className="flex-shrink-0 w-[7.5rem] md:w-[14rem] h-[10.5rem] md:h-auto mr-2">
              <button 
                onClick={handleCreateCollection}
                className="w-full h-full"
                disabled={isCreatingCollection}
              >
                <div className="w-full h-full rounded-none border-2 border-dashed border-gray-300 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors aspect-[5/7]">
                  <div className="w-10 h-10 rounded-full bg-[#f3f2ed] flex items-center justify-center mb-2">
                    <Plus className="w-5 h-5 text-gray-500" />
                  </div>
                  <span className="text-sm font-medium text-gray-500">Add</span>
                </div>
              </button>
            </div>
            
            {loading && !collections.length ? (
              // Loading skeleton
              Array.from({ length: 3 }).map((_, index) => (
                <div key={`skeleton-${index}`} className="flex-shrink-0 w-[7.5rem] md:w-[14rem] h-[10.5rem] md:h-auto mr-2 bg-gray-100 rounded-lg animate-pulse aspect-[5/7]"></div>
              ))
            ) : collections.length > 0 ? (
              // Collection cards
              collections.map((collection, index) => {
                const isPlaceholder = collection.id.startsWith('temp-');
                const issueNumber = String(collections.length - index).padStart(2, '0');
                
                return (
                  <div 
                    key={collection.id} 
                    className="flex-shrink-0 w-[7.5rem] md:w-[14rem] h-[10.5rem] md:h-auto mr-2 cursor-pointer"
                    onClick={() => !isPlaceholder && onEditCollection && onEditCollection(collection)}
                  >
                    {isPlaceholder ? (
                      // Placeholder for newly created collection
                      <div className="relative overflow-hidden rounded-lg bg-gray-50 border border-gray-200 w-full aspect-[5/7] animate-pulse">
                        <div className="absolute top-2 left-2 text-[10px] text-gray-400 font-medium bg-gray-100 px-1 rounded">
                          ISSUE #{issueNumber}
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-gray-100 to-transparent">
                          <h3 className="text-gray-500 font-bold text-sm leading-tight">
                            {collection.title}
                          </h3>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-300"></div>
                        </div>
                      </div>
                    ) : (
                      // Regular collection card
                      <CollectionCard 
                        collection={collection} 
                        linkWrapper={false}
                        issueNumber={issueNumber}
                      />
                    )}
                  </div>
                );
              })
            ) : (
              // Empty state placeholders
              Array.from({ length: 3 }).map((_, index) => (
                <div key={`empty-${index}`} className="flex-shrink-0 w-[7.5rem] md:w-[14rem] h-[10.5rem] md:h-auto mr-2 bg-gray-100 rounded-lg flex items-center justify-center aspect-[5/7]">
                  <span className="text-sm text-gray-400">Empty</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
