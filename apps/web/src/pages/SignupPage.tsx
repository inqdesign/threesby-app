import React, { useState, useEffect, useRef } from 'react';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import type { Pick } from '../types';
import { Eye, EyeOff } from 'lucide-react';

export function SignupPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'invitation' | 'waitlist'>('invitation');
  const [inviteCode, setInviteCode] = useState('');
  const [isValidCode, setIsValidCode] = useState<boolean | null>(null);
  const [isCheckingCode, setIsCheckingCode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [picks, setPicks] = useState<Pick[]>([]);
  const [isWaitlistSubmitted, setIsWaitlistSubmitted] = useState(false);
  const [isSubmittingWaitlist, setIsSubmittingWaitlist] = useState(false);
  
  // Image slider state
  const [sliderImages, setSliderImages] = useState<Pick[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imagesLoading, setImagesLoading] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Redirect if already logged in
  if (user) {
    return <Navigate to="/discover" replace />;
  }

  // Fetch real images from database for slider
  useEffect(() => {
    const fetchSliderImages = async () => {
      try {
        const { data, error } = await supabase
          .from('picks')
          .select(`
            id,
            title,
            category,
            image_url,
            profiles (
              full_name
            )
          `)
          .eq('status', 'published')
          .eq('visible', true)
          .not('image_url', 'is', null)
          .order('created_at', { ascending: false })
          .limit(12);

        if (error) throw error;
        
        // Filter out any picks without valid images and shuffle for variety
        const validPicks = (data || []).filter(pick => pick.image_url);
        const shuffled = validPicks.sort(() => 0.5 - Math.random()).slice(0, 6);
        
        setSliderImages(shuffled);
      } catch (error) {
        console.error('Error fetching slider images:', error);
        // Fallback to empty array if error
        setSliderImages([]);
      } finally {
        setImagesLoading(false);
      }
    };

    fetchSliderImages();
  }, []);

  // Auto-rotate slider images
  useEffect(() => {
    if (sliderImages.length > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % sliderImages.length);
      }, 3000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [sliderImages.length]);

  // Check invitation code validity
  useEffect(() => {
    const checkInviteCode = async () => {
      if (!inviteCode.trim()) {
        setIsValidCode(null);
        return;
      }

      setIsCheckingCode(true);
      try {
        const { data, error } = await supabase
          .from('curator_invites')
          .select('id, status, expires_at')
          .eq('code', inviteCode.trim().toUpperCase())
          .single();

        if (error) {
          setIsValidCode(false);
          return;
        }

        const isValid = data && 
          data.status === 'pending' && 
          new Date(data.expires_at) > new Date();
        
        setIsValidCode(isValid);
      } catch (error) {
        console.error('Error checking invite code:', error);
        setIsValidCode(false);
      } finally {
        setIsCheckingCode(false);
      }
    };

    const timeoutId = setTimeout(checkInviteCode, 500);
    return () => clearTimeout(timeoutId);
  }, [inviteCode]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidCode) return;

    setIsSigningUp(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Mark invite code as used and store the user's email
        await supabase
          .from('curator_invites')
          .update({ 
            status: 'completed',
            used_at: new Date().toISOString(),
            email: data.user.email
          })
          .eq('code', inviteCode.trim().toUpperCase());

        navigate('/onboarding');
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred during signup');
    } finally {
      setIsSigningUp(false);
    }
  };

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmittingWaitlist(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('waitlist')
        .insert({ email: email.trim() });

      if (error) {
        if (error.code === '23505') {
          setError('This email is already on the waitlist.');
        } else {
          throw error;
        }
      } else {
        setIsWaitlistSubmitted(true);
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred. Please try again.');
    } finally {
      setIsSubmittingWaitlist(false);
    }
  };

  const currentPick = sliderImages[currentImageIndex];

  if (isWaitlistSubmitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="mb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold text-foreground mb-2">You're on the list!</h1>
            <p className="text-muted-foreground">
              We'll notify you when your invitation is ready. Keep an eye on your inbox.
            </p>
          </div>
          <Link
            to="/"
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-black hover:bg-gray-800 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-68px)] bg-background flex">
      {/* Left Column - Image Slider */}
      <div className="hidden md:flex md:w-1/2 relative overflow-hidden">
        {imagesLoading ? (
          <div className="w-full h-full bg-gray-100 animate-pulse flex items-center justify-center">
            <div className="text-gray-400">Loading images...</div>
          </div>
        ) : sliderImages.length > 0 ? (
          <div className="relative w-full h-full">
            {sliderImages.map((pick, index) => (
              <div
                key={pick.id}
                className={`absolute inset-0 transition-opacity duration-1000 ${
                  index === currentImageIndex ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <img
                  src={pick.image_url}
                  alt={pick.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
                  <h3 className="text-white font-medium text-lg">{pick.title}</h3>
                  <p className="text-white/80 text-sm capitalize">{pick.category}</p>
                </div>
              </div>
            ))}
            
            {/* Slide indicators */}
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2">
              {sliderImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentImageIndex ? 'bg-white' : 'bg-white/40'
                  }`}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <div className="text-gray-400">No images available</div>
          </div>
        )}
      </div>

      {/* Right Column - Form */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-semibold text-foreground mb-2">Join Threesby</h1>
            <p className="text-muted-foreground">
              Get started with an invitation code or join our waitlist
            </p>
          </div>

          {/* Tabs */}
          <div className="flex mb-6 bg-secondary rounded-lg p-1">
            <button
              onClick={() => {
                setActiveTab('invitation');
                setError(null);
                setEmail('');
                setPassword('');
              }}
              className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'invitation'
                  ? 'bg-neutral-200 text-[#252525]'
                  : 'text-muted-foreground hover:bg-neutral-100'
              }`}
            >
              Invitation Code
            </button>
            <button
              onClick={() => {
                setActiveTab('waitlist');
                setError(null);
                setEmail('');
                setInviteCode('');
                setIsValidCode(null);
              }}
              className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'waitlist'
                  ? 'bg-neutral-200 text-[#252525]'
                  : 'text-muted-foreground hover:bg-neutral-100'
              }`}
            >
              Join Waitlist
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Tab Content */}
          {activeTab === 'invitation' ? (
            /* Invitation Code Form */
            <form onSubmit={handleSignUp} className="space-y-6">
              <div>
                <label htmlFor="inviteCode" className="block text-sm font-medium text-foreground mb-2">
                  Invitation Code
                </label>
                <div className="relative">
                  <input
                    id="inviteCode"
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    className="w-full rounded-lg bg-secondary border-0 shadow-none focus:ring-0 p-3 text-foreground"
                    placeholder="Enter your invitation code"
                    required
                  />
                  {isCheckingCode && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="animate-spin h-4 w-4 border-2 border-border border-t-foreground rounded-full"></div>
                    </div>
                  )}
                  {!isCheckingCode && isValidCode === true && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
                      ✓
                    </div>
                  )}
                  {!isCheckingCode && isValidCode === false && inviteCode && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500">
                      ✗
                    </div>
                  )}
                </div>
                {isValidCode === false && inviteCode && (
                  <p className="mt-1 text-sm text-red-600">Invalid invitation code</p>
                )}
              </div>

              {isValidCode && (
                <>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-lg bg-secondary border-0 shadow-none focus:ring-0 p-3 text-foreground"
                      placeholder="Enter your email"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded-lg bg-secondary border-0 shadow-none focus:ring-0 p-3 pr-12 text-foreground"
                        placeholder="Create a password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={!isValidCode || isSigningUp}
                    className="w-full bg-primary text-primary-foreground rounded-lg py-3 font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {isSigningUp ? 'Creating Account...' : 'Create Account'}
                  </button>
                </>
              )}
            </form>
          ) : (
            /* Waitlist Form */
            <form onSubmit={handleWaitlistSubmit} className="space-y-6">
              <div>
                <label htmlFor="waitlistEmail" className="block text-sm font-medium text-foreground mb-2">
                  Email Address
                </label>
                <input
                  id="waitlistEmail"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg bg-secondary border-0 shadow-none focus:ring-0 p-3 text-foreground"
                  placeholder="Enter your email address"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingWaitlist}
                className="w-full bg-primary text-primary-foreground rounded-lg py-3 font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isSubmittingWaitlist ? 'Joining Waitlist...' : 'Join Waitlist'}
              </button>
            </form>
          )}

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="text-foreground font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 