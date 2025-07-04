import { Timestamp } from 'firebase/firestore';

export interface PermissionLetter {
    id: string;
    uid: string;
    clubName: string;
    date: Timestamp;
    subject: string;
    body: string;
    sincerely: string;
    rollNos: {
        cse: string;
        csm: string;
        csd: string;
        csc: string;
        ece: string;
    };
    status: 'pending' | 'approved' | 'rejected';
    approvals: {
        director: 'pending' | 'approved' | 'rejected';
        cseHod: 'pending' | 'approved' | 'rejected';
        csmHod: 'pending' | 'approved' | 'rejected';
        csdHod: 'pending' | 'approved' | 'rejected';
        cscHod: 'pending' | 'approved' | 'rejected';
        eceHod: 'pending' | 'approved' | 'rejected';
    };
    rollNoApprovals?: {
        [department: string]: {
            [rollNo: string]: 'approved' | 'rejected';
        }
    };
    createdAt: Timestamp;
    updatedAt: Timestamp;
}