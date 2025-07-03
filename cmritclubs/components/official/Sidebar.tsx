'use client';

import { useAuth } from '@/contexts/AuthContext';

interface SidebarProps {
    setFilter: (filter: 'pending' | 'approved' | 'rejected') => void;
    signOut: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ setFilter, signOut }) => {
    const { user } = useAuth();

    return (
        <aside className="w-64 bg-white shadow-md">
            <div className="p-6">
                <h2 className="text-xl font-semibold">CMRIT Clubs Portal</h2>
                <p className="text-sm text-gray-600 mt-2">Welcome, {user?.displayName || user?.email}</p>
            </div>
            <nav className="mt-6">
                <ul>
                    <li>
                        <button onClick={() => setFilter('pending')} className="w-full text-left px-6 py-3 hover:bg-gray-100">
                            Pending Approvals
                        </button>
                    </li>
                    <li>
                        <button onClick={() => setFilter('approved')} className="w-full text-left px-6 py-3 hover:bg-gray-100">
                            Approved Applications
                        </button>
                    </li>
                    <li>
                        <button onClick={() => setFilter('rejected')} className="w-full text-left px-6 py-3 hover:bg-gray-100">
                            Rejected Applications
                        </button>
                    </li>
                </ul>
            </nav>
            <div className="absolute bottom-0 w-full p-6">
                <button onClick={signOut} className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md">
                    Sign Out
                </button>
            </div>
        </aside>
    );
};