import { Twitter, Instagram, Linkedin, Globe } from 'lucide-react';
import { FollowButton } from './FollowButton';
import { FollowStats } from './FollowStats';
import { UserBadge } from './UserBadge';
import { Tag } from './ui/Tag';
import type { Profile } from '../types';
import { useState, useEffect } from 'react';

type ProfileSectionProps = {
  profile: Profile;
  isOwnProfile?: boolean;
  onEditProfile?: () => void;
};

// Bio component with Read More functionality
function BioWithReadMore({ message }: { message: string }) {
  const [expanded, setExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);
  
  // Only apply truncation on mobile
  if (!isMobile) {
    return <p className="text-[#585757] dark:text-gray-400">{message}</p>;
  }
  
  const maxLength = 100; // Characters to show before truncating
  const shouldTruncate = message.length > maxLength;
  
  return (
    <div>
      <p className="text-[#585757] dark:text-gray-400">
        {expanded ? message : shouldTruncate ? (
          <>
            {message.substring(0, maxLength)}
            <span className="inline-flex">
              ...
              <button 
                onClick={() => setExpanded(true)} 
                className="text-black text-sm font-bold ml-1" data-component-name="BioWithReadMore"
              >
                more
              </button>
            </span>
          </>
        ) : message}
      </p>
      {expanded && shouldTruncate && (
        <button 
          onClick={() => setExpanded(false)} 
          className="text-blue-500 text-sm font-medium"
        >
          Show less
        </button>
      )}
    </div>
  );
}

export function ProfileSection({ profile, isOwnProfile = false, onEditProfile }: ProfileSectionProps) {
  // Load interests from localStorage if not available in profile
  const [interests, setInterests] = useState<string[]>([]);
  
  useEffect(() => {
    // Try to load interests from profile first
    if ((profile as any)?.interests && Array.isArray((profile as any).interests)) {
      setInterests((profile as any).interests);
    } else if (profile?.id) {
      // If not available in profile, try to load from localStorage
      const storedInterests = localStorage.getItem(`interests_${profile.id}`);
      if (storedInterests) {
        try {
          const parsedInterests = JSON.parse(storedInterests);
          if (Array.isArray(parsedInterests)) {
            setInterests(parsedInterests);
          }
        } catch (error) {
          console.error('Error parsing interests from localStorage:', error);
        }
      }
    }
  }, [profile]);
  return (
    <div className="flex flex-col items-start w-full">
      {/* Header with avatar and name */}
      <div className="flex items-center gap-3 w-full">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.full_name || ''}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="flex items-center justify-center w-full h-full text-gray-500 text-lg">
              {profile?.full_name?.[0] || '?'}
            </span>
          )}
        </div>
        
        <div>
          <p className="text-xs font-mono uppercase text-[#9d9b9b]">
            {profile?.title || 'Creator'}
          </p>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-[#252525] dark:text-white">
              {profile?.full_name}
            </h3>
            <UserBadge 
              isAdmin={profile?.is_admin}
              isCreator={profile?.is_creator}
              isBrand={profile?.is_brand}
              brandImageUrl={profile?.avatar_url || undefined}
            />
          </div>
        </div>
        
        {isOwnProfile && onEditProfile && (
          <button
            onClick={onEditProfile}
            className="ml-auto text-[#9d9b9b] hover:text-black text-sm"
          >
            Edit
          </button>
        )}
      </div>
      
      {/* Follow stats and button */}
      <div className="w-full">
        <div className="h-px w-full bg-transparent my-3"></div>
        <div className="flex items-center justify-between w-full">
          <FollowStats userId={profile?.id || ''} />
          
          {!isOwnProfile && profile && (
            <FollowButton userId={profile.id} />
          )}
        </div>
      </div>
      
      {/* Bio with Read More functionality */}
      {profile?.message && (
        <>
          <div className="h-px w-full bg-transparent my-3"></div>
          <BioWithReadMore message={profile.message} />
        </>
      )}
      
      {/* Location */}
      {(profile as any)?.location && (
        <>
          <div className="h-px w-full bg-transparent my-3"></div>
          <div className="flex items-center gap-2 text-muted-foreground w-full">
            <span className="text-sm">📍</span>
            <span>{(profile as any).location}</span>
          </div>
        </>
      )}
      
      {/* Interests */}
      {interests.length > 0 && (
        <>
          <div className="h-px w-full bg-transparent my-3"></div>
          <div className="flex flex-wrap gap-2">
            {interests.map((interest: string, index: number) => (
              <Tag key={index} className="font-mono">
                {interest}
              </Tag>
            ))}
          </div>
        </>
      )}
      
      {/* Social links */}
      {(profile?.social_links?.twitter || profile?.social_links?.instagram || profile?.social_links?.linkedin || profile?.social_links?.website) && (
        <>
          <div className="h-px w-full bg-transparent my-3"></div>
          <div className="flex gap-4">
            {profile?.social_links?.twitter && (
              <a 
                href={profile.social_links.twitter} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[#9d9b9b] hover:text-[#252525] transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </a>
            )}
            {profile?.social_links?.instagram && (
              <a 
                href={profile.social_links.instagram} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[#9d9b9b] hover:text-[#252525] transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
            )}
            {profile?.social_links?.linkedin && (
              <a 
                href={profile.social_links.linkedin} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[#9d9b9b] hover:text-[#252525] transition-colors"
              >
                <Linkedin className="w-5 h-5" />
              </a>
            )}
            {profile?.social_links?.website && (
              <a 
                href={profile.social_links.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[#9d9b9b] hover:text-[#252525] transition-colors"
              >
                <Globe className="w-5 h-5" />
              </a>
            )}
          </div>
        </>
      )}
      
      {/* Tags */}
      {(profile as any)?.tags && Array.isArray((profile as any).tags) && (profile as any).tags.length > 0 && (
        <>
          <div className="h-px w-full bg-[rgb(235,235,235)] my-3"></div>
          <div className="flex gap-2 flex-wrap">
            {(profile as any).tags.map((tag: string) => (
              <Tag key={tag} variant="secondary" className="font-mono">
                {tag}
              </Tag>
            ))}
          </div>
        </>
      )}
    </div>
  );
}