import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function MobileNav({ onClose }: { onClose: () => void }) {
  const location = useLocation();
  const { user } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="md:hidden bg-white border-t border-gray-200">
      <div className="px-4 py-2 space-y-1">
        {user ? (
          <>
            <Link
              to="/my-threes"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive('/my-threes') ? 'bg-neutral-200 text-[#252525]' : 'text-[#585757] hover:bg-neutral-100'
              }`}
              onClick={onClose}
            >
              MyThrees
            </Link>
            <Link
              to="/discover"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive('/discover') ? 'bg-neutral-200 text-[#252525]' : 'text-[#585757] hover:bg-neutral-100'
              }`}
              onClick={onClose}
            >
              Discover
            </Link>
            <Link
              to="/curators"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive('/curators') ? 'bg-neutral-200 text-[#252525]' : 'text-[#585757] hover:bg-neutral-100'
              }`}
              onClick={onClose}
            >
              Curators
            </Link>
          </>
        ) : (
          <>
            <Link
              to="/discover"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive('/discover') ? 'bg-neutral-200 text-[#252525]' : 'text-[#585757] hover:bg-neutral-100'
              }`}
              onClick={onClose}
            >
              Discover
            </Link>
            <Link
              to="/curators"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive('/curators') ? 'bg-neutral-200 text-[#252525]' : 'text-[#585757] hover:bg-neutral-100'
              }`}
              onClick={onClose}
            >
              Curators
            </Link>
          </>
        )}
      </div>
    </div>
  );
}