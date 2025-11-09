const Request = require('../models/Request');

/**
 * Check if equipment is available for the requested period
 * @param {ObjectId} equipmentId - Equipment ID
 * @param {Date} startDate - Booking start date
 * @param {Date} endDate - Booking end date
 * @param {Number} requestedQuantity - Number of units requested
 * @param {Number} totalQuantity - Total equipment quantity
 * @param {ObjectId} excludeRequestId - Optional: exclude a specific request (for updates)
 * @returns {Object} { available: boolean, occupied: number, message: string }
 */
async function checkEquipmentAvailability(
  equipmentId,
  startDate,
  endDate,
  requestedQuantity,
  totalQuantity,
  excludeRequestId = null
) {
  try {
    // Find all overlapping requests that are approved or issued
    const query = {
      equipment: equipmentId,
      status: { $in: ['approved', 'issued'] },
      $or: [
        // Request starts before or during the period and ends during or after
        { startDate: { $lte: endDate }, endDate: { $gte: startDate } }
      ]
    };

    // Exclude specific request if updating
    if (excludeRequestId) {
      query._id = { $ne: excludeRequestId };
    }

    const overlappingReqs = await Request.find(query);

    // Calculate total occupied units during the period
    const occupied = overlappingReqs.reduce((sum, r) => sum + (r.requestedQuantity || 1), 0);
    const available = totalQuantity - occupied;

    if (occupied + requestedQuantity > totalQuantity) {
      return {
        available: false,
        occupied,
        availableUnits: available,
        message: `Not enough units available. ${available} of ${totalQuantity} units available for this period.`
      };
    }

    return {
      available: true,
      occupied,
      availableUnits: available,
      message: 'Equipment is available for the requested period'
    };
  } catch (error) {
    console.error('Error checking equipment availability:', error);
    throw new Error('Failed to check equipment availability');
  }
}

/**
 * Validate date range
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Object} { valid: boolean, message: string }
 */
function validateDateRange(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const now = new Date();

  // Remove time component for comparison
  now.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { valid: false, message: 'Invalid date format' };
  }

  if (start < now) {
    return { valid: false, message: 'Start date cannot be in the past' };
  }

  if (end < start) {
    return { valid: false, message: 'End date must be after start date' };
  }

  // Optional: Limit maximum booking duration (e.g., 30 days)
  const maxDurationDays = 30;
  const durationDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  
  if (durationDays > maxDurationDays) {
    return { 
      valid: false, 
      message: `Booking duration cannot exceed ${maxDurationDays} days. Requested: ${durationDays} days` 
    };
  }

  return { valid: true, message: 'Date range is valid' };
}

/**
 * Validate requested quantity
 * @param {Number} requestedQuantity - Requested quantity
 * @param {Number} totalQuantity - Total equipment quantity
 * @returns {Object} { valid: boolean, message: string }
 */
function validateQuantity(requestedQuantity, totalQuantity) {
  const qty = parseInt(requestedQuantity, 10);

  if (isNaN(qty) || qty < 1) {
    return { valid: false, message: 'Requested quantity must be at least 1' };
  }

  if (qty > totalQuantity) {
    return { 
      valid: false, 
      message: `Requested quantity (${qty}) exceeds total equipment quantity (${totalQuantity})` 
    };
  }

  return { valid: true, message: 'Quantity is valid' };
}

/**
 * Get overlapping requests for display/debugging
 * @param {ObjectId} equipmentId - Equipment ID
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Array} Array of overlapping requests
 */
async function getOverlappingRequests(equipmentId, startDate, endDate) {
  return await Request.find({
    equipment: equipmentId,
    status: { $in: ['approved', 'issued'] },
    $or: [
      { startDate: { $lte: endDate }, endDate: { $gte: startDate } }
    ]
  }).populate('requester', 'name email').populate('equipment', 'name');
}

module.exports = {
  checkEquipmentAvailability,
  validateDateRange,
  validateQuantity,
  getOverlappingRequests
};
