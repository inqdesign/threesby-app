import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { OnboardingLayout } from '../components/onboarding/OnboardingLayout';
import type { OnboardingStep, OnboardingData, Profile } from '../types';
import { ImageUpload } from '../components/ImageUpload';

const STEPS: OnboardingStep[] = [
  'welcome',
  'profile',
  'interests',
  'location',
  'photo',
  'social',
  'bio',
  'complete'
];

const INTERESTS = [
  'Art & Design',
  'Books & Literature',
  'Fashion & Style',
  'Food & Dining',
  'Health & Wellness',
  'Home & Interior',
  'Music & Entertainment',
  'Nature & Outdoors',
  'Photography',
  'Technology',
  'Travel & Adventure',
  'Urban Culture'
];

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
  'Singapore'
];

export function OnboardingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Partial<Profile>>({});
  const [customLocation, setCustomLocation] = useState('');

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

      if (error) throw error;

      if (data.onboarding_completed) {
        navigate('/my-threes');
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    const currentIndex = STEPS.indexOf(currentStep);
    if (currentIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    const currentIndex = STEPS.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(STEPS[currentIndex - 1]);
    }
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          ...profile,
          onboarding_completed: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id);

      if (error) throw error;
      navigate('/my-threes');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      alert('Error saving profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    navigate('/my-threes');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F4F4]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#252525]"></div>
      </div>
    );
  }

  return (
    <OnboardingLayout
      currentStep={currentStep}
      totalSteps={STEPS.length}
      currentStepNumber={STEPS.indexOf(currentStep) + 1}
    >
      <AnimatePresence mode="wait">
        {currentStep === 'welcome' && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center"
          >
            <h1 className="text-3xl font-bold mb-4">Welcome to Threesby!</h1>
            <p className="text-gray-600 mb-8">
              Let's set up your curator profile so you can start sharing your picks with the world.
            </p>
            <button
              onClick={handleNext}
              className="px-6 py-3 bg-[#252525] text-white rounded-lg hover:bg-[#111111] transition-colors"
            >
              Get Started
            </button>
          </motion.div>
        )}

        {currentStep === 'profile' && (
          <motion.div
            key="profile"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <h2 className="text-2xl font-bold mb-6">Personal Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={profile.full_name || ''}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Professional Title
                </label>
                <input
                  type="text"
                  value={profile.title || ''}
                  onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="e.g. Food & Travel Curator"
                />
              </div>
            </div>
          </motion.div>
        )}

        {currentStep === 'interests' && (
          <motion.div
            key="interests"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <h2 className="text-2xl font-bold mb-6">Areas of Interest</h2>
            <p className="text-gray-600 mb-6">
              Select the topics that best describe your expertise and interests.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {INTERESTS.map((interest) => (
                <button
                  key={interest}
                  onClick={() => {
                    const interests = profile.interests || [];
                    const newInterests = interests.includes(interest)
                      ? interests.filter((i) => i !== interest)
                      : [...interests, interest];
                    setProfile({ ...profile, interests: newInterests });
                  }}
                  className={`p-3 text-sm rounded-lg border transition-colors ${
                    (profile.interests || []).includes(interest)
                      ? 'border-[#252525] bg-[#252525] text-white'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {currentStep === 'location' && (
          <motion.div
            key="location"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <h2 className="text-2xl font-bold mb-6">Where are you based?</h2>
            <p className="text-gray-600 mb-6">
              Select your current city to help connect with local community.
            </p>
            <div className="space-y-4">
              <select
                value={profile.location || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === 'custom') {
                    setProfile({ ...profile, location: customLocation });
                  } else {
                    setProfile({ ...profile, location: value });
                  }
                }}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Select a city</option>
                {CITIES.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
                <option value="custom">Other (specify)</option>
              </select>

              {profile.location === 'custom' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Enter your location
                  </label>
                  <input
                    type="text"
                    value={customLocation}
                    onChange={(e) => {
                      setCustomLocation(e.target.value);
                      setProfile({ ...profile, location: e.target.value });
                    }}
                    placeholder="City, Country"
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>
          </motion.div>
        )}

        {currentStep === 'photo' && (
          <motion.div
            key="photo"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <h2 className="text-2xl font-bold mb-6">Profile Photo</h2>
            <p className="text-gray-600 mb-6">
              Add a profile photo to help others recognize you.
            </p>
            <ImageUpload
              onImageSelected={(file) => {
                // Handle image upload
              }}
              currentUrl={profile.avatar_url}
            />
          </motion.div>
        )}

        {currentStep === 'social' && (
          <motion.div
            key="social"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <h2 className="text-2xl font-bold mb-6">Social Links</h2>
            <p className="text-gray-600 mb-6">
              Add your social media profiles to connect with others.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Twitter
                </label>
                <input
                  type="url"
                  value={profile.social_links?.twitter || ''}
                  onChange={(e) => setProfile({
                    ...profile,
                    social_links: {
                      ...profile.social_links,
                      twitter: e.target.value
                    }
                  })}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="https://twitter.com/username"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Instagram
                </label>
                <input
                  type="url"
                  value={profile.social_links?.instagram || ''}
                  onChange={(e) => setProfile({
                    ...profile,
                    social_links: {
                      ...profile.social_links,
                      instagram: e.target.value
                    }
                  })}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="https://instagram.com/username"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Website
                </label>
                <input
                  type="url"
                  value={profile.social_links?.website || ''}
                  onChange={(e) => setProfile({
                    ...profile,
                    social_links: {
                      ...profile.social_links,
                      website: e.target.value
                    }
                  })}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="https://yourwebsite.com"
                />
              </div>
            </div>
          </motion.div>
        )}

        {currentStep === 'bio' && (
          <motion.div
            key="bio"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <h2 className="text-2xl font-bold mb-6">About You</h2>
            <p className="text-gray-600 mb-6">
              Tell others about yourself and what you're passionate about.
            </p>
            <textarea
              value={profile.message || ''}
              onChange={(e) => setProfile({ ...profile, message: e.target.value })}
              rows={4}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Share your story..."
            />
          </motion.div>
        )}

        {currentStep === 'complete' && (
          <motion.div
            key="complete"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center"
          >
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-4">You're All Set!</h2>
            <p className="text-gray-600 mb-8">
              Your curator profile is ready. Start sharing your picks with the world.
            </p>
            <button
              onClick={handleComplete}
              disabled={saving}
              className="px-6 py-3 bg-[#252525] text-white rounded-lg hover:bg-[#111111] transition-colors disabled:opacity-50"
            >
              {saving ? 'Completing...' : 'Start Curating'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {currentStep !== 'welcome' && currentStep !== 'complete' && (
        <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={handleBack}
            className="px-4 py-2 text-gray-600 hover:text-gray-900"
          >
            Back
          </button>
          <div className="flex gap-3">
            <button
              onClick={handleSkip}
              className="px-4 py-2 text-gray-600 hover:text-gray-900"
            >
              Skip for now
            </button>
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-[#252525] text-white rounded-lg hover:bg-[#111111] transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </OnboardingLayout>
  );
}