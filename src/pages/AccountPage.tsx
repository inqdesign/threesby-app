import React, { useState, useEffect } from 'react';
import { User, AlertCircle, Check, Shield, Bell, LogOut, Loader2, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase, uploadImage } from '../lib/supabase';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AppBar } from '../components/AppBar';
import { useAppStore } from '../store';
import { SideNav } from '../components/SideNav';
import { LocationSelect } from '../components/LocationSelect';

// Type definitions
interface ProfileFormState {
  full_name: string;
  title: string;
  message: string; // Used for bio information
  location: string;
  avatar_url: string;
  shelf_image_url: string;
  interests: string[];
  social_links: {
    twitter: string;
    instagram: string;
    website: string;
  };
}

interface SecurityFormState {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

interface NotificationSettingsState {
  emailNotifications: boolean;
  newFollowers: boolean;
  pickLikes: boolean;
  comments: boolean;
}

// Profile Section Component
function ProfileSection() {
  const { user } = useAuth();
  const { userProfile, fetchProfile } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [profileForm, setProfileForm] = useState<ProfileFormState>({
    full_name: '',
    title: '',
    message: '',
    location: '',
    avatar_url: '',
    shelf_image_url: '',
    interests: [],
    social_links: {
      twitter: '',
      instagram: '',
      website: ''
    }
  });
  
  const [interestsInput, setInterestsInput] = useState('');
  const [isAddingInterest, setIsAddingInterest] = useState(false);
  
  // Update profile form when userProfile changes
  useEffect(() => {
    if (userProfile && user) {
      // Load bio from localStorage if available
      const savedBio = localStorage.getItem(`bio_${user.id}`);
      
      // Load location from localStorage if available
      const savedLocation = localStorage.getItem(`location_${user.id}`);
      
      // Load shelf image from localStorage if available
      const savedShelfImage = localStorage.getItem(`shelf_image_${user.id}`);
      
      setProfileForm({
        full_name: (userProfile as any).full_name || '',
        title: (userProfile as any).title || '',
        message: savedBio || (userProfile as any).message || '',
        location: savedLocation || (userProfile as any).location || '',
        avatar_url: (userProfile as any).avatar_url || '',
        shelf_image_url: savedShelfImage || (userProfile as any).shelf_image_url || '',
        interests: (userProfile as any).interests || [],
        social_links: {
          twitter: (userProfile as any).social_links?.twitter || '',
          instagram: (userProfile as any).social_links?.instagram || '',
          website: (userProfile as any).social_links?.website || ''
        }
      });
    }
  }, [userProfile, user]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (!user) throw new Error('No user');

      // Save bio to localStorage
      localStorage.setItem(`bio_${user.id}`, profileForm.message);
      
      // Save location to localStorage
      localStorage.setItem(`location_${user.id}`, profileForm.location);
      
      // Save shelf image to localStorage
      if (profileForm.shelf_image_url) {
        localStorage.setItem(`shelf_image_${user.id}`, profileForm.shelf_image_url);
      }
      
      // Prepare updates for database
      // Note: We're excluding bio and location fields since they don't exist in the database schema yet
      const updates = {
        id: user.id,
        full_name: profileForm.full_name,
        title: profileForm.title,
        avatar_url: profileForm.avatar_url,
        interests: profileForm.interests,
        social_links: profileForm.social_links,
        updated_at: new Date().toISOString(),
      };

      // Update profile in Supabase
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);
        
      if (error) throw error;
      
      // Refresh profile data
      if (user.id) {
        await fetchProfile(user.id);
      }
      
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: 'Error updating profile. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    try {
      if (!user) throw new Error('No user');
      setLoading(true);
      
      const filePath = `avatars/${user.id}`;
      const publicUrl = await uploadImage(file, filePath);
      
      // Update the profile form with the new avatar URL
      setProfileForm(prev => ({ ...prev, avatar_url: publicUrl }));
      
    } catch (error) {
      console.error('Error uploading avatar:', error);
      setMessage({ type: 'error', text: 'Error uploading avatar. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleShelfImageUpload = async (file: File) => {
    try {
      if (!user) throw new Error('No user');
      setLoading(true);
      
      // Create a unique filename
      const timestamp = new Date().getTime();
      const fileName = `${timestamp}.jpg`;
      
      // Upload directly using supabase storage
      const { error } = await supabase.storage
        .from('profiles')
        .upload(`shelves/${user.id}/${fileName}`, file, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (error) throw error;
      
      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('profiles')
        .getPublicUrl(`shelves/${user.id}/${fileName}`);
      
      if (!urlData) throw new Error('Failed to get public URL');
      
      // Update the profile form with the new shelf image URL
      setProfileForm(prev => ({ ...prev, shelf_image_url: urlData.publicUrl }));
      
    } catch (error) {
      console.error('Error uploading shelf image:', error);
      setMessage({ type: 'error', text: 'Error uploading shelf image. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const addInterest = () => {
    // Handle comma-separated interests
    if (interestsInput.includes(',')) {
      const interestParts = interestsInput.split(',');
      const lastPart = interestParts.pop() || '';
      
      // Add all complete interests (parts before the last comma)
      const newInterests = [...profileForm.interests];
      interestParts.forEach(interest => {
        const trimmedInterest = interest.trim();
        if (trimmedInterest !== '' && !profileForm.interests.includes(trimmedInterest) && !newInterests.includes(trimmedInterest)) {
          newInterests.push(trimmedInterest);
        }
      });
      
      setProfileForm(prev => ({ ...prev, interests: newInterests }));
      setInterestsInput(lastPart); // Keep the part after the last comma
    } else {
      // Handle single interest
      const newInterest = interestsInput.trim();
      if (newInterest !== '' && !profileForm.interests.includes(newInterest)) {
        setProfileForm(prev => ({
          ...prev,
          interests: [...prev.interests, newInterest]
        }));
        setInterestsInput('');
      }
    }
  };

  const removeInterest = (index: number) => {
    const newInterests = [...profileForm.interests];
    newInterests.splice(index, 1);
    setProfileForm(prev => ({
      ...prev,
      interests: newInterests
    }));
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-[#252525] md:block hidden">Profile Settings</h1>
      
      {message && (
        <div className={`p-4 mb-6 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          <div className="flex items-center">
            {message.type === 'success' ? <Check size={18} className="mr-2" /> : <AlertCircle size={18} className="mr-2" />}
            <span>{message.text}</span>
          </div>
        </div>
      )}
      
      <form onSubmit={handleProfileUpdate} className="space-y-6">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="md:w-1/3">
            <div className="flex flex-col items-center">
              <div className="relative w-32 h-32 rounded-full overflow-hidden mb-4">
                {profileForm.avatar_url ? (
                  <img 
                    src={profileForm.avatar_url} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <User size={40} className="text-gray-400" />
                  </div>
                )}
                <label 
                  htmlFor="avatar-upload" 
                  className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <span className="text-white text-sm font-medium">Change</span>
                  <input 
                    id="avatar-upload" 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleAvatarUpload(file);
                    }}
                  />
                </label>
              </div>
              
              {/* Shelf Image */}
              <div className="w-full mt-4">
                <h3 className="text-sm font-medium text-[#252525] mb-2">Shelf Image</h3>
                <div className="relative w-full h-40 rounded-lg overflow-hidden border border-gray-300">
                  {profileForm.shelf_image_url ? (
                    <img 
                      src={profileForm.shelf_image_url} 
                      alt="Shelf" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <span className="text-gray-400 text-sm">No shelf image</span>
                    </div>
                  )}
                  <label 
                    htmlFor="shelf-upload" 
                    className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <span className="text-white text-sm font-medium">Change</span>
                    <input 
                      id="shelf-upload" 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleShelfImageUpload(file);
                      }}
                    />
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-1">This image will be displayed on your profile page</p>
              </div>
            </div>
          </div>
          
          <div className="md:w-2/3">
            <div className="space-y-4">
              <div>
                <label htmlFor="full_name" className="block text-sm font-medium text-[#252525] mb-1">Full Name</label>
                <input
                  id="full_name"
                  type="text"
                  value={profileForm.full_name}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, full_name: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent h-10"
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="title" className="block text-sm font-medium text-[#252525] mb-1">Title</label>
                <input
                  id="title"
                  type="text"
                  value={profileForm.title}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent h-10"
                  placeholder="e.g. Designer, Writer, Chef"
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="location" className="block text-sm font-medium text-[#252525] mb-1">Location</label>
                <LocationSelect
                  value={profileForm.location}
                  onChange={(location) => setProfileForm(prev => ({ ...prev, location }))}
                  placeholder="Select or enter your location"
                  className="mb-1"
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="bio" className="block text-sm font-medium text-[#252525] mb-1">Bio</label>
                <textarea
                  id="bio"
                  value={profileForm.message}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, message: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  rows={3}
                  placeholder="Tell us a bit about yourself"
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Interests */}
        <div className="pt-6 border-t border-gray-200">
          <h2 className="text-lg font-medium mb-4 text-[#252525]">Interests</h2>
          <label className="block text-sm font-medium text-gray-600 mb-2">
            Interests (comma separated)
          </label>
          <div className="flex flex-wrap items-center gap-2 w-full rounded-lg bg-gray-100 border-0 shadow-none p-3">
            {/* Display existing interests as pills */}
            {profileForm.interests.map((interest, index) => (
              <div key={index} className="flex items-center bg-gray-200 rounded-lg px-3 py-1.5 text-sm h-10">
                <span>{interest}</span>
                <button
                  type="button"
                  className="ml-2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  onClick={() => removeInterest(index)}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            
            {/* Only show input field when actively adding an interest or when there are no interests */}
            {(isAddingInterest || profileForm.interests.length === 0) && (
              <div className="flex items-center flex-grow">
                <input
                  type="text"
                  value={interestsInput}
                  onChange={(e) => {
                    const value = e.target.value;
                    setInterestsInput(value);
                    
                    // If a comma was just typed, process the interests
                    if (value.includes(',')) {
                      addInterest();
                    }
                  }}
                  onBlur={() => {
                    // If input is empty when focus is lost, hide the input
                    if (interestsInput.trim() === '' && profileForm.interests.length > 0) {
                      setIsAddingInterest(false);
                    } else {
                      // If there's content, add it as a tag
                      addInterest();
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addInterest();
                    }
                  }}
                  className="flex-grow bg-transparent border-0 focus:ring-0 p-1.5 text-sm"
                  placeholder="Type and press Enter or comma..."
                />
              </div>
            )}
            
            {/* Add button (only shown when there are tags and not currently adding) */}
            {!isAddingInterest && profileForm.interests.length > 0 && (
              <button
                type="button"
                className="text-xs text-gray-500 hover:text-gray-700 focus:outline-none flex items-center px-2 py-2"
                onClick={() => setIsAddingInterest(true)}
              >
                <span className="mr-1">+</span> Add
              </button>
            )}
          </div>
        </div>

        <div className="pt-6 border-t border-gray-200">
          <h2 className="text-lg font-medium mb-4 text-[#252525]">Social Links</h2>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="twitter" className="block text-sm font-medium text-[#252525] mb-1">Twitter</label>
              <input
                id="twitter"
                type="text"
                value={profileForm.social_links.twitter}
                onChange={(e) => setProfileForm(prev => ({ 
                  ...prev, 
                  social_links: { ...prev.social_links, twitter: e.target.value } 
                }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent h-10"
                placeholder="https://twitter.com/yourusername"
              />
            </div>
            
            <div>
              <label htmlFor="instagram" className="block text-sm font-medium text-[#252525] mb-1">Instagram</label>
              <input
                id="instagram"
                type="text"
                value={profileForm.social_links.instagram}
                onChange={(e) => setProfileForm(prev => ({ 
                  ...prev, 
                  social_links: { ...prev.social_links, instagram: e.target.value } 
                }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent h-10"
                placeholder="https://instagram.com/yourusername"
              />
            </div>
            
            <div>
              <label htmlFor="website" className="block text-sm font-medium text-[#252525] mb-1">Website</label>
              <input
                id="website"
                type="text"
                value={profileForm.social_links.website}
                onChange={(e) => setProfileForm(prev => ({ 
                  ...prev, 
                  social_links: { ...prev.social_links, website: e.target.value } 
                }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent h-10"
                placeholder="https://yourwebsite.com"
              />
            </div>
          </div>
        </div>
        
        <div className="flex justify-end">
          <button 
            type="submit" 
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 h-10"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="mr-2 animate-spin" />
                Saving...
              </>
            ) : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}

// Security Section Component
function SecuritySection() {
  // We need auth context for the updateUser function
  const { /* user not used directly */ } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [securityForm, setSecurityForm] = useState<SecurityFormState>({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // Validate passwords
    if (securityForm.new_password !== securityForm.confirm_password) {
      setMessage({ type: 'error', text: 'New passwords do not match.' });
      setLoading(false);
      return;
    }

    if (securityForm.new_password.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters long.' });
      setLoading(false);
      return;
    }

    try {
      // Call Supabase to update password
      const { error } = await supabase.auth.updateUser({
        password: securityForm.new_password
      });

      if (error) throw error;
      
      setMessage({ type: 'success', text: 'Password updated successfully!' });
      setSecurityForm({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
    } catch (error) {
      console.error('Error updating password:', error);
      setMessage({ type: 'error', text: 'Error updating password. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-[#252525] md:block hidden">Security Settings</h1>
      
      {message && (
        <div className={`p-4 mb-6 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          <div className="flex items-center">
            {message.type === 'success' ? <Check size={18} className="mr-2" /> : <AlertCircle size={18} className="mr-2" />}
            <span>{message.text}</span>
          </div>
        </div>
      )}
      
      <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
        <h2 className="text-lg font-medium mb-4 flex items-center text-[#252525]">
          <Shield size={20} className="mr-2 text-[#585757]" />
          Change Password
        </h2>
        
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label htmlFor="current_password" className="block text-sm font-medium text-[#252525] mb-1">Current Password</label>
            <input
              id="current_password"
              type="password"
              value={securityForm.current_password}
              onChange={(e) => setSecurityForm(prev => ({ ...prev, current_password: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent h-10"
            />
          </div>
          
          <div>
            <label htmlFor="new_password" className="block text-sm font-medium text-[#252525] mb-1">New Password</label>
            <input
              id="new_password"
              type="password"
              value={securityForm.new_password}
              onChange={(e) => setSecurityForm(prev => ({ ...prev, new_password: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent h-10"
            />
          </div>
          
          <div>
            <label htmlFor="confirm_password" className="block text-sm font-medium text-[#252525] mb-1">Confirm New Password</label>
            <input
              id="confirm_password"
              type="password"
              value={securityForm.confirm_password}
              onChange={(e) => setSecurityForm(prev => ({ ...prev, confirm_password: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent h-10"
            />
          </div>
          
          <div className="flex justify-end pt-4">
            <button 
              type="submit" 
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 h-10"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="mr-2 animate-spin" />
                  Updating...
                </>
              ) : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-lg font-medium mb-4 flex items-center text-red-600">
          <LogOut size={20} className="mr-2" />
          Delete Account
        </h2>
        
        <p className="text-[#585757] mb-4">Once you delete your account, there is no going back. Please be certain.</p>
        
        <button 
          type="button" 
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 h-10"
          onClick={() => alert('This feature is not yet implemented')}
        >
          Delete Account
        </button>
      </div>
    </div>
  );
}

// Notifications Section Component
function NotificationsSection() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettingsState>({
    emailNotifications: true,
    newFollowers: true,
    pickLikes: true,
    comments: true
  });

  const handleNotificationSettingsUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setMessage({ type: 'success', text: 'Notification settings updated successfully!' });
    } catch (error) {
      console.error('Error updating notification settings:', error);
      setMessage({ type: 'error', text: 'Error updating notification settings. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-[#252525] md:block hidden">Notification Settings</h1>
      
      {message && (
        <div className={`p-4 mb-6 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          <div className="flex items-center">
            {message.type === 'success' ? <Check size={18} className="mr-2" /> : <AlertCircle size={18} className="mr-2" />}
            <span>{message.text}</span>
          </div>
        </div>
      )}
      
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-lg font-medium mb-4 flex items-center text-[#252525]">
          <Bell size={20} className="mr-2 text-[#585757]" />
          Email Notifications
        </h2>
        
        <form onSubmit={handleNotificationSettingsUpdate} className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center p-3 border border-gray-200 rounded-lg">
              <input
                id="emailNotifications"
                type="checkbox"
                checked={notificationSettings.emailNotifications}
                onChange={(e) => setNotificationSettings(prev => ({ ...prev, emailNotifications: e.target.checked }))}
                className="h-5 w-5 text-orange-500 focus:ring-orange-500 border-gray-300 rounded"
              />
              <label htmlFor="emailNotifications" className="ml-3 block text-sm font-medium text-[#252525]">
                Enable email notifications
              </label>
            </div>
            
            <div className="pl-6 space-y-3 mt-2">
              <div className="flex items-center p-3 border border-gray-200 rounded-lg">
                <input
                  id="newFollowers"
                  type="checkbox"
                  checked={notificationSettings.newFollowers}
                  onChange={(e) => setNotificationSettings(prev => ({ ...prev, newFollowers: e.target.checked }))}
                  disabled={!notificationSettings.emailNotifications}
                  className="h-5 w-5 text-orange-500 focus:ring-orange-500 border-gray-300 rounded disabled:opacity-50"
                />
                <label htmlFor="newFollowers" className={`ml-3 block text-sm font-medium ${!notificationSettings.emailNotifications ? 'text-gray-400' : 'text-[#252525]'}`}>
                  New followers
                </label>
              </div>
              
              <div className="flex items-center p-3 border border-gray-200 rounded-lg">
                <input
                  id="pickLikes"
                  type="checkbox"
                  checked={notificationSettings.pickLikes}
                  onChange={(e) => setNotificationSettings(prev => ({ ...prev, pickLikes: e.target.checked }))}
                  disabled={!notificationSettings.emailNotifications}
                  className="h-5 w-5 text-orange-500 focus:ring-orange-500 border-gray-300 rounded disabled:opacity-50"
                />
                <label htmlFor="pickLikes" className={`ml-3 block text-sm font-medium ${!notificationSettings.emailNotifications ? 'text-gray-400' : 'text-[#252525]'}`}>
                  Likes on your picks
                </label>
              </div>
              
              <div className="flex items-center p-3 border border-gray-200 rounded-lg">
                <input
                  id="comments"
                  type="checkbox"
                  checked={notificationSettings.comments}
                  onChange={(e) => setNotificationSettings(prev => ({ ...prev, comments: e.target.checked }))}
                  disabled={!notificationSettings.emailNotifications}
                  className="h-5 w-5 text-orange-500 focus:ring-orange-500 border-gray-300 rounded disabled:opacity-50"
                />
                <label htmlFor="comments" className={`ml-3 block text-sm font-medium ${!notificationSettings.emailNotifications ? 'text-gray-400' : 'text-[#252525]'}`}>
                  Comments on your picks
                </label>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end pt-4">
            <button 
              type="submit" 
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 h-10"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="mr-2 animate-spin" />
                  Saving...
                </>
              ) : 'Save Preferences'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Main AccountPage Component
export function AccountPage() {
  const { user } = useAuth();
  const { userProfile, fetchProfile } = useAppStore();
  const isAdmin = (userProfile as any)?.is_admin === true;
  const location = useLocation();
  
  // Determine the current section title based on the URL
  const getSectionTitle = () => {
    if (location.pathname.includes('/security')) {
      return 'Security';
    } else if (location.pathname.includes('/notifications')) {
      return 'Notifications';
    } else {
      return 'Account Settings';
    }
  };
  
  // Use useEffect to fetch profile data when component mounts
  useEffect(() => {
    if (user?.id) {
      fetchProfile(user.id);
    }
  }, [user, fetchProfile]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <div className="hidden md:block">
        <SideNav isAdmin={isAdmin} />
      </div>
      
      {/* App Bar - Mobile only */}
      <div className="md:hidden">
        <AppBar 
          title={getSectionTitle()} 
          showBackButton={true} 
          backPath="/settings" 
        />
      </div>
      
      {/* Main Content */}
      <div className="md:ml-64 flex-1 p-4 md:p-8 pb-20 md:pb-8">

        <Routes>
          <Route path="/" element={<ProfileSection />} />
          <Route path="/security" element={<SecuritySection />} />
          <Route path="/notifications" element={<NotificationsSection />} />
          <Route path="*" element={<ProfileSection />} />
        </Routes>
      </div>
    </div>
  );
}
