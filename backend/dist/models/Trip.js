"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TripModel = void 0;
const mongoose_1 = require("mongoose");
const ActivitySchema = new mongoose_1.Schema({
    id: { type: String, required: true },
    time: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    cost: { type: Number, default: 0 }
});
const DayItinerarySchema = new mongoose_1.Schema({
    day: { type: Number, required: true },
    theme: { type: String, default: '' },
    activities: [ActivitySchema]
});
const HotelSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    tier: { type: String, enum: ['Budget Friendly', 'Mid Range', 'Luxury'], required: true },
    priceRange: { type: String, required: true },
    description: { type: String, default: '' }
});
const BudgetSchema = new mongoose_1.Schema({
    flights: { type: Number, default: 0 },
    accommodation: { type: Number, default: 0 },
    food: { type: Number, default: 0 },
    activities: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
});
const ExpenseSchema = new mongoose_1.Schema({
    id: { type: String, required: true },
    category: { type: String, enum: ['Flights', 'Accommodation', 'Food', 'Activities', 'Miscellaneous'], required: true },
    amount: { type: Number, required: true },
    date: { type: String, required: true },
    description: { type: String, default: '' }
});
const PackingItemSchema = new mongoose_1.Schema({
    id: { type: String, required: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    packed: { type: Boolean, default: false }
});
const TripSchema = new mongoose_1.Schema({
    owner: {
        type: mongoose_1.Schema.Types.ObjectId,
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
    transform: (doc, ret) => {
        ret.id = ret._id?.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
    }
});
exports.TripModel = (0, mongoose_1.model)('Trip', TripSchema);
