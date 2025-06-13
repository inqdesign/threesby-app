import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSettingsModalStore } from '../store/settingsModalStore';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types';
import { Search, Heart, Bell, MoreVertical, Settings, HelpCircle, LogOut, LogIn } from 'lucide-react';

interface MainNavProps {
  onLogin: () => void;
  onSignup: () => void;
  onLogout: () => void;
}

export function MainNav({ onLogin, onSignup, onLogout }: MainNavProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  
  // Fetch user profile data when user is available
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.id) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (error) throw error;
        
        if (data) {
          setUserProfile(data as Profile);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };
    
    fetchUserProfile();
  }, [user?.id]);
  
  // Check if we're on a profile page to hide the navigation on mobile
  const isProfilePage = location.pathname.startsWith('/profile/');
  const isMyThreesPage = location.pathname.startsWith('/my-threes');
  
  // Check if we're on account settings page to hide search and more button
  const isAccountSettings = location.pathname.includes('/account') || location.pathname.includes('/settings');

  const isActive = (path: string) => {
    if (path === '/my-threes') {
      return location.pathname.startsWith('/my-threes');
    }
    return location.pathname === path;
  };

  return (
    <nav className={`flex items-center min-h-[48px] w-full px-4 md:px-8 relative py-4 ${isProfilePage || isMyThreesPage ? 'md:flex hidden' : ''} ${isAccountSettings ? 'hidden md:flex' : ''}`}>
      <div className="flex items-center justify-between w-full">
        {/* Left section - Logo and main menu (hidden on mobile) */}
        <div className="hidden md:flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-[#252525] dark:text-white">Threesby</span>
          </Link>
          
          {/* Main menu items next to logo */}
          <div className="flex items-center gap-2 ml-4">
            <Link
              to="/discover"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/discover') ? 'bg-neutral-200 dark:bg-muted text-[#252525] dark:text-white' : 'text-[#585757] dark:text-muted-foreground hover:text-foreground'
              }`}
            >
              Discover
            </Link>
            <Link
              to="/curators"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/curators') ? 'bg-neutral-200 dark:bg-muted text-[#252525] dark:text-white' : 'text-[#585757] dark:text-muted-foreground hover:text-foreground'
              }`}
            >
              Curators
            </Link>
            <Link
              to="/collections"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/collections') ? 'bg-neutral-200 dark:bg-muted text-[#252525] dark:text-white' : 'text-[#585757] dark:text-muted-foreground hover:text-foreground'
              }`}
            >
              Collections
            </Link>
          </div>
        </div>
        
        {/* Mobile logo hidden */}

        {/* Desktop Search - hidden on account settings */}
        {!isAccountSettings && (
          <div className="hidden md:block absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-muted-foreground" />
              </div>
              <form onSubmit={(e) => {
                e.preventDefault();
                if (searchTerm.trim()) {
                  navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
                }
              }}>
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-10 pr-4 py-2 w-[300px] bg-input rounded-full text-sm text-foreground focus:outline-none focus:ring-0"
                  style={{ fontSize: '16px' }} /* Prevents zoom on iOS */
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </form>
            </div>
          </div>
        )}
        
        {/* Mobile search field - centered and full width - hidden on account settings */}
        {!isAccountSettings && (
          <div className="md:hidden w-full flex items-center gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-muted-foreground" />
              </div>
              <form onSubmit={(e) => {
                e.preventDefault();
                if (searchTerm.trim()) {
                  navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
                }
              }}>
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-10 pr-4 py-2 w-full bg-input rounded-full text-sm text-foreground focus:outline-none focus:ring-0"
                  style={{ fontSize: '16px' }} /* Prevents zoom on iOS */
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </form>
            </div>
            
            {/* Mobile Settings Menu */}
            {user && (
              <div className="relative">
                <button 
                  onClick={() => setShowAccountMenu(!showAccountMenu)}
                  className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-muted transition-colors"
                  aria-label="Account menu"
                >
                  <MoreVertical className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
                </button>
              
                {/* Mobile Dropdown Menu */}
                {showAccountMenu && (
                  <>
                    {/* Backdrop to close menu when clicking outside */}
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowAccountMenu(false)}
                    ></div>
                    <div className="absolute right-0 mt-2 w-56 bg-card rounded-xl shadow-xl py-2 z-50 border border-border overflow-hidden">
                      <button
                        className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted hover:text-foreground flex items-center gap-2 transition-colors"
                        onClick={() => {
                          setShowAccountMenu(false);
                          // On mobile, navigate to settings page; on desktop, open modal
                          if (window.innerWidth < 768) {
                            navigate('/settings');
                          } else {
                            useSettingsModalStore.getState().openModal();
                          }
                        }}
                      >
                        <Settings className="w-4 h-4" />
                        Settings
                      </button>
                      <button
                        className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted hover:text-foreground flex items-center gap-2 transition-colors"
                        onClick={() => {
                          setShowAccountMenu(false);
                          navigate('/help');
                        }}
                      >
                        <HelpCircle className="w-4 h-4" />
                        Help Center
                      </button>
                      <div className="border-t border-border my-1"></div>
                      <button
                        className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted hover:text-foreground flex items-center gap-2 transition-colors"
                        onClick={() => {
                          setShowAccountMenu(false);
                          // Handle logout
                          if (onLogout) onLogout();
                        }}
                      >
                        <LogOut className="w-4 h-4" />
                        Log Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Right section - User actions (hidden on mobile) */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              {/* Favorites button */}
              <Link
                to="/favorites"
                className={`p-2 rounded-full hover:bg-muted transition-colors ${
                  isActive('/favorites') ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
                aria-label="Favorites"
              >
                <Heart className="h-5 w-5" />
              </Link>
              
              {/* Notifications button */}
              <Link
                to="/notifications"
                className={`p-2 rounded-full hover:bg-muted transition-colors ${
                  isActive('/notifications') ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
              </Link>
              
              {/* Profile button */}
              <Link
                to="/my-threes"
                className="flex items-center justify-center w-9 h-9 rounded-full overflow-hidden hover:ring-2 hover:ring-border"
                aria-label="Profile"
              >
                {userProfile?.avatar_url ? (
                  <img 
                    src={userProfile.avatar_url} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : user?.user_metadata?.avatar_url ? (
                  <img 
                    src={user.user_metadata.avatar_url} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-[#f8d9c4] flex items-center justify-center text-[#252525]" data-component-name="MainNav">
                    <span className="text-xs font-medium">
                      {user?.email?.[0]?.toUpperCase() || 'P'}
                    </span>
                  </div>
                )}
              </Link>
              
              {/* Three dots menu */}
              <div className="relative">
                <button 
                  onClick={() => setShowAccountMenu(!showAccountMenu)}
                  className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-muted transition-colors"
                  aria-label="Account menu"
                >
                  <MoreVertical className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
                </button>
                
                {/* Dropdown Menu */}
                {showAccountMenu && (
                  <>
                    {/* Backdrop to close menu when clicking outside */}
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowAccountMenu(false)}
                    ></div>
                    <div className="absolute right-0 mt-2 w-56 bg-card rounded-xl shadow-xl py-2 z-50 border border-border overflow-hidden">
                      <button
                        className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted hover:text-foreground flex items-center gap-2 transition-colors"
                        onClick={() => {
                          setShowAccountMenu(false);
                          // On mobile, navigate to settings page; on desktop, open modal
                          if (window.innerWidth < 768) {
                            navigate('/settings');
                          } else {
                            useSettingsModalStore.getState().openModal();
                          }
                        }}
                      >
                        <Settings className="w-4 h-4" />
                        Settings
                      </button>
                      <button
                        className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted hover:text-foreground flex items-center gap-2 transition-colors"
                        onClick={() => {
                          setShowAccountMenu(false);
                          navigate('/help');
                        }}
                      >
                        <HelpCircle className="w-4 h-4" />
                        Help Center
                      </button>
                      <div className="border-t border-border my-1"></div>
                      {user ? (
                        <button
                          className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted hover:text-foreground flex items-center gap-2 transition-colors"
                          onClick={() => {
                            setShowAccountMenu(false);
                            // Handle logout
                            if (onLogout) onLogout();
                          }}
                        >
                          <LogOut className="w-4 h-4" />
                          Log Out
                        </button>
                      ) : (
                        <>
                          <button
                            className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted hover:text-foreground flex items-center gap-2 transition-colors"
                            onClick={() => {
                              setShowAccountMenu(false);
                              if (onLogin) onLogin();
                            }}
                          >
                            <LogIn className="w-4 h-4" />
                            Log In
                          </button>
                          <button
                            className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted hover:text-foreground flex items-center gap-2 transition-colors"
                            onClick={() => {
                              setShowAccountMenu(false);
                              if (onSignup) onSignup();
                            }}
                          >
                            <LogIn className="w-4 h-4" />
                            Sign Up
                          </button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('show-login-modal'))}
                className="whitespace-nowrap px-4 py-2 text-[#585757] hover:text-[#252525]"
              >
                Log in
              </button>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('show-signup-modal'))}
                className="whitespace-nowrap px-4 py-2 rounded-full border border-[#252525] text-[#252525] hover:bg-[#252525] hover:text-white transition-colors"
              >
                Join now
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}