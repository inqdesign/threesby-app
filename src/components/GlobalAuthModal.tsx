
import { AuthModal } from './AuthModal';
import { useAuthModalStore } from '../store/authModalStore';

export function GlobalAuthModal() {
  const { isOpen, mode, closeModal } = useAuthModalStore();
  
  return (
    <AuthModal
      isOpen={isOpen}
      onClose={closeModal}
      mode={mode}
    />
  );
}
