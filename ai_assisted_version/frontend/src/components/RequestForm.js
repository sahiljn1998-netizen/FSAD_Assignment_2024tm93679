import { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, CircularProgress, Box } from '@mui/material';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import { ErrorMessage } from './common';

export default function RequestForm({ equipment, open, onClose, onRequestCreated }) {
  const { token } = useAuth();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [dates, setDates] = useState({ startDate: '', endDate: '' });
  const [requestedQuantity, setRequestedQuantity] = useState(1);

  if (!equipment) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) return;

    // basic validation
    if (!dates.startDate || !dates.endDate) {
      setError(new Error('Start and end dates are required'));
      return;
    }
    if (new Date(dates.startDate) > new Date(dates.endDate)) {
      setError(new Error('Start date must be before or equal to end date'));
      return;
    }
    if (!requestedQuantity || requestedQuantity < 1) {
      setError(new Error('Requested quantity must be at least 1'));
      return;
    }
    if (requestedQuantity > (equipment.quantity || 0)) {
      setError(new Error('Requested quantity exceeds total equipment quantity'));
      return;
    }

    setError(null);
    setLoading(true);
    setSuccess(false);

    try {
      const res = await fetch('http://localhost:5000/api/v1/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          equipment: equipment._id,
          startDate: dates.startDate,
          endDate: dates.endDate,
          requestedQuantity
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create request');
      }

      const newRequest = await res.json();
      
      // Show success state briefly
      setSuccess(true);
      toast.success('Request submitted successfully!');
      
      // Notify parent component if callback provided
      if (onRequestCreated) {
        onRequestCreated(newRequest);
      }

      // Close after a short delay to show success feedback
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setDates({ startDate: '', endDate: '' });
        setRequestedQuantity(1);
      }, 800);
    } catch (err) {
      setError(err);
      setLoading(false);
      toast.error(err.message || 'Failed to submit request');
    }
  };

  return (
    <Dialog open={open} onClose={() => !loading && onClose()}>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {success ? '✓ Request Submitted!' : `Request ${equipment?.name}`}
        </DialogTitle>
        <DialogContent>
          {error && <ErrorMessage error={error} />}
          
          {success && (
            <Box sx={{ py: 2, textAlign: 'center', color: 'success.main' }}>
              Your request has been submitted successfully!
            </Box>
          )}

          {!success && (
            <>
              <TextField
                margin="normal"
                required
                fullWidth
                label="Start Date"
                type="date"
                value={dates.startDate}
                onChange={(e) => setDates(d => ({ ...d, startDate: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                disabled={loading}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                label="End Date"
                type="date"
                value={dates.endDate}
                onChange={(e) => setDates(d => ({ ...d, endDate: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                disabled={loading}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                label="Requested Quantity"
                type="number"
                value={requestedQuantity}
                onChange={(e) => setRequestedQuantity(parseInt(e.target.value, 10) || 1)}
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: 1, max: equipment?.quantity || undefined }}
                disabled={loading}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            {success ? 'Close' : 'Cancel'}
          </Button>
          {!success && (
            <Button 
              type="submit" 
              variant="contained" 
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </Button>
          )}
        </DialogActions>
      </form>
    </Dialog>
  );
}