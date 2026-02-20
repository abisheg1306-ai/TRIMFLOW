'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Scissors, Clock, CalendarIcon, ChevronRight, CheckCircle2 } from 'lucide-react';
import { format, isBefore, startOfToday } from 'date-fns';
import { Calendar } from "@/components/ui/calendar";

type Service = {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
  price: number;
};

export default function Home() {
  const [step, setStep] = useState(1);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  // Date & Time
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // Details
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  // Mock available times
  const availableTimes = ['10:00 AM', '11:00 AM', '1:00 PM', '2:30 PM', '4:00 PM', '5:00 PM'];

  useEffect(() => {
    async function fetchServices() {
      const { data } = await supabase.from('services').select('*').order('price', { ascending: true });
      if (data) setServices(data);
    }
    fetchServices();
  }, []);

  // Handle Stripe Success Return
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const bookingId = urlParams.get('booking_id');

    if (success === 'true' && bookingId) {
      // Deposit paid successfully. Mark status as pending so it shows on the Barber Dashboard
      supabase.from('bookings').update({ status: 'pending' }).eq('id', bookingId).then(() => {
        setStep(4);
        window.history.replaceState(null, '', window.location.pathname);
      });
    }
  }, []);

  const handleBook = async () => {
    if (!selectedService || !selectedDate || !selectedTime || !name || !phone) return;
    setLoading(true);

    // Convert selected time to a rough timestamp for the DB
    const [time, period] = selectedTime.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;

    const bookingTime = new Date(selectedDate);
    bookingTime.setHours(hours, minutes, 0, 0);

    // Save as 'awaiting_payment' pending Stripe deposit checkout
    const { data: bookingData, error } = await supabase.from('bookings').insert({
      service_id: selectedService.id,
      customer_name: name,
      customer_phone: phone,
      booking_time: bookingTime.toISOString(),
      status: 'awaiting_payment'
    }).select().single();

    if (error || !bookingData) {
      setLoading(false);
      alert('Error initiating booking.');
      return;
    }

    // Call checkout API route with fixed $10 deposit for the Stripe session
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: bookingData.id,
          service_name: selectedService.name,
          customer_name: name,
          deposit_amount: 10
        })
      });
      const checkout = await res.json();
      if (checkout.url) {
        window.location.href = checkout.url; // Redirect to Stripe securely
      } else {
        throw new Error(checkout.error || 'Failed to create checkout session');
      }
    } catch (err) {
      console.error(err);
      alert('Payment initialization failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-neutral-100 font-sans selection:bg-amber-500/30">
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.3)]">
              <Scissors className="w-5 h-5 text-neutral-950" />
            </div>
            <span className="font-bold text-2xl tracking-tighter text-white drop-shadow-sm">TRIMFLOW</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12 md:py-20">
        {step === 1 && (
          <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3 text-white">Select a Service</h1>
            <p className="text-neutral-400 text-lg mb-12">Choose the sharp look you need today.</p>

            <div className="grid gap-5 md:grid-cols-2">
              {services.map(service => (
                <button
                  key={service.id}
                  onClick={() => {
                    setSelectedService(service);
                    setStep(2);
                  }}
                  className="w-full text-left p-6 rounded-3xl bg-white/5 border border-white/10 hover:border-amber-500/50 hover:bg-neutral-900 shadow-xl transition-all duration-300 group relative overflow-hidden backdrop-blur-md hover:scale-[1.02]"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-[50px] -mr-16 -mt-16 group-hover:bg-amber-500/20 transition-all"></div>
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-bold text-xl text-white group-hover:text-amber-500 transition-colors">{service.name}</h3>
                      <span className="font-black text-xl text-white drop-shadow-md group-hover:text-amber-500 transition-colors">${service.price}</span>
                    </div>
                    <p className="text-neutral-400 text-sm mb-6 line-clamp-2 leading-relaxed">{service.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm font-medium text-neutral-400 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
                        <Clock className="w-4 h-4 mr-2 text-neutral-500" />
                        {service.duration_minutes} mins
                      </div>
                      <ChevronRight className="w-5 h-5 text-neutral-600 group-hover:text-amber-500 transition-colors transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </button>
              ))}
              {services.length === 0 && (
                <div className="col-span-1 md:col-span-2 text-center py-20 text-neutral-500 border border-white/10 border-dashed rounded-3xl bg-white/5 backdrop-blur-sm">
                  <Scissors className="w-8 h-8 animate-spin mx-auto mb-4 text-amber-500/50" />
                  <p className="font-medium">Loading premium services...</p>
                </div>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-8 duration-700 ease-out max-w-5xl mx-auto">
            <button onClick={() => setStep(1)} className="text-sm font-medium text-neutral-400 hover:text-white mb-8 flex items-center gap-2 transition-colors">
              <ChevronRight className="w-4 h-4 rotate-180" /> Back to services
            </button>
            <div className="mb-10">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3 text-white">Choose Date & Time</h1>
              <div className="flex items-center gap-3 text-lg">
                <span className="text-neutral-400">For</span>
                <span className="text-amber-500 font-bold bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20">{selectedService?.name}</span>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-10 lg:gap-16">
              {/* Left Column: Shadcn Calendar */}
              <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 md:p-8 backdrop-blur-xl shadow-2xl h-fit">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date);
                    setSelectedTime(null); // Reset time when date changes
                  }}
                  disabled={(date) => isBefore(date, startOfToday())} // Disable past dates!
                  className="mx-auto"
                  classNames={{
                    months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                    month: "space-y-4",
                    caption: "flex justify-center pt-1 relative items-center mb-6",
                    caption_label: "text-lg font-bold text-white",
                    nav: "space-x-1 flex items-center",
                    nav_button: "h-9 w-9 bg-transparent hover:bg-white/10 p-0 text-white rounded-xl transition-colors",
                    nav_button_previous: "absolute left-1",
                    nav_button_next: "absolute right-1",
                    table: "w-full border-collapse space-y-1",
                    head_row: "flex w-full mb-3",
                    head_cell: "text-neutral-500 rounded-md w-10 font-bold text-[0.8rem] uppercase tracking-wider",
                    row: "flex w-full mt-2 justify-between",
                    cell: "h-11 w-11 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-white/5 [&:has([aria-selected])]:bg-transparent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                    day: "h-11 w-11 p-0 font-medium rounded-xl aria-selected:opacity-100 hover:bg-neutral-800 text-neutral-300 transition-all",
                    day_range_end: "day-outside text-neutral-500 aria-selected:bg-amber-500 aria-selected:text-neutral-950",
                    day_selected: "bg-amber-500 text-neutral-950 hover:bg-amber-400 hover:text-neutral-950 font-bold shadow-[0_0_15px_rgba(245,158,11,0.4)] scale-110",
                    day_today: "bg-white/10 text-white font-bold",
                    day_outside: "day-outside text-neutral-600 opacity-50 aria-selected:bg-white/5 aria-selected:text-neutral-400 aria-selected:opacity-30",
                    day_disabled: "text-neutral-700 opacity-50 cursor-not-allowed hover:bg-transparent",
                    day_range_middle: "aria-selected:bg-white/5 aria-selected:text-neutral-900",
                    day_hidden: "invisible",
                  }}
                />
              </div>

              {/* Right Column: Time Slots */}
              <div>
                {!selectedDate ? (
                  <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-neutral-500 bg-white/[0.02] border border-white/5 rounded-[2rem] border-dashed p-8 text-center">
                    <CalendarIcon className="w-12 h-12 mb-4 text-neutral-700" />
                    <h3 className="text-xl font-medium text-white mb-2">Select a Date</h3>
                    <p className="max-w-[250px]">Please choose a day on the calendar to see our available openings.</p>
                  </div>
                ) : (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-white">Available Times</h3>
                      <span className="text-neutral-400 text-sm font-medium">{format(selectedDate, 'MMM do')}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 auto-rows-fr">
                      {availableTimes.map(time => (
                        <button
                          key={time}
                          onClick={() => setSelectedTime(time)}
                          className={`py-4 px-2 rounded-2xl text-base font-bold transition-all duration-300 ${selectedTime === time ? 'border-amber-500 bg-amber-500 text-neutral-950 shadow-[0_0_20px_rgba(245,158,11,0.3)] scale-[1.03]' : 'border border-white/10 bg-white/5 text-neutral-300 hover:border-amber-500/50 hover:bg-neutral-900'}`}
                        >
                          {time}
                        </button>
                      ))}
                    </div>

                    <div className="mt-12">
                      <button
                        disabled={!selectedTime}
                        onClick={() => setStep(3)}
                        className="w-full bg-white hover:bg-neutral-200 disabled:bg-white/10 text-neutral-950 disabled:text-neutral-500 font-bold text-lg py-5 rounded-2xl disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2 group shadow-xl"
                      >
                        Continue to Details <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-8 duration-700 ease-out max-w-2xl mx-auto">
            <button onClick={() => setStep(2)} className="text-sm font-medium text-neutral-400 hover:text-white mb-8 flex items-center gap-2 transition-colors">
              <ChevronRight className="w-4 h-4 rotate-180" /> Back to calendar
            </button>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3 text-white">Your Details</h1>
            <p className="text-neutral-400 text-lg mb-10">We just need your name and number to lock it in.</p>

            <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-[2rem] p-8 mb-10 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-[60px] -mr-20 -mt-20 pointer-events-none"></div>

              <div className="relative z-10">
                <h3 className="font-bold text-2xl text-white mb-6">{selectedService?.name}</h3>
                <div className="flex flex-col gap-3 mb-8">
                  <div className="flex items-center text-neutral-300 gap-4 bg-black/40 p-4 rounded-xl border border-white/5">
                    <CalendarIcon className="w-5 h-5 text-amber-500" />
                    <span className="font-medium text-lg">{selectedDate ? format(selectedDate, 'EEEE, MMM do, yyyy') : ''}</span>
                  </div>
                  <div className="flex items-center text-neutral-300 gap-4 bg-black/40 p-4 rounded-xl border border-white/5">
                    <Clock className="w-5 h-5 text-amber-500" />
                    <span className="font-medium text-lg">{selectedTime}</span>
                  </div>
                </div>

                <div className="flex items-end justify-between pt-6 border-t border-white/10">
                  <div className="flex flex-col">
                    <span className="text-neutral-500 font-medium mb-1">Total Amount</span>
                    <span className="text-sm text-amber-500 font-bold uppercase tracking-wider">Pay in person</span>
                  </div>
                  <div className="text-4xl font-black text-white drop-shadow-md">RM{selectedService?.price}</div>
                </div>
              </div>
            </div>

            <div className="space-y-6 mb-12">
              <div>
                <label className="block text-sm font-bold tracking-wide text-neutral-400 uppercase mb-2 ml-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-lg text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all duration-300 shadow-inner"
                />
              </div>
              <div>
                <label className="block text-sm font-bold tracking-wide text-neutral-400 uppercase mb-2 ml-1">WhatsApp / Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="012 345 6789"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-lg text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all duration-300 shadow-inner"
                />
              </div>
            </div>

            <button
              disabled={loading || !name || !phone}
              onClick={handleBook}
              className="w-full bg-amber-500 text-neutral-950 font-extrabold text-xl py-5 rounded-2xl disabled:opacity-50 disabled:bg-neutral-800 disabled:text-neutral-500 disabled:cursor-not-allowed transition-all duration-300 hover:scale-[1.02] shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)]"
            >
              {loading ? 'Initializing Secure Payment...' : 'Pay RM10 Deposit & Confirm'}
            </button>
          </div>
        )}

        {step === 4 && (
          <div className="animate-in fade-in zoom-in-95 duration-1000 mt-12 text-center flex flex-col items-center max-w-lg mx-auto">
            <div className="w-24 h-24 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-4 text-white">Deposit Paid!</h1>
            <p className="text-neutral-400 text-lg mb-10 leading-relaxed">
              Booking confirmed securely. We've locked in your spot and notified the barber!
            </p>

            <button
              onClick={() => {
                setStep(1);
                setSelectedService(null);
                setSelectedDate(undefined);
                setSelectedTime(null);
                setName('');
                setPhone('');
              }}
              className="text-neutral-400 font-bold border border-neutral-800 bg-neutral-900/50 hover:bg-neutral-800 hover:text-white py-4 px-10 rounded-2xl transition-all duration-300 hover:border-neutral-600"
            >
              Book Another Service
            </button>
          </div>
        )}
      </main>

      {/* Global override for specific custom scrollbar */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </div>
  );
}
