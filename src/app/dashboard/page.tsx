'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { CalendarIcon, Scissors, LogOut, CheckCircle2, Pencil, MessageCircle, DollarSign, Users, TrendingUp } from 'lucide-react';
import { format, isToday, isFuture } from 'date-fns';
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
    const [activeTab, setActiveTab] = useState("today");
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        async function fetchBookings() {
            const { data: userData } = await supabase.auth.getUser();
            if (!userData.user) {
                setLoading(false);
                return;
            }
            setIsAuthenticated(true);

            const { data, error } = await supabase
                .from('bookings')
                .select(`
                  *,
                  services ( name, price, duration_minutes )
                `)
                .order('booking_time', { ascending: true })

            if (data) {
                setBookings(data as Booking[]);
            }
            setLoading(false);
        }
        fetchBookings();
    }, []);

    const updateStatus = async (id: string, newStatus: string) => {
        const { error } = await supabase.from('bookings').update({ status: newStatus }).eq('id', id);
        if (!error) {
            setBookings(bookings.map(b => b.id === id ? { ...b, status: newStatus } : b));
        }
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        window.location.reload();
    };

    const filteredBookings = useMemo(() => {
        return bookings.filter(b => {
            const bDate = new Date(b.booking_time);
            if (activeTab === 'today') return isToday(bDate) && b.status !== 'cancelled' && b.status !== 'completed';
            if (activeTab === 'upcoming') return isFuture(bDate) && !isToday(bDate) && b.status !== 'cancelled' && b.status !== 'completed';
            if (activeTab === 'completed') return b.status === 'completed';
            return true;
        });
    }, [bookings, activeTab]);

    const stats = useMemo(() => {
        const todayPrice = bookings
            .filter(b => isToday(new Date(b.booking_time)) && b.status === 'completed')
            .reduce((sum, b) => sum + (b.services?.price || 0), 0);

        const pendingCount = bookings
            .filter(b => isToday(new Date(b.booking_time)) && b.status === 'pending')
            .length;

        const totalEarnedPrice = bookings
            .filter(b => b.status === 'completed')
            .reduce((sum, b) => sum + (b.services?.price || 0), 0);

        return {
            todayRevenue: todayPrice,
            pendingCuts: pendingCount,
            totalEarned: totalEarnedPrice
        };
    }, [bookings]);

    if (!loading && !isAuthenticated) {
        return <div className="p-10 text-white font-mono">Access Denied. Please log in.</div>;
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-neutral-100 font-sans selection:bg-amber-500/30">
            {/* Header */}
            <header className="border-b border-white/10 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                            <Scissors className="w-4 h-4 text-amber-500" />
                        </div>
                        <span className="font-bold tracking-tight text-white">TRIMFLOW <span className="font-normal text-neutral-500">Admin</span></span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={handleSignOut} className="text-sm font-medium text-neutral-400 hover:text-white transition-colors flex items-center gap-2">
                            <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                        <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-sm font-medium shadow-inner">
                            B
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-12">
                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <Card className="bg-white/5 border-white/10 backdrop-blur-xl rounded-3xl overflow-hidden group">
                        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0 text-white">
                            <h3 className="text-sm font-medium text-neutral-400">Today's Revenue</h3>
                            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition-transform">
                                <DollarSign className="w-5 h-5 text-emerald-500" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-black text-white">RM{stats.todayRevenue}</div>
                            <p className="text-xs text-neutral-500 mt-1 font-medium italic">Realized earnings</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-white/5 border-white/10 backdrop-blur-xl rounded-3xl overflow-hidden group">
                        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0 text-white">
                            <h3 className="text-sm font-medium text-neutral-400">Pending Cuts</h3>
                            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 group-hover:scale-110 transition-transform">
                                <Users className="w-5 h-5 text-amber-500" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-black text-white">{stats.pendingCuts}</div>
                            <p className="text-xs text-neutral-500 mt-1 font-medium italic">Remaining today</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-white/5 border-white/10 backdrop-blur-xl rounded-3xl overflow-hidden group">
                        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0 text-white">
                            <h3 className="text-sm font-medium text-neutral-400">Total Earned</h3>
                            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 group-hover:scale-110 transition-transform">
                                <TrendingUp className="w-5 h-5 text-blue-400" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-black text-white">RM{stats.totalEarned}</div>
                            <p className="text-xs text-neutral-500 mt-1 font-medium italic">Cumulative revenue</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight mb-2 text-white">Appointments</h1>
                        <p className="text-neutral-400">Manage your barbershop schedule and clients.</p>
                    </div>
                    <div className="text-left md:text-right">
                        <div className="text-lg font-medium text-neutral-300">{format(new Date(), 'EEEE, MMMM d')}</div>
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="bg-white/5 border border-white/10 p-1 rounded-xl mb-8">
                        <TabsTrigger value="today" className="rounded-lg data-[state=active]:bg-amber-500 data-[state=active]:text-neutral-950 transition-all font-semibold">Today</TabsTrigger>
                        <TabsTrigger value="upcoming" className="rounded-lg data-[state=active]:bg-amber-500 data-[state=active]:text-neutral-950 transition-all font-semibold">Upcoming</TabsTrigger>
                        <TabsTrigger value="completed" className="rounded-lg data-[state=active]:bg-amber-500 data-[state=active]:text-neutral-950 transition-all font-semibold">Completed</TabsTrigger>
                    </TabsList>

                    {loading ? (
                        <div className="py-32 flex flex-col items-center justify-center text-neutral-500 gap-4">
                            <Scissors className="w-8 h-8 animate-spin text-amber-500/50" />
                            <p className="animate-pulse font-medium tracking-wide">Syncing Ledger...</p>
                        </div>
                    ) : (filteredBookings as Booking[]).length === 0 ? (
                        <div className="text-center py-32 bg-white/5 rounded-3xl border border-white/10 border-dashed backdrop-blur-sm shadow-inner">
                            <CalendarIcon className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
                            <h3 className="text-xl text-white font-medium mb-1">No Appointments Found</h3>
                            <p className="text-neutral-400">There are no {activeTab} bookings to display.</p>
                        </div>
                    ) : (
                        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                            {(filteredBookings as Booking[]).map(booking => {
                                const isCompleted = booking.status === 'completed';
                                const isCancelled = booking.status === 'cancelled';
                                const isUpcoming = booking.status === 'pending';
                                const bTime = new Date(booking.booking_time);

                                return (
                                    <Card key={booking.id} className={`bg-white/5 border border-white/10 backdrop-blur-md transition-all duration-300 overflow-hidden ${isCompleted ? 'opacity-60' : isCancelled ? 'opacity-40 grayscale' : 'hover:border-amber-500/50 hover:shadow-[0_0_20px_rgba(245,158,11,0.15)] hover:scale-[1.02]'}`}>
                                        <CardHeader className="pb-4 border-b border-white/5 flex flex-row items-start justify-between bg-black/20">
                                            <div>
                                                <div className="text-3xl font-black tracking-tighter text-white drop-shadow-sm mb-1">{format(bTime, 'h:mm a')}</div>
                                                <div className="text-sm font-semibold text-amber-500/80 uppercase tracking-widest">{format(bTime, 'MMM do')}</div>
                                            </div>
                                            <Badge variant="outline" className={`font-semibold tracking-wide border rounded-full px-3 py-1 ${isCompleted ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                isCancelled ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                    'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                                }`}>
                                                {booking.status}
                                            </Badge>
                                        </CardHeader>

                                        <CardContent className="pt-6">
                                            <div className="mb-6">
                                                <div className="text-lg font-bold text-white mb-1">{booking.customer_name}</div>
                                                <div className="text-neutral-400 font-medium">{booking.customer_phone}</div>
                                            </div>

                                            <div className="bg-black/40 rounded-xl p-4 flex justify-between items-center text-sm border border-white/5 shadow-inner">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded-lg bg-white/5">
                                                        <Scissors className="w-4 h-4 text-neutral-400" />
                                                    </div>
                                                    <span className="text-neutral-200 font-medium">{booking.services?.name}</span>
                                                </div>
                                                <span className="text-amber-500/90 font-bold tracking-tight">RM{booking.services?.price}</span>
                                            </div>
                                        </CardContent>

                                        <CardFooter className="pt-2 pb-6 gap-3 flex-wrap">
                                            <Button variant="outline" className="flex-1 bg-white/5 border-white/10 hover:bg-white/10 text-white hover:text-white font-medium rounded-xl h-11 min-w-[120px]">
                                                <Pencil className="w-4 h-4 mr-2" />
                                                Edit
                                            </Button>

                                            {booking.customer_phone && (
                                                <Button
                                                    variant="outline"
                                                    onClick={() => {
                                                        const message = `Hey ${booking.customer_name}, this is TRIMFLOW Barbershop confirming your ${booking.services?.name} appointment for ${format(new Date(booking.booking_time), 'EEEE, MMM do')} at ${format(new Date(booking.booking_time), 'h:mm a')}. See you then! ✂️`;
                                                        let phoneStr = booking.customer_phone.replace(/\D/g, '');
                                                        if (phoneStr.startsWith('0')) {
                                                            phoneStr = '6' + phoneStr;
                                                        } else if (!phoneStr.startsWith('6')) {
                                                            phoneStr = '60' + phoneStr;
                                                        }
                                                        window.open(`https://wa.me/${phoneStr}?text=${encodeURIComponent(message)}`, '_blank');
                                                    }}
                                                    className="flex-1 bg-[#25D366]/10 border-[#25D366]/20 hover:bg-[#25D366]/20 text-[#25D366] hover:text-[#25D366] font-medium rounded-xl h-11 min-w-[120px]"
                                                >
                                                    <MessageCircle className="w-4 h-4 mr-2" />
                                                    WhatsApp
                                                </Button>
                                            )}

                                            {isUpcoming && (
                                                <Button
                                                    onClick={() => updateStatus(booking.id, 'completed')}
                                                    className="w-full sm:flex-1 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl h-11 shadow-[0_0_15px_rgba(245,158,11,0.2)] mt-2 sm:mt-0"
                                                >
                                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                                    Mark Complete
                                                </Button>
                                            )}
                                        </CardFooter>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </Tabs>
            </main>
        </div>
    );
}
