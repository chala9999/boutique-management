import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fournisseursAPI } from '../../api/fournisseurs';
import { boutiquesAPI } from '../../api/boutiques';
import { Plus, Edit, Trash2, Truck, Search, Phone, Mail } from 'lucide-react';
import FournisseurModal from '../../components/fournisseurs/FournisseurModal';
import { Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from '../../hooks/usePermissions'; // ✅ ajoute

const Fournisseurs = () => {
  const queryClient = useQueryClient();
  const { isComptable } = usePermissions();
  const { can } = usePermissions(); // ✅ ajoute
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFournisseur, setSelectedFournisseur] = useState(null);
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    search: '',
    boutique: '',
    actifs: true,
  });

  const { data: fournisseurs, isLoading } = useQuery({
    queryKey: ['fournisseurs', filters],
    queryFn: () => fournisseursAPI.getAll(filters),
  });

  const { data: boutiques } = useQuery({
    queryKey: ['boutiques'],
    queryFn: () => boutiquesAPI.getAll(),
    enabled: !isComptable,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => fournisseursAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['fournisseurs']);
      alert('Fournisseur supprimé avec succès');
    },
    onError: (error) => {
      alert(error.response?.data?.error || 'Erreur lors de la suppression');
    },
  });

  const handleEdit = (fournisseur) => {
    setSelectedFournisseur(fournisseur);
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce fournisseur ?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedFournisseur(null);
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
          <h1 className="text-3xl font-bold text-gray-900">Fournisseurs</h1>
          <p className="text-gray-600 mt-1">Gérez vos fournisseurs et partenaires</p>
        </div>
        {/* ✅ Admin seulement */}
        {can.manageFournisseurs && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Nouveau Fournisseur</span>
          </button>
        )}
      </div>

      {/* Filtres — inchangés */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                placeholder="Nom, entreprise, téléphone..."
              />
            </div>
          </div>

          {!isComptable && (
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
          )}
          <div className="flex items-end">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                name="actifs"
                checked={filters.actifs}
                onChange={handleFilterChange}
                className="w-4 h-4 text-primary-600 rounded"
              />
              <span className="text-sm text-gray-700">Actifs uniquement</span>
            </label>
          </div>
        </div>
      </div>

      {/* Liste vide */}
      {fournisseurs?.results?.length === 0 ? (
        <div className="card text-center py-12">
          <Truck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun fournisseur</h3>
          <p className="text-gray-600 mb-4">Commencez par ajouter votre premier fournisseur</p>
          {/* ✅ Admin seulement */}
          {can.manageFournisseurs && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn-primary inline-flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Ajouter un fournisseur</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {fournisseurs?.results?.map((fournisseur) => (
            <div key={fournisseur.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <Truck className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{fournisseur.nom}</h3>
                    {fournisseur.entreprise && (
                      <p className="text-sm text-gray-600">{fournisseur.entreprise}</p>
                    )}
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  fournisseur.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  {fournisseur.is_active ? 'Actif' : 'Inactif'}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4 flex-shrink-0" />
                  <span>{fournisseur.telephone}</span>
                </div>
                {fournisseur.email && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{fournisseur.email}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 py-3 border-t border-gray-200">
                <div>
                  <p className="text-xs text-gray-600">Commandes</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {fournisseur.nombre_commandes || 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Total</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {fournisseur.total_commandes?.toLocaleString() || 0} FCFA
                  </p>
                </div>
              </div>

              {/* ✅ Actions conditionnelles */}
              <div className="flex items-center space-x-2 mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => navigate(`/fournisseurs/${fournisseur.id}`)}
                  className="flex-1 btn-secondary flex items-center justify-center space-x-2"
                >
                  <Eye className="w-4 h-4" />
                  <span>Voir</span>
                </button>
                {can.manageFournisseurs && (
                  <button
                    onClick={() => handleEdit(fournisseur)}
                    className="flex-1 btn-secondary flex items-center justify-center space-x-2"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Modifier</span>
                  </button>
                )}
                {can.manageFournisseurs && (
                  <button
                    onClick={() => handleDelete(fournisseur.id)}
                    className="flex-1 btn-danger flex items-center justify-center space-x-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Supprimer</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <FournisseurModal fournisseur={selectedFournisseur} onClose={handleCloseModal} />
      )}
    </div>
  );
};

export default Fournisseurs;