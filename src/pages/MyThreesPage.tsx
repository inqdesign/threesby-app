import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { withRetry, handleSupabaseError } from '../lib/supabaseUtils';
import { Dialog, Transition } from '@headlessui/react';
import { useNavigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import type { Profile, Pick } from '../types';
import { ItemModal } from '../components/ItemModal';
import { MyCollectionsList } from '../components/MyCollectionsList';
import { CollectionsSection } from '../components/CollectionsSection';
import { CollectionModal } from '../components/CollectionModal';
// SubNav import removed as it's now handled at the App level
import { Book, Package, MapPin, Check } from 'lucide-react';
// CheckmarkLabel removed as we're now using simple counters
import { useAppStore } from '../store';
import { SortableItem } from '../components/SortableItem';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy
} from '@dnd-kit/sortable';

type Category = 'places' | 'products' | 'books';

interface MyThreesPageProps {
  profile?: Profile;
  picks?: Pick[];
  loading?: boolean;
  onSavePick?: (data: Partial<Pick>, selectedCategory: Category | null, selectedPick: Pick | null) => Promise<void>;
  onDeletePick?: (pick: Pick) => Promise<void>;
}

export function MyThreesPage({
  profile: propProfile,
  picks: propPicks,
  loading: propLoading,
  onSavePick: propOnSavePick,
  onDeletePick: propOnDeletePick
}: MyThreesPageProps = {}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { fetchFeedPicks, fetchCurators } = useAppStore();
  // Store and use the profile state
  const [profileState, setProfile] = React.useState<Profile | null>(propProfile ? propProfile : null);
  const [picks, setPicks] = React.useState<Record<Category, Pick[]>>({
    places: propPicks ? propPicks.filter(pick => pick.category === 'places') : [],
    products: propPicks ? propPicks.filter(pick => pick.category === 'products') : [],
    books: propPicks ? propPicks.filter(pick => pick.category === 'books') : [],
  });
  const [loading, setLoading] = React.useState(propLoading !== undefined ? propLoading : true);
  const [showModal, setShowModal] = React.useState(false);
  const [selectedPick, setSelectedPick] = React.useState<Pick | null>(null);
  const [selectedCategory, setSelectedCategory] = React.useState<Category | null>(null);
  const [selectedRank, setSelectedRank] = React.useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [pickToDelete, setPickToDelete] = React.useState<Pick | null>(null);
  // No longer using tabs
  const [showProfileModal, setShowProfileModal] = React.useState(false);

  // State for collections modal
  const [isCollectionModalOpen, setIsCollectionModalOpen] = React.useState(false);
  const [selectedCollection, setSelectedCollection] = React.useState<any>(null);

  // State for mobile category tabs
  const [activeTab, setActiveTab] = React.useState<Category>('books');

  // State for update feedback
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [updateSuccess, setUpdateSuccess] = React.useState(false);
  const [updateMessage, setUpdateMessage] = React.useState('');

  // Define helper functions first, without dependencies on other functions
  const handleAddPick = (category: Category, rank: number) => {
    setSelectedCategory(category);
    setSelectedRank(rank);
    setSelectedPick(null);
    setShowModal(true);
  };

  const handlePickClick = (pick: Pick, category: Category, rank: number) => {
    setSelectedPick(pick);
    setSelectedCategory(category);
    setSelectedRank(rank);
    setShowModal(true);
  };

  const confirmDelete = (pick: Pick) => {
    setPickToDelete(pick);
    setShowDeleteConfirm(true);
  };

  // We'll use the category name directly in the UI elements


  // Collection handlers
  const handleCreateCollection = () => {
    setSelectedCollection(null);
    setIsCollectionModalOpen(true);
  };

  const handleEditCollection = (collection: any) => {
    setSelectedCollection(collection);
    setIsCollectionModalOpen(true);
  };

  const handleSaveCollection = async (collection: any) => {
    try {
      setIsUpdating(true);
      setUpdateMessage('Saving your collection...');
      setUpdateSuccess(false);
      
      // Save to database
      const { data, error } = await supabase
        .from('collections')
        .upsert({
          id: collection.id || undefined,
          profile_id: user?.id,
          title: collection.title,
          description: collection.description,
          categories: collection.categories,
          picks: collection.picks,
          cover_image: collection.cover_image,
          font_color: collection.font_color,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      
      setUpdateSuccess(true);
      setUpdateMessage('Collection saved successfully');
      setIsCollectionModalOpen(false);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setIsUpdating(false);
      }, 3000);
    } catch (error) {
      console.error('Error saving collection:', error);
      setUpdateSuccess(false);
      setUpdateMessage('Failed to save collection');
      
      // Hide error message after 3 seconds
      setTimeout(() => {
        setIsUpdating(false);
      }, 3000);
    }
  };

  // Helper function to determine the first available rank for each category
  const getFirstAvailableRank = React.useCallback((category: Category): number => {
    const categoryPicks = picks[category] || [];
    const filledRanks = new Set(categoryPicks.map(p => p.rank).filter(r => r >= 1 && r <= 3));
    
    // Find the first empty rank between 1-3
    for (let i = 1; i <= 3; i++) {
      if (!filledRanks.has(i)) {
        return i;
      }
    }
    
    // If all ranks 1-3 are filled, find the next available rank (4+)
    // This ensures we always have an Add tile, even when the top 3 are filled
    const allRanks = new Set(categoryPicks.map(p => p.rank));
    for (let i = 4; i <= 9; i++) {
      if (!allRanks.has(i)) {
        return i;
      }
    }
    
    // If all ranks 1-9 are filled, return the next rank (10)
    return 10;
  }, [picks]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      setProfile(profileData);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPicks = async () => {
    try {
      if (!user) return;
      
      setLoading(true);
      setIsUpdating(true);
      setUpdateMessage('Loading your picks...');
      
      // Use withRetry to handle connection issues
      const result = await withRetry(
        async () => {
          const { data, error } = await supabase
            .from('picks')
            .select('*')
            .eq('profile_id', user.id)
            .order('rank', { ascending: true });

          if (error) throw error;
          
          // Ensure tags are properly handled for all picks
          return data?.map(pick => ({
            ...pick,
            tags: Array.isArray(pick.tags) ? pick.tags : []
          }));
        },
        {
          maxRetries: 3,
          onRetry: (attempt, _error) => {
            console.log(`Retrying fetch picks (${attempt}/3)...`);
            setUpdateMessage(`Connection issue. Retrying (${attempt}/3)...`);
          }
        }
      );

      // Organize picks by category
      const categorizedPicks: Record<Category, Pick[]> = {
        places: [],
        products: [],
        books: [],
      };

      result.forEach((pick: Pick) => {
        if (pick.category in categorizedPicks) {
          categorizedPicks[pick.category as Category].push(pick);
        }
      });

      setPicks(categorizedPicks);
      setUpdateSuccess(true);
      setUpdateMessage('Picks loaded successfully');
      
      // Hide success message after 1.5 seconds
      setTimeout(() => {
        setIsUpdating(false);
      }, 1500);
      
    } catch (error) {
      console.error('Error fetching picks:', error);
      setUpdateSuccess(false);
      setUpdateMessage(handleSupabaseError(error, 'Error loading picks. Please try again.'));
      
      // Hide error message after 3 seconds
      setTimeout(() => {
        setIsUpdating(false);
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  // Function to directly publish picks without creating a submission review
  const handlePublishPicks = async () => {
    try {
      if (!user) return;
      
      // Directly publish all picks
      const { error: picksError } = await supabase
        .from('picks')
        .update({
          status: 'published',
          updated_at: new Date().toISOString(),
          last_updated_at: new Date().toISOString(),
        })
        .eq('profile_id', user.id);

      if (picksError) throw picksError;
      
      alert('Your picks have been published successfully!');
      
      // Refresh the page to show the updated status
      fetchPicks();
    } catch (error) {
      console.error('Error publishing picks:', error);
      alert('Error publishing picks. Please try again.');
    }
  };

  const handleSubmit = async () => {
    try {
      if (!user) return;
      
      // First, check if the user is already approved
      const { data: profileData, error: fetchError } = await supabase
        .from('profiles')
        .select('status')
        .eq('id', user.id)
        .single();
        
      if (fetchError) throw fetchError;
      
      const isApproved = profileData?.status === 'approved';
      
      if (isApproved) {
        // For approved users, directly publish their picks without review
        const { error: picksError } = await supabase
          .from('picks')
          .update({
            status: 'published',  // Directly publish without review
            updated_at: new Date().toISOString(),
            last_updated_at: new Date().toISOString(),
          })
          .eq('profile_id', user.id);

        if (picksError) throw picksError;
        
        // Create a submission review entry for tracking purposes
        // This will help admins see that an approved user has updated their content
        await supabase
          .from('submission_reviews')
          .insert({
            profile_id: user.id,
            status: 'pending',  // Use 'pending' to make it appear in the admin dashboard
            created_at: new Date().toISOString(),
            // Add a note to indicate this is from an approved user
            notes: 'Automatic update from approved user'
          });
        
        alert('Your picks have been published successfully!');
      } else {
        // For new or non-approved users, follow the review process
        const { error: picksError } = await supabase
          .from('picks')
          .update({
            status: 'pending_review',
            updated_at: new Date().toISOString(),
            last_updated_at: new Date().toISOString(),
          })
          .eq('profile_id', user.id);

        if (picksError) throw picksError;

        // Update profile status to pending
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            status: 'pending',
            updated_at: new Date().toISOString(),
            last_submitted_at: new Date().toISOString(),
          })
          .eq('id', user.id);

        if (profileError) throw profileError;

        // Insert into submission_reviews
        await supabase
          .from('submission_reviews')
          .insert({
            profile_id: user.id,
            status: 'pending',
            created_at: new Date().toISOString(),
          });

        alert('Your picks have been submitted for review!');
      }
      
      await fetchProfile();
    } catch (error) {
      console.error('Error submitting picks:', error);
      alert('Error submitting picks. Please try again.');
    }
  };

  const handleUnpublish = async () => {
    try {
      if (!user) return;

      if (!confirm('Are you sure you want to unpublish your profile and picks?')) return;

      const { error: picksError } = await supabase
        .from('picks')
        .update({
          status: 'draft',
          updated_at: new Date().toISOString(),
          last_updated_at: new Date().toISOString(),
        })
        .eq('profile_id', user.id);

      if (picksError) throw picksError;

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          status: 'rejected',  // Using 'rejected' instead of 'unpublished' to match valid_status constraint
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      alert('Your picks have been unpublished!');
      await fetchProfile();
    } catch (error) {
      console.error('Error unpublishing picks:', error);
      alert('Error unpublishing picks. Please try again.');
    }
  };

  const handleCancelSubmission = async () => {
    if (!user) return;
    
    try {
      await supabase
        .from('profiles')
        .update({
          status: 'draft',
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      await supabase
        .from('submission_reviews')
        .update({
          status: 'canceled',
          updated_at: new Date().toISOString(),
        })
        .eq('profile_id', user.id)
        .eq('status', 'pending');

      alert('Your submission has been canceled.');
      await fetchProfile();
    } catch (error) {
      console.error('Error canceling submission:', error);
      alert('Error canceling submission. Please try again.');
    }
  };

  const handleDelete = async (pick: Pick) => {
    try {
      setLoading(true);
      setIsUpdating(true);
      setUpdateMessage('Deleting your pick...');
      setUpdateSuccess(false);
      
      // Use withRetry to handle database operations with retry logic
      await withRetry(
        async () => {
          const { error } = await supabase
            .from('picks')
            .delete()
            .eq('id', pick.id);
          
          if (error) {
            throw new Error(`Failed to delete pick: ${error.message}`);
          }
          
          return true;
        },
        {
          maxRetries: 3,
          onRetry: (attempt, _error) => {
            console.log(`Retrying delete pick (${attempt}/3)...`);
            setUpdateMessage(`Connection issue. Retrying delete (${attempt}/3)...`);
          }
        }
      );
      
      // Refresh local picks data
      setUpdateMessage('Refreshing your picks...');
      await fetchPicks();
      
      // Refresh global app store data to ensure consistency across all pages
      setUpdateMessage('Syncing with other pages...');
      
      // Use withRetry for app store updates as well
      await withRetry(
        async () => {
          await fetchFeedPicks();
          await fetchCurators();
          return true;
        },
        {
          maxRetries: 2,
          onRetry: (attempt, _error) => {
            console.log(`Retrying sync with other pages (${attempt}/2)...`);
            setUpdateMessage(`Syncing with other pages... Retry ${attempt}/2`);
          }
        }
      );
      
      // Show success message
      setUpdateSuccess(true);
      setUpdateMessage('Your pick has been deleted!');
      
      // Reset UI state
      setShowModal(false);
      setSelectedPick(null);
      setSelectedCategory(null);
      setSelectedRank(null);
      setShowDeleteConfirm(false);
      setPickToDelete(null);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setIsUpdating(false);
        setUpdateSuccess(false);
      }, 3000);
      
    } catch (error) {
      console.error('Error deleting pick:', error);
      setUpdateSuccess(false);
      setUpdateMessage(handleSupabaseError(error, 'Error deleting pick. Please try again.'));
      
      // Hide error message after 3 seconds
      setTimeout(() => {
        setIsUpdating(false);
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (data: Partial<Pick>) => {
    try {
      setLoading(true);
      setIsUpdating(true);
      setUpdateMessage('Saving your pick...');
      setUpdateSuccess(false);
      
      // Validate required data
      if (!user?.id) {
        throw new Error('User must be logged in to save picks');
      }
      
      if (!selectedCategory) {
        throw new Error('No category selected');
      }
      
      if (!data.title) {
        throw new Error('Title is required');
      }

      // Get the new rank (if provided)
      const newRank = data.rank !== undefined ? data.rank : (selectedRank || 0);
      
      // Check if we're changing a pick's rank within the top 3 or from archive to top 3
      const isChangingRank = 
        selectedPick && 
        selectedPick.rank !== newRank;
      
      // Check if we're promoting from archive to top 3
      const isPromotingFromArchive = 
        isChangingRank && 
        selectedPick.rank === 0 && 
        newRank >= 1 && 
        newRank <= 3;
      
      // Check if we're reordering within the top 3
      const isReorderingTopPicks = 
        isChangingRank && 
        selectedPick.rank >= 1 && 
        selectedPick.rank <= 3 && 
        newRank >= 1 && 
        newRank <= 3;
      
      // Find the pick that's currently in the target position (if any)
      let displacedPick = null;
      if (isPromotingFromArchive || isReorderingTopPicks) {
        displacedPick = picks[selectedCategory].find(
          p => p.id !== selectedPick?.id && p.rank === newRank
        );
      }

      // Use withRetry to handle database operations with retry logic
      // Removed timeout promise to prevent clipboard functionality issues
      await withRetry(
        async () => {
          // First, update the selected pick
          if (selectedPick) {
            // Create update object with type that allows tags
            const updateData: Partial<Pick> & { tags?: string[] } = {
                title: data.title,
                description: data.description,
                reference: data.reference,
                image_url: data.image_url || 'https://placehold.co/400x400/f3f2ed/9d9b9b?text=No+Image',
                rank: newRank,
                status: 'published', // Automatically publish updated picks
                updated_at: new Date().toISOString(),
            };
            
            // Add tags only if they exist
            if (data.tags) {
              updateData.tags = data.tags;
            }
            
            const { error } = await supabase
              .from('picks')
              .update(updateData)
              .eq('id', selectedPick.id);

            if (error) {
              console.error('Supabase update error:', error);
              throw new Error(`Failed to update pick: ${error.message}`);
            }
          } else {
            // If we're creating a new pick
            // Create insert object with type that allows tags
            const insertData: Partial<Pick> & { tags?: string[] } = {
                profile_id: user?.id,
                title: data.title,
                description: data.description,
                reference: data.reference,
                image_url: data.image_url || 'https://placehold.co/400x400/f3f2ed/9d9b9b?text=No+Image',
                category: selectedCategory,
                rank: selectedRank || 0,
                status: 'published', // Automatically publish new picks
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };
            
            // Add tags only if they exist
            if (data.tags) {
              insertData.tags = data.tags;
            }
            
            const { error } = await supabase
              .from('picks')
              .insert(insertData);

            if (error) {
              console.error('Supabase insert error:', error);
              throw new Error(`Failed to create new pick: ${error.message}`);
            }
          }

          // Then, handle the displaced pick
          if (displacedPick) {
            let newRank = 0; // Default to archive
            
            // If we're reordering within top 3, swap the ranks
            if (isReorderingTopPicks && selectedPick) {
              newRank = selectedPick.rank; // Give the displaced pick the original rank of the selected pick
            }
            
            const { error } = await supabase
              .from('picks')
              .update({
                rank: newRank,
                updated_at: new Date().toISOString(),
              })
              .eq('id', displacedPick.id);

            if (error) {
              console.error('Supabase update error for displaced pick:', error);
              throw new Error(`Failed to update displaced pick: ${error.message}`);
            }
          }
          
          return true;
        },
        {
          maxRetries: 2, // Reduced from 3 to 2 for faster response
          initialDelay: 300, // Reduced initial delay
          maxDelay: 2000, // Reduced max delay
          onRetry: (attempt, _error) => {
            console.log(`Retrying save pick (${attempt}/2)...`);
            setUpdateMessage(`Connection issue. Retrying save (${attempt}/2)...`);
          }
        }
      );
      
      // Refresh local picks data
      setUpdateMessage('Refreshing your picks...');
      try {
        // Set a reasonable timeout for the fetch operation using AbortController
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        // Wait for data to be refreshed before closing the modal
        await fetchPicks();
        clearTimeout(timeoutId);
        
        // Show success message immediately
        setUpdateSuccess(true);
        setUpdateMessage('Your pick has been saved!');
        
        // Only close the modal after data has been refreshed
        setShowModal(false);
        setSelectedPick(null);
        setSelectedCategory(null);
        setSelectedRank(null);
      } catch (error) {
        console.log('Refresh operation error or timed out, continuing anyway');
        // Even if refresh fails, still close the modal
        setShowModal(false);
        setSelectedPick(null);
        setSelectedCategory(null);
        setSelectedRank(null);
      }
      
      // Refresh global app store data in the background without waiting
      setTimeout(() => {
        fetchFeedPicks().catch(err => console.error('Background refresh error:', err));
        fetchCurators().catch(err => console.error('Background refresh error:', err));
      }, 100);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setIsUpdating(false);
        setUpdateSuccess(false);
      }, 3000);
      
    } catch (error) {
      console.error('Error saving pick:', error);
      setUpdateSuccess(false);
      setUpdateMessage(handleSupabaseError(error, 'Error saving pick. Please try again.'));
      
      // Hide error message after 3 seconds
      setTimeout(() => {
        setIsUpdating(false);
      }, 3000);
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
      setPickToDelete(null);
    }
  };

  // Handle reordering of picks
  const handleReorder = React.useCallback(async (category: Category, newOrder: Pick[]) => {
    try {
      // Show update in progress
      setIsUpdating(true);
      setUpdateMessage('Updating your picks...');
      setUpdateSuccess(false);
      
      // Create a copy of the current picks state
      const updatedPicks = { ...picks };
      
      // Update the ranks in our local state first (for immediate UI feedback)
      updatedPicks[category] = updatedPicks[category].map(existingPick => {
        // Find if this pick was reordered
        const updatedPick = newOrder.find(p => p.id === existingPick.id);
        
        // If it was reordered, update its rank
        if (updatedPick && updatedPick.rank !== existingPick.rank) {
          return { ...existingPick, rank: updatedPick.rank };
        }
        
        // Otherwise keep it as is
        return existingPick;
      });
      
      // Update the UI immediately
      setPicks(updatedPicks);
      
      // Use withRetry to handle database updates with retry logic
      await withRetry(
        async () => {
          // Create update promises with retry logic
          const updatePromises = newOrder.map(pick => {
            return supabase
              .from('picks')
              .update({
                rank: pick.rank,
                status: 'published', // Automatically publish picks when reordered
                updated_at: new Date().toISOString(),
                last_updated_at: new Date().toISOString(),
              })
              .eq('id', pick.id);
          });
          
          // Wait for all updates to complete
          const results = await Promise.all(updatePromises);
          
          // Check for errors
          const errors = results.filter(result => result.error);
          if (errors.length > 0) {
            throw new Error(`Errors updating picks: ${JSON.stringify(errors)}`);
          }
          
          return true;
        },
        {
          maxRetries: 3,
          onRetry: (attempt, _error) => {
            console.log(`Retrying update picks (${attempt}/3)...`);
            setUpdateMessage(`Connection issue. Retrying update (${attempt}/3)...`);
          }
        }
      );
      
      // Update message to show we're syncing with other pages
      setUpdateMessage('Syncing with other pages...');
      
      // Use withRetry for app store updates as well
      await withRetry(
        async () => {
          // Refresh global app store data to ensure consistency across all pages
          // This is especially important for reordering since it affects the top 3 picks
          await fetchFeedPicks();
          await fetchCurators();
          return true;
        },
        {
          maxRetries: 2,
          onRetry: (attempt, _error) => {
            console.log(`Retrying sync with other pages (${attempt}/2)...`);
            setUpdateMessage(`Syncing with other pages... Retry ${attempt}/2`);
          }
        }
      );
      
      // Show success message
      setUpdateSuccess(true);
      setUpdateMessage('Your picks have been updated!');
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setIsUpdating(false);
        setUpdateSuccess(false);
      }, 3000);
      
    } catch (error) {
      console.error('Error reordering picks:', error);
      setUpdateSuccess(false);
      setUpdateMessage(handleSupabaseError(error, 'Error updating picks. Please try again.'));
      
      // Refresh from server to ensure consistency
      try {
        await fetchPicks();
      } catch (fetchError) {
        console.error('Error refreshing picks after failed update:', fetchError);
      }
      
      // Hide error message after 3 seconds
      setTimeout(() => {
        setIsUpdating(false);
      }, 3000);
    }
  }, [picks, fetchFeedPicks, fetchCurators, user]);

  // Memoize the renderGrid function to prevent unnecessary re-renders
  const renderGrid = React.useCallback((category: Category) => {
    // Get all picks for this category
    const categoryPicks = picks[category] || [];
    
    // Sort picks by rank
    // Make sure to prioritize picks with ranks 1-3 first
    const sortedPicks = [...categoryPicks].sort((a, b) => {
      const rankA = a.rank || 0;
      const rankB = b.rank || 0;
      
      // Ensure picks with ranks 1-3 are always at the beginning
      if (rankA >= 1 && rankA <= 3 && (rankB < 1 || rankB > 3)) return -1;
      if (rankB >= 1 && rankB <= 3 && (rankA < 1 || rankA > 3)) return 1;
      
      // Normal sort by rank
      return rankA - rankB;
    });
    
    // Define grid item and grid types
    type GridItem = {
      id: string;
      rank: number;
      pick?: Pick;
      isAddTile: boolean;
      isEmpty: boolean;
    };
    
    type Grid = {
      id: string;
      items: GridItem[];
    };
    
    // Create a compact representation of the picks without gaps
    const compactPicks: Array<Pick | null> = [];
    
    // Add all existing picks to the compact array
    sortedPicks.forEach(pick => {
      compactPicks.push(pick);
    });
    
    // Add the "Add" tile at the end
    compactPicks.push(null);
    
    // Calculate total number of items and grid count
    const totalItems = Math.max(9, Math.ceil(compactPicks.length / 9) * 9);
    const gridCount = Math.ceil(totalItems / 9);
    
    // Create grid data for each 3x3 grid
    const grids: Grid[] = [];
    
    for (let gridIndex = 0; gridIndex < gridCount; gridIndex++) {
      const startIndex = gridIndex * 9;
      const endIndex = Math.min(startIndex + 9, compactPicks.length);
      
      // Create items for this grid (always 9 items per grid)
      const items: GridItem[] = [];
      
      for (let j = 0; j < 9; j++) {
        const index = startIndex + j;
        const isLastGrid = gridIndex === gridCount - 1;
        
        if (index < compactPicks.length) {
          const pick = compactPicks[index];
          const isAddTile = pick === null;
          
          items.push({
            id: pick ? pick.id : `${category}-grid${gridIndex}-${j}`,
            rank: pick ? pick.rank : index + 1,
            pick: pick || undefined,
            isAddTile: isAddTile,
            isEmpty: false
          });
        } else {
          // Fill remaining slots with empty tiles
          items.push({
            id: `${category}-grid${gridIndex}-${j}`,
            rank: index + 1,
            pick: undefined,
            isAddTile: false,
            isEmpty: true
          });
        }
      }
      
      grids.push({
        id: `${category}-grid-${gridIndex}`,
        items
      });
    }
    
    // Handle drag end event
    const handleDragEnd = (event: DragEndEvent) => {
      const { active, over } = event;
      
      if (!over || active.id === over.id) return;
      
      // Find the dragged item and the target item across all grids
      let activeItem;
      let overItem;
      
      for (const grid of grids) {
        for (const item of grid.items) {
          if (item.id === active.id) activeItem = item;
          if (item.id === over.id) overItem = item;
          if (activeItem && overItem) break;
        }
        if (activeItem && overItem) break;
      }
      
      // Validate that we have both items and the active item has a pick
      if (!activeItem || !activeItem.pick) return;
      if (!overItem) return;
      
      // CRITICAL BUG FIX: Prevent dragging to placeholder/empty tiles
      // Only allow dragging to another actual pick or to a valid empty slot (not a placeholder)
      if (overItem.isEmpty && !overItem.pick) {
        console.log('Cannot drag to placeholder tile');
        return; // Prevent the drag operation
      }
      
      // Create updated picks with new ranks
      const updatedPicks: Pick[] = [];
      
      // If we're swapping with another pick
      if (overItem.pick) {
        updatedPicks.push({
          ...activeItem.pick,
          rank: overItem.rank
        });
        
        updatedPicks.push({
          ...overItem.pick,
          rank: activeItem.rank
        });
      } else {
        // We're moving to a valid empty slot (not a placeholder)
        updatedPicks.push({
          ...activeItem.pick,
          rank: overItem.rank
        });
      }
      
      // Call the handleReorder function to update the database
      handleReorder(category, updatedPicks);
    };
    
    // Set up sensors for drag and drop
    const sensors = useSensors(
      useSensor(PointerSensor, {
        activationConstraint: { distance: 10 }
      }),
      useSensor(TouchSensor, {
        activationConstraint: { delay: 250, tolerance: 5 }
      }),
      useSensor(KeyboardSensor, {
        coordinateGetter: sortableKeyboardCoordinates
      })
    );
    
    // Flatten all items from all grids into a single array for the DndContext
    const allItems = grids.flatMap(grid => grid.items);
    
    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={allItems.map(item => item.id)} strategy={rectSortingStrategy}>
          <div className="flex flex-col gap-8">
            {grids.map((grid) => (
              <div key={grid.id} className="flex flex-col">
                <div className="grid grid-cols-3 gap-[10px] w-full">
                  {grid.items.map((item) => {
                    const rank = item.rank;
                    const pick = item.pick;
                    const isAddTile = item.isAddTile;
                    const isEmpty = item.isEmpty;
                    
                    return (
                      <SortableItem
                        key={item.id}
                        id={item.id}
                        pick={pick}
                        category={category}
                        rank={rank}
                        isAddTile={isAddTile}
                        isEmpty={isEmpty}
                        isActive={profileState?.status === 'active'}
                        onPickClick={handlePickClick}
                        onAddPick={handleAddPick}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    );
  }, [picks, fetchFeedPicks, fetchCurators, user]);

  // Enhanced useEffect to ensure data loads properly on first login
  React.useEffect(() => {
    if (user) {
      fetchProfile();
      fetchPicks();
      fetchFeedPicks();
      fetchCurators();
      
      console.log('MyThreesPage: Initial data fetch triggered');
    }
  }, [user, fetchFeedPicks, fetchCurators]);

  // Debug profile state
  React.useEffect(() => {
    console.log('Profile State:', profileState);
  }, [profileState]);

  return (
    <div className="min-h-screen pb-24 md:px-8 px-0" data-component-name="MyThreesPage">

      {/* Update Status Notification - Improved for mobile */}
      {isUpdating && (
        <div 
          className={`fixed bottom-20 md:bottom-6 left-1/2 transform -translate-x-1/2 py-3 px-8 rounded-full shadow-lg z-50 flex items-center gap-3 transition-all duration-300 w-auto min-w-[280px] max-w-[calc(100vw-2rem)] md:max-w-[400px] ${updateSuccess ? 'bg-green-500 text-white' : 'bg-[#f5ffde] text-[#252525]'}`}
        >
          {!updateSuccess && (
            <svg className="animate-spin h-5 w-5 text-[#252525]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          {updateSuccess && (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
          <span className="font-medium text-sm md:text-base text-center">{updateMessage}</span>
        </div>
      )}
      
      {/* SubNav moved to App.tsx for consistency */}
      <div className="md:mt-8" style={{ marginTop: '0.25rem' }} data-component-name="MyThreesPage">
        {/* Collections Section - Only visible for approved curators */}
        {profileState?.status === 'approved' && (
          <>
            <CollectionsSection 
              userId={user?.id || ''}
              onCreateCollection={handleCreateCollection}
              onEditCollection={handleEditCollection}
            />
            

          </>
        )}
        
        {/* Legacy Collections Section - Only visible for active curators */}
        {profileState?.status === 'active' && (
          <>
            <MyCollectionsList 
              userId={user?.id || ''}
              onCreateCollection={handleCreateCollection}
              onEditCollection={handleEditCollection}
            />
            

          </>
        )}
        
        {/* Mobile Tabs - More modern with smooth transition */}
        <div className="md:hidden w-full mb-6" style={{ marginTop: '0.25rem' }} data-component-name="MyThreesPage">
          <div className="flex relative border-b border-gray-200 overflow-hidden">
            <button
              onClick={() => setActiveTab('books')}
              className={`flex-1 py-3 font-medium text-sm ${activeTab === 'books' ? 'text-[#252525]' : 'text-gray-400'} flex items-center justify-center`}
            >
              <Book size={20} />
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`flex-1 py-3 font-medium text-sm ${activeTab === 'products' ? 'text-[#252525]' : 'text-gray-400'} flex items-center justify-center`}
            >
              <Package size={20} />
            </button>
            <button
              onClick={() => setActiveTab('places')}
              className={`flex-1 py-3 font-medium text-sm ${activeTab === 'places' ? 'text-[#252525]' : 'text-gray-400'} flex items-center justify-center`}
            >
              <MapPin size={20} />
            </button>
            {/* Animated indicator */}
            <div 
              className="absolute bottom-0 h-0.5 bg-[#252525] transition-all duration-300 ease-in-out" 
              style={{
                left: activeTab === 'books' ? '0%' : activeTab === 'products' ? '33.333%' : '66.666%',
                width: '33.333%'
              }}
            ></div>
          </div>
        </div>
        
        {/* Mobile Tab Content with Transitions */}
        <div className="md:hidden w-full">
          <div className="relative overflow-hidden">
            {/* Books Tab */}
            <div 
              className={`transition-all duration-500 ease-in-out ${activeTab === 'books' ? 'opacity-100 translate-x-0' : 'opacity-0 absolute inset-0 translate-x-full'}`}
              style={{ display: activeTab === 'books' ? 'block' : 'none' }}
            >
              <div className="md:mb-6 p-6" data-component-name="MyThreesPage">
                <div className="flex items-center justify-between">
                  <h2 className="text-base md:text-lg font-semibold text-[#252525] font-mono">Books</h2>
                  <span className="text-sm font-mono text-gray-500">({picks['books'].length})</span>
                </div>
                <p className="text-[#585757] text-sm mb-6">Share your favorite books that have influenced you.</p>
              </div>
              <div className="w-full md:p-6 p-0" data-component-name="MyThreesPage">
                {renderGrid('books')}
              </div>
            </div>
            
            {/* Products Tab */}
            <div 
              className={`transition-all duration-500 ease-in-out ${activeTab === 'products' ? 'opacity-100 translate-x-0' : 'opacity-0 absolute inset-0 translate-x-full'}`}
              style={{ display: activeTab === 'products' ? 'block' : 'none' }}
            >
              <div className="md:mb-6 p-6" data-component-name="MyThreesPage">
                <div className="flex items-center justify-between">
                  <h2 className="text-base md:text-lg font-semibold text-[#252525] font-mono">Products</h2>
                  <span className="text-sm font-mono text-gray-500">({picks['products'].length})</span>
                </div>
                <p className="text-[#585757] text-sm mb-6">Curate your favorite products that you can't live without.</p>
              </div>
              <div className="w-full md:p-6 p-0" data-component-name="MyThreesPage">
                {renderGrid('products')}
              </div>
            </div>
            
            {/* Places Tab */}
            <div 
              className={`transition-all duration-500 ease-in-out ${activeTab === 'places' ? 'opacity-100 translate-x-0' : 'opacity-0 absolute inset-0 translate-x-full'}`}
              style={{ display: activeTab === 'places' ? 'block' : 'none' }}
            >
              <div className="md:mb-6 p-6" data-component-name="MyThreesPage">
                <div className="flex items-center justify-between">
                  <h2 className="text-base md:text-lg font-semibold text-[#252525] font-mono">Places</h2>
                  <span className="text-sm font-mono text-gray-500">({picks['places'].length})</span>
                </div>
                <p className="text-[#585757] text-sm mb-6">Showcase your favorite places that hold special meaning.</p>
              </div>
              <div className="w-full md:p-6 p-0" data-component-name="MyThreesPage">
                {renderGrid('places')}
              </div>
            </div>
          </div>
        </div>
        
        {/* Desktop Layout - Only visible on md screens and up */}
        <div className="hidden md:flex md:flex-row w-full mt-8">
          {/* Books Column */}
          <div className="flex-1 pb-8" style={{ padding: '1.5rem' }}>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-base md:text-lg font-semibold text-[#252525] font-mono">Books</h2>
              <span className="text-sm font-mono text-gray-500">
                ({picks['books'].length})
              </span>
            </div>
            <p className="text-[#585757] text-sm mb-6">Share your favorite books that have influenced you.</p>
            <div className="w-full">
              {renderGrid('books')}
            </div>
          </div>
          
          {/* Divider between Books and Products */}
          <div className="w-px bg-[#e0e0e0] mx-6" style={{ marginLeft: '2rem', marginRight: '2rem' }}></div>
          
          {/* Products Column */}
          <div className="flex-1 pb-8" style={{ padding: '1.5rem' }}>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-base md:text-lg font-semibold text-[#252525] font-mono">Products</h2>
              <span className="text-sm font-mono text-gray-500">
                ({picks['products'].length})
              </span>
            </div>
            <p className="text-[#585757] text-sm mb-6">Curate your favorite products that you can't live without.</p>
            <div className="w-full">
              {renderGrid('products')}
            </div>
          </div>
          
          {/* Divider between Products and Places */}
          <div className="w-px bg-[#e0e0e0] mx-6" style={{ marginLeft: '2rem', marginRight: '2rem' }}></div>
          
          {/* Places Column */}
          <div className="flex-1 pb-8" style={{ padding: '1.5rem' }}>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-base md:text-lg font-semibold text-[#252525] font-mono">Places</h2>
              <span className="text-sm font-mono text-gray-500">
                ({picks['places'].length})
              </span>
            </div>
            <p className="text-[#585757] text-sm mb-6">Showcase your favorite places that hold special meaning.</p>
            <div className="w-full">
              {renderGrid('places')}
            </div>
          </div>
        </div>
      </div>

      {/* Item Modal */}
      <ItemModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedPick(null);
          setSelectedCategory(null);
          setSelectedRank(null);
        }}
        onSubmit={handleSave}
        onDelete={selectedPick && (!profileState?.status || profileState.status !== 'active' || !selectedPick.rank || selectedPick.rank > 3) ? () => confirmDelete(selectedPick) : undefined}
        initialData={selectedPick ? {
          title: selectedPick.title || '',
          description: selectedPick.description || '',
          reference: selectedPick.reference || '',
          imageUrl: selectedPick.image_url || '',
          category: selectedCategory || 'books',
          rank: selectedRank || 0,
          // @ts-ignore - tags property exists in the database schema but not in the TypeScript type yet
          tags: Array.isArray((selectedPick as any).tags) ? (selectedPick as any).tags : []
        } : undefined}
      />

      {/* Collection Modal */}
      <CollectionModal
        isOpen={isCollectionModalOpen}
        onClose={() => setIsCollectionModalOpen(false)}
        onSave={handleSaveCollection}
        collection={selectedCollection}
        userPicks={Object.values(picks).flat()}
      />

      {/* Delete Confirmation Modal */}
      <Transition appear show={showDeleteConfirm} as={React.Fragment}>
        <Dialog
          as="div"
          className="relative z-[10000]" /* Increased z-index to ensure it's on top of everything */
          onClose={() => setShowDeleteConfirm(false)}
        >
          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-75" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto z-[10001]">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={React.Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all relative z-[10002]">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900"
                  >
                    Delete Pick
                  </Dialog.Title>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Are you sure you want to delete this pick? This action cannot be undone.
                    </p>
                  </div>

                  <div className="mt-4 flex justify-end gap-2">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
                      onClick={() => setShowDeleteConfirm(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-red-100 px-4 py-2 text-sm font-medium text-red-900 hover:bg-red-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                      onClick={() => {
                        if (pickToDelete) {
                          handleDelete(pickToDelete);
                        }
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};

export default MyThreesPage;
