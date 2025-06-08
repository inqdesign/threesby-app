import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, X, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { CuratorInvite } from '../types';

export function InvitePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteCode = searchParams.get('code');
  
  const [invite, setInvite] = useState<CuratorInvite | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (inviteCode) {
      checkInvite();
    } else {
      setError('No invite code provided');
      setLoading(false);
    }
  }, [inviteCode]);

  const checkInvite = async () => {
    try {
      const { data, error } = await supabase
        .from('curator_invites')
        .select('*')
        .eq('code', inviteCode)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Invite not found');

      // Check if invite is expired
      if (new Date(data.expires_at) < new Date()) {
        setError('This invitation has expired');
        return;
      }

      // Check if invite is already used
      if (data.status === 'completed') {
        setError('This invitation has already been used');
        return;
      }

      setInvite(data);
      if (data.email) {
        setEmail(data.email);
      }
    } catch (error) {
      console.error('Error checking invite:', error);
      setError('Invalid or expired invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invite) return;

    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    if (!agreeToTerms) {
      alert('Please agree to the terms of service');
      return;
    }

    setSubmitting(true);
    try {
      // Create user account
      const { data: { user }, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: invite.full_name,
            invite_code: invite.code
          }
        }
      });

      if (signUpError) throw signUpError;
      if (!user) throw new Error('Failed to create user');

      // Update invite status
      const { error: updateError } = await supabase
        .from('curator_invites')
        .update({ status: 'completed' })
        .eq('id', invite.id);

      if (updateError) throw updateError;

      // Redirect to onboarding
      navigate('/onboarding');
    } catch (error) {
      console.error('Error creating account:', error);
      alert('Error creating account. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F4F4]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#252525]"></div>
      </div>
    );
  }

  if (error || !invite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F4F4]">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white p-8 rounded-xl shadow-sm text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-6 h-6 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Invitation</h1>
            <p className="text-gray-600 mb-6">
              {error || 'This invitation link is invalid or has expired.'}
            </p>
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[#252525] hover:bg-[#111111]"
            >
              Return Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F4F4] py-12">
      <div className="max-w-md w-full mx-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm p-8"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[#f5ffde] rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-[#252525]" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome, {invite.full_name}!
            </h1>
            <p className="text-gray-600">
              You've been invited to join our curator community. Let's get your account set up.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
                readOnly={!!invite.email}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Create Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
                minLength={8}
              />
              <p className="mt-1 text-sm text-gray-500">
                Must be at least 8 characters
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div className="flex items-start">
              <input
                type="checkbox"
                id="terms"
                checked={agreeToTerms}
                onChange={(e) => setAgreeToTerms(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                required
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-gray-600">
                I agree to the{' '}
                <a href="/terms" className="text-blue-600 hover:text-blue-800">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="/privacy" className="text-blue-600 hover:text-blue-800">
                  Privacy Policy
                </a>
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting || !agreeToTerms || password !== confirmPassword}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#252525] text-white rounded-lg hover:bg-[#111111] transition-colors disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}