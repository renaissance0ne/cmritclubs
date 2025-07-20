'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useAuthenticatedUpload } from '@/hooks/useAuthenticatedUpload';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { User as FirebaseUser } from 'firebase/auth';
import { uploadFiles } from '@/lib/uploadthing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Loader2, Upload, UploadCloud, AlertCircle } from 'lucide-react';
import Stepper, { Step } from '@/components/effects/Stepper';

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
    const [fileUploaded, setFileUploaded] = useState(false);
    
    // Field-specific error states
    const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});
    
    const { signUp, signInWithGoogle } = useAuth();
    const router = useRouter();

    // Use authenticated UploadThing hook
    const { startUpload } = useAuthenticatedUpload("proofOfLeadership", {
        onClientUploadComplete: (res) => {
            console.log("Files uploaded successfully:", res);
            setFileUploaded(true);
        },
        onUploadError: (error) => {
            console.error("Upload error:", error);
            setError("Failed to upload file: " + error.message);
            setFileUploaded(false);
        },
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setLetterOfProof(e.target.files[0]);
            setFileUploaded(false); // Reset upload status when new file is selected
            // Clear file error when file is selected
            setFieldErrors(prev => ({...prev, letterOfProof: ''}));
        }
    };

    // Validation functions
    const validateStep1 = () => {
        const errors: {[key: string]: string} = {};
        
        if (!fullName.trim()) {
            errors.fullName = 'Full name is required';
        }
        
        if (!email.trim()) {
            errors.email = 'Email is required';
        } else if (!email.includes('.edu') && !email.includes('college')) {
            errors.email = 'Please use your official college email address';
        }
        
        if (!phoneNumber.trim()) {
            errors.phoneNumber = 'Phone number is required';
        } else {
            const cleanPhone = phoneNumber.replace(/[\s\-()]/g, '');
            if (!/^(\+91)?[6-9]\d{9}$/.test(cleanPhone)) {
                errors.phoneNumber = 'Please enter a valid 10-digit phone number (optionally with +91 prefix)';
            }
        }
        
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const validateStep2 = () => {
        const errors: {[key: string]: string} = {};
        
        if (!rollNo.trim()) {
            errors.rollNo = 'Roll number is required';
        }
        
        if (!department.trim()) {
            errors.department = 'Department is required';
        }
        
        if (!yearOfStudy) {
            errors.yearOfStudy = 'Year of study is required';
        }
        
        if (!expectedGraduationYear) {
            errors.expectedGraduationYear = 'Expected graduation year is required';
        }
        
        if (!expectedGraduationMonth) {
            errors.expectedGraduationMonth = 'Expected graduation month is required';
        }
        
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const validateStep3 = () => {
        const errors: {[key: string]: string} = {};
        
        if (!clubName.trim()) {
            errors.clubName = 'Club name is required';
        }
        
        if (!clubInchargeFaculty.trim()) {
            errors.clubInchargeFaculty = 'Club incharge faculty name is required';
        }
        
        if (!letterOfProof) {
            errors.letterOfProof = 'Letter of proof is required';
        }
        
        if (!password) {
            errors.password = 'Password is required';
        } else if (password.length < 6) {
            errors.password = 'Password must be at least 6 characters';
        }
        
        if (!confirmPassword) {
            errors.confirmPassword = 'Please confirm your password';
        } else if (password !== confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
        }
        
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleStepValidation = (step: number) => {
        switch (step) {
            case 1:
                return validateStep1();
            case 2:
                return validateStep2();
            case 3:
                return validateStep3();
            default:
                return true;
        }
    };

    const handleSubmit = async () => {
        if (!validateStep3()) {
            return;
        }

        setError('');
        setLoading(true);

        try {
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

                const newFirebaseUser: FirebaseUser = await signUp(email, password, userData);
                const token = await newFirebaseUser.getIdToken();

                setUploading(true);

                const uploadResult = await uploadFiles("proofOfLeadership", {
                    files: [letterOfProof!],
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                setUploading(false);

                if (!uploadResult || uploadResult.length === 0) {
                    throw new Error('Failed to upload file');
                }

                console.log("Upload complete, user document should be updated by onUploadComplete.");
                setFileUploaded(true);
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

    // Helper function to get button text based on upload status
    const getButtonText = () => {
        if (uploading) return "Uploading...";
        if (fileUploaded) return "Submitted";
        return "Create Account";
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center px-4 pt-8 md:pt-16">
                <div className="max-w-md w-full">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/20 mb-4">
                                    <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                                </div>
                                <CardTitle className="text-lg mb-2">Verification Email Sent!</CardTitle>
                                <CardDescription className="mb-4">
                                    A verification link has been sent to your college email address <strong>{email}</strong>. Please click the link in the email to verify your account.
                                </CardDescription>
                                <p className="text-xs text-muted-foreground mb-4">
                                    After verification, your application will be submitted for approval.
                                </p>
                                <Button
                                    onClick={() => router.push('/signin')}
                                    className="w-full"
                                >
                                    Go to Sign In
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen px-4 py-8">
            <div className="max-w-4xl mx-auto">
                {/* Header - Fixed positioning issue */}
                <div className="text-center mb-8">
                    <p className="text-muted-foreground">
                        Create your account to join college clubs
                    </p>
                </div>

                {/* Sign in link - Fixed positioning */}
                <div className="text-center mb-8">
                    <p className="text-sm text-muted-foreground">
                        Already have an account?{' '}
                        <a href="/signin" className="text-primary hover:underline font-medium">
                            Sign in
                        </a>
                    </p>
                </div>

                {/* Global error */}
                {error && (
                    <Alert variant="destructive" className="mb-6">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {/* Stepper - Fixed container styling */}
                <div className="w-full">
                    <Stepper
                        initialStep={1}
                        onStepChange={(step) => {
                            setError('');
                            setFieldErrors({});
                        }}
                        onFinalStepCompleted={handleSubmit}
                        backButtonText="Previous"
                        nextButtonText="Next"
                        finalButtonText={getButtonText()}
                        stepValidation={handleStepValidation}
                        nextButtonProps={{
                            disabled: loading || uploading
                        }}
                        finalButtonProps={{
                            disabled: loading || uploading || fileUploaded
                        }}
                        className="w-full"
                        stepCircleContainerClassName="w-full max-w-none shadow-lg"
                        stepContainerClassName="justify-center"
                    >
                        {/* Step 1: Basic Information */}
                        <Step>
                            <div className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-sm border">
                                <div className="text-center mb-6">
                                    <h3 className="text-lg font-semibold">Basic Information</h3>
                                    <p className="text-sm text-muted-foreground">Let's start with your basic details</p>
                                </div>
                                
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="fullName">Full Name</Label>
                                        <Input
                                            id="fullName"
                                            type="text"
                                            value={fullName}
                                            onChange={(e) => {
                                                setFullName(e.target.value);
                                                if (fieldErrors.fullName) {
                                                    setFieldErrors(prev => ({...prev, fullName: ''}));
                                                }
                                            }}
                                            placeholder="Enter your full name"
                                            className={fieldErrors.fullName ? 'border-red-500' : ''}
                                            required
                                        />
                                        {fieldErrors.fullName && (
                                            <p className="text-sm text-red-500 flex items-center gap-1">
                                                <AlertCircle className="h-3 w-3" />
                                                {fieldErrors.fullName}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="email">College Email Address</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={email}
                                            onChange={(e) => {
                                                setEmail(e.target.value);
                                                if (fieldErrors.email) {
                                                    setFieldErrors(prev => ({...prev, email: ''}));
                                                }
                                            }}
                                            placeholder="your.email@college.edu"
                                            className={fieldErrors.email ? 'border-red-500' : ''}
                                            required
                                        />
                                        {fieldErrors.email && (
                                            <p className="text-sm text-red-500 flex items-center gap-1">
                                                <AlertCircle className="h-3 w-3" />
                                                {fieldErrors.email}
                                            </p>
                                        )}
                                        {!fieldErrors.email && (
                                            <p className="text-xs text-muted-foreground">
                                                Please use your official college email address
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="phoneNumber">Phone Number</Label>
                                        <Input
                                            id="phoneNumber"
                                            type="tel"
                                            value={phoneNumber}
                                            onChange={(e) => {
                                                setPhoneNumber(e.target.value);
                                                if (fieldErrors.phoneNumber) {
                                                    setFieldErrors(prev => ({...prev, phoneNumber: ''}));
                                                }
                                            }}
                                            placeholder="+91 98765 43210"
                                            className={fieldErrors.phoneNumber ? 'border-red-500' : ''}
                                            required
                                        />
                                        {fieldErrors.phoneNumber && (
                                            <p className="text-sm text-red-500 flex items-center gap-1">
                                                <AlertCircle className="h-3 w-3" />
                                                {fieldErrors.phoneNumber}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Step>

                        {/* Step 2: Academic Information */}
                        <Step>
                            <div className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-sm border">
                                <div className="text-center mb-6">
                                    <h3 className="text-lg font-semibold">Academic Information</h3>
                                    <p className="text-sm text-muted-foreground">Tell us about your academic details</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="rollNo">Roll Number</Label>
                                        <Input
                                            id="rollNo"
                                            type="text"
                                            value={rollNo}
                                            onChange={(e) => {
                                                setRollNo(e.target.value);
                                                if (fieldErrors.rollNo) {
                                                    setFieldErrors(prev => ({...prev, rollNo: ''}));
                                                }
                                            }}
                                            placeholder="Enter your roll number"
                                            className={fieldErrors.rollNo ? 'border-red-500' : ''}
                                            required
                                        />
                                        {fieldErrors.rollNo && (
                                            <p className="text-sm text-red-500 flex items-center gap-1">
                                                <AlertCircle className="h-3 w-3" />
                                                {fieldErrors.rollNo}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="department">Department</Label>
                                        <Input
                                            id="department"
                                            type="text"
                                            value={department}
                                            onChange={(e) => {
                                                setDepartment(e.target.value);
                                                if (fieldErrors.department) {
                                                    setFieldErrors(prev => ({...prev, department: ''}));
                                                }
                                            }}
                                            placeholder="e.g., Computer Science"
                                            className={fieldErrors.department ? 'border-red-500' : ''}
                                            required
                                        />
                                        {fieldErrors.department && (
                                            <p className="text-sm text-red-500 flex items-center gap-1">
                                                <AlertCircle className="h-3 w-3" />
                                                {fieldErrors.department}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="yearOfStudy">Year of Study</Label>
                                        <Select 
                                            value={yearOfStudy} 
                                            onValueChange={(value) => {
                                                setYearOfStudy(value);
                                                if (fieldErrors.yearOfStudy) {
                                                    setFieldErrors(prev => ({...prev, yearOfStudy: ''}));
                                                }
                                            }}
                                        >
                                            <SelectTrigger className={fieldErrors.yearOfStudy ? 'border-red-500' : ''}>
                                                <SelectValue placeholder="Select year" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="1">1st Year</SelectItem>
                                                <SelectItem value="2">2nd Year</SelectItem>
                                                <SelectItem value="3">3rd Year</SelectItem>
                                                <SelectItem value="4">4th Year</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {fieldErrors.yearOfStudy && (
                                            <p className="text-sm text-red-500 flex items-center gap-1">
                                                <AlertCircle className="h-3 w-3" />
                                                {fieldErrors.yearOfStudy}
                                            </p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="expectedGraduationYear">Expected Graduation Year</Label>
                                            <Select 
                                                value={expectedGraduationYear} 
                                                onValueChange={(value) => {
                                                    setExpectedGraduationYear(value);
                                                    if (fieldErrors.expectedGraduationYear) {
                                                        setFieldErrors(prev => ({...prev, expectedGraduationYear: ''}));
                                                    }
                                                }}
                                            >
                                                <SelectTrigger className={fieldErrors.expectedGraduationYear ? 'border-red-500' : ''}>
                                                    <SelectValue placeholder="Year" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {graduationYears.map(year => (
                                                        <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {fieldErrors.expectedGraduationYear && (
                                                <p className="text-sm text-red-500 flex items-center gap-1">
                                                    <AlertCircle className="h-3 w-3" />
                                                    {fieldErrors.expectedGraduationYear}
                                                </p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="expectedGraduationMonth">Expected Graduation Month</Label>
                                            <Select 
                                                value={expectedGraduationMonth} 
                                                onValueChange={(value) => {
                                                    setExpectedGraduationMonth(value);
                                                    if (fieldErrors.expectedGraduationMonth) {
                                                        setFieldErrors(prev => ({...prev, expectedGraduationMonth: ''}));
                                                    }
                                                }}
                                            >
                                                <SelectTrigger className={fieldErrors.expectedGraduationMonth ? 'border-red-500' : ''}>
                                                    <SelectValue placeholder="Month" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {months.map(month => (
                                                        <SelectItem key={month} value={month}>{month}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {fieldErrors.expectedGraduationMonth && (
                                                <p className="text-sm text-red-500 flex items-center gap-1">
                                                    <AlertCircle className="h-3 w-3" />
                                                    {fieldErrors.expectedGraduationMonth}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Step>

                        {/* Step 3: Club & Security Information */}
                        <Step>
                            <div className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-sm border">
                                <div className="text-center mb-6">
                                    <h3 className="text-lg font-semibold">Club Information</h3>
                                    <p className="text-sm text-muted-foreground">Final step - club details and password</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="clubName">Club Name</Label>
                                        <Input
                                            id="clubName"
                                            type="text"
                                            value={clubName}
                                            onChange={(e) => {
                                                setClubName(e.target.value);
                                                if (fieldErrors.clubName) {
                                                    setFieldErrors(prev => ({...prev, clubName: ''}));
                                                }
                                            }}
                                            placeholder="Enter club name"
                                            className={fieldErrors.clubName ? 'border-red-500' : ''}
                                            required
                                        />
                                        {fieldErrors.clubName && (
                                            <p className="text-sm text-red-500 flex items-center gap-1">
                                                <AlertCircle className="h-3 w-3" />
                                                {fieldErrors.clubName}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="clubInchargeFaculty">Club Incharge Faculty Name</Label>
                                        <Input
                                            id="clubInchargeFaculty"
                                            type="text"
                                            value={clubInchargeFaculty}
                                            onChange={(e) => {
                                                setClubInchargeFaculty(e.target.value);
                                                if (fieldErrors.clubInchargeFaculty) {
                                                    setFieldErrors(prev => ({...prev, clubInchargeFaculty: ''}));
                                                }
                                            }}
                                            placeholder="Enter faculty name"
                                            className={fieldErrors.clubInchargeFaculty ? 'border-red-500' : ''}
                                            required
                                        />
                                        {fieldErrors.clubInchargeFaculty && (
                                            <p className="text-sm text-red-500 flex items-center gap-1">
                                                <AlertCircle className="h-3 w-3" />
                                                {fieldErrors.clubInchargeFaculty}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="letterOfProof">Letter of Proof (Image/PDF)</Label>
                                        <div className="flex items-center justify-center w-full">
                                            <label htmlFor="letterOfProof" className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/50 ${fieldErrors.letterOfProof ? 'border-red-500' : ''}`}>
                                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                    <UploadCloud className="w-8 h-8 mb-2 text-muted-foreground" />
                                                    <p className="mb-1 text-sm text-muted-foreground">
                                                        <span className="font-semibold">Click to upload</span> or drag and drop
                                                    </p>
                                                    {letterOfProof ? (
                                                        <div className="text-center">
                                                            <p className="text-xs text-green-500 mb-1">{letterOfProof.name}</p>
                                                            {fileUploaded ? (
                                                                <p className="text-xs text-green-600 font-medium">✓ Uploaded successfully</p>
                                                            ) : (
                                                                <p className="text-xs text-orange-500">Ready to upload</p>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <p className="text-xs text-muted-foreground">PNG, JPG or PDF</p>
                                                    )}
                                                </div>
                                                <Input 
                                                    id="letterOfProof" 
                                                    type="file" 
                                                    className="hidden" 
                                                    onChange={handleFileChange}
                                                    accept=".png,.jpg,.jpeg,.pdf"
                                                    required 
                                                />
                                            </label>
                                        </div>
                                        {fieldErrors.letterOfProof && (
                                            <p className="text-sm text-red-500 flex items-center gap-1">
                                                <AlertCircle className="h-3 w-3" />
                                                {fieldErrors.letterOfProof}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="password">Password</Label>
                                        <Input
                                            id="password"
                                            type="password"
                                            value={password}
                                            onChange={(e) => {
                                                setPassword(e.target.value);
                                                if (fieldErrors.password) {
                                                    setFieldErrors(prev => ({...prev, password: ''}));
                                                }
                                            }}
                                            placeholder="Enter your password"
                                            className={fieldErrors.password ? 'border-red-500' : ''}
                                            minLength={6}
                                            required
                                        />
                                        {fieldErrors.password && (
                                            <p className="text-sm text-red-500 flex items-center gap-1">
                                                <AlertCircle className="h-3 w-3" />
                                                {fieldErrors.password}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => {
                                            setConfirmPassword(e.target.value);
                                            if (fieldErrors.confirmPassword) {
                                                setFieldErrors(prev => ({...prev, confirmPassword: ''}));
                                            }
                                        }}
                                        placeholder="Confirm your password"
                                        className={fieldErrors.confirmPassword ? 'border-red-500' : ''}
                                        required
                                    />
                                    {fieldErrors.confirmPassword && (
                                        <p className="text-sm text-red-500 flex items-center gap-1">
                                            <AlertCircle className="h-3 w-3" />
                                            {fieldErrors.confirmPassword}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Step>
                </Stepper>
            </div>
        </div>
        </div>
    );
};