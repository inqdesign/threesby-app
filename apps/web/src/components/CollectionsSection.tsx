import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { supabase } from '../lib/supabase';
import { CollectionCard } from './CollectionCard';
import { Plus } from 'lucide-react';
import '../pages/HideScrollbar.css';

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

interface CollectionsSectionProps {
  userId: string;
  onCreateCollection: () => void;
  onEditCollection: (collection: Collection) => void;
}

export interface CollectionsSectionRef {
  refreshCollections: () => Promise<void>;
}

export const CollectionsSection = forwardRef<CollectionsSectionRef, CollectionsSectionProps>(
  ({ userId, onCreateCollection, onEditCollection }, ref) => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);
  const [newCollectionTitle] = useState('New Collection');

  // Function to fetch collections
  const fetchCollections = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('collections')
        .select('*')
        .eq('profile_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCollections(data || []);
    } catch (error) {
      console.error('Error fetching collections:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial load of collections
  useEffect(() => {
    if (userId) {
      fetchCollections();
    }
  }, [userId]);

  // Handle creating a new collection with placeholder
  const handleCreateCollection = () => {
    setIsCreatingCollection(true);

    // Call the parent's onCreateCollection function
    onCreateCollection();

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

    // After a delay, refresh the collections to get the real data
    setTimeout(() => {
      fetchCollections();
      setIsCreatingCollection(false);
    }, 2000); // 2 second delay to allow for collection creation
  };

  useImperativeHandle(ref, () => ({
    refreshCollections: fetchCollections,
  }));

  return (
    <div className="flex flex-col md:flex-row w-full gap-4 md:rounded-xl bg-card p-6 rounded-none md:rounded-xl mb-4 mt-0" data-component-name="CollectionsSection">
      {/* Left column - Section header, text and count */}
      <div className="w-full md:w-1/3 md:pr-9">
        <div className="flex items-center justify-between" data-component-name="CollectionsSection">
          <h2 className="text-base md:text-lg font-semibold text-foreground font-mono">Collections</h2>
          <span className="text-sm font-mono text-muted-foreground">
            ({collections.length})
          </span>
        </div>
        <p className="text-muted-foreground text-sm">
          Curate your own way to share your picks.
        </p>
      </div>

      {/* Right column - Horizontally scrollable collection cards */}
      <div className="w-full md:w-2/3">
        <div className="flex gap-2 md:gap-3 overflow-x-auto pb-4 -mx-4 px-4 md:px-0 md:mx-0">
          {/* Add Collection Card - Always first */}
          <div className="flex-shrink-0 w-[7.5rem] md:w-[14rem] h-[10.5rem] md:h-auto mr-2">
            <button
              onClick={handleCreateCollection}
              className="w-full h-full"
              disabled={isCreatingCollection}
            >
              <div className="w-full h-full aspect-[5/7] bg-[#f5ffde] relative rounded-none">
                <div className="flex items-end justify-between w-full h-full p-4">
                  <span className="text-base text-[#252525] font-medium">Add</span>
                  <div className="flex items-center justify-center min-w-[24px]">
                    <Plus className="w-5 h-5 md:w-6 md:h-6 text-[#252525]" strokeWidth={1.5} />
                  </div>
                </div>
              </div>
            </button>
          </div>

          {loading && !collections.length ? (
            // Loading skeleton when no collections are loaded yet
            Array.from({ length: 3 }).map((_, index) => (
              <div key={`skeleton-${index}`} className="flex-shrink-0 w-[7.5rem] md:w-[14rem] h-[10.5rem] md:h-auto mr-2 bg-secondary rounded-lg animate-pulse aspect-[5/7]"></div>
            ))
          ) : collections.length > 0 ? (
            // Collection cards
            collections.map((collection, index) => {
              const isPlaceholder = collection.id.startsWith('temp-');

              return (
                <div
                  key={collection.id}
                  className="flex-shrink-0 w-[7.5rem] md:w-[14rem] h-[10.5rem] md:h-auto mr-2 cursor-pointer"
                  onClick={() => !isPlaceholder && onEditCollection(collection)}
                >
                  {isPlaceholder ? (
                    // Placeholder for newly created collection
                    <div className="relative overflow-hidden rounded-lg bg-secondary border border-border w-full aspect-[5/7] animate-pulse">
                      <div className="absolute top-2 left-2 text-[10px] text-muted-foreground font-medium bg-secondary px-1 rounded">
                        ISSUE #{String(index + 1).padStart(2, '0')}
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-secondary to-transparent">
                        <h3 className="text-muted-foreground font-bold text-sm leading-tight">
                          {collection.title}
                        </h3>
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-muted-foreground text-sm">Creating...</span>
                      </div>
                    </div>
                  ) : (
                    // Regular collection card
                    <CollectionCard
                      collection={collection}
                      linkWrapper={false}
                      issueNumber={String(index + 1).padStart(2, '0')}
                    />
                  )}
                </div>
              );
            })
          ) : (
            // Empty state placeholders
            Array.from({ length: 3 }).map((_, index) => (
              <div key={`empty-${index}`} className="flex-shrink-0 w-[7.5rem] md:w-[14rem] h-[10.5rem] md:h-auto mr-2 bg-secondary rounded-lg flex items-center justify-center aspect-[5/7]">
                <span className="text-sm text-muted-foreground">Empty</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
});
