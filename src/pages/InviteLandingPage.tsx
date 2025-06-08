import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Star, Users, Globe2, Package, BookOpen, ArrowRight, Check, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AuthModal } from '../components/AuthModal';

export function InviteLandingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteCode = searchParams.get('code');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [inviteValid, setInviteValid] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkInviteCode();
  }, [inviteCode]);

  const checkInviteCode = async () => {
    if (!inviteCode) {
      setInviteValid(false);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('curator_invites')
        .select('id')
        .eq('code', inviteCode)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error) throw error;
      setInviteValid(!!data);
    } catch (error) {
      console.error('Error checking invite code:', error);
      setInviteValid(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (email: string, password: string, fullName: string) => {
    if (!inviteCode || !inviteValid) {
      throw new Error('Invalid invite code');
    }

    const { data: { user }, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          is_creator: true,
          invite_code: inviteCode
        }
      }
    });

    if (signUpError) throw signUpError;

    // Update profile with creator status
    if (user) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          is_creator: true,
          invite_code: inviteCode
        })
        .eq('id', user.id);

      if (updateError) throw updateError;
    }

    setShowAuthModal(false);
    navigate('/my-threes');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying invite code...</p>
        </div>
      </div>
    );
  }

  if (!inviteValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white p-8 rounded-xl shadow-sm text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-6 h-6 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Invite Code</h1>
            <p className="text-gray-600 mb-6">
              The invite code is invalid or has already been used. Please contact the administrator
              for a valid invite code.
            </p>
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Return Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Welcome to Curator's Pick!
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            You've been invited to join our exclusive community of curators. Share your unique
            perspective and help others discover amazing places, products, and books.
          </p>
          <button
            onClick={() => setShowAuthModal(true)}
            className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-full text-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Create Your Account
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-xl shadow-sm">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Star className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Share Your Favorites</h3>
            <p className="text-gray-600">
              Curate and share your top picks in three categories. Help others discover hidden
              gems and trending favorites.
            </p>
          </div>
          
          <div className="bg-white p-8 rounded-xl shadow-sm">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Build Your Following</h3>
            <p className="text-gray-600">
              Connect with an engaged audience who values your recommendations. Grow your
              influence in our community.
            </p>
          </div>
          
          <div className="bg-white p-8 rounded-xl shadow-sm">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <Globe2 className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Get Featured</h3>
            <p className="text-gray-600">
              Your best picks could be featured on our homepage, reaching thousands of users
              looking for authentic recommendations.
            </p>
          </div>
        </div>
      </div>

      {/* Categories Preview */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">What You'll Curate</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe2 className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Places</h3>
              <p className="text-gray-600">
                Your favorite destinations, hidden gems, and must-visit locations.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Products</h3>
              <p className="text-gray-600">
                Products you love and recommend to friends and family.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Books</h3>
              <p className="text-gray-600">
                Books that have inspired you and shaped your perspective.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="bg-blue-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Curating?</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join our community of curators and start sharing your recommendations today.
          </p>
          <button
            onClick={() => setShowAuthModal(true)}
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 rounded-full text-lg font-medium hover:bg-blue-50 transition-colors"
          >
            Create Your Account
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
}