import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Star, Users, ArrowRight, Check, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function SignupPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prefilledInvite = searchParams.get('invite') || '';
  
  const [inviteCode, setInviteCode] = useState(prefilledInvite);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [inviteValid, setInviteValid] = useState<boolean | null>(null);
  const [checkingInvite, setCheckingInvite] = useState(false);

  // Check invite code validity when it changes
  useEffect(() => {
    const checkInviteCode = async () => {
      if (!inviteCode.trim()) {
        setInviteValid(null);
        return;
      }

      setCheckingInvite(true);
      try {
        const { data, error } = await supabase
          .from('curator_invites')
          .select('id, status, expires_at')
          .eq('code', inviteCode.trim())
          .eq('status', 'pending')
          .gt('expires_at', new Date().toISOString())
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
          throw error;
        }

        setInviteValid(!!data);
      } catch (error) {
        console.error('Error checking invite code:', error);
        setInviteValid(false);
      } finally {
        setCheckingInvite(false);
      }
    };

    const timeoutId = setTimeout(checkInviteCode, 500); // Debounce
    return () => clearTimeout(timeoutId);
  }, [inviteCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const hasInviteCode = inviteCode.trim();
      const hasEmail = email.trim();

      if (!hasInviteCode && !hasEmail) {
        throw new Error('Please enter either an invitation code or your email address');
      }

      // If only email is provided (waitlist submission)
      if (!hasInviteCode && hasEmail) {
        const { error: waitlistError } = await supabase
          .from('waitlist')
          .insert([{ email: email.trim() }]);

        if (waitlistError) {
          if (waitlistError.code === '23505') { // Unique constraint violation
            throw new Error('This email is already on the waitlist');
          }
          throw waitlistError;
        }

        setSuccess('You\'ve been added to the waitlist! We\'ll notify you when invitation codes become available.');
        setEmail('');
        return;
      }

      // If invite code is provided, validate it
      if (hasInviteCode && !inviteValid) {
        throw new Error('Invalid or expired invitation code');
      }

      // Proceed with account creation if valid invite code
      if (hasInviteCode && inviteValid) {
        if (!email.trim() || !password.trim() || !fullName.trim()) {
          throw new Error('Please fill in all required fields to create your account');
        }

        // Create user account
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim(),
              invite_code: inviteCode.trim()
            }
          }
        });

        if (signUpError) throw signUpError;
        if (!authData.user) throw new Error('Failed to create user account');

        // Update the invite code as used
        const { error: updateError } = await supabase
          .from('curator_invites')
          .update({ 
            status: 'completed',
            used_by: authData.user.id,
            used_at: new Date().toISOString()
          })
          .eq('code', inviteCode.trim());

        if (updateError) {
          console.error('Error updating invite code:', updateError);
          // Don't throw here as the user was already created
        }

        // Redirect to onboarding
        navigate('/onboarding');
        return;
      }

    } catch (error) {
      console.error('Signup error:', error);
      let errorMessage = 'An error occurred. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('User already registered')) {
          errorMessage = 'An account with this email already exists. Please sign in instead.';
        } else if (error.message.includes('Password should be at least')) {
          errorMessage = 'Password must be at least 6 characters long';
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getButtonText = () => {
    if (loading) return 'Processing...';
    
    const hasInviteCode = inviteCode.trim();
    const hasEmail = email.trim();
    
    if (hasInviteCode && inviteValid) {
      return 'Create Account & Start Onboarding';
    } else if (!hasInviteCode && hasEmail) {
      return 'Join Waitlist';
    } else {
      return 'Continue';
    }
  };

  const canSubmit = () => {
    if (loading) return false;
    
    const hasInviteCode = inviteCode.trim();
    const hasEmail = email.trim();
    
    if (!hasInviteCode && !hasEmail) return false;
    
    // For waitlist submission
    if (!hasInviteCode && hasEmail) return true;
    
    // For account creation with invite code
    if (hasInviteCode && inviteValid) {
      return email.trim() && password.trim() && fullName.trim();
    }
    
    return false;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="max-w-md w-full space-y-8">
          {/* Logo/Brand */}
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                <Star className="w-6 h-6 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Become a Curator
            </h1>
            <p className="text-gray-600 text-lg">
              Join our community of tastemakers and share your recommendations
            </p>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center space-x-8 py-6 border-y border-gray-200">
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Users className="w-5 h-5 text-blue-600 mr-1" />
                <span className="text-2xl font-bold text-gray-900">500+</span>
              </div>
              <p className="text-sm text-gray-600">Curators</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Star className="w-5 h-5 text-purple-600 mr-1" />
                <span className="text-2xl font-bold text-gray-900">10K+</span>
              </div>
              <p className="text-sm text-gray-600">Recommendations</p>
            </div>
          </div>

          {/* Form */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <p className="text-green-700 text-sm">{success}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Invitation Code */}
              <div>
                <label htmlFor="inviteCode" className="block text-sm font-medium text-gray-900 mb-2">
                  Invitation Code
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="inviteCode"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                      inviteCode.trim() 
                        ? inviteValid === true 
                          ? 'border-green-300 bg-green-50' 
                          : inviteValid === false 
                          ? 'border-red-300 bg-red-50' 
                          : 'border-gray-300'
                        : 'border-gray-300'
                    }`}
                    placeholder="Enter your invitation code"
                  />
                  {checkingInvite && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                    </div>
                  )}
                  {inviteCode.trim() && !checkingInvite && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {inviteValid === true ? (
                        <Check className="w-5 h-5 text-green-500" />
                      ) : inviteValid === false ? (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      ) : null}
                    </div>
                  )}
                </div>
                {inviteCode.trim() && inviteValid === false && (
                  <p className="mt-2 text-sm text-red-600">
                    Invalid or expired invitation code
                  </p>
                )}
                {inviteCode.trim() && inviteValid === true && (
                  <p className="mt-2 text-sm text-green-600">
                    Valid invitation code! Please complete the form below.
                  </p>
                )}
              </div>

              {/* Conditional Fields */}
              {inviteCode.trim() && inviteValid && (
                <>
                  {/* Full Name */}
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-900 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-900 mb-2">
                      Password *
                    </label>
                    <input
                      type="password"
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Create a secure password"
                      minLength={6}
                      required
                    />
                  </div>
                </>
              )}

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-2">
                  Email Address {inviteCode.trim() && inviteValid ? '*' : ''}
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder={
                    inviteCode.trim() && inviteValid 
                      ? "Enter your email address" 
                      : "Enter your email to join the waitlist"
                  }
                                     required={!!(inviteCode.trim() && inviteValid)}
                />
                {!inviteCode.trim() && (
                  <p className="mt-2 text-sm text-gray-600">
                    No invitation code? Enter your email to join our waitlist and get notified when codes become available.
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!canSubmit()}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-4 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {getButtonText()}
                  </>
                ) : (
                  <>
                    {getButtonText()}
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <button
                  onClick={() => navigate('/discover')}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Sign in here
                </button>
              </p>
            </div>

            {/* Terms */}
            <p className="mt-4 text-xs text-gray-500 text-center">
              By continuing, you agree to our{' '}
              <a href="/terms" target="_blank" className="text-blue-600 hover:underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="/privacy-policy" target="_blank" className="text-blue-600 hover:underline">
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 