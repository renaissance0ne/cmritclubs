'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useAuthenticatedUpload } from '@/hooks/useAuthenticatedUpload';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { User as FirebaseUser } from 'firebase/auth';
import { uploadFiles } from '@/lib/uploadthing';

export const SignUpForm: React.FC = () => {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [rollNo, setRollNo] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [letterOfProof, setLetterOfProof] = useState<File | null>(null);
    const [department, setDepartment] = useState('');
    const [clubName, setClubName] = useState('');
    const [clubInchargeFaculty, setClubInchargeFaculty] = useState('');
    const [yearOfStudy, setYearOfStudy] = useState('');
    const [expectedGraduationYear, setExpectedGraduationYear] = useState('');
    const [expectedGraduationMonth, setExpectedGraduationMonth] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [uploading, setUploading] = useState(false);
    const { signUp, signInWithGoogle } = useAuth();
    const router = useRouter();

    // Use authenticated UploadThing hook
    const { startUpload } = useAuthenticatedUpload("proofOfLeadership", {
        onClientUploadComplete: (res) => {
            console.log("Files uploaded successfully:", res);
        },
        onUploadError: (error) => {
            console.error("Upload error:", error);
            setError("Failed to upload file: " + error.message);
        },
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setLetterOfProof(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Validation
            if (password !== confirmPassword) {
                throw new Error('Passwords do not match');
            }

            if (password.length < 6) {
                throw new Error('Password must be at least 6 characters');
            }

            if (!email.includes('.edu') && !email.includes('college')) {
                throw new Error('Please use your official college email address');
            }

            if (!fullName.trim()) {
                throw new Error('Full name is required');
            }

            if (!rollNo.trim()) {
                throw new Error('Roll number is required');
            }

            if (!phoneNumber.trim()) {
                throw new Error('Phone number is required');
            }

            const cleanPhone = phoneNumber.replace(/[\s\-()]/g, ''); // Remove spaces, dashes, parentheses
            if (!/^(\+91)?[6-9]\d{9}$/.test(cleanPhone)) {
                throw new Error('Please enter a valid 10-digit phone number (optionally with +91 prefix)');
            }

            if (!department.trim()) {
                throw new Error('Department is required');
            }

            if (!clubName.trim()) {
                throw new Error('Club name is required');
            }

            if (!clubInchargeFaculty.trim()) {
                throw new Error('Club incharge faculty name is required');
            }

            if (!yearOfStudy) {
                throw new Error('Year of study is required');
            }

            if (!expectedGraduationYear) {
                throw new Error('Expected graduation year is required');
            }

            if (!expectedGraduationMonth) {
                throw new Error('Expected graduation month is required');
            }

            if (!letterOfProof) {
                setError('Letter of proof is required');
                setLoading(false);
                return;
            }

            // Upload file to UploadThing
            try {
                const userData = {
                    displayName: fullName.trim(),
                    email: email.trim(),
                    rollNo: rollNo.trim(),
                    phoneNumber: phoneNumber.trim(),
                    department: department.trim(),
                    clubName: clubName.trim(),
                    clubInchargeFaculty: clubInchargeFaculty.trim(),
                    yearOfStudy: yearOfStudy,
                    expectedGraduationYear: parseInt(expectedGraduationYear),
                    expectedGraduationMonth: expectedGraduationMonth,
                    // We leave letterOfProof empty for now
                    letterOfProof: '',
                    approvals: {
                        director: 'pending',
                        dsaa: 'pending',
                        tpo: 'pending',
                        cseHod: 'pending',
                        csmHod: 'pending',
                        csdHod: 'pending',
                        frshHod: 'pending',
                        eceHod: 'pending'
                    },
                    overallStatus: 'pending'
                };

                // --- Step 1: Create the user. It now returns the new user object ---
                const newFirebaseUser: FirebaseUser = await signUp(email, password, userData);

                // --- Step 2: Get token directly from the returned user object ---
                const token = await newFirebaseUser.getIdToken();

                // --- Step 3: Upload the file using the token ---
                setUploading(true);

                // Fixed: Use startUpload instead of uploadFiles
                const uploadResult = await uploadFiles("proofOfLeadership", {
                    files: [letterOfProof],
                    headers: {
                        'Authorization': `Bearer ${token}`, // Pass the token manually
                    },
                });

                setUploading(false);

                if (!uploadResult || uploadResult.length === 0) {
                    throw new Error('Failed to upload file');
                }

                // --- Step 4: Update the user's document with the file URL ---
                // Note: Your existing onUploadComplete in api/uploadthing/core.ts also does this.
                // This just ensures it's set correctly.
                console.log("Upload complete, user document should be updated by onUploadComplete.");

                setSuccess(true);

            } catch (error: any) {
                if (error.code === 'auth/email-already-in-use') {
                    setError('An account with this email already exists. Please sign in instead.');
                } else if (error.code === 'auth/network-request-failed') {
                    setError('Network error. Please check your internet connection and try again.');
                } else {
                    setError(error.message || 'Failed to create account');
                }
            }
        } catch (error: any) {
            if (error.code === 'auth/email-already-in-use') {
                setError('An account with this email already exists. Please sign in instead.');
            } else if (error.code === 'auth/network-request-failed') {
                setError('Network error. Please check your internet connection and try again.');
            } else {
                setError(error.message || 'Failed to create account');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignUp = async () => {
        setError('');
        setLoading(true);

        try {
            await signInWithGoogle();
        } catch (error: any) {
            setError(error.message || 'Failed to sign up with Google');
        } finally {
            setLoading(false);
        }
    };

    const currentYear = new Date().getFullYear();
    const graduationYears = Array.from({ length: 10 }, (_, i) => currentYear + i);
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    if (success) {
        return (
            <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
                <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                        <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Verification Email Sent!</h3>
                    <p className="text-sm text-gray-600 mb-4">
                        A verification link has been sent to your college email address <strong>{email}</strong>. Please click the link in the email to verify your account.
                    </p>
                    <p className="text-xs text-gray-500 mb-4">
                        After verification, your application will be submitted for approval.
                    </p>
                    <button
                        onClick={() => router.push('/signin')}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Go to Sign In
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-center mb-6 text-black">Sign Up for Clubs</h2>

            {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                    {error}
                </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                        Full Name
                    </label>
                    <input
                        type="text"
                        id="fullName"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
                        placeholder="Enter your full name"
                    />
                </div>

                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        College Email Address
                    </label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
                        placeholder="your.email@college.edu"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                        Please use your official college email address
                    </p>
                </div>

                <div>
                    <label htmlFor="rollNo" className="block text-sm font-medium text-gray-700">
                        Roll Number
                    </label>
                    <input
                        type="text"
                        id="rollNo"
                        value={rollNo}
                        onChange={(e) => setRollNo(e.target.value)}
                        required
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
                        placeholder="Enter your roll number"
                    />
                </div>

                <div>
                    <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                        Phone Number
                    </label>
                    <input
                        type="tel"
                        id="phoneNumber"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        required
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
                        placeholder="+91 98765 43210"
                    />
                </div>

                <div>
                    <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                        Department
                    </label>
                    <input
                        type="text"
                        id="department"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        required
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
                        placeholder="e.g., Computer Science"
                    />
                </div>

                <div>
                    <label htmlFor="yearOfStudy" className="block text-sm font-medium text-gray-700">
                        Year of Study
                    </label>
                    <select
                        id="yearOfStudy"
                        value={yearOfStudy}
                        onChange={(e) => setYearOfStudy(e.target.value)}
                        required
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    >
                        <option value="">Select year</option>
                        <option value="1">1st Year</option>
                        <option value="2">2nd Year</option>
                        <option value="3">3rd Year</option>
                        <option value="4">4th Year</option>
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="expectedGraduationYear" className="block text-sm font-medium text-gray-700">
                            Expected Graduation Year
                        </label>
                        <select
                            id="expectedGraduationYear"
                            value={expectedGraduationYear}
                            onChange={(e) => setExpectedGraduationYear(e.target.value)}
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                        >
                            <option value="">Year</option>
                            {graduationYears.map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="expectedGraduationMonth" className="block text-sm font-medium text-gray-700">
                            Expected Graduation Month
                        </label>
                        <select
                            id="expectedGraduationMonth"
                            value={expectedGraduationMonth}
                            onChange={(e) => setExpectedGraduationMonth(e.target.value)}
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                        >
                            <option value="">Month</option>
                            {months.map(month => (
                                <option key={month} value={month}>{month}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div>
                    <label htmlFor="clubName" className="block text-sm font-medium text-gray-700">
                        Club Name
                    </label>
                    <input
                        type="text"
                        id="clubName"
                        value={clubName}
                        onChange={(e) => setClubName(e.target.value)}
                        required
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
                        placeholder="Enter club name"
                    />
                </div>

                <div>
                    <label htmlFor="clubInchargeFaculty" className="block text-sm font-medium text-gray-700">
                        Club Incharge Faculty Name
                    </label>
                    <input
                        type="text"
                        id="clubInchargeFaculty"
                        value={clubInchargeFaculty}
                        onChange={(e) => setClubInchargeFaculty(e.target.value)}
                        required
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
                        placeholder="Enter faculty name"
                    />
                </div>

                <div>
                    <label htmlFor="letterOfProof" className="block text-sm font-medium text-gray-700">
                        Letter of Proof (Image or PDF)
                    </label>
                    <input
                        type="file"
                        id="letterOfProof"
                        onChange={handleFileChange}
                        accept="image/*,.pdf"
                        required
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                        Upload a picture or PDF of your proof document
                    </p>
                </div>

                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                        Password
                    </label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                        minLength={6}
                    />
                </div>

                <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                        Confirm Password
                    </label>
                    <input
                        type="password"
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading || uploading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                    {uploading ? 'Uploading File...' : loading ? 'Creating Account...' : 'Create Account'}
                </button>
            </form>

            <div className="mt-4">
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">Or</span>
                    </div>
                </div>
            </div>

            <p className="mt-4 text-center text-sm text-gray-600">
                Already have an account?{' '}
                <a href="/signin" className="text-blue-600 hover:text-blue-500">
                    Sign in
                </a>
            </p>
        </div>
    );
};