import { User as FirebaseUser } from 'firebase/auth';

export interface ApprovalStatus {
  director: 'pending' | 'approved' | 'rejected';
  dsaa: 'pending' | 'approved' | 'rejected'; // Added
  tpo: 'pending' | 'approved' | 'rejected'; // Added
  cseHod: 'pending' | 'approved' | 'rejected';
  csmHod: 'pending' | 'approved' | 'rejected';
  csdHod: 'pending' | 'approved' | 'rejected';
  frshHod: 'pending' | 'approved' | 'rejected'; // Renamed
  eceHod: 'pending' | 'approved' | 'rejected';
}

export interface User {
    uid: string;
    email: string;
    displayName?: string;
    role: 'club_leader' | 'admin' | 'college_official';
    officialRole?: 'director' | 'dsaa' | 'tpo' | 'cse_hod' | 'csm_hod' | 'csd_hod' | 'frsh_hod' | 'ece_hod'; // Updated
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
    signUp: (email: string, password: string, userData?: any) => Promise<FirebaseUser>; // Changed to return FirebaseUser
    signIn: (email: string, password: string) => Promise<void>;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
    sendEmailVerification: () => Promise<void>;
    getToken: () => Promise<string | null>;
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
    status: 'pending' | 'approved' | 'rejected';
    submittedAt: Date;
    reviewedAt?: Date;
    reviewedBy?: string;
    rejectionReason?: string;
}