import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Trash2, Maximize2, Minimize2 } from 'lucide-react';
import { SimpleImageUpload } from './SimpleImageUpload';
import { uploadImage } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import LexicalEditor, { LexicalEditorRefMethods } from './LexicalEditor';
import { INSERT_IMAGE_COMMAND } from './editor/ImageNode';
import { INSERT_VIDEO_COMMAND } from './editor/VideoNode';

type ItemModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  onDelete?: () => void;
  initialData?: {
    title: string;
    description: string;
    reference: string;
    imageUrl: string;
    category: 'books' | 'places' | 'products';
    rank: number;
    tags?: string[];
  };

};

export function ItemModal({ isOpen, onClose, onSubmit, onDelete, initialData }: ItemModalProps) {
  const { user } = useAuth();
  const [formData, setFormData] = React.useState({
    title: '',
    description: '',
    reference: '',
    imageUrl: '',
    imageFile: null as File | null,
    category: 'books' as 'books' | 'places' | 'products',
    rank: 0,
    tags: initialData?.tags || [] as string[]
  });
  const [saving, setSaving] = React.useState(false);
  const [imageError, setImageError] = React.useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = React.useState(false);

  const handleImageSelected = (file: File) => {
    try {
      setImageError(null);
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setImageError('Please select an image file');
        return;
      }
      
      // Validate file size
      if (file.size > 5 * 1024 * 1024) { // 5MB
        setImageError('Image size must be less than 5MB');
        return;
      }
      
      // Set the file and create a preview URL
      setFormData(prev => ({
        ...prev,
        imageFile: file,
        imageUrl: URL.createObjectURL(file)
      }));
    } catch (error) {
      console.error('Error handling selected image:', error);
      setImageError(error instanceof Error ? error.message : 'Error handling selected image');
    }
  };

  // State for tag input
  const [tagsInput, setTagsInput] = React.useState('');
  const [isAddingTag, setIsAddingTag] = React.useState(false);
  
  // Function to add a tag
  const addTag = () => {
    // Handle comma-separated tags
    if (tagsInput.includes(',')) {
      const tagParts = tagsInput.split(',');
      const lastPart = tagParts.pop() || '';
      
      // Add all complete tags (parts before the last comma)
      const newTags = [...formData.tags];
      tagParts.forEach(tag => {
        const trimmedTag = tag.trim();
        if (trimmedTag !== '' && !formData.tags.includes(trimmedTag) && !newTags.includes(trimmedTag)) {
          newTags.push(trimmedTag);
        }
      });
      
      setFormData({ ...formData, tags: newTags });
      setTagsInput(lastPart); // Keep the part after the last comma
    } else {
      // Handle single tag
      const newTag = tagsInput.trim();
      if (newTag !== '' && !formData.tags.includes(newTag)) {
        const newTags = [...formData.tags, newTag];
        setFormData({ ...formData, tags: newTags });
        setTagsInput('');
      }
    }
  };

  // Create a ref for the form container
  const formContainerRef = React.useRef<HTMLFormElement>(null);

  React.useEffect(() => {
    if (isOpen && initialData) {
      setFormData({
        ...initialData,
        description: (initialData.description && initialData.description.trim().startsWith('{')) ? initialData.description : '',
        imageFile: null,
        rank: initialData.rank,
        tags: initialData.tags || []
      });
      
      // Reset scroll position to top when modal opens
      setTimeout(() => {
        // Reset form container scroll
        if (formContainerRef.current) {
          formContainerRef.current.scrollTop = 0;
        }
        
        // Reset all scrollable containers in the modal
        const scrollableElements = document.querySelectorAll('.overflow-y-auto');
        scrollableElements.forEach(element => {
          (element as HTMLElement).scrollTop = 0;
        });
      }, 50); // Small delay to ensure DOM is updated
    } else if (isOpen) {
      setFormData({
        title: '',
        description: '',
        reference: '',
        imageUrl: '',
        imageFile: null,
        category: 'books',
        rank: 0,
        tags: []
      });
    }
  }, [isOpen, initialData]);

  // We're using handleToolbarImageClick for image uploads now

  // Initialize the Lexical editor with a ref
  const editorRef = React.useRef<LexicalEditorRefMethods>(null);
  
  // Track if an image is being uploaded
  const [isUploading, setIsUploading] = React.useState(false);
  
  // Track if the editor is ready
  const [isEditorReady, setIsEditorReady] = React.useState(false);
  
  // Track if the editor is ready for use
  // We'll check this directly when needed
  
  // This function will be passed to the ToolbarPlugin in LexicalEditor
  // to handle image uploads when the image button is clicked
  const handleToolbarImageClick = React.useCallback(() => {
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
        alert('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // Increased to 5MB
        alert('Image size must be less than 5MB');
        return;
      }
      
      try {
        // Check user authentication
        if (!user) {
          alert('You must be logged in to upload images.');
          return;
        }
        
        // Show loading state
        setIsUploading(true);
        
        // Upload the image to Supabase
        const imageUrl = await uploadImage(file, user.id);
        
        console.log('Inserting image into Lexical editor:', imageUrl);
        
        // Insert the image directly into the Lexical editor
        if (editorRef.current) {
          // Get the editor instance
          const editor = editorRef.current.getEditor();
          
          if (editor) {
            try {
              console.log('Attempting to insert image with URL:', imageUrl);
              
              // Focus the editor first to ensure we have a valid selection
              editor.focus();
              
              // Create a direct img element as a fallback approach
              const imgElement = document.createElement('img');
              imgElement.src = imageUrl;
              imgElement.alt = 'Uploaded image';
              imgElement.style.maxWidth = '100%';
              imgElement.style.height = 'auto';
              imgElement.style.display = 'block';
              imgElement.style.margin = '10px auto';
              
              // Verify the image loads correctly
              imgElement.onload = () => {
                console.log('Image loaded successfully, now inserting into editor');
                
                // Now dispatch the command with the verified image
                editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
                  src: imageUrl,
                  altText: 'Uploaded image',
                  width: 'auto',
                  height: 'auto',
                  showCaption: false
                });
                
                console.log('Image insertion command dispatched successfully');
                
                // Force editor update to ensure rendering
                editor.update(() => {
                  console.log('Forcing editor update after image insertion');
                });
              };
              
              // Handle image load errors
              imgElement.onerror = () => {
                console.error('Image failed to load from URL:', imageUrl);
                
                // Fallback to HTML insertion
                const currentDescription = formData.description || '';
                const imageHtml = `<img src="${imageUrl}" alt="Uploaded image" style="max-width: 100%; display: block; margin: 10px auto;" />`;
                const newDescription = currentDescription + imageHtml;
                
                setFormData(prev => ({
                  ...prev,
                  description: newDescription
                }));
                
                setIsUploading(false);
              };
            } catch (editorError) {
              console.error('Error inserting image into editor:', editorError);
              
              // Fallback to HTML insertion if the direct command fails
              const currentDescription = formData.description || '';
              const imageHtml = `<img src="${imageUrl}" alt="Uploaded image" style="max-width: 100%; display: block; margin: 10px auto;" />`;
              const newDescription = currentDescription + imageHtml;
              
              setFormData(prev => ({
                ...prev,
                description: newDescription
              }));
            }
          } else {
            console.error('Editor instance not available');
            // Fallback for when editor instance is not available
            const currentDescription = formData.description || '';
            const imageHtml = `<img src="${imageUrl}" alt="Uploaded image" style="max-width: 100%; display: block; margin: 10px auto;" />`;
            const newDescription = currentDescription + imageHtml;
            
            setFormData(prev => ({
              ...prev,
              description: newDescription
            }));
          }
        } else {
          // Fallback for when editor ref is not available
          console.error('Editor reference not available for image insertion');
          
          // Get the current description value
          const currentDescription = formData.description || '';
          
          // Create image HTML with proper styling
          const imageHtml = `<img src="${imageUrl}" alt="Uploaded image" style="max-width: 100%; display: block; margin: 10px auto;" />`;
          
          // Append the image HTML to the current description
          const newDescription = currentDescription + imageHtml;
          
          // Update the form data with the new description that includes the image
          setFormData(prev => ({
            ...prev,
            description: newDescription
          }));
        }
        
        // Hide loading state
        setIsUploading(false);
        
      } catch (error) {
        console.error('Error uploading image:', error);
        alert('Failed to upload image. Please try again.');
        setIsUploading(false);
      }
    };
    
    // Trigger the file input click (must be synchronous)
    input.click();
  }, [user, formData.description, editorRef]);
  
  React.useEffect(() => {
    // This effect will run when the component mounts
    console.log('Lexical editor component mounted');
    
    // Check if editor is initialized after a short delay
    const checkEditorTimer = setTimeout(() => {
      if (editorRef.current && editorRef.current.getEditor()) {
        console.log('Lexical editor is now ready');
        setIsEditorReady(true);
      } else {
        console.log('Lexical editor not ready yet, will check on first interaction');
      }
    }, 500);
    
    return () => clearTimeout(checkEditorTimer);
  }, []);

  // This function will be passed to the ToolbarPlugin in LexicalEditor
  // to handle video embeds when the video button is clicked
  const handleToolbarVideoClick = React.useCallback(() => {
    const url = window.prompt('Enter a video URL (YouTube, Vimeo, or direct .mp4/.webm/.ogg):');
    if (!url) return;
    if (editorRef.current) {
      const editor = editorRef.current.getEditor();
      if (editor) {
        editor.dispatchCommand(INSERT_VIDEO_COMMAND, {
          src: url,
          altText: '',
          width: '100%',
          height: 360,
          showCaption: false
        });
      }
    }
  }, [editorRef]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('You must be logged in to save picks');
      return;
    }

    setSaving(true);
    let finalImageUrl = formData.imageUrl;

    try {
      // Step 1: Validate required fields first before any expensive operations
      if (!formData.title?.trim()) {
        throw new Error('Title is required');
      }

      // Step 2: Upload image if one was selected (most time-consuming operation)
      if (formData.imageFile) {
        try {
          // Additional validation before upload
          if (!formData.imageFile.type.startsWith('image/')) {
            throw new Error('Invalid file type. Please select an image file.');
          }
          
          if (formData.imageFile.size > 5 * 1024 * 1024) { // 5MB
            throw new Error('Image size must be less than 5MB');
          }
          
          // Upload the image directly without using Promise.race
          // This prevents blocking clipboard operations
          if (!user) {
            alert('You must be logged in to upload images.');
            return;
          }
          finalImageUrl = await uploadImage(formData.imageFile, user.id);
        } catch (uploadError) {
          // Create a detailed error for image upload failures
          const errorMessage = uploadError instanceof Error ? uploadError.message : 'Unknown upload error';
          console.error('Image upload failed with error:', errorMessage);
          throw new Error(`Image upload failed: ${errorMessage}`);
        }
      }

      // Step 3: Prepare data for submission
      const submitData = {
        title: formData.title.trim(),
        description: formData.description || '',
        reference: formData.reference || '',
        image_url: finalImageUrl || 'https://placehold.co/400x400/f3f2ed/9d9b9d?text=No+Image',
        category: formData.category,
        rank: formData.rank,
        tags: formData.tags // Include tags in the submission
      };
      
      // Step 4: Submit the data directly without using Promise.race
      // This prevents blocking clipboard operations
      await onSubmit(submitData);
      
      // Don't close the modal here - let the parent component handle closing
      // after data is refreshed to ensure the modal shows updated content
      // The parent component (MyThreesPage) will call onClose() after data refresh
    } catch (error) {
      // Final error handler that captures all types of errors
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error in ItemModal submission process:', error);
      
      // Show a user-friendly error message
      alert(`Error: ${errorMessage}. Please try again.`);
    } finally {
      setSaving(false);
    }
  };

  // Dynamically set the label for the reference field based on category
  const getReferenceLabel = () => {
    switch (formData.category) {
      case 'books':
        return 'Author';
      case 'places':
        return 'City';
      case 'products':
        return 'Brand';
      default:
        return 'Reference';
    }
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
              <Dialog.Panel className={`pointer-events-auto fixed inset-y-0 ${isFullScreen ? 'inset-x-0' : 'inset-x-0 md:right-0 md:left-auto md:w-[700px]'} flex ${isFullScreen ? '' : 'md:pl-10'} transform-gpu`}>
                <div className={`flex h-full w-full flex-col overflow-y-auto bg-white shadow-xl`}>
                  {/* Top bar (sticky) */}
                  <div className={isFullScreen ? 'max-w-[700px] mx-auto w-full' : 'w-full'}>
                    <div className="sticky top-0 z-10 bg-white px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <button
                            type="button"
                            onClick={onClose}
                            className="px-3 py-1.5 text-[#585757] bg-[#F4F4F4] rounded-md hover:bg-gray-200 transition-colors text-sm"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            className="text-gray-600 hover:text-gray-900 transition-colors hidden md:block ml-2"
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
                          {onDelete && initialData?.rank && initialData.rank > 3 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onDelete();
                              }}
                              className="text-red-600 hover:text-red-800 transition-colors"
                              aria-label="Delete"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          )}
                          <button
                            type="submit"
                            form="item-form"
                            disabled={saving}
                            className="px-3 py-1.5 bg-[#252525] text-white rounded-md hover:bg-[#111111] transition-colors disabled:opacity-50 text-sm"
                          >
                            {saving ? 'Saving...' : 'Save'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Full-width border line below top bar */}
                  <div className="border-b border-gray-200 w-full" />
                  {/* Content wrapper for max width and centering in fullscreen */}
                  <div className={isFullScreen ? 'max-w-[700px] mx-auto w-full' : 'w-full'}>
                    <form id="item-form" ref={formContainerRef} onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-[#585757] mb-2">
                          {formData.category === 'places' ? 'Name of the place' : 
                           formData.category === 'products' ? 'Product name' : 
                           'Title'}
                        </label>
                        <input
                          type="text"
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          className="w-full rounded-lg bg-gray-100 border-0 shadow-none focus:ring-0 p-3"
                          placeholder={formData.category === 'places' ? 'Enter place name...' : formData.category === 'products' ? 'Enter product name...' : 'Enter book title...'}
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[#585757] mb-2">
                          {getReferenceLabel()}
                        </label>
                        <input
                          type="text"
                          value={formData.reference}
                          onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                          className="w-full rounded-lg bg-gray-100 border-0 shadow-none focus:ring-0 p-3"
                          placeholder={formData.category === 'places' ? 'Enter city or location...' : formData.category === 'products' ? 'Enter brand name...' : 'Enter author name...'}
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[#585757] mb-2">
                          Image
                        </label>
                        {imageError && (
                          <p className="text-red-500 text-sm mb-2">{imageError}</p>
                        )}
                        <div className="relative w-full h-64 flex items-center justify-center bg-gray-100 p-4 rounded-lg">
                          <SimpleImageUpload
                            onImageSelected={handleImageSelected}
                            currentUrl={formData.imageUrl}
                            buttonText="Upload Image"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[#585757] mb-2">
                          {formData.category === 'books' ? 'Book Tags' : 
                           formData.category === 'places' ? 'Place Tags' : 
                           'Product Tags'} (comma separated)
                        </label>
                        <div className="flex flex-wrap items-center gap-2 w-full rounded-lg bg-gray-100 border-0 shadow-none p-3">
                          {/* Display existing tags as pills */}
                          {formData.tags.map((tag: string, index: number) => (
                            <div key={index} className="flex items-center bg-gray-200 rounded-lg px-3 py-1.5 text-sm h-10">
                              <span>{tag}</span>
                              <button
                                type="button"
                                className="ml-2 text-gray-500 hover:text-gray-700 focus:outline-none"
                                onClick={() => {
                                  const newTags = [...formData.tags];
                                  newTags.splice(index, 1);
                                  setFormData({ ...formData, tags: newTags });
                                }}
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ))}
                          
                          {/* Only show input field when actively adding a tag or when there are no tags */}
                          {(isAddingTag || formData.tags.length === 0) && (
                            <div className="flex items-center flex-grow">
                              <input
                                type="text"
                                value={tagsInput}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  setTagsInput(value);
                                  // If a comma was just typed, process the tags
                                  if (value.includes(',')) {
                                    addTag();
                                  }
                                }}
                                onBlur={() => {
                                  // If input is empty when focus is lost, hide the input
                                  if (tagsInput.trim() === '' && formData.tags.length > 0) {
                                    setIsAddingTag(false);
                                  }
                                }}
                                onKeyDown={(e) => {
                                  // Handle Escape key to cancel adding a tag
                                  if (e.key === 'Escape') {
                                    setTagsInput('');
                                    setIsAddingTag(false);
                                  }
                                  // Handle backspace to remove the last tag when input is empty
                                  if (e.key === 'Backspace' && tagsInput === '' && formData.tags.length > 0) {
                                    const newTags = [...formData.tags];
                                    newTags.pop();
                                    setFormData({ ...formData, tags: newTags });
                                  }
                                  // Handle Enter key to add a tag
                                  if (e.key === 'Enter' && tagsInput.trim() !== '') {
                                    e.preventDefault();
                                    addTag();
                                    // Keep input visible if no tags yet
                                    if (formData.tags.length === 0) {
                                      setIsAddingTag(true);
                                    } else {
                                      setIsAddingTag(false);
                                    }
                                  }
                                }}
                                className="flex-grow bg-transparent border-0 shadow-none focus:ring-0 outline-none min-w-[120px]"
                                placeholder={formData.tags.length === 0 ? `Enter tags (e.g. ${formData.category === 'books' ? 'fiction, mystery' : 
                                  formData.category === 'places' ? 'beach, mountain' : 
                                  'tech, kitchen'})` : ''}
                              />
                              {tagsInput.trim() !== '' && (
                                <button
                                  type="button"
                                  className="ml-2 px-2 py-2 bg-gray-200 rounded-md text-xs text-gray-700 hover:bg-gray-300 focus:outline-none"
                                  onClick={() => {
                                    addTag();
                                    // Hide input after adding tag if there are already tags
                                    if (formData.tags.length > 0) {
                                      setIsAddingTag(false);
                                    }
                                  }}
                                >
                                  Add
                                </button>
                              )}
                            </div>
                          )}
                          
                          {/* Add button when there are tags and not currently adding a new one */}
                          {formData.tags.length > 0 && !isAddingTag && (
                            <button
                              type="button"
                              className="text-xs text-gray-500 hover:text-gray-700 focus:outline-none flex items-center px-2 py-2"
                              onClick={() => {
                                setIsAddingTag(true);
                                setTagsInput('');
                              }}
                            >
                              <span className="mr-1">+</span> Add
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="mb-6">
                        <label className="block text-sm font-medium text-[#585757] mb-2">
                          Your Story
                        </label>
                        <div className="bg-gray-100 rounded-lg border-0 shadow-none relative">
                          {isUploading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 z-10">
                              <div className="flex flex-col items-center">
                                <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                                <p className="mt-2 text-sm text-gray-600">Uploading image...</p>
                              </div>
                            </div>
                          )}
                          <LexicalEditor
                            ref={editorRef}
                            value={formData.description || ''}
                            onChange={(value) => {
                              // When we get the first onChange, we know the editor is ready
                              if (!isEditorReady && editorRef.current && editorRef.current.getEditor()) {
                                setIsEditorReady(true);
                              }
                              setFormData({ ...formData, description: value });
                            }}
                            placeholder={`Share why this ${formData.category === 'places' ? 'place' : formData.category === 'products' ? 'product' : 'book'} is meaningful to you...`}
                            className="border-0 shadow-none focus:ring-0"
                            autoFocus={false}
                            onImageUpload={handleToolbarImageClick}
                            onVideoUpload={handleToolbarVideoClick}
                          />
                        </div>
                      </div>


                    </form>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}