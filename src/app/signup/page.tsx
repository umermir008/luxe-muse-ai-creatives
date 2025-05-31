// This file is deprecated and its functionality is merged into /src/app/auth/page.tsx
// You can safely delete this file.
// For safety, redirecting to the new auth page if anyone lands here.
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function DeprecatedSignupPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/auth');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="ml-2">Redirecting to authentication page...</p>
    </div>
  );
}
