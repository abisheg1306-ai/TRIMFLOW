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
    const [isSignUp, setIsSignUp] = useState(false);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const router = useRouter();

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccessMsg(null);

        if (isSignUp) {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
            });
            if (error) {
                setError(error.message);
            } else {
                setSuccessMsg("Account created! If email confirmation is off, you can now Sign In.");
                setIsSignUp(false);
            }
            setLoading(false);
        } else {
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
        }
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center p-6 text-neutral-100 selection:bg-amber-500/30 overflow-hidden font-sans">
            {/* Cinematic Background */}
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105 animate-in fade-in duration-1000"
                style={{ backgroundImage: "url('/luxury-bg.png')" }}
            />
            {/* Moody Overlay for contrast */}
            <div className="absolute inset-0 bg-neutral-950/70 backdrop-blur-[4px]" />

            <div className="relative z-10 w-full max-w-md animate-in slide-in-from-bottom-8 fade-in flex flex-col items-center duration-1000 ease-out">
                {/* Logo & Brand */}
                <div className="flex items-center justify-center gap-3 mb-10 w-full">
                    <div className="w-12 h-12 rounded-full bg-neutral-900/80 border border-neutral-800/50 flex items-center justify-center shadow-2xl backdrop-blur-md">
                        <Scissors className="w-6 h-6 text-amber-500 drop-shadow-[0_0_12px_rgba(245,158,11,0.6)]" />
                    </div>
                    <span className="font-extrabold text-3xl tracking-tighter text-white drop-shadow-lg">TRIMFLOW</span>
                </div>

                {/* Glassmorphic Container */}
                <div className="w-full bg-neutral-950/40 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 sm:p-10 shadow-2xl ring-1 ring-black/50 overflow-hidden relative">
                    {/* Subtle interior glow */}
                    <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
                    <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/20 rounded-full blur-[80px] pointer-events-none" />

                    <h1 className="text-2xl font-semibold mb-2 text-white/90 tracking-tight">
                        {isSignUp ? 'Create Admin Account' : 'Welcome Back'}
                    </h1>
                    <p className="text-sm text-neutral-400 mb-8 font-light">
                        {isSignUp ? 'Set up your master credentials.' : 'Secure access to your barber dashboard.'}
                    </p>

                    <form onSubmit={handleAuth} className="space-y-5 relative z-10">
                        {error && (
                            <div className="bg-red-500/10 text-red-400 text-sm p-4 rounded-2xl border border-red-500/20 mb-4 flex items-center gap-2 backdrop-blur-md">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                                {error}
                            </div>
                        )}
                        {successMsg && (
                            <div className="bg-emerald-500/10 text-emerald-400 text-sm p-4 rounded-2xl border border-emerald-500/20 mb-4 flex items-center gap-2 backdrop-blur-md">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                                {successMsg}
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label className="block text-xs uppercase tracking-wider font-semibold text-neutral-400 ml-1">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/80 transition-all duration-300 hover:border-white/20 hover:bg-white/10 shadow-inner"
                                placeholder="barber@trimflow.com"
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-xs uppercase tracking-wider font-semibold text-neutral-400 ml-1">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/80 transition-all duration-300 hover:border-white/20 hover:bg-white/10 shadow-inner"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full overflow-hidden bg-amber-500 text-neutral-950 font-bold text-lg py-4 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:shadow-[0_0_25px_rgba(245,158,11,0.4)] mt-8"
                        >
                            <span className="relative z-10">
                                {loading ? 'Authenticating...' : (isSignUp ? 'Sign Up' : 'Sign In')}
                            </span>
                        </button>
                    </form>

                    <div className="mt-8 text-center text-sm text-neutral-400 font-medium relative z-10">
                        {isSignUp ? (
                            <>Already have an account? <button onClick={() => { setIsSignUp(false); setError(null); setSuccessMsg(null); }} className="text-amber-500 hover:text-amber-400 hover:underline transition-colors focus:outline-none ml-1">Sign In</button></>
                        ) : (
                            <>Need to set up the admin? <button onClick={() => { setIsSignUp(true); setError(null); setSuccessMsg(null); }} className="text-amber-500 hover:text-amber-400 hover:underline transition-colors focus:outline-none ml-1">Create Account</button></>
                        )}
                    </div>
                </div>

                {/* Footer text */}
                <p className="mt-8 text-xs text-neutral-600 font-medium tracking-wide uppercase">
                    Powered by Trimflow Security
                </p>
            </div>
        </div>
    );
}
