"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const router = (0, express_1.Router)();
// POST /api/trips/:id/expenses
// Add a new actual expense to a trip
router.post('/:id/expenses', async (req, res) => {
    try {
        const ownerId = req.user?.id;
        if (!ownerId) {
            res.status(401).json({ error: 'User context not found' });
            return;
        }
        const { category, amount, date, description } = req.body;
        if (!category || !amount || !date) {
            res.status(400).json({ error: 'Category, amount, and date are required.' });
            return;
        }
        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            res.status(400).json({ error: 'Amount must be a positive number.' });
            return;
        }
        const trip = await db_1.TripRepository.getTrip(req.params.id, ownerId);
        if (!trip) {
            res.status(404).json({ error: 'Trip not found or access denied.' });
            return;
        }
        const newExpense = {
            id: `exp-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            category,
            amount: parsedAmount,
            date,
            description: description || ''
        };
        if (!trip.expenses)
            trip.expenses = [];
        trip.expenses.push(newExpense);
        const updatedTrip = await db_1.TripRepository.updateTrip(req.params.id, ownerId, { expenses: trip.expenses });
        res.status(201).json(updatedTrip);
    }
    catch (error) {
        console.error('Error adding expense:', error);
        res.status(500).json({ error: 'Server error. Failed to add expense.' });
    }
});
// DELETE /api/trips/:id/expenses/:expenseId
// Remove an actual expense from a trip
router.delete('/:id/expenses/:expenseId', async (req, res) => {
    try {
        const ownerId = req.user?.id;
        if (!ownerId) {
            res.status(401).json({ error: 'User context not found' });
            return;
        }
        const { id, expenseId } = req.params;
        const trip = await db_1.TripRepository.getTrip(id, ownerId);
        if (!trip) {
            res.status(404).json({ error: 'Trip not found or access denied.' });
            return;
        }
        const currentExpenses = trip.expenses || [];
        const updatedExpenses = currentExpenses.filter((e) => e.id !== expenseId);
        if (currentExpenses.length === updatedExpenses.length) {
            res.status(404).json({ error: 'Expense not found.' });
            return;
        }
        const updatedTrip = await db_1.TripRepository.updateTrip(id, ownerId, { expenses: updatedExpenses });
        res.json(updatedTrip);
    }
    catch (error) {
        console.error('Error deleting expense:', error);
        res.status(500).json({ error: 'Server error. Failed to delete expense.' });
    }
});
// POST /api/trips/:id/packing/toggle
// Toggle a packing checklist item status (packed: true/false)
router.post('/:id/packing/toggle', async (req, res) => {
    try {
        const ownerId = req.user?.id;
        if (!ownerId) {
            res.status(401).json({ error: 'User context not found' });
            return;
        }
        const { itemId, packed } = req.body;
        if (!itemId === undefined || packed === undefined) {
            res.status(400).json({ error: 'itemId and packed state are required.' });
            return;
        }
        const trip = await db_1.TripRepository.getTrip(req.params.id, ownerId);
        if (!trip) {
            res.status(404).json({ error: 'Trip not found or access denied.' });
            return;
        }
        const currentList = trip.packingList || [];
        const itemIndex = currentList.findIndex((item) => item.id === itemId);
        if (itemIndex === -1) {
            res.status(404).json({ error: 'Packing item not found.' });
            return;
        }
        currentList[itemIndex].packed = Boolean(packed);
        const updatedTrip = await db_1.TripRepository.updateTrip(req.params.id, ownerId, { packingList: currentList });
        res.json(updatedTrip);
    }
    catch (error) {
        console.error('Error toggling packing item:', error);
        res.status(500).json({ error: 'Server error. Failed to update packing checklist.' });
    }
});
exports.default = router;
