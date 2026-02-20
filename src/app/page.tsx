'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Scissors, Clock, CalendarIcon, ChevronRight, CheckCircle2 } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { QRCodeCanvas } from 'qrcode.react';

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
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // Details
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  // Generate next 14 days
  const availableDates = Array.from({ length: 14 }).map((_, i) => addDays(new Date(), i));

  // Mock available times
  const availableTimes = ['10:00 AM', '11:00 AM', '1:00 PM', '2:30 PM', '4:00 PM', '5:00 PM'];

  useEffect(() => {
    async function fetchServices() {
      const { data } = await supabase.from('services').select('*').order('price', { ascending: true });
      if (data) setServices(data);
    }
    fetchServices();
  }, []);

  const handleBook = async () => {
    if (!selectedService || !selectedTime || !name || !phone) return;
    setLoading(true);

    // Convert selected time to a rough timestamp for the DB
    const [time, period] = selectedTime.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;

    const bookingTime = new Date(selectedDate);
    bookingTime.setHours(hours, minutes, 0, 0);

    const { error } = await supabase.from('bookings').insert({
      service_id: selectedService.id,
      customer_name: name,
      customer_phone: phone,
      booking_time: bookingTime.toISOString(),
      status: 'pending'
    });

    setLoading(false);
    if (!error) {
      setStep(4); // Success step
    } else {
      alert('Error booking appointment.');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 selection:bg-neutral-800">
      <header className="border-b border-neutral-900 bg-black/50 backdrop-blur top-0 sticky z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scissors className="w-6 h-6 text-white" />
            <span className="font-bold text-xl tracking-tighter">TRIMFLOW</span>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-6 py-12">
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-3xl font-light tracking-tight mb-2">Select a Service</h1>
            <p className="text-neutral-400 mb-8">Choose the sharp look you need today.</p>

            <div className="space-y-4">
              {services.map(service => (
                <button
                  key={service.id}
                  onClick={() => {
                    setSelectedService(service);
                    setStep(2);
                  }}
                  className="w-full text-left p-5 rounded-2xl bg-neutral-900/50 border border-neutral-800 hover:border-neutral-600 hover:bg-neutral-800/50 transition-all group relative overflow-hidden"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-lg">{service.name}</h3>
                    <span className="font-semibold text-white/90">${service.price}</span>
                  </div>
                  <p className="text-neutral-400 text-sm mb-4 line-clamp-2">{service.description}</p>
                  <div className="flex items-center text-xs text-neutral-500 gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {service.duration_minutes} mins
                  </div>
                </button>
              ))}
              {services.length === 0 && (
                <div className="text-center py-12 text-neutral-500 border border-neutral-800 border-dashed rounded-2xl">
                  Loading services...
                </div>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <button onClick={() => setStep(1)} className="text-sm text-neutral-400 hover:text-white mb-6 flex items-center gap-1 transition-colors">
              ← Back to services
            </button>
            <h1 className="text-3xl font-light tracking-tight mb-2">Choose Date & Time</h1>
            <p className="text-neutral-400 mb-8">For {selectedService?.name}</p>

            <div className="mb-8">
              <h3 className="text-sm font-medium mb-4 text-neutral-300">Available Days</h3>
              <div className="flex gap-3 overflow-x-auto pb-4 snap-x hide-scrollbar">
                {availableDates.map((date, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedDate(date)}
                    className={`snap-center shrink-0 flex flex-col items-center justify-center w-16 h-20 rounded-xl border transition-all ${selectedDate.toDateString() === date.toDateString() ? 'border-white bg-white text-black' : 'border-neutral-800 bg-neutral-900/50 text-neutral-400 hover:border-neutral-700'}`}
                  >
                    <span className="text-xs uppercase font-medium">{format(date, 'EEE')}</span>
                    <span className="text-xl font-semibold mt-1">{format(date, 'd')}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-8 relative">
              <div className="absolute inset-x-0 -top-4 h-4 bg-gradient-to-b from-neutral-950 to-transparent z-10"></div>
              <h3 className="text-sm font-medium mb-4 text-neutral-300">Available Times</h3>
              <div className="grid grid-cols-3 gap-3">
                {availableTimes.map(time => (
                  <button
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    className={`py-3 rounded-xl text-sm font-medium border transition-all ${selectedTime === time ? 'border-white bg-white text-black' : 'border-neutral-800 bg-neutral-900/50 text-neutral-400 hover:border-neutral-700'}`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>

            <button
              disabled={!selectedTime}
              onClick={() => setStep(3)}
              className="w-full bg-white text-black font-medium text-lg py-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2"
            >
              Continue <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <button onClick={() => setStep(2)} className="text-sm text-neutral-400 hover:text-white mb-6 flex items-center gap-1 transition-colors">
              ← Back to calendar
            </button>
            <h1 className="text-3xl font-light tracking-tight mb-2">Your Details</h1>
            <p className="text-neutral-400 mb-8">Almost done. We just need to know who's coming.</p>

            <div className="bg-neutral-900/40 rounded-2xl p-5 mb-8 border border-neutral-800/80">
              <h3 className="font-medium text-white mb-1">{selectedService?.name}</h3>
              <div className="flex items-center text-sm text-neutral-400 gap-4 mb-3">
                <span className="flex items-center gap-1"><CalendarIcon className="w-4 h-4" /> {format(selectedDate, 'MMM d, yyyy')}</span>
                <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {selectedTime}</span>
              </div>
              <div className="text-xl font-medium text-white/90">${selectedService?.price} <span className="text-sm text-neutral-500 font-normal">Pay in person</span></div>
            </div>

            <div className="space-y-4 mb-10">
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-1.5 ml-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full bg-neutral-900/50 border border-neutral-800 rounded-xl px-4 py-3.5 text-white placeholder-neutral-600 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-1.5 ml-1">WhatsApp / Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+1 234 567 8900"
                  className="w-full bg-neutral-900/50 border border-neutral-800 rounded-xl px-4 py-3.5 text-white placeholder-neutral-600 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all"
                />
              </div>
            </div>

            <button
              disabled={loading || !name || !phone}
              onClick={handleBook}
              className="w-full bg-white text-black font-medium text-lg py-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-200 transition-colors"
            >
              {loading ? 'Confirming...' : 'Confirm Booking'}
            </button>
          </div>
        )}

        {step === 4 && (
          <div className="animate-in fade-in zoom-in-95 duration-700 mt-12 text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h1 className="text-3xl font-light tracking-tight mb-3">Booking Confirmed!</h1>
            <p className="text-neutral-400 text-lg mb-8 max-w-sm">
              We've saved your spot for <strong>{selectedService?.name}</strong> on <strong>{format(selectedDate, 'MMM d')}</strong> at <strong>{selectedTime}</strong>.
            </p>

            <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-8 mb-8 flex flex-col items-center justify-center w-full max-w-xs">
              <h3 className="text-sm font-medium text-neutral-400 mb-4 tracking-wide uppercase">Pay in Person (QR)</h3>
              <div className="bg-white p-4 rounded-2xl">
                <QRCodeCanvas value={`banktransfer://amount=${selectedService?.price}&note=trimflow`} size={150} level="H" />
              </div>
              <p className="mt-4 font-bold text-white text-xl">${selectedService?.price}</p>
            </div>

            <button
              onClick={() => {
                setStep(1);
                setSelectedService(null);
                setSelectedTime(null);
                setName('');
                setPhone('');
              }}
              className="text-neutral-300 border border-neutral-700 hover:bg-neutral-800 py-3 px-8 rounded-full transition-all"
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
