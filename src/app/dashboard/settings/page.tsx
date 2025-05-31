
'use client';

import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Settings as SettingsIcon, ImageUp, UserCircle, Loader2, CheckCircle } from 'lucide-react';
import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useToast } from '@/hooks/use-toast';
import { storage, db, auth as firebaseAuth } from '@/firebase-config'; 
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc, getDoc } from 'firebase/firestore'; // Changed from setDoc to updateDoc for merging
import { updateProfile } from 'firebase/auth';
import { cn } from '@/lib/utils';
import Link from 'next/link';

// Helper component, can be moved to a shared file if used elsewhere
const UploadIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn("lucide lucide-upload", className)}
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" x2="12" y1="3" y2="15" />
  </svg>
);


export default function SettingsPage() {
  const { user, userDoc, loading: authLoading, loadingRole, refreshUserDoc } = useAuth(); 
  const { toast } = useToast();

  const [displayName, setDisplayName] = useState('');
  const [newProfilePicFile, setNewProfilePicFile] = useState<File | null>(null);
  const [profilePicPreview, setProfilePicPreview] = useState<string | null>(null);
  
  const [isUploadingPic, setIsUploadingPic] = useState(false);
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  useEffect(() => {
    if (user && userDoc) { // Ensure userDoc is also available
      setDisplayName(userDoc.displayName || user.displayName || '');
      setProfilePicPreview(userDoc.photoURL || user.photoURL || null);
      setIsLoadingProfile(false);
    } else if (!authLoading && !loadingRole) {
        setIsLoadingProfile(false); // Stop loading if auth is resolved and no user/userDoc
    }
  }, [user, userDoc, authLoading, loadingRole]);

  const getInitials = (name?: string | null, email?: string | null) => {
    if (name) {
      const names = name.split(' ');
      if (names.length > 1 && names[0] && names[names.length - 1]) {
        return (names[0][0] + names[names.length - 1][0]).toUpperCase();
      }
      return name[0]?.toUpperCase() || 'U';
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return 'U';
  };

  const handleProfilePicFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setNewProfilePicFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfilePicUpload = async () => {
    if (!newProfilePicFile || !user || !firebaseAuth.currentUser) return;
    setIsUploadingPic(true);
    try {
      const storageRef = ref(storage, `profile_pictures/${user.uid}/${newProfilePicFile.name}`);
      const uploadResult = await uploadBytes(storageRef, newProfilePicFile);
      const photoURL = await getDownloadURL(uploadResult.ref);

      await updateProfile(firebaseAuth.currentUser, { photoURL });
      await updateDoc(doc(db, 'users', user.uid), { photoURL }); // Use updateDoc for existing doc
      
      await refreshUserDoc(); // Refresh userDoc in context
      
      setProfilePicPreview(photoURL); 
      setNewProfilePicFile(null); 
      toast({ title: 'Profile Picture Updated', description: 'Your new picture is live.' });
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      toast({ variant: 'destructive', title: 'Upload Failed', description: 'Could not update profile picture.' });
    } finally {
      setIsUploadingPic(false);
    }
  };

  const handleDisplayNameUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !firebaseAuth.currentUser || !displayName.trim()) return;
    
    // Prevent update if name hasn't changed
    const currentAuthDisplayName = firebaseAuth.currentUser.displayName || '';
    const currentUserDocDisplayName = userDoc?.displayName || '';
    if (displayName.trim() === currentAuthDisplayName && displayName.trim() === currentUserDocDisplayName) {
        toast({ title: 'No Changes', description: 'Display name is already set to this value.' });
        return;
    }

    setIsUpdatingName(true);
    try {
      await updateProfile(firebaseAuth.currentUser, { displayName: displayName.trim() });
      await updateDoc(doc(db, 'users', user.uid), { displayName: displayName.trim() }); // Use updateDoc

      await refreshUserDoc(); // Refresh userDoc in context

      toast({ title: 'Display Name Updated', description: 'Your new display name is saved.' });
    } catch (error) {
      console.error("Error updating display name:", error);
      toast({ variant: 'destructive', title: 'Update Failed', description: 'Could not update display name.' });
    } finally {
      setIsUpdatingName(false);
    }
  };

  if (isLoadingProfile || authLoading || loadingRole) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) { // userDoc check is implicitly handled by user check due to auth flow
     return (
      <div className="text-center py-12">
        <UserCircle className="mx-auto h-24 w-24 text-muted-foreground mb-6" />
        <h2 className="text-3xl font-headline mb-4 text-primary">Please Log In</h2>
        <p className="text-lg text-foreground/80 mb-8 max-w-md mx-auto">
          You need to be logged in to manage your settings.
        </p>
        <Button asChild size="lg">
          <Link href="/auth">Login / Sign Up</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-headline text-primary flex items-center">
            <SettingsIcon className="mr-3 h-8 w-8" /> Account Settings
          </CardTitle>
          <CardDescription className="text-lg text-foreground/80">
            Manage your profile information and preferences.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Profile Information</CardTitle>
          <CardDescription>View and update your personal details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <Avatar className="h-24 w-24 border-2 border-primary">
              <AvatarImage src={profilePicPreview || undefined} alt={displayName || user.email || 'User'} />
              <AvatarFallback className="text-3xl bg-muted">
                {getInitials(displayName, user.email)}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2 flex-grow">
              <Label htmlFor="profilePicInput" className={cn(
                  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 cursor-pointer w-full sm:w-auto",
                  isUploadingPic && "opacity-50 cursor-not-allowed"
                )}>
                <ImageUp className="h-4 w-4" />
                Change Picture
                <Input 
                  id="profilePicInput" 
                  type="file" 
                  className="hidden" 
                  accept="image/png, image/jpeg, image/gif"
                  onChange={handleProfilePicFileChange}
                  disabled={isUploadingPic}
                />
              </Label>
              {newProfilePicFile && !isUploadingPic && (
                <Button onClick={handleProfilePicUpload} size="sm" className="mt-2 w-full sm:w-auto">
                  <UploadIcon className="mr-2 h-4 w-4" /> Upload New Picture
                </Button>
              )}
               {isUploadingPic && (
                <Button disabled size="sm" className="mt-2 w-full sm:w-auto">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </Button>
              )}
            </div>
          </div>
          
          <form onSubmit={handleDisplayNameUpdate} className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <div className="flex items-center gap-2">
              <Input 
                id="displayName" 
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)} 
                className="bg-input" 
                disabled={isUpdatingName}
              />
              <Button type="submit" variant="outline" size="icon" disabled={isUpdatingName || displayName === (userDoc?.displayName || user.displayName || '')}>
                {isUpdatingName ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              </Button>
            </div>
          </form>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" type="email" value={user.email || ''} disabled className="bg-input/50" />
          </div>
            
        </CardContent>
        <CardFooter>
           <p className="text-sm text-muted-foreground">
              Theme settings and other preferences will appear here in future updates.
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}

    