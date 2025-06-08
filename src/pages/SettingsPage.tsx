import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Shield, Bell, LogOut, ChevronRight, Mail, FileText, Lock } from 'lucide-react';
import { ThemeSettings } from '../components/ThemeSettings';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store';
import { AppBar } from '../components/AppBar';
import { Transition } from '@headlessui/react';

export function UserSettingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { userProfile } = useAppStore();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Animation states
  const [show, setShow] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  
  // Handle back navigation with animation
  const handleBack = () => {
    setIsExiting(true);
    // Wait for animation to complete before navigating
    setTimeout(() => {
      navigate('/my-threes');
    }, 300); // Match the duration of the animation
  };
  
  useEffect(() => {
    // Trigger animation after component mounts
    setShow(true);
    
    // Disable scrolling on the body when settings page is open
    document.body.style.overflow = 'hidden';
    
    return () => {
      // Re-enable scrolling when component unmounts
      document.body.style.overflow = 'auto';
    };
  }, []);

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
                title="Settings" 
                showBackButton={true} 
                onBack={handleBack}
              />
              <div className="p-4 md:p-8">

        {/* User Info Card */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex items-center">
          <div className="w-12 h-12 rounded-full overflow-hidden mr-4">
            {userProfile?.avatar_url ? (
              <img 
                src={userProfile.avatar_url} 
                alt={userProfile?.full_name || 'User'} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-[#f8d9c4] flex items-center justify-center text-[#252525]">
                <span className="text-sm font-medium">
                  {userProfile?.full_name?.[0] || user?.email?.[0] || 'U'}
                </span>
              </div>
            )}
          </div>
          <div>
            <h2 className="font-medium text-[#252525]">{userProfile?.full_name || 'User'}</h2>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
        </div>

        {/* Theme Settings */}
        <ThemeSettings />
        
        {/* Account Settings */}
        <h3 className="text-lg font-medium text-gray-700 mb-3 px-1">Account</h3>
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
          <Link 
            to="/account-setup" 
            className="flex items-center justify-between p-4 border-b border-gray-100 hover:bg-gray-50"
          >
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center mr-3">
                <User size={18} className="text-gray-500" />
              </div>
              <span className="text-[#252525]">Profile Information</span>
            </div>
            <ChevronRight size={18} className="text-gray-400" />
          </Link>
          
          <Link 
            to="/email-settings" 
            className="flex items-center justify-between p-4 border-b border-gray-100 hover:bg-gray-50"
          >
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center mr-3">
                <Mail size={18} className="text-gray-500" />
              </div>
              <span className="text-[#252525]">Email Settings</span>
            </div>
            <ChevronRight size={18} className="text-gray-400" />
          </Link>
          
          <Link 
            to="/security" 
            className="flex items-center justify-between p-4 border-b border-gray-100 hover:bg-gray-50"
          >
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center mr-3">
                <Lock size={18} className="text-gray-500" />
              </div>
              <span className="text-[#252525]">Password & Security</span>
            </div>
            <ChevronRight size={18} className="text-gray-400" />
          </Link>
          
          <Link 
            to="/account/notifications" 
            className="flex items-center justify-between p-4 hover:bg-gray-50"
          >
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center mr-3">
                <Bell size={18} className="text-gray-500" />
              </div>
              <span className="text-[#252525]">Notifications</span>
            </div>
            <ChevronRight size={18} className="text-gray-400" />
          </Link>
        </div>
        
        {/* Legal */}
        <h3 className="text-lg font-medium text-gray-700 mb-3 px-1">Legal</h3>
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
          <Link 
            to="/terms" 
            className="flex items-center justify-between p-4 border-b border-gray-100 hover:bg-gray-50"
          >
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center mr-3">
                <FileText size={18} className="text-gray-500" />
              </div>
              <span className="text-[#252525]">Terms & Conditions</span>
            </div>
            <ChevronRight size={18} className="text-gray-400" />
          </Link>
          
          <Link 
            to="/privacy-policy" 
            className="flex items-center justify-between p-4 hover:bg-gray-50"
          >
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center mr-3">
                <Shield size={18} className="text-gray-500" />
              </div>
              <span className="text-[#252525]">Privacy Policy</span>
            </div>
            <ChevronRight size={18} className="text-gray-400" />
          </Link>
        </div>

        {/* Sign Out Button */}
        <button
          onClick={handleSignOut}
          className="w-full bg-white rounded-xl shadow-sm p-4 flex items-center text-red-600 hover:bg-gray-50"
        >
          <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center mr-3">
            <LogOut size={18} className="text-red-600" />
          </div>
          <span>Sign out</span>
        </button>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </Transition>
  );
}

export default UserSettingsPage;
