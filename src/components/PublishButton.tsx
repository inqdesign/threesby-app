import { useState, Fragment, useEffect } from 'react';
import { Popover, Transition, Dialog } from '@headlessui/react';
import { RefreshCw, Clock, ChevronDown, AlertTriangle, X } from 'lucide-react';
import type { Profile, Pick } from '../types';

type PublishButtonProps = {
  profile?: Profile;
  picks?: Pick[];
  onUpdate?: () => Promise<void>;
  onUnpublish?: () => Promise<void>;
  className?: string;
};

export function PublishButton({ picks = [], onUpdate, onUnpublish, className = '' }: PublishButtonProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUnpublishing, setIsUnpublishing] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [showUnpublishConfirm, setShowUnpublishConfirm] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  // Update mobile state on window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate stats for the tooltip
  const publishedPicks = picks.filter(pick => pick.status === 'published');
  const draftPicks = picks.filter(pick => pick.status === 'draft');
  const pendingPicks = picks.filter(pick => pick.status === 'pending_review');
  
  // Format the last update time
  const getLastUpdateTime = () => {
    if (!picks || picks.length === 0) return 'Never updated';
    
    // Find the most recently updated pick
    const lastUpdated = picks.reduce((latest, pick) => {
      const pickDate = new Date(pick.last_updated_at || pick.updated_at);
      return pickDate > latest ? pickDate : latest;
    }, new Date(0));
    
    // Format the date
    const now = new Date();
    const diffMs = now.getTime() - lastUpdated.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
      }
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 30) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return lastUpdated.toLocaleDateString();
    }
  };

  const handlePublish = async () => {
    if (!onUpdate || isUpdating || isUnpublishing) return;
    
    try {
      setIsUpdating(true);
      setActionMessage('Publishing your picks...');
      
      // Call the onUpdate function which should directly publish the picks
      // without creating a submission review
      await onUpdate();
      
      setActionMessage('Your picks have been published!');
      setTimeout(() => {
        setActionMessage('');
        setIsUpdating(false);
      }, 3000);
    } catch (error) {
      setActionMessage('Error publishing picks. Please try again.');
      setTimeout(() => {
        setActionMessage('');
        setIsUpdating(false);
      }, 3000);
    }
  };

  const handleUnpublish = async () => {
    if (!onUnpublish || isUnpublishing || isUpdating) return;
    
    try {
      setIsUnpublishing(true);
      setActionMessage('Unpublishing your picks...');
      setShowUnpublishConfirm(false);
      
      await onUnpublish();
      
      setActionMessage('Your picks have been unpublished!');
      setTimeout(() => {
        setActionMessage('');
        setIsUnpublishing(false);
      }, 3000);
    } catch (error) {
      setActionMessage('Error unpublishing picks. Please try again.');
      setTimeout(() => {
        setActionMessage('');
        setIsUnpublishing(false);
      }, 3000);
    }
  };
  
  const openUnpublishConfirm = () => {
    setShowUnpublishConfirm(true);
  };

  return (
    <>
      {/* Desktop: Use Popover, Mobile: Use Dialog */}
      {isMobile ? (
        <>
          <button
            className={`px-4 py-2 rounded-[100px] bg-[#252525] text-white hover:bg-[#111111] flex items-center gap-1.5 ${className}`}
            type="button"
            data-drawer-target="update-drawer"
            data-drawer-show="update-drawer"
            aria-controls="update-drawer"
            aria-expanded="false"
            onClick={() => {
              // Reset unpublish confirm state when opening drawer
              setShowUnpublishConfirm(false);
              
              const drawerElement = document.getElementById('update-drawer');
              if (drawerElement) {
                drawerElement.classList.toggle('translate-y-full');
                drawerElement.classList.toggle('translate-y-0');
                
                // Toggle backdrop
                const backdropElement = document.getElementById('drawer-backdrop');
                if (backdropElement) {
                  backdropElement.classList.toggle('opacity-0');
                  backdropElement.classList.toggle('opacity-50');
                  backdropElement.classList.toggle('pointer-events-none');
                }
              }
            }}
          >
            <span>Update</span>
            <ChevronDown className="w-4 h-4" />
          </button>
          
          {/* Drawer Backdrop */}
          <div 
            id="drawer-backdrop"
            className="fixed inset-0 bg-black opacity-0 pointer-events-none transition-opacity duration-300 ease-in-out z-[998]"
            onClick={() => {
              const drawerElement = document.getElementById('update-drawer');
              if (drawerElement) {
                drawerElement.classList.add('translate-y-full');
                drawerElement.classList.remove('translate-y-0');
              }
              
              // Hide backdrop
              const backdropElement = document.getElementById('drawer-backdrop');
              if (backdropElement) {
                backdropElement.classList.add('opacity-0');
                backdropElement.classList.remove('opacity-50');
                backdropElement.classList.add('pointer-events-none');
              }
            }}
          ></div>
          
          {/* Drawer */}
          <div 
            id="update-drawer"
            className="fixed inset-x-0 bottom-0 z-[999] rounded-t-xl bg-white shadow-lg transform translate-y-full transition-transform duration-300 ease-in-out pb-16"
            style={{ maxHeight: '80vh', overflowY: 'auto' }}
          >
            <div className="p-4">
              {/* Close button */}
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Publish Status</h3>
                <button 
                  type="button"
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() => {
                    const drawerElement = document.getElementById('update-drawer');
                    if (drawerElement) {
                      drawerElement.classList.add('translate-y-full');
                      drawerElement.classList.remove('translate-y-0');
                    }
                    
                    // Hide backdrop
                    const backdropElement = document.getElementById('drawer-backdrop');
                    if (backdropElement) {
                      backdropElement.classList.add('opacity-0');
                      backdropElement.classList.remove('opacity-50');
                      backdropElement.classList.add('pointer-events-none');
                    }
                  }}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>Last updated: {getLastUpdateTime()}</span>
                </div>
                
                <div className="grid grid-cols-3 gap-2 mt-1">
                  <div className="bg-gray-50 p-2 rounded text-center">
                    <div className="text-lg font-semibold">{publishedPicks.length}</div>
                    <div className="text-xs text-gray-500">Published</div>
                  </div>
                  <div className="bg-gray-50 p-2 rounded text-center">
                    <div className="text-lg font-semibold">{pendingPicks.length}</div>
                    <div className="text-xs text-gray-500">Pending</div>
                  </div>
                  <div className="bg-gray-50 p-2 rounded text-center">
                    <div className="text-lg font-semibold">{draftPicks.length}</div>
                    <div className="text-xs text-gray-500">Draft</div>
                  </div>
                </div>
                
                <div className="mt-2">
                  <button
                    type="button"
                    className="relative flex w-full items-center justify-between rounded-lg p-3 text-left text-sm font-medium bg-[#252525] text-white hover:bg-[#111111] mb-2"
                    onClick={handlePublish}
                    disabled={isUpdating || isUnpublishing}
                  >
                    <span>Publish All Picks</span>
                    {isUpdating && (
                      <span className="ml-2 text-xs text-gray-200">
                        <RefreshCw className="h-3 w-3 animate-spin" />
                      </span>
                    )}
                  </button>
                  
                  {!isUpdating && !isUnpublishing && (
                    <p className="text-xs text-gray-500 mt-2 mb-3">
                      This will publish all your picks. Only ranks 1-3 will be visible on your profile.
                    </p>
                  )}
                  
                  {onUnpublish && !isUpdating && !isUnpublishing && (
                    <button
                      onClick={openUnpublishConfirm}
                      className="text-sm text-red-500 hover:text-red-700 hover:underline"
                    >
                      Unpublish
                    </button>
                  )}
                  
                  {isUnpublishing && (
                    <div className="w-full px-4 py-2 rounded-md flex items-center justify-center gap-2 mt-3 bg-gray-100 text-gray-400">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{actionMessage}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <Popover className="relative">
          {({ open }) => (
            <>
              <Popover.Button
                className={`px-4 py-2 rounded-[100px] bg-[#252525] text-white hover:bg-[#111111] flex items-center gap-1.5 ${className}`}
              >
                <span>Update</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
              </Popover.Button>
            
              <Transition
                as={Fragment}
                enter="transition ease-out duration-200"
                enterFrom="opacity-0 translate-y-1"
                enterTo="opacity-100 translate-y-0"
                leave="transition ease-in duration-150"
                leaveFrom="opacity-100 translate-y-0"
                leaveTo="opacity-0 translate-y-1"
              >
                <Popover.Panel className="absolute right-0 z-50 mt-2 w-80 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 p-4">
                  <div className="flex flex-col gap-3">
                    <h3 className="text-sm font-medium text-gray-900">Publish Status</h3>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>Last updated: {getLastUpdateTime()}</span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 mt-1">
                      <div className="bg-gray-50 p-2 rounded text-center">
                        <div className="text-lg font-semibold">{publishedPicks.length}</div>
                        <div className="text-xs text-gray-500">Published</div>
                      </div>
                      <div className="bg-gray-50 p-2 rounded text-center">
                        <div className="text-lg font-semibold">{pendingPicks.length}</div>
                        <div className="text-xs text-gray-500">Pending</div>
                      </div>
                      <div className="bg-gray-50 p-2 rounded text-center">
                        <div className="text-lg font-semibold">{draftPicks.length}</div>
                        <div className="text-xs text-gray-500">Draft</div>
                      </div>
                    </div>
                    
                    <div className="mt-2">
                      <button
                        type="button"
                        className="relative flex w-full items-center justify-between rounded-lg p-3 text-left text-sm font-medium bg-[#252525] text-white hover:bg-[#111111] mb-2"
                        onClick={handlePublish}
                        disabled={isUpdating || isUnpublishing}
                      >
                        <span className="flex items-center">
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Publish All Picks
                        </span>
                        {isUpdating && (
                          <span className="ml-2 text-xs text-gray-200">
                            <RefreshCw className="h-3 w-3 animate-spin" />
                          </span>
                        )}
                      </button>
                      
                      {!isUpdating && !isUnpublishing && (
                        <p className="text-xs text-gray-500 mt-2 mb-3">
                          This will publish all your picks. Only ranks 1-3 will be visible on your profile.
                        </p>
                      )}
                      
                      {onUnpublish && !isUpdating && !isUnpublishing && (
                        <button
                          onClick={openUnpublishConfirm}
                          className="text-sm text-red-500 hover:text-red-700 hover:underline"
                        >
                          Unpublish
                        </button>
                      )}
                      
                      {isUnpublishing && (
                        <div className="w-full px-4 py-2 rounded-md flex items-center justify-center gap-2 mt-3 bg-gray-100 text-gray-400">
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>{actionMessage}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Popover.Panel>
              </Transition>
            </>
          )}
        </Popover>
      )}
      
      {/* Unpublish Confirmation Dialog */}
      <UnpublishConfirmationDialog
        isOpen={showUnpublishConfirm}
        onClose={() => setShowUnpublishConfirm(false)}
        onConfirm={handleUnpublish}
        isLoading={isUnpublishing}
      />
    </>
  );
}

// Unpublish Confirmation Dialog
function UnpublishConfirmationDialog({ isOpen, onClose, onConfirm, isLoading }: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}) {
  return (
    <Dialog
      open={isOpen}
      onClose={() => !isLoading && onClose()}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
                          <Dialog.Panel className="mx-auto max-w-md rounded-lg bg-card p-6 shadow-xl">
          <div className="flex flex-col items-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            
            <Dialog.Title className="text-lg font-medium text-center mb-2">
              Unpublish Your Profile
            </Dialog.Title>
            
            <Dialog.Description className="text-sm text-gray-500 text-center mb-6">
              This will unpublish your profile and all your picks. Your profile will no longer be visible to others.
            </Dialog.Description>
            
            <div className="flex gap-3 w-full">
              <button
                type="button"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </button>
              
              <button
                type="button"
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center justify-center"
                onClick={onConfirm}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                    Unpublishing...
                  </>
                ) : (
                  'Confirm Unpublish'
                )}
              </button>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
