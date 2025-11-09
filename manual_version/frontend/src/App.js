import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AppBar, Box, Button, Container, CssBaseline, Toolbar, Typography } from '@mui/material';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import EquipmentPage from './pages/EquipmentPage';
import AdminEquipmentPage from './pages/AdminEquipmentPage';
import RequestsPage from './pages/RequestsPage';
import './App.css';

const RequireAuth = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user?.role)) return <Navigate to="/equipment" />;
  return children;
};

const Layout = ({ children }) => {
  const { user, logout } = useAuth();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component={Link} to="/" sx={{ flexGrow: 1, textDecoration: 'none', color: 'inherit' }}>
            School Equipment Lending
          </Typography>
          {user ? (
            <>
              <Box sx={{ flexGrow: 1, display: 'flex', gap: 2 }}>
                <Button color="inherit" component={Link} to="/equipment">
                  View Equipment
                </Button>
                <Button color="inherit" component={Link} to="/requests">
                  Requests
                </Button>
                {user.role === 'admin' && (
                  <Button color="inherit" component={Link} to="/admin/equipment">
                    Manage Equipment
                  </Button>
                )}
              </Box>
              <Typography variant="body2" sx={{ mr: 2 }}>
                {user.name} ({user.role})
              </Typography>
              <Button color="inherit" onClick={logout}>Logout</Button>
            </>
          ) : (
            <>
              <Button color="inherit" component={Link} to="/login" sx={{ mr: 1 }}>Login</Button>
              <Button color="inherit" component={Link} to="/register">Register</Button>
            </>
          )}
        </Toolbar>
      </AppBar>
      <Box component="main" sx={{ flexGrow: 1, py: 3 }}>
        {children}
      </Box>
    </Box>
  );
};

function App() {
  return (
    <AuthProvider>
      <CssBaseline />
      <BrowserRouter>
        <Layout>
          <Container>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/equipment" element={<RequireAuth><EquipmentPage /></RequireAuth>} />
              <Route 
                path="/admin/equipment" 
                element={
                  <RequireAuth allowedRoles={[ 'admin' ]}>
                    <AdminEquipmentPage />
                  </RequireAuth>
                } 
              />
              <Route path="/requests" element={<RequireAuth><RequestsPage /></RequireAuth>} />
              <Route path="/" element={<Navigate to="/equipment" />} />
            </Routes>
          </Container>
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
