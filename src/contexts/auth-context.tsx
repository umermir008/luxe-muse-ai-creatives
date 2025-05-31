
'use client';

import type { User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode, Dispatch, SetStateAction, useCallback } from 'react';
import {
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  AuthError,
} from 'firebase/auth';
import { auth, db } from '@/firebase-config';
import { doc, getDoc, setDoc, serverTimestamp, Timestamp, updateDoc, increment } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

const DEFAULT_USER_CREDITS = 100;
const OWNER_CREDITS = 999999; // A large number to represent "unlimited" for owner

export interface UserDocument {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: 'owner' | 'user';
  photoURL?: string | null;
  createdAt: Timestamp | Date;
  credits: number;
}

interface AuthContextType {
  user: User | null;
  setUser: Dispatch<SetStateAction<User | null>>;
  userDoc: UserDocument | null;
  loading: boolean;
  loadingRole: boolean;
  signInWithGoogle: () => Promise<User | null>;
  signUpWithEmail: (email: string, pass: string, displayName: string) => Promise<User | null>;
  signInWithEmail: (email: string, pass: string) => Promise<User | null>;
  signOutUser: () => Promise<void>;
  refreshUserDoc: () => Promise<void>;
  consumeCredits: (amount: number) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userDoc, setUserDoc] = useState<UserDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingRole, setLoadingRole] = useState(true);
  const router = useRouter();

  const OWNER_UID = process.env.NEXT_PUBLIC_OWNER_UID;

  const fetchUserDocument = useCallback(async (uid: string): Promise<UserDocument | null> => {
    const userDocRef = doc(db, 'users', uid);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserDocument;
    }
    return null;
  }, []);

  const refreshUserDoc = useCallback(async () => {
    if (user) {
      setLoadingRole(true);
      const fetchedDoc = await fetchUserDocument(user.uid);
      setUserDoc(fetchedDoc);
      setLoadingRole(false);
    }
  }, [user, fetchUserDocument]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setLoadingRole(true);
        let fetchedDoc = await fetchUserDocument(currentUser.uid);
        
        // If doc doesn't exist, it might be the first login for owner or a new user
        if (!fetchedDoc) {
            const isOwner = currentUser.uid === OWNER_UID;
            const newUserDocData: UserDocument = {
                uid: currentUser.uid,
                email: currentUser.email,
                displayName: currentUser.displayName || currentUser.email?.split('@')[0] || (isOwner ? 'Owner' : 'New User'),
                photoURL: currentUser.photoURL,
                role: isOwner ? 'owner' : 'user',
                createdAt: serverTimestamp() as Timestamp,
                credits: isOwner ? OWNER_CREDITS : DEFAULT_USER_CREDITS,
            };
            await setDoc(doc(db, 'users', currentUser.uid), newUserDocData);
            fetchedDoc = newUserDocData;
        } else if (currentUser.uid === OWNER_UID && fetchedDoc.role !== 'owner') {
            // Ensure owner UID always has owner role if doc exists but role is wrong
            await updateDoc(doc(db, 'users', currentUser.uid), { role: 'owner', credits: OWNER_CREDITS });
            fetchedDoc.role = 'owner';
            fetchedDoc.credits = OWNER_CREDITS;
        }

        setUserDoc(fetchedDoc);
        setLoadingRole(false);
      } else {
        setUserDoc(null);
        setLoadingRole(false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [fetchUserDocument, OWNER_UID]);


  const commonUserSetup = async (firebaseUser: User, defaultDisplayName?: string): Promise<UserDocument> => {
    let fetchedDoc = await fetchUserDocument(firebaseUser.uid);
    if (!fetchedDoc) {
      const isOwner = firebaseUser.uid === OWNER_UID;
      const newUserDocData: UserDocument = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || defaultDisplayName || firebaseUser.email?.split('@')[0] || (isOwner ? 'Owner' : 'New User'),
        photoURL: firebaseUser.photoURL,
        role: isOwner ? 'owner' : 'user',
        createdAt: serverTimestamp() as Timestamp,
        credits: isOwner ? OWNER_CREDITS : DEFAULT_USER_CREDITS,
      };
      await setDoc(doc(db, 'users', firebaseUser.uid), newUserDocData);
      fetchedDoc = newUserDocData;
    } else if (firebaseUser.uid === OWNER_UID && (fetchedDoc.role !== 'owner' || fetchedDoc.credits < OWNER_CREDITS)) {
        // Ensure owner always has owner role and high credits if doc exists
        const updates: Partial<UserDocument> = { role: 'owner' };
        if (fetchedDoc.credits < OWNER_CREDITS) {
            updates.credits = OWNER_CREDITS;
        }
        await updateDoc(doc(db, 'users', firebaseUser.uid), updates);
        fetchedDoc = { ...fetchedDoc, ...updates } as UserDocument;
    }
    setUserDoc(fetchedDoc);
    return fetchedDoc;
  };


  const signInWithGoogle = async (): Promise<User | null> => {
    setLoading(true);
    setLoadingRole(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      setUser(result.user);
      await commonUserSetup(result.user);
      return result.user;
    } catch (error) {
      console.error("Google sign-in error:", error);
      return null;
    } finally {
      setLoading(false);
      setLoadingRole(false);
    }
  };
  
  const signUpWithEmail = async (email: string, pass: string, displayName: string): Promise<User | null> => {
    setLoading(true);
    setLoadingRole(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(userCredential.user, { displayName });
      
      const firebaseUser = userCredential.user;
      const isOwner = firebaseUser.uid === OWNER_UID;

      const newUserDocData: UserDocument = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: displayName,
        photoURL: firebaseUser.photoURL,
        role: isOwner ? 'owner' : 'user', // Should default to 'user' unless UID matches owner
        createdAt: serverTimestamp() as Timestamp,
        credits: isOwner ? OWNER_CREDITS : DEFAULT_USER_CREDITS,
      };
      await setDoc(doc(db, 'users', firebaseUser.uid), newUserDocData);
      
      setUser(firebaseUser);
      setUserDoc(newUserDocData);
      return firebaseUser;
    } catch (error) {
      console.error("Email sign-up error:", error);
      throw error as AuthError; 
    } finally {
      setLoading(false);
      setLoadingRole(false);
    }
  };

  const signInWithEmail = async (email: string, pass: string): Promise<User | null> => {
    setLoading(true);
    setLoadingRole(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      setUser(userCredential.user);
      await commonUserSetup(userCredential.user);
      return userCredential.user;
    } catch (error) {
      console.error("Email sign-in error:", error);
      throw error as AuthError; 
    } finally {
      setLoading(false);
      setLoadingRole(false);
    }
  };

  const signOutUser = async () => {
    setLoading(true);
    setLoadingRole(true);
    try {
      await signOut(auth);
      setUser(null);
      setUserDoc(null);
      router.push('/'); 
    } catch (error) {
      console.error("Sign-out error:", error);
    } finally {
      setLoading(false);
      setLoadingRole(false);
    }
  };

  const consumeCredits = async (amount: number): Promise<boolean> => {
    if (!user || !userDoc) return false;
    if (userDoc.role === 'owner') { // Owner has unlimited credits
        await refreshUserDoc(); // Refresh to show their "unlimited" status potentially
        return true;
    }
    if (userDoc.credits < amount) return false;

    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        credits: increment(-amount)
      });
      await refreshUserDoc(); // Refresh userDoc to get new credit count
      return true;
    } catch (error) {
      console.error("Error consuming credits:", error);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, userDoc, loading, loadingRole, signInWithGoogle, signUpWithEmail, signInWithEmail, signOutUser, refreshUserDoc, consumeCredits }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
