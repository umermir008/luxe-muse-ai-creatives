
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ImageIcon, Trash2, Download, Settings2, Film, Eye, Loader2, UserCircle } from 'lucide-react';
import type { Creation } from '@/types/creations';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/firebase-config';
import { collection, query, orderBy, getDocs, deleteDoc, doc, Timestamp, where } from 'firebase/firestore';

export default function OwnerCreationsPage() {
  const { user, userDoc } = useAuth(); // userDoc contains role
  const [creations, setCreations] = useState<Creation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchCreations = async () => {
      // Owner sees ALL creations, or only their own if preferred. For now, only owner's.
      if (!user || userDoc?.role !== 'owner') {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const creationsRef = collection(db, 'creations');
        // Owner sees their own creations by default. Can be changed to see all if needed.
        const q = query(creationsRef, where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const fetchedCreations: Creation[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          fetchedCreations.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : data.createdAt,
            imageWidth: data.imageWidth || 512,
            imageHeight: data.imageHeight || 512,
          } as Creation);
        });
        setCreations(fetchedCreations);
      } catch (error) {
        console.error("Error fetching owner creations:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not fetch owner creations." });
      } finally {
        setIsLoading(false);
      }
    };

    if (userDoc?.role === 'owner') {
      fetchCreations();
    } else if (userDoc) { // Non-owner landed here somehow
        setIsLoading(false);
    }
  }, [user, userDoc, toast]);

  const handleDeleteCreation = async (creationId: string) => {
    try {
      await deleteDoc(doc(db, 'creations', creationId));
      const updatedCreations = creations.filter(c => c.id !== creationId);
      setCreations(updatedCreations);
      toast({ title: "Creation Deleted", description: "The image has been removed from Firestore." });
    } catch (error) {
      console.error("Error deleting creation:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not delete creation." });
    }
  };

  const handleDownloadImage = async (imageUrl: string, promptText: string) => {
    if (!imageUrl) {
        toast({ variant: 'destructive', title: 'Download Error', description: 'Image URL is missing.' });
        return;
    }
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      const safePrompt = promptText.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      link.download = `luxe_muse_owner_${safePrompt.substring(0,20) || 'creation'}.png`;
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

  if (isLoading) {
    return (
       <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading owner's creations...</p>
      </div>
    );
  }

  if (!user || userDoc?.role !== 'owner') {
     return (
      <div className="text-center py-12">
        <UserCircle className="mx-auto h-24 w-24 text-muted-foreground mb-6" />
        <h2 className="text-3xl font-headline mb-4 text-primary">Access Denied</h2>
        <p className="text-lg text-foreground/80 mb-8 max-w-md mx-auto">
          You must be logged in as an owner to view this page.
        </p>
        <Button asChild size="lg">
          <Link href="/owner-login">Owner Login</Link>
        </Button>
      </div>
    );
  }

  if (creations.length === 0) {
    return (
      <div className="text-center py-12">
        <ImageIcon className="mx-auto h-24 w-24 text-muted-foreground mb-6" />
        <h2 className="text-3xl font-headline mb-4 text-primary">No Creations Yet (Owner)</h2>
        <p className="text-lg text-foreground/80 mb-8 max-w-md mx-auto">
          Start by generating some exclusive AI art!
        </p>
        <Button asChild size="lg">
          <Link href="/owner-dashboard/generate">Generate Your First Masterpiece</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-headline text-primary flex items-center">
            <ImageIcon className="mr-3 h-8 w-8" /> Owner's Creative Portfolio
          </CardTitle>
          <CardDescription className="text-lg text-foreground/80">
            A gallery of your exclusively generated AI masterpieces.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {creations.map((creation) => (
          <Card key={creation.id} className="flex flex-col overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300">
            <Link href={`/owner-dashboard/creations/${creation.id}`} className="block w-full relative overflow-hidden bg-muted" style={{ aspectRatio: `${creation.imageWidth || 1}/${creation.imageHeight || 1}` }}>
              <Image
                src={creation.imageUrl}
                alt={creation.prompt}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                className="object-cover transition-transform duration-300 hover:scale-105"
                data-ai-hint="gallery image owner"
              />
            </Link>
            <CardContent className="p-4 flex-grow space-y-2">
              <p className="text-sm text-muted-foreground">
                Base Prompt: <span className="italic text-foreground/80 line-clamp-2">{creation.prompt}</span>
              </p>
              {creation.enhancedPrompt && (
                 <p className="text-xs text-muted-foreground">
                  Enhanced: <span className="italic text-foreground/70 line-clamp-1">{creation.enhancedPrompt}</span>
                 </p>
              )}
              <div className="flex flex-wrap gap-1">
                {creation.stylePresetName && (
                    <Badge variant="outline" className="text-xs py-0.5 px-1.5 flex items-center gap-1"><Settings2 className="h-3 w-3" />{creation.stylePresetName}</Badge>
                )}
                {creation.aspectRatio && (
                    <Badge variant="secondary" className="text-xs py-0.5 px-1.5 flex items-center gap-1"><Film className="h-3 w-3" />{creation.aspectRatio}</Badge>
                )}
              </div>
            </CardContent>
            <CardFooter className="p-4 border-t border-border flex justify-between items-center">
              <p className="text-xs text-muted-foreground">
                {creation.createdAt ? new Date(creation.createdAt).toLocaleDateString() : 'N/A'}
              </p>
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-primary hover:bg-primary/10"
                  onClick={() => handleDownloadImage(creation.imageUrl, creation.prompt)}
                  aria-label="Download image"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button asChild variant="ghost" size="icon" className="text-primary hover:bg-primary/10" aria-label="View details">
                  <Link href={`/owner-dashboard/creations/${creation.id}`}>
                    <Eye className="h-4 w-4" />
                  </Link>
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" aria-label="Delete image">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete this creation from Firestore. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDeleteCreation(creation.id)}
                        className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
