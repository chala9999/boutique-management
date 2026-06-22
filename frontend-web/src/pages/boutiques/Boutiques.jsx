import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { boutiquesAPI } from '../../api/boutiques';
import { Plus, Edit, Store, MapPin, Phone, Search, Filter, Ban, CheckCircle, Eye } from 'lucide-react';
import BoutiqueModal from '../../components/boutiques/BoutiqueModal';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { usePermissions } from '../../hooks/usePermissions';

const Boutiques = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBoutique, setSelectedBoutique] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('tous');
  const [statutFilter, setStatutFilter] = useState('tous');
  const { can } = usePermissions();
  
  // ✅ État pour le modal de confirmation
  const [confirmModal, setConfirmModal] = useState({ 
    isOpen: false, 
    boutiqueId: null, 
    nom: '', 
    action: '' 
  });

  const { data: boutiquesData, isLoading } = useQuery({
    queryKey: ['boutiques'],
    queryFn: () => boutiquesAPI.getAll(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => boutiquesAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['boutiques']);
    },
    onError: (error) => {
      alert(error.response?.data?.error || 'Erreur lors de la suppression');
    },
  });

  // ✅ Mutation pour activer/désactiver
  const toggleActiveMutation = useMutation({
    mutationFn: (id) => boutiquesAPI.toggleActive(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['boutiques']);
    },
    onError: (error) => {
      alert(error.response?.data?.error || 'Erreur lors du changement de statut');
    },
  });

  const filtrerBoutiques = () => {
    let boutiques = boutiquesData?.results || [];
    if (searchTerm) {
      boutiques = boutiques.filter(b => 
        b.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.adresse.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.telephone.includes(searchTerm)
      );
    }
    if (typeFilter !== 'tous') {
      boutiques = boutiques.filter(b => b.type_boutique === typeFilter);
    }
    if (statutFilter !== 'tous') {
      boutiques = boutiques.filter(b => b.is_active === (statutFilter === 'actif'));
    }
    return boutiques;
  };

  const boutiquesFiltrees = filtrerBoutiques();

 const handleEdit = async (boutique) => {
  try {
    // Récupérer les détails complets via l'API
    const boutiqueComplete = await boutiquesAPI.getById(boutique.id);
    setSelectedBoutique(boutiqueComplete);
    setIsModalOpen(true);
  } catch (error) {
    alert('Erreur lors de la récupération des détails de la boutique');
  }
};

  // ✅ Suppression uniquement si la boutique n'a pas de produits
  const handleDelete = (id, nom) => {
    // Vérifier si la boutique a des produits (à implémenter côté backend)
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer la boutique "${nom}" ?\n\nCette action est irréversible.`)) {
      deleteMutation.mutate(id);
    }
  };

  // ✅ Activer/Désactiver avec modal
  const handleToggleActive = (id, nom, action) => {
    setConfirmModal({
      isOpen: true,
      boutiqueId: id,
      nom: nom,
      action: action // 'activer' ou 'desactiver'
    });
  };

  const confirmToggle = () => {
    toggleActiveMutation.mutate(confirmModal.boutiqueId);
    setConfirmModal({ isOpen: false, boutiqueId: null, nom: '', action: '' });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedBoutique(null);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setTypeFilter('tous');
    setStatutFilter('tous');
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Boutiques</h1>
          <p className="text-gray-600 mt-1">Gérez vos boutiques physiques et en ligne</p>
        </div>
        {/* ✅ Seulement admin */}
        {can.createBoutique && (
          <button onClick={() => setIsModalOpen(true)} className="btn-primary flex items-center justify-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>Nouvelle Boutique</span>
          </button>
        )}
      </div>

      {/* Barre de filtres */}
      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Recherche */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par nom, adresse ou téléphone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-9 w-full"
              />
            </div>
          </div>
          
          {/* Filtre type */}
          <div className="w-full md:w-48">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="input"
            >
              <option value="tous">Tous les types</option>
              <option value="physique">Physique</option>
              <option value="en_ligne">En ligne</option>
              <option value="hybride">Hybride</option>
            </select>
          </div>
          
          {/* Filtre statut */}
          <div className="w-full md:w-48">
            <select
              value={statutFilter}
              onChange={(e) => setStatutFilter(e.target.value)}
              className="input"
            >
              <option value="tous">Tous les statuts</option>
              <option value="actif">Actif</option>
              <option value="inactif">Inactif</option>
            </select>
          </div>
          
          {/* Bouton reset */}
          {(searchTerm || typeFilter !== 'tous' || statutFilter !== 'tous') && (
            <button
              onClick={resetFilters}
              className="btn-secondary whitespace-nowrap"
            >
              Réinitialiser
            </button>
          )}
        </div>
      </div>

      {/* Nombre de résultats */}
      <div className="text-sm text-gray-600">
        {boutiquesFiltrees.length} boutique(s) trouvée(s)
      </div>

      {/* Liste des boutiques */}
      {boutiquesFiltrees.length === 0 ? (
        <div className="card text-center py-12">
          <Store className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune boutique</h3>
          <p className="text-gray-600 mb-4">Commencez par créer votre première boutique</p>
          {can.createBoutique && (
            <button onClick={() => setIsModalOpen(true)} className="btn-primary inline-flex items-center space-x-2">
              <Plus className="w-5 h-5" />
              <span>Créer une boutique</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {boutiquesFiltrees.map((boutique) => (
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

              {/* Badge statut */}
              <div className="flex justify-end -mt-12 mb-2 relative z-10">
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    boutique.is_active
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {boutique.is_active ? 'Actif' : 'Inactif'}
                </span>
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
                      {boutique.nombre_produits || 0}
                    </span>{' '}
                    produits
                  </p>
                </div>
              </div>

              {/* ✅ Actions */}
              {can.editBoutique && (
                <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleEdit(boutique)}
                    className="btn-secondary flex items-center justify-center space-x-2"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Modifier</span>
                  </button>
                  {can.toggleBoutique && (
                    <button
                      onClick={() => handleToggleActive(boutique.id, boutique.nom, boutique.is_active ? 'desactiver' : 'activer')}
                      className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                        boutique.is_active ? 'bg-orange-100 text-orange-600 hover:bg-orange-200' : 'bg-green-100 text-green-600 hover:bg-green-200'
                      }`}
                    >
                      {boutique.is_active ? <><Ban className="w-4 h-4" /><span>Désactiver</span></> : <><CheckCircle className="w-4 h-4" /><span>Activer</span></>}
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal confirmation */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, boutiqueId: null, nom: '', action: '' })}
        onConfirm={confirmToggle}
        title={`${confirmModal.action === 'activer' ? 'Activer' : 'Désactiver'} la boutique`}
        message={`Êtes-vous sûr de vouloir ${confirmModal.action} la boutique "${confirmModal.nom}" ?`}
        confirmText={confirmModal.action === 'activer' ? 'Activer' : 'Désactiver'}
        confirmVariant={confirmModal.action === 'activer' ? 'primary' : 'warning'}
      />

      {/* Modal boutique */}
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