'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Scissors } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            router.push('/dashboard');
            router.refresh();
        }
    };

    return (
        <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-6 text-neutral-100 selection:bg-neutral-800">
            <div className="w-full max-w-sm">
                <div className="flex items-center justify-center gap-2 mb-8">
                    <Scissors className="w-8 h-8 text-white" />
                    <span className="font-bold text-2xl tracking-tighter">TRIMFLOW</span>
                </div>

                <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-xl">
                    <h1 className="text-xl font-medium mb-6">Barber Login</h1>

                    <form onSubmit={handleLogin} className="space-y-4 relative">
                        {error && (
                            <div className="bg-red-500/10 text-red-400 text-sm p-3 rounded-xl border border-red-500/20 mb-4">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-neutral-400 mb-1.5 ml-1">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-400 mb-1.5 ml-1">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-white text-black font-medium text-base py-3.5 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-200 transition-colors mt-4"
                        >
                            {loading ? 'Authenticating...' : 'Sign In'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
