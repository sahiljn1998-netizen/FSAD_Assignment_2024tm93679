import { Box, CircularProgress, Typography } from '@mui/material';

export const LoadingSpinner = ({ message = 'Loading...' }) => (
  <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="200px">
    <CircularProgress />
    <Typography sx={{ mt: 2 }} variant="body2" color="text.secondary">
      {message}
    </Typography>
  </Box>
);

export const ErrorMessage = ({ error }) => (
  <Typography color="error" align="center" sx={{ my: 2 }}>
    {error.message || error}
  </Typography>
);