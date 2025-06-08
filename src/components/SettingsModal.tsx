import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Settings, Bell, Palette } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

type SettingsTab = 'general' | 'notifications' | 'appearance';

type SettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

// Switch component for toggle buttons
function SwitchToggle({ defaultChecked = false }: { defaultChecked?: boolean }) {
  const [checked, setChecked] = useState(defaultChecked);
  
  return (
    <button
      type="button"
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
        checked ? 'bg-blue-600' : 'bg-gray-200'
      }`}
      role="switch"
      aria-checked={checked}
      onClick={() => setChecked(!checked)}
    >
      <span className="sr-only">Toggle</span>
      <span
        className={`pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-5' : 'translate-x-0'
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
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-5 h-5" /> },
    { id: 'appearance', label: 'Appearance', icon: <Palette className="w-5 h-5" /> },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return <GeneralSettings />;
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
              <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-xl bg-white shadow-xl transition-all">
                <div className="flex h-[600px]">
                  {/* Sidebar */}
                  <div className="w-64 border-r border-gray-200 overflow-y-auto">
                    <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                      <Dialog.Title as="h3" className="text-lg font-medium text-gray-900">
                        Settings
                      </Dialog.Title>
                      <button
                        type="button"
                        className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
                        onClick={onClose}
                      >
                        <X className="h-5 w-5" aria-hidden="true" />
                      </button>
                    </div>
                    <div className="py-2">
                      {tabs.map((tab) => (
                        <button
                          key={tab.id}
                          className={`w-full text-left px-4 py-3 flex items-center space-x-3 hover:bg-gray-50 ${
                            activeTab === tab.id ? 'bg-gray-100' : ''
                          }`}
                          onClick={() => setActiveTab(tab.id as SettingsTab)}
                        >
                          <div className="text-gray-500">{tab.icon}</div>
                          <span className="text-sm font-medium text-gray-700">{tab.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 overflow-y-auto p-6">
                    {renderTabContent()}
                    {/* Log out button at the bottom */}
                    <div className="absolute bottom-6 right-6">
                      <button
                        onClick={handleSignOut}
                        className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                      >
                        Log out
                      </button>
                    </div>
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
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-gray-900">General Settings</h2>
        <p className="mt-1 text-sm text-gray-500">
          Manage your general account settings and preferences.
        </p>
      </div>
      
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-sm font-medium text-gray-900">Show favorites count</h3>
            <p className="text-sm text-gray-500">Display the number of favorites on pick cards</p>
          </div>
          <SwitchToggle defaultChecked />
        </div>
        
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-sm font-medium text-gray-900">Show categories on discover page</h3>
            <p className="text-sm text-gray-500">Display category filters on the discover page</p>
          </div>
          <SwitchToggle defaultChecked />
        </div>
      </div>
      
      <div className="pt-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Language</h3>
        <select className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border">
          <option>English (US)</option>
          <option>English (UK)</option>
          <option>Spanish</option>
          <option>French</option>
          <option>German</option>
        </select>
      </div>
    </div>
  );
}

function NotificationSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-gray-900">Notification Settings</h2>
        <p className="mt-1 text-sm text-gray-500">
          Manage how and when you receive notifications.
        </p>
      </div>
      
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-sm font-medium text-gray-900">Email notifications</h3>
            <p className="text-sm text-gray-500">Receive email updates about your account</p>
          </div>
          <SwitchToggle defaultChecked />
        </div>
        
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-sm font-medium text-gray-900">New followers</h3>
            <p className="text-sm text-gray-500">Get notified when someone follows you</p>
          </div>
          <SwitchToggle defaultChecked />
        </div>
        
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-sm font-medium text-gray-900">Pick likes</h3>
            <p className="text-sm text-gray-500">Get notified when someone likes your picks</p>
          </div>
          <SwitchToggle defaultChecked />
        </div>
        
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-sm font-medium text-gray-900">Comments</h3>
            <p className="text-sm text-gray-500">Get notified when someone comments on your picks</p>
          </div>
          <SwitchToggle defaultChecked />
        </div>
      </div>
    </div>
  );
}

function AppearanceSettings() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('light');
  
  // In a real implementation, this would use the actual theme system
  // For now, we're just using local state for the UI demonstration
  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    // In a real implementation, this would update the theme in localStorage or a context
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-gray-900">Appearance</h2>
        <p className="mt-1 text-sm text-gray-500">
          Customize how Threesby looks for you.
        </p>
      </div>
      
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">Theme</h3>
          <div className="grid grid-cols-3 gap-3">
            <button 
              className={`flex items-center justify-center rounded-md ${theme === 'light' ? 'border-2 border-blue-600' : 'border border-gray-300'} bg-white px-3 py-2 text-sm font-medium text-gray-900 shadow-sm hover:bg-gray-50 focus:outline-none`}
              onClick={() => handleThemeChange('light')}
            >
              Light
            </button>
            <button 
              className={`flex items-center justify-center rounded-md ${theme === 'dark' ? 'border-2 border-blue-600' : 'border border-gray-300'} bg-white px-3 py-2 text-sm font-medium text-gray-900 shadow-sm hover:bg-gray-50 focus:outline-none`}
              onClick={() => handleThemeChange('dark')}
            >
              Dark
            </button>
            <button 
              className={`flex items-center justify-center rounded-md ${theme === 'system' ? 'border-2 border-blue-600' : 'border border-gray-300'} bg-white px-3 py-2 text-sm font-medium text-gray-900 shadow-sm hover:bg-gray-50 focus:outline-none`}
              onClick={() => handleThemeChange('system')}
            >
              System
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
