import { useAuthStore } from '../store/authStore';

export const usePermissions = () => {
  const { user } = useAuthStore();
  
  const isAdmin = user?.role === 'admin';
  const isVendeur = user?.role === 'vendeur';
  const isComptable = user?.role === 'comptable';
  const isAuthenticated = !!user;
  
  const can = {
    // Utilisateurs
    manageUsers: isAdmin,
    viewUsers: isAdmin,
    createUser: isAdmin,
    editUser: isAdmin,
    deleteUser: isAdmin,
    changeUserPassword: isAdmin,
    ajouterPaiementVente: isVendeur || isAdmin,
    
    // Boutiques — vendeur voit seulement
    manageBoutiques: isAdmin,
    viewBoutiques: isVendeur || isAdmin,
    createBoutique: isAdmin,
    editBoutique: isAdmin,
    deleteBoutique: isAdmin,
    toggleBoutique: isAdmin,
    
    // Catégories — vendeur voit seulement
    viewCategories: isVendeur || isAdmin,
    createCategorie: isAdmin,
    editCategorie: isAdmin,
    deleteCategorie: isAdmin,
    
    // Produits — vendeur voit seulement
    viewProduits: isVendeur || isAdmin,
    createProduit: isAdmin,
    editProduit: isAdmin,
    toggleProduit: isAdmin,
    
    // Clients — vendeur peut tout sauf supprimer
    viewClients: isVendeur || isAdmin,
    createClient: isVendeur || isAdmin,
    editClient: isVendeur || isAdmin,
    deleteClient: isAdmin,
    
    // Ventes
    createVente: isVendeur || isAdmin,
    viewVentes: isVendeur || isAdmin || isComptable,
    editVente: isVendeur || isAdmin,
    cancelVente: isVendeur || isAdmin,
    viewAllVentes: isAdmin || isComptable,
    
    // Fournisseurs — vendeur peut voir + créer commandes + recevoir
    viewFournisseurs: isVendeur || isAdmin,
    manageFournisseurs: isAdmin,
    viewCommandes: isVendeur || isAdmin,
    createCommande: isVendeur || isAdmin,
    editCommande: isAdmin,
    recevoirCommande: isVendeur || isAdmin,
    cancelCommande: isAdmin,
    managePaiementCommande: isAdmin,
    
    // Rapports
    viewReports: isAdmin || isComptable,
    exportReports: isAdmin || isComptable,
    viewStatsFinancieres: isAdmin || isComptable,
    viewVendeurPerformance: isAdmin,
    
    // Dashboard
    viewDashboard: true,
    viewAlertesStock: isVendeur || isAdmin,

    // Dépenses — tout le monde peut créer, admin peut supprimer celles des autres
    viewDepenses: true,
    createDepense: true,
    editDepense: true,
    deleteDepense: isAdmin,
  };
  
  return { user, isAdmin, isVendeur, isComptable, isAuthenticated, can };
};