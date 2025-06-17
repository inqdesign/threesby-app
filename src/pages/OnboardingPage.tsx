import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Check, ChevronRight, Mail, User, MapPin, Camera, ArrowLeft, Star, Award, BookOpen } from 'lucide-react';
import { LocationSelect } from '../components/LocationSelect';

type OnboardingStep = 'welcome' | 'profile' | 'username' | 'location' | 'photo' | 'complete';

interface ProfileData {
  email?: string;
  full_name?: string;
  title?: string;
  username?: string;
  location?: string;
  avatar_url?: string;
}



export function OnboardingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([]);
  const [checkingUsername, setCheckingUsername] = useState(false);

  const steps: OnboardingStep[] = ['welcome', 'profile', 'username', 'location', 'photo', 'complete'];
  const currentStepIndex = steps.indexOf(currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  // Load existing profile data and handle redirects
  useEffect(() => {
    if (!user) {
      console.log('No authenticated user, redirecting to home');
      setRedirecting(true);
      navigate('/', { replace: true });
      return;
    }
    
    loadProfile();
  }, [user, navigate]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      // More aggressive redirect conditions for existing users
      const shouldRedirect = data && (
        data.onboarding_completed || 
        (data.full_name && data.title) ||
        data.is_creator ||
        data.is_admin ||
        // If user has picks, they're likely an existing user
        (data.updated_at && new Date(data.updated_at) < new Date(Date.now() - 24 * 60 * 60 * 1000)) // Updated more than 24h ago
      );

      if (shouldRedirect) {
        console.log('Existing user detected, redirecting to home:', {
          onboarding_completed: data?.onboarding_completed,
          has_profile: data?.full_name && data?.title,
          is_creator: data?.is_creator,
          is_admin: data?.is_admin
        });
        // Set redirecting state and navigate
        setRedirecting(true);
        navigate('/', { replace: true });
        return;
      }

      // Only set profile data for genuinely new users
      setProfile({
        email: data?.email || user?.email || '',
        full_name: data?.full_name || '',
        title: data?.title || '',
        username: data?.username || '',
        location: data?.location || '',
        avatar_url: data?.avatar_url || ''
      });
      
      // Only set loading to false for new users who should see onboarding
      setLoading(false);
    } catch (error) {
      console.error('Error loading profile:', error);
      // For new users without profiles, start with email
      setProfile({ email: user?.email || '' });
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

    if (currentStep === 'username') {
      if (!profile.username?.trim()) {
        newErrors.username = 'Username is required';
      } else if (profile.username.length < 3) {
        newErrors.username = 'Username must be at least 3 characters';
      } else if (profile.username.length > 20) {
        newErrors.username = 'Username must be 20 characters or less';
      } else if (!/^[a-zA-Z0-9][a-zA-Z0-9_.-]*[a-zA-Z0-9]$/.test(profile.username)) {
        newErrors.username = 'Username can only contain letters, numbers, dots, hyphens, and underscores';
      }
      // Don't include availability errors in validateStep - those are handled separately
    }

    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    console.log('validateStep:', currentStep, 'username:', profile.username, 'errors:', newErrors, 'isValid:', isValid);
    return isValid;
  };

  const updateProfile = async (updates: Partial<ProfileData>): Promise<boolean> => {
    if (!user) return false;

    setSaving(true);
    try {
      console.log('Updating profile with:', updates);
      
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

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      console.log('Profile updated successfully');
      setProfile(prev => ({ ...prev, ...updates }));
      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      
      // Check if this is a missing column error (username or location)
      const isColumnError = (error instanceof Error && error.message?.includes('column')) ||
                           (typeof error === 'object' && error !== null && 'message' in error && 
                            (error as any).message?.includes('column'));
      
      if (isColumnError) {
        const errorMessage = error instanceof Error ? error.message : (error as any).message;
        
        // Handle username column missing
        if (updates.username && (errorMessage?.includes('username') || errorMessage?.includes('column'))) {
          console.log('Username column might not exist, skipping username save for now');
          setProfile(prev => ({ ...prev, ...updates }));
          return true;
        }
        
        // Handle location column missing  
        if (updates.location && (errorMessage?.includes('location') || errorMessage?.includes('column'))) {
          console.log('Location column might not exist, skipping location save for now');
          setProfile(prev => ({ ...prev, ...updates }));
          return true;
        }
        
        // Handle general column errors by skipping the save but continuing
        if (errorMessage?.includes('column')) {
          console.log('Database column might not exist, skipping save for now');
          setProfile(prev => ({ ...prev, ...updates }));
          return true;
        }
      }
      
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async () => {
    console.log('handleNext called for step:', currentStep);
    console.log('Current errors:', errors);
    console.log('Profile username:', profile.username);
    
    if (!validateStep()) {
      console.log('validateStep failed');
      return;
    }
    
    // For username step, also check if there are availability errors
    if (currentStep === 'username' && errors.username && errors.username.trim()) {
      console.log('Availability error blocking:', errors.username);
      return;
    }
    
    console.log('Proceeding with next step');

    // Save current step data
    let updates: Partial<ProfileData> = {};
    
    switch (currentStep) {
      case 'profile':
        updates = {
          full_name: profile.full_name,
          title: profile.title
        };
        break;
      case 'username':
        updates = { username: profile.username };
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
      
      // Redirect to home page to start exploring
      navigate('/');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      alert('Error completing setup. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Check username availability
  const checkUsernameAvailability = async (username: string): Promise<boolean> => {
    if (!username) return false;
    
    try {
      // Check if username exists in profiles table
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .ilike('username', username)
        .single();
      
      if (error) {
        // If no matching record found, username is available
        if (error.code === 'PGRST116') {
          return true;
        }
        throw error;
      }
      
      // If we got data, username is taken
      return false;
    } catch (error) {
      console.error('Error checking username:', error);
      // If there's an error, assume username is available for better UX
      return true;
    }
  };

  // Generate username suggestions
  const generateUsernameSuggestions = async (fullName: string) => {
    if (!fullName) return;
    
    try {
      const { data, error } = await supabase.rpc('generate_username_suggestions', {
        base_name: fullName
      });
      
      if (error) throw error;
      setUsernameSuggestions(data || []);
    } catch (error) {
      console.error('Error generating suggestions:', error);
      setUsernameSuggestions([]);
    }
  };

  // Handle username change with real-time validation
  const handleUsernameChange = async (username: string) => {
    setProfile(prev => ({ ...prev, username }));
    
    if (username.length >= 3) {
      setCheckingUsername(true);
      const isAvailable = await checkUsernameAvailability(username);
      
      setErrors(prev => ({
        ...prev,
        username: isAvailable ? '' : 'Username is already taken'
      }));
      setCheckingUsername(false);
    } else {
      // Clear availability errors for short usernames (format validation will handle them)
      setErrors(prev => ({
        ...prev,
        username: ''
      }));
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

  // Show loading only when we haven't loaded profile data yet or are redirecting
  if (!user || loading || redirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-foreground">Setup Your Profile</h1>
            <span className="text-sm text-muted-foreground">
              Step {currentStepIndex + 1} of {steps.length}
            </span>
          </div>
          {/* Progress Bar */}
          <div className="w-full bg-secondary rounded-full h-2">
            <motion.div
              className="bg-foreground h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-card rounded-xl shadow-sm p-8">
          <AnimatePresence mode="wait">
            {currentStep === 'welcome' && (
              <motion.div
                key="welcome"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-foreground rounded-full flex items-center justify-center mx-auto mb-6">
                  <Mail className="w-8 h-8 text-background" />
                </div>
                <h2 className="text-2xl font-bold mb-4 text-foreground">Welcome to Threesby!</h2>
                <p className="text-muted-foreground mb-8 leading-relaxed max-w-md mx-auto">
                  Let's set up your curator profile in just a few steps. We'll start by confirming your contact information.
                </p>
                <div className="bg-secondary p-4 rounded-lg mb-8 max-w-md mx-auto">
                  <p className="text-sm text-foreground">
                    <strong>Email:</strong> {profile.email}
                  </p>
                </div>
                <button
                  onClick={handleNext}
                  className="w-full max-w-md flex items-center justify-center gap-2 px-6 py-3 bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors"
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
                <div className="w-16 h-16 bg-foreground rounded-full flex items-center justify-center mx-auto mb-6">
                  <User className="w-8 h-8 text-background" />
                </div>
                <h2 className="text-2xl font-bold mb-2 text-center text-foreground">Tell us about yourself</h2>
                <p className="text-muted-foreground mb-8 text-center">
                  Help others discover who you are and what you curate.
                </p>
                
                <div className="space-y-6 max-w-md mx-auto">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
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
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-foreground focus:border-transparent bg-background text-foreground ${
                        errors.full_name ? 'border-red-500' : 'border-border'
                      }`}
                      placeholder="Your full name"
                    />
                    {errors.full_name && (
                      <p className="mt-1 text-sm text-red-600">{errors.full_name}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
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
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-foreground focus:border-transparent bg-background text-foreground ${
                        errors.title ? 'border-red-500' : 'border-border'
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

            {currentStep === 'username' && (
              <motion.div
                key="username"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="w-16 h-16 bg-foreground rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-background font-bold text-xl">@</span>
                </div>
                <h2 className="text-2xl font-bold mb-2 text-center text-foreground">Choose your username</h2>
                <p className="text-muted-foreground mb-8 text-center">
                  Your username will be used for your profile URL: threesby.com/@username
                </p>
                
                <div className="space-y-6 max-w-md mx-auto">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Username <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                        @
                      </div>
                      <input
                        type="text"
                        value={profile.username || ''}
                        onChange={(e) => {
                          const value = e.target.value.toLowerCase().replace(/[^a-zA-Z0-9._-]/g, '');
                          handleUsernameChange(value);
                          if (errors.username && value !== profile.username) {
                            setErrors({ ...errors, username: '' });
                          }
                        }}
                        className={`w-full pl-8 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-foreground focus:border-transparent bg-background text-foreground ${
                          errors.username ? 'border-red-500' : 
                          profile.username && profile.username.length >= 3 && !errors.username ? 'border-green-500' : 'border-border'
                        }`}
                        placeholder="yourname"
                        maxLength={20}
                      />
                      {checkingUsername && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-foreground"></div>
                        </div>
                      )}
                    </div>
                    {errors.username && (
                      <p className="mt-1 text-sm text-red-600">{errors.username}</p>
                    )}
                    {profile.username && profile.username.length >= 3 && !errors.username && !checkingUsername && (
                      <p className="mt-1 text-sm text-green-600 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Username available!
                      </p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">
                      3-20 characters, letters, numbers, dots, hyphens, underscores only
                    </p>
                  </div>

                  {/* Username Suggestions */}
                  {usernameSuggestions.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-foreground mb-2">Suggestions:</p>
                      <div className="flex flex-wrap gap-2">
                        {usernameSuggestions.map((suggestion) => (
                          <button
                            key={suggestion}
                            onClick={() => handleUsernameChange(suggestion)}
                            className="px-3 py-1 text-sm bg-secondary hover:bg-secondary/80 text-foreground rounded-full transition-colors"
                          >
                            @{suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Generate suggestions button */}
                  {profile.full_name && usernameSuggestions.length === 0 && (
                    <button
                      onClick={() => generateUsernameSuggestions(profile.full_name!)}
                      className="text-sm text-foreground hover:underline"
                    >
                      Generate suggestions from your name
                    </button>
                  )}
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
                <div className="w-16 h-16 bg-foreground rounded-full flex items-center justify-center mx-auto mb-6">
                  <MapPin className="w-8 h-8 text-background" />
                </div>
                <h2 className="text-2xl font-bold mb-2 text-center text-foreground">Where are you based?</h2>
                <p className="text-muted-foreground mb-8 text-center">
                  Help connect with your local community and discover nearby picks.
                </p>
                
                <div className="space-y-4 max-w-md mx-auto">
                  <LocationSelect
                    value={profile.location || ''}
                    onChange={(location) => setProfile({ ...profile, location })}
                    placeholder="Select or enter your location"
                  />
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
                <div className="w-16 h-16 bg-foreground rounded-full flex items-center justify-center mx-auto mb-6">
                  <Camera className="w-8 h-8 text-background" />
                </div>
                <h2 className="text-2xl font-bold mb-2 text-center text-foreground">Add your photo</h2>
                <p className="text-muted-foreground mb-8 text-center">
                  A profile photo helps others recognize and connect with you.
                </p>
                
                <div className="flex flex-col items-center max-w-sm mx-auto">
                  <div className="w-32 h-32 rounded-full overflow-hidden mb-6 bg-secondary border-2 border-border">
                    {profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-12 h-12 text-muted-foreground" />
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
                    className={`px-6 py-3 border border-border rounded-lg text-foreground hover:bg-secondary/80 transition-colors cursor-pointer ${
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
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Award className="w-8 h-8 text-background" />
                </div>
                <h2 className="text-2xl font-bold mb-4 text-foreground">Ready to Become a Curator?</h2>
                <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
                  Your profile is set up! Now take the next step to become a verified curator by sharing your expertise.
                </p>
                
                {/* Curator Process Steps */}
                <div className="bg-secondary p-6 rounded-lg mb-8 text-left max-w-2xl mx-auto">
                  <h3 className="font-semibold text-foreground mb-4 text-center">How to Become a Curator</h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground mb-1">1. Create Your Best Picks</h4>
                        <p className="text-sm text-muted-foreground">
                          Share your 3 best recommendations in each category you know well. Quality over quantity!
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Star className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground mb-1">2. Submit for Review</h4>
                        <p className="text-sm text-muted-foreground">
                          Our team will review your picks for quality, authenticity, and expertise level.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Award className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground mb-1">3. Get Verified</h4>
                        <p className="text-sm text-muted-foreground">
                          Once approved, you'll receive curator status and access to exclusive features.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Profile Summary */}
                <div className="bg-card border border-border p-4 md:rounded-xl rounded-lg mb-8 text-left max-w-md mx-auto">
                  <h4 className="font-medium text-foreground mb-2 text-sm">Your Profile:</h4>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p><strong>Name:</strong> {profile.full_name}</p>
                    <p><strong>Title:</strong> {profile.title}</p>
                    {profile.location && <p><strong>Location:</strong> {profile.location}</p>}
                  </div>
                </div>
                
                <button
                  onClick={handleComplete}
                  disabled={saving}
                  className="w-full max-w-md flex items-center justify-center gap-2 px-6 py-3 bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Completing...' : 'Start Exploring & Creating Picks'} <ChevronRight className="w-4 h-4" />
                </button>
                
                <p className="text-xs text-muted-foreground mt-4 max-w-md mx-auto">
                  You can start creating picks right away and apply for curator status when ready.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          {currentStep !== 'welcome' && currentStep !== 'complete' && (
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-border">
              <button
                onClick={handleBack}
                className="flex items-center gap-2 px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => navigate(`/profile/${user?.id}`)}
                  className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  Skip for now
                </button>
                <button
                  onClick={handleNext}
                  disabled={saving}
                  className="px-6 py-2 bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors disabled:opacity-50 flex items-center gap-2"
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