import React, { useState, useEffect } from 'react';
import AppShell from '@/components/layout/AppShell';
import { base44 } from '@/api/base44Client';
import { useLocation } from 'react-router-dom';

export default function Layout({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (e) {
        // Not logged in
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkUser();
  }, [location.pathname]); // Re-check on navigation

  if (loading) {
    return (
        <div className="min-h-screen bg-[#011623] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#0AD9DC]"></div>
        </div>
    );
  }

  return (
    <AppShell user={user}>
      {children}
    </AppShell>
  );
}