'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Compass, ChevronLeft, Loader, Calendar, MapPin, Sparkles, CreditCard, CheckSquare, Hotel,
  Plus, Trash2, RefreshCw, Send, Check, X, PieChart, Info, HelpCircle
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

export default function TripDetails() {
  const { id } = useParams() as { id: string };
  const { token, isAuthenticated, isLoading: authLoading, apiUrl } = useAuth();
  
  const [trip, setTrip] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'itinerary' | 'hotels' | 'expenses' | 'packing'>('itinerary');
  
  const router = useRouter();

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  // Fetch Trip Details
  const fetchTripDetails = useCallback(async () => {
    if (!token || !id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${apiUrl}/trips/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        throw new Error('Trip not found or access denied.');
      }
      const data = await res.json();
      setTrip(data);
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve trip details.');
    } finally {
      setLoading(false);
    }
  }, [token, id, apiUrl]);

  useEffect(() => {
    if (isAuthenticated && token && id) {
      fetchTripDetails();
    }
  }, [isAuthenticated, token, id, fetchTripDetails]);

  // Handle direct itinerary updates (for manual Add/Remove activities)
  const saveItineraryUpdate = async (updatedItinerary: any) => {
    try {
      const res = await fetch(`${apiUrl}/trips/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ itinerary: updatedItinerary })
      });
      if (!res.ok) throw new Error('Failed to update itinerary.');
      const data = await res.json();
      setTrip(data);
    } catch (err: any) {
      alert(err.message || 'Failed to save updates.');
    }
  };

  // ----------------------------------------------------
  // ITINERARY TAB CONTROLS
  // ----------------------------------------------------
  const [regenPrompts, setRegenPrompts] = useState<Record<number, string>>({});
  const [regenLoading, setRegenLoading] = useState<Record<number, boolean>>({});
  const [showAddForm, setShowAddForm] = useState<number | null>(null); // Day index where form is shown
  
  // New activity form state
  const [newActTime, setNewActTime] = useState('Morning');
  const [newActTitle, setNewActTitle] = useState('');
  const [newActDesc, setNewActDesc] = useState('');
  const [newActCost, setNewActCost] = useState('0');

  // Handle Remove Activity
  const handleRemoveActivity = async (dayNumber: number, activityId: string) => {
    const updatedItinerary = trip.itinerary.map((day: any) => {
      if (day.day === dayNumber) {
        return {
          ...day,
          activities: day.activities.filter((act: any) => act.id !== activityId)
        };
      }
      return day;
    });
    
    // Optimistic UI update
    setTrip((prev: any) => ({ ...prev, itinerary: updatedItinerary }));
    await saveItineraryUpdate(updatedItinerary);
  };

  // Handle Add Activity
  const handleAddActivity = async (dayNumber: number) => {
    if (!newActTitle.trim() || !newActDesc.trim()) {
      alert('Please fill in title and description.');
      return;
    }

    const newActivity = {
      id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      time: newActTime,
      title: newActTitle.trim(),
      description: newActDesc.trim(),
      cost: parseFloat(newActCost) || 0
    };

    const updatedItinerary = trip.itinerary.map((day: any) => {
      if (day.day === dayNumber) {
        return {
          ...day,
          activities: [...day.activities, newActivity]
        };
      }
      return day;
    });

    // Reset Form state
    setNewActTitle('');
    setNewActDesc('');
    setNewActCost('0');
    setShowAddForm(null);

    // Optimistic UI update
    setTrip((prev: any) => ({ ...prev, itinerary: updatedItinerary }));
    await saveItineraryUpdate(updatedItinerary);
  };

  // Handle Regenerate Day with LLM
  const handleRegenerateDay = async (dayNumber: number) => {
    const promptText = regenPrompts[dayNumber]?.trim();
    if (!promptText) {
      alert('Please enter instructions for the AI (e.g. "make it focus on museums").');
      return;
    }

    try {
      setRegenLoading(prev => ({ ...prev, [dayNumber]: true }));
      const res = await fetch(`${apiUrl}/trips/${id}/regenerate-day`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ dayNumber, prompt: promptText })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to regenerate day.');
      }

      const data = await res.json();
      setTrip(data); // Returns complete updated trip
      setRegenPrompts(prev => ({ ...prev, [dayNumber]: '' }));
    } catch (err: any) {
      alert(err.message || 'Day regeneration failed.');
    } finally {
      setRegenLoading(prev => ({ ...prev, [dayNumber]: false }));
    }
  };

  // ----------------------------------------------------
  // EXPENSES TAB CONTROLS
  // ----------------------------------------------------
  const [expenseCategory, setExpenseCategory] = useState<'Flights' | 'Accommodation' | 'Food' | 'Activities' | 'Miscellaneous'>('Food');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseSubmitting, setExpenseSubmitting] = useState(false);

  // Split bills state
  const [companions, setCompanions] = useState<string[]>([]);
  const [newCompanion, setNewCompanion] = useState('');

  // Handle Add Expense
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseAmount || parseFloat(expenseAmount) <= 0) {
      alert('Please enter a valid amount.');
      return;
    }

    try {
      setExpenseSubmitting(true);
      const res = await fetch(`${apiUrl}/trips/${id}/expenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          category: expenseCategory,
          amount: parseFloat(expenseAmount),
          date: expenseDate,
          description: expenseDesc.trim()
        })
      });

      if (!res.ok) throw new Error('Failed to add expense.');
      const data = await res.json();
      setTrip(data);
      
      // Reset Form
      setExpenseAmount('');
      setExpenseDesc('');
    } catch (err: any) {
      alert(err.message || 'Failed to add expense.');
    } finally {
      setExpenseSubmitting(false);
    }
  };

  // Handle Delete Expense
  const handleDeleteExpense = async (expenseId: string) => {
    if (!confirm('Remove this expense record?')) return;
    try {
      const res = await fetch(`${apiUrl}/trips/${id}/expenses/${expenseId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete expense.');
      const data = await res.json();
      setTrip(data);
    } catch (err: any) {
      alert(err.message || 'Failed to delete expense.');
    }
  };

  // Handle Add Companion
  const handleAddCompanion = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCompanion.trim() && !companions.includes(newCompanion.trim())) {
      setCompanions([...companions, newCompanion.trim()]);
      setNewCompanion('');
    }
  };

  // Handle Remove Companion
  const handleRemoveCompanion = (name: string) => {
    setCompanions(companions.filter(c => c !== name));
  };

  // ----------------------------------------------------
  // PACKING TAB CONTROLS
  // ----------------------------------------------------
  const [newPackItem, setNewPackItem] = useState('');
  const [newPackCategory, setNewPackCategory] = useState('Essentials');

  // Handle Toggle Checkbox
  const handleTogglePacking = async (itemId: string, currentPacked: boolean) => {
    try {
      // Optimistic UI Update
      setTrip((prev: any) => ({
        ...prev,
        packingList: prev.packingList.map((item: any) =>
          item.id === itemId ? { ...item, packed: !currentPacked } : item
        )
      }));

      const res = await fetch(`${apiUrl}/trips/${id}/packing/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ itemId, packed: !currentPacked })
      });
      if (!res.ok) throw new Error('Failed to save packed state.');
    } catch (err: any) {
      console.error(err.message);
      // Revert if error
      fetchTripDetails();
    }
  };

  // Handle Manually Add Packing Item
  const handleAddPackingItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPackItem.trim()) return;

    const newItem = {
      id: `pack-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: newPackItem.trim(),
      category: newPackCategory,
      packed: false
    };

    const updatedPackingList = [...(trip.packingList || []), newItem];

    setTrip((prev: any) => ({ ...prev, packingList: updatedPackingList }));
    setNewPackItem('');

    try {
      const res = await fetch(`${apiUrl}/trips/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ packingList: updatedPackingList })
      });
      if (!res.ok) throw new Error('Failed to save packing list.');
      const data = await res.json();
      setTrip(data);
    } catch (err: any) {
      alert(err.message || 'Failed to add item.');
    }
  };

  // ----------------------------------------------------
  // COMPUTED METRICS
  // ----------------------------------------------------
  const getExpensesByCategory = () => {
    const list = trip?.expenses || [];
    const breakdown = { Flights: 0, Accommodation: 0, Food: 0, Activities: 0, Miscellaneous: 0 };
    list.forEach((e: any) => {
      if (e.category in breakdown) {
        breakdown[e.category as keyof typeof breakdown] += e.amount;
      }
    });
    return breakdown;
  };

  const getExpensesChartData = () => {
    if (!trip) return [];
    const actuals = getExpensesByCategory();
    const est = trip.estimatedBudget || { flights: 0, accommodation: 0, food: 0, activities: 0 };
    return [
      { name: 'Flights', Estimated: est.flights || 0, Actual: actuals.Flights },
      { name: 'Lodging', Estimated: est.accommodation || 0, Actual: actuals.Accommodation },
      { name: 'Food', Estimated: est.food || 0, Actual: actuals.Food },
      { name: 'Activities', Estimated: est.activities || 0, Actual: actuals.Activities }
    ];
  };

  const actualTotals = () => {
    const list = trip?.expenses || [];
    return list.reduce((sum: number, e: any) => sum + e.amount, 0);
  };

  if (authLoading || loading || !trip) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-950 gap-4 text-slate-400">
        {error ? (
          <div className="p-6 text-center max-w-md border border-red-950 bg-red-950/10 rounded-2xl">
            <p className="text-red-400 font-semibold mb-4">{error}</p>
            <Link href="/dashboard" className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-semibold text-slate-200">
              Return to Dashboard
            </Link>
          </div>
        ) : (
          <>
            <Loader className="w-8 h-8 text-indigo-500 animate-spin" />
            <p className="text-xs">Sourcing travel documents...</p>
          </>
        )}
      </div>
    );
  }

  const expActual = actualTotals();
  const expEst = trip.estimatedBudget?.total || 0;
  const expVariance = expEst - expActual;

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 min-h-screen pb-16">
      {/* Header */}
      <header className="border-b border-slate-900 bg-slate-950/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="p-2 text-slate-450 hover:text-white rounded-lg hover:bg-slate-900 transition-all flex items-center gap-1 text-xs font-semibold">
            <ChevronLeft className="w-4 h-4" />
            Dashboard
          </Link>
          
          <span className="text-xs px-2.5 py-1 rounded bg-slate-900 border border-slate-850 font-bold uppercase tracking-wider text-indigo-400">
            {trip.budgetType} Budget
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl w-full mx-auto px-6 py-8 space-y-8">
        
        {/* Title Block */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-900 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-bold tracking-wide uppercase mb-1">
              <MapPin className="w-3.5 h-3.5 text-indigo-500" />
              <span>Itinerary Details</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white capitalize">{trip.destination}</h1>
            <p className="text-xs text-slate-550 flex items-center gap-1.5 mt-1 font-semibold">
              <Calendar className="w-3.5 h-3.5" />
              <span>{trip.durationDays} Days</span>
              <span>•</span>
              <span>{trip.interests?.join(', ') || 'General Sightseeing'}</span>
            </p>
          </div>

          {/* Simple Tab Selector */}
          <div className="flex bg-slate-900/60 p-1 rounded-xl border border-slate-850 self-start md:self-auto">
            {(['itinerary', 'hotels', 'expenses', 'packing'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === tab
                    ? 'bg-slate-800 text-white shadow'
                    : 'text-slate-500 hover:text-slate-350'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* ---------------------------------------------------- */}
        {/* TAB 1: ITINERARY                                     */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'itinerary' && (
          <div className="space-y-8">
            {trip.itinerary?.map((dayData: any, dayIdx: number) => {
              const dNum = dayData.day;
              return (
                <div key={dayIdx} className="rounded-2xl border border-slate-900 bg-slate-900/10 p-5 md:p-6 space-y-6">
                  {/* Day Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-900/60 pb-4">
                    <div>
                      <span className="text-xs font-black tracking-widest text-indigo-500 uppercase block mb-1">DAY {dNum}</span>
                      <h3 className="font-bold text-lg text-slate-200">{dayData.theme || 'Explore the Area'}</h3>
                    </div>

                    <button
                      onClick={() => setShowAddForm(showAddForm === dNum ? null : dNum)}
                      className="px-3 py-1.5 border border-slate-800 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors self-start sm:self-auto"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Activity
                    </button>
                  </div>

                  {/* Add Activity Inline Form */}
                  {showAddForm === dNum && (
                    <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/30 space-y-4">
                      <div className="flex justify-between items-center border-b border-slate-850 pb-2 mb-1">
                        <span className="text-xs font-bold text-indigo-400">Add New Activity manually</span>
                        <button onClick={() => setShowAddForm(null)} className="text-slate-500 hover:text-slate-300">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1.5">Time of Day</label>
                          <select
                            value={newActTime}
                            onChange={(e) => setNewActTime(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs focus:outline-none"
                          >
                            <option value="Morning">Morning</option>
                            <option value="Afternoon">Afternoon</option>
                            <option value="Evening">Evening</option>
                          </select>
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1.5">Activity Title</label>
                          <input
                            type="text"
                            placeholder="e.g. Visit Eiffel Tower"
                            value={newActTitle}
                            onChange={(e) => setNewActTitle(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs focus:outline-none text-slate-200 placeholder-slate-655"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1.5">Description</label>
                          <input
                            type="text"
                            placeholder="Briefly describe what you will do..."
                            value={newActDesc}
                            onChange={(e) => setNewActDesc(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs focus:outline-none text-slate-200 placeholder-slate-655"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1.5">Est. Cost (USD)</label>
                          <input
                            type="number"
                            min="0"
                            value={newActCost}
                            onChange={(e) => setNewActCost(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs focus:outline-none text-slate-200"
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAddActivity(dNum)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Save Activity
                      </button>
                    </div>
                  )}

                  {/* Activities List */}
                  <div className="space-y-4">
                    {dayData.activities?.length === 0 ? (
                      <p className="text-slate-550 text-xs italic py-2">No activities listed for this day. Click Add Activity to insert one.</p>
                    ) : (
                      dayData.activities?.map((act: any, aIdx: number) => (
                        <div key={aIdx} className="flex gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-850 hover:border-slate-800 transition-colors group relative">
                          {/* Time badge */}
                          <div className="w-20 shrink-0 text-left">
                            <span className="text-[10px] font-black tracking-wider uppercase text-slate-450 px-2 py-0.5 rounded bg-slate-900 border border-slate-850">
                              {act.time}
                            </span>
                          </div>

                          {/* Info block */}
                          <div className="flex-grow space-y-1">
                            <div className="flex justify-between items-start gap-4">
                              <h4 className="font-bold text-sm text-slate-200">{act.title}</h4>
                              <span className="text-xs font-semibold text-slate-450 shrink-0 bg-slate-950 px-2 py-0.5 rounded border border-slate-900">
                                {act.cost > 0 ? `$${act.cost}` : 'Free'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">{act.description}</p>
                          </div>

                          {/* Delete action overlay */}
                          <button
                            onClick={() => handleRemoveActivity(dNum, act.id)}
                            className="absolute right-3 bottom-3 p-1.5 text-slate-600 hover:text-red-400 rounded hover:bg-slate-950 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                            title="Remove Activity"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Regenerate specific Day Form */}
                  <div className="border-t border-slate-900/60 pt-4 flex flex-col sm:flex-row gap-3">
                    <div className="flex-grow relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      </span>
                      <input
                        type="text"
                        placeholder="Regenerate this day with AI (e.g. 'focus more on nature hikes')..."
                        value={regenPrompts[dNum] || ''}
                        onChange={(e) => setRegenPrompts({ ...regenPrompts, [dNum]: e.target.value })}
                        className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-850 focus:border-indigo-500/80 rounded-xl text-xs text-slate-350 placeholder-slate-655 focus:outline-none transition-colors"
                        disabled={regenLoading[dNum]}
                      />
                    </div>
                    <button
                      onClick={() => handleRegenerateDay(dNum)}
                      disabled={regenLoading[dNum]}
                      className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      {regenLoading[dNum] ? (
                        <>
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          Regenerating...
                        </>
                      ) : (
                        <>
                          <Send className="w-3 h-3" />
                          Regenerate Day
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 2: HOTELS                                        */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'hotels' && (
          <div className="space-y-6">
            <div className="bg-slate-900/10 border border-slate-900 p-6 rounded-2xl">
              <h3 className="font-bold text-lg text-slate-200 mb-2 flex items-center gap-2">
                <Hotel className="w-5 h-5 text-indigo-400" />
                Hotel Suggestions
              </h3>
              <p className="text-xs text-slate-450 mb-6">
                Recommended lodging options matched to typical explorer preferences for {trip.destination}.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {trip.hotelSuggestions?.map((hotel: any, idx: number) => (
                  <div key={idx} className="rounded-xl border border-slate-850 bg-slate-900/30 p-5 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                          hotel.tier === 'Budget Friendly' ? 'bg-emerald-950/50 border border-emerald-900 text-emerald-400' :
                          hotel.tier === 'Mid Range' ? 'bg-indigo-950/50 border border-indigo-900 text-indigo-400' :
                          'bg-amber-950/50 border border-amber-900 text-amber-400'
                        }`}>
                          {hotel.tier}
                        </span>
                        <span className="text-xs font-semibold text-slate-400">{hotel.priceRange}</span>
                      </div>
                      <h4 className="font-bold text-sm text-slate-200 mb-2">{hotel.name}</h4>
                      <p className="text-xs text-slate-450 leading-relaxed">{hotel.description}</p>
                    </div>

                    <a
                      href={`https://www.booking.com/searchresults.html?ss=${encodeURIComponent(hotel.name + ' ' + trip.destination)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-350 text-xs font-semibold rounded-lg text-center transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Compass className="w-3.5 h-3.5" />
                      Search Availability
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 3: SMART EXPENSE TRACKER (CREATIVE)               */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'expenses' && (
          <div className="space-y-8">
            {/* Quick dashboard cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Actual Tracker Progress */}
              <div className="p-5 rounded-2xl border border-slate-900 bg-slate-900/10 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2 flex items-center gap-1">
                    <PieChart className="w-3.5 h-3.5" />
                    Budget Variance Analysis
                  </h4>
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="text-3xl font-black text-white">${expActual.toLocaleString()}</span>
                    <span className="text-[11px] text-slate-500 font-medium">out of ${expEst.toLocaleString()}</span>
                  </div>
                  
                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-850/50 mb-3">
                    <div
                      className={`h-full rounded-full transition-all ${
                        expVariance < 0 ? 'bg-gradient-to-r from-red-500 to-pink-500' : 'bg-gradient-to-r from-indigo-500 to-purple-500'
                      }`}
                      style={{ width: `${Math.min((expActual / expEst) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-900/60 mt-1">
                  <span className="text-slate-550">Variance</span>
                  {expVariance >= 0 ? (
                    <span className="text-emerald-400 font-bold">-${expVariance.toLocaleString()} Under Budget</span>
                  ) : (
                    <span className="text-red-400 font-bold">+${Math.abs(expVariance).toLocaleString()} Over Budget</span>
                  )}
                </div>
              </div>

              {/* Log Expense Form */}
              <div className="md:col-span-2 p-5 rounded-2xl border border-slate-900 bg-slate-900/10">
                <h4 className="text-xs text-slate-200 font-black uppercase tracking-wider mb-4 flex items-center gap-1">
                  <Plus className="w-4 h-4 text-purple-400" />
                  Log Actual Expense
                </h4>

                <form onSubmit={handleAddExpense} className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1.5">Category</label>
                      <select
                        value={expenseCategory}
                        onChange={(e: any) => setExpenseCategory(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-850 rounded-lg text-xs focus:outline-none text-slate-300"
                      >
                        <option value="Flights">Flights</option>
                        <option value="Accommodation">Lodging</option>
                        <option value="Food">Food</option>
                        <option value="Activities">Activities</option>
                        <option value="Miscellaneous">Miscellaneous</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1.5">Amount (USD)</label>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        placeholder="Amount"
                        value={expenseAmount}
                        onChange={(e) => setExpenseAmount(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-850 rounded-lg text-xs focus:outline-none text-slate-200 placeholder-slate-655"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1.5">Date</label>
                      <input
                        type="date"
                        value={expenseDate}
                        onChange={(e) => setExpenseDate(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-850 rounded-lg text-xs focus:outline-none text-slate-200"
                        required
                      />
                    </div>

                    <div className="col-span-2 sm:col-span-1 flex items-end">
                      <button
                        type="submit"
                        disabled={expenseSubmitting}
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1 h-9 cursor-pointer"
                      >
                        {expenseSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                        Add Log
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1.5">Expense Description</label>
                    <input
                      type="text"
                      placeholder="e.g. Lunch at Shibuya Tsukiji sushi counter..."
                      value={expenseDesc}
                      onChange={(e) => setExpenseDesc(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-850 rounded-lg text-xs focus:outline-none text-slate-200 placeholder-slate-655"
                    />
                  </div>
                </form>
              </div>

            </div>

            {/* Split Bill Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Left Column: Splits and calculations */}
              <div className="p-5 rounded-2xl border border-slate-900 bg-slate-900/10 space-y-4">
                <div className="flex justify-between items-center mb-1">
                  <h4 className="text-xs text-slate-200 font-black uppercase tracking-wider flex items-center gap-1.5">
                    <CheckSquare className="w-4 h-4 text-emerald-400" />
                    Split-Bill Calculator
                  </h4>
                  <span className="text-[9px] text-indigo-400 font-extrabold uppercase">Equal Share</span>
                </div>
                
                <p className="text-[11px] text-slate-500 leading-snug">
                  Split your total actual expenses equally with travel partners. Add companions to compute splits.
                </p>

                {/* Add Companion Form */}
                <form onSubmit={handleAddCompanion} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Friend name (e.g. Alice)"
                    value={newCompanion}
                    onChange={(e) => setNewCompanion(e.target.value)}
                    className="flex-grow px-3 py-1.5 bg-slate-900 border border-slate-850 rounded-lg text-xs focus:outline-none text-slate-200 placeholder-slate-600"
                  />
                  <button type="submit" className="px-3 bg-slate-800 hover:bg-slate-750 text-white rounded-lg text-xs font-bold border border-slate-700">
                    Add
                  </button>
                </form>

                {/* Companion list */}
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  <div className="flex justify-between items-center text-xs p-2 rounded bg-slate-900/40 border border-slate-900">
                    <span className="text-slate-350 font-semibold">Current User (You)</span>
                    <span className="text-[10px] text-slate-500 font-bold">Owner</span>
                  </div>
                  {companions.map((comp, cIdx) => (
                    <div key={cIdx} className="flex justify-between items-center text-xs p-2 rounded bg-slate-900/40 border border-slate-900 group">
                      <span className="text-slate-300 font-semibold">{comp}</span>
                      <button type="button" onClick={() => handleRemoveCompanion(comp)} className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Split calculation summary */}
                <div className="pt-4 border-t border-slate-900/60 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-550">Travelers</span>
                    <span className="text-slate-300 font-bold">{companions.length + 1} People</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-550">Per-Person Split</span>
                    <span className="text-white font-black">${Math.round(expActual / (companions.length + 1)).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Middle: Comparative Chart */}
              <div className="md:col-span-2 p-5 rounded-2xl border border-slate-900 bg-slate-900/10 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs text-slate-200 font-black uppercase tracking-wider mb-4">Estimated vs. Actual Variance Chart</h4>
                  
                  {expActual === 0 ? (
                    <div className="h-48 border border-dashed border-slate-850 rounded-xl bg-slate-900/5 flex flex-col items-center justify-center text-center p-6 text-slate-550">
                      <Info className="w-6 h-6 mb-2 text-slate-650" />
                      <p className="text-xs">No actual expenses logged yet. Add logs to populate the variance chart.</p>
                    </div>
                  ) : (
                    <div className="h-56 w-full text-xs">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={getExpensesChartData()}
                          margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis dataKey="name" stroke="#94a3b8" />
                          <YAxis stroke="#94a3b8" />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }}
                            itemStyle={{ color: '#cbd5e1' }}
                          />
                          <Legend wrapperStyle={{ paddingTop: 10 }} />
                          <Bar dataKey="Estimated" fill="#6366f1" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="Actual" fill="#a855f7" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Bottom: Expense Log Table */}
            <div className="rounded-2xl border border-slate-900 bg-slate-900/10 p-5">
              <h4 className="text-xs text-slate-200 font-black uppercase tracking-wider mb-4">Actual Spending Logs</h4>
              
              {!trip.expenses || trip.expenses.length === 0 ? (
                <p className="text-slate-550 text-xs italic py-4 text-center">No expense logs recorded. Input expenses above.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-slate-900 text-slate-550 font-bold uppercase tracking-wider">
                        <th className="pb-3">Date</th>
                        <th className="pb-3">Category</th>
                        <th className="pb-3">Description</th>
                        <th className="pb-3 text-right">Amount (USD)</th>
                        <th className="pb-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900/60">
                      {trip.expenses.map((exp: any) => (
                        <tr key={exp.id} className="text-slate-350 hover:bg-slate-900/20">
                          <td className="py-3 font-medium">{exp.date}</td>
                          <td className="py-3">
                            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-850 text-[10px] text-slate-400 uppercase font-semibold">
                              {exp.category === 'Accommodation' ? 'Lodging' : exp.category}
                            </span>
                          </td>
                          <td className="py-3 max-w-xs truncate">{exp.description || '-'}</td>
                          <td className="py-3 text-right font-black text-white">${exp.amount.toFixed(2)}</td>
                          <td className="py-3 text-center">
                            <button
                              onClick={() => handleDeleteExpense(exp.id)}
                              className="p-1 text-slate-500 hover:text-red-400 rounded transition-all cursor-pointer"
                              title="Delete Log"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 4: SMART PACKING CHECKLIST (CREATIVE)            */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'packing' && (
          <div className="space-y-6">
            <div className="bg-slate-900/10 border border-slate-900 p-5 md:p-6 rounded-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="font-bold text-lg text-slate-200 flex items-center gap-2">
                    <CheckSquare className="w-5 h-5 text-indigo-400" />
                    Smart Packing Checklist
                  </h3>
                  <p className="text-xs text-slate-450 mt-1">
                    AI generated packing checklist customized based on destination and selected interests.
                  </p>
                </div>

                {/* Quick Stats */}
                <div className="px-3.5 py-2 bg-slate-900 border border-slate-850 rounded-xl text-center self-start sm:self-auto shrink-0 flex items-center gap-4">
                  <div className="text-left">
                    <span className="text-[10px] text-slate-500 block uppercase tracking-wider font-bold">Completion</span>
                    <span className="text-base font-black text-indigo-400">
                      {trip.packingList?.filter((i: any) => i.packed).length || 0} / {trip.packingList?.length || 0}
                    </span>
                  </div>
                  
                  <div className="text-left border-l border-slate-850 pl-4">
                    <span className="text-[10px] text-slate-500 block uppercase tracking-wider font-bold">Packed %</span>
                    <span className="text-base font-black text-emerald-400">
                      {trip.packingList?.length > 0
                        ? Math.round((trip.packingList.filter((i: any) => i.packed).length / trip.packingList.length) * 100)
                        : 0}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Add Custom Packing Item */}
              <form onSubmit={handleAddPackingItem} className="p-4 bg-slate-900/30 border border-slate-850 rounded-xl mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[9px] text-slate-500 font-bold uppercase mb-1">Item Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Swimwear or Camera charger..."
                    value={newPackItem}
                    onChange={(e) => setNewPackItem(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs focus:outline-none text-slate-200 placeholder-slate-655"
                  />
                </div>
                <div>
                  <label className="block text-[9px] text-slate-500 font-bold uppercase mb-1">Category</label>
                  <div className="flex gap-2">
                    <select
                      value={newPackCategory}
                      onChange={(e) => setNewPackCategory(e.target.value)}
                      className="flex-grow px-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs focus:outline-none text-slate-350"
                    >
                      <option value="Essentials">Essentials</option>
                      <option value="Clothing">Clothing</option>
                      <option value="Electronics">Electronics</option>
                      <option value="Toiletries">Toiletries</option>
                      <option value="Activities">Activities</option>
                    </select>
                    <button type="submit" className="px-3 bg-indigo-650 hover:bg-indigo-600 rounded-lg text-xs font-bold text-white shadow shrink-0">
                      Add
                    </button>
                  </div>
                </div>
              </form>

              {/* Checklist Grid grouped by categories */}
              {!trip.packingList || trip.packingList.length === 0 ? (
                <p className="text-slate-550 text-xs italic py-4 text-center">No packing items listed. Add custom items above.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                  {['Essentials', 'Clothing', 'Electronics', 'Toiletries', 'Activities'].map((category) => {
                    const items = trip.packingList.filter((i: any) => i.category === category);
                    if (items.length === 0) return null;
                    return (
                      <div key={category} className="space-y-3">
                        <h4 className="text-xs font-black uppercase text-indigo-400 tracking-wider border-b border-slate-900/60 pb-1.5">
                          {category}
                        </h4>
                        
                        <div className="space-y-2">
                          {items.map((item: any) => (
                            <button
                              type="button"
                              key={item.id}
                              onClick={() => handleTogglePacking(item.id, item.packed)}
                              className="w-full flex items-center justify-between text-left p-2.5 rounded-lg border border-slate-900 bg-slate-900/40 hover:bg-slate-900/80 transition-colors group cursor-pointer"
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                                  item.packed ? 'border-emerald-500 bg-emerald-600' : 'border-slate-700'
                                }`}>
                                  {item.packed && <span className="text-[9px] font-black text-white">✓</span>}
                                </div>
                                <span className={`text-xs ${
                                  item.packed ? 'line-through text-slate-500 font-medium' : 'text-slate-300 font-semibold'
                                }`}>
                                  {item.name}
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          </div>
        )}

      </main>
    </div>
  );
}
