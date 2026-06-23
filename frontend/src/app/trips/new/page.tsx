'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Compass, Sparkles, Loader, ChevronLeft, Send, MapPin, Calendar, CreditCard, Tag } from 'lucide-react';

const INTEREST_OPTIONS = [
  { id: 'Food', label: 'Food & Dining', desc: 'Street food, fine dining, cooking classes' },
  { id: 'Culture', label: 'Culture & History', desc: 'Museums, historic shrines, historic walks' },
  { id: 'Adventure', label: 'Adventure & Sport', desc: 'Hiking, rafting, off-road tours' },
  { id: 'Shopping', label: 'Shopping', desc: 'Boutiques, local markets, designer outlets' },
  { id: 'Relaxing', label: 'Relaxing & Wellness', desc: 'Thermal baths, spas, slow cafe walks' },
  { id: 'Nightlife', label: 'Nightlife', desc: 'Pubs, live music shows, club crawls' }
];

export default function NewTrip() {
  const { token, isAuthenticated, isLoading: authLoading, apiUrl } = useAuth();
  const [destination, setDestination] = useState('');
  const [durationDays, setDurationDays] = useState(3);
  const [budgetType, setBudgetType] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  // Loading animation step messages
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isSubmitting) {
      timer = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % 4);
      }, 3500);
    }
    return () => clearInterval(timer);
  }, [isSubmitting]);

  const toggleInterest = (id: string) => {
    if (selectedInterests.includes(id)) {
      setSelectedInterests(selectedInterests.filter(x => x !== id));
    } else {
      setSelectedInterests([...selectedInterests, id]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    if (!destination.trim()) {
      setError('Please provide a valid destination.');
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/trips`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          destination: destination.trim(),
          durationDays,
          budgetType,
          interests: selectedInterests
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate itinerary.');
      }

      router.push(`/trips/${data.id}`);
    } catch (err: any) {
      console.error('Trip generation error:', err);
      setError(err.message || 'Server error. Failed to generate trip.');
      setIsSubmitting(false);
    }
  };

  const loadingMessages = [
    'Consulting local travel experts...',
    'Designing day-by-day itineraries...',
    'Estimating budget & flight metrics...',
    'Customizing travel packing lists...'
  ];

  if (authLoading || (!isAuthenticated && !authLoading)) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-950">
        <Loader className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 min-h-screen relative">
      {/* Background blurs */}
      <div className="absolute top-[10%] right-[10%] w-[500px] h-[500px] rounded-full bg-purple-900/10 blur-3xl -z-10" />

      {/* Loading Overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-50 flex flex-col items-center justify-center text-center p-6">
          <div className="p-4 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-2xl shadow-xl shadow-indigo-500/20 mb-8 animate-bounce">
            <Compass className="w-10 h-10 text-white animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2 animate-pulse">Generating Your Custom Trip</h2>
          <p className="text-sm text-slate-400 max-w-sm h-6 transition-all duration-550 font-medium">
            {loadingMessages[loadingStep]}
          </p>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-slate-900 bg-slate-950/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 transition-all flex items-center gap-1.5 text-xs font-semibold">
            <ChevronLeft className="w-4 h-4" />
            Dashboard
          </Link>
          <span className="text-sm font-semibold text-slate-450">Itinerary Wizard</span>
          <div className="w-8 h-8" /> {/* Balance spacer */}
        </div>
      </header>

      {/* Form Area */}
      <main className="flex-grow max-w-2xl w-full mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-2 mb-2">
            Plan Your Next Adventure <Sparkles className="w-5 h-5 text-indigo-400" />
          </h1>
          <p className="text-sm text-slate-450">
            Tell us where you want to go, and Gemini AI will curate a complete personalized day-by-day plan.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/30 border border-red-900/50 text-xs text-red-400 flex items-start gap-3">
            <Loader className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Step 1: Destination */}
          <div className="space-y-3 bg-slate-900/10 border border-slate-900 p-5 rounded-2xl">
            <label htmlFor="destination" className="font-bold text-sm text-slate-200 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-indigo-400" />
              Where is your destination?
            </label>
            <input
              type="text"
              id="destination"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full px-4 py-3.5 bg-slate-900 border border-slate-800 focus:border-indigo-500/80 rounded-xl text-sm text-slate-200 placeholder-slate-655 focus:outline-none transition-colors"
              placeholder="e.g. Paris, France or Tokyo, Japan"
              required
            />
          </div>

          {/* Step 2: Duration */}
          <div className="space-y-3 bg-slate-900/10 border border-slate-900 p-5 rounded-2xl">
            <label htmlFor="duration" className="font-bold text-sm text-slate-200 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-400" />
                How many days?
              </span>
              <span className="text-indigo-400 font-black">{durationDays} Days</span>
            </label>
            <input
              type="range"
              id="duration"
              min="1"
              max="14"
              value={durationDays}
              onChange={(e) => setDurationDays(parseInt(e.target.value))}
              className="w-full accent-indigo-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-550 font-bold px-1">
              <span>1 DAY</span>
              <span>7 DAYS</span>
              <span>14 DAYS</span>
            </div>
          </div>

          {/* Step 3: Budget Tier */}
          <div className="space-y-3 bg-slate-900/10 border border-slate-900 p-5 rounded-2xl">
            <label className="font-bold text-sm text-slate-200 flex items-center gap-2 mb-1">
              <CreditCard className="w-4 h-4 text-amber-400" />
              Select your budget tier
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(['Low', 'Medium', 'High'] as const).map((tier) => (
                <button
                  type="button"
                  key={tier}
                  onClick={() => setBudgetType(tier)}
                  className={`p-4 rounded-xl border text-left flex flex-col transition-all cursor-pointer ${
                    budgetType === tier
                      ? 'border-indigo-500 bg-indigo-500/5 text-white'
                      : 'border-slate-850 bg-slate-900/20 text-slate-400 hover:border-slate-800'
                  }`}
                >
                  <span className={`text-xs font-black uppercase tracking-wider ${
                    budgetType === tier ? 'text-indigo-400' : 'text-slate-500'
                  }`}>
                    {tier}
                  </span>
                  <span className="text-slate-300 font-semibold text-xs mt-1.5">
                    {tier === 'Low' ? 'Budget Friendly' : tier === 'Medium' ? 'Mid Range' : 'Luxury / Premium'}
                  </span>
                  <span className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                    {tier === 'Low' ? 'Hostels, local diners, and free tours.' :
                     tier === 'Medium' ? 'Boutique hotels, mid-tier meals, and activities.' :
                     'Fine dining, standard hotel rooms, and private guides.'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Step 4: Interests */}
          <div className="space-y-3 bg-slate-900/10 border border-slate-900 p-5 rounded-2xl">
            <label className="font-bold text-sm text-slate-200 flex items-center gap-2 mb-1">
              <Tag className="w-4 h-4 text-emerald-400" />
              What are your interests? (Select all that apply)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {INTEREST_OPTIONS.map((opt) => {
                const active = selectedInterests.includes(opt.id);
                return (
                  <button
                    type="button"
                    key={opt.id}
                    onClick={() => toggleInterest(opt.id)}
                    className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                      active
                        ? 'border-indigo-500 bg-indigo-500/5 text-white'
                        : 'border-slate-850 bg-slate-900/20 text-slate-400 hover:border-slate-800'
                    }`}
                  >
                    <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                      active ? 'border-indigo-500 bg-indigo-600' : 'border-slate-700'
                    }`}>
                      {active && <span className="text-[10px] font-black text-white">✓</span>}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-200 block">{opt.label}</span>
                      <span className="text-[10px] text-slate-500 block mt-0.5 leading-snug">{opt.desc}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-400 hover:to-pink-400 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-indigo-500/25 hover:scale-102 flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            Generate Custom Itinerary
          </button>
        </form>
      </main>
    </div>
  );
}
