import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { AppBar } from '../components/AppBar';
import { Transition } from '@headlessui/react';

export function EmailSettingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Form state
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
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

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      if (!user) throw new Error('User not authenticated');
      
      // Validate email
      if (!newEmail || !/^\S+@\S+\.\S+$/.test(newEmail)) {
        throw new Error('Please enter a valid email address');
      }
      
      // Update email in Supabase
      const { error } = await supabase.auth.updateUser({
        email: newEmail
      });
      
      if (error) throw error;
      
      setSuccessMessage('Verification email sent to ' + newEmail + '. Please check your inbox to complete the email change.');
      setNewEmail('');
      setPassword('');
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
    } catch (error: any) {
      console.error('Error updating email:', error);
      setError(error.message || 'Failed to update email');
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
      <div className="fixed inset-0 z-50 bg-background overflow-auto">
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
            <div className="min-h-screen bg-background pb-20">
              {/* App Bar */}
              <AppBar 
                title="Email Settings" 
                showBackButton={true} 
                onBack={handleBack}
              />
              
              <div className="p-4 md:p-8">
                <div className="bg-card rounded-xl shadow-sm p-6 mb-6">
                  <h2 className="text-xl font-semibold mb-4 text-foreground">Current Email</h2>
                  <p className="text-lg font-medium text-foreground mb-2 break-all">{user?.email}</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    This is the email address associated with your account.
                  </p>
                </div>
                
                <div className="bg-card rounded-xl shadow-sm p-6 mb-6">
                  <h2 className="text-xl font-semibold mb-4 text-foreground">Change Email Address</h2>
                  
                  {error && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg">
                      {error}
                    </div>
                  )}
                  
                  {successMessage && (
                    <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg">
                      {successMessage}
                    </div>
                  )}
                  
                  <form onSubmit={handleUpdateEmail}>
                    <div className="mb-4">
                      <label htmlFor="newEmail" className="block text-sm font-medium text-foreground mb-1">
                        New Email Address
                      </label>
                      <input
                        type="email"
                        id="newEmail"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-background text-foreground placeholder:text-muted-foreground"
                        placeholder="Enter new email address"
                        required
                      />
                    </div>
                    
                    <div className="mb-6">
                      <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1">
                        Password
                      </label>
                      <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-background text-foreground placeholder:text-muted-foreground"
                        placeholder="Enter your password to confirm"
                        required
                      />
                    </div>
                    
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`w-full py-3 rounded-lg text-white font-medium ${
                        isSubmitting ? 'bg-orange-400' : 'bg-orange-600 hover:bg-orange-700'
                      }`}
                    >
                      {isSubmitting ? 'Updating...' : 'Update Email'}
                    </button>
                  </form>
                </div>
                
                <div className="bg-card rounded-xl shadow-sm p-6">
                  <h2 className="text-xl font-semibold mb-4 text-foreground">Email Preferences</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-foreground">Marketing Emails</h3>
                        <p className="text-sm text-muted-foreground">Receive updates about new features and promotions</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-secondary peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-foreground">New Follower Notifications</h3>
                        <p className="text-sm text-muted-foreground">Receive emails when someone follows you</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-secondary peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-foreground">Comment Notifications</h3>
                        <p className="text-sm text-muted-foreground">Receive emails when someone comments on your picks</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-secondary peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </Transition>
  );
}

export default EmailSettingsPage;
