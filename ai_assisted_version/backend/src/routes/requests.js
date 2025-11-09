const express = require('express');
const router = express.Router();
const Request = require('../models/Request');
const Equipment = require('../models/Equipment');
const { auth, authorize } = require('../middleware/auth');
const { 
  checkEquipmentAvailability, 
  validateDateRange, 
  validateQuantity 
} = require('../utils/bookingValidation');

// @route   GET api/v1/requests
// @desc    Get requests: staff/admin see all; users see their own
router.get('/', auth, async (req, res) => {
    try {
        if (req.user.role === 'admin' || req.user.role === 'staff') {
            const items = await Request.find().populate('equipment requester approvedBy');
            return res.json(items);
        }
        const items = await Request.find({ requester: req.user._id }).populate('equipment requester approvedBy');
        return res.json(items);
    } catch (err) {
        console.error('Error fetching requests:', err.message || err);
        return res.status(500).json({ error: 'Server error' });
    }
});

// @route   POST api/v1/requests/check-availability
// @desc    Check equipment availability for a date range (before creating request)
router.post('/check-availability', auth, async (req, res) => {
    try {
        const { equipment: equipmentId, startDate, endDate, requestedQuantity } = req.body;
        
        if (!equipmentId || !startDate || !endDate) {
            return res.status(400).json({ error: 'equipment, startDate and endDate are required' });
        }

        const equipment = await Equipment.findById(equipmentId);
        if (!equipment) return res.status(404).json({ error: 'Equipment not found' });

        const start = new Date(startDate);
        const end = new Date(endDate);
        const qty = parseInt(requestedQuantity, 10) || 1;

        // Validate date range
        const dateValidation = validateDateRange(start, end);
        if (!dateValidation.valid) {
            return res.status(400).json({ 
                available: false, 
                error: dateValidation.message 
            });
        }

        // Validate quantity
        const qtyValidation = validateQuantity(qty, equipment.quantity);
        if (!qtyValidation.valid) {
            return res.status(400).json({ 
                available: false, 
                error: qtyValidation.message 
            });
        }

        // Check availability
        const availabilityCheck = await checkEquipmentAvailability(
            equipment._id,
            start,
            end,
            qty,
            equipment.quantity
        );

        return res.json({
            available: availabilityCheck.available,
            message: availabilityCheck.message,
            availableUnits: availabilityCheck.availableUnits,
            occupied: availabilityCheck.occupied,
            totalUnits: equipment.quantity
        });
    } catch (err) {
        console.error('Error checking availability:', err.message || err);
        return res.status(500).json({ error: 'Server error' });
    }
});

// @route   POST api/v1/requests
// @desc    Create new request (students and staff)
router.post('/', auth, authorize('student', 'staff'), async (req, res) => {
    try {
        const { equipment: equipmentId, startDate, endDate, requestedQuantity } = req.body;
        
        // Validate required fields
        if (!equipmentId || !startDate || !endDate) {
            return res.status(400).json({ error: 'equipment, startDate and endDate are required' });
        }

        // Find equipment
        const equipment = await Equipment.findById(equipmentId);
        if (!equipment) return res.status(404).json({ error: 'Equipment not found' });

        const start = new Date(startDate);
        const end = new Date(endDate);
        const qty = parseInt(requestedQuantity, 10) || 1;

        // Validate date range
        const dateValidation = validateDateRange(start, end);
        if (!dateValidation.valid) {
            return res.status(400).json({ error: dateValidation.message });
        }

        // Validate quantity
        const qtyValidation = validateQuantity(qty, equipment.quantity);
        if (!qtyValidation.valid) {
            return res.status(400).json({ error: qtyValidation.message });
        }

        // Check equipment availability for the requested period
        const availabilityCheck = await checkEquipmentAvailability(
            equipment._id,
            start,
            end,
            qty,
            equipment.quantity
        );

        if (!availabilityCheck.available) {
            return res.status(400).json({ 
                error: availabilityCheck.message,
                availableUnits: availabilityCheck.availableUnits,
                occupied: availabilityCheck.occupied
            });
        }

        // Create request
        const request = new Request({
            equipment: equipment._id,
            requester: req.user._id,
            requestedQuantity: qty,
            startDate: start,
            endDate: end,
            status: 'pending'
        });
        
        await request.save();
        
        // Populate before returning
        await request.populate('equipment requester');
        
        return res.status(201).json(request);
    } catch (err) {
        console.error('Error creating request:', err.message || err);
        return res.status(500).json({ error: 'Server error' });
    }
});

// @route   POST api/v1/requests/:id/approve
// @desc    Approve a request (staff/admin)
router.post('/:id/approve', auth, authorize('staff', 'admin'), async (req, res) => {
    try {
        const reqDoc = await Request.findById(req.params.id);
        if (!reqDoc) return res.status(404).json({ error: 'Request not found' });
        if (reqDoc.status !== 'pending') {
            return res.status(400).json({ error: 'Only pending requests can be approved' });
        }

        // Find equipment
        const equipment = await Equipment.findById(reqDoc.equipment);
        if (!equipment) return res.status(404).json({ error: 'Equipment not found' });

        // Re-validate date range (in case dates are in the past now)
        const dateValidation = validateDateRange(reqDoc.startDate, reqDoc.endDate);
        if (!dateValidation.valid) {
            return res.status(400).json({ 
                error: `Cannot approve: ${dateValidation.message}` 
            });
        }

        // Check availability (exclude current request from overlap check)
        const availabilityCheck = await checkEquipmentAvailability(
            equipment._id,
            reqDoc.startDate,
            reqDoc.endDate,
            reqDoc.requestedQuantity || 1,
            equipment.quantity,
            reqDoc._id // Exclude this request from the check
        );

        if (!availabilityCheck.available) {
            return res.status(400).json({ 
                error: `Cannot approve: ${availabilityCheck.message}`,
                availableUnits: availabilityCheck.availableUnits,
                occupied: availabilityCheck.occupied
            });
        }

        // Approve the request
        reqDoc.status = 'approved';
        reqDoc.approvedBy = req.user._id;
        await reqDoc.save();
        
        // Populate before returning
        await reqDoc.populate('equipment requester approvedBy');
        
        return res.json(reqDoc);
    } catch (err) {
        console.error('Approve error:', err.message || err);
        return res.status(500).json({ error: 'Server error' });
    }
});

// @route   POST api/v1/requests/:id/reject
// @desc    Reject a request (staff/admin)
router.post('/:id/reject', auth, authorize('staff', 'admin'), async (req, res) => {
    try {
        const reqDoc = await Request.findById(req.params.id);
        if (!reqDoc) return res.status(404).json({ error: 'Request not found' });
        if (reqDoc.status !== 'pending') return res.status(400).json({ error: 'Only pending requests can be rejected' });

        reqDoc.status = 'rejected';
        reqDoc.approvedBy = req.user._id;
        await reqDoc.save();
        return res.json(reqDoc);
    } catch (err) {
        console.error('Reject error:', err.message || err);
        return res.status(500).json({ error: 'Server error' });
    }
});

// @route   POST api/v1/requests/:id/issue
// @desc    Issue equipment for an approved request (admin only)
router.post('/:id/issue', auth, authorize('admin'), async (req, res) => {
    try {
        const reqDoc = await Request.findById(req.params.id).populate('equipment');
        if (!reqDoc) return res.status(404).json({ error: 'Request not found' });
        if (reqDoc.status !== 'approved') return res.status(400).json({ error: 'Only approved requests can be issued' });

        const qty = reqDoc.requestedQuantity || 1;
        // Ensure equipment has availability for the requested quantity
        const equip = await Equipment.findOneAndUpdate(
            { _id: reqDoc.equipment._id, available: { $gte: qty } },
            { $inc: { available: -qty } },
            { new: true }
        );

        if (!equip) return res.status(400).json({ error: 'No available equipment to issue' });

        reqDoc.status = 'issued';
        reqDoc.issuedAt = new Date();
        reqDoc.approvedBy = req.user._id;
        await reqDoc.save();
        return res.json({ request: reqDoc, equipment: equip });
    } catch (err) {
        console.error('Issue error:', err.message || err);
        return res.status(500).json({ error: 'Server error' });
    }
});

// @route   POST api/v1/requests/:id/return
// @desc    Mark a request as returned (admin only)
router.post('/:id/return', auth, authorize('admin'), async (req, res) => {
    try {
        const reqDoc = await Request.findById(req.params.id).populate('equipment');
        if (!reqDoc) return res.status(404).json({ error: 'Request not found' });
        if (reqDoc.status !== 'issued') return res.status(400).json({ error: 'Only issued requests can be returned' });

    const qty = reqDoc.requestedQuantity || 1;
    const equip = await Equipment.findByIdAndUpdate(reqDoc.equipment._id, { $inc: { available: qty } }, { new: true });

    reqDoc.status = 'returned';
    reqDoc.returnedAt = new Date();
    await reqDoc.save();
    return res.json({ request: reqDoc, equipment: equip });
    } catch (err) {
        console.error('Return error:', err.message || err);
        return res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;