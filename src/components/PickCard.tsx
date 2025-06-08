import React, { useState, useCallback, memo } from 'react';
import { Heart, Check } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import './LazyImage.css';
import { useAuth } from '../hooks/useAuth';
import { UserBadge } from './UserBadge';
import { PickImage } from './PickImage';
import { useAuthModalStore } from '../store/authModalStore';
import { savePick, unsavePick, isPickSaved } from '../services/favoritesService';
import type { Pick } from '../types';
import { cn } from '../lib/utils';

// Helper function to get class names based on variant
const getVariantClasses = (variant: string, display: string) => {
  const baseClasses = 'overflow-hidden';
  
  let variantClasses = '';
  if (variant === 'feed' || variant === 'Pick' || variant === 'myPick') {
    variantClasses = 'cursor-pointer';
  } else if (variant === 'bestPick') {
    variantClasses = 'cursor-pointer';
  } else if (variant === 'archive') {
    variantClasses = 'cursor-pointer opacity-60';
  } else if (variant === 'addNew') {
    variantClasses = 'cursor-pointer';
  } else if (variant === 'empty') {
    variantClasses = '';
  }
  
  let displayClasses = '';
  if (display === 'mobile') {
    displayClasses = 'flex items-center gap-4 p-4';
  }
  
  return `${baseClasses} ${variantClasses} ${displayClasses}`;
};

interface PickCardProps extends React.HTMLAttributes<HTMLDivElement> {
  status?: 'active' | 'inactive' | 'archive' | 'add';
  pick?: Pick & {
    profile?: {
      id: string;
      full_name: string | null;
      title: string | null;
      avatar_url?: string | null;
      is_admin?: boolean;
      is_creator?: boolean;
      is_brand?: boolean;
    };
  };
  variant?: 'feed' | 'Pick' | 'myPick' | 'bestPick' | 'archive' | 'addNew' | 'empty';
  category?: 'books' | 'products' | 'places';
  index?: number;
  isEmpty?: boolean;
  onClick?: () => void;
  onImageClick?: (pick: Pick) => void;
  display?: 'desktop' | 'mobile';
  children?: React.ReactNode;
  disableProfileLink?: boolean;
  profileLinkOnly?: boolean;
  contentLinkTo?: string;
  contentLinkState?: Record<string, any>;
  isArchived?: boolean;
  isActive?: boolean;
}

// Internal component that doesn't use hooks
const PickCardInternal = memo(
  ({
    pick,
    className = '',
    variant = 'feed',
    display = 'desktop',
    category,
    index,
    isEmpty = false,
    onClick,
    onImageClick,
    children,
    disableProfileLink = false,
    profileLinkOnly = false,
    contentLinkTo,
    contentLinkState,
    isArchived = false,
    isActive = false,
    navigate,
    ...otherProps
  }: PickCardProps & { navigate?: any }) => {
    const { user } = useAuth();
    const [saved, setSaved] = useState(false);
    const openAuthModal = useAuthModalStore(state => state.openModal);
    const [loading, setLoading] = useState(false);

    const checkSavedStatus = useCallback(async () => {
      if (!user || !pick) return;
      try {
        const isSavedPick = await isPickSaved(pick.id);
        setSaved(Boolean(isSavedPick));
      } catch (error) {
        console.error('Error checking saved status:', error);
        setSaved(false);
      }
    }, [user, pick]);

    React.useEffect(() => {
      if (user && pick) {
        checkSavedStatus();
      }
    }, [user, pick, checkSavedStatus]);

    const handleSave = async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!user) {
        openAuthModal('signup');
        return;
      }

      if (!pick) return;

      setLoading(true);
      try {
        if (saved) {
          await unsavePick(pick.id);
        } else {
          await savePick(pick.id);
        }
        setSaved(!saved);
        
        // Update the favorites count in the UI
        const pickWithCount = pick as any;
        if (pickWithCount.favorites_count !== undefined) {
          pickWithCount.favorites_count = saved ? Math.max(0, pickWithCount.favorites_count - 1) : pickWithCount.favorites_count + 1;
        }
      } catch (error) {
        console.error('Error updating save status:', error);
      } finally {
        setLoading(false);
      }
    };

    // No need for external context, we'll use direct navigation
    
    const handleCardClick = (e: React.MouseEvent) => {
      // Don't trigger if clicking on a link or button
      if (e.target instanceof HTMLElement && (e.target.closest('a') || e.target.closest('button'))) {
        return;
      }

      if (onClick) {
        // Use custom click handler if provided
        onClick();
      } else if (pick && pick.id) {
        // Prevent default behavior and stop propagation
        e.preventDefault();
        e.stopPropagation();
        
        // Dispatch a custom event to open the modal
        const event = new CustomEvent('openPickModal', {
          detail: { pickId: pick.id }
        });
        window.dispatchEvent(event);
      }
    };

    const showProfileInfo = variant === 'feed';
    const showPickInfo = variant === 'feed' || variant === 'Pick';
    const showSaveAndFollow = variant === 'feed' || variant === 'Pick';
    const showRankLabel = (variant === 'feed') || (variant === 'Pick' && display === 'desktop');

    // Create rank label if index is provided
    const rankLabel = index !== undefined && index !== null ? `#${String(index + 1).padStart(2, '0')}` : null;

    // Handle image URLs safely
    const imageUrl = pick?.image_url || '';
    const optimizedImageUrl = imageUrl ? `${imageUrl}?w=400&h=400&format=webp&quality=70` : '';
    const errorImageUrl = 'https://placehold.co/150x150/FF0000/FFFFFF/png';

    // Determine the variant based on props
    const cardVariant = (() => {
      if (variant !== 'feed' && variant !== 'Pick') {
        if (isEmpty) {
          return 'addNew';
        }
        if (status === 'archive' || isArchived) {
          return 'archive';
        }
        if (status === 'inactive') {
          return 'empty';
        }
        if (pick?.rank && pick.rank >= 1 && pick.rank <= 3) {
          return 'bestPick';
        }
        return variant || 'feed';
      }
      return variant || 'feed';
    })();

    if (isEmpty) {
      return (
        <div
          className={cn(
            getVariantClasses(cardVariant, display),
            className,
            index === 0 && 'rounded-tl-[4px]',
            index === 2 && 'rounded-tr-[4px]',
            index === 6 && 'rounded-bl-[4px]',
            index === 8 && 'rounded-br-[4px]'
          )}
          onClick={handleCardClick}
          {...otherProps}
        >
          {rankLabel && !isActive && (
            <div className="absolute top-2 right-2 z-30 bg-[#a1ff7a] w-6 h-6 rounded-full flex items-center justify-center">
              <Check className="w-3 h-3 text-black" />
            </div>
          )}
          {children}
        </div>
      );
    }

    return (
      <>
        <article
          className={cn(getVariantClasses(cardVariant, display), className, "pick-card-container")}
          onClick={handleCardClick}
          {...otherProps}
        >
          {showRankLabel && rankLabel && !isActive && (
            <div className="absolute top-2 right-2 z-30 bg-[#a1ff7a] w-6 h-6 rounded-full flex items-center justify-center">
              <Check className="w-3 h-3 text-black" />
            </div>
          )}

          {(variant === 'myPick' || cardVariant === 'myPick' || cardVariant === 'bestPick' || cardVariant === 'archive') && pick && (
            (display === 'desktop') ? (
              <div className="relative w-full h-full overflow-hidden pick-image-container">
                {children}
                <PickImage
                  src={optimizedImageUrl || ''}
                  alt={pick.title || ''}
                  className="cursor-pointer"
                  wrapperClassName="w-full h-full"
                  aspectRatio="square"
                  variant="feed"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    if (onImageClick) {
                      onImageClick(pick);
                    }
                  }}
                />
              </div>
            ) : (
              <>
                <div className="relative w-16 h-16 overflow-hidden">
                  <img
                    alt={pick.title}
                    className="cursor-pointer w-16 h-16 object-cover"
                    src={optimizedImageUrl || ""}
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      if (onImageClick && pick) {
                        onImageClick(pick);
                      }
                    }}
                    onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                      const img = e.currentTarget as HTMLImageElement;
                      img.src = errorImageUrl;
                    }}
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-medium text-[#252525] truncate">{pick.title}</h3>
                  <p className="text-sm text-gray-500 truncate">{pick.reference || 'No reference'}</p>
                </div>
              </>
            )
          )}

          {variant !== 'myPick' && pick && (
            (display === 'desktop') ? (
              <>
                {showProfileInfo && pick.profile && (
                  <div className="p-4 pick-card-profile">
                    {disableProfileLink ? (
                      <div>
                        <div className="flex items-center justify-between" data-component-name="ProfileInfo">
                          <div className="flex items-center gap-2.5">
                            <div className="relative" style={{ minWidth: '36px' }}>
                              {pick?.profile?.avatar_url ? (
                                <img
                                  src={pick.profile.avatar_url}
                                  alt={pick.profile?.full_name || 'Anonymous'}
                                  className="rounded-full profile-avatar w-9 h-9"
                                  loading="eager"
                                  decoding="async"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
                                  <span className="text-gray-500 font-medium">
                                    {pick?.profile?.full_name?.[0] || '?'}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="text-xs font-mono uppercase text-gray-500 mb-0.5" data-component-name="ProfileInfo">
                                {pick?.profile?.title || 'Designer'}
                              </p>
                              <div className="flex items-center gap-1" data-component-name="ProfileInfo">
                                <h3 className="font-medium text-gray-900 text-sm">
                                  {pick?.profile?.full_name || 'Anonymous'}
                                </h3>
                                <UserBadge
                                  isAdmin={pick?.profile?.is_admin}
                                  isCreator={pick?.profile?.is_creator}
                                  isBrand={pick?.profile?.is_brand}
                                  brandImageUrl={pick?.profile?.avatar_url || undefined}
                                />
                              </div>
                            </div>
                          </div>

                          {showSaveAndFollow && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                              className="inline-flex items-center justify-center px-4 py-1.5 text-xs font-medium rounded-full transition-colors border border-gray-200 text-gray-700 bg-white hover:bg-gray-50"
                            >
                              <span>Follow</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <Link
                        to={`/profile/${pick.profile?.id || ''}`}
                        className="block"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-between" data-component-name="ProfileInfo">
                          <div className="flex items-center gap-2.5">
                            <div className="relative" style={{ minWidth: '36px' }}>
                              {pick?.profile?.avatar_url ? (
                                <img
                                  src={pick.profile.avatar_url}
                                  alt={pick.profile?.full_name || 'Anonymous'}
                                  className="rounded-full profile-avatar w-9 h-9"
                                  loading="eager"
                                  decoding="async"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
                                  <span className="text-gray-500 font-medium">
                                    {pick?.profile?.full_name?.[0] || '?'}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="text-xs font-mono uppercase text-gray-500 mb-0.5" data-component-name="ProfileInfo">
                                {pick?.profile?.title || 'Designer'}
                              </p>
                              <div className="flex items-center gap-1" data-component-name="ProfileInfo">
                                <h3 className="font-medium text-gray-900 text-sm">
                                  {pick?.profile?.full_name || 'Anonymous'}
                                </h3>
                                <UserBadge
                                  isAdmin={pick?.profile?.is_admin}
                                  isCreator={pick?.profile?.is_creator}
                                  isBrand={pick?.profile?.is_brand}
                                  brandImageUrl={pick?.profile?.avatar_url || undefined}
                                />
                              </div>
                            </div>
                          </div>

                          {showSaveAndFollow && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                              className="inline-flex items-center justify-center px-4 py-1.5 text-xs font-medium rounded-full transition-colors border border-gray-200 text-gray-700 bg-white hover:bg-gray-50"
                            >
                              <span>Follow</span>
                            </button>
                          )}
                        </div>
                      </Link>
                    )}
                  </div>
                )}
                
                {/* Content section */}
                <div className="pick-image-container">
                  {contentLinkTo ? (
                    <Link
                      to={contentLinkTo}
                      state={contentLinkState}
                      className="block absolute inset-0 z-10"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="sr-only">View details</span>
                    </Link>
                  ) : null}
                  <PickImage
                    src={optimizedImageUrl || ''}
                    alt={pick.title || ''}
                    className="cursor-pointer"
                    wrapperClassName="w-full h-full"
                    aspectRatio="square"
                    variant="feed"
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      if (onImageClick) {
                        onImageClick(pick);
                      } else if (pick && pick.id) {
                        // Use a custom event to open the modal
                        console.log('PickCard: Opening modal for pick:', pick.id);
                        
                        // Dispatch a custom event to open the modal
                        window.dispatchEvent(
                          new CustomEvent('openPickModal', {
                            detail: { pickId: pick.id }
                          })
                        );
                      }
                    }}
                  />
                </div>
                
                {showPickInfo && (
                  <div className="py-4 pick-card-info">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-medium text-[#252525] truncate" style={{ fontSize: '1rem' }}>{pick?.title}</h3>
                        <div className="uppercase text-xs font-mono text-[#9d9b9b] line-clamp-1">{pick?.reference || 'No reference'}</div>
                      </div>
                      
                      {showSaveAndFollow && (
                        <button
                          onClick={handleSave}
                          disabled={loading}
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
                            saved ? 'text-red-500 hover:text-red-600' : 'text-gray-400 hover:text-gray-500'
                          }`}
                        >
                          <Heart className={`w-5 h-5 ${saved ? 'fill-current' : ''}`} />
                          {(pick as any).favorites_count !== undefined && (pick as any).favorites_count > 0 && (
                            <span className="text-xs ml-1">{(pick as any).favorites_count}</span>
                          )}
                          <span className="sr-only">{saved ? 'Unsave' : 'Save'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="relative w-16 h-16 overflow-hidden">
                  <img
                    alt={pick.title}
                    className="cursor-pointer w-16 h-16 object-cover"
                    src={optimizedImageUrl || ""}
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      if (onImageClick && pick) {
                        onImageClick(pick);
                      }
                    }}
                    onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                      const img = e.currentTarget as HTMLImageElement;
                      img.src = errorImageUrl;
                    }}
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-medium text-[#252525] truncate">{pick.title}</h3>
                  <p className="text-sm text-gray-500 truncate">{pick.reference || 'No reference'}</p>
                </div>
              </>
            )
          )}
        </article>

      </>
    );
  }
);

PickCardInternal.displayName = 'PickCardInternal';

// Wrapper component that uses hooks
export const PickCard = (props: PickCardProps) => {
  const navigate = useNavigate();
  return <PickCardInternal {...props} navigate={navigate} />;
};
