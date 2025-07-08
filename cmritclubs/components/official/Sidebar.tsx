'use client';

import { useAuth } from '@/contexts/AuthContext';

interface SidebarProps {
    signOut: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ signOut }) => {
    const { user } = useAuth();

    // Dynamically generate the base path for links based on the user's role
    let basePath = '/admin'; // Default fallback
    if (user?.officialRole) {
        // HOD roles all point to the same /hod dashboard
        if (user.officialRole.includes('hod')) {
            basePath = '/hod';
        } else {
            // Other roles like director, tpo, dsaa have their own paths
            basePath = `/${user.officialRole}`;
        }
    }

    const dashboardLink = `${basePath}/dashboard`;
    const lettersLink = `${basePath}/dashboard/letters`;

    return (
        <aside className="w-64 bg-white shadow-md relative min-h-screen">
            <div className="p-6">
                <h2 className="text-xl font-semibold text-black">CMRIT Clubs Portal</h2>
                <p className="text-sm text-black mt-2">Welcome, {user?.displayName || user?.email}</p>
            </div>

            <nav className="mt-6">
                <ul className="space-y-1">
                    <li>
                        <a
                            href={dashboardLink}
                            className="w-full text-left px-6 py-3 hover:bg-gray-100 block transition-colors text-black"
                        >
                            Club Applications
                        </a>
                    </li>
                    <li>
                        <a
                            href={lettersLink}
                            className="w-full text-left px-6 py-3 hover:bg-gray-100 block transition-colors text-black"
                        >
                            Permission Letters
                        </a>
                    </li>
                </ul>
            </nav>

            <div className="absolute bottom-0 left-0 right-0 p-6 bg-white">
                <button
                    onClick={signOut}
                    className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors"
                >
                    Sign Out
                </button>
            </div>
        </aside>
    );
};