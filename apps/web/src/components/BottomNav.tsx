import { useLocation, Link } from 'react-router-dom';
import { Home, User, Heart, BookOpen, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types';

type BottomNavProps = {
  setShowLoginModal: (show: boolean) => void;
};

export function BottomNav({ setShowLoginModal }: BottomNavProps) {
  const location = useLocation();
  const { user } = useAuth();
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

  const isActive = (path: string) => {
    if (path === '/my-threes') {
      return location.pathname.startsWith('/my-threes');
    }
    return location.pathname === path;
  };

  if (!user) {
    return (
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
        <div className="flex justify-around items-center h-16">
          <Link
            to="/discover"
            className={`flex flex-col items-center justify-center flex-1 h-full ${
              isActive('/discover') ? 'text-foreground' : 'text-muted-foreground'
            }`}
          >
            <Home className="w-6 h-6" />
          </Link>
          
          <Link
            to="/curators"
            className={`flex flex-col items-center justify-center flex-1 h-full ${
              isActive('/curators') ? 'text-foreground' : 'text-muted-foreground'
            }`}
          >
            <Users className="w-6 h-6" />
          </Link>
          
          <Link
            to="/collections"
            className={`flex flex-col items-center justify-center flex-1 h-full ${
              isActive('/collections') ? 'text-foreground' : 'text-muted-foreground'
            }`}
          >
            <BookOpen className="w-6 h-6" />
          </Link>

          <button
            onClick={() => setShowLoginModal(true)}
            className="flex flex-col items-center justify-center flex-1 h-full text-muted-foreground"
          >
            <User className="w-6 h-6" />
          </button>
        </div>
      </nav>
    );
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
      <div className="flex justify-around items-center h-16">
        <Link
          to="/discover"
          className={`flex flex-col items-center justify-center flex-1 h-full ${
            isActive('/discover') ? 'text-foreground' : 'text-muted-foreground'
          }`}
        >
          <Home className="w-6 h-6" />
        </Link>
        
        <Link
          to="/curators"
          className={`flex flex-col items-center justify-center flex-1 h-full ${
            isActive('/curators') ? 'text-foreground' : 'text-muted-foreground'
          }`}
        >
          <Users className="w-6 h-6" />
        </Link>
        
        <Link
          to="/collections"
          className={`flex flex-col items-center justify-center flex-1 h-full ${
            isActive('/collections') ? 'text-foreground' : 'text-muted-foreground'
          }`}
        >
          <BookOpen className="w-6 h-6" />
        </Link>

        <Link
          to="/favorites"
          className={`flex flex-col items-center justify-center flex-1 h-full ${
            isActive('/favorites') ? 'text-foreground' : 'text-muted-foreground'
          }`}
        >
          <Heart className="w-6 h-6" />
        </Link>

        <Link
          to="/my-threes"
          className={`flex flex-col items-center justify-center flex-1 h-full ${
            isActive('/my-threes') ? 'text-foreground' : 'text-muted-foreground'
          }`}
        >
          <div className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center" data-component-name="LinkWithRef">
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
              <div className="w-full h-full bg-[#f8d9c4] flex items-center justify-center text-[#252525]">
                <span className="text-xs font-medium">
                  {user?.email?.[0]?.toUpperCase() || 'P'}
                </span>
              </div>
            )}
          </div>
        </Link>
      </div>
    </nav>
  );
}