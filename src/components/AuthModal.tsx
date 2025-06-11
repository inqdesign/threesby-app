import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, Eye, EyeOff, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

type AuthModalProps = {
  isOpen: boolean;
  onClose: () => void;
  mode: 'login' | 'signup';
};

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

const passwordRequirements: PasswordRequirement[] = [
  { label: 'At least 8 characters', test: (pwd: string) => pwd.length >= 8 },
  { label: 'Contains uppercase letter', test: (pwd: string) => /[A-Z]/.test(pwd) },
  { label: 'Contains lowercase letter', test: (pwd: string) => /[a-z]/.test(pwd) },
  { label: 'Contains number', test: (pwd: string) => /\d/.test(pwd) },
  { label: 'Contains special character', test: (pwd: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(pwd) }
];

export function AuthModal({ isOpen, onClose, mode }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(mode === 'signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const navigate = useNavigate();
  
  // Create a div for the portal if it doesn't exist
  useEffect(() => {
    if (!document.getElementById('auth-modal-root')) {
      const modalRoot = document.createElement('div');
      modalRoot.id = 'auth-modal-root';
      document.body.appendChild(modalRoot);
    }
    
    return () => {
      if (!isOpen) {
        const modalRoot = document.getElementById('auth-modal-root');
        if (modalRoot && modalRoot.childNodes.length === 0) {
          document.body.removeChild(modalRoot);
        }
      }
    };
  }, [isOpen]);

  // Sync isSignUp with mode whenever the modal opens
  useEffect(() => {
    if (isOpen) {
      setIsSignUp(mode === 'signup');
      // Reset form fields when modal opens
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setFullName('');
      setError('');
      setShowPassword(false);
      setShowConfirmPassword(false);
      setPasswordFocused(false);
    }
  }, [isOpen, mode]);

  if (!isOpen) return null;

  // Email validation
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Password strength calculation
  const getPasswordStrength = () => {
    const passedRequirements = passwordRequirements.filter(req => req.test(password));
    return (passedRequirements.length / passwordRequirements.length) * 100;
  };

  const passwordStrength = getPasswordStrength();
  const strongPassword = passwordStrength >= 80;

  // Validation messages
  const getValidationErrors = () => {
    const errors: string[] = [];
    
    if (isSignUp) {
      if (!fullName.trim()) errors.push('Full name is required');
      if (fullName.trim().length < 2) errors.push('Full name must be at least 2 characters');
    }
    
    if (!email) errors.push('Email is required');
    else if (!isValidEmail(email)) errors.push('Please enter a valid email address');
    
    if (!password) errors.push('Password is required');
    else if (isSignUp && password.length < 8) errors.push('Password must be at least 8 characters');
    
    if (isSignUp && password !== confirmPassword) errors.push('Passwords do not match');
    
    return errors;
  };

  const validationErrors = getValidationErrors();
  const canSubmit = isSignUp 
    ? validationErrors.length === 0 && strongPassword
    : validationErrors.length === 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        if (!canSubmit) {
          throw new Error(validationErrors[0] || 'Please complete all required fields');
        }

        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim()
            }
          }
        });

        if (error) throw error;
        
        // Redirect to onboarding after signup
        onClose();
        navigate('/onboarding');
      } else {
        if (!email || !password) {
          throw new Error('Email and password are required');
        }

        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password
        });

        if (error) throw error;
        
        // Redirect to Discover page after login
        onClose();
        navigate('/discover');
      }
    } catch (error) {
      console.error('Auth error:', error);
      let errorMessage = 'Authentication failed';
      
      if (error instanceof Error) {
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Invalid email or password';
        } else if (error.message.includes('Email rate limit exceeded')) {
          errorMessage = 'Too many attempts. Please try again later';
        } else if (error.message.includes('User already registered')) {
          errorMessage = 'An account with this email already exists';
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        }
      });
      
      if (error) {
        console.error('Google OAuth error:', error);
        throw error;
      }
      
      // Close modal since user will be redirected
      onClose();
    } catch (error) {
      console.error('Google auth error:', error);
      let errorMessage = 'Google authentication failed. Please try again or use email signup.';
      
      if (error instanceof Error) {
        if (error.message.includes('popup_closed_by_user')) {
          errorMessage = 'Google sign-in was cancelled. Please try again.';
        } else if (error.message.includes('OAuth') || error.message.includes('disabled_client')) {
          errorMessage = 'Google sign-in configuration error. Please contact support.';
        }
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: 99999 }}>
              <div className="bg-card rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-2xl font-bold text-foreground">
            {isSignUp ? 'Join Our Community' : 'Welcome Back'}
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Subtitle */}
          <p className="text-muted-foreground mb-6">
            {isSignUp 
              ? 'Create your account and start curating amazing picks' 
              : 'Sign in to access your curator dashboard'
            }
          </p>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="text-red-700 text-sm">{error}</div>
            </div>
          )}

          {/* Google Sign In */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-card border-2 border-border text-foreground py-3 px-4 rounded-lg hover:bg-secondary hover:border-border/80 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mb-6"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
                         <span className="font-medium">
               {loading ? 'Connecting...' : `Continue with Google`}
             </span>
          </button>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-card text-muted-foreground font-medium">Or continue with email</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name - Signup Only */}
            {isSignUp && (
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-foreground mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 bg-card text-foreground"
                  placeholder="Enter your full name"
                  autoComplete="name"
                />
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 bg-card text-foreground"
                placeholder="Enter your email"
                autoComplete="email"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  className="w-full px-4 py-3 pr-12 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 bg-card text-foreground"
                  placeholder={isSignUp ? 'Create a strong password' : 'Enter your password'}
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              
              {/* Password Strength Indicator - Signup Only */}
              {isSignUp && (passwordFocused || password) && (
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Password strength</span>
                    <span className={`text-sm font-medium ${
                      passwordStrength < 40 ? 'text-red-500' :
                      passwordStrength < 80 ? 'text-yellow-500' : 'text-green-500'
                    }`}>
                      {passwordStrength < 40 ? 'Weak' :
                       passwordStrength < 80 ? 'Good' : 'Strong'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        passwordStrength < 40 ? 'bg-red-500' :
                        passwordStrength < 80 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${passwordStrength}%` }}
                    />
                  </div>
                  <div className="space-y-1">
                    {passwordRequirements.map((req, index) => {
                      const passed = req.test(password);
                      return (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          {passed ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-gray-300" />
                          )}
                          <span className={passed ? 'text-green-700' : 'text-gray-500'}>
                            {req.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password - Signup Only */}
            {isSignUp && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-2">
                  Confirm Password *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 bg-card text-foreground ${
                      confirmPassword && password !== confirmPassword 
                        ? 'border-red-300 bg-red-50' 
                        : 'border-border'
                    }`}
                    placeholder="Confirm your password"
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <XCircle className="w-4 h-4" />
                    Passwords do not match
                  </p>
                )}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !canSubmit}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {isSignUp ? 'Creating Account...' : 'Signing In...'}
                </>
              ) : (
                isSignUp ? 'Create Account' : 'Sign In'
              )}
            </button>
          </form>

          {/* Toggle Mode */}
          <div className="mt-6 text-center text-sm text-gray-600">
            {isSignUp ? (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setIsSignUp(false)}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Sign in
                </button>
              </>
            ) : (
              <>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => setIsSignUp(true)}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Create one
                </button>
              </>
            )}
          </div>

          {/* Terms and Privacy - Signup Only */}
          {isSignUp && (
            <p className="mt-4 text-xs text-gray-500 text-center">
              By creating an account, you agree to our{' '}
              <a href="/terms" target="_blank" className="text-blue-600 hover:underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="/privacy-policy" target="_blank" className="text-blue-600 hover:underline">
                Privacy Policy
              </a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
  
  if (!isOpen) return null;
  
  return createPortal(
    modalContent,
    document.getElementById('auth-modal-root') || document.body
  );
}