import { useState, useEffect } from 'react';
import { 
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner, ErrorMessage } from '../components/common';
import RequestForm from '../components/RequestForm';

export default function EquipmentPage() {
  const { token, user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [categories, setCategories] = useState([]);
  const [filterCategory, setFilterCategory] = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);

  useEffect(() => {
    const fetchEquipment = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (filterCategory) params.set('category', filterCategory);
        if (availableOnly) params.set('available', 'true');

        const url = `http://localhost:5000/api/v1/equipment${params.toString() ? `?${params.toString()}` : ''}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch equipment');
        const data = await res.json();
        setItems(data);

        // derive categories from returned items (for the category filter options)
        const cats = Array.from(new Set(data.map(i => i.category).filter(Boolean)));
        setCategories(cats);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchEquipment();
  }, [filterCategory, availableOnly]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Available Equipment
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 3 }}>
        <FormControl sx={{ minWidth: 200 }} size="small">
          <InputLabel id="category-filter-label">Category</InputLabel>
          <Select
            labelId="category-filter-label"
            id="category-filter"
            value={filterCategory}
            label="Category"
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <MenuItem value="">All</MenuItem>
            {categories.map((c) => (
              <MenuItem key={c} value={c}>{c}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControlLabel
          control={<Switch checked={availableOnly} onChange={(e) => setAvailableOnly(e.target.checked)} />}
          label="Available only"
        />
      </Box>

      <Grid container spacing={3}>
        {items.map((item) => (
          <Grid item key={item._id} xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" component="h2">
                  {item.name}
                </Typography>
                <Typography color="textSecondary" gutterBottom>
                  {item.category}
                </Typography>
                <Typography variant="body2">
                  {item.description}
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="textSecondary">
                    Available: {item.available} / {item.quantity}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Condition: {item.condition}
                  </Typography>
                </Box>
              </CardContent>
              <CardActions>
                {user && user.role !== 'admin' && (
                  <Button
                    size="small"
                    variant="contained"
                    disabled={!token || item.available < 1}
                    onClick={() => setSelectedItem(item)}
                  >
                    Request
                  </Button>
                )}
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <RequestForm
        equipment={selectedItem}
        open={!!selectedItem}
        onClose={() => setSelectedItem(null)}
      />
    </Container>
  );
}