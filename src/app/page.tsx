
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { ShieldCheck, Users } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-background selection:bg-primary selection:text-primary-foreground">
      <div className="mb-12">
        <Logo />
      </div>
      <h1 className="text-5xl md:text-6xl font-headline mb-6 text-primary">
        Luxe Muse
      </h1>
      <p className="text-xl md:text-2xl text-foreground/80 mb-16 max-w-3xl mx-auto">
        Unlock creative power with AI. Choose your path below.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl w-full">
        <div className="flex flex-col items-center p-8 border border-primary/30 rounded-xl shadow-xl hover:shadow-primary/20 transition-shadow duration-300">
          <ShieldCheck className="w-16 h-16 text-primary mb-6" />
          <h2 className="text-3xl font-headline mb-4 text-primary">Exclusive Owner Access</h2>
          <p className="text-foreground/70 mb-8 text-center">
            Full administrative control and access to all premium AI generation tools and settings.
          </p>
          <Button asChild size="lg" className="w-full sm:w-auto px-10 py-6 text-lg">
            <Link href="/owner-login">Owner Login</Link>
          </Button>
        </div>

        <div className="flex flex-col items-center p-8 border border-border rounded-xl shadow-lg hover:shadow-accent/20 transition-shadow duration-300">
          <Users className="w-16 h-16 text-accent mb-6" />
          <h2 className="text-3xl font-headline mb-4">User Portal</h2>
          <p className="text-foreground/70 mb-8 text-center">
            Explore AI image generation, manage your creations, and experience the future of digital art.
          </p>
          <Button asChild variant="outline" size="lg" className="w-full sm:w-auto px-10 py-6 text-lg">
            <Link href="/auth">Login / Sign Up</Link>
          </Button>
        </div>
      </div>

      <footer className="absolute bottom-8 text-muted-foreground text-sm">
        &copy; {new Date().getFullYear()} Luxe Muse. All rights reserved.
      </footer>
    </main>
  );
}
