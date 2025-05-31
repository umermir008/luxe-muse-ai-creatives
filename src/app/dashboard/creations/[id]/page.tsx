
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, Download, Share2, Settings2, Film, MessageSquare, MinusCircle } from 'lucide-react';
import type { Creation } from '@/types/creations';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/firebase-config';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { cn } from '@/lib/utils'; // For Label helper

// Simplified social media icons
const TwitterIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
    <path d="M23.643 4.937c-.835.37-1.732.62-2.675.733a4.67 4.67 0 0 0 2.048-2.578 9.3 9.3 0 0 1-2.958 1.13 4.66 4.66 0 0 0-7.938 4.25 13.229 13.229 0 0 1-9.602-4.868c-.4.69-.63 1.49-.63 2.342A4.66 4.66 0 0 0 3.96 9.824a4.647 4.647 0 0 1-2.11-.583v.06a4.66 4.66 0 0 0 3.737 4.568 4.692 4.692 0 0 1-2.104.08 4.661 4.661 0 0 0 4.35 3.234 9.348 9.348 0 0 1-5.786 1.995 9.5 9.5 0 0 1-1.112-.065 13.175 13.175 0 0 0 7.14 2.093c8.57 0 13.255-7.098 13.255-13.254 0-.2-.005-.402-.014-.602a9.49 9.49 0 0 0 2.323-2.41z" />
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.99 3.657 9.128 8.438 9.879V14.89H8.078v-2.89h2.36V9.518c0-2.322 1.374-3.623 3.518-3.623 1.006 0 1.87.073 2.123.106v2.587h-1.51c-1.13 0-1.35.536-1.35 1.325v1.735h2.87l-.373 2.89h-2.497v7.005C18.343 21.128 22 16.99 22 12z" />
  </svg>
);


export default function CreationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [creation, setCreation] = useState<Creation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const creationId = params.id as string;

  useEffect(() => {
    const fetchCreation = async () => {
      if (!user || !creationId) {
        setIsLoading(false);
        if (!user) router.push('/login'); // Redirect if not logged in
        return;
      }
      setIsLoading(true);
      try {
        const creationDocRef = doc(db, 'creations', creationId);
        const docSnap = await getDoc(creationDocRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.userId !== user.uid) { // Security check
             toast({ variant: 'destructive', title: 'Access Denied', description: 'You do not have permission to view this creation.' });
             router.push('/dashboard/creations');
             return;
          }
          setCreation({
            id: docSnap.id,
            ...data,
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : data.createdAt,
            imageWidth: data.imageWidth || 512,
            imageHeight: data.imageHeight || 512,
          } as Creation);
        } else {
          toast({ variant: 'destructive', title: 'Error', description: 'Creation not found.' });
          router.push('/dashboard/creations');
        }
      } catch (error) {
        console.error("Error fetching creation details:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch creation details.' });
        router.push('/dashboard/creations');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCreation();
  }, [creationId, user, router, toast]);

  const handleDownloadImage = async () => {
    if (!creation || !creation.imageUrl) return;
    try {
      const response = await fetch(creation.imageUrl);
       if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }
      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      const safePrompt = creation.prompt.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      link.download = `luxe_muse_${safePrompt.substring(0,20) || 'creation'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      toast({ title: 'Download Started', description: 'Your image is downloading.' });
    } catch (error) {
      console.error('Error downloading image:', error);
      toast({ variant: 'destructive', title: 'Download Failed', description: `Could not download image. ${error instanceof Error ? error.message : ''}` });
    }
  };

  const handleShare = (platform: 'twitter' | 'facebook') => {
    if (!creation) return;
    const text = encodeURIComponent(`Check out my AI creation from Luxe Muse: ${creation.prompt}`);
    // For GCS URLs, ensure they are public or use a shortener/page that renders the image if sharing direct image URL is problematic
    const shareableUrl = encodeURIComponent(window.location.href); // Shares link to this detail page

    let shareUrl = '';
    if (platform === 'twitter') {
      shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${shareableUrl}`;
    } else if (platform === 'facebook') {
      shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${shareableUrl}&quote=${text}`;
    }
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading creation details...</p>
      </div>
    );
  }

  if (!creation) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <p className="text-xl text-destructive mb-4">Creation not found or access denied.</p>
        <Button asChild>
          <Link href="/dashboard/creations">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Creations
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <Button variant="outline" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>

      <Card className="shadow-xl overflow-hidden">
         <CardHeader className="p-0"> {/* Removed bg-card-foreground/5 for direct image display */}
          <div className="relative w-full bg-muted" style={{ aspectRatio: `${creation.imageWidth || 1}/${creation.imageHeight || 1}`}}>
            <Image
              src={creation.imageUrl}
              alt={creation.prompt}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 40vw"
              className="object-contain"
              priority
              data-ai-hint="detailed creation"
            />
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div>
            <CardTitle className="text-2xl font-headline text-primary mb-2">
              Creation Details
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Generated on: {creation.createdAt ? new Date(creation.createdAt).toLocaleString() : 'N/A'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground flex items-center"><MessageSquare className="mr-1.5 h-3.5 w-3.5" />Base Prompt</Label>
              <p className="text-base text-foreground/90 italic">{creation.prompt}</p>
            </div>
            {creation.enhancedPrompt && (
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground flex items-center"><MessageSquare className="mr-1.5 h-3.5 w-3.5 text-primary" />Enhanced Prompt</Label>
                <p className="text-base text-foreground/80 italic">{creation.enhancedPrompt}</p>
              </div>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2 items-center">
            {creation.stylePresetName && (
                <Badge variant="outline" className="flex items-center gap-1.5"><Settings2 className="h-3.5 w-3.5 text-primary" />{creation.stylePresetName}</Badge>
            )}
            {creation.aspectRatio && (
                <Badge variant="secondary" className="flex items-center gap-1.5"><Film className="h-3.5 w-3.5 text-primary" />{creation.aspectRatio}</Badge>
            )}
          </div>

          {creation.negativePrompt && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground flex items-center"><MinusCircle className="mr-1.5 h-3.5 w-3.5 text-destructive" />Negative Prompt</Label>
              <p className="text-sm text-foreground/70 italic">{creation.negativePrompt}</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="p-6 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
          <Button onClick={handleDownloadImage} size="lg" disabled={!creation.imageUrl}>
            <Download className="mr-2 h-5 w-5" /> Download Image
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => handleShare('twitter')} aria-label="Share on Twitter">
              <TwitterIcon />
            </Button>
            <Button variant="outline" onClick={() => handleShare('facebook')} aria-label="Share on Facebook">
              <FacebookIcon />
            </Button>
             <Button variant="outline" disabled>
              <Share2 className="mr-2 h-4 w-4" /> More (Soon)
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

// Helper Label component
const Label = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <label className={cn("block text-sm font-medium text-foreground", className)}>
    {children}
  </label>
);
