// types/auth.ts
export interface User {
    uid: string;
    email: string;
    displayName?: string;
    role: 'club_leader' | 'college_official';
    status: 'email_verified' | 'pending_review' | 'approved' | 'rejected';
    createdAt: Date;
    updatedAt: Date;
    rollNo?: string;
    clubName?: string;
    clubType?: 'organizational' | 'independent';
}

export interface AuthContextType {
    user: User | null;
    firebaseUser: import('firebase/auth').User | null;
    loading: boolean;
    signUp: (email: string, password: string) => Promise<void>;
    signIn: (email: string, password: string) => Promise<void>;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
    sendEmailVerification: () => Promise<void>;
}

export interface ClubApplication {
    id: string;
    uid: string;
    fullName: string;
    email: string;
    rollNo: string;
    clubName: string;
    clubType: 'organizational' | 'independent';
    letterOfProofUrl: string;
    status: 'pending_review' | 'approved' | 'rejected';
    submittedAt: Date;
    reviewedAt?: Date;
    reviewedBy?: string;
    rejectionReason?: string;
}