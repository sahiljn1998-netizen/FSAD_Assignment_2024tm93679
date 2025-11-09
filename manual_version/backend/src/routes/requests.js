const express = require('express');
const router = express.Router();
const Request = require('../models/Request');
const Equipment = require('../models/Equipment');
const { auth, authorize } = require('../middleware/auth');

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

// @route   POST api/v1/requests
// @desc    Create new request (students and staff)
router.post('/', auth, authorize('student', 'staff'), async (req, res) => {
    try {
        const { equipment: equipmentId, startDate, endDate } = req.body;
        if (!equipmentId || !startDate || !endDate) return res.status(400).json({ error: 'equipment, startDate and endDate required' });

        const equipment = await Equipment.findById(equipmentId);
        if (!equipment) return res.status(404).json({ error: 'Equipment not found' });

        const start = new Date(startDate);
        const end = new Date(endDate);
        const requestedQuantity = parseInt(req.body.requestedQuantity, 10) || 1;

        if (requestedQuantity < 1) return res.status(400).json({ error: 'requestedQuantity must be at least 1' });
        if (requestedQuantity > equipment.quantity) return res.status(400).json({ error: 'requestedQuantity exceeds total equipment quantity' });

        // Prevent overlapping bookings: sum requestedQuantity of existing approved/issued requests overlapping this period
        const overlappingReqs = await Request.find({
            equipment: equipment._id,
            status: { $in: ['approved', 'issued'] },
            $or: [
                { startDate: { $lte: end }, endDate: { $gte: start } }
            ]
        });

        const occupied = overlappingReqs.reduce((sum, r) => sum + (r.requestedQuantity || 1), 0);

        if (occupied + requestedQuantity > equipment.quantity) {
            return res.status(400).json({ error: 'No available units for the requested period' });
        }

        const request = new Request({
            equipment: equipment._id,
            requester: req.user._id,
            requestedQuantity,
            startDate: start,
            endDate: end,
            status: 'pending'
        });
        await request.save();
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
        if (reqDoc.status !== 'pending') return res.status(400).json({ error: 'Only pending requests can be approved' });

        // Re-check overlapping approved/issued requests for the same period
        const equipment = await Equipment.findById(reqDoc.equipment);
        if (!equipment) return res.status(404).json({ error: 'Equipment not found' });

        const start = reqDoc.startDate;
        const end = reqDoc.endDate;

        const overlappingReqs = await Request.find({
            equipment: equipment._id,
            status: { $in: ['approved', 'issued'] },
            _id: { $ne: reqDoc._id },
            $or: [
                { startDate: { $lte: end }, endDate: { $gte: start } }
            ]
        });

        const occupied = overlappingReqs.reduce((sum, r) => sum + (r.requestedQuantity || 1), 0);

        if (occupied + (reqDoc.requestedQuantity || 1) > equipment.quantity) {
            return res.status(400).json({ error: 'No available units for the requested period' });
        }

        reqDoc.status = 'approved';
        reqDoc.approvedBy = req.user._id;
        await reqDoc.save();
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