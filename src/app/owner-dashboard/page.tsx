
'use client';

import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Sparkles, ImageIcon, Settings, ShieldAlert } from 'lucide-react';

export default function OwnerDashboardPage() {
  const { userDoc } = useAuth(); // userDoc contains role and other Firestore data

  return (
    <div className="space-y-8">
      <Card className="shadow-lg border-primary/50">
        <CardHeader>
          <CardTitle className="text-3xl font-headline text-primary flex items-center">
            <ShieldAlert className="mr-3 h-8 w-8 text-primary" />
            Owner Dashboard
          </CardTitle>
          <CardDescription className="text-lg text-foreground/80">
            Welcome, {userDoc?.displayName || userDoc?.email || 'Owner'}! Full administrative access.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-foreground/70">
            This is your exclusive control panel for Luxe Muse. Manage AI generation, view all creations, and configure application settings.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-card/50 hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Sparkles className="text-primary h-6 w-6" />
                  <span>Advanced AI Generation</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Access all AI models, style presets, and advanced generation parameters.
                </p>
                <Button asChild>
                  <Link href="/owner-dashboard/generate">Generate Art</Link>
                </Button>
              </CardContent>
            </Card>
            <Card className="bg-card/50 hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <ImageIcon className="text-primary h-6 w-6" />
                  <span>Manage Creations</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  View, manage, and download all generated content.
                </p>
                <Button asChild variant="outline">
                  <Link href="/owner-dashboard/creations">View All Creations</Link>
                </Button>
              </CardContent>
            </Card>
            <Card className="bg-card/50 hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Settings className="text-primary h-6 w-6" />
                  <span>App Settings</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Configure your profile, application defaults, and integrations.
                </p>
                <Button asChild variant="outline">
                  <Link href="/owner-dashboard/settings">Go to Settings</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
       {/* Add more owner-specific widgets or stats here if needed */}
    </div>
  );
}
