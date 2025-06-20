import React, { Fragment } from "react";
import { Dialog, Transition } from '@headlessui/react';
import { Maximize2, Minimize2, X } from 'lucide-react';
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { SimpleImageUpload } from './SimpleImageUpload';

import { LocationSelect } from './LocationSelect';
import type { Profile } from "../types";
import './ProfileEditModal.css';

type ProfileEditModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Profile>) => Promise<void>;
  initialData?: {
    full_name: string;
    title: string;
    username?: string;
    avatar_url: string;
    shelf_image_url?: string;
    bio?: string;
    location?: string;
    tags?: string[];
    social_links?: {
      twitter?: string;
      instagram?: string;
      website?: string;
    };
  };
};

export function ProfileEditModal({ 
  isOpen, 
  onClose, 
  onSubmit,
  initialData,
}: ProfileEditModalProps): JSX.Element {
  const { user } = useAuth();
  const [formData, setFormData] = React.useState({
    full_name: initialData?.full_name || '',
    title: initialData?.title || '',
    username: initialData?.username || '',
    avatar_url: initialData?.avatar_url || '',
    shelf_image_url: initialData?.shelf_image_url || '',
    bio: initialData?.bio || '',
    location: initialData?.location || '',
    tags: initialData?.tags || [] as string[],
    social_links: {
      twitter: initialData?.social_links?.twitter || '',
      instagram: initialData?.social_links?.instagram || '',
      website: initialData?.social_links?.website || ''
    }
  });
  const [uploading, setUploading] = React.useState(false);
  const [isFullScreen, setIsFullScreen] = React.useState(false);
  const formContainerRef = React.useRef<HTMLFormElement>(null);

  const [tagsInput, setTagsInput] = React.useState('');
  const [isAddingTag, setIsAddingTag] = React.useState(false);
  const [imageError, setImageError] = React.useState<string | null>(null);
  const [usernameError, setUsernameError] = React.useState<string | null>(null);
  const [checkingUsername, setCheckingUsername] = React.useState(false);
  const [usernameAvailable, setUsernameAvailable] = React.useState<boolean | null>(null);

  // Make sure we properly fetch and update all profile data when initialData changes
  React.useEffect(() => {
    if (initialData && user) {
      console.log('Initial profile data:', initialData);
      
      // Directly use the data from the profile
      setFormData({
        full_name: initialData.full_name || '',
        title: initialData.title || '',
        username: initialData.username || '',
        avatar_url: initialData.avatar_url || '',
        shelf_image_url: initialData.shelf_image_url || '',
        bio: initialData.bio || '',
        location: initialData.location || '',
        tags: initialData.tags || [],
        social_links: {
          twitter: initialData.social_links?.twitter || '',
          instagram: initialData.social_links?.instagram || '',
          website: initialData.social_links?.website || ''
        }
      });
      
      // Log the data being set
      console.log('Setting form data with tags:', initialData.tags);
      console.log('Setting form data with location:', initialData.location);
    }
  }, [initialData, user]);

  const handleAvatarUpload = async (file: File) => {
    if (!user) return;
    
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-avatar-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `profiles/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('picks')
        .upload(filePath, file);
        
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('picks')
        .getPublicUrl(filePath);
      
      setFormData(prev => ({
        ...prev,
        avatar_url: publicUrl
      }));
    } catch (error) {
      console.error('Error uploading avatar image:', error);
      alert('Error uploading avatar image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleShelfImageUpload = async (file: File) => {
    if (!user) return;
    
    setUploading(true);
    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setImageError('Please select an image file');
        return;
      }
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-shelf-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `profiles/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('picks')
        .upload(filePath, file);
        
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('picks')
        .getPublicUrl(filePath);
      
      setFormData(prev => ({
        ...prev,
        shelf_image_url: publicUrl
      }));
      setImageError(null);
    } catch (error) {
      console.error('Error uploading shelf image:', error);
      alert('Error uploading shelf image. Please try again.');
    } finally {
      setUploading(false);
    }
  };
  
  // Tags management
  const addTag = () => {
    // Handle comma-separated tags
    if (tagsInput.includes(',')) {
      const tagParts = tagsInput.split(',');
      const newTags = [...formData.tags];
      
      // Process all parts except the last one (which might be incomplete)
      for (let i = 0; i < tagParts.length - 1; i++) {
        const tag = tagParts[i].trim();
        if (tag && !newTags.includes(tag)) {
          newTags.push(tag);
        }
      }
      
      // Update form data with new tags
      setFormData({ ...formData, tags: newTags });
      
      // Keep the part after the last comma as the current input
      const lastPart = tagParts[tagParts.length - 1].trim();
      setTagsInput(lastPart);
    } else {
      // Handle single tag
      const newTag = tagsInput.trim();
      if (newTag && !formData.tags.includes(newTag)) {
        setFormData({ ...formData, tags: [...formData.tags, newTag] });
        setTagsInput('');
      }
    }
  };

  // Username validation
  const validateUsernameFormat = (username: string): boolean => {
    if (!username) return false;
    if (username.length < 3 || username.length > 20) return false;
    return /^[a-zA-Z0-9][a-zA-Z0-9_.-]*[a-zA-Z0-9]$/.test(username);
  };

  const checkUsernameAvailability = async (username: string): Promise<boolean> => {
    if (!username || !validateUsernameFormat(username)) return false;
    
    try {
      // Check if username exists in profiles table (excluding current user)
      const { data, error } = await supabase
        .from('profiles')
        .select('username, id')
        .ilike('username', username)
        .single();
      
      if (error) {
        // If no matching record found, username is available
        if (error.code === 'PGRST116') {
          return true;
        }
        throw error;
      }
      
      // If we got data but it's the current user's existing username, it's available
      if (data && initialData?.username && data.username.toLowerCase() === initialData.username.toLowerCase()) {
        return true;
      }
      
      // If we got data, username is taken by someone else
      return false;
    } catch (error) {
      console.error('Error checking username:', error);
      // If there's an error, assume username is available for better UX
      return true;
    }
  };

  const handleUsernameChange = async (username: string) => {
    // Clean username input
    const cleanUsername = username.toLowerCase().replace(/[^a-zA-Z0-9._-]/g, '');
    
    setFormData(prev => ({ ...prev, username: cleanUsername }));
    setUsernameError(null);
    setUsernameAvailable(null);
    
    if (!cleanUsername) return;
    
    // Validate format
    if (!validateUsernameFormat(cleanUsername)) {
      setUsernameError('Username must be 3-20 characters and contain only letters, numbers, dots, hyphens, and underscores');
      return;
    }
    
    // Skip availability check if it's the current username
    if (cleanUsername === initialData?.username) {
      setUsernameAvailable(true);
      return;
    }
    
    // Check availability
    setCheckingUsername(true);
    const isAvailable = await checkUsernameAvailability(cleanUsername);
    setUsernameAvailable(isAvailable);
    
    if (!isAvailable) {
      setUsernameError('Username is already taken');
    }
    
    setCheckingUsername(false);
  };

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault(); // Prevent form submission from redirecting
    
    if (!user) return;
    
    try {
      console.log('Submitting profile data:', formData);
      console.log('Tags to be saved:', formData.tags);
      console.log('Location to be saved:', formData.location);
      
      // Call the onSubmit prop with the form data
      await onSubmit({
        full_name: formData.full_name,
        title: formData.title,
        username: formData.username,
        avatar_url: formData.avatar_url,
        shelf_image_url: formData.shelf_image_url,
        bio: formData.bio,
        location: formData.location,
        tags: formData.tags,
        social_links: formData.social_links
      });
      
      // Close the modal after successful submission
      onClose();
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Error saving profile. Please try again.');
    }
  };

  // Disable background scrolling when modal is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      
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
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

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
                <div className={`flex h-full w-full flex-col overflow-y-auto bg-card shadow-xl`}>
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
                          onClick={handleSubmit}
                          disabled={uploading}
                          className="px-3 py-1.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 text-sm"
                        >
                          {uploading ? 'Saving...' : 'Save'}
                        </button>
                      </div>
                    </div>
                  </div>
                  <form id="profile-form" ref={formContainerRef} onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* Moved Shelf Background Image to the top */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Shelf Background Image
                    </label>
                    {imageError && (
                      <p className="text-destructive text-sm mb-2">{imageError}</p>
                    )}
                    <div className="relative w-full h-48 flex items-center justify-center bg-secondary p-4 rounded-lg">
                      <SimpleImageUpload
                        onImageSelected={handleShelfImageUpload}
                        currentUrl={formData.shelf_image_url}
                        buttonText="Upload Background"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Profile Picture
                    </label>
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <div className="h-20 w-20 rounded-full overflow-hidden bg-secondary">
                          {formData.avatar_url ? (
                            <img
                              src={formData.avatar_url}
                              alt="Profile"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                              <span className="text-3xl">{formData.full_name?.[0] || '?'}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'image/*';
                          input.onchange = (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0];
                            if (file) handleAvatarUpload(file);
                          };
                          input.click();
                        }}
                        disabled={uploading}
                        className="px-3 py-1.5 text-sm font-medium text-foreground bg-card border border-border rounded-lg hover:bg-secondary transition-colors focus:outline-none"
                      >
                        {uploading ? 'Uploading...' : 'Change'}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="full_name" className="block text-sm font-medium text-foreground mb-2">
                      Name
                    </label>
                      <input
                        type="text"
                        id="full_name"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        className="w-full rounded-lg bg-secondary border-0 shadow-none focus:ring-0 p-3 text-foreground"
                      />
                  </div>

                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-foreground mb-2">
                      Title
                    </label>
                      <input
                        type="text"
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full rounded-lg bg-secondary border-0 shadow-none focus:ring-0 p-3 text-foreground"
                      />
                  </div>

                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-foreground mb-2">
                      Username
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-muted-foreground text-sm">@</span>
                      </div>
                      <input
                        type="text"
                        id="username"
                        value={formData.username}
                        onChange={(e) => handleUsernameChange(e.target.value)}
                        placeholder="your-username"
                        className={`w-full rounded-lg bg-secondary border-0 shadow-none focus:ring-0 p-3 pl-7 text-foreground ${
                          usernameError ? 'bg-destructive/10' : usernameAvailable === true ? 'bg-green-500/10' : ''
                        }`}
                      />
                      {checkingUsername && (
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                          <div className="animate-spin h-4 w-4 border-2 border-border border-t-foreground rounded-full"></div>
                        </div>
                      )}
                      {!checkingUsername && usernameAvailable === true && formData.username && (
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                          <div className="h-4 w-4 text-green-500">✓</div>
                        </div>
                      )}
                    </div>
                    {usernameError && (
                      <p className="text-destructive text-sm mt-1">{usernameError}</p>
                    )}
                    {!usernameError && formData.username && (
                      <p className="text-muted-foreground text-sm mt-1">
                        Your profile will be available at: threesby.com/@{formData.username}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Interests
                    </label>
                    <div className="flex flex-wrap items-center gap-2 w-full rounded-lg bg-secondary border-0 shadow-none p-3">
                      {/* Display existing tags as pills */}
                      {formData.tags.map((tag: string, index: number) => (
                        <div key={index} className="flex items-center bg-neutral-200 dark:bg-[rgba(33,33,33,0.937)] border border-border rounded-lg px-3 py-1.5 text-sm h-10">
                          <span className="text-neutral-800 dark:text-neutral-200">{tag}</span>
                          <button
                            type="button"
                            className="ml-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 focus:outline-none"
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
                            placeholder={formData.tags.length === 0 ? `Enter interests (e.g. design, travel, food)` : ''}
                          />
                          {tagsInput.trim() !== '' && (
                            <button
                              type="button"
                              className="ml-2 px-2 py-2 bg-neutral-200 dark:bg-[rgba(33,33,33,0.937)] border border-border rounded-md text-xs text-neutral-800 dark:text-neutral-200 hover:bg-neutral-300 dark:hover:bg-[rgba(33,33,33,0.8)] focus:outline-none"
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
                          className="text-xs text-muted-foreground hover:text-foreground focus:outline-none flex items-center px-2 py-2"
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
                  
                  <div>
                    <label htmlFor="location" className="block text-sm font-medium text-foreground mb-2">
                      Location
                    </label>
                    <LocationSelect
                      value={formData.location}
                      onChange={(location) => setFormData({ ...formData, location })}
                      placeholder="Select or enter your location"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Bio
                    </label>
                    <div className="bg-secondary rounded-lg border-0 shadow-none relative">
                      <textarea
                        value={formData.bio || ''}
                        onChange={e => setFormData({ ...formData, bio: e.target.value })}
                        placeholder="Write something about yourself..."
                        className="w-full rounded-lg bg-secondary border-0 shadow-none focus:ring-0 p-3 min-h-[80px] text-foreground placeholder:text-muted-foreground"
                        rows={4}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Social Links
                    </label>
                    <div className="space-y-2">
                      {['twitter', 'instagram', 'website'].map((platform) => (
                        <div key={platform} className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={formData.social_links[platform as keyof typeof formData.social_links] || ''}
                            placeholder={`${platform} URL`}
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                social_links: {
                                  ...formData.social_links,
                                  [platform]: e.target.value
                                }
                              });
                            }}
                            className="w-full rounded-lg bg-secondary border-0 shadow-none focus:ring-0 p-3 text-foreground placeholder:text-muted-foreground"
                          />
                        </div>
                      ))}
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