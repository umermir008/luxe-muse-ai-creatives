
'use client';

import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Sparkles, ImageIcon } from 'lucide-react';

export default function DashboardPage() {
  const { userDoc } = useAuth();

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-headline text-primary">
            Welcome, {userDoc?.displayName || userDoc?.email || 'Creator'}!
          </CardTitle>
          <CardDescription className="text-lg text-foreground/80">
            This is your creative hub. What masterpiece will you craft today?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-foreground/70">
            Luxe Muse empowers you to generate stunning visuals using the power of AI, refined with a touch of luxury.
            Explore the tools, manage your creations, and let your imagination soar.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-card/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="text-primary h-6 w-6" />
                  <span>Generate New Art</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Bring your ideas to life. Use our AI image generator with style presets to create unique visuals.
                </p>
                <Button asChild>
                  <Link href="/dashboard/generate">Start Generating</Link>
                </Button>
              </CardContent>
            </Card>
            <Card className="bg-card/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="text-primary h-6 w-6" />
                  <span>View Your Creations</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Revisit your generated masterpieces, manage your portfolio, and find inspiration.
                </p>
                <Button asChild variant="outline" disabled> {/* User creations page TBD or limited */}
                  <Link href="#">My Creations (Soon)</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
