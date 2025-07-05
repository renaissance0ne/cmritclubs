'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

export const PermissionLetterForm: React.FC = () => {
    const { user } = useAuth();
    const router = useRouter();
    const [subject, setSubject] = useState('');
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
                body,
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
                <p className="text-black">To,</p>
                <p className="text-black">The Director,</p>
                <p className="text-black">CMR Institute of Technology</p>
                <p className="text-black">Medchal</p>
            </div>
            <div className="text-sm text-black">
                <p className="text-black">Date: {new Date().toLocaleDateString()}</p>
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
                <label htmlFor="body" className="block text-sm font-medium text-black">Respected Sir,</label>
                <textarea
                    id="body"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    required
                    rows={10}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
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