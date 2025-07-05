'use client';

import React from 'react';
import { PermissionLetter } from '@/types/letters';

interface LetterModalProps {
    letter: PermissionLetter | null;
    isOpen: boolean;
    onClose: () => void;
    isOfficialView?: boolean;
    onApprove?: (letterId: string) => void;
    onReject?: (letterId: string) => void;
    onRollNoApproval?: (letterId: string, dept: string, rollNo: string, approval: 'approved' | 'rejected') => void;
    userRole?: string;
    filter?: 'pending' | 'approved' | 'rejected';
    updating?: string | null;
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

export const LetterModal: React.FC<LetterModalProps> = ({
    letter,
    isOpen,
    onClose,
    isOfficialView = false,
    onApprove,
    onReject,
    onRollNoApproval,
    userRole,
    filter,
    updating
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">Permission Letter Details</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700 text-xl font-bold"
                        >
                            ×
                        </button>
                    </div>

                    {/* Letter Content */}
                    <div className="space-y-6">
                        {/* Letter Header */}
                        <div className="text-sm text-gray-600 border-b pb-4">
                            <p>To,</p>
                            <p>The Director,</p>
                            <p>CMR Institute of Technology</p>
                            <p>Medchal</p>
                        </div>

                        {/* Club and Subject Info */}
                        <div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">{letter.clubName}</h3>
                            <p className="text-sm text-gray-600 mb-2">
                                Submitted: {letter.createdAt?.toDate().toLocaleDateString()}
                            </p>
                            <p className="text-gray-800 mb-4">
                                <strong>Subject:</strong> {letter.subject}
                            </p>
                        </div>

                        {/* Letter Body */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="whitespace-pre-wrap text-gray-800">{letter.body}</p>
                        </div>

                        {/* Signature */}
                        <div className="text-gray-800">
                            <p><strong>Sincerely,</strong></p>
                            <p>{letter.sincerely}</p>
                        </div>

                        {/* Roll Numbers Section */}
                        {letter.rollNos && (
                            <div className="border-t pt-4">
                                <h4 className="font-semibold text-gray-800 mb-3">Roll Numbers for Approval:</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                    {departmentOrder.map(dept => {
                                        const rns = letter.rollNos[dept as keyof typeof letter.rollNos];
                                        if (!rns) return null;
                                        return (
                                            <div key={dept} className="bg-gray-50 p-3 rounded-lg">
                                                <h5 className="text-sm font-bold capitalize text-gray-800 mb-2">
                                                    {dept === 'frsh' ? 'Freshman' : dept}
                                                </h5>
                                                <ul className="text-xs space-y-1">
                                                    {rns.split('\n').filter(rn => rn.trim()).map(rn => (
                                                        <li key={rn} className="flex items-center justify-between">
                                                            <span className="text-gray-700">{rn}</span>
                                                            {isOfficialView && userRole === `${dept}_hod` && filter === 'pending' && onRollNoApproval && (
                                                                <div className="flex space-x-1">
                                                                    <button
                                                                        onClick={() => onRollNoApproval(letter.id, dept, rn, 'approved')}
                                                                        disabled={updating === `${letter.id}-${rn}`}
                                                                        className="text-green-500 hover:text-green-700 disabled:opacity-50"
                                                                    >
                                                                        ✓
                                                                    </button>
                                                                    <button
                                                                        onClick={() => onRollNoApproval(letter.id, dept, rn, 'rejected')}
                                                                        disabled={updating === `${letter.id}-${rn}`}
                                                                        className="text-red-500 hover:text-red-700 disabled:opacity-50"
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
                        )}

                        {/* Approval Status */}
                        {letter.approvals && (
                            <div className="border-t pt-4">
                                <h4 className="font-semibold text-gray-800 mb-3">Approval Status</h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {Object.entries(letter.approvals).map(([key, status]) => (
                                        <div key={key} className="flex justify-between items-center">
                                            <span className="text-gray-700">{officialRoles[key as keyof typeof officialRoles]}:</span>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                                                {status.toUpperCase()}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* HOD Roll Number Approvals */}
                        {letter.rollNoApprovals && Object.keys(letter.rollNoApprovals).length > 0 && (
                            <div className="border-t pt-4">
                                <h4 className="font-semibold text-gray-800 mb-3">HOD Roll Number Approvals</h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {Object.entries(letter.rollNoApprovals).map(([dept, approvals]) =>
                                        Object.keys(approvals).length > 0 && (
                                            <div key={dept} className="bg-gray-50 p-3 rounded-lg">
                                                <h5 className="font-bold capitalize text-gray-800 mb-2">{dept}</h5>
                                                <ul className="text-xs space-y-1">
                                                    {Object.entries(approvals).map(([rollNo, status]) => (
                                                        <li key={rollNo} className="flex justify-between">
                                                            <span className="text-gray-700">{rollNo}:</span>
                                                            <span className={`font-semibold ${
                                                                status === 'approved' ? 'text-green-600' : 'text-red-600'
                                                            }`}>
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

                        {/* Action Buttons for Officials */}
                        {isOfficialView && filter === 'pending' && !userRole?.includes('hod') && onApprove && onReject && (
                            <div className="border-t pt-4 flex space-x-4">
                                <button
                                    onClick={() => onApprove(letter.id)}
                                    disabled={updating === letter.id}
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md disabled:opacity-50"
                                >
                                    {updating === letter.id ? 'Approving...' : 'Approve Letter'}
                                </button>
                                <button
                                    onClick={() => onReject(letter.id)}
                                    disabled={updating === letter.id}
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md disabled:opacity-50"
                                >
                                    {updating === letter.id ? 'Rejecting...' : 'Reject Letter'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};