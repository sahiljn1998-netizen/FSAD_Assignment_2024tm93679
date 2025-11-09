import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import { useOptimisticUpdate } from '../hooks/useOptimistic';

export default function AdminEquipmentPage() {
  const { token } = useAuth();
  const [equipment, setEquipment] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [error, setError] = useState('');
  const [updatingIds, setUpdatingIds] = useState(new Set());
  const { execute: executeOptimistic } = useOptimisticUpdate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    quantity: '',
    category: '',
    condition: 'Good',
    available: ''
  });

  const fetchEquipment = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/v1/equipment', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch equipment');
      const data = await response.json();
      setEquipment(data);
    } catch (err) {
      setError('Failed to fetch equipment');
      console.error(err);
    }
  };

  useEffect(() => {
    fetchEquipment();
  }, [token]);

  const handleOpenDialog = (equipment = null) => {
    if (equipment) {
      setFormData({
        name: equipment.name,
        description: equipment.description,
        quantity: equipment.quantity.toString(),
        category: equipment.category,
        condition: equipment.condition || 'Good',
        available: (equipment.available !== undefined && equipment.available !== null) ? equipment.available.toString() : equipment.quantity.toString()
      });
      setSelectedEquipment(equipment);
    } else {
      setFormData({
        name: '',
        description: '',
        quantity: '',
        category: '',
        condition: 'Good',
        available: ''
      });
      setSelectedEquipment(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedEquipment(null);
    setFormData({
      name: '',
      description: '',
      quantity: '',
      category: ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const equipmentData = {
      name: formData.name,
      description: formData.description,
      category: formData.category,
      condition: formData.condition,
      quantity: parseInt(formData.quantity, 10),
      available: formData.available !== '' ? parseInt(formData.available, 10) : undefined
    };

    if (selectedEquipment) {
      // Update existing equipment with optimistic update
      const itemId = selectedEquipment._id;
      setUpdatingIds(prev => new Set(prev).add(itemId));

      const optimisticUpdate = (currentEquipment) => {
        return currentEquipment.map(item =>
          item._id === itemId ? { ...item, ...equipmentData } : item
        );
      };

      const apiCall = async () => {
        const response = await fetch(`http://localhost:5000/api/v1/equipment/${itemId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(equipmentData)
        });

        if (!response.ok) throw new Error('Failed to save equipment');
        return await response.json();
      };

      const result = await executeOptimistic(setEquipment, optimisticUpdate, apiCall);
      
      setUpdatingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });

      if (result.success) {
        handleCloseDialog();
        setError('');
        toast.success('Equipment updated successfully!');
      } else {
        setError('Failed to save equipment');
        toast.error('Failed to update equipment');
      }
    } else {
      // Add new equipment - optimistically add with temporary ID
      const tempId = `temp-${Date.now()}`;
      const tempEquipment = { ...equipmentData, _id: tempId };

      const optimisticUpdate = (currentEquipment) => {
        return [...currentEquipment, tempEquipment];
      };

      const apiCall = async () => {
        const response = await fetch('http://localhost:5000/api/v1/equipment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(equipmentData)
        });

        if (!response.ok) throw new Error('Failed to save equipment');
        return await response.json();
      };

      const result = await executeOptimistic(setEquipment, optimisticUpdate, apiCall);

      if (result.success) {
        // Replace temp item with real one from server
        setEquipment(current => 
          current.map(item => item._id === tempId ? result.data : item)
        );
        handleCloseDialog();
        setError('');
        toast.success('Equipment added successfully!');
      } else {
        setError('Failed to save equipment');
        toast.error('Failed to add equipment');
      }
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    
    setUpdatingIds(prev => new Set(prev).add(id));
    setError('');

    // Optimistic update: remove item immediately
    const optimisticUpdate = (currentEquipment) => {
      return currentEquipment.filter(item => item._id !== id);
    };

    const apiCall = async () => {
      const response = await fetch(`http://localhost:5000/api/v1/equipment/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete equipment');
      }
      return data;
    };

    const result = await executeOptimistic(setEquipment, optimisticUpdate, apiCall);
    
    setUpdatingIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });

    if (result.success) {
      toast.success('Equipment deleted successfully!');
    } else {
      setError(result.error.message || 'Failed to delete equipment');
      toast.error(result.error.message || 'Failed to delete equipment');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Manage Equipment</Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => handleOpenDialog()}
        >
          Add New Equipment
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>Available</TableCell>
              <TableCell>Condition</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {equipment.map((item) => {
              const isUpdating = updatingIds.has(item._id);
              return (
              <TableRow key={item._id} sx={{ opacity: isUpdating ? 0.6 : 1 }}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {item.name}
                    {isUpdating && <CircularProgress size={16} />}
                  </Box>
                </TableCell>
                <TableCell>{item.description}</TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell>{item.quantity}</TableCell>
                <TableCell>{item.available}</TableCell>
                <TableCell>{item.condition}</TableCell>
                <TableCell align="center">
                  <IconButton 
                    color="primary" 
                    onClick={() => handleOpenDialog(item)}
                    disabled={isUpdating}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton 
                    color="error" 
                    onClick={() => handleDelete(item._id)}
                    disabled={isUpdating}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedEquipment ? 'Edit Equipment' : 'Add New Equipment'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              margin="normal"
            />
            <TextField
              fullWidth
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              margin="normal"
              multiline
              rows={3}
            />
            <TextField
              fullWidth
              label="Category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              required
              margin="normal"
            />
            <TextField
              fullWidth
              label="Quantity"
              name="quantity"
              type="number"
              value={formData.quantity}
              onChange={handleInputChange}
              required
              margin="normal"
            />
            <FormControl fullWidth margin="normal">
              <InputLabel id="condition-label">Condition</InputLabel>
              <Select
                labelId="condition-label"
                id="condition"
                name="condition"
                value={formData.condition}
                label="Condition"
                onChange={handleInputChange}
              >
                <MenuItem value="Good">Good</MenuItem>
                <MenuItem value="Fair">Fair</MenuItem>
                <MenuItem value="Poor">Poor</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Available Quantity"
              name="available"
              type="number"
              value={formData.available}
              onChange={handleInputChange}
              required
              margin="normal"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {selectedEquipment ? 'Save Changes' : 'Add Equipment'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}