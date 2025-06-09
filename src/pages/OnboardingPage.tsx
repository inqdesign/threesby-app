import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Check, ChevronRight, Mail, User, MapPin, Camera, ArrowLeft } from 'lucide-react';

type OnboardingStep = 'welcome' | 'profile' | 'location' | 'photo' | 'complete';

interface ProfileData {
  email?: string;
  full_name?: string;
  title?: string;
  location?: string;
  avatar_url?: string;
}

const CITIES = [
  'New York, USA',
  'London, UK',
  'Paris, France',
  'Tokyo, Japan',
  'Berlin, Germany',
  'Seoul, South Korea',
  'Sydney, Australia',
  'Toronto, Canada',
  'Amsterdam, Netherlands',
  'Singapore',
  'Los Angeles, USA',
  'San Francisco, USA',
  'Chicago, USA',
  'Boston, USA',
  'Vancouver, Canada',
  'Montreal, Canada',
  'Barcelona, Spain',
  'Madrid, Spain',
  'Milan, Italy',
  'Rome, Italy'
];

export function OnboardingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({});
  const [customLocation, setCustomLocation] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const steps: OnboardingStep[] = ['welcome', 'profile', 'location', 'photo', 'complete'];
  const currentStepIndex = steps.indexOf(currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  // Load existing profile data
  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      // If profile exists and onboarding is complete, redirect
      if (data?.onboarding_completed) {
        navigate(`/profile/${user?.id}`);
        return;
      }

      setProfile({
        email: data?.email || user?.email || '',
        full_name: data?.full_name || '',
        title: data?.title || '',
        location: data?.location || '',
        avatar_url: data?.avatar_url || ''
      });
    } catch (error) {
      console.error('Error loading profile:', error);
      setProfile({ email: user?.email || '' });
    } finally {
      setLoading(false);
    }
  };

  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 'profile') {
      if (!profile.full_name?.trim()) {
        newErrors.full_name = 'Full name is required';
      }
      if (!profile.title?.trim()) {
        newErrors.title = 'Title is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateProfile = async (updates: Partial<ProfileData>): Promise<boolean> => {
    if (!user) return false;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          ...updates,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        });

      if (error) throw error;

      setProfile(prev => ({ ...prev, ...updates }));
      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async () => {
    if (!validateStep()) return;

    // Save current step data
    let updates: Partial<ProfileData> = {};
    
    switch (currentStep) {
      case 'profile':
        updates = {
          full_name: profile.full_name,
          title: profile.title
        };
        break;
      case 'location':
        updates = { location: profile.location };
        break;
      case 'photo':
        updates = { avatar_url: profile.avatar_url };
        break;
    }

    if (Object.keys(updates).length > 0) {
      const success = await updateProfile(updates);
      if (!success) {
        alert('Error saving progress. Please try again.');
        return;
      }
    }

    // Move to next step
    if (currentStepIndex < steps.length - 1) {
      setCurrentStep(steps[currentStepIndex + 1]);
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(steps[currentStepIndex - 1]);
    }
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          onboarding_completed: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id);

      if (error) throw error;
      
      navigate(`/profile/${user?.id}`);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      alert('Error completing setup. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!user) return;

    setSaving(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      if (data?.publicUrl) {
        setProfile(prev => ({ ...prev, avatar_url: data.publicUrl }));
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error uploading image. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F4F4]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#252525]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F4F4]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-[#252525]">Setup Your Profile</h1>
            <span className="text-sm text-gray-500">
              Step {currentStepIndex + 1} of {steps.length}
            </span>
          </div>
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              className="bg-[#252525] h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm p-8">
          <AnimatePresence mode="wait">
            {currentStep === 'welcome' && (
              <motion.div
                key="welcome"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-[#252525] rounded-full flex items-center justify-center mx-auto mb-6">
                  <Mail className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-4 text-[#252525]">Welcome to Threesby!</h2>
                <p className="text-gray-600 mb-8 leading-relaxed max-w-md mx-auto">
                  Let's set up your curator profile in just a few steps. We'll start by confirming your contact information.
                </p>
                <div className="bg-gray-50 p-4 rounded-lg mb-8 max-w-md mx-auto">
                  <p className="text-sm text-gray-700">
                    <strong>Email:</strong> {profile.email}
                  </p>
                </div>
                <button
                  onClick={handleNext}
                  className="w-full max-w-md flex items-center justify-center gap-2 px-6 py-3 bg-[#252525] text-white rounded-lg hover:bg-[#111111] transition-colors"
                >
                  Get Started <ChevronRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            {currentStep === 'profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="w-16 h-16 bg-[#252525] rounded-full flex items-center justify-center mx-auto mb-6">
                  <User className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-2 text-center text-[#252525]">Tell us about yourself</h2>
                <p className="text-gray-600 mb-8 text-center">
                  Help others discover who you are and what you curate.
                </p>
                
                <div className="space-y-6 max-w-md mx-auto">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={profile.full_name || ''}
                      onChange={(e) => {
                        setProfile({ ...profile, full_name: e.target.value });
                        if (errors.full_name) {
                          setErrors({ ...errors, full_name: '' });
                        }
                      }}
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#252525] focus:border-transparent ${
                        errors.full_name ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Your full name"
                    />
                    {errors.full_name && (
                      <p className="mt-1 text-sm text-red-600">{errors.full_name}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Professional Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={profile.title || ''}
                      onChange={(e) => {
                        setProfile({ ...profile, title: e.target.value });
                        if (errors.title) {
                          setErrors({ ...errors, title: '' });
                        }
                      }}
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#252525] focus:border-transparent ${
                        errors.title ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="e.g. Food & Travel Curator, Design Enthusiast"
                    />
                    {errors.title && (
                      <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 'location' && (
              <motion.div
                key="location"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="w-16 h-16 bg-[#252525] rounded-full flex items-center justify-center mx-auto mb-6">
                  <MapPin className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-2 text-center text-[#252525]">Where are you based?</h2>
                <p className="text-gray-600 mb-8 text-center">
                  Help connect with your local community and discover nearby picks.
                </p>
                
                <div className="space-y-4 max-w-md mx-auto">
                  <select
                    value={profile.location || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === 'custom') {
                        setProfile({ ...profile, location: customLocation });
                      } else {
                        setProfile({ ...profile, location: value });
                        setCustomLocation('');
                      }
                    }}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#252525] focus:border-transparent"
                  >
                    <option value="">Select your city</option>
                    {CITIES.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                    <option value="custom">Other (specify below)</option>
                  </select>

                  {(profile.location === 'custom' || (profile.location && !CITIES.includes(profile.location))) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Enter your location
                      </label>
                      <input
                        type="text"
                        value={customLocation || profile.location || ''}
                        onChange={(e) => {
                          setCustomLocation(e.target.value);
                          setProfile({ ...profile, location: e.target.value });
                        }}
                        placeholder="City, Country"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#252525] focus:border-transparent"
                      />
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {currentStep === 'photo' && (
              <motion.div
                key="photo"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="w-16 h-16 bg-[#252525] rounded-full flex items-center justify-center mx-auto mb-6">
                  <Camera className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-2 text-center text-[#252525]">Add your photo</h2>
                <p className="text-gray-600 mb-8 text-center">
                  A profile photo helps others recognize and connect with you.
                </p>
                
                <div className="flex flex-col items-center max-w-sm mx-auto">
                  <div className="w-32 h-32 rounded-full overflow-hidden mb-6 bg-gray-100 border-2 border-gray-200">
                    {profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                  </div>
                  
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                    }}
                    className="hidden"
                    id="avatar-upload"
                  />
                  <label
                    htmlFor="avatar-upload"
                    className={`px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer ${
                      saving ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {saving ? 'Uploading...' : profile.avatar_url ? 'Change Photo' : 'Upload Photo'}
                  </label>
                </div>
              </motion.div>
            )}

            {currentStep === 'complete' && (
              <motion.div
                key="complete"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Check className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-4 text-[#252525]">You're All Set!</h2>
                <p className="text-gray-600 mb-8">
                  Your curator profile is ready. Start exploring and sharing your picks with the world.
                </p>
                
                <div className="bg-gray-50 p-6 rounded-lg mb-8 text-left max-w-md mx-auto">
                  <h3 className="font-medium text-[#252525] mb-3">Your Profile Summary:</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p><strong>Name:</strong> {profile.full_name}</p>
                    <p><strong>Title:</strong> {profile.title}</p>
                    {profile.location && <p><strong>Location:</strong> {profile.location}</p>}
                  </div>
                </div>
                
                <button
                  onClick={handleComplete}
                  disabled={saving}
                  className="w-full max-w-md flex items-center justify-center gap-2 px-6 py-3 bg-[#252525] text-white rounded-lg hover:bg-[#111111] transition-colors disabled:opacity-50"
                >
                  {saving ? 'Completing...' : 'View My Profile'} <ChevronRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          {currentStep !== 'welcome' && currentStep !== 'complete' && (
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={handleBack}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => navigate(`/profile/${user?.id}`)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Skip for now
                </button>
                <button
                  onClick={handleNext}
                  disabled={saving}
                  className="px-6 py-2 bg-[#252525] text-white rounded-lg hover:bg-[#111111] transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? 'Saving...' : 'Continue'} <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 