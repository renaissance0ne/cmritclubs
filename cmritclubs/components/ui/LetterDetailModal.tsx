'use client';

import { PermissionLetter } from '@/types/letters';

interface LetterDetailModalProps {
    letter: PermissionLetter | null;
    onClose: () => void;
    isOpen: boolean;
    showActions?: boolean;
    onApprove?: (letterId: string) => void;
    onReject?: (letterId: string) => void;
    onDelete?: (letterId: string) => void;
    updating?: string | null;
    userRole?: string;
    onRollNoApproval?: (letterId: string, department: string, rollNo: string, approval: 'approved' | 'rejected') => void;
}

const departmentOrder = ['cse', 'csm', 'csd', 'frsh', 'ece'];

const officialRoles = {
    director: 'Director',
    dsaa: 'DSAA',
    tpo: 'TPO',
    cseHod: 'CSE HOD',
    csmHod: 'CSM HOD',
    csdHod: 'CSD HOD',
    frshHod: 'Freshman HOD',
    eceHod: 'ECE HOD'
};

export const LetterDetailModal: React.FC<LetterDetailModalProps> = ({
    letter,
    onClose,
    isOpen,
    showActions = false,
    onApprove,
    onReject,
    onDelete,
    updating,
    userRole,
    onRollNoApproval
}) => {
    if (!isOpen || !letter) return null;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved': return 'text-green-600 bg-green-100';
            case 'rejected': return 'text-red-600 bg-red-100';
            case 'pending': return 'text-yellow-600 bg-yellow-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900">Permission Letter Details</h2>
                    <button 
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                    >
                        ×
                    </button>
                </div>
                
                <div className="p-6">
                    <div className="bg-white text-black">
                        <h3 className="text-xl font-bold text-black mb-4">{letter.clubName}</h3>
                        
                        <div className="text-sm mb-4 text-black">
                            <p>To,</p>
                            <p>The Director,</p>
                            <p>CMR Institute of Technology</p>
                            <p>Medchal</p>
                        </div>
                        
                        <p className="text-sm text-black mb-4">
                            Submitted: {letter.createdAt?.toDate().toLocaleDateString()}
                        </p>
                        
                        <p className="mt-4 text-black">
                            <strong>Subject:</strong> {letter.subject}
                        </p>
                        
                        <p className="mt-4 whitespace-pre-wrap text-black">{letter.body}</p>
                        
                        <p className="mt-4 text-black">
                            <strong>Sincerely,</strong><br/>{letter.sincerely}
                        </p>

                        {/* Roll Numbers Section */}
                        <div className="mt-6">
                            <h4 className="font-semibold text-black mb-2">Roll Numbers for Approval:</h4>
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-2">
                                {departmentOrder.map(dept => {
                                    const rns = letter.rollNos[dept as keyof typeof letter.rollNos];
                                    if (!rns) return null;
                                    return (
                                        <div key={dept}>
                                            <h5 className="text-sm font-bold capitalize text-black">
                                                {dept === 'frsh' ? 'Freshman' : dept}
                                            </h5>
                                            <ul className="text-xs list-inside space-y-1 text-black">
                                                {rns.split('\n').filter(rn => rn.trim()).map(rn => (
                                                    <li key={rn} className="flex items-center justify-between">
                                                        <span>{rn}</span>
                                                        {userRole === `${dept}_hod` && letter.status === 'pending' && onRollNoApproval && (
                                                            <div className="flex space-x-1">
                                                                <button 
                                                                    onClick={() => onRollNoApproval(letter.id, dept, rn, 'approved')} 
                                                                    disabled={updating === `${letter.id}-${rn}`} 
                                                                    className="text-green-500 disabled:opacity-50 hover:text-green-700"
                                                                >
                                                                    ✓
                                                                </button>
                                                                <button 
                                                                    onClick={() => onRollNoApproval(letter.id, dept, rn, 'rejected')} 
                                                                    disabled={updating === `${letter.id}-${rn}`} 
                                                                    className="text-red-500 disabled:opacity-50 hover:text-red-700"
                                                                >
                                                                    ✗
                                                                </button>
                                                            </div>
                                                        )}
                                                        <span className={`text-xs font-semibold ${
                                                            letter.rollNoApprovals?.[dept]?.[rn] === 'approved' 
                                                                ? 'text-green-600' 
                                                                : letter.rollNoApprovals?.[dept]?.[rn] === 'rejected' 
                                                                    ? 'text-red-600' 
                                                                    : 'text-gray-400'
                                                        }`}>
                                                            {letter.rollNoApprovals?.[dept]?.[rn] || 'Pending'}
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Approval Status Section */}
                        <div className="mt-6 pt-4 border-t">
                            <h4 className="text-md font-semibold text-gray-700 mb-2">Approval Status</h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2 text-sm">
                                {Object.entries(letter.approvals).map(([key, status]) => (
                                    <div key={key} className="flex justify-between">
                                        <span>{officialRoles[key as keyof typeof officialRoles]}:</span>
                                        <span className={`font-medium ${getStatusColor(status)} px-2 rounded`}>
                                            {status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* HOD Roll Number Approvals */}
                        {letter.rollNoApprovals && Object.keys(letter.rollNoApprovals).length > 0 && (
                            <div className="mt-4 pt-4 border-t">
                                <h4 className="text-md font-semibold text-gray-700 mb-2">HOD Roll Number Approvals</h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {Object.entries(letter.rollNoApprovals).map(([dept, approvals]) =>
                                        Object.keys(approvals).length > 0 && (
                                            <div key={dept}>
                                                <h5 className="font-bold capitalize">{dept}</h5>
                                                <ul className="list-disc list-inside text-xs">
                                                    {Object.entries(approvals).map(([rollNo, status]) => (
                                                        <li key={rollNo}>
                                                            {rollNo}: <span className={`font-semibold ${status === 'approved' ? 'text-green-600' : 'text-red-600'}`}>
                                                                {status}
                                                            </span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Action Buttons */}
                {showActions && (
                    <div className="sticky bottom-0 bg-gray-50 border-t p-4">
                        <div className="flex justify-between items-center">
                            {letter.status === 'pending' && onApprove && onReject && (
                                <div className="flex space-x-2">
                                    <button 
                                        onClick={() => onApprove(letter.id)} 
                                        disabled={updating === letter.id} 
                                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm disabled:opacity-50"
                                    >
                                        Approve Letter
                                    </button>
                                    <button 
                                        onClick={() => onReject(letter.id)} 
                                        disabled={updating === letter.id} 
                                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm disabled:opacity-50"
                                    >
                                        Reject Letter
                                    </button>
                                </div>
                            )}
                            
                            {onDelete && (
                                <button 
                                    onClick={() => onDelete(letter.id)} 
                                    className="text-red-500 hover:text-red-700 text-sm px-3 py-1 border border-red-300 rounded"
                                >
                                    Delete Letter
                                </button>
                            )}
                            
                            <button 
                                onClick={onClose}
                                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};