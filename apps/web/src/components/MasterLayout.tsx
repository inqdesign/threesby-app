import React from 'react';
import { ProfileSection } from './ProfileSection';
import { Skeleton } from './ui/skeleton';
import type { Profile } from '../types';

type MasterLayoutProps = {
  profile: Profile;
  isOwnProfile?: boolean;
  onEditProfile?: () => void;
  onSubmit?: () => Promise<void>;
  onUnpublish?: () => Promise<void>;
  onCancelSubmission?: () => Promise<void>;
  picks?: any[];
  leftSideActions?: React.ReactNode;
  rightSideHeader?: React.ReactNode;
  children: React.ReactNode;
  loading?: boolean;
  profileLinkState?: { source: string; profileName?: string };
};

export function MasterLayout({
  profile,
  isOwnProfile = false,
  onEditProfile,
  leftSideActions,
  rightSideHeader,
  children,
  loading = false,
}: MasterLayoutProps) {
  if (loading) {
    return (
      <div className="flex flex-col md:flex-row gap-[60px]">
        <div className="w-full md:w-1/4">
          <div className="px-4 md:px-0 py-4 md:py-0">
            <div className="space-y-4">
              <Skeleton className="h-32 w-32 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        </div>
        <div className="flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-[60px]">
      
      {/* Profile Section */}
      <div className="w-full md:w-1/4">
        <div className="px-4 md:px-0 py-4 md:py-0">
          <ProfileSection profile={profile} isOwnProfile={isOwnProfile} onEditProfile={onEditProfile} />

          {leftSideActions && (
            <div className="mt-6 pt-6 border-t border-border">{leftSideActions}</div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1">
        {rightSideHeader && (
          <div className="sticky top-[65px] bg-background z-20 py-4 border-b border-border mb-8">
            {rightSideHeader}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}