import { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Box,
  Alert,
  CircularProgress
} from '@mui/material';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import { useOptimisticUpdate } from '../hooks/useOptimistic';

export default function RequestsPage() {
  const { token, user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingIds, setUpdatingIds] = useState(new Set());
  const { execute: executeOptimistic } = useOptimisticUpdate();

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/v1/requests', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch requests');
      const data = await res.json();
      setRequests(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchRequests();
  }, [token]);

  const doAction = async (id, action) => {
    // Mark this request as updating
    setUpdatingIds(prev => new Set(prev).add(id));
    setError(null);

    // Map actions to their resulting status
    const statusMap = {
      'approve': 'approved',
      'reject': 'rejected',
      'issue': 'issued',
      'return': 'returned'
    };

    const newStatus = statusMap[action];

    // Optimistic update: immediately update the UI
    const optimisticUpdate = (currentRequests) => {
      return currentRequests.map(req => 
        req._id === id 
          ? { ...req, status: newStatus, approvedBy: action === 'approve' ? user._id : req.approvedBy }
          : req
      );
    };

    // Actual API call
    const apiCall = async () => {
      const res = await fetch(`http://localhost:5000/api/v1/requests/${id}/${action}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Action failed');
      }
      return await res.json();
    };

    const result = await executeOptimistic(setRequests, optimisticUpdate, apiCall);

    // Remove from updating set
    setUpdatingIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });

    if (result.success) {
      // Show success toast
      const actionMessages = {
        'approve': 'Request approved successfully!',
        'reject': 'Request rejected',
        'issue': 'Equipment issued successfully!',
        'return': 'Equipment marked as returned!'
      };
      toast.success(actionMessages[action] || 'Action completed successfully');
      
      // Optionally refresh to get server state
      await fetchRequests();
    } else {
      setError(result.error);
      toast.error(result.error.message || 'Action failed');
    }
  };

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>Requests</Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error.message || String(error)}</Alert>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Equipment</TableCell>
              <TableCell>Requester</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Requested Qty</TableCell>
              <TableCell>Start</TableCell>
              <TableCell>End</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {requests.map(r => {
              const isUpdating = updatingIds.has(r._id);
              return (
              <TableRow key={r._id} sx={{ opacity: isUpdating ? 0.6 : 1 }}>
                <TableCell>{r.equipment?.name || r.equipment}</TableCell>
                <TableCell>{r.requester?.name || r.requester?.email}</TableCell>
                <TableCell sx={{ textTransform: 'capitalize' }}>{r.requester?.role}</TableCell>
                <TableCell>{r.requestedQuantity || 1}</TableCell>
                <TableCell>{new Date(r.startDate).toLocaleDateString()}</TableCell>
                <TableCell>{new Date(r.endDate).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {r.status}
                    {isUpdating && <CircularProgress size={16} />}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {user && (user.role === 'staff' || user.role === 'admin') && r.status === 'pending' && (
                      <>
                        <Button 
                          variant="contained" 
                          color="success" 
                          onClick={() => doAction(r._id, 'approve')}
                          disabled={isUpdating}
                        >
                          Approve
                        </Button>
                        <Button 
                          variant="outlined" 
                          color="error" 
                          onClick={() => doAction(r._id, 'reject')}
                          disabled={isUpdating}
                        >
                          Reject
                        </Button>
                      </>
                    )}

                    {user && user.role === 'admin' && r.status === 'approved' && (
                      <Button 
                        variant="contained" 
                        color="primary" 
                        onClick={() => doAction(r._id, 'issue')}
                        disabled={isUpdating}
                      >
                        Issue
                      </Button>
                    )}

                    {user && user.role === 'admin' && r.status === 'issued' && (
                      <Button 
                        variant="contained" 
                        color="secondary" 
                        onClick={() => doAction(r._id, 'return')}
                        disabled={isUpdating}
                      >
                        Mark Returned
                      </Button>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}
