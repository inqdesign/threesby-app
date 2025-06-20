import { useEffect, useState, Fragment } from 'react';
import { X, Book, Package, MapPin } from 'lucide-react';
import { Button } from './ui/button';
import type { Profile, Pick } from '../types';
import { ProfileSection } from './ProfileSection';
import { Transition } from '@headlessui/react';

type PreviewModalProps = {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile;
  picks: Pick[];
};

export function PreviewModal({ isOpen, onClose, profile, picks }: PreviewModalProps) {
  // State to track if we're on mobile
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Update mobile state on window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Disable background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);
  
  if (!isOpen) return null;

  // Group picks by category and filter to only show top 3 for each
  console.log('PreviewModal received picks:', picks);
  
  const bookPicks = picks
    .filter(pick => pick.category === 'books')
    .sort((a, b) => {
      const rankA = a.rank !== undefined && a.rank !== null ? a.rank : 999;
      const rankB = b.rank !== undefined && b.rank !== null ? b.rank : 999;
      return rankA - rankB;
    })
    .slice(0, 3);
    
  const productPicks = picks
    .filter(pick => pick.category === 'products')
    .sort((a, b) => {
      const rankA = a.rank !== undefined && a.rank !== null ? a.rank : 999;
      const rankB = b.rank !== undefined && b.rank !== null ? b.rank : 999;
      return rankA - rankB;
    })
    .slice(0, 3);
    
  const placePicks = picks
    .filter(pick => pick.category === 'places')
    .sort((a, b) => {
      const rankA = a.rank !== undefined && a.rank !== null ? a.rank : 999;
      const rankB = b.rank !== undefined && b.rank !== null ? b.rank : 999;
      return rankA - rankB;
    })
    .slice(0, 3);
    
  console.log('PreviewModal filtered picks:', {
    books: bookPicks,
    products: productPicks,
    places: placePicks
  });

  // Helper function to render picks for a category
  const renderCategoryPicks = (categoryPicks: Pick[], icon: JSX.Element) => {
    return (
      <div className="mb-[10px]">
        {/* Category header removed as requested */}
        
        <div className="grid grid-cols-3 gap-[10px]">
          {categoryPicks.map((pick) => (
            <div key={pick.id} className="relative aspect-square rounded-[4px] bg-white overflow-hidden">
              {pick.image_url && (
                <div className="w-full h-full">
                  <img 
                    src={pick.image_url} 
                    alt={pick.title || 'Pick image'} 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              {/* #number label removed as requested */}
            </div>
          ))}
          
          {/* Fill in empty slots if needed */}
          {Array.from({ length: Math.max(0, 3 - categoryPicks.length) }).map((_, index) => (
            <div 
              key={`empty-${index}`} 
              className="relative aspect-square rounded-[4px] bg-[#f3f2ed]"
            >
              <div className="flex items-center justify-center h-full">
                {icon}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Transition show={isOpen} as={Fragment}>
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        </Transition.Child>

        {/* Modal/Drawer Container */}
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
          <Transition.Child
            as={Fragment}
            enter="transform transition ease-out duration-400"
            enterFrom={isMobile ? "translate-y-full" : "scale-95 opacity-0"}
            enterTo={isMobile ? "translate-y-0" : "scale-100 opacity-100"}
            leave="transform transition ease-in-out duration-300"
            leaveFrom={isMobile ? "translate-y-0" : "scale-100 opacity-100"}
            leaveTo={isMobile ? "translate-y-full" : "scale-95 opacity-0"}
          >
            <div 
              className={`relative w-full pointer-events-auto ${isMobile ? 'h-[95vh] rounded-t-xl' : 'h-[90vh] rounded-xl'} bg-card overflow-hidden`}
              style={isMobile ? { position: 'fixed', bottom: 0, left: 0, right: 0 } : {}}
            >
              {/* Header with buttons - fixed position */}
              <div className="sticky top-0 right-0 left-0 bg-card p-4 flex justify-end items-center z-10 border-b border-border">
                {/* Close button */}
                <Button
  onClick={onClose}
  variant="ghost"
  size="sm"
                  className="p-2 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground"
  aria-label="Close preview"
>
  <X className="w-5 h-5" />
</Button>
              </div>
              
              {/* Scrollable content area */}
              <div className="overflow-y-auto" style={{ height: isMobile ? 'calc(95vh - 60px)' : 'calc(90vh - 60px)' }}>
                <div className="p-8">
                  <div className="flex flex-col md:flex-row gap-[60px]">
                    {/* Profile Section */}
                    <div className="w-full md:w-1/4">
                      <div className="px-4 md:px-0 py-4 md:py-0">
                        <ProfileSection profile={profile} isOwnProfile={false} />
                      </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1">
                      {renderCategoryPicks(bookPicks, <Book className="w-5 h-5 text-[#9d9b9b]" />)}
                      {renderCategoryPicks(productPicks, <Package className="w-5 h-5 text-[#9d9b9b]" />)}
                      {renderCategoryPicks(placePicks, <MapPin className="w-5 h-5 text-[#9d9b9b]" />)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Transition.Child>
        </div>
      </div>
    </Transition>
  );
}
