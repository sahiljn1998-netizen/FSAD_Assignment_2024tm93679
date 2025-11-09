const express = require('express');
const router = express.Router();
const Equipment = require('../models/Equipment');
const { auth, authorize } = require('../middleware/auth');

// @route   GET api/v1/equipment
// @desc    Get all equipment (supports filtering by category and availability)
router.get('/', async (req, res) => {
    try {
        const { category, available } = req.query;
        const query = {};
        if (category) query.category = category;
        if (available === 'true') query.available = { $gt: 0 };

        const items = await Equipment.find(query).sort({ createdAt: -1 });
        return res.json(items);
    } catch (err) {
        console.error('Error fetching equipment:', err.message || err);
        return res.status(500).json({ error: 'Server error' });
    }
});

// @route   POST api/v1/equipment
// @desc    Add new equipment (simple create)
// Protect equipment creation: only admin may create equipment
router.post('/', auth, authorize('admin'), async (req, res) => {
    try {
        const { name, category, condition, quantity, available, description } = req.body;
        if (!name || !quantity) return res.status(400).json({ error: 'name and quantity are required' });

        // If available is not provided, default it to quantity
        const avail = typeof available === 'number' ? available : quantity;

        const eq = new Equipment({ name, category, condition, quantity, available: avail, description });
        await eq.save();
        return res.status(201).json(eq);
    } catch (err) {
        console.error('Error creating equipment:', err.message || err);
        return res.status(500).json({ error: 'Server error' });
    }
});

// @route   PUT api/v1/equipment/:id
// @desc    Update equipment (admin only)
router.put('/:id', auth, authorize('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const { name, category, condition, quantity, available, description } = req.body;
        const item = await Equipment.findById(id);
        if (!item) return res.status(404).json({ error: 'Equipment not found' });

        if (name !== undefined) item.name = name;
        if (category !== undefined) item.category = category;
        if (condition !== undefined) item.condition = condition;
        if (quantity !== undefined) item.quantity = quantity;
        // If available is provided, set it; otherwise, if quantity changed and available > quantity, cap it
        if (available !== undefined) {
            item.available = available;
        } else if (quantity !== undefined && item.available > quantity) {
            item.available = quantity;
        }
        if (description !== undefined) item.description = description;

        await item.save();
        return res.json(item);
    } catch (err) {
        console.error('Error updating equipment:', err.message || err);
        return res.status(500).json({ error: 'Server error' });
    }
});

// @route   DELETE api/v1/equipment/:id
// @desc    Delete equipment (admin only)
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check for existing requests for this equipment
        const Request = require('../models/Request');
        const existingRequests = await Request.find({ 
            equipment: id,
            status: { $in: ['pending', 'approved', 'issued'] }
        });

        if (existingRequests.length > 0) {
            return res.status(400).json({ 
                error: 'Cannot delete equipment that has active requests. Please handle all pending, approved, and issued requests first.'
            });
        }

        // Use findByIdAndDelete instead of remove()
        const deletedItem = await Equipment.findByIdAndDelete(id);
        if (!deletedItem) {
            return res.status(404).json({ error: 'Equipment not found' });
        }

        return res.json({ message: 'Equipment deleted successfully' });
    } catch (err) {
        console.error('Error deleting equipment:', err.message || err);
        return res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;