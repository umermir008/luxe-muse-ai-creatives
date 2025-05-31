
'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { OwnerDashboardSidebar } from '@/components/owner-dashboard-sidebar';
import { Loader2, DatabaseZap, ShieldCheck } from 'lucide-react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';

export default function OwnerDashboardLayout({ children }: { children: ReactNode }) {
  const { user, loading, userDoc, loadingRole, refreshUserDoc } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/owner-login'); 
      return;
    }
    if (!loadingRole && user && userDoc?.role !== 'owner') {
      router.replace('/dashboard'); 
      return;
    }
    // Credits for owner are handled by AuthContext (large number)
    // `refreshUserDoc` can be called if needed.
  }, [user, loading, userDoc, loadingRole, router]);

  if (loading || loadingRole) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || userDoc?.role !== 'owner') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="ml-4 text-lg mt-4">Verifying owner access...</p>
      </div>
    );
  }
  
  return (
    <SidebarProvider defaultOpen>
      <OwnerDashboardSidebar />
      <SidebarInset className="flex flex-col">
        <header className="sticky top-0 z-10 flex items-center justify-between h-14 px-4 border-b bg-background/80 backdrop-blur-sm md:hidden">
          <div className="text-lg font-semibold font-headline text-primary">Luxe Muse (Owner)</div>
          <SidebarTrigger />
        </header>
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="absolute top-4 right-4 md:top-6 md:right-8 z-20">
            <Badge variant="default" className="text-sm py-1.5 px-3 shadow bg-primary/90 text-primary-foreground">
              <ShieldCheck className="h-4 w-4 mr-2" />
              Owner Credits: {userDoc?.credits === 999999 ? 'Unlimited' : (userDoc?.credits ?? '...')}
            </Badge>
          </div>
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
