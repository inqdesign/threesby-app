import { Link, useLocation } from 'react-router-dom';
import { 
  User, LayoutDashboard, Mail, CheckCircle, 
  Users, Flag, Bell, Shield, LogOut, Cog, CreditCard
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

interface SideNavProps {
  isAdmin?: boolean;
}

export function SideNav({ isAdmin = false }: SideNavProps) {
  const location = useLocation();
  const { } = useAuth(); // Auth hook is still needed for context
  const pathname = location.pathname;

  // Determine active section from URL path
  const getActiveSection = (path: string) => {
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = '/discover';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const profileMenuItems = [
    { 
      id: 'profile', 
      label: 'Profile', 
      icon: User, 
      path: '/account',
      active: getActiveSection('/account') && !pathname.includes('/security') && !pathname.includes('/notifications') && !pathname.includes('/billing')
    },
    { 
      id: 'billing', 
      label: 'Billing', 
      icon: CreditCard, 
      path: '/account/billing',
      active: getActiveSection('/account/billing')
    },
    { 
      id: 'security', 
      label: 'Security', 
      icon: Shield, 
      path: '/account/security',
      active: getActiveSection('/account/security')
    },
    { 
      id: 'notifications', 
      label: 'Notifications', 
      icon: Bell, 
      path: '/account/notifications',
      active: getActiveSection('/account/notifications')
    }
  ];

  const adminMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/admin', active: pathname === '/admin' },
    { id: 'invites', label: 'Invites', icon: Mail, path: '/admin/invites', active: getActiveSection('/admin/invites') },
    { id: 'submissions', label: 'Submissions', icon: CheckCircle, path: '/admin/submissions', active: getActiveSection('/admin/submissions') },
    { id: 'users', label: 'Users', icon: Users, path: '/admin/users', active: getActiveSection('/admin/users') },
    { id: 'content', label: 'Content', icon: Flag, path: '/admin/content', active: getActiveSection('/admin/content') },
    { id: 'settings', label: 'Site Settings', icon: Cog, path: '/admin/settings', active: getActiveSection('/admin/settings') }
  ];

  return (
    <>
      {/* Desktop Navigation */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 z-10 md:block hidden">
        <div className="flex flex-col h-full">
          <div className="p-6">
            <h1 className="text-xl font-bold text-[#252525]">
              {pathname.startsWith('/admin') ? 'Admin Dashboard' : 'Account Settings'}
            </h1>
          </div>
          
          <nav className="flex-1 px-4 space-y-1">
            {/* Account section - always visible */}
            <div className="mb-6">
              <h2 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Account
              </h2>
              {profileMenuItems.map((item) => (
                <Link
                  key={item.id}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    item.active
                      ? 'bg-gray-100 text-[#252525]'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-[#252525]'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>

            {/* Admin section - only visible if user is admin */}
            {isAdmin && (
              <div className="mb-6">
                <h2 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Admin
                </h2>
                {adminMenuItems.map((item) => (
                  <Link
                    key={item.id}
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      item.active
                        ? 'bg-gray-100 text-[#252525]'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-[#252525]'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            )}
          </nav>

          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 w-full text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-10 md:hidden">
        <nav className="flex justify-around py-2">
          {profileMenuItems.map((item) => (
            <Link
              key={item.id}
              to={item.path}
              className={`flex flex-col items-center p-2 ${item.active ? 'text-[#252525]' : 'text-gray-500'}`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}

export default SideNav;
