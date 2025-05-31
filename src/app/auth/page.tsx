
'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, LogIn, UserPlus, ChromeIcon } from 'lucide-react';
import { Logo } from '@/components/logo';
import Link from 'next/link';

export default function AuthPage() {
  const [emailLogin, setEmailLogin] = useState('');
  const [passwordLogin, setPasswordLogin] = useState('');
  const [emailSignup, setEmailSignup] = useState('');
  const [passwordSignup, setPasswordSignup] = useState('');
  const [displayNameSignup, setDisplayNameSignup] = useState('');

  const [isSubmittingLogin, setIsSubmittingLogin] = useState(false);
  const [isSubmittingSignup, setIsSubmittingSignup] = useState(false);
  const [isSubmittingGoogle, setIsSubmittingGoogle] = useState(false);

  const { signInWithEmail, signUpWithEmail, signInWithGoogle, user, loading: authLoading, userDoc, loadingRole } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !loadingRole && user) {
      if (userDoc?.role === 'owner') {
        router.push('/owner-dashboard');
      } else {
        router.push('/dashboard');
      }
    }
  }, [user, authLoading, userDoc, loadingRole, router]);

  const handleEmailLogin = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmittingLogin(true);
    try {
      await signInWithEmail(emailLogin, passwordLogin);
      // Redirect handled by useEffect or AuthContext
      toast({ title: "Login Successful", description: "Welcome back!" });
    } catch (error: any) {
      let errorMessage = "Please check your credentials and try again.";
       if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = "Invalid credentials. Please ensure your email and password are correct.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast({ variant: "destructive", title: "Login Failed", description: errorMessage });
    } finally {
      setIsSubmittingLogin(false);
    }
  };

  const handleEmailSignup = async (e: FormEvent) => {
    e.preventDefault();
    if (!displayNameSignup.trim()) {
        toast({ variant: "destructive", title: "Signup Failed", description: "Display name is required."});
        return;
    }
    setIsSubmittingSignup(true);
    try {
      await signUpWithEmail(emailSignup, passwordSignup, displayNameSignup);
      // Redirect handled by useEffect or AuthContext
      toast({ title: "Signup Successful", description: "Welcome to Luxe Muse!" });
    } catch (error: any) {
      let errorMessage = "Could not create account. Please try again.";
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "This email is already registered. Try logging in.";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "Password is too weak. Please choose a stronger one.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast({ variant: "destructive", title: "Signup Failed", description: errorMessage });
    } finally {
      setIsSubmittingSignup(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsSubmittingGoogle(true);
    try {
      await signInWithGoogle();
      // Redirect handled by useEffect or AuthContext
      toast({ title: "Google Sign-In Successful", description: "Welcome!" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Google Sign-In Failed", description: error.message || "Could not sign in with Google." });
    } finally {
      setIsSubmittingGoogle(false);
    }
  };

  if (authLoading || loadingRole || (!authLoading && !loadingRole && user)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading authentication status...</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md shadow-2xl border-border">
        <CardHeader className="text-center">
          <div className="mx-auto mb-6 w-fit">
            <Logo />
          </div>
          <CardTitle className="text-3xl font-headline text-primary">User Portal</CardTitle>
          <CardDescription className="text-foreground/80">
            Access your account or create a new one to start generating.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login"><LogIn className="mr-2 h-4 w-4" />Login</TabsTrigger>
              <TabsTrigger value="signup"><UserPlus className="mr-2 h-4 w-4" />Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="login" className="mt-6">
              <form onSubmit={handleEmailLogin} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email-login">Email</Label>
                  <Input id="email-login" type="email" placeholder="you@example.com" value={emailLogin} onChange={(e) => setEmailLogin(e.target.value)} required className="bg-input border-border focus:border-primary" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-login">Password</Label>
                  <Input id="password-login" type="password" placeholder="••••••••" value={passwordLogin} onChange={(e) => setPasswordLogin(e.target.value)} required className="bg-input border-border focus:border-primary" />
                </div>
                <Button type="submit" className="w-full" disabled={isSubmittingLogin}>
                  {isSubmittingLogin && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Login
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="signup" className="mt-6">
              <form onSubmit={handleEmailSignup} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="displayName-signup">Display Name</Label>
                  <Input id="displayName-signup" type="text" placeholder="Your Name" value={displayNameSignup} onChange={(e) => setDisplayNameSignup(e.target.value)} required className="bg-input border-border focus:border-primary" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-signup">Email</Label>
                  <Input id="email-signup" type="email" placeholder="you@example.com" value={emailSignup} onChange={(e) => setEmailSignup(e.target.value)} required className="bg-input border-border focus:border-primary" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-signup">Password</Label>
                  <Input id="password-signup" type="password" placeholder="Choose a strong password" value={passwordSignup} onChange={(e) => setPasswordSignup(e.target.value)} required className="bg-input border-border focus:border-primary" />
                </div>
                <Button type="submit" className="w-full" disabled={isSubmittingSignup}>
                  {isSubmittingSignup && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Create Account
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          
          <div className="mt-6 space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>
            <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isSubmittingGoogle}>
              {isSubmittingGoogle ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ChromeIcon className="mr-2 h-5 w-5" />}
              Google
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-center text-center pt-6">
          <p className="text-xs text-muted-foreground">
            By signing up, you agree to our (non-existent yet) Terms of Service.
          </p>
           <Button variant="link" asChild className="text-sm text-muted-foreground mt-2">
                 <Link href="/owner-login">Are you the Owner?</Link>
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
