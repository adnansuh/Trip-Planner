'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Compass, Sparkles, MapPin, Calendar, CreditCard, CheckSquare, Hotel, ChevronRight } from 'lucide-react';

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 overflow-hidden relative">
      {/* Background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-900/20 blur-3xl -z-10" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-purple-900/10 blur-3xl -z-10" />

      {/* Header */}
      <header className="border-b border-slate-900 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/20">
              <Compass className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              AuraTravel
            </span>
          </div>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold transition-all shadow-md shadow-indigo-600/10"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  Log In
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white rounded-lg text-sm font-semibold transition-all shadow-md shadow-indigo-500/20 hover:scale-102"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-16 flex flex-col items-center text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-semibold text-indigo-400 mb-6 shadow-inner">
          <Sparkles className="w-3.5 h-3.5" />
          Powered by Gemini Agentic LLM
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight max-w-4xl leading-tight bg-gradient-to-b from-white via-slate-200 to-slate-500 bg-clip-text text-transparent mb-6">
          Plan Your Next Adventure <br className="hidden md:inline" />
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            In Seconds, Not Hours
          </span>
        </h1>
        
        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mb-8 leading-relaxed">
          Create complete custom itineraries, estimate exact travel budgets, track real expenses, and checklist packing items. 
          A single dashboard for multiple travelers.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-16">
          <Link
            href="/register"
            className="px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white rounded-xl font-semibold text-base transition-all shadow-lg shadow-indigo-500/25 hover:scale-102 flex items-center gap-2 group"
          >
            Start Planning Free
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/login"
            className="px-8 py-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl font-semibold text-base transition-all"
          >
            Explore Dashboard Demo
          </Link>
        </div>

        {/* CSS Dashboard Mockup (Premium UI Showcase) */}
        <div className="w-full max-w-5xl rounded-2xl border border-slate-800/80 bg-slate-900/30 backdrop-blur-xl p-4 md:p-6 shadow-2xl relative">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-indigo-500/5 via-purple-500/0 to-slate-900/0 pointer-events-none" />
          <div className="flex items-center gap-2 border-b border-slate-800/80 pb-4 mb-6">
            <span className="w-3 h-3 rounded-full bg-red-500/50" />
            <span className="w-3 h-3 rounded-full bg-amber-500/50" />
            <span className="w-3 h-3 rounded-full bg-green-500/50" />
            <span className="text-xs text-slate-500 font-mono ml-2">auratravel.com/trips/tokyo-adventure</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            {/* Left: Quick Itinerary */}
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg text-slate-200">Tokyo & Kyoto Culinary Trip</h3>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" /> Japan | <Calendar className="w-3 h-3 ml-2" /> 5 Days</p>
                </div>
                <span className="px-2.5 py-1 rounded-md bg-indigo-950 border border-indigo-900 text-indigo-400 text-xs font-semibold">Mid Range</span>
              </div>

              {/* Day Cards */}
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-indigo-400 tracking-wide">DAY 1</span>
                    <span className="text-xs text-slate-500">Culture & Street Food</span>
                  </div>
                  <h4 className="font-semibold text-sm text-slate-200 mb-1">Explore Historic Asakusa</h4>
                  <p className="text-xs text-slate-400 line-clamp-1">Visit Senso-ji temple and sample local snacks on Nakamise shopping street.</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm opacity-80">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-indigo-400 tracking-wide">DAY 2</span>
                    <span className="text-xs text-slate-500">Tech & Anime culture</span>
                  </div>
                  <h4 className="font-semibold text-sm text-slate-200 mb-1">Akihabara Electric Town</h4>
                  <p className="text-xs text-slate-400 line-clamp-1">Tour high-tech arcades, hobby stores, and enjoy coffee in themed cafes.</p>
                </div>
              </div>
            </div>

            {/* Right: Custom Features preview */}
            <div className="space-y-6">
              {/* Budget Variance Tracker Mock */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <CreditCard className="w-4 h-4 text-purple-400" />
                  <h4 className="font-bold text-xs text-slate-300 uppercase tracking-wider">Expense Analytics</h4>
                </div>
                <div className="flex justify-between items-end mb-2">
                  <div>
                    <span className="text-2xl font-extrabold text-white">$680</span>
                    <span className="text-[10px] text-slate-500 block">Spent out of $1,200</span>
                  </div>
                  <span className="text-xs text-green-400 font-semibold mb-1">-$520 Under Budget</span>
                </div>
                <div className="w-full bg-slate-850 h-2 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full" style={{ width: '56.6%' }} />
                </div>
              </div>

              {/* Hotels preview */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Hotel className="w-4 h-4 text-amber-400" />
                  <h4 className="font-bold text-xs text-slate-300 uppercase tracking-wider">Hotel Recs</h4>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">Hotel Sakura Tokyo</span>
                    <span className="text-amber-400 text-[10px] font-bold">Budget Friendly</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">Shinjuku Grand Hotel</span>
                    <span className="text-indigo-400 text-[10px] font-bold">Mid Range</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid Section */}
      <section className="bg-slate-900/20 border-t border-slate-900/80 py-20 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold text-white mb-4">Complete Agentic Experience</h2>
            <p className="text-slate-400 text-sm md:text-base">Everything you need to plan, schedule, optimize, and organize your trips in one interface.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-indigo-500/30 transition-all group">
              <div className="p-3 bg-indigo-950 border border-indigo-900 rounded-xl w-fit text-indigo-400 group-hover:scale-105 transition-transform mb-4">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-slate-200 mb-2">AI Generator</h3>
              <p className="text-slate-400 text-xs leading-relaxed">Day-by-day itinerary automatically built based on destination, duration, budget, and custom interests.</p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-purple-500/30 transition-all group">
              <div className="p-3 bg-purple-950 border border-purple-900 rounded-xl w-fit text-purple-400 group-hover:scale-105 transition-transform mb-4">
                <CreditCard className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-slate-200 mb-2">Expense Tracker</h3>
              <p className="text-slate-400 text-xs leading-relaxed">Log real expenses on the fly and monitor estimated vs. actual budget splits with interactive dashboard charts.</p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-amber-500/30 transition-all group">
              <div className="p-3 bg-amber-950 border border-amber-900 rounded-xl w-fit text-amber-400 group-hover:scale-105 transition-transform mb-4">
                <Hotel className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-slate-200 mb-2">Hotel Suggestions</h3>
              <p className="text-slate-400 text-xs leading-relaxed">Sourced suggestions tailored to your budget tier (budget, mid-range, and luxury) with ratings and descriptions.</p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-emerald-500/30 transition-all group">
              <div className="p-3 bg-emerald-950 border border-emerald-900 rounded-xl w-fit text-emerald-400 group-hover:scale-105 transition-transform mb-4">
                <CheckSquare className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-slate-200 mb-2">Packing Checklist</h3>
              <p className="text-slate-400 text-xs leading-relaxed">Dynamically generated packing checklist customized to the climate of your destination and your interests.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-8 bg-slate-950 text-center text-xs text-slate-600">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-indigo-500" />
            <span className="font-bold text-slate-400">AuraTravel</span>
          </div>
          <span>&copy; {new Date().getFullYear()} AuraTravel Inc. All rights reserved. Developed for Engineering Assessment.</span>
        </div>
      </footer>
    </div>
  );
}
