
import { useParams } from 'react-router-dom';
import { useAuth } from "../context/AuthContext";
import { MasterLayout } from "../components/MasterLayout";
import { ProfileView } from '../components/shared/ProfileView.web';
import { useProfileData } from '../hooks/useProfileData';
import { Skeleton } from '../components/ui/skeleton';

export function ProfilePage() {
  const { user } = useAuth();
  const { id, username } = useParams<{ id?: string; username?: string }>();
  
  // Determine if we're looking up by username or ID
  const profileIdentifier = username || id;
  const isUsernameRoute = !!username;
  
  const { profile, picks, loading, error } = useProfileData(
    profileIdentifier, 
    user?.id, 
    user?.app_metadata?.role,
    isUsernameRoute
  );
  
  if (loading || !profile) {
    return (
              <div className="min-h-screen bg-background flex justify-center items-center">
        <Skeleton className="h-32 w-32" />
      </div>
    );
  }

  if (error) {
    return (
              <div className="min-h-screen bg-background px-8 py-8">
        <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Error</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <MasterLayout
      profile={profile}
      isOwnProfile={user?.id === profile.id}
      loading={loading}
      picks={picks}
    >
      <ProfileView />
    </MasterLayout>
  );
}
