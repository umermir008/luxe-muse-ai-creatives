
'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ShieldCheck } from 'lucide-react';
import { Logo } from '@/components/logo';
import Link from 'next/link';

export default function OwnerLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signInWithEmail, user, loading: authLoading, userDoc, loadingRole } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !loadingRole && user && userDoc?.role === 'owner') {
      router.push('/owner-dashboard');
    } else if (!authLoading && !loadingRole && user && userDoc?.role !== 'owner') {
      // If a non-owner somehow lands here and is logged in, send to user dashboard
      router.push('/dashboard');
    }
  }, [user, authLoading, userDoc, loadingRole, router]);

  const handleOwnerLogin = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const loggedInUser = await signInWithEmail(email, password);
      // Role check will happen in AuthContext and layouts, redirect accordingly
      if (loggedInUser) {
         // AuthContext now handles role fetching. Redirect logic in useEffect or layouts.
        toast({ title: "Login Attempted", description: "Verifying owner credentials..." });
      } else {
        throw new Error("Login failed");
      }
    } catch (error: any) {
      let errorMessage = "Please check your credentials and try again.";
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = "Invalid credentials for owner account.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast({
        variant: "destructive",
        title: "Owner Login Failed",
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || loadingRole || (!authLoading && !loadingRole && user && userDoc?.role === 'owner')) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Verifying owner status...</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md shadow-2xl border-primary/30">
        <CardHeader className="text-center">
          <div className="mx-auto mb-6 w-fit">
            <Logo />
          </div>
          <div className="flex items-center justify-center text-primary mb-3">
            <ShieldCheck className="w-8 h-8 mr-2" />
            <CardTitle className="text-3xl font-headline">Owner Login</CardTitle>
          </div>
          <CardDescription className="text-foreground/80">
            Exclusive access for application administrator.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleOwnerLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Owner Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="owner@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-input border-border focus:border-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Owner Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-input border-border focus:border-primary"
              />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Login as Owner
            </Button>
          </form>
        </CardContent>
        <CardContent className="mt-4 text-center">
            <Button variant="link" asChild className="text-sm text-muted-foreground">
                 <Link href="/auth">Not the owner? Go to User Portal</Link>
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}
