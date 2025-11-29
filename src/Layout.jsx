import React from 'react';
import AppShell from '@/components/layout/AppShell';
import { UserProgressProvider, useUserProgress } from '@/components/UserProgressContext';

function LayoutContent({ children }) {
  const { user, progress, loading } = useUserProgress();

  if (loading) {
    return (
        <div className="min-h-screen bg-[#011623] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#0AD9DC]"></div>
        </div>
    );
  }

  return (
    <AppShell user={user} userProgress={progress}>
      {children}
    </AppShell>
  );
}

export default function Layout({ children }) {
  return (
    <UserProgressProvider>
      <LayoutContent>{children}</LayoutContent>
    </UserProgressProvider>
  );
}