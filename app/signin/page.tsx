import { SignInForm } from '@/components/auth/SignInForm';
import Link from 'next/link';

export default function SignInPage() {
    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md">
                 <div className="text-center mb-8">
                    <Link href="/" className="text-2xl font-bold tracking-tight hover:text-primary transition-colors">
                        CMRIT Clubs Portal
                    </Link>
                </div>
                <SignInForm />
            </div>
        </div>
    );
}