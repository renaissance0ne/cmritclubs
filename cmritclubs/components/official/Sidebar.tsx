'use client';

import { useAuth } from '@/contexts/AuthContext';

interface SidebarProps {
    setFilter: (filter: 'pending' | 'approved' | 'rejected') => void;
    signOut: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ setFilter, signOut }) => {
    const { user } = useAuth();

    const isHod = user?.officialRole?.includes('hod');
    const dashboardLink = isHod ? '/hod/dashboard' : '/director/dashboard';
    const lettersLink = isHod ? '/hod/dashboard/letters' : '/director/dashboard/letters';

    return (
        <aside className="w-64 bg-white shadow-md relative min-h-screen">
            <div className="p-6">
                <h2 className="text-xl font-semibold">CMRIT Clubs Portal</h2>
                <p className="text-sm text-gray-600 mt-2">Welcome, {user?.displayName || user?.email}</p>
            </div>

            <nav className="mt-6">
                <ul className="space-y-1">
                    <li>
                        <a
                            href={dashboardLink}
                            className="w-full text-left px-6 py-3 hover:bg-gray-100 block transition-colors"
                        >
                            Club Applications
                        </a>
                    </li>
                    <li>
                        <a
                            href={lettersLink}
                            className="w-full text-left px-6 py-3 hover:bg-gray-100 block transition-colors"
                        >
                            Permission Letters
                        </a>
                    </li>
                    <li>
                        <button
                            onClick={() => setFilter('pending')}
                            className="w-full text-left px-6 py-3 hover:bg-gray-100 transition-colors"
                        >
                            Pending
                        </button>
                    </li>
                    <li>
                        <button
                            onClick={() => setFilter('approved')}
                            className="w-full text-left px-6 py-3 hover:bg-gray-100 transition-colors"
                        >
                            Approved
                        </button>
                    </li>
                    <li>
                        <button
                            onClick={() => setFilter('rejected')}
                            className="w-full text-left px-6 py-3 hover:bg-gray-100 transition-colors"
                        >
                            Rejected
                        </button>
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