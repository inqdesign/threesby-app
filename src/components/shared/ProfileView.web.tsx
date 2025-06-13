import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from "../../hooks/useAuth";
import { PickCard } from "../../components/PickCard";
import { ProfileActions } from '../../components/ProfileActions';
import { useProfileData } from '../../hooks/useProfileData';
import type { Pick } from '../../types';
import { ContextualBackButton } from "../../components/ContextualBackButton";

export function ProfileView() {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { profile, picks, loading, error } = useProfileData(
    id, 
    user?.id, 
    user?.app_metadata?.role
  );

  const [activeTab, setActiveTab] = useState<string>('all');

  if (error) {
    return (
      <div className="min-h-screen bg-[#F4F4F4] px-8 py-8">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Error</h2>
          <p className="text-gray-700 mb-4">{error}</p>
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
  
  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-[#F4F4F4] px-8">
        <div className="py-8">
          <div className="hidden md:flex gap-4">
            <div className="w-1/4">
              <div className="w-16 h-16 bg-gray-200 rounded-full animate-pulse mb-4" />
              <div className="w-32 h-6 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="w-48 h-4 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="w-3/4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="aspect-[3/4] bg-gray-200 animate-pulse" />
                    <div className="p-4">
                      <div className="w-3/4 h-4 bg-gray-200 rounded animate-pulse mb-2" />
                      <div className="w-1/2 h-3 bg-gray-200 rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="md:hidden">
            <div className="p-4">
              <div className="w-16 h-16 bg-gray-200 rounded-full animate-pulse mb-4" />
              <div className="w-32 h-6 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="w-48 h-4 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="flex space-x-1 border-b border-gray-200 mb-6">
              {['All', 'Books', 'Things', 'Places'].map((tab) => (
                <div
                  key={tab}
                  className="flex-1 py-4 text-sm font-medium border-b-2 border-gray-200 animate-pulse"
                >
                  <div className="w-16 h-4 bg-gray-200 rounded mx-auto" />
                </div>
              ))}
            </div>
            <div className="flex flex-col pb-20">
              {[...Array(3)].map((_, index) => (
                <div key={`skeleton-mobile-${index}`} className="flex items-center gap-4 p-2 border-b border-gray-200">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg animate-pulse" />
                  <div className="flex-1">
                    <div className="w-32 h-4 bg-gray-200 rounded animate-pulse mb-2" />
                    <div className="w-16 h-3 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Filter picks based on active tab
  const filteredPicks = activeTab === 'all' 
    ? picks 
    : picks.filter(pick => pick.category.toLowerCase() === activeTab.toLowerCase());

  return (
    <div className="min-h-screen bg-[#F4F4F4] px-8">
      <div className="py-8">
        <div className="hidden md:block mb-4">
          <ContextualBackButton />
        </div>
        
        <div className="hidden md:flex gap-8">
          {/* Profile Info Column */}
          <div className="w-1/4">
            <div className="bg-white rounded-lg shadow p-6 sticky top-4">
              <div className="flex flex-col items-center">
                <img 
                  src={profile.avatar_url || '/default-avatar.png'} 
                  alt={profile.full_name || 'User'} 
                  className="w-24 h-24 rounded-full object-cover mb-4"
                />
                <h1 className="text-xl font-semibold text-center mb-1">{profile.full_name}</h1>
                <p className="text-gray-500 mb-4">@{profile.id.substring(0, 8)}</p>
                
                <div className="flex justify-between w-full mb-6">
                  <div className="text-center">
                    <div className="font-semibold">{profile.followers_count || 0}</div>
                    <div className="text-xs text-gray-500">Followers</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold">{profile.following_count || 0}</div>
                    <div className="text-xs text-gray-500">Following</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold">{picks.length}</div>
                    <div className="text-xs text-gray-500">Picks</div>
                  </div>
                </div>
                
                {profile.bio && (
                  <div className="mb-6 text-center">
                    <p className="text-sm text-gray-700">{profile.bio}</p>
                  </div>
                )}
                
                <ProfileActions 
                  profile={profile} 
                  picks={picks}
                />
              </div>
            </div>
          </div>
          
          {/* Picks Column */}
          <div className="w-3/4">
            <div className="mb-6">
                              <div className="flex space-x-4 border-b border-transparent">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`py-2 px-4 text-sm font-medium ${
                    activeTab === 'all'
                      ? 'border-b-2 border-foreground text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setActiveTab('books')}
                  className={`py-2 px-4 text-sm font-medium ${
                    activeTab === 'books'
                      ? 'border-b-2 border-foreground text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Books
                </button>
                <button
                  onClick={() => setActiveTab('places')}
                  className={`py-2 px-4 text-sm font-medium ${
                    activeTab === 'places'
                      ? 'border-b-2 border-foreground text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Places
                </button>
                <button
                  onClick={() => setActiveTab('products')}
                  className={`py-2 px-4 text-sm font-medium ${
                    activeTab === 'products'
                      ? 'border-b-2 border-foreground text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Products
                </button>
              </div>
            </div>
            
            {filteredPicks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPicks.map((pick: Pick) => (
                  <PickCard
                    key={pick.id}
                    pick={pick}
                    variant="Pick"
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-500">No picks found in this category.</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Mobile Layout */}
        <div className="md:hidden">
          <div className="flex items-center mb-4">
            <button 
              onClick={() => navigate(-1)} 
              className="mr-2 text-gray-600"
            >
              ← Back
            </button>
          </div>
          
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="p-4 flex flex-col items-center">
              <img 
                src={profile.avatar_url || '/default-avatar.png'} 
                alt={profile.full_name || 'User'} 
                className="w-20 h-20 rounded-full object-cover mb-3"
              />
              <h1 className="text-lg font-semibold text-center">{profile.full_name}</h1>
              <p className="text-gray-500 text-sm mb-1">@{profile.id.substring(0, 8)}</p>
              
              <div className="flex justify-between w-full mb-4">
                <div className="text-center">
                  <div className="font-semibold">{profile.followers_count}</div>
                  <div className="text-xs text-gray-500">Followers</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold">{profile.following_count}</div>
                  <div className="text-xs text-gray-500">Following</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold">{picks.length}</div>
                  <div className="text-xs text-gray-500">Picks</div>
                </div>
              </div>
              
              {profile.bio && (
                <div className="mb-4 text-center">
                  <p className="text-xs text-gray-700">{profile.bio}</p>
                </div>
              )}
              
              <ProfileActions 
                profile={profile} 
                picks={picks}
              />
            </div>
          </div>
          
          <div className="flex space-x-1 border-b border-transparent mb-6">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 py-3 text-xs font-medium ${
                activeTab === 'all'
                  ? 'border-b-2 border-foreground text-foreground'
                  : 'text-muted-foreground'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveTab('books')}
              className={`flex-1 py-3 text-xs font-medium ${
                activeTab === 'books'
                  ? 'border-b-2 border-foreground text-foreground'
                  : 'text-muted-foreground'
              }`}
            >
              Books
            </button>
            <button
              onClick={() => setActiveTab('places')}
              className={`flex-1 py-3 text-xs font-medium ${
                activeTab === 'places'
                  ? 'border-b-2 border-foreground text-foreground'
                  : 'text-muted-foreground'
              }`}
            >
              Places
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`flex-1 py-3 text-xs font-medium ${
                activeTab === 'products'
                  ? 'border-b-2 border-foreground text-foreground'
                  : 'text-muted-foreground'
              }`}
            >
              Products
            </button>
          </div>
          
          <div className="flex flex-col pb-20">
            {filteredPicks.length > 0 ? (
              filteredPicks.map((pick: Pick) => (
                <div 
                  key={pick.id} 
                  className="flex items-center gap-4 p-3 border-b border-gray-200"
                  onClick={() => {
                    // Use the modal system instead of navigation to prevent page reload
                    const event = new CustomEvent('openPickModal', {
                      detail: { pickId: pick.id }
                    });
                    window.dispatchEvent(event);
                  }}
                >
                  <img 
                    src={pick.image_url || '/default-pick.png'} 
                    alt={pick.title} 
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                  <div>
                    <h3 className="font-medium text-sm">{pick.title}</h3>
                    <p className="text-xs text-gray-500 capitalize">{pick.category}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm">No picks found in this category.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
