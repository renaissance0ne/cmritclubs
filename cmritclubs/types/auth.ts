import { User as FirebaseUser } from 'firebase/auth';

export interface User {
    uid: string;
    email: string;
    displayName?: string;
    role: 'club_leader' | 'admin' | 'college_official';
    status: 'pending' | 'email_verified' | 'approved' | 'rejected';
    // New fields
    rollNo?: string;
    department?: string;
    clubName?: string;
    clubInchargeFaculty?: string;
    yearOfStudy?: string;
    letterOfProof?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface AuthContextType {
    user: User | null;
    firebaseUser: FirebaseUser | null;
    loading: boolean;
    signUp: (email: string, password: string, userData?: any) => Promise<void>;
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