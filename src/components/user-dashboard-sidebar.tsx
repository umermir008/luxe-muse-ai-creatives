
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { Logo } from '@/components/logo';
import { Sparkles, ImageIcon, Settings, LogOut, UserCircle, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const navItemsUser = [
  { href: '/dashboard', label: 'Home', icon: UserCircle, exact: true }, // User home
  { href: '/dashboard/generate', label: 'Generate Art', icon: Sparkles },
  // { href: '/dashboard/creations', label: 'My Creations', icon: ImageIcon }, // User creations TBD
  // { href: '/dashboard/settings', label: 'My Settings', icon: Settings }, // User settings TBD
];

export function UserDashboardSidebar() {
  const pathname = usePathname();
  const { user, userDoc, signOutUser, loading, loadingRole } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOutUser();
    router.push('/'); // Redirect to main landing page
  };

  const getInitials = (displayName?: string | null, email?: string | null) => {
    if (displayName) {
      const names = displayName.split(' ');
      if (names.length > 1 && names[0] && names[names.length - 1]) {
        return (names[0][0] + names[names.length - 1][0]).toUpperCase();
      }
      return displayName[0]?.toUpperCase() || 'U';
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return 'U';
  };

  return (
    <Sidebar collapsible="icon" variant="sidebar" side="left">
      <SidebarHeader className="items-center justify-between p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2 group-data-[collapsible=icon]:hidden">
          <Logo />
        </div>
         <SidebarTrigger className="md:hidden"/>
      </SidebarHeader>
      <SidebarContent className="flex-1 p-2">
        <SidebarMenu>
          {navItemsUser.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={item.exact ? pathname === item.href : pathname.startsWith(item.href)}
                tooltip={{ children: item.label, side: 'right', className: 'font-body' }}
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-sidebar-border">
        {loading || loadingRole ? (
          <div className="flex items-center justify-center h-10">
             <Loader2 className="h-6 w-6 animate-spin text-sidebar-foreground" />
          </div>
        ) : user && userDoc ? (
          <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
            <Avatar className="h-8 w-8">
              <AvatarImage src={userDoc.photoURL || user.photoURL || undefined} alt={userDoc.displayName || user.displayName || user.email || 'User'} />
              <AvatarFallback>{getInitials(userDoc.displayName || user.displayName, user.email)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col group-data-[collapsible=icon]:hidden">
              <span className="text-sm font-medium text-sidebar-foreground truncate max-w-[120px]">
                {userDoc.displayName || user.displayName || user.email}
              </span>
               <span className="text-xs text-muted-foreground capitalize">{userDoc.role}</span>
            </div>
          </div>
        ) : (
           <UserCircle className="h-8 w-8 text-sidebar-foreground group-data-[collapsible=icon]:mx-auto" />
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:justify-center"
          aria-label="Sign out"
        >
          <LogOut className="h-5 w-5 group-data-[collapsible=icon]:mr-0 mr-2" />
          <span className="group-data-[collapsible=icon]:hidden">Sign Out</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
