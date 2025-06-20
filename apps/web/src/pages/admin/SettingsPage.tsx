import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, Check, X, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { AdminLayout } from '../../layouts/AdminLayout';

interface SiteSettings {
  allow_signups: boolean;
  require_invite_code: boolean;
  auto_approve_submissions: boolean;
  maintenance_mode: boolean;
  featured_profile_ids: string[];
  site_announcement: string | null;
}

export function SettingsPage() {
  const [settings, setSettings] = useState<SiteSettings>({
    allow_signups: true,
    require_invite_code: true,
    auto_approve_submissions: false,
    maintenance_mode: false,
    featured_profile_ids: [],
    site_announcement: null
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  // Clear notification after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 is "no rows returned" error, which is fine for initial setup
        throw error;
      }

      if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      setNotification({
        type: 'error',
        message: 'Failed to load site settings'
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      // Check if settings already exist
      const { data: existingData, error: checkError } = await supabase
        .from('site_settings')
        .select('id')
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      let error;
      
      if (existingData?.id) {
        // Update existing settings
        const { error: updateError } = await supabase
          .from('site_settings')
          .update({
            ...settings,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingData.id);
          
        error = updateError;
      } else {
        // Insert new settings
        const { error: insertError } = await supabase
          .from('site_settings')
          .insert({
            ...settings,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          
        error = insertError;
      }

      if (error) throw error;

      setNotification({
        type: 'success',
        message: 'Settings saved successfully'
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      setNotification({
        type: 'error',
        message: 'Failed to save settings'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (setting: keyof SiteSettings) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const handleAnnouncementChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSettings(prev => ({
      ...prev,
      site_announcement: e.target.value || null
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <AdminLayout>
      <div>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-[#252525]">Site Settings</h2>
        <button
          onClick={saveSettings}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-[#252525] text-white rounded-lg hover:bg-[#3a3a3a] transition-colors disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Changes
            </>
          )}
        </button>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
          notification.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {notification.type === 'success' ? (
            <Check className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <p>{notification.message}</p>
          <button 
            onClick={() => setNotification(null)}
            className="ml-auto p-1 rounded-full hover:bg-gray-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Settings Form */}
      <div className="space-y-6">
        {/* Registration Settings */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium text-[#252525] mb-4">Registration Settings</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <h4 className="text-sm font-medium text-[#585757]">Allow Signups</h4>
                <p className="text-sm text-gray-500">Allow new users to sign up for an account</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.allow_signups}
                  onChange={() => handleToggle('allow_signups')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#252525]"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <h4 className="text-sm font-medium text-[#585757]">Require Invite Code</h4>
                <p className="text-sm text-gray-500">Require an invite code for new registrations</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.require_invite_code}
                  onChange={() => handleToggle('require_invite_code')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#252525]"></div>
              </label>
            </div>
          </div>
        </div>
        
        {/* Content Settings */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium text-[#252525] mb-4">Content Settings</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <h4 className="text-sm font-medium text-[#585757]">Auto-Approve Submissions</h4>
                <p className="text-sm text-gray-500">Automatically approve new curator submissions</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.auto_approve_submissions}
                  onChange={() => handleToggle('auto_approve_submissions')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#252525]"></div>
              </label>
            </div>
          </div>
        </div>
        
        {/* Site Settings */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium text-[#252525] mb-4">Site Settings</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <h4 className="text-sm font-medium text-[#585757]">Maintenance Mode</h4>
                <p className="text-sm text-gray-500">Put the site in maintenance mode (only admins can access)</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.maintenance_mode}
                  onChange={() => handleToggle('maintenance_mode')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#252525]"></div>
              </label>
            </div>
            
            <div className="p-3">
              <h4 className="text-sm font-medium text-[#585757] mb-2">Site Announcement</h4>
              <p className="text-sm text-gray-500 mb-2">Display an announcement banner on all pages (leave empty for no announcement)</p>
              <textarea
                value={settings.site_announcement || ''}
                onChange={handleAnnouncementChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                placeholder="Enter announcement text..."
              />
            </div>
          </div>
        </div>
      </div>
      </div>
    </AdminLayout>
  );
}

export default SettingsPage;
