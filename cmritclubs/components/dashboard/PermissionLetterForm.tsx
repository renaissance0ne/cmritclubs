'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic'; // <-- IMPORT DYNAMIC

// --- DYNAMICALLY IMPORT THE EDITOR TO PREVENT SSR ---
const RichTextEditor = dynamic(() => import('../rtf'), {
    ssr: false,
    loading: () => <div className="w-full h-[300px] bg-gray-100 rounded-md animate-pulse"></div>, // Optional loading state
});
// --- END OF DYNAMIC IMPORT ---

export const PermissionLetterForm: React.FC = () => {
    const { user } = useAuth();
    const router = useRouter();
    const [subject, setSubject] = useState('');
    // The 'body' state will now hold HTML content from the editor
    const [body, setBody] = useState('');
    const [sincerely, setSincerely] = useState('');
    const [rollNos, setRollNos] = useState({
        cse: '',
        csm: '',
        csd: '',
        frsh: '',
        ece: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleRollNoChange = (e: React.ChangeEvent<HTMLTextAreaElement>, department: keyof typeof rollNos) => {
        setRollNos(prev => ({ ...prev, [department]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !user.clubName) {
            setError('User information not available. Cannot submit.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await addDoc(collection(db, 'permissionLetters'), {
                uid: user.uid,
                clubName: user.clubName,
                date: serverTimestamp(),
                subject,
                body, // The HTML content is saved to Firestore
                sincerely,
                rollNos,
                status: 'pending',
                approvals: {
                    director: 'pending',
                    dsaa: 'pending',
                    tpo: 'pending',
                    cseHod: 'pending',
                    csmHod: 'pending',
                    csdHod: 'pending',
                    frshHod: 'pending',
                    eceHod: 'pending',
                },
                rollNoApprovals: {
                    cse: {},
                    csm: {},
                    csd: {},
                    frsh: {},
                    ece: {},
                },
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
            router.push('/dashboard/letters?filter=pending');
        } catch (err: any) {
            setError('Failed to submit letter. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md space-y-6 text-black">
            <div className="text-center">
                <h2 className="text-2xl font-semibold text-black">{user?.clubName}</h2>
            </div>
            <div className="text-sm text-black">
                <p>To,</p>
                <p>The Director,</p>
                <p>CMR Institute of Technology</p>
                <p>Medchal</p>
            </div>
            <div className="text-sm text-black">
                <p>Date: {new Date().toLocaleDateString()}</p>
            </div>
            <div>
                <label htmlFor="subject" className="block text-sm font-medium text-black">Subject</label>
                <input
                    type="text"
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                />
            </div>
            <div>
                <label htmlFor="body" className="block text-sm font-medium text-black mb-1">Respected Sir,</label>
                <RichTextEditor
                    content={body}
                    onChange={setBody}
                />
            </div>
            <div>
                <label htmlFor="sincerely" className="block text-sm font-medium text-black">Yours sincerely,</label>
                <input
                    type="text"
                    id="sincerely"
                    value={sincerely}
                    onChange={(e) => setSincerely(e.target.value)}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                    placeholder="Your Name/Designation"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                    <label className="block text-sm font-medium text-black">CSE</label>
                    <textarea onChange={(e) => handleRollNoChange(e, 'cse')} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-black" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-black">CSM</label>
                    <textarea onChange={(e) => handleRollNoChange(e, 'csm')} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-black" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-black">CSD</label>
                    <textarea onChange={(e) => handleRollNoChange(e, 'csd')} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-black" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-black">Freshman</label>
                    <textarea onChange={(e) => handleRollNoChange(e, 'frsh')} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-black" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-black">ECE</label>
                    <textarea onChange={(e) => handleRollNoChange(e, 'ece')} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-black" />
                </div>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
                {loading ? 'Submitting...' : 'Submit Letter'}
            </button>
        </form>
    );
};
