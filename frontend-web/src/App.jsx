import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/authStore';
import { useEffect } from 'react';
import { usePermissions } from './hooks/usePermissions';
import ModifierCommande from './pages/commandes/ModifierCommande';

// Pages
import DetailProduit from './pages/produits/DetailProduit';
import Categories from './pages/produits/Categories';
import DetailCategorie from './pages/produits/DetailCategorie';
import DetailVente from './pages/ventes/DetailVente';
import ClientDetail from './pages/clients/ClientDetail';
import DetailFournisseur from './pages/fournisseurs/DetailFournisseur';
import Reports from './pages/reports/Reports';
import ModifierVente from './pages/ventes/ModifierVente';
import Depenses from './pages/depenses/Depenses';
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
import Users from './pages/users/Users';
import NouvelleCommande from './pages/commandes/NouvelleCommande';
import DetailCommande from './pages/commandes/DetailCommande';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Protected Route Component with Permission Check
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

// Route wrapper with permission
const RouteWithPermission = ({ element, permission, fallbackPath = '/' }) => {
  const { can } = usePermissions();
  
  if (permission && !can[permission]) {
    return <Navigate to={fallbackPath} replace />;
  }
  
  return element;
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
            <Route path="/users" element={<Users />} />
            <Route path="/commandes/nouvelle" element={<NouvelleCommande />} />
            <Route path="/commandes/:id" element={<DetailCommande />} />
            <Route path="/produits/:id" element={<DetailProduit />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/categories/:id" element={<DetailCategorie />} />
            <Route path="/ventes/:id" element={<DetailVente />} />
            <Route path="/clients/:id" element={<ClientDetail />} />
            <Route path="/fournisseurs/:id" element={<DetailFournisseur />} />
            <Route path="/rapports" element={<Reports />} />
            <Route path="/ventes/:id/modifier" element={<ModifierVente />} />
            <Route path="/commandes/:id/modifier" element={<ModifierCommande />} />
            <Route path="/depenses" element={<Depenses />} />
          </Route>

          {/* Redirection par défaut */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;