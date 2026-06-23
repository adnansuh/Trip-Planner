import { Schema, model } from 'mongoose';

const ActivitySchema = new Schema({
  id: { type: String, required: true },
  time: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  cost: { type: Number, default: 0 }
});

const DayItinerarySchema = new Schema({
  day: { type: Number, required: true },
  theme: { type: String, default: '' },
  activities: [ActivitySchema]
});

const HotelSchema = new Schema({
  name: { type: String, required: true },
  tier: { type: String, enum: ['Budget Friendly', 'Mid Range', 'Luxury'], required: true },
  priceRange: { type: String, required: true },
  description: { type: String, default: '' }
});

const BudgetSchema = new Schema({
  flights: { type: Number, default: 0 },
  accommodation: { type: Number, default: 0 },
  food: { type: Number, default: 0 },
  activities: { type: Number, default: 0 },
  total: { type: Number, default: 0 }
});

const ExpenseSchema = new Schema({
  id: { type: String, required: true },
  category: { type: String, enum: ['Flights', 'Accommodation', 'Food', 'Activities', 'Miscellaneous'], required: true },
  amount: { type: Number, required: true },
  date: { type: String, required: true },
  description: { type: String, default: '' }
});

const PackingItemSchema = new Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  category: { type: String, required: true },
  packed: { type: Boolean, default: false }
});

const TripSchema = new Schema({
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  destination: {
    type: String,
    required: true
  },
  durationDays: {
    type: Number,
    required: true
  },
  budgetType: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    required: true
  },
  interests: {
    type: [String],
    default: []
  },
  itinerary: [DayItinerarySchema],
  estimatedBudget: BudgetSchema,
  hotelSuggestions: [HotelSchema],
  expenses: [ExpenseSchema],
  packingList: [PackingItemSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Convert _id to id in JSON output
TripSchema.set('toJSON', {
  transform: (doc, ret: any) => {
    ret.id = ret._id?.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

export const TripModel = model('Trip', TripSchema);
