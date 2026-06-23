'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Compass, Plus, LogOut, Loader, Trash2, Calendar, MapPin, Sparkles, CreditCard, CheckSquare, ArrowRight } from 'lucide-react';

export default function Dashboard() {
  const { user, token, logout, isAuthenticated, isLoading: authLoading, apiUrl } = useAuth();
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  // Fetch Trips
  const fetchTrips = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${apiUrl}/trips`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        throw new Error('Failed to retrieve your trips.');
      }
      const data = await res.json();
      setTrips(data);
    } catch (err: any) {
      setError(err.message || 'Server error. Failed to retrieve trips.');
    } finally {
      setLoading(false);
    }
  }, [token, apiUrl]);

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchTrips();
    }
  }, [isAuthenticated, token, fetchTrips]);

  // Handle Delete Trip
  const handleDeleteTrip = async (e: React.MouseEvent, tripId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this trip itinerary? This action cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/trips/${tripId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) {
        throw new Error('Failed to delete trip.');
      }

      setTrips(trips.filter(t => t.id !== tripId));
    } catch (err: any) {
      alert(err.message || 'Failed to delete trip.');
    }
  };

  // Calculate quick stats
  const totalTrips = trips.length;
  const totalEstimatedCost = trips.reduce((acc, t) => acc + (t.estimatedBudget?.total || 0), 0);
  const totalActualCost = trips.reduce((acc, t) => {
    const tripExpenses = t.expenses || [];
    return acc + tripExpenses.reduce((sum: number, e: any) => sum + e.amount, 0);
  }, 0);

  const packingCompletion = (() => {
    let totalItems = 0;
    let packedItems = 0;
    trips.forEach(t => {
      const list = t.packingList || [];
      totalItems += list.length;
      packedItems += list.filter((item: any) => item.packed).length;
    });
    return totalItems > 0 ? Math.round((packedItems / totalItems) * 100) : 0;
  })();

  if (authLoading || (!isAuthenticated && !authLoading)) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-950">
        <Loader className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 min-h-screen">
      {/* Header */}
      <header className="border-b border-slate-900 bg-slate-950/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-xl shadow-md">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              AuraTravel
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-slate-400 font-medium">Logged in as</p>
              <p className="text-sm font-semibold text-slate-200">{user?.name}</p>
            </div>
            <button
              onClick={logout}
              className="p-2 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-900 transition-all flex items-center gap-1.5 text-xs font-semibold"
              title="Log Out"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-6 py-10 space-y-10 relative">
        {/* Background blobs */}
        <div className="absolute top-[20%] left-[-5%] w-[400px] h-[400px] rounded-full bg-indigo-900/10 blur-3xl -z-10" />

        {/* Welcome Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-slate-950 border border-slate-900 p-6 md:p-8 rounded-2xl shadow-xl">
          <div>
            <h1 className="text-3xl font-extrabold text-white mb-2 flex items-center gap-2">
              Hey, {user?.name.split(' ')[0]}! <Sparkles className="w-6 h-6 text-indigo-400 animate-pulse" />
            </h1>
            <p className="text-slate-450 text-sm max-w-md">
              Welcome back to your personalized travel control room. Customize, track, and generate your itineraries here.
            </p>
          </div>
          <Link
            href="/trips/new"
            className="w-full md:w-auto px-6 py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-indigo-500/20 hover:scale-102 flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Plan New Trip
          </Link>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <div className="p-4 rounded-xl border border-slate-900 bg-slate-900/10 backdrop-blur-md">
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Total Trips</p>
            <p className="text-2xl font-black text-white">{totalTrips}</p>
          </div>
          <div className="p-4 rounded-xl border border-slate-900 bg-slate-900/10 backdrop-blur-md">
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              Est. Budget
            </p>
            <p className="text-2xl font-black text-white">${totalEstimatedCost.toLocaleString()}</p>
          </div>
          <div className="p-4 rounded-xl border border-slate-900 bg-slate-900/10 backdrop-blur-md">
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1 flex items-center gap-1">
              <CreditCard className="w-3 h-3 text-purple-400" />
              Actual Spent
            </p>
            <p className="text-2xl font-black text-purple-400">${totalActualCost.toLocaleString()}</p>
          </div>
          <div className="p-4 rounded-xl border border-slate-900 bg-slate-900/10 backdrop-blur-md">
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1 flex items-center gap-1">
              <CheckSquare className="w-3 h-3 text-emerald-400" />
              Packed Items
            </p>
            <p className="text-2xl font-black text-emerald-400">{packingCompletion}%</p>
          </div>
        </div>

        {/* Trips List Area */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-200">Your Travel Itineraries</h2>

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4 border border-slate-900 rounded-2xl bg-slate-900/5">
              <Loader className="w-8 h-8 text-indigo-500 animate-spin" />
              <p className="text-sm text-slate-550">Retrieving travel itineraries...</p>
            </div>
          ) : error ? (
            <div className="p-6 text-center border border-red-950/30 bg-red-950/5 rounded-2xl text-sm text-red-400">
              {error}
              <button onClick={fetchTrips} className="mt-4 px-4 py-2 bg-slate-900 hover:bg-slate-800 rounded-lg text-xs font-semibold text-slate-350 block mx-auto border border-slate-850">
                Try Again
              </button>
            </div>
          ) : trips.length === 0 ? (
            <div className="py-20 border border-slate-900/80 border-dashed rounded-2xl bg-slate-900/5 text-center flex flex-col items-center max-w-2xl mx-auto px-6">
              <div className="p-4 bg-slate-900 border border-slate-850 rounded-full text-slate-500 mb-4">
                <Calendar className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-lg text-slate-200 mb-1">No trips planned yet</h3>
              <p className="text-xs text-slate-450 max-w-sm mb-6">
                Ready to explore? Create your first AI-generated day-by-day travel plan and budget in under a minute!
              </p>
              <Link
                href="/trips/new"
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-indigo-600/10 flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Plan Your First Trip
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trips.map((trip) => {
                const totalSpent = (trip.expenses || []).reduce((sum: number, e: any) => sum + e.amount, 0);
                const estTotal = trip.estimatedBudget?.total || 0;
                const percentSpent = estTotal > 0 ? Math.round((totalSpent / estTotal) * 100) : 0;
                
                return (
                  <Link
                    href={`/trips/${trip.id}`}
                    key={trip.id}
                    className="group rounded-2xl border border-slate-900 bg-slate-900/10 hover:bg-slate-900/30 hover:border-slate-800 transition-all p-5 shadow-lg relative flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Header */}
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-bold text-lg text-slate-200 group-hover:text-white transition-colors capitalize">
                            {trip.destination}
                          </h3>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>Itinerary</span>
                            <span className="text-slate-700">•</span>
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{trip.durationDays} Days</span>
                          </div>
                        </div>

                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${
                          trip.budgetType === 'Low' ? 'bg-emerald-950/50 border border-emerald-900 text-emerald-400' :
                          trip.budgetType === 'Medium' ? 'bg-indigo-950/50 border border-indigo-900 text-indigo-400' :
                          'bg-amber-950/50 border border-amber-900 text-amber-400'
                        }`}>
                          {trip.budgetType}
                        </span>
                      </div>

                      {/* Interest Badges */}
                      {trip.interests && trip.interests.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-5">
                          {trip.interests.slice(0, 3).map((interest: string, idx: number) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-md bg-slate-900 text-slate-400 text-[10px] font-medium border border-slate-850"
                            >
                              {interest}
                            </span>
                          ))}
                          {trip.interests.length > 3 && (
                            <span className="text-[10px] text-slate-600 font-semibold self-center ml-0.5">
                              +{trip.interests.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Progress tracking preview */}
                    <div className="border-t border-slate-900/60 pt-4 mt-2 space-y-3">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-500">Expenses Logged</span>
                          <span className={`font-semibold ${totalSpent > estTotal ? 'text-red-400' : 'text-slate-350'}`}>
                            ${totalSpent.toLocaleString()} <span className="text-slate-600">/ ${estTotal.toLocaleString()}</span>
                          </span>
                        </div>
                        <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-850/50">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              totalSpent > estTotal ? 'bg-gradient-to-r from-red-500 to-pink-500' : 'bg-gradient-to-r from-indigo-500 to-purple-500'
                            }`}
                            style={{ width: `${Math.min(percentSpent, 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Bottom Footer Actions */}
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-xs text-indigo-400 font-bold group-hover:text-indigo-300 flex items-center gap-1 transition-colors">
                          View Details
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </span>

                        <button
                          onClick={(e) => handleDeleteTrip(e, trip.id)}
                          className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-900 rounded-lg transition-all"
                          title="Delete Itinerary"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
