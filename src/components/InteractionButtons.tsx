import React from 'react';
import { Heart, MessageCircle, BookmarkPlus } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useAuthModalStore } from '../store/authModalStore';

type InteractionButtonsProps = {
  pickId: string;
  onSave?: () => void;
  onComment?: () => void;
};

export function InteractionButtons({ pickId, onSave, onComment }: InteractionButtonsProps) {
  const { user } = useAuth();
  const [isSaved, setIsSaved] = React.useState(false);
  const openAuthModal = useAuthModalStore(state => state.openModal);

  const handleInteraction = (action: () => void) => {
    if (!user) {
      openAuthModal('signup');
      return;
    }
    action();
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
    onSave?.();
  };

  const handleComment = () => {
    onComment?.();
  };

  return (
    <>
      <div className="flex items-center gap-4">
        <button
          onClick={() => handleInteraction(handleSave)}
          className={`flex items-center gap-2 text-sm ${
            isSaved ? 'text-red-500' : 'text-gray-600 hover:text-red-500'
          }`}
        >
          <Heart className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
          <span>Save</span>
        </button>

        <button
          onClick={() => handleInteraction(handleComment)}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-500"
        >
          <MessageCircle className="w-5 h-5" />
          <span>Comment</span>
        </button>

        <button
          onClick={() => handleInteraction(handleSave)}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-green-500"
        >
          <BookmarkPlus className="w-5 h-5" />
          <span>Bookmark</span>
        </button>
      </div>
    </>
  );
}