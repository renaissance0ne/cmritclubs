import { SignUpForm } from '@/components/auth/SignUpForm';

export default function SignUpPage() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h1 className="text-center text-3xl font-extrabold text-gray-900 mb-8">
                    CMRIT Clubs Portal
                </h1>
            </div>
            <SignUpForm />
        </div>
    );
}