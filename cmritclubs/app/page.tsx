'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function HomePage() {
  const { user, firebaseUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (firebaseUser && user) {
        // Redirect based on user status
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
      } else if (!firebaseUser) {
        // Not signed in, stay on landing page
      }
    }
  }, [loading, firebaseUser, user, router]);

  if (loading) {
    return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
    );
  }

  return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 relative">
        {/* GitHub link in top right corner */}
        <div className="fixed top-4 right-4 z-50">
          <a
            href="https://github.com/renaissance0ne/cmritclubs"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 text-white font-medium rounded-lg transition-colors shadow-lg"
            style={{
              backgroundColor: '#1f2937',
              border: '1px solid #374151'
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLElement).style.backgroundColor = '#111827';
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLElement).style.backgroundColor = '#1f2937';
            }}
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            GitHub
          </a>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-16 relative">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              CMRIT Clubs Portal
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Streamlined club management and permission system
            </p>

            <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
              <a
                  href="/signup"
                  className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
              >
                Sign Up for Clubs
              </a>
              <a
                  href="/signin"
                  className="inline-block bg-white hover:bg-gray-50 text-blue-600 font-medium py-3 px-6 rounded-lg border border-blue-600 transition-colors"
              >
                Sign In
              </a>
            </div>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Easy Registration
              </h3>
              <p className="text-gray-600">
                Sign up with your college email and get verified quickly
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Permission Letters
              </h3>
              <p className="text-gray-600">
                Submit and track permission letters for your club events
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Official Review
              </h3>
              <p className="text-gray-600">
                Streamlined approval process with college officials
              </p>
            </div>
          </div>
        </div>
      </div>
  );
}