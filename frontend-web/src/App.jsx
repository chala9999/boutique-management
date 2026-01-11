import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/authStore';
import { useEffect } from 'react';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';
import AuthLayout from './layouts/AuthLayout';

// Pages Auth
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Pages Dashboard
import Dashboard from './pages/dashboard/Dashboard';
import Boutiques from './pages/boutiques/Boutiques';
import Produits from './pages/produits/Produits';
import Ventes from './pages/ventes/Ventes';
import NouvelleVente from './pages/ventes/NouvelleVente';
import Clients from './pages/clients/Clients';
import Fournisseurs from './pages/fournisseurs/Fournisseurs';
import Commandes from './pages/commandes/Commandes';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  const { loadUser } = useAuthStore();

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Routes publiques (Auth) */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          {/* Routes protégées (Dashboard) */}
          <Route
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Dashboard />} />
            <Route path="/boutiques" element={<Boutiques />} />
            <Route path="/produits" element={<Produits />} />
            <Route path="/ventes" element={<Ventes />} />
            <Route path="/ventes/nouvelle" element={<NouvelleVente />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/fournisseurs" element={<Fournisseurs />} />
            <Route path="/commandes" element={<Commandes />} />
          </Route>

          {/* Redirection par défaut */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;