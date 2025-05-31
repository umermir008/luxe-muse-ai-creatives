
// This file is deprecated and replaced by /src/app/auth/page.tsx
// For safety, redirecting to the new auth page.
// You can delete this file after confirming the new /auth page works as expected.
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function DeprecatedLoginPage() {
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
