'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { CalendarIcon, Clock, Scissors, UserCheck, XCircle } from 'lucide-react';
import { format } from 'date-fns';

type Booking = {
    id: string;
    customer_name: string;
    customer_phone: string;
    booking_time: string;
    status: string;
    notes: string;
    services: { name: string, price: number, duration_minutes: number };
};

export default function Dashboard() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);

    // Simple auth trigger to render the dashboard (mock authorization block for demo)
    const isAuthenticated = true; // In production this checks Supabase session.

    useEffect(() => {
        async function fetchBookings() {
            if (!isAuthenticated) return;

            const { data, error } = await supabase
                .from('bookings')
                .select(`
          *,
          services ( name, price, duration_minutes )
        `)
                .order('booking_time', { ascending: true })
            // .gte('booking_time', new Date().toISOString()); // Fetch upcoming

            if (data) {
                setBookings(data as Booking[]);
            }
            setLoading(false);
        }
        fetchBookings();
    }, [isAuthenticated]);

    const updateStatus = async (id: string, newStatus: string) => {
        const { error } = await supabase.from('bookings').update({ status: newStatus }).eq('id', id);
        if (!error) {
            setBookings(bookings.map(b => b.id === id ? { ...b, status: newStatus } : b));
        }
    };

    if (!isAuthenticated) return <div className="p-10 text-white font-mono">Access Denied. Please log in.</div>;

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-100 selection:bg-neutral-800">
            <header className="border-b border-neutral-900 bg-black/50 backdrop-blur top-0 sticky z-50">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-neutral-400">
                        <span className="font-bold text-xl tracking-tighter text-white">TRIMFLOW</span> Admin
                    </div>
                    <div className="flex gap-2 text-sm text-neutral-500">
                        <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center">
                            B
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-12">
                <div className="flex items-end justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-light tracking-tight mb-2">Upcoming Schedule</h1>
                        <p className="text-neutral-500">Manage your appointments and clients.</p>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-light">{format(new Date(), 'EEEE, MMMM d')}</div>
                    </div>
                </div>

                {loading ? (
                    <div className="py-20 text-center text-neutral-600 animate-pulse font-mono flex items-center justify-center gap-3">
                        <Scissors className="w-5 h-5 animate-spin" /> Fetching ledger...
                    </div>
                ) : bookings.length === 0 ? (
                    <div className="text-center py-20 bg-neutral-900/40 rounded-3xl border border-neutral-800 border-dashed">
                        <CalendarIcon className="w-8 h-8 text-neutral-700 mx-auto mb-3" />
                        <h3 className="text-neutral-400 font-medium">No Upcoming Appointments</h3>
                        <p className="text-neutral-500 text-sm mt-1">Enjoy the break. Or market yourself more!</p>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {bookings.map(booking => {
                            const isPending = booking.status === 'pending';
                            const isCompleted = booking.status === 'completed';
                            const isCancelled = booking.status === 'cancelled';
                            const bTime = new Date(booking.booking_time);

                            return (
                                <div key={booking.id} className={`p-6 rounded-2xl border transition-all ${isCompleted ? 'bg-neutral-900/50 border-neutral-900 opacity-60' : isCancelled ? 'bg-red-950/20 border-red-900/50 opacity-50' : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'}`}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <div className="text-xl font-medium tracking-tight bg-gradient-to-r from-white to-neutral-400 bg-clip-text text-transparent">{format(bTime, 'h:mm a')}</div>
                                            <div className="text-sm text-neutral-500">{format(bTime, 'MMM do')}</div>
                                        </div>
                                        <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-md ${isPending ? 'bg-amber-500/10 text-amber-500' :
                                                isCompleted ? 'bg-green-500/10 text-green-500' :
                                                    'bg-red-500/10 text-red-500'
                                            }`}>
                                            {booking.status}
                                        </span>
                                    </div>

                                    <div className="mb-6 space-y-1">
                                        <div className="text-white font-medium">{booking.customer_name}</div>
                                        <div className="text-neutral-400 text-sm">{booking.customer_phone}</div>
                                    </div>

                                    <div className="bg-neutral-950/50 rounded-xl p-3 mb-6 flex justify-between items-center text-sm border border-neutral-800/50">
                                        <span className="text-neutral-300 font-medium truncate pr-2">{booking.services?.name}</span>
                                        <span className="text-neutral-500 shrink-0">${booking.services?.price} / {booking.services?.duration_minutes}m</span>
                                    </div>

                                    {isPending && (
                                        <div className="flex gap-2">
                                            <button onClick={() => updateStatus(booking.id, 'completed')} className="flex-1 bg-white text-black text-sm font-medium py-2.5 rounded-xl hover:bg-neutral-200 transition-colors flex items-center justify-center gap-1.5">
                                                <UserCheck className="w-4 h-4" /> Check Out
                                            </button>
                                            <button onClick={() => updateStatus(booking.id, 'cancelled')} className="px-3 bg-neutral-800 text-neutral-300 text-sm font-medium py-2.5 rounded-xl hover:bg-red-950 hover:text-red-400 transition-colors flex items-center justify-center border border-transparent hover:border-red-900/50">
                                                <XCircle className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}
