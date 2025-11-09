import { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { ErrorMessage } from './common';

export default function RequestForm({ equipment, open, onClose }) {
  const { token } = useAuth();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
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

      onClose();
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => !loading && onClose()}>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Request {equipment?.name}</DialogTitle>
        <DialogContent>
          {error && <ErrorMessage error={error} />}

          <TextField
            margin="normal"
            required
            fullWidth
            label="Start Date"
            type="date"
            value={dates.startDate}
            onChange={(e) => setDates(d => ({ ...d, startDate: e.target.value }))}
            InputLabelProps={{ shrink: true }}
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
            inputProps={{ min: 1, max: equipment.quantity || undefined }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Request'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}