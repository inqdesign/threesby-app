import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { AppBar } from '../components/AppBar';
import { Transition } from '@headlessui/react';

export function SecurityPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      if (!user) throw new Error('User not authenticated');
      
      // Validate passwords
      if (newPassword !== confirmPassword) {
        throw new Error('New passwords do not match');
      }
      
      if (newPassword.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }
      
      // Update password in Supabase
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
      
      setSuccessMessage('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (error: any) {
      console.error('Error updating password:', error);
      setError(error.message || 'Failed to update password');
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
                title="Password & Security" 
                showBackButton={true} 
                onBack={handleBack}
              />
              
              <div className="p-4 md:p-8">
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                  <h2 className="text-xl font-semibold mb-4">Change Password</h2>
                  
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
                  
                  <form onSubmit={handleUpdatePassword}>
                    <div className="mb-4">
                      <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                        Current Password
                      </label>
                      <input
                        type="password"
                        id="currentPassword"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter your current password"
                        required
                      />
                    </div>
                    
                    <div className="mb-4">
                      <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                        New Password
                      </label>
                      <input
                        type="password"
                        id="newPassword"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter new password"
                        required
                      />
                    </div>
                    
                    <div className="mb-6">
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Confirm new password"
                        required
                      />
                    </div>
                    
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`w-full py-3 rounded-lg text-white font-medium ${
                        isSubmitting ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      {isSubmitting ? 'Updating...' : 'Update Password'}
                    </button>
                  </form>
                </div>
                
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                  <h2 className="text-xl font-semibold mb-4">Two-Factor Authentication</h2>
                  <p className="text-gray-500 mb-4">
                    Add an extra layer of security to your account by enabling two-factor authentication.
                  </p>
                  <button
                    className="w-full py-3 rounded-lg text-white font-medium bg-blue-600 hover:bg-blue-700"
                    onClick={() => alert('Two-factor authentication will be implemented in a future update.')}
                  >
                    Set Up Two-Factor Authentication
                  </button>
                </div>
                
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-xl font-semibold mb-4 text-red-600">Danger Zone</h2>
                  <p className="text-gray-500 mb-4">
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                  <button
                    className="w-full py-3 rounded-lg text-white font-medium bg-red-600 hover:bg-red-700"
                    onClick={() => {
                      if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                        alert('Account deletion will be implemented in a future update.');
                      }
                    }}
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </Transition>
  );
}

export default SecurityPage;
