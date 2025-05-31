
'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { UserDashboardSidebar } from '@/components/user-dashboard-sidebar';
import { Loader2, DatabaseZap } from 'lucide-react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, loading, userDoc, loadingRole, refreshUserDoc } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/auth'); 
      return;
    }
    // This check is important: if a user document exists and the role is owner,
    // they should not be on the regular user dashboard.
    if (!loadingRole && user && userDoc?.role === 'owner') {
      router.replace('/owner-dashboard'); 
      return;
    }
    // Initial credits load handled by AuthContext, this effect can re-sync if needed
    // For instance, if credits were updated by another tab, this would not auto-update
    // without a more sophisticated global state or listeners.
    // The `refreshUserDoc` can be called strategically if needed.

  }, [user, loading, userDoc, loadingRole, router]);

  if (loading || loadingRole) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || userDoc?.role === 'owner') {
     return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="ml-4 text-lg mt-4">Verifying user access...</p>
      </div>
    );
  }
  
  return (
    <SidebarProvider defaultOpen>
      <UserDashboardSidebar />
      <SidebarInset className="flex flex-col">
        <header className="sticky top-0 z-10 flex items-center justify-between h-14 px-4 border-b bg-background/80 backdrop-blur-sm md:hidden">
          <div className="text-lg font-semibold font-headline text-primary">Luxe Muse</div>
          <SidebarTrigger />
        </header>
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
           <div className="absolute top-4 right-4 md:top-6 md:right-8 z-20">
            <Badge variant="secondary" className="text-sm py-1.5 px-3 shadow">
              <DatabaseZap className="h-4 w-4 mr-2 text-primary" />
              Credits: {userDoc?.credits ?? '...'}
            </Badge>
          </div>
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
