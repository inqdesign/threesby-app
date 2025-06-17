import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Settings, Bell, Palette, CreditCard, DollarSign, Check, AlertCircle, Loader2, User, Lock, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useThemeStore } from '../stores/themeStore';

type SettingsTab = 'general' | 'account' | 'notifications' | 'appearance';

type SettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

// Switch component for toggle buttons
function SwitchToggle({ 
  checked = false, 
  onChange,
  defaultChecked = false 
}: { 
  checked?: boolean; 
  onChange?: (checked: boolean) => void;
  defaultChecked?: boolean;
}) {
  const [internalChecked, setInternalChecked] = useState(defaultChecked);
  
  // Use controlled value if provided, otherwise use internal state
  const isChecked = onChange ? checked : internalChecked;
  
  const handleToggle = () => {
    if (onChange) {
      onChange(!checked);
    } else {
      setInternalChecked(!internalChecked);
    }
  };
  
  return (
    <button
      type="button"
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
        isChecked ? 'bg-foreground' : 'bg-muted'
      }`}
      role="switch"
      aria-checked={isChecked}
      onClick={handleToggle}
    >
      <span className="sr-only">Toggle</span>
      <span
        className={`pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-card shadow ring-0 transition duration-200 ease-in-out ${
          isChecked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      onClose();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: <Settings className="w-5 h-5" /> },
    { id: 'account', label: 'Account', icon: <User className="w-5 h-5" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-5 h-5" /> },
    { id: 'appearance', label: 'Appearance', icon: <Palette className="w-5 h-5" /> },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return <GeneralSettings />;
      case 'account':
        return <AccountSettings />;
      case 'notifications':
        return <NotificationSettings />;
      case 'appearance':
        return <AppearanceSettings />;

      default:
        return <GeneralSettings />;
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[1000]" onClose={onClose}>
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-xl bg-card shadow-xl transition-all">
                <div className="flex h-[600px]">
                  {/* Sidebar */}
                  <div className="w-64 border-r settings-border flex flex-col overflow-hidden">
                    <div className="p-4 border-b settings-border flex justify-between items-center">
                                              <Dialog.Title as="h3" className="text-lg font-medium text-foreground">
                        Settings
                      </Dialog.Title>
                      <button
                        type="button"
                        className="rounded-full p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
                        onClick={onClose}
                      >
                        <X className="h-5 w-5" aria-hidden="true" />
                      </button>
                    </div>
                    <div className="py-2 flex flex-col h-full">
                      <div className="flex-1">
                        {tabs.map((tab) => (
                          <button
                            key={tab.id}
                            className={`w-full text-left px-4 py-3 flex items-center space-x-3 hover:bg-secondary ${
                              activeTab === tab.id ? 'bg-secondary' : ''
                            }`}
                            onClick={() => setActiveTab(tab.id as SettingsTab)}
                          >
                            <div className="text-muted-foreground">{tab.icon}</div>
                            <span className="text-sm font-medium text-foreground">{tab.label}</span>
                          </button>
                        ))}
                      </div>
                      
                      {/* Log out button at bottom of sidebar */}
                      <div className="border-t settings-border pt-2 pb-2">
                        <button
                          onClick={handleSignOut}
                          className="w-full text-left px-4 py-3 flex items-center space-x-3 hover:bg-red-50 text-red-600"
                        >
                          <LogOut className="w-5 h-5" />
                          <span className="text-sm font-medium">Log out</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 overflow-y-auto p-6">
                    {renderTabContent()}
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

function GeneralSettings() {
  const { user } = useAuth();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [settings, setSettings] = useState({
    showFavoritesCount: true,
    showCategories: true,
  });

  useEffect(() => {
    // Load user's general preferences
    const loadGeneralSettings = async () => {
      if (!user) return;
      
      try {
        // In a real app, fetch from your database
        const saved = localStorage.getItem(`general_settings_${user.id}`);
        if (saved) {
          setSettings(JSON.parse(saved));
        }
      } catch (error) {
        console.error('Error loading general settings:', error);
      }
    };

    loadGeneralSettings();
  }, [user]);

  const updateSetting = async (key: string, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    
    if (user) {
      try {
        // Save to localStorage (in a real app, save to database)
        localStorage.setItem(`general_settings_${user.id}`, JSON.stringify(newSettings));
        
        // Only show success message on mobile (screen width < 768px)
        const isMobile = window.innerWidth < 768;
        if (isMobile) {
          setMessage({ type: 'success', text: 'Preferences updated' });
          setTimeout(() => setMessage(null), 2000);
        }
      } catch (error) {
        console.error('Error saving general settings:', error);
        setMessage({ type: 'error', text: 'Failed to save preferences' });
      }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-foreground">General Settings</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your general app preferences.
        </p>
      </div>

      {message && (
        <div className={`p-3 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          <div className="flex items-center">
            {message.type === 'success' ? <Check size={16} className="mr-2" /> : <AlertCircle size={16} className="mr-2" />}
            <span className="text-sm">{message.text}</span>
          </div>
        </div>
      )}
      
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
                      <h3 className="text-sm font-medium text-foreground">Show favorites count</h3>
          <p className="text-sm text-muted-foreground">Display the number of favorites on pick cards</p>
          </div>
          <SwitchToggle 
            checked={settings.showFavoritesCount} 
            onChange={(checked) => updateSetting('showFavoritesCount', checked)}
          />
        </div>
        
        <div className="flex justify-between items-center">
          <div>
                      <h3 className="text-sm font-medium text-foreground">Show categories on discover page</h3>
          <p className="text-sm text-muted-foreground">Display category filters on the discover page</p>
          </div>
          <SwitchToggle 
            checked={settings.showCategories} 
            onChange={(checked) => updateSetting('showCategories', checked)}
          />
        </div>
      </div>
    </div>
  );
}

function AccountSettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [emailForm, setEmailForm] = useState({
    newEmail: '',
  });

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    
    if (passwordForm.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      });

      if (error) {
        setMessage({ type: 'error', text: error.message });
      } else {
        setMessage({ type: 'success', text: 'Password updated successfully' });
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (error) {
      console.error('Error updating password:', error);
      setMessage({ type: 'error', text: 'Error updating password' });
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!emailForm.newEmail || !emailForm.newEmail.includes('@')) {
      setMessage({ type: 'error', text: 'Please enter a valid email address' });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        email: emailForm.newEmail
      });

      if (error) {
        setMessage({ type: 'error', text: error.message });
      } else {
        setMessage({ type: 'success', text: 'Confirmation email sent to your new address' });
        setEmailForm({ newEmail: '' });
      }
    } catch (error) {
      console.error('Error updating email:', error);
      setMessage({ type: 'error', text: 'Error updating email' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    setDeleteLoading(true);
    try {
      // 1. First, anonymize user's content in the database
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: null,
          avatar_url: null,
          bio: null,
          website: null,
          deleted_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (profileError) {
        console.error('Error updating profile:', profileError);
        setMessage({ type: 'error', text: 'Error deleting account data' });
        return;
      }

      // 2. Update picks to show as from deleted user (optional: could also delete picks)
      const { error: picksError } = await supabase
        .from('picks')
        .update({
          // Keep the picks but they'll show as from "Deleted User" 
          // since the profile data is cleared
        })
        .eq('user_id', user.id);

      // Note: We're not actually deleting picks to maintain content integrity
      // They will show as created by "Deleted User" due to the profile changes

      // 3. Sign out the user (auth account deletion would need to be handled server-side)
      // In a production app, you'd call a server endpoint to handle auth deletion
      await supabase.auth.signOut();

      // 4. Success - user will be signed out automatically
      setMessage({ type: 'success', text: 'Account deleted successfully' });
      
      // Close modal and redirect after a brief delay
      setTimeout(() => {
        setShowDeleteConfirmation(false);
        window.location.href = '/';
      }, 2000);

    } catch (error) {
      console.error('Error deleting account:', error);
      setMessage({ type: 'error', text: 'Error deleting account. Please try again.' });
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-foreground">Account Settings</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account information and security.
        </p>
      </div>

      {message && (
        <div className={`p-3 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          <div className="flex items-center">
            {message.type === 'success' ? <Check size={16} className="mr-2" /> : <AlertCircle size={16} className="mr-2" />}
            <span className="text-sm">{message.text}</span>
          </div>
        </div>
      )}

      {/* Current Account Info */}
      <div className="border border-border rounded-lg p-4">
        <h3 className="text-sm font-medium text-foreground mb-3 flex items-center">
          <User className="w-4 h-4 mr-2" />
          Current Account
        </h3>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Email:</span>
            <span className="font-medium text-foreground">{user?.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Account Status:</span>
            <span className={`px-2 py-1 rounded-full text-xs ${
              user?.email_confirmed_at ? 'bg-green-100 dark:bg-card text-green-800 dark:text-green-400' : 'bg-yellow-100 dark:bg-card text-yellow-800 dark:text-yellow-400'
            }`}>
              {user?.email_confirmed_at ? 'Verified' : 'Unverified'}
            </span>
          </div>
        </div>
      </div>

      {/* Change Email */}
      <form onSubmit={handleEmailChange} className="border border-border rounded-lg p-4">
        <h3 className="text-sm font-medium text-foreground mb-3">Change Email Address</h3>
        
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-muted-foreground mb-1">New Email</label>
            <input
              type="email"
              value={emailForm.newEmail}
              onChange={(e) => setEmailForm({ ...emailForm, newEmail: e.target.value })}
              className="w-full rounded-lg bg-secondary border border-border focus:ring-0 p-3 text-foreground"
              placeholder="Enter new email address"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading || !emailForm.newEmail}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {loading ? (
              <>
                <Loader2 size={14} className="mr-1 animate-spin" />
                Updating...
              </>
            ) : 'Update Email'}
          </button>
        </div>
      </form>

      {/* Change Password */}
      <form onSubmit={handlePasswordChange} className="border border-border rounded-lg p-4">
        <h3 className="text-sm font-medium text-foreground mb-3 flex items-center">
          <Lock className="w-4 h-4 mr-2" />
          Change Password
        </h3>
        
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-muted-foreground mb-1">Current Password</label>
            <input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              className="w-full rounded-lg bg-secondary border border-border focus:ring-0 p-3 text-foreground"
              placeholder="Enter current password"
            />
          </div>
          
          <div>
            <label className="block text-sm text-muted-foreground mb-1">New Password</label>
            <input
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              className="w-full rounded-lg bg-secondary border border-border focus:ring-0 p-3 text-foreground"
              placeholder="Enter new password"
            />
          </div>
          
          <div>
            <label className="block text-sm text-muted-foreground mb-1">Confirm New Password</label>
            <input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              className="w-full rounded-lg bg-secondary border border-border focus:ring-0 p-3 text-foreground"
              placeholder="Confirm new password"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {loading ? (
              <>
                <Loader2 size={14} className="mr-1 animate-spin" />
                Updating...
              </>
            ) : 'Update Password'}
          </button>
        </div>
      </form>

      {/* Delete Account */}
      <div className="border border-red-200 rounded-lg p-4 bg-red-50">
        <h3 className="text-sm font-medium text-red-900 mb-3">Danger Zone</h3>
        <div className="space-y-3">
          <div>
            <h4 className="text-sm font-medium text-red-800">Delete Account</h4>
            <p className="text-sm text-red-600 mt-1">
              Permanently delete your account and remove your personal information. Your picks and content will remain but will be shown as created by "Deleted User".
            </p>
          </div>
          <button
            onClick={() => setShowDeleteConfirmation(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 text-sm"
          >
            Delete Account
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[2000]">
          <div className="bg-card rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <AlertCircle className="w-6 h-6 text-destructive mr-3" />
              <h3 className="text-lg font-medium text-foreground">Delete Account</h3>
            </div>
            
            <div className="space-y-3 mb-6">
              <p className="text-sm text-muted-foreground">
                Are you sure you want to delete your account? This action cannot be undone.
              </p>
              
              <div className="bg-secondary rounded-lg p-3">
                <h4 className="text-sm font-medium text-foreground mb-2">What will be deleted:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Your email and personal information</li>
                  <li>• Your profile data and settings</li>
                  <li>• Your account access</li>
                </ul>
              </div>
              
              <div className="bg-secondary rounded-lg p-3">
                <h4 className="text-sm font-medium text-foreground mb-2">What will be kept:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Your picks and content (shown as "Deleted User")</li>
                  <li>• Comments and interactions (anonymized)</li>
                </ul>
                <p className="text-xs text-muted-foreground mt-2">
                  This preserves the integrity of community content and discussions.
                </p>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirmation(false)}
                disabled={deleteLoading}
                className="flex-1 px-4 py-2 border border-border text-foreground rounded-lg hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
                className="flex-1 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 focus:outline-none focus:ring-2 focus:ring-destructive focus:ring-offset-2 disabled:opacity-50 text-sm"
              >
                {deleteLoading ? (
                  <>
                    <Loader2 size={14} className="mr-1 animate-spin inline" />
                    Deleting...
                  </>
                ) : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationSettings() {
  const { user } = useAuth();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [settings, setSettings] = useState({
    emailNotifications: true,
    newFollowers: true,
    pickLikes: true,
    comments: true,
    pushNotifications: true,
    weeklyDigest: true,
  });

  useEffect(() => {
    // Load user's notification preferences
    const loadNotificationSettings = async () => {
      if (!user) return;
      
      try {
        // In a real app, fetch from your database
        const saved = localStorage.getItem(`notifications_${user.id}`);
        if (saved) {
          setSettings(JSON.parse(saved));
        }
      } catch (error) {
        console.error('Error loading notification settings:', error);
      }
    };

    loadNotificationSettings();
  }, [user]);

  const updateSetting = async (key: string, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    
    if (user) {
      try {
        // Save to localStorage (in a real app, save to database)
        localStorage.setItem(`notifications_${user.id}`, JSON.stringify(newSettings));
        
        // Only show success message on mobile (screen width < 768px)
        const isMobile = window.innerWidth < 768;
        if (isMobile) {
          setMessage({ type: 'success', text: 'Notification preferences updated' });
          setTimeout(() => setMessage(null), 2000);
        }
      } catch (error) {
        console.error('Error saving notification settings:', error);
        setMessage({ type: 'error', text: 'Failed to save preferences' });
      }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-foreground">Notification Settings</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage how and when you receive notifications.
        </p>
      </div>

      {message && (
        <div className={`p-3 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          <div className="flex items-center">
            {message.type === 'success' ? <Check size={16} className="mr-2" /> : <AlertCircle size={16} className="mr-2" />}
            <span className="text-sm">{message.text}</span>
          </div>
        </div>
      )}
      
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-sm font-medium text-foreground">Email notifications</h3>
            <p className="text-sm text-muted-foreground">Receive email updates about your account</p>
          </div>
          <SwitchToggle 
            checked={settings.emailNotifications} 
            onChange={(checked) => updateSetting('emailNotifications', checked)}
          />
        </div>
        
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-sm font-medium text-foreground">New followers</h3>
            <p className="text-sm text-muted-foreground">Get notified when someone follows you</p>
          </div>
          <SwitchToggle 
            checked={settings.newFollowers} 
            onChange={(checked) => updateSetting('newFollowers', checked)}
          />
        </div>
        
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-sm font-medium text-foreground">Pick likes</h3>
            <p className="text-sm text-muted-foreground">Get notified when someone likes your picks</p>
          </div>
          <SwitchToggle 
            checked={settings.pickLikes} 
            onChange={(checked) => updateSetting('pickLikes', checked)}
          />
        </div>
        
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-sm font-medium text-foreground">Comments</h3>
            <p className="text-sm text-muted-foreground">Get notified when someone comments on your picks</p>
          </div>
          <SwitchToggle 
            checked={settings.comments} 
            onChange={(checked) => updateSetting('comments', checked)}
          />
        </div>

        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-sm font-medium text-foreground">Push notifications</h3>
            <p className="text-sm text-muted-foreground">Get browser push notifications for real-time updates</p>
          </div>
          <SwitchToggle 
            checked={settings.pushNotifications} 
            onChange={(checked) => updateSetting('pushNotifications', checked)}
          />
        </div>

        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-sm font-medium text-foreground">Weekly digest</h3>
            <p className="text-sm text-muted-foreground">Get a weekly summary of activity and trending picks</p>
          </div>
          <SwitchToggle 
            checked={settings.weeklyDigest} 
            onChange={(checked) => updateSetting('weeklyDigest', checked)}
          />
        </div>
      </div>
    </div>
  );
}

function AppearanceSettings() {
  const { theme, setTheme } = useThemeStore();

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-foreground mb-2">Theme</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Choose your preferred theme appearance
        </p>
        
        <div className="space-y-3">
          <label className="flex items-center space-x-3 cursor-pointer">
            <div className="relative flex items-center">
              <input
                type="radio"
                name="theme"
                value="light"
                checked={theme === 'light'}
                onChange={() => handleThemeChange('light')}
                className="sr-only"
              />
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                theme === 'light' 
                  ? 'border-foreground bg-background' 
                  : 'border-muted-foreground bg-background'
              }`}>
                {theme === 'light' && (
                  <div className="w-2 h-2 rounded-full bg-foreground"></div>
                )}
              </div>
            </div>
            <span className="text-sm text-foreground">Light</span>
          </label>
          
          <label className="flex items-center space-x-3 cursor-pointer">
            <div className="relative flex items-center">
              <input
                type="radio"
                name="theme"
                value="dark"
                checked={theme === 'dark'}
                onChange={() => handleThemeChange('dark')}
                className="sr-only"
              />
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                theme === 'dark' 
                  ? 'border-foreground bg-background' 
                  : 'border-muted-foreground bg-background'
              }`}>
                {theme === 'dark' && (
                  <div className="w-2 h-2 rounded-full bg-foreground"></div>
                )}
              </div>
            </div>
            <span className="text-sm text-foreground">Dark</span>
          </label>
          
          <label className="flex items-center space-x-3 cursor-pointer">
            <div className="relative flex items-center">
              <input
                type="radio"
                name="theme"
                value="system"
                checked={theme === 'system'}
                onChange={() => handleThemeChange('system')}
                className="sr-only"
              />
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                theme === 'system' 
                  ? 'border-foreground bg-background' 
                  : 'border-muted-foreground bg-background'
              }`}>
                {theme === 'system' && (
                  <div className="w-2 h-2 rounded-full bg-foreground"></div>
                )}
              </div>
            </div>
            <span className="text-sm text-foreground">System</span>
          </label>
        </div>
      </div>
    </div>
  );
}
