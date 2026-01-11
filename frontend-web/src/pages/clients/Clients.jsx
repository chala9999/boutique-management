import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientsAPI } from '../../api/clients';
import { boutiquesAPI } from '../../api/boutiques';
import { Plus, Edit, Trash2, Users, Search, Award } from 'lucide-react';
import ClientModal from '../../components/clients/ClientModal';

const Clients = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    boutique: '',
  });

  // Récupérer les clients
  const { data: clients, isLoading } = useQuery({
    queryKey: ['clients', filters],
    queryFn: () => clientsAPI.getAll(filters),
  });

  // Récupérer les boutiques
  const { data: boutiques } = useQuery({
    queryKey: ['boutiques'],
    queryFn: () => boutiquesAPI.getAll(),
  });

  // Supprimer un client
  const deleteMutation = useMutation({
    mutationFn: (id) => clientsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['clients']);
      alert('Client supprimé avec succès');
    },
    onError: (error) => {
      alert(error.response?.data?.error || 'Erreur lors de la suppression');
    },
  });

  const handleEdit = (client) => {
    setSelectedClient(client);
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedClient(null);
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
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
          <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-600 mt-1">
            Gérez votre base de clients
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Nouveau Client</span>
        </button>
      </div>

      {/* Filtres */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                placeholder="Nom, téléphone, email..."
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
        </div>
      </div>

      {/* Liste des clients */}
      {clients?.results?.length === 0 ? (
        <div className="card text-center py-12">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucun client
          </h3>
          <p className="text-gray-600 mb-4">
            Commencez par ajouter votre premier client
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-primary inline-flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Ajouter un client</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients?.results?.map((client) => (
            <div key={client.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {client.nom_complet}
                    </h3>
                    <p className="text-sm text-gray-600">{client.telephone}</p>
                  </div>
                </div>
              </div>

              {client.email && (
                <p className="text-sm text-gray-600 mb-2">{client.email}</p>
              )}

              <div className="grid grid-cols-2 gap-4 py-3 border-t border-gray-200">
                <div>
                  <p className="text-xs text-gray-600">Achats</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {client.nombre_achats}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Total dépensé</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {client.total_achats?.toLocaleString() || 0} FCFA
                  </p>
                </div>
              </div>

              {client.points_fidelite > 0 && (
                <div className="flex items-center space-x-2 mt-3 p-2 bg-yellow-50 rounded-lg">
                  <Award className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm text-yellow-700 font-medium">
                    {client.points_fidelite} points fidélité
                  </span>
                </div>
              )}

              <div className="flex items-center space-x-2 mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleEdit(client)}
                  className="flex-1 btn-secondary flex items-center justify-center space-x-2"
                >
                  <Edit className="w-4 h-4" />
                  <span>Modifier</span>
                </button>
                <button
                  onClick={() => handleDelete(client.id)}
                  className="flex-1 btn-danger flex items-center justify-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Supprimer</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <ClientModal client={selectedClient} onClose={handleCloseModal} />
      )}
    </div>
  );
};

export default Clients;