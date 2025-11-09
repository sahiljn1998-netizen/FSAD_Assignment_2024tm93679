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
  Alert
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

export default function RequestsPage() {
  const { token, user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

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
    try {
      setError(null);
      const res = await fetch(`http://localhost:5000/api/v1/requests/${id}/${action}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Action failed');
      }
      await fetchRequests();
    } catch (err) {
      setError(err);
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
            {requests.map(r => (
              <TableRow key={r._id}>
                <TableCell>{r.equipment?.name || r.equipment}</TableCell>
                <TableCell>{r.requester?.name || r.requester?.email}</TableCell>
                <TableCell sx={{ textTransform: 'capitalize' }}>{r.requester?.role}</TableCell>
                <TableCell>{r.requestedQuantity || 1}</TableCell>
                <TableCell>{new Date(r.startDate).toLocaleDateString()}</TableCell>
                <TableCell>{new Date(r.endDate).toLocaleDateString()}</TableCell>
                <TableCell>{r.status}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {user && (user.role === 'staff' || user.role === 'admin') && r.status === 'pending' && (
                      <>
                        <Button variant="contained" color="success" onClick={() => doAction(r._id, 'approve')}>Approve</Button>
                        <Button variant="outlined" color="error" onClick={() => doAction(r._id, 'reject')}>Reject</Button>
                      </>
                    )}

                    {user && user.role === 'admin' && r.status === 'approved' && (
                      <Button variant="contained" color="primary" onClick={() => doAction(r._id, 'issue')}>Issue</Button>
                    )}

                    {user && user.role === 'admin' && r.status === 'issued' && (
                      <Button variant="contained" color="secondary" onClick={() => doAction(r._id, 'return')}>Mark Returned</Button>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}
