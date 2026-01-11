import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { boutiquesAPI } from '../../api/boutiques';
import { Plus, Edit, Trash2, Store, MapPin, Phone } from 'lucide-react';
import BoutiqueModal from '../../components/boutiques/BoutiqueModal';

const Boutiques = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBoutique, setSelectedBoutique] = useState(null);

  // Récupérer les boutiques
  const { data: boutiques, isLoading } = useQuery({
    queryKey: ['boutiques'],
    queryFn: () => boutiquesAPI.getAll(),
  });

  // Supprimer une boutique
  const deleteMutation = useMutation({
    mutationFn: (id) => boutiquesAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['boutiques']);
      alert('Boutique supprimée avec succès');
    },
    onError: (error) => {
      alert(error.response?.data?.error || 'Erreur lors de la suppression');
    },
  });

  const handleEdit = (boutique) => {
    setSelectedBoutique(boutique);
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette boutique ?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedBoutique(null);
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
          <h1 className="text-3xl font-bold text-gray-900">Boutiques</h1>
          <p className="text-gray-600 mt-1">
            Gérez vos boutiques physiques et en ligne
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Nouvelle Boutique</span>
        </button>
      </div>

      {/* Liste des boutiques */}
      {boutiques?.results?.length === 0 ? (
        <div className="card text-center py-12">
          <Store className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucune boutique
          </h3>
          <p className="text-gray-600 mb-4">
            Commencez par créer votre première boutique
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-primary inline-flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Créer une boutique</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {boutiques?.results?.map((boutique) => (
            <div key={boutique.id} className="card hover:shadow-md transition-shadow">
              {/* Image/Logo */}
              <div className="mb-4">
                {boutique.logo ? (
                  <img
                    src={boutique.logo}
                    alt={boutique.nom}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg flex items-center justify-center">
                    <Store className="w-16 h-16 text-primary-600" />
                  </div>
                )}
              </div>

              {/* Informations */}
              <div className="space-y-3">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {boutique.nom}
                  </h3>
                  <span
                    className={`inline-block px-2 py-1 text-xs font-medium rounded-full mt-1 ${
                      boutique.type_boutique === 'physique'
                        ? 'bg-blue-100 text-blue-700'
                        : boutique.type_boutique === 'en_ligne'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-purple-100 text-purple-700'
                    }`}
                  >
                    {boutique.type_boutique === 'physique'
                      ? 'Physique'
                      : boutique.type_boutique === 'en_ligne'
                      ? 'En ligne'
                      : 'Hybride'}
                  </span>
                </div>

                <div className="flex items-start space-x-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{boutique.adresse}</span>
                </div>

                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4 flex-shrink-0" />
                  <span>{boutique.telephone}</span>
                </div>

                <div className="pt-3 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium text-gray-900">
                      {boutique.nombre_produits}
                    </span>{' '}
                    produits
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2 mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleEdit(boutique)}
                  className="flex-1 btn-secondary flex items-center justify-center space-x-2"
                >
                  <Edit className="w-4 h-4" />
                  <span>Modifier</span>
                </button>
                <button
                  onClick={() => handleDelete(boutique.id)}
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
        <BoutiqueModal
          boutique={selectedBoutique}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default Boutiques;