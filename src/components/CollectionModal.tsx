import { useState, useEffect, Fragment, useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Check, Maximize2, Minimize2 } from 'lucide-react';
import { Pick } from '../types';
import { ImageUpload } from './ImageUpload';
import { uploadImage, supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import LexicalEditor, { LexicalEditorRefMethods } from './LexicalEditor';
import './CategoryFilter.css';

// Define Category type locally until it's properly exported from types
type Category = 'places' | 'products' | 'books' | 'arts' | 'design' | 'interiors' | 'fashion' | 'food' | 'music' | 'travel';

// Define Collection type locally until it's properly exported from types
type CollectionType = {
  id: string;
  profile_id: string;
  title: string;
  description: string;
  categories: Category[];
  picks: string[];
  cover_image?: string;
  font_color?: 'dark' | 'light';
  created_at: string;
  updated_at: string;
};

interface CollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (collection: Partial<CollectionType>) => Promise<void>;
  collection?: CollectionType;
  userPicks: Pick[];
}

export function CollectionModal({ 
  isOpen, 
  onClose, 
  onSave, 
  collection, 
  userPicks 
}: CollectionModalProps) {
  const { } = useAuth(); // We get the user directly in handleImageUpload
  const formContainerRef = useRef<HTMLFormElement>(null);
  const editorRef = useRef<LexicalEditorRefMethods>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const [selectedPicks, setSelectedPicks] = useState<string[]>([]);
  const [coverImage, setCoverImage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [imageLoading, setImageLoading] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [darkFont, setDarkFont] = useState(true); // Default to dark font
  
  // For swipe gesture detection (mobile only)
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchEndY = useRef<number | null>(null);
  const minSwipeDistance = 100;
  
  // For swipe visual feedback
  const [swipeProgress, setSwipeProgress] = useState(0);
  const [isSwipeActive, setIsSwipeActive] = useState(false);
  
  // Reset form when modal opens or collection changes
  useEffect(() => {
    if (isOpen) {
      if (collection) {
        setTitle(collection.title || '');
        setDescription(collection.description || '');
        setSelectedCategories(collection.categories || []);
        setSelectedPicks(collection.picks || []);
        
        // Set font color if available
        if (collection.font_color) {
          setDarkFont(collection.font_color === 'dark');
        }
        
        // Try to get cover image from localStorage if not in collection object
        if (collection.cover_image) {
          setCoverImage(collection.cover_image);
        } else if (collection.id) {
          try {
            const storedCoverImage = localStorage.getItem(`collection_cover_${collection.id}`);
            if (storedCoverImage) {
              setCoverImage(storedCoverImage);
            } else {
              setCoverImage('');
            }
          } catch (e) {
            console.log('Failed to retrieve cover image from localStorage', e);
            setCoverImage('');
          }
        } else {
          setCoverImage('');
        }
      } else {
        setTitle('');
        setDescription('');
        setSelectedCategories([]);
        setSelectedPicks([]);
        setCoverImage('');
        setDarkFont(true); // Default to dark font for new collections
      }
      setError('');
    }
  }, [isOpen, collection]);
  
  const handleImageUpload = async (file: File) => {
    try {
      setImageLoading(true);
      
      // Get user ID for the file path
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User must be authenticated to upload images');
      }
      
      // Upload the image to Supabase storage
      const filePath = `collections/${user.id}`;
      const imageUrl = await uploadImage(file, filePath);
      setCoverImage(imageUrl);
    } catch (error) {
      console.error('Error uploading image:', error);
      setError(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setImageLoading(false);
    }
  };

  // Handle image upload for the rich text editor
  const handleEditorImageUpload = async () => {
    try {
      // Create a file input element
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      
      // Handle file selection
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) return;
        
        // Validate file type and size
        if (!file.type.startsWith('image/')) {
          setError('Please select an image file');
          return;
        }
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
          setError('Image size must be less than 5MB');
          return;
        }
        
        try {
          // Get user ID for the file path
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            throw new Error('User must be authenticated to upload images');
          }
          
          // Upload the image to Supabase storage
          const filePath = `collections/descriptions/${user.id}`;
          const imageUrl = await uploadImage(file, filePath);
          
          // Insert the image into the editor
          if (editorRef.current) {
            editorRef.current.insertImage(imageUrl);
          }
        } catch (error) {
          console.error('Error uploading image:', error);
          setError(error instanceof Error ? error.message : 'Failed to upload image');
        }
      };
      
      // Trigger the file input click
      input.click();
    } catch (error) {
      console.error('Error creating file input:', error);
      setError('Failed to open file selector');
    }
  };

  const handleSave = async () => {
    // Validate form
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    
    if (selectedPicks.length < 3) {
      setError('Please select at least 3 picks');
      return;
    }
    
    if (selectedPicks.length > 9) {
      setError('You can select up to 9 picks');
      return;
    }
    
    if (selectedCategories.length === 0) {
      setError('Please select at least one category');
      return;
    }
    
    try {
      setIsSaving(true);
      
      // Prepare collection data
      const collectionData: Partial<CollectionType> = {
        title,
        description,
        categories: selectedCategories,
        picks: selectedPicks,
        font_color: darkFont ? 'dark' : 'light', // Save font color preference
      };
      
      // Only include cover_image if it has a value
      if (coverImage) {
        collectionData.cover_image = coverImage;
      }
      
      // If editing, include the ID
      if (collection?.id) {
        collectionData.id = collection.id;
      }
      
      // Save collection
      await onSave(collectionData);
      
      // Close modal
      onClose();
    } catch (error) {
      console.error('Error saving collection:', error);
      setError('Failed to save collection. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleCategoryToggle = (category: Category) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category) 
        : [...prev, category]
    );
  };
  
  const handlePickToggle = (pickId: string) => {
    setSelectedPicks(prev => 
      prev.includes(pickId) 
        ? prev.filter(id => id !== pickId) 
        : [...prev, pickId]
    );
  };
  
  const allCategories: Category[] = ['books', 'products', 'places', 'arts', 'design', 'interiors', 'fashion', 'food', 'music', 'travel'];
  
  // Handle touch events for swipe detection (mobile only)
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
    
    // Check if starting from left edge (mobile only)
    if (touch.clientX < 50 && window.innerWidth < 768) {
      setIsSwipeActive(true);
      setSwipeProgress(0);
    }
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchEndX.current = touch.clientX;
    touchEndY.current = touch.clientY;
    
    // If starting from left edge and swiping right (mobile only)
    if (touchStartX.current !== null && touchStartX.current < 50 && window.innerWidth < 768) {
      const deltaX = touch.clientX - touchStartX.current;
      const deltaY = touch.clientY - (touchStartY.current || 0);
      
      if (deltaX > 30 && Math.abs(deltaY) < Math.abs(deltaX)) {
        e.preventDefault();
        e.stopPropagation();
        
        // Update swipe progress for visual feedback (unlimited swipe)
        const progress = deltaX / window.innerWidth; // Use full screen width
        setSwipeProgress(Math.max(0, progress));
      }
    }
  };
  
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartX.current || !touchEndX.current) {
      // Reset swipe state
      setIsSwipeActive(false);
      setSwipeProgress(0);
      return;
    }
    
    const deltaX = touchEndX.current - touchStartX.current;
    const deltaY = (touchEndY.current || 0) - (touchStartY.current || 0);
    
    // Check for left-edge swipe to close (swipe right from left edge, mobile only)
    if (touchStartX.current < 50 && deltaX > 100 && Math.abs(deltaY) < Math.abs(deltaX) && window.innerWidth < 768) {
      e.preventDefault();
      e.stopPropagation();
      
      // Animate to full close
      setSwipeProgress(1);
      
      // Close after animation
      setTimeout(() => {
        onClose();
      }, 200);
      return;
    }
    
    // Reset swipe state
    setIsSwipeActive(false);
    setSwipeProgress(0);
    
    // Reset values
    touchStartX.current = null;
    touchEndX.current = null;
    touchStartY.current = null;
    touchEndY.current = null;
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[999]" onClose={onClose}>
        {/* Overlay backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
        </Transition.Child>

        {/* Full screen container with proper z-index */}
        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <Transition.Child
              as={Fragment}
              enter="transform transition ease-in-out duration-300"
              enterFrom="translate-x-full"
              enterTo="translate-x-0"
              leave="transform transition ease-in-out duration-300"
              leaveFrom="translate-x-0"
              leaveTo="translate-x-full"
            >
              <Dialog.Panel 
                className={`pointer-events-auto fixed inset-y-0 ${isFullScreen ? 'inset-x-0' : 'inset-x-0 md:right-0 md:left-auto'} flex ${isFullScreen ? '' : 'md:pl-10'} transform-gpu transition-transform duration-200 ease-out`}
                style={{
                  transform: isSwipeActive && window.innerWidth < 768 
                    ? `translateX(${swipeProgress * window.innerWidth}px)` 
                    : undefined
                }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <div className={`flex h-full w-full flex-col overflow-y-auto bg-card shadow-xl relative`}>
                  {/* Swipe progress indicator (mobile only) */}
                  {isSwipeActive && window.innerWidth < 768 && (
                    <div 
                      className="absolute left-0 top-0 bottom-0 bg-primary transition-all duration-200 ease-out z-50"
                      style={{
                        width: `${Math.max(2, Math.min(swipeProgress * 6, 6))}px`,
                        opacity: Math.min(swipeProgress * 0.8, 0.8)
                      }}
                    />
                  )}
                  <div className="sticky top-0 z-10 bg-card px-6 py-4 border-b border-border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <button
                          type="button"
                          onClick={onClose}
                          className="px-3 py-1.5 text-muted-foreground bg-secondary rounded-md hover:bg-secondary/80 transition-colors text-sm"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="text-muted-foreground hover:text-foreground transition-colors hidden md:block ml-2"
                          onClick={() => setIsFullScreen(!isFullScreen)}
                          aria-label={isFullScreen ? "Exit full screen" : "Enter full screen"}
                        >
                          {isFullScreen ? (
                            <Minimize2 className="w-5 h-5" />
                          ) : (
                            <Maximize2 className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                      <div className="flex items-center space-x-3">
                        <button
                          type="button"
                          onClick={handleSave}
                          disabled={isSaving}
                          className="px-3 py-1.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 text-sm"
                        >
                          {isSaving ? 'Saving...' : 'Save'}
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <form ref={formContainerRef} className="flex-1 overflow-y-auto p-6 space-y-6" data-component-name="CollectionModal">
                    {error && (
                      <div className="p-3 bg-destructive/10 text-destructive rounded-md border border-destructive/20">
                        {error}
                      </div>
                    )}
                    
                    <div className="space-y-4">
                      {/* Title */}
                      <div>
                        <label htmlFor="title" className="block text-sm font-medium text-foreground mb-2">
                          Title
                        </label>
                        <input
                          type="text"
                          id="title"
                          className="w-full rounded-lg bg-secondary border-0 shadow-none focus:ring-0 p-3 text-foreground placeholder:text-muted-foreground"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="Collection title"
                          required
                        />
                      </div>
                      
                      {/* Cover Image Upload */}
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Cover Image
                        </label>
                        <div className="relative w-full flex items-start justify-between bg-secondary p-4 rounded-lg">
                          <div className="flex flex-col items-center">
                            <div className="relative w-[125px] h-[175px] rounded-lg overflow-hidden">
                              <ImageUpload
                                onImageSelected={handleImageUpload}
                                currentUrl={coverImage}
                                buttonText="Upload Cover Image"
                                loading={imageLoading}
                                className="w-full h-full"
                                title={title}
                                darkFont={darkFont}
                                showInstructions={false}
                              />
                            </div>
                          </div>
                          
                          <div className="ml-4 flex-1">
                            <div className="text-sm text-foreground">
                              <p className="font-medium mb-2 text-foreground">Upload an image to use as the cover for your collection.</p>
                              <ul className="list-disc pl-5 space-y-1 text-xs text-muted-foreground">
                                <li>Recommended size: 5:7 ratio</li>
                                <li>Formats: PNG, JPG, GIF (up to 5MB)</li>
                                <li>Images will be optimized automatically</li>
                              </ul>
                            </div>
                          </div>
                        </div>

                        
                        {/* Font Color Toggle */}
                        <div className="mt-3 flex items-center flex-wrap">
                          <label className="block text-sm font-medium text-foreground mr-3">
                            Font Color:
                          </label>
                          <div className="flex space-x-3">
                            <button
                              type="button"
                              onClick={() => setDarkFont(true)}
                              className={`px-3 py-1.5 rounded-md transition-colors ${darkFont ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'}`}
                            >
                              Dark
                            </button>
                            <button
                              type="button"
                              onClick={() => setDarkFont(false)}
                              className={`px-3 py-1.5 rounded-md transition-colors ${!darkFont ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'}`}
                            >
                              Light
                            </button>
                          </div>

                        </div>
                        

                      </div>
                      
                      {/* Categories */}
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Categories
                        </label>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 bg-secondary p-3 rounded-lg">
                          {allCategories.map((category) => (
                            <div key={category} className="flex items-center">
                              <input
                                id={`category-${category}`}
                                name="categories"
                                type="checkbox"
                                className="h-4 w-4 text-black rounded-full outline-none focus:ring-0 focus:ring-offset-0"
                                checked={selectedCategories.includes(category)}
                                onChange={() => handleCategoryToggle(category)}
                              />
                              <label
                                htmlFor={`category-${category}`}
                                className="ml-2 text-sm text-foreground capitalize"
                              >
                                {category}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    
                      {/* Picks Selection */}
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Select Picks (3-9)
                        </label>
                        <p className="text-sm text-muted-foreground mb-2">
                          Selected: {selectedPicks.length}/9
                        </p>
                        
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 bg-secondary p-4 rounded-lg">
                          {userPicks.map((pick) => (
                            <label 
                              key={pick.id} 
                              className={`
                                relative border rounded-lg p-3 cursor-pointer transition-all bg-card flex items-start space-x-3
                                ${selectedPicks.includes(pick.id) ? 'border-primary/30' : 'border-border hover:border-primary/50'}
                              `}
                            >
                              <input
                                type="checkbox"
                                checked={selectedPicks.includes(pick.id)}
                                onChange={() => handlePickToggle(pick.id)}
                                className="h-4 w-4 text-black rounded-full outline-none focus:ring-0 focus:ring-offset-0 mt-1"
                              />
                              <div className="flex-shrink-0 h-16 w-16 rounded-md overflow-hidden bg-secondary">
                                {pick.image_url ? (
                                  <img 
                                    src={pick.image_url} 
                                    alt={pick.title} 
                                    className="h-full w-full object-cover"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=No+Image';
                                    }}
                                  />
                                ) : (
                                  <div className="h-full w-full flex items-center justify-center bg-secondary text-muted-foreground text-xs">No Image</div>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-foreground truncate">{pick.title}</p>
                                <p className="text-xs text-muted-foreground truncate">{pick.reference}</p>
                                <div className="mt-1">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-secondary text-foreground capitalize">
                                    {pick.category}
                                  </span>
                                  {pick.rank > 0 && pick.rank <= 3 && (
                                    <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-secondary text-foreground">
                                      Rank {pick.rank}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      {/* Description - moved to bottom with rich text editor */}
                      <div>
                        <label htmlFor="description" className="block text-sm font-medium text-foreground mb-2">
                          Description
                        </label>
                        <div className="bg-secondary rounded-lg overflow-hidden">
                          <LexicalEditor
                            value={description}
                            onChange={setDescription}
                            placeholder="Describe your collection..."
                            className="min-h-[200px]"
                            autoFocus={false}
                            ref={editorRef}
                            onImageUpload={handleEditorImageUpload}
                          />
                        </div>
                      </div>
                    </div>
                  </form>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
