import React from 'react';
import { Routes, Route, useLocation, Navigate, useNavigate } from 'react-router-dom';
import './styles/mobile-fixes.css'; // Import mobile-specific CSS optimizations
// We no longer need these icons since we removed the dropdown menu
import { AuthModal } from './components/AuthModal';
import { useAuth } from './hooks/useAuth';
// import { useScrollDirection } from './hooks/useScrollDirection';
import { supabase } from './lib/supabase';
import { useAppStore } from './store/index';
import { useSettingsModalStore } from './store/settingsModalStore';
import { SubNav } from './components/SubNav';
import { ProfileEditModal } from './components/ProfileEditModal';
import { SettingsModal } from './components/SettingsModal';
import { DiscoverPage } from './pages/DiscoverPage';
import { ProfilePage } from './pages/ProfilePage';
import { AccountPage } from './pages/AccountPage';
import { AccountSetupPage } from './pages/AccountSetupPage';
import { SecurityPage } from './pages/SecurityPage';
import { EmailSettingsPage } from './pages/EmailSettingsPage';
import { TermsPage } from './pages/TermsPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { AdminPage } from './pages/AdminPage';
import { InvitesPage } from './pages/admin/InvitesPage';
import { SubmissionsPage } from './pages/admin/SubmissionsPage';
import { ContentPage } from './pages/admin/ContentPage';
import { UsersPage } from './pages/admin/UsersPage';
import { SettingsPage } from './pages/admin/SettingsPage';
import { FeaturedPicksPage } from './pages/FeaturedPicksPage';
import { CreatorLandingPage } from './pages/CreatorLandingPage';
import { InviteLandingPage } from './pages/InviteLandingPage';
import { MyThreesPage } from './pages/MyThreesPage';
import { CuratorsPage } from './pages/CuratorsPage';
import CollectionDetailPage from './pages/CollectionDetailPage';
import { CollectionsPage } from './pages/CollectionsPage';
import { SearchResultsPage } from './pages/SearchResultsPage';
import { OnboardingPage } from './pages/OnboardingPage.tsx';
import { AuthCallbackPage } from './pages/AuthCallbackPage';
import { BottomNav } from './components/BottomNav';
import { MainNav } from './components/MainNav';
import { ScrollToTop } from './components/ScrollToTop';
// import LexicalEditorTest from './components/LexicalEditorTest'; // Component not found
import { PickModalWrapper } from './components/PickModalWrapper';
import { ThemeProvider } from './components/ThemeProvider';
import { UserSettingsPage } from './pages/SettingsPage';

import type { Pick } from './types';

function ProtectedRoute({ children, isAllowed }: { children: React.ReactNode; isAllowed: boolean }) {
  if (!isAllowed) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

type Category = 'places' | 'products' | 'books';

// Error Boundary Component
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h1>
            <p className="text-gray-600 mb-4">Please try refreshing the page.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Refresh
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const [showLoginModal, setShowLoginModal] = React.useState(false);
  const [showSignupModal, setShowSignupModal] = React.useState(false);
  const [showProfileEditModal, setShowProfileEditModal] = React.useState(false);
  // Commented out unused variable
  // const isHeaderVisible = useScrollDirection();
  const location = useLocation();
  const navigate = useNavigate();
  const isCreatorLanding = location.pathname === '/creator';
  // const isDiscoverPage = location.pathname === '/discover'; // Not used currently

  const {
    userProfile,
    userPicks,
    fetchUserData,
    fetchFeedPicks,
    fetchFeaturedPicks,
    fetchFeaturedCurators,
    fetchCurators
  } = useAppStore();

  // Load user data when user authenticates
  React.useEffect(() => {
    if (user && !authLoading) {
      console.log('App.tsx: Loading user data for authenticated user:', user.email);
      fetchUserData(user.id).catch((error) => {
        console.error('App.tsx: Error loading user data:', error);
      });
    }
  }, [user, authLoading, fetchUserData]);

  // Check if user needs onboarding after profile is loaded
  React.useEffect(() => {
    if (user && !authLoading && userProfile) {
      // Don't redirect if user is already on onboarding page or specific allowed pages
      const allowedPaths = ['/onboarding', '/terms', '/privacy-policy'];
      const isOnAllowedPath = allowedPaths.some(path => location.pathname.startsWith(path));
      
      // Check if this is a genuinely new user who needs onboarding
      const isExistingUser = (userProfile as any).is_creator || 
                           (userProfile as any).is_admin || 
                           (userProfile.full_name && userProfile.title) ||
                           (userProfile as any).onboarding_completed === true;
      
      // Only redirect to onboarding if this is genuinely a new user
      if (!isExistingUser && !isOnAllowedPath) {
        console.log('New user needs onboarding, redirecting...', { 
          userProfile, 
          onboarding_completed: (userProfile as any)?.onboarding_completed,
          is_creator: (userProfile as any)?.is_creator,
          is_admin: (userProfile as any)?.is_admin,
          has_profile: userProfile.full_name && userProfile.title
        });
        navigate('/onboarding');
      }
      
      // If user has completed onboarding and is on an ID-based profile URL, redirect to username URL
      if (userProfile && (userProfile as any).onboarding_completed && userProfile.username && location.pathname === `/profile/${user.id}`) {
        navigate(`/@${userProfile.username}`, { replace: true });
      }
    }
  }, [user, userProfile, authLoading, location.pathname, navigate]);

  // Load global data on app initialization
  React.useEffect(() => {
    console.log('App.tsx: Loading global app data');
    
    const loadGlobalData = async () => {
      try {
        await Promise.all([
          fetchFeedPicks(),
          fetchFeaturedPicks(),
          fetchCurators(),
          fetchFeaturedCurators()
        ]);
      } catch (error) {
        console.error('App.tsx: Error loading global data:', error);
      }
    };

    loadGlobalData();
  }, [fetchFeedPicks, fetchFeaturedPicks, fetchCurators, fetchFeaturedCurators]);

  const { signOut } = useAuth();
  
  const handleSignOut = async () => {
    try {
      console.log('Signing out user');
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
      alert('Error signing out!');
    }
  };

  // Separate effect for auth modal event listeners
  React.useEffect(() => {
    // Event listeners for auth modals from MainNav component
    const handleShowLoginModal = () => setShowLoginModal(true);
    const handleShowSignupModal = () => setShowSignupModal(true);
    
    window.addEventListener('show-login-modal', handleShowLoginModal);
    window.addEventListener('show-signup-modal', handleShowSignupModal);
    
    return () => {
      window.removeEventListener('show-login-modal', handleShowLoginModal);
      window.removeEventListener('show-signup-modal', handleShowSignupModal);
    };
  }, []);

  // We removed the click outside handler since we no longer have a dropdown menu

  const handleSavePick = React.useCallback(
    async (data: Partial<Pick>, selectedCategory: Category | null, selectedPick: Pick | null) => {
      try {
        if (!user) return;

        console.log('Saving pick:', data, 'category:', selectedCategory, 'selectedPick:', selectedPick);

        // If we're updating an existing pick
        if (selectedPick) {
          const { error } = await supabase
            .from('picks')
            .update({
              ...data,
              updated_at: new Date().toISOString(),
              last_updated_at: new Date().toISOString(),
            })
            .eq('id', selectedPick.id);

          if (error) throw error;
          console.log('Updated pick:', selectedPick.id);
        } else {
          // We're creating a new pick
          if (!selectedCategory) {
            console.error('No category selected for new pick');
            return;
          }

          const { error } = await supabase.from('picks').insert([
            {
              ...data,
              category: selectedCategory,
              profile_id: user.id,
              status: 'published', // Automatically publish new picks
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              last_updated_at: new Date().toISOString(),
            },
          ]);

          if (error) throw error;
          console.log('Created new pick in category:', selectedCategory);
        }

        // Reload user data to update UI
        await fetchUserData(user.id);
      } catch (error) {
        console.error('Error saving pick:', error);
        alert('Error saving pick. Please try again.');
      }
    },
    [user, fetchUserData]
  );

  const handleDeletePick = React.useCallback(
    async (pick: Pick) => {
      try {
        if (!user) return;

        console.log('Deleting pick:', pick);

        const { error } = await supabase.from('picks').delete().eq('id', pick.id);

        if (error) throw error;

        console.log('Deleted pick:', pick.id);

        // Reload user data to update UI
        await fetchUserData(user.id);
      } catch (error) {
        console.error('Error deleting pick:', error);
        alert('Error deleting pick. Please try again.');
      }
    },
    [user, fetchUserData]
  );

  // Handle profile submission for review
  const handleProfileSubmit = React.useCallback(
async () => {
try {
  if (!user) return;
  
  // Check if user profile exists
  if (!userProfile) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (error) {
      throw error;
    }
    
    if (!data) {
      console.log('Creating new profile for user:', user.id);
      const { error: insertError } = await supabase
        .from('profiles')
        .insert([
          { 
            id: user.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            published: false,
          }
        ]);
      
      if (insertError) throw insertError;
    }
  }
  
  // Update all picks to pending_review
  const { error: picksError } = await supabase
    .from('picks')
    .update({
      status: 'pending_review',
      updated_at: new Date().toISOString(),
    })
    .eq('profile_id', user.id);

  if (picksError) throw picksError;

  // Update profile status to pending
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      status: 'pending',
      updated_at: new Date().toISOString(),
      last_submitted_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (profileError) throw profileError;

  // Refresh data
  if (user) await fetchUserData(user.id);
  // fetchUserData already handles picks
  
  // Refresh global app store data
  fetchFeedPicks();
  fetchCurators();
} catch (error) {
  console.error('Error submitting picks:', error);
  alert('Error submitting picks. Please try again.');
}
},
[user, userProfile, fetchUserData]
);

const handleUnpublish = React.useCallback(
async () => {
try {
  if (!user) return;

  if (!confirm('Are you sure you want to unpublish your profile and picks?')) return;

  const { error: picksError } = await supabase
    .from('picks')
    .update({
      status: 'draft',
      updated_at: new Date().toISOString(),
    })
    .eq('profile_id', user.id);

  if (picksError) throw picksError;

  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      status: 'unpublished',
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (profileError) throw profileError;

  // Refresh data
  if (user) await fetchUserData(user.id);
  // fetchUserData already handles picks
  
  // Refresh global app store data
  fetchFeedPicks();
  fetchCurators();
} catch (error) {
  console.error('Error unpublishing picks:', error);
  alert('Error unpublishing picks. Please try again.');
}
},
[user, fetchUserData]
);

const handleCancelSubmission = React.useCallback(
async () => {
if (!user) return;
  
try {
  await supabase
    .from('profiles')
    .update({
      status: 'draft',
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  await supabase
    .from('submission_reviews')
    .update({
      status: 'canceled',
      updated_at: new Date().toISOString(),
    })
    .eq('profile_id', user.id)
    .eq('status', 'pending');

  // Refresh data
  if (user) await fetchUserData(user.id);
  // fetchUserData already handles picks
  
  // Refresh global app store data
  fetchFeedPicks();
  fetchCurators();
} catch (error) {
  console.error('Error canceling submission:', error);
  alert('Error canceling submission. Please try again.');
}
},
[user, fetchUserData]
);

// Function to check if a path is active
// This function is now handled in the MainNav component
// const isActive = (path: string) => {
//   if (path === '/my-threes') {
//     return location.pathname.startsWith('/my-threes');
//   }
//   return location.pathname === path;
// };

// Create SubNav content based on the current path
const subNavContent = React.useMemo(() => {
// Only show SubNav on MyThrees page
if (!location.pathname.startsWith('/my-threes')) return null;
  
// Return the SubNav component with appropriate props
return (
  <SubNav 
    user={user}
    userProfile={userProfile}
    picks={userPicks || []}
    isAdmin={isAdmin}
    isAuthLoading={authLoading}
    loading={authLoading}
    onLogin={() => setShowLoginModal(true)}
    onSubmit={handleProfileSubmit}
    onCancelSubmission={handleCancelSubmission}
    onEditProfile={() => navigate('/account')}
  />
);
}, [user, userProfile, userPicks, isAdmin, authLoading, handleProfileSubmit, handleUnpublish, handleCancelSubmission, location.pathname, navigate]);

// isActive function moved above

return (
  <ErrorBoundary>
    <ThemeProvider>
      <PickModalWrapper>
      <div className="min-h-screen bg-background text-foreground">
      <ScrollToTop />
      <header
        className={`relative md:fixed w-full top-0 z-50 transition-colors duration-300 ${
          isCreatorLanding ? 'bg-[var(--nav-bg,transparent)]' : 'bg-background border-b border-border'
        }`}
      >
        {/* Use our updated MainNav component with all the required menu items */}
        <MainNav 
          onLogin={() => setShowLoginModal(true)}
          onSignup={() => setShowSignupModal(true)}
          onLogout={handleSignOut}
        />
      </header>
      <div className={`w-full ${!isCreatorLanding && 'md:pt-[68px]'} ${subNavContent ? 'pt-0 px-0 md:px-8 md:pt-4' : 'pt-0'}`} data-component-name="App">
        {subNavContent}
      </div>
      <div className="w-full">
        <Routes>
          <Route path="/" element={<Navigate to="/discover" replace />} />
          <Route path="/discover" element={<DiscoverPage />} />
          <Route path="/curators" element={<CuratorsPage />} />
          <Route path="/collections" element={<CollectionsPage />} />
          <Route path="/collections/:id" element={<CollectionDetailPage />} />
          <Route path="/search" element={<SearchResultsPage />} />
          <Route path="/creator" element={<CreatorLandingPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />\n          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/invite" element={<InviteLandingPage />} />
          <Route path="/profile/:id" element={<ProfilePage />} />
          <Route path="/@:username" element={<ProfilePage />} />
          <Route path="/account/*" element={<ProtectedRoute isAllowed={!!user}><AccountPage /></ProtectedRoute>} />
          <Route path="/account-setup" element={<ProtectedRoute isAllowed={!!user}><AccountSetupPage /></ProtectedRoute>} />
          <Route path="/security" element={<ProtectedRoute isAllowed={!!user}><SecurityPage /></ProtectedRoute>} />
          <Route path="/email-settings" element={<ProtectedRoute isAllowed={!!user}><EmailSettingsPage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute isAllowed={!!user}><UserSettingsPage /></ProtectedRoute>} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route
            path="/my-threes"
            element={
              <ProtectedRoute isAllowed={!!user}>
                <MyThreesPage 
                  profile={userProfile || undefined}
                  picks={userPicks || undefined}
                  loading={authLoading}
                  onSavePick={handleSavePick}
                  onDeletePick={handleDeletePick}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-threes/all"
            element={
              <ProtectedRoute isAllowed={!!user}>
                <MyThreesPage 
                  profile={userProfile || undefined}
                  picks={userPicks || []}
                  loading={authLoading}
                  onSavePick={handleSavePick}
                  onDeletePick={handleDeletePick}
                />
              </ProtectedRoute>
            }
          />
          <Route path="/picks/new" element={<ProtectedRoute isAllowed={!!user}>
              <MyThreesPage 
                profile={userProfile || undefined}
                picks={userPicks || []}
                loading={authLoading}
                onSavePick={handleSavePick}
                onDeletePick={handleDeletePick}
              />
            </ProtectedRoute>} />
          <Route path="/picks/:id/edit" element={<ProtectedRoute isAllowed={!!user}>
              <MyThreesPage 
                profile={userProfile || undefined}
                picks={userPicks || []}
                loading={authLoading}
                onSavePick={handleSavePick}
                onDeletePick={handleDeletePick}
              />
            </ProtectedRoute>} />
          <Route path="/picks/:id" element={null} />
          <Route path="/favorites" element={<ProtectedRoute isAllowed={!!user}><FavoritesPage /></ProtectedRoute>} />
          <Route path="/featured" element={<FeaturedPicksPage />} />
          <Route path="/admin" element={<ProtectedRoute isAllowed={!!user && isAdmin}><AdminPage /></ProtectedRoute>} />
          <Route path="/admin/invites" element={<ProtectedRoute isAllowed={!!user && isAdmin}><InvitesPage /></ProtectedRoute>} />
          <Route path="/admin/submissions" element={<ProtectedRoute isAllowed={!!user && isAdmin}><SubmissionsPage /></ProtectedRoute>} />
          <Route path="/admin/content" element={<ProtectedRoute isAllowed={!!user && isAdmin}><ContentPage /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute isAllowed={!!user && isAdmin}><UsersPage /></ProtectedRoute>} />
          <Route path="/admin/settings" element={<ProtectedRoute isAllowed={!!user && isAdmin}><SettingsPage /></ProtectedRoute>} />
          {/* Removed LexicalEditorTest route as component is not available */}
          <Route path="*" element={<Navigate to="/discover" replace />} />
        </Routes>
      </div>
      <BottomNav 
        setShowLoginModal={setShowLoginModal}
      />
    </div>
    </PickModalWrapper>
    {/* Auth modals */}
      <AuthModal
      isOpen={showLoginModal}
      onClose={() => setShowLoginModal(false)}
      mode="login"
      // Remove onModeChange prop if it doesn't exist on AuthModalProps
      // Instead use separate buttons inside the modal component
    />
      <AuthModal
        isOpen={showSignupModal}
        onClose={() => setShowSignupModal(false)}
        mode="signup"
        // Remove onModeChange prop if it doesn't exist on AuthModalProps
        // Instead use separate buttons inside the modal component
      />
      
      {/* Profile edit modal */}
      {userProfile && (
        <ProfileEditModal
          isOpen={showProfileEditModal}
          onClose={() => setShowProfileEditModal(false)}
          onSubmit={async (data) => {
            try {
              console.log('Saving profile data:', data);
              
              // Update profile in database
              const { error } = await supabase
                .from('profiles')
                .update({
                  full_name: data.full_name,
                  title: data.title,
                  username: data.username,
                  avatar_url: data.avatar_url,
                  shelf_image_url: data.shelf_image_url,
                  bio: data.bio,
                  location: data.location,
                  tags: data.tags,
                  social_links: data.social_links,
                  updated_at: new Date().toISOString()
                })
                .eq('id', user?.id);

              if (error) {
                // Handle column missing errors gracefully
                const isColumnError = error.message?.includes('column');
                if (isColumnError) {
                  console.log('Some database columns might not exist, continuing anyway:', error.message);
                  // Still update local state
                  if (user) {
                    await fetchUserData(user.id);
                  }
                } else {
                  throw error;
                }
              } else {
                console.log('Profile updated successfully');
                // Refresh user data
                if (user) {
                  await fetchUserData(user.id);
                }
              }
            } catch (error) {
              console.error('Error updating profile:', error);
              alert('Error updating profile. Please try again.');
              throw error; // Re-throw to prevent modal from closing
            }
          }}
          initialData={{
            full_name: userProfile.full_name || '',
            title: userProfile.title || '',
            username: (userProfile as any).username || '',
            avatar_url: userProfile.avatar_url || '',
            shelf_image_url: (userProfile as any).shelf_image_url || '',
            bio: (userProfile as any).bio || '',
            location: (userProfile as any).location || '',
            tags: (userProfile as any).tags || [],
            social_links: userProfile.social_links || {}
          }}
        />
        )}
        
        {/* Settings modal */}
        <SettingsModal 
          isOpen={useSettingsModalStore(state => state.isOpen)}
          onClose={useSettingsModalStore(state => state.closeModal)}
        />
      </ThemeProvider>
    </ErrorBoundary>
  );

}

export default App;
