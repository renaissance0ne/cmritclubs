import { User as FirebaseUser } from 'firebase/auth';

export interface ApprovalStatus {
  director: 'pending' | 'approved' | 'rejected';
  cseHod: 'pending' | 'approved' | 'rejected';
  csmHod: 'pending' | 'approved' | 'rejected';
  csdHod: 'pending' | 'approved' | 'rejected';
  cscHod: 'pending' | 'approved' | 'rejected';
  eceHod: 'pending' | 'approved' | 'rejected';
}

export interface User {
    uid: string;
    email: string;
    displayName?: string;
    role: 'club_leader' | 'admin' | 'college_official';
    officialRole?: 'director' | 'cse_hod' | 'csm_hod' | 'csd_hod' | 'csc_hod' | 'ece_hod';
    status: 'pending' | 'email_verified' | 'approved' | 'rejected';
    rollNo?: string;
    phoneNumber?: string;
    department?: string;
    clubName?: string;
    clubInchargeFaculty?: string;
    yearOfStudy?: string;
    expectedGraduationYear?: number;
    expectedGraduationMonth?: string;
    letterOfProof?: string; // UploadThing URL
    approvals?: ApprovalStatus;
    overallStatus?: 'pending' | 'approved' | 'rejected';
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
    phoneNumber: string;
    clubName: string;
    clubType: 'organizational' | 'independent';
    letterOfProofUrl: string;
    expectedGraduationYear: number;
    expectedGraduationMonth: string;
    status: 'pending_review' | 'approved' | 'rejected';
    submittedAt: Date;
    reviewedAt?: Date;
    reviewedBy?: string;
    rejectionReason?: string;
}