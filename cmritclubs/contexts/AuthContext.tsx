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
import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
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
            try {
                if (firebaseUser) {
                    setFirebaseUser(firebaseUser);

                    // Try to fetch user data from Firestore
                    try {
                        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
                        
                        if (userDoc.exists()) {
                            const userData = userDoc.data() as User & {
                                createdAt: Timestamp | Date;
                                updatedAt: Timestamp | Date;
                            };
                            setUser({
                                ...userData,
                                createdAt: userData.createdAt instanceof Timestamp ? userData.createdAt.toDate() : userData.createdAt || new Date(),
                                updatedAt: userData.updatedAt instanceof Timestamp ? userData.updatedAt.toDate() : userData.updatedAt || new Date(),
                            });
                        } else {
                            // Create initial user document if it doesn't exist
                            await createUserDocument(firebaseUser);
                        }
                    } catch (firestoreError: any) {
                        console.error('Error fetching user document:', firestoreError);
                        
                        // If it's a permission error, try to create the user document
                        if (firestoreError.code === 'permission-denied') {
                            console.log('Permission denied, attempting to create user document...');
                            await createUserDocument(firebaseUser);
                        } else {
                            // For other errors, create a basic user object
                            const basicUser: User = {
                                uid: firebaseUser.uid,
                                email: firebaseUser.email!,
                                displayName: firebaseUser.displayName || '',
                                role: 'club_leader',
                                status: firebaseUser.emailVerified ? 'email_verified' : 'pending',
                                phoneNumber: '',
                                expectedGraduationYear: undefined,
                                expectedGraduationMonth: '',
                                createdAt: new Date(),
                                updatedAt: new Date(),
                            };
                            setUser(basicUser);
                        }
                    }
                } else {
                    setFirebaseUser(null);
                    setUser(null);
                }
            } catch (error) {
                console.error('Error in auth state change:', error);
                setUser(null);
                setFirebaseUser(null);
            } finally {
                setLoading(false);
            }
        });

        return unsubscribe;
    }, []);

    const createUserDocument = async (firebaseUser: FirebaseUser) => {
        const newUser: User = {
            uid: firebaseUser.uid,
            email: firebaseUser.email!,
            displayName: firebaseUser.displayName || '',
            role: 'club_leader',
            status: firebaseUser.emailVerified ? 'email_verified' : 'pending',
            phoneNumber: '',
            expectedGraduationYear: undefined,
            expectedGraduationMonth: '',
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        try {
            await setDoc(doc(db, 'users', firebaseUser.uid), {
                ...newUser,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
            setUser(newUser);
        } catch (error) {
            console.error('Error creating user document:', error);
            // Still set user state to prevent infinite loading
            setUser(newUser);
        }
    };

    const signUp = async (email: string, password: string, userData?: any): Promise<FirebaseUser> => { // Return FirebaseUser
    try {
        const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password); // [cite: 140]
        await firebaseSendEmailVerification(firebaseUser); // [cite: 141]
        
        const newUser = {
            uid: firebaseUser.uid, // [cite: 142]
            email: firebaseUser.email!, // [cite: 142]
            displayName: userData?.displayName || firebaseUser.displayName || '', // [cite: 142-143]
            role: 'club_leader', // [cite: 143]
            status: 'pending', // [cite: 143]
            // ... all other userData fields
            rollNo: userData?.rollNo || '', // [cite: 143-144]
            department: userData?.department || '', // [cite: 144-145]
            clubName: userData?.clubName || '', // [cite: 145]
            clubInchargeFaculty: userData?.clubInchargeFaculty || '', // [cite: 146]
            yearOfStudy: userData?.yearOfStudy || '', // [cite: 147]
            letterOfProof: userData?.letterOfProof || '', // [cite: 148]
            phoneNumber: userData?.phoneNumber || '', // [cite: 149]
            expectedGraduationYear: userData?.expectedGraduationYear || null, // [cite: 150-151]
            expectedGraduationMonth: userData?.expectedGraduationMonth || '', // [cite: 151-152]
            createdAt: serverTimestamp(), // [cite: 152]
            updatedAt: serverTimestamp(), // [cite: 152]
        };
        await setDoc(doc(db, 'users', firebaseUser.uid), newUser); // [cite: 153]

        return firebaseUser; // <-- Return the user object

    } catch (error) {
        console.error('Error signing up:', error); // [cite: 153]
        throw error; // [cite: 154]
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
            provider.setCustomParameters({
                prompt: 'select_account'
            });

            const { user: firebaseUser } = await signInWithPopup(auth, provider);

            // Check if user document exists, create if not
            try {
                const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
                if (!userDoc.exists()) {
                    const newUser = {
                        uid: firebaseUser.uid,
                        email: firebaseUser.email!,
                        displayName: firebaseUser.displayName || '',
                        role: 'club_leader',
                        status: 'email_verified',
                        rollNo: '',
                        department: '',
                        clubName: '',
                        clubInchargeFaculty: '',
                        yearOfStudy: '',
                        letterOfProof: '',
                        phoneNumber: '',
                        expectedGraduationYear: null,
                        expectedGraduationMonth: '',
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp(),
                    };

                    await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
                }
            } catch (error) {
                console.error('Error checking/creating user document:', error);
                // Continue with sign-in even if document creation fails
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

    const getToken = async (): Promise<string | null> => {
        if (firebaseUser) {
            try {
                return await firebaseUser.getIdToken();
            } catch (error) {
                console.error('Error getting Firebase ID token:', error);
                return null;
            }
        }
        return null;
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
        getToken,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};