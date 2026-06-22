import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { produitsAPI } from '../../api/produits';
import { boutiquesAPI } from '../../api/boutiques';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from '../../hooks/usePermissions';
import ConfirmModal from '../../components/ui/ConfirmModal';

import {
  Plus,
  Edit,
  Trash2,
  Package,
  Search,
  AlertTriangle,
  Eye,
  Ban,
  CheckCircle,
} from 'lucide-react';
import ProduitModal from '../../components/produits/ProduitModal';

const Produits = () => {
  const { can } = usePermissions();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduit, setSelectedProduit] = useState(null);
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    search: '',
    boutique: '',
    categorie: '',
    stock_faible: false,
    actifs: 'tous',
  });

  // Récupérer les produits
  const { data: produits, isLoading } = useQuery({
    queryKey: ['produits', filters],
    queryFn: () => produitsAPI.getAll(filters),
  });

  // Récupérer les boutiques pour le filtre
  const { data: boutiques } = useQuery({
    queryKey: ['boutiques'],
    queryFn: () => boutiquesAPI.getAll(),
  });

  // Récupérer les catégories
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => produitsAPI.getCategories(),
  });

  // Supprimer un produit
  const deleteMutation = useMutation({
    mutationFn: (id) => produitsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['produits']);
      alert('Produit supprimé avec succès');
    },
    onError: (error) => {
      alert(error.response?.data?.error || 'Erreur lors de la suppression');
    },
  });

  const handleEdit = async (produit) => {
  try {
    const detail = await produitsAPI.getById(produit.id);
    setSelectedProduit(detail);
    setIsModalOpen(true);
  } catch (error) {
    alert('Erreur lors du chargement du produit');
  }
};
// Ajoute cet état en haut
const [confirmModal, setConfirmModal] = useState({
  isOpen: false,
  produitId: null,
  nom: '',
  action: ''
});

// Mutation toggle
const toggleActiveMutation = useMutation({
  mutationFn: (id) => produitsAPI.toggleActive(id),
  onSuccess: () => {
    queryClient.invalidateQueries(['produits']);
  },
  onError: (error) => {
    alert(error.response?.data?.error || 'Erreur lors du changement de statut');
  },
});

// Handler
const handleToggleActive = (id, nom, action) => {
  setConfirmModal({ isOpen: true, produitId: id, nom, action });
};

const confirmToggle = () => {
  toggleActiveMutation.mutate(confirmModal.produitId);
  setConfirmModal({ isOpen: false, produitId: null, nom: '', action: '' });
};

  const handleDelete = (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProduit(null);
  };

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters({
      ...filters,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Produits</h1>
          <p className="text-gray-600 mt-1">
            Gérez votre catalogue de produits
          </p>
        </div>
        {can.createProduit && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Nouveau Produit</span>
          </button>
        )}
      </div>

      {/* Filtres */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="label">Recherche</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                className="input pl-10"
                placeholder="Nom, référence..."
              />
            </div>
          </div>

          <div>
            <label className="label">Boutique</label>
            <select
              name="boutique"
              value={filters.boutique}
              onChange={handleFilterChange}
              className="input"
            >
              <option value="">Toutes les boutiques</option>
              {boutiques?.results?.map((boutique) => (
                <option key={boutique.id} value={boutique.id}>
                  {boutique.nom}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Catégorie</label>
            <select
              name="categorie"
              value={filters.categorie}
              onChange={handleFilterChange}
              className="input"
            >
              <option value="">Toutes les catégories</option>
              {categories?.results?.map((categorie) => (
                <option key={categorie.id} value={categorie.id}>
                  {categorie.nom}
                </option>
              ))}
            </select>
          </div>
           <div>
  <label className="label">Statut</label>
  <select
    name="actifs"
    value={filters.actifs}
    onChange={handleFilterChange}
    className="input"
  >
    <option value="tous">Tous</option>
    <option value="true">Actifs</option>
    <option value="false">Inactifs</option>
  </select>
</div>
          <div className="flex items-end space-x-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                name="stock_faible"
                checked={filters.stock_faible}
                onChange={handleFilterChange}
                className="w-4 h-4 text-primary-600 rounded"
              />
              <span className="text-sm text-gray-700">Stock faible</span>
            </label>
          </div>
        </div>
      </div>

      {/* Liste des produits */}
      {produits?.results?.length === 0 ? (
        <div className="card text-center py-12">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucun produit
          </h3>
          <p className="text-gray-600 mb-4">
            Commencez par ajouter votre premier produit
          </p>
          {can.createProduit && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn-primary inline-flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Ajouter un produit</span>
            </button>
          )}
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Produit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Catégorie
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Boutique
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prix
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {produits?.results?.map((produit) => (
                <tr key={produit.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {produit.image_principale ? (
                        <img
                          src={produit.image_principale}
                          alt={produit.nom}
                          className="w-10 h-10 rounded object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                          <Package className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {produit.nom}
                        </div>
                        <div className="text-sm text-gray-500">
                          {produit.reference}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {produit.categorie_nom || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {produit.boutique_nom}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                    {produit.prix_vente.toLocaleString()} FCFA
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {produit.stock_faible && (
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                      )}
                      <span
                        className={`text-sm font-medium ${
                          produit.stock_faible
                            ? 'text-red-600'
                            : 'text-gray-900'
                        }`}
                      >
                        {produit.stock_actuel}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => navigate(`/produits/${produit.id}`)}
                        className="text-gray-600 hover:text-gray-900"
                        title="Voir le produit"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      {can.editProduit && (
                        <button
                          onClick={() => handleEdit(produit)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                      )}
                      {can.toggleProduit && (
                          <button
                            onClick={() => handleToggleActive(
                              produit.id,
                              produit.nom,
                              produit.is_active ? 'desactiver' : 'activer'
                            )}
                            className={produit.is_active ? 'text-orange-500 hover:text-orange-700' : 'text-green-600 hover:text-green-800'}
                            title={produit.is_active ? 'Désactiver' : 'Activer'}
                          >
                            {produit.is_active ? <Ban className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                          </button>
                        )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
<ConfirmModal
  isOpen={confirmModal.isOpen}
  onClose={() => setConfirmModal({ isOpen: false, produitId: null, nom: '', action: '' })}
  onConfirm={confirmToggle}
  title={`${confirmModal.action === 'activer' ? 'Activer' : 'Désactiver'} le produit`}
  message={`Êtes-vous sûr de vouloir ${confirmModal.action} le produit "${confirmModal.nom}" ?`}
  confirmText={confirmModal.action === 'activer' ? 'Activer' : 'Désactiver'}
  confirmVariant={confirmModal.action === 'activer' ? 'primary' : 'warning'}
/>
      {/* Modal */}
      {isModalOpen && (
        <ProduitModal produit={selectedProduit} onClose={handleCloseModal} />
      )}
    </div>
  );
};

export default Produits;