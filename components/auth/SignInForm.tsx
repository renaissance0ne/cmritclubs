'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';

export const SignInForm: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { signIn, signInWithGoogle, firebaseUser, user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (firebaseUser && user) {
            if (user.role === 'college_official') {
                // FIX: Explicitly type officialPath as string | undefined to resolve TypeScript error.
                let officialPath: string | undefined = user.officialRole;
                if (user.officialRole?.includes('hod')) {
                    officialPath = 'hod';
                }
                
                if(officialPath) {
                    router.push(`/${officialPath}/dashboard`);
                } else {
                    router.push('/admin/dashboard'); // Fallback for any other official type
                }

            } else {
                switch (user.status) {
                    case 'approved':
                        router.push('/dashboard');
                        break;
                    case 'pending':
                        router.push('/pending-approval');
                        break;
                    case 'rejected':
                        router.push('/application-rejected');
                        break;
                    case 'email_verified':
                        router.push('/application');
                        break;
                    default:
                        router.push('/dashboard');
                }
            }
        }
    }, [firebaseUser, user, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await signIn(email, password);
        } catch (error: any) {
            setError(error.message || 'Failed to sign in');
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setError('');
        setLoading(true);
        try {
            await signInWithGoogle();
        } catch (error: any) {
            setError(error.message || 'Failed to sign in with Google');
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-8">
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl text-center">Sign In</CardTitle>
                    <CardDescription className="text-center">
                        Enter your credentials to access your account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {error && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">College Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="your.email@college.edu"
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={loading}
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {loading ? 'Signing In...' : 'Sign In'}
                        </Button>
                    </form>

                    <div className="mt-4">
                        <Separator />
                    </div>

                    <p className="mt-4 text-center text-sm text-muted-foreground">
                        Don't have an account?{' '}
                        <a href="/signup" className="text-primary hover:underline">
                            Sign up for clubs
                        </a>
                    </p>
                </CardContent>
            </Card>
        </div>
    );
};
