import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store';
import { AppBar } from '../components/AppBar';
import { Transition } from '@headlessui/react';

export function AccountSetupPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { userProfile, fetchProfile } = useAppStore();
  
  // Form state
  const [fullName, setFullName] = useState(userProfile?.full_name || '');
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(userProfile?.avatar_url || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Animation states
  const [show, setShow] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  
  // Handle back navigation with animation
  const handleBack = () => {
    setIsExiting(true);
    // Wait for animation to complete before navigating
    setTimeout(() => {
      navigate('/settings');
    }, 300); // Match the duration of the animation
  };
  
  useEffect(() => {
    // Trigger animation after component mounts
    setShow(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      if (!user) throw new Error('User not authenticated');
      
      // Update profile in Supabase
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          username: username,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      // Refresh profile data from the database
      if (user) {
        await fetchProfile(user.id);
      }
      
      setSuccessMessage('Account updated successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (error: any) {
      console.error('Error updating account:', error);
      setError(error.message || 'Failed to update account');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Transition
      show={!isExiting}
      appear={true}
      enter="transition-opacity duration-75"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="transition-opacity duration-150"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      <div className="fixed inset-0 z-50 bg-white overflow-auto">
        <div className="relative w-full h-full">
          <Transition
            show={show && !isExiting}
            appear={true}
            enter="transform transition duration-300 ease-out"
            enterFrom="translate-x-full"
            enterTo="translate-x-0"
            leave="transform transition duration-300 ease-in"
            leaveFrom="translate-x-0"
            leaveTo="translate-x-full"
          >
            <div className="min-h-screen bg-gray-50 pb-20">
              {/* App Bar */}
              <AppBar 
                title="Account Setup" 
                showBackButton={true} 
                onBack={handleBack}
              />
              
              <div className="p-4 md:p-8">
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                  <h2 className="text-xl font-semibold mb-4">Account Information</h2>
                  
                  {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg">
                      {error}
                    </div>
                  )}
                  
                  {successMessage && (
                    <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg">
                      {successMessage}
                    </div>
                  )}
                  
                  <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                      <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        id="fullName"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Your full name"
                      />
                    </div>
                    
                    <div className="mb-4">
                      <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                        Username
                      </label>
                      <input
                        type="text"
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Choose a username"
                      />
                    </div>
                    
                    <div className="mb-6">
                      <label htmlFor="avatarUrl" className="block text-sm font-medium text-gray-700 mb-1">
                        Profile Picture URL
                      </label>
                      <input
                        type="text"
                        id="avatarUrl"
                        value={avatarUrl}
                        onChange={(e) => setAvatarUrl(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="https://example.com/your-image.jpg"
                      />
                      {avatarUrl && (
                        <div className="mt-2">
                          <img 
                            src={avatarUrl} 
                            alt="Profile preview" 
                            className="w-16 h-16 rounded-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150';
                            }}
                          />
                        </div>
                      )}
                    </div>
                    
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`w-full py-3 rounded-lg text-white font-medium ${
                        isSubmitting ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      {isSubmitting ? 'Updating...' : 'Save Changes'}
                    </button>
                  </form>
                </div>
                
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-xl font-semibold mb-4">Email Address</h2>
                  <p className="text-gray-500 mb-2">Your current email address:</p>
                  <p className="font-medium">{user?.email}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    To change your email address, please contact support.
                  </p>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </Transition>
  );
}

export default AccountSetupPage;
