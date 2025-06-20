
import { Outlet } from 'react-router-dom';
import { SideNav } from './SideNav';

export function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* SideNav will always be visible */}
      <SideNav isAdmin={true} />
      
      {/* Main content area */}
      <div className="ml-64 flex-1 p-8">
        <Outlet />
      </div>
    </div>
  );
}
