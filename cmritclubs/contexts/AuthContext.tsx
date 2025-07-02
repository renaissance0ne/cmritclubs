'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    User as FirebaseUser,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    sendEmailVerification as firebaseSendEmailVerification,
    GoogleAuthProvider,
    signInWithPopup,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { AuthContextType, User } from '@/types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                setFirebaseUser(firebaseUser);

                // Fetch user data from Firestore
                try {
                    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
                    if (userDoc.exists()) {
                        const userData = userDoc.data() as User;
                        setUser(userData);
                    } else {
                        // Create initial user document if it doesn't exist
                        const newUser: User = {
                            uid: firebaseUser.uid,
                            email: firebaseUser.email!,
                            displayName: firebaseUser.displayName || '',
                            role: 'club_leader', // Default role
                            status: firebaseUser.emailVerified ? 'email_verified' : 'email_verified',
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        };

                        await setDoc(doc(db, 'users', firebaseUser.uid), {
                            ...newUser,
                            createdAt: serverTimestamp(),
                            updatedAt: serverTimestamp(),
                        });

                        setUser(newUser);
                    }
                } catch (error) {
                    console.error('Error fetching user data:', error);
                }
            } else {
                setFirebaseUser(null);
                setUser(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const signUp = async (email: string, password: string, userData?: any) => {
        try {
            const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password);

            // Send email verification
            await firebaseSendEmailVerification(firebaseUser);

            // Create user document in Firestore with additional fields
            const newUser = {
                uid: firebaseUser.uid,
                email: firebaseUser.email!,
                displayName: userData?.displayName || firebaseUser.displayName || '',
                role: 'club_leader',
                status: 'email_verified',
                // Additional fields from form
                rollNo: userData?.rollNo || '',
                department: userData?.department || '',
                clubName: userData?.clubName || '',
                clubInchargeFaculty: userData?.clubInchargeFaculty || '',
                yearOfStudy: userData?.yearOfStudy || '',
                letterOfProof: userData?.letterOfProof || '',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };

            await setDoc(doc(db, 'users', firebaseUser.uid), newUser);

        } catch (error) {
            console.error('Error signing up:', error);
            throw error;
        }
    };

    const signIn = async (email: string, password: string) => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            console.error('Error signing in:', error);
            throw error;
        }
    };

    const signInWithGoogle = async () => {
        try {
            const provider = new GoogleAuthProvider();
            // Force account selection to ensure college email is used
            provider.setCustomParameters({
                prompt: 'select_account'
            });

            const { user: firebaseUser } = await signInWithPopup(auth, provider);

            // Check if user document exists, create if not
            const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
            if (!userDoc.exists()) {
                const newUser = {
                    uid: firebaseUser.uid,
                    email: firebaseUser.email!,
                    displayName: firebaseUser.displayName || '',
                    role: 'club_leader',
                    status: 'email_verified',
                    // Initialize additional fields as empty for Google sign-up
                    rollNo: '',
                    department: '',
                    clubName: '',
                    clubInchargeFaculty: '',
                    yearOfStudy: '',
                    letterOfProof: '',
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                };

                await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
            }
        } catch (error) {
            console.error('Error signing in with Google:', error);
            throw error;
        }
    };

    const signOut = async () => {
        try {
            await firebaseSignOut(auth);
        } catch (error) {
            console.error('Error signing out:', error);
            throw error;
        }
    };

    const sendEmailVerification = async () => {
        if (firebaseUser) {
            try {
                await firebaseSendEmailVerification(firebaseUser);
            } catch (error) {
                console.error('Error sending email verification:', error);
                throw error;
            }
        }
    };

    const value: AuthContextType = {
        user,
        firebaseUser,
        loading,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
        sendEmailVerification,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};