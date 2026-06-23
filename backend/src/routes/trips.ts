import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { TripRepository } from '../db';
import { generateTripItinerary, regenerateDayItinerary } from '../services/gemini';

const router = Router();

// Helper to recalculate activities estimated budget
const syncBudget = (trip: any) => {
  let activitiesCost = 0;
  if (trip.itinerary && Array.isArray(trip.itinerary)) {
    trip.itinerary.forEach((day: any) => {
      if (day.activities && Array.isArray(day.activities)) {
        day.activities.forEach((act: any) => {
          activitiesCost += Number(act.cost) || 0;
        });
      }
    });
  }
  
  if (!trip.estimatedBudget) {
    trip.estimatedBudget = { flights: 400, accommodation: 300, food: 150, activities: 0, total: 850 };
  }
  
  trip.estimatedBudget.activities = activitiesCost;
  trip.estimatedBudget.total = 
    (trip.estimatedBudget.flights || 0) + 
    (trip.estimatedBudget.accommodation || 0) + 
    (trip.estimatedBudget.food || 0) + 
    activitiesCost;
  
  return trip;
};

// GET /api/trips
// Get all trips for current authenticated user
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const ownerId = req.user?.id;
    if (!ownerId) {
      res.status(401).json({ error: 'User context not found' });
      return;
    }

    const trips = await TripRepository.listTrips(ownerId);
    res.json(trips);
  } catch (error) {
    console.error('Error fetching trips:', error);
    res.status(500).json({ error: 'Server error. Failed to retrieve trips.' });
  }
});

// GET /api/trips/:id
// Get details of a specific trip (enforcing strict user data isolation)
router.get('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const ownerId = req.user?.id;
    if (!ownerId) {
      res.status(401).json({ error: 'User context not found' });
      return;
    }

    const trip = await TripRepository.getTrip(req.params.id, ownerId);
    if (!trip) {
      res.status(404).json({ error: 'Trip not found or access denied.' });
      return;
    }

    res.json(trip);
  } catch (error) {
    console.error('Error fetching trip details:', error);
    res.status(500).json({ error: 'Server error. Failed to retrieve trip details.' });
  }
});

// POST /api/trips
// Generate a new trip using LLM and save it
router.post('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const ownerId = req.user?.id;
    if (!ownerId) {
      res.status(401).json({ error: 'User context not found' });
      return;
    }

    const { destination, durationDays, budgetType, interests } = req.body;

    if (!destination || !durationDays || !budgetType) {
      res.status(400).json({ error: 'Please provide destination, durationDays, and budgetType.' });
      return;
    }

    const parsedDays = parseInt(durationDays);
    if (isNaN(parsedDays) || parsedDays < 1 || parsedDays > 30) {
      res.status(400).json({ error: 'Duration must be between 1 and 30 days.' });
      return;
    }

    const activeInterests = Array.isArray(interests) ? interests : [];

    console.log(`🌍 Creating trip for ${ownerId}: ${destination} for ${parsedDays} days [${budgetType}]`);

    // Call Gemini API (or fallback)
    const tripDetails = await generateTripItinerary(destination, parsedDays, budgetType, activeInterests);

    // Build model structure
    const newTripData = {
      owner: ownerId,
      destination,
      durationDays: parsedDays,
      budgetType,
      interests: activeInterests,
      itinerary: tripDetails.itinerary,
      estimatedBudget: tripDetails.estimatedBudget,
      hotelSuggestions: tripDetails.hotelSuggestions,
      packingList: tripDetails.packingList,
      expenses: [],
      createdAt: new Date()
    };

    const savedTrip = await TripRepository.createTrip(newTripData);
    res.status(201).json(savedTrip);
  } catch (error) {
    console.error('Error generating trip:', error);
    res.status(500).json({ error: 'Server error. Failed to generate and save trip.' });
  }
});

// PUT /api/trips/:id
// Update itinerary directly (e.g., adding/removing an activity manually in UI)
router.put('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const ownerId = req.user?.id;
    if (!ownerId) {
      res.status(401).json({ error: 'User context not found' });
      return;
    }

    const trip = await TripRepository.getTrip(req.params.id, ownerId);
    if (!trip) {
      res.status(404).json({ error: 'Trip not found or access denied.' });
      return;
    }

    // Merge updates
    const { itinerary, packingList, destination, budgetType, interests } = req.body;
    
    if (itinerary) trip.itinerary = itinerary;
    if (packingList) trip.packingList = packingList;
    if (destination) trip.destination = destination;
    if (budgetType) trip.budgetType = budgetType;
    if (interests) trip.interests = interests;

    // Synchronize estimated budget with any new activity costs
    const updatedTrip = syncBudget(trip);

    const savedTrip = await TripRepository.updateTrip(req.params.id, ownerId, updatedTrip);
    res.json(savedTrip);
  } catch (error) {
    console.error('Error updating trip:', error);
    res.status(500).json({ error: 'Server error. Failed to update trip.' });
  }
});

// POST /api/trips/:id/regenerate-day
// Regenerate specific day itinerary with a custom prompt via Gemini
router.post('/:id/regenerate-day', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const ownerId = req.user?.id;
    if (!ownerId) {
      res.status(401).json({ error: 'User context not found' });
      return;
    }

    const { dayNumber, prompt } = req.body;
    if (!dayNumber || !prompt) {
      res.status(400).json({ error: 'Please specify dayNumber and prompt.' });
      return;
    }

    const targetDay = parseInt(dayNumber);
    const trip = await TripRepository.getTrip(req.params.id, ownerId);
    if (!trip) {
      res.status(404).json({ error: 'Trip not found or access denied.' });
      return;
    }

    // Find the current day structure
    const currentItinerary = trip.itinerary || [];
    const dayIndex = currentItinerary.findIndex((d: any) => d.day === targetDay);
    if (dayIndex === -1) {
      res.status(400).json({ error: `Day ${targetDay} does not exist in this trip's itinerary.` });
      return;
    }

    console.log(`🤖 Regenerating Day ${targetDay} for trip ${req.params.id}. Prompt: "${prompt}"`);

    // Call Gemini regeneration service
    const regeneratedDay = await regenerateDayItinerary(
      trip.destination,
      trip.budgetType,
      currentItinerary[dayIndex],
      targetDay,
      prompt
    );

    // Update itinerary day in memory
    currentItinerary[dayIndex].theme = regeneratedDay.theme;
    currentItinerary[dayIndex].activities = regeneratedDay.activities;

    trip.itinerary = currentItinerary;

    // Recalculate activities costs
    const updatedTrip = syncBudget(trip);

    const savedTrip = await TripRepository.updateTrip(req.params.id, ownerId, updatedTrip);
    res.json(savedTrip);
  } catch (error) {
    console.error('Error regenerating day:', error);
    res.status(500).json({ error: 'Server error. Failed to regenerate day.' });
  }
});

// DELETE /api/trips/:id
// Delete trip (enforcing strict user data isolation)
router.delete('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const ownerId = req.user?.id;
    if (!ownerId) {
      res.status(401).json({ error: 'User context not found' });
      return;
    }

    const success = await TripRepository.deleteTrip(req.params.id, ownerId);
    if (!success) {
      res.status(404).json({ error: 'Trip not found or access denied.' });
      return;
    }

    res.json({ message: 'Trip successfully deleted.' });
  } catch (error) {
    console.error('Error deleting trip:', error);
    res.status(500).json({ error: 'Server error. Failed to delete trip.' });
  }
});

export default router;
